import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../lib/trpc";
import { isDemoServer, getDemoServerData, serverIdSchema } from "../../lib/demo-data";

// Define the filter options
const filterSchema = serverIdSchema;

export const getServer = protectedProcedure
  .input(filterSchema)
  .query(async ({ ctx, input: serverId }) => {
    const userId = ctx.session.user.discordId;

    // Check if this is a demo server request
    if (isDemoServer(serverId)) {
      return getDemoServerData();
    }

    try {
      const license = await ctx.db.license.findUnique({
        where: {
          id: serverId,
        },
        select: {
          id: true,
          serverName: true,
          isBanned: true,
          bannerUrl: true,
          expiresAt: true,
          serverIp: true,
          licenseKey: true,
          discordId: true,
          serverInfo: {
            select: {
              playerCount: true,
              isOnline: true,
              version: true,
              maxSlots: true,
            },
          },
          members: {
            where: {
              discordId: userId,
            },
            select: {
              discordId: true,
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

      if (!license) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Server not found",
        });
      }

      const isOwner = license.discordId === userId;
      const isMember = !isOwner && license.members.length > 0;

      return {
        ...license,
        ...(isOwner && { isOwner: true }),
        ...(isMember && {
          isMember: true,
          permissions: license.members[0]?.permissions || [],
        }),
        ...(!isOwner && {
          licenseKey: undefined,
          serverIp: undefined,
        }),
        isBanned: license.isBanned,
        serverInfo: {
          version: license.serverInfo?.version,
          isOnline: license.serverInfo?.isOnline,
          playerCount: license.serverInfo?.playerCount,
          banCount: license._count.bans,
          maxSlots: license.serverInfo?.maxSlots,
        },
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error fetching server",
      });
    }
  });
