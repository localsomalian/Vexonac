-- DropForeignKey
ALTER TABLE "players" DROP CONSTRAINT "players_licenseId_fkey";

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "licenses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
