import type { APIKey } from "@vexonac/database/prisma/generated/client/client";

interface RateLimitState {
  count: number;
  windowStart: number;
}

class RateLimitService {
  private limits: Map<string, RateLimitState> = new Map();
  private readonly CLEANUP_INTERVAL = 60000; // 1 minute

  constructor() {
    // Periodically clean up old entries to prevent memory leaks
    setInterval(() => this.cleanup(), this.CLEANUP_INTERVAL);
  }

  /**
   * Check if a key has exceeded its rate limit
   * @param keyId The unique identifier for the API key
   * @param limit The maximum number of requests allowed per minute
   * @returns Object containing allowed status and current usage info
   */
  public checkLimit(keyId: string, limit: number): {
    allowed: boolean;
    remaining: number;
    reset: number;
  } {
    const now = Date.now();
    const windowSize = 60000; // 1 minute window

    let state = this.limits.get(keyId);

    if (!state) {
      state = { count: 0, windowStart: now };
      this.limits.set(keyId, state);
    }

    // If window has passed, reset
    if (now - state.windowStart > windowSize) {
      state.count = 0;
      state.windowStart = now;
    }

    // Check if limit exceeded
    if (state.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        reset: state.windowStart + windowSize,
      };
    }

    // Increment count
    state.count++;
    
    return {
      allowed: true,
      remaining: limit - state.count,
      reset: state.windowStart + windowSize,
    };
  }

  private cleanup() {
    const now = Date.now();
    const windowSize = 60000;

    for (const [key, state] of this.limits.entries()) {
      if (now - state.windowStart > windowSize) {
        this.limits.delete(key);
      }
    }
  }
}

export const rateLimitService = new RateLimitService();


