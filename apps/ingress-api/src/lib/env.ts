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
  PORT: parseInt(process.env.PORT_INGRESS || "3002", 10),
  CORS_ORIGIN: process.env.CORS_ORIGIN_INGRESS_API as string,
  FIVEM_USER_AGENT: required("FIVEM_USER_AGENT"),
  ANTI_CRACK_WEBHOOK_URL: required("ANTI_CRACK_WEBHOOK_URL"),
  SERVERS_AUTH_WEBHOOK_URL: required("SERVERS_AUTH_WEBHOOK_URL"),
  SERVERS_BAN_WEBHOOK_URL: required("SERVERS_BAN_WEBHOOK_URL"),
  INGRESS_API_KEY: required("INGRESS_API_KEY"),
  GLOBAL_BAN_WEBHOOK_URL: process.env.GLOBAL_BAN_WEBHOOK_URL as string | undefined,
  GLOBAL_BAN_CHANNEL_ID: process.env.GLOBAL_BAN_CHANNEL_ID as string | undefined,
  DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN as string | undefined,
  WS_SIGNING_SECRET: process.env.WS_SIGNING_SECRET as string | undefined,
  PUBLIC_URL: (process.env.INGRESS_API_URL || process.env.PUBLIC_URL || "").replace(/\/$/, ""),
};
