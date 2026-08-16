import { hasPermission } from "@/lib/utils";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../lib/trpc";
import { r2DeleteService } from "../../lib/r2-delete-service";
import { filterR2Urls } from "@vexonac/utils";

// Define the input schema for unbanning all players
const unbanAllSchema = z.object({
  serverId: z.string().uuid(),
  unbannedBy: z.string().optional(),
});

export const unbanAll = protectedProcedure
  .input(unbanAllSchema)
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.discordId;

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

      // Check if user is owner or has UNBAN_ALL permission
      const isOwner = license.discordId === userId;
      const member = license.members[0];
      const hasUnbanAllPermission = hasPermission(
        member?.permissions || [],
        "UNBAN_ALL"
      );

      if (!isOwner && !hasUnbanAllPermission) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have permission to unban all players on this server",
        });
      }

      // First, get all evidence URLs before deleting bans
      const bansWithEvidence = await ctx.db.ban.findMany({
        where: {
          licenseId: input.serverId,
        },
        select: {
          evidenceUrl: true,
        },
      });

      // Delete all ban records for this server
      // The cascade delete will automatically remove related bannedIdentifier records
      const deleteResult = await ctx.db.ban.deleteMany({
        where: {
          licenseId: input.serverId,
        },
      });

      // Delete evidence files from R2 storage
      const evidenceUrls = bansWithEvidence.map(ban => ban.evidenceUrl);
      const r2Urls = filterR2Urls(evidenceUrls);
      
      if (r2Urls.length > 0 && r2DeleteService) {
        try {
          const deleteResult = await r2DeleteService.deleteByUrls(r2Urls);
          if (deleteResult.failureCount > 0) {
            console.warn(`Failed to delete ${deleteResult.failureCount} evidence files`);
          }
        } catch (error) {
          console.error(`Failed to delete evidence files for unban all:`, error);
          // Don't throw error here as the unban was successful
        }
      }

      await ctx.db.serverLog.create({
        data: {
          licenseId: input.serverId,
          serverType: "UNBAN_ALL",
          details: { unbannedBy: userId },
        },
      });

      return {
        success: true,
        unbannedCount: deleteResult.count,
        message: `Successfully unbanned ${deleteResult.count} player(s)`,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error unbanning all players",
      });
    }
  });

