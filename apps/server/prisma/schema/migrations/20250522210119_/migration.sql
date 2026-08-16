/*
  Warnings:

  - You are about to drop the column `isActive` on the `server_infos` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "server_infos" DROP COLUMN "isActive",
ADD COLUMN     "isOnline" BOOLEAN NOT NULL DEFAULT false;
