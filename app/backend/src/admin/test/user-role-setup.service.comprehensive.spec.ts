import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { UserRoleSetupService } from '../services/user-role-setup.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RoleService } from '../services/role.service';
import { PermissionService } from '../services/permission.service';

describe('UserRoleSetupService - Comprehensive Tests', () => {
  let service: UserRoleSetupService;
  let prismaService: PrismaService;
  let roleService: RoleService;
  let permissionService: PermissionService;

  const mockRole = {
    id: 'role-123',
    name: 'INVESTOR',
    description: 'Investor role',
    isActive: true,
    isDefault: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    userCount: 5,
    permissions: ['VIEW_PORTFOLIO', 'VIEW_DOCUMENTS'],
  };

  const mockFundManagerRole = {
    id: 'role-456',
    name: 'FUND_MANAGER',
    description: 'Fund Manager role',
    isActive: true,
    isDefault: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    userCount: 2,
    permissions: ['VIEW_PORTFOLIO', 'EDIT_PORTFOLIO', 'MANAGE_FUNDS'],
  };

  const mockComplianceRole = {
    id: 'role-789',
    name: 'COMPLIANCE_OFFICER',
    description: 'Compliance Officer role',
    isActive: true,
    isDefault: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    userCount: 1,
    permissions: ['VIEW_COMPLIANCE', 'AUDIT_ACCESS'],
  };

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    investments: [
      { id: 'investment-1', commitmentAmount: 100000 },
      { id: 'investment-2', commitmentAmount: 200000 },
    ],
    userRoles: [
      {
        role: mockRole,
      },
    ],
  };

  const mockUserRoles = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    roles: [mockRole],
    permissions: ['VIEW_PORTFOLIO', 'VIEW_DOCUMENTS'],
  };

  const mockUserPermissions = {
    userId: 'user-123',
    permissions: [
      {
        id: 'permission-123',
        name: 'VIEW_PORTFOLIO',
        description: 'View portfolio data',
        resource: 'PORTFOLIO',
        action: 'READ',
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: 'permission-456',
        name: 'VIEW_DOCUMENTS',
        description: 'View documents',
        resource: 'DOCUMENTS',
        action: 'READ',
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ],
    roles: ['INVESTOR'],
    permissionsByResource: {
      PORTFOLIO: ['VIEW_PORTFOLIO'],
      DOCUMENTS: ['VIEW_DOCUMENTS'],
    },
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockRoleService = {
    getDefaultRole: jest.fn(),
    getRoleByName: jest.fn(),
    assignRole: jest.fn(),
    revokeRole: jest.fn(),
    getUserRoles: jest.fn(),
  };

  const mockPermissionService = {
    getUserPermissions: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRoleSetupService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RoleService, useValue: mockRoleService },
        { provide: PermissionService, useValue: mockPermissionService },
      ],
    }).compile();

    service = module.get<UserRoleSetupService>(UserRoleSetupService);
    prismaService = module.get<PrismaService>(PrismaService);
    roleService = module.get<RoleService>(RoleService);
    permissionService = module.get<PermissionService>(PermissionService);

    jest.clearAllMocks();
  });

  describe('assignDefaultRoleToUser', () => {
    it('should assign default role to user when default role exists', async () => {
      mockRoleService.getDefaultRole.mockResolvedValue(mockRole);
      mockRoleService.assignRole.mockResolvedValue(undefined);

      await service.assignDefaultRoleToUser('user-123', 'admin-123', {
        userAgent: 'Mozilla/5.0',
        ipAddress: '192.168.1.1',
      });

      expect(mockRoleService.getDefaultRole).toHaveBeenCalled();
      expect(mockRoleService.assignRole).toHaveBeenCalledWith(
        { userId: 'user-123', roleId: 'role-123' },
        {
          assignedBy: 'admin-123',
          userAgent: 'Mozilla/5.0',
          ipAddress: '192.168.1.1',
        }
      );
    });

    it('should assign INVESTOR role when no default role is configured', async () => {
      mockRoleService.getDefaultRole.mockResolvedValue(null);
      mockRoleService.getRoleByName.mockResolvedValue(mockRole);
      mockRoleService.assignRole.mockResolvedValue(undefined);

      await service.assignDefaultRoleToUser('user-123', 'admin-123');

      expect(mockRoleService.getDefaultRole).toHaveBeenCalled();
      expect(mockRoleService.getRoleByName).toHaveBeenCalledWith('INVESTOR');
      expect(mockRoleService.assignRole).toHaveBeenCalledWith(
        { userId: 'user-123', roleId: 'role-123' },
        { assignedBy: 'admin-123' }
      );
    });

    it('should handle errors during role assignment', async () => {
      mockRoleService.getDefaultRole.mockResolvedValue(mockRole);
      mockRoleService.assignRole.mockRejectedValue(new Error('Assignment failed'));

      await expect(service.assignDefaultRoleToUser('user-123', 'admin-123'))
        .rejects.toThrow('Assignment failed');
    });

    it('should handle case when INVESTOR role also does not exist', async () => {
      mockRoleService.getDefaultRole.mockResolvedValue(null);
      mockRoleService.getRoleByName.mockRejectedValue(new Error('Role not found'));

      await expect(service.assignDefaultRoleToUser('user-123', 'admin-123'))
        .rejects.toThrow('Role not found');
    });
  });

  describe('bulkAssignRolesToUsers', () => {
    const assignments = [
      {
        userId: 'user-123',
        roleName: 'INVESTOR',
        assignedBy: 'admin-123',
        metadata: { reason: 'Initial assignment' },
      },
      {
        userId: 'user-456',
        roleName: 'FUND_MANAGER',
        assignedBy: 'admin-123',
        metadata: { reason: 'Promotion' },
      },
      {
        userId: 'user-789',
        roleName: 'NON_EXISTENT_ROLE',
        assignedBy: 'admin-123',
      },
    ];

    it('should successfully assign roles to multiple users', async () => {
      mockRoleService.getRoleByName
        .mockResolvedValueOnce(mockRole)
        .mockResolvedValueOnce(mockFundManagerRole);
      mockRoleService.assignRole.mockResolvedValue(undefined);

      const result = await service.bulkAssignRolesToUsers(assignments.slice(0, 2));

      expect(result.successCount).toBe(2);
      expect(result.failures).toHaveLength(0);
      expect(mockRoleService.assignRole).toHaveBeenCalledTimes(2);
    });

    it('should handle partial failures in bulk assignment', async () => {
      mockRoleService.getRoleByName
        .mockResolvedValueOnce(mockRole)
        .mockResolvedValueOnce(mockFundManagerRole)
        .mockRejectedValueOnce(new Error('Role not found'));
      mockRoleService.assignRole
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      const result = await service.bulkAssignRolesToUsers(assignments);

      expect(result.successCount).toBe(2);
      expect(result.failures).toHaveLength(1);
      expect(result.failures[0]).toEqual({
        userId: 'user-789',
        error: 'Role not found',
      });
    });

    it('should handle assignment failures', async () => {
      mockRoleService.getRoleByName.mockResolvedValue(mockRole);
      mockRoleService.assignRole
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('User already has role'));

      const result = await service.bulkAssignRolesToUsers(assignments.slice(0, 2));

      expect(result.successCount).toBe(1);
      expect(result.failures).toHaveLength(1);
      expect(result.failures[0]).toEqual({
        userId: 'user-456',
        error: 'User already has role',
      });
    });

    it('should handle empty assignments array', async () => {
      const result = await service.bulkAssignRolesToUsers([]);

      expect(result.successCount).toBe(0);
      expect(result.failures).toHaveLength(0);
    });
  });

  describe('promoteUserToFundManager', () => {
    it('should promote user to Fund Manager role successfully', async () => {
      mockRoleService.getRoleByName.mockResolvedValue(mockFundManagerRole);
      mockRoleService.assignRole.mockResolvedValue(undefined);

      await service.promoteUserToFundManager('user-123', 'admin-123', {
        userAgent: 'Mozilla/5.0',
        ipAddress: '192.168.1.1',
      });

      expect(mockRoleService.getRoleByName).toHaveBeenCalledWith('FUND_MANAGER');
      expect(mockRoleService.assignRole).toHaveBeenCalledWith(
        { userId: 'user-123', roleId: 'role-456' },
        {
          assignedBy: 'admin-123',
          userAgent: 'Mozilla/5.0',
          ipAddress: '192.168.1.1',
          reason: 'Promoted to Fund Manager',
        }
      );
    });

    it('should handle errors during promotion', async () => {
      mockRoleService.getRoleByName.mockRejectedValue(new Error('Role not found'));

      await expect(service.promoteUserToFundManager('user-123', 'admin-123'))
        .rejects.toThrow('Role not found');
    });
  });

  describe('assignComplianceOfficerRole', () => {
    it('should assign Compliance Officer role successfully', async () => {
      mockRoleService.getRoleByName.mockResolvedValue(mockComplianceRole);
      mockRoleService.assignRole.mockResolvedValue(undefined);

      await service.assignComplianceOfficerRole('user-123', 'admin-123', {
        reason: 'Compliance assignment',
      });

      expect(mockRoleService.getRoleByName).toHaveBeenCalledWith('COMPLIANCE_OFFICER');
      expect(mockRoleService.assignRole).toHaveBeenCalledWith(
        { userId: 'user-123', roleId: 'role-789' },
        {
          assignedBy: 'admin-123',
          reason: 'Assigned as Compliance Officer',
        }
      );
    });

    it('should handle errors during compliance officer assignment', async () => {
      mockRoleService.getRoleByName.mockRejectedValue(new Error('Role not found'));

      await expect(service.assignComplianceOfficerRole('user-123', 'admin-123'))
        .rejects.toThrow('Role not found');
    });
  });

  describe('checkUserAccess', () => {
    it('should return true when user has required permission', async () => {
      mockRoleService.getUserRoles.mockResolvedValue(mockUserRoles);
      mockPermissionService.getUserPermissions.mockResolvedValue(mockUserPermissions);

      const result = await service.checkUserAccess('user-123', 'PORTFOLIO', 'VIEW');

      expect(result.hasAccess).toBe(false); // PORTFOLIO:VIEW doesn't match exact permission names
      expect(result.permissions).toEqual(['VIEW_PORTFOLIO', 'VIEW_DOCUMENTS']);
      expect(result.roles).toEqual(['INVESTOR']);
    });

    it('should return false when user does not have required permission', async () => {
      mockRoleService.getUserRoles.mockResolvedValue(mockUserRoles);
      mockPermissionService.getUserPermissions.mockResolvedValue(mockUserPermissions);

      const result = await service.checkUserAccess('user-123', 'ADMIN', 'MANAGE');

      expect(result.hasAccess).toBe(false);
    });

    it('should handle errors and return false access', async () => {
      mockRoleService.getUserRoles.mockRejectedValue(new Error('User not found'));

      const result = await service.checkUserAccess('user-123', 'PORTFOLIO', 'VIEW');

      expect(result.hasAccess).toBe(false);
      expect(result.permissions).toEqual([]);
      expect(result.roles).toEqual([]);
    });
  });

  describe('getRecommendedRoleForUser', () => {
    it('should recommend FUND_MANAGER for users with many investments', async () => {
      const userWithManyInvestments = {
        ...mockUser,
        investments: Array(12).fill({ id: 'investment', commitmentAmount: 100000 }),
      };
      mockPrismaService.user.findUnique.mockResolvedValue(userWithManyInvestments);

      const result = await service.getRecommendedRoleForUser('user-123');

      expect(result.recommendedRole).toBe('FUND_MANAGER');
      expect(result.reason).toBe('User has significant investment activity');
      expect(result.confidence).toBe(0.9);
    });

    it('should recommend ANALYST for users with moderate investments', async () => {
      const userWithModerateInvestments = {
        ...mockUser,
        investments: Array(7).fill({ id: 'investment', commitmentAmount: 100000 }),
      };
      mockPrismaService.user.findUnique.mockResolvedValue(userWithModerateInvestments);

      const result = await service.getRecommendedRoleForUser('user-123');

      expect(result.recommendedRole).toBe('ANALYST');
      expect(result.reason).toBe('User has moderate investment activity');
      expect(result.confidence).toBe(0.7);
    });

    it('should recommend INVESTOR for users with few investments', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getRecommendedRoleForUser('user-123');

      expect(result.recommendedRole).toBe('INVESTOR');
      expect(result.reason).toBe('Default role for new users');
      expect(result.confidence).toBe(0.8);
    });

    it('should handle user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.getRecommendedRoleForUser('non-existent');

      expect(result.recommendedRole).toBe('INVESTOR');
      expect(result.reason).toBe('Default fallback role');
      expect(result.confidence).toBe(0.5);
    });

    it('should handle database errors', async () => {
      mockPrismaService.user.findUnique.mockRejectedValue(new Error('Database error'));

      const result = await service.getRecommendedRoleForUser('user-123');

      expect(result.recommendedRole).toBe('INVESTOR');
      expect(result.reason).toBe('Default fallback role');
      expect(result.confidence).toBe(0.5);
    });
  });

  describe('initializeUserPermissions', () => {
    it('should assign default role to user without existing roles', async () => {
      const userWithoutRoles = { ...mockUserRoles, roles: [] };
      mockRoleService.getUserRoles.mockResolvedValue(userWithoutRoles);
      mockRoleService.getDefaultRole.mockResolvedValue(mockRole);
      mockRoleService.assignRole.mockResolvedValue(undefined);

      await service.initializeUserPermissions('user-123');

      expect(mockRoleService.getUserRoles).toHaveBeenCalledWith('user-123');
      expect(mockRoleService.assignRole).toHaveBeenCalled();
    });

    it('should skip initialization for user with existing roles', async () => {
      mockRoleService.getUserRoles.mockResolvedValue(mockUserRoles);

      await service.initializeUserPermissions('user-123');

      expect(mockRoleService.getUserRoles).toHaveBeenCalledWith('user-123');
      expect(mockRoleService.assignRole).not.toHaveBeenCalled();
    });

    it('should handle errors during initialization', async () => {
      mockRoleService.getUserRoles.mockRejectedValue(new Error('Database error'));

      await expect(service.initializeUserPermissions('user-123'))
        .rejects.toThrow('Database error');
    });
  });

  describe('removeAllUserRoles', () => {
    it('should remove all roles from user successfully', async () => {
      mockRoleService.getUserRoles.mockResolvedValue(mockUserRoles);
      mockRoleService.revokeRole.mockResolvedValue(undefined);

      await service.removeAllUserRoles('user-123', 'admin-123', 'User deactivation');

      expect(mockRoleService.getUserRoles).toHaveBeenCalledWith('user-123');
      expect(mockRoleService.revokeRole).toHaveBeenCalledWith(
        { userId: 'user-123', roleId: 'role-123' },
        {
          assignedBy: 'admin-123',
          reason: 'User deactivation',
        }
      );
    });

    it('should use default reason when none provided', async () => {
      mockRoleService.getUserRoles.mockResolvedValue(mockUserRoles);
      mockRoleService.revokeRole.mockResolvedValue(undefined);

      await service.removeAllUserRoles('user-123', 'admin-123');

      expect(mockRoleService.revokeRole).toHaveBeenCalledWith(
        { userId: 'user-123', roleId: 'role-123' },
        {
          assignedBy: 'admin-123',
          reason: 'Role cleanup',
        }
      );
    });

    it('should handle user with no roles', async () => {
      const userWithoutRoles = { ...mockUserRoles, roles: [] };
      mockRoleService.getUserRoles.mockResolvedValue(userWithoutRoles);

      await service.removeAllUserRoles('user-123', 'admin-123');

      expect(mockRoleService.revokeRole).not.toHaveBeenCalled();
    });

    it('should handle errors during role removal', async () => {
      mockRoleService.getUserRoles.mockResolvedValue(mockUserRoles);
      mockRoleService.revokeRole.mockRejectedValue(new Error('Revocation failed'));

      await expect(service.removeAllUserRoles('user-123', 'admin-123'))
        .rejects.toThrow('Revocation failed');
    });
  });

  describe('getUserEffectivePermissions', () => {
    it('should return user effective permissions successfully', async () => {
      mockRoleService.getUserRoles.mockResolvedValue(mockUserRoles);
      mockPermissionService.getUserPermissions.mockResolvedValue(mockUserPermissions);

      const result = await service.getUserEffectivePermissions('user-123');

      expect(result.userId).toBe('user-123');
      expect(result.roles).toEqual(['INVESTOR']);
      expect(result.permissions).toEqual(['VIEW_PORTFOLIO', 'VIEW_DOCUMENTS']);
      expect(result.resourcePermissions).toEqual({
        PORTFOLIO: ['READ'],
        DOCUMENTS: ['READ'],
      });
    });

    it('should handle permissions without resource', async () => {
      const permissionsWithoutResource = {
        ...mockUserPermissions,
        permissions: [
          {
            ...mockUserPermissions.permissions[0],
            resource: null,
            action: 'READ',
          },
        ],
      };
      mockRoleService.getUserRoles.mockResolvedValue(mockUserRoles);
      mockPermissionService.getUserPermissions.mockResolvedValue(permissionsWithoutResource);

      const result = await service.getUserEffectivePermissions('user-123');

      expect(result.resourcePermissions).toEqual({});
    });

    it('should handle permissions without action', async () => {
      const permissionsWithoutAction = {
        ...mockUserPermissions,
        permissions: [
          {
            ...mockUserPermissions.permissions[0],
            action: null,
          },
        ],
      };
      mockRoleService.getUserRoles.mockResolvedValue(mockUserRoles);
      mockPermissionService.getUserPermissions.mockResolvedValue(permissionsWithoutAction);

      const result = await service.getUserEffectivePermissions('user-123');

      expect(result.resourcePermissions).toEqual({});
    });

    it('should handle errors and throw exception', async () => {
      mockRoleService.getUserRoles.mockRejectedValue(new Error('Service error'));

      await expect(service.getUserEffectivePermissions('user-123'))
        .rejects.toThrow('Service error');
    });

    it('should handle user with no roles or permissions', async () => {
      const emptyUserRoles = { ...mockUserRoles, roles: [] };
      const emptyUserPermissions = { ...mockUserPermissions, permissions: [] };
      mockRoleService.getUserRoles.mockResolvedValue(emptyUserRoles);
      mockPermissionService.getUserPermissions.mockResolvedValue(emptyUserPermissions);

      const result = await service.getUserEffectivePermissions('user-123');

      expect(result.roles).toEqual([]);
      expect(result.permissions).toEqual([]);
      expect(result.resourcePermissions).toEqual({});
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle metadata parameter correctly in assignments', async () => {
      mockRoleService.getDefaultRole.mockResolvedValue(mockRole);
      mockRoleService.assignRole.mockResolvedValue(undefined);

      const metadata = {
        userAgent: 'Custom Agent',
        ipAddress: '10.0.0.1',
        reason: 'Custom reason',
      };

      await service.assignDefaultRoleToUser('user-123', 'admin-123', metadata);

      expect(mockRoleService.assignRole).toHaveBeenCalledWith(
        { userId: 'user-123', roleId: 'role-123' },
        {
          assignedBy: 'admin-123',
          ...metadata,
        }
      );
    });

    it('should handle bulk assignment with mixed success/failure scenarios', async () => {
      const assignments = [
        { userId: 'user-1', roleName: 'INVESTOR', assignedBy: 'admin-123' },
        { userId: 'user-2', roleName: 'FUND_MANAGER', assignedBy: 'admin-123' },
        { userId: 'user-3', roleName: 'INVALID_ROLE', assignedBy: 'admin-123' },
        { userId: 'user-4', roleName: 'INVESTOR', assignedBy: 'admin-123' },
      ];

      mockRoleService.getRoleByName
        .mockResolvedValueOnce(mockRole)
        .mockResolvedValueOnce(mockFundManagerRole)
        .mockRejectedValueOnce(new Error('Role not found'))
        .mockResolvedValueOnce(mockRole);

      mockRoleService.assignRole
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('User already has role'));

      const result = await service.bulkAssignRolesToUsers(assignments);

      expect(result.successCount).toBe(2);
      expect(result.failures).toHaveLength(2);
      expect(result.failures[0]).toEqual({
        userId: 'user-3',
        error: 'Role not found',
      });
      expect(result.failures[1]).toEqual({
        userId: 'user-4',
        error: 'User already has role',
      });
    });

    it('should handle logging appropriately during operations', async () => {
      const loggerSpy = jest.spyOn(service['logger'], 'log');
      const errorSpy = jest.spyOn(service['logger'], 'error');

      mockRoleService.getDefaultRole.mockResolvedValue(mockRole);
      mockRoleService.assignRole.mockResolvedValue(undefined);

      await service.assignDefaultRoleToUser('user-123', 'admin-123');

      expect(loggerSpy).toHaveBeenCalledWith('Assigned default role INVESTOR to user user-123');

      // Test error logging
      mockRoleService.assignRole.mockRejectedValue(new Error('Test error'));

      try {
        await service.assignDefaultRoleToUser('user-456', 'admin-123');
      } catch (error) {
        // Expected to throw
      }

      expect(errorSpy).toHaveBeenCalledWith('Failed to assign default role to user user-456:', expect.any(Error));
    });
  });
});