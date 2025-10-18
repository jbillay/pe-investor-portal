import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcrypt';

import { UserService } from './user.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditLoggerService } from '../../common/services/audit-logger.service';
import { EmailService } from '../../email/services/email.service';
import { CreateUserAdminDto } from '../dto/create-user-admin.dto';
import {
  TestDataGenerator,
  DatabaseTestHelper,
  mockPrismaService,
  mockConfigService,
} from '../../../test/utils/test-utils';

// Mock bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

// Mock password generator
jest.mock('../../common/utils/password-generator.util', () => ({
  generateTempPassword: jest.fn(),
  getTempPasswordExpiration: jest.fn(),
}));

import {
  generateTempPassword,
  getTempPasswordExpiration,
} from '../../common/utils/password-generator.util';

const mockedGenerateTempPassword = generateTempPassword as jest.MockedFunction<
  typeof generateTempPassword
>;
const mockedGetTempPasswordExpiration = getTempPasswordExpiration as jest.MockedFunction<
  typeof getTempPasswordExpiration
>;

describe('UserService - createUserWithTempPassword', () => {
  let service: UserService;
  let prisma: PrismaService;
  let configService: ConfigService;
  let emailService: EmailService;
  let eventEmitter: EventEmitter2;
  let auditLogger: AuditLoggerService;

  const mockEmailService = {
    sendTemplatedEmail: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  const mockAuditLogger = {
    logUserEvent: jest.fn(),
    logAuthEvent: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
        {
          provide: AuditLoggerService,
          useValue: mockAuditLogger,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);
    emailService = module.get<EmailService>(EmailService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    auditLogger = module.get<AuditLoggerService>(AuditLoggerService);

    // Reset all mocks
    DatabaseTestHelper.resetMocks();
    Object.keys(mockEmailService).forEach((key) => {
      mockEmailService[key].mockReset();
    });
    Object.keys(mockEventEmitter).forEach((key) => {
      mockEventEmitter[key].mockReset();
    });
    Object.keys(mockAuditLogger).forEach((key) => {
      mockAuditLogger[key].mockReset();
    });
    mockedBcrypt.hash.mockReset();
    mockedGenerateTempPassword.mockReset();
    mockedGetTempPasswordExpiration.mockReset();
  });

  describe('createUserWithTempPassword', () => {
    const createdById = 'admin-test-id';
    const validCreateUserDto: CreateUserAdminDto = {
      email: 'newuser@example.com',
      firstName: 'New',
      lastName: 'User',
      timezone: 'America/New_York',
    };

    const tempPassword = 'TempSecurePass123!@#';
    const tempPasswordExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours
    const hashedPassword = '$2b$12$hashedTempPassword';

    const createdUser = {
      id: 'new-user-id',
      email: validCreateUserDto.email,
      password: hashedPassword,
      firstName: validCreateUserDto.firstName,
      lastName: validCreateUserDto.lastName,
      isActive: true,
      isVerified: false,
      isTempPassword: true,
      tempPasswordExpiresAt,
      passwordSetAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null,
    };

    const defaultRole = {
      id: 'investor-role-id',
      name: 'INVESTOR',
      description: 'Default investor role',
      isActive: true,
      isDefault: true,
    };

    const userProfile = {
      id: 'profile-id',
      userId: createdUser.id,
      timezone: validCreateUserDto.timezone,
      language: 'en',
      preferences: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(() => {
      // Setup common mocks
      mockedGenerateTempPassword.mockReturnValue(tempPassword);
      mockedGetTempPasswordExpiration.mockReturnValue(tempPasswordExpiresAt);
      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);
      mockEmailService.sendTemplatedEmail.mockResolvedValue(undefined);
      mockAuditLogger.logUserEvent.mockResolvedValue(undefined);
      mockEventEmitter.emit.mockReturnValue(true);
    });

    it('should successfully create user with temp password and send welcome email', async () => {
      // Mock user doesn't exist
      DatabaseTestHelper.mockUserNotExists();

      // Mock transaction
      mockPrismaService.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = {
          user: {
            create: jest.fn().mockResolvedValue(createdUser),
          },
          userProfile: {
            create: jest.fn().mockResolvedValue(userProfile),
          },
          role: {
            findMany: jest.fn().mockResolvedValue([defaultRole]),
          },
          userRole: {
            create: jest.fn().mockResolvedValue({
              id: 'user-role-id',
              userId: createdUser.id,
              roleId: defaultRole.id,
              isActive: true,
            }),
          },
          roleAssignment: {
            create: jest.fn().mockResolvedValue({
              id: 'role-assignment-id',
              userId: createdUser.id,
              roleId: defaultRole.id,
              assignedBy: createdById,
              isActive: true,
            }),
          },
        };
        return callback(mockTx);
      });

      // Mock profile fetch
      mockPrismaService.userProfile.findUnique.mockResolvedValue(userProfile);

      // Mock config
      mockConfigService.get
        .mockReturnValueOnce('http://localhost:3000') // frontendUrl
        .mockReturnValueOnce('support@pe-portal.com') // supportEmail
        .mockReturnValueOnce('PE Investor Portal'); // app name

      const result = await service.createUserWithTempPassword(
        validCreateUserDto,
        createdById,
      );

      // Verify result
      expect(result).toEqual({
        id: createdUser.id,
        email: createdUser.email,
        firstName: createdUser.firstName,
        lastName: createdUser.lastName,
        tempPassword, // Important: temp password returned only once
        tempPasswordExpiresAt,
        roles: ['INVESTOR'],
        timezone: validCreateUserDto.timezone,
        emailSent: true,
        emailError: undefined,
        createdAt: createdUser.createdAt,
      });

      // Verify temp password was generated
      expect(mockedGenerateTempPassword).toHaveBeenCalled();
      expect(mockedGetTempPasswordExpiration).toHaveBeenCalled();

      // Verify password was hashed
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(tempPassword, 12);

      // Verify email was sent
      expect(mockEmailService.sendTemplatedEmail).toHaveBeenCalledWith({
        templateName: 'USER_ACCOUNT_CREATED',
        recipientEmail: createdUser.email,
        recipientName: `${createdUser.firstName} ${createdUser.lastName}`,
        variables: {
          firstName: createdUser.firstName,
          lastName: createdUser.lastName,
          fullName: `${createdUser.firstName} ${createdUser.lastName}`,
          email: createdUser.email,
          loginUrl: 'http://localhost:3000/login',
          tempPassword,
          expiresAt: expect.any(String),
          supportEmail: 'support@pe-portal.com',
          portalName: 'PE Investor Portal',
        },
      });

      // Verify audit log
      expect(mockAuditLogger.logUserEvent).toHaveBeenCalledWith(
        'USER_CREATED',
        createdById,
        createdUser.id,
        undefined,
        undefined,
        {
          email: createdUser.email,
          roles: ['INVESTOR'],
          tempPasswordGenerated: true,
          tempPasswordExpiresAt: tempPasswordExpiresAt.toISOString(),
          emailSent: true,
        },
      );

      // Verify event was emitted
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'user.created.with.temp.password',
        {
          userId: createdUser.id,
          email: createdUser.email,
          createdBy: createdById,
          tempPasswordExpiresAt,
          emailSent: true,
          timestamp: expect.any(Date),
        },
      );
    });

    it('should throw ConflictException if user already exists', async () => {
      const existingUser = TestDataGenerator.generateUser({
        email: validCreateUserDto.email,
      });

      DatabaseTestHelper.mockUserExists(existingUser);

      await expect(
        service.createUserWithTempPassword(validCreateUserDto, createdById),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.createUserWithTempPassword(validCreateUserDto, createdById),
      ).rejects.toThrow('User with this email already exists');

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: validCreateUserDto.email },
      });
    });

    it('should create user even if email sending fails', async () => {
      DatabaseTestHelper.mockUserNotExists();

      // Mock transaction
      mockPrismaService.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = {
          user: { create: jest.fn().mockResolvedValue(createdUser) },
          userProfile: { create: jest.fn().mockResolvedValue(userProfile) },
          role: { findMany: jest.fn().mockResolvedValue([defaultRole]) },
          userRole: { create: jest.fn().mockResolvedValue({}) },
          roleAssignment: { create: jest.fn().mockResolvedValue({}) },
        };
        return callback(mockTx);
      });

      mockPrismaService.userProfile.findUnique.mockResolvedValue(userProfile);

      // Mock email service to fail
      const emailError = new Error('Email service unavailable');
      mockEmailService.sendTemplatedEmail.mockRejectedValue(emailError);

      const result = await service.createUserWithTempPassword(
        validCreateUserDto,
        createdById,
      );

      // User should still be created
      expect(result.id).toBe(createdUser.id);
      expect(result.emailSent).toBe(false);
      expect(result.emailError).toBe('Email service unavailable');

      // Audit log should still be created
      expect(mockAuditLogger.logUserEvent).toHaveBeenCalledWith(
        'USER_CREATED',
        createdById,
        createdUser.id,
        undefined,
        undefined,
        expect.objectContaining({
          emailSent: false,
        }),
      );
    });

    it('should use UTC timezone if not provided', async () => {
      const dtoWithoutTimezone: CreateUserAdminDto = {
        email: 'newuser@example.com',
        firstName: 'New',
        lastName: 'User',
      };

      DatabaseTestHelper.mockUserNotExists();

      mockPrismaService.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = {
          user: { create: jest.fn().mockResolvedValue(createdUser) },
          userProfile: {
            create: jest.fn().mockImplementation((data) => {
              expect(data.data.timezone).toBe('UTC');
              return Promise.resolve(userProfile);
            }),
          },
          role: { findMany: jest.fn().mockResolvedValue([defaultRole]) },
          userRole: { create: jest.fn().mockResolvedValue({}) },
          roleAssignment: { create: jest.fn().mockResolvedValue({}) },
        };
        return callback(mockTx);
      });

      mockPrismaService.userProfile.findUnique.mockResolvedValue({
        ...userProfile,
        timezone: 'UTC',
      });

      const result = await service.createUserWithTempPassword(
        dtoWithoutTimezone,
        createdById,
      );

      expect(result.timezone).toBe('UTC');
    });

    it('should assign multiple default roles if available', async () => {
      const multipleDefaultRoles = [
        { id: 'role-1', name: 'INVESTOR', isActive: true, isDefault: true },
        { id: 'role-2', name: 'USER', isActive: true, isDefault: true },
      ];

      DatabaseTestHelper.mockUserNotExists();

      mockPrismaService.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = {
          user: { create: jest.fn().mockResolvedValue(createdUser) },
          userProfile: { create: jest.fn().mockResolvedValue(userProfile) },
          role: { findMany: jest.fn().mockResolvedValue(multipleDefaultRoles) },
          userRole: { create: jest.fn().mockResolvedValue({}) },
          roleAssignment: { create: jest.fn().mockResolvedValue({}) },
        };
        return callback(mockTx);
      });

      mockPrismaService.userProfile.findUnique.mockResolvedValue(userProfile);

      const result = await service.createUserWithTempPassword(
        validCreateUserDto,
        createdById,
      );

      expect(result.roles).toEqual(['INVESTOR', 'USER']);
    });

    it('should throw InternalServerErrorException on database error', async () => {
      DatabaseTestHelper.mockUserNotExists();

      mockPrismaService.$transaction.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(
        service.createUserWithTempPassword(validCreateUserDto, createdById),
      ).rejects.toThrow(InternalServerErrorException);
      await expect(
        service.createUserWithTempPassword(validCreateUserDto, createdById),
      ).rejects.toThrow('Failed to create user');
    });

    it('should set user as immediately active but not verified', async () => {
      DatabaseTestHelper.mockUserNotExists();

      mockPrismaService.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = {
          user: {
            create: jest.fn().mockImplementation((data) => {
              expect(data.data.isActive).toBe(true);
              expect(data.data.isVerified).toBe(false);
              expect(data.data.isTempPassword).toBe(true);
              expect(data.data.tempPasswordExpiresAt).toEqual(tempPasswordExpiresAt);
              return Promise.resolve(createdUser);
            }),
          },
          userProfile: { create: jest.fn().mockResolvedValue(userProfile) },
          role: { findMany: jest.fn().mockResolvedValue([defaultRole]) },
          userRole: { create: jest.fn().mockResolvedValue({}) },
          roleAssignment: { create: jest.fn().mockResolvedValue({}) },
        };
        return callback(mockTx);
      });

      mockPrismaService.userProfile.findUnique.mockResolvedValue(userProfile);

      await service.createUserWithTempPassword(validCreateUserDto, createdById);

      // Expectations are in the implementation mock above
    });
  });
});
