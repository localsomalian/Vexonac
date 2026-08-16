import { RequestHandler } from "express";
import { z } from "zod";
import prisma from "../../../lib/prisma";
import { createBan } from "../../../services/ban.service";

const schema = z.object({
  playerName:  z.string(),
  identifiers: z.array(z.string()),
  reason:      z.string(),
  expiry:      z.number().optional(),
  ts:          z.number().optional(),
  auto:        z.boolean().optional(),
  evidenceUrl: z.string().url().optional().nullable(),
});

export const fivemBanHandler: RequestHandler = async (req, res) => {
  const apiKey = (req.headers["x-api-key"] as string | undefined)?.trim();
  if (!apiKey) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const body = schema.parse(req.body);
    const { playerName, identifiers, reason, expiry, evidenceUrl } = body;

    const license = await prisma.license.findUnique({
      where: { licenseKey: apiKey },
      select: {
        id:            true,
        isBanned:      true,
        expiresAt:     true,
        serverName:    true,
        configuration: true,
      },
    });

    if (!license || license.isBanned || license.expiresAt <= new Date()) {
      res.status(404).json({ error: "License not found or invalid" });
      return;
    }

    // Find the license identifier from the submitted identifiers
    const playerLicense = identifiers.find((id) => id.startsWith("license:")) || identifiers[0] || "";

    // Persist ban to database
    let banId = "AUTO";
    try {
      const durationSecs = expiry && expiry > 0 ? expiry - Math.floor(Date.now() / 1000) : 0;
      const banInput: Parameters<typeof createBan>[0] = {
        licenseId:    license.id,
        playerLicense,
        reason,
        playerName,
        identifiers,
        serverName:   license.serverName,
        bannedBy:     "VexonAC Auto",
        ...(evidenceUrl ? { evidenceUrl } : {}),
      };
      if (durationSecs > 0) banInput.duration = durationSecs;
      const result = await createBan(banInput);
      banId = result.banId;

      // Create a global ban record (PENDING — owner approves from dashboard)
      await prisma.$executeRaw`
        INSERT INTO global_bans ("id", "identifiers", "playerName", "reason", "sourceServer", "status", "createdAt", "updatedAt")
        VALUES (
          gen_random_uuid()::text,
          ${identifiers}::text[],
          ${playerName},
          ${reason},
          ${license.serverName},
          'PENDING'::"GlobalBanStatus",
          NOW(),
          NOW()
        )
        ON CONFLICT DO NOTHING
      `;
    } catch (saveErr) {
      console.error("[VexonAC /fivem/ban] Ban save failed for player %s: %s", playerName, saveErr instanceof Error ? saveErr.message : String(saveErr));
    }

    res.status(200).json({ success: true, banId });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid body", details: err.errors });
      return;
    }
    console.error("[ban] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
