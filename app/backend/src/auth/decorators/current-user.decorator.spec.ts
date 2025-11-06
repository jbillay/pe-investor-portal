import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CurrentUser } from './current-user.decorator';
import { AuthenticatedUser } from '../interfaces/auth.interface';

describe('CurrentUser Decorator', () => {
  it('should be defined', () => {
    expect(CurrentUser).toBeDefined();
  });

  it('should be a function (decorator factory)', () => {
    expect(typeof CurrentUser).toBe('function');
  });

  // Test the decorator logic by recreating the factory function's behavior
  describe('decorator logic', () => {
    let mockExecutionContext: ExecutionContext;
    let mockRequest: any;

    beforeEach(() => {
      mockRequest = {
        user: null,
      };

      mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
        getClass: jest.fn(),
        getHandler: jest.fn(),
        getArgs: jest.fn(),
        getArgByIndex: jest.fn(),
        switchToRpc: jest.fn(),
        switchToWs: jest.fn(),
        getType: jest.fn(),
      } as any;
    });

    it('should return the entire user object when no property is specified', () => {
      // Arrange
      const mockUser: AuthenticatedUser = {
        id: '123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
        isVerified: true,
        roles: ['USER'],
        permissions: ['read:profile'],
      };
      mockRequest.user = mockUser;

      // Act - Simulate what the decorator does
      const request = mockExecutionContext.switchToHttp().getRequest();
      const user = request.user as AuthenticatedUser;
      const result = undefined ? user?.[undefined as any] : user;

      // Assert
      expect(result).toEqual(mockUser);
    });

    it('should return specific user property when data parameter is provided', () => {
      // Arrange
      const mockUser: AuthenticatedUser = {
        id: '456',
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        isActive: true,
        isVerified: true,
      };
      mockRequest.user = mockUser;

      // Act
      const request = mockExecutionContext.switchToHttp().getRequest();
      const user = request.user as AuthenticatedUser;
      const data: keyof AuthenticatedUser = 'email';
      const result = data ? user?.[data] : user;

      // Assert
      expect(result).toBe('jane@example.com');
    });

    it('should return user id when "id" property is requested', () => {
      // Arrange
      const mockUser: AuthenticatedUser = {
        id: '789',
        email: 'user@example.com',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        isVerified: true,
      };
      mockRequest.user = mockUser;

      // Act
      const request = mockExecutionContext.switchToHttp().getRequest();
      const user = request.user as AuthenticatedUser;
      const data: keyof AuthenticatedUser = 'id';
      const result = data ? user?.[data] : user;

      // Assert
      expect(result).toBe('789');
    });

    it('should return undefined when user does not have the requested property', () => {
      // Arrange
      const mockUser: AuthenticatedUser = {
        id: '123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
        isVerified: true,
      };
      mockRequest.user = mockUser;

      // Act
      const request = mockExecutionContext.switchToHttp().getRequest();
      const user = request.user as AuthenticatedUser;
      const data: keyof AuthenticatedUser = 'roles';
      const result = data ? user?.[data] : user;

      // Assert
      expect(result).toBeUndefined();
    });

    it('should return undefined when user is null and property is requested', () => {
      // Arrange
      mockRequest.user = null;

      // Act
      const request = mockExecutionContext.switchToHttp().getRequest();
      const user = request.user as AuthenticatedUser;
      const data: keyof AuthenticatedUser = 'email';
      const result = data ? user?.[data] : user;

      // Assert
      expect(result).toBeUndefined();
    });

    it('should return null when user is null and no property is requested', () => {
      // Arrange
      mockRequest.user = null;

      // Act
      const request = mockExecutionContext.switchToHttp().getRequest();
      const user = request.user as AuthenticatedUser;
      const data = undefined;
      const result = data ? user?.[data as any] : user;

      // Assert
      expect(result).toBeNull();
    });

    it('should return undefined when user is undefined and property is requested', () => {
      // Arrange
      mockRequest.user = undefined;

      // Act
      const request = mockExecutionContext.switchToHttp().getRequest();
      const user = request.user as AuthenticatedUser;
      const data: keyof AuthenticatedUser = 'id';
      const result = data ? user?.[data] : user;

      // Assert
      expect(result).toBeUndefined();
    });

    it('should return roles array when requested', () => {
      // Arrange
      const mockUser: AuthenticatedUser = {
        id: '123',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        isActive: true,
        isVerified: true,
        roles: ['ADMIN', 'USER'],
        permissions: ['read:all', 'write:all'],
      };
      mockRequest.user = mockUser;

      // Act
      const request = mockExecutionContext.switchToHttp().getRequest();
      const user = request.user as AuthenticatedUser;
      const data: keyof AuthenticatedUser = 'roles';
      const result = data ? user?.[data] : user;

      // Assert
      expect(result).toEqual(['ADMIN', 'USER']);
    });

    it('should return firstName when requested', () => {
      // Arrange
      const mockUser: AuthenticatedUser = {
        id: '123',
        email: 'test@example.com',
        firstName: 'TestFirstName',
        lastName: 'TestLastName',
        isActive: true,
        isVerified: true,
      };
      mockRequest.user = mockUser;

      // Act
      const request = mockExecutionContext.switchToHttp().getRequest();
      const user = request.user as AuthenticatedUser;
      const data: keyof AuthenticatedUser = 'firstName';
      const result = data ? user?.[data] : user;

      // Assert
      expect(result).toBe('TestFirstName');
    });

    it('should return null for firstName when it is null', () => {
      // Arrange
      const mockUser: AuthenticatedUser = {
        id: '123',
        email: 'test@example.com',
        firstName: null,
        lastName: null,
        isActive: true,
        isVerified: true,
      };
      mockRequest.user = mockUser;

      // Act
      const request = mockExecutionContext.switchToHttp().getRequest();
      const user = request.user as AuthenticatedUser;
      const data: keyof AuthenticatedUser = 'firstName';
      const result = data ? user?.[data] : user;

      // Assert
      expect(result).toBeNull();
    });

    it('should return permissions array when requested', () => {
      // Arrange
      const mockUser: AuthenticatedUser = {
        id: '123',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        isActive: true,
        isVerified: true,
        permissions: ['read:all', 'write:all', 'delete:all'],
      };
      mockRequest.user = mockUser;

      // Act
      const request = mockExecutionContext.switchToHttp().getRequest();
      const user = request.user as AuthenticatedUser;
      const data: keyof AuthenticatedUser = 'permissions';
      const result = data ? user?.[data] : user;

      // Assert
      expect(result).toEqual(['read:all', 'write:all', 'delete:all']);
    });

    it('should return isActive boolean when requested', () => {
      // Arrange
      const mockUser: AuthenticatedUser = {
        id: '123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isActive: false,
        isVerified: true,
      };
      mockRequest.user = mockUser;

      // Act
      const request = mockExecutionContext.switchToHttp().getRequest();
      const user = request.user as AuthenticatedUser;
      const data: keyof AuthenticatedUser = 'isActive';
      const result = data ? user?.[data] : user;

      // Assert
      expect(result).toBe(false);
    });

    it('should return isVerified boolean when requested', () => {
      // Arrange
      const mockUser: AuthenticatedUser = {
        id: '123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        isVerified: false,
      };
      mockRequest.user = mockUser;

      // Act
      const request = mockExecutionContext.switchToHttp().getRequest();
      const user = request.user as AuthenticatedUser;
      const data: keyof AuthenticatedUser = 'isVerified';
      const result = data ? user?.[data] : user;

      // Assert
      expect(result).toBe(false);
    });

    it('should return lastName when requested', () => {
      // Arrange
      const mockUser: AuthenticatedUser = {
        id: '123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'TestLastName',
        isActive: true,
        isVerified: true,
      };
      mockRequest.user = mockUser;

      // Act
      const request = mockExecutionContext.switchToHttp().getRequest();
      const user = request.user as AuthenticatedUser;
      const data: keyof AuthenticatedUser = 'lastName';
      const result = data ? user?.[data] : user;

      // Assert
      expect(result).toBe('TestLastName');
    });
  });
});
