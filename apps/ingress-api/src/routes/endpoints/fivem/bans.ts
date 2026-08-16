import { RequestHandler } from "express";
import prisma from "../../../lib/prisma";

export const fivemBansHandler: RequestHandler = async (req, res) => {
  const apiKey = (req.headers["x-api-key"] as string | undefined)?.trim();
  if (!apiKey) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const license = await prisma.license.findUnique({
      where: { licenseKey: apiKey },
      select: { id: true, isBanned: true, expiresAt: true },
    });

    if (!license || license.isBanned || license.expiresAt <= new Date()) {
      res.status(404).json({ error: "License not found or invalid" });
      return;
    }

    // Trusted (whitelisted) player licenses for this server
    const trustedPlayers = await prisma.trustedPlayer.findMany({
      where: { licenseId: license.id },
      select: { playerLicense: true },
    });

    // Server-specific bans from BannedIdentifier
    const serverBans = await prisma.ban.findMany({
      where: {
        licenseId: license.id,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      select: {
        id:         true,
        banId:      true,
        reason:     true,
        expiresAt:  true,
        identifiers: { select: { value: true } },
      },
    });

    // Approved global bans
    const globalBans: Array<{ id: string; identifiers: string[]; reason: string }> =
      await prisma.$queryRaw`
        SELECT id, identifiers, reason
        FROM global_bans
        WHERE status = 'APPROVED'::"GlobalBanStatus"
      `;

    const bans = [
      ...serverBans.map((b) => ({
        id:          b.banId,
        identifiers: b.identifiers.map((i: { value: string }) => i.value),
        reason:      b.reason ?? "Banned",
        expiry:      b.expiresAt ? Math.floor(b.expiresAt.getTime() / 1000) : 0,
      })),
      ...globalBans.map((g) => ({
        id:          `global_${g.id}`,
        identifiers: g.identifiers,
        reason:      `[Global Ban] ${g.reason}`,
        expiry:      0,
      })),
    ];

    res.status(200).json({ bans, trusted: trustedPlayers.map(t => t.playerLicense) });
  } catch (err) {
    console.error("[bans] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
