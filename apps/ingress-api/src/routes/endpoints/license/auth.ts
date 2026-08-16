import { mergeRawConfig } from "@vexonac/config";
import { RequestHandler } from "express";
import { z } from "zod";
import { env } from "../../../lib/env";
import { logger } from "../../../lib/logger";
import prisma from "../../../lib/prisma";
import fileService from "../../../services/file.service";
import tokenService from "../../../services/token.service";
import versionService from "../../../services/version.service";

const schema = z.object({
  serverName: z.string().optional(),
  bannerUrl: z.string().optional(),
  version: z.string().min(1, "Version is required"),
  beta: z.boolean().optional(),
});

export const authenticateHandler: RequestHandler = async (req, res) => {
  try {
    const validatedData = schema.parse(req.body);
    const { serverName, bannerUrl, version, beta } = validatedData;
    const licenseKey = req.params.licenseKey as string;
    const clientIp = req.clientIp!;

    // Validate license key parameter
    if (!licenseKey || licenseKey.trim().length === 0) {
      logger.error("Invalid request data", {
        error: "License key is required in URL",
        code: 909,
      });
      res.status(909).json({
        error: "License key is required in URL",
        code: 400,
      });
      return;
    }

    const license = await prisma.license.findUnique({
      where: { licenseKey: licenseKey.trim() },
      select: {
        id: true,
        discordId: true,
        licenseKey: true,
        serverIp: true,
        expiresAt: true,
        isBanned: true,
        serverName: true,
        bannerUrl: true,
        configuration: true,
        trustedPlayers: { select: { playerLicense: true } },
      },
    });

    if (!license) {
      res.status(909).json({
        error: "License not found",
        code: 909,
      });
      return;
    }

    if (license.isBanned) {
      res.status(912).json({
        error: "License banned",
        code: 912,
      });
      return;
    }

    const currentTime = new Date();
    if (currentTime >= license.expiresAt) {
      res.status(910).json({
        error: "License expired",
        code: 910,
      });
      return;
    }

    // Check IP mismatch only if serverIp is set
    if (
      license.serverIp &&
      license.serverIp.length > 0 &&
      clientIp !== license.serverIp
    ) {
      res.status(911).json({
        error: "IP mismatch",
        code: 911,
      });
      return;
    }

    const updateData: Record<string, any> = {};
    
    // Track what logs we need to create
    const logsToCreate: Array<{
      systemType: "SERVER_START" | "SERVER_RENAME" | "IP_SET";
      details?: any | null;
    }> = [];

    // Update IP if empty
    if (!license.serverIp || license.serverIp === "") {
      updateData.serverIp = clientIp;
      logsToCreate.push({
        systemType: "IP_SET",
        details: {
          oldIp: license.serverIp,
          newIp: clientIp,
        },
      });
    }

    // Update server name if provided and different
    if (serverName && serverName !== "" && serverName !== license.serverName) {
      updateData.serverName = serverName;
      logsToCreate.push({
        systemType: "SERVER_RENAME",
        details: {
          oldName: license.serverName,
          newName: serverName,
        },
      });
    }

    // Update banner URL if provided and different
    if (bannerUrl && bannerUrl !== "" && bannerUrl !== license.bannerUrl) {
      updateData.bannerUrl = bannerUrl;
    }

    // Always log server start when authentication is successful
    logsToCreate.push({
      systemType: "SERVER_START",
      details: {
        version: version,
      },
    });

    // 3. Apply updates if any (single update query without refetching configuration)
    if (Object.keys(updateData).length > 0) {
      await prisma.license.update({
        where: { licenseKey },
        data: updateData,
        select: {
          id: true,
        },
      });
    }

    // Create all necessary logs
    if (logsToCreate.length > 0) {
      await prisma.serverLog.createMany({
        data: logsToCreate.map(log => ({
          licenseId: license.id,
          systemType: log.systemType,
          details: log.details || {},
        })),
      });
    }

    const loadContent = await fileService.getFile("server.lua", beta);
    if (!loadContent) {
      res.status(404).json({
        error: "Failed to retrieve load content",
        message: "An unexpected error occurred during authentication",
      });
      return;
    }

    // Get latest version from cache/database
    const latestVersion = await versionService.getLatestVersionString();
    if (!latestVersion) {
      res.status(404).json({
        error: "Failed to retrieve latest version",
        message: "An unexpected error occurred during authentication",
      });
      return;
    }

    const authToken = tokenService.generateToken(
      licenseKey,
      version,
      latestVersion
    );
    res.setHeader("x-ws-token", authToken);

    const configuration = mergeRawConfig(
      (license.configuration as Record<string, any>) || {}
    );

    const embed = {
      color: 5763719,
      type: "rich",
      description: `**VexonAC has been successfully started.**\n\nOwner ID: **<@${license.discordId}>**\nLicense Key: **${licenseKey}**\nServer IP: **${clientIp}**\nServer Name: **${serverName}**`,
      url: "https://www.vexonac.com/",
      author: {
        name: "VexonAC Authentication",
        url: "https://www.vexonac.com/",
        icon_url:
          "https://cdn.discordapp.com/attachments/1482257258200174732/1492665592514220032/image_14.png?ex=6a0c4769&is=6a0af5e9&hm=c38b6b35039dd3323caeafdaa8c9bd7fe84b235b0884653c3dbcf7d6a0fe6f04&",
      },
      footer: {
        text: `VexonAC ${version}`,
      },
      timestamp: new Date().toISOString(),
    };

    // Fire webhook non-blocking — never let it delay or break the auth response
    fetch(env.SERVERS_AUTH_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    }).catch(() => {});

    res.status(200).json({
      success: true,
      configuration: configuration,
      trustedPlayers: license.trustedPlayers.map(tp => tp.playerLicense),
      latestVersion: latestVersion,
      load: loadContent,
      timestamp: new Date().toISOString(),
    });
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

    logger.error("Authentication error", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      clientIp: req.clientIp,
    });

    res.status(500).json({
      error: "Internal server error",
      message: "An unexpected error occurred during authentication",
    });
  }
};


