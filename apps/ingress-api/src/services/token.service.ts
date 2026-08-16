import { randomBytes } from "crypto";
import { logger } from "../lib/logger";

class TokenService {

  private getUtcTimestamp(): number {
    return Math.floor(Date.now() / 1000);
  }

  generateToken(
    _licenseKey: string,
    _version: string,
    _latestVersion: string
  ): string {
    try {
      const timestamp = this.getUtcTimestamp();
      const randomPart = randomBytes(16).toString("hex");
      return `ws_${randomPart}_${timestamp}`;
    } catch (error) {
      logger.error("Error generating token", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return `ws_fallback_${randomBytes(8).toString("hex")}_${Date.now()}`;
    }
  }
}

export default new TokenService();
