import { z } from "zod";
import { protectedProcedure } from "../lib/trpc";
import { randomUUID } from "crypto";

// Server owners can submit a player for global ban review.
export const submitToGlobalBan = protectedProcedure
  .input(z.object({
    banId:    z.string(),   // local Ban.id (UUID)
    serverId: z.string(),
  }))
  .mutation(async ({ ctx, input }) => {
    const { banId, serverId } = input;
    const discordId = ctx.session.user.discordId;

    // Verify the ban belongs to a license owned by this user
    const ban = await ctx.db.ban.findFirst({
      where: {
        id: banId,
        license: { discordId },
      },
      select: {
        id:          true,
        reason:      true,
        identifiers: { select: { value: true } },
        player:      { select: { playerName: true } },
        license:     { select: { serverName: true } },
      },
    });

    if (!ban) return { success: false, error: "Ban not found or not yours" };

    const identifiers = ban.identifiers.map((i: { value: string }) => i.value);
    if (identifiers.length === 0) return { success: false, error: "No identifiers on ban" };

    // Idempotent: don't double-submit for the same identifiers
    const existing = await ctx.db.$queryRaw<any[]>`
      SELECT id FROM global_bans
      WHERE identifiers && ${identifiers}::text[]
        AND status IN ('PENDING'::"GlobalBanStatus", 'APPROVED'::"GlobalBanStatus")
      LIMIT 1
    `;
    if (existing.length > 0) return { success: false, error: "Already submitted for global review" };

    const id = randomUUID();
    await ctx.db.$executeRaw`
      INSERT INTO global_bans
        ("id", "identifiers", "playerName", "reason", "sourceServer", "status", "createdAt", "updatedAt")
      VALUES (
        ${id},
        ${identifiers}::text[],
        ${ban.player?.playerName ?? "Unknown"},
        ${ban.reason ?? "Banned"},
        ${ban.license?.serverName ?? serverId},
        'PENDING'::"GlobalBanStatus",
        NOW(), NOW()
      )
    `;

    return { success: true };
  });

// Publicly visible to all authenticated customers — APPROVED bans only.
export const listApprovedGlobalBans = protectedProcedure
  .input(z.object({
    page:  z.number().min(1).default(1),
    limit: z.number().min(1).max(50).default(25),
  }))
  .query(async ({ ctx, input }) => {
    const { page, limit } = input;
    const offset = (page - 1) * limit;

    const [rows, countResult] = await Promise.all([
      ctx.db.$queryRaw<any[]>`
        SELECT id, "playerName", reason, "sourceServer", "createdAt", "reviewedAt"
        FROM global_bans
        WHERE status = 'APPROVED'::"GlobalBanStatus"
        ORDER BY "createdAt" DESC LIMIT ${limit} OFFSET ${offset}
      `,
      ctx.db.$queryRaw<any[]>`
        SELECT COUNT(*)::bigint AS count FROM global_bans
        WHERE status = 'APPROVED'::"GlobalBanStatus"
      `,
    ]);

    const total = Number(((countResult as any[])[0] as any).count);
    return { bans: rows as any[], total, pages: Math.ceil(total / limit) };
  });
