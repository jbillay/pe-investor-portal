/**
 * Email Statistics and Logs Composable
 * Provides reactive state management for email logs, statistics, and queue monitoring
 * Follows Vue.js 3 Composition API best practices with proper error handling
 */

import { ref, computed, reactive, watch, readonly, toRef, type Ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import { emailApiService, EmailApiServiceError } from '@/services/emailApiService';
import type {
  EmailLog,
  EmailQueue,
  EmailStatus,
  EmailQueueStatus,
  QueryEmailLogsDto,
  EmailStatsResponse,
  QueueStatsResponse,
  PaginatedResponse,
  SendTemplatedEmailDto,
  QueueEmailDto,
  EmailSendResult,
} from '@/types/email';

/**
 * Email log filters interface
 */
interface LogFilters {
  status: EmailStatus | null;
  templateId: string | null;
  recipientEmail: string | null;
  dateFrom: string | null;
  dateTo: string | null;
}

/**
 * Email statistics state interface
 */
interface EmailStatsState {
  logs: EmailLog[];
  stats: EmailStatsResponse | null;
  queueStats: QueueStatsResponse | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  lastUpdated: Date | null;
}

/**
 * Email stats composable return type
 */
interface UseEmailStatsReturn {
  // State
  logs: Readonly<Ref<EmailLog[]>>;
  stats: Readonly<Ref<EmailStatsResponse | null>>;
  queueStats: Readonly<Ref<QueueStatsResponse | null>>;
  loading: Readonly<Ref<boolean>>;
  error: Readonly<Ref<string | null>>;
  pagination: Readonly<Ref<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }>>;
  lastUpdated: Readonly<Ref<Date | null>>;

  // Computed
  totalLogs: Readonly<Ref<number>>;
  sentEmails: Readonly<Ref<number>>;
  failedEmails: Readonly<Ref<number>>;
  successRate: Readonly<Ref<number>>;

  // Filters
  filters: LogFilters;
  clearFilters: () => void;

  // Actions
  fetchLogs: (page?: number, limit?: number) => Promise<void>;
  fetchStats: (dateFrom?: string, dateTo?: string) => Promise<void>;
  fetchQueueStats: () => Promise<void>;
  getLogById: (logId: string) => Promise<EmailLog | null>;
  retryFailedEmail: (logId: string) => Promise<boolean>;
  retryQueuedEmail: (queueId: string) => Promise<boolean>;
  sendTemplatedEmail: (emailData: SendTemplatedEmailDto) => Promise<EmailSendResult | null>;
  queueEmail: (emailData: QueueEmailDto) => Promise<EmailQueue | null>;
  refreshData: () => Promise<void>;

  // Utilities
  nextPage: () => Promise<void>;
  prevPage: () => Promise<void>;
  goToPage: (page: number) => Promise<void>;
  setPageSize: (limit: number) => Promise<void>;
}

/**
 * Create email statistics and logs management composable
 * Provides centralized state management for email monitoring operations
 */
export function useEmailStats(): UseEmailStatsReturn {
  // Composables
  const toast = useToast();

  // Reactive state
  const state = reactive<EmailStatsState>({
    logs: [],
    stats: null,
    queueStats: null,
    loading: false,
    error: null,
    pagination: {
      page: 1,
      limit: 50,
      total: 0,
      totalPages: 0,
    },
    lastUpdated: null
  });

  // Reactive filters
  const filters = reactive<LogFilters>({
    status: null,
    templateId: null,
    recipientEmail: null,
    dateFrom: null,
    dateTo: null,
  });

  // Computed properties
  const totalLogs = computed(() => state.pagination.total);
  const sentEmails = computed(() => state.stats?.sent || 0);
  const failedEmails = computed(() => state.stats?.failed || 0);
  const successRate = computed(() => state.stats?.successRate || 0);

  /**
   * Error handling utility
   */
  const handleError = (error: any, operation: string) => {
    console.error(`Error in ${operation}:`, error);

    let errorMessage = 'An unexpected error occurred';

    if (error instanceof EmailApiServiceError) {
      errorMessage = error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    state.error = errorMessage;
    toast.add({
      severity: 'error',
      summary: `${operation} Failed`,
      detail: errorMessage,
      life: 5000
    });
  };

  /**
   * Success notification utility
   */
  const showSuccess = (message: string, detail?: string) => {
    toast.add({
      severity: 'success',
      summary: message,
      detail: detail,
      life: 3000
    });
  };

  /**
   * Builds query params from filters
   */
  const buildQueryParams = (page?: number, limit?: number): QueryEmailLogsDto => {
    return {
      page: page || state.pagination.page,
      limit: limit || state.pagination.limit,
      status: filters.status || undefined,
      templateId: filters.templateId || undefined,
      recipientEmail: filters.recipientEmail || undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
    };
  };

  /**
   * Fetches email logs from the API
   */
  const fetchLogs = async (page?: number, limit?: number): Promise<void> => {
    try {
      state.loading = true;
      state.error = null;

      const queryParams = buildQueryParams(page, limit);
      const response = await emailApiService.getEmailLogs(queryParams);

      state.logs = response.data;
      state.pagination = response.meta;
      state.lastUpdated = new Date();

    } catch (error) {
      handleError(error, 'Fetch Email Logs');
    } finally {
      state.loading = false;
    }
  };

  /**
   * Fetches email statistics
   */
  const fetchStats = async (dateFrom?: string, dateTo?: string): Promise<void> => {
    try {
      const stats = await emailApiService.getEmailStats(dateFrom, dateTo);
      state.stats = stats;
    } catch (error) {
      console.warn('Failed to fetch email stats:', error);
      // Don't show error toast for stats
    }
  };

  /**
   * Fetches queue statistics
   */
  const fetchQueueStats = async (): Promise<void> => {
    try {
      const queueStats = await emailApiService.getQueueStats();
      state.queueStats = queueStats;
    } catch (error) {
      console.warn('Failed to fetch queue stats:', error);
      // Don't show error toast for queue stats
    }
  };

  /**
   * Gets a specific email log by ID
   */
  const getLogById = async (logId: string): Promise<EmailLog | null> => {
    try {
      state.loading = true;
      state.error = null;

      const log = await emailApiService.getEmailLogById(logId);
      return log;
    } catch (error) {
      handleError(error, 'Fetch Email Log');
      return null;
    } finally {
      state.loading = false;
    }
  };

  /**
   * Retries a failed email
   */
  const retryFailedEmail = async (logId: string): Promise<boolean> => {
    try {
      state.loading = true;
      state.error = null;

      const result = await emailApiService.retryFailedEmail(logId);

      if (result.success) {
        showSuccess('Email Retried', 'The email has been queued for retry.');
        // Refresh logs to show updated status
        await fetchLogs();
        return true;
      } else {
        throw new Error(result.error || 'Failed to retry email');
      }
    } catch (error) {
      handleError(error, 'Retry Email');
      return false;
    } finally {
      state.loading = false;
    }
  };

  /**
   * Retries a queued email
   */
  const retryQueuedEmail = async (queueId: string): Promise<boolean> => {
    try {
      state.loading = true;
      state.error = null;

      await emailApiService.retryQueuedEmail(queueId);

      showSuccess('Queued Email Retried', 'The queued email has been reset for retry.');
      // Refresh queue stats
      await fetchQueueStats();
      return true;
    } catch (error) {
      handleError(error, 'Retry Queued Email');
      return false;
    } finally {
      state.loading = false;
    }
  };

  /**
   * Sends an email using a template
   */
  const sendTemplatedEmail = async (emailData: SendTemplatedEmailDto): Promise<EmailSendResult | null> => {
    try {
      state.loading = true;
      state.error = null;

      const result = await emailApiService.sendTemplatedEmail(emailData);

      if (result.success) {
        showSuccess('Email Sent', `Email sent successfully to ${emailData.recipientEmail}.`);
        // Refresh logs and stats
        await fetchLogs();
        await fetchStats();
        return result;
      } else {
        throw new Error(result.error || 'Failed to send email');
      }
    } catch (error) {
      handleError(error, 'Send Email');
      return null;
    } finally {
      state.loading = false;
    }
  };

  /**
   * Queues an email for later sending
   */
  const queueEmail = async (emailData: QueueEmailDto): Promise<EmailQueue | null> => {
    try {
      state.loading = true;
      state.error = null;

      const queuedItem = await emailApiService.queueEmail(emailData);

      showSuccess('Email Queued', `Email queued for ${emailData.recipientEmail}.`);
      // Refresh queue stats
      await fetchQueueStats();
      return queuedItem;
    } catch (error) {
      handleError(error, 'Queue Email');
      return null;
    } finally {
      state.loading = false;
    }
  };

  /**
   * Refreshes all data (logs, stats, queue stats)
   */
  const refreshData = async (): Promise<void> => {
    await Promise.all([
      fetchLogs(),
      fetchStats(),
      fetchQueueStats(),
    ]);
  };

  /**
   * Pagination: Next page
   */
  const nextPage = async (): Promise<void> => {
    if (state.pagination.page < state.pagination.totalPages) {
      await fetchLogs(state.pagination.page + 1);
    }
  };

  /**
   * Pagination: Previous page
   */
  const prevPage = async (): Promise<void> => {
    if (state.pagination.page > 1) {
      await fetchLogs(state.pagination.page - 1);
    }
  };

  /**
   * Pagination: Go to specific page
   */
  const goToPage = async (page: number): Promise<void> => {
    if (page >= 1 && page <= state.pagination.totalPages) {
      await fetchLogs(page);
    }
  };

  /**
   * Pagination: Set page size
   */
  const setPageSize = async (limit: number): Promise<void> => {
    await fetchLogs(1, limit);
  };

  /**
   * Utility: Clear all filters
   */
  const clearFilters = (): void => {
    filters.status = null;
    filters.templateId = null;
    filters.recipientEmail = null;
    filters.dateFrom = null;
    filters.dateTo = null;
  };

  // Watch for filter changes to refetch logs
  watch([
    () => filters.status,
    () => filters.templateId,
    () => filters.recipientEmail,
    () => filters.dateFrom,
    () => filters.dateTo
  ], () => {
    if (state.error) {
      state.error = null;
    }
    // Optionally auto-refresh when filters change
    // fetchLogs(1); // Uncomment to enable auto-refresh
  });

  // Return readonly refs and reactive objects
  return {
    // State (readonly)
    logs: readonly(toRef(state, 'logs')),
    stats: readonly(toRef(state, 'stats')),
    queueStats: readonly(toRef(state, 'queueStats')),
    loading: readonly(toRef(state, 'loading')),
    error: readonly(toRef(state, 'error')),
    pagination: readonly(toRef(state, 'pagination')),
    lastUpdated: readonly(toRef(state, 'lastUpdated')),

    // Computed (readonly)
    totalLogs: readonly(totalLogs),
    sentEmails: readonly(sentEmails),
    failedEmails: readonly(failedEmails),
    successRate: readonly(successRate),

    // Filters (reactive)
    filters,
    clearFilters,

    // Actions
    fetchLogs,
    fetchStats,
    fetchQueueStats,
    getLogById,
    retryFailedEmail,
    retryQueuedEmail,
    sendTemplatedEmail,
    queueEmail,
    refreshData,

    // Utilities
    nextPage,
    prevPage,
    goToPage,
    setPageSize,
  };
}
