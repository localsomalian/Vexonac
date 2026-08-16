import prisma from '../lib/prisma';
import { parseIdentifierType } from '../lib/utils';
export async function createBan(input) {
    const { licenseId, playerLicense, reason, details, evidenceUrl, bannedBy, duration, playerName, identifiers } = input;
    return prisma.$transaction(async (tx) => {
        let player = await tx.player.findUnique({
            where: { licenseId_playerLicense: { licenseId, playerLicense } },
            select: { id: true, playerName: true, identifiers: true, oldIdentifiers: true },
        });
        if (!player) {
            if (!identifiers || identifiers.length === 0)
                throw new Error('PLAYER_NOT_FOUND');
            player = await tx.player.upsert({
                where: { licenseId_playerLicense: { licenseId, playerLicense } },
                create: {
                    licenseId,
                    playerLicense,
                    playerName: playerName || 'Unknown',
                    identifiers: identifiers,
                    oldIdentifiers: [],
                    firstJoin: new Date(),
                    lastJoin: new Date(),
                },
                update: {},
                select: { id: true, playerName: true, identifiers: true, oldIdentifiers: true },
            });
        }
        const currentIdentifiers = Array.isArray(player.identifiers) ? player.identifiers : [];
        const oldIdentifiers = Array.isArray(player.oldIdentifiers) ? player.oldIdentifiers : [];
        const allIdentifiers = [...new Set([...currentIdentifiers, ...oldIdentifiers])];
        if (allIdentifiers.length === 0)
            throw new Error('NO_IDENTIFIERS_FOUND');
        let banId;
        let attempts = 0;
        do {
            banId = (Math.floor(Math.random() * 90000) + 10000).toString();
            attempts++;
            const existing = await tx.ban.findUnique({
                where: { licenseId_banId: { licenseId, banId } },
            });
            if (!existing)
                break;
            if (attempts >= 100)
                throw new Error('UNABLE_TO_GENERATE_UNIQUE_BAN_ID');
        } while (true);
        const expiresAt = duration && duration > 0 ? new Date(Date.now() + duration * 1000) : null;
        const ban = await tx.ban.create({
            data: {
                playerId: player.id,
                licenseId,
                banId,
                reason,
                details: details || {},
                evidenceUrl: evidenceUrl || null,
                expiresAt,
                bannedBy: bannedBy || null,
                bannedAt: new Date(),
            },
        });
        await tx.banHistory.create({
            data: {
                playerId: player.id,
                licenseId,
                reason,
                details: details || {},
                evidenceUrl: evidenceUrl || null,
            },
        });
        const KNOWN_PREFIXES = ['license:', 'steam:', 'discord:', 'ip:', 'xbox:', 'live:', 'fivem:', 'fid:', 'sid:', 'sid2:'];
        const filtered = allIdentifiers.filter((id) => KNOWN_PREFIXES.some((p) => id.startsWith(p)));
        await tx.bannedIdentifier.createMany({
            data: (filtered.length > 0 ? filtered : allIdentifiers).map((identifier) => ({
                banId: ban.id,
                type: parseIdentifierType(identifier),
                value: identifier,
            })),
            skipDuplicates: true,
        });
        await tx.serverLog.create({
            data: { licenseId, serverType: 'BAN_PLAYER', playerLicense, details: { reason } },
        });
        const isPermanent = expiresAt === null;
        const expiryLine = isPermanent ? 'This ban is permanent.' : `Expires: ${expiresAt.toUTCString()}`;
        return {
            banId,
            banDbId: ban.id,
            playerName: player.playerName,
            playerLicense,
            reason,
            evidenceUrl: evidenceUrl || null,
            expiresAt,
            isPermanent,
            identifiersBanned: allIdentifiers.length,
            kickMessage: `You have been banned from this server.\n\nBan ID: #${banId}\nReason: ${reason}\n${expiryLine}\n\nKeep your Ban ID to appeal this ban.`,
        };
    });
}
