import { hasPermission } from "@/lib/utils";
import { TRPCError } from "@trpc/server";
import { Permission } from "@vexonac/database";
import { z } from "zod";
import { protectedProcedure } from "../../lib/trpc";
import { isDemoServer, getDemoServerMembers, serverIdSchema } from "../../lib/demo-data";

// Define the input schema with pagination and filters
const getServerMembersSchema = z.object({
  serverId: serverIdSchema,
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  search: z.string().optional(),
  permissions: z.array(z.nativeEnum(Permission)).optional(),
});

export const getServerMembers = protectedProcedure
  .input(getServerMembersSchema)
  .query(async ({ ctx, input }) => {
    const userId = ctx.session.user.discordId;

    // Check if this is a demo server request
    if (isDemoServer(input.serverId)) {
      const members = getDemoServerMembers();
      return {
        members,
        pagination: {
          page: 1,
          limit: input.limit,
          totalCount: members.length,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
        serverOwnerId: "demo-user-123456789",
      };
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

      // Check if user is owner or has MANAGE_ADMINS permission
      const isOwner = license.discordId === userId;
      const member = license.members[0];
      const hasManageAdminsPermission = hasPermission(
        member?.permissions || [],
        "MANAGE_ADMINS"
      );

      if (!isOwner && !hasManageAdminsPermission) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have permission to manage admins for this server",
        });
      }

      // First, get all users if we need to search by name/username
      let userFilterDiscordIds: string[] | undefined;
      if (input.search && input.search.trim()) {
        const searchTerm = input.search.toLowerCase();

        // Find users that match the search term
        const matchingUsers = await ctx.db.user.findMany({
          where: {
            OR: [
              {
                discordId: {
                  contains: input.search,
                  mode: "insensitive",
                },
              },
              {
                name: {
                  contains: input.search,
                  mode: "insensitive",
                },
              },
              {
                username: {
                  contains: input.search,
                  mode: "insensitive",
                },
              },
            ],
          },
          select: {
            discordId: true,
          },
        });

        userFilterDiscordIds = matchingUsers.map((u) => u.discordId);
      }

      // Build where clause for member filtering
      const whereClause: any = {
        licenseId: input.serverId,
      };

      // Add search functionality
      if (userFilterDiscordIds) {
        whereClause.discordId = {
          in: userFilterDiscordIds,
        };
      }

      // Add permission filter
      if (input.permissions && input.permissions.length > 0) {
        // Include users with "ALL" permission when filtering by specific permissions
        const permissionsToSearch = [...input.permissions];
        if (!permissionsToSearch.includes("ALL")) {
          permissionsToSearch.push("ALL");
        }

        whereClause.permissions = {
          hasSome: permissionsToSearch,
        };
      }

      const skip = (input.page - 1) * input.limit;

      // Get members with pagination
      const [members, totalCount] = await Promise.all([
        ctx.db.member.findMany({
          where: whereClause,
          skip,
          take: input.limit,
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            discordId: true,
            permissions: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        ctx.db.member.count({
          where: whereClause,
        }),
      ]);

      // Get user data for the members
      const memberDiscordIds = members.map((m) => m.discordId);
      const users = await ctx.db.user.findMany({
        where: {
          discordId: {
            in: memberDiscordIds,
          },
        },
        select: {
          discordId: true,
          name: true,
          username: true,
          image: true,
        },
      });

      // Create a map for quick user lookup
      const userMap = new Map(users.map((user) => [user.discordId, user]));

      // Combine member data with user data
      const membersWithUserData = members.map((member) => {
        const user = userMap.get(member.discordId);
        return {
          ...member,
          user: user || {
            discordId: member.discordId,
            name: "Unknown User",
            username: "unknown",
            image: null,
          },
        };
      });

      const totalPages = Math.ceil(totalCount / input.limit);

      return {
        members: membersWithUserData,
        pagination: {
          page: input.page,
          limit: input.limit,
          totalCount,
          totalPages,
          hasNextPage: input.page < totalPages,
          hasPrevPage: input.page > 1,
        },
        serverOwnerId: license.discordId, // Include server owner ID for frontend checks
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      console.error("Error fetching server members:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error fetching server members",
      });
    }
  });

