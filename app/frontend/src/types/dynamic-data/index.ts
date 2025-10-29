// Enums
export enum FieldDataType {
  TEXT = 'TEXT',
  TEXTAREA = 'TEXTAREA',
  NUMBER = 'NUMBER',
  CURRENCY = 'CURRENCY',
  DATE = 'DATE',
  DATETIME = 'DATETIME',
  BOOLEAN = 'BOOLEAN',
  SINGLE_SELECT = 'SINGLE_SELECT',
  MULTI_SELECT = 'MULTI_SELECT',
  EMAIL = 'EMAIL',
  URL = 'URL',
  FILE = 'FILE',
  RICH_TEXT = 'RICH_TEXT',
  RELATIONSHIP = 'RELATIONSHIP'
}

export enum ValidationRuleType {
  MIN_LENGTH = 'MIN_LENGTH',
  MAX_LENGTH = 'MAX_LENGTH',
  MIN_VALUE = 'MIN_VALUE',
  MAX_VALUE = 'MAX_VALUE',
  REGEX = 'REGEX',
  CUSTOM = 'CUSTOM'
}

export enum ChangeType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE'
}

// Data Object Types
export interface ValidationRule {
  ruleType: ValidationRuleType;
  ruleValue: string;
  errorMessage: string;
}

export interface DropdownOption {
  label: string;
  value: string;
  orderIndex: number;
}

export interface DataField {
  id: string;
  name: string;
  fieldKey: string;
  dataType: FieldDataType;
  fieldOrder: number;
  description?: string;
  isMandatory: boolean;
  isReadOnly: boolean;
  defaultValue?: string;
  validationRules: ValidationRule[];
  dropdownOptions: DropdownOption[];
}

export interface DataObject {
  id: string;
  name: string;
  description?: string;
  dataKey: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  fields: DataField[];
  _count?: {
    fields: number;
    instances: number;
  };
}

export interface DataObjectVersion {
  id: string;
  version: number;
  name: string;
  description?: string;
  createdAt: string;
  createdBy: string;
  changes?: string;
}

// Dynamic Schema Types
export interface DynamicField {
  id: string;
  fieldKey: string;
  name: string;
  dataType: FieldDataType;
  fieldOrder: number;
  description?: string;
  isMandatory: boolean;
  isReadOnly: boolean;
  defaultValue?: string;
  validationRules: ValidationRule[];
  dropdownOptions?: DropdownOption[];
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

// Instance Types
export interface DynamicInstance {
  id: string;
  dataObjectId: string;
  versionNumber: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  values: Record<string, any>;
}

export interface PaginatedInstances {
  items: DynamicInstance[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ChangeLogEntry {
  id: string;
  instanceId: string;
  fieldId?: string;
  fieldName?: string;
  changeType: ChangeType;
  oldValue?: string;
  newValue?: string;
  changedAt: string;
  changedBy: string;
  changedByName?: string;
}

// Form Types
export interface CreateDataObjectDto {
  name: string;
  description?: string;
  dataKey?: string;
  fields?: CreateFieldDto[];
}

export interface CreateFieldDto {
  name: string;
  fieldKey?: string;
  dataType: FieldDataType;
  fieldOrder: number;
  description?: string;
  isMandatory: boolean;
  isReadOnly: boolean;
  defaultValue?: string;
  validationRules?: ValidationRule[];
  dropdownOptions?: DropdownOption[];
}

export interface UpdateDataObjectDto {
  name?: string;
  description?: string;
}

export interface UpdateFieldDto extends Partial<CreateFieldDto> {}

export interface CreateInstanceDto {
  values: Record<string, any>;
}

export interface UpdateInstanceDto {
  values: Record<string, any>;
}

// Query Types
export interface QueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
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
