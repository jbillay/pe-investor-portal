import { SecurityMiddleware } from './security.middleware';
import { Request, Response, NextFunction } from 'express';

describe('SecurityMiddleware', () => {
  let middleware: SecurityMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let setHeaderSpy: jest.Mock;
  let removeHeaderSpy: jest.Mock;

  beforeEach(() => {
    middleware = new SecurityMiddleware();
    mockNext = jest.fn();
    mockRequest = {};

    setHeaderSpy = jest.fn();
    removeHeaderSpy = jest.fn();
    mockResponse = {
      setHeader: setHeaderSpy,
      removeHeader: removeHeaderSpy,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.NODE_ENV;
  });

  describe('Security headers', () => {
    it('should set X-Content-Type-Options header', () => {
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(setHeaderSpy).toHaveBeenCalledWith(
        'X-Content-Type-Options',
        'nosniff',
      );
    });

    it('should set X-Frame-Options header', () => {
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(setHeaderSpy).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
    });

    it('should set X-XSS-Protection header', () => {
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(setHeaderSpy).toHaveBeenCalledWith(
        'X-XSS-Protection',
        '1; mode=block',
      );
    });

    it('should set Referrer-Policy header', () => {
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(setHeaderSpy).toHaveBeenCalledWith(
        'Referrer-Policy',
        'strict-origin-when-cross-origin',
      );
    });

    it('should set Permissions-Policy header', () => {
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(setHeaderSpy).toHaveBeenCalledWith(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=()',
      );
    });

    it('should remove X-Powered-By header', () => {
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(removeHeaderSpy).toHaveBeenCalledWith('X-Powered-By');
    });

    it('should set Content-Security-Policy header', () => {
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(setHeaderSpy).toHaveBeenCalledWith(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';",
      );
    });

    it('should call next middleware', () => {
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should set all headers in a single middleware execution', () => {
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // Should set 6 headers and remove 1
      expect(setHeaderSpy).toHaveBeenCalledTimes(6);
      expect(removeHeaderSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('HSTS header in production', () => {
    it('should set HSTS header when NODE_ENV is production', () => {
      process.env.NODE_ENV = 'production';

      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(setHeaderSpy).toHaveBeenCalledWith(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload',
      );
    });

    it('should not set HSTS header when NODE_ENV is development', () => {
      process.env.NODE_ENV = 'development';

      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(setHeaderSpy).not.toHaveBeenCalledWith(
        'Strict-Transport-Security',
        expect.any(String),
      );
    });

    it('should not set HSTS header when NODE_ENV is test', () => {
      process.env.NODE_ENV = 'test';

      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(setHeaderSpy).not.toHaveBeenCalledWith(
        'Strict-Transport-Security',
        expect.any(String),
      );
    });

    it('should not set HSTS header when NODE_ENV is not set', () => {
      delete process.env.NODE_ENV;

      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(setHeaderSpy).not.toHaveBeenCalledWith(
        'Strict-Transport-Security',
        expect.any(String),
      );
    });
  });

  describe('Multiple requests', () => {
    it('should set headers consistently across multiple requests', () => {
      // First request
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      const firstCallCount = setHeaderSpy.mock.calls.length;

      jest.clearAllMocks();

      // Second request
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      const secondCallCount = setHeaderSpy.mock.calls.length;

      expect(firstCallCount).toBe(secondCallCount);
    });
  });
});
