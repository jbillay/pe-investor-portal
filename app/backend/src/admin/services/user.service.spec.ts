import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
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

  // Mock transaction helper
  const mockTransactionCallback = (callback: any) => {
    return callback(mockPrisma);
  };

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    userProfile: { create: jest.fn() },
    userRole: {
      createMany: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      deleteMany: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      count: jest.fn(),
    },
    role: { findMany: jest.fn() },
    roleAssignment: {
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(mockTransactionCallback),
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
    logUserEvent: jest.fn(),
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

    // Suppress logger output
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
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
      auditLogger.logUserEvent.mockResolvedValue(undefined);

      const result = await service.findAll({ page: 1, limit: 20 }, 'admin-1');

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(auditLogger.logUserEvent).toHaveBeenCalled();
    });

    it('should filter users by search term', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);
      auditLogger.logUserEvent.mockResolvedValue(undefined);

      await service.findAll({ page: 1, limit: 20, search: 'john' }, 'admin-1');

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        })
      );
    });

    it('should filter by status', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);
      auditLogger.logUserEvent.mockResolvedValue(undefined);

      await service.findAll({ page: 1, limit: 20, status: 'ACTIVE' as any }, 'admin-1');

      expect(prisma.user.findMany).toHaveBeenCalled();
    });

    it('should filter by verification status', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);
      auditLogger.logUserEvent.mockResolvedValue(undefined);

      await service.findAll({ page: 1, limit: 20, isVerified: true }, 'admin-1');

      expect(prisma.user.findMany).toHaveBeenCalled();
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
      roles: ['USER'],
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

      const mockRoles = [{ id: 'role-1', name: 'USER' }];
      prisma.role.findMany.mockResolvedValue(mockRoles as any);
      prisma.user.create.mockResolvedValue(mockCreatedUser as any);
      prisma.userRole.createMany.mockResolvedValue({ count: 1 } as any);

      prisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });

      const result = await service.create(createUserDto, 'admin-1');

      expect(result.user.email).toBe(createUserDto.email);
      expect(auditLogger.logUserEvent).toHaveBeenCalled();
    });

    it('should throw ConflictException when email exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing-user' } as any);

      await expect(service.create(createUserDto, 'admin-1')).rejects.toThrow(ConflictException);
    });

    it('should handle database errors during creation', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      prisma.role.findMany.mockResolvedValue([{ id: 'role-1', name: 'USER' }] as any);

      prisma.$transaction.mockRejectedValue(new Error('Database error'));

      await expect(service.create(createUserDto, 'admin-1')).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('createUserWithTempPassword', () => {
    const createDto = {
      email: 'newuser@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      roles: ['USER'],
    };

    it('should create user with temporary password', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      (crypto.randomBytes as jest.Mock).mockReturnValue({
        toString: jest.fn().mockReturnValue('temppass123')
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-temp-password');

      const mockCreatedUser = {
        id: 'new-user-1',
        email: createDto.email,
        firstName: createDto.firstName,
        lastName: createDto.lastName,
      };

      const mockRoles = [{ id: 'role-1', name: 'USER' }];
      prisma.role.findMany.mockResolvedValue(mockRoles as any);
      prisma.user.create.mockResolvedValue(mockCreatedUser as any);
      prisma.userRole.createMany.mockResolvedValue({ count: 1 } as any);

      prisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });

      emailService.sendWelcomeEmail.mockResolvedValue(undefined);

      const result = await service.createUserWithTempPassword(createDto, 'admin-1');

      expect(result.user.email).toBe(createDto.email);
      expect(result.temporaryPassword).toBeDefined();
      expect(emailService.sendWelcomeEmail).toHaveBeenCalled();
    });

    it('should handle email sending failures gracefully', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      (crypto.randomBytes as jest.Mock).mockReturnValue({
        toString: jest.fn().mockReturnValue('temppass123')
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-temp-password');

      const mockCreatedUser = {
        id: 'new-user-1',
        email: createDto.email,
        firstName: createDto.firstName,
        lastName: createDto.lastName,
      };

      prisma.role.findMany.mockResolvedValue([{ id: 'role-1', name: 'USER' }] as any);
      prisma.user.create.mockResolvedValue(mockCreatedUser as any);
      prisma.userRole.createMany.mockResolvedValue({ count: 1 } as any);

      prisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });

      emailService.sendWelcomeEmail.mockRejectedValue(new Error('Email service error'));

      const result = await service.createUserWithTempPassword(createDto, 'admin-1');

      expect(result.user.email).toBe(createDto.email);
      expect(result.temporaryPassword).toBeDefined();
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
        updatedAt: new Date(),
      };

      prisma.user.findUnique.mockResolvedValue(existingUser as any);

      const updatedUser = { ...existingUser, ...updateDto };
      prisma.user.update.mockResolvedValue(updatedUser as any);

      prisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });

      const result = await service.update('user-1', updateDto, 'admin-1');

      expect(result.firstName).toBe('Updated');
      expect(auditLogger.logUserEvent).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent', updateDto, 'admin-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when updating to existing email', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce({ id: 'user-1', email: 'original@example.com', updatedAt: new Date() } as any)
        .mockResolvedValueOnce({ id: 'user-2', email: 'taken@example.com' } as any);

      await expect(
        service.update('user-1', { email: 'taken@example.com' }, 'admin-1')
      ).rejects.toThrow(ConflictException);
    });

    it('should detect concurrent updates', async () => {
      const oldTimestamp = new Date('2024-01-01');
      const newTimestamp = new Date('2024-01-02');

      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        updatedAt: newTimestamp
      } as any);

      await expect(
        service.update('user-1', { firstName: 'Test', updatedAt: oldTimestamp } as any, 'admin-1')
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

    it('should throw NotFoundException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus('non-existent', { isActive: true }, 'admin-1')
      ).rejects.toThrow(NotFoundException);
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

    it('should unverify user', async () => {
      const user = { id: 'user-1', isVerified: true };
      prisma.user.findUnique.mockResolvedValue(user as any);
      prisma.user.update.mockResolvedValue({ ...user, isVerified: false } as any);

      await service.updateVerification('user-1', { isVerified: false }, 'admin-1');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: expect.objectContaining({ isVerified: false }),
      });
    });
  });

  describe('remove', () => {
    it('should soft delete user (deactivate)', async () => {
      prisma.user.update.mockResolvedValue({ id: 'user-1', isActive: false } as any);
      prisma.session.updateMany = jest.fn().mockResolvedValue({ count: 0 });
      prisma.userRole.updateMany.mockResolvedValue({ count: 0 } as any);

      prisma.$transaction.mockImplementation(async (callback) => {
        return await callback({
          ...mockPrisma,
          session: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
        });
      });

      const result = await service.remove('user-1', 'admin-1');

      expect(result.message).toContain('deactivated');
      expect(eventEmitter.emit).toHaveBeenCalledWith('user.deleted', expect.any(Object));
    });

    it('should throw BadRequestException when trying to delete own account', async () => {
      await expect(service.remove('admin-1', 'admin-1')).rejects.toThrow(BadRequestException);
    });

    it('should handle database errors during deletion', async () => {
      prisma.$transaction.mockRejectedValue(new Error('Database error'));

      await expect(service.remove('user-1', 'admin-1')).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('assignRoles', () => {
    const assignDto = {
      roles: ['ADMIN', 'MANAGER'],
      reason: 'Promotion',
    };

    it('should assign roles to user', async () => {
      const roles = [
        { id: 'role-1', name: 'ADMIN', isActive: true },
        { id: 'role-2', name: 'MANAGER', isActive: true },
      ];

      prisma.role.findMany.mockResolvedValue(roles as any);
      prisma.userRole.findFirst.mockResolvedValue(null);
      prisma.userRole.upsert.mockResolvedValue({} as any);
      prisma.roleAssignment.create.mockResolvedValue({} as any);

      prisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });

      const result = await service.assignRoles('user-1', assignDto, 'admin-1');

      expect(result.message).toContain('assigned successfully');
      expect(auditLogger.logUserEvent).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith('user.roles.assigned', expect.any(Object));
    });

    it('should throw BadRequestException when roles not found', async () => {
      prisma.role.findMany.mockResolvedValue([{ id: 'role-1', name: 'ADMIN' }] as any);

      await expect(service.assignRoles('user-1', assignDto, 'admin-1')).rejects.toThrow(BadRequestException);
    });

    it('should skip already assigned roles', async () => {
      const roles = [
        { id: 'role-1', name: 'ADMIN', isActive: true },
        { id: 'role-2', name: 'MANAGER', isActive: true },
      ];

      prisma.role.findMany.mockResolvedValue(roles as any);
      prisma.userRole.findFirst.mockResolvedValue({ id: 'existing', isActive: true } as any);

      prisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });

      await service.assignRoles('user-1', assignDto, 'admin-1');

      expect(prisma.userRole.upsert).not.toHaveBeenCalled();
      expect(prisma.roleAssignment.create).not.toHaveBeenCalled();
    });
  });

  describe('revokeRoles', () => {
    const revokeDto = {
      roles: ['ADMIN'],
      reason: 'Role change',
    };

    it('should revoke roles from user', async () => {
      const userRoles = [
        { id: 'ur-1', userId: 'user-1', roleId: 'role-1', isActive: true, role: { name: 'ADMIN' } },
      ];

      prisma.userRole.findMany.mockResolvedValue(userRoles as any);
      prisma.userRole.count.mockResolvedValue(1); // At least one role remaining
      prisma.userRole.update.mockResolvedValue({} as any);
      prisma.roleAssignment.updateMany.mockResolvedValue({ count: 1 } as any);

      prisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });

      const result = await service.revokeRoles('user-1', revokeDto, 'admin-1');

      expect(result.message).toContain('revoked successfully');
      expect(auditLogger.logUserEvent).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith('user.roles.revoked', expect.any(Object));
    });

    it('should throw BadRequestException when user does not have specified roles', async () => {
      prisma.userRole.findMany.mockResolvedValue([]);

      await expect(service.revokeRoles('user-1', revokeDto, 'admin-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when trying to revoke all roles', async () => {
      const userRoles = [
        { id: 'ur-1', userId: 'user-1', roleId: 'role-1', isActive: true, role: { name: 'ADMIN' } },
      ];

      prisma.userRole.findMany.mockResolvedValue(userRoles as any);
      prisma.userRole.count.mockResolvedValue(0); // No roles remaining

      await expect(service.revokeRoles('user-1', revokeDto, 'admin-1')).rejects.toThrow(BadRequestException);
    });
  });
});
