import type { Prisma } from "@vexonac/database";
import { RequestHandler } from "express";
import { z } from "zod";
import { env } from "../../../lib/env";
import { buildBanEmbed, buildRejectedConnectionEmbed, getDiscordConfig, sendWebhook } from "../../../lib/discordWebhook";
import prisma from "../../../lib/prisma";
import { parseIdentifierType } from "../../../lib/utils";
import { websocketService } from "../../../services/websocket.service";

const schema = z.object({
  playerLicense: z.string().min(1, "Player license is required"),
  reason: z.string().min(1, "Ban reason is required"),
  details: z
    .union([
      z.record(
        z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])
      ),
      z.array(z.string()),
    ])
    .optional(),
  evidenceUrl: z.string().url().optional(),
  duration: z.number().optional(),
  bannedBy: z.string().optional(),
  fivemPlayerId: z.string().optional(),
});

export const banPlayer: RequestHandler = async (req, res) => {
  const licenseKey = req.params.licenseKey as string;
  const clientIp = req.clientIp!;

  if (!licenseKey || licenseKey.trim().length === 0) {
    res.status(400).json({
      error: "License key is required in URL",
      code: 400,
    });
    return;
  }

  try {
    const body = schema.parse(req.body);
    const { playerLicense, reason, details, evidenceUrl, duration, bannedBy, fivemPlayerId } =
      body;

    const result = await (
      prisma.$transaction as (
        fn: (tx: Prisma.TransactionClient) => Promise<any>
      ) => Promise<any>
    )(async (tx) => {
      // 1. Verify license exists and is valid
      const license = await tx.license.findUnique({
        where: { licenseKey: licenseKey.trim() },
        select: {
          id: true,
          discordId: true,
          isBanned: true,
          serverIp: true,
          expiresAt: true,
          serverName: true,
          configuration: true,
          serverInfo: {
            select: {
              version: true,
            },
          },
        },
      });

      if (!license) {
        throw new Error("LICENSE_NOT_FOUND");
      }

      if (license.isBanned) {
        throw new Error("LICENSE_BANNED");
      }

      if (license.serverIp && license.serverIp !== clientIp) {
        throw new Error("LICENSE_IP_MISMATCH");
      }

      if (new Date() >= license.expiresAt) {
        throw new Error("LICENSE_EXPIRED");
      }

      // 2. Find the player and collect all their identifiers (current and old)
      const player = await tx.player.findUnique({
        where: {
          licenseId_playerLicense: {
            licenseId: license.id,
            playerLicense,
          },
        },
        select: {
          id: true,
          playerName: true,
          identifiers: true,
          oldIdentifiers: true,
        },
      });

      if (!player) {
        throw new Error("PLAYER_NOT_FOUND");
      }

      // 3. Collect all identifiers (current and historical)
      const currentIdentifiers = Array.isArray(player.identifiers)
        ? (player.identifiers as string[])
        : [];
      const oldIdentifiers = Array.isArray(player.oldIdentifiers)
        ? (player.oldIdentifiers as string[])
        : [];

      const allIdentifiers = [
        ...new Set([...currentIdentifiers, ...oldIdentifiers]),
      ];

      if (allIdentifiers.length === 0) {
        throw new Error("NO_IDENTIFIERS_FOUND");
      }

      // 4. Generate unique 8-digit ban ID for this license
      let banId: string;
      let attempts = 0;
      const maxAttempts = 100;

      do {
        // Generate random 8-digit number (10000000-99999999)
        banId = (Math.floor(Math.random() * 90000000) + 10000000).toString();
        attempts++;

        // Check if this banId already exists for this license
        const existingBan = await tx.ban.findUnique({
          where: {
            licenseId_banId: {
              licenseId: license.id,
              banId,
            },
          },
        });

        if (!existingBan) {
          break; // Found unique banId
        }

        if (attempts >= maxAttempts) {
          throw new Error("UNABLE_TO_GENERATE_UNIQUE_BAN_ID");
        }
      } while (true);

      const expirationDate =
        duration && duration > 0
          ? (() => {
              const calculatedDate = new Date(
                new Date().getTime() + duration * 1000
              );
              return isNaN(calculatedDate.getTime()) ? null : calculatedDate;
            })()
          : null;

      const ban = await tx.ban.create({
        data: {
          playerId: player.id,
          licenseId: license.id,
          banId,
          reason,
          details: details || {},
          evidenceUrl: evidenceUrl || null,
          expiresAt: expirationDate,
          bannedBy: bannedBy || null,
          bannedAt: new Date(),
        },
      });

      await tx.banHistory.create({
        data: {
          playerId: player.id,
          licenseId: license.id,
          reason,
          details: details || {},
          evidenceUrl: evidenceUrl || null,
        },
      });

      // 5. Create banned identifier records — exclude raw session tokens (no known prefix)
      // to prevent false bans on other players who happen to share the same token.
      const KNOWN_ID_PREFIXES = ['license:', 'steam:', 'discord:', 'ip:', 'xbox:', 'live:', 'fivem:', 'fid:', 'sid:', 'sid2:']
      const identifiersForBan = allIdentifiers.filter(id =>
        KNOWN_ID_PREFIXES.some(prefix => id.startsWith(prefix))
      )
      const bannedIdentifierData = (identifiersForBan.length > 0 ? identifiersForBan : allIdentifiers)
        .map((identifier) => ({
          banId: ban.id,
          type: parseIdentifierType(identifier),
          value: identifier,
        }));

      await tx.bannedIdentifier.createMany({
        data: bannedIdentifierData,
        skipDuplicates: true, // Skip if identifier is already banned
      });

      const extract = (prefix: string) =>
        allIdentifiers.find((id) => id.startsWith(prefix))?.slice(prefix.length) ?? null;

      const discordIds = allIdentifiers
        .filter((id) => id.startsWith("discord:"))
        .map((id) => id.replace("discord:", ""));

      const steamId   = extract("steam:");
      const fivemId   = extract("fivem:") ?? extract("fid:");
      const licenseId = extract("license:");
      const xboxId    = extract("xbox:");
      const liveId    = extract("live:");

      const idLines = [
        discordIds.length > 0 ? `**Discord:** ${discordIds.map(id => `<@${id}>`).join(" ")}` : null,
        steamId   ? `**Steam:** \`${steamId}\`` : null,
        fivemId   ? `**FiveM:** \`${fivemId}\`` : null,
        licenseId ? `**License:** \`${licenseId}\`` : null,
        xboxId    ? `**Xbox:** \`${xboxId}\`` : null,
        liveId    ? `**Live:** \`${liveId}\`` : null,
      ].filter(Boolean).join("\n");

      const isEvidenceUrl = evidenceUrl && evidenceUrl.length > 0;
      const isEvidenceVideo =
        evidenceUrl && (evidenceUrl.includes("vexonac-capture.webm") || evidenceUrl.includes("/recordings/"));

      const isPermanentBan = expirationDate === null;
      const expiryText = isPermanentBan
        ? "🔴 Permanent"
        : `⏳ Expires <t:${Math.floor(expirationDate!.getTime() / 1000)}:R>`;

      const descLines = [
        `**Server:** ${license.serverName || "Unknown"}`,
        `**Player:** ${player.playerName}`,
        `**Reason:** ${reason || "No reason provided"}`,
        `**Duration:** ${expiryText}`,
        `**Ban ID:** #${banId}`,
        idLines ? `\n${idLines}` : null,
      ].filter(Boolean).join("\n");

      const v = license.serverInfo?.version || "1.0.0";
      const _now = new Date();
      const _days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
      const _months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
      const _footer = `VexonAC ${v} - ${_days[_now.getUTCDay()]}, ${String(_now.getUTCDate()).padStart(2,"0")} ${_months[_now.getUTCMonth()]} ${_now.getUTCFullYear()} - ${String(_now.getUTCHours()).padStart(2,"0")}:${String(_now.getUTCMinutes()).padStart(2,"0")}:${String(_now.getUTCSeconds()).padStart(2,"0")}`;
      const embed = {
        title: "Player Banned",
        color: 0xed4245,
        description: descLines,
        ...(isEvidenceUrl && !isEvidenceVideo && { image: { url: evidenceUrl } }),
        footer: { text: _footer },
        timestamp: new Date().toISOString(),
      };

      // VexonAC internal monitoring webhook (fire-and-forget — must not block the transaction)
      fetch(env.SERVERS_BAN_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: isEvidenceVideo ? evidenceUrl : undefined,
          embeds: [embed],
        }),
      }).catch((e) => console.error("[BanPlayer] Internal webhook error:", e));

      // Global VexonAC community ban board — post to Discord channel via Bot API
      if (env.GLOBAL_BAN_CHANNEL_ID && env.DISCORD_BOT_TOKEN) {
        const publicIdLines = [
          discordIds.length > 0 ? `**Discord:** ${discordIds.map(id => `<@${id}>`).join(" ")}` : null,
          steamId   ? `**Steam:** \`${steamId}\``   : null,
          fivemId   ? `**FiveM:** \`${fivemId}\``   : null,
          xboxId    ? `**Xbox:** \`${xboxId}\``     : null,
          liveId    ? `**Live:** \`${liveId}\``     : null,
        ].filter(Boolean).join("\n");

        const globalEmbed = {
          title: "New Global Ban",
          color: 0xed4245,
          description: [
            `**Player:** ${player.playerName}`,
            `**Server:** ${license.serverName ?? "Unknown"}`,
            `**Ban ID:** #${banId}`,
            `**Duration:** ${isPermanentBan ? "🔴 Permanent" : `⏳ Expires <t:${Math.floor(expirationDate!.getTime() / 1000)}:R>`}`,
            publicIdLines ? `\n${publicIdLines}` : null,
          ].filter(Boolean).join("\n"),
          ...(isEvidenceUrl && !isEvidenceVideo ? { image: { url: evidenceUrl } } : {}),
          footer: { text: _footer },
          timestamp: new Date().toISOString(),
        };

        fetch(`https://discord.com/api/v10/channels/${env.GLOBAL_BAN_CHANNEL_ID}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bot ${env.DISCORD_BOT_TOKEN}`,
          },
          body: JSON.stringify({
            content: isEvidenceVideo ? `📹 **Evidence:** ${evidenceUrl}` : undefined,
            embeds: [globalEmbed],
          }),
        }).catch(() => {});
      }

      // Customer-configured Discord webhooks
      const dcfg = getDiscordConfig(license.configuration as Record<string, any>);
      if (dcfg.enabled) {
        const videoContent = isEvidenceVideo ? evidenceUrl : undefined;

        // Main ban channel
        if (dcfg.mainWebhook) {
          sendWebhook(dcfg.mainWebhook, { content: videoContent, embeds: [embed] });
        }

        // Dedicated global ban channel (if different URL)
        if (dcfg.globalBanWebhook && dcfg.globalBanWebhook !== dcfg.mainWebhook) {
          sendWebhook(dcfg.globalBanWebhook, { content: videoContent, embeds: [embed] });
        }

        // Public community logs — simplified embed (no identifiers)
        if (dcfg.communityWebhook) {
          const communityEmbed = {
            color: 0xed4245,
            description: [
              `**Player:** ${player.playerName}`,
              `**Reason:** ${reason}`,
              `**Duration:** ${isPermanentBan ? "🔴 Permanent" : `⏳ Expires <t:${Math.floor(expirationDate!.getTime() / 1000)}:R>`}`,
              isEvidenceUrl && !isEvidenceVideo ? null : null,
            ].filter(Boolean).join("\n"),
            ...(isEvidenceUrl && !isEvidenceVideo ? { image: { url: evidenceUrl } } : {}),
            footer:    { text: `VexonAC — ${license.serverName}` },
            timestamp: new Date().toISOString(),
          };
          sendWebhook(dcfg.communityWebhook, {
            content: isEvidenceVideo ? evidenceUrl : undefined,
            embeds: [communityEmbed],
          });
        }
      }

      await tx.serverLog.create({
        data: {
          licenseId: license.id,
          serverType: "BAN_PLAYER",
          playerLicense,
          details: { reason: reason },
        },
      });
      
      const isPermanent = expirationDate === null
      const expiryLine = isPermanent
        ? 'This ban is permanent.'
        : `Expires: ${expirationDate!.toUTCString()}`

      return {
        success: true,
        ban: {
          banId,
          banDbId: ban.id,
          licenseId: license.id,
          playerName: player.playerName,
          playerLicense,
          reason,
          details,
          evidenceUrl,
          expiresAt: expirationDate,
          isPermanent,
          identifiersBanned: allIdentifiers.length,
          kickMessage: `You have been banned from this server.\n\nBan ID: #${banId}\nReason: ${reason}\n${expiryLine}\n\nKeep your Ban ID to appeal this ban.`,
        },
      };
    });

    // If a fivemPlayerId was provided and no evidenceUrl was already set,
    // asynchronously request a screenshot from the game server and attach it.
    if (fivemPlayerId && !body.evidenceUrl && result.success) {
      const { licenseId, banDbId } = result.ban
      setImmediate(async () => {
        try {
          const screenshotUrl = await websocketService.emitToServer(
            licenseId,
            'screenshotPlayer',
            { playerId: fivemPlayerId },
            true,
            14000
          ) as string | null

          if (screenshotUrl && typeof screenshotUrl === 'string') {
            await prisma.ban.update({
              where: { id: banDbId },
              data: { evidenceUrl: screenshotUrl },
            })

            const isVideo = screenshotUrl.includes('/recordings/') || screenshotUrl.includes('vexonac-capture.webm')
            const screenshotEmbed = isVideo ? null : {
              color: 0xed4245,
              description: `**Screenshot — Ban #${result.ban.banId}** (${result.ban.playerName})`,
              image: { url: screenshotUrl },
              footer: { text: `VexonAC` },
              timestamp: new Date().toISOString(),
            }
            const screenshotPayload = isVideo ? { content: screenshotUrl } : { embeds: [screenshotEmbed] }

            // VexonAC internal webhook
            fetch(env.SERVERS_BAN_WEBHOOK_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(screenshotPayload),
            }).catch(() => {})

            // Customer's screenshots webhook (falls back to main)
            const banLicense = await prisma.license.findUnique({
              where: { id: licenseId },
              select: { configuration: true, serverName: true },
            })
            if (banLicense) {
              const sdc = getDiscordConfig(banLicense.configuration as Record<string, any>)
              const ssUrl = sdc.screenshotsWebhook || sdc.mainWebhook
              if (sdc.enabled && ssUrl) {
                sendWebhook(ssUrl, screenshotPayload as object)
              }
            }
          }
        } catch (_) {}
      })
    }

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(
        "BanPlayer ZodError:",
        error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }))
      );
      res.status(400).json({
        error: "Invalid request data",
        details: error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      });
      return;
    }

    console.error("BanPlayer error:", error);

    if (error instanceof Error) {
      switch (error.message) {
        case "LICENSE_NOT_FOUND":
          res.status(404).json({ error: "License not found", code: 404 });
          return;
        case "LICENSE_BANNED":
          res.status(404).json({ error: "License banned", code: 404 });
          return;
        case "LICENSE_EXPIRED":
          res.status(404).json({ error: "License expired", code: 404 });
          return;
        case "PLAYER_NOT_FOUND":
          res.status(404).json({ error: "Player not found", code: 404 });
          return;
        case "LICENSE_IP_MISMATCH":
          res.status(404).json({ error: "License IP mismatch", code: 404 });
          return;
        case "NO_IDENTIFIERS_FOUND":
          res
            .status(404)
            .json({ error: "No identifiers found for player", code: 404 });
          return;
        case "UNABLE_TO_GENERATE_UNIQUE_BAN_ID":
          res
            .status(500)
            .json({ error: "Unable to generate unique ban ID", code: 500 });
          return;
      }
    }

    res.status(500).json({ error: "Internal server error", code: 500 });
  }
};


