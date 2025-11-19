# Core API Reference for Plugins

**Version:** 1.0.0
**Last Updated:** November 2025
**Target Audience:** Plugin Developers

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Dynamic Data Objects API](#dynamic-data-objects-api)
4. [RBAC & Permissions API](#rbac--permissions-api)
5. [Email System API](#email-system-api)
6. [Audit Trail API](#audit-trail-api)
7. [User Management API](#user-management-api)
8. [File Upload API](#file-upload-api)
9. [Error Handling](#error-handling)
10. [Rate Limiting](#rate-limiting)
11. [Complete Examples](#complete-examples)

---

## Overview

The PE Investor Portal provides a comprehensive set of REST APIs that plugins can use to integrate with core functionality. All APIs require authentication and follow REST principles with proper HTTP status codes.

### Base Configuration

```javascript
const context = usePluginContext('your-plugin-id');
const apiBaseUrl = context.getApiUrl(''); // Returns: '/api'
const token = localStorage.getItem('token'); // JWT access token

// Standard headers for all requests
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
};
```

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PATCH, DELETE |
| 201 | Created | Successful POST (resource created) |
| 400 | Bad Request | Invalid input, validation errors |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource |
| 422 | Unprocessable Entity | Business logic validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Internal server error |

---

## Authentication

### Get Current User

```javascript
// User information is available via plugin context
const currentUser = context.currentUser.value;
const isAuthenticated = context.isAuthenticated.value;

console.log(currentUser);
// {
//   id: "uuid",
//   email: "user@example.com",
//   firstName: "John",
//   lastName: "Doe",
//   profile: {
//     avatar: "url",
//     timezone: "America/New_York",
//     language: "en"
//   },
//   roles: ["INVESTOR", "USER"]
// }
```

### Check Permissions

```javascript
// Check single permission
const canViewFunds = context.hasPermission('FUND:VIEW');

// Check role
const isAdmin = context.hasRole('ADMIN');

// Check multiple roles (any)
const canManage = context.hasAnyRole(['ADMIN', 'FUND_MANAGER']);

// Check multiple roles (all)
const isSuperUser = context.hasAllRoles(['ADMIN', 'SUPER_ADMIN']);
```

---

## Dynamic Data Objects API

The Dynamic Data Objects system provides a complete CRUD API for storing plugin data without creating backend tables.

### List Data Objects

Get all available data object definitions:

```javascript
GET /api/data-objects?page=1&limit=20&search=Fund

Response: {
  data: [
    {
      id: "uuid",
      name: "Fund",
      description: "Investment fund information",
      icon: "pi-briefcase",
      fields: [ /* field definitions */ ],
      createdAt: "2025-11-19T10:00:00Z",
      updatedAt: "2025-11-19T10:00:00Z"
    }
  ],
  total: 10,
  page: 1,
  limit: 20
}
```

### Create Data Object

Define a new data structure for your plugin:

```javascript
POST /api/data-objects

Body: {
  name: "Fund",
  description: "Investment fund information for marketing",
  icon: "pi-briefcase",
  fields: [
    {
      name: "fundName",
      label: "Fund Name",
      fieldType: "TEXT",
      required: true,
      order: 1,
      validationRules: [
        { type: "minLength", value: 3 },
        { type: "maxLength", value: 100 }
      ]
    },
    {
      name: "fundType",
      label: "Fund Type",
      fieldType: "SINGLE_SELECT",
      required: true,
      order: 2,
      dropdownOptions: [
        { value: "BUYOUT", label: "Buyout", order: 1 },
        { value: "VENTURE", label: "Venture Capital", order: 2 },
        { value: "GROWTH", label: "Growth Equity", order: 3 },
        { value: "DEBT", label: "Private Debt", order: 4 }
      ]
    },
    {
      name: "targetSize",
      label: "Target Fund Size (USD)",
      fieldType: "CURRENCY",
      required: true,
      order: 3
    },
    {
      name: "vintage",
      label: "Vintage Year",
      fieldType: "NUMBER",
      required: true,
      order: 4,
      validationRules: [
        { type: "min", value: 2000 },
        { type: "max", value: 2050 }
      ]
    },
    {
      name: "strategy",
      label: "Investment Strategy",
      fieldType: "RICH_TEXT",
      required: true,
      order: 5
    },
    {
      name: "geographicFocus",
      label: "Geographic Focus",
      fieldType: "MULTI_SELECT",
      required: false,
      order: 6,
      dropdownOptions: [
        { value: "NORTH_AMERICA", label: "North America" },
        { value: "EUROPE", label: "Europe" },
        { value: "ASIA", label: "Asia" },
        { value: "LATAM", label: "Latin America" },
        { value: "AFRICA", label: "Africa" }
      ]
    },
    {
      name: "fundManager",
      label: "Fund Manager",
      fieldType: "RELATIONSHIP",
      required: false,
      order: 7,
      relationshipTarget: "User"
    },
    {
      name: "closingDate",
      label: "Expected Closing Date",
      fieldType: "DATE",
      required: false,
      order: 8
    },
    {
      name: "isPublished",
      label: "Published to Portal",
      fieldType: "BOOLEAN",
      required: false,
      order: 9,
      defaultValue: false
    }
  ]
}

Response: {
  id: "uuid",
  name: "Fund",
  version: 1,
  ...
}
```

### Field Types Reference

| Field Type | Storage | Validation Options | Example Use Cases |
|------------|---------|-------------------|-------------------|
| `TEXT` | textValue | minLength, maxLength, regex | Names, titles, short descriptions |
| `TEXTAREA` | textValue | minLength, maxLength | Long descriptions, notes |
| `NUMBER` | numberValue | min, max, step | Years, quantities, scores |
| `CURRENCY` | numberValue | min, max | Amounts, prices, fund sizes |
| `DATE` | dateValue | min, max | Dates without time |
| `DATETIME` | dateValue | min, max | Dates with time |
| `BOOLEAN` | booleanValue | none | Yes/no, true/false flags |
| `SINGLE_SELECT` | textValue | enum (from options) | Fund type, status, category |
| `MULTI_SELECT` | textValue (JSON array) | enum (from options) | Tags, categories, regions |
| `EMAIL` | textValue | email format | Email addresses |
| `URL` | textValue | URL format | Websites, links |
| `FILE` | fileValue (JSON) | fileTypes, maxSize | Documents, images |
| `RICH_TEXT` | textValue (HTML) | maxLength | Formatted content, descriptions |
| `RELATIONSHIP` | relationshipTargetId | none | Links to other data objects |

### List Data Object Instances

Get all instances of a data object:

```javascript
GET /api/dynamic/Fund?page=1&limit=20&sort=createdAt&order=DESC

// With filters
GET /api/dynamic/Fund?filter[fundType]=BUYOUT&filter[vintage]=2024

Response: {
  instances: [
    {
      id: "uuid",
      dataObjectId: "uuid",
      dataObjectName: "Fund",
      fieldValues: {
        fundName: "Tech Growth Fund III",
        fundType: "VENTURE",
        targetSize: 500000000,
        vintage: 2024,
        strategy: "<p>Focused on Series B tech companies...</p>",
        geographicFocus: ["NORTH_AMERICA", "EUROPE"],
        closingDate: "2025-12-31",
        isPublished: true
      },
      createdBy: "user-uuid",
      createdAt: "2025-11-19T10:00:00Z",
      updatedAt: "2025-11-19T12:00:00Z"
    }
  ],
  total: 45,
  page: 1,
  limit: 20
}
```

### Create Instance

Create a new instance of a data object:

```javascript
POST /api/dynamic/Fund

Body: {
  fieldValues: {
    fundName: "Tech Growth Fund III",
    fundType: "VENTURE",
    targetSize: 500000000,
    vintage: 2024,
    strategy: "<p>Focused on Series B tech companies in North America and Europe</p>",
    geographicFocus: ["NORTH_AMERICA", "EUROPE"],
    closingDate: "2025-12-31",
    isPublished: false
  }
}

Response: {
  id: "uuid",
  dataObjectId: "uuid",
  dataObjectName: "Fund",
  fieldValues: { /* as submitted */ },
  createdBy: "current-user-uuid",
  createdAt: "2025-11-19T10:00:00Z",
  updatedAt: "2025-11-19T10:00:00Z"
}
```

### Get Single Instance

```javascript
GET /api/dynamic/Fund/{instanceId}

Response: {
  id: "uuid",
  dataObjectId: "uuid",
  dataObjectName: "Fund",
  fieldValues: { /* all field values */ },
  relatedInstances: {
    // If RELATIONSHIP fields exist
    fundManager: {
      id: "user-uuid",
      email: "manager@fund.com",
      firstName: "Jane",
      lastName: "Smith"
    }
  },
  changeLog: [
    {
      id: "uuid",
      changedBy: "user-uuid",
      changedAt: "2025-11-19T12:00:00Z",
      changes: {
        isPublished: { from: false, to: true }
      }
    }
  ],
  createdBy: "user-uuid",
  createdAt: "2025-11-19T10:00:00Z",
  updatedAt: "2025-11-19T12:00:00Z"
}
```

### Update Instance

```javascript
PATCH /api/dynamic/Fund/{instanceId}

Body: {
  fieldValues: {
    isPublished: true,
    closingDate: "2025-06-30"
  }
}

Response: {
  id: "uuid",
  dataObjectId: "uuid",
  dataObjectName: "Fund",
  fieldValues: { /* all field values with updates */ },
  updatedAt: "2025-11-19T13:00:00Z"
}
```

### Delete Instance

```javascript
DELETE /api/dynamic/Fund/{instanceId}

Response: {
  success: true,
  message: "Instance deleted successfully"
}
```

### Query with Relationships

```javascript
// Get all documents for a specific fund
GET /api/dynamic/FundDocument?filter[fund]={fundId}&include=fund

Response: {
  instances: [
    {
      id: "doc-uuid",
      fieldValues: {
        documentTitle: "PPM 2024",
        category: "PPM",
        fund: "fund-uuid"
      },
      relatedInstances: {
        fund: {
          id: "fund-uuid",
          fieldValues: {
            fundName: "Tech Growth Fund III"
          }
        }
      }
    }
  ]
}
```

---

## RBAC & Permissions API

### List Permissions

```javascript
GET /api/admin/permissions?page=1&limit=50&resource=fund

Response: {
  permissions: [
    {
      id: "uuid",
      name: "FUND:VIEW",
      description: "View fund marketing information",
      resource: "fund",
      action: "view",
      scope: "all",
      createdAt: "2025-11-19T10:00:00Z"
    },
    {
      id: "uuid",
      name: "FUND:CREATE",
      description: "Create new funds",
      resource: "fund",
      action: "create",
      scope: "own",
      createdAt: "2025-11-19T10:00:00Z"
    }
  ],
  total: 7
}
```

### Create Permission

```javascript
POST /api/admin/permissions

Body: {
  name: "FUND:PUBLISH",
  description: "Publish funds to investor portal",
  resource: "fund",
  action: "publish",
  scope: "all"
}

Response: {
  id: "uuid",
  name: "FUND:PUBLISH",
  description: "Publish funds to investor portal",
  resource: "fund",
  action: "publish",
  scope: "all",
  createdAt: "2025-11-19T10:00:00Z"
}
```

### List Roles

```javascript
GET /api/admin/roles?page=1&limit=20

Response: {
  roles: [
    {
      id: "uuid",
      name: "INVESTOR",
      description: "Regular investor user",
      isDefault: true,
      isSystemRole: true,
      permissions: [
        {
          id: "perm-uuid",
          name: "FUND:VIEW",
          resource: "fund",
          action: "view",
          scope: "all"
        }
      ],
      createdAt: "2025-01-01T00:00:00Z"
    }
  ],
  total: 5
}
```

### Create Role

```javascript
POST /api/admin/roles

Body: {
  name: "FUND_MANAGER",
  description: "Fund manager with full fund management access",
  isDefault: false,
  permissions: ["perm-uuid-1", "perm-uuid-2", "perm-uuid-3"]
}

Response: {
  id: "uuid",
  name: "FUND_MANAGER",
  description: "Fund manager with full fund management access",
  permissions: [ /* permission objects */ ],
  createdAt: "2025-11-19T10:00:00Z"
}
```

### Assign Permission to Role

```javascript
POST /api/admin/roles/{roleId}/permissions

Body: {
  permissionId: "permission-uuid"
}

Response: {
  success: true,
  message: "Permission assigned to role"
}
```

### Assign Role to User

```javascript
POST /api/admin/users/{userId}/roles

Body: {
  roleId: "role-uuid",
  expiresAt: "2026-12-31T23:59:59Z" // Optional: time-limited assignment
}

Response: {
  success: true,
  assignment: {
    id: "assignment-uuid",
    userId: "user-uuid",
    roleId: "role-uuid",
    assignedBy: "admin-uuid",
    assignedAt: "2025-11-19T10:00:00Z",
    expiresAt: "2026-12-31T23:59:59Z"
  }
}
```

---

## Email System API

### List Email Templates

```javascript
GET /api/email/templates?page=1&limit=20&category=SYSTEM

Response: {
  templates: [
    {
      id: "uuid",
      name: "fund-published",
      subject: "New Fund Available: {{fundName}}",
      category: "SYSTEM",
      version: 1,
      isActive: true,
      variablesSchema: {
        fundName: { type: "string", required: true },
        fundType: { type: "string", required: true },
        targetSize: { type: "number", required: true }
      },
      createdAt: "2025-11-19T10:00:00Z"
    }
  ],
  total: 12
}
```

### Create Email Template

```javascript
POST /api/email/templates

Body: {
  name: "fund-published",
  subject: "New Fund Available: {{fundName}}",
  category: "SYSTEM",
  body: `
    <h1>New Investment Opportunity</h1>
    <p>A new fund has been published:</p>
    <h2>{{fundName}}</h2>
    <ul>
      <li><strong>Type:</strong> {{fundType}}</li>
      <li><strong>Target Size:</strong> ${{targetSize}}</li>
      <li><strong>Vintage:</strong> {{vintage}}</li>
    </ul>
    <p>
      <a href="{{portalUrl}}/plugins/fund-marketing/funds/{{fundId}}"
         style="background: #7c3aed; color: white; padding: 12px 24px;
                text-decoration: none; border-radius: 6px;">
        View Fund Details
      </a>
    </p>
  `,
  variablesSchema: {
    fundName: { type: "string", required: true },
    fundType: { type: "string", required: true },
    targetSize: { type: "number", required: true },
    vintage: { type: "number", required: true },
    portalUrl: { type: "string", required: true },
    fundId: { type: "string", required: true }
  }
}

Response: {
  id: "uuid",
  name: "fund-published",
  version: 1,
  createdAt: "2025-11-19T10:00:00Z"
}
```

### Send Email

```javascript
POST /api/email/send

Body: {
  templateName: "fund-published",
  to: "investor@example.com",
  cc: ["manager@fund.com"], // Optional
  bcc: ["admin@fund.com"], // Optional
  variables: {
    fundName: "Tech Growth Fund III",
    fundType: "Venture Capital",
    targetSize: 500000000,
    vintage: 2024,
    portalUrl: "https://portal.example.com",
    fundId: "fund-uuid"
  },
  priority: "normal", // Optional: low, normal, high
  sendAt: "2025-11-20T09:00:00Z" // Optional: schedule send
}

Response: {
  success: true,
  emailId: "uuid",
  queuedAt: "2025-11-19T10:00:00Z",
  status: "PENDING"
}
```

### Get Email Status

```javascript
GET /api/email/logs/{emailId}

Response: {
  id: "uuid",
  to: "investor@example.com",
  subject: "New Fund Available: Tech Growth Fund III",
  status: "SENT",
  sentAt: "2025-11-19T10:05:00Z",
  deliveredAt: "2025-11-19T10:05:12Z",
  opened: true,
  openedAt: "2025-11-19T10:30:00Z",
  clicked: false,
  error: null
}
```

### Get Email Statistics

```javascript
GET /api/email/stats?startDate=2025-11-01&endDate=2025-11-30&groupBy=category

Response: {
  stats: {
    total: 1250,
    sent: 1200,
    failed: 50,
    pending: 0,
    openRate: 0.68,
    clickRate: 0.23,
    byCategory: {
      SYSTEM: { sent: 450, opened: 320 },
      CAPITAL_CALL: { sent: 300, opened: 285 },
      DOCUMENT: { sent: 500, opened: 395 }
    }
  }
}
```

---

## Audit Trail API

### Log Audit Event

```javascript
POST /api/admin/audit-trail

Body: {
  action: "FUND_PUBLISHED",
  resourceType: "Fund",
  resourceId: "fund-uuid",
  metadata: {
    plugin: "fund-marketing-plugin",
    fundName: "Tech Growth Fund III",
    fundType: "VENTURE",
    publishedBy: "user@example.com",
    publishedAt: "2025-11-19T10:00:00Z"
  }
}

Response: {
  id: "uuid",
  action: "FUND_PUBLISHED",
  userId: "current-user-uuid",
  userEmail: "user@example.com",
  resourceType: "Fund",
  resourceId: "fund-uuid",
  ipAddress: "192.168.1.1",
  userAgent: "Mozilla/5.0...",
  metadata: { /* as submitted */ },
  createdAt: "2025-11-19T10:00:00Z"
}
```

### Query Audit Trail

```javascript
GET /api/admin/audit-trail?
    page=1&
    limit=50&
    action=FUND_PUBLISHED&
    resourceType=Fund&
    userId=user-uuid&
    startDate=2025-11-01&
    endDate=2025-11-30

Response: {
  logs: [
    {
      id: "uuid",
      action: "FUND_PUBLISHED",
      userId: "user-uuid",
      userEmail: "manager@fund.com",
      resourceType: "Fund",
      resourceId: "fund-uuid",
      ipAddress: "192.168.1.1",
      metadata: {
        plugin: "fund-marketing-plugin",
        fundName: "Tech Growth Fund III"
      },
      createdAt: "2025-11-19T10:00:00Z"
    }
  ],
  total: 45,
  page: 1,
  limit: 50
}
```

---

## User Management API

### List Users

```javascript
GET /api/admin/users?page=1&limit=20&role=INVESTOR&search=john

Response: {
  users: [
    {
      id: "uuid",
      email: "john@example.com",
      firstName: "John",
      lastName: "Doe",
      isActive: true,
      roles: ["INVESTOR", "USER"],
      profile: {
        avatar: "url",
        timezone: "America/New_York",
        language: "en"
      },
      createdAt: "2025-01-15T00:00:00Z",
      lastLoginAt: "2025-11-19T09:00:00Z"
    }
  ],
  total: 156,
  page: 1,
  limit: 20
}
```

### Get User Details

```javascript
GET /api/admin/users/{userId}

Response: {
  id: "uuid",
  email: "john@example.com",
  firstName: "John",
  lastName: "Doe",
  isActive: true,
  roles: [
    {
      id: "role-uuid",
      name: "INVESTOR",
      permissions: [ /* permission list */ ]
    }
  ],
  profile: {
    avatar: "url",
    timezone: "America/New_York",
    language: "en",
    preferences: {
      emailNotifications: true,
      theme: "light"
    }
  },
  createdAt: "2025-01-15T00:00:00Z",
  lastLoginAt: "2025-11-19T09:00:00Z"
}
```

---

## File Upload API

### Upload File

```javascript
POST /api/files/upload

Content-Type: multipart/form-data

FormData: {
  file: <File>,
  category: "FUND_DOCUMENT", // Optional
  metadata: { fundId: "uuid", documentType: "PPM" } // Optional JSON string
}

Response: {
  id: "uuid",
  filename: "PPM_2024.pdf",
  originalFilename: "Private Placement Memorandum 2024.pdf",
  mimeType: "application/pdf",
  size: 2048576,
  url: "/api/files/uuid/download",
  category: "FUND_DOCUMENT",
  metadata: {
    fundId: "uuid",
    documentType: "PPM"
  },
  uploadedBy: "user-uuid",
  uploadedAt: "2025-11-19T10:00:00Z"
}
```

### Download File

```javascript
GET /api/files/{fileId}/download

Response: File binary data with appropriate headers
```

### Delete File

```javascript
DELETE /api/files/{fileId}

Response: {
  success: true,
  message: "File deleted successfully"
}
```

---

## Error Handling

### Standard Error Response

```javascript
{
  error: {
    code: "VALIDATION_ERROR",
    message: "Validation failed for the request",
    details: {
      fields: {
        fundName: ["Fund name must be at least 3 characters"],
        targetSize: ["Target size must be a positive number"]
      }
    }
  },
  statusCode: 400,
  timestamp: "2025-11-19T10:00:00Z",
  path: "/api/dynamic/Fund"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication token |
| `FORBIDDEN` | 403 | User doesn't have required permissions |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `NOT_FOUND` | 404 | Requested resource doesn't exist |
| `DUPLICATE_ERROR` | 409 | Resource with same identifier already exists |
| `BUSINESS_RULE_VIOLATION` | 422 | Business logic validation failed |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests in time window |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

### Error Handling in Plugins

```javascript
try {
  const response = await fetch(context.getApiUrl('/dynamic/Fund'), {
    method: 'POST',
    headers,
    body: JSON.stringify(fundData)
  });

  if (!response.ok) {
    const error = await response.json();

    switch (response.status) {
      case 400:
        // Validation errors
        context.showError('Validation Error', error.error.message);
        // Display field-specific errors
        if (error.error.details?.fields) {
          Object.entries(error.error.details.fields).forEach(([field, messages]) => {
            console.error(`${field}: ${messages.join(', ')}`);
          });
        }
        break;

      case 401:
        // Unauthorized - token expired or invalid
        context.showError('Session Expired', 'Please log in again');
        // Trigger re-authentication
        context.router.push('/login');
        break;

      case 403:
        // Forbidden - insufficient permissions
        context.showError('Permission Denied', 'You do not have permission to perform this action');
        break;

      case 404:
        // Not found
        context.showError('Not Found', 'The requested resource was not found');
        break;

      case 429:
        // Rate limit exceeded
        context.showWarning('Too Many Requests', 'Please slow down and try again in a moment');
        break;

      default:
        // Generic error
        context.showError('Error', error.error.message || 'An unexpected error occurred');
    }

    throw new Error(error.error.message);
  }

  const data = await response.json();
  return data;
} catch (error) {
  console.error('API request failed:', error);
  throw error;
}
```

---

## Rate Limiting

### Current Limits

| Endpoint Pattern | Limit | Window |
|-----------------|-------|--------|
| `/api/auth/*` | 5 requests | 1 minute |
| `/api/admin/*` | 30 requests | 1 minute |
| `/api/dynamic/*` (read) | 100 requests | 1 minute |
| `/api/dynamic/*` (write) | 30 requests | 1 minute |
| `/api/email/send` | 10 requests | 1 minute |
| `/api/files/upload` | 20 requests | 1 minute |
| Default | 60 requests | 1 minute |

### Rate Limit Headers

Responses include rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1700000000
```

### Handling Rate Limits

```javascript
const makeRateLimitedRequest = async (url, options) => {
  try {
    const response = await fetch(url, options);

    // Check rate limit headers
    const remaining = parseInt(response.headers.get('X-RateLimit-Remaining') || '0');
    const reset = parseInt(response.headers.get('X-RateLimit-Reset') || '0');

    if (remaining < 10) {
      console.warn(`Rate limit approaching: ${remaining} requests remaining`);
    }

    if (response.status === 429) {
      const resetDate = new Date(reset * 1000);
      const waitTime = resetDate - new Date();

      context.showWarning(
        'Rate Limit Exceeded',
        `Please wait ${Math.ceil(waitTime / 1000)} seconds before trying again`
      );

      // Optionally: wait and retry
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return makeRateLimitedRequest(url, options);
    }

    return response;
  } catch (error) {
    throw error;
  }
};
```

---

## Complete Examples

### Example 1: Full CRUD Workflow for Fund Management

```javascript
const { ref, onMounted } = window.Vue;
const context = usePluginContext('fund-marketing-plugin');

const FundCRUDExample = {
  setup() {
    const funds = ref([]);
    const loading = ref(false);
    const error = ref(null);

    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // CREATE: Add new fund
    const createFund = async (fundData) => {
      try {
        loading.value = true;
        error.value = null;

        const response = await fetch(
          context.getApiUrl('/dynamic/Fund'),
          {
            method: 'POST',
            headers,
            body: JSON.stringify({
              fieldValues: fundData
            })
          }
        );

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error.message);
        }

        const newFund = await response.json();

        // Log to audit trail
        await fetch(context.getApiUrl('/admin/audit-trail'), {
          method: 'POST',
          headers,
          body: JSON.stringify({
            action: 'FUND_CREATED',
            resourceType: 'Fund',
            resourceId: newFund.id,
            metadata: {
              plugin: 'fund-marketing-plugin',
              fundName: fundData.fundName
            }
          })
        });

        context.showSuccess('Fund Created', `${fundData.fundName} has been created`);
        await loadFunds();

        return newFund;
      } catch (err) {
        error.value = err.message;
        context.showError('Creation Failed', err.message);
        throw err;
      } finally {
        loading.value = false;
      }
    };

    // READ: List all funds
    const loadFunds = async (filters = {}) => {
      try {
        loading.value = true;
        error.value = null;

        const queryParams = new URLSearchParams({
          page: filters.page || 1,
          limit: filters.limit || 20,
          ...filters
        });

        const response = await fetch(
          context.getApiUrl(`/dynamic/Fund?${queryParams}`),
          { headers }
        );

        if (!response.ok) {
          throw new Error('Failed to load funds');
        }

        const data = await response.json();
        funds.value = data.instances;

        return data;
      } catch (err) {
        error.value = err.message;
        context.showError('Load Error', err.message);
        throw err;
      } finally {
        loading.value = false;
      }
    };

    // UPDATE: Modify fund
    const updateFund = async (fundId, updates) => {
      try {
        loading.value = true;
        error.value = null;

        const response = await fetch(
          context.getApiUrl(`/dynamic/Fund/${fundId}`),
          {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
              fieldValues: updates
            })
          }
        );

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error.message);
        }

        const updatedFund = await response.json();

        // Log update
        await fetch(context.getApiUrl('/admin/audit-trail'), {
          method: 'POST',
          headers,
          body: JSON.stringify({
            action: 'FUND_UPDATED',
            resourceType: 'Fund',
            resourceId: fundId,
            metadata: {
              plugin: 'fund-marketing-plugin',
              changes: updates
            }
          })
        });

        context.showSuccess('Fund Updated', 'Changes have been saved');
        await loadFunds();

        return updatedFund;
      } catch (err) {
        error.value = err.message;
        context.showError('Update Failed', err.message);
        throw err;
      } finally {
        loading.value = false;
      }
    };

    // DELETE: Remove fund
    const deleteFund = async (fundId, fundName) => {
      try {
        loading.value = true;
        error.value = null;

        const response = await fetch(
          context.getApiUrl(`/dynamic/Fund/${fundId}`),
          {
            method: 'DELETE',
            headers
          }
        );

        if (!response.ok) {
          throw new Error('Failed to delete fund');
        }

        // Log deletion
        await fetch(context.getApiUrl('/admin/audit-trail'), {
          method: 'POST',
          headers,
          body: JSON.stringify({
            action: 'FUND_DELETED',
            resourceType: 'Fund',
            resourceId: fundId,
            metadata: {
              plugin: 'fund-marketing-plugin',
              fundName
            }
          })
        });

        context.showSuccess('Fund Deleted', `${fundName} has been removed`);
        await loadFunds();
      } catch (err) {
        error.value = err.message;
        context.showError('Delete Failed', err.message);
        throw err;
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      loadFunds();
    });

    return {
      funds,
      loading,
      error,
      createFund,
      loadFunds,
      updateFund,
      deleteFund
    };
  }
};
```

### Example 2: Publishing Fund with Email Notification

```javascript
const publishFund = async (fundId) => {
  const context = usePluginContext('fund-marketing-plugin');
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  try {
    // Step 1: Get fund details
    const fundResponse = await fetch(
      context.getApiUrl(`/dynamic/Fund/${fundId}`),
      { headers }
    );
    const fund = await fundResponse.json();

    // Step 2: Update fund status to published
    await fetch(
      context.getApiUrl(`/dynamic/Fund/${fundId}`),
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          fieldValues: {
            isPublished: true,
            publishedAt: new Date().toISOString()
          }
        })
      }
    );

    // Step 3: Get all investors
    const usersResponse = await fetch(
      context.getApiUrl('/admin/users?role=INVESTOR&limit=1000'),
      { headers }
    );
    const { users } = await usersResponse.json();

    // Step 4: Send email to each investor
    for (const investor of users) {
      await fetch(
        context.getApiUrl('/email/send'),
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            templateName: 'fund-published',
            to: investor.email,
            variables: {
              fundName: fund.fieldValues.fundName,
              fundType: fund.fieldValues.fundType,
              targetSize: fund.fieldValues.targetSize,
              vintage: fund.fieldValues.vintage,
              portalUrl: window.location.origin,
              fundId: fundId,
              investorName: `${investor.firstName} ${investor.lastName}`
            }
          })
        }
      );
    }

    // Step 5: Log audit event
    await fetch(context.getApiUrl('/admin/audit-trail'), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'FUND_PUBLISHED',
        resourceType: 'Fund',
        resourceId: fundId,
        metadata: {
          plugin: 'fund-marketing-plugin',
          fundName: fund.fieldValues.fundName,
          notificationsSent: users.length
        }
      })
    });

    // Step 6: Emit event for other plugins
    context.emitEvent('fund-published', {
      fundId,
      fundName: fund.fieldValues.fundName,
      fundType: fund.fieldValues.fundType,
      timestamp: new Date().toISOString()
    });

    context.showSuccess(
      'Fund Published',
      `${fund.fieldValues.fundName} has been published. ${users.length} investors notified.`
    );

  } catch (error) {
    context.showError('Publish Failed', error.message);
    throw error;
  }
};
```

---

## Best Practices

### 1. Token Management

```javascript
// Always get fresh token for requests
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

// Use in requests
const response = await fetch(url, {
  method: 'POST',
  headers: getAuthHeaders(),
  body: JSON.stringify(data)
});
```

### 2. Error Recovery

```javascript
const makeResilientRequest = async (url, options, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);

      if (response.status === 401 && i < retries - 1) {
        // Token might be expired, try to refresh
        // Implement token refresh logic here
        continue;
      }

      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
};
```

### 3. Batch Operations

```javascript
// Instead of making 100 individual requests
for (const investor of investors) {
  await sendEmail(investor.email); // Bad: 100 requests
}

// Batch them
await fetch(context.getApiUrl('/email/send-batch'), {
  method: 'POST',
  headers,
  body: JSON.stringify({
    templateName: 'fund-published',
    recipients: investors.map(i => ({
      to: i.email,
      variables: { name: i.firstName }
    }))
  })
});
```

### 4. Caching

```javascript
// Cache frequently accessed data
const cache = new Map();

const getCachedData = async (key, fetcher, ttl = 5 * 60 * 1000) => {
  const cached = cache.get(key);

  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }

  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });

  return data;
};

// Usage
const funds = await getCachedData('funds', () =>
  fetch(context.getApiUrl('/dynamic/Fund')).then(r => r.json())
);
```

---

**End of Core API Reference**
