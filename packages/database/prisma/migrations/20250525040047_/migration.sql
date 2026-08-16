-- CreateEnum
CREATE TYPE "Permission" AS ENUM ('ALL', 'CONFIGURATION', 'DOWNLOAD_FILES', 'MANAGE_ADMINS', 'BYPASS', 'PLAYERS_KICK', 'PLAYERS_BAN');

-- CreateEnum
CREATE TYPE "IdentifierType" AS ENUM ('HWID', 'ROCKSTAR', 'ROCKSTAR2', 'STEAM', 'IP', 'DISCORD', 'XBOX', 'MICROSOFT', 'FIVEM', 'TOKEN');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('SERVER_START', 'SERVER_STOP', 'SERVER_RENAME', 'SERVER_EXPIRED', 'SERVER_RENEW', 'SERVER_CREATE', 'MEMBER_ADD', 'MEMBER_REMOVE', 'MEMBER_UPDATE', 'CONFIG_UPDATE', 'IP_RESET', 'DOWNLOAD', 'BAN_ADD', 'BAN_REMOVE', 'PLAYER_JOIN', 'PLAYER_LEAVE', 'RANK_CREATE', 'RANK_UPDATE', 'RANK_DELETE');

-- CreateEnum
CREATE TYPE "LicenseType" AS ENUM ('MONTHLY', 'QUARTERLY', 'BIANUALLY', 'YEARLY', 'LIFETIME');

-- CreateTable
CREATE TABLE "user" (
    "_id" TEXT NOT NULL,
    "discordId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "session" (
    "_id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "account" (
    "_id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "verification" (
    "_id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "verification_pkey" PRIMARY KEY ("_id")
);

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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "licenseKey" TEXT NOT NULL,

    CONSTRAINT "licenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "members" (
    "id" TEXT NOT NULL,
    "discordId" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "permissions" "Permission"[],
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
    "version" TEXT,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "playerCount" INTEGER NOT NULL DEFAULT 0,
    "maxSlots" INTEGER NOT NULL DEFAULT 32,
    "playerList" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3),

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

-- CreateTable
CREATE TABLE "shared_configurations" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "configuration" JSONB NOT NULL,
    "createdById" TEXT NOT NULL,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "importCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "shared_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "licenses_licenseKey_key" ON "licenses"("licenseKey");

-- CreateIndex
CREATE INDEX "licenses_licenseKey_idx" ON "licenses"("licenseKey");

-- CreateIndex
CREATE INDEX "licenses_discordId_idx" ON "licenses"("discordId");

-- CreateIndex
CREATE INDEX "members_licenseId_idx" ON "members"("licenseId");

-- CreateIndex
CREATE INDEX "members_discordId_idx" ON "members"("discordId");

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

-- CreateIndex
CREATE INDEX "shared_configurations_createdById_idx" ON "shared_configurations"("createdById");

-- CreateIndex
CREATE INDEX "shared_configurations_createdAt_idx" ON "shared_configurations"("createdAt");

-- CreateIndex
CREATE INDEX "shared_configurations_isPublic_idx" ON "shared_configurations"("isPublic");

-- CreateIndex
CREATE INDEX "shared_configurations_importCount_idx" ON "shared_configurations"("importCount");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "licenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "shared_configurations" ADD CONSTRAINT "shared_configurations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
