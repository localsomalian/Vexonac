-- CreateEnum
CREATE TYPE "APITier" AS ENUM ('BASIC', 'PRO', 'BUSINESS', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "APIStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "accessKey" TEXT NOT NULL,
    "secretKey" TEXT NOT NULL,
    "tier" "APITier" NOT NULL DEFAULT 'BASIC',
    "status" "APIStatus" NOT NULL DEFAULT 'ACTIVE',
    "monthlyRequestLimit" INTEGER NOT NULL DEFAULT 1000,
    "currentMonthlyUsage" INTEGER NOT NULL DEFAULT 0,
    "monthlyResetDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rateLimitPerMinute" INTEGER NOT NULL DEFAULT 60,
    "burstLimit" INTEGER NOT NULL DEFAULT 10,
    "webhooks" JSONB NOT NULL DEFAULT '[]',
    "permissions" JSONB NOT NULL DEFAULT '{}',
    "name" TEXT,
    "description" TEXT,
    "createdBy" TEXT,
    "expiresAt" TIMESTAMP(3),
    "licenseId" TEXT,
    "lastUsedAt" TIMESTAMP(3),
    "totalRequests" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_accessKey_key" ON "api_keys"("accessKey");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_secretKey_key" ON "api_keys"("secretKey");

-- CreateIndex
CREATE INDEX "api_keys_accessKey_idx" ON "api_keys"("accessKey");

-- CreateIndex
CREATE INDEX "api_keys_tier_status_idx" ON "api_keys"("tier", "status");

-- CreateIndex
CREATE INDEX "api_keys_monthlyResetDate_idx" ON "api_keys"("monthlyResetDate");

-- CreateIndex
CREATE INDEX "api_keys_expiresAt_idx" ON "api_keys"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_licenseId_tier_key" ON "api_keys"("licenseId", "tier");

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "licenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
