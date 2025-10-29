# Dynamic Data Objects - Implementation Documentation

**Version**: 1.0
**Date**: 2025-10-29
**Status**: Implemented

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [API Reference](#api-reference)
7. [User Guide](#user-guide)
8. [Developer Guide](#developer-guide)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The Dynamic Data Objects feature enables administrators to create configurable data structures and end-users to manage instances of those structures through automatically generated forms and tables.

### Key Capabilities

- **ID-based and Key-based APIs**: Dual API support for frontend (UUID-based) and flexibility (key-based)
- **Schema-driven UI**: Automatically generated forms and tables from database schema
- **Type-safe validation**: Client and server-side validation based on field definitions
- **Comprehensive field types**: 13 different field types including text, numbers, dates, files, and rich text
- **Permission-based access**: Dynamic permission checking based on data object keys
- **Audit trail**: Complete change tracking for all modifications
- **Dashboard integration**: Widget for quick access to data objects on the dashboard

### What's Implemented

#### Backend Components
- ✅ Schema Service (retrieve and cache data object schemas)
- ✅ Instance Service (CRUD operations for instances)
- ✅ Validation Service (field and schema validation)
- ✅ Export Service (CSV/Excel export functionality)
- ✅ Dynamic Controller (key-based routes: `/dynamic/:dataKey`)
- ✅ Data Instance Controller (ID-based routes: `/data/:dataObjectId`)
- ✅ Dynamic Permission Guard (permission checking)

#### Frontend Components
- ✅ DataObjectWidget (dashboard widget for instance management)
- ✅ DynamicForm (auto-generated forms)
- ✅ DynamicTable (auto-generated data tables)
- ✅ DynamicFormField (field router component)
- ✅ 13 Field Input Components (one per field type)
- ✅ 12 Cell Renderer Components (display values in tables)
- ✅ useDataObjects Composable (data object management)
- ✅ useDataInstances Composable (instance management)

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (Vue 3)                      │
├─────────────────────────────────────────────────────────┤
│  Dashboard Widget     │  Dynamic Components             │
│  ├─ DataObjectWidget  │  ├─ DynamicForm                │
│  │                    │  ├─ DynamicTable               │
│  │                    │  ├─ DynamicFormField           │
│  │                    │  └─ Field/Cell Components      │
└─────────────────────────────────────────────────────────┘
                        │
                        │ REST API (ID-based & Key-based)
                        ▼
┌─────────────────────────────────────────────────────────┐
│                 Backend (NestJS)                        │
├─────────────────────────────────────────────────────────┤
│  Controllers                                            │
│  ├─ DataInstanceController  (ID-based: /data/:id)      │
│  └─ DynamicController       (Key-based: /dynamic/:key) │
│                                                         │
│  Services                                               │
│  ├─ SchemaService      (schema retrieval & caching)    │
│  ├─ InstanceService    (instance CRUD operations)      │
│  ├─ ValidationService  (field & schema validation)     │
│  └─ ExportService      (CSV/Excel generation)          │
│                                                         │
│  Guards                                                 │
│  └─ DynamicPermissionGuard (permission checking)       │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│            Database (PostgreSQL + Prisma)               │
├─────────────────────────────────────────────────────────┤
│  Schema Tables          │  Instance Tables              │
│  ├─ data_objects        │  ├─ data_object_instances    │
│  ├─ data_fields         │  └─ instance_field_values    │
│  ├─ validation_rules    │                               │
│  └─ dropdown_options    │                               │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

#### 1. Loading a Form
```
User → Dashboard Widget → Select Data Object
  ↓
Frontend: useDataInstances.fetchSchema(dataObjectId)
  ↓
API: GET /data/:dataObjectId/schema
  ↓
SchemaService.getSchemaById(dataObjectId)
  ↓
Database: Query data_objects + data_fields (with relations)
  ↓
Response: Schema with fields, validation rules, dropdown options
  ↓
DynamicForm: Render appropriate field components
```

#### 2. Creating an Instance
```
User → Fill Form → Click Save
  ↓
Frontend: useDataInstances.createInstance(dataObjectId, values)
  ↓
API: POST /data/:dataObjectId/instances
  ↓
1. Get dataKey from dataObjectId (query data_objects)
2. Validate against schema (ValidationService)
3. Create instance (InstanceService)
  ↓
Database: INSERT data_object_instance + instance_field_values
  ↓
Response: Created instance with values
  ↓
Frontend: Close dialog, refresh list, update counts
```

---

## Database Schema

### Core Tables

#### data_objects
Stores data object definitions.

```prisma
model DataObject {
  id          String   @id @default(uuid()) @db.Uuid
  name        String   @db.VarChar(255)
  description String?  @db.Text
  dataKey     String   @unique @db.VarChar(100)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdBy   String   @db.Uuid
  updatedBy   String   @db.Uuid

  fields      DataField[]
  instances   DataObjectInstance[]

  @@index([dataKey])
  @@index([isActive])
  @@map("data_objects")
}
```

#### data_fields
Stores field definitions for each data object.

```prisma
model DataField {
  id              String   @id @default(uuid()) @db.Uuid
  dataObjectId    String   @db.Uuid
  name            String   @db.VarChar(255)
  fieldKey        String   @db.VarChar(100)
  dataType        String   @db.VarChar(50)    // TEXT, NUMBER, etc.
  fieldOrder      Int      @default(0)
  description     String?  @db.Text
  isMandatory     Boolean  @default(false)
  isReadOnly      Boolean  @default(false)
  isActive        Boolean  @default(true)
  defaultValue    String?  @db.Text
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  dataObject      DataObject @relation(fields: [dataObjectId], references: [id])
  validationRules FieldValidationRule[]
  dropdownOptions FieldDropdownOption[]
  fieldValues     InstanceFieldValue[]

  @@unique([dataObjectId, fieldKey])
  @@index([dataObjectId])
  @@index([fieldOrder])
  @@map("data_fields")
}
```

#### field_validation_rules
Stores validation rules for fields.

```prisma
model FieldValidationRule {
  id          String   @id @default(uuid()) @db.Uuid
  fieldId     String   @db.Uuid
  ruleType    String   @db.VarChar(50)    // minLength, maxLength, etc.
  ruleValue   String   @db.Text
  errorMessage String  @db.Text
  createdAt   DateTime @default(now())

  field       DataField @relation(fields: [fieldId], references: [id])

  @@index([fieldId])
  @@map("field_validation_rules")
}
```

#### field_dropdown_options
Stores dropdown options for SINGLE_SELECT and MULTI_SELECT fields.

```prisma
model FieldDropdownOption {
  id          String   @id @default(uuid()) @db.Uuid
  fieldId     String   @db.Uuid
  label       String   @db.VarChar(255)
  value       String   @db.VarChar(255)
  orderIndex  Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())

  field       DataField @relation(fields: [fieldId], references: [id])

  @@index([fieldId])
  @@index([orderIndex])
  @@map("field_dropdown_options")
}
```

### Instance Tables (EAV Pattern)

#### data_object_instances
Stores instance records.

```prisma
model DataObjectInstance {
  id             String   @id @default(uuid()) @db.Uuid
  dataObjectId   String   @db.Uuid
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  createdBy      String   @db.Uuid
  updatedBy      String   @db.Uuid

  dataObject     DataObject @relation(fields: [dataObjectId], references: [id])
  fieldValues    InstanceFieldValue[]

  @@index([dataObjectId])
  @@index([createdAt])
  @@map("data_object_instances")
}
```

#### instance_field_values
Stores actual field values using EAV pattern.

```prisma
model InstanceFieldValue {
  id              String   @id @default(uuid()) @db.Uuid
  instanceId      String   @db.Uuid
  fieldId         String   @db.Uuid

  // Type-specific storage columns
  textValue       String?  @db.Text
  numberValue     Decimal? @db.Decimal(20, 4)
  dateValue       DateTime?
  booleanValue    Boolean?
  jsonValue       Json?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  instance        DataObjectInstance @relation(fields: [instanceId], references: [id])
  field           DataField @relation(fields: [fieldId], references: [id])

  @@unique([instanceId, fieldId])
  @@index([instanceId])
  @@index([fieldId])
  @@map("instance_field_values")
}
```

### Field Data Types

| Type | Description | Storage Column | Example |
|------|-------------|----------------|---------|
| TEXT | Single-line text | textValue | "John Doe" |
| TEXTAREA | Multi-line text | textValue | "Long description..." |
| NUMBER | Numeric value | numberValue | 42.5 |
| CURRENCY | Money amount | numberValue | 1000000.00 |
| DATE | Date only | dateValue | 2025-01-15 |
| DATETIME | Date and time | dateValue | 2025-01-15T10:30:00Z |
| BOOLEAN | True/false | booleanValue | true |
| SINGLE_SELECT | Single choice | textValue | "option1" |
| MULTI_SELECT | Multiple choices | jsonValue | ["opt1", "opt2"] |
| EMAIL | Email address | textValue | "user@example.com" |
| URL | Web address | textValue | "https://example.com" |
| FILE | File upload | jsonValue | {url, name, size} |
| RICH_TEXT | HTML content | textValue | "<p>Rich text</p>" |

---

## Backend Implementation

### File Structure

```
app/backend/src/dynamic-data/
├── controllers/
│   ├── data-instance.controller.ts     # ID-based API
│   └── dynamic.controller.ts           # Key-based API
├── services/
│   ├── schema.service.ts               # Schema retrieval
│   ├── instance.service.ts             # Instance CRUD
│   ├── validation.service.ts           # Validation logic
│   └── export.service.ts               # Export functionality
├── guards/
│   └── dynamic-permission.guard.ts     # Permission checking
├── dto/
│   ├── create-instance.dto.ts          # Create instance DTO
│   └── query-params.dto.ts             # Query parameters DTO
├── entities/
│   └── instance.entity.ts              # Instance entity
└── dynamic-data.module.ts              # Module definition
```

### Key Services

#### SchemaService (`schema.service.ts`)

**Purpose**: Retrieve and format data object schemas for form/table generation.

**Key Methods**:

```typescript
// Get schema by data object ID
async getSchemaById(dataObjectId: string): Promise<DynamicSchema>

// Get schema by data key
async getSchema(dataKey: string): Promise<DynamicSchema>
```

**Schema Response Format**:
```typescript
interface DynamicSchema {
  id: string;
  dataKey: string;
  name: string;
  description?: string;
  fields: DynamicField[];
}

interface DynamicField {
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
  dropdownOptions?: DropdownOption[];
}
```

#### InstanceService (`instance.service.ts`)

**Purpose**: Handle CRUD operations for data object instances.

**Key Methods**:

```typescript
// Create a new instance
async create(
  dataKey: string,
  values: Record<string, any>,
  userId: string
): Promise<DynamicInstance>

// Find all instances with pagination
async findAll(
  dataKey: string,
  query: QueryParamsDto
): Promise<PaginatedInstances>

// Find single instance
async findOne(
  dataKey: string,
  instanceId: string
): Promise<DynamicInstance>

// Update instance
async update(
  dataKey: string,
  instanceId: string,
  values: Record<string, any>,
  userId: string
): Promise<DynamicInstance>

// Delete instance
async remove(
  dataKey: string,
  instanceId: string,
  userId: string
): Promise<void>

// Get change history
async getHistory(
  dataKey: string,
  instanceId: string
): Promise<ChangeLog[]>
```

**Instance Response Format**:
```typescript
interface DynamicInstance {
  id: string;
  dataObjectId: string;
  values: Record<string, any>;  // Denormalized field values
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}
```

#### ValidationService (`validation.service.ts`)

**Purpose**: Validate instance data against schema rules.

**Key Methods**:

```typescript
// Validate instance values against schema
async validate(
  schema: DynamicSchema,
  values: Record<string, any>
): Promise<ValidationResult>

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

interface ValidationError {
  field: string;
  message: string;
}
```

**Validation Rules Supported**:
- `minLength`: Minimum string length
- `maxLength`: Maximum string length
- `minValue`: Minimum numeric value
- `maxValue`: Maximum numeric value
- `regex`: Regular expression pattern
- `email`: Email format validation
- `url`: URL format validation

#### ExportService (`export.service.ts`)

**Purpose**: Export instance data to CSV/Excel formats.

**Key Methods**:

```typescript
// Export to CSV
async exportToCSV(
  dataKey: string,
  instances: DynamicInstance[],
  schema: DynamicSchema
): Promise<Buffer>

// Export to Excel
async exportToExcel(
  dataKey: string,
  instances: DynamicInstance[],
  schema: DynamicSchema
): Promise<Buffer>
```

### Controllers

#### DataInstanceController (ID-based API)

**Route**: `/data/:dataObjectId`

**Purpose**: Provides UUID-based API for frontend widget integration.

**Key Pattern**: Translates dataObjectId (UUID) to dataKey internally, then calls existing services.

**Endpoints**:

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/data/:dataObjectId/schema` | Get schema by ID |
| POST | `/data/:dataObjectId/instances` | Create instance |
| GET | `/data/:dataObjectId/instances` | List instances |
| GET | `/data/:dataObjectId/instances/:id` | Get single instance |
| PUT | `/data/:dataObjectId/instances/:id` | Update instance |
| DELETE | `/data/:dataObjectId/instances/:id` | Delete instance |
| GET | `/data/:dataObjectId/instances/:id/history` | Get change history |

**Implementation Pattern**:
```typescript
async create(
  @Param('dataObjectId') dataObjectId: string,
  @Body() createDto: CreateInstanceDto,
  @Request() req: any,
) {
  // 1. Get dataKey from UUID
  const dataObject = await this.prisma.dataObject.findUnique({
    where: { id: dataObjectId },
    select: { dataKey: true },
  });

  if (!dataObject) {
    throw new BadRequestException('Data object not found');
  }

  // 2. Validate
  const schema = await this.schemaService.getSchemaById(dataObjectId);
  const validation = await this.validationService.validate(schema, createDto.values);

  if (!validation.isValid) {
    throw new BadRequestException({
      message: 'Validation failed',
      errors: validation.errors,
    });
  }

  // 3. Create using dataKey
  return await this.instanceService.create(
    dataObject.dataKey,
    createDto.values,
    req.user.id
  );
}
```

#### DynamicController (Key-based API)

**Route**: `/dynamic/:dataKey`

**Purpose**: Provides string key-based API for flexible access patterns.

**Endpoints**: Same as DataInstanceController but uses `:dataKey` parameter instead of `:dataObjectId`.

### Guards

#### DynamicPermissionGuard

**Purpose**: Enforce permission checks based on data object keys.

**Permission Format**: `{DATAKEY}:ACTION`
- Example: `FUND:READ`, `FUND:WRITE`, `FUND:DELETE`

**Usage**:
```typescript
@UseGuards(JwtAuthGuard, DynamicPermissionGuard)
@Controller('data/:dataObjectId')
export class DataInstanceController {
  // Endpoints automatically protected
}
```

---

## Frontend Implementation

### File Structure

```
app/frontend/src/
├── components/dynamic/
│   ├── DataObjectWidget.vue            # Dashboard widget
│   ├── DynamicForm.vue                 # Auto-generated form
│   ├── DynamicTable.vue                # Auto-generated table
│   ├── DynamicFormField.vue            # Field router
│   ├── fields/                         # Field input components
│   │   ├── TextField.vue
│   │   ├── TextAreaField.vue
│   │   ├── NumberField.vue
│   │   ├── CurrencyField.vue
│   │   ├── DateField.vue
│   │   ├── DateTimeField.vue
│   │   ├── BooleanField.vue
│   │   ├── SingleSelectField.vue
│   │   ├── MultiSelectField.vue
│   │   ├── EmailField.vue
│   │   ├── UrlField.vue
│   │   ├── FileField.vue
│   │   └── RichTextField.vue
│   └── cells/                          # Cell renderer components
│       ├── TextCell.vue
│       ├── NumberCell.vue
│       ├── CurrencyCell.vue
│       ├── DateCell.vue
│       ├── DateTimeCell.vue
│       ├── BooleanCell.vue
│       ├── SelectCell.vue
│       ├── EmailCell.vue
│       ├── UrlCell.vue
│       ├── FileCell.vue
│       └── RichTextCell.vue
├── composables/admin/
│   ├── useDataObjects.ts               # Data object management
│   └── useDataInstances.ts             # Instance management
└── types/
    └── dynamic-data.ts                 # TypeScript types
```

### Key Components

#### DataObjectWidget (`DataObjectWidget.vue`)

**Purpose**: Dashboard widget for managing data object instances.

**Features**:
- Data object selector dropdown
- Quick stats (field count, instance count)
- Create new instance button
- View all instances button
- Create instance dialog with auto-generated form
- List instances dialog with formatted data
- Delete confirmation dialog

**Props**: None (standalone widget)

**Usage**:
```vue
<template>
  <DashboardView>
    <DataObjectWidget />
  </DashboardView>
</template>
```

**Key Functionality**:
```typescript
// Load data objects on mount
const { dataObjects, fetchDataObjects } = useDataObjects();
onMounted(async () => {
  await fetchDataObjects();
});

// When data object selected
const onDataObjectChange = async () => {
  if (selectedDataObject.value) {
    await fetchSchema(selectedDataObject.value.id);
    await fetchInstances(selectedDataObject.value.id);
  }
};

// Create instance
const createInstance = async () => {
  if (!validateForm() || !selectedDataObject.value) return;

  await createInstanceAPI(selectedDataObject.value.id, {
    values: formValues.value
  });

  // Refresh and update counts
  await fetchInstances(selectedDataObject.value.id);
  selectedDataObject.value._count.instances += 1;
};
```

#### DynamicFormField (`DynamicFormField.vue`)

**Purpose**: Routes to appropriate field component based on field type.

**Props**:
```typescript
interface Props {
  field: DynamicField;      // Field definition
  modelValue: any;          // Current value
  error?: string;           // Validation error message
}
```

**Emits**:
```typescript
(e: 'update:modelValue', value: any): void
```

**Implementation**:
```vue
<template>
  <div class="field">
    <TextField v-if="field.dataType === 'TEXT'" ... />
    <TextareaField v-else-if="field.dataType === 'TEXTAREA'" ... />
    <NumberField v-else-if="field.dataType === 'NUMBER'" ... />
    <!-- ... other field types -->
  </div>
</template>
```

#### Field Components

Each field type has a dedicated component that follows a consistent pattern:

**Base Structure**:
```vue
<template>
  <div class="field">
    <label>
      {{ field.name }}
      <span v-if="field.isMandatory" class="text-red-500">*</span>
    </label>
    <small v-if="field.description" class="text-gray-500">
      {{ field.description }}
    </small>

    <!-- PrimeVue input component -->
    <InputComponent
      :modelValue="modelValue"
      @update:modelValue="$emit('update:modelValue', $event)"
      :class="{ 'p-invalid': error }"
      :disabled="field.isReadOnly"
    />

    <small v-if="error" class="p-error">{{ error }}</small>
  </div>
</template>

<script setup lang="ts">
import type { DynamicField } from '@/types/dynamic-data';

defineProps<{
  field: DynamicField;
  modelValue: any;
  error?: string;
}>();

defineEmits<{
  (e: 'update:modelValue', value: any): void;
}>();
</script>
```

**Field Type Mapping**:

| Field Type | PrimeVue Component | Props |
|------------|-------------------|-------|
| TEXT | InputText | type="text" |
| TEXTAREA | Textarea | rows="4" |
| NUMBER | InputNumber | showButtons |
| CURRENCY | InputNumber | mode="currency", currency="USD" |
| DATE | Calendar | dateFormat="yy-mm-dd" |
| DATETIME | Calendar | showTime, showSeconds |
| BOOLEAN | Checkbox | binary |
| SINGLE_SELECT | Dropdown | options, optionLabel, optionValue |
| MULTI_SELECT | MultiSelect | options, optionLabel, optionValue |
| EMAIL | InputText | type="email" |
| URL | InputText | type="url" |
| FILE | FileUpload | mode="basic" |
| RICH_TEXT | Editor | editorStyle="height: 320px" |

### Composables

#### useDataObjects (`composables/admin/useDataObjects.ts`)

**Purpose**: Manage data object definitions.

**API**:
```typescript
export function useDataObjects() {
  const dataObjects = ref<DataObject[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchDataObjects = async (): Promise<void> => {
    // GET /admin/data-objects
  };

  return {
    dataObjects,
    loading,
    error,
    fetchDataObjects,
  };
}
```

#### useDataInstances (`composables/admin/useDataInstances.ts`)

**Purpose**: Manage data object instances.

**API**:
```typescript
export function useDataInstances() {
  const instances = ref<DynamicInstance[]>([]);
  const schema = ref<DynamicSchema | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchSchema = async (dataObjectId: string): Promise<void> => {
    // GET /data/:dataObjectId/schema
  };

  const fetchInstances = async (dataObjectId: string): Promise<void> => {
    // GET /data/:dataObjectId/instances
  };

  const createInstance = async (
    dataObjectId: string,
    data: { values: Record<string, any> }
  ): Promise<DynamicInstance> => {
    // POST /data/:dataObjectId/instances
  };

  const updateInstance = async (
    dataObjectId: string,
    instanceId: string,
    data: { values: Record<string, any> }
  ): Promise<DynamicInstance> => {
    // PUT /data/:dataObjectId/instances/:instanceId
  };

  const deleteInstance = async (
    dataObjectId: string,
    instanceId: string
  ): Promise<void> => {
    // DELETE /data/:dataObjectId/instances/:instanceId
  };

  return {
    instances,
    schema,
    loading,
    error,
    fetchSchema,
    fetchInstances,
    createInstance,
    updateInstance,
    deleteInstance,
  };
}
```

---

## API Reference

### Data Instance API (ID-based)

Base URL: `/data/:dataObjectId`

#### Get Schema

```http
GET /data/:dataObjectId/schema
```

**Description**: Retrieve schema definition for form/table generation.

**Headers**:
```
Authorization: Bearer {jwt_token}
```

**Response** (200 OK):
```json
{
  "id": "uuid-1",
  "dataKey": "company",
  "name": "Company",
  "description": "Company information",
  "fields": [
    {
      "id": "field-uuid-1",
      "name": "Company Name",
      "fieldKey": "companyName",
      "dataType": "TEXT",
      "fieldOrder": 1,
      "isMandatory": true,
      "isReadOnly": false,
      "description": "Legal company name",
      "defaultValue": null,
      "validationRules": [
        {
          "ruleType": "minLength",
          "ruleValue": "3",
          "errorMessage": "Company name must be at least 3 characters"
        }
      ],
      "dropdownOptions": null
    },
    {
      "id": "field-uuid-2",
      "name": "Company Type",
      "fieldKey": "companyType",
      "dataType": "SINGLE_SELECT",
      "fieldOrder": 2,
      "isMandatory": false,
      "isReadOnly": false,
      "dropdownOptions": [
        {
          "id": "opt-uuid-1",
          "label": "Technology",
          "value": "technology",
          "orderIndex": 1
        },
        {
          "id": "opt-uuid-2",
          "label": "Finance",
          "value": "finance",
          "orderIndex": 2
        }
      ]
    }
  ]
}
```

#### Create Instance

```http
POST /data/:dataObjectId/instances
```

**Description**: Create a new data object instance.

**Headers**:
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body**:
```json
{
  "values": {
    "companyName": "Acme Corporation",
    "companyType": "technology",
    "foundedDate": "2010-01-15",
    "revenue": 5000000.00
  }
}
```

**Response** (201 Created):
```json
{
  "id": "instance-uuid-1",
  "dataObjectId": "uuid-1",
  "values": {
    "companyName": "Acme Corporation",
    "companyType": "technology",
    "foundedDate": "2010-01-15",
    "revenue": 5000000.00
  },
  "createdAt": "2025-10-29T10:00:00Z",
  "updatedAt": "2025-10-29T10:00:00Z",
  "createdBy": "user-uuid-1",
  "updatedBy": "user-uuid-1"
}
```

**Error Response** (400 Bad Request):
```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "companyName",
      "message": "Company name must be at least 3 characters"
    }
  ]
}
```

#### List Instances

```http
GET /data/:dataObjectId/instances?page=1&limit=20&sortBy=createdAt&sortOrder=desc
```

**Description**: List all instances with pagination and sorting.

**Query Parameters**:
- `page` (number, default: 1): Page number
- `limit` (number, default: 20): Items per page
- `sortBy` (string, optional): Field key to sort by
- `sortOrder` (string, optional): `asc` or `desc`
- `search` (string, optional): Global search term

**Response** (200 OK):
```json
{
  "items": [
    {
      "id": "instance-uuid-1",
      "dataObjectId": "uuid-1",
      "values": {
        "companyName": "Acme Corporation",
        "companyType": "technology"
      },
      "createdAt": "2025-10-29T10:00:00Z",
      "updatedAt": "2025-10-29T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

#### Get Single Instance

```http
GET /data/:dataObjectId/instances/:instanceId
```

**Response** (200 OK):
```json
{
  "id": "instance-uuid-1",
  "dataObjectId": "uuid-1",
  "values": {
    "companyName": "Acme Corporation",
    "companyType": "technology",
    "foundedDate": "2010-01-15",
    "revenue": 5000000.00
  },
  "createdAt": "2025-10-29T10:00:00Z",
  "updatedAt": "2025-10-29T10:00:00Z",
  "createdBy": "user-uuid-1",
  "updatedBy": "user-uuid-1"
}
```

#### Update Instance

```http
PUT /data/:dataObjectId/instances/:instanceId
```

**Request Body**:
```json
{
  "values": {
    "companyName": "Acme Corp (Updated)",
    "revenue": 6000000.00
  }
}
```

**Response** (200 OK):
```json
{
  "id": "instance-uuid-1",
  "dataObjectId": "uuid-1",
  "values": {
    "companyName": "Acme Corp (Updated)",
    "companyType": "technology",
    "foundedDate": "2010-01-15",
    "revenue": 6000000.00
  },
  "createdAt": "2025-10-29T10:00:00Z",
  "updatedAt": "2025-10-29T11:00:00Z",
  "createdBy": "user-uuid-1",
  "updatedBy": "user-uuid-1"
}
```

#### Delete Instance

```http
DELETE /data/:dataObjectId/instances/:instanceId
```

**Response** (204 No Content): Empty body

#### Get Instance History

```http
GET /data/:dataObjectId/instances/:instanceId/history
```

**Response** (200 OK):
```json
{
  "changes": [
    {
      "id": "log-uuid-1",
      "changeType": "UPDATE",
      "fieldName": "Company Name",
      "oldValue": "Acme Corporation",
      "newValue": "Acme Corp (Updated)",
      "changedAt": "2025-10-29T11:00:00Z",
      "changedBy": "user-uuid-1",
      "changedByName": "John Doe"
    },
    {
      "id": "log-uuid-2",
      "changeType": "CREATE",
      "fieldName": null,
      "oldValue": null,
      "newValue": null,
      "changedAt": "2025-10-29T10:00:00Z",
      "changedBy": "user-uuid-1",
      "changedByName": "John Doe"
    }
  ]
}
```

---

## User Guide

### Accessing Data Objects

1. **Navigate to Dashboard**: Login and go to the main dashboard
2. **Locate Data Objects Widget**: Scroll to find the "Dynamic Data Objects" widget
3. **Select a Data Object**: Click the dropdown and choose a data object (e.g., "Company")

### Creating an Instance

1. **Select Data Object**: Choose from dropdown in the widget
2. **Click "Create New"**: Opens dialog with auto-generated form
3. **Fill Required Fields**: Fields marked with * are mandatory
4. **Review Validation**: Red errors appear if validation fails
5. **Click "Create"**: Saves the instance and closes dialog
6. **Verify**: Instance count updates, can view in "View All" list

**Example**:
```
1. Select: Company
2. Fill:
   - Company Name: "Acme Corporation" ✓
   - Company Type: "Technology" ✓
   - Revenue: $1,000,000 ✓
3. Click "Create"
4. Success! Instance created
```

### Viewing Instances

1. **Select Data Object**: Choose from dropdown
2. **Click "View All"**: Opens list dialog
3. **Review Instances**: See all instances with key fields displayed
4. **Use Actions**:
   - 👁️ View: See full details (planned)
   - ✏️ Edit: Modify instance (planned)
   - 🗑️ Delete: Remove instance

### Deleting an Instance

1. **Open "View All"**: Click button in widget
2. **Find Instance**: Locate instance to delete
3. **Click Delete Icon** (🗑️): Opens confirmation dialog
4. **Confirm**: Click "Delete" button
5. **Verify**: Instance removed, count updated

---

## Developer Guide

### Extending with New Field Types

#### 1. Update Database Enum

Add new type to `FieldDataType` enum in Prisma schema:

```prisma
enum FieldDataType {
  TEXT
  // ... existing types
  MY_NEW_TYPE  // Add here
}
```

Run migration:
```bash
npx prisma migrate dev --name add-new-field-type
```

#### 2. Update ValidationService

Add validation logic in `validation.service.ts`:

```typescript
private validateType(field: DataField, value: any): ValidationError | null {
  switch (field.dataType) {
    // ... existing cases
    case 'MY_NEW_TYPE':
      if (!this.isValidMyNewType(value)) {
        return {
          field: field.fieldKey,
          message: `${field.name} must be a valid MY_NEW_TYPE`
        };
      }
      break;
  }
  return null;
}

private isValidMyNewType(value: any): boolean {
  // Your validation logic
  return true;
}
```

#### 3. Create Field Component

Create `MyNewTypeField.vue`:

```vue
<template>
  <div class="field">
    <label>
      {{ field.name }}
      <span v-if="field.isMandatory" class="text-red-500">*</span>
    </label>

    <!-- Your custom input component -->
    <MyCustomInput
      :modelValue="modelValue"
      @update:modelValue="$emit('update:modelValue', $event)"
      :disabled="field.isReadOnly"
    />

    <small v-if="error" class="p-error">{{ error }}</small>
  </div>
</template>

<script setup lang="ts">
import type { DynamicField } from '@/types/dynamic-data';

defineProps<{
  field: DynamicField;
  modelValue: any;
  error?: string;
}>();

defineEmits<{
  (e: 'update:modelValue', value: any): void;
}>();
</script>
```

#### 4. Create Cell Component

Create `MyNewTypeCell.vue`:

```vue
<template>
  <div>
    <!-- Format and display value -->
    {{ formatValue(value) }}
  </div>
</template>

<script setup lang="ts">
defineProps<{
  value: any;
}>();

const formatValue = (val: any) => {
  // Your formatting logic
  return String(val);
};
</script>
```

#### 5. Update DynamicFormField Router

Add case in `DynamicFormField.vue`:

```vue
<template>
  <div class="field">
    <!-- ... existing field types -->

    <MyNewTypeField
      v-else-if="field.dataType === 'MY_NEW_TYPE'"
      :field="field"
      :modelValue="modelValue"
      @update:modelValue="$emit('update:modelValue', $event)"
      :error="error"
    />
  </div>
</template>

<script setup lang="ts">
import MyNewTypeField from './MyNewTypeField.vue';
// ... other imports
</script>
```

#### 6. Update DynamicTable (if needed)

If custom cell rendering needed, update table component to use your cell component.

### Adding Custom Validation Rules

#### Backend

Add rule type in `validation.service.ts`:

```typescript
private async validateRule(
  field: DataField,
  rule: FieldValidationRule,
  value: any
): Promise<ValidationError | null> {
  switch (rule.ruleType) {
    // ... existing rules

    case 'myCustomRule':
      if (!this.checkMyCustomRule(value, rule.ruleValue)) {
        return {
          field: field.fieldKey,
          message: rule.errorMessage
        };
      }
      break;
  }
  return null;
}

private checkMyCustomRule(value: any, ruleValue: string): boolean {
  // Your custom validation logic
  return true;
}
```

#### Frontend

Add validation in form validation logic or use VeeValidate custom validators.

### Performance Optimization Tips

#### 1. Index Frequently Queried Fields

If filtering/sorting by specific fields often:

```sql
CREATE INDEX idx_field_values_text_specific
ON instance_field_values(field_id, text_value)
WHERE field_id = 'frequently-queried-field-uuid';
```

#### 2. Cache Schemas

SchemaService already implements basic caching, but can be enhanced with Redis:

```typescript
// In schema.service.ts
async getSchemaById(dataObjectId: string): Promise<DynamicSchema> {
  // Check Redis cache
  const cached = await this.redis.get(`schema:${dataObjectId}`);
  if (cached) return JSON.parse(cached);

  // Query database
  const schema = await this.fetchSchemaFromDb(dataObjectId);

  // Cache for 1 hour
  await this.redis.set(
    `schema:${dataObjectId}`,
    JSON.stringify(schema),
    'EX',
    3600
  );

  return schema;
}
```

#### 3. Implement Cursor-based Pagination

For better performance with large datasets:

```typescript
// Instead of OFFSET pagination
const instances = await prisma.dataObjectInstance.findMany({
  take: limit,
  skip: (page - 1) * limit,  // OFFSET - slow for large datasets
});

// Use cursor pagination
const instances = await prisma.dataObjectInstance.findMany({
  take: limit,
  cursor: lastSeenId ? { id: lastSeenId } : undefined,
  orderBy: { createdAt: 'desc' },
});
```

---

## Testing

### Backend Testing

#### Unit Tests

Test services in isolation:

```typescript
// instance.service.spec.ts
describe('InstanceService', () => {
  let service: InstanceService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [InstanceService, PrismaService],
    }).compile();

    service = module.get<InstanceService>(InstanceService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should create an instance', async () => {
    const values = { companyName: 'Acme Corp' };
    const result = await service.create('company', values, 'user-id');

    expect(result.id).toBeDefined();
    expect(result.values.companyName).toBe('Acme Corp');
  });
});
```

#### Integration Tests

Test controllers with API:

```typescript
// data-instance.controller.spec.ts
describe('DataInstanceController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    // Setup test app
  });

  it('/data/:id/instances (POST)', () => {
    return request(app.getHttpServer())
      .post('/data/uuid-1/instances')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ values: { companyName: 'Test Corp' } })
      .expect(201)
      .expect((res) => {
        expect(res.body.id).toBeDefined();
      });
  });
});
```

### Frontend Testing

#### Component Tests

```typescript
// DataObjectWidget.spec.ts
import { mount } from '@vue/test-utils';
import DataObjectWidget from '@/components/dynamic/DataObjectWidget.vue';

describe('DataObjectWidget', () => {
  it('renders data object selector', () => {
    const wrapper = mount(DataObjectWidget);
    expect(wrapper.find('.p-dropdown').exists()).toBe(true);
  });

  it('shows create dialog when button clicked', async () => {
    const wrapper = mount(DataObjectWidget);
    await wrapper.find('[data-test="create-button"]').trigger('click');
    expect(wrapper.find('[data-test="create-dialog"]').isVisible()).toBe(true);
  });
});
```

#### E2E Tests

```typescript
// instance-management.e2e.ts
describe('Instance Management', () => {
  it('should create instance through widget', () => {
    cy.login('user@example.com', 'password');
    cy.visit('/dashboard');

    // Select data object
    cy.get('[data-test="data-object-dropdown"]').click();
    cy.contains('Company').click();

    // Open create dialog
    cy.get('[data-test="create-button"]').click();

    // Fill form
    cy.get('[name="companyName"]').type('Test Corporation');
    cy.get('[name="companyType"]').select('Technology');

    // Submit
    cy.get('[data-test="submit-button"]').click();

    // Verify
    cy.contains('Test Corporation');
    cy.contains('1 instances');
  });
});
```

---

## Troubleshooting

### Common Issues

#### 1. "Data object not found" error

**Cause**: dataObjectId doesn't exist or is inactive.

**Solution**:
```sql
-- Check if object exists
SELECT * FROM data_objects WHERE id = 'your-uuid';

-- Check if active
SELECT * FROM data_objects WHERE id = 'your-uuid' AND is_active = true;
```

#### 2. Validation fails but no error message

**Cause**: Validation rule doesn't have errorMessage set.

**Solution**:
```sql
-- Add error messages to validation rules
UPDATE field_validation_rules
SET error_message = 'Field is required'
WHERE error_message IS NULL OR error_message = '';
```

#### 3. Dropdown options not showing

**Cause**: Options marked as inactive or not linked to field.

**Solution**:
```sql
-- Check dropdown options
SELECT * FROM field_dropdown_options
WHERE field_id = 'your-field-uuid'
AND is_active = true
ORDER BY order_index;
```

#### 4. Permission denied errors

**Cause**: User doesn't have required permission for data object.

**Solution**:
```sql
-- Check user permissions
SELECT p.resource, p.action
FROM permissions p
JOIN role_permissions rp ON p.id = rp.permission_id
JOIN user_roles ur ON rp.role_id = ur.role_id
WHERE ur.user_id = 'user-uuid'
AND p.resource LIKE 'COMPANY%';

-- Add permission if missing
INSERT INTO permissions (resource, action)
VALUES ('COMPANY:WRITE', 'write');
```

#### 5. Field values not saving

**Cause**: Field dataType mismatch with storage column.

**Debug**:
```typescript
// Check InstanceService.create() logs
console.log('Field dataType:', field.dataType);
console.log('Storage column:', this.getStorageColumn(field.dataType));
console.log('Value to store:', value);
```

### Debug Mode

Enable debug logging:

```typescript
// In backend main.ts
if (process.env.NODE_ENV === 'development') {
  app.useLogger(['log', 'error', 'warn', 'debug', 'verbose']);
}

// In services
this.logger.debug('Creating instance', { dataKey, values });
```

### Performance Issues

#### Slow queries

```sql
-- Analyze query performance
EXPLAIN ANALYZE
SELECT * FROM data_object_instances
JOIN instance_field_values ON ...;

-- Add missing indexes
CREATE INDEX idx_field_values_search
ON instance_field_values(text_value)
WHERE text_value IS NOT NULL;
```

#### Memory issues

```typescript
// Use streaming for large exports
async exportToCSV(dataKey: string) {
  const stream = new Transform({
    transform(chunk, encoding, callback) {
      // Process chunk by chunk
    }
  });

  return prisma.dataObjectInstance.findMany({
    // Stream results
  }).pipe(stream);
}
```

---

## Next Steps

### Planned Enhancements

1. **Edit Instance Functionality**: Currently only create/delete, need edit with pre-filled form
2. **View Instance Details**: Read-only dialog showing all field values
3. **Advanced Filtering**: Filter builder with multiple criteria
4. **Export Functionality**: CSV/Excel export from instance list
5. **Bulk Operations**: Select multiple instances for bulk delete/export
6. **Field Dependencies**: Show/hide fields based on other field values
7. **Calculated Fields**: Formula-based fields (e.g., total = price * quantity)
8. **Instance History**: View change log for specific instance
9. **Search Enhancement**: Global search across all field values
10. **Sort/Filter in Widget**: Currently only in DynamicTable, add to widget list

### Future Improvements

- **Performance**: Redis caching, query optimization
- **Security**: Enhanced input sanitization, XSS prevention
- **UX**: Loading skeletons, better error messages, inline editing
- **Accessibility**: WCAG AA compliance, keyboard navigation
- **Testing**: Increase coverage to 80%+, add E2E tests
- **Documentation**: API documentation in Swagger, video tutorials

---

## Support and Resources

### Documentation
- [Specification Document](./dynamic-data-objects-specification.md)
- [Summary Document](./dynamic-data-objects-summary.md)
- [Project README](../../README.md)

### Related Components
- Authentication System
- Permission Management
- Admin Panel
- Dashboard

### External Dependencies
- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Vue 3 Documentation](https://vuejs.org/)
- [PrimeVue Documentation](https://primevue.org/)

---

**Last Updated**: 2025-10-29
**Version**: 1.0
**Maintained By**: Development Team
