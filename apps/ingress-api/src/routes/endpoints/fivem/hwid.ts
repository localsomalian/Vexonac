import { RequestHandler } from "express";
import { z } from "zod";
import prisma from "../../../lib/prisma";

const schema = z.object({
  token:       z.string().min(1),
  playerName:  z.string().optional(),
  identifiers: z.array(z.string()).optional(),
  meta:        z.record(z.unknown()).optional(),
  ts:          z.number().optional(),
});

export const hwidHandler: RequestHandler = async (req, res) => {
  const apiKey = (req.headers["x-api-key"] as string | undefined)?.trim();
  if (!apiKey) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const body = schema.parse(req.body);
    const { token } = body;

    const license = await prisma.license.findUnique({
      where: { licenseKey: apiKey },
      select: { id: true, isBanned: true, expiresAt: true },
    });

    if (!license || license.isBanned || license.expiresAt <= new Date()) {
      res.status(404).json({ error: "License not found or invalid" });
      return;
    }

    // Check if the HWID token is banned on this server (TOKEN or FINGERPRINT type)
    const bannedEntry = await prisma.bannedIdentifier.findFirst({
      where: {
        value: token,
        type: { in: ["TOKEN", "FINGERPRINT", "HWID"] },
        ban: {
          licenseId: license.id,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
      },
      select: {
        ban: { select: { banId: true, reason: true } },
      },
    });

    if (bannedEntry) {
      res.status(200).json({
        banned: true,
        reason: bannedEntry.ban.reason,
        banId:  bannedEntry.ban.banId,
      });
      return;
    }

    res.status(200).json({ banned: false });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid body", details: err.errors });
      return;
    }
    console.error("[hwid] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
