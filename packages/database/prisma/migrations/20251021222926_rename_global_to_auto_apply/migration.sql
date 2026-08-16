/*
  Warnings:

  - You are about to drop the column `global` on the `discounts` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "discounts_global_isActive_createdAt_idx";

-- AlterTable
ALTER TABLE "discounts" DROP COLUMN "global",
ADD COLUMN     "autoApply" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "discounts_autoApply_isActive_createdAt_idx" ON "discounts"("autoApply", "isActive", "createdAt");
