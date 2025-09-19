import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreatePermissionDto,
  UpdatePermissionDto,
  AssignPermissionToRoleDto,
  RevokePermissionFromRoleDto,
  BulkAssignPermissionsDto,
  PermissionResponseDto,
  RoleWithPermissionsResponseDto,
  CheckPermissionDto,
  PermissionCheckResponseDto,
  UserPermissionsResponseDto,
} from '../dto/permission.dto';
import { PermissionContext } from '../../auth/interfaces/auth.interface';

@Injectable()
export class PermissionService {
  private readonly logger = new Logger(PermissionService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a new permission
   */
  async createPermission(
    createPermissionDto: CreatePermissionDto,
    createdBy: string,
  ): Promise<PermissionResponseDto> {
    const { name, description, resource, action, isActive = true } = createPermissionDto;

    // Check if permission already exists
    const existingPermission = await this.prisma.permission.findUnique({
      where: { name },
    });

    if (existingPermission) {
      throw new ConflictException(`Permission with name "${name}" already exists`);
    }

    const permission = await this.prisma.permission.create({
      data: {
        name,
        description,
        resource,
        action,
        isActive,
      },
      include: {
        _count: {
          select: { rolePermissions: true },
        },
      },
    });

    this.logger.log(`Permission "${name}" created by user ${createdBy}`);

    return {
      id: permission.id,
      name: permission.name,
      description: permission.description,
      resource: permission.resource,
      action: permission.action,
      isActive: permission.isActive,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
      roleCount: permission._count.rolePermissions,
    };
  }

  /**
   * Get all permissions
   */
  async getAllPermissions(includeInactive = false): Promise<PermissionResponseDto[]> {
    const permissions = await this.prisma.permission.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        _count: {
          select: { rolePermissions: true },
        },
      },
      orderBy: [{ resource: 'asc' }, { name: 'asc' }],
    });

    return permissions.map(permission => ({
      id: permission.id,
      name: permission.name,
      description: permission.description,
      resource: permission.resource,
      action: permission.action,
      isActive: permission.isActive,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
      roleCount: permission._count.rolePermissions,
    }));
  }

  /**
   * Get permissions grouped by resource
   */
  async getPermissionsByResource(): Promise<Record<string, PermissionResponseDto[]>> {
    const permissions = await this.getAllPermissions();
    const grouped: Record<string, PermissionResponseDto[]> = {};

    permissions.forEach(permission => {
      const resource = permission.resource || 'GENERAL';
      if (!grouped[resource]) {
        grouped[resource] = [];
      }
      grouped[resource].push(permission);
    });

    return grouped;
  }

  /**
   * Get permission by ID
   */
  async getPermissionById(permissionId: string): Promise<PermissionResponseDto> {
    const permission = await this.prisma.permission.findUnique({
      where: { id: permissionId },
      include: {
        _count: {
          select: { rolePermissions: true },
        },
      },
    });

    if (!permission) {
      throw new NotFoundException(`Permission with ID "${permissionId}" not found`);
    }

    return {
      id: permission.id,
      name: permission.name,
      description: permission.description,
      resource: permission.resource,
      action: permission.action,
      isActive: permission.isActive,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
      roleCount: permission._count.rolePermissions,
    };
  }

  /**
   * Get permission by name
   */
  async getPermissionByName(name: string): Promise<PermissionResponseDto> {
    const permission = await this.prisma.permission.findUnique({
      where: { name },
      include: {
        _count: {
          select: { rolePermissions: true },
        },
      },
    });

    if (!permission) {
      throw new NotFoundException(`Permission with name "${name}" not found`);
    }

    return {
      id: permission.id,
      name: permission.name,
      description: permission.description,
      resource: permission.resource,
      action: permission.action,
      isActive: permission.isActive,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
      roleCount: permission._count.rolePermissions,
    };
  }

  /**
   * Update permission
   */
  async updatePermission(
    permissionId: string,
    updatePermissionDto: UpdatePermissionDto,
    updatedBy: string,
  ): Promise<PermissionResponseDto> {
    const { name, description, resource, action, isActive } = updatePermissionDto;

    const existingPermission = await this.prisma.permission.findUnique({
      where: { id: permissionId },
    });

    if (!existingPermission) {
      throw new NotFoundException(`Permission with ID "${permissionId}" not found`);
    }

    // Check if name conflict (if name is being updated)
    if (name && name !== existingPermission.name) {
      const nameConflict = await this.prisma.permission.findUnique({
        where: { name },
      });

      if (nameConflict) {
        throw new ConflictException(`Permission with name "${name}" already exists`);
      }
    }

    const updatedPermission = await this.prisma.permission.update({
      where: { id: permissionId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(resource !== undefined && { resource }),
        ...(action !== undefined && { action }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        _count: {
          select: { rolePermissions: true },
        },
      },
    });

    this.logger.log(`Permission "${updatedPermission.name}" updated by user ${updatedBy}`);

    return {
      id: updatedPermission.id,
      name: updatedPermission.name,
      description: updatedPermission.description,
      resource: updatedPermission.resource,
      action: updatedPermission.action,
      isActive: updatedPermission.isActive,
      createdAt: updatedPermission.createdAt,
      updatedAt: updatedPermission.updatedAt,
      roleCount: updatedPermission._count.rolePermissions,
    };
  }

  /**
   * Delete permission (soft delete by setting isActive to false)
   */
  async deletePermission(permissionId: string, deletedBy: string): Promise<void> {
    const permission = await this.prisma.permission.findUnique({
      where: { id: permissionId },
      include: {
        _count: {
          select: { rolePermissions: true },
        },
      },
    });

    if (!permission) {
      throw new NotFoundException(`Permission with ID "${permissionId}" not found`);
    }

    if (permission._count.rolePermissions > 0) {
      throw new BadRequestException(
        'Cannot delete permission that is assigned to roles. Remove all assignments first.',
      );
    }

    await this.prisma.permission.update({
      where: { id: permissionId },
      data: { isActive: false },
    });

    this.logger.log(`Permission "${permission.name}" deleted by user ${deletedBy}`);
  }

  /**
   * Assign permission to role
   */
  async assignPermissionToRole(
    assignDto: AssignPermissionToRoleDto,
    assignedBy: string,
  ): Promise<void> {
    const { roleId, permissionId } = assignDto;

    // Verify role exists and is active
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role || !role.isActive) {
      throw new NotFoundException(`Active role with ID "${roleId}" not found`);
    }

    // Verify permission exists and is active
    const permission = await this.prisma.permission.findUnique({
      where: { id: permissionId },
    });

    if (!permission || !permission.isActive) {
      throw new NotFoundException(`Active permission with ID "${permissionId}" not found`);
    }

    // Check if assignment already exists
    const existingAssignment = await this.prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });

    if (existingAssignment && existingAssignment.isActive) {
      throw new ConflictException('Role already has this permission');
    }

    // Create or reactivate assignment
    if (existingAssignment) {
      await this.prisma.rolePermission.update({
        where: { id: existingAssignment.id },
        data: { isActive: true },
      });
    } else {
      await this.prisma.rolePermission.create({
        data: {
          roleId,
          permissionId,
          isActive: true,
        },
      });
    }

    // Log the assignment
    await this.prisma.auditLog.create({
      data: {
        userId: assignedBy,
        action: 'PERMISSION_ASSIGNED',
        resource: 'PERMISSION',
        details: {
          roleId,
          roleName: role.name,
          permissionId,
          permissionName: permission.name,
        },
      },
    });

    this.logger.log(
      `Permission "${permission.name}" assigned to role "${role.name}" by user ${assignedBy}`,
    );
  }

  /**
   * Revoke permission from role
   */
  async revokePermissionFromRole(
    revokeDto: RevokePermissionFromRoleDto,
    revokedBy: string,
  ): Promise<void> {
    const { roleId, permissionId } = revokeDto;

    // Check if assignment exists
    const rolePermission = await this.prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
      include: {
        role: true,
        permission: true,
      },
    });

    if (!rolePermission || !rolePermission.isActive) {
      throw new NotFoundException('Role does not have this permission');
    }

    // Deactivate the assignment
    await this.prisma.rolePermission.update({
      where: { id: rolePermission.id },
      data: { isActive: false },
    });

    // Log the revocation
    await this.prisma.auditLog.create({
      data: {
        userId: revokedBy,
        action: 'PERMISSION_REVOKED',
        resource: 'PERMISSION',
        details: {
          roleId,
          roleName: rolePermission.role.name,
          permissionId,
          permissionName: rolePermission.permission.name,
        },
      },
    });

    this.logger.log(
      `Permission "${rolePermission.permission.name}" revoked from role "${rolePermission.role.name}" by user ${revokedBy}`,
    );
  }

  /**
   * Bulk assign permissions to role
   */
  async bulkAssignPermissions(
    bulkAssignDto: BulkAssignPermissionsDto,
    assignedBy: string,
  ): Promise<{ successCount: number; failures: Array<{ permissionId: string; error: string }> }> {
    const { roleId, permissionIds } = bulkAssignDto;

    // Verify role exists
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role || !role.isActive) {
      throw new NotFoundException(`Active role with ID "${roleId}" not found`);
    }

    const results = {
      successCount: 0,
      failures: [] as Array<{ permissionId: string; error: string }>,
    };

    // Process each permission assignment
    for (const permissionId of permissionIds) {
      try {
        await this.assignPermissionToRole({ roleId, permissionId }, assignedBy);
        results.successCount++;
      } catch (error) {
        results.failures.push({
          permissionId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    this.logger.log(
      `Bulk permission assignment to role "${role.name}": ${results.successCount} successful, ${results.failures.length} failed`,
    );

    return results;
  }

  /**
   * Get role permissions
   */
  async getRolePermissions(roleId: string): Promise<RoleWithPermissionsResponseDto> {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: {
          where: { isActive: true },
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID "${roleId}" not found`);
    }

    const permissions = role.rolePermissions.map(rp => ({
      id: rp.permission.id,
      name: rp.permission.name,
      description: rp.permission.description,
      resource: rp.permission.resource,
      action: rp.permission.action,
      isActive: rp.permission.isActive,
      createdAt: rp.permission.createdAt,
      updatedAt: rp.permission.updatedAt,
    }));

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      isActive: role.isActive,
      permissions,
    };
  }

  /**
   * Get user permissions (aggregated from all roles)
   */
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
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    const allPermissions = new Map<string, PermissionResponseDto>();
    const roles: string[] = [];
    const permissionsByResource: Record<string, string[]> = {};

    user.userRoles.forEach(ur => {
      roles.push(ur.role.name);

      ur.role.rolePermissions.forEach(rp => {
        if (rp.isActive && rp.permission.isActive) {
          allPermissions.set(rp.permission.id, {
            id: rp.permission.id,
            name: rp.permission.name,
            description: rp.permission.description,
            resource: rp.permission.resource,
            action: rp.permission.action,
            isActive: rp.permission.isActive,
            createdAt: rp.permission.createdAt,
            updatedAt: rp.permission.updatedAt,
          });

          // Group by resource
          const resource = rp.permission.resource || 'GENERAL';
          if (!permissionsByResource[resource]) {
            permissionsByResource[resource] = [];
          }
          if (!permissionsByResource[resource].includes(rp.permission.name)) {
            permissionsByResource[resource].push(rp.permission.name);
          }
        }
      });
    });

    return {
      userId,
      permissions: Array.from(allPermissions.values()),
      roles,
      permissionsByResource,
    };
  }

  /**
   * Check if user has specific permission
   */
  async checkUserPermission(
    userId: string,
    checkDto: CheckPermissionDto,
  ): Promise<PermissionCheckResponseDto> {
    const { permission: permissionName, resource, resourceId } = checkDto;

    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              where: {
                isActive: true,
                permission: {
                  name: permissionName,
                  isActive: true,
                  ...(resource && { resource }),
                },
              },
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    const grantedByRoles: string[] = [];
    let hasPermission = false;

    userRoles.forEach(ur => {
      if (ur.role.rolePermissions.length > 0) {
        hasPermission = true;
        grantedByRoles.push(ur.role.name);
      }
    });

    return {
      hasPermission,
      permission: permissionName,
      resource: resource || null,
      grantedByRoles,
    };
  }

  /**
   * Check if user has any of the specified permissions
   */
  async userHasAnyPermission(
    userId: string,
    permissionNames: string[],
    resource?: string,
  ): Promise<boolean> {
    const userRole = await this.prisma.userRole.findFirst({
      where: {
        userId,
        isActive: true,
        role: {
          isActive: true,
          rolePermissions: {
            some: {
              isActive: true,
              permission: {
                name: { in: permissionNames },
                isActive: true,
                ...(resource && { resource }),
              },
            },
          },
        },
      },
    });

    return !!userRole;
  }

  /**
   * Check if user has all specified permissions
   */
  async userHasAllPermissions(
    userId: string,
    permissionNames: string[],
    resource?: string,
  ): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    const userPermissionNames = userPermissions.permissions
      .filter(p => !resource || p.resource === resource)
      .map(p => p.name);

    return permissionNames.every(permissionName =>
      userPermissionNames.includes(permissionName)
    );
  }

  /**
   * Get permissions for a specific resource
   */
  async getPermissionsForResource(resource: string): Promise<PermissionResponseDto[]> {
    const permissions = await this.prisma.permission.findMany({
      where: {
        resource,
        isActive: true,
      },
      include: {
        _count: {
          select: { rolePermissions: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return permissions.map(permission => ({
      id: permission.id,
      name: permission.name,
      description: permission.description,
      resource: permission.resource,
      action: permission.action,
      isActive: permission.isActive,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
      roleCount: permission._count.rolePermissions,
    }));
  }
}