/*
  Warnings:

  - You are about to drop the column `category` on the `shared_configurations` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `shared_configurations` table. All the data in the column will be lost.
  - Added the required column `createdById` to the `shared_configurations` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "shared_configurations_category_idx";

-- DropIndex
DROP INDEX "shared_configurations_createdBy_idx";

-- AlterTable
ALTER TABLE "shared_configurations" DROP COLUMN "category",
DROP COLUMN "createdBy",
ADD COLUMN     "createdById" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "shared_configurations_createdById_idx" ON "shared_configurations"("createdById");

-- AddForeignKey
ALTER TABLE "shared_configurations" ADD CONSTRAINT "shared_configurations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
