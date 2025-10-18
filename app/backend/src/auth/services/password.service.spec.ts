import { Test, TestingModule } from '@nestjs/testing';
import {
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  GoneException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { PasswordService } from './password.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditLoggerService } from '../../common/services/audit-logger.service';
import { SetPasswordDto } from '../dto/set-password.dto';
import {
  TestDataGenerator,
  DatabaseTestHelper,
  mockPrismaService,
  mockConfigService,
} from '../../../test/utils/test-utils';
import {
  PASSWORD_ERROR_MESSAGES,
  PASSWORD_AUDIT_ACTIONS,
} from '../../common/constants/password.constants';

// Mock bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

// Mock password validator
jest.mock('../../common/utils/password-validator.util', () => ({
  validateNewPassword: jest.fn(),
  validatePasswordMatch: jest.fn(),
}));

// Mock password generator
jest.mock('../../common/utils/password-generator.util', () => ({
  isTempPasswordExpired: jest.fn(),
}));

import { validateNewPassword } from '../../common/utils/password-validator.util';
import { isTempPasswordExpired } from '../../common/utils/password-generator.util';

const mockedValidateNewPassword = validateNewPassword as jest.MockedFunction<typeof validateNewPassword>;
const mockedIsTempPasswordExpired = isTempPasswordExpired as jest.MockedFunction<typeof isTempPasswordExpired>;

describe('PasswordService', () => {
  let service: PasswordService;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let auditLogger: AuditLoggerService;

  const mockAuditLogger = {
    logUserEvent: jest.fn(),
    logAuthEvent: jest.fn(),
    logResourceEvent: jest.fn(),
    logSecurityEvent: jest.fn(),
    logAdminEvent: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: AuditLoggerService,
          useValue: mockAuditLogger,
        },
        JwtService,
      ],
    }).compile();

    service = module.get<PasswordService>(PasswordService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    auditLogger = module.get<AuditLoggerService>(AuditLoggerService);

    // Reset all mocks before each test
    DatabaseTestHelper.resetMocks();
    Object.keys(mockAuditLogger).forEach((key) => {
      mockAuditLogger[key].mockReset();
    });
    mockedBcrypt.hash.mockReset();
    mockedBcrypt.compare.mockReset();
    mockedValidateNewPassword.mockReset();
    mockedIsTempPasswordExpired.mockReset();
  });

  describe('setPassword', () => {
    const userId = 'user-test-id';
    const validSetPasswordDto: SetPasswordDto = {
      tempPassword: 'TempPass123!@#',
      newPassword: 'NewSecurePassword123!@#',
      confirmPassword: 'NewSecurePassword123!@#',
    };

    const userWithTempPassword = {
      id: userId,
      email: 'test@example.com',
      password: '$2b$12$hashedTempPassword',
      firstName: 'Test',
      lastName: 'User',
      isActive: true,
      isVerified: false,
      isTempPassword: true,
      tempPasswordExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      passwordSetAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      userRoles: [
        {
          role: { name: 'INVESTOR' },
          isActive: true,
        },
      ],
    };

    it('should successfully set a new password for user with valid temp password', async () => {
      // Mock user lookup
      mockPrismaService.user.findUnique.mockResolvedValue(userWithTempPassword);

      // Mock temp password not expired
      mockedIsTempPasswordExpired.mockReturnValue(false);

      // Mock temp password verification
      mockedBcrypt.compare.mockResolvedValue(true as never);

      // Mock new password validation
      mockedValidateNewPassword.mockReturnValue({
        isValid: true,
        errors: [],
      });

      // Mock password hashing
      const hashedPassword = '$2b$12$hashedNewPassword';
      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);

      // Mock user update
      mockPrismaService.user.update.mockResolvedValue({
        ...userWithTempPassword,
        password: hashedPassword,
        isTempPassword: false,
        tempPasswordExpiresAt: null,
        passwordSetAt: new Date(),
        isVerified: true,
      });

      // Mock session revocation
      mockPrismaService.session.updateMany.mockResolvedValue({ count: 2 });

      // Mock JWT token generation
      jest
        .spyOn(jwtService, 'sign')
        .mockReturnValueOnce('new-access-token')
        .mockReturnValueOnce('new-refresh-token');

      // Mock new session creation
      mockPrismaService.session.create.mockResolvedValue({
        id: 'new-session-id',
        userId,
        refreshToken: 'new-refresh-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isRevoked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mock audit logging
      mockAuditLogger.logUserEvent.mockResolvedValue(undefined);

      const result = await service.setPassword(userId, validSetPasswordDto);

      // Verify result
      expect(result).toEqual({
        message: 'Password set successfully',
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        user: {
          id: userId,
          email: userWithTempPassword.email,
          firstName: userWithTempPassword.firstName,
          lastName: userWithTempPassword.lastName,
          roles: ['INVESTOR'],
        },
      });

      // Verify user was fetched with roles
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        include: {
          userRoles: {
            where: { isActive: true },
            include: {
              role: {
                select: { name: true },
              },
            },
          },
        },
      });

      // Verify temp password was checked
      expect(mockedIsTempPasswordExpired).toHaveBeenCalledWith(
        userWithTempPassword.tempPasswordExpiresAt,
      );

      // Verify temp password was validated
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        validSetPasswordDto.tempPassword,
        userWithTempPassword.password,
      );

      // Verify new password validation
      expect(mockedValidateNewPassword).toHaveBeenCalledWith(
        validSetPasswordDto.newPassword,
        validSetPasswordDto.confirmPassword,
        userWithTempPassword.email,
        validSetPasswordDto.tempPassword,
      );

      // Verify password was hashed
      expect(mockedBcrypt.hash).toHaveBeenCalled();

      // Verify user was updated
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          password: hashedPassword,
          isTempPassword: false,
          tempPasswordExpiresAt: null,
          passwordSetAt: expect.any(Date),
          isVerified: true,
          updatedAt: expect.any(Date),
        },
      });

      // Verify all sessions were revoked
      expect(mockPrismaService.session.updateMany).toHaveBeenCalledWith({
        where: { userId },
        data: { isRevoked: true },
      });

      // Verify new session was created
      expect(mockPrismaService.session.create).toHaveBeenCalled();

      // Verify audit log
      expect(mockAuditLogger.logUserEvent).toHaveBeenCalledWith(
        PASSWORD_AUDIT_ACTIONS.PASSWORD_SET,
        userId,
        userId,
        undefined,
        undefined,
        { email: userWithTempPassword.email },
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.setPassword(userId, validSetPasswordDto),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        include: expect.any(Object),
      });
    });

    it('should throw BadRequestException if user does not have temp password', async () => {
      const userWithoutTempPassword = {
        ...userWithTempPassword,
        isTempPassword: false,
        tempPasswordExpiresAt: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(userWithoutTempPassword);

      await expect(
        service.setPassword(userId, validSetPasswordDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.setPassword(userId, validSetPasswordDto),
      ).rejects.toThrow('User does not have a temporary password');
    });

    it('should throw GoneException if temp password has expired', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(userWithTempPassword);
      mockedIsTempPasswordExpired.mockReturnValue(true);

      await expect(
        service.setPassword(userId, validSetPasswordDto),
      ).rejects.toThrow(GoneException);
      await expect(
        service.setPassword(userId, validSetPasswordDto),
      ).rejects.toThrow(PASSWORD_ERROR_MESSAGES.TEMP_PASSWORD_EXPIRED);

      expect(mockAuditLogger.logUserEvent).toHaveBeenCalledWith(
        PASSWORD_AUDIT_ACTIONS.PASSWORD_VALIDATION_FAILED,
        userId,
        userId,
        undefined,
        undefined,
        { reason: 'Temp password expired' },
      );
    });

    it('should throw UnauthorizedException if temp password is invalid', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(userWithTempPassword);
      mockedIsTempPasswordExpired.mockReturnValue(false);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(
        service.setPassword(userId, validSetPasswordDto),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.setPassword(userId, validSetPasswordDto),
      ).rejects.toThrow(PASSWORD_ERROR_MESSAGES.INVALID_TEMP_PASSWORD);

      expect(mockAuditLogger.logUserEvent).toHaveBeenCalledWith(
        PASSWORD_AUDIT_ACTIONS.PASSWORD_VALIDATION_FAILED,
        userId,
        userId,
        undefined,
        undefined,
        { reason: 'Invalid temp password' },
      );
    });

    it('should throw BadRequestException if new password validation fails', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(userWithTempPassword);
      mockedIsTempPasswordExpired.mockReturnValue(false);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const validationErrors = [
        'Password must be at least 12 characters long',
        'Password must contain at least one uppercase letter',
      ];

      mockedValidateNewPassword.mockReturnValue({
        isValid: false,
        errors: validationErrors,
      });

      await expect(
        service.setPassword(userId, validSetPasswordDto),
      ).rejects.toThrow(BadRequestException);

      const error = await service
        .setPassword(userId, validSetPasswordDto)
        .catch((e) => e);

      expect(error.response).toEqual({
        message: 'Password validation failed',
        errors: validationErrors,
      });

      expect(mockAuditLogger.logUserEvent).toHaveBeenCalledWith(
        PASSWORD_AUDIT_ACTIONS.PASSWORD_VALIDATION_FAILED,
        userId,
        userId,
        undefined,
        undefined,
        { errors: validationErrors },
      );
    });

    it('should throw BadRequestException on unexpected errors', async () => {
      mockPrismaService.user.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(
        service.setPassword(userId, validSetPasswordDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.setPassword(userId, validSetPasswordDto),
      ).rejects.toThrow('Failed to set password');
    });

    it('should handle password validation with all checks', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(userWithTempPassword);
      mockedIsTempPasswordExpired.mockReturnValue(false);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      // Test various validation scenarios
      const testCases = [
        {
          validation: { isValid: false, errors: ['Password too short'] },
          expectedError: 'Password validation failed',
        },
        {
          validation: {
            isValid: false,
            errors: ['Password must not be the same as temporary password'],
          },
          expectedError: 'Password validation failed',
        },
        {
          validation: {
            isValid: false,
            errors: ['Password must not contain email address'],
          },
          expectedError: 'Password validation failed',
        },
      ];

      for (const testCase of testCases) {
        mockedValidateNewPassword.mockReturnValue(testCase.validation);

        await expect(
          service.setPassword(userId, validSetPasswordDto),
        ).rejects.toThrow(testCase.expectedError);
      }
    });
  });
});
