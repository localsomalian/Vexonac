import { promises as fs } from "fs";
import path from "path";
import { logger } from "../lib/logger";
class FileService {
    constructor() {
        this.filesPath = path.resolve(__dirname, "../assets/stable");
        this.filesPathBeta = path.resolve(__dirname, "../assets/beta");
        // Valid file names array for runtime operations
        this.validFileNames = [
            "fxmanifest.lua",
            "client.lua",
            "auth.lua",
            "server.lua",
            "exports.lua",
            "vexonac.lua", //OLD
            "include.lua",
            "vexonac.js",
            "ui.html",
            "ui.js",
            "server.js",
        ];
        // Cache for file contents to avoid repeated disk reads
        this.fileCache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
    }
    /**
     * Get a file by name with optional beta flag
     * @param fileName - The name of the file to retrieve
     * @param beta - Whether to use beta version
     * @returns File content or null if not found/invalid
     */
    async getFile(fileName, beta = false) {
        // Type guard and validation
        if (!this.isValidFileName(fileName)) {
            return null;
        }
        const cacheKey = `${fileName}_${beta ? "beta" : "stable"}`;
        // Check cache first
        const cached = this.fileCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.content;
        }
        try {
            const content = await this.readFileFromDisk(fileName, beta);
            if (content !== null) {
                // Cache the content
                this.fileCache.set(cacheKey, {
                    content,
                    timestamp: Date.now(),
                });
            }
            return content;
        }
        catch (error) {
            logger.error("Error retrieving file", {
                error: error instanceof Error ? error.message : "Unknown error",
                fileName,
                beta,
            });
            return null;
        }
    }
    /**
     * Get all available file names
     */
    getAvailableFiles() {
        return [...this.validFileNames];
    }
    /**
     * Clear the file cache
     */
    clearCache() {
        this.fileCache.clear();
        logger.info("File cache cleared");
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.fileCache.size,
            keys: Array.from(this.fileCache.keys()),
        };
    }
    /**
     * Type guard to check if filename is valid
     */
    isValidFileName(fileName) {
        return this.validFileNames.includes(fileName);
    }
    /**
     * Read file from disk with proper error handling
     */
    async readFileFromDisk(fileName, beta) {
        const basePath = beta ? this.filesPathBeta : this.filesPath;
        const filePath = path.join(basePath, fileName);
        try {
            // Check if file exists first
            await fs.access(filePath);
            const content = await fs.readFile(filePath, "utf-8");
            return content;
        }
        catch (error) {
            if (error instanceof Error && "code" in error) {
                if (error.code === "ENOENT") {
                    logger.warn("File not found", { fileName, filePath });
                }
                else if (error.code === "EACCES") {
                    logger.error("File access denied", { fileName, filePath });
                }
                else {
                    logger.error("File system error", {
                        error: error.message,
                        code: error.code,
                        fileName,
                        filePath,
                    });
                }
            }
            else {
                logger.error("Unknown file error", { error, fileName, filePath });
            }
            return null;
        }
    }
}
export default new FileService();
