import { createPrismaClient } from "@vexonac/database";
import { cronLogger } from "./index";

// Create a dedicated Prisma client for this cron job
const prisma = createPrismaClient({ log: false });

/**
 * Update global statistics
 */
export async function updateGlobalStats(): Promise<void> {
  try {
    cronLogger.info("Starting global statistics update");

    // Round timestamp to the current hour
    const currentHour = new Date();
    currentHour.setMinutes(0, 0, 0);

    // Calculate statistics
    const totalServers = await prisma.license.count();
    const _onlineServers = await prisma.serverInfo.findMany({
      where: {
        isOnline: true,
      },
      select: {
        playerCount: true,
      },
    });

    const onlineServers = _onlineServers.length;
    const onlinePlayers = _onlineServers.reduce(
      (sum, server) => sum + (server.playerCount || 0),
      0
    );

    cronLogger.info(
      `Global stats: ${onlineServers}/${totalServers} servers online, ${onlinePlayers} players`
    );

    // Check if stats for this hour already exist
    const existingStats = await prisma.globalStats.findFirst({
      where: {
        timestamp: currentHour,
      },
    });

    if (!existingStats) {
      // Create new stats entry
      await prisma.globalStats.create({
        data: {
          timestamp: currentHour,
          onlineServers,
          onlinePlayers,
          totalServers,
        },
      });
      cronLogger.info("Created new global statistics entry");
    } else {
      // Update existing stats
      await prisma.globalStats.update({
        where: { id: existingStats.id },
        data: {
          onlineServers,
          onlinePlayers,
          totalServers,
        },
      });
      cronLogger.info("Updated existing global statistics entry");
    }

    // Cleanup old stats (older than 7 days)
    const cleanupDate = new Date();
    cleanupDate.setDate(cleanupDate.getDate() - 7);

    const deletedCount = await prisma.globalStats.deleteMany({
      where: {
        timestamp: {
          lt: cleanupDate,
        },
      },
    });

    if (deletedCount.count > 0) {
      cronLogger.info(
        `Cleaned up ${deletedCount.count} old global statistics entries`
      );
    }

    cronLogger.info("Global statistics update completed successfully");
  } catch (error) {
    cronLogger.error("Failed to update global statistics", error as Error);
    throw error;
  }
}

