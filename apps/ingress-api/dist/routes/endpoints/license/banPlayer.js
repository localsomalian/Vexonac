import { z } from "zod";
import { env } from "../../../lib/env";
import prisma from "../../../lib/prisma";
import { parseIdentifierType } from "../../../lib/utils";
import { websocketService } from "../../../services/websocket.service";
const schema = z.object({
    playerLicense: z.string().min(1, "Player license is required"),
    reason: z.string().min(1, "Ban reason is required"),
    details: z
        .union([
        z.record(z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])),
        z.array(z.string()),
    ])
        .optional(),
    evidenceUrl: z.string().url().optional(),
    duration: z.number().optional(),
    bannedBy: z.string().optional(),
    fivemPlayerId: z.string().optional(),
});
export const banPlayer = async (req, res) => {
    const licenseKey = req.params.licenseKey;
    const clientIp = req.clientIp;
    if (!licenseKey || licenseKey.trim().length === 0) {
        res.status(400).json({
            error: "License key is required in URL",
            code: 400,
        });
        return;
    }
    try {
        const body = schema.parse(req.body);
        const { playerLicense, reason, details, evidenceUrl, duration, bannedBy, fivemPlayerId } = body;
        const result = await prisma.$transaction(async (tx) => {
            // 1. Verify license exists and is valid
            const license = await tx.license.findUnique({
                where: { licenseKey: licenseKey.trim() },
                select: {
                    id: true,
                    discordId: true,
                    isBanned: true,
                    serverIp: true,
                    expiresAt: true,
                    serverInfo: {
                        select: {
                            version: true,
                        },
                    },
                },
            });
            if (!license) {
                throw new Error("LICENSE_NOT_FOUND");
            }
            if (license.isBanned) {
                throw new Error("LICENSE_BANNED");
            }
            if (license.serverIp && license.serverIp !== clientIp) {
                throw new Error("LICENSE_IP_MISMATCH");
            }
            if (new Date() >= license.expiresAt) {
                throw new Error("LICENSE_EXPIRED");
            }
            // 2. Find the player and collect all their identifiers (current and old)
            const player = await tx.player.findUnique({
                where: {
                    licenseId_playerLicense: {
                        licenseId: license.id,
                        playerLicense,
                    },
                },
                select: {
                    id: true,
                    playerName: true,
                    identifiers: true,
                    oldIdentifiers: true,
                },
            });
            if (!player) {
                throw new Error("PLAYER_NOT_FOUND");
            }
            // 3. Collect all identifiers (current and historical)
            const currentIdentifiers = Array.isArray(player.identifiers)
                ? player.identifiers
                : [];
            const oldIdentifiers = Array.isArray(player.oldIdentifiers)
                ? player.oldIdentifiers
                : [];
            const allIdentifiers = [
                ...new Set([...currentIdentifiers, ...oldIdentifiers]),
            ];
            if (allIdentifiers.length === 0) {
                throw new Error("NO_IDENTIFIERS_FOUND");
            }
            // 4. Generate unique 5-digit ban ID for this license
            let banId;
            let attempts = 0;
            const maxAttempts = 100;
            do {
                // Generate random 5-digit number (10000-99999)
                banId = (Math.floor(Math.random() * 90000) + 10000).toString();
                attempts++;
                // Check if this banId already exists for this license
                const existingBan = await tx.ban.findUnique({
                    where: {
                        licenseId_banId: {
                            licenseId: license.id,
                            banId,
                        },
                    },
                });
                if (!existingBan) {
                    break; // Found unique banId
                }
                if (attempts >= maxAttempts) {
                    throw new Error("UNABLE_TO_GENERATE_UNIQUE_BAN_ID");
                }
            } while (true);
            const expirationDate = duration && duration > 0
                ? (() => {
                    const calculatedDate = new Date(new Date().getTime() + duration * 1000);
                    return isNaN(calculatedDate.getTime()) ? null : calculatedDate;
                })()
                : null;
            const ban = await tx.ban.create({
                data: {
                    playerId: player.id,
                    licenseId: license.id,
                    banId,
                    reason,
                    details: details || {},
                    evidenceUrl: evidenceUrl || null,
                    expiresAt: expirationDate,
                    bannedBy: bannedBy || null,
                    bannedAt: new Date(),
                },
            });
            await tx.banHistory.create({
                data: {
                    playerId: player.id,
                    licenseId: license.id,
                    reason,
                    details: details || {},
                    evidenceUrl: evidenceUrl || null,
                },
            });
            // 5. Create banned identifier records — exclude raw session tokens (no known prefix)
            // to prevent false bans on other players who happen to share the same token.
            const KNOWN_ID_PREFIXES = ['license:', 'steam:', 'discord:', 'ip:', 'xbox:', 'live:', 'fivem:', 'fid:', 'sid:', 'sid2:'];
            const identifiersForBan = allIdentifiers.filter(id => KNOWN_ID_PREFIXES.some(prefix => id.startsWith(prefix)));
            const bannedIdentifierData = (identifiersForBan.length > 0 ? identifiersForBan : allIdentifiers)
                .map((identifier) => ({
                banId: ban.id,
                type: parseIdentifierType(identifier),
                value: identifier,
            }));
            await tx.bannedIdentifier.createMany({
                data: bannedIdentifierData,
                skipDuplicates: true, // Skip if identifier is already banned
            });
            // Extract Discord IDs from banned identifiers
            const discordIds = allIdentifiers
                .filter((identifier) => identifier.startsWith("discord:"))
                .map((identifier) => identifier.replace("discord:", ""));
            const discordMentions = discordIds.length > 0
                ? `\nDiscord: ${discordIds.map(id => `<@${id}>`).join(" ")}`
                : "";
            const isEvidenceUrl = evidenceUrl && evidenceUrl.length > 0;
            const isEvidenceVideo = evidenceUrl && (evidenceUrl.includes("vexonac-capture.webm") || (evidenceUrl.includes("r2.vexonac.com") && evidenceUrl.includes("webm")));
            const embed = {
                color: 3447003,
                type: "rich",
                description: `**Player banned**\n\nLicense: **${licenseKey}**\nLicense Owner: **<@${license.discordId}>**\nPlayer: **${player.playerName}**\nReason: **${reason}**\nDetails: \`\`\`${details ? JSON.stringify(details, null, 2) : "No details"}\`\`\`${discordMentions}`,
                url: "https://www.vexonac.com/",
                author: {
                    name: "New player banned",
                    url: "https://www.vexonac.com/",
                    icon_url: "https://media.discordapp.net/attachments/778562688925696020/1097717519244079136/LOGO_STATIC.png",
                },
                footer: {
                    text: `VexonAC ${license.serverInfo?.version || "Unknown"}`,
                },
                ...(isEvidenceUrl &&
                    !isEvidenceVideo && {
                    image: {
                        url: evidenceUrl,
                    },
                }),
                timestamp: new Date().toISOString(),
            };
            await fetch(env.SERVERS_BAN_WEBHOOK_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    content: isEvidenceVideo ? evidenceUrl : undefined,
                    embeds: [embed],
                }),
            });
            await tx.serverLog.create({
                data: {
                    licenseId: license.id,
                    serverType: "BAN_PLAYER",
                    playerLicense,
                    details: { reason: reason },
                },
            });
            const isPermanent = expirationDate === null;
            const expiryLine = isPermanent
                ? 'This ban is permanent.'
                : `Expires: ${expirationDate.toUTCString()}`;
            return {
                success: true,
                ban: {
                    banId,
                    banDbId: ban.id,
                    licenseId: license.id,
                    playerName: player.playerName,
                    playerLicense,
                    reason,
                    details,
                    evidenceUrl,
                    expiresAt: expirationDate,
                    isPermanent,
                    identifiersBanned: allIdentifiers.length,
                    kickMessage: `You have been banned from this server.\n\nBan ID: #${banId}\nReason: ${reason}\n${expiryLine}\n\nKeep your Ban ID to appeal this ban.`,
                },
            };
        });
        // If a fivemPlayerId was provided and no evidenceUrl was already set,
        // asynchronously request a screenshot from the game server and attach it.
        if (fivemPlayerId && !body.evidenceUrl && result.success) {
            const { licenseId, banDbId } = result.ban;
            setImmediate(async () => {
                try {
                    const screenshotUrl = await websocketService.emitToServer(licenseId, 'screenshotPlayer', { playerId: fivemPlayerId }, true, 14000);
                    if (screenshotUrl && typeof screenshotUrl === 'string') {
                        await prisma.ban.update({
                            where: { id: banDbId },
                            data: { evidenceUrl: screenshotUrl },
                        });
                    }
                }
                catch (_) { }
            });
        }
        res.status(200).json(result);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            console.log(req.body);
            console.error("BanPlayer ZodError:", error.errors.map((err) => ({
                field: err.path.join("."),
                message: err.message,
            })));
            res.status(400).json({
                error: "Invalid request data",
                details: error.errors.map((err) => ({
                    field: err.path.join("."),
                    message: err.message,
                })),
            });
            return;
        }
        console.error("BanPlayer error:", error);
        if (error instanceof Error) {
            switch (error.message) {
                case "LICENSE_NOT_FOUND":
                    res.status(404).json({ error: "License not found", code: 404 });
                    return;
                case "LICENSE_BANNED":
                    res.status(404).json({ error: "License banned", code: 404 });
                    return;
                case "LICENSE_EXPIRED":
                    res.status(404).json({ error: "License expired", code: 404 });
                    return;
                case "PLAYER_NOT_FOUND":
                    res.status(404).json({ error: "Player not found", code: 404 });
                    return;
                case "LICENSE_IP_MISMATCH":
                    res.status(404).json({ error: "License IP mismatch", code: 404 });
                    return;
                case "NO_IDENTIFIERS_FOUND":
                    res
                        .status(404)
                        .json({ error: "No identifiers found for player", code: 404 });
                    return;
                case "UNABLE_TO_GENERATE_UNIQUE_BAN_ID":
                    res
                        .status(500)
                        .json({ error: "Unable to generate unique ban ID", code: 500 });
                    return;
            }
        }
        res.status(500).json({ error: "Internal server error", code: 500 });
    }
};
