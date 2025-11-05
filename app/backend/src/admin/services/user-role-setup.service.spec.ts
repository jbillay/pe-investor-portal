import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { UserRoleSetupService } from './user-role-setup.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RoleService } from './role.service';
import { PermissionService } from './permission.service';

describe('UserRoleSetupService', () => {
  let service: UserRoleSetupService;
  let prisma: jest.Mocked<PrismaService>;
  let roleService: jest.Mocked<RoleService>;
  let permissionService: jest.Mocked<PermissionService>;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockRoleService = {
    getDefaultRole: jest.fn(),
    getRoleByName: jest.fn(),
    assignRole: jest.fn(),
    getUserRoles: jest.fn(),
    revokeRole: jest.fn(),
  };

  const mockPermissionService = {
    getUserPermissions: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRoleSetupService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: RoleService,
          useValue: mockRoleService,
        },
        {
          provide: PermissionService,
          useValue: mockPermissionService,
        },
      ],
    }).compile();

    service = module.get<UserRoleSetupService>(UserRoleSetupService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    roleService = module.get(RoleService) as jest.Mocked<RoleService>;
    permissionService = module.get(PermissionService) as jest.Mocked<PermissionService>;

    // Suppress logger output
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('assignDefaultRoleToUser', () => {
    it('should assign default role when configured', async () => {
      const mockRole = { id: 'role-123', name: 'INVESTOR', isDefault: true };
      roleService.getDefaultRole.mockResolvedValue(mockRole as any);
      roleService.assignRole.mockResolvedValue(undefined);

      await service.assignDefaultRoleToUser('user-123', 'admin-123', {
        ipAddress: '127.0.0.1',
      });

      expect(roleService.getDefaultRole).toHaveBeenCalled();
      expect(roleService.assignRole).toHaveBeenCalledWith(
        { userId: 'user-123', roleId: 'role-123' },
        { assignedBy: 'admin-123', ipAddress: '127.0.0.1' },
      );
    });

    it('should fallback to INVESTOR role when no default configured', async () => {
      roleService.getDefaultRole.mockResolvedValue(null);
      const investorRole = { id: 'inv-123', name: 'INVESTOR' };
      roleService.getRoleByName.mockResolvedValue(investorRole as any);
      roleService.assignRole.mockResolvedValue(undefined);

      await service.assignDefaultRoleToUser('user-456', 'system');

      expect(roleService.getDefaultRole).toHaveBeenCalled();
      expect(roleService.getRoleByName).toHaveBeenCalledWith('INVESTOR');
      expect(roleService.assignRole).toHaveBeenCalledWith(
        { userId: 'user-456', roleId: 'inv-123' },
        { assignedBy: 'system' },
      );
    });

    it('should propagate errors when role assignment fails', async () => {
      roleService.getDefaultRole.mockRejectedValue(new Error('Database error'));

      await expect(
        service.assignDefaultRoleToUser('user-789', 'admin-123'),
      ).rejects.toThrow('Database error');
    });

    it('should pass metadata to role assignment', async () => {
      const mockRole = { id: 'role-123', name: 'INVESTOR', isDefault: true };
      roleService.getDefaultRole.mockResolvedValue(mockRole as any);
      roleService.assignRole.mockResolvedValue(undefined);

      await service.assignDefaultRoleToUser('user-123', 'admin-123', {
        userAgent: 'Mozilla/5.0',
        ipAddress: '10.0.0.1',
        reason: 'New user registration',
      });

      expect(roleService.assignRole).toHaveBeenCalledWith(
        { userId: 'user-123', roleId: 'role-123' },
        {
          assignedBy: 'admin-123',
          userAgent: 'Mozilla/5.0',
          ipAddress: '10.0.0.1',
          reason: 'New user registration',
        },
      );
    });
  });

  describe('bulkAssignRolesToUsers', () => {
    it('should successfully assign roles to multiple users', async () => {
      const managerRole = { id: 'role-1', name: 'MANAGER' };
      const userRole = { id: 'role-2', name: 'USER' };

      roleService.getRoleByName
        .mockResolvedValueOnce(managerRole as any)
        .mockResolvedValueOnce(userRole as any);

      roleService.assignRole.mockResolvedValue(undefined);

      const assignments = [
        { userId: 'user-1', roleName: 'MANAGER', assignedBy: 'admin-123' },
        { userId: 'user-2', roleName: 'USER', assignedBy: 'admin-123' },
      ];

      const result = await service.bulkAssignRolesToUsers(assignments);

      expect(result.successCount).toBe(2);
      expect(result.failures).toHaveLength(0);
      expect(roleService.assignRole).toHaveBeenCalledTimes(2);
    });

    it('should handle partial failures gracefully', async () => {
      const managerRole = { id: 'role-1', name: 'MANAGER' };

      roleService.getRoleByName
        .mockResolvedValueOnce(managerRole as any)
        .mockRejectedValueOnce(new Error('Role not found'));

      roleService.assignRole.mockResolvedValue(undefined);

      const assignments = [
        { userId: 'user-1', roleName: 'MANAGER', assignedBy: 'admin-123' },
        { userId: 'user-2', roleName: 'INVALID_ROLE', assignedBy: 'admin-123' },
      ];

      const result = await service.bulkAssignRolesToUsers(assignments);

      expect(result.successCount).toBe(1);
      expect(result.failures).toHaveLength(1);
      expect(result.failures[0]).toEqual({
        userId: 'user-2',
        error: 'Role not found',
      });
    });

    it('should handle all failures', async () => {
      roleService.getRoleByName.mockRejectedValue(new Error('Database error'));

      const assignments = [
        { userId: 'user-1', roleName: 'MANAGER', assignedBy: 'admin-123' },
        { userId: 'user-2', roleName: 'USER', assignedBy: 'admin-123' },
      ];

      const result = await service.bulkAssignRolesToUsers(assignments);

      expect(result.successCount).toBe(0);
      expect(result.failures).toHaveLength(2);
    });

    it('should pass metadata for each assignment', async () => {
      const managerRole = { id: 'role-1', name: 'MANAGER' };
      roleService.getRoleByName.mockResolvedValue(managerRole as any);
      roleService.assignRole.mockResolvedValue(undefined);

      const assignments = [
        {
          userId: 'user-1',
          roleName: 'MANAGER',
          assignedBy: 'admin-123',
          metadata: {
            ipAddress: '192.168.1.1',
            reason: 'Bulk import',
          },
        },
      ];

      await service.bulkAssignRolesToUsers(assignments);

      expect(roleService.assignRole).toHaveBeenCalledWith(
        { userId: 'user-1', roleId: 'role-1' },
        {
          assignedBy: 'admin-123',
          ipAddress: '192.168.1.1',
          reason: 'Bulk import',
        },
      );
    });
  });

  describe('promoteUserToFundManager', () => {
    it('should promote user to fund manager', async () => {
      const fundManagerRole = { id: 'fm-123', name: 'FUND_MANAGER' };
      roleService.getRoleByName.mockResolvedValue(fundManagerRole as any);
      roleService.assignRole.mockResolvedValue(undefined);

      await service.promoteUserToFundManager('user-123', 'admin-123');

      expect(roleService.getRoleByName).toHaveBeenCalledWith('FUND_MANAGER');
      expect(roleService.assignRole).toHaveBeenCalledWith(
        { userId: 'user-123', roleId: 'fm-123' },
        { assignedBy: 'admin-123', reason: 'Promoted to Fund Manager' },
      );
    });

    it('should include metadata in promotion', async () => {
      const fundManagerRole = { id: 'fm-123', name: 'FUND_MANAGER' };
      roleService.getRoleByName.mockResolvedValue(fundManagerRole as any);
      roleService.assignRole.mockResolvedValue(undefined);

      await service.promoteUserToFundManager('user-123', 'admin-123', {
        ipAddress: '10.0.0.1',
        notes: 'Excellent performance',
      });

      expect(roleService.assignRole).toHaveBeenCalledWith(
        { userId: 'user-123', roleId: 'fm-123' },
        {
          assignedBy: 'admin-123',
          ipAddress: '10.0.0.1',
          notes: 'Excellent performance',
          reason: 'Promoted to Fund Manager',
        },
      );
    });

    it('should propagate errors', async () => {
      roleService.getRoleByName.mockRejectedValue(new Error('Role not found'));

      await expect(
        service.promoteUserToFundManager('user-123', 'admin-123'),
      ).rejects.toThrow('Role not found');
    });
  });

  describe('assignComplianceOfficerRole', () => {
    it('should assign compliance officer role', async () => {
      const complianceRole = { id: 'co-123', name: 'COMPLIANCE_OFFICER' };
      roleService.getRoleByName.mockResolvedValue(complianceRole as any);
      roleService.assignRole.mockResolvedValue(undefined);

      await service.assignComplianceOfficerRole('user-123', 'admin-123');

      expect(roleService.getRoleByName).toHaveBeenCalledWith('COMPLIANCE_OFFICER');
      expect(roleService.assignRole).toHaveBeenCalledWith(
        { userId: 'user-123', roleId: 'co-123' },
        { assignedBy: 'admin-123', reason: 'Assigned as Compliance Officer' },
      );
    });

    it('should include metadata in assignment', async () => {
      const complianceRole = { id: 'co-123', name: 'COMPLIANCE_OFFICER' };
      roleService.getRoleByName.mockResolvedValue(complianceRole as any);
      roleService.assignRole.mockResolvedValue(undefined);

      await service.assignComplianceOfficerRole('user-123', 'admin-123', {
        certificationNumber: 'CERT-12345',
      });

      expect(roleService.assignRole).toHaveBeenCalledWith(
        { userId: 'user-123', roleId: 'co-123' },
        {
          assignedBy: 'admin-123',
          certificationNumber: 'CERT-12345',
          reason: 'Assigned as Compliance Officer',
        },
      );
    });

    it('should propagate errors', async () => {
      roleService.getRoleByName.mockRejectedValue(new Error('Role not found'));

      await expect(
        service.assignComplianceOfficerRole('user-123', 'admin-123'),
      ).rejects.toThrow('Role not found');
    });
  });

  describe('checkUserAccess', () => {
    it('should return true when user has required permission', async () => {
      roleService.getUserRoles.mockResolvedValue({
        roles: [{ id: 'role-1', name: 'ADMIN' }],
        permissions: [],
      } as any);

      permissionService.getUserPermissions.mockResolvedValue({
        permissions: [
          { id: 'perm-1', name: 'users:read', resource: 'users', action: 'read' },
        ],
      } as any);

      const result = await service.checkUserAccess('user-123', 'users', 'read');

      expect(result.hasAccess).toBe(true);
      expect(result.permissions).toContain('users:read');
      expect(result.roles).toContain('ADMIN');
    });

    it('should return false when user lacks permission', async () => {
      roleService.getUserRoles.mockResolvedValue({
        roles: [{ id: 'role-1', name: 'USER' }],
        permissions: [],
      } as any);

      permissionService.getUserPermissions.mockResolvedValue({
        permissions: [
          { id: 'perm-1', name: 'users:read', resource: 'users', action: 'read' },
        ],
      } as any);

      const result = await service.checkUserAccess('user-123', 'admin', 'delete');

      expect(result.hasAccess).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      roleService.getUserRoles.mockRejectedValue(new Error('Database error'));

      const result = await service.checkUserAccess('user-123', 'users', 'read');

      expect(result.hasAccess).toBe(false);
      expect(result.permissions).toEqual([]);
      expect(result.roles).toEqual([]);
    });
  });

  describe('getRecommendedRoleForUser', () => {
    it('should recommend SUPER_ADMIN for users with admin roles', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        userRoles: [
          {
            role: { id: 'role-1', name: 'ADMIN' },
          },
        ],
      } as any);

      const result = await service.getRecommendedRoleForUser('user-123');

      expect(result.recommendedRole).toBe('SUPER_ADMIN');
      expect(result.confidence).toBe(0.9);
      expect(result.reason).toContain('administrative');
    });

    it('should recommend current role for users with existing roles', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        userRoles: [
          {
            role: { id: 'role-1', name: 'MANAGER' },
          },
        ],
      } as any);

      const result = await service.getRecommendedRoleForUser('user-123');

      expect(result.recommendedRole).toBe('MANAGER');
      expect(result.confidence).toBe(0.7);
      expect(result.reason).toContain('current role');
    });

    it('should recommend USER for new users without roles', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        userRoles: [],
      } as any);

      const result = await service.getRecommendedRoleForUser('user-123');

      expect(result.recommendedRole).toBe('USER');
      expect(result.confidence).toBe(0.8);
      expect(result.reason).toContain('Default role');
    });

    it('should handle errors gracefully with fallback', async () => {
      prisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      const result = await service.getRecommendedRoleForUser('user-123');

      expect(result.recommendedRole).toBe('INVESTOR');
      expect(result.confidence).toBe(0.5);
      expect(result.reason).toContain('fallback');
    });
  });

  describe('initializeUserPermissions', () => {
    it('should assign default role when user has no roles', async () => {
      roleService.getUserRoles.mockResolvedValue({
        roles: [],
        permissions: [],
      } as any);

      const mockRole = { id: 'role-123', name: 'INVESTOR', isDefault: true };
      roleService.getDefaultRole.mockResolvedValue(mockRole as any);
      roleService.assignRole.mockResolvedValue(undefined);

      await service.initializeUserPermissions('user-123');

      expect(roleService.getUserRoles).toHaveBeenCalledWith('user-123');
      expect(roleService.getDefaultRole).toHaveBeenCalled();
      expect(roleService.assignRole).toHaveBeenCalled();
    });

    it('should skip assignment when user already has roles', async () => {
      roleService.getUserRoles.mockResolvedValue({
        roles: [{ id: 'role-1', name: 'INVESTOR' }],
        permissions: [],
      } as any);

      await service.initializeUserPermissions('user-123');

      expect(roleService.getUserRoles).toHaveBeenCalledWith('user-123');
      expect(roleService.getDefaultRole).not.toHaveBeenCalled();
      expect(roleService.assignRole).not.toHaveBeenCalled();
    });

    it('should propagate errors', async () => {
      roleService.getUserRoles.mockRejectedValue(new Error('Database error'));

      await expect(
        service.initializeUserPermissions('user-123'),
      ).rejects.toThrow('Database error');
    });
  });

  describe('removeAllUserRoles', () => {
    it('should revoke all user roles', async () => {
      roleService.getUserRoles.mockResolvedValue({
        roles: [
          { id: 'role-1', name: 'MANAGER' },
          { id: 'role-2', name: 'USER' },
        ],
        permissions: [],
      } as any);

      roleService.revokeRole.mockResolvedValue(undefined);

      await service.removeAllUserRoles('user-123', 'admin-123', 'Account cleanup');

      expect(roleService.revokeRole).toHaveBeenCalledTimes(2);
      expect(roleService.revokeRole).toHaveBeenCalledWith(
        { userId: 'user-123', roleId: 'role-1' },
        { assignedBy: 'admin-123', reason: 'Account cleanup' },
      );
      expect(roleService.revokeRole).toHaveBeenCalledWith(
        { userId: 'user-123', roleId: 'role-2' },
        { assignedBy: 'admin-123', reason: 'Account cleanup' },
      );
    });

    it('should use default reason when not provided', async () => {
      roleService.getUserRoles.mockResolvedValue({
        roles: [{ id: 'role-1', name: 'USER' }],
        permissions: [],
      } as any);

      roleService.revokeRole.mockResolvedValue(undefined);

      await service.removeAllUserRoles('user-123', 'admin-123');

      expect(roleService.revokeRole).toHaveBeenCalledWith(
        { userId: 'user-123', roleId: 'role-1' },
        { assignedBy: 'admin-123', reason: 'Role cleanup' },
      );
    });

    it('should handle empty roles gracefully', async () => {
      roleService.getUserRoles.mockResolvedValue({
        roles: [],
        permissions: [],
      } as any);

      await service.removeAllUserRoles('user-123', 'admin-123');

      expect(roleService.revokeRole).not.toHaveBeenCalled();
    });

    it('should propagate errors', async () => {
      roleService.getUserRoles.mockRejectedValue(new Error('Database error'));

      await expect(
        service.removeAllUserRoles('user-123', 'admin-123'),
      ).rejects.toThrow('Database error');
    });
  });

  describe('getUserEffectivePermissions', () => {
    it('should return user roles and permissions grouped by resource', async () => {
      roleService.getUserRoles.mockResolvedValue({
        roles: [
          { id: 'role-1', name: 'MANAGER' },
          { id: 'role-2', name: 'USER' },
        ],
        permissions: [],
      } as any);

      permissionService.getUserPermissions.mockResolvedValue({
        permissions: [
          { id: 'p1', name: 'users:read', resource: 'users', action: 'read' },
          { id: 'p2', name: 'users:write', resource: 'users', action: 'write' },
          { id: 'p3', name: 'posts:read', resource: 'posts', action: 'read' },
        ],
      } as any);

      const result = await service.getUserEffectivePermissions('user-123');

      expect(result.userId).toBe('user-123');
      expect(result.roles).toEqual(['MANAGER', 'USER']);
      expect(result.permissions).toEqual(['users:read', 'users:write', 'posts:read']);
      expect(result.resourcePermissions).toEqual({
        users: ['read', 'write'],
        posts: ['read'],
      });
    });

    it('should handle permissions without resource/action', async () => {
      roleService.getUserRoles.mockResolvedValue({
        roles: [{ id: 'role-1', name: 'USER' }],
        permissions: [],
      } as any);

      permissionService.getUserPermissions.mockResolvedValue({
        permissions: [
          { id: 'p1', name: 'global:permission', resource: null, action: null },
          { id: 'p2', name: 'users:read', resource: 'users', action: 'read' },
        ],
      } as any);

      const result = await service.getUserEffectivePermissions('user-123');

      expect(result.permissions).toEqual(['global:permission', 'users:read']);
      expect(result.resourcePermissions).toEqual({
        users: ['read'],
      });
    });

    it('should propagate errors', async () => {
      roleService.getUserRoles.mockRejectedValue(new Error('Database error'));

      await expect(
        service.getUserEffectivePermissions('user-123'),
      ).rejects.toThrow('Database error');
    });
  });
});
