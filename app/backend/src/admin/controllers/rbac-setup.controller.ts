import {
  Controller,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { RoleService } from '../services/role.service';
import { PermissionService } from '../services/permission.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../guards/role.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AdminOnly } from '../decorators/role.decorator';
import { AuthenticatedUser } from '../../auth/interfaces/auth.interface';
import { CreateRoleDto } from '../dto/role.dto';
import { CreatePermissionDto } from '../dto/permission.dto';

interface RBACSetupResult {
  permissionsCreated: number;
  rolesCreated: number;
  rolePermissionsAssigned: number;
  message: string;
}

@ApiTags('RBAC Setup')
@Controller('admin/rbac-setup')
@UseGuards(JwtAuthGuard, RoleGuard)
@ApiBearerAuth('JWT-auth')
export class RBACSetupController {
  constructor(
    private roleService: RoleService,
    private permissionService: PermissionService,
  ) {}

  @ApiOperation({
    summary: 'Initialize RBAC system',
    description:
      'Create all default roles and permissions for the investor portal. This should be run once during system setup.',
  })
  @ApiResponse({
    status: 200,
    description: 'RBAC system initialized successfully',
    schema: {
      type: 'object',
      properties: {
        permissionsCreated: { type: 'number' },
        rolesCreated: { type: 'number' },
        rolePermissionsAssigned: { type: 'number' },
        message: { type: 'string' },
      },
    },
  })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @AdminOnly()
  @Post('initialize')
  @HttpCode(HttpStatus.OK)
  async initializeRBAC(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<RBACSetupResult> {
    const result: RBACSetupResult = {
      permissionsCreated: 0,
      rolesCreated: 0,
      rolePermissionsAssigned: 0,
      message: '',
    };

    // 1. Create all permissions
    const permissions = await this.createPermissions(user.id);
    result.permissionsCreated = permissions.length;

    // 2. Create all roles
    const roles = await this.createRoles(user.id);
    result.rolesCreated = roles.length;

    // 3. Assign permissions to roles
    const assignmentCount = await this.assignPermissionsToRoles(user.id);
    result.rolePermissionsAssigned = assignmentCount;

    result.message = `RBAC system initialized successfully with ${result.permissionsCreated} permissions, ${result.rolesCreated} roles, and ${result.rolePermissionsAssigned} role-permission assignments.`;

    return result;
  }

  private async createPermissions(userId: string) {
    const permissionDefinitions: CreatePermissionDto[] = [
      // User Management
      {
        name: 'USER:CREATE',
        description: 'Create new users',
        resource: 'USER',
        action: 'CREATE',
      },
      {
        name: 'USER:READ',
        description: 'View user information',
        resource: 'USER',
        action: 'READ',
      },
      {
        name: 'USER:UPDATE',
        description: 'Update user details',
        resource: 'USER',
        action: 'UPDATE',
      },
      {
        name: 'USER:DELETE',
        description: 'Delete/deactivate users',
        resource: 'USER',
        action: 'DELETE',
      },
      {
        name: 'USER:MANAGE_ROLES',
        description: 'Assign/revoke roles',
        resource: 'USER',
        action: 'MANAGE_ROLES',
      },

      // Role Management
      {
        name: 'ROLE:CREATE',
        description: 'Create new roles',
        resource: 'ROLE',
        action: 'CREATE',
      },
      {
        name: 'ROLE:READ',
        description: 'View roles',
        resource: 'ROLE',
        action: 'READ',
      },
      {
        name: 'ROLE:UPDATE',
        description: 'Update role details',
        resource: 'ROLE',
        action: 'UPDATE',
      },
      {
        name: 'ROLE:DELETE',
        description: 'Delete roles',
        resource: 'ROLE',
        action: 'DELETE',
      },
      {
        name: 'ROLE:ASSIGN',
        description: 'Assign roles to users',
        resource: 'ROLE',
        action: 'ASSIGN',
      },

      // Permission Management
      {
        name: 'PERMISSION:CREATE',
        description: 'Create new permissions',
        resource: 'PERMISSION',
        action: 'CREATE',
      },
      {
        name: 'PERMISSION:READ',
        description: 'View permissions',
        resource: 'PERMISSION',
        action: 'READ',
      },
      {
        name: 'PERMISSION:UPDATE',
        description: 'Update permissions',
        resource: 'PERMISSION',
        action: 'UPDATE',
      },
      {
        name: 'PERMISSION:DELETE',
        description: 'Delete permissions',
        resource: 'PERMISSION',
        action: 'DELETE',
      },
      {
        name: 'PERMISSION:ASSIGN',
        description: 'Assign permissions to roles',
        resource: 'PERMISSION',
        action: 'ASSIGN',
      },

      // Fund Management
      {
        name: 'FUND:CREATE',
        description: 'Create new funds',
        resource: 'FUND',
        action: 'CREATE',
      },
      {
        name: 'FUND:READ',
        description: 'View fund information',
        resource: 'FUND',
        action: 'READ',
      },
      {
        name: 'FUND:UPDATE',
        description: 'Update fund details',
        resource: 'FUND',
        action: 'UPDATE',
      },
      {
        name: 'FUND:DELETE',
        description: 'Delete funds',
        resource: 'FUND',
        action: 'DELETE',
      },
      {
        name: 'FUND:MANAGE_PERFORMANCE',
        description: 'Update performance metrics',
        resource: 'FUND',
        action: 'MANAGE_PERFORMANCE',
      },

      // Investment Management
      {
        name: 'INVESTMENT:CREATE',
        description: 'Create investments',
        resource: 'INVESTMENT',
        action: 'CREATE',
      },
      {
        name: 'INVESTMENT:READ',
        description: 'View all investments',
        resource: 'INVESTMENT',
        action: 'READ',
      },
      {
        name: 'INVESTMENT:UPDATE',
        description: 'Update investment details',
        resource: 'INVESTMENT',
        action: 'UPDATE',
      },
      {
        name: 'INVESTMENT:DELETE',
        description: 'Delete investments',
        resource: 'INVESTMENT',
        action: 'DELETE',
      },
      {
        name: 'INVESTMENT:READ_OWN',
        description: 'View own investments only',
        resource: 'INVESTMENT',
        action: 'READ_OWN',
      },

      // Capital Activity
      {
        name: 'CAPITAL_CALL:CREATE',
        description: 'Create capital calls',
        resource: 'CAPITAL_CALL',
        action: 'CREATE',
      },
      {
        name: 'CAPITAL_CALL:READ',
        description: 'View capital calls',
        resource: 'CAPITAL_CALL',
        action: 'READ',
      },
      {
        name: 'CAPITAL_CALL:UPDATE',
        description: 'Update capital calls',
        resource: 'CAPITAL_CALL',
        action: 'UPDATE',
      },
      {
        name: 'CAPITAL_CALL:DELETE',
        description: 'Delete capital calls',
        resource: 'CAPITAL_CALL',
        action: 'DELETE',
      },
      {
        name: 'CAPITAL_CALL:PROCESS',
        description: 'Process capital call payments',
        resource: 'CAPITAL_CALL',
        action: 'PROCESS',
      },

      {
        name: 'DISTRIBUTION:CREATE',
        description: 'Create distributions',
        resource: 'DISTRIBUTION',
        action: 'CREATE',
      },
      {
        name: 'DISTRIBUTION:READ',
        description: 'View distributions',
        resource: 'DISTRIBUTION',
        action: 'READ',
      },
      {
        name: 'DISTRIBUTION:UPDATE',
        description: 'Update distributions',
        resource: 'DISTRIBUTION',
        action: 'UPDATE',
      },
      {
        name: 'DISTRIBUTION:DELETE',
        description: 'Delete distributions',
        resource: 'DISTRIBUTION',
        action: 'DELETE',
      },
      {
        name: 'DISTRIBUTION:PROCESS',
        description: 'Process distribution payments',
        resource: 'DISTRIBUTION',
        action: 'PROCESS',
      },

      // Document Management
      {
        name: 'DOCUMENT:CREATE',
        description: 'Upload documents',
        resource: 'DOCUMENT',
        action: 'CREATE',
      },
      {
        name: 'DOCUMENT:READ',
        description: 'View documents',
        resource: 'DOCUMENT',
        action: 'READ',
      },
      {
        name: 'DOCUMENT:UPDATE',
        description: 'Update document metadata',
        resource: 'DOCUMENT',
        action: 'UPDATE',
      },
      {
        name: 'DOCUMENT:DELETE',
        description: 'Delete documents',
        resource: 'DOCUMENT',
        action: 'DELETE',
      },
      {
        name: 'DOCUMENT:READ_CONFIDENTIAL',
        description: 'Access confidential documents',
        resource: 'DOCUMENT',
        action: 'READ_CONFIDENTIAL',
      },

      // Reporting
      {
        name: 'REPORT:GENERATE',
        description: 'Generate reports',
        resource: 'REPORT',
        action: 'GENERATE',
      },
      {
        name: 'REPORT:VIEW_PERFORMANCE',
        description: 'View performance reports',
        resource: 'REPORT',
        action: 'VIEW_PERFORMANCE',
      },
      {
        name: 'REPORT:VIEW_COMPLIANCE',
        description: 'View compliance reports',
        resource: 'REPORT',
        action: 'VIEW_COMPLIANCE',
      },
      {
        name: 'REPORT:EXPORT',
        description: 'Export data and reports',
        resource: 'REPORT',
        action: 'EXPORT',
      },

      // Communication
      {
        name: 'COMMUNICATION:CREATE',
        description: 'Create announcements and messages',
        resource: 'COMMUNICATION',
        action: 'CREATE',
      },
      {
        name: 'COMMUNICATION:READ',
        description: 'View communications',
        resource: 'COMMUNICATION',
        action: 'READ',
      },
      {
        name: 'COMMUNICATION:UPDATE',
        description: 'Update communications',
        resource: 'COMMUNICATION',
        action: 'UPDATE',
      },
      {
        name: 'COMMUNICATION:DELETE',
        description: 'Delete communications',
        resource: 'COMMUNICATION',
        action: 'DELETE',
      },

      // Portfolio Management
      {
        name: 'PORTFOLIO:READ',
        description: 'View portfolio information',
        resource: 'PORTFOLIO',
        action: 'READ',
      },
      {
        name: 'PORTFOLIO:READ_OWN',
        description: 'View own portfolio only',
        resource: 'PORTFOLIO',
        action: 'READ_OWN',
      },
      {
        name: 'PORTFOLIO:ANALYZE',
        description: 'Perform portfolio analysis',
        resource: 'PORTFOLIO',
        action: 'ANALYZE',
      },

      // System Administration
      {
        name: 'SYSTEM:CONFIGURE',
        description: 'Configure system settings',
        resource: 'SYSTEM',
        action: 'CONFIGURE',
      },
      {
        name: 'SYSTEM:MONITOR',
        description: 'Monitor system health',
        resource: 'SYSTEM',
        action: 'MONITOR',
      },
      {
        name: 'SYSTEM:BACKUP',
        description: 'Perform system backups',
        resource: 'SYSTEM',
        action: 'BACKUP',
      },

      // Audit
      {
        name: 'AUDIT:READ',
        description: 'View audit logs',
        resource: 'AUDIT',
        action: 'READ',
      },
      {
        name: 'AUDIT:EXPORT',
        description: 'Export audit data',
        resource: 'AUDIT',
        action: 'EXPORT',
      },
    ];

    const createdPermissions = [];

    for (const permDef of permissionDefinitions) {
      try {
        // Check if permission already exists
        try {
          await this.permissionService.getPermissionByName(permDef.name);
          console.log(`Permission ${permDef.name} already exists, skipping...`);
          continue;
        } catch (error) {
          // Permission doesn't exist, create it
          console.error('Fail to get permission by name :', error);
        }

        const permission = await this.permissionService.createPermission(
          {
            name: permDef.name,
            description: permDef.description,
            resource: permDef.resource,
            action: permDef.action,
          },
          userId,
        );

        createdPermissions.push(permission);
        console.log(`Created permission: ${permission.name}`);
      } catch (error: any) {
        console.error(
          `Failed to create permission ${permDef.name}:`,
          error.message,
        );
      }
    }

    return createdPermissions;
  }

  private async createRoles(userId: string) {
    const roleDefinitions: CreateRoleDto[] = [
      {
        name: 'SUPER_ADMIN',
        description: 'System administrator with full access to all features',
        isActive: true,
        isDefault: false,
      },
      {
        name: 'FUND_MANAGER',
        description:
          'Fund management team with operational access to funds and investments',
        isActive: true,
        isDefault: false,
      },
      {
        name: 'INVESTOR',
        description:
          'Limited partner with read access to their own investments',
        isActive: true,
        isDefault: true, // Default role for new users
      },
      {
        name: 'COMPLIANCE_OFFICER',
        description:
          'Compliance and regulatory oversight with access to reports and audit trails',
        isActive: true,
        isDefault: false,
      },
      {
        name: 'ANALYST',
        description:
          'Read-only access for analysis and reporting across all funds',
        isActive: true,
        isDefault: false,
      },
      {
        name: 'VIEWER',
        description: 'Minimum access for viewing basic information',
        isActive: true,
        isDefault: false,
      },
    ];

    const createdRoles = [];

    for (const roleDef of roleDefinitions) {
      try {
        // Check if role already exists
        try {
          await this.roleService.getRoleByName(roleDef.name);
          console.log(`Role ${roleDef.name} already exists, skipping...`);
          continue;
        } catch (error: any) {
          // Role doesn't exist, create it
          console.error(
            `Failed to create role ${roleDef.name}:`,
            error.message,
          );
        }

        const role = await this.roleService.createRole(roleDef, userId);
        createdRoles.push(role);
        console.log(`Created role: ${role.name}`);
      } catch (error: any) {
        console.error(`Failed to create role ${roleDef.name}:`, error.message);
      }
    }

    return createdRoles;
  }

  private async assignPermissionsToRoles(userId: string): Promise<number> {
    const rolePermissionMappings = {
      SUPER_ADMIN: [
        // Full access to everything
        'USER:CREATE',
        'USER:READ',
        'USER:UPDATE',
        'USER:DELETE',
        'USER:MANAGE_ROLES',
        'ROLE:CREATE',
        'ROLE:READ',
        'ROLE:UPDATE',
        'ROLE:DELETE',
        'ROLE:ASSIGN',
        'PERMISSION:CREATE',
        'PERMISSION:READ',
        'PERMISSION:UPDATE',
        'PERMISSION:DELETE',
        'PERMISSION:ASSIGN',
        'FUND:CREATE',
        'FUND:READ',
        'FUND:UPDATE',
        'FUND:DELETE',
        'FUND:MANAGE_PERFORMANCE',
        'INVESTMENT:CREATE',
        'INVESTMENT:READ',
        'INVESTMENT:UPDATE',
        'INVESTMENT:DELETE',
        'CAPITAL_CALL:CREATE',
        'CAPITAL_CALL:READ',
        'CAPITAL_CALL:UPDATE',
        'CAPITAL_CALL:DELETE',
        'CAPITAL_CALL:PROCESS',
        'DISTRIBUTION:CREATE',
        'DISTRIBUTION:READ',
        'DISTRIBUTION:UPDATE',
        'DISTRIBUTION:DELETE',
        'DISTRIBUTION:PROCESS',
        'DOCUMENT:CREATE',
        'DOCUMENT:READ',
        'DOCUMENT:UPDATE',
        'DOCUMENT:DELETE',
        'DOCUMENT:READ_CONFIDENTIAL',
        'REPORT:GENERATE',
        'REPORT:VIEW_PERFORMANCE',
        'REPORT:VIEW_COMPLIANCE',
        'REPORT:EXPORT',
        'COMMUNICATION:CREATE',
        'COMMUNICATION:READ',
        'COMMUNICATION:UPDATE',
        'COMMUNICATION:DELETE',
        'PORTFOLIO:READ',
        'PORTFOLIO:ANALYZE',
        'SYSTEM:CONFIGURE',
        'SYSTEM:MONITOR',
        'SYSTEM:BACKUP',
        'AUDIT:READ',
        'AUDIT:EXPORT',
      ],
      FUND_MANAGER: [
        // Operational fund management
        'USER:READ',
        'USER:UPDATE', // Can view and update user info
        'ROLE:READ', // Can view roles
        'FUND:CREATE',
        'FUND:READ',
        'FUND:UPDATE',
        'FUND:MANAGE_PERFORMANCE',
        'INVESTMENT:CREATE',
        'INVESTMENT:READ',
        'INVESTMENT:UPDATE',
        'CAPITAL_CALL:CREATE',
        'CAPITAL_CALL:READ',
        'CAPITAL_CALL:UPDATE',
        'CAPITAL_CALL:PROCESS',
        'DISTRIBUTION:CREATE',
        'DISTRIBUTION:READ',
        'DISTRIBUTION:UPDATE',
        'DISTRIBUTION:PROCESS',
        'DOCUMENT:CREATE',
        'DOCUMENT:READ',
        'DOCUMENT:UPDATE',
        'DOCUMENT:READ_CONFIDENTIAL',
        'REPORT:GENERATE',
        'REPORT:VIEW_PERFORMANCE',
        'REPORT:EXPORT',
        'COMMUNICATION:CREATE',
        'COMMUNICATION:READ',
        'COMMUNICATION:UPDATE',
        'PORTFOLIO:READ',
        'PORTFOLIO:ANALYZE',
      ],
      INVESTOR: [
        // Limited to own investments and documents
        'INVESTMENT:READ_OWN', // Only own investments
        'CAPITAL_CALL:READ', // Own capital calls
        'DISTRIBUTION:READ', // Own distributions
        'DOCUMENT:READ', // Non-confidential documents
        'REPORT:VIEW_PERFORMANCE', // Performance reports
        'COMMUNICATION:READ', // Communications
        'PORTFOLIO:READ_OWN', // Own portfolio only
      ],
      COMPLIANCE_OFFICER: [
        // Compliance and oversight
        'USER:READ',
        'ROLE:READ',
        'FUND:READ',
        'INVESTMENT:READ',
        'CAPITAL_CALL:READ',
        'DISTRIBUTION:READ',
        'DOCUMENT:READ',
        'DOCUMENT:READ_CONFIDENTIAL',
        'REPORT:GENERATE',
        'REPORT:VIEW_PERFORMANCE',
        'REPORT:VIEW_COMPLIANCE',
        'REPORT:EXPORT',
        'COMMUNICATION:READ',
        'PORTFOLIO:READ',
        'AUDIT:READ',
        'AUDIT:EXPORT',
      ],
      ANALYST: [
        // Read-only for analysis
        'FUND:READ',
        'INVESTMENT:READ',
        'CAPITAL_CALL:READ',
        'DISTRIBUTION:READ',
        'DOCUMENT:READ',
        'REPORT:VIEW_PERFORMANCE',
        'REPORT:VIEW_COMPLIANCE',
        'REPORT:EXPORT',
        'COMMUNICATION:READ',
        'PORTFOLIO:READ',
        'PORTFOLIO:ANALYZE',
      ],
      VIEWER: [
        // Minimum access
        'FUND:READ',
        'COMMUNICATION:READ',
        'DOCUMENT:READ',
      ],
    };

    let assignmentCount = 0;

    for (const [roleName, permissions] of Object.entries(
      rolePermissionMappings,
    )) {
      try {
        const role = await this.roleService.getRoleByName(roleName);

        for (const permissionName of permissions) {
          try {
            const permission =
              await this.permissionService.getPermissionByName(permissionName);

            await this.permissionService.assignPermissionToRole(
              {
                roleId: role.id,
                permissionId: permission.id,
              },
              userId,
            );

            assignmentCount++;
            console.log(
              `Assigned permission ${permissionName} to role ${roleName}`,
            );
          } catch (error: any) {
            // Permission might already be assigned or not exist
            console.warn(
              `Failed to assign permission ${permissionName} to role ${roleName}:`,
              error.message,
            );
          }
        }
      } catch (error: any) {
        console.error(
          `Failed to assign permissions to role ${roleName}:`,
          error.message,
        );
      }
    }

    return assignmentCount;
  }
}