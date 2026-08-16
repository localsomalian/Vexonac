import { RequestHandler } from "express";
import { z } from "zod";
import prisma from "../../../lib/prisma";

const schema = z.object({
  playerName:  z.string(),
  identifiers: z.array(z.string()),
  elapsedMs:   z.number(),
  dropReason:  z.string().optional(),
  ts:          z.number().optional(),
});

export const ragequitHandler: RequestHandler = async (req, res) => {
  const apiKey = (req.headers["x-api-key"] as string | undefined)?.trim();
  if (!apiKey) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const body = schema.parse(req.body);

    const license = await prisma.license.findUnique({
      where: { licenseKey: apiKey },
      select: { id: true, isBanned: true, expiresAt: true },
    });

    if (!license || license.isBanned || license.expiresAt <= new Date()) {
      res.status(404).json({ error: "License not found or invalid" });
      return;
    }

    await prisma.serverLog.create({
      data: {
        licenseId:  license.id,
        serverType: "PLAYER_LEAVE",
        details: {
          ragequit:   true,
          playerName: body.playerName,
          elapsedMs:  body.elapsedMs,
          dropReason: body.dropReason ?? "unknown",
        },
      },
    });

    res.status(200).json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid body", details: err.errors });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
  }
};
