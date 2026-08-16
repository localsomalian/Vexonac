import { logger } from "../lib/logger";
class TokenService {
    getUtcTimestamp() {
        return Math.floor(Date.now() / 1000);
    }
    /**
     * Generate an authentication token for a license and version
     */
    generateToken(licenseKey, version, latestVersion) {
        try {
            const timestamp = this.getUtcTimestamp();
            const timestampHash = this.hashString(timestamp.toString(), 8);
            const versionHash = this.hashString(version, 6);
            const licenseHash = this.hashString(licenseKey, 8);
            const latestVersionHash = this.hashString(latestVersion, 6);
            const token = `ws_${timestampHash}_${timestamp}_${licenseHash}_${versionHash}_${latestVersionHash}`;
            return token;
        }
        catch (error) {
            logger.error("Error generating token", {
                error: error instanceof Error ? error.message : "Unknown error",
                licenseKey: licenseKey.substring(0, 8) + "...",
                version,
            });
            // Fallback token
            const fallbackTimestamp = this.hashString(Date.now().toString(), 8);
            return `ws_fallback_${fallbackTimestamp}_${Math.random()
                .toString(36)
                .substr(2, 9)}`;
        }
    }
    /**
     * Hash a string for token generation
     */
    hashString(input, outputLength = 8) {
        try {
            if (!input || typeof input !== "string") {
                return "0".repeat(outputLength);
            }
            // Simple hash based on input string
            let hash = 0;
            for (let i = 0; i < input.length; i++) {
                const char = input.charCodeAt(i);
                hash = (hash << 5) - hash + char;
                hash = hash & hash; // Convert to 32-bit integer
            }
            const result = Math.abs(hash).toString(36);
            return result.substr(0, outputLength).padStart(outputLength, "0");
        }
        catch {
            return "0".repeat(outputLength);
        }
    }
}
export default new TokenService();
