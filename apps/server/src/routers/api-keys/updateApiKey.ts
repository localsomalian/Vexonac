import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../lib/trpc";
import { APIStatus } from "@vexonac/database/prisma/generated/client/client";
import { APIPlan, APIPlans } from "@vexonac/types";
import { APITier } from "@vexonac/database/prisma/generated/client/client";

const updateApiKeySchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(50).optional(),
  permissions: z.record(z.string(), z.boolean()).optional(),
  status: z.nativeEnum(APIStatus).optional(),
  tier: z.nativeEnum(APIPlan).optional(),
  licenseId: z.string().optional().nullable(),
});

const apiKeyUpdateOutputSchema = z.object({
  id: z.string(),
  discordId: z.string(),
  name: z.string().nullable(),
  accessKey: z.string(),
  secretKey: z.undefined(),
  tier: z.nativeEnum(APITier),
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

export const updateApiKey = protectedProcedure
  .input(updateApiKeySchema)
  .output(apiKeyUpdateOutputSchema)
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.discordId;

    const apiKey = await ctx.db.aPIKey.findUnique({
      where: {
        id: input.id,
      },
    });

    if (!apiKey) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "API key not found",
      });
    }

    if (apiKey.discordId !== userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not own this API key",
      });
    }

    const dataToUpdate: any = {
        name: input.name,
        permissions: input.permissions,
        status: input.status,
    };

    // Handle plan update
    if (input.tier) {
        const plan = APIPlans[input.tier];
        if (plan) {
            dataToUpdate.tier = input.tier as unknown as APITier;
            dataToUpdate.monthlyRequestLimit = plan.monthlyRequestLimit;
            dataToUpdate.rateLimitPerMinute = plan.rateLimitPerMinute;
        }
    }

    // Handle server linking/unlinking
    if (input.licenseId !== undefined) {
        if (input.licenseId === null) {
            // Unlink server
            dataToUpdate.licenseId = null;
        } else {
            // Validate license ownership
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

            dataToUpdate.licenseId = input.licenseId;
        }
    }

    const updatedApiKey = await ctx.db.aPIKey.update({
      where: {
        id: input.id,
      },
      data: dataToUpdate,
    });

    return {
      ...updatedApiKey,
      secretKey: undefined, // Don't return secret key on update
    };
  });

