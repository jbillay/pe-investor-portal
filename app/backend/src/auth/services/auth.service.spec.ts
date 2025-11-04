import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SessionService } from './session.service';
import { AuditLoggerService } from '../../common/services/audit-logger.service';
import {
  createMockPrismaService,
  createMockConfigService,
  createMockJwtService,
  createMockSessionService,
  createMockAuditLoggerService,
} from '../../../test/mocks';
import { createMockUser, createMockUserProfile } from '../../../test/factories';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: ReturnType<typeof createMockPrismaService>;
  let jwtService: ReturnType<typeof createMockJwtService>;
  let configService: ReturnType<typeof createMockConfigService>;
  let sessionService: ReturnType<typeof createMockSessionService>;
  let auditLogger: ReturnType<typeof createMockAuditLoggerService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: createMockPrismaService(),
        },
        {
          provide: JwtService,
          useValue: createMockJwtService(),
        },
        {
          provide: ConfigService,
          useValue: createMockConfigService(),
        },
        {
          provide: SessionService,
          useValue: createMockSessionService(),
        },
        {
          provide: AuditLoggerService,
          useValue: createMockAuditLoggerService(),
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    sessionService = module.get(SessionService);
    auditLogger = module.get(AuditLoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'newuser@example.com',
      password: 'Password123!',
      firstName: 'New',
      lastName: 'User',
    };

    it('should register a new user successfully', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      const mockUser = createMockUser({
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
      });
      prisma.user.create.mockResolvedValue(mockUser);
      prisma.userProfile.create.mockResolvedValue(createMockUserProfile({ userId: mockUser.id }));

      // Act
      const result = await service.register(registerDto, 'Mozilla/5.0', '127.0.0.1');

      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(registerDto.email);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(prisma.user.create).toHaveBeenCalled();
      expect(prisma.userProfile.create).toHaveBeenCalled();
      expect(sessionService.createSession).toHaveBeenCalled();
      expect(auditLogger.logAuthEvent).toHaveBeenCalledWith(
        'REGISTER',
        mockUser.id,
        '127.0.0.1',
        'Mozilla/5.0',
      );
    });

    it('should throw ConflictException when user already exists', async () => {
      // Arrange
      const existingUser = createMockUser({ email: registerDto.email });
      prisma.user.findUnique.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      await expect(service.register(registerDto)).rejects.toThrow(
        'User with this email already exists',
      );
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should hash password with bcrypt', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      const mockUser = createMockUser();
      prisma.user.create.mockResolvedValue(mockUser);
      prisma.userProfile.create.mockResolvedValue(createMockUserProfile());

      // Act
      await service.register(registerDto);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 4);
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    it('should login user successfully', async () => {
      // Arrange
      const mockUser = createMockUser({
        email: loginDto.email,
        password: 'hashedPassword',
      });
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await service.login(loginDto, 'Mozilla/5.0', '127.0.0.1');

      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(loginDto.email);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { lastLogin: expect.any(Date) },
      });
      expect(sessionService.createSession).toHaveBeenCalled();
      expect(auditLogger.logAuthEvent).toHaveBeenCalledWith(
        'LOGIN',
        mockUser.id,
        '127.0.0.1',
        'Mozilla/5.0',
      );
    });

    it('should throw UnauthorizedException when user not found', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      // Arrange
      const inactiveUser = createMockUser({ email: loginDto.email, isActive: false });
      prisma.user.findUnique.mockResolvedValue(inactiveUser);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      // Arrange
      const mockUser = createMockUser({ email: loginDto.email });
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should indicate requiresPasswordChange when isTempPassword is true', async () => {
      // Arrange
      const mockUser = createMockUser({
        email: loginDto.email,
        isTempPassword: true,
      });
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(result.requiresPasswordChange).toBe(true);
    });
  });

  describe('refreshToken', () => {
    const refreshToken = 'valid-refresh-token';

    it('should refresh tokens successfully', async () => {
      // Arrange
      const mockUser = createMockUser();
      const sessionData = {
        userId: mockUser.id,
        refreshToken,
        expiresAt: new Date(Date.now() + 86400000),
      };
      sessionService.getSession.mockResolvedValue(sessionData);
      prisma.user.findUnique.mockResolvedValue(mockUser);

      // Act
      const result = await service.refreshToken(refreshToken, 'Mozilla/5.0', '127.0.0.1');

      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(sessionService.getSession).toHaveBeenCalledWith(refreshToken);
      expect(sessionService.revokeSession).toHaveBeenCalledWith(refreshToken);
      expect(sessionService.createSession).toHaveBeenCalled();
      expect(auditLogger.logAuthEvent).toHaveBeenCalledWith(
        'TOKEN_REFRESH',
        mockUser.id,
        '127.0.0.1',
        'Mozilla/5.0',
      );
    });

    it('should throw UnauthorizedException when session not found', async () => {
      // Arrange
      sessionService.getSession.mockResolvedValue(null);

      // Act & Assert
      await expect(service.refreshToken(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.refreshToken(refreshToken)).rejects.toThrow(
        'Invalid refresh token',
      );
    });

    it('should throw UnauthorizedException when user not found', async () => {
      // Arrange
      const sessionData = {
        userId: 'non-existent-user',
        refreshToken,
        expiresAt: new Date(Date.now() + 86400000),
      };
      sessionService.getSession.mockResolvedValue(sessionData);
      prisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.refreshToken(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.refreshToken(refreshToken)).rejects.toThrow(
        'User not found or inactive',
      );
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      // Arrange
      const sessionData = {
        userId: 'user-1',
        refreshToken,
        expiresAt: new Date(Date.now() + 86400000),
      };
      sessionService.getSession.mockResolvedValue(sessionData);
      // When querying with isActive: true, inactive user should return null
      prisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.refreshToken(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.refreshToken(refreshToken)).rejects.toThrow(
        'User not found or inactive',
      );
    });
  });

  describe('logout', () => {
    const refreshToken = 'valid-refresh-token';

    it('should logout user successfully', async () => {
      // Arrange
      const sessionData = {
        userId: 'user-1',
        refreshToken,
        expiresAt: new Date(Date.now() + 86400000),
      };
      sessionService.getSession.mockResolvedValue(sessionData);

      // Act
      await service.logout(refreshToken, 'Mozilla/5.0', '127.0.0.1');

      // Assert
      expect(sessionService.getSession).toHaveBeenCalledWith(refreshToken);
      expect(sessionService.revokeSession).toHaveBeenCalledWith(refreshToken);
      expect(auditLogger.logAuthEvent).toHaveBeenCalledWith(
        'LOGOUT',
        'user-1',
        '127.0.0.1',
        'Mozilla/5.0',
      );
    });

    it('should handle logout when session not found', async () => {
      // Arrange
      sessionService.getSession.mockResolvedValue(null);

      // Act
      await service.logout(refreshToken);

      // Assert
      expect(sessionService.revokeSession).toHaveBeenCalledWith(refreshToken);
      expect(auditLogger.logAuthEvent).not.toHaveBeenCalled();
    });
  });

  describe('logoutAll', () => {
    it('should logout all user sessions successfully', async () => {
      // Arrange
      const userId = 'user-1';
      const mockUser = createMockUser({ id: userId });
      prisma.user.findUnique.mockResolvedValue(mockUser);

      // Act
      await service.logoutAll(userId, 'Mozilla/5.0', '127.0.0.1');

      // Assert
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(sessionService.revokeAllUserSessions).toHaveBeenCalledWith(userId);
      expect(auditLogger.logAuthEvent).toHaveBeenCalledWith(
        'LOGOUT_ALL',
        userId,
        '127.0.0.1',
        'Mozilla/5.0',
      );
    });

    it('should handle logoutAll when user not found', async () => {
      // Arrange
      const userId = 'non-existent-user';
      prisma.user.findUnique.mockResolvedValue(null);

      // Act
      await service.logoutAll(userId);

      // Assert
      expect(sessionService.revokeAllUserSessions).toHaveBeenCalledWith(userId);
      expect(auditLogger.logAuthEvent).not.toHaveBeenCalled();
    });
  });

  describe('validateUser', () => {
    it('should return authenticated user when user is active', async () => {
      // Arrange
      const mockUser = createMockUser();
      prisma.user.findUnique.mockResolvedValue(mockUser);

      // Act
      const result = await service.validateUser(mockUser.id);

      // Assert
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        isActive: mockUser.isActive,
        isVerified: mockUser.isVerified,
      });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: mockUser.id,
          isActive: true,
        },
      });
    });

    it('should return null when user not found', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await service.validateUser('non-existent-user');

      // Assert
      expect(result).toBeNull();
    });
  });
});
