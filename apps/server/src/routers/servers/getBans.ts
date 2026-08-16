import { hasPermission } from "@/lib/utils";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../lib/trpc";
import { isDemoServer, getDemoBans, serverIdSchema } from "../../lib/demo-data";

// Define the input schema with pagination, search, and sorting
const getBansSchema = z.object({
  serverId: serverIdSchema,
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.enum(["bannedAt", "expiresAt", "playTime"]).default("bannedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const getBans = protectedProcedure
  .input(getBansSchema)
  .query(async ({ ctx, input }) => {
    const userId = ctx.session.user.discordId;

    // Check if this is a demo server request
    if (isDemoServer(input.serverId)) {
      return getDemoBans(input.page, input.limit, input.search, input.sortBy, input.sortOrder);
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

      const hasAllPermission = hasPermission(
        member?.permissions || [],
        "ALL"
      );

      if (!isOwner && !hasManageBansPermission) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to view bans for this server",
        });
      }

      // Determine if IP identifiers should be shown
      const showIpIdentifiers = isOwner || hasAllPermission;

      // Build search conditions
      const searchConditions = input.search
        ? {
            OR: [
              {
                banId: {
                  contains: input.search,
                  mode: "insensitive" as const,
                },
              },
              {
                reason: {
                  contains: input.search,
                  mode: "insensitive" as const,
                },
              },
              {
                player: {
                  playerName: {
                    contains: input.search,
                    mode: "insensitive" as const,
                  },
                },
              },
            ],
          }
        : {};

      // Build sort conditions
      const orderBy = (() => {
        switch (input.sortBy) {
          case "bannedAt":
            return { bannedAt: input.sortOrder };
          case "expiresAt":
            return { expiresAt: input.sortOrder };
          case "playTime":
            return { player: { playTime: input.sortOrder } };
          default:
            return { bannedAt: input.sortOrder };
        }
      })();

      // Get total count for pagination
      const totalCount = await ctx.db.ban.count({
        where: {
          licenseId: input.serverId,
          ...searchConditions,
        },
      });

      // Get bans with pagination
      const bans = await ctx.db.ban.findMany({
        where: {
          licenseId: input.serverId,
          ...searchConditions,
        },
        include: {
          player: {
            select: {
              id: true,
              playerName: true,
              playerLicense: true,
              identifiers: true,
              oldIdentifiers: true,
              firstJoin: true,
              lastJoin: true,
              playTime: true,
            },
          },
          identifiers: {
            select: {
              id: true,
              type: true,
              value: true,
            },
          },
        },
        orderBy,
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      });

      const totalPages = Math.ceil(totalCount / input.limit);

      // Filter IP identifiers if user doesn't have ALL permission
      const filteredBans = bans.map((ban) => ({
        ...ban,
        player: ban.player ? {
          ...ban.player,
          identifiers: showIpIdentifiers
            ? ban.player.identifiers
            : Array.isArray(ban.player.identifiers)
              ? (ban.player.identifiers as string[]).filter((id) => !id.startsWith("ip:"))
              : ban.player.identifiers,
          oldIdentifiers: showIpIdentifiers
            ? ban.player.oldIdentifiers
            : Array.isArray(ban.player.oldIdentifiers)
              ? (ban.player.oldIdentifiers as string[]).filter((id) => !id.startsWith("ip:"))
              : ban.player.oldIdentifiers,
        } : ban.player,
        identifiers: showIpIdentifiers
          ? ban.identifiers
          : ban.identifiers.filter((identifier) => !identifier.value.startsWith("ip:")),
      }));

      return {
        bans: filteredBans,
        pagination: {
          page: input.page,
          limit: input.limit,
          totalCount,
          totalPages,
          hasNextPage: input.page < totalPages,
          hasPreviousPage: input.page > 1,
        },
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error fetching bans",
      });
    }
  });
