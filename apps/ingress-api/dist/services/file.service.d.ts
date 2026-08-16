type ValidFileName = "fxmanifest.lua" | "client.lua" | "auth.lua" | "server.lua" | "exports.lua" | "vexonac.lua" | "include.lua" | "vexonac.js" | "ui.html" | "ui.js" | "server.js";
declare class FileService {
    private readonly filesPath;
    private readonly filesPathBeta;
    private readonly validFileNames;
    private readonly fileCache;
    private readonly cacheTimeout;
    /**
     * Get a file by name with optional beta flag
     * @param fileName - The name of the file to retrieve
     * @param beta - Whether to use beta version
     * @returns File content or null if not found/invalid
     */
    getFile(fileName: string, beta?: boolean): Promise<string | null>;
    /**
     * Get all available file names
     */
    getAvailableFiles(): ValidFileName[];
    /**
     * Clear the file cache
     */
    clearCache(): void;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        size: number;
        keys: string[];
    };
    /**
     * Type guard to check if filename is valid
     */
    private isValidFileName;
    /**
     * Read file from disk with proper error handling
     */
    private readFileFromDisk;
}
declare const _default: FileService;
export default _default;
//# sourceMappingURL=file.service.d.ts.map