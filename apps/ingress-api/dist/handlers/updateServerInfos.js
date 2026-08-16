import { randomUUID } from "crypto";
import prisma from "../lib/prisma";
import { batchUpdateService } from "../services/batch-update.service";
// Initialize the batch processor for server updates
batchUpdateService.createBatchProcessor({
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
        await prisma.$executeRaw `
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
    },
});
export const updateServerInfos = (socket, data) => {
    const serverId = socket.data.serverId;
    if (!serverId)
        return;
    // Add update to batch with the serverId as key to prevent duplicates
    batchUpdateService.addToBatch("server-updates", serverId, {
        licenseId: serverId,
        version: socket.data.version,
        playerCount: data.players.length,
        maxSlots: data.slots,
        playerList: data.players,
    });
};
