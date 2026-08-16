import { hasPermission } from "@/lib/utils";
import { TRPCError } from "@trpc/server";
import { mergeConfig, type VexonACConfig } from "@vexonac/config";
import { z } from "zod";
import { protectedProcedure } from "../../lib/trpc";
import { isDemoServer, getDemoConfig, serverIdSchema } from "../../lib/demo-data";

// Define the input schema for server ID
const getConfigSchema = serverIdSchema;

export const getConfig = protectedProcedure
  .input(getConfigSchema)
  .query(async ({ ctx, input: serverId }) => {
    const userId = ctx.session.user.discordId;

    // Check if this is a demo server request
    if (isDemoServer(serverId)) {
      return getDemoConfig();
    }

    try {
      // First, check if the user has access to this server
      const license = await ctx.db.license.findUnique({
        where: {
          id: serverId,
        },
        select: {
          id: true,
          discordId: true,
          configuration: true,
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
            "You do not have permission to view configuration for this server",
        });
      }

      // Get the stored configuration from the database
      const storedConfig = license.configuration as Record<string, any>;

      // Merge with the default configuration to get the full config with UI metadata
      const fullConfig: VexonACConfig = mergeConfig(storedConfig);

      return {
        serverId: serverId,
        configuration: fullConfig,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      console.error("Error fetching server configuration:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error fetching server configuration",
      });
    }
  });


