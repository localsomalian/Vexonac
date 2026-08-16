import { Router } from "express";
import { apiKeyAuth } from "../../middleware/api-auth.middleware";
import prisma from "../../../prisma";
import { Prisma, PrismaClient, type Player } from "@vexonac/database/prisma/generated/client/client";
import { 
    calculateTrustScore, 
    filterIdentifiers, 
    findAltAccounts, 
    findCrossServerBans,
    performPlayerAnalysis
} from "@vexonac/utils"; 

const router = Router();

router.use(apiKeyAuth as any);

// Helper to find player by "any_identifier"
// Identifiers can be: steam:..., license:..., ip:..., discord:..., or just a database ID (UUID)
// or a player name (fuzzy search? risky for exact lookup). 
// API spec says "any_identifier". Typically means a unique string ID.
async function findPlayerByIdentifier(identifier: string) {
    // 1. Try to find by ID (UUID)
    // UUID regex
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(identifier)) {
        const player = await prisma.player.findUnique({
            where: { id: identifier },
            include: {
                license: {
                    select: {
                        serverName: true
                    }
                }
            }
        });
        if (player) return player;
    }

    // 2. Try to find by specific identifier (license, steam, etc)
    // We search in the identifiers array field using `array_contains` or equivalent.
    // Prisma doesn't support `array_contains` directly on JSON arrays easily in `findFirst` without raw query sometimes,
    // but `array_contains` works for string arrays. `identifiers` is JSON.
    // However, based on previous code, we often use `findFirst` with `OR` conditions.
    // A robust way is to search where identifiers JSON contains the value.
    // Postgres JSONB allows @> operator.
    
    // Note: Since a player can have multiple profiles (one per server), "Global Lookup" implies aggregating or finding the "main" profile?
    // Or finding ALL profiles matching this identifier?
    // The API seems to imply a single "player" entity.
    // In VexonAC structure, `Player` is scoped to `License` (server).
    // So a single "steam:123" user might have 10 `Player` records across 10 servers.
    // "Global Lookup" usually means we return aggregated data or the most recent profile.
    // Let's find the most recent profile (lastJoin) to use as the "primary" reference for name/etc.
    
    const players = await prisma.player.findMany({
        where: {
            OR: [
                { playerLicense: identifier },
                {
                    identifiers: {
                        array_contains: identifier
                    }
                },
                {
                    oldIdentifiers: {
                        array_contains: identifier
                    }
                }
            ]
        },
        orderBy: {
            lastJoin: 'desc'
        },
        include: {
            license: {
                select: {
                    serverName: true
                }
            }
        }
    });

    if (players.length > 0) {
        // We return the most recent one, but we might need the list of all IDs for aggregation
        // Let's return the list of matching player records to the caller so they can aggregate.
        return players;
    }

    return null;
}

// GET /v1/player/search
router.get("/search", async (req, res: any) => {
    try {
        const name = req.query.name as string;
        const limit = Math.max(Number(req.query.limit) || 10, 10);
        const page = Math.max(Number(req.query.page) || 1, 1);
        const skip = (page - 1) * limit;

        if (!name || name.length < 3) {
            return res.status(400).json({ error: "Name query must be at least 3 characters", code: "INVALID_QUERY" });
        }

        // Search unique player names across all servers
        // We use groupBy to get unique names and their most recent appearance
        const results = await prisma.player.findMany({
            where: {
                playerName: {
                    contains: name,
                    mode: 'insensitive'
                }
            },
            distinct: ['playerName'],
            take: limit,
            skip,
            orderBy: {
                lastJoin: 'desc'
            },
            select: {
                id: true,
                playerName: true,
                playerLicense: true,
                license: {
                    select: {
                        serverName: true
                    }
                },
                lastJoin: true,
                playTime: true
            }
        });

        return res.status(200).json({
            results: results.map(p => ({
                id: p.id,
                name: p.playerName,
                license: p.playerLicense,
                server: p.license.serverName,
                lastSeen: p.lastJoin,
                playTime: p.playTime
            }))
        });

    } catch (error) {
        console.error("Player Search Error:", error);
        return res.status(500).json({ error: "Internal server error", code: "INTERNAL_ERROR" });
    }
});

// GET /v1/player/:identifier
router.get("/:identifier", async (req, res: any) => {
    try {
        const { identifier } = req.params;
        const players = await findPlayerByIdentifier(identifier);

        if (!players || (Array.isArray(players) && players.length === 0)) {
            return res.status(404).json({ error: "Player not found", code: "NOT_FOUND" });
        }

        // Aggregate data across all server profiles
        const playerList = Array.isArray(players) ? players : [players];
        const mainProfile = playerList[0] // Most recent

        // Calculate aggregated stats
        const totalPlayTime = playerList.reduce((acc, p) => acc + p.playTime, 0);
        const serverCount = new Set(playerList.map(p => p.licenseId)).size;
        
        // Check global bans
        // We check if any of their identifiers are in the active bans table
        // Collect all unique identifiers from all profiles
        const allIdentifiers = await getAllIdentifiersFromPlayerList(playerList);
        
        const activeBansCount = await prisma.ban.count({
            where: {
                identifiers: {
                    some: {
                        value: { in: Array.from(allIdentifiers) }
                    }
                }
            }
        });

        const playerIds = playerList.map(p => p.id);
        const totalBansCount = await prisma.banHistory.count({
            where: {
                playerId: { in: playerIds }
            },
        })
        
        return res.status(200).json({
            name: mainProfile.playerName,
            license: mainProfile.playerLicense,
            stats: {
                globalPlayTime: totalPlayTime, // minutes
                serversVisited: serverCount,
                firstSeen: playerList[playerList.length - 1].firstJoin,
                lastSeen: mainProfile.lastJoin,
                lastServerJoined: mainProfile.license.serverName
            },
            bans: {
                activeBans: activeBansCount,
                totalBans: totalBansCount,
            },
            identifiers: req.apiPlanConfig?.canSeeIdentifiers ? Array.from(allIdentifiers) : [],
        });

    } catch (error) {
        console.error("Player Summary Error:", error);
        return res.status(500).json({ error: "Internal server error", code: "INTERNAL_ERROR" });
    }
});

// GET /v1/player/:identifier/servers
router.get("/:identifier/servers", async (req, res: any) => {
    try {
        const { identifier } = req.params;
        const players = await findPlayerByIdentifier(identifier);

        if (!players || (Array.isArray(players) && players.length === 0)) {
            return res.status(404).json({ error: "Player not found", code: "NOT_FOUND" });
        }
        const playerList = Array.isArray(players) ? players : [players];

        const servers = playerList.map(p => ({
            id: p.licenseId,
            name: p.license.serverName,
            firstJoin: p.firstJoin,
            lastJoin: p.lastJoin,
            playTime: p.playTime
        }));

        return res.status(200).json({ servers });

    } catch (error) {
        console.error("Player Servers Error:", error);
        return res.status(500).json({ error: "Internal server error", code: "INTERNAL_ERROR" });
    }
});


const getAllIdentifiersFromPlayerList = async (playerList: Player[]) => {
    const allIdentifiers = new Set<string>();
    playerList.forEach(p => {
        if (Array.isArray(p.identifiers)) {
            p.identifiers.forEach((id: any) => allIdentifiers.add(id));
        }
        if (Array.isArray(p.oldIdentifiers)) {
            p.oldIdentifiers.forEach((id: any) => allIdentifiers.add(id));
        }
    });

    const filteredIdentifiers = Array.from(allIdentifiers).filter(id => !id.startsWith("ip:") && !id.startsWith("fid:") && !id.startsWith("sid2:"));
    return filteredIdentifiers;
}

// GET /v1/player/:identifier/bans
router.get("/:identifier/bans", async (req, res: any) => {
    try {
        const { identifier } = req.params;
        const players = await findPlayerByIdentifier(identifier);

        if (!players || (Array.isArray(players) && players.length === 0)) {
            return res.status(404).json({ error: "Player not found", code: "NOT_FOUND" });
        }
        const playerList = Array.isArray(players) ? players : [players];

        // Collect identifiers
        const allIdentifiers = await getAllIdentifiersFromPlayerList(playerList);

        const bans = await prisma.ban.findMany({
            where: {
                identifiers: {
                    some: {
                        value: { in: Array.from(allIdentifiers) }
                    }
                }
            },
            include: {
                license: { select: { serverName: true } }
            },
            orderBy: { bannedAt: 'desc' }
        });

        return res.status(200).json({
            count: bans.length,
            identifiers: req.apiPlanConfig?.canSeeIdentifiers ? allIdentifiers : [],
            bans: bans.map(b => ({
                id: b.banId,
                server: b.license.serverName,
                reason: b.reason,
                details: b.details,
                evidence: b.evidenceUrl,
                bannedAt: b.bannedAt,
                expiresAt: b.expiresAt,
            }))
        });

    } catch (error) {
        console.error("Player Bans Error:", error);
        return res.status(500).json({ error: "Internal server error", code: "INTERNAL_ERROR" });
    }
});

// GET /v1/player/:identifier/bans-history
router.get("/:identifier/bans-history", async (req, res: any) => {
    try {
        const { identifier } = req.params;
        const players = await findPlayerByIdentifier(identifier);

        if (!players || (Array.isArray(players) && players.length === 0)) {
            return res.status(404).json({ error: "Player not found", code: "NOT_FOUND" });
        }
        const playerList = Array.isArray(players) ? players : [players];
        
        // We can search BanHistory by playerId OR identifiers?
        // BanHistory usually links to Player record.
        // Since we have multiple Player records (one per server), we should fetch BanHistory for ALL of them.
        const playerIds = playerList.map(p => p.id);

        const history = await prisma.banHistory.findMany({
            where: {
                playerId: { in: playerIds }
            },
            include: {
                license: { select: { serverName: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return res.status(200).json({
            count: history.length,
            bans: history.map(b => ({
                server: b.license.serverName,
                reason: b.reason,
                details: b.details,
                evidence: b.evidenceUrl,
                createdAt: b.createdAt,
            }))
        });

    } catch (error) {
        console.error("Player Ban History Error:", error);
        return res.status(500).json({ error: "Internal server error", code: "INTERNAL_ERROR" });
    }
});

// GET /v1/player/:identifier/threat-score
router.get("/:identifier/threat-score", async (req, res: any) => {
    try {
        const { identifier } = req.params;
        const players = await findPlayerByIdentifier(identifier);

        if (!players || (Array.isArray(players) && players.length === 0)) {
            return res.status(404).json({ error: "Player not found", code: "NOT_FOUND" });
        }
        
        const playerList = Array.isArray(players) ? players : [players];
        const mainProfile = playerList[0];

        const trustScore = await calculateTrustScore(
            prisma as unknown as PrismaClient, 
            mainProfile, 
            "00000000-0000-0000-0000-000000000000" 
        );

        return res.status(200).json({
            score: trustScore.score,
        });

    } catch (error) {
        console.error("Player Threat Score Error:", error);
        return res.status(500).json({ error: "Internal server error", code: "INTERNAL_ERROR" });
    }
});

// GET /v1/player/:identifier/analysis
router.get("/:identifier/analysis", async (req, res: any) => {
    try {
        const { identifier } = req.params;
        const players = await findPlayerByIdentifier(identifier);

        if (!players || (Array.isArray(players) && players.length === 0)) {
            return res.status(404).json({ error: "Player not found", code: "NOT_FOUND" });
        }
        
        const playerList = Array.isArray(players) ? players : [players];
        const mainProfile = playerList[0];

        // Use dummy ID for global context
        const GLOBAL_CONTEXT_ID = "00000000-0000-0000-0000-000000000000";

        const analysis = await performPlayerAnalysis(
            prisma as unknown as PrismaClient,
            mainProfile,
            GLOBAL_CONTEXT_ID,
            {
                showIdentifiers: req.apiPlanConfig?.canSeeIdentifiers || false 
            }
        );

        return res.status(200).json(analysis);

    } catch (error) {
        console.error("Player Analysis Error:", error);
        return res.status(500).json({ error: "Internal server error", code: "INTERNAL_ERROR" });
    }
});

export default router;



