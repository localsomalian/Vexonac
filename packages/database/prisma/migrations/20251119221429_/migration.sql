/*
  Warnings:

  - You are about to drop the column `createdBy` on the `api_keys` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `api_keys` table. All the data in the column will be lost.
  - Added the required column `discordId` to the `api_keys` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "api_keys" DROP COLUMN "createdBy",
DROP COLUMN "description",
ADD COLUMN     "discordId" TEXT NOT NULL;
