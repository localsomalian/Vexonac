import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../lib/trpc";

// Define the input schema for browsing configurations
const browseConfigsSchema = z.object({
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  sortBy: z.enum(["newest", "oldest", "popular", "name"]).default("newest"),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(20),
});

// Schema for tracking imports
const trackImportSchema = z.object({
  id: z.string().cuid("Invalid configuration ID format"),
});

export const browseConfigs = protectedProcedure
  .input(browseConfigsSchema)
  .query(async ({ ctx, input }) => {
    try {
      // Build the where clause for filtering
      const where: any = {
        isPublic: true,
        // Only show non-expired configurations
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      };

      // Add search filter
      if (input.search) {
        where.OR = [
          { name: { contains: input.search, mode: "insensitive" } },
          { description: { contains: input.search, mode: "insensitive" } },
        ];
      }

      // Category filtering removed

      // Add tags filter
      if (input.tags && input.tags.length > 0) {
        where.tags = {
          hasSome: input.tags,
        };
      }

      // Build the orderBy clause
      let orderBy: any;
      switch (input.sortBy) {
        case "newest":
          orderBy = { createdAt: "desc" };
          break;
        case "oldest":
          orderBy = { createdAt: "asc" };
          break;
        case "popular":
          orderBy = { importCount: "desc" };
          break;
        case "name":
          orderBy = { name: "asc" };
          break;
        default:
          orderBy = { createdAt: "desc" };
      }

      // Calculate pagination
      const skip = (input.page - 1) * input.limit;

      // Get configurations and total count
      const [configurations, totalCount] = await Promise.all([
        ctx.db.sharedConfiguration.findMany({
          where,
          orderBy,
          skip,
          take: input.limit,
          select: {
            id: true,
            name: true,
            description: true,
            tags: true,
            createdAt: true,
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
        ctx.db.sharedConfiguration.count({ where }),
      ]);

      // Increment view count for viewed configurations
      if (configurations.length > 0) {
        const configIds = configurations.map((config) => config.id);
        await ctx.db.sharedConfiguration.updateMany({
          where: { id: { in: configIds } },
          data: {
            viewCount: {
              increment: 1,
            },
          },
        });
      }

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalCount / input.limit);
      const hasNextPage = input.page < totalPages;
      const hasPrevPage = input.page > 1;

      return {
        configurations,
        pagination: {
          page: input.page,
          limit: input.limit,
          totalCount,
          totalPages,
          hasNextPage,
          hasPrevPage,
        },
      };
    } catch (error) {
      console.error("Error browsing configurations:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error browsing configurations",
      });
    }
  });

// Track configuration import (increment count)
export const trackImport = protectedProcedure
  .input(trackImportSchema)
  .mutation(async ({ ctx, input }) => {
    try {
      // Find and update the configuration
      const config = await ctx.db.sharedConfiguration.findUnique({
        where: { id: input.id },
        select: { id: true, name: true, isPublic: true, expiresAt: true },
      });

      if (!config) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Configuration not found",
        });
      }

      // Check if configuration is public and not expired
      if (!config.isPublic) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Configuration is not public",
        });
      }

      if (config.expiresAt && config.expiresAt < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Configuration has expired",
        });
      }

      // Increment import count
      await ctx.db.sharedConfiguration.update({
        where: { id: input.id },
        data: {
          importCount: {
            increment: 1,
          },
        },
      });

      return {
        success: true,
        message: "Import tracked successfully",
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      console.error("Error tracking import:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error tracking import",
      });
    }
  });
