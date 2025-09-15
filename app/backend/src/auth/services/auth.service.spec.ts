import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { AuthService } from './auth.service';
import { SessionService } from './session.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoginDto, RegisterDto } from '../dto/auth.dto';
import {
  TestDataGenerator,
  DatabaseTestHelper,
  mockPrismaService,
  mockConfigService,
} from '../../../test/utils/test-utils';

// Mock bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt;

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let sessionService: SessionService;
  let prisma: PrismaService;

  const mockSessionService = {
    createSession: jest.fn(),
    getSession: jest.fn(),
    revokeSession: jest.fn(),
    revokeAllUserSessions: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: SessionService,
          useValue: mockSessionService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        JwtService,
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    sessionService = module.get<SessionService>(SessionService);
    prisma = module.get<PrismaService>(PrismaService);

    // Reset all mocks before each test
    DatabaseTestHelper.resetMocks();
    Object.keys(mockSessionService).forEach((key) => {
      mockSessionService[key].mockReset();
    });
    mockedBcrypt.hash.mockReset();
    mockedBcrypt.compare.mockReset();
  });

  describe('register', () => {
    const validRegisterDto: RegisterDto = {
      email: 'test@example.com',
      password: 'Password123',
      firstName: 'Test',
      lastName: 'User',
    };

    it('should successfully register a new user', async () => {
      const hashedPassword = 'hashedPassword123';
      const user = TestDataGenerator.generateUser({
        email: validRegisterDto.email,
        password: hashedPassword,
        firstName: validRegisterDto.firstName,
        lastName: validRegisterDto.lastName,
      });

      // Mock dependencies
      DatabaseTestHelper.mockUserNotExists();
      mockedBcrypt.hash.mockResolvedValue(hashedPassword);
      mockPrismaService.user.create.mockResolvedValue(user);
      mockPrismaService.userProfile.create.mockResolvedValue({});
      mockSessionService.createSession.mockResolvedValue(undefined);

      // Mock JWT token generation
      jest
        .spyOn(jwtService, 'signAsync')
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await service.register(
        validRegisterDto,
        'test-agent',
        '127.0.0.1',
      );

      // Verify result
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        expiresIn: 900, // 15 minutes in seconds
      });

      // Verify calls
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: validRegisterDto.email },
      });
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(
        validRegisterDto.password,
        4,
      );
      expect(mockPrismaService.user.create).toHaveBeenCalled();
      expect(mockSessionService.createSession).toHaveBeenCalled();
    });

    it('should throw ConflictException if user already exists', async () => {
      const existingUser = TestDataGenerator.generateUser({
        email: validRegisterDto.email,
      });
      DatabaseTestHelper.mockUserExists(existingUser);

      await expect(
        service.register(validRegisterDto, 'test-agent', '127.0.0.1'),
      ).rejects.toThrow(ConflictException);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: validRegisterDto.email },
      });
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });



  });

  describe('login', () => {
    const validLoginDto: LoginDto = {
      email: 'test@example.com',
      password: 'Password123',
    };

    it('should successfully login user with valid credentials', async () => {
      const hashedPassword = await TestDataGenerator.hashPassword(
        validLoginDto.password,
      );
      const user = TestDataGenerator.generateUser({
        email: validLoginDto.email,
        password: hashedPassword,
      });

      DatabaseTestHelper.mockUserExists(user);
      mockedBcrypt.compare.mockResolvedValue(true);
      mockPrismaService.user.update.mockResolvedValue(user);
      mockSessionService.createSession.mockResolvedValue(undefined);

      jest
        .spyOn(jwtService, 'signAsync')
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await service.login(
        validLoginDto,
        'test-agent',
        '127.0.0.1',
      );

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        expiresIn: 900,
      });

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: user.id },
        data: { lastLogin: expect.any(Date) },
      });
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      DatabaseTestHelper.mockUserNotExists();

      await expect(
        service.login(validLoginDto, 'test-agent', '127.0.0.1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      const inactiveUser = TestDataGenerator.generateUser({
        email: validLoginDto.email,
        isActive: false,
      });

      DatabaseTestHelper.mockUserExists(inactiveUser);

      await expect(
        service.login(validLoginDto, 'test-agent', '127.0.0.1'),
      ).rejects.toThrow(UnauthorizedException);
    });


    it('should throw UnauthorizedException for wrong password', async () => {
      const user = TestDataGenerator.generateUser({
        email: validLoginDto.email,
      });

      DatabaseTestHelper.mockUserExists(user);
      mockedBcrypt.compare.mockResolvedValue(false);

      await expect(
        service.login(validLoginDto, 'test-agent', '127.0.0.1'),
      ).rejects.toThrow(UnauthorizedException);
    });


  });

  describe('refreshToken', () => {
    it('should successfully refresh tokens with valid refresh token', async () => {
      const refreshToken = 'valid-refresh-token';
      const sessionData = {
        userId: 'user-test-id',
        refreshToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        userAgent: 'test-agent',
        ipAddress: '127.0.0.1',
      };
      const user = TestDataGenerator.generateUser();

      mockSessionService.getSession.mockResolvedValue(sessionData);
      DatabaseTestHelper.mockUserExists(user);
      mockSessionService.revokeSession.mockResolvedValue(undefined);
      mockSessionService.createSession.mockResolvedValue(undefined);

      jest
        .spyOn(jwtService, 'signAsync')
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');

      const result = await service.refreshToken(
        refreshToken,
        'test-agent',
        '127.0.0.1',
      );

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        expiresIn: 900,
      });

      expect(mockSessionService.revokeSession).toHaveBeenCalledWith(
        refreshToken,
      );
      expect(mockSessionService.createSession).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      const invalidRefreshToken = 'invalid-refresh-token';

      mockSessionService.getSession.mockResolvedValue(null);

      await expect(
        service.refreshToken(invalidRefreshToken, 'test-agent', '127.0.0.1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      const refreshToken = 'valid-refresh-token';
      const sessionData = {
        userId: 'user-test-id',
        refreshToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        userAgent: 'test-agent',
        ipAddress: '127.0.0.1',
      };
      const inactiveUser = TestDataGenerator.generateUser({ isActive: false });

      mockSessionService.getSession.mockResolvedValue(sessionData);
      DatabaseTestHelper.mockUserExists(inactiveUser);

      await expect(
        service.refreshToken(refreshToken, 'test-agent', '127.0.0.1'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should successfully logout user', async () => {
      const refreshToken = 'valid-refresh-token';
      const sessionData = {
        userId: 'user-test-id',
        refreshToken,
        expiresAt: new Date(),
        userAgent: 'test-agent',
        ipAddress: '127.0.0.1',
      };

      mockSessionService.getSession.mockResolvedValue(sessionData);
      mockSessionService.revokeSession.mockResolvedValue(undefined);

      await service.logout(refreshToken, 'test-agent', '127.0.0.1');

      expect(mockSessionService.revokeSession).toHaveBeenCalledWith(
        refreshToken,
      );
    });

    it('should handle logout for non-existent session gracefully', async () => {
      const refreshToken = 'invalid-refresh-token';

      mockSessionService.getSession.mockResolvedValue(null);
      mockSessionService.revokeSession.mockResolvedValue(undefined);

      await expect(
        service.logout(refreshToken, 'test-agent', '127.0.0.1'),
      ).resolves.toBeUndefined();
    });
  });

  describe('logoutAll', () => {
    it('should successfully logout user from all devices', async () => {
      const userId = 'user-test-id';
      const user = TestDataGenerator.generateUser({ id: userId });

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockSessionService.revokeAllUserSessions.mockResolvedValue(undefined);

      await service.logoutAll(userId, 'test-agent', '127.0.0.1');

      expect(mockSessionService.revokeAllUserSessions).toHaveBeenCalledWith(
        userId,
      );
    });
  });

  describe('validateUser', () => {
    it('should return user data for valid active user', async () => {
      const userId = 'user-test-id';
      const user = TestDataGenerator.generateUser({ id: userId });

      DatabaseTestHelper.mockUserExists(user);

      const result = await service.validateUser(userId);

      expect(result).toEqual({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        isVerified: user.isVerified,
      });
    });

    it('should return null for inactive user', async () => {
      const userId = 'user-test-id';
      const inactiveUser = TestDataGenerator.generateUser({
        id: userId,
        isActive: false,
      });

      DatabaseTestHelper.mockUserExists(inactiveUser);

      const result = await service.validateUser(userId);

      expect(result).toBeNull();
    });


    it('should return null for non-existent user', async () => {
      const userId = 'non-existent-user-id';

      DatabaseTestHelper.mockUserNotExists();

      const result = await service.validateUser(userId);

      expect(result).toBeNull();
    });
  });

  describe('private methods', () => {
    describe('generateTokens', () => {
      it('should generate access and refresh tokens', async () => {
        const payload = TestDataGenerator.generateJwtPayload();

        jest
          .spyOn(jwtService, 'signAsync')
          .mockResolvedValueOnce('access-token')
          .mockResolvedValueOnce('refresh-token');

        const result = await service['generateTokens'](payload);

        expect(result).toEqual({
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        });

        expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
        expect(jwtService.signAsync).toHaveBeenNthCalledWith(1, payload, {
          expiresIn: '15m',
          secret: 'test-jwt-secret',
        });
        expect(jwtService.signAsync).toHaveBeenNthCalledWith(
          2,
          expect.objectContaining({
            sub: payload.sub,
            type: 'refresh',
            jti: expect.any(String),
          }),
          {
            expiresIn: '7d',
            secret: 'test-refresh-secret',
          },
        );
      });
    });

    describe('getAccessTokenExpirationTime', () => {
      it('should return correct expiration time for minutes', () => {
        mockConfigService.get.mockReturnValue('15m');
        const result = service['getAccessTokenExpirationTime']();
        expect(result).toBe(900); // 15 * 60
      });

      it('should return correct expiration time for hours', () => {
        mockConfigService.get.mockReturnValue('2h');
        const result = service['getAccessTokenExpirationTime']();
        expect(result).toBe(7200); // 2 * 60 * 60
      });

      it('should return correct expiration time for days', () => {
        mockConfigService.get.mockReturnValue('1d');
        const result = service['getAccessTokenExpirationTime']();
        expect(result).toBe(86400); // 1 * 24 * 60 * 60
      });

      it('should return default for unknown format', () => {
        mockConfigService.get.mockReturnValue('unknown');
        const result = service['getAccessTokenExpirationTime']();
        expect(result).toBe(900); // default 15 minutes
      });
    });
  });
});
