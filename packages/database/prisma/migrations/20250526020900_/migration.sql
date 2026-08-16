/*
  Warnings:

  - The values [PLAYERS_BAN] on the enum `Permission` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Permission_new" AS ENUM ('ALL', 'CONFIGURATION', 'DOWNLOAD_FILES', 'MANAGE_ADMINS', 'MANAGE_BANS', 'PLAYERS_KICK', 'BYPASS');
ALTER TABLE "members" ALTER COLUMN "permissions" TYPE "Permission_new"[] USING ("permissions"::text::"Permission_new"[]);
ALTER TYPE "Permission" RENAME TO "Permission_old";
ALTER TYPE "Permission_new" RENAME TO "Permission";
DROP TYPE "Permission_old";
COMMIT;
