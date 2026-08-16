import { hasPermission } from "@/lib/utils";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../lib/trpc";

// Define the input schema for getting cross-server bans
const getPlayerCrossBansSchema = z.object({
  serverId: z.string().uuid(),
  playerId: z.string().uuid(),
});

export const getPlayerCrossBans = protectedProcedure
  .input(getPlayerCrossBansSchema)
  .query(async ({ ctx, input }) => {
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

      // Check if user is owner or has MANAGE_BANS permission
      const isOwner = license.discordId === userId;
      const member = license.members[0];
      const hasManageBansPermission = hasPermission(
        member?.permissions || [],
        "MANAGE_BANS"
      );

      if (!isOwner && !hasManageBansPermission) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have permission to view ban information on this server",
        });
      }

      // Get the player and their identifiers
      const player = await ctx.db.player.findUnique({
        where: {
          id: input.playerId,
        },
        select: {
          identifiers: true,
          oldIdentifiers: true,
          playerLicense: true,
        },
      });

      if (!player) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Player not found",
        });
      }

      // Collect all identifiers (current and historical)
      const currentIdentifiers = Array.isArray(player.identifiers)
        ? (player.identifiers as string[])
        : [];
      const oldIdentifiers = Array.isArray(player.oldIdentifiers)
        ? (player.oldIdentifiers as string[])
        : [];

      const allIdentifiers = [
        ...new Set([...currentIdentifiers, ...oldIdentifiers]),
      ];

      if (allIdentifiers.length === 0) {
        return { crossServerBans: [] };
      }

      // Parse identifiers to get values for database lookup
      const identifierValues = allIdentifiers.filter(Boolean);

      // Find bans on other servers using these identifiers
      const crossServerBans = await ctx.db.bannedIdentifier.findMany({
        where: {
          value: {
            in: identifierValues,
          },
          ban: {
            licenseId: {
              not: input.serverId, // Exclude current server
            },
          },
        },
        include: {
          ban: {
            include: {
              license: {
                select: {
                  id: true,
                  serverName: true,
                },
              },
            },
          },
        },
        distinct: ["banId"], // Avoid duplicate bans
      });

      // Group by server and format the response
      const serverBansMap = new Map<string, any>();

      crossServerBans.forEach((bannedIdentifier) => {
        const ban = bannedIdentifier.ban;
        const serverId = ban.license.id;
        const serverName = ban.license.serverName;

        if (!serverBansMap.has(serverId)) {
          serverBansMap.set(serverId, {
            serverId,
            serverName,
            bans: [],
          });
        }

        // Check if this ban is already added to avoid duplicates
        const serverBans = serverBansMap.get(serverId);
        const existingBan = serverBans.bans.find(
          (b: any) => b.banId === ban.banId
        );

        if (!existingBan) {
          serverBans.bans.push({
            banId: ban.banId,
            reason: ban.reason,
            bannedAt: ban.bannedAt,
            expiresAt: ban.expiresAt,
          });
        }
      });

      return {
        crossServerBans: Array.from(serverBansMap.values()),
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error fetching cross-server ban information",
      });
    }
  });
