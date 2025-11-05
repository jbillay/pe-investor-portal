import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { SuperAdminGuard } from './super-admin.guard';
import { PrismaService } from '../../database/prisma.service';

describe('SuperAdminGuard', () => {
  let guard: SuperAdminGuard;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrismaService = {
      userRole: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuperAdminGuard,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    guard = module.get<SuperAdminGuard>(SuperAdminGuard);
    prismaService = module.get(PrismaService) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockContext = (user: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as any;
  };

  describe('canActivate', () => {
    it('should allow access for SUPER_ADMIN user', async () => {
      const mockUser = { id: 'user-123', email: 'admin@example.com' };
      const mockUserRoles = [
        {
          userId: 'user-123',
          roleId: 'role-123',
          isActive: true,
          role: {
            id: 'role-123',
            name: 'SUPER_ADMIN',
            isActive: true,
          },
        },
      ];

      (prismaService.userRole.findMany as jest.Mock).mockResolvedValue(mockUserRoles);

      const context = createMockContext(mockUser);
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(prismaService.userRole.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          isActive: true,
        },
        include: {
          role: true,
        },
      });
    });

    it('should throw ForbiddenException when user is not authenticated', async () => {
      const context = createMockContext(null);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      await expect(guard.canActivate(context)).rejects.toThrow('User not authenticated');
    });

    it('should throw ForbiddenException when user has no id', async () => {
      const mockUser = { email: 'user@example.com' }; // No id
      const context = createMockContext(mockUser);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      await expect(guard.canActivate(context)).rejects.toThrow('User not authenticated');
    });

    it('should throw ForbiddenException when user does not have SUPER_ADMIN role', async () => {
      const mockUser = { id: 'user-123', email: 'user@example.com' };
      const mockUserRoles = [
        {
          userId: 'user-123',
          roleId: 'role-456',
          isActive: true,
          role: {
            id: 'role-456',
            name: 'INVESTOR',
            isActive: true,
          },
        },
      ];

      (prismaService.userRole.findMany as jest.Mock).mockResolvedValue(mockUserRoles);

      const context = createMockContext(mockUser);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Only SUPER_ADMIN can access email template management',
      );
    });

    it('should throw ForbiddenException when user has no roles', async () => {
      const mockUser = { id: 'user-123', email: 'user@example.com' };

      (prismaService.userRole.findMany as jest.Mock).mockResolvedValue([]);

      const context = createMockContext(mockUser);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Only SUPER_ADMIN can access email template management',
      );
    });

    it('should throw ForbiddenException when SUPER_ADMIN role is inactive', async () => {
      const mockUser = { id: 'user-123', email: 'admin@example.com' };
      const mockUserRoles = [
        {
          userId: 'user-123',
          roleId: 'role-123',
          isActive: true,
          role: {
            id: 'role-123',
            name: 'SUPER_ADMIN',
            isActive: false, // Role is inactive
          },
        },
      ];

      (prismaService.userRole.findMany as jest.Mock).mockResolvedValue(mockUserRoles);

      const context = createMockContext(mockUser);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Only SUPER_ADMIN can access email template management',
      );
    });

    it('should allow access when user has SUPER_ADMIN among multiple roles', async () => {
      const mockUser = { id: 'user-123', email: 'admin@example.com' };
      const mockUserRoles = [
        {
          userId: 'user-123',
          roleId: 'role-456',
          isActive: true,
          role: {
            id: 'role-456',
            name: 'INVESTOR',
            isActive: true,
          },
        },
        {
          userId: 'user-123',
          roleId: 'role-123',
          isActive: true,
          role: {
            id: 'role-123',
            name: 'SUPER_ADMIN',
            isActive: true,
          },
        },
      ];

      (prismaService.userRole.findMany as jest.Mock).mockResolvedValue(mockUserRoles);

      const context = createMockContext(mockUser);
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should handle undefined user object', async () => {
      const context = createMockContext(undefined);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      await expect(guard.canActivate(context)).rejects.toThrow('User not authenticated');
    });
  });
});
