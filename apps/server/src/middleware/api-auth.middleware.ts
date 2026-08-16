import type { Request, Response, NextFunction } from "express";
import { timingSafeEqual } from "crypto";
import prisma from "../../prisma";
import { rateLimitService } from "../services/rate-limit.service";
import type { APIKey } from "@vexonac/database/prisma/generated/client/client";
import { getEndpointConfig, type EndpointConfig } from "../config/api-endpoints";
import { IsAPIKeyMinimumTier } from "../lib/api-keys";
import { APIPlans, type APIPlanConfig } from "@vexonac/types";

// Extend Express Request type to include apiKey
declare global {
  namespace Express {
    interface Request {
      apiKey?: APIKey;
      endpointConfig?: EndpointConfig;
      apiPlanConfig?: APIPlanConfig;
    }
  }
}

export const apiKeyAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const accessKey = req.headers["x-api-key"] as string;
    const secretKey = req.headers["x-api-secret"] as string;

    if (!accessKey || !secretKey) {
      return res.status(401).json({
        error: "Missing API key or secret",
        code: "MISSING_CREDENTIALS",
      });
    }

    // Find API key
    const apiKey = await prisma.aPIKey.findUnique({
      where: { accessKey },
    });

    if (!apiKey) {
      return res.status(401).json({
        error: "Invalid API key",
        code: "INVALID_KEY",
      });
    }

    // Verify secret key using constant-time comparison to prevent timing attacks
    const storedKeyBuf = Buffer.from(apiKey.secretKey);
    const providedKeyBuf = Buffer.from(secretKey);
    const secretKeyValid =
      storedKeyBuf.length === providedKeyBuf.length &&
      timingSafeEqual(storedKeyBuf, providedKeyBuf);
    if (!secretKeyValid) {
      return res.status(401).json({
        error: "Invalid API secret",
        code: "INVALID_SECRET",
      });
    }

    // Check status
    if (apiKey.status !== "ACTIVE") {
      return res.status(403).json({
        error: "API key is not active",
        code: "KEY_INACTIVE",
        status: apiKey.status,
      });
    }

    // Check expiration
    if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
      return res.status(403).json({
        error: "API key has expired",
        code: "KEY_EXPIRED",
      });
    }

    const endpointConfig = getEndpointConfig(req.originalUrl, req.method);
    const requestCost = endpointConfig ? (endpointConfig.cost || 1) : 1; // Default cost is 1

    // Check Minimum Tier if config exists
    if (endpointConfig) {
        if (!IsAPIKeyMinimumTier(apiKey, endpointConfig.minTier)) {
            return res.status(403).json({
                error: `This endpoint requires ${endpointConfig.minTier} tier or higher`,
                code: "INSUFFICIENT_TIER",
                required: endpointConfig.minTier,
                current: apiKey.tier
            });
        }
    }

    // Check rate limits (per minute)
    const rateLimit = rateLimitService.checkLimit(
      apiKey.id,
      apiKey.rateLimitPerMinute
    );

    // Set Rate Limit Headers
    res.setHeader("X-RateLimit-Limit", apiKey.rateLimitPerMinute);
    res.setHeader("X-RateLimit-Remaining", rateLimit.remaining);
    res.setHeader("X-RateLimit-Reset", Math.ceil(rateLimit.reset / 1000));
    res.setHeader("X-Cost", requestCost);

    if (!rateLimit.allowed) {
      return res.status(429).json({
        error: "Rate limit exceeded",
        code: "RATE_LIMIT_EXCEEDED",
        retryAfter: Math.ceil((rateLimit.reset - Date.now()) / 1000),
      });
    }

    // Check monthly limit
    const now = new Date();
    // Check if we need to reset monthly usage
    if (now > apiKey.monthlyResetDate) {
        // Reset logic handled below
    }
    
    // Check monthly limit with COST
    if (apiKey.monthlyRequestLimit > 0 && (apiKey.currentMonthlyUsage + requestCost) > apiKey.monthlyRequestLimit) {
       // Check if reset is due
       if (now <= apiKey.monthlyResetDate) {
         return res.status(403).json({
           error: "Monthly request limit exceeded",
           code: "MONTHLY_LIMIT_EXCEEDED",
         });
       }
    }

    // Update usage stats
    const nextMonth = new Date(apiKey.monthlyResetDate);
    let shouldReset = now > nextMonth;
    
    if (shouldReset) {
        // Calculate new reset date
        while (now > nextMonth) {
            nextMonth.setMonth(nextMonth.getMonth() + 1);
        }
    }

    await prisma.aPIKey.update({
      where: { id: apiKey.id },
      data: {
        lastUsedAt: now,
        totalRequests: { increment: 1 },
        currentMonthlyUsage: shouldReset ? requestCost : { increment: requestCost },
        monthlyResetDate: shouldReset ? nextMonth : undefined,
      },
    });

    // Attach apiKey to request
    req.apiKey = apiKey;
    req.endpointConfig = endpointConfig;
    req.apiPlanConfig = APIPlans[apiKey.tier];
    
    next();
  } catch (error) {
    console.error("API Auth Error:", error);
    return res.status(500).json({
      error: "Internal server error during authentication",
      code: "AUTH_ERROR",
    });
  }
};


