import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateRoleDto,
  UpdateRoleDto,
  AssignRoleDto,
  RevokeRoleDto,
  BulkAssignRolesDto,
  RoleResponseDto,
  UserWithRolesResponseDto,
  RoleAssignmentResponseDto,
} from '../dto/role.dto';
import {
  Role,
  RoleAssignmentContext,
  AuthenticatedUser,
} from '../../auth/interfaces/auth.interface';

@Injectable()
export class RoleService {
  private readonly logger = new Logger(RoleService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a new role
   */
  async createRole(
    createRoleDto: CreateRoleDto,
    createdBy: string,
  ): Promise<RoleResponseDto> {
    const { name, description, isActive = true, isDefault = false } = createRoleDto;

    // Check if role already exists
    const existingRole = await this.prisma.role.findUnique({
      where: { name },
    });

    if (existingRole) {
      throw new ConflictException(`Role with name "${name}" already exists`);
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      await this.prisma.role.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const role = await this.prisma.role.create({
      data: {
        name,
        description,
        isActive,
        isDefault,
      },
      include: {
        _count: {
          select: { userRoles: true },
        },
      },
    });

    this.logger.log(`Role "${name}" created by user ${createdBy}`);

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      isActive: role.isActive,
      isDefault: role.isDefault,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      userCount: role._count.userRoles,
    };
  }

  /**
   * Get all roles
   */
  async getAllRoles(includeInactive = false): Promise<RoleResponseDto[]> {
    const roles = await this.prisma.role.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        _count: {
          select: { userRoles: true },
        },
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isActive: role.isActive,
      isDefault: role.isDefault,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      userCount: role._count.userRoles,
      permissions: role.rolePermissions.map(rp => rp.permission.name),
    }));
  }

  /**
   * Get role by ID
   */
  async getRoleById(roleId: string): Promise<RoleResponseDto> {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        _count: {
          select: { userRoles: true },
        },
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID "${roleId}" not found`);
    }

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      isActive: role.isActive,
      isDefault: role.isDefault,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      userCount: role._count.userRoles,
      permissions: role.rolePermissions.map(rp => rp.permission.name),
    };
  }

  /**
   * Get role by name
   */
  async getRoleByName(name: string): Promise<RoleResponseDto> {
    const role = await this.prisma.role.findUnique({
      where: { name },
      include: {
        _count: {
          select: { userRoles: true },
        },
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role with name "${name}" not found`);
    }

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      isActive: role.isActive,
      isDefault: role.isDefault,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      userCount: role._count.userRoles,
      permissions: role.rolePermissions.map(rp => rp.permission.name),
    };
  }

  /**
   * Update role
   */
  async updateRole(
    roleId: string,
    updateRoleDto: UpdateRoleDto,
    updatedBy: string,
  ): Promise<RoleResponseDto> {
    const { name, description, isActive, isDefault } = updateRoleDto;

    const existingRole = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!existingRole) {
      throw new NotFoundException(`Role with ID "${roleId}" not found`);
    }

    // Check if name conflict (if name is being updated)
    if (name && name !== existingRole.name) {
      const nameConflict = await this.prisma.role.findUnique({
        where: { name },
      });

      if (nameConflict) {
        throw new ConflictException(`Role with name "${name}" already exists`);
      }
    }

    // If this is being set as default, unset other defaults
    if (isDefault) {
      await this.prisma.role.updateMany({
        where: { isDefault: true, NOT: { id: roleId } },
        data: { isDefault: false },
      });
    }

    const updatedRole = await this.prisma.role.update({
      where: { id: roleId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
        ...(isDefault !== undefined && { isDefault }),
      },
      include: {
        _count: {
          select: { userRoles: true },
        },
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    this.logger.log(`Role "${updatedRole.name}" updated by user ${updatedBy}`);

    return {
      id: updatedRole.id,
      name: updatedRole.name,
      description: updatedRole.description,
      isActive: updatedRole.isActive,
      isDefault: updatedRole.isDefault,
      createdAt: updatedRole.createdAt,
      updatedAt: updatedRole.updatedAt,
      userCount: updatedRole._count.userRoles,
      permissions: updatedRole.rolePermissions.map(rp => rp.permission.name),
    };
  }

  /**
   * Delete role (soft delete by setting isActive to false)
   */
  async deleteRole(roleId: string, deletedBy: string): Promise<void> {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        _count: {
          select: { userRoles: true },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID "${roleId}" not found`);
    }

    if (role.isDefault) {
      throw new BadRequestException('Cannot delete a default role');
    }

    if (role._count.userRoles > 0) {
      throw new BadRequestException(
        'Cannot delete role that is assigned to users. Remove all assignments first.',
      );
    }

    await this.prisma.role.update({
      where: { id: roleId },
      data: { isActive: false },
    });

    this.logger.log(`Role "${role.name}" deleted by user ${deletedBy}`);
  }

  /**
   * Assign role to user
   */
  async assignRole(
    assignRoleDto: AssignRoleDto,
    context: RoleAssignmentContext,
  ): Promise<void> {
    const { userId, roleId, reason, expiresAt } = assignRoleDto;
    const { assignedBy, userAgent, ipAddress } = context;

    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    // Verify role exists and is active
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role || !role.isActive) {
      throw new NotFoundException(`Active role with ID "${roleId}" not found`);
    }

    // Check if user already has this role
    const existingUserRole = await this.prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    if (existingUserRole && existingUserRole.isActive) {
      throw new ConflictException('User already has this role');
    }

    // Use transaction to ensure consistency
    await this.prisma.$transaction(async (tx) => {
      // Create or update UserRole
      if (existingUserRole) {
        await tx.userRole.update({
          where: { id: existingUserRole.id },
          data: { isActive: true },
        });
      } else {
        await tx.userRole.create({
          data: {
            userId,
            roleId,
            isActive: true,
          },
        });
      }

      // Create role assignment record
      await tx.roleAssignment.create({
        data: {
          userId,
          roleId,
          assignedBy,
          reason,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          isActive: true,
        },
      });

      // Log the assignment
      await tx.auditLog.create({
        data: {
          userId: assignedBy,
          action: 'ROLE_ASSIGNED',
          resource: 'ROLE',
          details: {
            targetUserId: userId,
            roleId,
            roleName: role.name,
            reason,
            expiresAt,
          },
          ipAddress,
          userAgent,
        },
      });
    });

    this.logger.log(
      `Role "${role.name}" assigned to user ${userId} by user ${assignedBy}`,
    );
  }

  /**
   * Revoke role from user
   */
  async revokeRole(
    revokeRoleDto: RevokeRoleDto,
    context: RoleAssignmentContext,
  ): Promise<void> {
    const { userId, roleId, reason } = revokeRoleDto;
    const { assignedBy: revokedBy, userAgent, ipAddress } = context;

    // Check if user has this role
    const userRole = await this.prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
      include: {
        role: true,
      },
    });

    if (!userRole || !userRole.isActive) {
      throw new NotFoundException('User does not have this role');
    }

    // Use transaction to ensure consistency
    await this.prisma.$transaction(async (tx) => {
      // Deactivate UserRole
      await tx.userRole.update({
        where: { id: userRole.id },
        data: { isActive: false },
      });

      // Update active role assignment
      const activeAssignment = await tx.roleAssignment.findFirst({
        where: {
          userId,
          roleId,
          isActive: true,
          revokedAt: null,
        },
      });

      if (activeAssignment) {
        await tx.roleAssignment.update({
          where: { id: activeAssignment.id },
          data: {
            isActive: false,
            revokedAt: new Date(),
            revokedBy,
            revokeReason: reason,
          },
        });
      }

      // Log the revocation
      await tx.auditLog.create({
        data: {
          userId: revokedBy,
          action: 'ROLE_REVOKED',
          resource: 'ROLE',
          details: {
            targetUserId: userId,
            roleId,
            roleName: userRole.role.name,
            reason,
          },
          ipAddress,
          userAgent,
        },
      });
    });

    this.logger.log(
      `Role "${userRole.role.name}" revoked from user ${userId} by user ${revokedBy}`,
    );
  }

  /**
   * Bulk assign roles to multiple users
   */
  async bulkAssignRoles(
    bulkAssignDto: BulkAssignRolesDto,
    context: RoleAssignmentContext,
  ): Promise<{ successCount: number; failures: Array<{ userId: string; error: string }> }> {
    const { userIds, roleId, reason, expiresAt } = bulkAssignDto;
    const { assignedBy, userAgent, ipAddress } = context;

    // Verify role exists and is active
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role || !role.isActive) {
      throw new NotFoundException(`Active role with ID "${roleId}" not found`);
    }

    const results = {
      successCount: 0,
      failures: [] as Array<{ userId: string; error: string }>,
    };

    // Process each user assignment
    for (const userId of userIds) {
      try {
        await this.assignRole(
          { userId, roleId, reason, expiresAt },
          { assignedBy, userAgent, ipAddress },
        );
        results.successCount++;
      } catch (error) {
        results.failures.push({
          userId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    this.logger.log(
      `Bulk role assignment: ${results.successCount} successful, ${results.failures.length} failed`,
    );

    return results;
  }

  /**
   * Get user roles
   */
  async getUserRoles(userId: string): Promise<UserWithRolesResponseDto> {
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

    const roles = user.userRoles.map(ur => ({
      id: ur.role.id,
      name: ur.role.name,
      description: ur.role.description,
      isActive: ur.role.isActive,
      isDefault: ur.role.isDefault,
      createdAt: ur.role.createdAt,
      updatedAt: ur.role.updatedAt,
      permissions: ur.role.rolePermissions.map(rp => rp.permission.name),
    }));

    // Get all unique permissions from all roles
    const allPermissions = new Set<string>();
    user.userRoles.forEach(ur => {
      ur.role.rolePermissions.forEach(rp => {
        if (rp.isActive && rp.permission.isActive) {
          allPermissions.add(rp.permission.name);
        }
      });
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles,
      permissions: Array.from(allPermissions),
    };
  }

  /**
   * Get role assignment history for a user
   */
  async getRoleAssignmentHistory(userId: string): Promise<RoleAssignmentResponseDto[]> {
    const assignments = await this.prisma.roleAssignment.findMany({
      where: { userId },
      include: {
        role: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return assignments.map(assignment => ({
      id: assignment.id,
      userId: assignment.userId,
      roleId: assignment.roleId,
      role: {
        id: assignment.role.id,
        name: assignment.role.name,
        description: assignment.role.description,
        isActive: assignment.role.isActive,
        isDefault: assignment.role.isDefault,
        createdAt: assignment.role.createdAt,
        updatedAt: assignment.role.updatedAt,
      },
      assignedBy: assignment.assignedBy,
      reason: assignment.reason,
      expiresAt: assignment.expiresAt,
      revokedAt: assignment.revokedAt,
      revokedBy: assignment.revokedBy,
      revokeReason: assignment.revokeReason,
      isActive: assignment.isActive,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
    }));
  }

  /**
   * Get default role
   */
  async getDefaultRole(): Promise<RoleResponseDto | null> {
    const role = await this.prisma.role.findFirst({
      where: { isDefault: true, isActive: true },
      include: {
        _count: {
          select: { userRoles: true },
        },
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) return null;

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      isActive: role.isActive,
      isDefault: role.isDefault,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      userCount: role._count.userRoles,
      permissions: role.rolePermissions.map(rp => rp.permission.name),
    };
  }

  /**
   * Check if user has specific role
   */
  async userHasRole(userId: string, roleName: string): Promise<boolean> {
    const userRole = await this.prisma.userRole.findFirst({
      where: {
        userId,
        isActive: true,
        role: {
          name: roleName,
          isActive: true,
        },
      },
    });

    return !!userRole;
  }

  /**
   * Check if user has any of the specified roles
   */
  async userHasAnyRole(userId: string, roleNames: string[]): Promise<boolean> {
    const userRole = await this.prisma.userRole.findFirst({
      where: {
        userId,
        isActive: true,
        role: {
          name: { in: roleNames },
          isActive: true,
        },
      },
    });

    return !!userRole;
  }

  /**
   * Get users with a specific role
   */
  async getUsersWithRole(roleId: string): Promise<UserWithRolesResponseDto[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: {
        roleId,
        isActive: true,
      },
      include: {
        user: {
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
        },
      },
    });

    return userRoles.map(ur => {
      const roles = ur.user.userRoles.map(userRole => ({
        id: userRole.role.id,
        name: userRole.role.name,
        description: userRole.role.description,
        isActive: userRole.role.isActive,
        isDefault: userRole.role.isDefault,
        createdAt: userRole.role.createdAt,
        updatedAt: userRole.role.updatedAt,
        permissions: userRole.role.rolePermissions.map(rp => rp.permission.name),
      }));

      const allPermissions = new Set<string>();
      ur.user.userRoles.forEach(userRole => {
        userRole.role.rolePermissions.forEach(rp => {
          if (rp.isActive && rp.permission.isActive) {
            allPermissions.add(rp.permission.name);
          }
        });
      });

      return {
        id: ur.user.id,
        email: ur.user.email,
        firstName: ur.user.firstName,
        lastName: ur.user.lastName,
        roles,
        permissions: Array.from(allPermissions),
      };
    });
  }
}