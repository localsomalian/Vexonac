/*
  Warnings:

  - You are about to drop the column `burstLimit` on the `api_keys` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "api_keys" DROP COLUMN "burstLimit";

-- CreateTable
CREATE TABLE "bans_history" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "evidenceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bans_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bans_history_licenseId_idx" ON "bans_history"("licenseId");

-- CreateIndex
CREATE INDEX "bans_history_playerId_idx" ON "bans_history"("playerId");

-- CreateIndex
CREATE INDEX "bans_history_reason_idx" ON "bans_history"("reason");

-- CreateIndex
CREATE INDEX "bans_history_createdAt_idx" ON "bans_history"("createdAt");

-- CreateIndex
CREATE INDEX "bans_history_updatedAt_idx" ON "bans_history"("updatedAt");

-- AddForeignKey
ALTER TABLE "bans_history" ADD CONSTRAINT "bans_history_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bans_history" ADD CONSTRAINT "bans_history_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "licenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
