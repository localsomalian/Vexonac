/*
  Warnings:

  - Added the required column `playerId` to the `bans` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "bans" ADD COLUMN     "playerId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "bans_playerId_idx" ON "bans"("playerId");

-- AddForeignKey
ALTER TABLE "bans" ADD CONSTRAINT "bans_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
