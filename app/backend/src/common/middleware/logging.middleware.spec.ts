import { LoggingMiddleware } from './logging.middleware';
import { Request, Response, NextFunction } from 'express';
import { Logger } from '@nestjs/common';

describe('LoggingMiddleware', () => {
  let middleware: LoggingMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let logSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    middleware = new LoggingMiddleware();

    // Mock Logger methods
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

    // Mock request
    mockRequest = {
      method: 'GET',
      originalUrl: '/api/test',
      get: jest.fn((header: string) => {
        if (header === 'user-agent') return 'Mozilla/5.0';
        return undefined;
      }),
    };

    // Mock response with event emitter
    const eventListeners: { [event: string]: Function } = {};
    mockResponse = {
      statusCode: 200,
      get: jest.fn((header: string) => {
        if (header === 'content-length') return '1024';
        return undefined;
      }),
      on: jest.fn((event: string, callback: Function) => {
        eventListeners[event] = callback;
        return mockResponse as Response;
      }),
    };

    // Store reference to emit close event
    (mockResponse as any)._emitClose = () => {
      if (eventListeners['close']) {
        eventListeners['close']();
      }
    };

    nextFunction = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should log successful requests with status 200', () => {
    // Arrange
    mockResponse.statusCode = 200;

    // Act
    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);
    (mockResponse as any)._emitClose();

    // Assert
    expect(nextFunction).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();

    const logMessage = logSpy.mock.calls[0][0];
    expect(logMessage).toContain('GET');
    expect(logMessage).toContain('/api/test');
    expect(logMessage).toContain('200');
    expect(logMessage).toContain('Mozilla/5.0');
    expect(logMessage).toMatch(/\d+ms$/);
  });

  it('should warn for client error responses (4xx)', () => {
    // Arrange
    mockResponse.statusCode = 404;

    // Act
    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);
    (mockResponse as any)._emitClose();

    // Assert
    expect(warnSpy).toHaveBeenCalled();
    expect(logSpy).not.toHaveBeenCalled();

    const warnMessage = warnSpy.mock.calls[0][0];
    expect(warnMessage).toContain('404');
  });

  it('should warn for server error responses (5xx)', () => {
    // Arrange
    mockResponse.statusCode = 500;

    // Act
    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);
    (mockResponse as any)._emitClose();

    // Assert
    expect(warnSpy).toHaveBeenCalled();
    const warnMessage = warnSpy.mock.calls[0][0];
    expect(warnMessage).toContain('500');
  });

  it('should skip logging health checks in production', () => {
    // Arrange
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    mockRequest.originalUrl = '/health';

    // Act
    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);
    (mockResponse as any)._emitClose();

    // Assert
    expect(logSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();

    // Cleanup
    process.env.NODE_ENV = originalEnv;
  });

  it('should log health checks in non-production environments', () => {
    // Arrange
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    mockRequest.originalUrl = '/health';
    mockResponse.statusCode = 200;

    // Act
    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);
    (mockResponse as any)._emitClose();

    // Assert
    expect(logSpy).toHaveBeenCalled();

    // Cleanup
    process.env.NODE_ENV = originalEnv;
  });

  it('should handle missing user-agent', () => {
    // Arrange
    mockRequest.get = jest.fn(() => undefined);

    // Act
    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);
    (mockResponse as any)._emitClose();

    // Assert
    expect(logSpy).toHaveBeenCalled();
    const logMessage = logSpy.mock.calls[0][0];
    expect(logMessage).toContain('GET');
    expect(logMessage).toContain('/api/test');
  });

  it('should handle missing content-length', () => {
    // Arrange
    mockResponse.get = jest.fn(() => undefined);

    // Act
    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);
    (mockResponse as any)._emitClose();

    // Assert
    expect(logSpy).toHaveBeenCalled();
    const logMessage = logSpy.mock.calls[0][0];
    expect(logMessage).toContain('0'); // Default content length
  });

  it('should log POST requests', () => {
    // Arrange
    mockRequest.method = 'POST';
    mockRequest.originalUrl = '/api/users';
    mockResponse.statusCode = 201;

    // Act
    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);
    (mockResponse as any)._emitClose();

    // Assert
    expect(logSpy).toHaveBeenCalled();
    const logMessage = logSpy.mock.calls[0][0];
    expect(logMessage).toContain('POST');
    expect(logMessage).toContain('/api/users');
    expect(logMessage).toContain('201');
  });

  it('should log PUT requests', () => {
    // Arrange
    mockRequest.method = 'PUT';
    mockRequest.originalUrl = '/api/users/123';

    // Act
    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);
    (mockResponse as any)._emitClose();

    // Assert
    expect(logSpy).toHaveBeenCalled();
    const logMessage = logSpy.mock.calls[0][0];
    expect(logMessage).toContain('PUT');
    expect(logMessage).toContain('/api/users/123');
  });

  it('should log DELETE requests', () => {
    // Arrange
    mockRequest.method = 'DELETE';
    mockRequest.originalUrl = '/api/users/456';
    mockResponse.statusCode = 204;

    // Act
    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);
    (mockResponse as any)._emitClose();

    // Assert
    expect(logSpy).toHaveBeenCalled();
    const logMessage = logSpy.mock.calls[0][0];
    expect(logMessage).toContain('DELETE');
    expect(logMessage).toContain('204');
  });

  it('should call next() to continue the request chain', () => {
    // Act
    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

    // Assert
    expect(nextFunction).toHaveBeenCalledTimes(1);
  });

  it('should measure and log response time', () => {
    // Act
    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

    // Simulate some processing time
    jest.advanceTimersByTime(100);

    (mockResponse as any)._emitClose();

    // Assert
    expect(logSpy).toHaveBeenCalled();
    const logMessage = logSpy.mock.calls[0][0];
    expect(logMessage).toMatch(/\d+ms$/);
  });
});
