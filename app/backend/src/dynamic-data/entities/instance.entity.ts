import { DataObjectInstance, InstanceFieldValue, InstanceChangeLog, ChangeType } from '../../../generated/prisma';

export interface InstanceWithValues {
  id: string;
  dataObjectId: string;
  versionNumber: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  fieldValues: InstanceFieldValue[];
  values?: Record<string, any>; // Computed field for easier access
}

export interface ChangeLogEntry {
  id: string;
  instanceId: string;
  fieldId?: string;
  fieldName?: string;
  changeType: ChangeType;
  oldValue?: string;
  newValue?: string;
  changedAt: Date;
  changedBy: string;
  changedByName?: string;
}

export interface PaginatedInstances<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface DynamicSchema {
  dataObjectId: string;
  dataKey: string;
  name: string;
  description?: string;
  version: number;
  fields: DynamicField[];
  permissions?: {
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
  };
}

export interface DynamicField {
  id: string;
  fieldKey: string;
  name: string;
  dataType: string;
  fieldOrder: number;
  description?: string;
  isMandatory: boolean;
  isReadOnly: boolean;
  defaultValue?: string;
  relatedDataObjectId?: string;
  validationRules: Array<{
    ruleType: string;
    ruleValue: string;
    errorMessage: string;
  }>;
  dropdownOptions?: Array<{
    label: string;
    value: string;
  }>;
}
