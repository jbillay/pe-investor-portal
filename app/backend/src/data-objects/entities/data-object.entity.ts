import { DataObject, DataField, FieldDataType, ValidationRuleType } from '../../../generated/prisma';

export interface DataObjectWithFields extends DataObject {
  fields: DataFieldWithRelations[];
  _count?: {
    fields: number;
    instances: number;
  };
}

export interface DataFieldWithRelations extends DataField {
  validationRules: ValidationRule[];
  dropdownOptions: DropdownOption[];
}

export interface ValidationRule {
  id: string;
  fieldId: string;
  ruleType: ValidationRuleType;
  ruleValue: string;
  errorMessage: string;
  createdAt: Date;
}

export interface DropdownOption {
  id: string;
  fieldId: string;
  label: string;
  value: string;
  orderIndex: number;
  isActive: boolean;
  createdAt: Date;
}

export interface DataObjectVersionInfo {
  id: string;
  version: number;
  name: string;
  description?: string;
  createdAt: Date;
  createdBy: string;
  createdByName?: string;
  changes?: string;
}

export interface SchemaSnapshot {
  dataObjectId: string;
  dataKey: string;
  name: string;
  description?: string;
  version: number;
  fields: Array<{
    id: string;
    name: string;
    fieldKey: string;
    dataType: FieldDataType;
    fieldOrder: number;
    description?: string;
    isMandatory: boolean;
    isReadOnly: boolean;
    defaultValue?: string;
    validationRules: Array<{
      ruleType: ValidationRuleType;
      ruleValue: string;
      errorMessage: string;
    }>;
    dropdownOptions: Array<{
      label: string;
      value: string;
      orderIndex: number;
    }>;
  }>;
}
