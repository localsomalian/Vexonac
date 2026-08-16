/*
  Warnings:

  - You are about to drop the column `lastActiveAt` on the `licenses` table. All the data in the column will be lost.
  - You are about to drop the column `playerCount` on the `server_infos` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "licenses" DROP COLUMN "lastActiveAt";

-- AlterTable
ALTER TABLE "server_infos" DROP COLUMN "playerCount",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastActiveAt" TIMESTAMP(3),
ADD COLUMN     "totalPlayers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "version" TEXT;
