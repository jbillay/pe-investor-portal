# RBAC Quick Reference Guide

## Overview

This is a quick reference guide for the Role-Based Access Control (RBAC) system in the PE Investor Portal. For detailed documentation, see:

- [RBAC.md](./RBAC.md) - Complete RBAC system overview
- [ROLES.md](./ROLES.md) - Detailed role management documentation
- [PERMISSIONS.md](./PERMISSIONS.md) - Comprehensive permission management guide

## Quick Start

### 1. Protect an Endpoint

```typescript
import { RequireRoles, RequirePermissions } from '@/auth/decorators';

@RequireRoles('ADMIN')
@Get('admin-only')
adminOnlyEndpoint() { }

@RequirePermissions('CREATE_USER')
@Post('users')
createUser() { }

@RequireAnyRole('ADMIN', 'MANAGER')
@Get('management-data')
getManagementData() { }
```

### 2. Check Permissions Programmatically

```typescript
const hasPermission = await this.permissionService.checkUserPermission(
  userId,
  'CREATE_USER',
  'USER'
);

const userPermissions = await this.permissionService.getUserPermissions(userId);
```

### 3. Assign Roles to Users

```typescript
await this.roleService.assignRole(
  {
    userId: 'user-123',
    roleId: 'role-456',
    reason: 'Promotion'
  },
  {
    assignedBy: currentUser.id,
    userAgent: request.headers['user-agent'],
    ipAddress: request.ip
  }
);
```

## System Roles

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| `ADMIN` | System administrators | All system permissions |
| `INVESTOR` | Portfolio investors | `VIEW_PORTFOLIO`, `MANAGE_INVESTMENTS` |
| `USER` | Basic users | `VIEW_PROFILE`, `UPDATE_PROFILE` |

## Common Permissions

### User Management
- `CREATE_USER` - Create new users
- `VIEW_USER` - View user information
- `UPDATE_USER` - Modify user data
- `DELETE_USER` - Remove users
- `ASSIGN_ROLE` - Assign roles to users

### Portfolio Management
- `VIEW_PORTFOLIO` - View portfolio data
- `CREATE_PORTFOLIO` - Create new portfolios
- `UPDATE_PORTFOLIO` - Modify portfolios
- `MANAGE_INVESTMENTS` - Manage investments
- `EXPORT_DATA` - Export portfolio data

### System Administration
- `SYSTEM_CONFIGURE` - Configure system settings
- `VIEW_AUDIT_LOGS` - Access audit logs
- `MANAGE_BACKUPS` - Handle backups

## API Endpoints

### Roles
```http
GET    /auth/roles                    # List all roles
POST   /auth/roles                    # Create role (Admin)
GET    /auth/roles/:id                # Get role details
PUT    /auth/roles/:id                # Update role (Admin)
DELETE /auth/roles/:id                # Delete role (Admin)

POST   /auth/roles/assign             # Assign role to user (Admin)
POST   /auth/roles/revoke             # Revoke role from user (Admin)
POST   /auth/roles/bulk-assign        # Bulk assign roles (Admin)

GET    /auth/roles/users/:userId      # Get user's roles
GET    /auth/roles/users/:userId/history # Get role history (Admin)
GET    /auth/roles/:roleId/users      # Get users with role (Admin)
```

### Permissions
```http
GET    /auth/permissions              # List all permissions
POST   /auth/permissions              # Create permission (Admin)
GET    /auth/permissions/:id          # Get permission details
PUT    /auth/permissions/:id          # Update permission (Admin)
DELETE /auth/permissions/:id          # Delete permission (Admin)

GET    /auth/permissions/by-resource  # Group permissions by resource
POST   /auth/permissions/assign-to-role     # Assign permission to role (Admin)
POST   /auth/permissions/revoke-from-role   # Revoke permission from role (Admin)
POST   /auth/permissions/bulk-assign        # Bulk assign permissions (Admin)

GET    /auth/permissions/users/:userId      # Get user's permissions
POST   /auth/permissions/users/:userId/check # Check user permission
GET    /auth/permissions/me                 # Get current user permissions
GET    /auth/permissions/roles/:roleId      # Get role's permissions
```

## Decorators

### Role-Based Protection
```typescript
@Public()                           // Bypass authentication
@RequireRoles('ADMIN')              // Require specific role
@RequireAnyRole('ADMIN', 'MANAGER') // Require any of specified roles
```

### Permission-Based Protection
```typescript
@RequirePermissions('CREATE_USER')              // Require specific permission
@RequireAnyPermission('VIEW_USER', 'EDIT_USER') // Require any permission
```

### Combined Protection
```typescript
@RequireRoles('ADMIN')
@RequirePermissions('DELETE_USER', 'VIEW_AUDIT')
@Delete('users/:id')
deleteUser() { }
```

## Guards

The system uses three main guards in order:

1. **JwtAuthGuard** - Validates JWT token and loads user
2. **RoleGuard** - Checks role and permission requirements
3. **PermissionGuard** - Additional permission-specific validation (optional)

```typescript
@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('protected')
export class ProtectedController { }
```

## Database Schema Summary

```sql
-- Core tables
Role                 # Role definitions
Permission           # Permission definitions
User                 # User accounts

-- Relationship tables
UserRole             # User-Role assignments
RolePermission       # Role-Permission assignments
RoleAssignment       # Audit trail for role changes
AuditLog             # System-wide audit logging
```

## Common Patterns

### Service Layer Permission Checking
```typescript
async performAction(userId: string) {
  const hasPermission = await this.permissionService.checkUserPermission(
    userId,
    'REQUIRED_PERMISSION'
  );

  if (!hasPermission.hasPermission) {
    throw new ForbiddenException('Insufficient permissions');
  }

  // Perform action
}
```

### Conditional Data Loading
```typescript
async getData(userId: string) {
  const userPerms = await this.permissionService.getUserPermissions(userId);

  const data = { basic: this.getBasicData() };

  if (userPerms.permissions.includes('VIEW_SENSITIVE')) {
    data.sensitive = this.getSensitiveData();
  }

  return data;
}
```

### Bulk Operations with Error Handling
```typescript
async bulkAssignRoles(dto: BulkAssignDto) {
  const result = await this.roleService.bulkAssignRoles(dto, userId, ua, ip);

  return {
    success: result.successCount,
    failed: result.failures.length,
    failures: result.failures.map(f => ({
      userId: f.userId,
      error: f.error
    }))
  };
}
```

## Error Handling

### Common Errors
```typescript
UnauthorizedException     // User not authenticated
ForbiddenException        // Insufficient permissions
NotFoundException         // Role/permission not found
ConflictException         // Already exists (role assignment, etc.)
BadRequestException       // Invalid request (delete role with users, etc.)
```

### Error Response Format
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions. Required roles: ADMIN",
  "error": "Forbidden"
}
```

## Best Practices

### ✅ Do
- Use specific, granular permissions
- Follow `RESOURCE_ACTION` naming convention
- Apply guards at controller level
- Use meaningful role and permission descriptions
- Implement proper error handling
- Log security-relevant events
- Cache frequently accessed permissions

### ❌ Don't
- Create overly broad permissions like `FULL_ACCESS`
- Bypass the permission system with custom logic
- Assign permissions directly to users (use roles)
- Delete system roles (`ADMIN`, `INVESTOR`, `USER`)
- Ignore rate limiting on sensitive operations
- Forget to handle permission check failures

## Testing

### Test Role Assignment
```typescript
describe('Role Assignment', () => {
  it('should assign role successfully', async () => {
    await service.assignRole(
      { userId: 'user-1', roleId: 'role-1', reason: 'test' },
      { assignedBy: 'admin', userAgent: 'test', ipAddress: '127.0.0.1' }
    );

    const userRoles = await service.getUserRoles('user-1');
    expect(userRoles.roles).toContain('ROLE_NAME');
  });
});
```

### Test Permission Checking
```typescript
describe('Permission Checking', () => {
  it('should allow access with correct permission', async () => {
    const result = await service.checkUserPermission('user-1', 'CREATE_USER');
    expect(result.hasPermission).toBe(true);
  });

  it('should deny access without permission', async () => {
    const result = await service.checkUserPermission('user-1', 'DELETE_ALL');
    expect(result.hasPermission).toBe(false);
  });
});
```

## Troubleshooting

### Debug User Permissions
```bash
# Get user's current roles and permissions
curl -H "Authorization: Bearer $JWT" \
     "http://localhost:3000/auth/permissions/users/$USER_ID"
```

### Check Role Configuration
```bash
# Verify role has expected permissions
curl -H "Authorization: Bearer $JWT" \
     "http://localhost:3000/auth/permissions/roles/$ROLE_ID"
```

### Common Issues
1. **Permission denied**: Check user has required role/permission
2. **Role assignment fails**: Verify role exists and is active
3. **Bulk operation partial failure**: Check individual failure details
4. **Cache issues**: Clear permission cache after role changes

## Migration Guide

### Adding New Permission
1. Create permission via API or database
2. Assign to appropriate roles
3. Update code to use permission
4. Test permission enforcement
5. Update documentation

### Adding New Role
1. Create role with description
2. Assign required permissions
3. Update role assignment logic
4. Test role functionality
5. Update user management interfaces

---

For complete documentation with examples, implementation details, and advanced usage, see the full documentation files linked at the top of this guide.