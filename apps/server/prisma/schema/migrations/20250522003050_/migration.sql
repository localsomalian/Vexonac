/*
  Warnings:

  - The values [SERVER_MANAGE,SERVER_CONFIGURE,SERVER_VIEW,MEMBER_MANAGE,MEMBER_VIEW,BAN_MANAGE,BAN_VIEW,PLAYER_MANAGE,PLAYER_VIEW,LOGS_VIEW,HWID_MANAGE,CONFIG_MANAGE,CONFIG_VIEW,RANK_MANAGE,RANK_VIEW,IP_RESET] on the enum `Permission` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `rankId` on the `members` table. All the data in the column will be lost.
  - You are about to drop the `ranks` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "members" DROP CONSTRAINT "members_rankId_fkey";

-- DropForeignKey
ALTER TABLE "ranks" DROP CONSTRAINT "ranks_licenseId_fkey";

-- DropIndex
DROP INDEX "members_rankId_idx";

-- DropTable
DROP TABLE "ranks";

-- AlterEnum
BEGIN;
CREATE TYPE "Permission_new" AS ENUM ('ALL', 'BYPASS', 'PLAYERS_KICK', 'PLAYERS_BAN', 'DOWNLOAD_FILES');
ALTER TYPE "Permission" RENAME TO "Permission_old";
ALTER TYPE "Permission_new" RENAME TO "Permission";
DROP TYPE "Permission_old";
COMMIT;

-- AlterTable
ALTER TABLE "members" DROP COLUMN "rankId",
ADD COLUMN     "permissions" "Permission"[];
