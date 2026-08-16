import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../lib/trpc";
import { hashPassword, signAdminJwt, verifyPassword } from "../lib/adminJwt";
import { env } from "../lib/env";

const COOKIE_NAME = "_vadmin_token";
const COOKIE_TTL_SECONDS = 7 * 24 * 3600;

function setAdminCookie(res: any, token: string) {
  if (!res) return;
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${COOKIE_TTL_SECONDS}; SameSite=Lax`,
  );
}

function clearAdminCookie(res: any) {
  if (!res) return;
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`,
  );
}

export const adminAuthRouter = router({
  isAdmin: publicProcedure.query(({ ctx }) => {
    const isDiscordOwner = ctx.session?.user?.discordId === env.DISCORD_OWNER_ID;
    const isPanelAdmin = !!ctx.adminUser;
    return isDiscordOwner || isPanelAdmin;
  }),

  me: publicProcedure.query(({ ctx }) => {
    if (!ctx.adminUser) return null;
    return {
      username: ctx.adminUser.username,
      role: ctx.adminUser.role,
    };
  }),

  login: publicProcedure
    .input(
      z.object({
        username: z.string().min(1),
        password: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.adminUser.findUnique({
        where: { username: input.username },
      });
      if (!user || !verifyPassword(input.password, user.passwordHash)) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
      }
      const token = signAdminJwt(
        { sub: user.id, username: user.username, role: user.role },
        env.TOKEN_SECRET_KEY,
        COOKIE_TTL_SECONDS,
      );
      setAdminCookie(ctx.res, token);
      return { username: user.username, role: user.role };
    }),

  logout: publicProcedure.mutation(({ ctx }) => {
    clearAdminCookie(ctx.res);
    return { success: true };
  }),

  listAdmins: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.adminUser.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, username: true, role: true, createdAt: true },
    });
  }),

  createAdmin: adminProcedure
    .input(
      z.object({
        username: z
          .string()
          .min(3)
          .max(32)
          .regex(/^[a-zA-Z0-9_-]+$/, "Username must be alphanumeric, dashes, or underscores"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        role: z.enum(["admin", "superadmin"]).default("admin"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.adminUser.findUnique({ where: { username: input.username } });
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Username already taken" });
      }
      const passwordHash = hashPassword(input.password);
      return ctx.db.adminUser.create({
        data: { username: input.username, passwordHash, role: input.role },
        select: { id: true, username: true, role: true, createdAt: true },
      });
    }),

  deleteAdmin: adminProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: id }) => {
      const user = await ctx.db.adminUser.findUnique({ where: { id } });
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "Admin not found" });
      await ctx.db.adminUser.delete({ where: { id } });
      return { success: true };
    }),

  changePassword: adminProcedure
    .input(
      z.object({
        id: z.string(),
        newPassword: z.string().min(8, "Password must be at least 8 characters"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.adminUser.findUnique({ where: { id: input.id } });
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "Admin not found" });
      const passwordHash = hashPassword(input.newPassword);
      await ctx.db.adminUser.update({ where: { id: input.id }, data: { passwordHash } });
      return { success: true };
    }),
});
