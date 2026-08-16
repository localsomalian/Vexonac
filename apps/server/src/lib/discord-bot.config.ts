import { env } from "./env";

export default {
  token: env.DISCORD_BOT_TOKEN || "",
  clientId: env.DISCORD_CLIENT_ID || "",
  guildId: env.DISCORD_GUILD_ID || "",
  ownerId: env.DISCORD_OWNER_ID || "",
  adminRoleId: env.DISCORD_ADMIN_ROLE_ID || "",
  operatorRoleId: env.DISCORD_OPERATOR_ROLE_ID || "",
  customerRoleId: env.DISCORD_CUSTOMER_ROLE_ID || "",
  modRoleId: env.DISCORD_MOD_ROLE_ID || "",
  autoRoleId: env.DISCORD_AUTO_ROLE_ID || "",
  logChannelId: env.DISCORD_LOG_CHANNEL_ID || "",
  welcomeChannelId: env.DISCORD_WELCOME_CHANNEL_ID || "",
  blacklistWords: (env.DISCORD_BLACKLIST_WORDS || "")
    .split(",")
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean),
  verifyChannelId: env.DISCORD_VERIFY_CHANNEL_ID || "",
  communityRoleId: env.DISCORD_COMMUNITY_ROLE_ID || "",
  ticketChannelId: env.DISCORD_TICKET_CHANNEL_ID || "",
  ticketCategoryId: env.DISCORD_TICKET_CATEGORY_ID || "",
  ticketLogChannelId: env.DISCORD_TICKET_LOG_CHANNEL_ID || "",
  supportRoleId: env.DISCORD_SUPPORT_ROLE_ID || "",
};
