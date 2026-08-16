import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../lib/trpc";

const filterSchema = z.string().uuid();

export const resetIp = protectedProcedure
  .input(filterSchema)
  .mutation(async ({ ctx, input: serverId }) => {
    const userId = ctx.session.user.discordId;

    try {
      // First check if the license exists and belongs to the user
      const license = await ctx.db.license.findFirst({
        where: {
          id: serverId,
          discordId: userId,
        },
        include: {
          serverInfo: {
            select: {
              lastActiveAt: true,
              isOnline: true,
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

      if (license.serverInfo?.isOnline) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Please stop your server before resetting the IP.",
        });
      }

      // Block IP reset only if the server has connected before but not recently (last 30 days).
      // New servers (no serverInfo yet) are always allowed to reset.
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const lastActiveAt = license.serverInfo?.lastActiveAt;

      if (lastActiveAt && lastActiveAt < thirtyDaysAgo) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "IP reset not allowed for inactive servers. Your server hasn't been active in the last 30 days. Please open a ticket on our Discord server for manual assistance.",
        });
      }

      // Update the license to reset the IP
      await ctx.db.license.update({
        where: {
          id: serverId,
          discordId: userId,
        },
        data: {
          serverIp: null,
        },
      });

      // Log the IP reset activity
      await ctx.db.serverLog.create({
        data: {
          licenseId: serverId,
          systemType: "IP_RESET",
          memberId: userId,
        },
      });

      return {
        success: true,
        message: "IP reset successfully",
      };
    } catch (error) {
      // Re-throw TRPCError instances
      if (error instanceof TRPCError) {
        throw error;
      }
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error resetting IP",
      });
    }
  });
