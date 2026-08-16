import { hasPermission } from "@/lib/utils";
import { TRPCError } from "@trpc/server";
import { mergeConfig } from "@vexonac/config";
import { z } from "zod";
import { protectedProcedure } from "../../lib/trpc";

// Define the input schema for importing configuration
const importConfigSchema = z.object({
  serverId: z.string().uuid(),
  id: z.string().cuid("Invalid configuration ID format"),
});

export const importConfig = protectedProcedure
  .input(importConfigSchema)
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.discordId;

    try {
      // Check if the user has access to the target server
      const license = await ctx.db.license.findUnique({
        where: {
          id: input.serverId,
        },
        select: {
          id: true,
          discordId: true,
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
            "You do not have permission to import configuration for this server",
        });
      }

      // Find the shared configuration
      const sharedConfig = await ctx.db.sharedConfiguration.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          name: true,
          description: true,
          configuration: true,
          tags: true,
          expiresAt: true,
          isPublic: true,
          importCount: true,
          createdBy: {
            select: { username: true, image: true, discordId: true },
          },
        },
      });

      if (!sharedConfig) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Configuration not found",
        });
      }

      // Check if configuration has expired
      if (sharedConfig.expiresAt && sharedConfig.expiresAt < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This configuration has expired",
        });
      }

      // Check if user has access to this configuration
      const canAccess =
        sharedConfig.isPublic || sharedConfig.createdBy.discordId === userId;

      if (!canAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this configuration",
        });
      }

      // Validate and merge the configuration with defaults
      let validatedConfig;
      try {
        validatedConfig = mergeConfig(
          sharedConfig.configuration as Record<string, any>
        );
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid configuration format",
        });
      }

      // Increment import count (track usage even though config isn't auto-saved)
      await ctx.db.sharedConfiguration.update({
        where: { id: input.id },
        data: {
          importCount: {
            increment: 1,
          },
        },
      });

      // Note: Configuration is NOT automatically saved to the server
      // User must manually save after reviewing the imported config

      return {
        success: true,
        configuration: validatedConfig,
        importedFrom: {
          id: input.id,
          name: sharedConfig.name,
          description: sharedConfig.description,
          tags: sharedConfig.tags,
          createdBy: sharedConfig.createdBy,
        },
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      console.error("Error importing server configuration:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error importing server configuration",
      });
    }
  });

