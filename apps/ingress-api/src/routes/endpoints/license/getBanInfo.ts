import { RequestHandler } from "express";
import { z } from "zod";
import prisma from "../../../lib/prisma";
import licenseService from "../../../services/license.service";

const schema = z.object({
  banId: z.string().min(1, "Ban ID is required"),
});

export const getBanInfo: RequestHandler = async (req, res) => {
  const licenseKey = req.params.licenseKey as string;
  const clientIp = req.clientIp!;
  const body = schema.parse(req.body);
  const { banId } = body;

  const { valid, license } = await licenseService.validateServerQuery(licenseKey, clientIp);
  if (!valid || !license) {
    res.status(400).json({
      error: "Error validating server authentication",
    });
    return;
  }

  try {
    const result = await (prisma.$transaction as any)(async (tx: any) => {
      // 2. Find the ban record
      const ban = await tx.ban.findUnique({
        where: {
          licenseId_banId: {
            licenseId: license.id,
            banId,
          },
        },
        select: {
          banId: true,
          reason: true,
          details: true,
          evidenceUrl: true,
          expiresAt: true,
          bannedBy: true,
          bannedAt: true,
          identifiers: {
            select: {
              type: true,
              value: true,
            },
          },
          player: {
            select: {
              playerName: true,
              playTime: true,
              lastJoin: true,
              firstJoin: true,
            },
          },
        },
      });

      if (!ban) {
        throw new Error("BAN_NOT_FOUND");
      }

      return {
        success: true,
        ban: {
          playerName: ban.player.playerName,
          playTime: ban.player.playTime,
          lastJoin: ban.player.lastJoin,
          firstJoin: ban.player.firstJoin,
          banId: Number(ban.banId),
          reason: ban.reason || "No reason provided",
          details: ban.details || [],
          isPermanent: ban.expiresAt === null,
          evidenceUrl: ban.evidenceUrl,
          bannedBy: ban.bannedBy || "VexonAC",
          bannedAt: ban.bannedAt,
          expiresAt: ban.expiresAt,
          identifiers: ban.identifiers.map((identifier: any) => identifier.value),
        }
      };
    });

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error) {
      switch (error.message) {
        case "BAN_NOT_FOUND":
          res.status(404).json({ error: "Ban not found", code: 404 });
          return;
      }
    }

    res.status(500).json({ error: "Internal server error", code: 500 });
  }
};
