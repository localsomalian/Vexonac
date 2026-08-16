-- CreateTable
CREATE TABLE "shared_configurations" (
    "id" TEXT NOT NULL,
    "shareId" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "configuration" JSONB NOT NULL,
    "createdBy" TEXT NOT NULL,
    "category" TEXT,
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
CREATE UNIQUE INDEX "shared_configurations_shareId_key" ON "shared_configurations"("shareId");

-- CreateIndex
CREATE INDEX "shared_configurations_shareId_idx" ON "shared_configurations"("shareId");

-- CreateIndex
CREATE INDEX "shared_configurations_createdBy_idx" ON "shared_configurations"("createdBy");

-- CreateIndex
CREATE INDEX "shared_configurations_createdAt_idx" ON "shared_configurations"("createdAt");

-- CreateIndex
CREATE INDEX "shared_configurations_isPublic_idx" ON "shared_configurations"("isPublic");

-- CreateIndex
CREATE INDEX "shared_configurations_category_idx" ON "shared_configurations"("category");

-- CreateIndex
CREATE INDEX "shared_configurations_importCount_idx" ON "shared_configurations"("importCount");
