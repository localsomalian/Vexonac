import { z } from "zod";
import { protectedProcedure } from "../../lib/trpc";
import { DEMO_SERVER_ID } from "../../lib/demo-data";

// Define the filter options
const filterSchema = z
  .enum(["all", "owned", "member"])
  .optional()
  .default("all");

export const getUserServersList = protectedProcedure
  .input(filterSchema)
  .query(async ({ ctx, input: filter }) => {
    const userId = ctx.session.user.discordId; // Assuming ctx.session.user.id is the discordId

    // Define the where clause based on the filter
    let whereClause = {};

    if (filter === "owned") {
      // Only servers where the user is the owner
      whereClause = {
        discordId: userId,
      };
    } else if (filter === "member") {
      // Only servers where the user is a member (not the owner)
      whereClause = {
        discordId: {
          not: userId, // Not the owner
        },
        members: {
          some: {
            discordId: userId,
          },
        },
      };
    } else {
      // "all" - both owned and member servers
      whereClause = {
        OR: [
          {
            discordId: userId, // User is the owner
          },
          {
            members: {
              // User is a member
              some: {
                discordId: userId,
              },
            },
          },
        ],
      };
    }

    const licenses = await ctx.db.license.findMany({
      where: whereClause,
      select: {
        // Select basic license fields and member/rank info
        id: true,
        serverName: true,
        bannerUrl: true,
        expiresAt: true,
        discordId: true, // Keep discordId to determine ownership
        serverInfo: {
          select: {
            playerCount: true,
            isOnline: true,
            version: true,
            lastActiveAt: true,
            maxSlots: true,
          },
        },
        members: {
          where: {
            discordId: userId,
          },
          select: {
            permissions: true,
          },
        },
        _count: {
          select: {
            bans: true, // Select the count of bans
          },
        },
      },
    });

    const userServersList = licenses.map((license) => {
      const isOwner = license.discordId === userId;
      const isMember = !isOwner && license.members.length > 0;

      const basicServerInfo = {
        id: license.id,
        serverName: license.serverName,
        bannerUrl: license.bannerUrl,
        expiresAt: license.expiresAt,
        serverInfo: {
          isOnline: license.serverInfo?.isOnline,
          version: license.serverInfo?.version,
          playerCount: license.serverInfo?.playerCount,
          banCount: license._count.bans,
          lastActiveAt: license.serverInfo?.lastActiveAt,
          maxSlots: license.serverInfo?.maxSlots,
        },
        isOwner: isOwner || false,
        isMember: isMember || false,
        permissions: isMember ? license.members[0]?.permissions || [] : [],
      };

      return basicServerInfo;
    });

    return userServersList;
  });
