import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';

import { UserService } from '../services/user.service';
import { PrismaService } from '../../../database/prisma.service';
import { createTestUser, createTestRole, createMockPrismaService } from './factories/user.factory';
import { CreateUserDto, UpdateUserDto, QueryUsersDto } from '../dto';

describe('UserService', () => {
  let service: UserService;
  let prismaService: jest.Mocked<PrismaService>;
  let configService: jest.Mocked<ConfigService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(async () => {
    const mockPrismaService = createMockPrismaService();
    const mockConfigService = {
      get: jest.fn().mockImplementation((key: string, defaultValue?: any) => {
        const config = {
          'auth.saltRounds': 12,
          'user.maxBulkOperationSize': 100
        };
        return config[key] || defaultValue;
      })
    };
    const mockEventEmitter = {
      emit: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EventEmitter2, useValue: mockEventEmitter }
      ]
    }).compile();

    service = module.get<UserService>(UserService);
    prismaService = module.get(PrismaService);
    configService = module.get(ConfigService);
    eventEmitter = module.get(EventEmitter2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated users with default parameters', async () => {
      // Arrange
      const mockUsers = [createTestUser(), createTestUser({ email: 'user2@example.com' })];
      const query: QueryUsersDto = { page: 1, limit: 20 };
      const requestingUserId = 'admin-user-id';

      prismaService.user.findMany.mockResolvedValue(mockUsers);
      prismaService.user.count.mockResolvedValue(2);

      // Act
      const result = await service.findAll(query, requestingUserId);

      // Assert
      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        include: {
          userRoles: {
            where: { isActive: true },
            include: {
              role: {
                select: {
                  id: true,
                  name: true,
                  description: true
                }
              }
            }
          }
        },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' }
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith('user.list.accessed', expect.any(Object));
    });

    it('should filter users by search term', async () => {
      // Arrange
      const query: QueryUsersDto = { search: 'john', page: 1, limit: 20 };
      const requestingUserId = 'admin-user-id';

      prismaService.user.findMany.mockResolvedValue([]);
      prismaService.user.count.mockResolvedValue(0);

      // Act
      await service.findAll(query, requestingUserId);

      // Assert
      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          OR: [
            { firstName: { contains: 'john', mode: 'insensitive' } },
            { lastName: { contains: 'john', mode: 'insensitive' } },
            { email: { contains: 'john', mode: 'insensitive' } }
          ]
        },
        include: expect.any(Object),
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' }
      });
    });

    it('should filter users by roles', async () => {
      // Arrange
      const query: QueryUsersDto = { roles: ['INVESTOR', 'ADMIN'], page: 1, limit: 20 };
      const requestingUserId = 'admin-user-id';

      prismaService.user.findMany.mockResolvedValue([]);
      prismaService.user.count.mockResolvedValue(0);

      // Act
      await service.findAll(query, requestingUserId);

      // Assert
      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          userRoles: {
            some: {
              isActive: true,
              role: {
                name: { in: ['INVESTOR', 'ADMIN'] }
              }
            }
          }
        },
        include: expect.any(Object),
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' }
      });
    });
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      // Arrange
      const createUserDto: CreateUserDto = {
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        firstName: 'New',
        lastName: 'User',
        roles: ['INVESTOR']
      };
      const createdById = 'admin-user-id';
      const mockUser = createTestUser(createUserDto);
      const mockRole = createTestRole({ name: 'INVESTOR' });

      prismaService.user.findUnique.mockResolvedValue(null); // User doesn't exist
      prismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          user: {
            create: jest.fn().mockResolvedValue(mockUser)
          },
          userProfile: {
            create: jest.fn().mockResolvedValue({})
          },
          role: {
            findMany: jest.fn().mockResolvedValue([mockRole])
          },
          userRole: {
            create: jest.fn().mockResolvedValue({})
          },
          roleAssignment: {
            create: jest.fn().mockResolvedValue({})
          }
        } as any);
      });

      // Act
      const result = await service.create(createUserDto, createdById);

      // Assert
      expect(result.email).toBe(createUserDto.email);
      expect(result.requiresPasswordChange).toBe(true);
      expect(result.emailVerificationToken).toBeDefined();
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: createUserDto.email }
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith('user.created', expect.any(Object));
    });

    it('should throw ConflictException if email already exists', async () => {
      // Arrange
      const createUserDto: CreateUserDto = {
        email: 'existing@example.com',
        password: 'SecurePass123!',
        firstName: 'Existing',
        lastName: 'User'
      };
      const createdById = 'admin-user-id';
      const existingUser = createTestUser({ email: createUserDto.email });

      prismaService.user.findUnique.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(service.create(createUserDto, createdById))
        .rejects.toThrow(ConflictException);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: createUserDto.email }
      });
    });
  });

  describe('findOne', () => {
    it('should return user details with profile and roles', async () => {
      // Arrange
      const userId = 'user-uuid';
      const requestingUserId = 'admin-user-id';
      const mockUser = createTestUser({ id: userId });

      prismaService.user.findFirst.mockResolvedValue({
        ...mockUser,
        profile: { phone: '+1234567890', timezone: 'UTC', language: 'en' },
        userRoles: [
          {
            role: { id: 'role-1', name: 'INVESTOR', description: 'Investor role' },
            isActive: true
          }
        ]
      } as any);

      // Mock getUserStats method (private method would need to be public for testing)
      jest.spyOn(service as any, 'getUserStats').mockResolvedValue({
        loginCount: 5,
        accountAge: 10,
        investmentCount: 2,
        totalInvestmentValue: 100000
      });

      // Act
      const result = await service.findOne(userId, requestingUserId);

      // Assert
      expect(result.id).toBe(userId);
      expect(result.profile).toBeDefined();
      expect(result.roles).toBeDefined();
      expect(result.stats).toBeDefined();
      expect(prismaService.user.findFirst).toHaveBeenCalledWith({
        where: { id: userId, deletedAt: null },
        include: {
          profile: true,
          userRoles: {
            where: { isActive: true },
            include: {
              role: {
                select: { id: true, name: true, description: true }
              }
            }
          }
        }
      });
    });

    it('should throw NotFoundException if user does not exist', async () => {
      // Arrange
      const userId = 'non-existent-user';
      const requestingUserId = 'admin-user-id';

      prismaService.user.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(userId, requestingUserId))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      // Arrange
      const userId = 'user-uuid';
      const updateUserDto: UpdateUserDto = {
        firstName: 'Updated',
        lastName: 'Name'
      };
      const updatedById = 'admin-user-id';
      const mockUser = createTestUser({ id: userId, ...updateUserDto });

      // Mock validateUserAccess (private method)
      jest.spyOn(service as any, 'validateUserAccess').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'getUserStats').mockResolvedValue({});

      prismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          user: {
            update: jest.fn().mockResolvedValue({
              ...mockUser,
              profile: {},
              userRoles: []
            })
          },
          userProfile: {
            update: jest.fn().mockResolvedValue({})
          }
        } as any);
      });

      // Act
      const result = await service.update(userId, updateUserDto, updatedById);

      // Assert
      expect(result.firstName).toBe(updateUserDto.firstName);
      expect(result.lastName).toBe(updateUserDto.lastName);
      expect(eventEmitter.emit).toHaveBeenCalledWith('user.updated', expect.any(Object));
    });

    it('should throw ConflictException if email already exists', async () => {
      // Arrange
      const userId = 'user-uuid';
      const updateUserDto: UpdateUserDto = {
        email: 'existing@example.com'
      };
      const updatedById = 'admin-user-id';
      const existingUser = createTestUser({ email: updateUserDto.email });

      jest.spyOn(service as any, 'validateUserAccess').mockResolvedValue(undefined);
      prismaService.user.findFirst.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(service.update(userId, updateUserDto, updatedById))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('assignRoles', () => {
    it('should assign roles successfully', async () => {
      // Arrange
      const userId = 'user-uuid';
      const assignRolesDto = {
        roles: ['INVESTOR', 'ANALYST'],
        reason: 'Role assignment test'
      };
      const assignedById = 'admin-user-id';
      const mockRoles = [
        createTestRole({ name: 'INVESTOR' }),
        createTestRole({ name: 'ANALYST' })
      ];

      prismaService.role.findMany.mockResolvedValue(mockRoles);
      prismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          userRole: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({})
          },
          roleAssignment: {
            create: jest.fn().mockResolvedValue({})
          }
        } as any);
      });

      // Act
      const result = await service.assignRoles(userId, assignRolesDto, assignedById);

      // Assert
      expect(result.message).toBe('Roles assigned successfully');
      expect(prismaService.role.findMany).toHaveBeenCalledWith({
        where: { name: { in: assignRolesDto.roles }, isActive: true }
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith('user.roles.assigned', expect.any(Object));
    });

    it('should throw BadRequestException for invalid roles', async () => {
      // Arrange
      const userId = 'user-uuid';
      const assignRolesDto = {
        roles: ['INVALID_ROLE'],
        reason: 'Test'
      };
      const assignedById = 'admin-user-id';

      prismaService.role.findMany.mockResolvedValue([]); // No roles found

      // Act & Assert
      await expect(service.assignRoles(userId, assignRolesDto, assignedById))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('bulkRoleOperation', () => {
    it('should perform bulk role assignment successfully', async () => {
      // Arrange
      const bulkRoleOperationDto = {
        userIds: ['user-1', 'user-2'],
        roles: ['INVESTOR'],
        operation: 'assign' as const,
        reason: 'Bulk test'
      };
      const operatorId = 'admin-user-id';

      // Mock successful operations
      jest.spyOn(service, 'assignRoles').mockResolvedValue({ message: 'Success' });
      prismaService.user.findUnique
        .mockResolvedValueOnce({ email: 'user1@example.com' } as any)
        .mockResolvedValueOnce({ email: 'user2@example.com' } as any);

      // Act
      const result = await service.bulkRoleOperation(bulkRoleOperationDto, operatorId);

      // Assert
      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(0);
      expect(result.status).toBe('success');
      expect(result.successes).toHaveLength(2);
      expect(result.failures).toHaveLength(0);
      expect(eventEmitter.emit).toHaveBeenCalledWith('user.bulk.operation', expect.any(Object));
    });

    it('should handle partial failures in bulk operations', async () => {
      // Arrange
      const bulkRoleOperationDto = {
        userIds: ['user-1', 'user-2'],
        roles: ['INVESTOR'],
        operation: 'assign' as const,
        reason: 'Bulk test'
      };
      const operatorId = 'admin-user-id';

      // Mock one success, one failure
      jest.spyOn(service, 'assignRoles')
        .mockResolvedValueOnce({ message: 'Success' })
        .mockRejectedValueOnce(new Error('Assignment failed'));

      prismaService.user.findUnique
        .mockResolvedValueOnce({ email: 'user1@example.com' } as any)
        .mockResolvedValueOnce({ email: 'user2@example.com' } as any);

      // Act
      const result = await service.bulkRoleOperation(bulkRoleOperationDto, operatorId);

      // Assert
      expect(result.successCount).toBe(1);
      expect(result.failureCount).toBe(1);
      expect(result.status).toBe('partial_success');
      expect(result.successes).toHaveLength(1);
      expect(result.failures).toHaveLength(1);
    });

    it('should throw BadRequestException for operations exceeding size limit', async () => {
      // Arrange
      const userIds = Array.from({ length: 101 }, (_, i) => `user-${i}`);
      const bulkRoleOperationDto = {
        userIds,
        roles: ['INVESTOR'],
        operation: 'assign' as const,
        reason: 'Too many users'
      };
      const operatorId = 'admin-user-id';

      // Act & Assert
      await expect(service.bulkRoleOperation(bulkRoleOperationDto, operatorId))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should soft delete user successfully', async () => {
      // Arrange
      const userId = 'user-uuid';
      const deletedById = 'admin-user-id';

      prismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          user: {
            update: jest.fn().mockResolvedValue({})
          },
          session: {
            updateMany: jest.fn().mockResolvedValue({})
          },
          userRole: {
            updateMany: jest.fn().mockResolvedValue({})
          }
        } as any);
      });

      // Act
      const result = await service.remove(userId, deletedById);

      // Assert
      expect(result.message).toBe('User deleted successfully');
      expect(result.deletedAt).toBeDefined();
      expect(eventEmitter.emit).toHaveBeenCalledWith('user.deleted', expect.any(Object));
    });

    it('should throw BadRequestException when trying to delete own account', async () => {
      // Arrange
      const userId = 'user-uuid';
      const deletedById = userId; // Same as userId

      // Act & Assert
      await expect(service.remove(userId, deletedById))
        .rejects.toThrow(BadRequestException);
    });
  });
});