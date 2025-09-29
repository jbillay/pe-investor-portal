import { ref, reactive, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import { auditTrailService } from '@/services/auditTrailService';
import type {
  AuditLogEntry,
  PaginatedAuditTrailResponse,
  AuditStatsResponse,
  AuditTrailQuery,
  AuditStatsQuery
} from '@/services/auditTrailService';

// Configuration constants
export const AUDIT_CONFIG = {
  DEFAULT_PAGE_SIZE: 100,
  DEBOUNCE_DELAY: 300,
  DATE_RANGES: [
    { label: 'Last hour', value: undefined, hours: 1 },
    { label: 'Last 24 hours', value: 1 },
    { label: 'Last 7 days', value: 7 },
    { label: 'Last 30 days', value: 30 },
    { label: 'Last 90 days', value: 90 },
    { label: 'Last 365 days', value: 365 },
  ],
  RETENTION_DAYS: 365
} as const;

export function useAuditTrail() {
  const toast = useToast();

  // State
  const loading = ref(false);
  const statsLoading = ref(false);
  const exportLoading = ref(false);
  const auditData = ref<PaginatedAuditTrailResponse | null>(null);
  const statsData = ref<AuditStatsResponse | null>(null);
  const transformedAuditLogs = ref<any[]>([]);
  const userOptions = ref<Array<{ label: string; value: string }>>([]);

  // Filters for audit trail API (with pagination)
  const filters = reactive<AuditTrailQuery>({
    search: '',
    action: undefined,
    resource: undefined,
    days: 7,
    userId: undefined,
    ipAddress: '',
    page: 1,
    limit: 20, // Fixed to 20 for DataTable pagination
    sortBy: 'createdAt',
    sortOrder: 'desc',
    includeSensitive: false
  });

  // Filters for statistics API (only supported parameters)
  const statsFilters = reactive<AuditStatsQuery>({
    days: 7,
    groupBy: 'day'
  });

  // Computed properties - using statistics data for totals (not paginated data)
  const totalEvents = computed(() => statsData.value?.summary?.totalEvents || 0);

  const successfulEvents = computed(() => {
    // Calculate successful events by subtracting failed from total
    const total = statsData.value?.summary?.totalEvents || 0;
    const failed = failedEvents.value;
    return Math.max(0, total - failed);
  });

  const failedEvents = computed(() => {
    // Sum up all security events as they represent failed/problematic events
    const secEvents = statsData.value?.securityEvents;
    if (!secEvents) return 0;

    return (secEvents.failedLogins || 0) +
           (secEvents.suspiciousActivity || 0) +
           (secEvents.accountLockouts || 0);
  });

  const securityEvents = computed(() => {
    // Return the same as failed events since they represent security issues
    return failedEvents.value;
  });

  // Transform audit log entry for display
  const transformAuditEntry = (entry: any, index: number) => {
    try {
      return {
        id: entry.id,
        userId: entry.userId,
        action: entry.action,
        resource: entry.resource,
        details: entry.details,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        createdAt: entry.createdAt,
        user: entry.user,
        // Additional computed fields for UI
        eventType: entry.action?.includes('LOGIN') ? 'AUTHENTICATION' : 'USER_MANAGEMENT',
        severity: entry.action?.includes('FAILED') || entry.action?.includes('SUSPICIOUS') ? 'HIGH' : 'LOW',
        status: entry.action?.includes('FAILED') ? 'FAILED' : 'SUCCESS',
        description: `${entry.action || 'Unknown action'} ${entry.resource ? 'on ' + entry.resource : ''}`,
        userDisplayName: entry.user
          ? `${entry.user.firstName || ''} ${entry.user.lastName || ''}`.trim() || entry.user.email
          : 'System',
      };
    } catch (error) {
      console.error(`Error transforming audit entry ${index}:`, error, entry);
      return null;
    }
  };

  // Synchronize filters between audit trail and statistics (only supported params)
  const syncFilters = () => {
    statsFilters.days = filters.days;
    // Note: Statistics API doesn't support other filters like search, action, etc.
    // It provides overall statistics for the time period
  };

  // Load audit logs (paginated for DataTable)
  const loadAuditLogs = async () => {
    loading.value = true;
    try {
      console.log('Loading audit logs with filters:', filters);
      const response = await auditTrailService.getAuditTrail(filters);
      console.log('API Response received', response);

      auditData.value = response;

      // Transform the audit logs for display
      transformedAuditLogs.value = (response || [])
        .map(transformAuditEntry)
        .filter(Boolean); // Remove any null entries

      console.log(`Successfully transformed ${transformedAuditLogs.value.length} audit log entries`);

      // Extract unique users for the filter dropdown (only from paginated data)
      const uniqueUsers = (response || [])
        .filter(entry => entry.user)
        .map(entry => ({
          label: entry.user!.firstName && entry.user!.lastName
            ? `${entry.user!.firstName} ${entry.user!.lastName} (${entry.user!.email})`
            : entry.user!.email,
          value: entry.user!.id
        }));

      // Remove duplicates and sort
      userOptions.value = uniqueUsers
        .filter((user, index, self) =>
          index === self.findIndex(u => u.value === user.value)
        )
        .sort((a, b) => a.label.localeCompare(b.label));

    } catch (error) {
      console.error('Error loading audit logs:', error);

      // Clear any existing data
      auditData.value = null;
      transformedAuditLogs.value = [];

      // Show appropriate error message based on error type
      let errorMessage = 'Failed to load audit logs. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('Network')) {
          errorMessage = 'Network error. Please check your connection.';
        } else if (error.message.includes('401')) {
          errorMessage = 'Session expired. Please log in again.';
        } else if (error.message.includes('403')) {
          errorMessage = 'Insufficient permissions to view audit logs.';
        }
      }

      toast.add({
        severity: 'error',
        summary: 'Failed to Load Audit Logs',
        detail: errorMessage,
        life: 5000
      });
    } finally {
      loading.value = false;
    }
  };

  // Load audit statistics (entire period, no pagination)
  const loadAuditStatistics = async () => {
    statsLoading.value = true;
    try {
      // Sync filters before loading statistics
      syncFilters();
      console.log('Loading audit statistics with filters:', statsFilters);
      const response = await auditTrailService.getAuditStatistics(statsFilters);
      console.log('Statistics API Response received', response);
      statsData.value = response;
    } catch (error) {
      console.error('Error loading audit statistics:', error);
      // Clear stats data on error
      statsData.value = null;
      // Don't show error toast for stats as it's secondary data
    } finally {
      statsLoading.value = false;
    }
  };

  // Reset filters
  const resetFilters = () => {
    Object.assign(filters, {
      search: '',
      action: undefined,
      resource: undefined,
      days: 7,
      userId: undefined,
      ipAddress: '',
      page: 1,
      limit: 20, // Fixed to 20 for DataTable pagination
      sortBy: 'createdAt',
      sortOrder: 'desc',
      includeSensitive: false
    });

    Object.assign(statsFilters, {
      days: 7,
      groupBy: 'day'
    });

    // Reload both datasets with reset filters
    Promise.all([loadAuditLogs(), loadAuditStatistics()]);
  };

  // Handle pagination changes
  const onPageChange = (event: any) => {
    filters.page = event.page + 1; // PrimeVue pagination is 0-based
    loadAuditLogs();
  };

  // Handle filters change (sync to statistics and reload both)
  const onFiltersChange = async () => {
    filters.page = 1; // Reset to first page when filters change
    await Promise.all([loadAuditLogs(), loadAuditStatistics()]);
  };

  // Refresh both logs and statistics
  const refreshData = async () => {
    await Promise.all([loadAuditLogs(), loadAuditStatistics()]);
    toast.add({
      severity: 'success',
      summary: 'Refreshed',
      detail: 'Audit logs have been refreshed.',
      life: 3000
    });
  };

  // Export audit logs
  const exportAuditLogs = async (format: 'csv' | 'xlsx' = 'csv') => {
    exportLoading.value = true;
    try {
      const exportRequest = {
        format,
        ...filters
      };

      const response = await auditTrailService.exportAuditTrail(exportRequest);

      toast.add({
        severity: 'info',
        summary: 'Export Started',
        detail: `Exporting ${response.recordCount} records. Download will start shortly.`,
        life: 3000
      });

      // Download the file
      await auditTrailService.downloadExport(response.downloadUrl, response.fileName);

      toast.add({
        severity: 'success',
        summary: 'Export Complete',
        detail: 'Audit logs have been downloaded successfully.',
        life: 3000
      });

    } catch (error) {
      console.error('Error exporting audit logs:', error);
      toast.add({
        severity: 'error',
        summary: 'Export Failed',
        detail: 'Failed to export audit logs. Please try again.',
        life: 5000
      });
    } finally {
      exportLoading.value = false;
    }
  };

  return {
    // State
    loading,
    statsLoading,
    exportLoading,
    auditData,
    statsData,
    transformedAuditLogs,
    userOptions,
    filters,
    statsFilters,

    // Computed
    totalEvents,
    successfulEvents,
    failedEvents,
    securityEvents,

    // Methods
    loadAuditLogs,
    loadAuditStatistics,
    resetFilters,
    refreshData,
    exportAuditLogs,
    onPageChange,
    onFiltersChange,
    syncFilters,

    // Configuration
    AUDIT_CONFIG
  };
}
