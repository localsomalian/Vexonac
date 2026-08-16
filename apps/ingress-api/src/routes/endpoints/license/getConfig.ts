import { mergeRawConfig } from "@vexonac/config";
import { RequestHandler } from "express";
import prisma from "../../../lib/prisma";

export const getConfigHandler: RequestHandler = async (req, res) => {
  try {
    const licenseKey = req.params.licenseKey as string;
    const clientIp = req.clientIp!;

    if (!licenseKey || licenseKey.trim().length === 0) {
      res.status(400).json({
        error: "License key is required in URL",
        code: 400,
      });
      return;
    }

    const license = await prisma.license.findUnique({
      where: {
        licenseKey: licenseKey.trim(),
        serverIp: clientIp,
        expiresAt: { gt: new Date() },
        isBanned: false,
      },
      select: {
        configuration: true,
      },
    });

    if (!license) {
      res.status(400).json({ error: "Invalid license data" });
      return;
    }

    const raw = (license.configuration as Record<string, any>) || {};
    const configuration = mergeRawConfig(raw);

    res.status(200).json({
      success: true,
      configuration: configuration,
      // Adaptive false-positive calibration: detection codes → FP count
      // Higher count = more false positives recorded; resource reduces pts accordingly
      calibration: (raw._fpCounts as Record<string, number>) ?? {},
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(400).json({ error: "Invalid request data" });
  }
};

