import { hasPermission } from "@/lib/utils";
import { TRPCError } from "@trpc/server";
import { Permission } from "@vexonac/database";
import { z } from "zod";
import { protectedProcedure } from "../../lib/trpc";

// Define the input schema for adding a member
const addServerMemberSchema = z.object({
  serverId: z.string().uuid(),
  discordId: z.string().min(1),
  permissions: z.array(z.nativeEnum(Permission)).default([]),
});

export const addServerMember = protectedProcedure
  .input(addServerMemberSchema)
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
          isBanned: true,
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
          message: "You do not have permission to add admins to this server",
        });
      }

      // Check if the license is banned
      if (license.isBanned) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot add admins to a banned server",
        });
      }

      // Check if the target user exists
      const targetUser = await ctx.db.user.findFirst({
        where: {
          discordId: input.discordId,
        },
        select: {
          discordId: true,
          name: true,
          username: true,
          image: true,
        },
      });

      if (!targetUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "User not found. Make sure the user has logged into VexonAC at least once.",
        });
      }

      // Check if user is already a member
      const existingMember = await ctx.db.member.findUnique({
        where: {
          licenseId_discordId: {
            licenseId: input.serverId,
            discordId: input.discordId,
          },
        },
      });

      if (existingMember) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User is already a member of this server",
        });
      }

      // Prevent adding the owner as a member
      if (input.discordId === license.discordId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot add the server owner as a member",
        });
      }

      // Create the new member
      const newMember = await ctx.db.member.create({
        data: {
          licenseId: input.serverId,
          discordId: input.discordId,
          permissions: input.permissions,
        },
        select: {
          id: true,
          discordId: true,
          permissions: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Log the activity
      await ctx.db.serverLog.create({
        data: {
          licenseId: input.serverId,
          systemType: "MEMBER_ADD",
          details: {
            member: targetUser.username,
            discordId: input.discordId,
          },
          memberId: userId,
        },
      });

      return {
        success: true,
        member: {
          ...newMember,
          user: targetUser,
        },
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      console.error("Error adding server member:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error adding server member",
      });
    }
  });


