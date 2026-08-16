-- CreateTable
CREATE TABLE "watch_parties" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "hostId" TEXT NOT NULL,
    "hostName" TEXT NOT NULL,
    "selectedPlayerIds" TEXT[],
    "selectedArea" JSONB,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "shareCode" TEXT NOT NULL,
    "maxViewers" INTEGER,
    "videoUrls" TEXT[],
    "playerFilter" TEXT,
    "playerFilterType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "watch_parties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "watch_party_members" (
    "id" TEXT NOT NULL,
    "watchPartyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userAvatar" TEXT,
    "isHost" BOOLEAN NOT NULL DEFAULT false,
    "isViewing" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "watch_party_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "watch_parties_shareCode_key" ON "watch_parties"("shareCode");

-- CreateIndex
CREATE INDEX "watch_parties_serverId_idx" ON "watch_parties"("serverId");

-- CreateIndex
CREATE INDEX "watch_parties_shareCode_idx" ON "watch_parties"("shareCode");

-- CreateIndex
CREATE INDEX "watch_parties_hostId_idx" ON "watch_parties"("hostId");

-- CreateIndex
CREATE INDEX "watch_parties_expiresAt_idx" ON "watch_parties"("expiresAt");

-- CreateIndex
CREATE INDEX "watch_parties_serverId_hostId_idx" ON "watch_parties"("serverId", "hostId");

-- CreateIndex
CREATE INDEX "watch_party_members_watchPartyId_idx" ON "watch_party_members"("watchPartyId");

-- CreateIndex
CREATE INDEX "watch_party_members_userId_idx" ON "watch_party_members"("userId");

-- CreateIndex
CREATE INDEX "watch_party_members_lastActivity_idx" ON "watch_party_members"("lastActivity");

-- CreateIndex
CREATE UNIQUE INDEX "watch_party_members_watchPartyId_userId_key" ON "watch_party_members"("watchPartyId", "userId");

-- AddForeignKey
ALTER TABLE "watch_parties" ADD CONSTRAINT "watch_parties_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "licenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watch_party_members" ADD CONSTRAINT "watch_party_members_watchPartyId_fkey" FOREIGN KEY ("watchPartyId") REFERENCES "watch_parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
