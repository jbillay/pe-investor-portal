import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserService } from './user.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditLoggerService } from '../../common/services/audit-logger.service';
import { EmailService } from '../../email/services/email.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

jest.mock('bcrypt');
jest.mock('crypto');

describe('UserService', () => {
  let service: UserService;
  let prisma: jest.Mocked<PrismaService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;
  let auditLogger: jest.Mocked<AuditLoggerService>;
  let emailService: jest.Mocked<EmailService>;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    userProfile: { create: jest.fn() },
    userRole: { createMany: jest.fn(), findMany: jest.fn(), deleteMany: jest.fn() },
    role: { findMany: jest.fn() },
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config = {
        'auth.saltRounds': 12,
        'user.maxBulkOperationSize': 100,
      };
      return config[key] || defaultValue;
    }),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  const mockAuditLogger = {
    logEvent: jest.fn(),
  };

  const mockEmailService = {
    sendWelcomeEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: AuditLoggerService, useValue: mockAuditLogger },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get(PrismaService) as any;
    eventEmitter = module.get(EventEmitter2) as any;
    auditLogger = module.get(AuditLoggerService) as any;
    emailService = module.get(EmailService) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          firstName: 'John',
          lastName: 'Doe',
          isActive: true,
          isVerified: true,
          createdAt: new Date(),
          userRoles: [{ role: { name: 'USER' } }],
        },
      ];
      
      prisma.user.findMany.mockResolvedValue(mockUsers as any);
      prisma.user.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20 }, 'admin-1');

      expect(result.users).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('should filter users by search term', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 20, search: 'john' }, 'admin-1');

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        })
      );
    });
  });

  describe('findOne', () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      isActive: true,
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      userRoles: [
        {
          role: {
            id: 'role-1',
            name: 'USER',
            description: 'User role',
            isActive: true,
            rolePermissions: [
              {
                permission: { name: 'READ', description: 'Read' },
              },
            ],
          },
        },
      ],
      userProfile: {
        phone: '123456789',
        address: '123 Main St',
      },
    };

    it('should return user by id', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser as any);

      const result = await service.findOne('user-1', 'admin-1');

      expect(result.id).toBe('user-1');
      expect(result.email).toBe('test@example.com');
      expect(result.roles).toHaveLength(1);
    });

    it('should throw NotFoundException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent', 'admin-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createUserDto = {
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      firstName: 'Jane',
      lastName: 'Smith',
      roleIds: ['role-1'],
    };

    it('should create new user successfully', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      
      const mockCreatedUser = {
        id: 'new-user-1',
        email: createUserDto.email,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
      };

      prisma.$transaction.mockResolvedValue({
        user: mockCreatedUser,
        roles: [{ id: 'role-1', name: 'USER' }],
      });

      const result = await service.create(createUserDto, 'admin-1');

      expect(result.user.email).toBe(createUserDto.email);
      expect(auditLogger.logEvent).toHaveBeenCalled();
    });

    it('should throw ConflictException when email exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing-user' } as any);

      await expect(service.create(createUserDto, 'admin-1')).rejects.toThrow(ConflictException);
    });
  });

  describe('createUserWithTempPassword', () => {
    const createDto = {
      email: 'newuser@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      roleIds: ['role-1'],
    };

    it('should create user with temporary password', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      (crypto.randomBytes as jest.Mock).mockReturnValue(Buffer.from('temppass123'));
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-temp-password');

      const mockCreatedUser = {
        id: 'new-user-1',
        email: createDto.email,
        firstName: createDto.firstName,
        lastName: createDto.lastName,
      };

      prisma.$transaction.mockResolvedValue({
        user: mockCreatedUser,
        roles: [{ id: 'role-1', name: 'USER' }],
      });

      emailService.sendWelcomeEmail.mockResolvedValue(undefined);

      const result = await service.createUserWithTempPassword(createDto, 'admin-1');

      expect(result.user.email).toBe(createDto.email);
      expect(result.temporaryPassword).toBeDefined();
      expect(emailService.sendWelcomeEmail).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const updateDto = {
      firstName: 'Updated',
      lastName: 'Name',
    };

    it('should update user successfully', async () => {
      const existingUser = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      prisma.user.findUnique.mockResolvedValue(existingUser as any);
      
      const updatedUser = { ...existingUser, ...updateDto };
      prisma.$transaction.mockResolvedValue(updatedUser);

      const result = await service.update('user-1', updateDto, 'admin-1');

      expect(result.firstName).toBe('Updated');
      expect(auditLogger.logEvent).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent', updateDto, 'admin-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when updating to existing email', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce({ id: 'user-1', email: 'original@example.com' } as any)
        .mockResolvedValueOnce({ id: 'user-2', email: 'taken@example.com' } as any);

      await expect(
        service.update('user-1', { email: 'taken@example.com' }, 'admin-1')
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateStatus', () => {
    it('should activate user', async () => {
      const user = { id: 'user-1', isActive: false };
      prisma.user.findUnique.mockResolvedValue(user as any);
      prisma.user.update.mockResolvedValue({ ...user, isActive: true } as any);

      await service.updateStatus('user-1', { isActive: true, reason: 'Reactivation' }, 'admin-1');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: expect.objectContaining({ isActive: true }),
      });
    });

    it('should deactivate user', async () => {
      const user = { id: 'user-1', isActive: true };
      prisma.user.findUnique.mockResolvedValue(user as any);
      prisma.user.update.mockResolvedValue({ ...user, isActive: false } as any);

      await service.updateStatus('user-1', { isActive: false, reason: 'Suspended' }, 'admin-1');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: expect.objectContaining({ isActive: false }),
      });
    });
  });

  describe('updateVerification', () => {
    it('should verify user', async () => {
      const user = { id: 'user-1', isVerified: false };
      prisma.user.findUnique.mockResolvedValue(user as any);
      prisma.user.update.mockResolvedValue({ ...user, isVerified: true } as any);

      await service.updateVerification('user-1', { isVerified: true }, 'admin-1');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: expect.objectContaining({ isVerified: true }),
      });
    });
  });

  describe('remove', () => {
    it('should soft delete user (deactivate)', async () => {
      const user = { id: 'user-1', isActive: true };
      prisma.user.findUnique.mockResolvedValue(user as any);
      prisma.user.update.mockResolvedValue({ ...user, isActive: false } as any);

      const result = await service.remove('user-1', 'admin-1');

      expect(result.message).toContain('deactivated');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: expect.objectContaining({ isActive: false }),
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent', 'admin-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('assignRoles', () => {
    const assignDto = {
      roleIds: ['role-1', 'role-2'],
      reason: 'Promotion',
    };

    it('should assign roles to user', async () => {
      const user = { id: 'user-1' };
      const roles = [
        { id: 'role-1', name: 'ADMIN', isActive: true },
        { id: 'role-2', name: 'MANAGER', isActive: true },
      ];

      prisma.user.findUnique.mockResolvedValue(user as any);
      prisma.role.findMany.mockResolvedValue(roles as any);
      prisma.$transaction.mockResolvedValue(undefined);

      await service.assignRoles('user-1', assignDto, 'admin-1');

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(auditLogger.logEvent).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.assignRoles('non-existent', assignDto, 'admin-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when roles not found', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1' } as any);
      prisma.role.findMany.mockResolvedValue([]);

      await expect(service.assignRoles('user-1', assignDto, 'admin-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('revokeRoles', () => {
    const revokeDto = {
      roleIds: ['role-1'],
      reason: 'Role change',
    };

    it('should revoke roles from user', async () => {
      const user = { id: 'user-1' };
      const existingRoles = [
        { userId: 'user-1', roleId: 'role-1', isActive: true, role: { name: 'ADMIN' } },
      ];

      prisma.user.findUnique.mockResolvedValue(user as any);
      prisma.userRole.findMany.mockResolvedValue(existingRoles as any);
      prisma.$transaction.mockResolvedValue(undefined);

      await service.revokeRoles('user-1', revokeDto, 'admin-1');

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(auditLogger.logEvent).toHaveBeenCalled();
    });

    it('should throw NotFoundException when no active roles found', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1' } as any);
      prisma.userRole.findMany.mockResolvedValue([]);

      await expect(service.revokeRoles('user-1', revokeDto, 'admin-1')).rejects.toThrow(NotFoundException);
    });
  });
});
