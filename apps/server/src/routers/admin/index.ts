import { TRPCError } from "@trpc/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { adminProcedure, router } from "../../lib/trpc";
import { DiscountType, LicenseType } from "@vexonac/database";

export const adminRouter = router({
  getPlatformStats: adminProcedure.query(async ({ ctx }) => {
    const [totalUsers, totalServers, onlineServers, totalBans, unusedKeys, redeemedKeys] =
      await Promise.all([
        ctx.db.user.count(),
        ctx.db.license.count(),
        ctx.db.serverInfo.count({ where: { isOnline: true } }),
        ctx.db.ban.count(),
        ctx.db.redemptionKey.count(),
        ctx.db.license.count({ where: { licenseKey: { not: "" } } }),
      ]);
    return { totalUsers, totalServers, onlineServers, totalBans, unusedKeys, redeemedKeys };
  }),

  getAllUsers: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, search } = input;
      const skip = (page - 1) * limit;
      const where = search
        ? {
            OR: [
              { username: { contains: search, mode: "insensitive" as any } },
              { discordId: { contains: search } },
              { email: { contains: search, mode: "insensitive" as any } },
            ],
          }
        : {};

      const [users, total] = await Promise.all([
        ctx.db.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            discordId: true,
            username: true,
            name: true,
            email: true,
            image: true,
            isBanned: true,
            banReason: true,
            createdAt: true,
          },
        }),
        ctx.db.user.count({ where }),
      ]);

      const discordIds = users.map((u) => u.discordId);
      const licenses = await ctx.db.license.findMany({
        where: { discordId: { in: discordIds } },
        select: { discordId: true },
      });
      const licenseMap: Record<string, number> = {};
      for (const l of licenses) {
        if (l.discordId) licenseMap[l.discordId] = (licenseMap[l.discordId] ?? 0) + 1;
      }

      return {
        users: users.map((u) => ({
          ...u,
          serverCount: licenseMap[u.discordId] ?? 0,
        })),
        total,
        pages: Math.ceil(total / limit),
      };
    }),

  getAllServers: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, search } = input;
      const skip = (page - 1) * limit;
      const where = search
        ? {
            OR: [
              { serverName: { contains: search, mode: "insensitive" as any } },
              { discordId: { contains: search } },
            ],
          }
        : {};

      const [servers, total] = await Promise.all([
        ctx.db.license.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            serverInfo: {
              select: {
                isOnline: true,
                playerCount: true,
                maxSlots: true,
                lastActiveAt: true,
              },
            },
            _count: { select: { bans: true } },
          },
        }),
        ctx.db.license.count({ where }),
      ]);

      const discordIds = [...new Set(servers.map((s) => s.discordId))];
      const users = await ctx.db.user.findMany({
        where: { discordId: { in: discordIds } },
        select: { discordId: true, username: true },
      });
      const userMap = Object.fromEntries(users.map((u) => [u.discordId, u.username]));

      return {
        servers: servers.map((s) => ({
          id: s.id,
          serverName: s.serverName,
          discordId: s.discordId,
          licenseKey: s.licenseKey,
          serverIp: s.serverIp,
          expiresAt: s.expiresAt,
          isBanned: s.isBanned,
          createdAt: s.createdAt,
          serverInfo: s.serverInfo,
          banCount: s._count.bans,
          ownerUsername: userMap[s.discordId] ?? s.discordId,
        })),
        total,
        pages: Math.ceil(total / limit),
      };
    }),

  // All redeemed license keys with their server info
  getAllLicenseKeys: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, search } = input;
      const skip = (page - 1) * limit;
      const where = search
        ? {
            OR: [
              { licenseKey: { contains: search, mode: "insensitive" as any } },
              { serverName: { contains: search, mode: "insensitive" as any } },
              { discordId: { contains: search } },
            ],
          }
        : {};

      const [licenses, total] = await Promise.all([
        ctx.db.license.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            licenseKey: true,
            serverName: true,
            discordId: true,
            expiresAt: true,
            isBanned: true,
            createdAt: true,
          },
        }),
        ctx.db.license.count({ where }),
      ]);

      const discordIds = [...new Set(licenses.map((l) => l.discordId))];
      const users = await ctx.db.user.findMany({
        where: { discordId: { in: discordIds } },
        select: { discordId: true, username: true },
      });
      const userMap = Object.fromEntries(users.map((u) => [u.discordId, u.username]));

      return {
        licenses: licenses.map((l) => ({
          ...l,
          ownerUsername: userMap[l.discordId] ?? l.discordId,
        })),
        total,
        pages: Math.ceil(total / limit),
      };
    }),

  getRecentGlobalBans: adminProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(50) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.ban.findMany({
        take: input.limit,
        orderBy: { bannedAt: "desc" },
        include: {
          player: { select: { playerName: true, playerLicense: true } },
          license: { select: { serverName: true, discordId: true } },
          identifiers: { select: { type: true, value: true } },
        },
      });
    }),

  adminResetIp: adminProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input: serverId }) => {
      const license = await ctx.db.license.findUnique({ where: { id: serverId } });
      if (!license) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Server not found" });
      }
      await ctx.db.license.update({
        where: { id: serverId },
        data: { serverIp: null },
      });
      await ctx.db.serverLog.create({
        data: {
          licenseId: serverId,
          systemType: "IP_RESET",
          memberId: ctx.actorId,
        },
      });
      return { success: true };
    }),

  adminDeleteServer: adminProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input: serverId }) => {
      const license = await ctx.db.license.findUnique({ where: { id: serverId } });
      if (!license) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Server not found" });
      }
      await ctx.db.player.deleteMany({ where: { licenseId: serverId } });
      await ctx.db.license.delete({ where: { id: serverId } });
      return { success: true };
    }),

  generateLicenseKeys: adminProcedure
    .input(
      z.object({
        type: z.nativeEnum(LicenseType),
        count: z.number().min(1).max(10).default(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const keys = [];
      for (let i = 0; i < input.count; i++) {
        const key = `VXNC-${randomBytes(3).toString("hex").toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`;
        const created = await ctx.db.redemptionKey.create({
          data: {
            type: input.type,
            licenseKey: key,
            generatedBy: ctx.actorId,
          },
        });
        keys.push(created);
      }
      return keys;
    }),

  getRedemptionKeys: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit } = input;
      const skip = (page - 1) * limit;
      const [keys, total] = await Promise.all([
        ctx.db.redemptionKey.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        ctx.db.redemptionKey.count(),
      ]);
      return { keys, total, pages: Math.ceil(total / limit) };
    }),

  deleteRedemptionKey: adminProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: id }) => {
      await ctx.db.redemptionKey.delete({ where: { id } });
      return { success: true };
    }),

  getDiscounts: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.discount.findMany({ orderBy: { createdAt: "desc" } });
  }),

  createDiscount: adminProcedure
    .input(
      z.object({
        code: z.string().min(1),
        description: z.string().optional(),
        discountType: z.nativeEnum(DiscountType),
        discountAmount: z.number().min(0).default(0),
        discountPercentage: z.number().min(0).max(100).default(0),
        expiresAt: z.string().optional(),
        autoApply: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { expiresAt, ...rest } = input;
      return ctx.db.discount.create({
        data: {
          ...rest,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        },
      });
    }),

  toggleDiscount: adminProcedure
    .input(z.object({ id: z.string(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.discount.update({
        where: { id: input.id },
        data: { isActive: input.isActive },
      });
    }),

  deleteDiscount: adminProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: id }) => {
      await ctx.db.discount.delete({ where: { id } });
      return { success: true };
    }),

  adminUpdateServer: adminProcedure
    .input(z.object({
      serverId: z.string().uuid(),
      serverName: z.string().min(1).optional(),
      expiresAt: z.string().optional(),
      isBanned: z.boolean().optional(),
      banReason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { serverId, expiresAt, ...rest } = input;
      const license = await ctx.db.license.findUnique({ where: { id: serverId } });
      if (!license) throw new TRPCError({ code: "NOT_FOUND", message: "Server not found" });
      return ctx.db.license.update({
        where: { id: serverId },
        data: { ...rest, ...(expiresAt ? { expiresAt: new Date(expiresAt) } : {}) },
      });
    }),

  adminUpdateBan: adminProcedure
    .input(z.object({
      banId: z.string().uuid(),
      reason: z.string().optional(),
      expiresAt: z.string().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { banId, expiresAt, ...rest } = input;
      return ctx.db.ban.update({
        where: { id: banId },
        data: { ...rest, ...(expiresAt !== undefined ? { expiresAt: expiresAt ? new Date(expiresAt) : null } : {}) },
      });
    }),

  adminDeleteBan: adminProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input: banId }) => {
      await ctx.db.ban.delete({ where: { id: banId } });
      return { success: true };
    }),

  getRecentSystemLogs: adminProcedure
    .input(z.object({ limit: z.number().min(1).max(200).default(100) }))
    .query(async ({ ctx, input }) => {
      const logs = await ctx.db.serverLog.findMany({
        where: { systemType: { not: null } },
        take: input.limit,
        orderBy: { createdAt: "desc" },
        include: {
          license: { select: { serverName: true, discordId: true } },
        },
      });
      return logs;
    }),

  getExpiringLicenses: adminProcedure
    .input(z.object({ days: z.number().min(1).max(90).default(14) }))
    .query(async ({ ctx, input }) => {
      const cutoff = new Date(Date.now() + input.days * 24 * 60 * 60 * 1000);
      const licenses = await ctx.db.license.findMany({
        where: {
          expiresAt: { lte: cutoff, gte: new Date() },
          isBanned: false,
        },
        orderBy: { expiresAt: "asc" },
        select: {
          id: true,
          serverName: true,
          discordId: true,
          expiresAt: true,
          licenseKey: true,
        },
      });
      const discordIds = [...new Set(licenses.map((l) => l.discordId))];
      const users = await ctx.db.user.findMany({
        where: { discordId: { in: discordIds } },
        select: { discordId: true, username: true, email: true },
      });
      const userMap = Object.fromEntries(users.map((u) => [u.discordId, u]));
      return licenses.map((l) => ({
        ...l,
        ownerUsername: userMap[l.discordId]?.username ?? l.discordId,
        ownerEmail: userMap[l.discordId]?.email ?? null,
        daysLeft: Math.ceil((new Date(l.expiresAt).getTime() - Date.now()) / 86400000),
      }));
    }),

  adminBanUser: adminProcedure
    .input(z.object({
      userId: z.string(),
      banReason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({ where: { id: input.userId } });
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      if (user.discordId === process.env.DISCORD_OWNER_ID) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cannot ban the owner" });
      }
      await ctx.db.session.deleteMany({ where: { userId: input.userId } });
      return ctx.db.user.update({
        where: { id: input.userId },
        data: { isBanned: true, banReason: input.banReason || null },
      });
    }),

  adminUnbanUser: adminProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: userId }) => {
      const user = await ctx.db.user.findUnique({ where: { id: userId } });
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      return ctx.db.user.update({
        where: { id: userId },
        data: { isBanned: false, banReason: null },
      });
    }),

  adminUpdateDiscount: adminProcedure
    .input(z.object({
      id: z.string(),
      code: z.string().min(1).optional(),
      description: z.string().optional(),
      discountType: z.nativeEnum(DiscountType).optional(),
      discountAmount: z.number().min(0).optional(),
      discountPercentage: z.number().min(0).max(100).optional(),
      expiresAt: z.string().nullable().optional(),
      autoApply: z.boolean().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, expiresAt, ...rest } = input;
      return ctx.db.discount.update({
        where: { id },
        data: { ...rest, ...(expiresAt !== undefined ? { expiresAt: expiresAt ? new Date(expiresAt) : null } : {}) },
      });
    }),

  // ── Global Ban Management ─────────────────────────────────────

  listGlobalBans: adminProcedure
    .input(z.object({
      status: z.enum(["PENDING", "APPROVED", "REJECTED", "ALL"]).default("PENDING"),
      page:   z.number().min(1).default(1),
      limit:  z.number().min(1).max(100).default(25),
    }))
    .query(async ({ ctx, input }) => {
      const { status, page, limit } = input;
      const offset = (page - 1) * limit;
      const isAll = status === "ALL";

      const [rows, countResult] = await Promise.all([
        isAll
          ? ctx.db.$queryRaw<any[]>`
              SELECT id, identifiers, "playerName", reason, "sourceServer", status,
                     "reviewedBy", "reviewedAt", "createdAt", "updatedAt"
              FROM global_bans
              ORDER BY "createdAt" DESC LIMIT ${limit} OFFSET ${offset}
            `
          : ctx.db.$queryRaw<any[]>`
              SELECT id, identifiers, "playerName", reason, "sourceServer", status,
                     "reviewedBy", "reviewedAt", "createdAt", "updatedAt"
              FROM global_bans
              WHERE status = ${status}::"GlobalBanStatus"
              ORDER BY "createdAt" DESC LIMIT ${limit} OFFSET ${offset}
            `,
        isAll
          ? ctx.db.$queryRaw<any[]>`SELECT COUNT(*)::bigint AS count FROM global_bans`
          : ctx.db.$queryRaw<any[]>`SELECT COUNT(*)::bigint AS count FROM global_bans WHERE status = ${status}::"GlobalBanStatus"`,
      ]);

      const total = Number(((countResult as any[])[0] as any).count);
      return { bans: rows as any[], total, pages: Math.ceil(total / limit) };
    }),

  approveGlobalBan: adminProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: id }) => {
      const reviewedBy = ctx.actorId;
      await ctx.db.$executeRaw`
        UPDATE global_bans
        SET status = 'APPROVED'::"GlobalBanStatus",
            "reviewedBy" = ${reviewedBy},
            "reviewedAt" = NOW(),
            "updatedAt"  = NOW()
        WHERE id = ${id}
      `;
      return { success: true };
    }),

  rejectGlobalBan: adminProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: id }) => {
      const reviewedBy = ctx.actorId;
      await ctx.db.$executeRaw`
        UPDATE global_bans
        SET status = 'REJECTED'::"GlobalBanStatus",
            "reviewedBy" = ${reviewedBy},
            "reviewedAt" = NOW(),
            "updatedAt"  = NOW()
        WHERE id = ${id}
      `;
      return { success: true };
    }),

  deleteGlobalBan: adminProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: id }) => {
      await ctx.db.$executeRaw`DELETE FROM global_bans WHERE id = ${id}`;
      return { success: true };
    }),
});
