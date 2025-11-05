import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { PasswordService } from './services/password.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto, RegisterDto, RefreshTokenDto, LogoutDto } from './dto/auth.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { Request } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let passwordService: jest.Mocked<PasswordService>;

  // Mock services
  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
    logoutAll: jest.fn(),
  };

  const mockPasswordService = {
    setPassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: PasswordService,
          useValue: mockPasswordService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
    passwordService = module.get(PasswordService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'SecurePass123!@#',
        firstName: 'John',
        lastName: 'Doe',
      };
      const mockRequest = {
        get: jest.fn((header: string) => {
          if (header === 'User-Agent') return 'Mozilla/5.0';
          return null;
        }),
        headers: { 'x-forwarded-for': '192.168.1.1' },
        connection: {},
        socket: {},
      } as unknown as Request;

      const mockResponse = {
        user: {
          id: '1',
          email: registerDto.email,
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      authService.register.mockResolvedValue(mockResponse as any);

      // Act
      const result = await controller.register(registerDto, mockRequest);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(authService.register).toHaveBeenCalledWith(
        registerDto,
        'Mozilla/5.0',
        '192.168.1.1',
      );
    });

    it('should extract IP address from x-real-ip header when x-forwarded-for is not present', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'SecurePass123!@#',
        firstName: 'John',
        lastName: 'Doe',
      };
      const mockRequest = {
        get: jest.fn(() => null),
        headers: { 'x-real-ip': '10.0.0.1' },
        connection: {},
        socket: {},
      } as unknown as Request;

      const mockResponse = {
        user: { id: '1', email: registerDto.email },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      authService.register.mockResolvedValue(mockResponse as any);

      // Act
      await controller.register(registerDto, mockRequest);

      // Assert
      expect(authService.register).toHaveBeenCalledWith(
        registerDto,
        null,
        '10.0.0.1',
      );
    });

    it('should use unknown IP when no IP headers are present', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'SecurePass123!@#',
        firstName: 'John',
        lastName: 'Doe',
      };
      const mockRequest = {
        get: jest.fn(() => null),
        headers: {},
        connection: {},
        socket: {},
      } as unknown as Request;

      const mockResponse = {
        user: { id: '1', email: registerDto.email },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      authService.register.mockResolvedValue(mockResponse as any);

      // Act
      await controller.register(registerDto, mockRequest);

      // Assert
      expect(authService.register).toHaveBeenCalledWith(
        registerDto,
        null,
        'unknown',
      );
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      // Arrange
      const loginDto: LoginDto = {
        email: 'user@example.com',
        password: 'Password123!',
      };
      const mockRequest = {
        get: jest.fn((header: string) => {
          if (header === 'User-Agent') return 'Chrome/90.0';
          return null;
        }),
        headers: { 'x-forwarded-for': '192.168.1.5' },
        connection: {},
        socket: {},
      } as unknown as Request;

      const mockResponse = {
        user: { id: '1', email: loginDto.email },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      authService.login.mockResolvedValue(mockResponse as any);

      // Act
      const result = await controller.login(loginDto, mockRequest);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(authService.login).toHaveBeenCalledWith(
        loginDto,
        'Chrome/90.0',
        '192.168.1.5',
      );
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      // Arrange
      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: 'old-refresh-token',
      };
      const mockRequest = {
        get: jest.fn((header: string) => {
          if (header === 'User-Agent') return 'Safari/14.0';
          return null;
        }),
        headers: { 'x-forwarded-for': '10.0.0.5' },
        connection: {},
        socket: {},
      } as unknown as Request;

      const mockResponse = {
        user: { id: '1', email: 'user@example.com' },
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      authService.refreshToken.mockResolvedValue(mockResponse as any);

      // Act
      const result = await controller.refreshToken(refreshTokenDto, mockRequest);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(authService.refreshToken).toHaveBeenCalledWith(
        'old-refresh-token',
        'Safari/14.0',
        '10.0.0.5',
      );
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      // Arrange
      const logoutDto: LogoutDto = {
        refreshToken: 'refresh-token-to-revoke',
      };
      const mockRequest = {
        get: jest.fn((header: string) => {
          if (header === 'User-Agent') return 'Firefox/88.0';
          return null;
        }),
        headers: { 'x-forwarded-for': '172.16.0.1' },
        connection: {},
        socket: {},
      } as unknown as Request;

      authService.logout.mockResolvedValue(undefined);

      // Act
      const result = await controller.logout(logoutDto, mockRequest);

      // Assert
      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(authService.logout).toHaveBeenCalledWith(
        'refresh-token-to-revoke',
        'Firefox/88.0',
        '172.16.0.1',
      );
    });
  });

  describe('logoutAll', () => {
    it('should logout user from all devices successfully', async () => {
      // Arrange
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
        isVerified: true,
        roles: [],
        permissions: [],
      };
      const mockRequest = {
        get: jest.fn((header: string) => {
          if (header === 'User-Agent') return 'Edge/90.0';
          return null;
        }),
        headers: { 'x-forwarded-for': '192.168.2.1' },
        connection: {},
        socket: {},
      } as unknown as Request;

      authService.logoutAll.mockResolvedValue(undefined);

      // Act
      const result = await controller.logoutAll(mockUser, mockRequest);

      // Assert
      expect(result).toEqual({
        message: 'Logged out from all devices successfully',
      });
      expect(authService.logoutAll).toHaveBeenCalledWith(
        'user-123',
        'Edge/90.0',
        '192.168.2.1',
      );
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      // Arrange
      const mockUser = {
        id: 'user-456',
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
        isVerified: true,
        roles: [],
        permissions: [],
      };

      // Act
      const result = await controller.getProfile(mockUser);

      // Assert
      expect(result).toEqual({
        id: 'user-456',
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
        isVerified: true,
      });
    });

    it('should return user profile with null names', async () => {
      // Arrange
      const mockUser = {
        id: 'user-789',
        email: 'jane@example.com',
        firstName: null,
        lastName: null,
        isActive: true,
        isVerified: false,
        roles: [],
        permissions: [],
      };

      // Act
      const result = await controller.getProfile(mockUser);

      // Assert
      expect(result).toEqual({
        id: 'user-789',
        email: 'jane@example.com',
        firstName: null,
        lastName: null,
        isActive: true,
        isVerified: false,
      });
    });
  });

  describe('validateToken', () => {
    it('should validate token and return user', async () => {
      // Arrange
      const mockUser = {
        id: 'user-999',
        email: 'validate@example.com',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        isVerified: true,
        roles: [],
        permissions: [],
      };

      // Act
      const result = await controller.validateToken(mockUser);

      // Assert
      expect(result).toEqual({
        valid: true,
        user: mockUser,
      });
    });
  });

  describe('setPassword', () => {
    it('should set permanent password successfully', async () => {
      // Arrange
      const mockUser = {
        id: 'user-set-pw',
        email: 'setpassword@example.com',
        firstName: 'Set',
        lastName: 'Password',
        isActive: true,
        isVerified: false,
        roles: [],
        permissions: [],
      };
      const setPasswordDto: SetPasswordDto = {
        tempPassword: 'TempPassword123!',
        newPassword: 'NewSecurePass123!@#',
      };
      const mockResponse = {
        message: 'Password set successfully',
        user: { ...mockUser, isVerified: true },
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      passwordService.setPassword.mockResolvedValue(mockResponse as any);

      // Act
      const result = await controller.setPassword(mockUser, setPasswordDto);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(passwordService.setPassword).toHaveBeenCalledWith(
        'user-set-pw',
        setPasswordDto,
      );
    });
  });

  describe('getCsrfToken', () => {
    it('should return CSRF token', () => {
      // Arrange
      const mockRequest = {
        csrfToken: jest.fn(() => 'csrf-token-123'),
      } as unknown as Request;

      // Act
      const result = controller.getCsrfToken(mockRequest);

      // Assert
      expect(result).toEqual({ csrfToken: 'csrf-token-123' });
    });

    it('should return empty string when csrf token function is not available', () => {
      // Arrange
      const mockRequest = {} as Request;

      // Act
      const result = controller.getCsrfToken(mockRequest);

      // Assert
      expect(result).toEqual({ csrfToken: '' });
    });
  });

  describe('getClientIp', () => {
    it('should extract IP from x-forwarded-for header', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      };
      const mockRequest = {
        get: jest.fn(() => null),
        headers: { 'x-forwarded-for': '203.0.113.1, 198.51.100.1' },
        connection: {},
        socket: {},
      } as unknown as Request;

      authService.register.mockResolvedValue({} as any);

      // Act
      await controller.register(registerDto, mockRequest);

      // Assert
      expect(authService.register).toHaveBeenCalledWith(
        registerDto,
        null,
        '203.0.113.1',
      );
    });

    it('should extract IP from connection.remoteAddress when headers are absent', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      };
      const mockRequest = {
        get: jest.fn(() => null),
        headers: {},
        connection: { remoteAddress: '198.51.100.50' },
        socket: {},
      } as unknown as Request;

      authService.register.mockResolvedValue({} as any);

      // Act
      await controller.register(registerDto, mockRequest);

      // Assert
      expect(authService.register).toHaveBeenCalledWith(
        registerDto,
        null,
        '198.51.100.50',
      );
    });

    it('should extract IP from socket.remoteAddress as last resort', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      };
      const mockRequest = {
        get: jest.fn(() => null),
        headers: {},
        connection: {},
        socket: { remoteAddress: '203.0.113.100' },
      } as unknown as Request;

      authService.register.mockResolvedValue({} as any);

      // Act
      await controller.register(registerDto, mockRequest);

      // Assert
      expect(authService.register).toHaveBeenCalledWith(
        registerDto,
        null,
        '203.0.113.100',
      );
    });
  });
});
