import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../lib/trpc";

async function assertAccess(ctx: any, serverId: string) {
  const userId = ctx.session.user.discordId;
  const server = await ctx.db.license.findUnique({
    where: { id: serverId },
    select: { discordId: true, members: { where: { discordId: userId }, select: { permissions: true } } },
  });
  if (!server || (server.discordId !== userId && server.members.length === 0)) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Server not found" });
  }
  return { isOwner: server.discordId === userId };
}

export const getPlayerNotes = protectedProcedure
  .input(z.object({ serverId: z.string(), playerId: z.string() }))
  .query(async ({ ctx, input }) => {
    await assertAccess(ctx, input.serverId);
    return ctx.db.playerNote.findMany({
      where: { playerId: input.playerId, licenseId: input.serverId },
      orderBy: { createdAt: "desc" },
    });
  });

export const addPlayerNote = protectedProcedure
  .input(z.object({ serverId: z.string(), playerId: z.string(), note: z.string().min(1).max(500) }))
  .mutation(async ({ ctx, input }) => {
    await assertAccess(ctx, input.serverId);
    const userId = ctx.session.user.discordId;
    const username = (ctx.session.user as any).username ?? userId;
    return ctx.db.playerNote.create({
      data: {
        playerId: input.playerId,
        licenseId: input.serverId,
        authorId: userId,
        authorName: username,
        note: input.note,
      },
    });
  });

export const deletePlayerNote = protectedProcedure
  .input(z.object({ serverId: z.string(), noteId: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const { isOwner } = await assertAccess(ctx, input.serverId);
    const userId = ctx.session.user.discordId;
    const note = await ctx.db.playerNote.findUnique({ where: { id: input.noteId } });
    if (!note || note.licenseId !== input.serverId) throw new TRPCError({ code: "NOT_FOUND" });
    if (!isOwner && note.authorId !== userId) throw new TRPCError({ code: "FORBIDDEN", message: "You can only delete your own notes" });
    await ctx.db.playerNote.delete({ where: { id: input.noteId } });
    return { success: true };
  });
