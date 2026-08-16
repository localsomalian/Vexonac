import { RequestHandler } from "express";
import { z } from "zod";
import prisma from "../../../lib/prisma";
import { websocketService } from "../../../services/websocket.service";

const schema = z.object({
  playerName:    z.string(),
  identifiers:   z.array(z.string()),
  screenshotUrl: z.string().url().optional().nullable(),
  detection: z.object({
    code:       z.string(),
    pts:        z.number(),
    evidence:   z.record(z.any()).optional(),
    ts:         z.number(),
    totalScore: z.number(),
  }),
});

// mirrors include.lua VexonAC.Det severity values
const CODE_SEVERITY: Record<string, string> = {
  INVINCIBLE:      "CRITICAL",
  GODMODE:         "HIGH",
  NOCLIP:          "HIGH",
  SPEED_HACK:      "HIGH",
  SUPER_JUMP:      "MEDIUM",
  TELEPORT:        "HIGH",
  EXPLOSION_SPAM:  "HIGH",
  BLACKLIST_WEP:   "MEDIUM",
  BLACKLIST_VEH:   "LOW",
  ENTITY_SPAM:     "HIGH",
  INFINITE_AMMO:   "MEDIUM",
  RAPID_HEAL:      "HIGH",
  INVISIBLE:       "HIGH",
  RESOURCE_INJECT: "CRITICAL",
  FREEZE_HACK:     "MEDIUM",
  DAMAGE_MOD:      "HIGH",
  MENU_DETECTED:   "CRITICAL",
  NET_FLOOD:       "HIGH",
  VEHICLE_SPAWN:   "LOW",
  SUPER_DAMAGE:    "HIGH",
  OBJ_SPAM:        "HIGH",
  SPECTATOR_ABUSE: "MEDIUM",
  AIMBOT:          "HIGH",
  FREECAM:         "MEDIUM",
  HWID_BAN:        "CRITICAL",
  ECONOMY_EXPLOIT: "HIGH",
};

export const detectionHandler: RequestHandler = async (req, res) => {
  const apiKey = (req.headers["x-api-key"] as string | undefined)?.trim();
  if (!apiKey) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const body = schema.parse(req.body);
    const { playerName, identifiers, detection, screenshotUrl } = body;

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

    // Persist detection to DB for the dashboard
    const player = await prisma.player.findUnique({
      where: {
        licenseId_playerLicense: {
          licenseId: license.id,
          playerLicense: identifiers.find((id) => id.startsWith("license:")) ?? identifiers[0] ?? "",
        },
      },
      select: { id: true },
    }).catch(() => null);

    const severity = CODE_SEVERITY[detection.code] ?? "LOW";
    const filteredIds = identifiers.filter((id) =>
      ["license:", "steam:", "discord:", "fivem:", "fid:"].some((p) => id.startsWith(p))
    ).slice(0, 6);

    const evidenceData = {
      ...(detection.evidence ?? {}),
      ...(screenshotUrl ? { screenshotUrl } : {}),
    };

    await prisma.serverLog.create({
      data: {
        licenseId:  license.id,
        serverType: "DETECTION",
        playerLicense: identifiers.find((id) => id.startsWith("license:")) ?? identifiers[0] ?? null,
        playerId:   player?.id ?? null,
        details: {
          playerName,
          code:        detection.code,
          pts:         detection.pts,
          totalScore:  detection.totalScore,
          evidence:    evidenceData,
          severity,
          identifiers: filteredIds,
        },
      },
    }).catch(() => {}); // non-blocking

    // Push real-time alert to panel clients for HIGH/CRITICAL detections
    if (severity === "CRITICAL" || severity === "HIGH") {
      websocketService.emitDetectionAlert(license.id, {
        playerName,
        code:        detection.code,
        severity,
        pts:         detection.pts,
        totalScore:  detection.totalScore,
        screenshotUrl: screenshotUrl ?? null,
        identifiers: filteredIds,
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
