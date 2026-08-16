import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../lib/trpc";

// Updated tags only (no categories)
const PREDEFINED_TAGS = [
  "Role-Play",
  "PvP",
  "Strict",
  "Performance",
  "Balanced",
] as const;

// Schema for getting user's configurations
const getUserConfigsSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(20),
});

// Schema for updating a configuration (no categories)
const updateConfigSchema = z.object({
  id: z.string().cuid("Invalid configuration ID format"),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  tags: z.array(z.enum(PREDEFINED_TAGS)).max(5).optional(),
  isPublic: z.boolean().optional(),
});

// Schema for deleting a configuration
const deleteConfigSchema = z.object({
  id: z.string().cuid("Invalid configuration ID format"),
});

// Schema for getting configuration details
const getConfigDetailsSchema = z.object({
  id: z.string().cuid("Invalid configuration ID format"),
});

// Get user's shared configurations
export const getUserConfigs = protectedProcedure
  .input(getUserConfigsSchema)
  .query(async ({ ctx, input }) => {
    const userId = ctx.session.user.discordId;

    try {
      const skip = (input.page - 1) * input.limit;

      const [configurations, totalCount] = await Promise.all([
        ctx.db.sharedConfiguration.findMany({
          where: {
            createdBy: {
              discordId: userId,
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: input.limit,
          select: {
            id: true,
            name: true,
            description: true,
            tags: true,
            createdAt: true,
            updatedAt: true,
            expiresAt: true,
            isPublic: true,
            importCount: true,
            viewCount: true,
            createdBy: {
              select: {
                username: true,
                image: true,
                discordId: true,
              },
            },
          },
        }),
        ctx.db.sharedConfiguration.count({
          where: {
            createdBy: {
              discordId: userId,
            },
          },
        }),
      ]);

      const totalPages = Math.ceil(totalCount / input.limit);

      return {
        configurations,
        pagination: {
          page: input.page,
          limit: input.limit,
          totalCount,
          totalPages,
          hasNextPage: input.page < totalPages,
          hasPrevPage: input.page > 1,
        },
      };
    } catch (error) {
      console.error("Error fetching user configurations:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error fetching user configurations",
      });
    }
  });

// Update a shared configuration
export const updateConfig = protectedProcedure
  .input(updateConfigSchema)
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.discordId;

    try {
      // Check if the configuration exists and belongs to the user
      const existingConfig = await ctx.db.sharedConfiguration.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          createdBy: {
            select: {
              discordId: true,
            },
          },
        },
      });

      if (!existingConfig) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Configuration not found",
        });
      }

      if (existingConfig.createdBy.discordId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only update your own configurations",
        });
      }

      // Update the configuration (no category field)
      const updatedConfig = await ctx.db.sharedConfiguration.update({
        where: { id: input.id },
        data: {
          ...(input.name !== undefined && { name: input.name }),
          ...(input.description !== undefined && {
            description: input.description,
          }),
          ...(input.tags !== undefined && { tags: input.tags }),
          ...(input.isPublic !== undefined && { isPublic: input.isPublic }),
          updatedAt: new Date(),
        },
        select: {
          id: true,
          name: true,
          description: true,
          tags: true,
          isPublic: true,
          updatedAt: true,
        },
      });

      return {
        success: true,
        configuration: updatedConfig,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      console.error("Error updating configuration:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error updating configuration",
      });
    }
  });

// Delete a shared configuration
export const deleteConfig = protectedProcedure
  .input(deleteConfigSchema)
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.discordId;

    try {
      // Check if the configuration exists and belongs to the user
      const existingConfig = await ctx.db.sharedConfiguration.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          name: true,
          createdBy: {
            select: {
              discordId: true,
            },
          },
        },
      });

      if (!existingConfig) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Configuration not found",
        });
      }

      if (existingConfig.createdBy.discordId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own configurations",
        });
      }

      // Delete the configuration
      await ctx.db.sharedConfiguration.delete({
        where: { id: input.id },
      });

      return {
        success: true,
        deletedConfig: {
          id: input.id,
          name: existingConfig.name,
        },
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      console.error("Error deleting configuration:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error deleting configuration",
      });
    }
  });

// Get configuration details for preview/editing
export const getConfigDetails = protectedProcedure
  .input(getConfigDetailsSchema)
  .query(async ({ ctx, input }) => {
    const userId = ctx.session.user.discordId;

    try {
      const config = await ctx.db.sharedConfiguration.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          name: true,
          description: true,
          tags: true,
          configuration: true,
          createdAt: true,
          updatedAt: true,
          expiresAt: true,
          isPublic: true,
          importCount: true,
          viewCount: true,
          createdBy: {
            select: {
              username: true,
              image: true,
              discordId: true,
            },
          },
        },
      });

      if (!config) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Configuration not found",
        });
      }

      // Only allow viewing if it's public or belongs to the user
      if (!config.isPublic && config.createdBy.discordId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot view this private configuration",
        });
      }

      return {
        success: true,
        configuration: config,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      console.error("Error fetching configuration details:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error fetching configuration details",
      });
    }
  });
