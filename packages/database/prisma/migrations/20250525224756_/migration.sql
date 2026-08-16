/*
  Warnings:

  - Added the required column `details` to the `bans` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "bans" DROP COLUMN "details",
ADD COLUMN     "details" JSONB NOT NULL;
