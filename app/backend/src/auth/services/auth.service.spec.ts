import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SessionService } from './session.service';
import { AuditLoggerService } from '../../common/services/audit-logger.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: jest.Mocked<PrismaService>;
  let jwtService: jest.Mocked<JwtService>;
  let sessionService: jest.Mocked<SessionService>;
  let auditLogger: jest.Mocked<AuditLoggerService>;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    userProfile: {
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config = {
        'BCRYPT_ROUNDS': '12',
        'JWT_ACCESS_TOKEN_EXPIRATION': '15m',
      };
      return config[key] || defaultValue;
    }),
  };

  const mockSessionService = {
    createSession: jest.fn(),
    getSession: jest.fn(),
    revokeSession: jest.fn(),
    revokeAllSessions: jest.fn(),
  };

  const mockAuditLogger = {
    logAuthEvent: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: SessionService, useValue: mockSessionService },
        { provide: AuditLoggerService, useValue: mockAuditLogger },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService) as any;
    jwtService = module.get(JwtService) as any;
    sessionService = module.get(SessionService) as any;
    auditLogger = module.get(AuditLoggerService) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'SecurePass123!',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should register new user successfully', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      const mockUser = {
        id: 'user-123',
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
      };
      prisma.user.create.mockResolvedValue(mockUser as any);
      prisma.userProfile.create.mockResolvedValue({} as any);
      jwtService.signAsync.mockResolvedValueOnce('access-token').mockResolvedValueOnce('refresh-token');
      sessionService.createSession.mockResolvedValue(undefined);
      auditLogger.logAuthEvent.mockResolvedValue(undefined);

      const result = await service.register(registerDto);

      expect(result.accessToken).toBe('access-token');
      expect(result.user.email).toBe(registerDto.email);
      expect(auditLogger.logAuthEvent).toHaveBeenCalled();
    });

    it('should throw ConflictException if user exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing' } as any);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    const loginDto = { email: 'test@example.com', password: 'SecurePass123!' };
    const mockUser = {
      id: 'user-123',
      email: loginDto.email,
      firstName: 'John',
      lastName: 'Doe',
      password: 'hashed-password',
      isActive: true,
      isTempPassword: false,
    };

    it('should login successfully', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.user.update.mockResolvedValue(mockUser as any);
      jwtService.signAsync.mockResolvedValueOnce('access-token').mockResolvedValueOnce('refresh-token');
      sessionService.createSession.mockResolvedValue(undefined);
      auditLogger.logAuthEvent.mockResolvedValue(undefined);

      const result = await service.login(loginDto);

      expect(result.accessToken).toBe('access-token');
      expect(result.requiresPasswordChange).toBe(false);
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens successfully', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com', firstName: 'John', lastName: 'Doe', isActive: true };
      sessionService.getSession.mockResolvedValue({ userId: mockUser.id } as any);
      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      jwtService.signAsync.mockResolvedValueOnce('new-access').mockResolvedValueOnce('new-refresh');
      sessionService.revokeSession.mockResolvedValue(undefined);
      sessionService.createSession.mockResolvedValue(undefined);
      auditLogger.logAuthEvent.mockResolvedValue(undefined);

      const result = await service.refreshToken('old-token');

      expect(result.accessToken).toBe('new-access');
      expect(sessionService.revokeSession).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      sessionService.getSession.mockResolvedValue(null);

      await expect(service.refreshToken('invalid')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      sessionService.getSession.mockResolvedValue({ userId: 'user-123' } as any);
      sessionService.revokeSession.mockResolvedValue(undefined);
      auditLogger.logAuthEvent.mockResolvedValue(undefined);

      await service.logout('token');

      expect(sessionService.revokeSession).toHaveBeenCalled();
    });
  });

  describe('validateUser', () => {
    it('should return user when valid', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
        userRoles: [{ isActive: true, role: { name: 'USER' } }],
      };
      prisma.user.findUnique.mockResolvedValue(mockUser as any);

      const result = await service.validateUser('user-123');

      expect(result?.email).toBe('test@example.com');
    });

    it('should return null when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser('invalid');

      expect(result).toBeNull();
    });
  });
});
