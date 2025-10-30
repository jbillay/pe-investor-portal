-- Add relatedDataObjectId field to data_fields table for RELATIONSHIP field type
ALTER TABLE "data_fields"
ADD COLUMN "relatedDataObjectId" UUID NULL;

-- Add foreign key constraint
ALTER TABLE "data_fields"
ADD CONSTRAINT "data_fields_relatedDataObjectId_fkey"
FOREIGN KEY ("relatedDataObjectId")
REFERENCES "data_objects"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Add index for performance
CREATE INDEX "data_fields_relatedDataObjectId_idx"
ON "data_fields"("relatedDataObjectId");

-- Add comment explaining the field
COMMENT ON COLUMN "data_fields"."relatedDataObjectId" IS
'For RELATIONSHIP field type - references another DataObject that instances of this field can link to';
