import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../lib/trpc";

export const renameServer = protectedProcedure
  .input(z.object({
    serverId: z.string().uuid(),
    serverName: z.string().min(1).max(100),
  }))
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.discordId;

    const license = await ctx.db.license.findFirst({
      where: { id: input.serverId, discordId: userId },
      select: { id: true, serverName: true },
    });

    if (!license) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Server not found" });
    }

    await ctx.db.license.update({
      where: { id: input.serverId },
      data: { serverName: input.serverName },
    });

    await ctx.db.serverLog.create({
      data: {
        licenseId: input.serverId,
        systemType: "SERVER_RENAME",
        memberId: userId,
        details: { oldName: license.serverName, newName: input.serverName },
      },
    });

    return { success: true };
  });
