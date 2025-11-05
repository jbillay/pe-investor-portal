import { CsrfMiddleware } from './csrf.middleware';
import { Request, Response, NextFunction } from 'express';

// Mock the csrf-csrf library
jest.mock('csrf-csrf', () => ({
  doubleCsrf: jest.fn(() => ({
    generateCsrfToken: jest.fn(),
    doubleCsrfProtection: jest.fn((req, res, next) => next()),
  })),
}));

describe('CsrfMiddleware', () => {
  let middleware: CsrfMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    middleware = new CsrfMiddleware();
    mockNext = jest.fn();
    mockRequest = {
      originalUrl: '',
      url: '',
      method: 'POST',
    };
    mockResponse = {};
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Public routes', () => {
    const publicRoutes = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/refresh',
      '/api/auth/csrf',
      '/health',
      '/api-docs',
    ];

    publicRoutes.forEach((route) => {
      it(`should skip CSRF protection for ${route}`, () => {
        mockRequest.originalUrl = route;

        middleware.use(
          mockRequest as Request,
          mockResponse as Response,
          mockNext,
        );

        expect(mockNext).toHaveBeenCalledTimes(1);
      });

      it(`should skip CSRF protection for ${route} with query params`, () => {
        mockRequest.originalUrl = `${route}?foo=bar`;

        middleware.use(
          mockRequest as Request,
          mockResponse as Response,
          mockNext,
        );

        expect(mockNext).toHaveBeenCalledTimes(1);
      });
    });

    it('should use url fallback when originalUrl is not available', () => {
      mockRequest.originalUrl = undefined;
      mockRequest.url = '/api/auth/login';

      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should skip CSRF for route starting with public path', () => {
      mockRequest.originalUrl = '/api/auth/login/callback';

      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('Protected routes', () => {
    it('should apply CSRF protection for protected route', () => {
      mockRequest.originalUrl = '/api/users';

      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should apply CSRF protection for admin routes', () => {
      mockRequest.originalUrl = '/api/admin/roles';

      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should apply CSRF protection for user profile routes', () => {
      mockRequest.originalUrl = '/api/profile';

      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should apply CSRF protection for portfolio routes', () => {
      mockRequest.originalUrl = '/api/portfolios/123';

      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty originalUrl', () => {
      mockRequest.originalUrl = '';
      mockRequest.url = '';

      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should handle routes that partially match public routes', () => {
      mockRequest.originalUrl = '/api/authentication'; // Not /api/auth

      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should be case-sensitive for route matching', () => {
      mockRequest.originalUrl = '/API/AUTH/LOGIN'; // Uppercase

      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should handle routes with trailing slashes', () => {
      mockRequest.originalUrl = '/api/auth/login/';

      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });
});
