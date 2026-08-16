/*
  Warnings:

  - You are about to drop the column `totalPlayers` on the `server_infos` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "server_infos" DROP COLUMN "totalPlayers",
ADD COLUMN     "playerCount" INTEGER NOT NULL DEFAULT 0;
