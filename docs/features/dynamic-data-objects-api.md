# Dynamic Data Objects - API Reference

**Version**: 1.0
**Date**: 2025-10-29
**Base URL**: `/api/v1`

---

## Table of Contents

1. [Authentication](#authentication)
2. [ID-based API](#id-based-api)
3. [Key-based API](#key-based-api)
4. [Data Models](#data-models)
5. [Error Codes](#error-codes)
6. [Rate Limiting](#rate-limiting)

---

## Authentication

All endpoints require JWT authentication.

**Header Format**:
```
Authorization: Bearer {jwt_token}
```

**Obtaining Token**:
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600
}
```

---

## ID-based API

Base path: `/data/:dataObjectId`

Use this API when you have the data object UUID (recommended for frontend).

### Schema Endpoints

#### Get Schema by ID

```http
GET /data/:dataObjectId/schema
```

**Description**: Retrieve complete schema definition including fields, validation rules, and dropdown options.

**Path Parameters**:
- `dataObjectId` (string, required): Data object UUID

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "dataKey": "company",
  "name": "Company",
  "description": "Company information management",
  "fields": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Company Name",
      "fieldKey": "companyName",
      "dataType": "TEXT",
      "fieldOrder": 1,
      "description": "Legal company name",
      "isMandatory": true,
      "isReadOnly": false,
      "defaultValue": null,
      "validationRules": [
        {
          "id": "770e8400-e29b-41d4-a716-446655440002",
          "ruleType": "minLength",
          "ruleValue": "3",
          "errorMessage": "Company name must be at least 3 characters"
        },
        {
          "id": "770e8400-e29b-41d4-a716-446655440003",
          "ruleType": "maxLength",
          "ruleValue": "255",
          "errorMessage": "Company name cannot exceed 255 characters"
        }
      ],
      "dropdownOptions": null
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440004",
      "name": "Company Type",
      "fieldKey": "companyType",
      "dataType": "SINGLE_SELECT",
      "fieldOrder": 2,
      "description": "Type of company",
      "isMandatory": false,
      "isReadOnly": false,
      "defaultValue": null,
      "validationRules": [],
      "dropdownOptions": [
        {
          "id": "880e8400-e29b-41d4-a716-446655440005",
          "label": "Technology",
          "value": "technology",
          "orderIndex": 1,
          "isActive": true
        },
        {
          "id": "880e8400-e29b-41d4-a716-446655440006",
          "label": "Finance",
          "value": "finance",
          "orderIndex": 2,
          "isActive": true
        },
        {
          "id": "880e8400-e29b-41d4-a716-446655440007",
          "label": "Healthcare",
          "value": "healthcare",
          "orderIndex": 3,
          "isActive": true
        }
      ]
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440008",
      "name": "Revenue",
      "fieldKey": "revenue",
      "dataType": "CURRENCY",
      "fieldOrder": 3,
      "description": "Annual revenue in USD",
      "isMandatory": false,
      "isReadOnly": false,
      "defaultValue": null,
      "validationRules": [
        {
          "id": "770e8400-e29b-41d4-a716-446655440009",
          "ruleType": "minValue",
          "ruleValue": "0",
          "errorMessage": "Revenue cannot be negative"
        }
      ],
      "dropdownOptions": null
    }
  ]
}
```

**Error Responses**:
- `404 Not Found`: Data object not found
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Insufficient permissions

---

### Instance Endpoints

#### Create Instance

```http
POST /data/:dataObjectId/instances
```

**Description**: Create a new instance of a data object.

**Path Parameters**:
- `dataObjectId` (string, required): Data object UUID

**Request Body**:
```json
{
  "values": {
    "companyName": "Acme Corporation",
    "companyType": "technology",
    "revenue": 5000000.00,
    "foundedDate": "2010-01-15",
    "description": "Leading technology company"
  }
}
```

**Response** (201 Created):
```json
{
  "id": "990e8400-e29b-41d4-a716-446655440010",
  "dataObjectId": "550e8400-e29b-41d4-a716-446655440000",
  "values": {
    "companyName": "Acme Corporation",
    "companyType": "technology",
    "revenue": 5000000.00,
    "foundedDate": "2010-01-15",
    "description": "Leading technology company"
  },
  "createdAt": "2025-10-29T10:00:00.000Z",
  "updatedAt": "2025-10-29T10:00:00.000Z",
  "createdBy": "aa0e8400-e29b-41d4-a716-446655440011",
  "updatedBy": "aa0e8400-e29b-41d4-a716-446655440011"
}
```

**Validation Error** (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "companyName",
      "message": "Company name must be at least 3 characters"
    },
    {
      "field": "revenue",
      "message": "Revenue cannot be negative"
    }
  ]
}
```

---

#### List Instances

```http
GET /data/:dataObjectId/instances
```

**Description**: List all instances with pagination, sorting, and filtering.

**Path Parameters**:
- `dataObjectId` (string, required): Data object UUID

**Query Parameters**:
- `page` (number, optional, default: 1): Page number
- `limit` (number, optional, default: 20): Items per page
- `sortBy` (string, optional): Field key to sort by
- `sortOrder` (string, optional): `asc` or `desc`
- `search` (string, optional): Global search term

**Examples**:
```http
# Basic pagination
GET /data/550e8400-e29b-41d4-a716-446655440000/instances?page=1&limit=20

# With sorting
GET /data/550e8400-e29b-41d4-a716-446655440000/instances?sortBy=companyName&sortOrder=asc

# With search
GET /data/550e8400-e29b-41d4-a716-446655440000/instances?search=Acme

# Combined
GET /data/550e8400-e29b-41d4-a716-446655440000/instances?page=2&limit=50&sortBy=revenue&sortOrder=desc&search=tech
```

**Response** (200 OK):
```json
{
  "items": [
    {
      "id": "990e8400-e29b-41d4-a716-446655440010",
      "dataObjectId": "550e8400-e29b-41d4-a716-446655440000",
      "values": {
        "companyName": "Acme Corporation",
        "companyType": "technology",
        "revenue": 5000000.00
      },
      "createdAt": "2025-10-29T10:00:00.000Z",
      "updatedAt": "2025-10-29T10:00:00.000Z"
    },
    {
      "id": "990e8400-e29b-41d4-a716-446655440012",
      "dataObjectId": "550e8400-e29b-41d4-a716-446655440000",
      "values": {
        "companyName": "Beta Industries",
        "companyType": "finance",
        "revenue": 3000000.00
      },
      "createdAt": "2025-10-29T09:00:00.000Z",
      "updatedAt": "2025-10-29T09:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

---

#### Get Single Instance

```http
GET /data/:dataObjectId/instances/:instanceId
```

**Description**: Retrieve a single instance by ID.

**Path Parameters**:
- `dataObjectId` (string, required): Data object UUID
- `instanceId` (string, required): Instance UUID

**Response** (200 OK):
```json
{
  "id": "990e8400-e29b-41d4-a716-446655440010",
  "dataObjectId": "550e8400-e29b-41d4-a716-446655440000",
  "values": {
    "companyName": "Acme Corporation",
    "companyType": "technology",
    "revenue": 5000000.00,
    "foundedDate": "2010-01-15",
    "description": "Leading technology company",
    "employeeCount": 250,
    "website": "https://acme.com"
  },
  "createdAt": "2025-10-29T10:00:00.000Z",
  "updatedAt": "2025-10-29T10:00:00.000Z",
  "createdBy": "aa0e8400-e29b-41d4-a716-446655440011",
  "updatedBy": "aa0e8400-e29b-41d4-a716-446655440011"
}
```

**Error Responses**:
- `404 Not Found`: Instance not found

---

#### Update Instance

```http
PUT /data/:dataObjectId/instances/:instanceId
```

**Description**: Update an existing instance. Validates against current schema.

**Path Parameters**:
- `dataObjectId` (string, required): Data object UUID
- `instanceId` (string, required): Instance UUID

**Request Body**:
```json
{
  "values": {
    "companyName": "Acme Corp (Updated)",
    "revenue": 6000000.00,
    "employeeCount": 300
  }
}
```

**Note**: Only include fields you want to update. Missing fields retain their current values.

**Response** (200 OK):
```json
{
  "id": "990e8400-e29b-41d4-a716-446655440010",
  "dataObjectId": "550e8400-e29b-41d4-a716-446655440000",
  "values": {
    "companyName": "Acme Corp (Updated)",
    "companyType": "technology",
    "revenue": 6000000.00,
    "foundedDate": "2010-01-15",
    "description": "Leading technology company",
    "employeeCount": 300,
    "website": "https://acme.com"
  },
  "createdAt": "2025-10-29T10:00:00.000Z",
  "updatedAt": "2025-10-29T14:30:00.000Z",
  "createdBy": "aa0e8400-e29b-41d4-a716-446655440011",
  "updatedBy": "aa0e8400-e29b-41d4-a716-446655440011"
}
```

---

#### Delete Instance

```http
DELETE /data/:dataObjectId/instances/:instanceId
```

**Description**: Permanently delete an instance.

**Path Parameters**:
- `dataObjectId` (string, required): Data object UUID
- `instanceId` (string, required): Instance UUID

**Response** (204 No Content): Empty response body

**Error Responses**:
- `404 Not Found`: Instance not found
- `403 Forbidden`: Insufficient permissions (requires DELETE permission)

---

#### Get Instance History

```http
GET /data/:dataObjectId/instances/:instanceId/history
```

**Description**: Retrieve change history for an instance.

**Path Parameters**:
- `dataObjectId` (string, required): Data object UUID
- `instanceId` (string, required): Instance UUID

**Response** (200 OK):
```json
{
  "changes": [
    {
      "id": "bb0e8400-e29b-41d4-a716-446655440013",
      "changeType": "UPDATE",
      "fieldName": "Company Name",
      "fieldKey": "companyName",
      "oldValue": "Acme Corporation",
      "newValue": "Acme Corp (Updated)",
      "changedAt": "2025-10-29T14:30:00.000Z",
      "changedBy": "aa0e8400-e29b-41d4-a716-446655440011",
      "changedByName": "John Doe",
      "changedByEmail": "john.doe@example.com"
    },
    {
      "id": "bb0e8400-e29b-41d4-a716-446655440014",
      "changeType": "UPDATE",
      "fieldName": "Revenue",
      "fieldKey": "revenue",
      "oldValue": "5000000.00",
      "newValue": "6000000.00",
      "changedAt": "2025-10-29T14:30:00.000Z",
      "changedBy": "aa0e8400-e29b-41d4-a716-446655440011",
      "changedByName": "John Doe",
      "changedByEmail": "john.doe@example.com"
    },
    {
      "id": "bb0e8400-e29b-41d4-a716-446655440015",
      "changeType": "CREATE",
      "fieldName": null,
      "fieldKey": null,
      "oldValue": null,
      "newValue": null,
      "changedAt": "2025-10-29T10:00:00.000Z",
      "changedBy": "aa0e8400-e29b-41d4-a716-446655440011",
      "changedByName": "John Doe",
      "changedByEmail": "john.doe@example.com"
    }
  ]
}
```

---

## Key-based API

Base path: `/dynamic/:dataKey`

Use this API when you have the data object key string (more flexible for routing).

All endpoints are identical to the ID-based API, except they use `:dataKey` instead of `:dataObjectId`.

**Example**:
```http
# ID-based
GET /data/550e8400-e29b-41d4-a716-446655440000/instances

# Key-based (equivalent)
GET /dynamic/company/instances
```

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/dynamic/:dataKey/schema` | GET | Get schema |
| `/dynamic/:dataKey` | POST | Create instance |
| `/dynamic/:dataKey` | GET | List instances |
| `/dynamic/:dataKey/:id` | GET | Get single instance |
| `/dynamic/:dataKey/:id` | PUT | Update instance |
| `/dynamic/:dataKey/:id` | DELETE | Delete instance |
| `/dynamic/:dataKey/:id/history` | GET | Get history |

---

## Data Models

### DynamicSchema

```typescript
interface DynamicSchema {
  id: string;                    // Data object UUID
  dataKey: string;               // Unique key (e.g., "company")
  name: string;                  // Display name
  description?: string;          // Optional description
  fields: DynamicField[];        // Array of field definitions
}
```

### DynamicField

```typescript
interface DynamicField {
  id: string;                    // Field UUID
  name: string;                  // Display name
  fieldKey: string;              // Unique key within data object
  dataType: FieldDataType;       // Field type enum
  fieldOrder: number;            // Display order (ascending)
  description?: string;          // Optional description
  isMandatory: boolean;          // Required field flag
  isReadOnly: boolean;           // Read-only flag
  defaultValue?: string;         // Default value
  validationRules: ValidationRule[];    // Validation rules
  dropdownOptions?: DropdownOption[];   // For SELECT types
}
```

### FieldDataType

```typescript
enum FieldDataType {
  TEXT = 'TEXT',                   // Single-line text
  TEXTAREA = 'TEXTAREA',           // Multi-line text
  NUMBER = 'NUMBER',               // Numeric value
  CURRENCY = 'CURRENCY',           // Money amount
  DATE = 'DATE',                   // Date only
  DATETIME = 'DATETIME',           // Date and time
  BOOLEAN = 'BOOLEAN',             // True/false
  SINGLE_SELECT = 'SINGLE_SELECT', // Dropdown (single)
  MULTI_SELECT = 'MULTI_SELECT',   // Dropdown (multiple)
  EMAIL = 'EMAIL',                 // Email address
  URL = 'URL',                     // Web address
  FILE = 'FILE',                   // File upload
  RICH_TEXT = 'RICH_TEXT',         // HTML content
}
```

### ValidationRule

```typescript
interface ValidationRule {
  id: string;                    // Rule UUID
  ruleType: ValidationRuleType;  // Rule type enum
  ruleValue: string;             // Rule value (depends on type)
  errorMessage: string;          // Error message to display
}

enum ValidationRuleType {
  MIN_LENGTH = 'minLength',      // Minimum string length
  MAX_LENGTH = 'maxLength',      // Maximum string length
  MIN_VALUE = 'minValue',        // Minimum numeric value
  MAX_VALUE = 'maxValue',        // Maximum numeric value
  REGEX = 'regex',               // Regular expression pattern
  EMAIL = 'email',               // Email format
  URL = 'url',                   // URL format
}
```

### DropdownOption

```typescript
interface DropdownOption {
  id: string;                    // Option UUID
  label: string;                 // Display label
  value: string;                 // Stored value
  orderIndex: number;            // Display order
  isActive: boolean;             // Active flag
}
```

### DynamicInstance

```typescript
interface DynamicInstance {
  id: string;                    // Instance UUID
  dataObjectId: string;          // Data object UUID
  values: Record<string, any>;   // Field values (denormalized)
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
  createdBy: string;             // User UUID
  updatedBy: string;             // User UUID
}
```

### PaginatedInstances

```typescript
interface PaginatedInstances {
  items: DynamicInstance[];      // Array of instances
  pagination: {
    total: number;               // Total count
    page: number;                // Current page
    limit: number;               // Items per page
    totalPages: number;          // Total pages
  };
}
```

### ChangeLog

```typescript
interface ChangeLog {
  id: string;                    // Log entry UUID
  changeType: ChangeType;        // Type of change
  fieldName?: string;            // Field display name (null for instance-level)
  fieldKey?: string;             // Field key (null for instance-level)
  oldValue?: string;             // Previous value
  newValue?: string;             // New value
  changedAt: string;             // ISO 8601 timestamp
  changedBy: string;             // User UUID
  changedByName: string;         // User full name
  changedByEmail: string;        // User email
}

enum ChangeType {
  CREATE = 'CREATE',             // Instance created
  UPDATE = 'UPDATE',             // Field updated
  DELETE = 'DELETE',             // Instance deleted
}
```

---

## Error Codes

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request succeeded |
| 201 | Created | Resource created successfully |
| 204 | No Content | Resource deleted successfully |
| 400 | Bad Request | Invalid request (validation error) |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (duplicate key) |
| 422 | Unprocessable Entity | Validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Error Response Format

```typescript
interface ErrorResponse {
  statusCode: number;            // HTTP status code
  message: string;               // Error message
  error?: string;                // Error type (optional)
  errors?: ValidationError[];    // Validation errors (optional)
}
```

### Validation Error Format

```typescript
interface ValidationError {
  field: string;                 // Field key
  message: string;               // Error message
}
```

### Example Error Responses

**400 Bad Request** (Validation):
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "companyName",
      "message": "Company name must be at least 3 characters"
    },
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

**401 Unauthorized**:
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Invalid or expired token"
}
```

**403 Forbidden**:
```json
{
  "statusCode": 403,
  "message": "Forbidden",
  "error": "Insufficient permissions. Required: COMPANY:WRITE"
}
```

**404 Not Found**:
```json
{
  "statusCode": 404,
  "message": "Not Found",
  "error": "Data object not found"
}
```

**500 Internal Server Error**:
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "An unexpected error occurred"
}
```

---

## Rate Limiting

### Limits

- **General endpoints**: 100 requests per minute per user
- **Create/Update/Delete**: 30 requests per minute per user
- **Export endpoints**: 10 requests per minute per user

### Rate Limit Headers

Responses include rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1635780000
```

### Rate Limit Exceeded

```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1635780000
Content-Type: application/json

{
  "statusCode": 429,
  "message": "Too many requests",
  "error": "Rate limit exceeded. Try again in 30 seconds."
}
```

---

## Best Practices

### 1. Use ID-based API for Frontend

```typescript
// ✅ Recommended
GET /data/550e8400-e29b-41d4-a716-446655440000/instances

// ⚠️ Use only when you have the key
GET /dynamic/company/instances
```

### 2. Handle Validation Errors

```typescript
try {
  const response = await api.post('/data/uuid/instances', { values });
} catch (error) {
  if (error.response?.status === 400) {
    const errors = error.response.data.errors;
    errors.forEach(err => {
      // Display field-specific error
      setFieldError(err.field, err.message);
    });
  }
}
```

### 3. Implement Pagination

```typescript
// ✅ Good
GET /data/uuid/instances?page=1&limit=50

// ❌ Bad (don't fetch all at once)
GET /data/uuid/instances?limit=10000
```

### 4. Use Appropriate Permissions

Ensure users have correct permissions before calling endpoints:

```typescript
// Check permission before allowing create
if (hasPermission('COMPANY:WRITE')) {
  // Show create button
}
```

### 5. Cache Schema Responses

Schema definitions rarely change, cache them:

```typescript
const schemaCache = new Map();

async function getSchema(dataObjectId) {
  if (schemaCache.has(dataObjectId)) {
    return schemaCache.get(dataObjectId);
  }

  const schema = await api.get(`/data/${dataObjectId}/schema`);
  schemaCache.set(dataObjectId, schema);
  return schema;
}
```

---

## Examples

### Complete Workflow Example

```typescript
// 1. Get schema
const schema = await api.get('/data/550e8400/schema');

// 2. Render form based on schema
schema.fields.forEach(field => {
  renderField(field);
});

// 3. Validate and create instance
const values = {
  companyName: 'Acme Corp',
  companyType: 'technology',
  revenue: 1000000
};

try {
  const instance = await api.post('/data/550e8400/instances', { values });
  console.log('Created:', instance.id);
} catch (error) {
  if (error.response?.status === 400) {
    error.response.data.errors.forEach(err => {
      console.error(`${err.field}: ${err.message}`);
    });
  }
}

// 4. List instances
const response = await api.get('/data/550e8400/instances?page=1&limit=20');
console.log(`Found ${response.pagination.total} instances`);

// 5. Update instance
await api.put(`/data/550e8400/instances/${instance.id}`, {
  values: { revenue: 1500000 }
});

// 6. Get history
const history = await api.get(`/data/550e8400/instances/${instance.id}/history`);
console.log('Changes:', history.changes);

// 7. Delete instance
await api.delete(`/data/550e8400/instances/${instance.id}`);
```

---

**Last Updated**: 2025-10-29
**Version**: 1.0
