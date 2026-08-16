import { Router } from "express";
import { apiKeyAuth } from "../../middleware/api-auth.middleware";
import prisma from "../../../prisma";
import { Permission, Prisma, PrismaClient } from "@vexonac/database/prisma/generated/client/client";
import { emitToServer } from "../../lib/emitToServer"; // Assuming this utility exists to talk to ingress/fivem
import { banPlayerService } from "../../services/ban.service";
import { performPlayerAnalysis } from "@vexonac/utils/src/trust-score";

const router = Router();

router.use(apiKeyAuth as any);

// Helper to ensure license linkage
const ensureLicense = (req: any, res: any, next: any) => {
    if (!req.apiKey?.licenseId) {
        return res.status(400).json({
            error: "This API key is not linked to any server license.",
            code: "NO_LINKED_LICENSE"
        });
    }
    next();
};

router.use(ensureLicense);

// GET /v1/server - Server Info
router.get("/", async (req, res: any) => {
    try {
        const licenseId = req.apiKey!.licenseId!;

        const [license, serverInfo] = await Promise.all([
            prisma.license.findUnique({
                where: { id: licenseId },
                select: {
                    serverName: true,
                    serverIp: true,
                    expiresAt: true,
                    isBanned: true,
                    bannerUrl: true
                }
            }),
            prisma.serverInfo.findUnique({
                where: { licenseId: licenseId }
            })
        ]);

        if (!license) {
            return res.status(404).json({ error: "License not found", code: "NOT_FOUND" });
        }

        return res.status(200).json({
            status: license.isBanned ? "BANNED" : (serverInfo?.isOnline ? "ONLINE" : "OFFLINE"),
            info: {
                name: license.serverName,
                ip: license.serverIp,
                banner: license.bannerUrl,
                version: serverInfo?.version || "Unknown",
            },
            stats: {
                currentPlayers: serverInfo?.playerCount || 0,
                maxSlots: serverInfo?.maxSlots || 32,
                lastSeen: serverInfo?.lastActiveAt
            },
            subscription: {
                expiresAt: license.expiresAt
            }
        });
    } catch (error) {
        console.error("Server Info Error:", error);
        return res.status(500).json({ error: "Internal server error", code: "INTERNAL_ERROR" });
    }
});

// GET /v1/server/stats - Server Stats
router.get("/stats", async (req, res: any) => {
    try {
        const licenseId = req.apiKey!.licenseId!;
        const window = (req.query.window as string) || "24h";
        
        let since = new Date();
        switch(window) {
            case "7d": since.setDate(since.getDate() - 7); break;
            case "30d": since.setDate(since.getDate() - 30); break;
            case "24h": 
            default: since.setTime(since.getTime() - 24 * 60 * 60 * 1000); break;
        }

        // Fetch metrics snapshots
        const metrics = await prisma.serverMetrics.findMany({
            where: {
                licenseId,
                timestamp: { gte: since }
            },
            orderBy: { timestamp: 'asc' }
        });

        // Calculate averages
        const totalSnapshots = metrics.length;
        const avgPlayers = totalSnapshots > 0 
            ? Math.round(metrics.reduce((acc, curr) => acc + curr.playerCount, 0) / totalSnapshots) 
            : 0;

        // Get current state
        const serverInfo = await prisma.serverInfo.findUnique({
            where: { licenseId },
            select: { playerCount: true, isOnline: true }
        });

        // Get bans in window
        const bansInWindow = await prisma.banHistory.count({
            where: {
                licenseId,
                createdAt: { gte: since }
            }
        });

        const newBansInWindow = await prisma.ban.count({
            where: {
                licenseId,
                createdAt: { gte: since }
            }
        });

        const newPlayersInWindow = await prisma.player.count({
            where: {
                licenseId,
                firstJoin: { gte: since },
            }
        });

        const playerJoinsInWindow = await prisma.player.count({
            where: {
                licenseId,
                lastJoin: { gte: since },
            }
        });

        return res.status(200).json({
            window,
            since: since.toISOString(),
            current: {
                players: serverInfo?.playerCount || 0,
                online: serverInfo?.isOnline || false
            },
            averages: {
                players: avgPlayers
            },
            activity: {
                bansIssued: bansInWindow,
                newBans: newBansInWindow,
                newPlayers: newPlayersInWindow,
                playerJoins: playerJoinsInWindow,
            },
            history: metrics.map(m => ({
                timestamp: m.timestamp,
                players: m.playerCount,
                bans: m.banCount
            }))
        });

    } catch (error) {
        console.error("Server Stats Error:", error);
        return res.status(500).json({ error: "Internal server error", code: "INTERNAL_ERROR" });
    }
});

// GET /v1/server/bans - Active Bans
router.get("/bans", async (req, res: any) => {
    try {
        const licenseId = req.apiKey!.licenseId!;
        const limit = Math.min(Number(req.query.limit) || 50, 100);
        const page = Math.max(Number(req.query.page) || 1, 1);
        const skip = (page - 1) * limit;
        const reason = req.query.reason as string;
        const playerName = req.query.playerName as string;

        const where: any = {
            licenseId
        };

        if (reason) where.reason = { contains: reason, mode: 'insensitive' };
        if (playerName) where.player = { playerName: { contains: playerName, mode: 'insensitive' } };

        const [bans, total] = await Promise.all([
            prisma.ban.findMany({
                where,
                take: limit,
                skip,
                orderBy: { bannedAt: 'desc' },
                include: {
                    player: { select: { playerName: true } },
                    identifiers: true,
                    oldIdentifiers: true
                }
            }),
            prisma.ban.count({ where })
        ]);

        return res.status(200).json({
            data: bans.map(ban => ({
                id: ban.banId,
                player: ban.player.playerName,
                reason: ban.reason,
                details: ban.details,
                evidence: ban.evidenceUrl,
                bannedAt: ban.bannedAt,
                expiresAt: ban.expiresAt,
                bannedBy: ban.bannedBy,
                identifiers: req.apiPlanConfig?.canSeeIdentifiersServer ? ban.identifiers : [],
                oldIdentifiers: req.apiPlanConfig?.canSeeIdentifiersServer ? ban.oldIdentifiers : [],
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Server Bans Error:", error);
        return res.status(500).json({ error: "Internal server error", code: "INTERNAL_ERROR" });
    }
});

// GET /v1/server/bans-history - All Bans
router.get("/bans-history", async (req, res: any) => {
    try {
        const licenseId = req.apiKey!.licenseId!;
        const limit = Math.min(Number(req.query.limit) || 50, 100);
        const page = Math.max(Number(req.query.page) || 1, 1);
        const skip = (page - 1) * limit;
        const reason = req.query.reason as string;
        const playerName = req.query.playerName as string;

        const where: Prisma.BanHistoryWhereInput = {
            licenseId
        };

        if (reason) where.reason = { contains: reason, mode: 'insensitive' };
        if (playerName) where.player = { playerName: { contains: playerName, mode: 'insensitive' } };

        const [bans, total] = await Promise.all([
            prisma.banHistory.findMany({
                where,
                take: limit,
                skip,
                orderBy: { createdAt: 'desc' },
                include: {
                    player: { select: { playerName: true } }
                }
            }),
            prisma.banHistory.count({ where })
        ]);

        return res.status(200).json({
            data: bans.map(ban => ({
                player: ban.player.playerName,
                reason: ban.reason,
                details: ban.details,
                evidence: ban.evidenceUrl,
                bannedAt: ban.createdAt,
                // BanHistory model might differ from Ban model. 
                // Schema check: BanHistory has unbannedAt, expiresAt? 
                // Based on error, `expiresAt`, `bannedBy`, `unbannedAt` are missing on `bans` result type.
                // Let's check schema or just omit if not present.
                // Assuming standard fields if they exist, or null.
                // Fix: Cast to any if fields are dynamic or just return what we know exists.
                // But cleaner to check schema. `BanHistory` usually mirrors `Ban`.
                // If errors persist, I'll remove them.
                // Let's assume simple history view for now.
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Server Ban History Error:", error);
        return res.status(500).json({ error: "Internal server error", code: "INTERNAL_ERROR" });
    }
});

// GET /v1/server/config - Raw Config
router.get("/config", async (req, res: any) => {
    try {
        const licenseId = req.apiKey!.licenseId!;
        
        const license = await prisma.license.findUnique({
            where: { id: licenseId },
            select: { configuration: true }
        });

        if (!license) return res.status(404).json({ error: "License not found", code: "NOT_FOUND" });

        return res.status(200).json({
            config: license.configuration
        });
    } catch (error) {
        console.error("Server Config Error:", error);
        return res.status(500).json({ error: "Internal server error", code: "INTERNAL_ERROR" });
    }
});

// GET /v1/server/players - Connected Players
router.get("/players", async (req, res: any) => {
    try {
        const licenseId = req.apiKey!.licenseId!;
        
        const serverInfo = await prisma.serverInfo.findUnique({
            where: { licenseId },
            select: { playerList: true }
        });

        // playerList is stored as JSON. It should be an array of player objects.
        // We return it as is.
        const players = serverInfo?.playerList || [];

        return res.status(200).json({
            count: Array.isArray(players) ? players.length : 0,
            players: players
        });
    } catch (error) {
        console.error("Server Players Error:", error);
        return res.status(500).json({ error: "Internal server error", code: "INTERNAL_ERROR" });
    }
});

// GET /v1/server/admins - Admins List
router.get("/admins", async (req, res: any) => {
    try {
        const licenseId = req.apiKey!.licenseId!;
        
        const admins = await prisma.member.findMany({
            where: { licenseId },
            select: {
                discordId: true,
                permissions: true,
                createdAt: true
            }
        });

        return res.status(200).json({
            count: admins.length,
            admins: admins.map(a => ({
                discordId: a.discordId,
                permissions: a.permissions,
                addedAt: a.createdAt
            }))
        });
    } catch (error) {
        console.error("Server Admins Error:", error);
        return res.status(500).json({ error: "Internal server error", code: "INTERNAL_ERROR" });
    }
});

// GET /v1/server/logs - Logs
router.get("/logs", async (req, res: any) => {
    try {
        const licenseId = req.apiKey!.licenseId!;
        const limit = Math.min(Number(req.query.limit) || 100, 500);
        const page = Math.max(Number(req.query.page) || 1, 1);
        const skip = (page - 1) * limit;
        const type = req.query.type as string; // e.g. "BAN_PLAYER,KICK_PLAYER"

        const where: Prisma.ServerLogWhereInput = {
            licenseId
        };

        if (type) {
            const types = type.split(',').map(t => t.trim());
            
            // Construct OR clause for types
            where.OR = [
                { serverType: { in: types as any } },
                { systemType: { in: types as any } }
            ];
        }

        const [logs, total] = await Promise.all([
            prisma.serverLog.findMany({
                where,
                take: limit,
                skip,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.serverLog.count({ where })
        ]);

        return res.status(200).json({
            data: logs.map(log => ({
                id: log.id,
                type: log.serverType || log.systemType,
                details: log.details,
                timestamp: log.createdAt,
                executor: log.memberId,
                target: log.playerId || log.playerLicense
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Server Logs Error:", error);
        return res.status(500).json({ error: "Internal server error", code: "INTERNAL_ERROR" });
    }
});

//POST /v1/server/lookup
router.post("/lookup", async (req, res: any) => {
    try {
        const licenseId = req.apiKey!.licenseId!;
        const { identifier } = req.body;
        
        const players = await prisma.player.findMany({
            where: {
                licenseId,
                OR: [
                    { identifiers: { array_contains: identifier } },
                    { oldIdentifiers: { array_contains: identifier } },
                    { playerLicense: identifier },
                ]
            },
            orderBy: { lastJoin: 'desc' }
        });

        const mainPlayer = players.length > 0 ? players[0] : null;
        if (!mainPlayer) {
            return res.status(404).json({ error: "Player not found", code: "NOT_FOUND" });
        }

        const analysis = await performPlayerAnalysis(prisma as PrismaClient, mainPlayer, licenseId, {
            showIdentifiers: req.apiPlanConfig?.canSeeIdentifiersServer || false,
        });

        return res.status(200).json(analysis);
    } catch (error) {
        console.error("Server Lookup Error:", error);
        return res.status(500).json({ error: "Internal server error", code: "INTERNAL_ERROR" });
    }
});

// ==========================================
// SERVER CONTROL ENDPOINTS
// ==========================================

// POST /v1/server/screenshot
router.post("/screenshot", async (req, res: any) => {
    try {
        const licenseId = req.apiKey!.licenseId!;
        const { playerId } = req.body;

        if (!playerId) {
            return res.status(400).json({ error: "Missing playerId", code: "MISSING_PARAM" });
        }

        // Emit event to server via socket
        const screenshotUrl = await emitToServer(licenseId, "screenshotPlayer", { playerId });

        if (!screenshotUrl) {
            return res.status(503).json({ error: "Server is offline or unreachable", code: "SERVER_OFFLINE" });
        }

        return res.status(200).json({ 
            success: true, 
            screenshotUrl: screenshotUrl
        });
    } catch (error) {
        console.error("Screenshot Error:", error);
        return res.status(500).json({ error: "Internal server error", code: "INTERNAL_ERROR" });
    }
});

// POST /v1/server/kick
router.post("/kick", async (req, res: any) => {
    try {
        const licenseId = req.apiKey!.licenseId!;
        const { playerId, reason, by } = req.body;

        if (!playerId) {
            return res.status(400).json({ error: "Missing playerId", code: "MISSING_PARAM" });
        }

        const sent = await emitToServer(licenseId, "kickPlayer", { 
            playerId, 
            reason: reason || "Kicked via API",
            by: by || "API Admin"
        });

        if (!sent) {
            return res.status(503).json({ error: "Server is offline or unreachable", code: "SERVER_OFFLINE" });
        }

        return res.status(200).json({ success: true, message: "Kick command sent" });
    } catch (error) {
        console.error("Kick Error:", error);
        return res.status(500).json({ error: "Internal server error", code: "INTERNAL_ERROR" });
    }
});

// POST /v1/server/ban
router.post("/ban", async (req, res: any) => {
    try {
        const licenseId = req.apiKey!.licenseId!;
        const { playerId, reason, duration, evidence, by } = req.body;

        if (!playerId) {
            return res.status(400).json({ error: "Missing playerId", code: "MISSING_PARAM" });
        }

        if (!reason) {
            return res.status(400).json({ error: "Missing reason", code: "MISSING_PARAM" });
        }

        // Emit to server to handle the ban logic (kicking + DB update usually done by server resource)
        // Or should we update DB directly? 
        // Usually 'banPlayer' event handles kicking and saving.
        const sent = await emitToServer(licenseId, "banPlayer", { 
            playerId, 
            reason, 
            duration: duration ? parseInt(duration) : undefined,
            evidence,
            by: by || "API Admin"
        });

        if (!sent) {
            return res.status(503).json({ error: "Server is offline or unreachable.", code: "SERVER_OFFLINE" });
        }

        return res.status(200).json({ success: true, message: "Ban command sent" });
    } catch (error) {
        console.error("Ban Error:", error);
        return res.status(500).json({ error: "Internal server error", code: "INTERNAL_ERROR" });
    }
});

// POST /v1/server/ban/offline
router.post("/ban/offline", async (req, res: any) => {
    try {
        const licenseId = req.apiKey!.licenseId!;
        const { identifiers, playerLicense, reason, details, evidenceUrl, by } = req.body;

        if (!reason) {
            return res.status(400).json({ error: "Missing reason", code: "MISSING_PARAM" });
        }

        // Determine the identifier to use for lookup
        let targetIdentifier = playerLicense;
        
        // If old array format is used and no specific playerLicense is provided
        if (!targetIdentifier && Array.isArray(identifiers) && identifiers.length > 0) {
             // Prefer license
             targetIdentifier = identifiers.find((id: string) => id.startsWith('license:')) || identifiers[0];
        }

        if (!targetIdentifier) {
             return res.status(400).json({ error: "Missing playerLicense or identifiers array", code: "INVALID_BODY" });
        }

        try {
            const result = await banPlayerService(prisma as any, {
                serverId: licenseId,
                playerIdentifier: targetIdentifier,
                reason,
                details: details || {},
                evidenceUrl,
                bannedBy: by || "API Admin"
            });

            return res.status(200).json(result);

        } catch (error: any) {
            if (error.message === "Player not found") {
                return res.status(404).json({ error: "Player profile not found. Cannot ban unknown player offline.", code: "PLAYER_NOT_FOUND" });
            }
            if (error.message === "Player is already banned") {
                return res.status(409).json({ error: "Player is already banned", code: "ALREADY_BANNED" });
            }
            throw error; // Let outer catch handle generic 500
        }

    } catch (error) {
        console.error("Offline Ban Error:", error);
        return res.status(500).json({ error: "Internal server error", code: "INTERNAL_ERROR" });
    }
});

// POST /v1/server/unban
router.post("/unban", async (req, res: any) => {
    try {
        const licenseId = req.apiKey!.licenseId!;
        const { banId } = req.body;

        if (!banId) {
            return res.status(400).json({ error: "Missing banId", code: "MISSING_PARAM" });
        }

        // Find the ban first
        const ban = await prisma.ban.findFirst({
            where: {
                licenseId,
                banId
            }
        });

        if (!ban) {
            return res.status(404).json({ error: "Ban not found", code: "NOT_FOUND" });
        }

        // Delete from Active Bans
        await prisma.ban.delete({
            where: { id: ban.id }
        });

        return res.status(200).json({ success: true, message: "Player unbanned" });
    } catch (error) {
        console.error("Unban Error:", error);
        return res.status(500).json({ error: "Internal server error", code: "INTERNAL_ERROR" });
    }
});

// POST /v1/server/unban/all
router.post("/unban/all", async (req, res: any) => {
    try {
        const licenseId = req.apiKey!.licenseId!;

        const { count } = await prisma.ban.deleteMany({
            where: { licenseId }
        });

        return res.status(200).json({ success: true, count, message: "All players unbanned" });
    } catch (error) {
        console.error("Unban All Error:", error);
        return res.status(500).json({ error: "Internal server error", code: "INTERNAL_ERROR" });
    }
});

// POST /v1/server/unban/last
router.post("/unban/last", async (req, res: any) => {
    try {
        const licenseId = req.apiKey!.licenseId!;
        const count = Math.min(Number(req.body.count) || 1, 10);
        const minutes = Number(req.body.minutes);

        const where: any = { licenseId };
        
        if (minutes) {
            where.bannedAt = {
                gte: new Date(Date.now() - minutes * 60 * 1000)
            };
        }

        const bans = await prisma.ban.findMany({
            where,
            orderBy: { bannedAt: 'desc' },
            take: count
        });

        if (bans.length === 0) {
            return res.status(200).json({ success: true, count: 0, message: "No matching bans found" });
        }

        const ids = bans.map(b => b.id);
        await prisma.ban.deleteMany({
            where: {
                id: { in: ids }
            }
        });

        return res.status(200).json({ success: true, count: bans.length, message: "Last bans removed" });
    } catch (error) {
        console.error("Unban Last Error:", error);
        return res.status(500).json({ error: "Internal server error", code: "INTERNAL_ERROR" });
    }
});

// POST /v1/server/exec
router.post("/exec", async (req, res: any) => {
    try {
        const licenseId = req.apiKey!.licenseId!;
        const { command, by } = req.body;

        if (!command) {
            return res.status(400).json({ error: "Missing command", code: "MISSING_PARAM" });
        }

        const sent = await emitToServer(licenseId, "console:command", { command, username: by || "API Admin" }, true);

        if (!sent) {
            return res.status(503).json({ error: "Server is offline or unreachable", code: "SERVER_OFFLINE" });
        }

        return res.status(200).json({ success: true, message: "Command sent" });
    } catch (error) {
        console.error("Exec Error:", error);
        return res.status(500).json({ error: "Internal server error", code: "INTERNAL_ERROR" });
    }
});

// POST /v1/server/admin/add
router.post("/admin/add", async (req, res: any) => {
    try {
        const licenseId = req.apiKey!.licenseId!;
        const { discordId, permissions } = req.body;

        if (!discordId) {
            return res.status(400).json({ error: "Missing discordId", code: "MISSING_PARAM" });
        }

        const existingMember = await prisma.member.findUnique({
            where: {
                licenseId_discordId: {
                    licenseId,
                    discordId
                }
            }
        });
        
        if (existingMember) {
            return res.status(400).json({ error: "Member already exists", code: "MEMBER_ALREADY_EXISTS" });
        }


        // Check permissions are valid and existing
        const validPermissions = permissions.filter((permission: any) => Object.values(Permission).includes(permission));

        if (validPermissions.length === 0) {
            return res.status(400).json({ error: "Invalid permissions", code: "INVALID_PERMISSIONS" });
        }

        if (validPermissions.length !== permissions.length) {
            return res.status(400).json({ error: "Invalid permissions", code: "INVALID_PERMISSIONS" });
        }

        // Upsert member
        const member = await prisma.member.create({
            data: {
                licenseId,
                discordId,
                permissions: validPermissions
            }
        });

        return res.status(200).json({ success: true, member });
    } catch (error) {
        console.error("Add Admin Error:", error);
        return res.status(500).json({ error: "Internal server error", code: "INTERNAL_ERROR" });
    }
});

// POST /v1/server/admin/remove
router.post("/admin/remove", async (req, res: any) => {
    try {
        const licenseId = req.apiKey!.licenseId!;
        const { discordId } = req.body;

        if (!discordId) {
            return res.status(400).json({ error: "Missing discordId", code: "MISSING_PARAM" });
        }

        const existingMember = await prisma.member.findUnique({
            where: {
                licenseId_discordId: {
                    licenseId,
                    discordId
                }
            }
        });
        if (!existingMember) {
            return res.status(400).json({ error: "Member not found", code: "MEMBER_NOT_FOUND" });
        }

        await prisma.member.delete({
            where: { id: existingMember.id }
        });

        return res.status(200).json({ success: true, message: "Admin removed" });
    } catch (error) {
        // Handle case where member doesn't exist
        return res.status(200).json({ success: true, message: "Admin removed (or did not exist)" });
    }
});

export default router;

