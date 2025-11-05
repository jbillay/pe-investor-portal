import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    reflector = module.get(Reflector) as jest.Mocked<Reflector>;

    // Mock the parent class's canActivate to avoid Passport dependency
    jest.spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate').mockReturnValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockExecutionContext = (isPublic = false): ExecutionContext => {
    return {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({}),
        getResponse: jest.fn().mockReturnValue({}),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    } as any;
  };

  describe('canActivate', () => {
    it('should allow access to public routes', () => {
      // Arrange
      const context = createMockExecutionContext(true);
      reflector.getAllAndOverride.mockReturnValue(true);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('should call super.canActivate for protected routes', () => {
      // Arrange
      const context = createMockExecutionContext();
      reflector.getAllAndOverride.mockReturnValue(false);
      const parentCanActivate = jest.spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate');

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true); // Returns true because we mocked parent canActivate
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
      expect(parentCanActivate).toHaveBeenCalledWith(context);
    });
  });

  describe('handleRequest', () => {
    const mockContext = createMockExecutionContext();

    it('should return user when authentication is successful', () => {
      // Arrange
      const mockUser = { id: 'user-1', email: 'test@example.com' };

      // Act
      const result = guard.handleRequest(null, mockUser, null, mockContext);

      // Assert
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException when error exists', () => {
      // Arrange
      const mockError = new Error('Auth error');

      // Act & Assert
      expect(() => guard.handleRequest(mockError, null, null, mockContext)).toThrow(
        mockError,
      );
    });

    it('should throw UnauthorizedException when user is not provided', () => {
      // Act & Assert
      expect(() => guard.handleRequest(null, null, null, mockContext)).toThrow(
        UnauthorizedException,
      );
      expect(() => guard.handleRequest(null, null, null, mockContext)).toThrow(
        'Invalid or expired token',
      );
    });

    it('should throw UnauthorizedException when user is undefined', () => {
      // Act & Assert
      expect(() =>
        guard.handleRequest(null, undefined, null, mockContext),
      ).toThrow(UnauthorizedException);
      expect(() =>
        guard.handleRequest(null, undefined, null, mockContext),
      ).toThrow('Invalid or expired token');
    });

    it('should prioritize error over user absence', () => {
      // Arrange
      const mockError = new Error('Token expired');

      // Act & Assert
      expect(() => guard.handleRequest(mockError, null, null, mockContext)).toThrow(
        mockError,
      );
    });
  });
});
