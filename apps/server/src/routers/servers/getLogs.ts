import { z } from "zod";
import { protectedProcedure } from "../../lib/trpc";
import { Permission, ServerLogType, SystemLogType } from "@vexonac/database";
import { isDemoServer, getDemoLogs, getDemoLogsAnalytics } from "../../lib/demo-data";
import { TRPCError } from "@trpc/server";
import { subDays, startOfDay, endOfDay, format, subHours, startOfHour, endOfHour } from "date-fns";
import { hasPermission } from "@/lib/utils";

const getLogsSchema = z.object({
  serverId: z.string(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  search: z.string().optional(),
  systemTypes: z.array(z.nativeEnum(SystemLogType)).optional(),
  serverTypes: z.array(z.nativeEnum(ServerLogType)).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

const getLogsAnalyticsSchema = z.object({
  serverId: z.string(),
  timeRange: z.enum(["today", "week", "month"]).default("today"),
});

export const getLogs = protectedProcedure
  .input(getLogsSchema)
  .query(async ({ ctx, input }) => {
    const { serverId, page, limit, search, systemTypes, serverTypes, dateFrom, dateTo } = input;
    const userId = ctx.session.user.discordId;

    // Handle demo server
    if (isDemoServer(serverId)) {
      return getDemoLogs(page, limit, search, systemTypes, serverTypes, dateFrom, dateTo);
    }

    // Check if user has access to this server
    const server = await ctx.db.license.findUnique({
      where: {
        id: serverId,
      },
      select: {
        id: true,
        discordId: true,
        members: {
          where: {
            discordId: userId,
          },
          select: {
            permissions: true,
          },
        },
      },
    });

    if (!server) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Server not found or access denied",
      });
    }

    const isOwner = server.discordId === userId;
    const member = server.members[0];
    const hasViewLogsPermission = hasPermission(
      member?.permissions || [],
      "VIEW_LOGS"
    );

    if (!isOwner && !hasViewLogsPermission) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have permission to view bans for this server",
      });
    }

    // Build where conditions
    const whereConditions: any = {
      licenseId: serverId,
    };

    // Add type filters
    if (systemTypes?.length || serverTypes?.length) {
      whereConditions.OR = [];
      if (systemTypes?.length) {
        whereConditions.OR.push({
          systemType: { in: systemTypes }
        });
      }
      if (serverTypes?.length) {
        whereConditions.OR.push({
          serverType: { in: serverTypes }
        });
      }
    }

    // Add date filters
    if (dateFrom || dateTo) {
      whereConditions.createdAt = {};
      if (dateFrom) {
        whereConditions.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        whereConditions.createdAt.lte = new Date(dateTo);
      }
    }

    // Add search filter
    if (search) {
      whereConditions.OR = whereConditions.OR || [];
      whereConditions.OR.push(
        { playerId: { contains: search, mode: 'insensitive' } },
        { playerLicense: { contains: search, mode: 'insensitive' } },
        { memberId: { contains: search, mode: 'insensitive' } }
      );
    }

    // Get total count
    const totalCount = await ctx.db.serverLog.count({
      where: whereConditions
    });

    // Get logs with pagination
    const logs = await ctx.db.serverLog.findMany({
      where: whereConditions,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        license: {
          select: {
            serverName: true
          }
        }
      }
    });

    // Fetch player names for logs that have playerLicense
    const playerLicenses = logs
      .filter(log => log.playerLicense)
      .map(log => log.playerLicense!);

    const players = await ctx.db.player.findMany({
      where: {
        playerLicense: { in: playerLicenses },
        licenseId: serverId
      },
      select: {
        playerLicense: true,
        playerName: true
      }
    });

    const playerMap = new Map(players.map(p => [p.playerLicense, p.playerName]));

    // Add player names to logs
    const logsWithPlayerNames = logs.map(log => ({
      ...log,
      playerName: log.playerLicense ? (log.playerId ? `[${log.playerId}] ${playerMap.get(log.playerLicense)}` : playerMap.get(log.playerLicense)) : undefined
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return {
      logs: logsWithPlayerNames,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      }
    };
  });

export const getLogsAnalytics = protectedProcedure
  .input(getLogsAnalyticsSchema)
  .query(async ({ ctx, input }) => {
    const { serverId, timeRange } = input;
    const userId = ctx.session.user.discordId;

    // Handle demo server
    if (isDemoServer(serverId)) {
      return getDemoLogsAnalytics(timeRange);
    }

    // Check if user has access to this server
    const server = await ctx.db.license.findUnique({
      where: {
        id: serverId,
      },
      select: {
        id: true,
        discordId: true,
        members: {
          where: {
            discordId: userId,
          },
          select: {
            permissions: true,
          },
        },
      },
    });

    if (!server) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Server not found or access denied",
      });
    }

    const isOwner = server.discordId === userId;
    const member = server.members[0];
    const hasViewLogsPermission = hasPermission(
      member?.permissions || [],
      "VIEW_LOGS"
    );

    if (!isOwner && !hasViewLogsPermission) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have permission to view bans for this server",
      });
    }

    const now = new Date();
    let intervals: Array<{ start: Date; end: Date; label: string }> = [];

    switch (timeRange) {
      case "today":
        // Create 24 hour intervals (00:00-00:59, 01:00-01:59, etc.)
        for (let i = 0; i < 24; i++) {
          const start = startOfHour(subHours(now, 23 - i));
          const end = endOfHour(start);
          intervals.push({
            start,
            end,
            label: format(start, "HH:mm")
          });
        }
        break;
      case "week":
        // Create 7 day intervals (Monday to Sunday of current week)
        for (let i = 0; i < 7; i++) {
          const start = startOfDay(subDays(now, 6 - i));
          const end = endOfDay(start);
          intervals.push({
            start,
            end,
            label: format(start, "EEE")
          });
        }
        break;
      case "month":
        // Create 4 week intervals
        for (let i = 0; i < 4; i++) {
          const start = startOfDay(subDays(now, (3 - i) * 7));
          const end = endOfDay(subDays(start, -6));
          intervals.push({
            start,
            end,
            label: `Week ${i + 1}`
          });
        }
        break;
    }

    // Fetch logs for all intervals
    const analyticsData = await Promise.all(
      intervals.map(async (interval) => {
        const systemLogs = await (ctx.db.serverLog.groupBy as any)({
          by: ['systemType'],
          where: {
            licenseId: serverId,
            systemType: { not: null },
            createdAt: {
              gte: interval.start,
              lte: interval.end,
            }
          },
          _count: true,
        });

        const serverLogs = await (ctx.db.serverLog.groupBy as any)({
          by: ['serverType'],
          where: {
            licenseId: serverId,
            serverType: { not: null },
            createdAt: {
              gte: interval.start,
              lte: interval.end,
            }
          },
          _count: true,
        });

        const systemLogCounts: Record<string, number> = {};
        const serverLogCounts: Record<string, number> = {};

        // Initialize all types with 0
        Object.values(SystemLogType).forEach((type: SystemLogType) => systemLogCounts[type] = 0);
        Object.values(ServerLogType).forEach((type: ServerLogType) => serverLogCounts[type] = 0);

        // Fill in actual counts
        systemLogs.forEach((log: any) => {
          if (log.systemType) {
            systemLogCounts[log.systemType] = log._count;
          }
        });

        serverLogs.forEach((log: any) => {
          if (log.serverType) {
            serverLogCounts[log.serverType] = log._count;
          }
        });

        const totalLogs = Object.values(systemLogCounts).reduce((sum, count) => sum + count, 0) +
                         Object.values(serverLogCounts).reduce((sum, count) => sum + count, 0);

        // Create flat structure for chart compatibility
        const chartDataPoint: any = {
          time: interval.label,
          date: interval.start.toISOString(),
          totalLogs,
        };

        // Add server log counts as direct properties for the chart
        Object.entries(serverLogCounts).forEach(([type, count]) => {
          chartDataPoint[type] = count;
        });

        return chartDataPoint;
      })
    );

    return {
      chartData: analyticsData,
      totalLogs: analyticsData.reduce((sum, data) => sum + data.totalLogs, 0),
    };
  }); 
