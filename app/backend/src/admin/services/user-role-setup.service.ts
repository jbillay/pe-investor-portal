import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RoleService } from './role.service';
import { PermissionService } from './permission.service';
import { UserPermissionsResponseDto } from '../dto/permission.dto';
import { performServerHandshake } from 'http2';

interface UserRoleAssignment {
  userId: string;
  roleName: string;
  assignedBy: string;
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    reason?: string;
  };
}

@Injectable()
export class UserRoleSetupService {
  private readonly logger = new Logger(UserRoleSetupService.name);

  constructor(
    private prisma: PrismaService,
    private roleService: RoleService,
    private permissionService: PermissionService,
  ) {}

  /**
   * Assign the default INVESTOR role to a new user
   */
  async assignDefaultRoleToUser(userId: string, assignedBy: string, metadata?: any): Promise<void> {
    try {
      const defaultRole = await this.roleService.getDefaultRole();

      if (defaultRole) {
        await this.roleService.assignRole(
          { userId, roleId: defaultRole.id },
          { assignedBy, ...metadata }
        );

        this.logger.log(`Assigned default role ${defaultRole.name} to user ${userId}`);
      } else {
        // Fallback to INVESTOR role if no default is configured
        const investorRole = await this.roleService.getRoleByName('INVESTOR');
        await this.roleService.assignRole(
          { userId, roleId: investorRole.id },
          { assignedBy, ...metadata }
        );

        this.logger.log(`Assigned INVESTOR role to user ${userId} (no default role configured)`);
      }
    } catch (error) {
      this.logger.error(`Failed to assign default role to user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Bulk assign roles to multiple users
   */
  async bulkAssignRolesToUsers(
    assignments: UserRoleAssignment[]
  ): Promise<{ successCount: number; failures: Array<{ userId: string; error: string }> }> {
    const failures: Array<{ userId: string; error: string }> = [];
    let successCount = 0;

    for (const assignment of assignments) {
      try {
        const role = await this.roleService.getRoleByName(assignment.roleName);

        await this.roleService.assignRole(
          { userId: assignment.userId, roleId: role.id },
          {
            assignedBy: assignment.assignedBy,
            ...assignment.metadata,
          }
        );

        successCount++;
        this.logger.log(`Assigned role ${assignment.roleName} to user ${assignment.userId}`);
      } catch (error: any) {
        const errorMessage = error.message || 'Unknown error';
        failures.push({
          userId: assignment.userId,
          error: errorMessage,
        });
        this.logger.error(`Failed to assign role ${assignment.roleName} to user ${assignment.userId}:`, error);
      }
    }

    return { successCount, failures };
  }

  /**
   * Upgrade user from INVESTOR to FUND_MANAGER
   */
  async promoteUserToFundManager(userId: string, assignedBy: string, metadata?: any): Promise<void> {
    try {
      const fundManagerRole = await this.roleService.getRoleByName('FUND_MANAGER');

      await this.roleService.assignRole(
        { userId, roleId: fundManagerRole.id },
        { assignedBy, ...metadata, reason: 'Promoted to Fund Manager' }
      );

      this.logger.log(`Promoted user ${userId} to Fund Manager`);
    } catch (error) {
      this.logger.error(`Failed to promote user ${userId} to Fund Manager:`, error);
      throw error;
    }
  }

  /**
   * Assign compliance officer role
   */
  async assignComplianceOfficerRole(userId: string, assignedBy: string, metadata?: any): Promise<void> {
    try {
      const complianceRole = await this.roleService.getRoleByName('COMPLIANCE_OFFICER');

      await this.roleService.assignRole(
        { userId, roleId: complianceRole.id },
        { assignedBy, ...metadata, reason: 'Assigned as Compliance Officer' }
      );

      this.logger.log(`Assigned Compliance Officer role to user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to assign Compliance Officer role to user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Check if user has permission to access a resource
   */
  async checkUserAccess(
    userId: string,
    resource: string,
    action: string
  ): Promise<{ hasAccess: boolean; permissions: string[]; roles: string[] }> {
    try {
      const permissionName = `${resource}:${action}`;

      // Get user's roles and permissions
      const userRoles = await this.roleService.getUserRoles(userId);
      const userPermissions = await this.permissionService.getUserPermissions(userId);

      const hasAccess = userPermissions.permissions.some(p => p.name === permissionName);

      return {
        hasAccess,
        permissions: userPermissions.permissions.map(p => p.name),
        roles: userRoles.roles.map(r => r.name),
      };
    } catch (error) {
      this.logger.error(`Failed to check user access for ${userId}:`, error);
      return {
        hasAccess: false,
        permissions: [],
        roles: [],
      };
    }
  }

  /**
   * Get recommended role for user based on their activities
   */
  async getRecommendedRoleForUser(userId: string): Promise<{
    recommendedRole: string;
    reason: string;
    confidence: number;
  }> {
    try {
      // Get user's investment and activity data
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          investments: true,
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Simple role recommendation logic
      let recommendedRole = 'INVESTOR';
      let reason = 'Default role for new users';
      let confidence = 0.8;

      // If user has many investments or high amounts, could be upgraded
      if (user.investments.length >= 10) {
        recommendedRole = 'FUND_MANAGER';
        reason = 'User has significant investment activity';
        confidence = 0.9;
      } else if (user.investments.length >= 5) {
        recommendedRole = 'ANALYST';
        reason = 'User has moderate investment activity';
        confidence = 0.7;
      }

      return {
        recommendedRole,
        reason,
        confidence,
      };
    } catch (error) {
      this.logger.error(`Failed to get recommended role for user ${userId}:`, error);
      return {
        recommendedRole: 'INVESTOR',
        reason: 'Default fallback role',
        confidence: 0.5,
      };
    }
  }

  /**
   * Initialize user permissions on first login
   */
  async initializeUserPermissions(userId: string): Promise<void> {
    try {
      // Check if user already has roles assigned
      const userRoles = await this.roleService.getUserRoles(userId);

      if (userRoles.roles.length === 0) {
        // Assign default role
        await this.assignDefaultRoleToUser(userId, 'SYSTEM');
        this.logger.log(`Initialized permissions for user ${userId} with default role`);
      } else {
        this.logger.log(`User ${userId} already has roles assigned: ${userRoles.roles.map(r => r.name).join(', ')}`);
      }
    } catch (error) {
      this.logger.error(`Failed to initialize permissions for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Remove all roles from a user (for cleanup or role reset)
   */
  async removeAllUserRoles(userId: string, removedBy: string, reason?: string): Promise<void> {
    try {
      const userRoles = await this.roleService.getUserRoles(userId);

      for (const role of userRoles.roles) {
        await this.roleService.revokeRole(
          { userId, roleId: role.id },
          {
            assignedBy: removedBy,
            reason: reason || 'Role cleanup',
          }
        );
      }

      this.logger.log(`Removed all roles from user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to remove roles from user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get user's effective permissions (aggregated from all roles)
   */
  async getUserEffectivePermissions(userId: string): Promise<{
    userId: string;
    roles: string[];
    permissions: string[];
    resourcePermissions: Record<string, string[]>;
  }> {
    try {
      const userRoles = await this.roleService.getUserRoles(userId);
      const userPermissions: UserPermissionsResponseDto = await this.permissionService.getUserPermissions(userId);

      // Group permissions by resource
      const resourcePermissions: Record<string, string[]> = {};
      for (const permission of userPermissions.permissions) {
        if (permission.resource && permission.action) {
          if (!resourcePermissions[permission.resource]) {
            resourcePermissions[permission.resource] = [];
          }
          resourcePermissions[permission.resource].push(permission.action);
        }
      }

      return {
        userId,
        roles: userRoles.roles.map(r => r.name),
        permissions: userPermissions.permissions.map(p => p.name),
        resourcePermissions,
      };
    } catch (error) {
      this.logger.error(`Failed to get effective permissions for user ${userId}:`, error);
      throw error;
    }
  }
}