import { hasPermission } from "@/lib/utils";
import { TRPCError } from "@trpc/server";
import { Permission } from "@vexonac/database";
import { z } from "zod";
import { protectedProcedure } from "../../lib/trpc";

// Define the input schema for updating a member
const updateServerMemberSchema = z.object({
  serverId: z.string().uuid(),
  memberId: z.string().uuid(),
  permissions: z.array(z.nativeEnum(Permission)),
});

export const updateServerMember = protectedProcedure
  .input(updateServerMemberSchema)
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

      // Check if user is owner or has MANAGE_ADMINS permission
      const isOwner = license.discordId === userId;
      const member = license.members[0];
      const hasManageAdminsPermission = hasPermission(
        member?.permissions || [],
        "MANAGE_ADMINS"
      );

      if (!isOwner && !hasManageAdminsPermission) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have permission to update admin permissions for this server",
        });
      }

      // Find the member to update
      const existingMember = await ctx.db.member.findUnique({
        where: {
          id: input.memberId,
        },
        select: {
          id: true,
          discordId: true,
          licenseId: true,
          permissions: true,
        },
      });

      if (!existingMember) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Member not found",
        });
      }

      // Verify the member belongs to the correct server
      if (existingMember.licenseId !== input.serverId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Member does not belong to this server",
        });
      }

      // Prevent editing server owner permissions
      if (existingMember.discordId === license.discordId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot modify server owner permissions",
        });
      }

      // Prevent non-owners from editing their own permissions
      if (!isOwner && existingMember.discordId === userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot modify your own permissions",
        });
      }

      // Update the member's permissions
      const updatedMember = await ctx.db.member.update({
        where: {
          id: input.memberId,
        },
        data: {
          permissions: input.permissions,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          discordId: true,
          permissions: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Get user data for the updated member
      const targetUser = await ctx.db.user.findFirst({
        where: {
          discordId: existingMember.discordId,
        },
        select: {
          discordId: true,
          name: true,
          username: true,
          image: true,
        },
      });

      // Log the activity
      await ctx.db.serverLog.create({
        data: {
          licenseId: input.serverId,
          systemType: "MEMBER_UPDATE",
          details: {
            member: targetUser?.username || existingMember.discordId,
            discordId: existingMember.discordId,
          },
          memberId: userId,
        },
      });

      return {
        success: true,
        member: {
          ...updatedMember,
          user: targetUser || {
            discordId: existingMember.discordId,
            name: "Unknown User",
            username: "unknown",
            image: null,
          },
        },
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      console.error("Error updating server member:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error updating server member",
      });
    }
  });

