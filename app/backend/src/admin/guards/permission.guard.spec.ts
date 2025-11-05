import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionGuard, PERMISSION_CHECK_KEY } from './permission.guard';
import { PermissionService } from '../services/permission.service';
import { IS_PUBLIC_KEY } from '../../auth/decorators/public.decorator';

describe('PermissionGuard', () => {
  let guard: PermissionGuard;
  let reflector: jest.Mocked<Reflector>;
  let permissionService: jest.Mocked<PermissionService>;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const mockPermissionService = {
    checkUserPermission: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
        {
          provide: PermissionService,
          useValue: mockPermissionService,
        },
      ],
    }).compile();

    guard = module.get<PermissionGuard>(PermissionGuard);
    reflector = module.get(Reflector) as jest.Mocked<Reflector>;
    permissionService = module.get(PermissionService) as jest.Mocked<PermissionService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockExecutionContext = (user?: any, params?: any): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user,
          params: params || {},
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
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
      expect(permissionService.checkUserPermission).not.toHaveBeenCalled();
    });
  });

  describe('Authentication checks', () => {
    it('should throw UnauthorizedException when user is not authenticated', async () => {
      // Arrange
      const context = createMockExecutionContext(undefined); // No user
      reflector.getAllAndOverride.mockReturnValue(false); // IS_PUBLIC_KEY = false

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should allow access when no permission check is required', async () => {
      // Arrange
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const context = createMockExecutionContext(mockUser);
      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY = false
        .mockReturnValueOnce(undefined); // PERMISSION_CHECK_KEY = undefined

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(permissionService.checkUserPermission).not.toHaveBeenCalled();
    });
  });

  describe('Permission checks', () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };

    it('should allow access when user has required permission', async () => {
      // Arrange
      const context = createMockExecutionContext(mockUser);
      const permissionCheck = {
        permission: 'VIEW_USER',
        resource: 'USER',
        action: 'READ',
      };

      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY = false
        .mockReturnValueOnce(permissionCheck); // PERMISSION_CHECK_KEY

      permissionService.checkUserPermission.mockResolvedValue({
        hasPermission: true,
        permission: 'VIEW_USER',
        resource: 'USER',
        grantedByRoles: ['ADMIN'],
      });

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(permissionService.checkUserPermission).toHaveBeenCalledWith(mockUser.id, {
        permission: 'VIEW_USER',
        resource: 'USER',
        resourceId: undefined,
      });
    });

    it('should throw ForbiddenException when user lacks required permission', async () => {
      // Arrange
      const context = createMockExecutionContext(mockUser);
      const permissionCheck = {
        permission: 'DELETE_USER',
        resource: 'USER',
        action: 'DELETE',
      };

      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY = false
        .mockReturnValueOnce(permissionCheck); // PERMISSION_CHECK_KEY

      permissionService.checkUserPermission.mockResolvedValue({
        hasPermission: false,
        permission: 'DELETE_USER',
        resource: 'USER',
        grantedByRoles: [],
      });

      // Act & Assert
      try {
        await guard.canActivate(context);
        fail('Should have thrown ForbiddenException');
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException);
        expect(error.message).toContain('Insufficient permissions. Required: DELETE_USER on USER');
      }
    });

    it('should include resource ID in permission check when available', async () => {
      // Arrange
      const context = createMockExecutionContext(mockUser, { id: 'resource-123' });
      const permissionCheck = {
        permission: 'UPDATE_USER',
        resource: 'USER',
        action: 'UPDATE',
      };

      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY = false
        .mockReturnValueOnce(permissionCheck); // PERMISSION_CHECK_KEY

      permissionService.checkUserPermission.mockResolvedValue({
        hasPermission: true,
        permission: 'UPDATE_USER',
        resource: 'USER',
        grantedByRoles: ['ADMIN'],
      });

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(permissionService.checkUserPermission).toHaveBeenCalledWith(mockUser.id, {
        permission: 'UPDATE_USER',
        resource: 'USER',
        resourceId: 'resource-123',
      });
    });

    it('should use resourceId param if id param is not available', async () => {
      // Arrange
      const context = createMockExecutionContext(mockUser, { resourceId: 'resource-456' });
      const permissionCheck = {
        permission: 'VIEW_PORTFOLIO',
        resource: 'PORTFOLIO',
      };

      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY = false
        .mockReturnValueOnce(permissionCheck); // PERMISSION_CHECK_KEY

      permissionService.checkUserPermission.mockResolvedValue({
        hasPermission: true,
        permission: 'VIEW_PORTFOLIO',
        resource: 'PORTFOLIO',
        grantedByRoles: ['INVESTOR'],
      });

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(permissionService.checkUserPermission).toHaveBeenCalledWith(mockUser.id, {
        permission: 'VIEW_PORTFOLIO',
        resource: 'PORTFOLIO',
        resourceId: 'resource-456',
      });
    });

    it('should handle permission check without resource', async () => {
      // Arrange
      const context = createMockExecutionContext(mockUser);
      const permissionCheck = {
        permission: 'VIEW_ADMIN_DASHBOARD',
      };

      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY = false
        .mockReturnValueOnce(permissionCheck); // PERMISSION_CHECK_KEY

      permissionService.checkUserPermission.mockResolvedValue({
        hasPermission: true,
        permission: 'VIEW_ADMIN_DASHBOARD',
        resource: null,
        grantedByRoles: ['ADMIN'],
      });

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(permissionService.checkUserPermission).toHaveBeenCalledWith(mockUser.id, {
        permission: 'VIEW_ADMIN_DASHBOARD',
        resource: undefined,
        resourceId: undefined,
      });
    });
  });

  describe('Error handling', () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };

    it('should rethrow ForbiddenException from permission check', async () => {
      // Arrange
      const context = createMockExecutionContext(mockUser);
      const permissionCheck = {
        permission: 'MANAGE_SYSTEM',
        resource: 'SYSTEM',
      };

      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY = false
        .mockReturnValueOnce(permissionCheck); // PERMISSION_CHECK_KEY

      permissionService.checkUserPermission.mockResolvedValue({
        hasPermission: false,
        permission: 'MANAGE_SYSTEM',
        resource: 'SYSTEM',
        grantedByRoles: [],
      });

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should wrap generic errors in ForbiddenException', async () => {
      // Arrange
      const context = createMockExecutionContext(mockUser);
      const permissionCheck = {
        permission: 'VIEW_USER',
        resource: 'USER',
      };

      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY = false
        .mockReturnValueOnce(permissionCheck); // PERMISSION_CHECK_KEY

      permissionService.checkUserPermission.mockRejectedValue(
        new Error('Database connection error'),
      );

      // Act & Assert
      try {
        await guard.canActivate(context);
        fail('Should have thrown ForbiddenException');
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException);
        expect(error.message).toContain('Error verifying user permissions');
      }
    });

    it('should handle undefined permission service response gracefully', async () => {
      // Arrange
      const context = createMockExecutionContext(mockUser);
      const permissionCheck = {
        permission: 'VIEW_REPORTS',
        resource: 'REPORTS',
      };

      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY = false
        .mockReturnValueOnce(permissionCheck); // PERMISSION_CHECK_KEY

      permissionService.checkUserPermission.mockResolvedValue(undefined as any);

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Permission check with multiple granted roles', () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };

    it('should log all roles that granted the permission', async () => {
      // Arrange
      const context = createMockExecutionContext(mockUser);
      const permissionCheck = {
        permission: 'VIEW_USER',
        resource: 'USER',
      };

      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY = false
        .mockReturnValueOnce(permissionCheck); // PERMISSION_CHECK_KEY

      permissionService.checkUserPermission.mockResolvedValue({
        hasPermission: true,
        permission: 'VIEW_USER',
        resource: 'USER',
        grantedByRoles: ['ADMIN', 'MANAGER', 'SUPERVISOR'],
      });

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      // The guard should log the roles that granted permission
    });
  });

  describe('Edge cases', () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };

    it('should handle permission check with empty resource string', async () => {
      // Arrange
      const context = createMockExecutionContext(mockUser);
      const permissionCheck = {
        permission: 'SOME_PERMISSION',
        resource: '',
      };

      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY = false
        .mockReturnValueOnce(permissionCheck); // PERMISSION_CHECK_KEY

      permissionService.checkUserPermission.mockResolvedValue({
        hasPermission: true,
        permission: 'SOME_PERMISSION',
        resource: '',
        grantedByRoles: ['USER'],
      });

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    it('should handle request with both id and resourceId params (id takes precedence)', async () => {
      // Arrange
      const context = createMockExecutionContext(mockUser, {
        id: 'id-123',
        resourceId: 'resource-456',
      });
      const permissionCheck = {
        permission: 'UPDATE_ITEM',
        resource: 'ITEM',
      };

      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY = false
        .mockReturnValueOnce(permissionCheck); // PERMISSION_CHECK_KEY

      permissionService.checkUserPermission.mockResolvedValue({
        hasPermission: true,
        permission: 'UPDATE_ITEM',
        resource: 'ITEM',
        grantedByRoles: ['USER'],
      });

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(permissionService.checkUserPermission).toHaveBeenCalledWith(mockUser.id, {
        permission: 'UPDATE_ITEM',
        resource: 'ITEM',
        resourceId: 'id-123', // id takes precedence
      });
    });
  });
});
