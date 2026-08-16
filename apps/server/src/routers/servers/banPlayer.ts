import { hasPermission } from "@/lib/utils";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../lib/trpc";
import { isDemoServer, serverIdSchema } from "../../lib/demo-data";
import { banPlayerService } from "../../services/ban.service";

// Define the input schema for banning a player
const banPlayerSchema = z.object({
  serverId: serverIdSchema,
  playerIdentifier: z.string().min(1),
  reason: z.string().min(1),
  details: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
  evidenceUrl: z.string().url().optional(),
  expiresAt: z.string().datetime().optional(),
  bannedBy: z.string().optional(),
});

export const banPlayer = protectedProcedure
  .input(banPlayerSchema)
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.discordId;

    // Check if this is a demo server request
    if (isDemoServer(input.serverId)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "This action is not available in demo mode",
      });
    }

    try {
      // First, check if the user has access to this server
      const license = await ctx.db.license.findUnique({
        where: {
          id: input.serverId,
        },
        select: {
          id: true,
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

      if (!license) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Server not found",
        });
      }

      // Check if user is owner or has MANAGE_BANS permission
      const isOwner = license.discordId === userId;
      const member = license.members[0];
      const hasManageBansPermission = hasPermission(
        member?.permissions || [],
        "MANAGE_BANS"
      );

      if (!isOwner && !hasManageBansPermission) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to ban players on this server",
        });
      }

      // Use the shared ban service
      const result = await banPlayerService(ctx.db as any, {
        serverId: input.serverId,
        playerIdentifier: input.playerIdentifier,
        reason: input.reason,
        details: input.details,
        evidenceUrl: input.evidenceUrl,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        bannedBy: input.bannedBy || userId,
      });

      return result;
    } catch (error: any) {
      // Re-throw TRPC errors, otherwise wrap in INTERNAL_SERVER_ERROR
      if (error instanceof TRPCError) {
        throw error;
      }
      
      // Map specific service errors to TRPC errors
      if (error.message === "Player not found") {
        throw new TRPCError({ code: "NOT_FOUND", message: error.message });
      }
      if (error.message === "Player is already banned") {
        throw new TRPCError({ code: "CONFLICT", message: error.message });
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message || "Error banning player",
      });
    }
  });
