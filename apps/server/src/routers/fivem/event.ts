import { TRPCError } from "@trpc/server";
import { z } from "zod";
import type { Permission } from "@vexonac/database";
import { emitToServer } from "../../lib/emitToServer";
import { protectedProcedure } from "../../lib/trpc";
import { hasPermission } from "../../lib/utils";

const schema = z.object({
  serverId: z.string().uuid(),
  eventName: z.string(),
  data: z.any(),
});

export const eventEmit = protectedProcedure
  .input(schema)
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.discordId;

    const { eventName, data, serverId } = input;

    const server = await ctx.db.license.findUnique({
      where: { id: serverId },
      select: {
        discordId: true,
        members: {
          where: {
            discordId: userId,
          },
          select: {
            permissions: true,
          },
        },
      },
    });

    if (!server) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Server not found" });
    }

    const isOwner = server.discordId === userId;
    const permissions: Permission[] = isOwner ? ["ALL"] : (server.members[0]?.permissions || []);

    switch (eventName) {
      case "banPlayer":
        const hasManageBansPermission = hasPermission(
          permissions,
          "MANAGE_BANS"
        );

        if (!hasManageBansPermission) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have permission to ban players on this server",
          });
        }

        const success1 = await emitToServer(serverId, eventName, data);

        if (!success1) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to ban player",
          });
        }

        return { success: true };
      case "kickPlayer":
        const hasKickPermission = hasPermission(permissions, "PLAYERS_KICK");

        if (!hasKickPermission) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "You do not have permission to kick players on this server",
          });
        }

        const success2 = await emitToServer(serverId, eventName, data);

        if (!success2) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to kick player",
          });
        }

        return { success: true };

      case "screenshotPlayer":
        const hasAnyPermission = hasPermission(permissions, "ANY");

        if (!hasAnyPermission) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "You do not have permission to screenshot players on this server",
          });
        }

        const screenshotUrl = await emitToServer(serverId, eventName, data);

        if (!screenshotUrl) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to screenshot player",
          });
        }

        return { success: true, screenshotUrl };
      default:
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid event name",
        });
    }
  });
