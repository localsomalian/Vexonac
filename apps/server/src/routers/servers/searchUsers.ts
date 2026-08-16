import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../lib/trpc";

// Define the input schema for searching users
const searchUsersSchema = z.object({
  query: z.string().min(1).max(100),
  limit: z.number().min(1).max(20).default(10),
});

export const searchUsers = protectedProcedure
  .input(searchUsersSchema)
  .query(async ({ ctx, input }) => {
    try {
      // Search for users by Discord ID, username, or name
      const users = await ctx.db.user.findMany({
        where: {
          OR: [
            {
              discordId: {
                contains: input.query,
                mode: "insensitive",
              },
            },
            {
              username: {
                contains: input.query,
                mode: "insensitive",
              },
            },
            {
              name: {
                contains: input.query,
                mode: "insensitive",
              },
            },
          ],
        },
        select: {
          discordId: true,
          name: true,
          username: true,
          image: true,
        },
        take: input.limit,
        orderBy: [
          {
            username: "asc",
          },
          {
            name: "asc",
          },
        ],
      });

      return {
        users,
      };
    } catch (error) {
      console.error("Error searching users:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error searching users",
      });
    }
  });
