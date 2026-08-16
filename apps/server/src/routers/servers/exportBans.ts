import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../lib/trpc";

export const exportBans = protectedProcedure
  .input(z.object({ serverId: z.string() }))
  .query(async ({ ctx, input }) => {
    const userId = ctx.session.user.discordId;
    const server = await ctx.db.license.findUnique({
      where: { id: input.serverId },
      select: { discordId: true, serverName: true, members: { where: { discordId: userId }, select: { permissions: true } } },
    });
    if (!server || (server.discordId !== userId && server.members.length === 0)) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Server not found" });
    }

    const bans = await ctx.db.ban.findMany({
      where: { licenseId: input.serverId },
      include: {
        player: { select: { playerName: true, playerLicense: true } },
        identifiers: { select: { type: true, identifier: true } },
      },
      orderBy: { bannedAt: "desc" },
    });

    const rows = bans.map((b) => {
      const ids = b.identifiers.map((i) => `${i.type}:${i.identifier}`).join(" | ");
      return [
        b.banId,
        `"${(b.player?.playerName ?? "").replace(/"/g, '""')}"`,
        `"${(b.player?.playerLicense ?? "").replace(/"/g, '""')}"`,
        `"${(b.reason ?? "").replace(/"/g, '""')}"`,
        b.bannedBy ?? "",
        b.bannedAt.toISOString(),
        b.expiresAt ? b.expiresAt.toISOString() : "Permanent",
        `"${ids}"`,
      ].join(",");
    });

    const header = "Ban ID,Player Name,License,Reason,Banned By,Banned At,Expires At,Identifiers";
    const csv = [header, ...rows].join("\n");

    return { csv, serverName: server.serverName, count: bans.length };
  });
