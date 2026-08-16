-- CreateTable
CREATE TABLE "global_stats" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "onlineServers" INTEGER NOT NULL,
    "onlinePlayers" INTEGER NOT NULL,
    "totalServers" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "global_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "global_stats_timestamp_idx" ON "global_stats"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "global_stats_timestamp_key" ON "global_stats"("timestamp");
