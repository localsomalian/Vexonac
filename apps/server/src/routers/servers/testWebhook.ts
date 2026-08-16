import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../lib/trpc";

export const testWebhook = protectedProcedure
  .input(z.object({ serverId: z.string(), webhookUrl: z.string().url(), webhookName: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.discordId;
    const server = await ctx.db.license.findUnique({
      where: { id: input.serverId },
      select: { discordId: true, serverName: true },
    });
    if (!server || server.discordId !== userId) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
    }

    const payload = {
      embeds: [{
        color: 0x5865f2,
        title: "✅ Webhook Test — VexonAC",
        description: `This is a test message for **${input.webhookName}** on server **${server.serverName}**.\n\nIf you see this, your webhook is working correctly!`,
        footer: { text: "VexonAC — Premium FiveM Anti-Cheat" },
        timestamp: new Date().toISOString(),
      }],
    };

    try {
      const res = await fetch(input.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Webhook returned ${res.status}: ${res.statusText}` });
      }
      return { success: true };
    } catch (err: any) {
      if (err instanceof TRPCError) throw err;
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: err.message ?? "Failed to send webhook" });
    }
  });
