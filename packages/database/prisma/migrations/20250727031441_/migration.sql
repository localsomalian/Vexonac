/*
  Warnings:

  - The values [CHAT_MESSAGE] on the enum `ServerLogType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ServerLogType_new" AS ENUM ('UNBAN_ALL', 'UNBAN_PLAYER', 'BAN_PLAYER', 'KICK_PLAYER', 'KICK_ALL', 'PLAYER_JOIN', 'PLAYER_LEAVE', 'ENTITY_CREATE', 'KILL', 'EXPLOSION');
ALTER TABLE "server_logs" ALTER COLUMN "serverType" TYPE "ServerLogType_new" USING ("serverType"::text::"ServerLogType_new");
ALTER TYPE "ServerLogType" RENAME TO "ServerLogType_old";
ALTER TYPE "ServerLogType_new" RENAME TO "ServerLogType";
DROP TYPE "ServerLogType_old";
COMMIT;

-- CreateIndex
CREATE INDEX "server_logs_licenseId_createdAt_serverType_idx" ON "server_logs"("licenseId", "createdAt", "serverType");
