/*
  Warnings:

  - The values [SERVER_STOP,SERVER_EXPIRED,CONFIG_RESET,RANK_CREATE,RANK_UPDATE,RANK_DELETE] on the enum `SystemLogType` will be removed. If these variants are still used in the database, this will fail.
  - The `details` column on the `server_logs` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Permission" ADD VALUE 'VIEW_LOGS';
ALTER TYPE "Permission" ADD VALUE 'VIEW_CONSOLE';
ALTER TYPE "Permission" ADD VALUE 'RUN_COMMANDS';

-- AlterEnum
BEGIN;
CREATE TYPE "SystemLogType_new" AS ENUM ('SERVER_START', 'SERVER_RENAME', 'SERVER_RENEW', 'SERVER_CREATE', 'MEMBER_ADD', 'MEMBER_REMOVE', 'MEMBER_UPDATE', 'CONFIG_UPDATE', 'CONFIG_SHARE', 'IP_RESET', 'IP_SET', 'DOWNLOAD');
ALTER TABLE "server_logs" ALTER COLUMN "systemType" TYPE "SystemLogType_new" USING ("systemType"::text::"SystemLogType_new");
ALTER TYPE "SystemLogType" RENAME TO "SystemLogType_old";
ALTER TYPE "SystemLogType_new" RENAME TO "SystemLogType";
DROP TYPE "SystemLogType_old";
COMMIT;

-- AlterTable
ALTER TABLE "server_logs" ADD COLUMN     "playerLicense" TEXT,
DROP COLUMN "details",
ADD COLUMN     "details" JSONB NOT NULL DEFAULT '{}';
