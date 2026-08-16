import { hasPermission } from "@/lib/utils";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../lib/trpc";
import { isDemoServer, getDemoPlayers, serverIdSchema } from "../../lib/demo-data";
import { subDays } from "date-fns";

// Define the input schema for searching players in lookup
const searchPlayersLookupSchema = z.object({
  serverId: serverIdSchema,
  search: z.string().min(1),
  limit: z.number().min(1).max(20).default(10),
});

export const searchPlayersLookup = protectedProcedure
  .input(searchPlayersLookupSchema)
  .query(async ({ ctx, input }) => {
    const userId = ctx.session.user.discordId;

    // Check if this is a demo server request
    if (isDemoServer(input.serverId)) {
      const demoData = getDemoPlayers();
      const players = demoData.players;
      // Always return some results for demo, filter by search if provided but also show some default results
      let filtered = players;
      if (input.search && input.search.length > 0) {
        filtered = players.filter((p: any) => 
          p.name.toLowerCase().includes(input.search.toLowerCase()) ||
          p.license.includes(input.search) ||
          p.id.toString().includes(input.search)
        );
        // If no matches found, return first few players as fallback
        if (filtered.length === 0) {
          filtered = players.slice(0, 5);
        }
      } else {
        // Default to first 10 players if no search
        filtered = players.slice(0, 10);
      }
      
      return filtered.slice(0, input.limit || 10).map((player: any) => ({
        id: player.id.toString(),
        playerName: player.name,
        playerLicense: player.license,
        playTime: player.playTime,
        lastJoin: subDays(new Date(), Math.floor(player.id / 10)),
        identifiers: [player.license],
      }));
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

      // Check if user is owner or has PLAYERS_LOOKUP permission
      const isOwner = license.discordId === userId;
      const member = license.members[0];
      const hasPlayersLookupPermission = hasPermission(
        member?.permissions || [],
        "PLAYERS_LOOKUP"
      );

      if (!isOwner && !hasPlayersLookupPermission) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have permission to lookup players on this server",
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

      // Format the response with additional metadata
      const formattedPlayers = players.map((player: any) => {
        const currentIdentifiers = Array.isArray(player.identifiers)
          ? (player.identifiers as string[])
          : [];
        const oldIdentifiers = Array.isArray(player.oldIdentifiers)
          ? (player.oldIdentifiers as string[])
          : [];

        // Find matching identifiers for search highlighting
        const allIdentifiers = [...currentIdentifiers, ...oldIdentifiers];
        const matchingIdentifiers = allIdentifiers.filter(
          (id: string) =>
            typeof id === "string" &&
            id.toLowerCase().includes(input.search.toLowerCase()) &&
            !id.toLowerCase().includes(player.playerName.toLowerCase()) &&
            id !== player.playerLicense
        );

        return {
          id: player.id,
          playerName: player.playerName,
          playerLicense: player.playerLicense,
          identifiers: currentIdentifiers,
          oldIdentifiers,
          firstJoin: player.firstJoin,
          lastJoin: player.lastJoin,
          playTime: player.playTime,
          matchingIdentifiers: matchingIdentifiers.slice(0, 3), // Limit for UI
          totalMatchingIdentifiers: matchingIdentifiers.length,
        };
      });

      return formattedPlayers;
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
