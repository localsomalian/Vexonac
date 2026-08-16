/*
  Warnings:

  - You are about to drop the column `playerDiscord` on the `players` table. All the data in the column will be lost.
  - You are about to drop the column `playerIP` on the `players` table. All the data in the column will be lost.
  - You are about to drop the column `playerSteam` on the `players` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[banId,type,value]` on the table `banned_identifiers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[licenseId,playerLicense]` on the table `players` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `identifiers` to the `players` table without a default value. This is not possible if the table is not empty.
  - Added the required column `oldIdentifiers` to the `players` table without a default value. This is not possible if the table is not empty.
  - Made the column `playerLicense` on table `players` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "banned_identifiers_type_value_key";

-- DropIndex
DROP INDEX "players_licenseId_idx";

-- DropIndex
DROP INDEX "players_playerDiscord_idx";

-- DropIndex
DROP INDEX "players_playerIP_idx";

-- DropIndex
DROP INDEX "players_playerSteam_idx";

-- AlterTable
ALTER TABLE "players" DROP COLUMN "playerDiscord",
DROP COLUMN "playerIP",
DROP COLUMN "playerSteam",
ADD COLUMN     "identifiers" JSONB NOT NULL,
ADD COLUMN     "oldIdentifiers" JSONB NOT NULL,
ALTER COLUMN "playerLicense" SET NOT NULL;

-- CreateIndex
CREATE INDEX "banned_identifiers_value_idx" ON "banned_identifiers"("value");

-- CreateIndex
CREATE UNIQUE INDEX "banned_identifiers_banId_type_value_key" ON "banned_identifiers"("banId", "type", "value");

-- CreateIndex
CREATE INDEX "bans_licenseId_expiresAt_idx" ON "bans"("licenseId", "expiresAt");

-- CreateIndex
CREATE INDEX "bans_expiresAt_idx" ON "bans"("expiresAt");

-- CreateIndex
CREATE INDEX "licenses_licenseKey_serverIp_expiresAt_isBanned_idx" ON "licenses"("licenseKey", "serverIp", "expiresAt", "isBanned");

-- CreateIndex
CREATE INDEX "licenses_expiresAt_isBanned_idx" ON "licenses"("expiresAt", "isBanned");

-- CreateIndex
CREATE UNIQUE INDEX "players_licenseId_playerLicense_key" ON "players"("licenseId", "playerLicense");
