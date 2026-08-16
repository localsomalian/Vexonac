import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../lib/trpc";

const playerDetectionsSchema = z.object({
  serverId: z.string(),
  playerLicense: z.string(),
  limit: z.number().min(1).max(100).default(50),
});

export const getPlayerDetections = protectedProcedure
  .input(playerDetectionsSchema)
  .query(async ({ ctx, input }) => {
    const { serverId, playerLicense, limit } = input;
    const userId = ctx.session.user.discordId;

    const server = await ctx.db.license.findUnique({
      where: { id: serverId },
      select: { id: true, discordId: true, members: { where: { discordId: userId }, select: { permissions: true } } },
    });
    if (!server || (server.discordId !== userId && server.members.length === 0)) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Server not found" });
    }

    const detections = await ctx.db.serverLog.findMany({
      where: { licenseId: serverId, serverType: "DETECTION", playerLicense },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return detections.map((d) => {
      const det = d.details as any;
      const evidence = det.evidence ?? {};
      return {
        id: d.id,
        code: det.code ?? "",
        severity: det.severity ?? "LOW",
        pts: det.pts ?? 0,
        evidence,
        screenshotUrl: (evidence.screenshotUrl as string | undefined) ?? null,
        createdAt: d.createdAt,
      };
    });
  });

const schema = z.object({
  serverId: z.string(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(25),
  search: z.string().optional(),
  code: z.string().optional(),
  severity: z.string().optional(),
});

const statsSchema = z.object({
  serverId: z.string(),
  days: z.number().min(1).max(30).default(7),
});

export const getDetections = protectedProcedure
  .input(schema)
  .query(async ({ ctx, input }) => {
    const { serverId, page, limit, search, code, severity } = input;
    const userId = ctx.session.user.discordId;

    const server = await ctx.db.license.findUnique({
      where: { id: serverId },
      select: {
        id: true,
        discordId: true,
        serverName: true,
        members: {
          where: { discordId: userId },
          select: { permissions: true },
        },
      },
    });

    if (!server || (server.discordId !== userId && server.members.length === 0)) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Server not found" });
    }

    const where: any = {
      licenseId: serverId,
      serverType: "DETECTION",
    };

    if (search) {
      where.OR = [
        { details: { path: ["playerName"], string_contains: search } },
        { details: { path: ["code"], string_contains: search } },
        { playerLicense: { contains: search } },
      ];
    }

    if (code) {
      where.details = { ...where.details, path: ["code"], equals: code };
    }

    const skip = (page - 1) * limit;

    const baseWhere = { licenseId: serverId, serverType: "DETECTION" as const };

    const [detections, total, severityRows] = await Promise.all([
      ctx.db.serverLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      ctx.db.serverLog.count({ where }),
      ctx.db.$queryRaw<Array<{ severity: string; count: bigint }>>`
        SELECT details->>'severity' AS severity, COUNT(*)::bigint AS count
        FROM server_logs
        WHERE "licenseId" = ${serverId} AND "serverType" = 'DETECTION'
        GROUP BY details->>'severity'
      `,
    ]);

    const severityCounts: Record<string, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    for (const row of severityRows) {
      if (row.severity && severityCounts[row.severity] !== undefined) {
        severityCounts[row.severity] = Number(row.count);
      }
    }

    // Build detection count map per playerLicense
    const scoreMap: Record<string, number> = {};
    for (const d of detections) {
      if (d.playerLicense) {
        scoreMap[d.playerLicense] = (scoreMap[d.playerLicense] ?? 0) + 1;
      }
    }

    return {
      detections: detections.map((d) => {
        const det = d.details as any;
        const evidence = det.evidence ?? {};
        return {
          id: d.id,
          playerName: det.playerName ?? "Unknown",
          playerLicense: d.playerLicense ?? "",
          code: det.code ?? "",
          severity: det.severity ?? "LOW",
          pts: det.pts ?? 0,
          totalScore: det.totalScore ?? 0,
          detectionCount: scoreMap[d.playerLicense ?? ""] ?? 0,
          evidence,
          screenshotUrl: (evidence.screenshotUrl as string | undefined) ?? null,
          identifiers: det.identifiers ?? [],
          createdAt: d.createdAt,
        };
      }),
      severityCounts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  });

export const getDetectionStats = protectedProcedure
  .input(statsSchema)
  .query(async ({ ctx, input }) => {
    const { serverId, days } = input;
    const userId = ctx.session.user.discordId;

    const server = await ctx.db.license.findUnique({
      where: { id: serverId },
      select: { id: true, discordId: true, members: { where: { discordId: userId }, select: { permissions: true } } },
    });
    if (!server || (server.discordId !== userId && server.members.length === 0)) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Server not found" });
    }

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [codeRows, topOffenders, hourlyRows] = await Promise.all([
      // Breakdown by detection code
      ctx.db.$queryRaw<Array<{ code: string; count: bigint }>>`
        SELECT details->>'code' AS code, COUNT(*)::bigint AS count
        FROM server_logs
        WHERE "licenseId" = ${serverId}
          AND "serverType" = 'DETECTION'
          AND "createdAt" >= ${since}
        GROUP BY details->>'code'
        ORDER BY count DESC
        LIMIT 15
      `,
      // Top offenders (most detections in period)
      ctx.db.$queryRaw<Array<{ playerLicense: string; playerName: string; count: bigint; lastSeen: Date }>>`
        SELECT
          "playerLicense",
          details->>'playerName' AS "playerName",
          COUNT(*)::bigint AS count,
          MAX("createdAt") AS "lastSeen"
        FROM server_logs
        WHERE "licenseId" = ${serverId}
          AND "serverType" = 'DETECTION'
          AND "createdAt" >= ${since}
          AND "playerLicense" IS NOT NULL
        GROUP BY "playerLicense", details->>'playerName'
        ORDER BY count DESC
        LIMIT 10
      `,
      // Hourly trend for last 24h
      ctx.db.$queryRaw<Array<{ hour: string; count: bigint }>>`
        SELECT
          TO_CHAR(DATE_TRUNC('hour', "createdAt"), 'HH24:MI') AS hour,
          COUNT(*)::bigint AS count
        FROM server_logs
        WHERE "licenseId" = ${serverId}
          AND "serverType" = 'DETECTION'
          AND "createdAt" >= NOW() - INTERVAL '24 hours'
        GROUP BY DATE_TRUNC('hour', "createdAt")
        ORDER BY DATE_TRUNC('hour', "createdAt") ASC
      `,
    ]);

    return {
      codeBreakdown: codeRows.map(r => ({ code: r.code, count: Number(r.count) })),
      topOffenders: topOffenders.map(r => ({
        playerLicense: r.playerLicense,
        playerName: r.playerName ?? "Unknown",
        count: Number(r.count),
        lastSeen: r.lastSeen,
      })),
      hourlyTrend: hourlyRows.map(r => ({ hour: r.hour, count: Number(r.count) })),
    };
  });
