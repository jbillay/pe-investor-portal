# API Documentation

## Overview

The PE Investor Portal API provides comprehensive endpoints for user authentication, role-based access control (RBAC), permission management, health monitoring, and secure operations. Built with NestJS and TypeScript, all endpoints follow RESTful conventions and return JSON responses with comprehensive OpenAPI/Swagger documentation.

## Base URL

- **Development**: `http://localhost:3000`
- **Production**: `https://api.pe-portal.com`

## Authentication

### Authentication Methods

1. **Bearer Token**: Include JWT token in Authorization header
   ```
   Authorization: Bearer <your-jwt-token>
   ```

2. **Public Endpoints**: Some endpoints are marked as public and don't require authentication:
   - `/health` - Health check endpoint
   - `/auth/register` - User registration
   - `/auth/login` - User login
   - `/auth/refresh` - Token refresh

3. **Role-Based Access**: Many endpoints require specific roles:
   - **ADMIN**: Full system access including role and permission management
   - **INVESTOR**: Limited access to portfolio and user features
   - **USER**: Basic access to personal features

### Token Lifecycle

- **Access Token**: 15 minutes expiry
- **Refresh Token**: 7 days expiry
- **Token Rotation**: Refresh tokens are rotated on each refresh

## Rate Limiting

The API implements sophisticated rate limiting using NestJS Throttler with different limits per endpoint:

| Endpoint Pattern | Limit | Window |
|------------------|-------|---------|
| `/auth/register` | 5 requests | 5 minutes |
| `/auth/login` | 10 requests | 15 minutes |
| `/auth/refresh` | 20 requests | 10 minutes |
| `/roles/assign` | 30 requests | 60 seconds |
| `/permissions/assign` | 30 requests | 60 seconds |
| `/permissions/bulk-assign` | 5 requests | 5 minutes |
| Global (all endpoints) | 10 requests | 1 minute |

Rate limits are applied per IP address and include proper HTTP headers in responses.

## Response Format

### Success Response
```json
{
  "statusCode": 200,
  "data": {
    // Response payload
  },
  "message": "Success message",
  "timestamp": "2025-01-09T10:30:00.000Z"
}
```

### Error Response
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Detailed error description",
  "timestamp": "2025-01-09T10:30:00.000Z"
}
```

## Endpoints

### Health Check

#### GET /health

Check API health status. This is a public endpoint that doesn't require authentication.

**Request:**
```bash
curl -X GET http://localhost:3000/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-09T10:30:00.000Z",
  "service": "pe-investor-portal-api",
  "version": "1.0.0"
}
```

**Features:**
- Public endpoint (no authentication required)
- Used for service monitoring and load balancer health checks
- Returns current timestamp and service information

### Authentication Endpoints

#### POST /auth/register

Register a new user account. This endpoint is public and includes enhanced security with rate limiting.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "cljk0x5a10001qz6z9k8z9k8z",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "tenantId": "cljk0x5a10001qz6z9k8z9k8z"
  },
  "expiresIn": 900
}
```

**Errors:**
- `409 Conflict`: User with email already exists
- `400 Bad Request`: Invalid input data
- `429 Too Many Requests`: Rate limit exceeded

#### POST /api/auth/login

Authenticate user with email and password.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePassword123",
  "tenantId": "optional-tenant-uuid"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "cljk0x5a10001qz6z9k8z9k8z",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "tenantId": "cljk0x5a10001qz6z9k8z9k8z"
  },
  "expiresIn": 900
}
```

**Errors:**
- `401 Unauthorized`: Invalid credentials
- `429 Too Many Requests`: Rate limit exceeded

#### POST /api/auth/refresh

Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "cljk0x5a10001qz6z9k8z9k8z",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "tenantId": "cljk0x5a10001qz6z9k8z9k8z"
  },
  "expiresIn": 900
}
```

**Errors:**
- `401 Unauthorized`: Invalid or expired refresh token
- `429 Too Many Requests`: Rate limit exceeded

#### POST /auth/logout

**Authentication Required**

Logout user and revoke refresh token. Requires both Bearer token and refresh token in request body.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

**Errors:**
- `401 Unauthorized`: Invalid or missing JWT token

#### POST /auth/logout-all

**Authentication Required**

Logout from all devices (revoke all refresh tokens). Only requires Bearer token authentication.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response (200):**
```json
{
  "message": "Logged out from all devices successfully"
}
```

**Errors:**
- `401 Unauthorized`: Invalid or missing JWT token

#### GET /auth/profile

**Authentication Required**

Get current user profile information. Returns comprehensive user data including verification status.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response (200):**
```json
{
  "id": "cljk0x5a10001qz6z9k8z9k8z",
  "email": "john.doe@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "isActive": true,
  "isVerified": true
}
```

**Errors:**
- `401 Unauthorized`: Invalid or missing JWT token

#### GET /auth/validate

**Authentication Required**

Validate current JWT token and return user information. Useful for checking token validity before making other API calls.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response (200):**
```json
{
  "valid": true,
  "user": {
    "id": "cljk0x5a10001qz6z9k8z9k8z",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "isActive": true,
    "isVerified": true
  }
}
```

**Errors:**
- `401 Unauthorized`: Invalid or missing JWT token

## Role-Based Access Control (RBAC)

The API implements comprehensive role-based access control with hierarchical permissions and granular resource management.

### System Roles

#### ADMIN
Full system administrator with unrestricted access to all features and resources.

**Permissions:**
- Complete user management (create, view, update, delete)
- Full role and permission management
- System administration and audit log access
- All dashboard and resource access

#### INVESTOR
Limited administrative access focused on portfolio management and user oversight.

**Permissions:**
- View user details and basic management
- View roles and permissions (read-only)
- Access to investor and user dashboards
- Portfolio management (create, view, update)

#### USER
Basic user with access to personal features and limited system interaction.

**Permissions:**
- Access to personal dashboard
- View personal portfolio information
- Basic profile management

### Role Management Endpoints

#### POST /api/roles
**Authentication Required: ADMIN only**

Create a new system role with specific permissions.

**Request Body:**
```json
{
  "name": "CUSTOM_ROLE",
  "description": "Custom role for specific use case",
  "isActive": true,
  "isDefault": false
}
```

**Response (201):**
```json
{
  "id": "cljk0x5a10001qz6z9k8z9k8z",
  "name": "CUSTOM_ROLE",
  "description": "Custom role for specific use case",
  "isActive": true,
  "isDefault": false,
  "createdAt": "2023-07-01T12:00:00Z",
  "updatedAt": "2023-07-01T12:00:00Z",
  "userCount": 0
}
```

#### GET /api/roles
**Authentication Required: ADMIN only**

Retrieve all system roles with optional filtering.

**Query Parameters:**
- `includeInactive` (boolean): Include inactive roles in response

**Response (200):**
```json
[
  {
    "id": "role-admin-id",
    "name": "ADMIN",
    "description": "System administrator with full access",
    "isActive": true,
    "isDefault": false,
    "userCount": 3,
    "permissions": [
      {
        "id": "perm-create-user",
        "name": "CREATE_USER",
        "resource": "USER",
        "action": "CREATE"
      }
    ]
  }
]
```

#### POST /api/roles/assign
**Authentication Required: ADMIN only**
**Rate Limited: 30 requests per minute**

Assign a role to a user with audit logging.

**Request Body:**
```json
{
  "userId": "user-id-123",
  "roleId": "role-id-456",
  "reason": "User promotion to investor status"
}
```

**Response (200):**
```json
{
  "message": "Role assigned successfully"
}
```

#### GET /api/roles/user/:userId
**Authentication Required: ADMIN or INVESTOR**

Get all roles and permissions for a specific user.

**Response (200):**
```json
{
  "user": {
    "id": "user-id-123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "roles": [
    {
      "id": "role-id-456",
      "name": "INVESTOR",
      "assignedAt": "2023-07-01T12:00:00Z"
    }
  ],
  "permissions": [
    "VIEW_PORTFOLIO",
    "CREATE_PORTFOLIO",
    "VIEW_USER_DASHBOARD"
  ]
}
```

#### GET /api/roles/me/roles
**Authentication Required**

Get current user's roles and permissions.

**Response (200):**
```json
{
  "roles": [
    {
      "id": "role-id-789",
      "name": "USER",
      "assignedAt": "2023-07-01T12:00:00Z"
    }
  ],
  "permissions": [
    "VIEW_USER_DASHBOARD",
    "VIEW_PORTFOLIO"
  ]
}
```

### Permission Management Endpoints

#### POST /api/permissions
**Authentication Required: ADMIN only**

Create a new system permission.

**Request Body:**
```json
{
  "name": "MANAGE_REPORTS",
  "description": "Manage system reports",
  "resource": "REPORT",
  "action": "MANAGE",
  "isActive": true
}
```

#### GET /api/permissions/by-resource
**Authentication Required: ADMIN only**

Get permissions grouped by resource type.

**Response (200):**
```json
{
  "USER": [
    {
      "id": "perm-create-user",
      "name": "CREATE_USER",
      "description": "Create new users",
      "action": "CREATE"
    }
  ],
  "PORTFOLIO": [
    {
      "id": "perm-view-portfolio",
      "name": "VIEW_PORTFOLIO",
      "description": "View portfolio details",
      "action": "READ"
    }
  ]
}
```

#### POST /api/permissions/assign
**Authentication Required: ADMIN only**
**Rate Limited: 30 requests per minute**

Assign permission to role.

**Request Body:**
```json
{
  "roleId": "role-id-456",
  "permissionId": "permission-id-789",
  "reason": "Adding portfolio management capabilities"
}
```

#### POST /api/permissions/bulk-assign
**Authentication Required: ADMIN only**
**Rate Limited: 5 requests per 5 minutes**

Bulk assign multiple permissions to a role.

**Request Body:**
```json
{
  "roleId": "role-id-456",
  "permissionIds": [
    "permission-id-1",
    "permission-id-2",
    "permission-id-3"
  ],
  "reason": "Setting up investor role permissions"
}
```

**Response (200):**
```json
{
  "successCount": 2,
  "failures": [
    {
      "permissionId": "permission-id-2",
      "error": "Permission already assigned to role"
    }
  ]
}
```

#### GET /api/permissions/me/permissions
**Authentication Required**

Get current user's effective permissions.

**Response (200):**
```json
{
  "user": {
    "id": "user-id-123",
    "email": "user@example.com"
  },
  "permissions": [
    {
      "name": "VIEW_USER_DASHBOARD",
      "resource": "DASHBOARD",
      "action": "READ",
      "source": "USER"
    },
    {
      "name": "VIEW_PORTFOLIO",
      "resource": "PORTFOLIO",
      "action": "READ",
      "source": "USER"
    }
  ],
  "roles": ["USER"]
}
```

### Permission Checking

#### POST /api/permissions/check/me
**Authentication Required**

Check if current user has specific permission.

**Request Body:**
```json
{
  "permissionName": "CREATE_PORTFOLIO",
  "resource": "PORTFOLIO"
}
```

**Response (200):**
```json
{
  "hasPermission": false,
  "permission": "CREATE_PORTFOLIO",
  "resource": "PORTFOLIO",
  "userId": "user-id-123"
}
```

### Available Permissions

#### User Management
- `CREATE_USER` - Create new users
- `VIEW_USER` - View user details
- `UPDATE_USER` - Update user information
- `DELETE_USER` - Delete users

#### Role Management
- `CREATE_ROLE` - Create new roles
- `VIEW_ROLE` - View role details
- `UPDATE_ROLE` - Update role information
- `DELETE_ROLE` - Delete roles
- `ASSIGN_ROLE` - Assign roles to users
- `REVOKE_ROLE` - Remove roles from users

#### Permission Management
- `CREATE_PERMISSION` - Create new permissions
- `VIEW_PERMISSION` - View permission details
- `UPDATE_PERMISSION` - Update permission information
- `DELETE_PERMISSION` - Delete permissions

#### Dashboard Access
- `VIEW_ADMIN_DASHBOARD` - Access admin dashboard
- `VIEW_INVESTOR_DASHBOARD` - Access investor dashboard
- `VIEW_USER_DASHBOARD` - Access user dashboard

#### Portfolio Management
- `CREATE_PORTFOLIO` - Create new portfolios
- `VIEW_PORTFOLIO` - View portfolio details
- `UPDATE_PORTFOLIO` - Update portfolio information
- `DELETE_PORTFOLIO` - Delete portfolios

#### System Management
- `VIEW_AUDIT_LOGS` - View system audit logs
- `MANAGE_SYSTEM_SETTINGS` - Manage system settings
- `VIEW_SYSTEM_METRICS` - View system metrics

### Security Features

### IP Address Tracking

The API automatically captures and logs client IP addresses for security auditing:

- Supports X-Forwarded-For headers for reverse proxy setups
- Falls back to connection remote address
- Used for authentication audit trails and security monitoring

### Request Auditing

All authentication-related actions are logged with comprehensive details:

- User registration and login attempts
- Token refresh operations
- Logout events (both single device and all devices)
- IP address and User-Agent tracking

## Error Codes

| Status Code | Description | Common Causes |
|-------------|-------------|---------------|
| 400 | Bad Request | Invalid request payload, validation errors |
| 401 | Unauthorized | Invalid/missing JWT token, invalid credentials |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists (e.g., email taken) |
| 422 | Unprocessable Entity | Validation errors with detailed field information |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |

## Request/Response Examples

### cURL Examples

**Register User:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane.smith@example.com",
    "password": "SecurePassword456",
    "firstName": "Jane",
    "lastName": "Smith"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane.smith@example.com",
    "password": "SecurePassword456"
  }'
```

**Get Profile:**
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "X-Tenant-ID: cljk0x5a10001qz6z9k8z9k8z"
```

### JavaScript/TypeScript Examples

**Using Fetch API:**
```typescript
// Register
const registerResponse = await fetch('http://localhost:3000/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'john.doe@example.com',
    password: 'SecurePassword123',
    firstName: 'John',
    lastName: 'Doe'
  })
});

const authData = await registerResponse.json();

// Authenticated request
const profileResponse = await fetch('http://localhost:3000/api/auth/profile', {
  headers: {
    'Authorization': `Bearer ${authData.accessToken}`,
    'X-Tenant-ID': authData.user.tenantId
  }
});

const userProfile = await profileResponse.json();
```

## SDK and Client Libraries

### TypeScript/JavaScript SDK

```typescript
import { PEPortalClient } from '@pe-portal/sdk';

const client = new PEPortalClient({
  baseUrl: 'http://localhost:3000',
  apiKey: 'your-api-key' // Optional for public endpoints
});

// Register user
const authResult = await client.auth.register({
  email: 'user@example.com',
  password: 'password',
  firstName: 'John',
  lastName: 'Doe'
});

// Login
const loginResult = await client.auth.login({
  email: 'user@example.com',
  password: 'password'
});

// Set token for authenticated requests
client.setAccessToken(loginResult.accessToken);

// Get profile
const profile = await client.auth.getProfile();
```

## Webhooks and Events

### Available Webhooks

| Event | Trigger | Payload |
|-------|---------|---------|
| `user.registered` | New user registration | User object |
| `user.login` | Successful login | User object + metadata |
| `user.logout` | User logout | User ID + session info |
| `session.expired` | Token expiration | User ID + token info |

### Webhook Configuration

Webhooks can be configured through the API or admin interface:

```json
{
  "url": "https://your-app.com/webhooks/pe-portal",
  "events": ["user.registered", "user.login"],
  "secret": "webhook-signing-secret"
}
```

## Testing

### Postman Collection

A complete Postman collection is available at `/docs/postman/pe-portal-api.json`.

### Test Users

Development environment includes test users:

```json
[
  {
    "email": "admin@test.com",
    "password": "TestAdmin123",
    "role": "admin"
  },
  {
    "email": "user@test.com",
    "password": "TestUser123",
    "role": "user"
  }
]
```

## Interactive Documentation

### OpenAPI/Swagger Integration

The API includes comprehensive OpenAPI 3.0 documentation with interactive testing capabilities:

- **Development**: http://localhost:3000/api-docs
- **Production**: https://api.pe-portal.com/api-docs

### Features

- Complete endpoint documentation with request/response examples
- Interactive testing interface
- Schema definitions for all DTOs
- Authentication examples
- Rate limiting information
- Error response documentation

### Swagger Tags

The API is organized into the following tag categories:

- **Authentication**: All auth-related endpoints (`/auth/*`)
- **Role Management**: Role-based access control operations (`/roles/*`)
- **Permission Management**: Permission management and assignment (`/permissions/*`)
- **Health**: Service health monitoring (`/health`)

## Support

- **Interactive Documentation**: http://localhost:3000/api-docs
- **GitHub Issues**: https://github.com/your-org/pe-investor-portal/issues
- **Email Support**: api-support@pe-portal.com