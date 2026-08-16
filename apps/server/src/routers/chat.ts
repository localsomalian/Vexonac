import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../lib/trpc";

const chatRouter = router({
  getMessages: protectedProcedure
    .input(
      z.object({
        serverId: z.string(),
        before: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.discordId;

      // Verify access
      const license = await ctx.db.license.findFirst({
        where: {
          id: input.serverId,
          OR: [
            { discordId: userId },
            { members: { some: { discordId: userId } } },
          ],
        },
      });

      if (!license) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Server not found" });
      }

      type MsgRow = {
        id: string; licenseId: string; authorId: string; authorName: string;
        authorAvatar: string | null; content: string; messageType: string;
        metadata: unknown; createdAt: Date;
      };

      let rows: MsgRow[];
      if (input.before) {
        rows = await ctx.db.$queryRaw<MsgRow[]>`
          SELECT id, "licenseId", "authorId", "authorName", "authorAvatar",
                 content, "messageType", metadata, "createdAt"
          FROM admin_chat_messages
          WHERE "licenseId" = ${input.serverId}
            AND "createdAt" < (SELECT "createdAt" FROM admin_chat_messages WHERE id = ${input.before})
          ORDER BY "createdAt" DESC
          LIMIT ${input.limit}
        `;
      } else {
        rows = await ctx.db.$queryRaw<MsgRow[]>`
          SELECT id, "licenseId", "authorId", "authorName", "authorAvatar",
                 content, "messageType", metadata, "createdAt"
          FROM admin_chat_messages
          WHERE "licenseId" = ${input.serverId}
          ORDER BY "createdAt" DESC
          LIMIT ${input.limit}
        `;
      }

      return rows.reverse();
    }),

  sendMessage: protectedProcedure
    .input(
      z.object({
        serverId: z.string(),
        content: z.string().min(1).max(2000),
        messageType: z.enum(["text", "player_share", "location_share", "screenshot_share"]).default("text"),
        metadata: z.record(z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.discordId;
      const user = ctx.session.user;

      // Verify access
      const license = await ctx.db.license.findFirst({
        where: {
          id: input.serverId,
          OR: [
            { discordId: userId },
            { members: { some: { discordId: userId } } },
          ],
        },
      });

      if (!license) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Server not found" });
      }

      const id = crypto.randomUUID();
      const now = new Date();

      await ctx.db.$executeRaw`
        INSERT INTO admin_chat_messages (id, "licenseId", "authorId", "authorName", "authorAvatar", content, "messageType", metadata, "createdAt", "updatedAt")
        VALUES (${id}, ${input.serverId}, ${userId}, ${user.name || user.username || "Admin"}, ${user.image || null}, ${input.content}, ${input.messageType}, ${input.metadata ? JSON.stringify(input.metadata) : null}::jsonb, ${now}, ${now})
      `;

      return { id, createdAt: now };
    }),

  deleteMessage: protectedProcedure
    .input(z.object({ serverId: z.string(), messageId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.discordId;

      const rows = await ctx.db.$queryRaw<Array<{ authorId: string; licenseId: string }>>`
        SELECT "authorId", "licenseId" FROM admin_chat_messages WHERE id = ${input.messageId}
      `;
      const msg = rows[0];
      if (!msg) throw new TRPCError({ code: "NOT_FOUND" });
      if (msg.licenseId !== input.serverId) throw new TRPCError({ code: "NOT_FOUND" });

      // Check if user is author or server owner
      const license = await ctx.db.license.findFirst({
        where: { id: input.serverId, OR: [{ discordId: userId }, { members: { some: { discordId: userId } } }] },
      });
      if (!license) throw new TRPCError({ code: "FORBIDDEN" });

      const isOwner = license.discordId === userId;
      if (!isOwner && msg.authorId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Can only delete your own messages" });
      }

      await ctx.db.$executeRaw`DELETE FROM admin_chat_messages WHERE id = ${input.messageId}`;
      return { success: true };
    }),

  getOnlineAdmins: protectedProcedure
    .input(z.object({ serverId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.discordId;

      const license = await ctx.db.license.findFirst({
        where: {
          id: input.serverId,
          OR: [{ discordId: userId }, { members: { some: { discordId: userId } } }],
        },
        include: { members: true },
      });

      if (!license) throw new TRPCError({ code: "NOT_FOUND" });

      // Return list of all admins for this server
      const members = license.members.map((m) => ({
        discordId: m.discordId,
        isOwner: false,
      }));

      return [{ discordId: license.discordId, isOwner: true }, ...members];
    }),
});

export { chatRouter };
