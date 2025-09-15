# Role Management System Documentation

## Table of Contents

1. [Role Overview](#role-overview)
2. [Role Types](#role-types)
3. [Role Properties](#role-properties)
4. [Role Lifecycle](#role-lifecycle)
5. [Role Assignment](#role-assignment)
6. [API Reference](#api-reference)
7. [Implementation Examples](#implementation-examples)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

## Role Overview

The Role Management System provides a hierarchical approach to user access control within the PE Investor Portal. Roles define job functions and organizational positions, determining what actions users can perform and what resources they can access.

### Key Features

- **Hierarchical Structure**: Roles can inherit permissions and capabilities
- **Multi-Role Support**: Users can be assigned multiple roles simultaneously
- **Dynamic Assignment**: Roles can be assigned and revoked at runtime
- **Audit Trail**: Complete history of all role changes
- **Expiration Support**: Roles can have expiration dates
- **Bulk Operations**: Efficient mass role assignments

## Role Types

### System Roles

#### ADMIN
- **Purpose**: System administrators with full platform access
- **Scope**: Global system management
- **Default Permissions**: All system permissions
- **Assignment**: Manually assigned by existing admins
- **Restrictions**: Cannot be deleted, always active

**Key Capabilities:**
- User management (create, update, delete users)
- Role and permission management
- System configuration
- Audit log access
- Bulk operations
- Security settings

#### INVESTOR
- **Purpose**: External investors using the portal
- **Scope**: Investment portfolio management
- **Default Permissions**: Portfolio viewing and basic interactions
- **Assignment**: Typically assigned during onboarding
- **Restrictions**: Cannot assign roles to others

**Key Capabilities:**
- View investment portfolios
- Generate reports
- Update personal information
- Access investment documents
- Receive notifications

#### USER
- **Purpose**: Basic authenticated users
- **Scope**: Limited system access
- **Default Permissions**: View own profile, basic navigation
- **Assignment**: Default role for new registrations
- **Restrictions**: Most restrictive role

**Key Capabilities:**
- View own profile
- Update personal settings
- Access public information
- Basic navigation

### Custom Roles

Organizations can create custom roles to match their specific needs:

#### MANAGER
- **Purpose**: Portfolio or department managers
- **Scope**: Manage specific portfolios or user groups
- **Custom Permissions**: Configurable based on requirements

#### ANALYST
- **Purpose**: Financial analysts and researchers
- **Scope**: Analytics and reporting functions
- **Custom Permissions**: Advanced reporting and analysis tools

#### AUDITOR
- **Purpose**: Compliance and audit functions
- **Scope**: Read-only access to audit trails and compliance data
- **Custom Permissions**: Audit log access, compliance reporting

## Role Properties

### Core Properties

```typescript
interface Role {
  id: string;              // Unique identifier (UUID)
  name: string;            // Role name (unique, uppercase)
  description?: string;    // Human-readable description
  isActive: boolean;       // Whether role is currently active
  isDefault: boolean;      // Whether this is the default role for new users
  createdAt: Date;         // When role was created
  updatedAt: Date;         // Last modification time
}
```

### Extended Properties

```typescript
interface RoleWithDetails extends Role {
  userCount: number;       // Number of users with this role
  permissions: string[];   // Array of permission names
  rolePermissions: {       // Detailed permission relationships
    id: string;
    isActive: boolean;
    assignedAt: Date;
    permission: Permission;
  }[];
}
```

### Role Validation Rules

- **Name**: 2-50 characters, alphanumeric with underscores
- **Description**: Optional, max 255 characters
- **Uniqueness**: Role names must be unique across the system
- **System Roles**: ADMIN, INVESTOR, USER cannot be deleted
- **Active Dependencies**: Roles with active users cannot be deleted

## Role Lifecycle

### 1. Creation

```typescript
const newRole = await roleService.createRole(
  {
    name: 'PORTFOLIO_MANAGER',
    description: 'Manages investment portfolios',
    isActive: true,
    isDefault: false
  },
  adminUserId
);
```

**Validation Steps:**
1. Check admin permissions
2. Validate role name uniqueness
3. Create role record
4. Log creation event
5. Return created role

### 2. Permission Assignment

```typescript
await permissionService.assignPermissionToRole(
  {
    roleId: newRole.id,
    permissionId: 'VIEW_PORTFOLIO',
    reason: 'Portfolio management access'
  },
  adminUserId
);
```

### 3. User Assignment

```typescript
await roleService.assignRole(
  {
    userId: 'user-123',
    roleId: newRole.id,
    reason: 'Promoted to portfolio manager'
  },
  {
    assignedBy: adminUserId,
    userAgent: 'Admin Portal',
    ipAddress: '192.168.1.100'
  }
);
```

### 4. Modification

```typescript
await roleService.updateRole(
  roleId,
  {
    description: 'Updated description',
    isActive: true
  },
  adminUserId
);
```

### 5. Deactivation/Deletion

```typescript
// Soft delete (deactivate)
await roleService.deleteRole(roleId, adminUserId);

// Cannot delete if users are assigned
// Will throw BadRequestException if role has active users
```

## Role Assignment

### Single Assignment

```typescript
const assignmentResult = await roleService.assignRole(
  {
    userId: 'user-123',
    roleId: 'role-456',
    reason: 'Department transfer'
  },
  {
    assignedBy: 'admin-789',
    userAgent: request.headers['user-agent'],
    ipAddress: request.ip
  }
);
```

### Bulk Assignment

```typescript
const bulkResult = await roleService.bulkAssignRoles(
  {
    userIds: ['user-1', 'user-2', 'user-3'],
    roleId: 'role-123',
    reason: 'Team restructuring'
  },
  adminUserId,
  userAgent,
  ipAddress
);

console.log(`Successfully assigned: ${bulkResult.successCount}`);
console.log(`Failures: ${bulkResult.failures.length}`);
```

### Role Revocation

```typescript
await roleService.revokeRole(
  {
    userId: 'user-123',
    roleId: 'role-456',
    reason: 'Role no longer needed'
  },
  {
    revokedBy: 'admin-789',
    userAgent: request.headers['user-agent'],
    ipAddress: request.ip
  }
);
```

### Assignment Context

All role assignments include audit context:

```typescript
interface RoleAssignmentContext {
  assignedBy: string;    // Who performed the assignment
  userAgent: string;     // Browser/client information
  ipAddress: string;     // Source IP address
}
```

## API Reference

### Role CRUD Operations

#### Create Role
```http
POST /auth/roles
Authorization: Bearer <admin-jwt>
Content-Type: application/json

{
  "name": "PORTFOLIO_MANAGER",
  "description": "Manages investment portfolios",
  "isActive": true,
  "isDefault": false
}
```

#### List Roles
```http
GET /auth/roles?includeInactive=false
Authorization: Bearer <jwt>
```

#### Get Role Details
```http
GET /auth/roles/:roleId
Authorization: Bearer <jwt>
```

#### Update Role
```http
PUT /auth/roles/:roleId
Authorization: Bearer <admin-jwt>
Content-Type: application/json

{
  "description": "Updated description",
  "isActive": true
}
```

#### Delete Role
```http
DELETE /auth/roles/:roleId
Authorization: Bearer <admin-jwt>
```

### Role Assignment Operations

#### Assign Role to User
```http
POST /auth/roles/assign
Authorization: Bearer <admin-jwt>
Content-Type: application/json

{
  "userId": "user-123",
  "roleId": "role-456",
  "reason": "Promotion approved"
}
```

#### Revoke Role from User
```http
POST /auth/roles/revoke
Authorization: Bearer <admin-jwt>
Content-Type: application/json

{
  "userId": "user-123",
  "roleId": "role-456",
  "reason": "Department transfer"
}
```

#### Bulk Assign Roles
```http
POST /auth/roles/bulk-assign
Authorization: Bearer <admin-jwt>
Content-Type: application/json

{
  "userIds": ["user-1", "user-2", "user-3"],
  "roleId": "role-123",
  "reason": "Team restructuring"
}
```

### User Role Information

#### Get User's Roles
```http
GET /auth/roles/users/:userId
Authorization: Bearer <jwt>
```

Response:
```json
{
  "id": "user-123",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "roles": [
    {
      "id": "role-1",
      "name": "INVESTOR",
      "description": "Portfolio investor",
      "isActive": true,
      "permissions": ["VIEW_PORTFOLIO", "MANAGE_PORTFOLIO"]
    }
  ],
  "permissions": ["VIEW_PORTFOLIO", "MANAGE_PORTFOLIO"]
}
```

#### Get Role Assignment History
```http
GET /auth/roles/users/:userId/history
Authorization: Bearer <admin-jwt>
```

#### Get Users with Specific Role
```http
GET /auth/roles/:roleId/users
Authorization: Bearer <admin-jwt>
```

## Implementation Examples

### Controller Implementation

```typescript
@Controller('auth/roles')
@UseGuards(JwtAuthGuard, RoleGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @RequireRoles('ADMIN')
  @ApiOperation({ summary: 'Create a new role' })
  async createRole(
    @Body() createRoleDto: CreateRoleDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.roleService.createRole(createRoleDto, user.id);
  }

  @Get()
  @RequireAnyRole('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Get all roles' })
  async getAllRoles(@Query('includeInactive') includeInactive?: boolean) {
    return this.roleService.getAllRoles(includeInactive);
  }

  @Post('assign')
  @RequireRoles('ADMIN')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // Rate limit
  @ApiOperation({ summary: 'Assign role to user' })
  async assignRole(
    @Body() assignRoleDto: AssignRoleDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request
  ) {
    const context = {
      assignedBy: user.id,
      userAgent: request.headers['user-agent'] as string,
      ipAddress: request.ip
    };

    await this.roleService.assignRole(assignRoleDto, context);
    return { message: 'Role assigned successfully' };
  }
}
```

### Service Implementation

```typescript
@Injectable()
export class RoleService {
  constructor(
    private prisma: PrismaService,
    private logger: Logger
  ) {}

  async createRole(createRoleDto: CreateRoleDto, createdBy: string): Promise<RoleResponseDto> {
    // Check for existing role
    const existingRole = await this.prisma.role.findUnique({
      where: { name: createRoleDto.name }
    });

    if (existingRole) {
      throw new ConflictException(`Role with name "${createRoleDto.name}" already exists`);
    }

    // Handle default role logic
    if (createRoleDto.isDefault) {
      await this.prisma.role.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }

    // Create role
    const role = await this.prisma.role.create({
      data: {
        name: createRoleDto.name.toUpperCase(),
        description: createRoleDto.description,
        isActive: createRoleDto.isActive ?? true,
        isDefault: createRoleDto.isDefault ?? false
      },
      include: {
        _count: { select: { userRoles: true } },
        rolePermissions: {
          include: { permission: true }
        }
      }
    });

    // Audit logging
    this.logger.log(`Role created: ${role.name} by user ${createdBy}`);

    return this.formatRoleResponse(role);
  }

  async assignRole(
    assignRoleDto: AssignRoleDto,
    context: RoleAssignmentContext
  ): Promise<void> {
    const { userId, roleId, reason } = assignRoleDto;
    const { assignedBy, userAgent, ipAddress } = context;

    // Validate user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    // Validate role exists and is active
    const role = await this.prisma.role.findUnique({
      where: { id: roleId }
    });
    if (!role || !role.isActive) {
      throw new NotFoundException(`Active role with ID "${roleId}" not found`);
    }

    // Check if user already has this role
    const existingUserRole = await this.prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId
        }
      }
    });

    if (existingUserRole && existingUserRole.isActive) {
      throw new ConflictException('User already has this role');
    }

    // Use transaction for consistency
    await this.prisma.$transaction(async (tx) => {
      // Create or reactivate UserRole
      await tx.userRole.upsert({
        where: {
          userId_roleId: {
            userId,
            roleId
          }
        },
        create: {
          userId,
          roleId,
          isActive: true
        },
        update: {
          isActive: true,
          assignedAt: new Date()
        }
      });

      // Create assignment record for audit
      await tx.roleAssignment.create({
        data: {
          userId,
          roleId,
          assignedBy,
          reason,
          isActive: true
        }
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          action: 'ASSIGN_ROLE',
          targetUserId: userId,
          performedBy: assignedBy,
          details: {
            roleId,
            roleName: role.name,
            reason
          },
          ipAddress,
          userAgent
        }
      });
    });

    this.logger.log(`Role ${role.name} assigned to user ${userId} by ${assignedBy}`);
  }
}
```

### Using Roles in Guards

```typescript
@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private roleService: RoleService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass()
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Get role requirements
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass()
    ]);

    if (!requiredRoles?.length) {
      return true;
    }

    // Get user's roles and permissions
    const userWithRoles = await this.roleService.getUserRoles(user.id);

    // Update user object for downstream use
    request.user.roles = userWithRoles.roles.map(role => role.name);
    request.user.permissions = userWithRoles.permissions;

    // Check if user has required roles
    const userRoleNames = userWithRoles.roles.map(role => role.name);
    const hasRequiredRoles = requiredRoles.every(role =>
      userRoleNames.includes(role)
    );

    if (!hasRequiredRoles) {
      throw new ForbiddenException(
        `Insufficient permissions. Required roles: ${requiredRoles.join(', ')}`
      );
    }

    return true;
  }
}
```

## Best Practices

### Role Naming Conventions

- Use **UPPERCASE** with underscores: `PORTFOLIO_MANAGER`
- Be **descriptive**: `SENIOR_ANALYST` vs `ANALYST`
- Avoid **abbreviations**: `ADMINISTRATOR` vs `ADMIN` (except for system roles)
- Use **job functions**: `FUND_MANAGER` vs `MANAGER`

### Role Hierarchy Design

```
ADMIN (System Administrator)
├── FUND_MANAGER (Fund Management)
│   ├── SENIOR_ANALYST (Senior Analysis)
│   └── ANALYST (Basic Analysis)
├── PORTFOLIO_MANAGER (Portfolio Management)
│   └── ASSISTANT_MANAGER (Assistant)
└── INVESTOR (External Users)
    ├── INSTITUTIONAL_INVESTOR
    └── INDIVIDUAL_INVESTOR
```

### Permission Assignment Strategy

1. **Principle of Least Privilege**: Start with minimal permissions
2. **Role-Based Grouping**: Group permissions logically by role function
3. **Inheritance Consideration**: Higher roles should include lower role permissions
4. **Regular Reviews**: Periodically audit role permissions

### Error Handling Patterns

```typescript
// Service layer error handling
try {
  await this.roleService.assignRole(assignRoleDto, context);
} catch (error) {
  if (error instanceof ConflictException) {
    // Handle role already assigned
    return { success: false, message: 'User already has this role' };
  } else if (error instanceof NotFoundException) {
    // Handle user/role not found
    return { success: false, message: error.message };
  }
  throw error; // Re-throw unexpected errors
}

// Controller layer with proper HTTP responses
@Post('assign')
async assignRole(@Body() dto: AssignRoleDto) {
  try {
    await this.roleService.assignRole(dto, context);
    return { success: true, message: 'Role assigned successfully' };
  } catch (error) {
    if (error instanceof ConflictException) {
      throw new BadRequestException(error.message);
    }
    throw error;
  }
}
```

### Performance Optimization

```typescript
// Eager load related data
const userRoles = await this.prisma.user.findUnique({
  where: { id: userId },
  include: {
    userRoles: {
      where: { isActive: true },
      include: {
        role: {
          include: {
            rolePermissions: {
              where: { isActive: true },
              include: { permission: true }
            }
          }
        }
      }
    }
  }
});

// Cache frequently accessed role data
@Cacheable('user-roles', 300) // Cache for 5 minutes
async getUserRoles(userId: string): Promise<UserRolesDto> {
  // Implementation
}
```

## Troubleshooting

### Common Issues

#### 1. Role Assignment Fails

**Error**: `ConflictException: User already has this role`

**Solution**: Check if user already has the role:
```typescript
const userRoles = await this.roleService.getUserRoles(userId);
const hasRole = userRoles.roles.some(role => role.name === 'TARGET_ROLE');
```

#### 2. Permission Denied

**Error**: `ForbiddenException: Insufficient permissions`

**Debug Steps**:
1. Check user's current roles: `GET /auth/roles/users/:userId`
2. Verify role has required permissions
3. Check if role is active
4. Verify guard configuration

#### 3. Cannot Delete Role

**Error**: `BadRequestException: Cannot delete role that is assigned to users`

**Solution**:
1. List users with role: `GET /auth/roles/:roleId/users`
2. Reassign users to different roles
3. Then delete the role

#### 4. Role Not Found

**Error**: `NotFoundException: Role with ID "..." not found`

**Debug Steps**:
1. Verify role ID is correct
2. Check if role was deleted
3. Ensure role is active (`isActive: true`)

### Debugging Tools

#### Check User's Current Roles
```bash
curl -H "Authorization: Bearer $JWT_TOKEN" \
     "http://localhost:3000/auth/roles/users/$USER_ID"
```

#### Verify Role Permissions
```bash
curl -H "Authorization: Bearer $JWT_TOKEN" \
     "http://localhost:3000/auth/roles/$ROLE_ID"
```

#### Check Role Assignment History
```bash
curl -H "Authorization: Bearer $ADMIN_JWT" \
     "http://localhost:3000/auth/roles/users/$USER_ID/history"
```

### Logging and Monitoring

Enable detailed logging for role operations:

```typescript
// In role service
this.logger.debug(`Checking role assignment for user ${userId}, role ${roleId}`);
this.logger.log(`Role ${roleName} successfully assigned to user ${userId}`);
this.logger.warn(`Failed role assignment attempt: ${error.message}`);
this.logger.error(`Role service error: ${error.message}`, error.stack);
```

Monitor key metrics:
- Role assignment frequency
- Failed authorization attempts
- Role creation/deletion patterns
- Permission usage statistics

This comprehensive role management system provides flexible, secure, and auditable access control for enterprise applications. For additional support, consult the API documentation or contact the development team.