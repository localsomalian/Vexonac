import { logger } from "../lib/logger";
import prisma from "../lib/prisma";

interface VersionInfo {
  version: string;
}

class VersionService {
  private cachedVersion: VersionInfo | null = null;
  private cacheTimeout = 5 * 60 * 1000; // 10 minutes cache
  private lastCacheUpdate = 0;

  /**
   * Get the latest version with caching
   * @returns Latest version info or null if not found
   */
  async getLatestVersion(): Promise<VersionInfo | null> {
    const now = Date.now();

    // Return cached version if still valid
    if (this.cachedVersion && now - this.lastCacheUpdate < this.cacheTimeout) {
      return this.cachedVersion;
    }

    try {
      // Fetch latest version from database
      const latestVersion = await prisma.version.findFirst({
        orderBy: { updatedAt: "desc" },
        select: {
          version: true,
        },
      });

      if (latestVersion) {
        this.cachedVersion = latestVersion;
        this.lastCacheUpdate = now;

        return latestVersion;
      }

      logger.warn("No version found in database");
      return null;
    } catch (error) {
      logger.error("Error fetching latest version", {
        error: error instanceof Error ? error.message : "Unknown error",
      });

      // Return cached version if available, even if expired
      if (this.cachedVersion) {
        return this.cachedVersion;
      }

      return null;
    }
  }

  /**
   * Get just the version string (most common use case)
   * @returns Version string or null
   */
  async getLatestVersionString(): Promise<string | null> {
    const versionInfo = await this.getLatestVersion();
    return versionInfo?.version || null;
  }

  /**
   * Clear the version cache (force refresh on next request)
   */
  clearCache(): void {
    this.cachedVersion = null;
    this.lastCacheUpdate = 0;
    logger.info("Version cache cleared");
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    cached: boolean;
    version: string | null;
    cacheAge: number;
    lastUpdate: Date | null;
  } {
    return {
      cached: this.cachedVersion !== null,
      version: this.cachedVersion?.version || null,
      cacheAge: this.cachedVersion ? Date.now() - this.lastCacheUpdate : 0,
      lastUpdate: this.cachedVersion ? new Date(this.lastCacheUpdate) : null,
    };
  }

  /**
   * Preload the version cache (useful for startup)
   */
  async preloadCache(): Promise<void> {
    try {
      await this.getLatestVersion();
      logger.info("Version cache preloaded successfully");
    } catch (error) {
      logger.error("Failed to preload version cache", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}

export default new VersionService();
