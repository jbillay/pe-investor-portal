# Role-Based Access Control (RBAC) Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Concepts](#core-concepts)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Usage Examples](#usage-examples)
7. [Guards and Decorators](#guards-and-decorators)
8. [Security Considerations](#security-considerations)
9. [Best Practices](#best-practices)

## Overview

The PE Investor Portal implements a comprehensive Role-Based Access Control (RBAC) system that provides fine-grained authorization and access management. The system supports hierarchical roles, granular permissions, and enterprise-grade auditing capabilities.

### Key Features

- **Hierarchical Role System**: Support for complex organizational structures
- **Granular Permissions**: Resource-action based permission model
- **Multi-Role Assignment**: Users can have multiple roles simultaneously
- **Audit Trail**: Complete history of role assignments and changes
- **Session Management**: Integration with JWT authentication
- **Bulk Operations**: Efficient bulk role assignments and revocations
- **Rate Limiting**: Protection against abuse on sensitive operations

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Controllers   │    │    Services     │    │   Database      │
│                 │    │                 │    │                 │
│ RoleController  │◄──►│  RoleService    │◄──►│  Role           │
│ PermController  │    │  PermService    │    │  Permission     │
│                 │    │  AuthService    │    │  UserRole       │
└─────────────────┘    └─────────────────┘    │  RolePermission │
                                              │  RoleAssignment │
┌─────────────────┐    ┌─────────────────┐    │  AuditLog       │
│     Guards      │    │   Decorators    │    └─────────────────┘
│                 │    │                 │
│  RoleGuard      │    │  @RequireRoles  │
│  PermissionGuard│    │  @RequirePerms  │
│  JwtAuthGuard   │    │  @Public        │
└─────────────────┘    └─────────────────┘
```

## Core Concepts

### Roles

Roles represent job functions or organizational positions within the system:

- **ADMIN**: System administrators with full access
- **INVESTOR**: Portal users who can view and manage their investments
- **USER**: Basic authenticated users with limited access

#### Role Properties

- `id`: Unique identifier
- `name`: Human-readable role name (unique)
- `description`: Detailed role description
- `isActive`: Whether the role is currently active
- `isDefault`: Whether this is the default role for new users
- `createdAt/updatedAt`: Timestamp tracking

### Permissions

Permissions define specific actions that can be performed on resources:

#### Permission Model: `RESOURCE_ACTION`

- **USER Permissions**: `CREATE_USER`, `VIEW_USER`, `UPDATE_USER`, `DELETE_USER`
- **ROLE Permissions**: `CREATE_ROLE`, `VIEW_ROLE`, `UPDATE_ROLE`, `DELETE_ROLE`
- **PORTFOLIO Permissions**: `VIEW_PORTFOLIO`, `MANAGE_PORTFOLIO`

#### Permission Properties

- `id`: Unique identifier
- `name`: Permission name (e.g., "CREATE_USER")
- `description`: Human-readable description
- `resource`: Target resource (e.g., "USER", "PORTFOLIO")
- `action`: Action type ("CREATE", "READ", "UPDATE", "DELETE")
- `isActive`: Whether permission is active

### User-Role Relationships

- **Many-to-Many**: Users can have multiple roles
- **Time-based**: Assignments can have expiration dates
- **Audited**: All changes are logged with context
- **Hierarchical**: Permissions are inherited from all assigned roles

## Database Schema

### Core Tables

```sql
-- Role definition
CREATE TABLE "Role" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

-- Permission definition
CREATE TABLE "Permission" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "resource" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

-- User-Role assignment
CREATE TABLE "UserRole" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE,
  UNIQUE("userId", "roleId")
);

-- Role-Permission mapping
CREATE TABLE "RolePermission" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "roleId" TEXT NOT NULL,
  "permissionId" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE,
  FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE,
  UNIQUE("roleId", "permissionId")
);

-- Audit trail for role assignments
CREATE TABLE "RoleAssignment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  "assignedBy" TEXT NOT NULL,
  "reason" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "expiresAt" DATETIME,
  "revokedAt" DATETIME,
  "revokedBy" TEXT,
  "revokeReason" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE
);
```

## API Endpoints

### Role Management

#### `POST /auth/roles`
Create a new role (Admin only)

**Request Body:**
```json
{
  "name": "MANAGER",
  "description": "Portfolio manager role",
  "isActive": true,
  "isDefault": false
}
```

**Response:**
```json
{
  "id": "role-123",
  "name": "MANAGER",
  "description": "Portfolio manager role",
  "isActive": true,
  "isDefault": false,
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T10:00:00Z",
  "userCount": 0,
  "permissions": []
}
```

#### `GET /auth/roles`
List all roles

**Query Parameters:**
- `includeInactive`: boolean - Include inactive roles

#### `GET /auth/roles/:id`
Get role by ID

#### `PUT /auth/roles/:id`
Update role (Admin only)

#### `DELETE /auth/roles/:id`
Delete role (Admin only)

### Role Assignment

#### `POST /auth/roles/assign`
Assign role to user (Admin only)

**Request Body:**
```json
{
  "userId": "user-123",
  "roleId": "role-456",
  "reason": "Promotion to manager position"
}
```

#### `POST /auth/roles/revoke`
Revoke role from user (Admin only)

#### `POST /auth/roles/bulk-assign`
Bulk assign roles (Admin only)

**Request Body:**
```json
{
  "userIds": ["user-1", "user-2", "user-3"],
  "roleId": "role-123",
  "reason": "Department reorganization"
}
```

### User Role Information

#### `GET /auth/roles/users/:userId`
Get user's roles and permissions

#### `GET /auth/roles/users/:userId/history`
Get user's role assignment history

#### `GET /auth/roles/:roleId/users`
Get users with specific role

### Permission Management

#### `POST /auth/permissions`
Create permission (Admin only)

#### `GET /auth/permissions`
List all permissions

#### `GET /auth/permissions/by-resource`
Get permissions grouped by resource

#### `POST /auth/permissions/assign-to-role`
Assign permission to role

#### `POST /auth/permissions/revoke-from-role`
Revoke permission from role

#### `GET /auth/permissions/users/:userId`
Get user's effective permissions

#### `POST /auth/permissions/check`
Check if user has specific permission

## Usage Examples

### Protecting Routes with Role Requirements

```typescript
// Require specific role
@RequireRoles('ADMIN')
@Get('sensitive-data')
async getSensitiveData() {
  return this.dataService.getSensitiveData();
}

// Require any of multiple roles
@RequireAnyRole('ADMIN', 'MANAGER')
@Get('management-data')
async getManagementData() {
  return this.dataService.getManagementData();
}

// Require specific permissions
@RequirePermissions('VIEW_USER', 'VIEW_PORTFOLIO')
@Get('user-portfolios')
async getUserPortfolios() {
  return this.portfolioService.getUserPortfolios();
}

// Require any of multiple permissions
@RequireAnyPermission('VIEW_PORTFOLIO', 'MANAGE_PORTFOLIO')
@Get('portfolio-access')
async getPortfolioAccess() {
  return this.portfolioService.getPortfolioData();
}
```

### Service Usage

```typescript
// Check if user has role
const hasAdminRole = await this.roleService.userHasRole(userId, 'ADMIN');

// Get user's complete role information
const userRoles = await this.roleService.getUserRoles(userId);

// Check specific permission
const canCreateUser = await this.permissionService.checkUserPermission(
  userId,
  'CREATE_USER',
  'USER'
);

// Assign role with audit trail
await this.roleService.assignRole(
  {
    userId: 'user-123',
    roleId: 'role-456',
    reason: 'Promotion approved'
  },
  {
    assignedBy: currentUser.id,
    userAgent: request.headers['user-agent'],
    ipAddress: request.ip
  }
);
```

## Guards and Decorators

### Available Decorators

#### `@Public()`
Mark endpoint as public (bypass authentication)

```typescript
@Public()
@Get('public-info')
async getPublicInfo() {
  return this.infoService.getPublicData();
}
```

#### `@RequireRoles(...roles)`
Require ALL specified roles

```typescript
@RequireRoles('ADMIN', 'MANAGER')
@Post('admin-action')
async performAdminAction() {
  // User must have both ADMIN and MANAGER roles
}
```

#### `@RequireAnyRole(...roles)`
Require ANY of the specified roles

```typescript
@RequireAnyRole('ADMIN', 'INVESTOR')
@Get('portfolio-data')
async getPortfolioData() {
  // User must have either ADMIN or INVESTOR role
}
```

#### `@RequirePermissions(...permissions)`
Require ALL specified permissions

```typescript
@RequirePermissions('CREATE_USER', 'ASSIGN_ROLE')
@Post('create-user-with-role')
async createUserWithRole() {
  // User must have both permissions
}
```

#### `@RequireAnyPermission(...permissions)`
Require ANY of the specified permissions

```typescript
@RequireAnyPermission('VIEW_PORTFOLIO', 'MANAGE_PORTFOLIO')
@Get('portfolio-access')
async accessPortfolio() {
  // User needs at least one of these permissions
}
```

### Guard Execution Order

1. **JwtAuthGuard**: Validates JWT token and loads user
2. **RoleGuard**: Checks role and permission requirements
3. **PermissionGuard**: Additional permission-specific checks (if needed)

### User Context Enhancement

The guards automatically enhance the request user object:

```typescript
// Before guards
request.user = {
  id: 'user-123',
  email: 'user@example.com',
  // ... other user fields
}

// After RoleGuard
request.user = {
  id: 'user-123',
  email: 'user@example.com',
  roles: ['ADMIN', 'USER'],              // Added by guard
  permissions: ['CREATE_USER', 'VIEW_USER'], // Added by guard
  // ... other user fields
}
```

## Security Considerations

### Rate Limiting

Sensitive operations are rate-limited:

```typescript
// Role assignment endpoints
@Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 per minute
@Post('assign')
async assignRole() { /* ... */ }

// Bulk operations
@Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 per minute
@Post('bulk-assign')
async bulkAssignRoles() { /* ... */ }
```

### Input Validation

All inputs are validated using class-validator:

```typescript
export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  name: string;

  @IsString()
  @Length(0, 255)
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}
```

### Audit Logging

All role changes are logged with context:

```json
{
  "action": "ASSIGN_ROLE",
  "targetUserId": "user-123",
  "roleId": "role-456",
  "performedBy": "admin-789",
  "reason": "Promotion approved",
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "timestamp": "2025-01-15T10:00:00Z"
}
```

### Permission Inheritance

Users inherit all permissions from all assigned roles:

```typescript
// User has roles: ['ADMIN', 'INVESTOR']
// ADMIN role has: ['CREATE_USER', 'DELETE_USER']
// INVESTOR role has: ['VIEW_PORTFOLIO', 'MANAGE_PORTFOLIO']
// User effective permissions: ['CREATE_USER', 'DELETE_USER', 'VIEW_PORTFOLIO', 'MANAGE_PORTFOLIO']
```

## Best Practices

### Role Design

1. **Principle of Least Privilege**: Grant minimum permissions necessary
2. **Role Hierarchy**: Design roles to reflect organizational structure
3. **Clear Naming**: Use descriptive, standardized role names
4. **Documentation**: Maintain clear role descriptions and purposes

### Permission Design

1. **Resource-Action Pattern**: Follow `RESOURCE_ACTION` naming convention
2. **Granular Permissions**: Create specific permissions rather than broad ones
3. **Logical Grouping**: Group related permissions by resource
4. **Future-Proof**: Design permissions to accommodate growth

### Implementation Guidelines

1. **Guard Order**: Always apply `JwtAuthGuard` before `RoleGuard`
2. **Error Handling**: Provide meaningful error messages
3. **Caching**: Consider caching user roles/permissions for performance
4. **Testing**: Thoroughly test all permission combinations

### Performance Optimization

1. **Eager Loading**: Load user roles with permissions in single query
2. **Indexing**: Ensure proper database indexes on foreign keys
3. **Caching**: Implement Redis caching for frequently accessed data
4. **Bulk Operations**: Use bulk operations for multiple assignments

### Monitoring and Maintenance

1. **Regular Audits**: Review role assignments periodically
2. **Inactive Cleanup**: Remove inactive roles and permissions
3. **Access Reviews**: Conduct regular access reviews
4. **Permission Analysis**: Monitor permission usage patterns

## Error Handling

### Common Error Scenarios

```typescript
// User not authenticated
throw new UnauthorizedException('Authentication required');

// User lacks required role
throw new ForbiddenException('Insufficient permissions. Required roles: ADMIN');

// User lacks required permission
throw new ForbiddenException('Insufficient permissions. Required permissions: CREATE_USER');

// Role not found
throw new NotFoundException('Role with ID "role-123" not found');

// Permission not found
throw new NotFoundException('Permission with name "INVALID_PERMISSION" not found');

// Role already assigned
throw new ConflictException('User already has this role');

// Cannot delete role with active users
throw new BadRequestException('Cannot delete role that is assigned to users');
```

## Migration and Seeding

### Initial Setup

The system includes database seeding for essential roles and permissions:

```typescript
// Default roles
await prisma.role.createMany({
  data: [
    { name: 'ADMIN', description: 'System Administrator', isDefault: false },
    { name: 'INVESTOR', description: 'Portfolio Investor', isDefault: false },
    { name: 'USER', description: 'Basic User', isDefault: true }
  ]
});

// Default permissions
await prisma.permission.createMany({
  data: [
    { name: 'CREATE_USER', resource: 'USER', action: 'CREATE' },
    { name: 'VIEW_USER', resource: 'USER', action: 'READ' },
    // ... more permissions
  ]
});
```

### Data Migration

When adding new permissions:

1. Create migration script
2. Add permissions to database
3. Assign to appropriate roles
4. Update role documentation
5. Test permission enforcement

This RBAC system provides enterprise-grade authorization capabilities while maintaining flexibility and ease of use. For additional support or questions, please refer to the API documentation or contact the development team.