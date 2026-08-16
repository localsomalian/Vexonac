import { RequestHandler } from "express";
import { z } from "zod";
import { buildConnectionEmbed, getDiscordConfig, sendWebhook } from "../../../lib/discordWebhook";
import prisma from "../../../lib/prisma";

const schema = z.object({
  playerName:    z.string(),
  playerLicense: z.string(),
  identifiers:   z.array(z.string()),
});

export const joinHandler: RequestHandler = async (req, res) => {
  const apiKey = (req.headers["x-api-key"] as string | undefined)?.trim();
  if (!apiKey) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const body = schema.parse(req.body);
    const { playerName, playerLicense, identifiers } = body;

    const license = await prisma.license.findUnique({
      where: { licenseKey: apiKey },
      select: {
        id:            true,
        isBanned:      true,
        expiresAt:     true,
        serverName:    true,
        configuration: true,
        serverInfo:    { select: { version: true } },
      },
    });

    if (!license || license.isBanned || license.expiresAt <= new Date()) {
      res.status(404).json({ error: "License not found or invalid" });
      return;
    }

    const dcfg = getDiscordConfig(license.configuration as Record<string, any>);
    if (dcfg.enabled && dcfg.connectionsWebhook) {
      sendWebhook(dcfg.connectionsWebhook, {
        embeds: [buildConnectionEmbed({
          serverName:    license.serverName,
          playerName,
          playerLicense,
          identifiers,
          action:        "joined",
          version:       license.serverInfo?.version ?? null,
        })],
      });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid body", details: err.errors });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
  }
};
