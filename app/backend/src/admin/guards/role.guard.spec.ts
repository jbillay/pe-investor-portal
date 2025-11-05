import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleGuard } from './role.guard';
import { RoleService } from '../services/role.service';
import { PermissionService } from '../services/permission.service';
import {
  REQUIRE_ROLES_KEY,
  REQUIRE_ANY_ROLE_KEY,
  REQUIRE_PERMISSIONS_KEY,
  REQUIRE_ANY_PERMISSION_KEY,
} from '../decorators/role.decorator';
import { IS_PUBLIC_KEY } from '../../auth/decorators/public.decorator';

describe('RoleGuard', () => {
  let guard: RoleGuard;
  let reflector: jest.Mocked<Reflector>;
  let roleService: jest.Mocked<RoleService>;
  let permissionService: jest.Mocked<PermissionService>;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const mockRoleService = {
    getUserRoles: jest.fn(),
  };

  const mockPermissionService = {};

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
    reflector = module.get(Reflector) as jest.Mocked<Reflector>;
    roleService = module.get(RoleService) as jest.Mocked<RoleService>;
    permissionService = module.get(PermissionService) as jest.Mocked<PermissionService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockExecutionContext = (user?: any): ExecutionContext => {
    return {
      getHandler: jest.fn().mockReturnValue({ name: 'testHandler' }),
      getClass: jest.fn().mockReturnValue({ name: 'TestController' }),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user,
        }),
      }),
    } as any;
  };

  describe('Public routes', () => {
    it('should allow access to public routes', async () => {
      // Arrange
      const context = createMockExecutionContext();
      reflector.getAllAndOverride.mockReturnValue(true); // IS_PUBLIC_KEY = true

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(roleService.getUserRoles).not.toHaveBeenCalled();
    });
  });

  describe('Authentication checks', () => {
    it('should throw UnauthorizedException when user is not authenticated', async () => {
      // Arrange
      const context = createMockExecutionContext(undefined);
      reflector.getAllAndOverride.mockReturnValue(false); // IS_PUBLIC_KEY = false

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(context)).rejects.toThrow('User not authenticated');
    });

    it('should allow access when no role or permission requirements', async () => {
      // Arrange
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const context = createMockExecutionContext(mockUser);
      reflector.getAllAndOverride.mockReturnValue(undefined); // No requirements

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(roleService.getUserRoles).not.toHaveBeenCalled();
    });
  });

  describe('Role checks - REQUIRE_ROLES (ALL required)', () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };

    it('should allow access when user has all required roles', async () => {
      // Arrange
      const context = createMockExecutionContext(mockUser);
      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(['ADMIN', 'MANAGER']) // REQUIRE_ROLES_KEY
        .mockReturnValueOnce(undefined) // REQUIRE_ANY_ROLE_KEY
        .mockReturnValueOnce(undefined) // REQUIRE_PERMISSIONS_KEY
        .mockReturnValueOnce(undefined); // REQUIRE_ANY_PERMISSION_KEY

      roleService.getUserRoles.mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email,
        firstName: 'John',
        lastName: 'Doe',
        roles: [
          { id: '1', name: 'ADMIN', description: 'Admin', isActive: true, isDefault: false, createdAt: new Date(), updatedAt: new Date() },
          { id: '2', name: 'MANAGER', description: 'Manager', isActive: true, isDefault: false, createdAt: new Date(), updatedAt: new Date() },
        ],
        permissions: [],
      });

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(roleService.getUserRoles).toHaveBeenCalledWith(mockUser.id);
    });

    it('should deny access when user lacks some required roles', async () => {
      // Arrange
      const context = createMockExecutionContext(mockUser);
      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(['ADMIN', 'SUPER_ADMIN']) // REQUIRE_ROLES_KEY
        .mockReturnValueOnce(undefined) // REQUIRE_ANY_ROLE_KEY
        .mockReturnValueOnce(undefined) // REQUIRE_PERMISSIONS_KEY
        .mockReturnValueOnce(undefined); // REQUIRE_ANY_PERMISSION_KEY

      roleService.getUserRoles.mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email,
        firstName: 'John',
        lastName: 'Doe',
        roles: [
          { id: '1', name: 'ADMIN', description: 'Admin', isActive: true, isDefault: false, createdAt: new Date(), updatedAt: new Date() },
        ],
        permissions: [],
      });

      // Act & Assert
      try {
        await guard.canActivate(context);
        fail('Should have thrown ForbiddenException');
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException);
        expect(error.message).toContain('Insufficient permissions. Required roles: ADMIN, SUPER_ADMIN');
      }
    });
  });

  describe('Role checks - REQUIRE_ANY_ROLE (at least ONE required)', () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };

    it('should allow access when user has at least one of the required roles', async () => {
      // Arrange
      const context = createMockExecutionContext(mockUser);
      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(undefined) // REQUIRE_ROLES_KEY
        .mockReturnValueOnce(['ADMIN', 'MANAGER', 'SUPERVISOR']) // REQUIRE_ANY_ROLE_KEY
        .mockReturnValueOnce(undefined) // REQUIRE_PERMISSIONS_KEY
        .mockReturnValueOnce(undefined); // REQUIRE_ANY_PERMISSION_KEY

      roleService.getUserRoles.mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email,
        firstName: 'John',
        lastName: 'Doe',
        roles: [
          { id: '2', name: 'MANAGER', description: 'Manager', isActive: true, isDefault: false, createdAt: new Date(), updatedAt: new Date() },
        ],
        permissions: [],
      });

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    it('should deny access when user has none of the required roles', async () => {
      // Arrange
      const context = createMockExecutionContext(mockUser);
      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(undefined) // REQUIRE_ROLES_KEY
        .mockReturnValueOnce(['ADMIN', 'SUPER_ADMIN']) // REQUIRE_ANY_ROLE_KEY
        .mockReturnValueOnce(undefined) // REQUIRE_PERMISSIONS_KEY
        .mockReturnValueOnce(undefined); // REQUIRE_ANY_PERMISSION_KEY

      roleService.getUserRoles.mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email,
        firstName: 'John',
        lastName: 'Doe',
        roles: [
          { id: '3', name: 'USER', description: 'User', isActive: true, isDefault: false, createdAt: new Date(), updatedAt: new Date() },
        ],
        permissions: [],
      });

      // Act & Assert
      try {
        await guard.canActivate(context);
        fail('Should have thrown ForbiddenException');
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException);
        expect(error.message).toContain('Insufficient permissions. Required any of roles: ADMIN, SUPER_ADMIN');
      }
    });
  });

  describe('Permission checks - REQUIRE_PERMISSIONS (ALL required)', () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };

    it('should allow access when user has all required permissions', async () => {
      // Arrange
      const context = createMockExecutionContext(mockUser);
      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(undefined) // REQUIRE_ROLES_KEY
        .mockReturnValueOnce(undefined) // REQUIRE_ANY_ROLE_KEY
        .mockReturnValueOnce(['USER:READ', 'USER:CREATE']) // REQUIRE_PERMISSIONS_KEY
        .mockReturnValueOnce(undefined); // REQUIRE_ANY_PERMISSION_KEY

      roleService.getUserRoles.mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email,
        firstName: 'John',
        lastName: 'Doe',
        roles: [],
        permissions: ['USER:READ', 'USER:CREATE', 'USER:UPDATE'],
      });

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    it('should allow access with permission format normalization', async () => {
      // Arrange
      const context = createMockExecutionContext(mockUser);
      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(undefined) // REQUIRE_ROLES_KEY
        .mockReturnValueOnce(undefined) // REQUIRE_ANY_ROLE_KEY
        .mockReturnValueOnce(['USER_READ', 'USER_CREATE']) // REQUIRE_PERMISSIONS_KEY (underscore format)
        .mockReturnValueOnce(undefined); // REQUIRE_ANY_PERMISSION_KEY

      roleService.getUserRoles.mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email,
        firstName: 'John',
        lastName: 'Doe',
        roles: [],
        permissions: ['USER:READ', 'USER:CREATE'], // colon format
      });

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    it('should deny access when user lacks some required permissions', async () => {
      // Arrange
      const context = createMockExecutionContext(mockUser);
      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(undefined) // REQUIRE_ROLES_KEY
        .mockReturnValueOnce(undefined) // REQUIRE_ANY_ROLE_KEY
        .mockReturnValueOnce(['USER:READ', 'USER:DELETE']) // REQUIRE_PERMISSIONS_KEY
        .mockReturnValueOnce(undefined); // REQUIRE_ANY_PERMISSION_KEY

      roleService.getUserRoles.mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email,
        firstName: 'John',
        lastName: 'Doe',
        roles: [],
        permissions: ['USER:READ'],
      });

      // Act & Assert
      try {
        await guard.canActivate(context);
        fail('Should have thrown ForbiddenException');
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException);
        expect(error.message).toContain('Insufficient permissions. Required permissions: USER:READ, USER:DELETE');
      }
    });
  });

  describe('Permission checks - REQUIRE_ANY_PERMISSION (at least ONE required)', () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };

    it('should allow access when user has at least one of the required permissions', async () => {
      // Arrange
      const context = createMockExecutionContext(mockUser);
      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(undefined) // REQUIRE_ROLES_KEY
        .mockReturnValueOnce(undefined) // REQUIRE_ANY_ROLE_KEY
        .mockReturnValueOnce(undefined) // REQUIRE_PERMISSIONS_KEY
        .mockReturnValueOnce(['USER:DELETE', 'USER:ARCHIVE', 'USER:DISABLE']); // REQUIRE_ANY_PERMISSION_KEY

      roleService.getUserRoles.mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email,
        firstName: 'John',
        lastName: 'Doe',
        roles: [],
        permissions: ['USER:READ', 'USER:ARCHIVE'],
      });

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    it('should deny access when user has none of the required permissions', async () => {
      // Arrange
      const context = createMockExecutionContext(mockUser);
      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(undefined) // REQUIRE_ROLES_KEY
        .mockReturnValueOnce(undefined) // REQUIRE_ANY_ROLE_KEY
        .mockReturnValueOnce(undefined) // REQUIRE_PERMISSIONS_KEY
        .mockReturnValueOnce(['USER:DELETE', 'USER:ARCHIVE']); // REQUIRE_ANY_PERMISSION_KEY

      roleService.getUserRoles.mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email,
        firstName: 'John',
        lastName: 'Doe',
        roles: [],
        permissions: ['USER:READ', 'USER:CREATE'],
      });

      // Act & Assert
      try {
        await guard.canActivate(context);
        fail('Should have thrown ForbiddenException');
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException);
        expect(error.message).toContain('Insufficient permissions. Required any of permissions: USER:DELETE, USER:ARCHIVE');
      }
    });
  });

  describe('Combined checks', () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };

    it('should allow access when user has both required roles and permissions', async () => {
      // Arrange
      const context = createMockExecutionContext(mockUser);
      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(['ADMIN']) // REQUIRE_ROLES_KEY
        .mockReturnValueOnce(undefined) // REQUIRE_ANY_ROLE_KEY
        .mockReturnValueOnce(['USER:READ']) // REQUIRE_PERMISSIONS_KEY
        .mockReturnValueOnce(undefined); // REQUIRE_ANY_PERMISSION_KEY

      roleService.getUserRoles.mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email,
        firstName: 'John',
        lastName: 'Doe',
        roles: [
          { id: '1', name: 'ADMIN', description: 'Admin', isActive: true, isDefault: false, createdAt: new Date(), updatedAt: new Date() },
        ],
        permissions: ['USER:READ', 'USER:CREATE'],
      });

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    it('should update request user object with roles and permissions', async () => {
      // Arrange
      const mockRequest = { user: mockUser };
      const context = {
        getHandler: jest.fn().mockReturnValue({ name: 'testHandler' }),
        getClass: jest.fn().mockReturnValue({ name: 'TestController' }),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as any;

      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(['ADMIN']) // REQUIRE_ROLES_KEY
        .mockReturnValueOnce(undefined) // REQUIRE_ANY_ROLE_KEY
        .mockReturnValueOnce(undefined) // REQUIRE_PERMISSIONS_KEY
        .mockReturnValueOnce(undefined); // REQUIRE_ANY_PERMISSION_KEY

      roleService.getUserRoles.mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email,
        firstName: 'John',
        lastName: 'Doe',
        roles: [
          { id: '1', name: 'ADMIN', description: 'Admin', isActive: true, isDefault: false, createdAt: new Date(), updatedAt: new Date() },
        ],
        permissions: ['USER:READ'],
      });

      // Act
      await guard.canActivate(context);

      // Assert
      expect(mockRequest.user.roles).toEqual(['ADMIN']);
      expect(mockRequest.user.permissions).toEqual(['USER:READ']);
    });
  });

  describe('Error handling', () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };

    it('should rethrow ForbiddenException from role check', async () => {
      // Arrange
      const context = createMockExecutionContext(mockUser);
      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(['SUPER_ADMIN']) // REQUIRE_ROLES_KEY
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(undefined);

      roleService.getUserRoles.mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email,
        firstName: 'John',
        lastName: 'Doe',
        roles: [
          { id: '3', name: 'USER', description: 'User', isActive: true, isDefault: false, createdAt: new Date(), updatedAt: new Date() },
        ],
        permissions: [],
      });

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should wrap generic errors in ForbiddenException', async () => {
      // Arrange
      const context = createMockExecutionContext(mockUser);
      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(['ADMIN']) // REQUIRE_ROLES_KEY
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(undefined);

      roleService.getUserRoles.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      try {
        await guard.canActivate(context);
        fail('Should have thrown ForbiddenException');
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException);
        expect(error.message).toContain('Error verifying user permissions');
      }
    });
  });
});
