-- CreateTable
CREATE TABLE "server_metrics" (
    "id" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "playerCount" INTEGER NOT NULL,
    "banCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "server_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "server_metrics_licenseId_timestamp_idx" ON "server_metrics"("licenseId", "timestamp");

-- CreateIndex
CREATE INDEX "server_metrics_timestamp_idx" ON "server_metrics"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "server_metrics_licenseId_timestamp_key" ON "server_metrics"("licenseId", "timestamp");

-- AddForeignKey
ALTER TABLE "server_metrics" ADD CONSTRAINT "server_metrics_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "licenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
