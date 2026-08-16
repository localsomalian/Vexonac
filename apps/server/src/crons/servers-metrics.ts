import { createPrismaClient } from "@vexonac/database";
import { cronLogger } from "./index";

// Create a dedicated Prisma client for this cron job
const prisma = createPrismaClient({ log: false });

/**
 * Update server metrics
 */
export async function updateServerMetrics(): Promise<void> {
  try {
    cronLogger.info("Starting server metrics update");

    // Round timestamp to the current hour
    const currentHour = new Date();
    currentHour.setMinutes(0, 0, 0);

    // Get all active servers (not expired and not banned)
    const activeServers = await prisma.license.findMany({
      where: {
        serverInfo: {
          isOnline: true,
        },
      },
      include: {
        serverInfo: true,
        _count: {
          select: {
            bans: true,
          },
        },
      },
    });

    cronLogger.info(`Found ${activeServers.length} active servers to process`);

    // Process each server
    const metricsToCreate = [];

    for (const server of activeServers) {
      const playerCount = server.serverInfo?.playerCount || 0;
      const banCount = server._count.bans;

      // Check if metrics for this hour already exist
      const existingMetric = await prisma.serverMetrics.findFirst({
        where: {
          licenseId: server.id,
          timestamp: currentHour,
        },
      });

      if (!existingMetric) {
        metricsToCreate.push({
          licenseId: server.id,
          timestamp: currentHour,
          playerCount,
          banCount,
        });
      } else {
        // Update existing metric with current values
        await prisma.serverMetrics.update({
          where: { id: existingMetric.id },
          data: {
            playerCount,
            banCount,
          },
        });
      }
    }

    // Bulk create new metrics
    if (metricsToCreate.length > 0) {
      await prisma.serverMetrics.createMany({
        data: metricsToCreate,
        skipDuplicates: true,
      });
      cronLogger.info(
        `Created ${metricsToCreate.length} new server metrics entries`
      );
    }

    // Cleanup old metrics (older than 31 days to keep some buffer)
    const cleanupDate = new Date();
    cleanupDate.setDate(cleanupDate.getDate() - 31);

    const deletedCount = await prisma.serverMetrics.deleteMany({
      where: {
        timestamp: {
          lt: cleanupDate,
        },
      },
    });

    if (deletedCount.count > 0) {
      cronLogger.info(
        `Cleaned up ${deletedCount.count} old server metrics entries`
      );
    }

    cronLogger.info("Server metrics update completed successfully");
  } catch (error) {
    cronLogger.error("Failed to update server metrics", error as Error);
    throw error;
  }
}

