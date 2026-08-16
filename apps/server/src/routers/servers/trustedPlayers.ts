import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../lib/trpc";

async function assertOwnerOrMember(ctx: any, serverId: string) {
  const userId = ctx.session.user.discordId;
  const server = await ctx.db.license.findUnique({
    where: { id: serverId },
    select: {
      discordId: true,
      members: { where: { discordId: userId }, select: { permissions: true } },
    },
  });
  if (!server) throw new TRPCError({ code: "NOT_FOUND" });
  const isOwner = server.discordId === userId;
  const isMember = server.members.length > 0;
  if (!isOwner && !isMember) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You don't have access to this server" });
  }
}

export const getTrustedPlayers = protectedProcedure
  .input(z.object({ serverId: z.string() }))
  .query(async ({ ctx, input }) => {
    await assertOwnerOrMember(ctx, input.serverId);
    return ctx.db.trustedPlayer.findMany({
      where: { licenseId: input.serverId },
      orderBy: { createdAt: "desc" },
    });
  });

export const addTrustedPlayer = protectedProcedure
  .input(z.object({
    serverId: z.string(),
    playerLicense: z.string().min(1, "License is required").max(200),
    note: z.string().max(200).optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    await assertOwnerOrMember(ctx, input.serverId);
    const userId = ctx.session.user.discordId;
    const username = (ctx.session.user as any).username ?? userId;
    try {
      return await ctx.db.trustedPlayer.create({
        data: {
          licenseId: input.serverId,
          playerLicense: input.playerLicense.trim(),
          note: input.note ?? null,
          addedBy: userId,
          addedByName: username,
        },
      });
    } catch (err: any) {
      if (err?.code === "P2002") throw new TRPCError({ code: "CONFLICT", message: "This player is already trusted" });
      throw err;
    }
  });

export const removeTrustedPlayer = protectedProcedure
  .input(z.object({ serverId: z.string(), id: z.string() }))
  .mutation(async ({ ctx, input }) => {
    await assertOwnerOrMember(ctx, input.serverId);
    const entry = await ctx.db.trustedPlayer.findUnique({ where: { id: input.id } });
    if (!entry || entry.licenseId !== input.serverId) throw new TRPCError({ code: "NOT_FOUND" });
    await ctx.db.trustedPlayer.delete({ where: { id: input.id } });
    return { success: true };
  });
