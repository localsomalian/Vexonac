import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../lib/trpc";

const filterSchema = z.string().uuid();

export const deleteServer = protectedProcedure
  .input(filterSchema)
  .mutation(async ({ ctx, input: serverId }) => {
    const userId = ctx.session.user.discordId;

    try {
      // Verify ownership before doing anything destructive
      const license = await ctx.db.license.findUnique({
        where: { id: serverId, discordId: userId },
        select: { id: true },
      });

      if (!license) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Server not found" });
      }

      // Delete child records that have Restrict FK constraints before deleting the license.
      // Order matters: BannedIdentifier → Ban → BanHistory → Player → License
      const bans = await ctx.db.ban.findMany({
        where: { licenseId: serverId },
        select: { id: true },
      });
      if (bans.length > 0) {
        await ctx.db.bannedIdentifier.deleteMany({
          where: { banId: { in: bans.map((b) => b.id) } },
        });
      }
      await ctx.db.ban.deleteMany({ where: { licenseId: serverId } });
      await ctx.db.banHistory.deleteMany({ where: { licenseId: serverId } });
      await ctx.db.player.deleteMany({ where: { licenseId: serverId } });

      await ctx.db.license.delete({ where: { id: serverId } });

      return { success: true, message: "Server deleted successfully" };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error deleting server",
      });
    }
  });
