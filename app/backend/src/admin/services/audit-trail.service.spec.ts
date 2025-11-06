import { Test, TestingModule } from '@nestjs/testing';
import { Logger, BadRequestException } from '@nestjs/common';
import { AuditTrailService } from './audit-trail.service';
import { PrismaService } from '../../database/prisma.service';

describe('AuditTrailService', () => {
  let service: AuditTrailService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockAuditLog = {
    id: 'log-123',
    userId: 'user-123',
    action: 'USER_LOGIN',
    resource: 'USER',
    details: { loginMethod: 'email' },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/91.0.4472.124',
    createdAt: new Date('2024-01-15T10:00:00Z'),
  };

  const mockUser = {
    id: 'user-123',
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe',
  };

  beforeEach(async () => {
    const mockPrismaService = {
      auditLog: {
        findMany: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
      },
      user: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditTrailService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AuditTrailService>(AuditTrailService);
    prismaService = module.get(PrismaService) as any;

    // Suppress logger output in tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAuditTrail', () => {
    it('should retrieve paginated audit trail with default params', async () => {
      const query = {};
      const requestorId = 'admin-123';

      (prismaService.auditLog.findMany as jest.Mock).mockResolvedValue([mockAuditLog]);
      (prismaService.auditLog.count as jest.Mock).mockResolvedValue(1);
      (prismaService.user.findMany as jest.Mock).mockResolvedValue([mockUser]);

      const result = await service.getAuditTrail(query as any, requestorId);

      expect(result.data).toHaveLength(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(50);
      expect(result.pagination.total).toBe(1);
      expect(prismaService.auditLog.findMany).toHaveBeenCalled();
      expect(prismaService.auditLog.count).toHaveBeenCalled();
    });

    it('should retrieve audit trail with custom pagination', async () => {
      const query = { page: 2, limit: 10 };
      const requestorId = 'admin-123';

      (prismaService.auditLog.findMany as jest.Mock).mockResolvedValue([mockAuditLog]);
      (prismaService.auditLog.count as jest.Mock).mockResolvedValue(25);
      (prismaService.user.findMany as jest.Mock).mockResolvedValue([mockUser]);

      const result = await service.getAuditTrail(query as any, requestorId);

      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.total).toBe(25);
      expect(result.pagination.totalPages).toBe(3);
      expect(result.pagination.hasNextPage).toBe(true);
      expect(result.pagination.hasPreviousPage).toBe(true);
      expect(prismaService.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
    });

    it('should filter by userId', async () => {
      const query = { userId: 'user-123' };
      const requestorId = 'admin-123';

      (prismaService.auditLog.findMany as jest.Mock).mockResolvedValue([mockAuditLog]);
      (prismaService.auditLog.count as jest.Mock).mockResolvedValue(1);
      (prismaService.user.findMany as jest.Mock).mockResolvedValue([mockUser]);

      await service.getAuditTrail(query as any, requestorId);

      expect(prismaService.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-123',
          }),
        }),
      );
    });

    it('should filter by action', async () => {
      const query = { action: 'LOGIN' };
      const requestorId = 'admin-123';

      (prismaService.auditLog.findMany as jest.Mock).mockResolvedValue([mockAuditLog]);
      (prismaService.auditLog.count as jest.Mock).mockResolvedValue(1);
      (prismaService.user.findMany as jest.Mock).mockResolvedValue([mockUser]);

      await service.getAuditTrail(query as any, requestorId);

      expect(prismaService.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            action: {
              contains: 'LOGIN',
              mode: 'insensitive',
            },
          }),
        }),
      );
    });

    it('should filter by resource', async () => {
      const query = { resource: 'USER' };
      const requestorId = 'admin-123';

      (prismaService.auditLog.findMany as jest.Mock).mockResolvedValue([mockAuditLog]);
      (prismaService.auditLog.count as jest.Mock).mockResolvedValue(1);
      (prismaService.user.findMany as jest.Mock).mockResolvedValue([mockUser]);

      await service.getAuditTrail(query as any, requestorId);

      expect(prismaService.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            resource: 'USER',
          }),
        }),
      );
    });

    it('should filter by ipAddress', async () => {
      const query = { ipAddress: '192.168.1.100' };
      const requestorId = 'admin-123';

      (prismaService.auditLog.findMany as jest.Mock).mockResolvedValue([mockAuditLog]);
      (prismaService.auditLog.count as jest.Mock).mockResolvedValue(1);
      (prismaService.user.findMany as jest.Mock).mockResolvedValue([mockUser]);

      await service.getAuditTrail(query as any, requestorId);

      expect(prismaService.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            ipAddress: '192.168.1.100',
          }),
        }),
      );
    });

    it('should filter with search across multiple fields', async () => {
      const query = { search: 'login' };
      const requestorId = 'admin-123';

      (prismaService.auditLog.findMany as jest.Mock).mockResolvedValue([mockAuditLog]);
      (prismaService.auditLog.count as jest.Mock).mockResolvedValue(1);
      (prismaService.user.findMany as jest.Mock).mockResolvedValue([mockUser]);

      await service.getAuditTrail(query as any, requestorId);

      expect(prismaService.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                action: {
                  contains: 'login',
                  mode: 'insensitive',
                },
              }),
            ]),
          }),
        }),
      );
    });

    it('should filter by explicit date range', async () => {
      const query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };
      const requestorId = 'admin-123';

      (prismaService.auditLog.findMany as jest.Mock).mockResolvedValue([mockAuditLog]);
      (prismaService.auditLog.count as jest.Mock).mockResolvedValue(1);
      (prismaService.user.findMany as jest.Mock).mockResolvedValue([mockUser]);

      await service.getAuditTrail(query as any, requestorId);

      expect(prismaService.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        }),
      );
    });

    it('should filter by days lookback', async () => {
      const query = { days: 7 };
      const requestorId = 'admin-123';

      (prismaService.auditLog.findMany as jest.Mock).mockResolvedValue([mockAuditLog]);
      (prismaService.auditLog.count as jest.Mock).mockResolvedValue(1);
      (prismaService.user.findMany as jest.Mock).mockResolvedValue([mockUser]);

      await service.getAuditTrail(query as any, requestorId);

      expect(prismaService.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        }),
      );
    });

    it('should filter by days lookback with string value', async () => {
      const query = { days: '14' };
      const requestorId = 'admin-123';

      (prismaService.auditLog.findMany as jest.Mock).mockResolvedValue([mockAuditLog]);
      (prismaService.auditLog.count as jest.Mock).mockResolvedValue(1);
      (prismaService.user.findMany as jest.Mock).mockResolvedValue([mockUser]);

      await service.getAuditTrail(query as any, requestorId);

      expect(prismaService.auditLog.findMany).toHaveBeenCalled();
    });

    it('should apply custom sort order', async () => {
      const query = { sortBy: 'action', sortOrder: 'asc' as const };
      const requestorId = 'admin-123';

      (prismaService.auditLog.findMany as jest.Mock).mockResolvedValue([mockAuditLog]);
      (prismaService.auditLog.count as jest.Mock).mockResolvedValue(1);
      (prismaService.user.findMany as jest.Mock).mockResolvedValue([mockUser]);

      await service.getAuditTrail(query as any, requestorId);

      expect(prismaService.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            action: 'asc',
          },
        }),
      );
    });

    it('should include sensitive data when requested', async () => {
      const query = { includeSensitive: true };
      const requestorId = 'admin-123';

      (prismaService.auditLog.findMany as jest.Mock).mockResolvedValue([mockAuditLog]);
      (prismaService.auditLog.count as jest.Mock).mockResolvedValue(1);
      (prismaService.user.findMany as jest.Mock).mockResolvedValue([mockUser]);

      const result = await service.getAuditTrail(query as any, requestorId);

      expect(result.data[0].ipAddress).toBe('192.168.1.100'); // Not masked
      expect(result.data[0].userAgent).toContain('Chrome'); // Full user agent
    });

    it('should sanitize data when sensitive data not requested', async () => {
      const query = { includeSensitive: false };
      const requestorId = 'admin-123';

      (prismaService.auditLog.findMany as jest.Mock).mockResolvedValue([mockAuditLog]);
      (prismaService.auditLog.count as jest.Mock).mockResolvedValue(1);
      (prismaService.user.findMany as jest.Mock).mockResolvedValue([mockUser]);

      const result = await service.getAuditTrail(query as any, requestorId);

      expect(result.data[0].ipAddress).toBe('192.168.1.XXX'); // Masked
      expect(result.data[0].userAgent).toBe('Chrome/91'); // Sanitized
    });

    it('should include user information when available', async () => {
      const query = {};
      const requestorId = 'admin-123';

      (prismaService.auditLog.findMany as jest.Mock).mockResolvedValue([mockAuditLog]);
      (prismaService.auditLog.count as jest.Mock).mockResolvedValue(1);
      (prismaService.user.findMany as jest.Mock).mockResolvedValue([mockUser]);

      const result = await service.getAuditTrail(query as any, requestorId);

      expect(result.data[0]).toHaveProperty('user');
      expect(result.data[0].user).toEqual(mockUser);
    });

    it('should handle audit logs without userId', async () => {
      const logWithoutUser = { ...mockAuditLog, userId: null };
      const query = {};
      const requestorId = 'admin-123';

      (prismaService.auditLog.findMany as jest.Mock).mockResolvedValue([logWithoutUser]);
      (prismaService.auditLog.count as jest.Mock).mockResolvedValue(1);
      (prismaService.user.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getAuditTrail(query as any, requestorId);

      expect(result.data[0]).not.toHaveProperty('user');
    });

    it('should throw BadRequestException on error', async () => {
      const query = {};
      const requestorId = 'admin-123';

      (prismaService.auditLog.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(service.getAuditTrail(query as any, requestorId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.getAuditTrail(query as any, requestorId)).rejects.toThrow(
        'Failed to retrieve audit trail',
      );
    });
  });

  describe('sanitize methods', () => {
    it('should sanitize sensitive details', () => {
      const details = {
        username: 'john',
        password: 'secret123',
        token: 'xyz',
        secret: 'abc',
        normalField: 'keep this',
      };

      const sanitized = (service as any).sanitizeDetails(details);

      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.token).toBe('[REDACTED]');
      expect(sanitized.secret).toBe('[REDACTED]');
      expect(sanitized.normalField).toBe('keep this');
      expect(sanitized.username).toBe('john');
    });

    it('should handle non-object details', () => {
      expect((service as any).sanitizeDetails(null)).toBeNull();
      expect((service as any).sanitizeDetails(undefined)).toBeUndefined();
      expect((service as any).sanitizeDetails('string')).toBe('string');
      expect((service as any).sanitizeDetails(123)).toBe(123);
    });

    it('should mask IPv4 address', () => {
      const masked = (service as any).maskIpAddress('192.168.1.100');
      expect(masked).toBe('192.168.1.XXX');
    });

    it('should handle null IP address', () => {
      expect((service as any).maskIpAddress(null)).toBeNull();
    });

    it('should handle non-IPv4 addresses', () => {
      const ipv6 = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
      expect((service as any).maskIpAddress(ipv6)).toBe(ipv6);
    });

    it('should handle invalid IPv4 format', () => {
      const invalid = '192.168.1';
      expect((service as any).maskIpAddress(invalid)).toBe(invalid);
    });

    it('should sanitize user agent - Chrome', () => {
      const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/91.0.4472.124';
      const sanitized = (service as any).sanitizeUserAgent(ua);
      expect(sanitized).toBe('Chrome/91');
    });

    it('should sanitize user agent - Firefox', () => {
      const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Firefox/89.0';
      const sanitized = (service as any).sanitizeUserAgent(ua);
      expect(sanitized).toBe('Firefox/89');
    });

    it('should sanitize user agent - Safari', () => {
      const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/14.1.1';
      const sanitized = (service as any).sanitizeUserAgent(ua);
      expect(sanitized).toBe('Safari/14');
    });

    it('should sanitize user agent - Edge', () => {
      const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Edge/91.0.864.59';
      const sanitized = (service as any).sanitizeUserAgent(ua);
      expect(sanitized).toBe('Edge/91');
    });

    it('should handle null user agent', () => {
      expect((service as any).sanitizeUserAgent(null)).toBeNull();
    });

    it('should handle unknown browser', () => {
      const ua = 'Unknown Browser String';
      const sanitized = (service as any).sanitizeUserAgent(ua);
      expect(sanitized).toBe('Unknown Browser');
    });
  });

  describe('date range calculation', () => {
    it('should use explicit date range when provided', () => {
      const query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };

      const { startDate, endDate } = (service as any).calculateDateRange(query);

      expect(startDate).toEqual(new Date('2024-01-01'));
      expect(endDate).toEqual(new Date('2024-01-31'));
    });

    it('should use days lookback when provided', () => {
      const query = { days: 7 };

      const { startDate, endDate } = (service as any).calculateDateRange(query);

      const expectedStart = new Date();
      expectedStart.setDate(expectedStart.getDate() - 7);

      expect(startDate.getDate()).toBeCloseTo(expectedStart.getDate(), 0);
      expect(endDate.getDate()).toBeCloseTo(new Date().getDate(), 0);
    });

    it('should use days lookback with string value', () => {
      const query = { days: '14' };

      const { startDate, endDate } = (service as any).calculateDateRange(query);

      expect(startDate).toBeInstanceOf(Date);
      expect(endDate).toBeInstanceOf(Date);
    });

    it('should default to 30 days when no date params provided', () => {
      const query = {};

      const { startDate, endDate } = (service as any).calculateDateRange(query);

      const expectedStart = new Date();
      expectedStart.setDate(expectedStart.getDate() - 30);

      expect(startDate.getDate()).toBeCloseTo(expectedStart.getDate(), 0);
      expect(endDate.getDate()).toBeCloseTo(new Date().getDate(), 0);
    });
  });

  describe('getAuditStatistics', () => {
    it('should return comprehensive statistics', async () => {
      const query = { days: 30 };
      const requestorId = 'admin-123';

      (prismaService.auditLog.count as jest.Mock).mockImplementation(({ where }) => {
        if (where?.action?.in) return Promise.resolve(10);
        return Promise.resolve(100);
      });
      (prismaService.auditLog.groupBy as jest.Mock).mockImplementation(({ by, orderBy }) => {
        if (by[0] === 'userId' && !orderBy) return Promise.resolve([{userId: 'user-1'}, {userId: 'user-2'}]);
        if (by[0] === 'userId' && orderBy) return Promise.resolve([{userId: 'user-1', _count: {id: 50}}]);
        if (by[0] === 'action' && !orderBy) return Promise.resolve([{action: 'LOGIN'}, {action: 'LOGOUT'}]);
        if (by[0] === 'action' && orderBy) return Promise.resolve([{action: 'LOGIN', _count: {id: 80}}]);
        if (by[0] === 'resource' && !orderBy) return Promise.resolve([{resource: 'USER'}]);
        if (by[0] === 'resource' && orderBy) return Promise.resolve([{resource: 'USER', _count: {id: 60}}]);
        return Promise.resolve([]);
      });
      (prismaService.user.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getAuditStatistics(query as any, requestorId);

      expect(result.summary).toHaveProperty('totalEvents');
      expect(result.summary).toHaveProperty('uniqueUsers');
      expect(result.summary).toHaveProperty('uniqueActions');
      expect(result.summary).toHaveProperty('uniqueResources');
      expect(result).toHaveProperty('timeline');
      expect(result).toHaveProperty('topActions');
      expect(result).toHaveProperty('topResources');
      expect(result).toHaveProperty('topUsers');
      expect(result).toHaveProperty('securityEvents');
    });

    it('should calculate unique users correctly', async () => {
      const query = {};
      const requestorId = 'admin-123';

      (prismaService.auditLog.count as jest.Mock).mockImplementation(({ where }) => {
        if (where?.action?.in) return Promise.resolve(5);
        return Promise.resolve(50);
      });
      (prismaService.auditLog.groupBy as jest.Mock).mockImplementation(({ by, orderBy }) => {
        if (by[0] === 'userId' && !orderBy) {
          return Promise.resolve([
            { userId: 'user-1' },
            { userId: 'user-2' },
            { userId: 'user-3' },
          ]);
        }
        if (by[0] === 'userId' && orderBy) return Promise.resolve([{userId: 'user-1', _count: {id: 30}}]);
        if (by[0] === 'action' && orderBy) return Promise.resolve([{action: 'LOGIN', _count: {id: 40}}]);
        if (by[0] === 'action' && !orderBy) return Promise.resolve([{action: 'LOGIN'}]);
        if (by[0] === 'resource' && orderBy) return Promise.resolve([{resource: 'USER', _count: {id: 35}}]);
        if (by[0] === 'resource' && !orderBy) return Promise.resolve([{resource: 'USER'}]);
        return Promise.resolve([]);
      });
      (prismaService.user.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getAuditStatistics(query as any, requestorId);

      expect(result.summary.uniqueUsers).toBe(3);
    });

    it('should calculate top actions with percentages', async () => {
      const query = {};
      const requestorId = 'admin-123';

      (prismaService.auditLog.count as jest.Mock).mockResolvedValue(100);
      (prismaService.auditLog.groupBy as jest.Mock).mockImplementation(({ by, orderBy }) => {
        if (by[0] === 'action' && orderBy) {
          return Promise.resolve([
            { action: 'USER_LOGIN', _count: { id: 50 } },
            { action: 'USER_LOGOUT', _count: { id: 30 } },
          ]);
        }
        if (by[0] === 'userId') return Promise.resolve([]);
        if (by[0] === 'resource') return Promise.resolve([]);
        return Promise.resolve([]);
      });
      (prismaService.user.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getAuditStatistics(query as any, requestorId);

      expect(result.topActions).toHaveLength(2);
      expect(result.topActions[0].action).toBe('USER_LOGIN');
      expect(result.topActions[0].count).toBe(50);
      expect(result.topActions[0].percentage).toBe(50);
    });

    it('should calculate top resources with percentages', async () => {
      const query = {};
      const requestorId = 'admin-123';

      (prismaService.auditLog.count as jest.Mock).mockResolvedValue(100);
      (prismaService.auditLog.groupBy as jest.Mock).mockImplementation(({ by, orderBy }) => {
        if (by[0] === 'resource' && orderBy) {
          return Promise.resolve([
            { resource: 'USER', _count: { id: 60 } },
            { resource: 'ROLE', _count: { id: 40 } },
          ]);
        }
        if (by[0] === 'action') return Promise.resolve([]);
        if (by[0] === 'userId') return Promise.resolve([]);
        return Promise.resolve([]);
      });
      (prismaService.user.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getAuditStatistics(query as any, requestorId);

      expect(result.topResources).toHaveLength(2);
      expect(result.topResources[0].resource).toBe('USER');
      expect(result.topResources[0].percentage).toBe(60);
    });

    it('should calculate top users with email lookup', async () => {
      const query = {};
      const requestorId = 'admin-123';

      (prismaService.auditLog.count as jest.Mock).mockResolvedValue(100);
      (prismaService.auditLog.groupBy as jest.Mock).mockImplementation(({ by, orderBy }) => {
        if (by[0] === 'userId' && orderBy) {
          return Promise.resolve([
            { userId: 'user-1', _count: { id: 70 } },
            { userId: 'user-2', _count: { id: 30 } },
          ]);
        }
        if (by[0] === 'action') return Promise.resolve([]);
        if (by[0] === 'resource') return Promise.resolve([]);
        return Promise.resolve([{ userId: 'user-1' }, { userId: 'user-2' }]);
      });
      (prismaService.user.findMany as jest.Mock).mockResolvedValue([
        { id: 'user-1', email: 'user1@example.com' },
        { id: 'user-2', email: 'user2@example.com' },
      ]);

      const result = await service.getAuditStatistics(query as any, requestorId);

      expect(result.topUsers).toHaveLength(2);
      expect(result.topUsers[0].userId).toBe('user-1');
      expect(result.topUsers[0].userEmail).toBe('user1@example.com');
      expect(result.topUsers[0].percentage).toBe(70);
    });

    it('should calculate security events counts', async () => {
      const query = {};
      const requestorId = 'admin-123';

      let callCount = 0;
      (prismaService.auditLog.count as jest.Mock).mockImplementation(({ where }) => {
        callCount++;
        if (where.action?.in?.includes('LOGIN_FAILED')) return Promise.resolve(5);
        if (where.action?.in?.includes('PASSWORD_RESET')) return Promise.resolve(3);
        if (where.action?.in?.includes('SUSPICIOUS_ACTIVITY')) return Promise.resolve(2);
        if (where.action?.in?.includes('ACCOUNT_LOCKED')) return Promise.resolve(1);
        return Promise.resolve(100);
      });
      (prismaService.auditLog.groupBy as jest.Mock).mockResolvedValue([]);
      (prismaService.user.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getAuditStatistics(query as any, requestorId);

      expect(result.securityEvents).toEqual({
        failedLogins: 5,
        passwordResets: 3,
        suspiciousActivity: 2,
        accountLockouts: 1,
      });
    });

    it('should throw BadRequestException on error', async () => {
      const query = {};
      const requestorId = 'admin-123';

      (prismaService.auditLog.count as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(service.getAuditStatistics(query as any, requestorId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('exportAuditTrail', () => {
    it('should export audit trail with default format', async () => {
      const query = { format: 'csv' };
      const requestorId = 'admin-123';

      (prismaService.auditLog.findMany as jest.Mock).mockResolvedValue([mockAuditLog]);
      (prismaService.user.findMany as jest.Mock).mockResolvedValue([mockUser]);

      const result = await service.exportAuditTrail(query as any, requestorId);

      expect(result).toHaveProperty('downloadUrl');
      expect(result).toHaveProperty('fileName');
      expect(result).toHaveProperty('format');
      expect(result).toHaveProperty('recordCount');
      expect(result).toHaveProperty('fileSize');
      expect(result).toHaveProperty('expiresAt');
      expect(result.format).toBe('csv');
      expect(result.recordCount).toBe(1);
    });

    it('should limit export to 10000 records', async () => {
      const query = { format: 'json' };
      const requestorId = 'admin-123';

      (prismaService.auditLog.findMany as jest.Mock).mockResolvedValue([mockAuditLog]);
      (prismaService.user.findMany as jest.Mock).mockResolvedValue([mockUser]);

      await service.exportAuditTrail(query as any, requestorId);

      expect(prismaService.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10000,
        }),
      );
    });

    it('should filter export fields when specified', async () => {
      const query = {
        format: 'csv',
        fields: ['id', 'action', 'createdAt'],
      };
      const requestorId = 'admin-123';

      (prismaService.auditLog.findMany as jest.Mock).mockResolvedValue([mockAuditLog]);
      (prismaService.user.findMany as jest.Mock).mockResolvedValue([mockUser]);

      const result = await service.exportAuditTrail(query as any, requestorId);

      expect(result.recordCount).toBe(1);
    });

    it('should include sensitive data when requested', async () => {
      const query = {
        format: 'csv',
        includeSensitive: true,
      };
      const requestorId = 'admin-123';

      (prismaService.auditLog.findMany as jest.Mock).mockResolvedValue([mockAuditLog]);
      (prismaService.user.findMany as jest.Mock).mockResolvedValue([mockUser]);

      const result = await service.exportAuditTrail(query as any, requestorId);

      expect(result).toBeDefined();
    });

    it('should throw BadRequestException on error', async () => {
      const query = { format: 'csv' };
      const requestorId = 'admin-123';

      (prismaService.auditLog.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(service.exportAuditTrail(query as any, requestorId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('filterExportFields', () => {
    it('should filter specified fields from data', () => {
      const data = [
        { id: '1', name: 'Test', email: 'test@example.com', password: 'secret' },
        { id: '2', name: 'Test2', email: 'test2@example.com', password: 'secret2' },
      ];
      const fields = ['id', 'name', 'email'];

      const filtered = (service as any).filterExportFields(data, fields);

      expect(filtered).toHaveLength(2);
      expect(filtered[0]).toEqual({ id: '1', name: 'Test', email: 'test@example.com' });
      expect(filtered[0]).not.toHaveProperty('password');
      expect(filtered[1]).not.toHaveProperty('password');
    });

    it('should handle empty fields array', () => {
      const data = [{ id: '1', name: 'Test' }];
      const fields: string[] = [];

      const filtered = (service as any).filterExportFields(data, fields);

      expect(filtered).toHaveLength(1);
      expect(filtered[0]).toEqual({});
    });

    it('should handle non-existent fields', () => {
      const data = [{ id: '1', name: 'Test' }];
      const fields = ['nonexistent'];

      const filtered = (service as any).filterExportFields(data, fields);

      expect(filtered).toHaveLength(1);
      expect(filtered[0]).toEqual({});
    });
  });

  describe('buildFiltersSummary', () => {
    it('should build filters summary with all filters', () => {
      const query = {
        userId: 'user-123',
        action: 'LOGIN',
        resource: 'USER',
        ipAddress: '192.168.1.1',
        search: 'test',
        days: 30,
      };

      const summary = (service as any).buildFiltersSummary(query);

      expect(summary).toHaveProperty('dateRange');
      expect(summary).toHaveProperty('totalDays');
      expect(summary.filters).toEqual({
        userId: 'user-123',
        action: 'LOGIN',
        resource: 'USER',
        ipAddress: '192.168.1.1',
        search: 'test',
      });
    });

    it('should build summary with no filters', () => {
      const query = {};

      const summary = (service as any).buildFiltersSummary(query);

      expect(summary).toHaveProperty('dateRange');
      expect(summary).toHaveProperty('totalDays');
      expect(summary.filters).toEqual({});
    });
  });

  describe('generateExportFile', () => {
    it('should generate export file metadata', async () => {
      const data = [mockAuditLog];
      const format = 'csv';
      const requestorId = 'admin-123';

      const result = await (service as any).generateExportFile(data, format, requestorId);

      expect(result.downloadUrl).toContain('audit-trail');
      expect(result.fileName).toContain('audit-trail');
      expect(result.fileName).toContain('.csv');
      expect(result.format).toBe('csv');
      expect(result.recordCount).toBe(1);
      expect(result.fileSize).toBeGreaterThan(0);
      expect(result.expiresAt).toBeDefined();
    });

    it('should generate correct file name with date', async () => {
      const data = [mockAuditLog];
      const format = 'json';
      const requestorId = 'admin-123';

      const result = await (service as any).generateExportFile(data, format, requestorId);

      const today = new Date().toISOString().split('T')[0];
      expect(result.fileName).toContain(today);
    });
  });
});