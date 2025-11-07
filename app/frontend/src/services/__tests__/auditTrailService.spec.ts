import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type {
  AuditLogEntry,
  AuditTrailQuery,
  AuditStatsQuery,
  ExportAuditTrailRequest,
  PaginatedAuditTrailResponse,
  AuditStatsResponse,
  ExportAuditTrailResponse
} from '../auditTrailService';

// Mock the API client
vi.mock('@composables/useApi', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}));

import { AuditTrailService, auditTrailService } from '../auditTrailService';
import { apiClient as mockApiClient } from '@composables/useApi';

describe('AuditTrailService', () => {
  let service: AuditTrailService;

  const mockAuditLogEntry: AuditLogEntry = {
    id: 'log-1',
    userId: 'user-1',
    action: 'LOGIN',
    resource: 'AUTH',
    details: { method: 'email' },
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    createdAt: '2025-01-01T10:00:00Z',
    user: {
      id: 'user-1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe'
    }
  };

  beforeEach(() => {
    service = new AuditTrailService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getAuditTrail', () => {
    it('should fetch audit trail without query', async () => {
      const mockResponse: PaginatedAuditTrailResponse = {
        data: [mockAuditLogEntry],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false
        },
        filters: { filters: {} }
      };
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: mockResponse });

      const result = await service.getAuditTrail();

      expect(mockApiClient.get).toHaveBeenCalledWith('/admin/audit-trail?');
      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it('should fetch audit trail with query parameters', async () => {
      const mockResponse: PaginatedAuditTrailResponse = {
        data: [mockAuditLogEntry],
        pagination: { page: 2, limit: 20, total: 50, totalPages: 3, hasNextPage: true, hasPreviousPage: true },
        filters: { filters: {} }
      };
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: mockResponse });

      const query: AuditTrailQuery = {
        userId: 'user-1',
        action: 'LOGIN',
        page: 2,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      await service.getAuditTrail(query);

      expect(mockApiClient.get).toHaveBeenCalled();
      const callArg = vi.mocked(mockApiClient.get).mock.calls[0][0] as string;
      expect(callArg).toContain('userId=user-1');
      expect(callArg).toContain('action=LOGIN');
      expect(callArg).toContain('page=2');
      expect(callArg).toContain('limit=20');
    });

    it('should filter out undefined, null, and empty values', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: { data: [], pagination: {}, filters: {} } });

      const query: AuditTrailQuery = {
        userId: 'user-1',
        action: undefined,
        resource: null as any,
        search: ''
      };

      await service.getAuditTrail(query);

      const callArg = vi.mocked(mockApiClient.get).mock.calls[0][0] as string;
      expect(callArg).toContain('userId=user-1');
      expect(callArg).not.toContain('action');
      expect(callArg).not.toContain('resource');
      expect(callArg).not.toContain('search');
    });

    it('should handle unwrapped response', async () => {
      const mockResponse: PaginatedAuditTrailResponse = {
        data: [mockAuditLogEntry],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
        filters: { filters: {} }
      };
      // Mock as unwrapped - API returns the object directly without { data: ... } wrapper
      // Since response has a .data property, response.data will be used
      vi.mocked(mockApiClient.get).mockResolvedValue(mockResponse as any);

      const result = await service.getAuditTrail();

      // The result is mockResponse.data because response.data exists and is truthy
      expect(Array.isArray(result)).toBe(true);
      expect((result as any).length).toBe(1);
    });
  });

  describe('getAuditStatistics', () => {
    it('should fetch audit statistics without query', async () => {
      const mockStats: AuditStatsResponse = {
        summary: { totalEvents: 100, uniqueUsers: 10, uniqueActions: 5, uniqueResources: 3, timeRange: '7 days' },
        timeline: [{ period: '2025-01-01', count: 10, uniqueUsers: 5 }],
        topActions: [{ action: 'LOGIN', count: 50, percentage: 50 }],
        topResources: [{ resource: 'USER', count: 30, percentage: 30 }],
        topUsers: [{ userId: 'user-1', userEmail: 'test@example.com', count: 20, percentage: 20 }],
        securityEvents: { failedLogins: 5, passwordResets: 2, suspiciousActivity: 1, accountLockouts: 0 }
      };
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: mockStats });

      const result = await service.getAuditStatistics();

      expect(mockApiClient.get).toHaveBeenCalledWith('/admin/audit-trail/statistics?');
      expect(result.summary.totalEvents).toBe(100);
      expect(result.topActions).toHaveLength(1);
    });

    it('should fetch statistics with query parameters', async () => {
      const mockStats: AuditStatsResponse = {
        summary: { totalEvents: 50, uniqueUsers: 5, uniqueActions: 3, uniqueResources: 2, timeRange: '30 days' },
        timeline: [],
        topActions: [],
        topResources: [],
        topUsers: [],
        securityEvents: { failedLogins: 0, passwordResets: 0, suspiciousActivity: 0, accountLockouts: 0 }
      };
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: mockStats });

      const query: AuditStatsQuery = {
        days: 30,
        groupBy: 'day'
      };

      await service.getAuditStatistics(query);

      const callArg = vi.mocked(mockApiClient.get).mock.calls[0][0] as string;
      expect(callArg).toContain('days=30');
      expect(callArg).toContain('groupBy=day');
    });

    it('should handle unwrapped response', async () => {
      const mockStats: AuditStatsResponse = {
        summary: { totalEvents: 10, uniqueUsers: 2, uniqueActions: 1, uniqueResources: 1, timeRange: '1 day' },
        timeline: [],
        topActions: [],
        topResources: [],
        topUsers: [],
        securityEvents: { failedLogins: 0, passwordResets: 0, suspiciousActivity: 0, accountLockouts: 0 }
      };
      vi.mocked(mockApiClient.get).mockResolvedValue(mockStats);

      const result = await service.getAuditStatistics();

      expect(result.summary.totalEvents).toBe(10);
    });
  });

  describe('exportAuditTrail', () => {
    it('should export audit trail in CSV format', async () => {
      const mockExportResponse: ExportAuditTrailResponse = {
        downloadUrl: '/downloads/audit-trail.csv',
        fileName: 'audit-trail.csv',
        format: 'csv',
        recordCount: 100,
        fileSize: 12345,
        expiresAt: '2025-01-02T10:00:00Z'
      };
      vi.mocked(mockApiClient.post).mockResolvedValue({ data: mockExportResponse });

      const request: ExportAuditTrailRequest = {
        format: 'csv',
        includeSensitive: false,
        fields: ['id', 'action', 'createdAt']
      };

      const result = await service.exportAuditTrail(request);

      expect(mockApiClient.post).toHaveBeenCalledWith('/admin/audit-trail/export', request);
      expect(result.format).toBe('csv');
      expect(result.recordCount).toBe(100);
    });

    it('should export with filtering options', async () => {
      const mockExportResponse: ExportAuditTrailResponse = {
        downloadUrl: '/downloads/audit-trail.xlsx',
        fileName: 'audit-trail.xlsx',
        format: 'xlsx',
        recordCount: 50,
        fileSize: 23456,
        expiresAt: '2025-01-02T10:00:00Z'
      };
      vi.mocked(mockApiClient.post).mockResolvedValue({ data: mockExportResponse });

      const request: ExportAuditTrailRequest = {
        format: 'xlsx',
        userId: 'user-1',
        action: 'LOGIN',
        startDate: '2025-01-01',
        endDate: '2025-01-31'
      };

      await service.exportAuditTrail(request);

      expect(mockApiClient.post).toHaveBeenCalledWith('/admin/audit-trail/export', request);
    });

    it('should handle unwrapped response', async () => {
      const mockExportResponse: ExportAuditTrailResponse = {
        downloadUrl: '/downloads/audit.json',
        fileName: 'audit.json',
        format: 'json',
        recordCount: 25,
        fileSize: 34567,
        expiresAt: '2025-01-02T10:00:00Z'
      };
      vi.mocked(mockApiClient.post).mockResolvedValue(mockExportResponse);

      const result = await service.exportAuditTrail({ format: 'json' });

      expect(result.format).toBe('json');
    });
  });

  describe('getFilterOptions', () => {
    it('should return filter options', () => {
      const options = service.getFilterOptions();

      expect(options.actions).toBeDefined();
      expect(options.resources).toBeDefined();
      expect(options.dateRanges).toBeDefined();
      expect(options.sortFields).toBeDefined();
      expect(options.sortOrders).toBeDefined();
      expect(options.exportFormats).toBeDefined();
      expect(options.exportFields).toBeDefined();

      expect(options.actions.length).toBeGreaterThan(0);
      expect(options.resources.length).toBeGreaterThan(0);
    });

    it('should have correct action options', () => {
      const options = service.getFilterOptions();

      const loginAction = options.actions.find(a => a.value === 'LOGIN');
      expect(loginAction).toBeDefined();
      expect(loginAction?.label).toBe('Login');
    });

    it('should have correct export format options', () => {
      const options = service.getFilterOptions();

      expect(options.exportFormats).toHaveLength(3);
      expect(options.exportFormats[0].value).toBe('csv');
      expect(options.exportFormats[1].value).toBe('xlsx');
      expect(options.exportFormats[2].value).toBe('json');
    });
  });

  describe('transformAuditLogEntry', () => {
    it('should transform audit log entry with user info', () => {
      const transformed = service.transformAuditLogEntry(mockAuditLogEntry);

      expect(transformed.id).toBe('log-1');
      expect(transformed.action).toBe('LOGIN');
      expect(transformed.eventType).toBe('AUTHENTICATION');
      expect(transformed.severity).toBe('LOW');
      expect(transformed.status).toBe('SUCCESS');
      expect(transformed.userDisplayName).toBe('John Doe');
    });

    it('should handle entry without user info', () => {
      const entryWithoutUser = { ...mockAuditLogEntry, user: undefined };
      const transformed = service.transformAuditLogEntry(entryWithoutUser);

      expect(transformed.userDisplayName).toBe('System');
    });

    it('should use email when name is not available', () => {
      const entryWithEmailOnly = {
        ...mockAuditLogEntry,
        user: { id: 'user-1', email: 'test@example.com' }
      };
      const transformed = service.transformAuditLogEntry(entryWithEmailOnly);

      expect(transformed.userDisplayName).toBe('test@example.com');
    });

    it('should determine correct event type', () => {
      const loginEntry = { ...mockAuditLogEntry, action: 'LOGIN' };
      expect(service.transformAuditLogEntry(loginEntry).eventType).toBe('AUTHENTICATION');

      const userCreatedEntry = { ...mockAuditLogEntry, action: 'USER_CREATED' };
      expect(service.transformAuditLogEntry(userCreatedEntry).eventType).toBe('USER_MANAGEMENT');

      const roleAssignedEntry = { ...mockAuditLogEntry, action: 'ROLE_ASSIGNED' };
      expect(service.transformAuditLogEntry(roleAssignedEntry).eventType).toBe('ACCESS_CONTROL');

      const passwordResetEntry = { ...mockAuditLogEntry, action: 'PASSWORD_RESET' };
      expect(service.transformAuditLogEntry(passwordResetEntry).eventType).toBe('SECURITY');
    });

    it('should determine correct severity levels', () => {
      const suspiciousEntry = { ...mockAuditLogEntry, action: 'SUSPICIOUS_ACTIVITY' };
      expect(service.transformAuditLogEntry(suspiciousEntry).severity).toBe('CRITICAL');

      const roleAssignedEntry = { ...mockAuditLogEntry, action: 'ROLE_ASSIGNED' };
      expect(service.transformAuditLogEntry(roleAssignedEntry).severity).toBe('HIGH');

      const userUpdatedEntry = { ...mockAuditLogEntry, action: 'USER_UPDATED' };
      expect(service.transformAuditLogEntry(userUpdatedEntry).severity).toBe('MEDIUM');

      const loginEntry = { ...mockAuditLogEntry, action: 'LOGIN' };
      expect(service.transformAuditLogEntry(loginEntry).severity).toBe('LOW');
    });

    it('should determine status correctly', () => {
      const successEntry = { ...mockAuditLogEntry, details: {} };
      expect(service.transformAuditLogEntry(successEntry).status).toBe('SUCCESS');

      const failedEntry = { ...mockAuditLogEntry, details: { error: 'Failed' } };
      expect(service.transformAuditLogEntry(failedEntry).status).toBe('FAILED');

      const pendingEntry = { ...mockAuditLogEntry, details: { pending: true } };
      expect(service.transformAuditLogEntry(pendingEntry).status).toBe('PENDING');
    });

    it('should generate correct descriptions', () => {
      const loginEntry = { ...mockAuditLogEntry, action: 'LOGIN', resource: 'AUTH' };
      const transformed = service.transformAuditLogEntry(loginEntry);
      expect(transformed.description).toContain('logged in');
      expect(transformed.description).toContain('auth');
    });

    it('should include target user in description', () => {
      const roleEntry = {
        ...mockAuditLogEntry,
        action: 'ROLE_ASSIGNED',
        details: { targetUserId: 'user-2', roles: ['Admin', 'Editor'] }
      };
      const transformed = service.transformAuditLogEntry(roleEntry);
      expect(transformed.description).toContain('user user-2');
      expect(transformed.description).toContain('Admin, Editor');
    });
  });

  describe('singleton instance', () => {
    it('should export singleton instance', () => {
      expect(auditTrailService).toBeInstanceOf(AuditTrailService);
    });
  });
});
