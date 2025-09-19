-- CreateTable
CREATE TABLE "public"."funds" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fundType" TEXT NOT NULL,
    "vintage" INTEGER NOT NULL,
    "targetSize" DECIMAL(15,2) NOT NULL,
    "commitedSize" DECIMAL(15,2) NOT NULL,
    "drawnSize" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "closeDate" TIMESTAMP(3),
    "finalClose" TIMESTAMP(3),
    "liquidationDate" TIMESTAMP(3),
    "managementFee" DECIMAL(5,4),
    "carriedInterest" DECIMAL(5,4),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "funds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."investments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fundId" TEXT NOT NULL,
    "commitmentAmount" DECIMAL(15,2) NOT NULL,
    "drawnAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "distributedAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currentValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "irr" DECIMAL(8,4),
    "multiple" DECIMAL(8,4),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "investmentDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."capital_calls" (
    "id" TEXT NOT NULL,
    "fundId" TEXT NOT NULL,
    "callNumber" INTEGER NOT NULL,
    "totalAmount" DECIMAL(15,2) NOT NULL,
    "purpose" TEXT NOT NULL,
    "callDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "settlementDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "capital_calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."capital_call_investors" (
    "id" TEXT NOT NULL,
    "capitalCallId" TEXT NOT NULL,
    "investmentId" TEXT NOT NULL,
    "amountCalled" DECIMAL(15,2) NOT NULL,
    "amountPaid" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "paymentDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "capital_call_investors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."distributions" (
    "id" TEXT NOT NULL,
    "fundId" TEXT NOT NULL,
    "distributionNumber" INTEGER NOT NULL,
    "totalAmount" DECIMAL(15,2) NOT NULL,
    "distributionType" TEXT NOT NULL,
    "recordDate" TIMESTAMP(3) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "exDividendDate" TIMESTAMP(3),
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "distributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."distribution_investors" (
    "id" TEXT NOT NULL,
    "distributionId" TEXT NOT NULL,
    "investmentId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "taxWithholding" DECIMAL(15,2),
    "netAmount" DECIMAL(15,2) NOT NULL,
    "paymentDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "distribution_investors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."documents" (
    "id" TEXT NOT NULL,
    "fundId" TEXT,
    "capitalCallId" TEXT,
    "distributionId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "documentType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "isConfidential" BOOLEAN NOT NULL DEFAULT true,
    "accessLevel" TEXT NOT NULL DEFAULT 'INVESTOR',
    "uploadedBy" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."valuations" (
    "id" TEXT NOT NULL,
    "fundId" TEXT NOT NULL,
    "valuationDate" TIMESTAMP(3) NOT NULL,
    "totalValue" DECIMAL(15,2) NOT NULL,
    "sharePrice" DECIMAL(10,4),
    "irr" DECIMAL(8,4),
    "multiple" DECIMAL(8,4),
    "unrealizedValue" DECIMAL(15,2),
    "realizedValue" DECIMAL(15,2),
    "totalCommitted" DECIMAL(15,2),
    "totalDrawn" DECIMAL(15,2),
    "totalDistributed" DECIMAL(15,2),
    "benchmark" TEXT,
    "benchmarkReturn" DECIMAL(8,4),
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "valuations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."communications" (
    "id" TEXT NOT NULL,
    "fundId" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "targetAudience" TEXT NOT NULL DEFAULT 'ALL',
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "publishedBy" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "funds_name_key" ON "public"."funds"("name");

-- CreateIndex
CREATE INDEX "funds_fundType_idx" ON "public"."funds"("fundType");

-- CreateIndex
CREATE INDEX "funds_vintage_idx" ON "public"."funds"("vintage");

-- CreateIndex
CREATE INDEX "funds_status_idx" ON "public"."funds"("status");

-- CreateIndex
CREATE INDEX "investments_userId_idx" ON "public"."investments"("userId");

-- CreateIndex
CREATE INDEX "investments_fundId_idx" ON "public"."investments"("fundId");

-- CreateIndex
CREATE INDEX "investments_status_idx" ON "public"."investments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "investments_userId_fundId_key" ON "public"."investments"("userId", "fundId");

-- CreateIndex
CREATE INDEX "capital_calls_fundId_idx" ON "public"."capital_calls"("fundId");

-- CreateIndex
CREATE INDEX "capital_calls_status_idx" ON "public"."capital_calls"("status");

-- CreateIndex
CREATE INDEX "capital_calls_dueDate_idx" ON "public"."capital_calls"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "capital_calls_fundId_callNumber_key" ON "public"."capital_calls"("fundId", "callNumber");

-- CreateIndex
CREATE INDEX "capital_call_investors_capitalCallId_idx" ON "public"."capital_call_investors"("capitalCallId");

-- CreateIndex
CREATE INDEX "capital_call_investors_investmentId_idx" ON "public"."capital_call_investors"("investmentId");

-- CreateIndex
CREATE INDEX "capital_call_investors_status_idx" ON "public"."capital_call_investors"("status");

-- CreateIndex
CREATE UNIQUE INDEX "capital_call_investors_capitalCallId_investmentId_key" ON "public"."capital_call_investors"("capitalCallId", "investmentId");

-- CreateIndex
CREATE INDEX "distributions_fundId_idx" ON "public"."distributions"("fundId");

-- CreateIndex
CREATE INDEX "distributions_paymentDate_idx" ON "public"."distributions"("paymentDate");

-- CreateIndex
CREATE UNIQUE INDEX "distributions_fundId_distributionNumber_key" ON "public"."distributions"("fundId", "distributionNumber");

-- CreateIndex
CREATE INDEX "distribution_investors_distributionId_idx" ON "public"."distribution_investors"("distributionId");

-- CreateIndex
CREATE INDEX "distribution_investors_investmentId_idx" ON "public"."distribution_investors"("investmentId");

-- CreateIndex
CREATE INDEX "distribution_investors_status_idx" ON "public"."distribution_investors"("status");

-- CreateIndex
CREATE UNIQUE INDEX "distribution_investors_distributionId_investmentId_key" ON "public"."distribution_investors"("distributionId", "investmentId");

-- CreateIndex
CREATE INDEX "documents_fundId_idx" ON "public"."documents"("fundId");

-- CreateIndex
CREATE INDEX "documents_documentType_idx" ON "public"."documents"("documentType");

-- CreateIndex
CREATE INDEX "documents_accessLevel_idx" ON "public"."documents"("accessLevel");

-- CreateIndex
CREATE INDEX "documents_uploadedBy_idx" ON "public"."documents"("uploadedBy");

-- CreateIndex
CREATE INDEX "valuations_fundId_idx" ON "public"."valuations"("fundId");

-- CreateIndex
CREATE INDEX "valuations_valuationDate_idx" ON "public"."valuations"("valuationDate");

-- CreateIndex
CREATE UNIQUE INDEX "valuations_fundId_valuationDate_key" ON "public"."valuations"("fundId", "valuationDate");

-- CreateIndex
CREATE INDEX "communications_fundId_idx" ON "public"."communications"("fundId");

-- CreateIndex
CREATE INDEX "communications_type_idx" ON "public"."communications"("type");

-- CreateIndex
CREATE INDEX "communications_status_idx" ON "public"."communications"("status");

-- CreateIndex
CREATE INDEX "communications_publishedAt_idx" ON "public"."communications"("publishedAt");

-- AddForeignKey
ALTER TABLE "public"."investments" ADD CONSTRAINT "investments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."investments" ADD CONSTRAINT "investments_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "public"."funds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."capital_calls" ADD CONSTRAINT "capital_calls_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "public"."funds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."capital_call_investors" ADD CONSTRAINT "capital_call_investors_capitalCallId_fkey" FOREIGN KEY ("capitalCallId") REFERENCES "public"."capital_calls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."capital_call_investors" ADD CONSTRAINT "capital_call_investors_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "public"."investments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."distributions" ADD CONSTRAINT "distributions_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "public"."funds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."distribution_investors" ADD CONSTRAINT "distribution_investors_distributionId_fkey" FOREIGN KEY ("distributionId") REFERENCES "public"."distributions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."distribution_investors" ADD CONSTRAINT "distribution_investors_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "public"."investments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."documents" ADD CONSTRAINT "documents_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "public"."funds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."documents" ADD CONSTRAINT "documents_capitalCallId_fkey" FOREIGN KEY ("capitalCallId") REFERENCES "public"."capital_calls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."documents" ADD CONSTRAINT "documents_distributionId_fkey" FOREIGN KEY ("distributionId") REFERENCES "public"."distributions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."valuations" ADD CONSTRAINT "valuations_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "public"."funds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."communications" ADD CONSTRAINT "communications_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "public"."funds"("id") ON DELETE CASCADE ON UPDATE CASCADE;
