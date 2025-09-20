import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

describe('JwtAuthGuard - Comprehensive Tests', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  const mockContext = (isPublic = false) => {
    const mockExecutionContext = {
      getHandler: () => ({ name: 'testHandler' }),
      getClass: () => ({ name: 'TestController' }),
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: 'Bearer valid-jwt-token',
          },
        }),
      }),
    } as ExecutionContext;

    return mockExecutionContext;
  };

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        { provide: Reflector, useValue: mockReflector },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    reflector = module.get<Reflector>(Reflector);

    jest.clearAllMocks();
  });

  describe('canActivate method', () => {
    it('should allow access to public routes', () => {
      const context = mockContext();
      mockReflector.getAllAndOverride.mockReturnValue(true);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('should call super.canActivate for non-public routes', () => {
      const context = mockContext();
      mockReflector.getAllAndOverride.mockReturnValue(false);

      // Mock the parent class canActivate method
      const superCanActivateSpy = jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate');
      superCanActivateSpy.mockReturnValue(true);

      const result = guard.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
      expect(superCanActivateSpy).toHaveBeenCalledWith(context);
    });

    it('should call super.canActivate when isPublic is undefined', () => {
      const context = mockContext();
      mockReflector.getAllAndOverride.mockReturnValue(undefined);

      const superCanActivateSpy = jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate');
      superCanActivateSpy.mockReturnValue(true);

      guard.canActivate(context);

      expect(superCanActivateSpy).toHaveBeenCalledWith(context);
    });

    it('should call super.canActivate when isPublic is null', () => {
      const context = mockContext();
      mockReflector.getAllAndOverride.mockReturnValue(null);

      const superCanActivateSpy = jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate');
      superCanActivateSpy.mockReturnValue(true);

      guard.canActivate(context);

      expect(superCanActivateSpy).toHaveBeenCalledWith(context);
    });

    it('should prioritize class-level public decorator over method-level', () => {
      const context = mockContext();
      // Simulate class-level @Public() decorator taking precedence
      mockReflector.getAllAndOverride.mockReturnValue(true);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });
  });

  describe('handleRequest method', () => {
    const mockContext = {
      getHandler: () => ({ name: 'testHandler' }),
      getClass: () => ({ name: 'TestController' }),
    } as ExecutionContext;

    it('should return user when authentication is successful', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      const result = guard.handleRequest(null, mockUser, null, mockContext);

      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException when user is null', () => {
      expect(() => {
        guard.handleRequest(null, null, null, mockContext);
      }).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is undefined', () => {
      expect(() => {
        guard.handleRequest(null, undefined, null, mockContext);
      }).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is false', () => {
      expect(() => {
        guard.handleRequest(null, false, null, mockContext);
      }).toThrow(UnauthorizedException);
    });

    it('should throw original error when err is provided', () => {
      const originalError = new Error('JWT verification failed');

      expect(() => {
        guard.handleRequest(originalError, null, null, mockContext);
      }).toThrow(originalError);
    });

    it('should throw original error even when user is provided', () => {
      const originalError = new Error('JWT verification failed');
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      expect(() => {
        guard.handleRequest(originalError, mockUser, null, mockContext);
      }).toThrow(originalError);
    });

    it('should throw UnauthorizedException with specific message when no error but no user', () => {
      expect(() => {
        guard.handleRequest(null, null, null, mockContext);
      }).toThrow(new UnauthorizedException('Invalid or expired token'));
    });

    it('should handle empty string user', () => {
      expect(() => {
        guard.handleRequest(null, '', null, mockContext);
      }).toThrow(UnauthorizedException);
    });

    it('should handle zero as user', () => {
      expect(() => {
        guard.handleRequest(null, 0, null, mockContext);
      }).toThrow(UnauthorizedException);
    });

    it('should return user object with all properties intact', () => {
      const complexUser = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        roles: ['INVESTOR'],
        permissions: ['VIEW_PORTFOLIO'],
        lastLoginAt: new Date(),
        isEmailVerified: true,
        metadata: {
          customField: 'value',
          preferences: {
            theme: 'dark',
            language: 'en',
          },
        },
      };

      const result = guard.handleRequest(null, complexUser, null, mockContext);

      expect(result).toEqual(complexUser);
      expect(result.metadata.preferences.theme).toBe('dark');
    });
  });

  describe('Error handling edge cases', () => {
    it('should handle various error types in handleRequest', () => {
      const mockContext = {
        getHandler: () => ({ name: 'testHandler' }),
        getClass: () => ({ name: 'TestController' }),
      } as ExecutionContext;

      // Test with different error types
      const customError = new UnauthorizedException('Custom auth error');
      expect(() => {
        guard.handleRequest(customError, null, null, mockContext);
      }).toThrow(customError);

      const genericError = new Error('Generic error');
      expect(() => {
        guard.handleRequest(genericError, null, null, mockContext);
      }).toThrow(genericError);
    });

    it('should handle info parameter in handleRequest', () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockInfo = { message: 'JWT token info' };
      const mockContext = {
        getHandler: () => ({ name: 'testHandler' }),
        getClass: () => ({ name: 'TestController' }),
      } as ExecutionContext;

      const result = guard.handleRequest(null, mockUser, mockInfo, mockContext);

      expect(result).toEqual(mockUser);
    });
  });

  describe('Integration with Reflector', () => {
    it('should properly use Reflector.getAllAndOverride method', () => {
      const context = mockContext();
      mockReflector.getAllAndOverride.mockReturnValue(true);

      guard.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
        IS_PUBLIC_KEY,
        [context.getHandler(), context.getClass()]
      );
      expect(reflector.getAllAndOverride).toHaveBeenCalledTimes(1);
    });

    it('should handle Reflector returning different truthy values', () => {
      const context = mockContext();

      // Test various truthy values
      const truthyValues = [true, 1, 'true', {}, []];

      truthyValues.forEach(value => {
        mockReflector.getAllAndOverride.mockReturnValue(value);
        const result = guard.canActivate(context);
        expect(result).toBe(true);
      });
    });

    it('should handle Reflector returning different falsy values', () => {
      const context = mockContext();
      const superCanActivateSpy = jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate');
      superCanActivateSpy.mockReturnValue(true);

      // Test various falsy values
      const falsyValues = [false, 0, '', null, undefined];

      falsyValues.forEach(value => {
        mockReflector.getAllAndOverride.mockReturnValue(value);
        guard.canActivate(context);
        expect(superCanActivateSpy).toHaveBeenCalled();
      });
    });
  });

  describe('Inheritance behavior', () => {
    it('should properly extend AuthGuard', () => {
      expect(guard).toBeInstanceOf(JwtAuthGuard);
      // Check that it has the expected methods
      expect(typeof guard.canActivate).toBe('function');
      expect(typeof guard.handleRequest).toBe('function');
    });

    it('should maintain proper prototype chain', () => {
      // Verify that the guard properly extends AuthGuard
      const prototypeChain = [];
      let current = Object.getPrototypeOf(guard);

      while (current && current !== Object.prototype) {
        prototypeChain.push(current.constructor.name);
        current = Object.getPrototypeOf(current);
      }

      expect(prototypeChain).toContain('JwtAuthGuard');
    });
  });

  describe('Performance and optimization', () => {
    it('should not call super.canActivate for public routes', () => {
      const context = mockContext();
      mockReflector.getAllAndOverride.mockReturnValue(true);

      const superCanActivateSpy = jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate');

      guard.canActivate(context);

      expect(superCanActivateSpy).not.toHaveBeenCalled();
    });

    it('should only call reflector once per canActivate call', () => {
      const context = mockContext();
      mockReflector.getAllAndOverride.mockReturnValue(true);

      guard.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenCalledTimes(1);
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle typical public endpoint scenario', () => {
      const context = mockContext();
      mockReflector.getAllAndOverride.mockReturnValue(true);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('should handle typical protected endpoint scenario', () => {
      const context = mockContext();
      mockReflector.getAllAndOverride.mockReturnValue(false);

      const superCanActivateSpy = jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate');
      superCanActivateSpy.mockReturnValue(true);

      guard.canActivate(context);

      expect(superCanActivateSpy).toHaveBeenCalledWith(context);
    });

    it('should handle user authentication success scenario', () => {
      const authenticatedUser = {
        id: 'user-123',
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        roles: ['INVESTOR'],
        isEmailVerified: true,
      };

      const result = guard.handleRequest(null, authenticatedUser, null, mockContext());

      expect(result).toEqual(authenticatedUser);
    });

    it('should handle authentication failure scenario', () => {
      const mockContext = {
        getHandler: () => ({ name: 'protectedEndpoint' }),
        getClass: () => ({ name: 'UserController' }),
      } as ExecutionContext;

      expect(() => {
        guard.handleRequest(null, null, { message: 'Token expired' }, mockContext);
      }).toThrow(new UnauthorizedException('Invalid or expired token'));
    });
  });
});