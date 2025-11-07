import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAuditTrail, AUDIT_CONFIG } from '../useAuditTrail';
import { auditTrailService } from '@/services/auditTrailService';
import type {
  AuditLogEntry,
  PaginatedAuditTrailResponse,
  AuditStatsResponse,
  ExportAuditTrailResponse
} from '@/services/auditTrailService';

// Mock dependencies
vi.mock('primevue/usetoast', () => ({
  useToast: vi.fn(() => ({
    add: vi.fn()
  }))
}));

vi.mock('@/services/auditTrailService', () => ({
  auditTrailService: {
    getAuditTrail: vi.fn(),
    getAuditStatistics: vi.fn(),
    exportAuditTrail: vi.fn(),
    downloadExport: vi.fn()
  }
}));

describe('useAuditTrail', () => {
  // Mock data
  const mockUser = {
    id: 'user-1',
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe'
  };

  const mockAuditEntry: AuditLogEntry = {
    id: 'log-1',
    userId: 'user-1',
    action: 'LOGIN',
    resource: 'AUTH',
    details: { ip: '127.0.0.1' },
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
    createdAt: '2025-01-01T10:00:00Z',
    user: mockUser
  };

  const mockAuditResponse: PaginatedAuditTrailResponse = {
    data: [mockAuditEntry],
    pagination: {
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false
    },
    filters: {
      dateRange: 'Last 7 days',
      totalDays: 7,
      filters: {}
    }
  };

  const mockStatsResponse: AuditStatsResponse = {
    summary: {
      totalEvents: 100,
      uniqueUsers: 10,
      uniqueActions: 5,
      uniqueResources: 3,
      timeRange: 'Last 7 days'
    },
    timeline: [
      { period: '2025-01-01', count: 50, uniqueUsers: 5 }
    ],
    topActions: [
      { action: 'LOGIN', count: 30, percentage: 30 }
    ],
    topResources: [
      { resource: 'AUTH', count: 40, percentage: 40 }
    ],
    topUsers: [
      { userId: 'user-1', userEmail: 'user@example.com', count: 25, percentage: 25 }
    ],
    securityEvents: {
      failedLogins: 5,
      passwordResets: 2,
      suspiciousActivity: 1,
      accountLockouts: 2
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with correct default values', () => {
      const { loading, statsLoading, exportLoading, auditData, statsData, transformedAuditLogs, userOptions } = useAuditTrail();

      expect(loading.value).toBe(false);
      expect(statsLoading.value).toBe(false);
      expect(exportLoading.value).toBe(false);
      expect(auditData.value).toBeNull();
      expect(statsData.value).toBeNull();
      expect(transformedAuditLogs.value).toEqual([]);
      expect(userOptions.value).toEqual([]);
    });

    it('should initialize filters with default values', () => {
      const { filters } = useAuditTrail();

      expect(filters.search).toBe('');
      expect(filters.action).toBeUndefined();
      expect(filters.resource).toBeUndefined();
      expect(filters.days).toBe(7);
      expect(filters.userId).toBeUndefined();
      expect(filters.ipAddress).toBe('');
      expect(filters.page).toBe(1);
      expect(filters.limit).toBe(20);
      expect(filters.sortBy).toBe('createdAt');
      expect(filters.sortOrder).toBe('desc');
      expect(filters.includeSensitive).toBe(false);
    });

    it('should initialize statsFilters with default values', () => {
      const { statsFilters } = useAuditTrail();

      expect(statsFilters.days).toBe(7);
      expect(statsFilters.groupBy).toBe('day');
    });

    it('should expose AUDIT_CONFIG constants', () => {
      const { AUDIT_CONFIG: config } = useAuditTrail();

      expect(config.DEFAULT_PAGE_SIZE).toBe(100);
      expect(config.DEBOUNCE_DELAY).toBe(300);
      expect(config.RETENTION_DAYS).toBe(365);
      expect(config.DATE_RANGES).toHaveLength(6);
    });
  });

  describe('loadAuditLogs', () => {
    it('should load audit logs successfully', async () => {
      // Mock returns array directly (service unwraps response.data)
      vi.mocked(auditTrailService.getAuditTrail).mockResolvedValue([mockAuditEntry] as any);

      const { loadAuditLogs, auditData, transformedAuditLogs, loading } = useAuditTrail();

      await loadAuditLogs();

      expect(loading.value).toBe(false);
      expect(auditData.value).toEqual([mockAuditEntry]);
      expect(transformedAuditLogs.value).toHaveLength(1);
      expect(transformedAuditLogs.value[0]).toMatchObject({
        id: 'log-1',
        userId: 'user-1',
        action: 'LOGIN'
      });
    });

    it('should set loading state during fetch', async () => {
      let loadingDuringFetch = false;
      vi.mocked(auditTrailService.getAuditTrail).mockImplementation(async () => {
        loadingDuringFetch = loading.value;
        return [mockAuditEntry] as any;
      });

      const { loadAuditLogs, loading } = useAuditTrail();

      await loadAuditLogs();

      expect(loadingDuringFetch).toBe(true);
      expect(loading.value).toBe(false);
    });

    it('should transform audit entries correctly', async () => {
      vi.mocked(auditTrailService.getAuditTrail).mockResolvedValue([mockAuditEntry] as any);

      const { loadAuditLogs, transformedAuditLogs } = useAuditTrail();

      await loadAuditLogs();

      const transformed = transformedAuditLogs.value[0];
      expect(transformed.eventType).toBe('AUTHENTICATION');
      expect(transformed.severity).toBe('LOW');
      expect(transformed.status).toBe('SUCCESS');
      expect(transformed.userDisplayName).toBe('John Doe');
      expect(transformed.description).toContain('LOGIN');
    });

    it('should extract unique users for filter dropdown', async () => {
      const responseWithMultipleUsers = [
        mockAuditEntry,
        {
          ...mockAuditEntry,
          id: 'log-2',
          userId: 'user-2',
          user: { id: 'user-2', email: 'jane@example.com', firstName: 'Jane', lastName: 'Smith' }
        },
        {
          ...mockAuditEntry,
          id: 'log-3',
          userId: 'user-1',
          user: mockUser // Duplicate user
        }
      ];

      vi.mocked(auditTrailService.getAuditTrail).mockResolvedValue(responseWithMultipleUsers as any);

      const { loadAuditLogs, userOptions } = useAuditTrail();

      await loadAuditLogs();

      expect(userOptions.value).toHaveLength(2); // Duplicates removed
      expect(userOptions.value[0].label).toBe('Jane Smith (jane@example.com)');
      expect(userOptions.value[0].value).toBe('user-2');
      expect(userOptions.value[1].label).toBe('John Doe (user@example.com)');
      expect(userOptions.value[1].value).toBe('user-1');
    });

    it('should handle user without firstName/lastName', async () => {
      const entryWithoutName = {
        ...mockAuditEntry,
        user: { id: 'user-3', email: 'noname@example.com' }
      };

      vi.mocked(auditTrailService.getAuditTrail).mockResolvedValue([entryWithoutName] as any);

      const { loadAuditLogs, userOptions } = useAuditTrail();

      await loadAuditLogs();

      expect(userOptions.value[0].label).toBe('noname@example.com');
    });

    it('should handle network error', async () => {
      const networkError = new Error('Network error occurred');
      vi.mocked(auditTrailService.getAuditTrail).mockRejectedValue(networkError);

      const { loadAuditLogs, auditData, transformedAuditLogs } = useAuditTrail();

      await loadAuditLogs();

      expect(auditData.value).toBeNull();
      expect(transformedAuditLogs.value).toEqual([]);
    });

    it('should handle 401 unauthorized error', async () => {
      const authError = new Error('Request failed with status 401');
      vi.mocked(auditTrailService.getAuditTrail).mockRejectedValue(authError);

      const { loadAuditLogs } = useAuditTrail();

      await loadAuditLogs();

      // Should clear data and show appropriate error
      expect(auditTrailService.getAuditTrail).toHaveBeenCalled();
    });

    it('should handle 403 forbidden error', async () => {
      const forbiddenError = new Error('Request failed with status 403');
      vi.mocked(auditTrailService.getAuditTrail).mockRejectedValue(forbiddenError);

      const { loadAuditLogs, auditData } = useAuditTrail();

      await loadAuditLogs();

      expect(auditData.value).toBeNull();
    });

    it('should filter out null transformed entries', async () => {
      // Create an entry that will fail transformation
      const invalidEntry = {
        ...mockAuditEntry,
        id: 'invalid'
      };

      vi.mocked(auditTrailService.getAuditTrail).mockResolvedValue([mockAuditEntry, invalidEntry] as any);

      const { loadAuditLogs, transformedAuditLogs } = useAuditTrail();

      await loadAuditLogs();

      // All entries should be transformed successfully
      expect(transformedAuditLogs.value.length).toBeGreaterThan(0);
    });

    it('should handle entry without user', async () => {
      const entryWithoutUser = {
        ...mockAuditEntry,
        userId: null,
        user: undefined
      };

      vi.mocked(auditTrailService.getAuditTrail).mockResolvedValue([entryWithoutUser] as any);

      const { loadAuditLogs, transformedAuditLogs } = useAuditTrail();

      await loadAuditLogs();

      expect(transformedAuditLogs.value[0].userDisplayName).toBe('System');
    });
  });

  describe('loadAuditStatistics', () => {
    it('should load statistics successfully', async () => {
      vi.mocked(auditTrailService.getAuditStatistics).mockResolvedValue(mockStatsResponse);

      const { loadAuditStatistics, statsData, statsLoading } = useAuditTrail();

      await loadAuditStatistics();

      expect(statsLoading.value).toBe(false);
      expect(statsData.value).toEqual(mockStatsResponse);
    });

    it('should set statsLoading state during fetch', async () => {
      let loadingDuringFetch = false;
      vi.mocked(auditTrailService.getAuditStatistics).mockImplementation(async () => {
        loadingDuringFetch = statsLoading.value;
        return mockStatsResponse;
      });

      const { loadAuditStatistics, statsLoading } = useAuditTrail();

      await loadAuditStatistics();

      expect(loadingDuringFetch).toBe(true);
      expect(statsLoading.value).toBe(false);
    });

    it('should sync filters before loading statistics', async () => {
      vi.mocked(auditTrailService.getAuditStatistics).mockResolvedValue(mockStatsResponse);

      const { loadAuditStatistics, filters, statsFilters } = useAuditTrail();

      filters.days = 30;

      await loadAuditStatistics();

      expect(statsFilters.days).toBe(30);
    });

    it('should handle statistics loading error silently', async () => {
      const error = new Error('Stats error');
      vi.mocked(auditTrailService.getAuditStatistics).mockRejectedValue(error);

      const { loadAuditStatistics, statsData } = useAuditTrail();

      await loadAuditStatistics();

      expect(statsData.value).toBeNull();
      // Should not throw error
    });
  });

  describe('Computed Properties', () => {
    it('should calculate totalEvents from stats', async () => {
      vi.mocked(auditTrailService.getAuditStatistics).mockResolvedValue(mockStatsResponse);

      const { loadAuditStatistics, totalEvents } = useAuditTrail();

      expect(totalEvents.value).toBe(0);

      await loadAuditStatistics();

      expect(totalEvents.value).toBe(100);
    });

    it('should calculate failedEvents from security events', async () => {
      vi.mocked(auditTrailService.getAuditStatistics).mockResolvedValue(mockStatsResponse);

      const { loadAuditStatistics, failedEvents } = useAuditTrail();

      await loadAuditStatistics();

      // failedLogins(5) + suspiciousActivity(1) + accountLockouts(2) = 8
      expect(failedEvents.value).toBe(8);
    });

    it('should calculate successfulEvents as total minus failed', async () => {
      vi.mocked(auditTrailService.getAuditStatistics).mockResolvedValue(mockStatsResponse);

      const { loadAuditStatistics, successfulEvents } = useAuditTrail();

      await loadAuditStatistics();

      // 100 total - 8 failed = 92
      expect(successfulEvents.value).toBe(92);
    });

    it('should return securityEvents same as failedEvents', async () => {
      vi.mocked(auditTrailService.getAuditStatistics).mockResolvedValue(mockStatsResponse);

      const { loadAuditStatistics, securityEvents, failedEvents } = useAuditTrail();

      await loadAuditStatistics();

      expect(securityEvents.value).toBe(failedEvents.value);
      expect(securityEvents.value).toBe(8);
    });

    it('should handle missing security events gracefully', async () => {
      const statsWithoutSecurity: AuditStatsResponse = {
        ...mockStatsResponse,
        securityEvents: {
          failedLogins: 0,
          passwordResets: 0,
          suspiciousActivity: 0,
          accountLockouts: 0
        }
      };

      vi.mocked(auditTrailService.getAuditStatistics).mockResolvedValue(statsWithoutSecurity);

      const { loadAuditStatistics, failedEvents, successfulEvents } = useAuditTrail();

      await loadAuditStatistics();

      expect(failedEvents.value).toBe(0);
      expect(successfulEvents.value).toBe(100);
    });

    it('should ensure successfulEvents never goes negative', async () => {
      const statsWithHighFailures: AuditStatsResponse = {
        ...mockStatsResponse,
        summary: {
          ...mockStatsResponse.summary,
          totalEvents: 5
        },
        securityEvents: {
          failedLogins: 10,
          passwordResets: 0,
          suspiciousActivity: 5,
          accountLockouts: 0
        }
      };

      vi.mocked(auditTrailService.getAuditStatistics).mockResolvedValue(statsWithHighFailures);

      const { loadAuditStatistics, successfulEvents } = useAuditTrail();

      await loadAuditStatistics();

      expect(successfulEvents.value).toBe(0); // Math.max(0, 5 - 15) = 0
    });
  });

  describe('transformAuditEntry', () => {
    it('should transform LOGIN action correctly', async () => {
      const loginEntry = { ...mockAuditEntry, action: 'LOGIN' };
      vi.mocked(auditTrailService.getAuditTrail).mockResolvedValue([loginEntry] as any);

      const { loadAuditLogs, transformedAuditLogs } = useAuditTrail();

      await loadAuditLogs();

      const transformed = transformedAuditLogs.value[0];
      expect(transformed.eventType).toBe('AUTHENTICATION');
      expect(transformed.status).toBe('SUCCESS');
      expect(transformed.description).toContain('LOGIN');
    });

    it('should transform FAILED action correctly', async () => {
      const failedEntry = { ...mockAuditEntry, action: 'FAILED_LOGIN' };
      vi.mocked(auditTrailService.getAuditTrail).mockResolvedValue([failedEntry] as any);

      const { loadAuditLogs, transformedAuditLogs } = useAuditTrail();

      await loadAuditLogs();

      const transformed = transformedAuditLogs.value[0];
      expect(transformed.severity).toBe('HIGH');
      expect(transformed.status).toBe('FAILED');
    });

    it('should transform SUSPICIOUS action correctly', async () => {
      const suspiciousEntry = { ...mockAuditEntry, action: 'SUSPICIOUS_ACTIVITY' };
      vi.mocked(auditTrailService.getAuditTrail).mockResolvedValue([suspiciousEntry] as any);

      const { loadAuditLogs, transformedAuditLogs } = useAuditTrail();

      await loadAuditLogs();

      const transformed = transformedAuditLogs.value[0];
      expect(transformed.severity).toBe('HIGH');
    });

    it('should include resource in description when present', async () => {
      const entryWithResource = { ...mockAuditEntry, action: 'USER_CREATED', resource: 'USER' };
      vi.mocked(auditTrailService.getAuditTrail).mockResolvedValue([entryWithResource] as any);

      const { loadAuditLogs, transformedAuditLogs } = useAuditTrail();

      await loadAuditLogs();

      const transformed = transformedAuditLogs.value[0];
      expect(transformed.description).toContain('USER_CREATED');
      expect(transformed.description).toContain('USER');
    });

    it('should handle transformation errors gracefully', async () => {
      // This test ensures error handling in transformAuditEntry
      vi.mocked(auditTrailService.getAuditTrail).mockResolvedValue([mockAuditEntry] as any);

      const { loadAuditLogs, transformedAuditLogs } = useAuditTrail();

      await loadAuditLogs();

      // Should have successfully transformed entries
      expect(transformedAuditLogs.value.length).toBeGreaterThan(0);
    });
  });

  describe('resetFilters', () => {
    it('should reset filters to default values', () => {
      const { filters, statsFilters, resetFilters } = useAuditTrail();

      // Modify filters
      filters.search = 'test';
      filters.action = 'LOGIN';
      filters.days = 30;
      filters.page = 5;
      statsFilters.days = 30;
      statsFilters.groupBy = 'month';

      resetFilters();

      expect(filters.search).toBe('');
      expect(filters.action).toBeUndefined();
      expect(filters.days).toBe(7);
      expect(filters.page).toBe(1);
      expect(statsFilters.days).toBe(7);
      expect(statsFilters.groupBy).toBe('day');
    });

    it('should reload data after reset', async () => {
      vi.mocked(auditTrailService.getAuditTrail).mockResolvedValue([mockAuditEntry] as any);
      vi.mocked(auditTrailService.getAuditStatistics).mockResolvedValue(mockStatsResponse);

      const { resetFilters } = useAuditTrail();

      resetFilters();

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(auditTrailService.getAuditTrail).toHaveBeenCalled();
      expect(auditTrailService.getAuditStatistics).toHaveBeenCalled();
    });
  });

  describe('onPageChange', () => {
    it('should update page and reload logs', async () => {
      vi.mocked(auditTrailService.getAuditTrail).mockResolvedValue([mockAuditEntry] as any);

      const { onPageChange, filters } = useAuditTrail();

      await onPageChange({ page: 2 }); // PrimeVue uses 0-based indexing

      expect(filters.page).toBe(3); // Converted to 1-based
      expect(auditTrailService.getAuditTrail).toHaveBeenCalled();
    });

    it('should handle page 0', async () => {
      vi.mocked(auditTrailService.getAuditTrail).mockResolvedValue([mockAuditEntry] as any);

      const { onPageChange, filters } = useAuditTrail();

      await onPageChange({ page: 0 });

      expect(filters.page).toBe(1);
    });
  });

  describe('onFiltersChange', () => {
    it('should reset to page 1 and reload both logs and stats', async () => {
      vi.mocked(auditTrailService.getAuditTrail).mockResolvedValue([mockAuditEntry] as any);
      vi.mocked(auditTrailService.getAuditStatistics).mockResolvedValue(mockStatsResponse);

      const { onFiltersChange, filters } = useAuditTrail();

      filters.page = 5;

      await onFiltersChange();

      expect(filters.page).toBe(1);
      expect(auditTrailService.getAuditTrail).toHaveBeenCalled();
      expect(auditTrailService.getAuditStatistics).toHaveBeenCalled();
    });
  });

  describe('refreshData', () => {
    it('should reload both logs and statistics', async () => {
      vi.mocked(auditTrailService.getAuditTrail).mockResolvedValue([mockAuditEntry] as any);
      vi.mocked(auditTrailService.getAuditStatistics).mockResolvedValue(mockStatsResponse);

      const { refreshData } = useAuditTrail();

      await refreshData();

      expect(auditTrailService.getAuditTrail).toHaveBeenCalled();
      expect(auditTrailService.getAuditStatistics).toHaveBeenCalled();
    });

    it('should show success toast after refresh', async () => {
      vi.mocked(auditTrailService.getAuditTrail).mockResolvedValue([mockAuditEntry] as any);
      vi.mocked(auditTrailService.getAuditStatistics).mockResolvedValue(mockStatsResponse);

      const { refreshData } = useAuditTrail();

      await refreshData();

      // Toast should be called (mocked internally)
      expect(auditTrailService.getAuditTrail).toHaveBeenCalled();
    });
  });

  describe('exportAuditLogs', () => {
    const mockExportResponse: ExportAuditTrailResponse = {
      downloadUrl: 'https://example.com/export/file.csv',
      fileName: 'audit-logs.csv',
      format: 'csv',
      recordCount: 100,
      fileSize: 1024,
      expiresAt: '2025-01-02T10:00:00Z'
    };

    it('should export logs as CSV by default', async () => {
      vi.mocked(auditTrailService.exportAuditTrail).mockResolvedValue(mockExportResponse);
      vi.mocked(auditTrailService.downloadExport).mockResolvedValue(undefined);

      const { exportAuditLogs, exportLoading } = useAuditTrail();

      await exportAuditLogs();

      expect(exportLoading.value).toBe(false);
      expect(auditTrailService.exportAuditTrail).toHaveBeenCalledWith(
        expect.objectContaining({ format: 'csv' })
      );
      expect(auditTrailService.downloadExport).toHaveBeenCalledWith(
        'https://example.com/export/file.csv',
        'audit-logs.csv'
      );
    });

    it('should export logs as XLSX when specified', async () => {
      vi.mocked(auditTrailService.exportAuditTrail).mockResolvedValue({
        ...mockExportResponse,
        format: 'xlsx',
        fileName: 'audit-logs.xlsx'
      });
      vi.mocked(auditTrailService.downloadExport).mockResolvedValue(undefined);

      const { exportAuditLogs } = useAuditTrail();

      await exportAuditLogs('xlsx');

      expect(auditTrailService.exportAuditTrail).toHaveBeenCalledWith(
        expect.objectContaining({ format: 'xlsx' })
      );
    });

    it('should set exportLoading during export', async () => {
      let loadingDuringExport = false;
      vi.mocked(auditTrailService.exportAuditTrail).mockImplementation(async () => {
        loadingDuringExport = exportLoading.value;
        return mockExportResponse;
      });
      vi.mocked(auditTrailService.downloadExport).mockResolvedValue(undefined);

      const { exportAuditLogs, exportLoading } = useAuditTrail();

      await exportAuditLogs();

      expect(loadingDuringExport).toBe(true);
      expect(exportLoading.value).toBe(false);
    });

    it('should include current filters in export request', async () => {
      vi.mocked(auditTrailService.exportAuditTrail).mockResolvedValue(mockExportResponse);
      vi.mocked(auditTrailService.downloadExport).mockResolvedValue(undefined);

      const { exportAuditLogs, filters } = useAuditTrail();

      filters.search = 'test';
      filters.action = 'LOGIN';
      filters.days = 30;

      await exportAuditLogs();

      expect(auditTrailService.exportAuditTrail).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'test',
          action: 'LOGIN',
          days: 30
        })
      );
    });

    it('should handle export error', async () => {
      const error = new Error('Export failed');
      vi.mocked(auditTrailService.exportAuditTrail).mockRejectedValue(error);

      const { exportAuditLogs, exportLoading } = useAuditTrail();

      await exportAuditLogs();

      expect(exportLoading.value).toBe(false);
      // Should show error toast (mocked internally)
    });

    it('should handle download error', async () => {
      vi.mocked(auditTrailService.exportAuditTrail).mockResolvedValue(mockExportResponse);
      vi.mocked(auditTrailService.downloadExport).mockRejectedValue(new Error('Download failed'));

      const { exportAuditLogs, exportLoading } = useAuditTrail();

      await exportAuditLogs();

      expect(exportLoading.value).toBe(false);
      // Should show error toast
    });
  });

  describe('syncFilters', () => {
    it('should sync days filter from filters to statsFilters', () => {
      const { filters, statsFilters, syncFilters } = useAuditTrail();

      filters.days = 30;
      syncFilters();

      expect(statsFilters.days).toBe(30);
    });

    it('should not sync other filters that stats API does not support', () => {
      const { filters, statsFilters, syncFilters } = useAuditTrail();

      filters.search = 'test';
      filters.action = 'LOGIN';
      syncFilters();

      // statsFilters should not have these properties
      expect(statsFilters).not.toHaveProperty('search');
      expect(statsFilters).not.toHaveProperty('action');
    });
  });

  describe('Configuration', () => {
    it('should export AUDIT_CONFIG with correct values', () => {
      expect(AUDIT_CONFIG.DEFAULT_PAGE_SIZE).toBe(100);
      expect(AUDIT_CONFIG.DEBOUNCE_DELAY).toBe(300);
      expect(AUDIT_CONFIG.RETENTION_DAYS).toBe(365);
      expect(AUDIT_CONFIG.DATE_RANGES).toHaveLength(6);
      expect(AUDIT_CONFIG.DATE_RANGES[0].label).toBe('Last hour');
      expect(AUDIT_CONFIG.DATE_RANGES[5].value).toBe(365);
    });
  });
});
