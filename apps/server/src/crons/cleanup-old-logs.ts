import { subDays } from "date-fns";
import { createPrismaClient } from "@vexonac/database";
import { cronLogger } from "./index";

// Create a dedicated Prisma client for this cron job
const prisma = createPrismaClient({ log: false });

/**
 * Clean up old server logs that are older than 30 days
 * Removes logs where createdAt is older than 30 days
 */
export async function cleanupOldLogs(): Promise<void> {
  try {
    cronLogger.info("Starting cleanup of old server logs");

    const cutoffDate = subDays(new Date(), 30);

    // First, get count of old logs for logging
    const oldLogsCount = await prisma.serverLog.count({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    if (oldLogsCount === 0) {
      cronLogger.info("No old logs found to clean up");
      return;
    }

    cronLogger.info(`Found ${oldLogsCount} old logs to clean up`, {
      cutoffDate: cutoffDate.toISOString(),
    });

    // Delete all old logs in one operation
    const deleteResult = await prisma.serverLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    cronLogger.info("Cleanup of old server logs completed", {
      deletedCount: deleteResult.count,
      cutoffDate: cutoffDate.toISOString(),
    });
  } catch (error) {
    cronLogger.error("Failed to cleanup old server logs", error as Error);
    throw error;
  }
} 
