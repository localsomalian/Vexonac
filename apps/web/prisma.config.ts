import type { PrismaConfig } from "@prisma/config";
import "dotenv/config";
import path from "node:path";

export default {
  earlyAccess: true,
  schema: path.join("../../packages/database/prisma/schema.prisma"),
} satisfies PrismaConfig;
