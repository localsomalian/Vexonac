/*
  Warnings:

  - A unique constraint covering the columns `[licenseId,playerId]` on the table `bans` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "Permission" ADD VALUE 'PLAYERS_LOOKUP';

-- CreateIndex
CREATE UNIQUE INDEX "bans_licenseId_playerId_key" ON "bans"("licenseId", "playerId");
