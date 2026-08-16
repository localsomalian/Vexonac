import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Get the directory path for the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../../");

// Load environment variables based on NODE_ENV
const NODE_ENV = process.env.NODE_ENV || "development";

// Only load .env file if DATABASE_URL is not already set (indicating we're not in Docker)
if (NODE_ENV === "development") {
  const envFile = ".env.development";
  const envPath = path.resolve(rootDir, envFile);

  if (fs.existsSync(envPath)) {
    const result = dotenv.config({ path: envPath });

    if (result.error) {
      console.error(`Error loading ${envFile}:`, result.error);
      throw result.error;
    }

    console.log(`Loaded environment configuration from ${envFile}`);
  } else {
    console.warn(
      `Missing ${envFile}. Create it from ${envFile}.example or set env vars in your shell.`
    );
  }
} else {
  console.log("Using environment variables from Docker/system");
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const env = {
  NODE_ENV,
  DATABASE_URL: required("DATABASE_URL"),
  PORT: parseInt(process.env.PORT_SERVER || "3000", 10),
  CORS_ORIGIN: process.env.CORS_ORIGIN_SERVER_APP as string,
  DISCORD_CLIENT_ID: required("DISCORD_CLIENT_ID"),
  DISCORD_CLIENT_SECRET: required("DISCORD_CLIENT_SECRET"),
  DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN as string,
  DISCORD_GUILD_ID: process.env.DISCORD_GUILD_ID as string,
  DISCORD_OWNER_ID: process.env.DISCORD_OWNER_ID as string,
  DISCORD_ADMIN_ROLE_ID: process.env.DISCORD_ADMIN_ROLE_ID as string,
  DISCORD_OPERATOR_ROLE_ID: process.env.DISCORD_OPERATOR_ROLE_ID as string,
  DISCORD_CUSTOMER_ROLE_ID: process.env.DISCORD_CUSTOMER_ROLE_ID as string,
  DISCORD_MOD_ROLE_ID: process.env.DISCORD_MOD_ROLE_ID as string,
  DISCORD_AUTO_ROLE_ID: process.env.DISCORD_AUTO_ROLE_ID as string,
  DISCORD_LOG_CHANNEL_ID: process.env.DISCORD_LOG_CHANNEL_ID as string,
  DISCORD_WELCOME_CHANNEL_ID: process.env.DISCORD_WELCOME_CHANNEL_ID as string,
  DISCORD_BLACKLIST_WORDS: process.env.DISCORD_BLACKLIST_WORDS as string,
  DISCORD_VERIFY_CHANNEL_ID: process.env.DISCORD_VERIFY_CHANNEL_ID as string,
  DISCORD_COMMUNITY_ROLE_ID: process.env.DISCORD_COMMUNITY_ROLE_ID as string,
  DISCORD_TICKET_CHANNEL_ID: process.env.DISCORD_TICKET_CHANNEL_ID as string,
  DISCORD_TICKET_CATEGORY_ID: process.env.DISCORD_TICKET_CATEGORY_ID as string,
  DISCORD_TICKET_LOG_CHANNEL_ID: process.env.DISCORD_TICKET_LOG_CHANNEL_ID as string,
  DISCORD_SUPPORT_ROLE_ID: process.env.DISCORD_SUPPORT_ROLE_ID as string,
  DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL as string,
  DISCORD_ERROR_WEBHOOK_URL: process.env.DISCORD_ERROR_WEBHOOK_URL as string,
  TOKEN_SECRET_KEY: required("TOKEN_SECRET_KEY"),
  GITHUB_TOKEN: process.env.GITHUB_TOKEN as string,
  INGRESS_API_KEY: required("INGRESS_API_KEY"),
  INGRESS_API_URL: required("INGRESS_API_URL"),
  INGRESS_API_WEBSOCKET_URL: required("INGRESS_API_WEBSOCKET_URL"),
  CLOUDFLARE_TURN_TOKEN_ID: process.env.CLOUDFLARE_TURN_TOKEN_ID as string,
  CLOUDFLARE_TURN_API_TOKEN: process.env.CLOUDFLARE_TURN_API_TOKEN as string,
};
