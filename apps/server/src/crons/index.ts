import cron from "node-cron";
import { cleanupExpiredBans } from "./cleanup-expired-bans";
import { cleanupOldLogs } from "./cleanup-old-logs";
import { updateGlobalStats } from "./global-stats";
import { updateServerMetrics } from "./servers-metrics";

let cronInitialized = false;

/**
 * Configuration for cron job schedules and retention periods
 */
export const CRON_CONFIG = {
  // Cron schedules
  EXPIRED_BANS_SCHEDULE: "*/15 * * * *", // Every 15 minutes
  OLD_LOGS_CLEANUP_SCHEDULE: "0 2 * * *", // Daily at 2 AM
  SERVER_METRICS_SCHEDULE: "0 * * * *", // Every hour
  GLOBAL_STATS_SCHEDULE: "0 * * * *", // Every hour
} as const;

/**
 * Logger utility for cron jobs
 */
export const cronLogger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    console.log(
      `[CRON] ${new Date().toISOString()} - ${message}`,
      meta ? JSON.stringify(meta) : ""
    );
  },
  error: (message: string, error?: Error) => {
    console.error(
      `[CRON ERROR] ${new Date().toISOString()} - ${message}`,
      error?.message || ""
    );
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    console.warn(
      `[CRON WARN] ${new Date().toISOString()} - ${message}`,
      meta ? JSON.stringify(meta) : ""
    );
  },
};

/**
 * Initialize and start all cron jobs
 */
export function initializeCronJobs(): void {
  if (cronInitialized) {
    return;
  }

  cronInitialized = true;

  cronLogger.info("Initializing cron jobs");

  cron.schedule(CRON_CONFIG.EXPIRED_BANS_SCHEDULE, async () => {
    try {
      await cleanupExpiredBans();
    } catch (error) {
      cronLogger.error("Expired bans cleanup job failed", error as Error);
    }
  });

  cron.schedule(CRON_CONFIG.OLD_LOGS_CLEANUP_SCHEDULE, async () => {
    try {
      await cleanupOldLogs();
    } catch (error) {
      cronLogger.error("Old logs cleanup job failed", error as Error);
    }
  });

  cron.schedule(CRON_CONFIG.SERVER_METRICS_SCHEDULE, async () => {
    try {
      await updateServerMetrics();
    } catch (error) {
      cronLogger.error("Server metrics update job failed", error as Error);
    }
  });

  cron.schedule(CRON_CONFIG.GLOBAL_STATS_SCHEDULE, async () => {
    try {
      await updateGlobalStats();
    } catch (error) {
      cronLogger.error("Global stats update job failed", error as Error);
    }
  });

  cronLogger.info("Cron jobs initialized successfully", {
    expiredBansSchedule: CRON_CONFIG.EXPIRED_BANS_SCHEDULE,
    oldLogsCleanupSchedule: CRON_CONFIG.OLD_LOGS_CLEANUP_SCHEDULE,
    serverMetricsSchedule: CRON_CONFIG.SERVER_METRICS_SCHEDULE,
    globalStatsSchedule: CRON_CONFIG.GLOBAL_STATS_SCHEDULE,
  });
}

/**
 * Stop all cron jobs (useful for graceful shutdown)
 */
export function stopCronJobs(): void {
  cronLogger.info("Stopping all cron jobs");
  cron.getTasks().forEach((task, name) => {
    task.stop();
    cronLogger.info(`Stopped cron job: ${name}`);
  });
}

/**
 * Get status of all cron jobs
 */
export function getCronJobsStatus(): Record<string, boolean> {
  const tasks = cron.getTasks();
  const status: Record<string, boolean> = {};

  tasks.forEach((task, name) => {
    // Check if task is scheduled (active)
    status[name] = true; // All scheduled tasks are considered active
  });

  return status;
}

/**
 * Manual cleanup functions for testing or immediate execution
 */
export const manualCleanup = {
  expiredBans: cleanupExpiredBans,
  oldLogs: cleanupOldLogs,
  serverMetrics: updateServerMetrics,
  globalStats: updateGlobalStats,
};
