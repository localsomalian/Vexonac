import type { Prisma } from "@vexonac/database";
import { RequestHandler } from "express";
import { z } from "zod";
import prisma from "../../../lib/prisma";
import licenseService from "../../../services/license.service";

const schema = z.object({
  playerLicense: z.string().min(1, "Player license is required"),
  timeOnline: z.number().min(0, "Time online is required"),
});

export const savePlayTime: RequestHandler = async (req, res) => {
  const licenseKey = req.params.licenseKey as string;
  const clientIp = req.clientIp!;
  const body = schema.parse(req.body);
  const { playerLicense, timeOnline } = body;

  const { valid, license } = await licenseService.validateServerQuery(licenseKey, clientIp);
  if (!valid || !license) {
    res.status(400).json({
      error: "Error validating server authentication",
    });
    return;
  }

  try {
    // Start transaction for atomic operations
    const result = await (
      prisma.$transaction as (
        fn: (tx: Prisma.TransactionClient) => Promise<any>
      ) => Promise<any>
    )(async (tx) => {
      const player = await tx.player.update({
        where: {
          licenseId_playerLicense: {
            licenseId: license.id,
            playerLicense,
          },
        },
        data: {
          playTime: {
            increment: parseInt(timeOnline.toFixed()),
          },
        },
        select: {
          playTime: true,
        },
      });

      await tx.serverLog.create({
        data: {
          licenseId: license.id,
          serverType: "PLAYER_LEAVE",
          playerLicense: playerLicense,
        },
      });

      return {
        success: true,
        playTime: player.playTime || 0,
      };
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("SavePlayTime error:", error);
    res.status(500).json({ error: "Internal server error", code: 500 });
  }
};

