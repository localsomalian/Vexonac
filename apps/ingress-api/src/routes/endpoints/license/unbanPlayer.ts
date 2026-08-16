import { RequestHandler } from "express";
import { z } from "zod";
import { buildUnbanEmbed, getDiscordConfig, sendWebhook } from "../../../lib/discordWebhook";
import prisma from "../../../lib/prisma";
import { r2DeleteService } from "../../../lib/r2-delete-service";
import licenseService from "../../../services/license.service";

const schema = z.object({
  banId: z.string().min(1, "Ban ID is required"),
  unbannedBy: z.string().optional(),
});

export const unbanPlayer: RequestHandler = async (req, res) => {
  const licenseKey = req.params.licenseKey as string;
  const clientIp = req.clientIp!;
  const body = schema.parse(req.body);
  const { banId, unbannedBy } = body;

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
        include: {
          identifiers: true,
        },
      });

      if (!ban) {
        throw new Error("BAN_NOT_FOUND");
      }

      // 3. Delete all banned identifiers associated with this ban
      await tx.bannedIdentifier.deleteMany({
        where: {
          banId: ban.id,
        },
      });

      // 4. Delete the ban record
      await tx.ban.delete({
        where: {
          id: ban.id,
        },
      });

      await tx.serverLog.create({
        data: {
          licenseId: license.id,
          serverType: "UNBAN_PLAYER",
          details: { banId: banId, unbannedBy: unbannedBy },
        },
      });

      return {
        success: true,
        unban: {
          banId,
          reason: ban.reason,
          evidenceUrl: ban.evidenceUrl,
          identifiersUnbanned: ban.identifiers.length,
          unbannedBy,
          unbannedAt: new Date(),
        },
      };
    });

    // Send to customer's UnbansWebhook, non-blocking
    setImmediate(async () => {
      try {
        const lic = await prisma.license.findUnique({
          where:  { id: license.id },
          select: { configuration: true, serverName: true },
        });
        if (!lic) return;
        const dcfg = getDiscordConfig(lic.configuration as Record<string, any>);
        if (dcfg.enabled && dcfg.unbansWebhook) {
          const unbanOpts: { serverName: string; banId: string; reason?: string; unbannedBy?: string } = {
            serverName: lic.serverName,
            banId,
          };
          if (result.unban.reason) unbanOpts.reason = result.unban.reason;
          if (unbannedBy) unbanOpts.unbannedBy = unbannedBy;
          sendWebhook(dcfg.unbansWebhook, { embeds: [buildUnbanEmbed(unbanOpts)] });
        }
      } catch (_) {}
    });

    // Delete evidence from R2 storage if it exists
    if (result.unban.evidenceUrl && result.unban.evidenceUrl.includes('r2.vexonac.com') && r2DeleteService) {
      try {
        const deleteResult = await r2DeleteService.deleteByUrls(result.unban.evidenceUrl);
        if (deleteResult.successCount > 0) {
          console.log(`Successfully deleted evidence file for ban ${banId}`);
        } else {
          console.warn(`Failed to delete evidence file for ban ${banId}`);
        }
      } catch (error) {
        console.error(`Failed to delete evidence file for ban ${banId}:`, error);
        // Don't affect the response as unban was successful
      }
    }

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

