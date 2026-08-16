/*
  Warnings:

  - You are about to drop the `activities` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "SystemLogType" AS ENUM ('SERVER_START', 'SERVER_STOP', 'SERVER_RENAME', 'SERVER_EXPIRED', 'SERVER_RENEW', 'SERVER_CREATE', 'MEMBER_ADD', 'MEMBER_REMOVE', 'MEMBER_UPDATE', 'CONFIG_UPDATE', 'CONFIG_RESET', 'IP_RESET', 'IP_SET', 'DOWNLOAD', 'RANK_CREATE', 'RANK_UPDATE', 'RANK_DELETE');

-- CreateEnum
CREATE TYPE "ServerLogType" AS ENUM ('UNBAN_ALL', 'UNBAN_PLAYER', 'BAN_PLAYER', 'KICK_PLAYER', 'KICK_ALL', 'PLAYER_JOIN', 'PLAYER_LEAVE', 'CHAT_MESSAGE', 'ENTITY_CREATE', 'KILL', 'EXPLOSION');

-- DropForeignKey
ALTER TABLE "activities" DROP CONSTRAINT "activities_licenseId_fkey";

-- DropTable
DROP TABLE "activities";

-- DropEnum
DROP TYPE "ActivityType";

-- CreateTable
CREATE TABLE "server_logs" (
    "id" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "systemType" "SystemLogType",
    "serverType" "ServerLogType",
    "memberId" TEXT,
    "playerId" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "server_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "server_logs_licenseId_idx" ON "server_logs"("licenseId");

-- CreateIndex
CREATE INDEX "server_logs_createdAt_idx" ON "server_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "server_logs" ADD CONSTRAINT "server_logs_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "licenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
