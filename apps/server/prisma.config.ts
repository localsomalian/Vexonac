import type { PrismaConfig } from "@prisma/config";
import "dotenv/config"; // uncomment this to load .env
import path from "node:path";

export default {
  earlyAccess: true,
  schema: path.join("../../packages/database/prisma/schema.prisma"),
} satisfies PrismaConfig;
