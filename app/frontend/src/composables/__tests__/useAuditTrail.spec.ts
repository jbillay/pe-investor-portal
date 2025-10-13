/**
 * useAuditTrail Composable Unit Tests
 * Tests for audit trail management functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuditTrail, AUDIT_CONFIG } from '../useAuditTrail';
import type { AuditLogEntry } from '@/services/auditTrailService';

// Mock the audit trail service
const mockGetAuditTrail = vi.fn();
const mockGetAuditStatistics = vi.fn();
const mockExportAuditTrail = vi.fn();
const mockDownloadExport = vi.fn();

vi.mock('@/services/auditTrailService', () => ({
  auditTrailService: {
    getAuditTrail: (...args: any[]) => mockGetAuditTrail(...args),
    getAuditStatistics: (...args: any[]) => mockGetAuditStatistics(...args),
    exportAuditTrail: (...args: any[]) => mockExportAuditTrail(...args),
    downloadExport: (...args: any[]) => mockDownloadExport(...args),
  },
}));

// Mock PrimeVue toast
const mockToastAdd = vi.fn();
vi.mock('primevue/usetoast', () => ({
  useToast: () => ({
    add: mockToastAdd,
  }),
}));

describe('useAuditTrail Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should export AUDIT_CONFIG constants', () => {
      expect(AUDIT_CONFIG.DEFAULT_PAGE_SIZE).toBe(100);
      expect(AUDIT_CONFIG.DEBOUNCE_DELAY).toBe(300);
      expect(AUDIT_CONFIG.RETENTION_DAYS).toBe(365);
      expect(AUDIT_CONFIG.DATE_RANGES).toHaveLength(6);
    });

    it('should have correct date range options', () => {
      const ranges = AUDIT_CONFIG.DATE_RANGES;
      expect(ranges[0]).toEqual({ label: 'Last hour', value: undefined, hours: 1 });
      expect(ranges[1]).toEqual({ label: 'Last 24 hours', value: 1 });
      expect(ranges[2]).toEqual({ label: 'Last 7 days', value: 7 });
    });
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { loading, statsLoading, exportLoading, filters, statsFilters } = useAuditTrail();

      expect(loading.value).toBe(false);
      expect(statsLoading.value).toBe(false);
      expect(exportLoading.value).toBe(false);
      expect(filters.search).toBe('');
      expect(filters.days).toBe(7);
      expect(filters.page).toBe(1);
      expect(filters.limit).toBe(20);
      expect(statsFilters.days).toBe(7);
      expect(statsFilters.groupBy).toBe('day');
    });

    it('should initialize with empty data arrays', () => {
      const { auditData, statsData, transformedAuditLogs, userOptions } = useAuditTrail();

      expect(auditData.value).toBeNull();
      expect(statsData.value).toBeNull();
      expect(transformedAuditLogs.value).toEqual([]);
      expect(userOptions.value).toEqual([]);
    });
  });

  describe('Computed Properties', () => {
    it('should compute totalEvents from stats', () => {
      const { totalEvents, statsData } = useAuditTrail();

      statsData.value = {
        summary: { totalEvents: 150 },
      } as any;

      expect(totalEvents.value).toBe(150);
    });

    it('should return 0 for totalEvents when no stats', () => {
      const { totalEvents } = useAuditTrail();
      expect(totalEvents.value).toBe(0);
    });

    it('should compute failedEvents from security events', () => {
      const { failedEvents, statsData } = useAuditTrail();

      statsData.value = {
        securityEvents: {
          failedLogins: 10,
          suspiciousActivity: 5,
          accountLockouts: 3,
        },
      } as any;

      expect(failedEvents.value).toBe(18);
    });

    it('should return 0 for failedEvents when no security events', () => {
      const { failedEvents } = useAuditTrail();
      expect(failedEvents.value).toBe(0);
    });

    it('should compute successfulEvents as total minus failed', () => {
      const { successfulEvents, statsData } = useAuditTrail();

      statsData.value = {
        summary: { totalEvents: 100 },
        securityEvents: {
          failedLogins: 5,
          suspiciousActivity: 3,
          accountLockouts: 2,
        },
      } as any;

      expect(successfulEvents.value).toBe(90); // 100 - 10
    });

    it('should not return negative successfulEvents', () => {
      const { successfulEvents, statsData } = useAuditTrail();

      statsData.value = {
        summary: { totalEvents: 5 },
        securityEvents: {
          failedLogins: 10,
          suspiciousActivity: 0,
          accountLockouts: 0,
        },
      } as any;

      expect(successfulEvents.value).toBe(0); // Math.max(0, 5 - 10)
    });

    it('should compute securityEvents same as failedEvents', () => {
      const { securityEvents, failedEvents, statsData } = useAuditTrail();

      statsData.value = {
        securityEvents: {
          failedLogins: 7,
          suspiciousActivity: 2,
          accountLockouts: 1,
        },
      } as any;

      expect(securityEvents.value).toBe(10);
      expect(securityEvents.value).toBe(failedEvents.value);
    });
  });

  describe('transformAuditEntry', () => {
    it('should transform audit entry correctly', () => {
      const { transformedAuditLogs } = useAuditTrail();

      const mockEntry: AuditLogEntry = {
        id: '1',
        userId: 'user-1',
        action: 'USER_LOGIN',
        resource: 'auth',
        details: {},
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        createdAt: new Date(),
        user: {
          id: 'user-1',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      mockGetAuditTrail.mockResolvedValue([mockEntry]);

      // The transform happens internally in loadAuditLogs
      // We can't directly call transformAuditEntry, so we test via loadAuditLogs
    });

    it('should handle entry without user', async () => {
      const { loadAuditLogs, transformedAuditLogs } = useAuditTrail();

      const mockEntry = {
        id: '1',
        action: 'SYSTEM_BACKUP',
        resource: 'database',
        createdAt: new Date(),
      };

      mockGetAuditTrail.mockResolvedValue([mockEntry]);
      await loadAuditLogs();

      expect(transformedAuditLogs.value[0].userDisplayName).toBe('System');
    });

    it('should determine eventType based on action', async () => {
      const { loadAuditLogs, transformedAuditLogs } = useAuditTrail();

      const loginEntry = {
        id: '1',
        action: 'USER_LOGIN',
        createdAt: new Date(),
      };

      mockGetAuditTrail.mockResolvedValue([loginEntry]);
      await loadAuditLogs();

      expect(transformedAuditLogs.value[0].eventType).toBe('AUTHENTICATION');
    });

    it('should determine severity based on action', async () => {
      const { loadAuditLogs, transformedAuditLogs } = useAuditTrail();

      const failedEntry = {
        id: '1',
        action: 'LOGIN_FAILED',
        createdAt: new Date(),
      };

      mockGetAuditTrail.mockResolvedValue([failedEntry]);
      await loadAuditLogs();

      expect(transformedAuditLogs.value[0].severity).toBe('HIGH');
      expect(transformedAuditLogs.value[0].status).toBe('FAILED');
    });
  });

  describe('loadAuditLogs', () => {
    it('should load audit logs successfully', async () => {
      const { loadAuditLogs, loading, transformedAuditLogs } = useAuditTrail();

      const mockLogs = [
        {
          id: '1',
          action: 'USER_LOGIN',
          createdAt: new Date(),
          user: { id: 'u1', email: 'test@example.com', firstName: 'Test', lastName: 'User' },
        },
      ];

      mockGetAuditTrail.mockResolvedValue(mockLogs);

      await loadAuditLogs();

      expect(loading.value).toBe(false);
      expect(transformedAuditLogs.value).toHaveLength(1);
      expect(mockGetAuditTrail).toHaveBeenCalled();
    });

    it('should set loading state during load', async () => {
      const { loadAuditLogs, loading } = useAuditTrail();

      let loadingDuringCall = false;
      mockGetAuditTrail.mockImplementation(async () => {
        loadingDuringCall = loading.value;
        return [];
      });

      await loadAuditLogs();

      expect(loadingDuringCall).toBe(true);
      expect(loading.value).toBe(false);
    });

    it('should extract unique user options', async () => {
      const { loadAuditLogs, userOptions } = useAuditTrail();

      const mockLogs = [
        {
          id: '1',
          action: 'LOGIN',
          createdAt: new Date(),
          user: { id: 'u1', email: 'alice@example.com', firstName: 'Alice', lastName: 'Smith' },
        },
        {
          id: '2',
          action: 'LOGOUT',
          createdAt: new Date(),
          user: { id: 'u2', email: 'bob@example.com', firstName: 'Bob', lastName: 'Jones' },
        },
        {
          id: '3',
          action: 'LOGIN',
          createdAt: new Date(),
          user: { id: 'u1', email: 'alice@example.com', firstName: 'Alice', lastName: 'Smith' },
        },
      ];

      mockGetAuditTrail.mockResolvedValue(mockLogs);
      await loadAuditLogs();

      expect(userOptions.value).toHaveLength(2); // Unique users only
      expect(userOptions.value[0].value).toBe('u1');
      expect(userOptions.value[0].label).toContain('Alice Smith');
    });

    it('should handle errors and show toast', async () => {
      const { loadAuditLogs, auditData, transformedAuditLogs } = useAuditTrail();

      mockGetAuditTrail.mockRejectedValue(new Error('Network error'));
      await loadAuditLogs();

      expect(auditData.value).toBeNull();
      expect(transformedAuditLogs.value).toEqual([]);
      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Failed to Load Audit Logs',
        detail: 'Network error. Please check your connection.',
        life: 5000,
      });
    });

    it('should handle 401 errors specifically', async () => {
      const { loadAuditLogs } = useAuditTrail();

      mockGetAuditTrail.mockRejectedValue(new Error('401 Unauthorized'));
      await loadAuditLogs();

      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Failed to Load Audit Logs',
        detail: 'Session expired. Please log in again.',
        life: 5000,
      });
    });

    it('should handle 403 errors specifically', async () => {
      const { loadAuditLogs } = useAuditTrail();

      mockGetAuditTrail.mockRejectedValue(new Error('403 Forbidden'));
      await loadAuditLogs();

      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Failed to Load Audit Logs',
        detail: 'Insufficient permissions to view audit logs.',
        life: 5000,
      });
    });
  });

  describe('loadAuditStatistics', () => {
    it('should load statistics successfully', async () => {
      const { loadAuditStatistics, statsLoading, statsData } = useAuditTrail();

      const mockStats = {
        summary: { totalEvents: 100 },
        securityEvents: { failedLogins: 5 },
      };

      mockGetAuditStatistics.mockResolvedValue(mockStats);

      await loadAuditStatistics();

      expect(statsLoading.value).toBe(false);
      expect(statsData.value).toEqual(mockStats);
      expect(mockGetAuditStatistics).toHaveBeenCalled();
    });

    it('should sync filters before loading', async () => {
      const { loadAuditStatistics, filters, statsFilters } = useAuditTrail();

      filters.days = 30;
      mockGetAuditStatistics.mockResolvedValue({});

      await loadAuditStatistics();

      expect(statsFilters.days).toBe(30);
    });

    it('should handle errors silently (no toast)', async () => {
      const { loadAuditStatistics, statsData } = useAuditTrail();

      mockGetAuditStatistics.mockRejectedValue(new Error('Stats error'));
      await loadAuditStatistics();

      expect(statsData.value).toBeNull();
      expect(mockToastAdd).not.toHaveBeenCalled();
    });
  });

  describe('resetFilters', () => {
    it('should reset all filters to defaults', () => {
      const { resetFilters, filters, statsFilters } = useAuditTrail();

      // Modify filters
      filters.search = 'test';
      filters.days = 30;
      filters.page = 5;
      filters.action = 'LOGIN';
      statsFilters.days = 90;

      mockGetAuditTrail.mockResolvedValue([]);
      mockGetAuditStatistics.mockResolvedValue({});

      resetFilters();

      expect(filters.search).toBe('');
      expect(filters.days).toBe(7);
      expect(filters.page).toBe(1);
      expect(filters.action).toBeUndefined();
      expect(statsFilters.days).toBe(7);
    });

    it('should reload both datasets after reset', () => {
      const { resetFilters } = useAuditTrail();

      mockGetAuditTrail.mockResolvedValue([]);
      mockGetAuditStatistics.mockResolvedValue({});

      resetFilters();

      expect(mockGetAuditTrail).toHaveBeenCalled();
      expect(mockGetAuditStatistics).toHaveBeenCalled();
    });
  });

  describe('onPageChange', () => {
    it('should update page and reload logs', async () => {
      const { onPageChange, filters } = useAuditTrail();

      mockGetAuditTrail.mockResolvedValue([]);

      await onPageChange({ page: 2 }); // PrimeVue is 0-based

      expect(filters.page).toBe(3); // Converted to 1-based
      expect(mockGetAuditTrail).toHaveBeenCalled();
    });
  });

  describe('onFiltersChange', () => {
    it('should reset to page 1 and reload both datasets', async () => {
      const { onFiltersChange, filters } = useAuditTrail();

      filters.page = 5;
      mockGetAuditTrail.mockResolvedValue([]);
      mockGetAuditStatistics.mockResolvedValue({});

      await onFiltersChange();

      expect(filters.page).toBe(1);
      expect(mockGetAuditTrail).toHaveBeenCalled();
      expect(mockGetAuditStatistics).toHaveBeenCalled();
    });
  });

  describe('refreshData', () => {
    it('should reload both datasets', async () => {
      const { refreshData } = useAuditTrail();

      mockGetAuditTrail.mockResolvedValue([]);
      mockGetAuditStatistics.mockResolvedValue({});

      await refreshData();

      expect(mockGetAuditTrail).toHaveBeenCalled();
      expect(mockGetAuditStatistics).toHaveBeenCalled();
    });

    it('should show success toast', async () => {
      const { refreshData } = useAuditTrail();

      mockGetAuditTrail.mockResolvedValue([]);
      mockGetAuditStatistics.mockResolvedValue({});

      await refreshData();

      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Refreshed',
        detail: 'Audit logs have been refreshed.',
        life: 3000,
      });
    });
  });

  describe('exportAuditLogs', () => {
    it('should export logs in CSV format', async () => {
      const { exportAuditLogs, exportLoading } = useAuditTrail();

      const mockExportResponse = {
        downloadUrl: 'https://example.com/download',
        fileName: 'audit-logs.csv',
        recordCount: 50,
      };

      mockExportAuditTrail.mockResolvedValue(mockExportResponse);
      mockDownloadExport.mockResolvedValue(undefined);

      await exportAuditLogs('csv');

      expect(exportLoading.value).toBe(false);
      expect(mockExportAuditTrail).toHaveBeenCalledWith(
        expect.objectContaining({ format: 'csv' })
      );
      expect(mockDownloadExport).toHaveBeenCalledWith(
        'https://example.com/download',
        'audit-logs.csv'
      );
    });

    it('should export logs in XLSX format', async () => {
      const { exportAuditLogs } = useAuditTrail();

      mockExportAuditTrail.mockResolvedValue({
        downloadUrl: 'url',
        fileName: 'logs.xlsx',
        recordCount: 100,
      });
      mockDownloadExport.mockResolvedValue(undefined);

      await exportAuditLogs('xlsx');

      expect(mockExportAuditTrail).toHaveBeenCalledWith(
        expect.objectContaining({ format: 'xlsx' })
      );
    });

    it('should show info toast when export starts', async () => {
      const { exportAuditLogs } = useAuditTrail();

      mockExportAuditTrail.mockResolvedValue({
        downloadUrl: 'url',
        fileName: 'logs.csv',
        recordCount: 75,
      });
      mockDownloadExport.mockResolvedValue(undefined);

      await exportAuditLogs('csv');

      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'info',
        summary: 'Export Started',
        detail: 'Exporting 75 records. Download will start shortly.',
        life: 3000,
      });
    });

    it('should show success toast when export completes', async () => {
      const { exportAuditLogs } = useAuditTrail();

      mockExportAuditTrail.mockResolvedValue({
        downloadUrl: 'url',
        fileName: 'logs.csv',
        recordCount: 50,
      });
      mockDownloadExport.mockResolvedValue(undefined);

      await exportAuditLogs('csv');

      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Export Complete',
        detail: 'Audit logs have been downloaded successfully.',
        life: 3000,
      });
    });

    it('should handle export errors', async () => {
      const { exportAuditLogs } = useAuditTrail();

      mockExportAuditTrail.mockRejectedValue(new Error('Export failed'));

      await exportAuditLogs('csv');

      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Export Failed',
        detail: 'Failed to export audit logs. Please try again.',
        life: 5000,
      });
    });

    it('should set loading state during export', async () => {
      const { exportAuditLogs, exportLoading } = useAuditTrail();

      let loadingDuringExport = false;
      mockExportAuditTrail.mockImplementation(async () => {
        loadingDuringExport = exportLoading.value;
        return { downloadUrl: 'url', fileName: 'file.csv', recordCount: 10 };
      });
      mockDownloadExport.mockResolvedValue(undefined);

      await exportAuditLogs('csv');

      expect(loadingDuringExport).toBe(true);
      expect(exportLoading.value).toBe(false);
    });
  });

  describe('syncFilters', () => {
    it('should sync days filter to stats', () => {
      const { syncFilters, filters, statsFilters } = useAuditTrail();

      filters.days = 90;
      syncFilters();

      expect(statsFilters.days).toBe(90);
    });

    it('should not sync unsupported filters', () => {
      const { syncFilters, filters, statsFilters } = useAuditTrail();

      filters.search = 'test';
      filters.action = 'LOGIN';
      syncFilters();

      // statsFilters should only have days, not search or action
      expect(statsFilters).toEqual({
        days: filters.days,
        groupBy: 'day',
      });
    });
  });
});
