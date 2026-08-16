-- CreateIndex
CREATE INDEX "players_identifiers_idx" ON "players" USING GIN ("identifiers");

-- CreateIndex
CREATE INDEX "players_oldIdentifiers_idx" ON "players" USING GIN ("oldIdentifiers");

-- CreateIndex
CREATE INDEX "players_licenseId_lastJoin_idx" ON "players"("licenseId", "lastJoin");

-- CreateIndex
CREATE INDEX "players_playerName_idx" ON "players"("playerName");
