import { hasPermission } from "@/lib/utils";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../lib/trpc";
import { isDemoServer, serverIdSchema } from "../../lib/demo-data";
import { r2DeleteService } from "../../lib/r2-delete-service";

// Define the input schema for unbanning a player
const unbanPlayerSchema = z.object({
  serverId: serverIdSchema,
  banId: z.string().min(1),
  unbannedBy: z.string().optional(),
});

export const unbanPlayer = protectedProcedure
  .input(unbanPlayerSchema)
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
          message: "You do not have permission to unban players on this server",
        });
      }

      // Use transaction to ensure data consistency
      const result = await (ctx.db.$transaction as any)(async (tx: any) => {
        // Find the ban record
        const ban = await tx.ban.findUnique({
          where: {
            licenseId_banId: {
              licenseId: input.serverId,
              banId: input.banId,
            },
          },
          select: {
            id: true,
            banId: true,
            evidenceUrl: true,
            identifiers: true,
            player: {
              select: {
                playerName: true,
              },
            },
          },
        });

        if (!ban) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Ban not found",
          });
        }

        // Adaptive scoring: find the detection code(s) that led to this ban
        // and record them as false positives for this server's calibration
        const recentDetections = await tx.serverLog.findMany({
          where: {
            licenseId: input.serverId,
            serverType: "DETECTION",
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
          select: { details: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        });

        const fpCodes: string[] = [];
        for (const log of recentDetections) {
          const d = log.details as any;
          if (d?.code && typeof d.code === "string") fpCodes.push(d.code);
        }

        if (fpCodes.length > 0) {
          const lic = await tx.license.findUnique({
            where: { id: input.serverId },
            select: { configuration: true },
          });
          if (lic) {
            const cfg = (lic.configuration as Record<string, any>) ?? {};
            const fp: Record<string, number> = (cfg._fpCounts as Record<string, number>) ?? {};
            for (const code of [...new Set(fpCodes)]) {
              fp[code] = (fp[code] ?? 0) + 1;
            }
            await tx.license.update({
              where: { id: input.serverId },
              data: { configuration: { ...cfg, _fpCounts: fp } },
            });
          }
        }

        // Delete the ban record
        await tx.ban.delete({
          where: {
            id: ban.id,
          },
        });

        await tx.serverLog.create({
          data: {
            licenseId: input.serverId,
            serverType: "UNBAN_PLAYER",
            details: { banId: input.banId, unbannedBy: userId, fpHints: fpCodes.slice(0, 3) },
          },
        });

        return {
          success: true,
          playerName: ban.player.playerName,
          banId: input.banId,
          evidenceUrl: ban.evidenceUrl,
        };
      });

      // Delete evidence from R2 storage if it exists and is from our R2 storage
      if (result.evidenceUrl && result.evidenceUrl.includes('r2.vexonac.com') && r2DeleteService) {
        try {
          const deleteResult = await r2DeleteService.deleteByUrls(result.evidenceUrl);
          if (deleteResult.successCount > 0) {
            console.log(`Successfully deleted evidence file for ban ${result.banId}`);
          } else {
            console.warn(`Failed to delete evidence file for ban ${result.banId}`);
          }
        } catch (error) {
          console.error(`Failed to delete evidence file for ban ${result.banId}:`, error);
          // Don't throw error here as the unban was successful
        }
      }

      return result;
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error unbanning player",
      });
    }
  });

