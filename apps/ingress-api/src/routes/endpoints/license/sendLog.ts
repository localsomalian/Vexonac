import { RequestHandler } from "express";
import { z } from "zod";
import { logger } from "../../../lib/logger";
import { buildEntityEmbed, buildExplosionEmbed, getDiscordConfig, sendWebhook } from "../../../lib/discordWebhook";
import prisma from "../../../lib/prisma";
import licenseService from "../../../services/license.service";
import { ServerLogType } from "@vexonac/database";

const schema = z.object({
  type: z.enum(["EXPLOSION", "ENTITY_CREATE", "KILL"]),
  playerLicense: z.string().min(1, "Player license is required"),
  playerName:    z.string().optional(),
  playerId:      z.string().optional(),
  details: z
    .union([
      z.record(z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])),
      z.array(z.string()),
    ])
    .optional(),
});

export const sendLogHandler: RequestHandler = async (req, res) => {
  try {
    const validatedData = schema.parse(req.body);
    const { type, playerLicense, playerName, playerId, details } = validatedData;
    const licenseKey = req.params.licenseKey as string;
    const clientIp   = req.clientIp!;

    const { valid, license } = await licenseService.validateServerQuery(licenseKey, clientIp);
    if (!valid || !license) {
      res.status(400).json({ error: "Error validating server authentication" });
      return;
    }

    await prisma.serverLog.create({
      data: {
        licenseId:     license.id,
        serverType:    type as ServerLogType,
        details:       details || {},
        playerLicense,
        playerId:      playerId || null,
      },
    });

    // Fire Discord webhook after DB write, non-blocking
    setImmediate(async () => {
      try {
        const lic = await prisma.license.findUnique({
          where:  { id: license.id },
          select: { configuration: true, serverName: true },
        });
        if (!lic) return;

        const dcfg       = getDiscordConfig(lic.configuration as Record<string, any>);
        if (!dcfg.enabled) return;

        const detailsObj = (Array.isArray(details) ? {} : details) as Record<string, any>;
        const pName      = playerName || playerLicense;

        if (type === "ENTITY_CREATE" && dcfg.entitiesWebhook) {
          sendWebhook(dcfg.entitiesWebhook, {
            embeds: [buildEntityEmbed({
              serverName:    lic.serverName,
              playerName:    pName,
              playerLicense,
              type:          (detailsObj.entityType as string) || "unknown",
              details:       detailsObj,
            })],
          });
        }

        if (type === "EXPLOSION" && dcfg.explosionsWebhook) {
          sendWebhook(dcfg.explosionsWebhook, {
            embeds: [buildExplosionEmbed({
              serverName:    lic.serverName,
              playerName:    pName,
              playerLicense,
              details:       detailsObj,
            })],
          });
        }
      } catch (_) {}
    });

    res.status(200).json({ success: true, timestamp: new Date().toISOString() });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "Invalid request data",
        details: error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      });
      return;
    }

    logger.error("Server Log Error", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      clientIp: req.clientIp,
    });

    res.status(500).json({
      error: "Internal server error",
      message: "An unexpected error occurred during server log sending",
    });
  }
};
