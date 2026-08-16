import { hasPermission } from "@/lib/utils";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../lib/trpc";

// Predefined tags only (categories removed)
const PREDEFINED_TAGS = [
  "Role-Play",
  "PvP",
  "Strict",
  "Performance",
  "Balanced",
] as const;

// Define the input schema for sharing configuration
const shareConfigSchema = z.object({
  serverId: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  tags: z.array(z.enum(PREDEFINED_TAGS)).max(5).default([]),
  isPublic: z.boolean().default(false),
  expiresInDays: z.number().min(1).max(365).optional(), // Optional expiration
});

export const shareConfig = protectedProcedure
  .input(shareConfigSchema)
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.discordId;

    try {
      // First, check if the user has access to this server
      const license = await ctx.db.license.findUnique({
        where: {
          id: input.serverId,
        },
        select: {
          id: true,
          discordId: true,
          configuration: true,
          serverName: true,
          members: {
            where: {
              discordId: userId,
            },
            select: {
              permissions: true,
            },
          },
        },
      });

      if (!license) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Server not found",
        });
      }

      // Check if user is owner or has CONFIGURATION permission
      const isOwner = license.discordId === userId;
      const member = license.members[0];
      const hasConfigPermission = hasPermission(
        member.permissions,
        "CONFIGURATION"
      );

      if (!isOwner && !hasConfigPermission) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have permission to share configuration for this server",
        });
      }

      // Calculate expiration date if provided
      let expiresAt: Date | undefined;
      if (input.expiresInDays) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);
      }

      // Get the configuration from the license
      const configValues = license.configuration as Record<string, any>;

      // Remove webhook URLs from the configuration before sharing
      const sanitizedConfig = { ...configValues };
      const webhookFields = [
        'MainWebhook',
        'EntitiesWebhook',
        'ExplosionsWebhook',
        'WeaponsWebhook',
        'UnbansWebhook',
        'ConnectionsWebhook',
        'CommunityLogsWebhook',
      ];

      webhookFields.forEach((field) => {
        if (sanitizedConfig["Settings"] && sanitizedConfig["Settings"][field]) {
          // Check if it's a config object with a value property
          if (typeof sanitizedConfig["Settings"][field] === 'object' && sanitizedConfig["Settings"][field].value !== undefined) {
            sanitizedConfig["Settings"][field] = {
              ...sanitizedConfig["Settings"][field],
              value: '',
            };
          } else {
            // If it's just a string value
            sanitizedConfig["Settings"][field] = "";
          }
        }
      });

      // Find the user first - using email since discordId is not unique in the User model
      const user = await ctx.db.user.findFirst({
        where: { discordId: userId },
        select: { id: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "User not found. Please ensure you are properly authenticated.",
        });
      }

      // Create the shared configuration
      const sharedConfig = await ctx.db.sharedConfiguration.create({
        data: {
          name: input.name || `${license.serverName} Configuration`,
          description: input.description,
          tags: input.tags,
          configuration: sanitizedConfig,
          createdById: user.id,
          expiresAt,
          isPublic: input.isPublic,
        },
        select: {
          id: true,
          name: true,
          description: true,
          tags: true,
          createdAt: true,
          expiresAt: true,
          isPublic: true,
        },
      });

      // Log the activity
      await ctx.db.serverLog.create({
        data: {
          licenseId: input.serverId,
          systemType: "CONFIG_SHARE",
          details: {
            configId: sharedConfig.id,
          },
          memberId: userId,
        },
      });

      return {
        success: true,
        id: sharedConfig.id,
        name: sharedConfig.name,
        description: sharedConfig.description,
        tags: sharedConfig.tags,
        createdAt: sharedConfig.createdAt,
        expiresAt: sharedConfig.expiresAt,
        isPublic: sharedConfig.isPublic,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      console.error("Error sharing server configuration:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error sharing server configuration",
      });
    }
  });

// Export predefined options for use in frontend
export { PREDEFINED_TAGS };
