import { TRPCError } from "@trpc/server";
import {
  performPlayerAnalysis,
} from "@vexonac/utils";
import { PrismaClient } from "@vexonac/database/prisma/generated/client/client";
import { z } from "zod";
import { protectedProcedure } from "../../lib/trpc";
import { hasPermission } from "../../lib/utils";
import {
  isDemoServer,
  getDemoPlayerLookupDetails,
  serverIdSchema,
} from "../../lib/demo-data";

// Define the input schema for getting player lookup details
const getPlayerLookupDetailsSchema = z.object({
  serverId: serverIdSchema,
  playerId: z.string(), // Allow any string for demo mode
});

export const getPlayerLookupDetails = protectedProcedure
  .input(getPlayerLookupDetailsSchema)
  .query(async ({ ctx, input }) => {
    const userId = ctx.session.user.discordId;

    // Check if this is a demo server request
    if (isDemoServer(input.serverId)) {
      return getDemoPlayerLookupDetails(input.playerId);
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

      // Check if user is owner or has PLAYERS_LOOKUP permission
      const isOwner = license.discordId === userId;
      const member = license.members[0];
      const hasPlayersLookupPermission = hasPermission(
        member?.permissions || [],
        "PLAYERS_LOOKUP"
      );

      const hasAllPermission = hasPermission(
        member?.permissions || [],
        "ALL"
      );

      if (!isOwner && !hasPlayersLookupPermission) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have permission to lookup players on this server",
        });
      }

      // Get the player details
      const player = await ctx.db.player.findUnique({
        where: {
          id: input.playerId,
        },
        select: {
          id: true,
          playerName: true,
          playerLicense: true,
          identifiers: true,
          oldIdentifiers: true,
          firstJoin: true,
          lastJoin: true,
          playTime: true,
          licenseId: true,
        },
      });

      if (!player) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Player not found",
        });
      }

      // Verify player belongs to the requested server
      if (player.licenseId !== input.serverId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Player does not belong to this server",
        });
      }

      const showIpIdentifiers = isOwner || hasAllPermission;

      const analysis = await performPlayerAnalysis(
        ctx.db as unknown as PrismaClient,
        player,
        input.serverId,
        {
          showIpIdentifiers,
          showIdentifiers: true
        }
      );

      return {
        ...analysis,
        server: {
          id: license.id,
          name: license.serverName,
        },
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      // Console log for debugging
      console.error(error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error fetching player lookup details",
      });
    }
  });

