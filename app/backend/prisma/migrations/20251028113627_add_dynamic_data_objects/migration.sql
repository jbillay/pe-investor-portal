-- CreateEnum
CREATE TYPE "public"."FieldDataType" AS ENUM ('TEXT', 'TEXTAREA', 'NUMBER', 'CURRENCY', 'DATE', 'DATETIME', 'BOOLEAN', 'SINGLE_SELECT', 'MULTI_SELECT', 'EMAIL', 'URL', 'FILE', 'RICH_TEXT', 'RELATIONSHIP');

-- CreateEnum
CREATE TYPE "public"."ValidationRuleType" AS ENUM ('MIN_LENGTH', 'MAX_LENGTH', 'MIN_VALUE', 'MAX_VALUE', 'REGEX', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."ChangeType" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- CreateTable
CREATE TABLE "public"."data_objects" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "dataKey" VARCHAR(100) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "data_objects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."data_object_versions" (
    "id" UUID NOT NULL,
    "dataObjectId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "schemaSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "data_object_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."data_fields" (
    "id" UUID NOT NULL,
    "dataObjectId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "fieldKey" VARCHAR(100) NOT NULL,
    "dataType" "public"."FieldDataType" NOT NULL,
    "fieldOrder" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "isMandatory" BOOLEAN NOT NULL DEFAULT false,
    "isReadOnly" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "defaultValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "data_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."field_validation_rules" (
    "id" UUID NOT NULL,
    "fieldId" UUID NOT NULL,
    "ruleType" "public"."ValidationRuleType" NOT NULL,
    "ruleValue" TEXT NOT NULL,
    "errorMessage" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "field_validation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."field_dropdown_options" (
    "id" UUID NOT NULL,
    "fieldId" UUID NOT NULL,
    "label" VARCHAR(255) NOT NULL,
    "value" VARCHAR(255) NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "field_dropdown_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."data_object_instances" (
    "id" UUID NOT NULL,
    "dataObjectId" UUID NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "data_object_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."instance_field_values" (
    "id" UUID NOT NULL,
    "instanceId" UUID NOT NULL,
    "fieldId" UUID NOT NULL,
    "textValue" TEXT,
    "numberValue" DECIMAL(20,4),
    "dateValue" TIMESTAMP(3),
    "booleanValue" BOOLEAN,
    "jsonValue" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instance_field_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."instance_change_log" (
    "id" UUID NOT NULL,
    "instanceId" UUID NOT NULL,
    "fieldId" UUID,
    "changeType" "public"."ChangeType" NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedBy" TEXT NOT NULL,

    CONSTRAINT "instance_change_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "data_objects_dataKey_key" ON "public"."data_objects"("dataKey");

-- CreateIndex
CREATE INDEX "data_objects_dataKey_idx" ON "public"."data_objects"("dataKey");

-- CreateIndex
CREATE INDEX "data_objects_isActive_idx" ON "public"."data_objects"("isActive");

-- CreateIndex
CREATE INDEX "data_object_versions_dataObjectId_idx" ON "public"."data_object_versions"("dataObjectId");

-- CreateIndex
CREATE UNIQUE INDEX "data_object_versions_dataObjectId_version_key" ON "public"."data_object_versions"("dataObjectId", "version");

-- CreateIndex
CREATE INDEX "data_fields_dataObjectId_idx" ON "public"."data_fields"("dataObjectId");

-- CreateIndex
CREATE INDEX "data_fields_fieldKey_idx" ON "public"."data_fields"("fieldKey");

-- CreateIndex
CREATE INDEX "data_fields_fieldOrder_idx" ON "public"."data_fields"("fieldOrder");

-- CreateIndex
CREATE UNIQUE INDEX "data_fields_dataObjectId_fieldKey_key" ON "public"."data_fields"("dataObjectId", "fieldKey");

-- CreateIndex
CREATE INDEX "field_validation_rules_fieldId_idx" ON "public"."field_validation_rules"("fieldId");

-- CreateIndex
CREATE INDEX "field_dropdown_options_fieldId_idx" ON "public"."field_dropdown_options"("fieldId");

-- CreateIndex
CREATE INDEX "field_dropdown_options_orderIndex_idx" ON "public"."field_dropdown_options"("orderIndex");

-- CreateIndex
CREATE INDEX "data_object_instances_dataObjectId_idx" ON "public"."data_object_instances"("dataObjectId");

-- CreateIndex
CREATE INDEX "data_object_instances_createdAt_idx" ON "public"."data_object_instances"("createdAt");

-- CreateIndex
CREATE INDEX "data_object_instances_isActive_idx" ON "public"."data_object_instances"("isActive");

-- CreateIndex
CREATE INDEX "instance_field_values_instanceId_idx" ON "public"."instance_field_values"("instanceId");

-- CreateIndex
CREATE INDEX "instance_field_values_fieldId_idx" ON "public"."instance_field_values"("fieldId");

-- CreateIndex
CREATE INDEX "instance_field_values_textValue_idx" ON "public"."instance_field_values"("textValue");

-- CreateIndex
CREATE INDEX "instance_field_values_numberValue_idx" ON "public"."instance_field_values"("numberValue");

-- CreateIndex
CREATE INDEX "instance_field_values_dateValue_idx" ON "public"."instance_field_values"("dateValue");

-- CreateIndex
CREATE UNIQUE INDEX "instance_field_values_instanceId_fieldId_key" ON "public"."instance_field_values"("instanceId", "fieldId");

-- CreateIndex
CREATE INDEX "instance_change_log_instanceId_idx" ON "public"."instance_change_log"("instanceId");

-- CreateIndex
CREATE INDEX "instance_change_log_changedAt_idx" ON "public"."instance_change_log"("changedAt");

-- CreateIndex
CREATE INDEX "instance_change_log_changedBy_idx" ON "public"."instance_change_log"("changedBy");

-- AddForeignKey
ALTER TABLE "public"."data_object_versions" ADD CONSTRAINT "data_object_versions_dataObjectId_fkey" FOREIGN KEY ("dataObjectId") REFERENCES "public"."data_objects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."data_fields" ADD CONSTRAINT "data_fields_dataObjectId_fkey" FOREIGN KEY ("dataObjectId") REFERENCES "public"."data_objects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."field_validation_rules" ADD CONSTRAINT "field_validation_rules_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "public"."data_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."field_dropdown_options" ADD CONSTRAINT "field_dropdown_options_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "public"."data_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."data_object_instances" ADD CONSTRAINT "data_object_instances_dataObjectId_fkey" FOREIGN KEY ("dataObjectId") REFERENCES "public"."data_objects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."instance_field_values" ADD CONSTRAINT "instance_field_values_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "public"."data_object_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."instance_field_values" ADD CONSTRAINT "instance_field_values_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "public"."data_fields"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."instance_change_log" ADD CONSTRAINT "instance_change_log_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "public"."data_object_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
