import { initTRPC, TRPCError } from "@trpc/server";
import type { Context } from "./context";
import { env } from "./env";

export const t = initTRPC.context<Context>().create();

export const router = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  // Context already provides demo session for demo requests
  if (!ctx.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
      cause: "No session",
    });
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});

export const adminProcedure = t.procedure.use(({ ctx, next }) => {
  const isDiscordOwner = ctx.session?.user?.discordId === env.DISCORD_OWNER_ID;
  const isPanelAdmin = !!ctx.adminUser;
  if (!isDiscordOwner && !isPanelAdmin) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
  }
  return next({
    ctx: {
      ...ctx,
      actorId: ctx.session?.user?.discordId ?? `admin:${ctx.adminUser!.username}`,
    },
  });
});
