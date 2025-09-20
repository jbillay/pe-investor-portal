import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException, UnauthorizedException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleGuard } from '../guards/role.guard';
import { RoleService } from '../services/role.service';
import { PermissionService } from '../services/permission.service';
import {
  REQUIRE_ROLES_KEY,
  REQUIRE_ANY_ROLE_KEY,
  REQUIRE_PERMISSIONS_KEY,
  REQUIRE_ANY_PERMISSION_KEY,
} from '../decorators/role.decorator';
import { IS_PUBLIC_KEY } from '../../auth/decorators/public.decorator';
import { AuthenticatedUser } from '../../auth/interfaces/auth.interface';

describe('RoleGuard - Comprehensive Tests', () => {
  let guard: RoleGuard;
  let reflector: Reflector;
  let roleService: RoleService;
  let permissionService: PermissionService;

  const mockUser: AuthenticatedUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    roles: ['INVESTOR'],
    permissions: ['VIEW_PORTFOLIO', 'VIEW_DOCUMENTS'],
  };

  const mockUserWithRoles = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    roles: [
      { id: 'role-123', name: 'INVESTOR', description: 'Investor role', isActive: true, isDefault: false, createdAt: new Date(), updatedAt: new Date() },
    ],
    permissions: ['VIEW_PORTFOLIO', 'VIEW_DOCUMENTS'],
  };

  const mockContext = (user?: AuthenticatedUser, isPublic = false) => {
    const request = { user };
    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => ({ name: 'testHandler' }),
      getClass: () => ({ name: 'TestController' }),
    } as ExecutionContext;

    return mockExecutionContext;
  };

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const mockRoleService = {
    getUserRoles: jest.fn(),
  };

  const mockPermissionService = {};

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleGuard,
        { provide: Reflector, useValue: mockReflector },
        { provide: RoleService, useValue: mockRoleService },
        { provide: PermissionService, useValue: mockPermissionService },
      ],
    }).compile();

    guard = module.get<RoleGuard>(RoleGuard);
    reflector = module.get<Reflector>(Reflector);
    roleService = module.get<RoleService>(RoleService);
    permissionService = module.get<PermissionService>(PermissionService);

    // Mock the logger instance directly
    guard['logger'] = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    } as any;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Public routes', () => {
    it('should allow access to public routes', async () => {
      const context = mockContext();
      mockReflector.getAllAndOverride.mockReturnValue(true);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('should proceed with authorization checks for non-public routes', async () => {
      const context = mockContext(mockUser);
      mockReflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValue(undefined); // All other decorator checks
      mockRoleService.getUserRoles.mockResolvedValue(mockUserWithRoles);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });
  });

  describe('Authentication checks', () => {
    it('should throw UnauthorizedException when user is not authenticated', async () => {
      const context = mockContext(); // No user
      mockReflector.getAllAndOverride.mockReturnValue(false); // Not public

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('should throw UnauthorizedException when user is null', async () => {
      const context = mockContext(null as any);
      mockReflector.getAllAndOverride.mockReturnValue(false);

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('No requirements (open access)', () => {
    it('should allow access when no role or permission requirements are set', async () => {
      const context = mockContext(mockUser);
      mockReflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(undefined) // REQUIRE_ROLES_KEY
        .mockReturnValueOnce(undefined) // REQUIRE_ANY_ROLE_KEY
        .mockReturnValueOnce(undefined) // REQUIRE_PERMISSIONS_KEY
        .mockReturnValueOnce(undefined); // REQUIRE_ANY_PERMISSION_KEY

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when requirements are empty arrays', async () => {
      const context = mockContext(mockUser);
      mockReflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce([]) // REQUIRE_ROLES_KEY
        .mockReturnValueOnce([]) // REQUIRE_ANY_ROLE_KEY
        .mockReturnValueOnce([]) // REQUIRE_PERMISSIONS_KEY
        .mockReturnValueOnce([]); // REQUIRE_ANY_PERMISSION_KEY

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });
  });

  describe('Role requirements - RequireRoles (ALL)', () => {
    beforeEach(() => {
      mockReflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(['INVESTOR', 'ANALYST']) // REQUIRE_ROLES_KEY
        .mockReturnValueOnce(undefined) // REQUIRE_ANY_ROLE_KEY
        .mockReturnValueOnce(undefined) // REQUIRE_PERMISSIONS_KEY
        .mockReturnValueOnce(undefined); // REQUIRE_ANY_PERMISSION_KEY
    });

    it('should allow access when user has all required roles', async () => {
      const context = mockContext(mockUser);
      const userWithMultipleRoles = {
        ...mockUserWithRoles,
        roles: [
          { id: 'role-123', name: 'INVESTOR', description: 'Investor role', isActive: true, isDefault: false, createdAt: new Date(), updatedAt: new Date() },
          { id: 'role-456', name: 'ANALYST', description: 'Analyst role', isActive: true, isDefault: false, createdAt: new Date(), updatedAt: new Date() },
        ],
      };
      mockRoleService.getUserRoles.mockResolvedValue(userWithMultipleRoles);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(context.switchToHttp().getRequest().user.roles).toEqual(['INVESTOR', 'ANALYST']);
    });

    it('should deny access when user is missing required roles', async () => {
      const context = mockContext(mockUser);
      mockRoleService.getUserRoles.mockResolvedValue(mockUserWithRoles);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should deny access when user has no roles', async () => {
      const context = mockContext(mockUser);
      const userWithoutRoles = { ...mockUserWithRoles, roles: [] };
      mockRoleService.getUserRoles.mockResolvedValue(userWithoutRoles);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Role requirements - RequireAnyRole (ANY)', () => {
    beforeEach(() => {
      mockReflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(undefined) // REQUIRE_ROLES_KEY
        .mockReturnValueOnce(['ADMIN', 'FUND_MANAGER']) // REQUIRE_ANY_ROLE_KEY
        .mockReturnValueOnce(undefined) // REQUIRE_PERMISSIONS_KEY
        .mockReturnValueOnce(undefined); // REQUIRE_ANY_PERMISSION_KEY
    });

    it('should allow access when user has one of the required roles', async () => {
      const context = mockContext(mockUser);
      const userWithAdminRole = {
        ...mockUserWithRoles,
        roles: [
          { id: 'role-789', name: 'ADMIN', description: 'Admin role', isActive: true, isDefault: false, createdAt: new Date(), updatedAt: new Date() },
        ],
      };
      mockRoleService.getUserRoles.mockResolvedValue(userWithAdminRole);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when user has multiple of the required roles', async () => {
      const context = mockContext(mockUser);
      const userWithMultipleRequiredRoles = {
        ...mockUserWithRoles,
        roles: [
          { id: 'role-789', name: 'ADMIN', description: 'Admin role', isActive: true, isDefault: false, createdAt: new Date(), updatedAt: new Date() },
          { id: 'role-101', name: 'FUND_MANAGER', description: 'Fund Manager role', isActive: true, isDefault: false, createdAt: new Date(), updatedAt: new Date() },
        ],
      };
      mockRoleService.getUserRoles.mockResolvedValue(userWithMultipleRequiredRoles);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny access when user has none of the required roles', async () => {
      const context = mockContext(mockUser);
      mockRoleService.getUserRoles.mockResolvedValue(mockUserWithRoles);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Permission requirements - RequirePermissions (ALL)', () => {
    beforeEach(() => {
      mockReflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(undefined) // REQUIRE_ROLES_KEY
        .mockReturnValueOnce(undefined) // REQUIRE_ANY_ROLE_KEY
        .mockReturnValueOnce(['VIEW_PORTFOLIO', 'EDIT_PORTFOLIO']) // REQUIRE_PERMISSIONS_KEY
        .mockReturnValueOnce(undefined); // REQUIRE_ANY_PERMISSION_KEY
    });

    it('should allow access when user has all required permissions', async () => {
      const context = mockContext(mockUser);
      const userWithAllPermissions = {
        ...mockUserWithRoles,
        permissions: ['VIEW_PORTFOLIO', 'EDIT_PORTFOLIO', 'VIEW_DOCUMENTS'],
      };
      mockRoleService.getUserRoles.mockResolvedValue(userWithAllPermissions);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(context.switchToHttp().getRequest().user.permissions).toEqual(['VIEW_PORTFOLIO', 'EDIT_PORTFOLIO', 'VIEW_DOCUMENTS']);
    });

    it('should deny access when user is missing required permissions', async () => {
      const context = mockContext(mockUser);
      mockRoleService.getUserRoles.mockResolvedValue(mockUserWithRoles);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should deny access when user has no permissions', async () => {
      const context = mockContext(mockUser);
      const userWithoutPermissions = { ...mockUserWithRoles, permissions: [] };
      mockRoleService.getUserRoles.mockResolvedValue(userWithoutPermissions);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Permission requirements - RequireAnyPermission (ANY)', () => {
    beforeEach(() => {
      mockReflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(undefined) // REQUIRE_ROLES_KEY
        .mockReturnValueOnce(undefined) // REQUIRE_ANY_ROLE_KEY
        .mockReturnValueOnce(undefined) // REQUIRE_PERMISSIONS_KEY
        .mockReturnValueOnce(['ADMIN_ACCESS', 'SUPER_USER']); // REQUIRE_ANY_PERMISSION_KEY
    });

    it('should allow access when user has one of the required permissions', async () => {
      const context = mockContext(mockUser);
      const userWithAdminAccess = {
        ...mockUserWithRoles,
        permissions: ['ADMIN_ACCESS', 'VIEW_PORTFOLIO'],
      };
      mockRoleService.getUserRoles.mockResolvedValue(userWithAdminAccess);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny access when user has none of the required permissions', async () => {
      const context = mockContext(mockUser);
      mockRoleService.getUserRoles.mockResolvedValue(mockUserWithRoles);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Complex requirements combinations', () => {
    it('should allow access when user meets all role and permission requirements', async () => {
      const context = mockContext(mockUser);
      mockReflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(['INVESTOR']) // REQUIRE_ROLES_KEY
        .mockReturnValueOnce(undefined) // REQUIRE_ANY_ROLE_KEY
        .mockReturnValueOnce(['VIEW_PORTFOLIO']) // REQUIRE_PERMISSIONS_KEY
        .mockReturnValueOnce(undefined); // REQUIRE_ANY_PERMISSION_KEY

      mockRoleService.getUserRoles.mockResolvedValue(mockUserWithRoles);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny access when user meets role but not permission requirements', async () => {
      const context = mockContext(mockUser);
      mockReflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(['INVESTOR']) // REQUIRE_ROLES_KEY
        .mockReturnValueOnce(undefined) // REQUIRE_ANY_ROLE_KEY
        .mockReturnValueOnce(['ADMIN_ACCESS']) // REQUIRE_PERMISSIONS_KEY
        .mockReturnValueOnce(undefined); // REQUIRE_ANY_PERMISSION_KEY

      mockRoleService.getUserRoles.mockResolvedValue(mockUserWithRoles);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should deny access when user meets permission but not role requirements', async () => {
      const context = mockContext(mockUser);
      mockReflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(['ADMIN']) // REQUIRE_ROLES_KEY
        .mockReturnValueOnce(undefined) // REQUIRE_ANY_ROLE_KEY
        .mockReturnValueOnce(['VIEW_PORTFOLIO']) // REQUIRE_PERMISSIONS_KEY
        .mockReturnValueOnce(undefined); // REQUIRE_ANY_PERMISSION_KEY

      mockRoleService.getUserRoles.mockResolvedValue(mockUserWithRoles);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Error handling', () => {
    it('should handle RoleService errors and throw ForbiddenException', async () => {
      const context = mockContext(mockUser);
      mockReflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(['INVESTOR']) // REQUIRE_ROLES_KEY
        .mockReturnValue(undefined);

      mockRoleService.getUserRoles.mockRejectedValue(new Error('Database connection failed'));

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should preserve ForbiddenException when it is the original error', async () => {
      const context = mockContext(mockUser);
      mockReflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(['ADMIN']) // REQUIRE_ROLES_KEY
        .mockReturnValue(undefined);

      mockRoleService.getUserRoles.mockResolvedValue(mockUserWithRoles);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should handle null permissions gracefully', async () => {
      const context = mockContext(mockUser);
      mockReflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(undefined) // REQUIRE_ROLES_KEY
        .mockReturnValueOnce(undefined) // REQUIRE_ANY_ROLE_KEY
        .mockReturnValueOnce(['VIEW_PORTFOLIO']) // REQUIRE_PERMISSIONS_KEY
        .mockReturnValueOnce(undefined); // REQUIRE_ANY_PERMISSION_KEY

      const userWithNullPermissions = { ...mockUserWithRoles, permissions: null };
      mockRoleService.getUserRoles.mockResolvedValue(userWithNullPermissions);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('User context updates', () => {
    it('should update request user object with roles and permissions', async () => {
      const testUser = { ...mockUser }; // Create a copy so it can be modified
      const context = mockContext(testUser);
      mockReflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(['INVESTOR']) // REQUIRE_ROLES_KEY - add requirement to trigger getUserRoles
        .mockReturnValueOnce(undefined) // REQUIRE_ANY_ROLE_KEY
        .mockReturnValueOnce(undefined) // REQUIRE_PERMISSIONS_KEY
        .mockReturnValueOnce(undefined); // REQUIRE_ANY_PERMISSION_KEY

      mockRoleService.getUserRoles.mockResolvedValue(mockUserWithRoles);

      await guard.canActivate(context);

      const requestUser = context.switchToHttp().getRequest().user;
      expect(requestUser.roles).toEqual(['INVESTOR']);
      expect(requestUser.permissions).toEqual(['VIEW_PORTFOLIO', 'VIEW_DOCUMENTS']);
    });

    it('should handle missing permissions array in user roles response', async () => {
      const testUser = { ...mockUser }; // Create a copy so it can be modified
      const context = mockContext(testUser);
      mockReflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(['INVESTOR']) // REQUIRE_ROLES_KEY - add requirement to trigger getUserRoles
        .mockReturnValueOnce(undefined) // REQUIRE_ANY_ROLE_KEY
        .mockReturnValueOnce(undefined) // REQUIRE_PERMISSIONS_KEY
        .mockReturnValueOnce(undefined); // REQUIRE_ANY_PERMISSION_KEY

      const userWithoutPermissionsArray = { ...mockUserWithRoles };
      delete userWithoutPermissionsArray.permissions;
      mockRoleService.getUserRoles.mockResolvedValue(userWithoutPermissionsArray);

      await guard.canActivate(context);

      const requestUser = context.switchToHttp().getRequest().user;
      expect(requestUser.permissions).toEqual([]);
    });
  });

  describe('Logging', () => {
    it('should log successful authorization', async () => {
      const context = mockContext(mockUser);
      // Get the actual logger instance from the guard
      const loggerSpy = guard['logger'].log as jest.Mock;

      mockReflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(['INVESTOR']) // REQUIRE_ROLES_KEY - add requirement to trigger getUserRoles
        .mockReturnValueOnce(undefined) // REQUIRE_ANY_ROLE_KEY
        .mockReturnValueOnce(undefined) // REQUIRE_PERMISSIONS_KEY
        .mockReturnValueOnce(undefined); // REQUIRE_ANY_PERMISSION_KEY

      mockRoleService.getUserRoles.mockResolvedValue(mockUserWithRoles);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockRoleService.getUserRoles).toHaveBeenCalledWith('user-123');
      expect(loggerSpy).toHaveBeenCalledWith('User user-123 authorized for TestController.testHandler');
    });

    it('should log warning when user is denied access due to missing roles', async () => {
      const context = mockContext(mockUser);
      const loggerSpy = guard['logger'].warn as jest.Mock;

      mockReflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(['ADMIN']) // REQUIRE_ROLES_KEY
        .mockReturnValue(undefined);

      mockRoleService.getUserRoles.mockResolvedValue(mockUserWithRoles);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);

      expect(loggerSpy).toHaveBeenCalledWith(
        'User user-123 denied access. Required roles: [ADMIN], User roles: [INVESTOR]'
      );
    });

    it('should log warning when user is denied access due to missing permissions', async () => {
      const context = mockContext(mockUser);
      const loggerSpy = guard['logger'].warn as jest.Mock;

      mockReflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(undefined) // REQUIRE_ROLES_KEY
        .mockReturnValueOnce(undefined) // REQUIRE_ANY_ROLE_KEY
        .mockReturnValueOnce(['ADMIN_ACCESS']) // REQUIRE_PERMISSIONS_KEY
        .mockReturnValueOnce(undefined); // REQUIRE_ANY_PERMISSION_KEY

      mockRoleService.getUserRoles.mockResolvedValue(mockUserWithRoles);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);

      expect(loggerSpy).toHaveBeenCalledWith(
        'User user-123 denied access. Required permissions: [ADMIN_ACCESS], User permissions: [VIEW_PORTFOLIO, VIEW_DOCUMENTS]'
      );
    });

    it('should log error when exception occurs during role checking', async () => {
      const context = mockContext(mockUser);
      const loggerSpy = guard['logger'].error as jest.Mock;

      mockReflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(['INVESTOR']) // REQUIRE_ROLES_KEY
        .mockReturnValue(undefined);

      const dbError = new Error('Database connection failed');
      mockRoleService.getUserRoles.mockRejectedValue(dbError);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);

      expect(loggerSpy).toHaveBeenCalledWith(
        'Error checking user roles/permissions: Database connection failed',
        dbError.stack
      );
    });
  });
});