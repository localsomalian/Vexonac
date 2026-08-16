import { PrismaClient } from "@vexonac/database";
import type { IdentifierType } from "@vexonac/database";

interface BanPlayerInput {
  serverId: string;
  playerIdentifier: string;
  reason: string;
  details?: Record<string, any>;
  evidenceUrl?: string;
  expiresAt?: Date | null;
  bannedBy?: string;
}

export function parseIdentifierType(identifier: string): IdentifierType {
  if (identifier.startsWith("steam:")) return "STEAM";
  if (identifier.startsWith("license:")) return "ROCKSTAR";
  if (identifier.startsWith("license2:")) return "ROCKSTAR2";
  if (identifier.startsWith("discord:")) return "DISCORD";
  if (identifier.startsWith("xbox:")) return "XBOX";
  if (identifier.startsWith("live:")) return "MICROSOFT";
  if (identifier.startsWith("fivem:")) return "FIVEM";
  if (identifier.startsWith("fid:")) return "FINGERPRINT";
  if (identifier.startsWith("sid:") || identifier.startsWith("sid2:")) return "STORAGE";
  if (identifier.includes("ip:")) return "IP";
  return "HWID"; // Default for hardware IDs
}

export async function banPlayerService(
  prisma: PrismaClient,
  input: BanPlayerInput
) {
  // Use transaction to ensure data consistency
  return await prisma.$transaction(async (tx) => {
    // Find the player by identifier (could be license, name, or other identifier)
    const player = await tx.player.findFirst({
      where: {
        licenseId: input.serverId,
        OR: [
          { playerLicense: input.playerIdentifier },
          {
            playerName: {
              contains: input.playerIdentifier,
              mode: "insensitive",
            },
          },
          {
            identifiers: {
              array_contains: input.playerIdentifier,
            },
          },
          {
            oldIdentifiers: {
              array_contains: input.playerIdentifier,
            },
          },
        ],
      },
      select: {
        id: true,
        playerName: true,
        playerLicense: true,
        identifiers: true,
        oldIdentifiers: true,
      },
    });

    if (!player) {
      throw new Error("Player not found");
    }

    // Check if player is already banned
    const existingBan = await tx.ban.findUnique({
      where: {
        licenseId_playerId: {
          licenseId: input.serverId,
          playerId: player.id,
        },
      },
    });

    if (existingBan) {
      throw new Error("Player is already banned");
    }

    // Generate unique 5-digit ban ID for this license
    let banId: string;
    let attempts = 0;
    const maxAttempts = 100;

    do {
      banId = Math.floor(10000 + Math.random() * 90000).toString();
      attempts++;

      const existingBanId = await tx.ban.findUnique({
        where: {
          licenseId_banId: {
            licenseId: input.serverId,
            banId,
          },
        },
      });

      if (!existingBanId) break;

      if (attempts >= maxAttempts) {
        throw new Error("Unable to generate unique ban ID");
      }
    } while (true);

    // Collect all identifiers (current and historical)
    const currentIdentifiers = Array.isArray(player.identifiers)
      ? (player.identifiers as string[])
      : [];
    const oldIdentifiers = Array.isArray(player.oldIdentifiers)
      ? (player.oldIdentifiers as string[])
      : [];

    const allIdentifiers = [
      ...new Set([...currentIdentifiers, ...oldIdentifiers]),
    ];

    if (allIdentifiers.length === 0) {
      throw new Error("No identifiers found for player");
    }

    // Create the ban record
    const ban = await tx.ban.create({
      data: {
        playerId: player.id,
        licenseId: input.serverId,
        banId,
        reason: input.reason,
        details: input.details || {},
        evidenceUrl: input.evidenceUrl,
        expiresAt: input.expiresAt || null,
        bannedBy: input.bannedBy || "System",
      },
    });

    // Parse and create banned identifiers
    const bannedIdentifiers = [];
    for (const identifier of allIdentifiers) {
      bannedIdentifiers.push({
        banId: ban.id,
        type: parseIdentifierType(identifier),
        value: identifier,
      });
    }

    // Create banned identifier records
    if (bannedIdentifiers.length > 0) {
      await tx.bannedIdentifier.createMany({
        data: bannedIdentifiers,
      });
    }

    // Log the action
    await tx.serverLog.create({
      data: {
        licenseId: input.serverId,
        serverType: "BAN_PLAYER",
        playerLicense: player.playerLicense,
        details: { 
            bannedBy: input.bannedBy,
            reason: input.reason,
            banId: banId
        },
      },
    });

    return {
      success: true,
      banId,
      playerName: player.playerName,
      reason: input.reason,
    };
  });
}
