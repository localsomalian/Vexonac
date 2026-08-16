-- CreateTable
CREATE TABLE "pending_payments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pending_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pending_payments_orderId_key" ON "pending_payments"("orderId");

-- CreateIndex
CREATE INDEX "pending_payments_orderId_idx" ON "pending_payments"("orderId");

-- CreateIndex
CREATE INDEX "pending_payments_isCompleted_createdAt_idx" ON "pending_payments"("isCompleted", "createdAt");
