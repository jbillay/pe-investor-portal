import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { AuditLoggerService } from './audit-logger.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuditLoggerService', () => {
  let service: AuditLoggerService;
  let prisma: jest.Mocked<PrismaService>;

  const mockPrisma = {
    auditLog: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLoggerService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<AuditLoggerService>(AuditLoggerService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;

    // Suppress console output during tests
    jest.spyOn(Logger.prototype, 'debug').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('logEvent', () => {
    it('should log an audit event successfully', async () => {
      const eventData = {
        action: 'TEST_ACTION',
        userId: 'user-123',
        resource: 'test-resource',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        details: { foo: 'bar' },
      };

      prisma.auditLog.create.mockResolvedValue({
        id: 'log-123',
        ...eventData,
        createdAt: new Date(),
      } as any);

      await service.logEvent(eventData);

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'TEST_ACTION',
          userId: 'user-123',
          resource: 'test-resource',
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
          details: { foo: 'bar' },
        },
      });
    });

    it('should handle null optional fields', async () => {
      const eventData = {
        action: 'TEST_ACTION',
      };

      prisma.auditLog.create.mockResolvedValue({
        id: 'log-123',
        action: 'TEST_ACTION',
        userId: null,
        resource: null,
        ipAddress: null,
        userAgent: null,
        details: null,
        createdAt: new Date(),
      } as any);

      await service.logEvent(eventData);

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'TEST_ACTION',
          userId: null,
          resource: null,
          ipAddress: null,
          userAgent: null,
          details: null,
        },
      });
    });

    it('should log debug message on successful logging', async () => {
      const debugSpy = jest.spyOn(Logger.prototype, 'debug');
      const eventData = {
        action: 'TEST_ACTION',
        userId: 'user-123',
      };

      prisma.auditLog.create.mockResolvedValue({} as any);

      await service.logEvent(eventData);

      expect(debugSpy).toHaveBeenCalledWith(
        'Audit event logged: TEST_ACTION by user user-123',
      );
    });

    it('should handle database errors gracefully', async () => {
      const errorSpy = jest.spyOn(Logger.prototype, 'error');
      const eventData = {
        action: 'TEST_ACTION',
        userId: 'user-123',
      };

      const dbError = new Error('Database connection failed');
      prisma.auditLog.create.mockRejectedValue(dbError);

      await service.logEvent(eventData);

      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to log audit event: TEST_ACTION',
        dbError,
      );
    });

    it('should not throw error on database failure', async () => {
      const eventData = {
        action: 'TEST_ACTION',
        userId: 'user-123',
      };

      prisma.auditLog.create.mockRejectedValue(new Error('Database error'));

      await expect(service.logEvent(eventData)).resolves.not.toThrow();
    });

    it('should handle undefined optional fields', async () => {
      const eventData = {
        action: 'TEST_ACTION',
        userId: 'user-123',
        resource: undefined,
        ipAddress: undefined,
        userAgent: undefined,
        details: undefined,
      };

      prisma.auditLog.create.mockResolvedValue({} as any);

      await service.logEvent(eventData);

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'TEST_ACTION',
          userId: 'user-123',
          resource: null,
          ipAddress: null,
          userAgent: null,
          details: null,
        },
      });
    });
  });

  describe('logAuthEvent', () => {
    it('should log LOGIN event', async () => {
      prisma.auditLog.create.mockResolvedValue({} as any);

      await service.logAuthEvent(
        'LOGIN',
        'user-123',
        '192.168.1.1',
        'Mozilla/5.0',
        { method: '2FA' },
      );

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'LOGIN',
          userId: 'user-123',
          resource: 'auth',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          details: { method: '2FA' },
        },
      });
    });

    it('should log LOGOUT event', async () => {
      prisma.auditLog.create.mockResolvedValue({} as any);

      await service.logAuthEvent('LOGOUT', 'user-123');

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'LOGOUT',
          userId: 'user-123',
          resource: 'auth',
          ipAddress: null,
          userAgent: null,
          details: null,
        },
      });
    });

    it('should log REGISTER event', async () => {
      prisma.auditLog.create.mockResolvedValue({} as any);

      await service.logAuthEvent('REGISTER', 'user-456', '10.0.0.1');

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'REGISTER',
          userId: 'user-456',
          resource: 'auth',
          ipAddress: '10.0.0.1',
          userAgent: null,
          details: null,
        },
      });
    });

    it('should log TOKEN_REFRESH event', async () => {
      prisma.auditLog.create.mockResolvedValue({} as any);

      await service.logAuthEvent('TOKEN_REFRESH', 'user-123');

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'TOKEN_REFRESH',
          userId: 'user-123',
          resource: 'auth',
          ipAddress: null,
          userAgent: null,
          details: null,
        },
      });
    });

    it('should log LOGIN_FAILED event', async () => {
      prisma.auditLog.create.mockResolvedValue({} as any);

      await service.logAuthEvent('LOGIN_FAILED', 'user-123', '127.0.0.1', 'curl', {
        reason: 'Invalid password',
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'LOGIN_FAILED',
          userId: 'user-123',
          resource: 'auth',
          ipAddress: '127.0.0.1',
          userAgent: 'curl',
          details: { reason: 'Invalid password' },
        },
      });
    });
  });

  describe('logUserEvent', () => {
    it('should log USER_CREATED event', async () => {
      prisma.auditLog.create.mockResolvedValue({} as any);

      await service.logUserEvent(
        'USER_CREATED',
        'admin-123',
        'user-456',
        '192.168.1.1',
        'Mozilla/5.0',
        { email: 'test@example.com' },
      );

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'USER_CREATED',
          userId: 'admin-123',
          resource: 'user',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          details: {
            email: 'test@example.com',
            targetUserId: 'user-456',
          },
        },
      });
    });

    it('should log USER_UPDATED event', async () => {
      prisma.auditLog.create.mockResolvedValue({} as any);

      await service.logUserEvent('USER_UPDATED', 'admin-123', 'user-456');

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'USER_UPDATED',
          userId: 'admin-123',
          resource: 'user',
          ipAddress: null,
          userAgent: null,
          details: {
            targetUserId: 'user-456',
          },
        },
      });
    });

    it('should log ROLE_ASSIGNED event', async () => {
      prisma.auditLog.create.mockResolvedValue({} as any);

      await service.logUserEvent('ROLE_ASSIGNED', 'admin-123', 'user-456', undefined, undefined, {
        roleName: 'MANAGER',
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'ROLE_ASSIGNED',
          userId: 'admin-123',
          resource: 'user',
          ipAddress: null,
          userAgent: null,
          details: {
            roleName: 'MANAGER',
            targetUserId: 'user-456',
          },
        },
      });
    });

    it('should log ROLE_REVOKED event', async () => {
      prisma.auditLog.create.mockResolvedValue({} as any);

      await service.logUserEvent('ROLE_REVOKED', 'admin-123', 'user-456');

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'ROLE_REVOKED',
          userId: 'admin-123',
          resource: 'user',
          ipAddress: null,
          userAgent: null,
          details: {
            targetUserId: 'user-456',
          },
        },
      });
    });

    it('should handle undefined targetUserId', async () => {
      prisma.auditLog.create.mockResolvedValue({} as any);

      await service.logUserEvent('USER_VIEWED', 'admin-123');

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'USER_VIEWED',
          userId: 'admin-123',
          resource: 'user',
          ipAddress: null,
          userAgent: null,
          details: {
            targetUserId: undefined,
          },
        },
      });
    });
  });

  describe('logResourceEvent', () => {
    it('should log CREATED event with uppercase action', async () => {
      prisma.auditLog.create.mockResolvedValue({} as any);

      await service.logResourceEvent(
        'CREATED',
        'portfolio',
        'user-123',
        'portfolio-456',
        '192.168.1.1',
        'Mozilla/5.0',
        { name: 'New Portfolio' },
      );

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'PORTFOLIO_CREATED',
          userId: 'user-123',
          resource: 'portfolio',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          details: {
            name: 'New Portfolio',
            resourceId: 'portfolio-456',
          },
        },
      });
    });

    it('should log VIEWED event', async () => {
      prisma.auditLog.create.mockResolvedValue({} as any);

      await service.logResourceEvent('VIEWED', 'document', 'user-123', 'doc-789');

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'DOCUMENT_VIEWED',
          userId: 'user-123',
          resource: 'document',
          ipAddress: null,
          userAgent: null,
          details: {
            resourceId: 'doc-789',
          },
        },
      });
    });

    it('should log DOWNLOADED event', async () => {
      prisma.auditLog.create.mockResolvedValue({} as any);

      await service.logResourceEvent(
        'DOWNLOADED',
        'report',
        'user-123',
        'report-999',
        '10.0.0.1',
      );

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'REPORT_DOWNLOADED',
          userId: 'user-123',
          resource: 'report',
          ipAddress: '10.0.0.1',
          userAgent: null,
          details: {
            resourceId: 'report-999',
          },
        },
      });
    });

    it('should handle lowercase resource type', async () => {
      prisma.auditLog.create.mockResolvedValue({} as any);

      await service.logResourceEvent('CREATED', 'file', 'user-123');

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'FILE_CREATED',
          userId: 'user-123',
          resource: 'file',
          ipAddress: null,
          userAgent: null,
          details: {
            resourceId: undefined,
          },
        },
      });
    });

    it('should handle undefined resourceId', async () => {
      prisma.auditLog.create.mockResolvedValue({} as any);

      await service.logResourceEvent('UPDATED', 'settings', 'user-123');

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'SETTINGS_UPDATED',
          userId: 'user-123',
          resource: 'settings',
          ipAddress: null,
          userAgent: null,
          details: {
            resourceId: undefined,
          },
        },
      });
    });
  });

  describe('logSecurityEvent', () => {
    it('should log SUSPICIOUS_ACTIVITY event', async () => {
      prisma.auditLog.create.mockResolvedValue({} as any);

      await service.logSecurityEvent(
        'SUSPICIOUS_ACTIVITY',
        'user-123',
        '192.168.1.1',
        'curl',
        { reason: 'Multiple failed login attempts' },
      );

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'SUSPICIOUS_ACTIVITY',
          userId: 'user-123',
          resource: 'security',
          ipAddress: '192.168.1.1',
          userAgent: 'curl',
          details: { reason: 'Multiple failed login attempts' },
        },
      });
    });

    it('should log RATE_LIMIT_EXCEEDED event', async () => {
      prisma.auditLog.create.mockResolvedValue({} as any);

      await service.logSecurityEvent('RATE_LIMIT_EXCEEDED', undefined, '10.0.0.1');

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'RATE_LIMIT_EXCEEDED',
          userId: null,
          resource: 'security',
          ipAddress: '10.0.0.1',
          userAgent: null,
          details: null,
        },
      });
    });

    it('should log ACCOUNT_LOCKED event', async () => {
      prisma.auditLog.create.mockResolvedValue({} as any);

      await service.logSecurityEvent('ACCOUNT_LOCKED', 'user-123', '127.0.0.1', undefined, {
        reason: 'Too many failed attempts',
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'ACCOUNT_LOCKED',
          userId: 'user-123',
          resource: 'security',
          ipAddress: '127.0.0.1',
          userAgent: null,
          details: { reason: 'Too many failed attempts' },
        },
      });
    });

    it('should log PASSWORD_RESET event', async () => {
      prisma.auditLog.create.mockResolvedValue({} as any);

      await service.logSecurityEvent('PASSWORD_RESET', 'user-123');

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'PASSWORD_RESET',
          userId: 'user-123',
          resource: 'security',
          ipAddress: null,
          userAgent: null,
          details: null,
        },
      });
    });

    it('should log PASSWORD_CHANGED event', async () => {
      prisma.auditLog.create.mockResolvedValue({} as any);

      await service.logSecurityEvent('PASSWORD_CHANGED', 'user-123', undefined, undefined, {
        initiatedBy: 'user',
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'PASSWORD_CHANGED',
          userId: 'user-123',
          resource: 'security',
          ipAddress: null,
          userAgent: null,
          details: { initiatedBy: 'user' },
        },
      });
    });
  });

  describe('logAdminEvent', () => {
    it('should log admin event with uppercase action prefix', async () => {
      prisma.auditLog.create.mockResolvedValue({} as any);

      await service.logAdminEvent(
        'config_change',
        'admin-123',
        'system',
        '192.168.1.1',
        'Mozilla/5.0',
        { setting: 'maxLoginAttempts', oldValue: 5, newValue: 3 },
      );

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'ADMIN_CONFIG_CHANGE',
          userId: 'admin-123',
          resource: 'system',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          details: { setting: 'maxLoginAttempts', oldValue: 5, newValue: 3 },
        },
      });
    });

    it('should default resource to admin when not provided', async () => {
      prisma.auditLog.create.mockResolvedValue({} as any);

      await service.logAdminEvent('system_restart', 'admin-123');

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'ADMIN_SYSTEM_RESTART',
          userId: 'admin-123',
          resource: 'admin',
          ipAddress: null,
          userAgent: null,
          details: null,
        },
      });
    });

    it('should handle undefined targetResource', async () => {
      prisma.auditLog.create.mockResolvedValue({} as any);

      await service.logAdminEvent('bulk_delete', 'admin-123', undefined, '10.0.0.1');

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'ADMIN_BULK_DELETE',
          userId: 'admin-123',
          resource: 'admin',
          ipAddress: '10.0.0.1',
          userAgent: null,
          details: null,
        },
      });
    });

    it('should handle lowercase action', async () => {
      prisma.auditLog.create.mockResolvedValue({} as any);

      await service.logAdminEvent('user_import', 'admin-123', 'users', undefined, undefined, {
        count: 100,
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'ADMIN_USER_IMPORT',
          userId: 'admin-123',
          resource: 'users',
          ipAddress: null,
          userAgent: null,
          details: { count: 100 },
        },
      });
    });
  });

  describe('Error handling across all methods', () => {
    it('should handle errors in logAuthEvent gracefully', async () => {
      const errorSpy = jest.spyOn(Logger.prototype, 'error');
      prisma.auditLog.create.mockRejectedValue(new Error('DB Error'));

      await service.logAuthEvent('LOGIN', 'user-123');

      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to log audit event: LOGIN',
        expect.any(Error),
      );
    });

    it('should handle errors in logUserEvent gracefully', async () => {
      const errorSpy = jest.spyOn(Logger.prototype, 'error');
      prisma.auditLog.create.mockRejectedValue(new Error('DB Error'));

      await service.logUserEvent('USER_CREATED', 'admin-123');

      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to log audit event: USER_CREATED',
        expect.any(Error),
      );
    });

    it('should handle errors in logResourceEvent gracefully', async () => {
      const errorSpy = jest.spyOn(Logger.prototype, 'error');
      prisma.auditLog.create.mockRejectedValue(new Error('DB Error'));

      await service.logResourceEvent('CREATED', 'portfolio', 'user-123');

      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to log audit event: PORTFOLIO_CREATED',
        expect.any(Error),
      );
    });

    it('should handle errors in logSecurityEvent gracefully', async () => {
      const errorSpy = jest.spyOn(Logger.prototype, 'error');
      prisma.auditLog.create.mockRejectedValue(new Error('DB Error'));

      await service.logSecurityEvent('SUSPICIOUS_ACTIVITY');

      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to log audit event: SUSPICIOUS_ACTIVITY',
        expect.any(Error),
      );
    });

    it('should handle errors in logAdminEvent gracefully', async () => {
      const errorSpy = jest.spyOn(Logger.prototype, 'error');
      prisma.auditLog.create.mockRejectedValue(new Error('DB Error'));

      await service.logAdminEvent('config_change', 'admin-123');

      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to log audit event: ADMIN_CONFIG_CHANGE',
        expect.any(Error),
      );
    });
  });
});
