import { z } from "zod";
import { protectedProcedure } from "../../lib/trpc";
import { APITier, APIStatus } from "@vexonac/database/prisma/generated/client/client";

const apiKeyListOutputSchema = z.array(
  z.object({
    id: z.string(),
    discordId: z.string(),
    name: z.string().nullable(),
    accessKey: z.string(),
    secretKey: z.undefined(),
    maskedSecretKey: z.string(),
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
    license: z.object({
      id: z.string(),
      serverName: z.string(),
    }).nullable(),
    lastUsedAt: z.date().nullable(),
    totalRequests: z.number(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
);

export const listApiKeys = protectedProcedure
  .output(apiKeyListOutputSchema)
  .query(async ({ ctx }) => {
    const userId = ctx.session.user.discordId;

    const apiKeys = await ctx.db.aPIKey.findMany({
      where: {
        discordId: userId,
      },
      include: {
        license: {
          select: {
            id: true,
            serverName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Mask secret keys
    return apiKeys.map((key) => ({
      ...key,
      secretKey: undefined, // Hide secret key in list
      maskedSecretKey: `${key.secretKey.substring(0, 6)}...${key.secretKey.substring(key.secretKey.length - 4)}`,
    }));
  });

