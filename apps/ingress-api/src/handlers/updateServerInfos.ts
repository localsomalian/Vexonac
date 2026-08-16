import { PlayerData } from "@vexonac/types";
import { randomUUID } from "crypto";
import { Socket } from "socket.io";
import prisma from "../lib/prisma";
import { batchUpdateService } from "../services/batch-update.service";

interface ServerInfos {
  players: PlayerData[];
  slots: number;
}

interface ServerUpdateData {
  licenseId: string;
  version: string;
  playerCount: number;
  maxSlots: number;
  playerList: PlayerData[];
}

// Truncate a date to the nearest 5-minute boundary for metrics bucketing
function truncateTo5Min(d: Date): Date {
  const ms = d.getTime();
  return new Date(ms - (ms % (5 * 60 * 1000)));
}

// Initialize the batch processor for server updates
batchUpdateService.createBatchProcessor<ServerUpdateData>({
  name: "server-updates",
  config: {
    batchSize: 100,
    batchDelayMs: 5000, // Regular batching interval
  },
  processBatch: async (items) => {
    const ids = [];
    const licenseIds = [];
    const versions = [];
    const isOnlines = [];
    const playerCounts = [];
    const maxSlots = [];
    const playerLists = [];
    const updatedAts = [];
    const lastActiveAts = [];

    for (const item of items) {
      ids.push(randomUUID());
      licenseIds.push(item.data.licenseId);
      versions.push(item.data.version);
      isOnlines.push(true);
      playerCounts.push(item.data.playerCount);
      maxSlots.push(item.data.maxSlots);
      playerLists.push(JSON.stringify(item.data.playerList));
      updatedAts.push(item.timestamp);
      lastActiveAts.push(item.timestamp);
    }

    await prisma.$executeRaw`
      INSERT INTO "server_infos" (
        "id", "licenseId", "version", "isOnline",
        "playerCount", "maxSlots", "playerList",
        "updatedAt", "lastActiveAt"
      )
      SELECT * FROM UNNEST(
        ${ids}::uuid[], ${licenseIds}::text[], ${versions}::text[], ${isOnlines}::bool[],
        ${playerCounts}::int[], ${maxSlots}::int[], ${playerLists}::jsonb[],
        ${updatedAts}::timestamptz[], ${lastActiveAts}::timestamptz[]
      )
      ON CONFLICT ("licenseId") DO UPDATE SET
        "version" = EXCLUDED."version",
        "isOnline" = EXCLUDED."isOnline",
        "playerCount" = EXCLUDED."playerCount",
        "maxSlots" = EXCLUDED."maxSlots",
        "playerList" = EXCLUDED."playerList",
        "updatedAt" = EXCLUDED."updatedAt",
        "lastActiveAt" = EXCLUDED."lastActiveAt"
    `;

    // Record a metrics snapshot per server per 5-min bucket
    const metricIds: string[] = [];
    const metricLicenseIds: string[] = [];
    const metricTimestamps: Date[] = [];
    const metricPlayerCounts: number[] = [];

    // Deduplicate: keep latest playerCount per licenseId within this batch
    const latestByLicense = new Map<string, { playerCount: number; timestamp: Date }>();
    for (const item of items) {
      const existing = latestByLicense.get(item.data.licenseId);
      if (!existing || item.timestamp > existing.timestamp) {
        latestByLicense.set(item.data.licenseId, {
          playerCount: item.data.playerCount,
          timestamp: item.timestamp,
        });
      }
    }

    for (const [licenseId, { playerCount, timestamp }] of latestByLicense) {
      metricIds.push(randomUUID());
      metricLicenseIds.push(licenseId);
      metricTimestamps.push(truncateTo5Min(timestamp));
      metricPlayerCounts.push(playerCount);
    }

    if (metricIds.length > 0) {
      await prisma.$executeRaw`
        INSERT INTO "server_metrics" (
          "id", "licenseId", "timestamp", "playerCount", "banCount", "createdAt"
        )
        SELECT
          u.id::uuid,
          u.licenseId,
          u.ts,
          u.playerCount,
          COALESCE((
            SELECT COUNT(*) FROM "bans" b
            JOIN "licenses" l ON l.id = b."licenseId"
            WHERE l.id = u.licenseId
          ), 0)::int,
          NOW()
        FROM UNNEST(
          ${metricIds}::uuid[],
          ${metricLicenseIds}::text[],
          ${metricTimestamps}::timestamptz[],
          ${metricPlayerCounts}::int[]
        ) AS u(id, licenseId, ts, playerCount)
        ON CONFLICT ("licenseId", "timestamp") DO UPDATE SET
          "playerCount" = EXCLUDED."playerCount",
          "banCount" = EXCLUDED."banCount"
      `;
    }
  },
});

export const updateServerInfos = (socket: Socket, data: ServerInfos) => {
  const serverId = socket.data.serverId;
  if (!serverId) return;

  // Add update to batch with the serverId as key to prevent duplicates
  batchUpdateService.addToBatch<ServerUpdateData>("server-updates", serverId, {
    licenseId: serverId,
    version: socket.data.version,
    playerCount: data.players.length,
    maxSlots: data.slots,
    playerList: data.players,
  });
};

