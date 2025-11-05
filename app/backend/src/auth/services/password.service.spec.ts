import { Test, TestingModule } from '@nestjs/testing';
import {
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  GoneException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PasswordService } from './password.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditLoggerService } from '../../common/services/audit-logger.service';
import * as bcrypt from 'bcrypt';
import * as passwordValidator from '../../common/utils/password-validator.util';
import * as passwordGenerator from '../../common/utils/password-generator.util';

// Mock external modules
jest.mock('bcrypt');
jest.mock('../../common/utils/password-validator.util');
jest.mock('../../common/utils/password-generator.util');

describe('PasswordService', () => {
  let service: PasswordService;
  let prisma: jest.Mocked<PrismaService>;
  let jwtService: jest.Mocked<JwtService>;
  let auditLogger: jest.Mocked<AuditLoggerService>;
  let configService: jest.Mocked<ConfigService>;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    session: {
      updateMany: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockAuditLogger = {
    logEvent: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config = {
        'jwt.accessTokenExpiry': '15m',
        'jwt.refreshTokenExpiry': '7d',
      };
      return config[key] || defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: AuditLoggerService,
          useValue: mockAuditLogger,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<PasswordService>(PasswordService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    jwtService = module.get(JwtService) as jest.Mocked<JwtService>;
    auditLogger = module.get(AuditLoggerService) as jest.Mocked<AuditLoggerService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('setPassword', () => {
    const userId = 'user-123';
    const setPasswordDto = {
      tempPassword: 'Temp123!',
      newPassword: 'NewSecure123!',
      confirmPassword: 'NewSecure123!',
    };

    const mockUser = {
      id: userId,
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      password: 'hashed-temp-password',
      isTempPassword: true,
      tempPasswordExpiresAt: new Date(Date.now() + 86400000), // 1 day from now
      userRoles: [
        {
          isActive: true,
          role: { name: 'USER' },
        },
      ],
    };

    it('should successfully set password and return new tokens', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      (passwordGenerator.isTempPasswordExpired as jest.Mock).mockReturnValue(false);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (passwordValidator.validateNewPassword as jest.Mock).mockReturnValue({
        isValid: true,
        errors: [],
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
      prisma.user.update.mockResolvedValue({} as any);
      prisma.session.updateMany.mockResolvedValue({ count: 1 });
      prisma.session.create.mockResolvedValue({} as any);
      jwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');
      auditLogger.logEvent.mockResolvedValue(undefined);

      // Act
      const result = await service.setPassword(userId, setPasswordDto);

      // Assert
      expect(result.message).toBe('Password set successfully');
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.user.email).toBe(mockUser.email);
      expect(result.user.roles).toContain('USER');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          password: 'new-hashed-password',
          isTempPassword: false,
          tempPasswordExpiresAt: null,
          passwordSetAt: expect.any(Date),
          isVerified: true,
          updatedAt: expect.any(Date),
        },
      });
      expect(prisma.session.updateMany).toHaveBeenCalledWith({
        where: { userId },
        data: { isRevoked: true },
      });
      expect(prisma.session.create).toHaveBeenCalled();
      expect(auditLogger.logEvent).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.setPassword(userId, setPasswordDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.setPassword(userId, setPasswordDto)).rejects.toThrow('User not found');
    });

    it('should throw BadRequestException when user does not have temporary password', async () => {
      // Arrange
      const userWithoutTempPassword = {
        ...mockUser,
        isTempPassword: false,
      };
      prisma.user.findUnique.mockResolvedValue(userWithoutTempPassword as any);

      // Act & Assert
      await expect(service.setPassword(userId, setPasswordDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.setPassword(userId, setPasswordDto)).rejects.toThrow(
        'User does not have a temporary password',
      );
    });

    it('should throw GoneException when temporary password has expired', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      (passwordGenerator.isTempPasswordExpired as jest.Mock).mockReturnValue(true);
      auditLogger.logEvent.mockResolvedValue(undefined);

      // Act & Assert
      await expect(service.setPassword(userId, setPasswordDto)).rejects.toThrow(GoneException);
      expect(auditLogger.logEvent).toHaveBeenCalledWith({
        action: expect.any(String),
        userId,
        resource: 'auth',
        details: { reason: 'Temp password expired', targetUserId: userId },
      });
    });

    it('should throw UnauthorizedException when temporary password is invalid', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      (passwordGenerator.isTempPasswordExpired as jest.Mock).mockReturnValue(false);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      auditLogger.logEvent.mockResolvedValue(undefined);

      // Act & Assert
      await expect(service.setPassword(userId, setPasswordDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(auditLogger.logEvent).toHaveBeenCalledWith({
        action: expect.any(String),
        userId,
        resource: 'auth',
        details: { reason: 'Invalid temp password', targetUserId: userId },
      });
    });

    it('should throw BadRequestException when password validation fails', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      (passwordGenerator.isTempPasswordExpired as jest.Mock).mockReturnValue(false);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (passwordValidator.validateNewPassword as jest.Mock).mockReturnValue({
        isValid: false,
        errors: ['Password must be at least 12 characters', 'Password too weak'],
      });
      auditLogger.logEvent.mockResolvedValue(undefined);

      // Act & Assert
      await expect(service.setPassword(userId, setPasswordDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(auditLogger.logEvent).toHaveBeenCalledWith({
        action: expect.any(String),
        userId,
        resource: 'auth',
        details: {
          errors: ['Password must be at least 12 characters', 'Password too weak'],
          targetUserId: userId,
        },
      });
    });

    it('should throw BadRequestException when confirmPassword does not match', async () => {
      // Arrange
      const mismatchDto = {
        ...setPasswordDto,
        confirmPassword: 'DifferentPassword123!',
      };
      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      (passwordGenerator.isTempPasswordExpired as jest.Mock).mockReturnValue(false);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (passwordValidator.validateNewPassword as jest.Mock).mockReturnValue({
        isValid: false,
        errors: ['Passwords do not match'],
      });
      auditLogger.logEvent.mockResolvedValue(undefined);

      // Act & Assert
      await expect(service.setPassword(userId, mismatchDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle generic errors and throw BadRequestException', async () => {
      // Arrange
      prisma.user.findUnique.mockRejectedValue(new Error('Database connection error'));

      // Act & Assert
      await expect(service.setPassword(userId, setPasswordDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.setPassword(userId, setPasswordDto)).rejects.toThrow(
        'Failed to set password',
      );
    });

    it('should generate correct JWT tokens with user payload', async () => {
      // Arrange
      const multiRoleUser = {
        ...mockUser,
        userRoles: [
          { isActive: true, role: { name: 'USER' } },
          { isActive: true, role: { name: 'ADMIN' } },
        ],
      };
      prisma.user.findUnique.mockResolvedValue(multiRoleUser as any);
      (passwordGenerator.isTempPasswordExpired as jest.Mock).mockReturnValue(false);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (passwordValidator.validateNewPassword as jest.Mock).mockReturnValue({
        isValid: true,
        errors: [],
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
      prisma.user.update.mockResolvedValue({} as any);
      prisma.session.updateMany.mockResolvedValue({ count: 1 });
      prisma.session.create.mockResolvedValue({} as any);
      jwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');
      auditLogger.logEvent.mockResolvedValue(undefined);

      // Act
      const result = await service.setPassword(userId, setPasswordDto);

      // Assert
      expect(jwtService.sign).toHaveBeenCalledWith(
        {
          sub: userId,
          email: mockUser.email,
          roles: ['USER', 'ADMIN'],
        },
        { expiresIn: '15m' },
      );
      expect(jwtService.sign).toHaveBeenCalledWith(
        {
          sub: userId,
          email: mockUser.email,
          roles: ['USER', 'ADMIN'],
        },
        { expiresIn: '7d' },
      );
      expect(result.user.roles).toEqual(['USER', 'ADMIN']);
    });

    it('should revoke all existing sessions when setting new password', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      (passwordGenerator.isTempPasswordExpired as jest.Mock).mockReturnValue(false);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (passwordValidator.validateNewPassword as jest.Mock).mockReturnValue({
        isValid: true,
        errors: [],
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
      prisma.user.update.mockResolvedValue({} as any);
      prisma.session.updateMany.mockResolvedValue({ count: 3 }); // Simulate 3 sessions revoked
      prisma.session.create.mockResolvedValue({} as any);
      jwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');
      auditLogger.logEvent.mockResolvedValue(undefined);

      // Act
      await service.setPassword(userId, setPasswordDto);

      // Assert
      expect(prisma.session.updateMany).toHaveBeenCalledWith({
        where: { userId },
        data: { isRevoked: true },
      });
    });

    it('should create new session with correct expiration', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      (passwordGenerator.isTempPasswordExpired as jest.Mock).mockReturnValue(false);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (passwordValidator.validateNewPassword as jest.Mock).mockReturnValue({
        isValid: true,
        errors: [],
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
      prisma.user.update.mockResolvedValue({} as any);
      prisma.session.updateMany.mockResolvedValue({ count: 1 });
      prisma.session.create.mockResolvedValue({} as any);
      jwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');
      auditLogger.logEvent.mockResolvedValue(undefined);

      // Act
      await service.setPassword(userId, setPasswordDto);

      // Assert
      expect(prisma.session.create).toHaveBeenCalledWith({
        data: {
          userId: mockUser.id,
          refreshToken: 'refresh-token',
          expiresAt: expect.any(Date),
          isRevoked: false,
        },
      });
    });
  });
});
