import prisma from "../lib/prisma";
import { batchUpdateService } from "../services/batch-update.service";
// Initialize the batch processor for server shutdowns
batchUpdateService.createBatchProcessor({
    name: "server-shutdown",
    config: {
        batchSize: 50,
        batchDelayMs: 10000, // Process shutdowns faster than regular updates
    },
    processBatch: async (items) => {
        const licenseIds = items.map((item) => item.data.licenseId);
        const updatedAts = items.map((item) => item.timestamp);
        await prisma.$executeRaw `
      UPDATE "server_infos" 
      SET 
        "isOnline" = false,
        "playerCount" = 0,
        "playerList" = '[]'::jsonb,
        "updatedAt" = data_table."updatedAt"
      FROM (
        SELECT UNNEST(${licenseIds}::text[]) as "licenseId",
               UNNEST(${updatedAts}::timestamptz[]) as "updatedAt"
      ) as data_table
      WHERE "server_infos"."licenseId" = data_table."licenseId"
    `;
    },
});
export const onServerShutdown = (socket) => {
    const serverId = socket.data.serverId;
    if (!serverId)
        return;
    // Add shutdown to batch with the serverId as key to prevent duplicates
    batchUpdateService.addToBatch("server-shutdown", serverId, { licenseId: serverId });
};
