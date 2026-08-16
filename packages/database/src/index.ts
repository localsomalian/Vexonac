export {
  ServerLogType,
  SystemLogType,
  IdentifierType,
  LicenseType,
  Permission,
  DiscountType,
  PrismaClient,
} from "../prisma/generated/client";
export type {
  Account,
  ServerLog,
  Ban,
  BannedIdentifier,
  Config,
  Discount,
  License,
  Member,
  Player,
  Prisma,
  RedemptionKey,
  ServerInfo,
  Session,
  SharedConfiguration,
  User,
  Verification,
  Version,
} from "../prisma/generated/client";

// Export utility functions
export {
  checkDatabaseHealth,
  createPrismaClient,
  disconnectDatabase,
} from "./utils";
