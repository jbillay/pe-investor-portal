import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DynamicPermissionGuard, DYNAMIC_PERMISSION_KEY } from './dynamic-permission.guard';
import { PrismaService } from '../../database/prisma.service';

describe('DynamicPermissionGuard', () => {
  let guard: DynamicPermissionGuard;
  let reflector: jest.Mocked<Reflector>;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockReflector = {
      getAllAndOverride: jest.fn(),
    };

    const mockPrismaService = {
      dataObject: {
        findUnique: jest.fn(),
      },
      userRole: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DynamicPermissionGuard,
        { provide: Reflector, useValue: mockReflector },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    guard = module.get<DynamicPermissionGuard>(DynamicPermissionGuard);
    reflector = module.get(Reflector) as any;
    prismaService = module.get(PrismaService) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockContext = (user: any, dataKey?: string): ExecutionContext => {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          params: { dataKey },
        }),
      }),
    } as any;
  };

  describe('canActivate', () => {
    it('should allow access when no permission requirement is set', async () => {
      reflector.getAllAndOverride.mockReturnValue(null);

      const context = createMockContext({ id: 'user-123' }, 'fund');
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(DYNAMIC_PERMISSION_KEY, [
        {},
        {},
      ]);
    });

    it('should throw ForbiddenException when user is not authenticated', async () => {
      reflector.getAllAndOverride.mockReturnValue('READ');

      const context = createMockContext(null, 'fund');

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      await expect(guard.canActivate(context)).rejects.toThrow('User not authenticated');
    });

    it('should throw NotFoundException when dataKey is not provided', async () => {
      reflector.getAllAndOverride.mockReturnValue('READ');

      const mockUser = { id: 'user-123' };
      const context = createMockContext(mockUser, undefined);

      await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
      await expect(guard.canActivate(context)).rejects.toThrow('Data key not provided');
    });

    it('should throw NotFoundException when data object does not exist', async () => {
      reflector.getAllAndOverride.mockReturnValue('READ');
      (prismaService.dataObject.findUnique as jest.Mock).mockResolvedValue(null);

      const mockUser = { id: 'user-123' };
      const context = createMockContext(mockUser, 'fund');

      await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
      await expect(guard.canActivate(context)).rejects.toThrow(
        "Data object with key 'fund' not found",
      );

      expect(prismaService.dataObject.findUnique).toHaveBeenCalledWith({
        where: { dataKey: 'fund', isActive: true },
      });
    });

    it('should allow access for SUPER_ADMIN user', async () => {
      reflector.getAllAndOverride.mockReturnValue('READ');
      (prismaService.dataObject.findUnique as jest.Mock).mockResolvedValue({
        id: 'obj-123',
        dataKey: 'fund',
        isActive: true,
      });

      const mockUser = { id: 'user-123', roles: ['SUPER_ADMIN'] };
      const context = createMockContext(mockUser, 'fund');

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when user has required READ permission', async () => {
      reflector.getAllAndOverride.mockReturnValue('READ');
      (prismaService.dataObject.findUnique as jest.Mock).mockResolvedValue({
        id: 'obj-123',
        dataKey: 'fund',
        isActive: true,
      });

      const mockUserRoles = [
        {
          userId: 'user-123',
          roleId: 'role-123',
          isActive: true,
          role: {
            id: 'role-123',
            name: 'INVESTOR',
            rolePermissions: [
              {
                isActive: true,
                permission: {
                  id: 'perm-123',
                  name: 'FUND:READ',
                  isActive: true,
                },
              },
            ],
          },
        },
      ];

      (prismaService.userRole.findMany as jest.Mock).mockResolvedValue(mockUserRoles);

      const mockUser = { id: 'user-123', roles: ['INVESTOR'] };
      const context = createMockContext(mockUser, 'fund');

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(prismaService.userRole.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          isActive: true,
        },
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
      });
    });

    it('should allow access when user has required WRITE permission', async () => {
      reflector.getAllAndOverride.mockReturnValue('WRITE');
      (prismaService.dataObject.findUnique as jest.Mock).mockResolvedValue({
        id: 'obj-123',
        dataKey: 'fund',
        isActive: true,
      });

      const mockUserRoles = [
        {
          userId: 'user-123',
          roleId: 'role-123',
          isActive: true,
          role: {
            id: 'role-123',
            name: 'INVESTOR',
            rolePermissions: [
              {
                isActive: true,
                permission: {
                  id: 'perm-123',
                  name: 'FUND:WRITE',
                  isActive: true,
                },
              },
            ],
          },
        },
      ];

      (prismaService.userRole.findMany as jest.Mock).mockResolvedValue(mockUserRoles);

      const mockUser = { id: 'user-123', roles: ['INVESTOR'] };
      const context = createMockContext(mockUser, 'fund');

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when user has required DELETE permission', async () => {
      reflector.getAllAndOverride.mockReturnValue('DELETE');
      (prismaService.dataObject.findUnique as jest.Mock).mockResolvedValue({
        id: 'obj-123',
        dataKey: 'fund',
        isActive: true,
      });

      const mockUserRoles = [
        {
          userId: 'user-123',
          roleId: 'role-123',
          isActive: true,
          role: {
            id: 'role-123',
            name: 'ADMIN',
            rolePermissions: [
              {
                isActive: true,
                permission: {
                  id: 'perm-123',
                  name: 'FUND:DELETE',
                  isActive: true,
                },
              },
            ],
          },
        },
      ];

      (prismaService.userRole.findMany as jest.Mock).mockResolvedValue(mockUserRoles);

      const mockUser = { id: 'user-123', roles: ['ADMIN'] };
      const context = createMockContext(mockUser, 'fund');

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user does not have required permission', async () => {
      reflector.getAllAndOverride.mockReturnValue('WRITE');
      (prismaService.dataObject.findUnique as jest.Mock).mockResolvedValue({
        id: 'obj-123',
        dataKey: 'fund',
        isActive: true,
      });

      const mockUserRoles = [
        {
          userId: 'user-123',
          roleId: 'role-123',
          isActive: true,
          role: {
            id: 'role-123',
            name: 'INVESTOR',
            rolePermissions: [
              {
                isActive: true,
                permission: {
                  id: 'perm-123',
                  name: 'FUND:READ', // Only READ, not WRITE
                  isActive: true,
                },
              },
            ],
          },
        },
      ];

      (prismaService.userRole.findMany as jest.Mock).mockResolvedValue(mockUserRoles);

      const mockUser = { id: 'user-123', roles: ['INVESTOR'] };
      const context = createMockContext(mockUser, 'fund');

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      await expect(guard.canActivate(context)).rejects.toThrow(
        'You do not have WRITE permission for fund',
      );
    });

    it('should throw ForbiddenException when user has no roles', async () => {
      reflector.getAllAndOverride.mockReturnValue('READ');
      (prismaService.dataObject.findUnique as jest.Mock).mockResolvedValue({
        id: 'obj-123',
        dataKey: 'fund',
        isActive: true,
      });

      (prismaService.userRole.findMany as jest.Mock).mockResolvedValue([]);

      const mockUser = { id: 'user-123' };
      const context = createMockContext(mockUser, 'fund');

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      await expect(guard.canActivate(context)).rejects.toThrow(
        'You do not have READ permission for fund',
      );
    });

    it('should deny access when permission is inactive', async () => {
      reflector.getAllAndOverride.mockReturnValue('READ');
      (prismaService.dataObject.findUnique as jest.Mock).mockResolvedValue({
        id: 'obj-123',
        dataKey: 'fund',
        isActive: true,
      });

      const mockUserRoles = [
        {
          userId: 'user-123',
          roleId: 'role-123',
          isActive: true,
          role: {
            id: 'role-123',
            name: 'INVESTOR',
            rolePermissions: [
              {
                isActive: true,
                permission: {
                  id: 'perm-123',
                  name: 'FUND:READ',
                  isActive: false, // Permission is inactive
                },
              },
            ],
          },
        },
      ];

      (prismaService.userRole.findMany as jest.Mock).mockResolvedValue(mockUserRoles);

      const mockUser = { id: 'user-123', roles: ['INVESTOR'] };
      const context = createMockContext(mockUser, 'fund');

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should find permission across multiple roles', async () => {
      reflector.getAllAndOverride.mockReturnValue('READ');
      (prismaService.dataObject.findUnique as jest.Mock).mockResolvedValue({
        id: 'obj-123',
        dataKey: 'fund',
        isActive: true,
      });

      const mockUserRoles = [
        {
          userId: 'user-123',
          roleId: 'role-456',
          isActive: true,
          role: {
            id: 'role-456',
            name: 'VIEWER',
            rolePermissions: [
              {
                isActive: true,
                permission: {
                  id: 'perm-456',
                  name: 'OTHER:READ',
                  isActive: true,
                },
              },
            ],
          },
        },
        {
          userId: 'user-123',
          roleId: 'role-123',
          isActive: true,
          role: {
            id: 'role-123',
            name: 'INVESTOR',
            rolePermissions: [
              {
                isActive: true,
                permission: {
                  id: 'perm-123',
                  name: 'FUND:READ',
                  isActive: true,
                },
              },
            ],
          },
        },
      ];

      (prismaService.userRole.findMany as jest.Mock).mockResolvedValue(mockUserRoles);

      const mockUser = { id: 'user-123', roles: ['VIEWER', 'INVESTOR'] };
      const context = createMockContext(mockUser, 'fund');

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should handle empty dataKey string', async () => {
      reflector.getAllAndOverride.mockReturnValue('READ');

      const mockUser = { id: 'user-123' };
      const context = createMockContext(mockUser, '');

      await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
      await expect(guard.canActivate(context)).rejects.toThrow('Data key not provided');
    });

    it('should allow SUPER_ADMIN with roles array', async () => {
      reflector.getAllAndOverride.mockReturnValue('DELETE');
      (prismaService.dataObject.findUnique as jest.Mock).mockResolvedValue({
        id: 'obj-123',
        dataKey: 'fund',
        isActive: true,
      });

      const mockUser = { id: 'user-123', roles: ['INVESTOR', 'SUPER_ADMIN'] };
      const context = createMockContext(mockUser, 'fund');

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      // Should not call userRole.findMany because SUPER_ADMIN bypasses permission check
      expect(prismaService.userRole.findMany).not.toHaveBeenCalled();
    });
  });
});
