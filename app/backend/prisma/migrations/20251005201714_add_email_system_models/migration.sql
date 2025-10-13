-- CreateTable
CREATE TABLE "public"."email_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "subject" TEXT NOT NULL,
    "htmlBody" TEXT NOT NULL,
    "textBody" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "variables" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."email_logs" (
    "id" TEXT NOT NULL,
    "templateId" TEXT,
    "recipientEmail" TEXT NOT NULL,
    "recipientName" TEXT,
    "subject" TEXT NOT NULL,
    "htmlBody" TEXT NOT NULL,
    "textBody" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "variables" JSONB,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "provider" TEXT,
    "externalId" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."email_queue" (
    "id" TEXT NOT NULL,
    "templateId" TEXT,
    "recipientEmail" TEXT NOT NULL,
    "recipientName" TEXT,
    "variables" JSONB NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 5,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "scheduledFor" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "emailLogId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_queue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_name_key" ON "public"."email_templates"("name");

-- CreateIndex
CREATE INDEX "email_templates_category_idx" ON "public"."email_templates"("category");

-- CreateIndex
CREATE INDEX "email_templates_isActive_idx" ON "public"."email_templates"("isActive");

-- CreateIndex
CREATE INDEX "email_templates_name_idx" ON "public"."email_templates"("name");

-- CreateIndex
CREATE INDEX "email_logs_status_idx" ON "public"."email_logs"("status");

-- CreateIndex
CREATE INDEX "email_logs_recipientEmail_idx" ON "public"."email_logs"("recipientEmail");

-- CreateIndex
CREATE INDEX "email_logs_templateId_idx" ON "public"."email_logs"("templateId");

-- CreateIndex
CREATE INDEX "email_logs_createdAt_idx" ON "public"."email_logs"("createdAt");

-- CreateIndex
CREATE INDEX "email_queue_status_scheduledFor_idx" ON "public"."email_queue"("status", "scheduledFor");

-- CreateIndex
CREATE INDEX "email_queue_priority_idx" ON "public"."email_queue"("priority");

-- CreateIndex
CREATE INDEX "email_queue_recipientEmail_idx" ON "public"."email_queue"("recipientEmail");

-- AddForeignKey
ALTER TABLE "public"."email_logs" ADD CONSTRAINT "email_logs_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."email_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
