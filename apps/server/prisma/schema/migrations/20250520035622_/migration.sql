-- CreateEnum
CREATE TYPE "Permission" AS ENUM ('SERVER_MANAGE', 'SERVER_CONFIGURE', 'SERVER_VIEW', 'MEMBER_MANAGE', 'MEMBER_VIEW', 'BAN_MANAGE', 'BAN_VIEW', 'PLAYER_MANAGE', 'PLAYER_VIEW', 'LOGS_VIEW', 'HWID_MANAGE', 'CONFIG_MANAGE', 'CONFIG_VIEW', 'RANK_MANAGE', 'RANK_VIEW', 'IP_RESET', 'DOWNLOAD_FILES');

-- CreateEnum
CREATE TYPE "IdentifierType" AS ENUM ('HWID', 'ROCKSTAR', 'ROCKSTAR2', 'STEAM', 'IP', 'DISCORD', 'XBOX', 'MICROSOFT', 'FIVEM', 'TOKEN');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('SERVER_START', 'SERVER_STOP', 'SERVER_RENAME', 'SERVER_EXPIRED', 'SERVER_RENEW', 'SERVER_CREATE', 'MEMBER_ADD', 'MEMBER_REMOVE', 'MEMBER_UPDATE', 'CONFIG_UPDATE', 'IP_RESET', 'DOWNLOAD', 'BAN_ADD', 'BAN_REMOVE', 'PLAYER_JOIN', 'PLAYER_LEAVE', 'RANK_CREATE', 'RANK_UPDATE', 'RANK_DELETE');

-- CreateEnum
CREATE TYPE "LicenseType" AS ENUM ('MONTHLY', 'QUARTERLY', 'BIANUALLY', 'YEARLY', 'LIFETIME');

-- CreateTable
CREATE TABLE "licenses" (
    "id" TEXT NOT NULL,
    "discordId" TEXT NOT NULL,
    "serverIp" TEXT,
    "serverName" TEXT NOT NULL DEFAULT 'My New Server',
    "bannerUrl" TEXT,
    "configuration" JSONB NOT NULL DEFAULT '{}',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "banReason" TEXT,
    "lastActiveAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "licenseKey" TEXT NOT NULL,

    CONSTRAINT "licenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ranks" (
    "id" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#FFFFFF',
    "permissions" "Permission"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ranks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "members" (
    "id" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "discordId" TEXT NOT NULL,
    "rankId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "redemption_keys" (
    "id" TEXT NOT NULL,
    "type" "LicenseType" NOT NULL,
    "licenseKey" TEXT NOT NULL,
    "generatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "redemption_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configs" (
    "id" TEXT NOT NULL,
    "discordId" TEXT NOT NULL,
    "configuration" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "versions" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changelog" TEXT,

    CONSTRAINT "versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "action" "ActivityType" NOT NULL,
    "details" TEXT,
    "performedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "server_infos" (
    "id" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "playerCount" INTEGER NOT NULL DEFAULT 0,
    "maxSlots" INTEGER NOT NULL DEFAULT 32,
    "playerList" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "server_infos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bans" (
    "id" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "banId" TEXT NOT NULL,
    "reason" TEXT,
    "details" TEXT,
    "bannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "bannedBy" TEXT,

    CONSTRAINT "bans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banned_identifiers" (
    "id" TEXT NOT NULL,
    "banId" TEXT NOT NULL,
    "type" "IdentifierType" NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "banned_identifiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players" (
    "id" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "playerLicense" TEXT,
    "playerSteam" TEXT,
    "playerIP" TEXT,
    "playerDiscord" TEXT,
    "firstJoin" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastJoin" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "playTime" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "licenses_licenseKey_key" ON "licenses"("licenseKey");

-- CreateIndex
CREATE INDEX "licenses_licenseKey_idx" ON "licenses"("licenseKey");

-- CreateIndex
CREATE INDEX "licenses_discordId_idx" ON "licenses"("discordId");

-- CreateIndex
CREATE INDEX "ranks_licenseId_idx" ON "ranks"("licenseId");

-- CreateIndex
CREATE UNIQUE INDEX "ranks_licenseId_name_key" ON "ranks"("licenseId", "name");

-- CreateIndex
CREATE INDEX "members_licenseId_idx" ON "members"("licenseId");

-- CreateIndex
CREATE INDEX "members_discordId_idx" ON "members"("discordId");

-- CreateIndex
CREATE INDEX "members_rankId_idx" ON "members"("rankId");

-- CreateIndex
CREATE UNIQUE INDEX "members_licenseId_discordId_key" ON "members"("licenseId", "discordId");

-- CreateIndex
CREATE UNIQUE INDEX "redemption_keys_licenseKey_key" ON "redemption_keys"("licenseKey");

-- CreateIndex
CREATE INDEX "redemption_keys_licenseKey_idx" ON "redemption_keys"("licenseKey");

-- CreateIndex
CREATE UNIQUE INDEX "versions_version_key" ON "versions"("version");

-- CreateIndex
CREATE INDEX "activities_licenseId_idx" ON "activities"("licenseId");

-- CreateIndex
CREATE INDEX "activities_createdAt_idx" ON "activities"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "server_infos_licenseId_key" ON "server_infos"("licenseId");

-- CreateIndex
CREATE INDEX "bans_licenseId_idx" ON "bans"("licenseId");

-- CreateIndex
CREATE UNIQUE INDEX "bans_licenseId_banId_key" ON "bans"("licenseId", "banId");

-- CreateIndex
CREATE INDEX "banned_identifiers_type_value_idx" ON "banned_identifiers"("type", "value");

-- CreateIndex
CREATE INDEX "banned_identifiers_banId_idx" ON "banned_identifiers"("banId");

-- CreateIndex
CREATE UNIQUE INDEX "banned_identifiers_type_value_key" ON "banned_identifiers"("type", "value");

-- CreateIndex
CREATE INDEX "players_licenseId_idx" ON "players"("licenseId");

-- CreateIndex
CREATE INDEX "players_playerSteam_idx" ON "players"("playerSteam");

-- CreateIndex
CREATE INDEX "players_playerLicense_idx" ON "players"("playerLicense");

-- CreateIndex
CREATE INDEX "players_playerIP_idx" ON "players"("playerIP");

-- CreateIndex
CREATE INDEX "players_playerDiscord_idx" ON "players"("playerDiscord");

-- AddForeignKey
ALTER TABLE "ranks" ADD CONSTRAINT "ranks_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "licenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "licenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES "ranks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "licenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "server_infos" ADD CONSTRAINT "server_infos_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "licenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bans" ADD CONSTRAINT "bans_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "licenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banned_identifiers" ADD CONSTRAINT "banned_identifiers_banId_fkey" FOREIGN KEY ("banId") REFERENCES "bans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "licenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
