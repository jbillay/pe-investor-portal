import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtPayload } from '../interfaces/auth.interface';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prismaService: jest.Mocked<PrismaService>;
  let configService: jest.Mocked<ConfigService>;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        JWT_SECRET: 'test-secret-key',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    prismaService = module.get(PrismaService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    const payload: JwtPayload = {
      sub: 'user-123',
      email: 'user@example.com',
      iat: Date.now(),
      exp: Date.now() + 3600,
    };

    it('should validate and return user with roles and permissions', async () => {
      // Arrange
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
        isVerified: true,
        userRoles: [
          {
            isActive: true,
            role: {
              name: 'ADMIN',
              isActive: true,
              rolePermissions: [
                {
                  isActive: true,
                  permission: {
                    name: 'users:read',
                    isActive: true,
                  },
                },
                {
                  isActive: true,
                  permission: {
                    name: 'users:write',
                    isActive: true,
                  },
                },
              ],
            },
          },
          {
            isActive: true,
            role: {
              name: 'USER',
              isActive: true,
              rolePermissions: [
                {
                  isActive: true,
                  permission: {
                    name: 'profile:read',
                    isActive: true,
                  },
                },
              ],
            },
          },
        ],
      };

      prismaService.user.findUnique.mockResolvedValue(mockUser as any);

      // Act
      const result = await strategy.validate(payload);

      // Assert
      expect(result).toEqual({
        id: 'user-123',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
        isVerified: true,
        roles: ['ADMIN', 'USER'],
        permissions: ['users:read', 'users:write', 'profile:read'],
      });
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'user-123',
          isActive: true,
        },
        include: {
          userRoles: {
            where: { isActive: true },
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
          },
        },
      });
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      // Arrange
      prismaService.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(payload)).rejects.toThrow(
        'User not found or inactive',
      );
    });

    it('should return user with no roles when user has no active roles', async () => {
      // Arrange
      const mockUser = {
        id: 'user-456',
        email: 'noroles@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        isActive: true,
        isVerified: false,
        userRoles: [],
      };

      prismaService.user.findUnique.mockResolvedValue(mockUser as any);

      // Act
      const result = await strategy.validate(payload);

      // Assert
      expect(result).toEqual({
        id: 'user-456',
        email: 'noroles@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        isActive: true,
        isVerified: false,
        roles: [],
        permissions: [],
      });
    });

    it('should filter out inactive roles', async () => {
      // Arrange
      const mockUser = {
        id: 'user-789',
        email: 'filtered@example.com',
        firstName: 'Bob',
        lastName: 'Johnson',
        isActive: true,
        isVerified: true,
        userRoles: [
          {
            isActive: true,
            role: {
              name: 'ACTIVE_ROLE',
              isActive: true,
              rolePermissions: [
                {
                  isActive: true,
                  permission: {
                    name: 'active:permission',
                    isActive: true,
                  },
                },
              ],
            },
          },
          {
            isActive: true,
            role: {
              name: 'INACTIVE_ROLE',
              isActive: false, // Inactive role
              rolePermissions: [
                {
                  isActive: true,
                  permission: {
                    name: 'inactive:permission',
                    isActive: true,
                  },
                },
              ],
            },
          },
        ],
      };

      prismaService.user.findUnique.mockResolvedValue(mockUser as any);

      // Act
      const result = await strategy.validate(payload);

      // Assert
      expect(result.roles).toEqual(['ACTIVE_ROLE']);
      expect(result.permissions).toEqual(['active:permission']);
    });

    it('should filter out inactive permissions', async () => {
      // Arrange
      const mockUser = {
        id: 'user-999',
        email: 'perms@example.com',
        firstName: 'Alice',
        lastName: 'Williams',
        isActive: true,
        isVerified: true,
        userRoles: [
          {
            isActive: true,
            role: {
              name: 'ROLE_WITH_MIXED_PERMS',
              isActive: true,
              rolePermissions: [
                {
                  isActive: true,
                  permission: {
                    name: 'active:perm1',
                    isActive: true,
                  },
                },
                {
                  isActive: true,
                  permission: {
                    name: 'inactive:perm',
                    isActive: false, // Inactive permission
                  },
                },
                {
                  isActive: true,
                  permission: {
                    name: 'active:perm2',
                    isActive: true,
                  },
                },
              ],
            },
          },
        ],
      };

      prismaService.user.findUnique.mockResolvedValue(mockUser as any);

      // Act
      const result = await strategy.validate(payload);

      // Assert
      expect(result.permissions).toEqual(['active:perm1', 'active:perm2']);
      expect(result.permissions).not.toContain('inactive:perm');
    });

    it('should deduplicate permissions from multiple roles', async () => {
      // Arrange
      const mockUser = {
        id: 'user-duplicate',
        email: 'duplicate@example.com',
        firstName: 'Charlie',
        lastName: 'Brown',
        isActive: true,
        isVerified: true,
        userRoles: [
          {
            isActive: true,
            role: {
              name: 'ROLE1',
              isActive: true,
              rolePermissions: [
                {
                  isActive: true,
                  permission: {
                    name: 'shared:permission',
                    isActive: true,
                  },
                },
                {
                  isActive: true,
                  permission: {
                    name: 'unique:perm1',
                    isActive: true,
                  },
                },
              ],
            },
          },
          {
            isActive: true,
            role: {
              name: 'ROLE2',
              isActive: true,
              rolePermissions: [
                {
                  isActive: true,
                  permission: {
                    name: 'shared:permission', // Duplicate
                    isActive: true,
                  },
                },
                {
                  isActive: true,
                  permission: {
                    name: 'unique:perm2',
                    isActive: true,
                  },
                },
              ],
            },
          },
        ],
      };

      prismaService.user.findUnique.mockResolvedValue(mockUser as any);

      // Act
      const result = await strategy.validate(payload);

      // Assert
      expect(result.permissions).toHaveLength(3);
      expect(result.permissions).toContain('shared:permission');
      expect(result.permissions).toContain('unique:perm1');
      expect(result.permissions).toContain('unique:perm2');
      // Should not have duplicates
      const uniquePerms = [...new Set(result.permissions)];
      expect(result.permissions.length).toBe(uniquePerms.length);
    });

    it('should return user with null firstName and lastName', async () => {
      // Arrange
      const mockUser = {
        id: 'user-null-names',
        email: 'nullnames@example.com',
        firstName: null,
        lastName: null,
        isActive: true,
        isVerified: true,
        userRoles: [],
      };

      prismaService.user.findUnique.mockResolvedValue(mockUser as any);

      // Act
      const result = await strategy.validate(payload);

      // Assert
      expect(result.firstName).toBeNull();
      expect(result.lastName).toBeNull();
    });
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(strategy).toBeDefined();
    });

    it('should call configService to get JWT_SECRET', () => {
      expect(configService.get).toHaveBeenCalledWith('JWT_SECRET');
    });
  });
});
