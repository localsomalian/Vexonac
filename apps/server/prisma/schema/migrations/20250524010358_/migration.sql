/*
  Warnings:

  - You are about to drop the column `shareId` on the `shared_configurations` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "shared_configurations_shareId_idx";

-- DropIndex
DROP INDEX "shared_configurations_shareId_key";

-- AlterTable
ALTER TABLE "shared_configurations" DROP COLUMN "shareId";
