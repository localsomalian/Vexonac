import { hasPermission } from "@/lib/utils";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../lib/trpc";
import { isDemoServer, getDemoPlayers, serverIdSchema } from "../../lib/demo-data";

// Define the input schema for searching players
const getPlayersSchema = z.object({
  serverId: serverIdSchema,
  search: z.string().min(1),
  limit: z.number().min(1).max(50).default(10),
});

export const getPlayers = protectedProcedure
  .input(getPlayersSchema)
  .query(async ({ ctx, input }) => {
    const userId = ctx.session.user.discordId;

    // Check if this is a demo server request
    if (isDemoServer(input.serverId)) {
      const demoData = getDemoPlayers(1, input.limit, input.search);
      return demoData.players.slice(0, input.limit);
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
          message: "You do not have permission to view players for this server",
        });
      }

      // Search for players by name, license, or identifiers
      const players = (await ctx.db.$queryRaw`
        SELECT 
          id, 
          "playerName", 
          "playerLicense", 
          identifiers, 
          "oldIdentifiers", 
          "firstJoin", 
          "lastJoin", 
          "playTime"
        FROM "players" 
        WHERE "licenseId" = ${input.serverId}
        AND (
          "playerName" ILIKE ${"%" + input.search + "%"}
          OR "playerLicense" ILIKE ${"%" + input.search + "%"}
          OR identifiers::text ILIKE ${"%" + input.search + "%"}
          OR "oldIdentifiers"::text ILIKE ${"%" + input.search + "%"}
        )
        ORDER BY "lastJoin" DESC
        LIMIT ${input.limit}
             `) as any[];

      // Get ban information for each player
      const playersWithBans = await Promise.all(
        players.map(async (player: any) => {
          const bans = await ctx.db.ban.findMany({
            where: {
              playerId: player.id,
            },
            select: {
              id: true,
              banId: true,
              reason: true,
              bannedAt: true,
              expiresAt: true,
            },
            orderBy: {
              bannedAt: "desc",
            },
            take: 1,
          });

          return {
            ...player,
            bans,
          };
        })
      );

      // Filter out currently banned players and format the response
      const availablePlayers = playersWithBans
        .filter((player: any) => {
          // Check if player has any active bans
          const activeBan = player.bans.find((ban: any) => {
            if (!ban.expiresAt) return true; // Permanent ban
            return new Date(ban.expiresAt) > new Date(); // Temporary ban still active
          });
          return !activeBan;
        })
        .map((player: any) => ({
          id: player.id,
          playerName: player.playerName,
          playerLicense: player.playerLicense,
          identifiers: player.identifiers,
          oldIdentifiers: player.oldIdentifiers,
          firstJoin: player.firstJoin,
          lastJoin: player.lastJoin,
          playTime: player.playTime,
          lastBan: player.bans[0] || null,
        }));

      return availablePlayers;
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error searching players",
      });
    }
  });
