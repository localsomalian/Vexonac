/*
  Warnings:

  - You are about to drop the `watch_parties` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `watch_party_members` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "watch_parties" DROP CONSTRAINT "watch_parties_serverId_fkey";

-- DropForeignKey
ALTER TABLE "watch_party_members" DROP CONSTRAINT "watch_party_members_watchPartyId_fkey";

-- DropTable
DROP TABLE "watch_parties";

-- DropTable
DROP TABLE "watch_party_members";
