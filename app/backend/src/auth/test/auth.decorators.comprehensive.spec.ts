import { ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../interfaces/auth.interface';

// Mock functions that will be used
const mockSetMetadata = jest.fn();
const mockCreateParamDecorator = jest.fn().mockImplementation((factory) => {
  // Store the factory function for testing
  (mockCreateParamDecorator as any).mockCallback = factory;
  return (data?: any) => (target: any, propertyKey: any, parameterIndex: number) => {
    // Return a mock param decorator
    return factory;
  };
});

// Mock NestJS common module
jest.mock('@nestjs/common', () => ({
  ...jest.requireActual('@nestjs/common'),
  SetMetadata: mockSetMetadata,
  createParamDecorator: mockCreateParamDecorator,
}));

// Import decorators after mocking
const { Public, IS_PUBLIC_KEY } = require('../decorators/public.decorator');
const { CurrentUser } = require('../decorators/current-user.decorator');

describe('Auth Decorators - Comprehensive Tests', () => {
  const mockUser: AuthenticatedUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    roles: ['INVESTOR'],
    permissions: ['VIEW_PORTFOLIO'],
  };

  const mockContext = (user: AuthenticatedUser = mockUser) => ({
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as ExecutionContext);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Public decorator', () => {
    it('should set metadata with correct key and value', () => {
      Public();

      expect(mockSetMetadata).toHaveBeenCalledWith(IS_PUBLIC_KEY, true);
      expect(mockSetMetadata).toHaveBeenCalledTimes(1);
    });

    it('should have correct metadata key constant', () => {
      expect(IS_PUBLIC_KEY).toBe('isPublic');
    });

    it('should return function from Public decorator', () => {
      mockSetMetadata.mockReturnValue(jest.fn());
      const decorator = Public();
      expect(mockSetMetadata).toHaveBeenCalled();
    });

    it('should always set metadata to true', () => {
      // Call multiple times to ensure consistency
      Public();
      Public();
      Public();

      expect(mockSetMetadata).toHaveBeenCalledTimes(3);
      mockSetMetadata.mock.calls.forEach(call => {
        expect(call[0]).toBe(IS_PUBLIC_KEY);
        expect(call[1]).toBe(true);
      });
    });
  });

  describe('CurrentUser decorator', () => {
    let wasParamDecoratorCalled = false;

    beforeEach(() => {
      // Mock createParamDecorator to capture the callback function
      mockCreateParamDecorator.mockImplementation((callback) => {
        // Store the callback so we can test it
        mockCreateParamDecorator.mockCallback = callback;
        wasParamDecoratorCalled = true;
        return callback;
      });

      // Force re-require of CurrentUser to ensure the mock is applied
      delete require.cache[require.resolve('../decorators/current-user.decorator')];
      require('../decorators/current-user.decorator');
    });

    it('should have callback function available for testing', () => {
      // The callback should be available via the mock
      const callback = (mockCreateParamDecorator as any).mockCallback;
      expect(callback).toBeDefined();
      expect(typeof callback).toBe('function');
    });

    it('should return entire user when no data parameter is provided', () => {
      // Access CurrentUser to trigger import/execution
      CurrentUser;

      const callback = (mockCreateParamDecorator as any).mockCallback;
      expect(callback).toBeDefined();

      const result = callback(undefined, mockContext());
      expect(result).toEqual(mockUser);
    });

    it('should return specific user property when data parameter is provided', () => {
      CurrentUser;

      const callback = (mockCreateParamDecorator as any).mockCallback;
      expect(callback).toBeDefined();

      expect(callback('id', mockContext())).toBe('user-123');
      expect(callback('email', mockContext())).toBe('test@example.com');
      expect(callback('firstName', mockContext())).toBe('John');
      expect(callback('lastName', mockContext())).toBe('Doe');
    });

    it('should return user roles array when roles data is requested', () => {
      CurrentUser;

      const callback = (mockCreateParamDecorator as any).mockCallback;
      const result = callback('roles', mockContext());

      expect(result).toEqual(['INVESTOR']);
    });

    it('should return user permissions array when permissions data is requested', () => {
      CurrentUser;

      const callback = (mockCreateParamDecorator as any).mockCallback;
      const result = callback('permissions', mockContext());

      expect(result).toEqual(['VIEW_PORTFOLIO']);
    });

    it('should handle user with additional properties', () => {
      CurrentUser;

      const extendedUser = {
        ...mockUser,
        isEmailVerified: true,
        lastLoginAt: new Date('2024-01-01'),
        metadata: { customField: 'value' },
      } as AuthenticatedUser & { isEmailVerified: boolean; lastLoginAt: Date; metadata: any };

      const callback = (mockCreateParamDecorator as any).mockCallback;
      const result = callback(undefined, mockContext(extendedUser));

      expect(result).toEqual(extendedUser);
    });

    it('should handle undefined user', () => {
      CurrentUser;

      const contextWithNoUser = {
        switchToHttp: () => ({
          getRequest: () => ({ user: undefined }),
        }),
      } as ExecutionContext;

      const callback = (mockCreateParamDecorator as any).mockCallback;
      const result = callback(undefined, contextWithNoUser);

      expect(result).toBeUndefined();
    });

    it('should handle null user', () => {
      CurrentUser;

      const contextWithNullUser = {
        switchToHttp: () => ({
          getRequest: () => ({ user: null }),
        }),
      } as ExecutionContext;

      const callback = (mockCreateParamDecorator as any).mockCallback;
      const result = callback(undefined, contextWithNullUser);

      expect(result).toBeNull();
    });

    it('should return undefined when accessing property of undefined user', () => {
      CurrentUser;

      const contextWithNoUser = {
        switchToHttp: () => ({
          getRequest: () => ({ user: undefined }),
        }),
      } as ExecutionContext;

      const callback = (mockCreateParamDecorator as any).mockCallback;
      const result = callback('id', contextWithNoUser);

      expect(result).toBeUndefined();
    });

    it('should handle empty user object', () => {
      CurrentUser;

      const emptyUser = {} as AuthenticatedUser;
      const callback = (mockCreateParamDecorator as any).mockCallback;

      expect(callback('id', mockContext(emptyUser))).toBeUndefined();
      expect(callback('email', mockContext(emptyUser))).toBeUndefined();
      expect(callback(undefined, mockContext(emptyUser))).toEqual(emptyUser);
    });

    it('should handle user with only some properties', () => {
      CurrentUser;

      const partialUser = {
        id: 'user-123',
        email: 'test@example.com',
      } as AuthenticatedUser;

      const callback = (mockCreateParamDecorator as any).mockCallback;

      expect(callback('id', mockContext(partialUser))).toBe('user-123');
      expect(callback('email', mockContext(partialUser))).toBe('test@example.com');
      expect(callback('firstName', mockContext(partialUser))).toBeUndefined();
      expect(callback('roles', mockContext(partialUser))).toBeUndefined();
    });

    it('should handle numeric and boolean properties', () => {
      CurrentUser;

      const userWithVariousTypes = {
        ...mockUser,
        age: 30,
        isActive: true,
        loginCount: 0,
      } as AuthenticatedUser & { age: number; isActive: boolean; loginCount: number };

      const callback = (mockCreateParamDecorator as any).mockCallback;

      expect(callback('age' as any, mockContext(userWithVariousTypes))).toBe(30);
      expect(callback('isActive' as any, mockContext(userWithVariousTypes))).toBe(true);
      expect(callback('loginCount' as any, mockContext(userWithVariousTypes))).toBe(0);
    });

    it('should handle array properties correctly', () => {
      CurrentUser;

      const userWithArrays = {
        ...mockUser,
        roles: ['INVESTOR', 'ANALYST'],
        permissions: ['VIEW_PORTFOLIO', 'EDIT_PORTFOLIO', 'VIEW_DOCUMENTS'],
      };

      const callback = (mockCreateParamDecorator as any).mockCallback;

      expect(callback('roles', mockContext(userWithArrays))).toEqual(['INVESTOR', 'ANALYST']);
      expect(callback('permissions', mockContext(userWithArrays))).toEqual(['VIEW_PORTFOLIO', 'EDIT_PORTFOLIO', 'VIEW_DOCUMENTS']);
    });

    it('should handle nested object properties', () => {
      CurrentUser;

      const userWithNestedObject = {
        ...mockUser,
        profile: {
          bio: 'Investment professional',
          preferences: {
            theme: 'dark',
            notifications: true,
          },
        },
      } as AuthenticatedUser & { profile: any };

      const callback = (mockCreateParamDecorator as any).mockCallback;
      const result = callback('profile' as any, mockContext(userWithNestedObject));

      expect(result).toEqual({
        bio: 'Investment professional',
        preferences: {
          theme: 'dark',
          notifications: true,
        },
      });
    });
  });

  describe('Decorator integration scenarios', () => {
    it('should support using Public decorator on controller methods', () => {
      // Simulate using @Public() on a method
      Public();

      expect(mockSetMetadata).toHaveBeenCalledWith(IS_PUBLIC_KEY, true);
    });

    it('should support using Public decorator on controller classes', () => {
      // Simulate using @Public() on a class
      Public();

      expect(mockSetMetadata).toHaveBeenCalledWith(IS_PUBLIC_KEY, true);
    });

    it('should support multiple usages of Public decorator', () => {
      // Simulate multiple @Public() decorators
      Public();
      Public();
      Public();

      expect(mockSetMetadata).toHaveBeenCalledTimes(3);
      mockSetMetadata.mock.calls.forEach(call => {
        expect(call).toEqual([IS_PUBLIC_KEY, true]);
      });
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle malformed request object in CurrentUser', () => {
      CurrentUser;

      const malformedContext = {
        switchToHttp: () => ({
          getRequest: () => ({}), // No user property
        }),
      } as ExecutionContext;

      const callback = (mockCreateParamDecorator as any).mockCallback;
      const result = callback(undefined, malformedContext);

      expect(result).toBeUndefined();
    });

    it('should handle request with non-object user property', () => {
      CurrentUser;

      const contextWithStringUser = {
        switchToHttp: () => ({
          getRequest: () => ({ user: 'not-an-object' }),
        }),
      } as ExecutionContext;

      const callback = (mockCreateParamDecorator as any).mockCallback;
      const result = callback(undefined, contextWithStringUser);

      expect(result).toBe('not-an-object');
    });

    it('should handle accessing property on non-object user', () => {
      CurrentUser;

      const contextWithStringUser = {
        switchToHttp: () => ({
          getRequest: () => ({ user: 'string-user' }),
        }),
      } as ExecutionContext;

      const callback = (mockCreateParamDecorator as any).mockCallback;
      const result = callback('id', contextWithStringUser);

      expect(result).toBeUndefined();
    });

    it('should handle very large user objects', () => {
      CurrentUser;

      const largeUser = {
        ...mockUser,
        ...Array.from({ length: 100 }, (_, i) => ({ [`property${i}`]: `value${i}` })).reduce((acc, curr) => ({ ...acc, ...curr }), {}),
      };

      const callback = (mockCreateParamDecorator as any).mockCallback;
      const result = callback(undefined, mockContext(largeUser));

      expect(result).toEqual(largeUser);
      expect(result.property99).toBe('value99');
    });
  });

  describe('Type safety and constraints', () => {
    it('should respect AuthenticatedUser interface constraints', () => {
      CurrentUser;

      const callback = (mockCreateParamDecorator as any).mockCallback;

      // These should be valid keys from AuthenticatedUser interface
      const validKeys = ['id', 'email', 'firstName', 'lastName', 'roles', 'permissions'];

      validKeys.forEach(key => {
        const result = callback(key as keyof AuthenticatedUser, mockContext());
        expect(result).toBeDefined();
      });
    });

    it('should handle undefined data parameter correctly', () => {
      CurrentUser;

      const callback = (mockCreateParamDecorator as any).mockCallback;
      const result = callback(undefined, mockContext());

      expect(result).toEqual(mockUser);
    });

    it('should handle null data parameter correctly', () => {
      CurrentUser;

      const callback = (mockCreateParamDecorator as any).mockCallback;
      const result = callback(null as any, mockContext());

      expect(result).toEqual(mockUser); // Should return entire user when data is falsy
    });
  });

  describe('Performance considerations', () => {
    it('should not modify the original user object', () => {
      CurrentUser;

      const originalUser = { ...mockUser };
      const callback = (mockCreateParamDecorator as any).mockCallback;

      callback(undefined, mockContext(mockUser));

      expect(mockUser).toEqual(originalUser);
    });

    it('should efficiently handle repeated property access', () => {
      CurrentUser;

      const callback = (mockCreateParamDecorator as any).mockCallback;

      // Multiple calls should work correctly
      const id1 = callback('id', mockContext());
      const id2 = callback('id', mockContext());
      const email1 = callback('email', mockContext());
      const email2 = callback('email', mockContext());

      expect(id1).toBe('user-123');
      expect(id2).toBe('user-123');
      expect(email1).toBe('test@example.com');
      expect(email2).toBe('test@example.com');
    });
  });
});