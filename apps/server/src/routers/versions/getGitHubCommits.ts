import { env } from "@/lib/env";
import { z } from "zod";
import { protectedProcedure } from "../../lib/trpc";

export const getGitHubCommits = protectedProcedure
  .input(
    z
      .object({
        perPage: z.number().min(1).max(100).optional().default(20),
      })
      .optional()
  )
  .query(async ({ input }) => {
    if (!env.GITHUB_TOKEN) {
      return [];
    }

    try {
      const perPage = input?.perPage || 20;

      const response = await fetch(
        `https://api.github.com/repos/AYZNN/VexonACV4/commits?per_page=${perPage}`,
        {
          headers: {
            Authorization: `token ${env.GITHUB_TOKEN}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      if (!response.ok) {
        return [];
      }

      const commits = await response.json();
      return commits.map((commit: any) => ({
        message: commit.commit.message,
        authorName: commit.commit.author.name,
        authorDate: commit.commit.author.date,
      }));
    } catch {
      return [];
    }
  });

