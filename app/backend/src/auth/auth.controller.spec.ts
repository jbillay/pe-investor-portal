import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import {
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import {
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
  LogoutDto,
  AuthResponseDto,
} from './dto/auth.dto';
import { AuthenticatedUser } from './interfaces/auth.interface';
import { TestDataGenerator, RequestHelper } from '../../test/utils/test-utils';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
    logoutAll: jest.fn(),
    validateUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          {
            ttl: 60000,
            limit: 10,
          },
        ]),
      ],
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: APP_GUARD,
          useClass: ThrottlerGuard,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    // Reset all mocks before each test
    Object.keys(mockAuthService).forEach((key) => {
      mockAuthService[key].mockReset();
    });
  });

  describe('register', () => {
    const validRegisterDto: RegisterDto = {
      email: 'test@example.com',
      password: 'Password123',
      firstName: 'Test',
      lastName: 'User',
    };

    it('should successfully register a new user', async () => {
      const expectedResponse: AuthResponseDto = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          id: 'user-test-id',
          email: validRegisterDto.email,
          firstName: validRegisterDto.firstName,
          lastName: validRegisterDto.lastName,
        },
        expiresIn: 900,
      };

      const mockRequest = RequestHelper.createMockRequest({
        headers: { 'user-agent': 'Test User Agent' },
        connection: { remoteAddress: '127.0.0.1' },
      });

      mockAuthService.register.mockResolvedValue(expectedResponse);

      const result = await controller.register(validRegisterDto, mockRequest);

      expect(result).toEqual(expectedResponse);
      expect(mockAuthService.register).toHaveBeenCalledWith(
        validRegisterDto,
        'Test User Agent',
        '127.0.0.1',
      );
    });

    it('should extract IP address from various headers', async () => {
      const expectedResponse = TestDataGenerator.generateAuthenticatedUser();

      // Test X-Forwarded-For header
      const mockRequestWithForwarded = RequestHelper.createMockRequest({
        headers: {
          'x-forwarded-for': '192.168.1.100, 10.0.0.1',
          'user-agent': 'Test Agent',
        },
      });

      mockAuthService.register.mockResolvedValue(expectedResponse);

      await controller.register(validRegisterDto, mockRequestWithForwarded);

      expect(mockAuthService.register).toHaveBeenCalledWith(
        validRegisterDto,
        'Test Agent',
        '192.168.1.100',
      );
    });

    it('should extract IP from X-Real-IP header', async () => {
      const expectedResponse = TestDataGenerator.generateAuthenticatedUser();

      const mockRequestWithRealIP = RequestHelper.createMockRequest({
        headers: {
          'x-real-ip': '203.0.113.1',
          'user-agent': 'Test Agent',
        },
      });

      mockAuthService.register.mockResolvedValue(expectedResponse);

      await controller.register(validRegisterDto, mockRequestWithRealIP);

      expect(mockAuthService.register).toHaveBeenCalledWith(
        validRegisterDto,
        'Test Agent',
        '203.0.113.1',
      );
    });

    it('should handle missing user agent gracefully', async () => {
      const expectedResponse = TestDataGenerator.generateAuthenticatedUser();

      const mockRequestNoAgent = RequestHelper.createMockRequest({
        headers: {},
      });
      mockRequestNoAgent.get.mockReturnValue(undefined);

      mockAuthService.register.mockResolvedValue(expectedResponse);

      await controller.register(validRegisterDto, mockRequestNoAgent);

      expect(mockAuthService.register).toHaveBeenCalledWith(
        validRegisterDto,
        undefined,
        '127.0.0.1',
      );
    });

    it('should throw ConflictException when user already exists', async () => {
      const mockRequest = RequestHelper.createMockRequest();

      mockAuthService.register.mockRejectedValue(
        new ConflictException('User with this email already exists'),
      );

      await expect(
        controller.register(validRegisterDto, mockRequest),
      ).rejects.toThrow(ConflictException);
    });

  });

  describe('login', () => {
    const validLoginDto: LoginDto = {
      email: 'test@example.com',
      password: 'Password123',
    };

    it('should successfully login user with valid credentials', async () => {
      const expectedResponse: AuthResponseDto = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          id: 'user-test-id',
          email: validLoginDto.email,
          firstName: 'Test',
          lastName: 'User',
        },
        expiresIn: 900,
      };

      const mockRequest = RequestHelper.createMockRequest();
      mockAuthService.login.mockResolvedValue(expectedResponse);

      const result = await controller.login(validLoginDto, mockRequest);

      expect(result).toEqual(expectedResponse);
      expect(mockAuthService.login).toHaveBeenCalledWith(
        validLoginDto,
        'Test User Agent',
        '127.0.0.1',
      );
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const mockRequest = RequestHelper.createMockRequest();

      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(
        controller.login(validLoginDto, mockRequest),
      ).rejects.toThrow(UnauthorizedException);
    });

  });

  describe('refreshToken', () => {
    const validRefreshDto: RefreshTokenDto = {
      refreshToken: 'valid-refresh-token',
    };

    it('should successfully refresh tokens', async () => {
      const expectedResponse: AuthResponseDto = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        user: {
          id: 'user-test-id',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
        },
        expiresIn: 900,
      };

      const mockRequest = RequestHelper.createMockRequest();
      mockAuthService.refreshToken.mockResolvedValue(expectedResponse);

      const result = await controller.refreshToken(
        validRefreshDto,
        mockRequest,
      );

      expect(result).toEqual(expectedResponse);
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(
        validRefreshDto.refreshToken,
        'Test User Agent',
        '127.0.0.1',
      );
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      const mockRequest = RequestHelper.createMockRequest();

      mockAuthService.refreshToken.mockRejectedValue(
        new UnauthorizedException('Invalid refresh token'),
      );

      await expect(
        controller.refreshToken(validRefreshDto, mockRequest),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    const validLogoutDto: LogoutDto = {
      refreshToken: 'valid-refresh-token',
    };

    it('should successfully logout user', async () => {
      const mockRequest = RequestHelper.createMockRequest();
      mockAuthService.logout.mockResolvedValue(undefined);

      const result = await controller.logout(validLogoutDto, mockRequest);

      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(mockAuthService.logout).toHaveBeenCalledWith(
        validLogoutDto.refreshToken,
        'Test User Agent',
        '127.0.0.1',
      );
    });

    it('should handle logout errors gracefully', async () => {
      const mockRequest = RequestHelper.createMockRequest();

      mockAuthService.logout.mockRejectedValue(new Error('Logout failed'));

      await expect(
        controller.logout(validLogoutDto, mockRequest),
      ).rejects.toThrow('Logout failed');
    });
  });

  describe('logoutAll', () => {
    it('should successfully logout user from all devices', async () => {
      const authenticatedUser = TestDataGenerator.generateAuthenticatedUser();
      const mockRequest = RequestHelper.createMockRequest();

      mockAuthService.logoutAll.mockResolvedValue(undefined);

      const result = await controller.logoutAll(authenticatedUser, mockRequest);

      expect(result).toEqual({
        message: 'Logged out from all devices successfully',
      });
      expect(mockAuthService.logoutAll).toHaveBeenCalledWith(
        authenticatedUser.id,
        'Test User Agent',
        '127.0.0.1',
      );
    });

    it('should handle logoutAll errors gracefully', async () => {
      const authenticatedUser = TestDataGenerator.generateAuthenticatedUser();
      const mockRequest = RequestHelper.createMockRequest();

      mockAuthService.logoutAll.mockRejectedValue(
        new Error('LogoutAll failed'),
      );

      await expect(
        controller.logoutAll(authenticatedUser, mockRequest),
      ).rejects.toThrow('LogoutAll failed');
    });
  });

  describe('getProfile', () => {
    it('should return user profile information', async () => {
      const authenticatedUser = TestDataGenerator.generateAuthenticatedUser();

      const result = await controller.getProfile(authenticatedUser);

      expect(result).toEqual({
        id: authenticatedUser.id,
        email: authenticatedUser.email,
        firstName: authenticatedUser.firstName,
        lastName: authenticatedUser.lastName,
        isActive: authenticatedUser.isActive,
        isVerified: authenticatedUser.isVerified,
      });
    });

    it('should handle user with null name fields', async () => {
      const authenticatedUser = TestDataGenerator.generateAuthenticatedUser({
        firstName: null,
        lastName: null,
      });

      const result = await controller.getProfile(authenticatedUser);

      expect(result.firstName).toBeNull();
      expect(result.lastName).toBeNull();
      expect(result.id).toBe(authenticatedUser.id);
      expect(result.email).toBe(authenticatedUser.email);
    });

    it('should include all required profile fields', async () => {
      const authenticatedUser = TestDataGenerator.generateAuthenticatedUser({
        isActive: true,
        isVerified: false,
      });

      const result = await controller.getProfile(authenticatedUser);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('firstName');
      expect(result).toHaveProperty('lastName');
      expect(result).toHaveProperty('isActive');
      expect(result).toHaveProperty('isVerified');

      expect(result.isActive).toBe(true);
      expect(result.isVerified).toBe(false);
    });
  });

  describe('validateToken', () => {
    it('should return token validation result with user data', async () => {
      const authenticatedUser = TestDataGenerator.generateAuthenticatedUser();

      const result = await controller.validateToken(authenticatedUser);

      expect(result).toEqual({
        valid: true,
        user: authenticatedUser,
      });
    });

    it('should always return valid true for authenticated requests', async () => {
      // This endpoint is protected by JWT guard, so if we reach this point, token is valid
      const authenticatedUser = TestDataGenerator.generateAuthenticatedUser();

      const result = await controller.validateToken(authenticatedUser);

      expect(result.valid).toBe(true);
      expect(result.user).toEqual(authenticatedUser);
    });
  });

  describe('getClientIp private method', () => {
    it('should extract IP from X-Forwarded-For header (first IP)', () => {
      const mockRequest = RequestHelper.createMockRequest({
        headers: {
          'x-forwarded-for': '203.0.113.1, 198.51.100.1, 192.168.1.1',
        },
      });

      const ip = controller['getClientIp'](mockRequest);
      expect(ip).toBe('203.0.113.1');
    });

    it('should extract IP from X-Real-IP header when X-Forwarded-For is not available', () => {
      const mockRequest = RequestHelper.createMockRequest({
        headers: { 'x-real-ip': '203.0.113.2' },
      });

      const ip = controller['getClientIp'](mockRequest);
      expect(ip).toBe('203.0.113.2');
    });

    it('should fall back to connection.remoteAddress', () => {
      const mockRequest = RequestHelper.createMockRequest({
        connection: { remoteAddress: '203.0.113.3' },
      });
      mockRequest.get.mockReturnValue(undefined); // No headers

      const ip = controller['getClientIp'](mockRequest);
      expect(ip).toBe('203.0.113.3');
    });

    it('should fall back to socket.remoteAddress', () => {
      const mockRequest = RequestHelper.createMockRequest({
        socket: { remoteAddress: '203.0.113.4' },
      });
      mockRequest.get.mockReturnValue(undefined);
      delete mockRequest.connection;

      const ip = controller['getClientIp'](mockRequest);
      expect(ip).toBe('203.0.113.4');
    });

    it('should return "unknown" when no IP can be determined', () => {
      const mockRequest = RequestHelper.createMockRequest({});
      mockRequest.get.mockReturnValue(undefined);
      delete mockRequest.connection;
      delete mockRequest.socket;

      const ip = controller['getClientIp'](mockRequest);
      expect(ip).toBe('unknown');
    });

    it('should handle empty X-Forwarded-For header', () => {
      const mockRequest = RequestHelper.createMockRequest({
        headers: { 'x-forwarded-for': '' },
        connection: { remoteAddress: '127.0.0.1' },
      });

      const ip = controller['getClientIp'](mockRequest);
      expect(ip).toBe('127.0.0.1');
    });

    it('should trim whitespace from extracted IP', () => {
      const mockRequest = RequestHelper.createMockRequest({
        headers: { 'x-forwarded-for': ' 203.0.113.5 , 198.51.100.2 ' },
      });

      const ip = controller['getClientIp'](mockRequest);
      expect(ip).toBe('203.0.113.5');
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle undefined request gracefully in getClientIp', () => {
      const undefinedRequest = undefined as any;

      expect(() => {
        controller['getClientIp'](undefinedRequest);
      }).toThrow();
    });

    it('should handle malformed X-Forwarded-For header', () => {
      const mockRequest = RequestHelper.createMockRequest({
        headers: { 'x-forwarded-for': 'not-an-ip, also-not-an-ip' },
        connection: { remoteAddress: '127.0.0.1' },
      });

      const ip = controller['getClientIp'](mockRequest);
      expect(ip).toBe('not-an-ip'); // Should still return the first value
    });
  });
});
