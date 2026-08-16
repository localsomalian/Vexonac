import type { Prisma } from "@vexonac/database";
import { calculateTrustScore } from "@vexonac/utils";
import { RequestHandler } from "express";
import { z } from "zod";
import prisma from "../../../lib/prisma";
import { parseIdentifierType } from "../../../lib/utils";
import licenseService from "../../../services/license.service";

const schema = z.object({
  playerLicense: z.string().min(1, "Player license is required"),
  extraIdentifiers: z.array(z.string()).min(1, "Extra identifiers is required"),
});

export const checkTokens: RequestHandler = async (req, res) => {
  const licenseKey = req.params.licenseKey as string;
  const clientIp = req.clientIp!;

  try {
    const body = schema.parse(req.body);
    const { extraIdentifiers, playerLicense } = body;

    const { valid, license } = await licenseService.validateServerQuery(licenseKey, clientIp);
    if (!valid || !license) {
      res.status(400).json({
        error: "Error validating server authentication",
      });
      return;
    }
    
    // Start transaction for atomic operations
    const result = await (
      prisma.$transaction as (
        fn: (tx: Prisma.TransactionClient) => Promise<any>
      ) => Promise<any>
    )(async (tx) => {
      // 1. Check for active (non-expired) bans using optimized query
      const activeBan = await tx.bannedIdentifier.findFirst({
        where: {
          value: { in: extraIdentifiers },
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
        // Add extra identifiers to the ban record (fid:/sid: only, not raw tokens)
        const KNOWN_ID_PREFIXES = ['license:', 'steam:', 'discord:', 'ip:', 'xbox:', 'live:', 'fivem:', 'fid:', 'sid:', 'sid2:']
        const realExtraIds = extraIdentifiers.filter(id =>
          KNOWN_ID_PREFIXES.some(prefix => id.startsWith(prefix))
        )
        const bannedIdentifierData = realExtraIds.map((identifier) => ({
          banId: activeBan.ban.id,
          type: parseIdentifierType(identifier),
          value: identifier,
        }));

        if (bannedIdentifierData.length > 0) {
          await tx.bannedIdentifier.createMany({
            data: bannedIdentifierData,
            skipDuplicates: true,
          });
        }

        return {
          banned: true,
          ban: {
            banId: activeBan.ban.banId,
            reason: activeBan.ban.reason,
            details: activeBan.ban.details,
            evidenceUrl: activeBan.ban.evidenceUrl,
            expiresAt: activeBan.ban.expiresAt,
            isPermanent: activeBan.ban.expiresAt === null,
          },
        };
      }

      // 3. Update server-specific player record with identifier tracking
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
        },
      });

      if (!existingPlayer) {
        throw new Error("PLAYER_NOT_FOUND");
      }

      let allIdentifiers: string[] = [];

      const currentDbIds = Array.isArray(existingPlayer.identifiers)
        ? (existingPlayer.identifiers as string[])
        : [];

      allIdentifiers = [
        ...new Set([
          ...currentDbIds.filter((id) => !id.startsWith("fid:")),
          ...extraIdentifiers,
        ]),
      ];

      const updatedPlayer = await tx.player.update({
        where: {
          licenseId_playerLicense: {
            licenseId: license.id,
            playerLicense,
          },
        },
        data: {
          identifiers: allIdentifiers,
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

      return {
        banned: false,
        threatScore: threatScoreResult.score,
      };
    });

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(
        "CheckTokens ZodError:",
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

    console.error("CheckTokens error:", error);

    if (error instanceof Error) {
      switch (error.message) {
        case "PLAYER_NOT_FOUND":
          res.status(404).json({ error: "Player not found", code: 404 });
          return;
      }
    }

    res.status(500).json({ error: "Internal server error", code: 500 });
  }
};

