import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../lib/trpc";
import crypto from "crypto";
import { APIPlans, APIPlan } from "@vexonac/types";
import { APITier, APIStatus } from "@vexonac/database/prisma/generated/client/client";

const createApiKeySchema = z.object({
  name: z.string().min(1).max(50),
  permissions: z.record(z.string(), z.boolean()).optional(),
  licenseId: z.string().optional(),
});

const apiKeyOutputSchema = z.object({
  id: z.string(),
  discordId: z.string(),
  name: z.string().nullable(),
  tier: z.nativeEnum(APITier),
  accessKey: z.string(),
  secretKey: z.string(),
  status: z.nativeEnum(APIStatus),
  monthlyRequestLimit: z.number(),
  currentMonthlyUsage: z.number(),
  monthlyResetDate: z.date(),
  rateLimitPerMinute: z.number(),
  webhooks: z.any(),
  permissions: z.any(),
  expiresAt: z.date().nullable(),
  licenseId: z.string().nullable(),
  lastUsedAt: z.date().nullable(),
  totalRequests: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Helper to generate 256-bit alphanumeric string (approx 43 chars base62, but we can use base64url which is 43 chars for 32 bytes)
// 32 bytes = 256 bits
function generateKey(prefix: string) {
    const randomBytes = crypto.randomBytes(32);
    // base64url encoding is safe for URLs and contains A-Z, a-z, 0-9, -, _
    // To strictly match "upper/lower cases and numbers" we might want to replace - and _ or just accept them.
    // Standard practice usually accepts base64url. 
    // However, to be strictly alphanumeric (base62), we'd need a custom encoder.
    // Given "upper/lower cases and numbers" usually implies base62, let's try to stick to that if possible,
    // or just use hex which is only numbers and lower case (usually).
    // But user specifically asked for "both upper/lower cases and numbers".
    // Let's use base64url but replace special chars to be safe/clean if desired, 
    // or just use base64url as it's standard for API keys (e.g. Stripe, etc use similar).
    // Let's stick to base64url as it provides the requested entropy in compact form.
    return `${prefix}${randomBytes.toString('base64url')}`;
}

export const createApiKey = protectedProcedure
  .input(createApiKeySchema)
  .output(apiKeyOutputSchema)
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.discordId;

    // Check limit
    const keyCount = await ctx.db.aPIKey.count({
        where: {
            discordId: userId,
        }
    });

    if (keyCount >= 10) {
        throw new TRPCError({
            code: "FORBIDDEN",
            message: "You have reached the maximum limit of 10 API keys.",
        });
    }
    
    // Generate keys
    const accessKey = generateKey('ws_pk_');
    const secretKey = generateKey('ws_sk_');

    // Default to BASIC plan if not provided
    const tierInput = APIPlan.FREE;
    const plan = APIPlans[tierInput];
    
    if (!plan) {
        throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid API Plan",
        });
    }

    const tier = tierInput as unknown as APITier;

    // Validate license ownership if provided
    if (input.licenseId) {
        const license = await ctx.db.license.findUnique({
            where: { id: input.licenseId },
        });

        if (!license) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Server not found",
            });
        }

        if (license.discordId !== userId) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "You do not own this server",
            });
        }
    }

    try {
        const apiKey = await ctx.db.aPIKey.create({
           data: {
             discordId: userId,
             name: input.name,
             accessKey,
             secretKey, 
             tier,
             monthlyRequestLimit: plan.monthlyRequestLimit,
             rateLimitPerMinute: plan.rateLimitPerMinute,
             permissions: input.permissions || {},
             monthlyResetDate: new Date(),
             licenseId: input.licenseId,
           }
        });
    
        return {
          ...apiKey,
          secretKey, // Return full secret key only on creation
        };
    } catch (error) {
        console.error("Error creating API key:", error);
        throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create API key",
        });
    }
  });

