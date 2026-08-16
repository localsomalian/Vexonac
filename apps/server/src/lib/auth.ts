import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "../../prisma";
import { discordUserService } from "../services/discord-user.service";
import { env } from "./env";

export const auth: any = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  trustedOrigins: [env.CORS_ORIGIN || "", "https://vexonac.com"],
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // Cache pendant 5 minutes (300 secondes)
    },
    updateAge: 60 * 60 * 24, // Mettre Ã  jour la session tous les jours
    expiresIn: 60 * 60 * 24 * 7, // Session expire aprÃ¨s 7 jours
  },
  user: {
    additionalFields: {
      discordId: {
        type: "string",
        required: true,
      },
      username: {
        type: "string",
        required: true,
      },
      isBanned: {
        type: "boolean",
        required: false,
        defaultValue: false,
      },
      banReason: {
        type: "string",
        required: false,
      },
    },
  },
  socialProviders: {
    discord: {
      clientId: env.DISCORD_CLIENT_ID,
      clientSecret: env.DISCORD_CLIENT_SECRET,
      disableDefaultScope: true,
      scope: ["identify", "email", "guilds", "guilds.join"],
      mapProfileToUser: async (profile) => {
        return {
          discordId: profile.id,
          username: profile.username,
        };
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user: any, ctx: any) => {
          return {
            data: {
              ...user,
              discordId: user.discordId,
              username: user.username,
            },
          };
        },
      },
    },
    session: {
      create: {
        before: async (session: any) => {
          const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { isBanned: true, banReason: true },
          });
          if (user?.isBanned) {
            throw new Error(user.banReason || "Your account has been suspended. Contact support.");
          }
        },
        after: async (session: any, ctx: any) => {
          try {
            const user = await prisma.user.findUnique({
              where: { id: session.userId },
            });

            if (!user || !user.discordId) {
              return;
            }

            const isMember = await discordUserService.isUserMember(
              user.discordId
            );

            if (!isMember) {
              await discordUserService.joinUserToGuild(user.discordId);
            }

            const isCustomer = await prisma.license.findFirst({
              where: {
                discordId: user.discordId,
              },
              select: {
                isBanned: true,
              },
            });

            if (isCustomer && !isCustomer.isBanned) {
              await discordUserService.addCustomerRole(user.discordId);
            }
          } catch (error) {
            console.error("Error during auto-join to Discord server on login", {
              sessionId: session.id,
              error,
            });
          }
        },
      },
    },
  },
});

