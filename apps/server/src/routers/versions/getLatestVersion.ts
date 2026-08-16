import { protectedProcedure } from "../../lib/trpc";

export const getLatestVersion = protectedProcedure.query(async ({ ctx }) => {
  try {
    const latestVersion = await ctx.db.version.findFirst({
      orderBy: {
        updatedAt: "desc",
      },
    });
    return (
      latestVersion || {
        version: "0.0.0",
        updatedAt: new Date(),
        changelog: null,
      }
    );
  } catch (error) {
    console.error("Failed to fetch latest version:", error);
    throw new Error("Failed to fetch latest version");
  }
});
