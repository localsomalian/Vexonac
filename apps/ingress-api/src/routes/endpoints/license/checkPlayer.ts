import type { Prisma } from "@vexonac/database";
import { calculateTrustScore } from "@vexonac/utils";
import { RequestHandler } from "express";
import { z } from "zod";
import { buildConnectionEmbed, buildRejectedConnectionEmbed, getDiscordConfig, sendWebhook } from "../../../lib/discordWebhook";
import prisma from "../../../lib/prisma";
import { parseIdentifierType } from "../../../lib/utils";

const schema = z.object({
  identifiers: z.array(z.string()).min(2, "Identifiers is required"),
  tokens: z.array(z.string()).min(1).optional(),
  playerName: z.string().min(1, "Player name is required"),
  playerLicense: z.string().min(1, "Player license is required"),
});

export const checkPlayer: RequestHandler = async (req, res) => {
  const licenseKey = req.params.licenseKey as string;
  const clientIp = req.clientIp!;

  if (!licenseKey || licenseKey.trim().length === 0) {
    res.status(400).json({
      error: "License key is required in URL",
      code: 400,
    });
    return;
  }

  try {
    const body = schema.parse(req.body);
    const { identifiers, tokens, playerName, playerLicense } = body;

    // Combine all identifiers
    const allCurrentIdentifiers = [...identifiers, ...(tokens || [])];

    // Start transaction for atomic operations
    // Real FiveM identifiers have known prefixes. Raw session tokens do not
    // and must not be used for ban matching as they can be shared across players.
    const KNOWN_ID_PREFIXES = ['license:', 'steam:', 'discord:', 'ip:', 'xbox:', 'live:', 'fivem:', 'fid:', 'sid:', 'sid2:']
    const realIdentifiers = identifiers.filter(id =>
      KNOWN_ID_PREFIXES.some(prefix => id.startsWith(prefix))
    )

    const playerDiscordIds = identifiers
      .filter(id => id.startsWith('discord:'))
      .map(id => id.replace('discord:', ''))

    const result = await (
      prisma.$transaction as (
        fn: (tx: Prisma.TransactionClient) => Promise<any>
      ) => Promise<any>
    )(async (tx) => {
      // 1. Verify license exists and is valid
      const license = await tx.license.findUnique({
        where: { licenseKey: licenseKey.trim() },
        select: {
          id: true,
          discordId: true,
          serverIp: true,
          serverName: true,
          isBanned: true,
          expiresAt: true,
          configuration: true,
          serverInfo: { select: { version: true } },
          members: {
            where: {
              discordId: {
                in: playerDiscordIds,
              },
            },
            select: {
              permissions: true,
            },
          },
        },
      });

      if (!license) {
        throw new Error("LICENSE_NOT_FOUND");
      }

      if (license.serverIp && license.serverIp !== clientIp) {
        throw new Error("LICENSE_IP_MISMATCH");
      }

      if (license.isBanned) {
        throw new Error("LICENSE_BANNED");
      }

      if (new Date() >= license.expiresAt) {
        throw new Error("LICENSE_EXPIRED");
      }

      // 2. Check for active bans using only real identifiers (not session tokens)
      const activeBan = await tx.bannedIdentifier.findFirst({
        where: {
          value: { in: realIdentifiers },
          ban: {
            licenseId: license.id,
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
        },
        select: {
          ban: {
            select: {
              id: true,
              banId: true,
              reason: true,
              details: true,
              evidenceUrl: true,
              expiresAt: true,
            },
          },
        },
      });

      if (activeBan) {
        // Extend ban coverage to any new real identifiers the player is now using
        const bannedIdentifierData = realIdentifiers.map(
          (identifier) => ({
            banId: activeBan.ban.id,
            type: parseIdentifierType(identifier),
            value: identifier,
          })
        );

        await tx.bannedIdentifier.createMany({
          data: bannedIdentifierData,
          skipDuplicates: true,
        });

        const expiresAt = activeBan.ban.expiresAt
        const isPermanent = expiresAt === null
        const expiryLine = isPermanent
          ? 'This ban is permanent.'
          : `Expires: ${expiresAt!.toUTCString()}`

        return {
          banned: true,
          ban: {
            banId: activeBan.ban.banId,
            reason: activeBan.ban.reason,
            details: activeBan.ban.details,
            evidenceUrl: activeBan.ban.evidenceUrl,
            expiresAt,
            isPermanent,
            kickMessage: `You have been banned from this server.\n\nBan ID: #${activeBan.ban.banId}\nReason: ${activeBan.ban.reason}\n${expiryLine}\n\nKeep your Ban ID to appeal this ban.`,
          },
        };
      }

      // 2b. Cross-server global ban network — check approved global bans
      if (realIdentifiers.length > 0) {
        const globalBan = await tx.globalBan.findFirst({
          where: {
            status: 'APPROVED',
            identifiers: { hasSome: realIdentifiers },
          },
          select: { id: true, reason: true },
        });

        if (globalBan) {
          const shortId = `GBN-${globalBan.id.slice(0, 8).toUpperCase()}`;
          return {
            banned: true,
            ban: {
              banId: shortId,
              reason: globalBan.reason,
              details: 'Global network ban — enforced across all VexonAC-protected servers.',
              evidenceUrl: null,
              expiresAt: null,
              isPermanent: true,
              kickMessage: `[VexonAC Global Ban Network]\n\nYou are banned from all VexonAC-protected servers.\nBan ID: ${shortId}\nReason: ${globalBan.reason}\n\nThis ban is permanent and cross-server.`,
            },
          };
        }
      }

      // 3. Update or create server-specific player record with identifier tracking
      const currentTime = new Date();

      const existingPlayer = await tx.player.findUnique({
        where: {
          licenseId_playerLicense: {
            licenseId: license.id,
            playerLicense,
          },
        },
        select: {
          identifiers: true,
          oldIdentifiers: true,
          playTime: true,
        },
      });

      let oldIdentifiers: string[] = [];

      const allCurrentIdentifiersWithFid = [
        ...allCurrentIdentifiers,
        ...(Array.isArray(existingPlayer?.identifiers)
          ? (existingPlayer.identifiers as string[]).filter((id: string) =>
              id.startsWith("fid:") || id.startsWith("sid:") || id.startsWith("sid2:")
            )
          : []),
      ];

      if (existingPlayer) {
        // Merge current identifiers into old identifiers (without duplicates)
        const currentDbIds = Array.isArray(existingPlayer.identifiers)
          ? (existingPlayer.identifiers as string[])
          : [];
        const previousDbIds = Array.isArray(existingPlayer.oldIdentifiers)
          ? (existingPlayer.oldIdentifiers as string[])
          : [];

        // Add current identifiers that are not in the new set to old identifiers
        const newIdentifiersSet = new Set(allCurrentIdentifiers);

        // don't move ip addresses and fid and tokens
        const identifiersToMove = currentDbIds.filter((id) => {
          // Skip if the identifier is still present in new identifiers
          if (newIdentifiersSet.has(id)) return false;

          // Skip ip addresses, HWID, and fid/sid identifiers
          if (
            id.startsWith("ip:") ||
            parseIdentifierType(id) === "HWID" ||
            id.startsWith("fid:") ||
            id.startsWith("sid:") ||
            id.startsWith("sid2:")
          ) {
            return false;
          }

          // For discord identifiers, only move if there's a different discord identifier in newIdentifiersSet
          if (id.startsWith("discord:")) {
            const hasAnyDiscordInNew = allCurrentIdentifiers.some((newId) =>
              newId.startsWith("discord:")
            );
            return hasAnyDiscordInNew;
          }

          return true;
        });

        oldIdentifiers = [
          ...new Set([...previousDbIds, ...identifiersToMove]),
        ].filter(id => !allCurrentIdentifiersWithFid.includes(id));
      }

      const updatedPlayer = await tx.player.upsert({
        where: {
          licenseId_playerLicense: {
            licenseId: license.id,
            playerLicense,
          },
        },
        update: {
          playerName,
          identifiers: allCurrentIdentifiersWithFid,
          oldIdentifiers,
          lastJoin: currentTime,
        },
        create: {
          licenseId: license.id,
          playerName,
          playerLicense,
          identifiers: allCurrentIdentifiers,
          oldIdentifiers: [],
          firstJoin: currentTime,
          lastJoin: currentTime,
        },
        select: {
          id: true,
          playerName: true,
          playerLicense: true,
          identifiers: true,
          oldIdentifiers: true,
          firstJoin: true,
          lastJoin: true,
          playTime: true,
          licenseId: true,
        },
      });

      if (!updatedPlayer) {
        throw new Error("Failed to retrieve player data");
      }

      const threatScoreResult = await calculateTrustScore(
        tx as any,
        updatedPlayer,
        license.id
      );

      const isLicenseOwner = playerDiscordIds.includes(license.discordId)
      const isMemberBypass = license.members.some(
        (member: any) =>
          member.permissions.includes("BYPASS") ||
          member.permissions.includes("ALL")
      );
      const trustedEntry = await tx.trustedPlayer.findFirst({
        where: { licenseId: license.id, playerLicense },
        select: { id: true },
      });
      const isBypass = isLicenseOwner || isMemberBypass || !!trustedEntry;
      const isAdmin = isLicenseOwner || license.members.some(
        (member: any) => member.permissions.length > 0
      );

      await tx.serverLog.create({
        data: {
          licenseId: license.id,
          serverType: "PLAYER_JOIN",
          playerLicense: updatedPlayer.playerLicense,
        },
      });

      return {
        banned: false,
        playTime: updatedPlayer.playTime || 0,
        threatScore: threatScoreResult.score,
        isBypass,
        isAdmin,
      };
    });

    // Send ConnectionsWebhook (non-blocking)
    setImmediate(async () => {
      try {
        const lic = await prisma.license.findUnique({
          where:  { licenseKey: licenseKey.trim() },
          select: { configuration: true, serverName: true, serverInfo: { select: { version: true } } },
        });
        if (!lic) return;
        const dcfg = getDiscordConfig(lic.configuration as Record<string, any>);
        if (!dcfg.enabled || !dcfg.connectionsWebhook) return;
        const version = lic.serverInfo?.version ?? null;
        if (result.banned) {
          sendWebhook(dcfg.connectionsWebhook, {
            embeds: [buildRejectedConnectionEmbed({
              serverName:  lic.serverName,
              playerName:  body.playerName,
              identifiers: body.identifiers,
              reason:      result.ban?.reason ?? "Banned",
              banId:       result.ban?.banId ?? undefined,
              version,
            })],
          });
        } else {
          sendWebhook(dcfg.connectionsWebhook, {
            embeds: [buildConnectionEmbed({
              serverName:    lic.serverName,
              playerName:    body.playerName,
              playerLicense: body.playerLicense,
              identifiers:   body.identifiers,
              action:        "joined",
              version,
            })],
          });
        }
      } catch (_) {}
    });

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(
        "CheckPlayer ZodError:",
        error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }))
      );
      res.status(400).json({
        error: "Invalid request data",
        details: error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      });
      return;
    }

    console.error("CheckPlayer error:", error);

    if (error instanceof Error) {
      switch (error.message) {
        case "LICENSE_NOT_FOUND":
          res.status(404).json({ error: "License not found", code: 404 });
          return;
        case "LICENSE_BANNED":
          res.status(404).json({ error: "License banned", code: 404 });
          return;
        case "LICENSE_IP_MISMATCH":
          res.status(404).json({ error: "License IP mismatch", code: 404 });
          return;
        case "LICENSE_EXPIRED":
          res.status(404).json({ error: "License expired", code: 404 });
          return;
      }
    }

    res.status(500).json({ error: "Internal server error", code: 500 });
  }
};

