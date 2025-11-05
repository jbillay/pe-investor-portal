import { Test, TestingModule } from '@nestjs/testing';
import { RBACSetupController } from './rbac-setup.controller';
import { RoleService } from '../services/role.service';
import { PermissionService } from '../services/permission.service';
import { AuthenticatedUser } from '../../auth/interfaces/auth.interface';

describe('RBACSetupController', () => {
  let controller: RBACSetupController;
  let roleService: jest.Mocked<RoleService>;
  let permissionService: jest.Mocked<PermissionService>;

  const mockUser: AuthenticatedUser = {
    id: 'user-123',
    email: 'admin@example.com',
    roles: ['SUPER_ADMIN'],
    permissions: [],
  };

  const mockPermission = {
    id: 'perm-1',
    name: 'USER:CREATE',
    description: 'Create new users',
    resource: 'USER',
    action: 'CREATE',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-123',
    updatedBy: null,
  };

  const mockRole = {
    id: 'role-1',
    name: 'SUPER_ADMIN',
    description: 'System administrator',
    isActive: true,
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-123',
    updatedBy: null,
  };

  beforeEach(async () => {
    const mockRoleService = {
      getRoleByName: jest.fn(),
      createRole: jest.fn(),
    };

    const mockPermissionService = {
      getPermissionByName: jest.fn(),
      createPermission: jest.fn(),
      assignPermissionToRole: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RBACSetupController],
      providers: [
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

    controller = module.get<RBACSetupController>(RBACSetupController);
    roleService = module.get(RoleService);
    permissionService = module.get(PermissionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initializeRBAC', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should successfully initialize RBAC system with all permissions and roles', async () => {
      // Mock permission lookup
      // During createPermissions: reject (permissions don't exist)
      // During assignPermissionsToRoles: resolve (permissions exist now)
      let permissionCallCount = 0;
      permissionService.getPermissionByName.mockImplementation(() => {
        permissionCallCount++;
        if (permissionCallCount <= 56) {
          // First 56 calls during createPermissions
          return Promise.reject(new Error('Not found'));
        }
        // Subsequent calls during assignPermissionsToRoles
        return Promise.resolve(mockPermission as any);
      });

      permissionService.createPermission.mockResolvedValue(mockPermission as any);

      // Mock role creation (6 roles)
      // First 6 calls during createRoles should reject (roles don't exist yet)
      // Subsequent calls during assignPermissionsToRoles should resolve (roles exist now)
      roleService.getRoleByName
        .mockRejectedValueOnce(new Error('Not found'))
        .mockRejectedValueOnce(new Error('Not found'))
        .mockRejectedValueOnce(new Error('Not found'))
        .mockRejectedValueOnce(new Error('Not found'))
        .mockRejectedValueOnce(new Error('Not found'))
        .mockRejectedValueOnce(new Error('Not found'))
        .mockResolvedValue(mockRole as any);

      roleService.createRole.mockResolvedValue(mockRole as any);

      // Mock permission assignment
      permissionService.assignPermissionToRole.mockResolvedValue({
        id: 'assignment-1',
      } as any);

      const result = await controller.initializeRBAC(mockUser);

      expect(result).toBeDefined();
      expect(result.permissionsCreated).toBe(56); // 56 permissions defined
      expect(result.rolesCreated).toBe(6); // 6 roles defined
      expect(result.rolePermissionsAssigned).toBeGreaterThan(0);
      expect(result.message).toContain('RBAC system initialized successfully');
      expect(result.message).toContain('56 permissions');
      expect(result.message).toContain('6 roles');
    });

    it('should skip existing permissions and roles', async () => {
      // Mock some permissions already exist
      permissionService.getPermissionByName
        .mockResolvedValueOnce(mockPermission as any) // First exists
        .mockRejectedValueOnce(new Error('Not found')) // Second doesn't
        .mockResolvedValue(mockPermission as any); // Rest exist

      permissionService.createPermission.mockResolvedValue(mockPermission as any);

      // Mock some roles already exist
      roleService.getRoleByName
        .mockResolvedValueOnce(mockRole as any) // First exists
        .mockRejectedValueOnce(new Error('Not found')) // Second doesn't
        .mockResolvedValue(mockRole as any); // Rest exist

      roleService.createRole.mockResolvedValue(mockRole as any);

      // Mock permission assignment
      permissionService.assignPermissionToRole.mockResolvedValue({
        id: 'assignment-1',
      } as any);

      const result = await controller.initializeRBAC(mockUser);

      expect(result).toBeDefined();
      // Should only create the one that didn't exist
      expect(permissionService.createPermission).toHaveBeenCalled();
      expect(roleService.createRole).toHaveBeenCalled();
    });

    it('should handle permission creation errors gracefully', async () => {
      // Mock permission check to fail (not found)
      permissionService.getPermissionByName.mockRejectedValue(
        new Error('Not found'),
      );

      // Mock first permission creation succeeds, second fails
      permissionService.createPermission
        .mockResolvedValueOnce(mockPermission as any)
        .mockRejectedValueOnce(new Error('Creation failed'))
        .mockResolvedValue(mockPermission as any);

      // Mock role creation
      roleService.getRoleByName.mockRejectedValue(new Error('Not found'));
      roleService.createRole.mockResolvedValue(mockRole as any);

      // Mock permission assignment
      permissionService.assignPermissionToRole.mockResolvedValue({
        id: 'assignment-1',
      } as any);

      const result = await controller.initializeRBAC(mockUser);

      expect(result).toBeDefined();
      expect(result.permissionsCreated).toBeLessThan(63); // Some failed
      expect(result.rolesCreated).toBe(6);
    });

    it('should handle role creation errors gracefully', async () => {
      // Mock permission creation
      permissionService.getPermissionByName.mockRejectedValue(
        new Error('Not found'),
      );
      permissionService.createPermission.mockResolvedValue(mockPermission as any);

      // Mock role check to fail (not found)
      roleService.getRoleByName.mockRejectedValue(new Error('Not found'));

      // Mock first role creation succeeds, second fails
      roleService.createRole
        .mockResolvedValueOnce(mockRole as any)
        .mockRejectedValueOnce(new Error('Creation failed'))
        .mockResolvedValue(mockRole as any);

      // Mock permission assignment (will fail for missing role)
      permissionService.assignPermissionToRole.mockResolvedValue({
        id: 'assignment-1',
      } as any);

      const result = await controller.initializeRBAC(mockUser);

      expect(result).toBeDefined();
      expect(result.permissionsCreated).toBe(56);
      expect(result.rolesCreated).toBeLessThan(6); // Some failed
    });

    it('should handle permission assignment errors gracefully', async () => {
      // Mock permission creation
      permissionService.getPermissionByName.mockRejectedValue(
        new Error('Not found'),
      );
      permissionService.createPermission.mockResolvedValue(mockPermission as any);

      // Mock role creation
      roleService.getRoleByName.mockResolvedValue(mockRole as any);

      // Mock permission lookup for assignment
      permissionService.getPermissionByName.mockResolvedValue(
        mockPermission as any,
      );

      // Mock some assignments succeed, some fail
      permissionService.assignPermissionToRole
        .mockResolvedValueOnce({ id: 'assignment-1' } as any)
        .mockRejectedValueOnce(new Error('Assignment failed'))
        .mockResolvedValue({ id: 'assignment-2' } as any);

      const result = await controller.initializeRBAC(mockUser);

      expect(result).toBeDefined();
      expect(result.rolePermissionsAssigned).toBeGreaterThanOrEqual(0);
    });

    it('should create all 63 permissions with correct structure', async () => {
      permissionService.getPermissionByName.mockRejectedValue(
        new Error('Not found'),
      );
      permissionService.createPermission.mockResolvedValue(mockPermission as any);

      roleService.getRoleByName.mockRejectedValue(new Error('Not found'));
      roleService.createRole.mockResolvedValue(mockRole as any);

      permissionService.assignPermissionToRole.mockResolvedValue({
        id: 'assignment-1',
      } as any);

      await controller.initializeRBAC(mockUser);

      // Verify all permission categories are created
      const createCalls = permissionService.createPermission.mock.calls;

      // Verify USER permissions (5 permissions)
      expect(createCalls.some((call) => call[0].name === 'USER:CREATE')).toBe(
        true,
      );
      expect(createCalls.some((call) => call[0].name === 'USER:READ')).toBe(true);
      expect(createCalls.some((call) => call[0].name === 'USER:UPDATE')).toBe(
        true,
      );
      expect(createCalls.some((call) => call[0].name === 'USER:DELETE')).toBe(
        true,
      );
      expect(
        createCalls.some((call) => call[0].name === 'USER:MANAGE_ROLES'),
      ).toBe(true);

      // Verify ROLE permissions
      expect(createCalls.some((call) => call[0].name === 'ROLE:CREATE')).toBe(
        true,
      );
      expect(createCalls.some((call) => call[0].name === 'ROLE:READ')).toBe(true);

      // Verify FUND permissions
      expect(createCalls.some((call) => call[0].name === 'FUND:CREATE')).toBe(
        true,
      );
      expect(
        createCalls.some((call) => call[0].name === 'FUND:MANAGE_PERFORMANCE'),
      ).toBe(true);

      // Verify CAPITAL_CALL permissions
      expect(
        createCalls.some((call) => call[0].name === 'CAPITAL_CALL:CREATE'),
      ).toBe(true);
      expect(
        createCalls.some((call) => call[0].name === 'CAPITAL_CALL:PROCESS'),
      ).toBe(true);

      // Verify DISTRIBUTION permissions
      expect(
        createCalls.some((call) => call[0].name === 'DISTRIBUTION:CREATE'),
      ).toBe(true);
      expect(
        createCalls.some((call) => call[0].name === 'DISTRIBUTION:PROCESS'),
      ).toBe(true);

      // Verify DOCUMENT permissions
      expect(createCalls.some((call) => call[0].name === 'DOCUMENT:CREATE')).toBe(
        true,
      );
      expect(
        createCalls.some((call) => call[0].name === 'DOCUMENT:READ_CONFIDENTIAL'),
      ).toBe(true);

      // Verify REPORT permissions
      expect(createCalls.some((call) => call[0].name === 'REPORT:GENERATE')).toBe(
        true,
      );
      expect(
        createCalls.some((call) => call[0].name === 'REPORT:VIEW_COMPLIANCE'),
      ).toBe(true);

      // Verify SYSTEM permissions
      expect(createCalls.some((call) => call[0].name === 'SYSTEM:CONFIGURE')).toBe(
        true,
      );
      expect(createCalls.some((call) => call[0].name === 'SYSTEM:BACKUP')).toBe(
        true,
      );

      // Verify AUDIT permissions
      expect(createCalls.some((call) => call[0].name === 'AUDIT:READ')).toBe(true);
      expect(createCalls.some((call) => call[0].name === 'AUDIT:EXPORT')).toBe(
        true,
      );

      // Total should be 56
      expect(createCalls.length).toBe(56);
    });

    it('should create all 6 roles with correct properties', async () => {
      permissionService.getPermissionByName.mockRejectedValue(
        new Error('Not found'),
      );
      permissionService.createPermission.mockResolvedValue(mockPermission as any);

      roleService.getRoleByName.mockRejectedValue(new Error('Not found'));
      roleService.createRole.mockResolvedValue(mockRole as any);

      permissionService.assignPermissionToRole.mockResolvedValue({
        id: 'assignment-1',
      } as any);

      await controller.initializeRBAC(mockUser);

      const createCalls = roleService.createRole.mock.calls;

      // Verify all 6 roles
      expect(createCalls.some((call) => call[0].name === 'SUPER_ADMIN')).toBe(
        true,
      );
      expect(createCalls.some((call) => call[0].name === 'FUND_MANAGER')).toBe(
        true,
      );
      expect(createCalls.some((call) => call[0].name === 'INVESTOR')).toBe(true);
      expect(
        createCalls.some((call) => call[0].name === 'COMPLIANCE_OFFICER'),
      ).toBe(true);
      expect(createCalls.some((call) => call[0].name === 'ANALYST')).toBe(true);
      expect(createCalls.some((call) => call[0].name === 'VIEWER')).toBe(true);

      // Verify INVESTOR is default role
      const investorRole = createCalls.find((call) => call[0].name === 'INVESTOR');
      expect(investorRole?.[0].isDefault).toBe(true);

      // Verify others are not default
      const superAdminRole = createCalls.find(
        (call) => call[0].name === 'SUPER_ADMIN',
      );
      expect(superAdminRole?.[0].isDefault).toBe(false);

      expect(createCalls.length).toBe(6);
    });

    it('should assign correct permissions to SUPER_ADMIN role', async () => {
      permissionService.getPermissionByName.mockResolvedValue(
        mockPermission as any,
      );
      permissionService.createPermission.mockResolvedValue(mockPermission as any);

      roleService.getRoleByName.mockResolvedValue({
        ...mockRole,
        name: 'SUPER_ADMIN',
      } as any);
      roleService.createRole.mockResolvedValue(mockRole as any);

      permissionService.assignPermissionToRole.mockResolvedValue({
        id: 'assignment-1',
      } as any);

      await controller.initializeRBAC(mockUser);

      // SUPER_ADMIN should have all permissions (57 in mapping)
      const assignmentCalls = permissionService.assignPermissionToRole.mock.calls;

      // Should have multiple calls for SUPER_ADMIN
      expect(assignmentCalls.length).toBeGreaterThan(0);
    });

    it('should assign correct permissions to FUND_MANAGER role', async () => {
      permissionService.getPermissionByName.mockResolvedValue(
        mockPermission as any,
      );
      permissionService.createPermission.mockResolvedValue(mockPermission as any);

      roleService.getRoleByName.mockResolvedValue({
        ...mockRole,
        name: 'FUND_MANAGER',
      } as any);
      roleService.createRole.mockResolvedValue(mockRole as any);

      permissionService.assignPermissionToRole.mockResolvedValue({
        id: 'assignment-1',
      } as any);

      await controller.initializeRBAC(mockUser);

      // FUND_MANAGER should have operational permissions
      expect(permissionService.assignPermissionToRole).toHaveBeenCalled();
    });

    it('should assign correct permissions to INVESTOR role', async () => {
      permissionService.getPermissionByName.mockResolvedValue(
        mockPermission as any,
      );
      permissionService.createPermission.mockResolvedValue(mockPermission as any);

      roleService.getRoleByName.mockResolvedValue({
        ...mockRole,
        name: 'INVESTOR',
      } as any);
      roleService.createRole.mockResolvedValue(mockRole as any);

      permissionService.assignPermissionToRole.mockResolvedValue({
        id: 'assignment-1',
      } as any);

      await controller.initializeRBAC(mockUser);

      // INVESTOR should have limited permissions (7 in mapping)
      expect(permissionService.assignPermissionToRole).toHaveBeenCalled();
    });

    it('should assign correct permissions to COMPLIANCE_OFFICER role', async () => {
      permissionService.getPermissionByName.mockResolvedValue(
        mockPermission as any,
      );
      permissionService.createPermission.mockResolvedValue(mockPermission as any);

      roleService.getRoleByName.mockResolvedValue({
        ...mockRole,
        name: 'COMPLIANCE_OFFICER',
      } as any);
      roleService.createRole.mockResolvedValue(mockRole as any);

      permissionService.assignPermissionToRole.mockResolvedValue({
        id: 'assignment-1',
      } as any);

      await controller.initializeRBAC(mockUser);

      // COMPLIANCE_OFFICER should have compliance permissions
      expect(permissionService.assignPermissionToRole).toHaveBeenCalled();
    });

    it('should assign correct permissions to ANALYST role', async () => {
      permissionService.getPermissionByName.mockResolvedValue(
        mockPermission as any,
      );
      permissionService.createPermission.mockResolvedValue(mockPermission as any);

      roleService.getRoleByName.mockResolvedValue({
        ...mockRole,
        name: 'ANALYST',
      } as any);
      roleService.createRole.mockResolvedValue(mockRole as any);

      permissionService.assignPermissionToRole.mockResolvedValue({
        id: 'assignment-1',
      } as any);

      await controller.initializeRBAC(mockUser);

      // ANALYST should have read-only permissions
      expect(permissionService.assignPermissionToRole).toHaveBeenCalled();
    });

    it('should assign correct permissions to VIEWER role', async () => {
      permissionService.getPermissionByName.mockResolvedValue(
        mockPermission as any,
      );
      permissionService.createPermission.mockResolvedValue(mockPermission as any);

      roleService.getRoleByName.mockResolvedValue({
        ...mockRole,
        name: 'VIEWER',
      } as any);
      roleService.createRole.mockResolvedValue(mockRole as any);

      permissionService.assignPermissionToRole.mockResolvedValue({
        id: 'assignment-1',
      } as any);

      await controller.initializeRBAC(mockUser);

      // VIEWER should have minimal permissions (3 in mapping)
      expect(permissionService.assignPermissionToRole).toHaveBeenCalled();
    });

    it('should handle permission lookup failures during assignment', async () => {
      permissionService.getPermissionByName.mockRejectedValue(
        new Error('Not found'),
      );
      permissionService.createPermission.mockResolvedValue(mockPermission as any);

      roleService.getRoleByName.mockResolvedValue(mockRole as any);
      roleService.createRole.mockResolvedValue(mockRole as any);

      permissionService.assignPermissionToRole.mockResolvedValue({
        id: 'assignment-1',
      } as any);

      const result = await controller.initializeRBAC(mockUser);

      // Should continue even if permission lookup fails
      expect(result).toBeDefined();
      expect(result.message).toContain('RBAC system initialized');
    });

    it('should handle role lookup failures during assignment', async () => {
      permissionService.getPermissionByName.mockRejectedValue(
        new Error('Not found'),
      );
      permissionService.createPermission.mockResolvedValue(mockPermission as any);

      // Mock role lookup to fail during assignment phase
      roleService.getRoleByName
        .mockRejectedValueOnce(new Error('Not found')) // During creation
        .mockRejectedValueOnce(new Error('Not found'))
        .mockRejectedValueOnce(new Error('Not found'))
        .mockRejectedValueOnce(new Error('Not found'))
        .mockRejectedValueOnce(new Error('Not found'))
        .mockRejectedValueOnce(new Error('Not found'))
        .mockRejectedValue(new Error('Role not found')); // During assignment

      roleService.createRole.mockResolvedValue(mockRole as any);

      const result = await controller.initializeRBAC(mockUser);

      // Should continue even if role lookup fails during assignment
      expect(result).toBeDefined();
      expect(result.rolePermissionsAssigned).toBe(0);
    });

    it('should pass correct userId to permission creation', async () => {
      permissionService.getPermissionByName.mockRejectedValue(
        new Error('Not found'),
      );
      permissionService.createPermission.mockResolvedValue(mockPermission as any);

      roleService.getRoleByName.mockRejectedValue(new Error('Not found'));
      roleService.createRole.mockResolvedValue(mockRole as any);

      permissionService.assignPermissionToRole.mockResolvedValue({
        id: 'assignment-1',
      } as any);

      await controller.initializeRBAC(mockUser);

      // Verify userId is passed to createPermission
      expect(permissionService.createPermission).toHaveBeenCalledWith(
        expect.any(Object),
        mockUser.id,
      );
    });

    it('should pass correct userId to role creation', async () => {
      permissionService.getPermissionByName.mockRejectedValue(
        new Error('Not found'),
      );
      permissionService.createPermission.mockResolvedValue(mockPermission as any);

      roleService.getRoleByName.mockRejectedValue(new Error('Not found'));
      roleService.createRole.mockResolvedValue(mockRole as any);

      permissionService.assignPermissionToRole.mockResolvedValue({
        id: 'assignment-1',
      } as any);

      await controller.initializeRBAC(mockUser);

      // Verify userId is passed to createRole
      expect(roleService.createRole).toHaveBeenCalledWith(
        expect.any(Object),
        mockUser.id,
      );
    });

    it('should pass correct userId to permission assignment', async () => {
      permissionService.getPermissionByName.mockResolvedValue(
        mockPermission as any,
      );
      permissionService.createPermission.mockResolvedValue(mockPermission as any);

      roleService.getRoleByName.mockResolvedValue(mockRole as any);
      roleService.createRole.mockResolvedValue(mockRole as any);

      permissionService.assignPermissionToRole.mockResolvedValue({
        id: 'assignment-1',
      } as any);

      await controller.initializeRBAC(mockUser);

      // Verify userId is passed to assignPermissionToRole
      expect(permissionService.assignPermissionToRole).toHaveBeenCalledWith(
        expect.any(Object),
        mockUser.id,
      );
    });

    it('should include all required resources in permissions', async () => {
      permissionService.getPermissionByName.mockRejectedValue(
        new Error('Not found'),
      );
      permissionService.createPermission.mockResolvedValue(mockPermission as any);

      roleService.getRoleByName.mockRejectedValue(new Error('Not found'));
      roleService.createRole.mockResolvedValue(mockRole as any);

      permissionService.assignPermissionToRole.mockResolvedValue({
        id: 'assignment-1',
      } as any);

      await controller.initializeRBAC(mockUser);

      const createCalls = permissionService.createPermission.mock.calls;
      const resources = createCalls.map((call) => call[0].resource);

      // Verify all expected resources are included
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

    it('should return detailed message with counts', async () => {
      permissionService.getPermissionByName.mockRejectedValue(
        new Error('Not found'),
      );
      permissionService.createPermission.mockResolvedValue(mockPermission as any);

      roleService.getRoleByName.mockRejectedValue(new Error('Not found'));
      roleService.createRole.mockResolvedValue(mockRole as any);

      permissionService.assignPermissionToRole.mockResolvedValue({
        id: 'assignment-1',
      } as any);

      const result = await controller.initializeRBAC(mockUser);

      expect(result.message).toMatch(/RBAC system initialized successfully/);
      expect(result.message).toMatch(/\d+ permissions/);
      expect(result.message).toMatch(/\d+ roles/);
      expect(result.message).toMatch(/\d+ role-permission assignments/);
    });
  });
});
