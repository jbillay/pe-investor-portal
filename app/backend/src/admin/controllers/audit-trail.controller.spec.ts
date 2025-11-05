import { Test, TestingModule } from '@nestjs/testing';
import { AuditTrailController } from './audit-trail.controller';
import { AuditTrailService } from '../services/audit-trail.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { AuthenticatedUser } from '../../auth/interfaces/auth.interface';
import {
  QueryAuditTrailDto,
  AuditStatsQueryDto,
  ExportAuditTrailDto,
} from '../dto/audit-trail.dto';

describe('AuditTrailController', () => {
  let controller: AuditTrailController;
  let auditTrailService: jest.Mocked<AuditTrailService>;

  const mockAuthenticatedUser: AuthenticatedUser = {
    id: 'super-admin-123',
    email: 'superadmin@example.com',
    roles: ['SUPER_ADMIN'],
    permissions: ['AUDIT:READ', 'AUDIT:EXPORT'],
  };

  const mockRequest = {
    user: mockAuthenticatedUser,
  } as any;

  const mockAuditTrailService = {
    getAuditTrail: jest.fn(),
    getAuditStatistics: jest.fn(),
    exportAuditTrail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditTrailController],
      providers: [
        {
          provide: AuditTrailService,
          useValue: mockAuditTrailService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<AuditTrailController>(AuditTrailController);
    auditTrailService = module.get(AuditTrailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAuditTrail', () => {
    it('should return paginated audit trail logs', async () => {
      // Arrange
      const query: QueryAuditTrailDto = {
        page: 1,
        limit: 50,
      };

      const mockResult = {
        data: [
          {
            id: 'audit-log-1',
            userId: 'user-123',
            action: 'USER_CREATED',
            resource: 'USER',
            details: {
              targetUserId: 'new-user-456',
              changes: { email: 'newuser@example.com' },
            },
            ipAddress: '192.168.1.1',
            userAgent: 'Chrome/120',
            createdAt: new Date().toISOString(),
            user: {
              id: 'user-123',
              email: 'admin@example.com',
              firstName: 'John',
              lastName: 'Admin',
            },
          },
        ],
        pagination: {
          page: 1,
          limit: 50,
          total: 15000,
          totalPages: 300,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      };

      auditTrailService.getAuditTrail.mockResolvedValue(mockResult as any);

      // Act
      const result = await controller.getAuditTrail(query, mockRequest);

      // Assert
      expect(result).toEqual(mockResult);
      expect(auditTrailService.getAuditTrail).toHaveBeenCalledWith(
        query,
        mockAuthenticatedUser.id
      );
      expect(auditTrailService.getAuditTrail).toHaveBeenCalledTimes(1);
    });

    it('should handle filtering by user ID', async () => {
      // Arrange
      const query: QueryAuditTrailDto = {
        userId: 'specific-user-123',
        page: 1,
        limit: 20,
      };

      const mockResult = {
        data: [
          {
            id: 'audit-log-2',
            userId: 'specific-user-123',
            action: 'LOGIN',
            resource: 'AUTH',
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 100,
          totalPages: 5,
        },
      };

      auditTrailService.getAuditTrail.mockResolvedValue(mockResult as any);

      // Act
      const result = await controller.getAuditTrail(query, mockRequest);

      // Assert
      expect(result).toEqual(mockResult);
      expect(auditTrailService.getAuditTrail).toHaveBeenCalledWith(
        query,
        mockAuthenticatedUser.id
      );
    });

    it('should handle filtering by action type', async () => {
      // Arrange
      const query: QueryAuditTrailDto = {
        action: 'PASSWORD_RESET',
        page: 1,
        limit: 50,
      };

      auditTrailService.getAuditTrail.mockResolvedValue({
        data: [],
        pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
      } as any);

      // Act
      await controller.getAuditTrail(query, mockRequest);

      // Assert
      expect(auditTrailService.getAuditTrail).toHaveBeenCalledWith(
        query,
        mockAuthenticatedUser.id
      );
    });

    it('should handle filtering by resource type', async () => {
      // Arrange
      const query: QueryAuditTrailDto = {
        resource: 'USER',
        page: 1,
        limit: 50,
      };

      auditTrailService.getAuditTrail.mockResolvedValue({
        data: [],
        pagination: {},
      } as any);

      // Act
      await controller.getAuditTrail(query, mockRequest);

      // Assert
      expect(auditTrailService.getAuditTrail).toHaveBeenCalledWith(
        query,
        mockAuthenticatedUser.id
      );
    });

    it('should handle filtering by IP address', async () => {
      // Arrange
      const query: QueryAuditTrailDto = {
        ipAddress: '192.168.1.100',
        page: 1,
        limit: 50,
      };

      auditTrailService.getAuditTrail.mockResolvedValue({
        data: [],
        pagination: {},
      } as any);

      // Act
      await controller.getAuditTrail(query, mockRequest);

      // Assert
      expect(auditTrailService.getAuditTrail).toHaveBeenCalledWith(
        query,
        mockAuthenticatedUser.id
      );
    });

    it('should handle date range filtering', async () => {
      // Arrange
      const query: QueryAuditTrailDto = {
        startDate: new Date('2025-01-01').toISOString(),
        endDate: new Date('2025-01-31').toISOString(),
        page: 1,
        limit: 50,
      };

      auditTrailService.getAuditTrail.mockResolvedValue({
        data: [],
        pagination: {},
      } as any);

      // Act
      await controller.getAuditTrail(query, mockRequest);

      // Assert
      expect(auditTrailService.getAuditTrail).toHaveBeenCalledWith(
        query,
        mockAuthenticatedUser.id
      );
    });

    it('should handle days lookback filtering', async () => {
      // Arrange
      const query: QueryAuditTrailDto = {
        days: 30,
        page: 1,
        limit: 50,
      };

      auditTrailService.getAuditTrail.mockResolvedValue({
        data: [],
        pagination: {},
      } as any);

      // Act
      await controller.getAuditTrail(query, mockRequest);

      // Assert
      expect(auditTrailService.getAuditTrail).toHaveBeenCalledWith(
        query,
        mockAuthenticatedUser.id
      );
    });

    it('should handle full-text search', async () => {
      // Arrange
      const query: QueryAuditTrailDto = {
        search: 'password reset',
        page: 1,
        limit: 50,
      };

      auditTrailService.getAuditTrail.mockResolvedValue({
        data: [],
        pagination: {},
      } as any);

      // Act
      await controller.getAuditTrail(query, mockRequest);

      // Assert
      expect(auditTrailService.getAuditTrail).toHaveBeenCalledWith(
        query,
        mockAuthenticatedUser.id
      );
    });

    it('should handle sorting options', async () => {
      // Arrange
      const query: QueryAuditTrailDto = {
        sortBy: 'createdAt',
        sortOrder: 'desc',
        page: 1,
        limit: 50,
      };

      auditTrailService.getAuditTrail.mockResolvedValue({
        data: [],
        pagination: {},
      } as any);

      // Act
      await controller.getAuditTrail(query, mockRequest);

      // Assert
      expect(auditTrailService.getAuditTrail).toHaveBeenCalledWith(
        query,
        mockAuthenticatedUser.id
      );
    });

    it('should handle including sensitive data', async () => {
      // Arrange
      const query: QueryAuditTrailDto = {
        includeSensitive: true,
        page: 1,
        limit: 50,
      };

      auditTrailService.getAuditTrail.mockResolvedValue({
        data: [],
        pagination: {},
      } as any);

      // Act
      await controller.getAuditTrail(query, mockRequest);

      // Assert
      expect(auditTrailService.getAuditTrail).toHaveBeenCalledWith(
        query,
        mockAuthenticatedUser.id
      );
    });

    it('should handle multiple filter combinations', async () => {
      // Arrange
      const query: QueryAuditTrailDto = {
        userId: 'user-123',
        action: 'USER_UPDATED',
        resource: 'USER',
        startDate: new Date('2025-01-01').toISOString(),
        endDate: new Date('2025-01-31').toISOString(),
        page: 2,
        limit: 100,
        sortBy: 'action',
        sortOrder: 'asc',
      };

      auditTrailService.getAuditTrail.mockResolvedValue({
        data: [],
        pagination: {},
      } as any);

      // Act
      await controller.getAuditTrail(query, mockRequest);

      // Assert
      expect(auditTrailService.getAuditTrail).toHaveBeenCalledWith(
        query,
        mockAuthenticatedUser.id
      );
    });

    it('should handle empty query parameters', async () => {
      // Arrange
      const query: QueryAuditTrailDto = {};

      auditTrailService.getAuditTrail.mockResolvedValue({
        data: [],
        pagination: {},
      } as any);

      // Act
      await controller.getAuditTrail(query, mockRequest);

      // Assert
      expect(auditTrailService.getAuditTrail).toHaveBeenCalledWith(
        query,
        mockAuthenticatedUser.id
      );
    });

    it('should handle service errors', async () => {
      // Arrange
      const query: QueryAuditTrailDto = {
        page: 1,
        limit: 50,
      };

      auditTrailService.getAuditTrail.mockRejectedValue(
        new Error('Database connection error')
      );

      // Act & Assert
      await expect(controller.getAuditTrail(query, mockRequest)).rejects.toThrow(
        'Database connection error'
      );
    });
  });

  describe('getAuditStatistics', () => {
    it('should return comprehensive audit statistics', async () => {
      // Arrange
      const query: AuditStatsQueryDto = {
        period: '30d',
        groupBy: 'day',
      };

      const mockStats = {
        summary: {
          totalEvents: 150000,
          uniqueUsers: 2500,
          uniqueActions: 45,
          uniqueResources: 8,
          timeRange: '2025-01-01T00:00:00.000Z to 2025-01-31T23:59:59.999Z',
        },
        timeline: [
          {
            period: '2025-01-01',
            count: 1500,
            uniqueUsers: 250,
          },
          {
            period: '2025-01-02',
            count: 1800,
            uniqueUsers: 300,
          },
        ],
        topActions: [
          {
            action: 'LOGIN',
            count: 50000,
            percentage: 33.3,
          },
          {
            action: 'USER_READ',
            count: 30000,
            percentage: 20.0,
          },
        ],
        topResources: [
          {
            resource: 'USER',
            count: 80000,
            percentage: 53.3,
          },
          {
            resource: 'AUTH',
            count: 50000,
            percentage: 33.3,
          },
        ],
        topUsers: [
          {
            userId: 'admin-123',
            userEmail: 'admin@example.com',
            count: 5000,
            percentage: 3.3,
          },
        ],
        securityEvents: {
          failedLogins: 450,
          passwordResets: 120,
          suspiciousActivity: 30,
          accountLockouts: 20,
        },
      };

      auditTrailService.getAuditStatistics.mockResolvedValue(mockStats as any);

      // Act
      const result = await controller.getAuditStatistics(query, mockRequest);

      // Assert
      expect(result).toEqual(mockStats);
      expect(auditTrailService.getAuditStatistics).toHaveBeenCalledWith(
        query,
        mockAuthenticatedUser.id
      );
      expect(auditTrailService.getAuditStatistics).toHaveBeenCalledTimes(1);
    });

    it('should handle statistics for last 7 days', async () => {
      // Arrange
      const query: AuditStatsQueryDto = {
        period: '7d',
        groupBy: 'day',
      };

      auditTrailService.getAuditStatistics.mockResolvedValue({
        summary: { totalEvents: 10000 },
      } as any);

      // Act
      await controller.getAuditStatistics(query, mockRequest);

      // Assert
      expect(auditTrailService.getAuditStatistics).toHaveBeenCalledWith(
        query,
        mockAuthenticatedUser.id
      );
    });

    it('should handle statistics with hourly grouping', async () => {
      // Arrange
      const query: AuditStatsQueryDto = {
        period: '1d',
        groupBy: 'hour',
      };

      auditTrailService.getAuditStatistics.mockResolvedValue({
        summary: { totalEvents: 5000 },
        timeline: [],
      } as any);

      // Act
      await controller.getAuditStatistics(query, mockRequest);

      // Assert
      expect(auditTrailService.getAuditStatistics).toHaveBeenCalledWith(
        query,
        mockAuthenticatedUser.id
      );
    });

    it('should handle statistics with weekly grouping', async () => {
      // Arrange
      const query: AuditStatsQueryDto = {
        period: '90d',
        groupBy: 'week',
      };

      auditTrailService.getAuditStatistics.mockResolvedValue({
        summary: { totalEvents: 50000 },
      } as any);

      // Act
      await controller.getAuditStatistics(query, mockRequest);

      // Assert
      expect(auditTrailService.getAuditStatistics).toHaveBeenCalledWith(
        query,
        mockAuthenticatedUser.id
      );
    });

    it('should handle statistics with monthly grouping', async () => {
      // Arrange
      const query: AuditStatsQueryDto = {
        period: '365d',
        groupBy: 'month',
      };

      auditTrailService.getAuditStatistics.mockResolvedValue({
        summary: { totalEvents: 200000 },
      } as any);

      // Act
      await controller.getAuditStatistics(query, mockRequest);

      // Assert
      expect(auditTrailService.getAuditStatistics).toHaveBeenCalledWith(
        query,
        mockAuthenticatedUser.id
      );
    });

    it('should handle custom date range for statistics', async () => {
      // Arrange
      const query: AuditStatsQueryDto = {
        startDate: new Date('2025-01-01').toISOString(),
        endDate: new Date('2025-01-31').toISOString(),
        groupBy: 'day',
      };

      auditTrailService.getAuditStatistics.mockResolvedValue({
        summary: { totalEvents: 30000 },
      } as any);

      // Act
      await controller.getAuditStatistics(query, mockRequest);

      // Assert
      expect(auditTrailService.getAuditStatistics).toHaveBeenCalledWith(
        query,
        mockAuthenticatedUser.id
      );
    });

    it('should handle statistics query without grouping', async () => {
      // Arrange
      const query: AuditStatsQueryDto = {
        period: '30d',
      };

      auditTrailService.getAuditStatistics.mockResolvedValue({
        summary: { totalEvents: 25000 },
      } as any);

      // Act
      await controller.getAuditStatistics(query, mockRequest);

      // Assert
      expect(auditTrailService.getAuditStatistics).toHaveBeenCalledWith(
        query,
        mockAuthenticatedUser.id
      );
    });

    it('should handle empty query parameters for statistics', async () => {
      // Arrange
      const query: AuditStatsQueryDto = {};

      auditTrailService.getAuditStatistics.mockResolvedValue({
        summary: { totalEvents: 0 },
      } as any);

      // Act
      await controller.getAuditStatistics(query, mockRequest);

      // Assert
      expect(auditTrailService.getAuditStatistics).toHaveBeenCalledWith(
        query,
        mockAuthenticatedUser.id
      );
    });

    it('should handle statistics service errors', async () => {
      // Arrange
      const query: AuditStatsQueryDto = {
        period: '30d',
      };

      auditTrailService.getAuditStatistics.mockRejectedValue(
        new Error('Statistics calculation failed')
      );

      // Act & Assert
      await expect(controller.getAuditStatistics(query, mockRequest)).rejects.toThrow(
        'Statistics calculation failed'
      );
    });
  });

  describe('exportAuditTrail', () => {
    it('should export audit trail in CSV format', async () => {
      // Arrange
      const exportDto: ExportAuditTrailDto = {
        format: 'csv',
        fields: ['id', 'userId', 'action', 'resource', 'createdAt'],
        startDate: new Date('2025-01-01').toISOString(),
        endDate: new Date('2025-01-31').toISOString(),
      };

      const mockExportResult = {
        downloadUrl:
          'https://secure-cdn.example.com/exports/audit-trail-2025-01-15-abc123.csv',
        fileName: 'audit-trail-2025-01-15-abc123.csv',
        format: 'csv',
        recordCount: 8500,
        fileSize: 2048000,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      auditTrailService.exportAuditTrail.mockResolvedValue(mockExportResult as any);

      // Act
      const result = await controller.exportAuditTrail(exportDto, mockRequest);

      // Assert
      expect(result).toEqual(mockExportResult);
      expect(auditTrailService.exportAuditTrail).toHaveBeenCalledWith(
        exportDto,
        mockAuthenticatedUser.id
      );
      expect(auditTrailService.exportAuditTrail).toHaveBeenCalledTimes(1);
    });

    it('should export audit trail in Excel format', async () => {
      // Arrange
      const exportDto: ExportAuditTrailDto = {
        format: 'xlsx',
        fields: ['id', 'userId', 'action', 'resource', 'details', 'createdAt'],
      };

      auditTrailService.exportAuditTrail.mockResolvedValue({
        downloadUrl: 'https://example.com/exports/audit-trail.xlsx',
        fileName: 'audit-trail.xlsx',
        format: 'xlsx',
        recordCount: 5000,
      } as any);

      // Act
      await controller.exportAuditTrail(exportDto, mockRequest);

      // Assert
      expect(auditTrailService.exportAuditTrail).toHaveBeenCalledWith(
        exportDto,
        mockAuthenticatedUser.id
      );
    });

    it('should export audit trail in JSON format', async () => {
      // Arrange
      const exportDto: ExportAuditTrailDto = {
        format: 'json',
        fields: ['id', 'userId', 'action', 'resource', 'details', 'ipAddress', 'createdAt'],
      };

      auditTrailService.exportAuditTrail.mockResolvedValue({
        downloadUrl: 'https://example.com/exports/audit-trail.json',
        fileName: 'audit-trail.json',
        format: 'json',
        recordCount: 3000,
      } as any);

      // Act
      await controller.exportAuditTrail(exportDto, mockRequest);

      // Assert
      expect(auditTrailService.exportAuditTrail).toHaveBeenCalledWith(
        exportDto,
        mockAuthenticatedUser.id
      );
    });

    it('should export all fields when not specified', async () => {
      // Arrange
      const exportDto: ExportAuditTrailDto = {
        format: 'csv',
      };

      auditTrailService.exportAuditTrail.mockResolvedValue({
        downloadUrl: 'https://example.com/exports/audit-trail-all.csv',
        fileName: 'audit-trail-all.csv',
        format: 'csv',
        recordCount: 10000,
      } as any);

      // Act
      await controller.exportAuditTrail(exportDto, mockRequest);

      // Assert
      expect(auditTrailService.exportAuditTrail).toHaveBeenCalledWith(
        exportDto,
        mockAuthenticatedUser.id
      );
    });

    it('should export with custom filters', async () => {
      // Arrange
      const exportDto: ExportAuditTrailDto = {
        format: 'csv',
        fields: ['id', 'action', 'createdAt'],
        userId: 'user-123',
        action: 'PASSWORD_RESET',
        resource: 'USER',
      };

      auditTrailService.exportAuditTrail.mockResolvedValue({
        downloadUrl: 'https://example.com/exports/filtered-audit.csv',
        recordCount: 150,
      } as any);

      // Act
      await controller.exportAuditTrail(exportDto, mockRequest);

      // Assert
      expect(auditTrailService.exportAuditTrail).toHaveBeenCalledWith(
        exportDto,
        mockAuthenticatedUser.id
      );
    });

    it('should include sensitive data when requested', async () => {
      // Arrange
      const exportDto: ExportAuditTrailDto = {
        format: 'json',
        fields: ['id', 'userId', 'action', 'details'],
        includeSensitive: true,
      };

      auditTrailService.exportAuditTrail.mockResolvedValue({
        downloadUrl: 'https://example.com/exports/sensitive-audit.json',
        recordCount: 500,
      } as any);

      // Act
      await controller.exportAuditTrail(exportDto, mockRequest);

      // Assert
      expect(auditTrailService.exportAuditTrail).toHaveBeenCalledWith(
        exportDto,
        mockAuthenticatedUser.id
      );
    });

    it('should handle export with date range', async () => {
      // Arrange
      const exportDto: ExportAuditTrailDto = {
        format: 'xlsx',
        startDate: new Date('2025-01-01').toISOString(),
        endDate: new Date('2025-01-15').toISOString(),
      };

      auditTrailService.exportAuditTrail.mockResolvedValue({
        downloadUrl: 'https://example.com/exports/january-audit.xlsx',
        recordCount: 7500,
      } as any);

      // Act
      await controller.exportAuditTrail(exportDto, mockRequest);

      // Assert
      expect(auditTrailService.exportAuditTrail).toHaveBeenCalledWith(
        exportDto,
        mockAuthenticatedUser.id
      );
    });

    it('should handle export error for exceeding record limit', async () => {
      // Arrange
      const exportDto: ExportAuditTrailDto = {
        format: 'csv',
      };

      auditTrailService.exportAuditTrail.mockRejectedValue(
        new Error('Export request exceeds maximum record limit of 10,000')
      );

      // Act & Assert
      await expect(controller.exportAuditTrail(exportDto, mockRequest)).rejects.toThrow(
        'Export request exceeds maximum record limit of 10,000'
      );
    });

    it('should handle export error for invalid format', async () => {
      // Arrange
      const exportDto: ExportAuditTrailDto = {
        format: 'invalid' as any,
      };

      auditTrailService.exportAuditTrail.mockRejectedValue(
        new Error('Invalid export format')
      );

      // Act & Assert
      await expect(controller.exportAuditTrail(exportDto, mockRequest)).rejects.toThrow(
        'Invalid export format'
      );
    });

    it('should handle export service errors', async () => {
      // Arrange
      const exportDto: ExportAuditTrailDto = {
        format: 'csv',
      };

      auditTrailService.exportAuditTrail.mockRejectedValue(
        new Error('Export generation failed')
      );

      // Act & Assert
      await expect(controller.exportAuditTrail(exportDto, mockRequest)).rejects.toThrow(
        'Export generation failed'
      );
    });
  });

  describe('controller initialization', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should have auditTrailService injected', () => {
      expect(controller['auditTrailService']).toBeDefined();
    });

    it('should have logger initialized', () => {
      expect(controller['logger']).toBeDefined();
    });
  });
});
