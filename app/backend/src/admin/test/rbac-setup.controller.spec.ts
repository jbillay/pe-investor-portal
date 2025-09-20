import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { RBACSetupController } from '../controllers/rbac-setup.controller';
import { RoleService } from '../services/role.service';
import { PermissionService } from '../services/permission.service';
import { AuthenticatedUser } from '../../auth/interfaces/auth.interface';

describe('RBACSetupController', () => {
  let controller: RBACSetupController;
  let roleService: jest.Mocked<RoleService>;
  let permissionService: jest.Mocked<PermissionService>;

  const mockUser: AuthenticatedUser = {
    id: 'user-123',
    email: 'admin@test.com',
    roles: ['SUPER_ADMIN'],
    permissions: ['SYSTEM:CONFIGURE'],
  };

  const mockPermission = {
    id: 'perm-123',
    name: 'USER:CREATE',
    description: 'Create new users',
    resource: 'USER',
    action: 'CREATE',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-123',
  };

  const mockRole = {
    id: 'role-123',
    name: 'SUPER_ADMIN',
    description: 'System administrator with full access',
    isActive: true,
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-123',
  };

  beforeEach(async () => {
    const mockRoleService = {
      createRole: jest.fn(),
      getRoleByName: jest.fn(),
    };

    const mockPermissionService = {
      createPermission: jest.fn(),
      getPermissionByName: jest.fn(),
      assignPermissionToRole: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RBACSetupController],
      providers: [
        { provide: RoleService, useValue: mockRoleService },
        { provide: PermissionService, useValue: mockPermissionService },
      ],
    }).compile();

    controller = module.get<RBACSetupController>(RBACSetupController);
    roleService = module.get(RoleService);
    permissionService = module.get(PermissionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initializeRBAC', () => {
    it('should successfully initialize RBAC system with new permissions and roles', async () => {
      // Mock permission creation
      permissionService.getPermissionByName.mockRejectedValue(new Error('Not found'));
      permissionService.createPermission.mockResolvedValue(mockPermission);

      // Mock role creation
      roleService.getRoleByName.mockRejectedValue(new Error('Not found'));
      roleService.createRole.mockResolvedValue(mockRole);

      // Mock permission assignment
      permissionService.assignPermissionToRole.mockResolvedValue({
        id: 'assignment-123',
        roleId: 'role-123',
        permissionId: 'perm-123',
        createdAt: new Date(),
        createdBy: 'user-123',
      });

      const result = await controller.initializeRBAC(mockUser);

      expect(result).toMatchObject({
        permissionsCreated: expect.any(Number),
        rolesCreated: expect.any(Number),
        rolePermissionsAssigned: expect.any(Number),
        message: expect.stringContaining('RBAC system initialized successfully'),
      });

      expect(result.permissionsCreated).toBeGreaterThan(0);
      expect(result.rolesCreated).toBeGreaterThan(0);
      expect(result.rolePermissionsAssigned).toBeGreaterThan(0);
    });

    it('should skip existing permissions and roles', async () => {
      // Mock existing permissions and roles
      permissionService.getPermissionByName.mockResolvedValue(mockPermission);
      roleService.getRoleByName.mockResolvedValue(mockRole);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await controller.initializeRBAC(mockUser);

      expect(result.permissionsCreated).toBe(0);
      expect(result.rolesCreated).toBe(0);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('already exists, skipping')
      );

      consoleSpy.mockRestore();
    });

    it('should handle permission creation errors gracefully', async () => {
      permissionService.getPermissionByName.mockRejectedValue(new Error('Not found'));
      permissionService.createPermission.mockRejectedValue(new Error('Creation failed'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await controller.initializeRBAC(mockUser);

      expect(result.permissionsCreated).toBe(0);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to create permission'),
        expect.any(String)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle role creation errors gracefully', async () => {
      permissionService.getPermissionByName.mockRejectedValue(new Error('Not found'));
      permissionService.createPermission.mockResolvedValue(mockPermission);

      roleService.getRoleByName.mockRejectedValue(new Error('Not found'));
      roleService.createRole.mockRejectedValue(new Error('Role creation failed'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await controller.initializeRBAC(mockUser);

      expect(result.rolesCreated).toBe(0);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to create role'),
        expect.any(String)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle permission assignment errors gracefully', async () => {
      permissionService.getPermissionByName.mockResolvedValue(mockPermission);
      roleService.getRoleByName.mockResolvedValue(mockRole);
      permissionService.assignPermissionToRole.mockRejectedValue(
        new Error('Assignment failed')
      );

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await controller.initializeRBAC(mockUser);

      expect(result.rolePermissionsAssigned).toBe(0);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to assign permission'),
        expect.any(String)
      );

      consoleWarnSpy.mockRestore();
    });

    it('should create all expected permission types', async () => {
      permissionService.getPermissionByName.mockRejectedValue(new Error('Not found'));
      permissionService.createPermission.mockResolvedValue(mockPermission);

      await controller.initializeRBAC(mockUser);

      // Verify specific permission types are created
      expect(permissionService.createPermission).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'USER:CREATE',
          resource: 'USER',
          action: 'CREATE',
        }),
        mockUser.id
      );

      expect(permissionService.createPermission).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'FUND:MANAGE_PERFORMANCE',
          resource: 'FUND',
          action: 'MANAGE_PERFORMANCE',
        }),
        mockUser.id
      );

      expect(permissionService.createPermission).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'SYSTEM:CONFIGURE',
          resource: 'SYSTEM',
          action: 'CONFIGURE',
        }),
        mockUser.id
      );
    });

    it('should create all expected role types', async () => {
      permissionService.getPermissionByName.mockRejectedValue(new Error('Not found'));
      permissionService.createPermission.mockResolvedValue(mockPermission);

      roleService.getRoleByName.mockRejectedValue(new Error('Not found'));
      roleService.createRole.mockResolvedValue(mockRole);

      await controller.initializeRBAC(mockUser);

      // Verify specific roles are created
      expect(roleService.createRole).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'SUPER_ADMIN',
          description: 'System administrator with full access to all features',
          isDefault: false,
        }),
        mockUser.id
      );

      expect(roleService.createRole).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'INVESTOR',
          description: 'Limited partner with read access to their own investments',
          isDefault: true,
        }),
        mockUser.id
      );

      expect(roleService.createRole).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'FUND_MANAGER',
          isActive: true,
        }),
        mockUser.id
      );
    });

    it('should assign correct permissions to SUPER_ADMIN role', async () => {
      permissionService.getPermissionByName.mockResolvedValue(mockPermission);
      roleService.getRoleByName.mockResolvedValue(mockRole);
      permissionService.assignPermissionToRole.mockResolvedValue({
        id: 'assignment-123',
        roleId: 'role-123',
        permissionId: 'perm-123',
        createdAt: new Date(),
        createdBy: 'user-123',
      });

      await controller.initializeRBAC(mockUser);

      // Verify SUPER_ADMIN gets comprehensive permissions
      expect(permissionService.assignPermissionToRole).toHaveBeenCalledWith(
        {
          roleId: mockRole.id,
          permissionId: mockPermission.id,
        },
        mockUser.id
      );

      // Count the number of permission assignments for SUPER_ADMIN
      const superAdminAssignments = (permissionService.assignPermissionToRole as jest.Mock).mock.calls.length;
      expect(superAdminAssignments).toBeGreaterThan(40); // SUPER_ADMIN should have many permissions
    });

    it('should assign limited permissions to INVESTOR role', async () => {
      permissionService.getPermissionByName.mockResolvedValue(mockPermission);

      const investorRole = { ...mockRole, name: 'INVESTOR' };
      roleService.getRoleByName.mockImplementation((name) => {
        if (name === 'INVESTOR') return Promise.resolve(investorRole);
        return Promise.resolve(mockRole);
      });

      permissionService.assignPermissionToRole.mockResolvedValue({
        id: 'assignment-123',
        roleId: 'role-123',
        permissionId: 'perm-123',
        createdAt: new Date(),
        createdBy: 'user-123',
      });

      await controller.initializeRBAC(mockUser);

      // Verify INVESTOR role gets limited permissions
      const investorAssignments = (permissionService.assignPermissionToRole as jest.Mock).mock.calls
        .filter(call => call[0].roleId === investorRole.id);

      expect(investorAssignments.length).toBeLessThan(10); // INVESTOR should have limited permissions
    });

    it('should handle mixed success and failure scenarios', async () => {
      // Some permissions exist, some don't
      permissionService.getPermissionByName
        .mockResolvedValueOnce(mockPermission) // First exists
        .mockRejectedValueOnce(new Error('Not found')) // Second doesn't exist
        .mockResolvedValue(mockPermission); // Rest exist

      permissionService.createPermission.mockResolvedValue(mockPermission);

      // Some roles exist, some don't
      roleService.getRoleByName
        .mockResolvedValueOnce(mockRole) // First exists
        .mockRejectedValueOnce(new Error('Not found')) // Second doesn't exist
        .mockResolvedValue(mockRole); // Rest exist

      roleService.createRole.mockResolvedValue(mockRole);

      permissionService.assignPermissionToRole.mockResolvedValue({
        id: 'assignment-123',
        roleId: 'role-123',
        permissionId: 'perm-123',
        createdAt: new Date(),
        createdBy: 'user-123',
      });

      const result = await controller.initializeRBAC(mockUser);

      expect(result.message).toContain('RBAC system initialized successfully');
      expect(result.permissionsCreated).toBeGreaterThanOrEqual(0);
      expect(result.rolesCreated).toBeGreaterThanOrEqual(0);
      expect(result.rolePermissionsAssigned).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Permission Creation Logic', () => {
    it('should create all resource types correctly', async () => {
      permissionService.getPermissionByName.mockRejectedValue(new Error('Not found'));
      permissionService.createPermission.mockResolvedValue(mockPermission);

      await controller.initializeRBAC(mockUser);

      // Verify different resource types are created
      const createdPermissions = (permissionService.createPermission as jest.Mock).mock.calls;
      const resources = createdPermissions.map(call => call[0].resource);

      expect(resources).toContain('USER');
      expect(resources).toContain('ROLE');
      expect(resources).toContain('PERMISSION');
      expect(resources).toContain('FUND');
      expect(resources).toContain('INVESTMENT');
      expect(resources).toContain('CAPITAL_CALL');
      expect(resources).toContain('DISTRIBUTION');
      expect(resources).toContain('DOCUMENT');
      expect(resources).toContain('REPORT');
      expect(resources).toContain('COMMUNICATION');
      expect(resources).toContain('PORTFOLIO');
      expect(resources).toContain('SYSTEM');
      expect(resources).toContain('AUDIT');
    });

    it('should create all action types correctly', async () => {
      permissionService.getPermissionByName.mockRejectedValue(new Error('Not found'));
      permissionService.createPermission.mockResolvedValue(mockPermission);

      await controller.initializeRBAC(mockUser);

      const createdPermissions = (permissionService.createPermission as jest.Mock).mock.calls;
      const actions = createdPermissions.map(call => call[0].action);

      expect(actions).toContain('CREATE');
      expect(actions).toContain('READ');
      expect(actions).toContain('UPDATE');
      expect(actions).toContain('DELETE');
      expect(actions).toContain('MANAGE_ROLES');
      expect(actions).toContain('ASSIGN');
      expect(actions).toContain('PROCESS');
      expect(actions).toContain('READ_CONFIDENTIAL');
      expect(actions).toContain('READ_OWN');
      expect(actions).toContain('CONFIGURE');
      expect(actions).toContain('MONITOR');
      expect(actions).toContain('BACKUP');
      expect(actions).toContain('EXPORT');
    });
  });
});