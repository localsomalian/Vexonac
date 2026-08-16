import { TRPCError } from "@trpc/server";
import {
  extractValues,
  mergeConfig,
  type VexonACConfig,
} from "@vexonac/config";
import { z } from "zod";
import { emitToServer } from "../../lib/emitToServer";
import { protectedProcedure } from "../../lib/trpc";
import { hasPermission } from "../../lib/utils";
import { isDemoServer, serverIdSchema } from "../../lib/demo-data";

// Define the input schema for setting configuration
const setConfigSchema = z.object({
  serverId: serverIdSchema,
  configuration: z.record(z.any()), // Accept any configuration object, will be validated against the VexonACConfig type
});

export const setConfig = protectedProcedure
  .input(setConfigSchema)
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.discordId;

    // Check if this is a demo server request
    if (isDemoServer(input.serverId)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "This action is not available in demo mode",
      });
    }

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
        member?.permissions || [],
        "CONFIGURATION"
      );

      if (!isOwner && !hasConfigPermission) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have permission to modify configuration for this server",
        });
      }

      // Validate the configuration by merging with default config
      let validatedConfig: VexonACConfig;
      try {
        validatedConfig = mergeConfig(input.configuration);
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid configuration format",
        });
      }

      // Extract raw values for storage (remove UI metadata)
      const configValues = extractValues(validatedConfig);

      // Update the configuration in the database
      const updatedLicense = await ctx.db.license.update({
        where: {
          id: input.serverId,
        },
        data: {
          configuration: configValues,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          configuration: true,
          updatedAt: true,
        },
      });

      // Log the configuration update activity
      await ctx.db.serverLog.create({
        data: {
          licenseId: input.serverId,
          systemType: "CONFIG_UPDATE",
          memberId: userId,
        },
      });

      // Send event to the server
      await emitToServer(input.serverId, "config-update", {}, false);

      return {
        success: true,
        serverId: input.serverId,
        configuration: validatedConfig,
        updatedAt: updatedLicense.updatedAt,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      console.error("Error updating server configuration:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error updating server configuration",
      });
    }
  });


