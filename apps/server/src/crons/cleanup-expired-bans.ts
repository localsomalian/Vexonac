import { createPrismaClient } from "@vexonac/database";
import { cronLogger } from "./index";

// Create a dedicated Prisma client for this cron job
const prisma = createPrismaClient({ log: false });

/**
 * Clean up expired bans from the database
 * Removes bans where expiresAt is in the past
 */
export async function cleanupExpiredBans(): Promise<void> {
  try {
    cronLogger.info("Starting expired bans cleanup");

    const now = new Date();

    // First, get count of expired bans for logging
    const expiredBansCount = await prisma.ban.count({
      where: {
        expiresAt: {
          lte: now,
        },
      },
    });

    if (expiredBansCount === 0) {
      cronLogger.info("No expired bans found");
      return;
    }

    cronLogger.info(`Found ${expiredBansCount} expired bans to clean up`);

    // Delete all expired bans in one operation
    const deleteResult = await prisma.ban.deleteMany({
      where: {
        expiresAt: {
          lte: now,
        },
      },
    });

    cronLogger.info("Expired bans cleanup completed", {
      totalDeleted: deleteResult.count,
    });
  } catch (error) {
    cronLogger.error("Failed to cleanup expired bans", error as Error);
    throw error;
  }
}

