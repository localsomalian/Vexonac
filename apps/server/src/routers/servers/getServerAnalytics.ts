import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../lib/trpc";
import { isDemoServer, getDemoAnalytics, serverIdSchema } from "../../lib/demo-data";

// Define the input schema for time range
const analyticsInputSchema = z.object({
  serverId: serverIdSchema,
  timeRange: z.enum(["today", "week", "month"]),
});

export const getServerAnalytics = protectedProcedure
  .input(analyticsInputSchema)
  .query(async ({ ctx, input }) => {
    const userId = ctx.session.user.discordId;
    const { serverId, timeRange } = input;

    // Check if this is a demo server request
    if (isDemoServer(serverId)) {
      return getDemoAnalytics(timeRange);
    }

    try {
      // First, check if user has access to this server
      const license = await ctx.db.license.findUnique({
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
              discordId: true,
            },
          },
        },
      });

      if (!license) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Server not found",
        });
      }

      const isOwner = license.discordId === userId;
      const isMember = !isOwner && license.members.length > 0;

      if (!isOwner && !isMember) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this server",
        });
      }

      // Calculate date ranges based on time range
      const now = new Date();
      let startDate: Date;
      let groupByHours: number;

      switch (timeRange) {
        case "today":
          // Last 24 hours, grouped by hour
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          groupByHours = 1;
          break;
        case "week":
          // Last 7 days, grouped by 6 hours
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          groupByHours = 6;
          break;
        case "month":
          // Last 30 days, grouped by 24 hours (daily)
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          groupByHours = 24;
          break;
        default:
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid time range",
          });
      }

      // Fetch server metrics for the specified time range
      const metrics = await ctx.db.serverMetrics.findMany({
        where: {
          licenseId: serverId,
          timestamp: {
            gte: startDate,
          },
        },
        orderBy: {
          timestamp: "asc",
        },
      });

      // Group metrics by the specified time intervals
      const groupedData: Record<
        string,
        {
          timestamp: Date;
          players: number;
          bans: number;
          allPlayerCounts: number[]; // Store all player counts for this time group
        }
      > = {};

      for (const metric of metrics) {
        // Round timestamp to the group interval
        const groupTimestamp = new Date(metric.timestamp);
        const hours = groupTimestamp.getHours();
        const roundedHours = Math.floor(hours / groupByHours) * groupByHours;
        groupTimestamp.setHours(roundedHours, 0, 0, 0);

        const key = groupTimestamp.toISOString();

        if (!groupedData[key]) {
          groupedData[key] = {
            timestamp: groupTimestamp,
            players: metric.playerCount,
            bans: metric.banCount,
            allPlayerCounts: [metric.playerCount],
          };
        } else {
          // Aggregate data for the same time group
          groupedData[key].players = metric.playerCount; // Use latest value
          groupedData[key].bans = metric.banCount; // Use latest value
          groupedData[key].allPlayerCounts.push(metric.playerCount);
        }
      }

      // Convert to array and sort by timestamp
      const chartData = Object.values(groupedData)
        .map((data) => ({
          date: data.timestamp.toISOString(),
          players: data.players,
          bans: data.bans,
        }))
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

      // Calculate peak and average players dynamically from all metrics in the time range
      const allPlayerCounts = metrics.map((m) => m.playerCount);
      const peakPlayers =
        allPlayerCounts.length > 0 ? Math.max(...allPlayerCounts) : 0;
      const avgPlayers =
        allPlayerCounts.length > 0
          ? Math.round(
              allPlayerCounts.reduce((sum, count) => sum + count, 0) /
                allPlayerCounts.length
            )
          : 0;

      return {
        chartData,
        peakPlayers,
        avgPlayers,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error fetching server analytics",
      });
    }
  });
