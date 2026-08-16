import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../lib/trpc";

const deleteApiKeySchema = z.object({
  id: z.string(),
});

export const deleteApiKey = protectedProcedure
  .input(deleteApiKeySchema)
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.discordId;

    const apiKey = await ctx.db.aPIKey.findUnique({
      where: {
        id: input.id,
      },
    });

    if (!apiKey) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "API key not found",
      });
    }

    if (apiKey.discordId !== userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not own this API key",
      });
    }

    await ctx.db.aPIKey.delete({
      where: {
        id: input.id,
      },
    });

    return {
      success: true,
    };
  });