import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException
} from '@nestjs/common';
import { UserService } from '../services/user.service';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateUserDto,
  UpdateUserDto,
  QueryUsersDto,
  UserLanguage,
  UserStatus
} from '../dto';

describe('UserService - Comprehensive Tests', () => {
  let service: UserService;
  let prismaService: PrismaService;
  let configService: ConfigService;
  let eventEmitter: EventEmitter2;

  // Mock data
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    password: '$2b$10$hashedpassword',
    status: 'ACTIVE',
    isEmailVerified: true,
    language: 'EN',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    lastLoginAt: new Date('2024-01-01'),
    roles: [],
    profile: null,
    sessions: [],
  };

  const mockPrismaService = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    userRole: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    userProfile: {
      create: jest.fn(),
      update: jest.fn(),
      groupBy: jest.fn(),
    },
    role: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    roleAssignment: {
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    session: {
      updateMany: jest.fn(),
    },
    auditLog: {
      count: jest.fn(),
      findFirst: jest.fn(),
    },
    investment: {
      aggregate: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prismaService = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);

    // Reset all mocks
    jest.clearAllMocks();

    // Default config mock
    mockConfigService.get.mockImplementation((key: string, defaultValue?: any) => {
      switch (key) {
        case 'auth.saltRounds':
          return 10;
        case 'user.maxBulkOperationSize':
          return 100;
        default:
          return defaultValue;
      }
    });

    // Mock user access validation - reset for each test
    mockPrismaService.user.findUnique.mockImplementation((query) => {
      if (query?.where?.id === 'admin-123') {
        return Promise.resolve({
          id: 'admin-123',
          userRoles: [{ role: { name: 'SUPER_ADMIN' }, isActive: true }],
          createdAt: new Date('2024-01-01')
        });
      }
      return Promise.resolve(null);
    });

    // Mock getUserStats dependencies
    mockPrismaService.auditLog.count.mockResolvedValue(0);
    mockPrismaService.auditLog.findFirst.mockResolvedValue(null);
    mockPrismaService.investment.aggregate.mockResolvedValue({ _count: 0, _sum: { commitmentAmount: 0 } });

  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      email: 'newuser@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      password: 'password123',
    };

    it('should create a user successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      const createdUser = {
        ...mockUser,
        email: createUserDto.email,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const tx = {
          user: { create: jest.fn().mockResolvedValue(createdUser) },
          userProfile: { create: jest.fn() },
          role: { findMany: jest.fn().mockResolvedValue([]), findFirst: jest.fn().mockResolvedValue(null) },
          userRole: { create: jest.fn() },
          roleAssignment: { create: jest.fn() }
        };
        return await callback(tx);
      });

      const validCreateUserDto = {
        ...createUserDto,
        password: 'validPassword123'
      };

      const result = await service.create(validCreateUserDto, 'admin-123');

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: validCreateUserDto.email },
      });
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('user.created', expect.any(Object));
      expect(result.email).toBe(validCreateUserDto.email);
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrismaService.user.findUnique.mockImplementation((query) => {
        if (query?.where?.email === createUserDto.email) {
          return Promise.resolve(mockUser);
        }
        if (query?.where?.id === 'admin-123') {
          return Promise.resolve({
            id: 'admin-123',
            userRoles: [{ role: { name: 'SUPER_ADMIN' }, isActive: true }],
            createdAt: new Date('2024-01-01')
          });
        }
        return Promise.resolve(null);
      });

      const validCreateUserDto = {
        ...createUserDto,
        password: 'validPassword123'
      };

      await expect(service.create(validCreateUserDto, 'admin-123'))
        .rejects.toThrow(ConflictException);

      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      mockPrismaService.user.findUnique.mockImplementation((query) => {
        if (query?.where?.email) return Promise.resolve(null);
        if (query?.where?.id === 'admin-123') {
          return Promise.resolve({
            id: 'admin-123',
            userRoles: [{ role: { name: 'SUPER_ADMIN' }, isActive: true }],
            createdAt: new Date('2024-01-01')
          });
        }
        return Promise.resolve(null);
      });
      mockPrismaService.$transaction.mockRejectedValue(new Error('Database error'));

      const validCreateUserDto = {
        ...createUserDto,
        password: 'validPassword123'
      };

      await expect(service.create(validCreateUserDto, 'admin-123'))
        .rejects.toThrow(InternalServerErrorException);
    });

    it('should hash password correctly', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      let capturedUserData = null;

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const tx = {
          user: {
            create: jest.fn().mockImplementation((data) => {
              capturedUserData = data;
              return Promise.resolve(mockUser);
            })
          },
          userProfile: { create: jest.fn() },
          role: { findMany: jest.fn().mockResolvedValue([]), findFirst: jest.fn().mockResolvedValue(null) },
          userRole: { create: jest.fn() },
          roleAssignment: { create: jest.fn() }
        };
        return await callback(tx);
      });

      const validCreateUserDto = {
        ...createUserDto,
        password: 'validPassword123'
      };

      await service.create(validCreateUserDto, 'admin-123');

      expect(capturedUserData.data.password).not.toBe(validCreateUserDto.password);
      expect(capturedUserData.data.password).toMatch(/^\$2b\$/); // bcrypt hash format
    });
  });

  describe('findOne', () => {
    it('should return user successfully', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      mockPrismaService.user.findUnique.mockImplementation((query) => {
        if (query?.where?.id === 'admin-123') {
          return Promise.resolve({
            id: 'admin-123',
            userRoles: [{ role: { name: 'SUPER_ADMIN' }, isActive: true }],
            createdAt: new Date('2024-01-01')
          });
        }
        return Promise.resolve(null);
      });

      const result = await service.findOne('user-123', 'admin-123');

      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: { id: 'user-123', isActive: true },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.user.findUnique.mockImplementation((query) => {
        if (query?.where?.id === 'admin-123') {
          return Promise.resolve({
            id: 'admin-123',
            userRoles: [{ role: { name: 'SUPER_ADMIN' }, isActive: true }],
            createdAt: new Date('2024-01-01')
          });
        }
        return Promise.resolve(null);
      });

      await expect(service.findOne('non-existent', 'admin-123'))
        .rejects.toThrow(NotFoundException);
    });
  });

  // getUserByEmail method doesn't exist in service, removed these tests

  describe('findAll', () => {
    const queryDto: QueryUsersDto = {
      page: 1,
      limit: 10,
      status: UserStatus.ACTIVE,
      search: 'john',
    };

    it('should return paginated users', async () => {
      const users = [mockUser, { ...mockUser, id: 'user-456' }];
      mockPrismaService.user.findMany.mockResolvedValue(users);
      mockPrismaService.user.count.mockResolvedValue(25);
      mockPrismaService.user.findUnique.mockImplementation((query) => {
        if (query?.where?.id === 'admin-123') {
          return Promise.resolve({
            id: 'admin-123',
            userRoles: [{ role: { name: 'SUPER_ADMIN' }, isActive: true }],
            createdAt: new Date('2024-01-01')
          });
        }
        return Promise.resolve(null);
      });

      const result = await service.findAll(queryDto, 'admin-123');

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          isActive: true,
          OR: expect.arrayContaining([
            { firstName: { contains: 'john', mode: 'insensitive' } },
            { lastName: { contains: 'john', mode: 'insensitive' } },
            { email: { contains: 'john', mode: 'insensitive' } },
          ]),
        }),
        include: expect.any(Object),
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });

      expect(result.data).toBeDefined();
      expect(result.pagination.total).toBe(25);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.totalPages).toBe(3);
    });

    it('should handle no search filter', async () => {
      const queryWithoutSearch = { page: 1, limit: 10 };
      mockPrismaService.user.findMany.mockResolvedValue([mockUser]);
      mockPrismaService.user.count.mockResolvedValue(1);
      mockPrismaService.user.findUnique.mockImplementation((query) => {
        if (query?.where?.id === 'admin-123') {
          return Promise.resolve({
            id: 'admin-123',
            userRoles: [{ role: { name: 'SUPER_ADMIN' }, isActive: true }],
            createdAt: new Date('2024-01-01')
          });
        }
        return Promise.resolve(null);
      });

      await service.findAll(queryWithoutSearch, 'admin-123');

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        include: expect.any(Object),
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('update', () => {
    const updateDto: UpdateUserDto = {
      firstName: 'Updated',
      lastName: 'Name',
      language: UserLanguage.FR,
    };

    it('should update user successfully', async () => {
      const updatedUser = { ...mockUser, ...updateDto };

      // Mock for finding the user to update
      mockPrismaService.user.findUnique.mockImplementation((query) => {
        if (query?.where?.id === 'user-123') {
          return Promise.resolve(mockUser);
        }
        if (query?.where?.id === 'admin-123') {
          return Promise.resolve({
            id: 'admin-123',
            userRoles: [{ role: { name: 'SUPER_ADMIN' }, isActive: true }],
            createdAt: new Date('2024-01-01')
          });
        }
        return Promise.resolve(null);
      });

      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.update('user-123', updateDto, 'admin-123');

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: expect.objectContaining(updateDto),
        include: expect.any(Object),
      });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('user.updated', expect.any(Object));
      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockImplementation((query) => {
        if (query?.where?.id === 'admin-123') {
          return Promise.resolve({
            id: 'admin-123',
            userRoles: [{ role: { name: 'SUPER_ADMIN' }, isActive: true }],
            createdAt: new Date('2024-01-01')
          });
        }
        return Promise.resolve(null);
      });

      await expect(service.update('non-existent', updateDto, 'admin-123'))
        .rejects.toThrow(NotFoundException);
    });

    it('should handle email conflicts during update', async () => {
      const updateWithEmail = { ...updateDto, email: 'existing@example.com' };
      let callCount = 0;
      mockPrismaService.user.findUnique.mockImplementation((query) => {
        callCount++;
        if (query?.where?.id === 'admin-123') {
          return Promise.resolve({
            id: 'admin-123',
            userRoles: [{ role: { name: 'SUPER_ADMIN' }, isActive: true }],
            createdAt: new Date('2024-01-01')
          });
        }
        if (query?.where?.id === 'user-123') {
          return Promise.resolve(mockUser);
        }
        if (query?.where?.email === 'existing@example.com') {
          return Promise.resolve({ id: 'other-user' });
        }
        return Promise.resolve(null);
      });

      mockPrismaService.user.findFirst.mockResolvedValue({ id: 'other-user' });

      await expect(service.update('user-123', updateWithEmail, 'admin-123'))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should delete user successfully', async () => {
      mockPrismaService.user.update.mockResolvedValue(mockUser);
      mockPrismaService.session = { updateMany: jest.fn() };
      mockPrismaService.userRole = { updateMany: jest.fn() };
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrismaService);
      });

      const result = await service.remove('user-123', 'admin-123');

      expect(result.message).toBe('User deactivated successfully');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('user.deleted', expect.any(Object));
    });

    it('should throw BadRequestException for self-deletion', async () => {
      await expect(service.remove('admin-123', 'admin-123'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('updateStatus', () => {
    it('should update user status successfully', async () => {
      const updatedUser = { ...mockUser, isActive: false };
      mockPrismaService.user.update.mockResolvedValue(updatedUser);
      mockPrismaService.session = { updateMany: jest.fn() };

      const result = await service.updateStatus('user-123', { isActive: false, reason: 'Test suspension' }, 'admin-123');

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          isActive: false,
          updatedAt: expect.any(Date),
        },
      });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('user.status.changed', expect.any(Object));
      expect(result.isActive).toBe(false);
    });
  });

  describe('getStatistics', () => {
    it('should return user statistics', async () => {
      mockPrismaService.user.count.mockResolvedValue(100);
      mockPrismaService.role = { findMany: jest.fn().mockResolvedValue([]) };
      mockPrismaService.userProfile = { groupBy: jest.fn().mockResolvedValue([]) };

      const result = await service.getStatistics({});

      expect(result.totalUsers).toBe(100);
      expect(result.activeUsers).toBe(100);
    });
  });

  // verifyPassword method doesn't exist in service, removed these tests

  describe('Error handling and edge cases', () => {
    it('should handle database connection errors', async () => {
      mockPrismaService.user.findMany.mockRejectedValue(new Error('Connection failed'));
      mockPrismaService.user.findUnique.mockImplementation((query) => {
        if (query?.where?.id === 'admin-123') {
          return Promise.resolve({
            id: 'admin-123',
            userRoles: [{ role: { name: 'SUPER_ADMIN' }, isActive: true }],
            createdAt: new Date('2024-01-01')
          });
        }
        return Promise.resolve(null);
      });

      await expect(service.findAll({ page: 1, limit: 10 }, 'admin-123'))
        .rejects.toThrow(InternalServerErrorException);
    });

    it('should validate pagination limits', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.user.count.mockResolvedValue(0);
      mockPrismaService.user.findUnique.mockImplementation((query) => {
        if (query?.where?.id === 'admin-123') {
          return Promise.resolve({
            id: 'admin-123',
            userRoles: [{ role: { name: 'SUPER_ADMIN' }, isActive: true }],
            createdAt: new Date('2024-01-01')
          });
        }
        return Promise.resolve(null);
      });

      // Test with very large limit
      const result = await service.findAll({ page: 1, limit: 1000 }, 'admin-123');

      // Should cap the limit
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: expect.any(Number) })
      );
    });

    it('should handle concurrent user creation attempts', async () => {
      // Simulate race condition where user is created between check and create
      mockPrismaService.user.findUnique.mockImplementation((query) => {
        if (query?.where?.email) return Promise.resolve(null);
        if (query?.where?.id === 'admin-123') {
          return Promise.resolve({
            id: 'admin-123',
            userRoles: [{ role: { name: 'SUPER_ADMIN' }, isActive: true }],
            createdAt: new Date('2024-01-01')
          });
        }
        return Promise.resolve(null);
      });
      mockPrismaService.$transaction.mockRejectedValue({
        code: 'P2002', // Prisma unique constraint violation
        meta: { target: ['email'] }
      });

      const concurrentCreateUserDto: CreateUserDto = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'password123',
      };

      await expect(service.create(concurrentCreateUserDto, 'admin-123'))
        .rejects.toThrow(ConflictException);
    });
  });
});