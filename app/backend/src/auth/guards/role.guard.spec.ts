import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleGuard } from './role.guard';
import { RoleService } from '../services/role.service';
import { PermissionService } from '../services/permission.service';
import { AuthenticatedUser } from '../interfaces/auth.interface';

// Mock RoleService
const mockRoleService = {
  getUserRoles: jest.fn(),
};

// Mock PermissionService
const mockPermissionService = {
  checkUserPermission: jest.fn(),
};

// Mock Reflector
const mockReflector = {
  get: jest.fn(),
  getAllAndOverride: jest.fn(),
};

describe('RoleGuard', () => {
  let guard: RoleGuard;
  let reflector: typeof mockReflector;
  let roleService: typeof mockRoleService;

  const mockUser: AuthenticatedUser = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    isActive: true,
    isVerified: true,
    roles: ['USER'],
    permissions: ['VIEW_USER_DASHBOARD'],
  };

  const mockAdminUser: AuthenticatedUser = {
    id: 'admin-1',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    isActive: true,
    isVerified: true,
    roles: ['ADMIN'],
    permissions: ['CREATE_USER', 'VIEW_USER', 'UPDATE_USER', 'DELETE_USER'],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
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

    guard = module.get<RoleGuard>(RoleGuard);
    reflector = module.get(Reflector);
    roleService = module.get(RoleService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  const createMockExecutionContext = (user?: AuthenticatedUser): ExecutionContext => ({
    switchToHttp: () => ({
      getRequest: () => ({ user }),
      getResponse: () => ({}),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToRpc: () => ({} as any),
    switchToWs: () => ({} as any),
    getType: () => 'http' as any,
    getArgs: () => [],
    getArgByIndex: () => ({}),
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should allow access when endpoint is public', async () => {
      const context = createMockExecutionContext(mockUser);
      reflector.getAllAndOverride.mockReturnValue(true);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith('isPublic', [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('should throw UnauthorizedException when no user is present', async () => {
      const context = createMockExecutionContext();
      reflector.getAllAndOverride.mockReturnValue(false);

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should allow access when no role requirements are specified', async () => {
      const context = createMockExecutionContext(mockUser);
      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(null) // REQUIRE_ROLES_KEY
        .mockReturnValueOnce(null) // REQUIRE_ANY_ROLE_KEY
        .mockReturnValueOnce(null) // REQUIRE_PERMISSIONS_KEY
        .mockReturnValueOnce(null); // REQUIRE_ANY_PERMISSION_KEY

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when user has required roles', async () => {
      const context = createMockExecutionContext(mockAdminUser);
      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(['ADMIN']) // REQUIRE_ROLES_KEY
        .mockReturnValueOnce(null) // REQUIRE_ANY_ROLE_KEY
        .mockReturnValueOnce(null) // REQUIRE_PERMISSIONS_KEY
        .mockReturnValueOnce(null); // REQUIRE_ANY_PERMISSION_KEY

      const mockUserWithRoles = {
        roles: [{ name: 'ADMIN' }],
        permissions: ['CREATE_USER', 'VIEW_USER']
      };
      mockRoleService.getUserRoles.mockResolvedValue(mockUserWithRoles);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockRoleService.getUserRoles).toHaveBeenCalledWith(mockAdminUser.id);
    });

    it('should deny access when user does not have required roles', async () => {
      const context = createMockExecutionContext(mockUser);
      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(['ADMIN']) // REQUIRE_ROLES_KEY
        .mockReturnValueOnce(null) // REQUIRE_ANY_ROLE_KEY
        .mockReturnValueOnce(null) // REQUIRE_PERMISSIONS_KEY
        .mockReturnValueOnce(null); // REQUIRE_ANY_PERMISSION_KEY

      const mockUserWithRoles = {
        roles: [{ name: 'USER' }],
        permissions: ['VIEW_USER_DASHBOARD']
      };
      mockRoleService.getUserRoles.mockResolvedValue(mockUserWithRoles);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should allow access when user has any of the required roles', async () => {
      const context = createMockExecutionContext(mockUser);
      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(null) // REQUIRE_ROLES_KEY
        .mockReturnValueOnce(['ADMIN', 'USER']) // REQUIRE_ANY_ROLE_KEY
        .mockReturnValueOnce(null) // REQUIRE_PERMISSIONS_KEY
        .mockReturnValueOnce(null); // REQUIRE_ANY_PERMISSION_KEY

      const mockUserWithRoles = {
        roles: [{ name: 'USER' }],
        permissions: ['VIEW_USER_DASHBOARD']
      };
      mockRoleService.getUserRoles.mockResolvedValue(mockUserWithRoles);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny access when user does not have any of the required roles', async () => {
      const context = createMockExecutionContext(mockUser);
      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(null) // REQUIRE_ROLES_KEY
        .mockReturnValueOnce(['ADMIN', 'INVESTOR']) // REQUIRE_ANY_ROLE_KEY
        .mockReturnValueOnce(null) // REQUIRE_PERMISSIONS_KEY
        .mockReturnValueOnce(null); // REQUIRE_ANY_PERMISSION_KEY

      const mockUserWithRoles = {
        roles: [{ name: 'USER' }],
        permissions: ['VIEW_USER_DASHBOARD']
      };
      mockRoleService.getUserRoles.mockResolvedValue(mockUserWithRoles);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should allow access when user has required permissions', async () => {
      const context = createMockExecutionContext(mockAdminUser);
      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(null) // REQUIRE_ROLES_KEY
        .mockReturnValueOnce(null) // REQUIRE_ANY_ROLE_KEY
        .mockReturnValueOnce(['CREATE_USER']) // REQUIRE_PERMISSIONS_KEY
        .mockReturnValueOnce(null); // REQUIRE_ANY_PERMISSION_KEY

      const mockUserWithRoles = {
        roles: [{ name: 'ADMIN' }],
        permissions: ['CREATE_USER', 'VIEW_USER']
      };
      mockRoleService.getUserRoles.mockResolvedValue(mockUserWithRoles);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny access when user does not have required permissions', async () => {
      const context = createMockExecutionContext(mockUser);
      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(null) // REQUIRE_ROLES_KEY
        .mockReturnValueOnce(null) // REQUIRE_ANY_ROLE_KEY
        .mockReturnValueOnce(['CREATE_USER']) // REQUIRE_PERMISSIONS_KEY
        .mockReturnValueOnce(null); // REQUIRE_ANY_PERMISSION_KEY

      const mockUserWithRoles = {
        roles: [{ name: 'USER' }],
        permissions: ['VIEW_USER_DASHBOARD']
      };
      mockRoleService.getUserRoles.mockResolvedValue(mockUserWithRoles);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should allow access when user has any of the required permissions', async () => {
      const context = createMockExecutionContext(mockAdminUser);
      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(null) // REQUIRE_ROLES_KEY
        .mockReturnValueOnce(null) // REQUIRE_ANY_ROLE_KEY
        .mockReturnValueOnce(null) // REQUIRE_PERMISSIONS_KEY
        .mockReturnValueOnce(['CREATE_USER', 'MANAGE_USERS']); // REQUIRE_ANY_PERMISSION_KEY

      const mockUserWithRoles = {
        roles: [{ name: 'ADMIN' }],
        permissions: ['CREATE_USER', 'VIEW_USER']
      };
      mockRoleService.getUserRoles.mockResolvedValue(mockUserWithRoles);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny access when user does not have any of the required permissions', async () => {
      const context = createMockExecutionContext(mockUser);
      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(null) // REQUIRE_ROLES_KEY
        .mockReturnValueOnce(null) // REQUIRE_ANY_ROLE_KEY
        .mockReturnValueOnce(null) // REQUIRE_PERMISSIONS_KEY
        .mockReturnValueOnce(['CREATE_USER', 'MANAGE_USERS']); // REQUIRE_ANY_PERMISSION_KEY

      const mockUserWithRoles = {
        roles: [{ name: 'USER' }],
        permissions: ['VIEW_USER_DASHBOARD']
      };
      mockRoleService.getUserRoles.mockResolvedValue(mockUserWithRoles);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should handle multiple role requirements correctly', async () => {
      const context = createMockExecutionContext(mockAdminUser);
      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(['ADMIN', 'MANAGER']) // REQUIRE_ROLES_KEY (ALL required)
        .mockReturnValueOnce(null) // REQUIRE_ANY_ROLE_KEY
        .mockReturnValueOnce(null) // REQUIRE_PERMISSIONS_KEY
        .mockReturnValueOnce(null); // REQUIRE_ANY_PERMISSION_KEY

      const mockUserWithRoles = {
        roles: [{ name: 'ADMIN' }], // Missing MANAGER role
        permissions: ['CREATE_USER', 'VIEW_USER']
      };
      mockRoleService.getUserRoles.mockResolvedValue(mockUserWithRoles);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should handle service errors gracefully', async () => {
      const context = createMockExecutionContext(mockUser);
      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(['ADMIN']) // REQUIRE_ROLES_KEY
        .mockReturnValueOnce(null) // REQUIRE_ANY_ROLE_KEY
        .mockReturnValueOnce(null) // REQUIRE_PERMISSIONS_KEY
        .mockReturnValueOnce(null); // REQUIRE_ANY_PERMISSION_KEY

      mockRoleService.getUserRoles.mockRejectedValue(new Error('Database error'));

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should handle multiple permission checks correctly', async () => {
      const context = createMockExecutionContext(mockAdminUser);
      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(null) // REQUIRE_ROLES_KEY
        .mockReturnValueOnce(null) // REQUIRE_ANY_ROLE_KEY
        .mockReturnValueOnce(['CREATE_USER', 'UPDATE_USER']) // REQUIRE_PERMISSIONS_KEY (ALL required)
        .mockReturnValueOnce(null); // REQUIRE_ANY_PERMISSION_KEY

      const mockUserWithRoles = {
        roles: [{ name: 'ADMIN' }],
        permissions: ['CREATE_USER'] // Missing UPDATE_USER permission
      };
      mockRoleService.getUserRoles.mockResolvedValue(mockUserWithRoles);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should update user object with roles and permissions for downstream use', async () => {
      const context = createMockExecutionContext(mockUser);
      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(['USER']) // REQUIRE_ROLES_KEY
        .mockReturnValueOnce(null) // REQUIRE_ANY_ROLE_KEY
        .mockReturnValueOnce(null) // REQUIRE_PERMISSIONS_KEY
        .mockReturnValueOnce(null); // REQUIRE_ANY_PERMISSION_KEY

      const mockUserWithRoles = {
        roles: [{ name: 'USER' }],
        permissions: ['VIEW_USER_DASHBOARD']
      };
      mockRoleService.getUserRoles.mockResolvedValue(mockUserWithRoles);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      // Verify that user object was updated with roles and permissions
      expect(context.switchToHttp().getRequest().user.roles).toEqual(['USER']);
      expect(context.switchToHttp().getRequest().user.permissions).toEqual(['VIEW_USER_DASHBOARD']);
    });

    it('should handle complex authorization scenarios with mixed requirements', async () => {
      const context = createMockExecutionContext(mockAdminUser);
      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(['ADMIN']) // REQUIRE_ROLES_KEY (must have ADMIN)
        .mockReturnValueOnce(['USER', 'INVESTOR']) // REQUIRE_ANY_ROLE_KEY (must have USER OR INVESTOR)
        .mockReturnValueOnce(['CREATE_USER']) // REQUIRE_PERMISSIONS_KEY (must have CREATE_USER)
        .mockReturnValueOnce(['VIEW_DASHBOARD', 'MANAGE_SETTINGS']); // REQUIRE_ANY_PERMISSION_KEY

      const mockUserWithRoles = {
        roles: [{ name: 'ADMIN' }, { name: 'USER' }], // Has both ADMIN and USER
        permissions: ['CREATE_USER', 'VIEW_DASHBOARD'] // Has both required permissions
      };
      mockRoleService.getUserRoles.mockResolvedValue(mockUserWithRoles);

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should log successful authorization with context information', async () => {
      const context = createMockExecutionContext(mockUser);
      const loggerSpy = jest.spyOn((guard as any).logger, 'log');

      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(['USER']) // REQUIRE_ROLES_KEY
        .mockReturnValueOnce(null) // REQUIRE_ANY_ROLE_KEY
        .mockReturnValueOnce(null) // REQUIRE_PERMISSIONS_KEY
        .mockReturnValueOnce(null); // REQUIRE_ANY_PERMISSION_KEY

      const mockUserWithRoles = {
        roles: [{ name: 'USER' }],
        permissions: ['VIEW_USER_DASHBOARD']
      };
      mockRoleService.getUserRoles.mockResolvedValue(mockUserWithRoles);

      await guard.canActivate(context);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining(`User ${mockUser.id} authorized for`)
      );
    });
  });
});