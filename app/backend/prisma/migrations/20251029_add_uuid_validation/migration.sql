-- Add CHECK constraint to validate UUID format for data_object_instances
ALTER TABLE data_object_instances
ADD CONSTRAINT check_id_is_valid_uuid
CHECK (id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');

-- Add CHECK constraint for instance_field_values
ALTER TABLE instance_field_values
ADD CONSTRAINT check_instance_id_is_valid_uuid
CHECK ("instanceId"::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');
