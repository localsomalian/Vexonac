import { Router } from "express";
import { apiKeyAuth } from "../../middleware/api-auth.middleware";
import prisma from "../../../prisma";
import { APITier } from "@vexonac/database/prisma/generated/client/client";
import { Prisma } from "@vexonac/database/prisma/generated/client/client";

const router = Router();

// Apply authentication middleware
router.use(apiKeyAuth as any);

// GET /v1/bans/recent
router.get("/recent", async (req, res: any) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 100);
    
    const bans = await prisma.banHistory.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        license: {
          select: {
            serverName: true
          }
        },
        player: {
          select: {
            playerName: true,
            playTime: true,
            identifiers: true,
          }
        },
      }
    });

    return res.status(200).json({
      data: bans.map(ban => ({
        player: ban.player.playerName,
        reason: ban.reason,
        details: ban.details,
        evidence: ban.evidenceUrl,
        server: ban.license.serverName,
        bannedAt: ban.createdAt,
        identifiers: req.apiPlanConfig?.canSeeIdentifiers
          ? (ban.player.identifiers ?? [])
          : [],
      })),
      meta: {
        count: bans.length,
        limit
      }
    });
  } catch (error) {
    console.error("Bans Recent Error:", error);
    return res.status(500).json({ error: "Internal server error", code: "INTERNAL_ERROR" });
  }
});

// GET /v1/bans/search
router.get("/search", async (req, res: any) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const skip = (page - 1) * limit;
    const reason = req.query.reason as string;
    const playerName = req.query.playerName as string;

    const where: Prisma.BanWhereInput = {};
    
    if (reason) {
      where.reason = {
        contains: reason,
        mode: 'insensitive'
      };
    }

    if (playerName) {
      where.player = {
        playerName: {
          contains: playerName,
          mode: 'insensitive'
        }
      };
    }

    const [bans, total] = await Promise.all([
      prisma.ban.findMany({
        where,
        take: limit,
        skip,
        orderBy: {
          bannedAt: 'desc'
        },
        include: {
          player: {
            select: {
              playerName: true,
              identifiers: true,
            }
          },
          license: {
            select: {
              serverName: true
            }
          },
          identifiers: {
            select: { value: true }
          },
        }
      }),
      prisma.ban.count({ where })
    ]);

    return res.status(200).json({
      data: bans.map(ban => ({
        id: ban.banId,
        player: ban.player.playerName,
        server: ban.license.serverName,
        reason: ban.reason,
        details: ban.details,
        evidence: ban.evidenceUrl,
        bannedAt: ban.bannedAt,
        identifiers: req.apiPlanConfig?.canSeeIdentifiers
          ? ban.identifiers.map((i: { value: string }) => i.value)
          : [],
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Bans Search Error:", error);
    return res.status(500).json({ error: "Internal server error", code: "INTERNAL_ERROR" });
  }
});

// GET /v1/bans/stats
router.get("/stats", async (req, res: any) => {
  try {
    const reason = req.query.reason as string;
    const now = new Date();
    
    // Use 'any' to bypass the strict type check on where input union, 
    // as our object structure is valid for both Ban and BanHistory inputs in this context.
    const where: any = {};
    if (reason) {
        where.reason = {
            contains: reason,
            mode: 'insensitive'
        };
    }

    const [last24hActive, last7dActive, last30dActive, totalActive] = await Promise.all([
        prisma.ban.count({
            where: {
                ...where,
                bannedAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
            }
        }),
        prisma.ban.count({
            where: {
                ...where,
                bannedAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
            }
        }),
        prisma.ban.count({
            where: {
                ...where,
                bannedAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
            }
        }),
        prisma.ban.count({ where })
    ]);

    const [last24hIssued, last7dIssued, last30dIssued, totalIssued] = await Promise.all([
        prisma.banHistory.count({
            where: {
                createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
            }
        }),
        prisma.banHistory.count({
            where: {
                createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
            }
        }),
        prisma.banHistory.count({
            where: {
                createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
            }
        }),
        prisma.banHistory.count({ where })
    ]);

    return res.status(200).json({
      filter: {
        reason: reason || null
      },
      stats: {
        active: {
            last24h: last24hActive,
            last7d: last7dActive,
            last30d: last30dActive,
            total: totalActive
        },
        issued: {
            last24h: last24hIssued,
            last7d: last7dIssued,
            last30d: last30dIssued,
            total: totalIssued
        }
      }
    });
  } catch (error) {
    console.error("Bans Stats Error:", error);
    return res.status(500).json({ error: "Internal server error", code: "INTERNAL_ERROR" });
  }
});

// GET /v1/bans/trends
router.get("/trends", async (req, res: any) => {
  try {
    const window = (req.query.window as string) || "24h";
    let since = new Date();
    
    switch(window) {
        case "7d": since.setDate(since.getDate() - 7); break;
        case "30d": since.setDate(since.getDate() - 30); break;
        case "24h": 
        default: since.setTime(since.getTime() - 24 * 60 * 60 * 1000); break;
    }

    // Group by reason
    const trends = await (prisma.ban as any).groupBy({
        by: ['reason'],
        where: {
            bannedAt: { gte: since },
            reason: { not: null }
        },
        _count: {
            reason: true
        },
        orderBy: {
            _count: {
                reason: 'desc'
            }
        },
        take: 10
    });
    
    const cleanTrends = trends
        .filter((t: any) => t.reason !== null)
        .map((t: any) => ({
            reason: t.reason as string,
            count: t._count.reason
        }));

    return res.status(200).json({
      window,
      since: since.toISOString(),
      trends: cleanTrends
    });
  } catch (error) {
    console.error("Bans Trends Error:", error);
    return res.status(500).json({ error: "Internal server error", code: "INTERNAL_ERROR" });
  }
});

export default router;



