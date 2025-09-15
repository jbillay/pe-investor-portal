# Permission Management System Documentation

## Table of Contents

1. [Permission Overview](#permission-overview)
2. [Permission Model](#permission-model)
3. [Permission Categories](#permission-categories)
4. [Permission Lifecycle](#permission-lifecycle)
5. [Role-Permission Relationships](#role-permission-relationships)
6. [API Reference](#api-reference)
7. [Implementation Examples](#implementation-examples)
8. [Permission Checking](#permission-checking)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

## Permission Overview

The Permission Management System implements a granular, resource-action based authorization model that provides fine-grained control over user actions within the PE Investor Portal. Permissions define specific actions that can be performed on system resources.

### Key Features

- **Resource-Action Model**: Permissions follow the pattern `RESOURCE_ACTION`
- **Granular Control**: Specific permissions for each action on each resource
- **Role Integration**: Permissions are assigned to roles, not directly to users
- **Inheritance**: Users inherit all permissions from all assigned roles
- **Dynamic Checking**: Real-time permission validation
- **Audit Support**: Complete audit trail for permission changes
- **Flexible Assignment**: Bulk operations and fine-grained control

### Permission Philosophy

The system follows the **Principle of Least Privilege**:
- Users start with minimal permissions
- Additional permissions are granted based on role requirements
- Permissions are specific and actionable
- Broad permissions are broken into granular components

## Permission Model

### Core Structure

```typescript
interface Permission {
  id: string;           // Unique identifier (UUID)
  name: string;         // Permission name (e.g., "CREATE_USER")
  description?: string; // Human-readable description
  resource: string;     // Target resource (e.g., "USER", "PORTFOLIO")
  action: string;       // Action type (CREATE, READ, UPDATE, DELETE)
  isActive: boolean;    // Whether permission is currently active
  createdAt: Date;      // When permission was created
  updatedAt: Date;      // Last modification time
}
```

### Extended Permission Information

```typescript
interface PermissionWithDetails extends Permission {
  roleCount: number;    // Number of roles with this permission
  rolePermissions: {    // Detailed role relationships
    id: string;
    roleId: string;
    isActive: boolean;
    assignedAt: Date;
    role: {
      id: string;
      name: string;
      description: string;
    };
  }[];
}
```

### Naming Convention

Permissions follow the **RESOURCE_ACTION** pattern:

```
USER_CREATE     → Create new users
USER_READ       → View user information
USER_UPDATE     → Modify user data
USER_DELETE     → Remove users

PORTFOLIO_VIEW    → View portfolio data
PORTFOLIO_MANAGE  → Manage portfolio settings
PORTFOLIO_CREATE  → Create new portfolios
PORTFOLIO_DELETE  → Remove portfolios

REPORT_GENERATE   → Generate reports
REPORT_EXPORT     → Export report data
REPORT_SCHEDULE   → Schedule automated reports
```

## Permission Categories

### User Management Permissions

| Permission | Resource | Action | Description |
|------------|----------|---------|-------------|
| `CREATE_USER` | USER | CREATE | Create new user accounts |
| `VIEW_USER` | USER | READ | View user profiles and information |
| `UPDATE_USER` | USER | UPDATE | Modify user data and settings |
| `DELETE_USER` | USER | DELETE | Remove user accounts |
| `ASSIGN_ROLE` | USER | ASSIGN | Assign roles to users |
| `REVOKE_ROLE` | USER | REVOKE | Remove roles from users |
| `VIEW_USER_AUDIT` | USER | AUDIT | Access user audit logs |

### Role Management Permissions

| Permission | Resource | Action | Description |
|------------|----------|---------|-------------|
| `CREATE_ROLE` | ROLE | CREATE | Create new roles |
| `VIEW_ROLE` | ROLE | READ | View role information |
| `UPDATE_ROLE` | ROLE | UPDATE | Modify role settings |
| `DELETE_ROLE` | ROLE | DELETE | Remove roles |
| `ASSIGN_PERMISSION` | ROLE | ASSIGN | Assign permissions to roles |
| `REVOKE_PERMISSION` | ROLE | REVOKE | Remove permissions from roles |

### Portfolio Management Permissions

| Permission | Resource | Action | Description |
|------------|----------|---------|-------------|
| `VIEW_PORTFOLIO` | PORTFOLIO | READ | View portfolio data |
| `CREATE_PORTFOLIO` | PORTFOLIO | CREATE | Create new portfolios |
| `UPDATE_PORTFOLIO` | PORTFOLIO | UPDATE | Modify portfolio settings |
| `DELETE_PORTFOLIO` | PORTFOLIO | DELETE | Remove portfolios |
| `MANAGE_INVESTMENTS` | PORTFOLIO | MANAGE | Manage portfolio investments |
| `VIEW_PERFORMANCE` | PORTFOLIO | ANALYTICS | View performance metrics |
| `EXPORT_DATA` | PORTFOLIO | EXPORT | Export portfolio data |

### System Administration Permissions

| Permission | Resource | Action | Description |
|------------|----------|---------|-------------|
| `SYSTEM_CONFIGURE` | SYSTEM | CONFIG | Configure system settings |
| `VIEW_AUDIT_LOGS` | SYSTEM | AUDIT | Access system audit logs |
| `MANAGE_BACKUPS` | SYSTEM | BACKUP | Handle system backups |
| `VIEW_METRICS` | SYSTEM | MONITOR | View system metrics |
| `MANAGE_INTEGRATIONS` | SYSTEM | INTEGRATE | Manage third-party integrations |

### Document Management Permissions

| Permission | Resource | Action | Description |
|------------|----------|---------|-------------|
| `VIEW_DOCUMENTS` | DOCUMENT | READ | View documents |
| `UPLOAD_DOCUMENTS` | DOCUMENT | CREATE | Upload new documents |
| `DELETE_DOCUMENTS` | DOCUMENT | DELETE | Remove documents |
| `SHARE_DOCUMENTS` | DOCUMENT | SHARE | Share documents with others |
| `SIGN_DOCUMENTS` | DOCUMENT | SIGN | Electronically sign documents |

### Reporting Permissions

| Permission | Resource | Action | Description |
|------------|----------|---------|-------------|
| `VIEW_REPORTS` | REPORT | READ | View generated reports |
| `CREATE_REPORTS` | REPORT | CREATE | Create custom reports |
| `EXPORT_REPORTS` | REPORT | EXPORT | Export report data |
| `SCHEDULE_REPORTS` | REPORT | SCHEDULE | Schedule automated reports |
| `SHARE_REPORTS` | REPORT | SHARE | Share reports with others |

## Permission Lifecycle

### 1. Creation

```typescript
const permission = await permissionService.createPermission(
  {
    name: 'MANAGE_INVESTMENTS',
    description: 'Manage portfolio investments and allocations',
    resource: 'PORTFOLIO',
    action: 'MANAGE',
    isActive: true
  },
  adminUserId
);
```

### 2. Role Assignment

```typescript
await permissionService.assignPermissionToRole(
  {
    roleId: 'portfolio-manager-role',
    permissionId: permission.id,
    reason: 'Portfolio management capabilities'
  },
  adminUserId
);
```

### 3. Bulk Assignment

```typescript
await permissionService.bulkAssignPermissions(
  {
    roleId: 'admin-role',
    permissionIds: [
      'CREATE_USER',
      'UPDATE_USER',
      'DELETE_USER',
      'ASSIGN_ROLE'
    ],
    reason: 'Full user management access'
  },
  adminUserId
);
```

### 4. Revocation

```typescript
await permissionService.revokePermissionFromRole(
  {
    roleId: 'user-role',
    permissionId: 'DELETE_USER',
    reason: 'Removing deletion capability'
  },
  adminUserId
);
```

### 5. Deactivation

```typescript
await permissionService.updatePermission(
  permissionId,
  {
    isActive: false,
    description: 'Deprecated permission'
  },
  adminUserId
);
```

## Role-Permission Relationships

### Assignment Model

```typescript
interface RolePermission {
  id: string;
  roleId: string;       // Which role has the permission
  permissionId: string; // Which permission is assigned
  isActive: boolean;    // Whether assignment is active
  assignedAt: Date;     // When permission was assigned
  assignedBy: string;   // Who assigned the permission
  reason?: string;      // Why the permission was assigned
}
```

### Permission Inheritance

Users inherit permissions from **all** assigned roles:

```typescript
// User has roles: ['ADMIN', 'PORTFOLIO_MANAGER']
// ADMIN role permissions: ['CREATE_USER', 'DELETE_USER']
// PORTFOLIO_MANAGER role permissions: ['VIEW_PORTFOLIO', 'MANAGE_INVESTMENTS']
// User effective permissions: ['CREATE_USER', 'DELETE_USER', 'VIEW_PORTFOLIO', 'MANAGE_INVESTMENTS']

const userPermissions = await permissionService.getUserPermissions(userId);
console.log(userPermissions.permissions);
// Output: ['CREATE_USER', 'DELETE_USER', 'VIEW_PORTFOLIO', 'MANAGE_INVESTMENTS']
```

### Permission Resolution

```typescript
// Check if user has specific permission
const hasPermission = await permissionService.checkUserPermission(
  userId,
  'CREATE_USER',
  'USER' // Optional resource context
);

if (hasPermission.hasPermission) {
  console.log('User can create users');
  console.log('Permission granted by roles:', hasPermission.grantedByRoles);
}
```

## API Reference

### Permission CRUD Operations

#### Create Permission
```http
POST /auth/permissions
Authorization: Bearer <admin-jwt>
Content-Type: application/json

{
  "name": "MANAGE_INVESTMENTS",
  "description": "Manage portfolio investments and allocations",
  "resource": "PORTFOLIO",
  "action": "MANAGE",
  "isActive": true
}
```

Response:
```json
{
  "id": "perm-123",
  "name": "MANAGE_INVESTMENTS",
  "description": "Manage portfolio investments and allocations",
  "resource": "PORTFOLIO",
  "action": "MANAGE",
  "isActive": true,
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T10:00:00Z",
  "roleCount": 0
}
```

#### List All Permissions
```http
GET /auth/permissions?includeInactive=false
Authorization: Bearer <jwt>
```

#### Get Permissions by Resource
```http
GET /auth/permissions/by-resource
Authorization: Bearer <jwt>
```

Response:
```json
{
  "USER": [
    {
      "id": "perm-1",
      "name": "CREATE_USER",
      "description": "Create new user accounts",
      "action": "CREATE"
    }
  ],
  "PORTFOLIO": [
    {
      "id": "perm-2",
      "name": "VIEW_PORTFOLIO",
      "description": "View portfolio data",
      "action": "READ"
    }
  ]
}
```

#### Get Permission by ID
```http
GET /auth/permissions/:permissionId
Authorization: Bearer <jwt>
```

#### Update Permission
```http
PUT /auth/permissions/:permissionId
Authorization: Bearer <admin-jwt>
Content-Type: application/json

{
  "description": "Updated description",
  "isActive": true
}
```

#### Delete Permission
```http
DELETE /auth/permissions/:permissionId
Authorization: Bearer <admin-jwt>
```

### Role-Permission Operations

#### Assign Permission to Role
```http
POST /auth/permissions/assign-to-role
Authorization: Bearer <admin-jwt>
Content-Type: application/json

{
  "roleId": "role-123",
  "permissionId": "perm-456",
  "reason": "Adding portfolio management capability"
}
```

#### Revoke Permission from Role
```http
POST /auth/permissions/revoke-from-role
Authorization: Bearer <admin-jwt>
Content-Type: application/json

{
  "roleId": "role-123",
  "permissionId": "perm-456",
  "reason": "Removing access due to policy change"
}
```

#### Bulk Assign Permissions
```http
POST /auth/permissions/bulk-assign
Authorization: Bearer <admin-jwt>
Content-Type: application/json

{
  "roleId": "role-123",
  "permissionIds": ["perm-1", "perm-2", "perm-3"],
  "reason": "Full access setup for admin role"
}
```

### Permission Queries

#### Get Role Permissions
```http
GET /auth/permissions/roles/:roleId
Authorization: Bearer <jwt>
```

Response:
```json
{
  "id": "role-123",
  "name": "PORTFOLIO_MANAGER",
  "description": "Manages investment portfolios",
  "isActive": true,
  "permissions": [
    {
      "id": "perm-1",
      "name": "VIEW_PORTFOLIO",
      "description": "View portfolio data",
      "resource": "PORTFOLIO",
      "action": "READ"
    },
    {
      "id": "perm-2",
      "name": "MANAGE_INVESTMENTS",
      "description": "Manage portfolio investments",
      "resource": "PORTFOLIO",
      "action": "MANAGE"
    }
  ]
}
```

#### Get User Permissions
```http
GET /auth/permissions/users/:userId
Authorization: Bearer <jwt>
```

Response:
```json
{
  "userId": "user-123",
  "permissions": ["VIEW_PORTFOLIO", "MANAGE_INVESTMENTS"],
  "roles": ["PORTFOLIO_MANAGER"],
  "permissionsByResource": {
    "PORTFOLIO": ["VIEW_PORTFOLIO", "MANAGE_INVESTMENTS"]
  }
}
```

#### Check User Permission
```http
POST /auth/permissions/users/:userId/check
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "permission": "CREATE_USER",
  "resource": "USER"
}
```

Response:
```json
{
  "hasPermission": true,
  "permission": "CREATE_USER",
  "resource": "USER",
  "grantedByRoles": ["ADMIN"]
}
```

#### Get Current User Permissions
```http
GET /auth/permissions/me
Authorization: Bearer <jwt>
```

## Implementation Examples

### Service Implementation

```typescript
@Injectable()
export class PermissionService {
  constructor(
    private prisma: PrismaService,
    private logger: Logger
  ) {}

  async createPermission(
    createPermissionDto: CreatePermissionDto,
    createdBy: string
  ): Promise<PermissionResponseDto> {
    // Check for existing permission
    const existingPermission = await this.prisma.permission.findUnique({
      where: { name: createPermissionDto.name }
    });

    if (existingPermission) {
      throw new ConflictException(`Permission "${createPermissionDto.name}" already exists`);
    }

    // Create permission
    const permission = await this.prisma.permission.create({
      data: {
        name: createPermissionDto.name.toUpperCase(),
        description: createPermissionDto.description,
        resource: createPermissionDto.resource.toUpperCase(),
        action: createPermissionDto.action.toUpperCase(),
        isActive: createPermissionDto.isActive ?? true
      },
      include: {
        _count: { select: { rolePermissions: true } }
      }
    });

    this.logger.log(`Permission created: ${permission.name} by user ${createdBy}`);

    return {
      id: permission.id,
      name: permission.name,
      description: permission.description,
      resource: permission.resource,
      action: permission.action,
      isActive: permission.isActive,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
      roleCount: permission._count.rolePermissions
    };
  }

  async checkUserPermission(
    userId: string,
    permissionName: string,
    resource?: string
  ): Promise<PermissionCheckResult> {
    // Get user's roles and their permissions
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          where: { isActive: true },
          include: {
            role: {
              include: {
                rolePermissions: {
                  where: { isActive: true },
                  include: {
                    permission: {
                      where: {
                        isActive: true,
                        name: permissionName
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    // Find roles that grant this permission
    const grantedByRoles: string[] = [];
    let hasPermission = false;

    for (const userRole of user.userRoles) {
      for (const rolePermission of userRole.role.rolePermissions) {
        if (rolePermission.permission.name === permissionName) {
          // If resource is specified, check if it matches
          if (!resource || rolePermission.permission.resource === resource) {
            hasPermission = true;
            grantedByRoles.push(userRole.role.name);
          }
        }
      }
    }

    return {
      hasPermission,
      permission: permissionName,
      resource,
      grantedByRoles: [...new Set(grantedByRoles)] // Remove duplicates
    };
  }

  async getUserPermissions(userId: string): Promise<UserPermissionsResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          where: { isActive: true },
          include: {
            role: {
              include: {
                rolePermissions: {
                  where: { isActive: true },
                  include: {
                    permission: {
                      where: { isActive: true }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    // Collect all permissions from all roles
    const allPermissions = new Set<string>();
    const permissionsByResource: Record<string, string[]> = {};
    const roles = user.userRoles.map(ur => ur.role.name);

    for (const userRole of user.userRoles) {
      for (const rolePermission of userRole.role.rolePermissions) {
        const permission = rolePermission.permission;
        allPermissions.add(permission.name);

        // Group by resource
        if (!permissionsByResource[permission.resource]) {
          permissionsByResource[permission.resource] = [];
        }
        if (!permissionsByResource[permission.resource].includes(permission.name)) {
          permissionsByResource[permission.resource].push(permission.name);
        }
      }
    }

    return {
      userId,
      permissions: Array.from(allPermissions).sort(),
      roles,
      permissionsByResource
    };
  }
}
```

### Controller Implementation

```typescript
@Controller('auth/permissions')
@UseGuards(JwtAuthGuard, RoleGuard)
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Post()
  @RequireRoles('ADMIN')
  @ApiOperation({ summary: 'Create a new permission' })
  async createPermission(
    @Body() createPermissionDto: CreatePermissionDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.permissionService.createPermission(createPermissionDto, user.id);
  }

  @Get('users/:userId/check')
  @RequireAnyRole('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Check if user has specific permission' })
  async checkUserPermission(
    @Param('userId') userId: string,
    @Body() checkDto: CheckPermissionDto
  ) {
    return this.permissionService.checkUserPermission(
      userId,
      checkDto.permission,
      checkDto.resource
    );
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user permissions' })
  async getCurrentUserPermissions(@CurrentUser() user: AuthenticatedUser) {
    return this.permissionService.getUserPermissions(user.id);
  }

  @Post('assign-to-role')
  @RequireRoles('ADMIN')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Assign permission to role' })
  async assignPermissionToRole(
    @Body() assignDto: AssignPermissionToRoleDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    await this.permissionService.assignPermissionToRole(assignDto, user.id);
    return { message: 'Permission assigned successfully' };
  }
}
```

### Using Permissions in Guards

```typescript
// Using permission decorators
@RequirePermissions('CREATE_USER')
@Post('users')
async createUser(@Body() createUserDto: CreateUserDto) {
  return this.userService.createUser(createUserDto);
}

@RequireAnyPermission('VIEW_PORTFOLIO', 'MANAGE_PORTFOLIO')
@Get('portfolios/:id')
async getPortfolio(@Param('id') id: string) {
  return this.portfolioService.getPortfolio(id);
}

// Manual permission checking
@Get('sensitive-data')
async getSensitiveData(@CurrentUser() user: AuthenticatedUser) {
  const canAccess = await this.permissionService.checkUserPermission(
    user.id,
    'VIEW_SENSITIVE_DATA',
    'SYSTEM'
  );

  if (!canAccess.hasPermission) {
    throw new ForbiddenException('Access denied to sensitive data');
  }

  return this.dataService.getSensitiveData();
}
```

## Permission Checking

### Decorator-Based Checking

```typescript
// Single permission required
@RequirePermissions('CREATE_USER')
@Post('users')
createUser() { /* ... */ }

// Multiple permissions required (ALL must be present)
@RequirePermissions('CREATE_USER', 'ASSIGN_ROLE')
@Post('users-with-role')
createUserWithRole() { /* ... */ }

// Any of multiple permissions (ONE must be present)
@RequireAnyPermission('VIEW_PORTFOLIO', 'MANAGE_PORTFOLIO')
@Get('portfolio-data')
getPortfolioData() { /* ... */ }
```

### Programmatic Checking

```typescript
// Service layer checking
async performSensitiveOperation(userId: string) {
  const hasPermission = await this.permissionService.checkUserPermission(
    userId,
    'PERFORM_SENSITIVE_OP',
    'SYSTEM'
  );

  if (!hasPermission.hasPermission) {
    throw new ForbiddenException('Insufficient permissions');
  }

  // Proceed with operation
  return this.doSensitiveOperation();
}

// Conditional logic based on permissions
async getDataBasedOnPermissions(userId: string) {
  const userPerms = await this.permissionService.getUserPermissions(userId);

  let data = this.getBasicData();

  if (userPerms.permissions.includes('VIEW_SENSITIVE_DATA')) {
    data.sensitiveData = this.getSensitiveData();
  }

  if (userPerms.permissions.includes('VIEW_ANALYTICS')) {
    data.analytics = this.getAnalyticsData();
  }

  return data;
}
```

### Context-Aware Checking

```typescript
// Resource-specific permission checking
async accessPortfolio(userId: string, portfolioId: string) {
  // Check general permission
  const canViewPortfolios = await this.permissionService.checkUserPermission(
    userId,
    'VIEW_PORTFOLIO',
    'PORTFOLIO'
  );

  if (!canViewPortfolios.hasPermission) {
    throw new ForbiddenException('Cannot view portfolios');
  }

  // Additional business logic for specific portfolio access
  const portfolio = await this.portfolioService.getPortfolio(portfolioId);

  // Check if user owns the portfolio or has admin rights
  if (portfolio.ownerId !== userId &&
      !userPerms.permissions.includes('VIEW_ALL_PORTFOLIOS')) {
    throw new ForbiddenException('Cannot access this specific portfolio');
  }

  return portfolio;
}
```

## Best Practices

### Permission Design Principles

#### 1. Granular Permissions
```typescript
// Good: Specific, actionable permissions
'CREATE_USER'
'UPDATE_USER_PROFILE'
'DELETE_USER_ACCOUNT'
'ASSIGN_USER_ROLE'

// Avoid: Broad, unclear permissions
'USER_ADMIN'
'FULL_ACCESS'
'MANAGE_EVERYTHING'
```

#### 2. Resource-Action Pattern
```typescript
// Consistent naming pattern
'RESOURCE_ACTION'

// Examples
'PORTFOLIO_VIEW'     // View portfolios
'PORTFOLIO_CREATE'   // Create new portfolios
'PORTFOLIO_UPDATE'   // Modify existing portfolios
'PORTFOLIO_DELETE'   // Remove portfolios
'PORTFOLIO_EXPORT'   // Export portfolio data
```

#### 3. Logical Grouping
```typescript
// Group related permissions
const USER_PERMISSIONS = [
  'CREATE_USER',
  'VIEW_USER',
  'UPDATE_USER',
  'DELETE_USER'
];

const PORTFOLIO_PERMISSIONS = [
  'VIEW_PORTFOLIO',
  'CREATE_PORTFOLIO',
  'UPDATE_PORTFOLIO',
  'DELETE_PORTFOLIO',
  'MANAGE_INVESTMENTS'
];
```

### Role-Permission Assignment Strategy

#### 1. Role-Based Assignment
```typescript
// Admin role gets all user management permissions
const ADMIN_PERMISSIONS = [
  'CREATE_USER',
  'VIEW_USER',
  'UPDATE_USER',
  'DELETE_USER',
  'ASSIGN_ROLE',
  'REVOKE_ROLE'
];

// Portfolio Manager gets portfolio-specific permissions
const PORTFOLIO_MANAGER_PERMISSIONS = [
  'VIEW_PORTFOLIO',
  'CREATE_PORTFOLIO',
  'UPDATE_PORTFOLIO',
  'MANAGE_INVESTMENTS',
  'GENERATE_REPORTS'
];
```

#### 2. Hierarchical Permission Inheritance
```typescript
// Base user permissions
const BASE_USER_PERMISSIONS = [
  'VIEW_PROFILE',
  'UPDATE_PROFILE',
  'VIEW_PUBLIC_DATA'
];

// Investor inherits base + investor-specific
const INVESTOR_PERMISSIONS = [
  ...BASE_USER_PERMISSIONS,
  'VIEW_PORTFOLIO',
  'VIEW_DOCUMENTS',
  'DOWNLOAD_REPORTS'
];

// Admin inherits investor + admin-specific
const ADMIN_PERMISSIONS = [
  ...INVESTOR_PERMISSIONS,
  'CREATE_USER',
  'MANAGE_SYSTEM',
  'VIEW_AUDIT_LOGS'
];
```

### Performance Optimization

#### 1. Caching User Permissions
```typescript
@Injectable()
export class PermissionService {
  private userPermissionCache = new Map<string, UserPermissions>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async getUserPermissions(userId: string): Promise<UserPermissions> {
    const cached = this.userPermissionCache.get(userId);

    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      return cached.permissions;
    }

    const permissions = await this.loadUserPermissionsFromDB(userId);

    this.userPermissionCache.set(userId, {
      permissions,
      timestamp: Date.now()
    });

    return permissions;
  }

  invalidateUserPermissionCache(userId: string) {
    this.userPermissionCache.delete(userId);
  }
}
```

#### 2. Eager Loading
```typescript
// Load user with all permissions in single query
const userWithPermissions = await this.prisma.user.findUnique({
  where: { id: userId },
  include: {
    userRoles: {
      where: { isActive: true },
      include: {
        role: {
          include: {
            rolePermissions: {
              where: { isActive: true },
              include: {
                permission: {
                  where: { isActive: true }
                }
              }
            }
          }
        }
      }
    }
  }
});
```

#### 3. Permission Preprocessing
```typescript
// Preprocess permissions into efficient lookup structure
class PermissionChecker {
  private permissionSet: Set<string>;
  private resourcePermissions: Map<string, Set<string>>;

  constructor(userPermissions: Permission[]) {
    this.permissionSet = new Set(userPermissions.map(p => p.name));
    this.resourcePermissions = new Map();

    for (const permission of userPermissions) {
      if (!this.resourcePermissions.has(permission.resource)) {
        this.resourcePermissions.set(permission.resource, new Set());
      }
      this.resourcePermissions.get(permission.resource)!.add(permission.name);
    }
  }

  hasPermission(permission: string): boolean {
    return this.permissionSet.has(permission);
  }

  hasResourcePermission(resource: string, permission: string): boolean {
    return this.resourcePermissions.get(resource)?.has(permission) ?? false;
  }
}
```

### Error Handling

```typescript
// Specific error types for different permission issues
export class InsufficientPermissionError extends ForbiddenException {
  constructor(required: string[], actual: string[]) {
    super({
      message: 'Insufficient permissions',
      required,
      actual,
      code: 'INSUFFICIENT_PERMISSIONS'
    });
  }
}

export class PermissionNotFoundError extends NotFoundException {
  constructor(permissionName: string) {
    super({
      message: `Permission '${permissionName}' not found`,
      permission: permissionName,
      code: 'PERMISSION_NOT_FOUND'
    });
  }
}

// Usage in service
async checkUserPermission(userId: string, permission: string) {
  const userPerms = await this.getUserPermissions(userId);

  if (!userPerms.permissions.includes(permission)) {
    throw new InsufficientPermissionError([permission], userPerms.permissions);
  }

  return true;
}
```

## Troubleshooting

### Common Issues

#### 1. Permission Not Working

**Symptoms**: User has role but permission check fails

**Debug Steps**:
```bash
# Check user's roles
curl -H "Authorization: Bearer $JWT" \
     "http://localhost:3000/auth/roles/users/$USER_ID"

# Check role's permissions
curl -H "Authorization: Bearer $JWT" \
     "http://localhost:3000/auth/permissions/roles/$ROLE_ID"

# Check user's effective permissions
curl -H "Authorization: Bearer $JWT" \
     "http://localhost:3000/auth/permissions/users/$USER_ID"
```

**Common Causes**:
- Role doesn't have the required permission
- Permission is inactive (`isActive: false`)
- Role-permission assignment is inactive
- User's role assignment is inactive

#### 2. Permission Assignment Fails

**Error**: `ConflictException: Role already has this permission`

**Solution**: Check existing assignments:
```typescript
const rolePermissions = await this.permissionService.getRolePermissions(roleId);
const hasPermission = rolePermissions.permissions.some(p => p.name === 'TARGET_PERMISSION');
```

#### 3. User Has No Permissions

**Symptoms**: User permissions array is empty

**Debug Steps**:
1. Check if user has any roles assigned
2. Verify roles are active
3. Check if role-permission assignments exist
4. Verify permissions are active

```typescript
// Debug helper function
async debugUserPermissions(userId: string) {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: { permission: true }
              }
            }
          }
        }
      }
    }
  });

  console.log('User roles:', user?.userRoles.map(ur => ({
    role: ur.role.name,
    isActive: ur.isActive,
    permissions: ur.role.rolePermissions.map(rp => ({
      permission: rp.permission.name,
      isActive: rp.isActive && rp.permission.isActive
    }))
  })));
}
```

### Performance Issues

#### 1. Slow Permission Checks

**Symptoms**: High latency on protected endpoints

**Solutions**:
- Implement caching for user permissions
- Use eager loading for user-role-permission queries
- Consider denormalizing frequently accessed permission data
- Add database indexes on foreign key columns

#### 2. Memory Usage

**Symptoms**: High memory consumption with many users

**Solutions**:
- Implement TTL-based cache eviction
- Use WeakMap for permission caches
- Limit cache size with LRU eviction
- Consider Redis for distributed caching

### Monitoring and Debugging

#### 1. Enable Debug Logging
```typescript
// In permission service
this.logger.debug(`Checking permission ${permission} for user ${userId}`);
this.logger.debug(`User ${userId} has permissions: ${userPermissions.join(', ')}`);
this.logger.warn(`Permission denied: user ${userId} lacks ${permission}`);
```

#### 2. Permission Usage Analytics
```typescript
// Track permission usage patterns
async trackPermissionUsage(userId: string, permission: string, granted: boolean) {
  await this.prisma.permissionUsageLog.create({
    data: {
      userId,
      permission,
      granted,
      timestamp: new Date()
    }
  });
}

// Analyze most-used permissions
async getPermissionUsageStats(days = 30) {
  return this.prisma.permissionUsageLog.groupBy({
    by: ['permission'],
    where: {
      timestamp: {
        gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      }
    },
    _count: true,
    orderBy: {
      _count: {
        permission: 'desc'
      }
    }
  });
}
```

This comprehensive permission management system provides fine-grained, scalable authorization capabilities for enterprise applications. The resource-action model ensures clear, maintainable permission structures while supporting complex authorization requirements.

For additional support or questions about permission implementation, please refer to the main RBAC documentation or contact the development team.