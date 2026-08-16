interface VersionInfo {
    version: string;
}
declare class VersionService {
    private cachedVersion;
    private cacheTimeout;
    private lastCacheUpdate;
    /**
     * Get the latest version with caching
     * @returns Latest version info or null if not found
     */
    getLatestVersion(): Promise<VersionInfo | null>;
    /**
     * Get just the version string (most common use case)
     * @returns Version string or null
     */
    getLatestVersionString(): Promise<string | null>;
    /**
     * Clear the version cache (force refresh on next request)
     */
    clearCache(): void;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        cached: boolean;
        version: string | null;
        cacheAge: number;
        lastUpdate: Date | null;
    };
    /**
     * Preload the version cache (useful for startup)
     */
    preloadCache(): Promise<void>;
}
declare const _default: VersionService;
export default _default;
//# sourceMappingURL=version.service.d.ts.map