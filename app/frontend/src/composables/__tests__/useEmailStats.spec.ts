/**
 * useEmailStats Composable Unit Tests
 * Tests for email statistics and logs management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { nextTick } from 'vue';
import { useEmailStats } from '../useEmailStats';
import type { EmailLog, EmailStatsResponse, QueueStatsResponse } from '@/types/email';

// Mock email API service
const mockGetEmailLogs = vi.fn();
const mockGetEmailStats = vi.fn();
const mockGetQueueStats = vi.fn();
const mockGetEmailLogById = vi.fn();
const mockRetryFailedEmail = vi.fn();
const mockRetryQueuedEmail = vi.fn();
const mockSendTemplatedEmail = vi.fn();
const mockQueueEmail = vi.fn();

vi.mock('@/services/emailApiService', () => ({
  emailApiService: {
    getEmailLogs: (...args: any[]) => mockGetEmailLogs(...args),
    getEmailStats: (...args: any[]) => mockGetEmailStats(...args),
    getQueueStats: (...args: any[]) => mockGetQueueStats(...args),
    getEmailLogById: (...args: any[]) => mockGetEmailLogById(...args),
    retryFailedEmail: (...args: any[]) => mockRetryFailedEmail(...args),
    retryQueuedEmail: (...args: any[]) => mockRetryQueuedEmail(...args),
    sendTemplatedEmail: (...args: any[]) => mockSendTemplatedEmail(...args),
    queueEmail: (...args: any[]) => mockQueueEmail(...args),
  },
  EmailApiServiceError: class EmailApiServiceError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'EmailApiServiceError';
    }
  },
}));

// Mock PrimeVue toast
const mockToastAdd = vi.fn();
vi.mock('primevue/usetoast', () => ({
  useToast: () => ({
    add: mockToastAdd,
  }),
}));

describe('useEmailStats Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { logs, stats, queueStats, loading, error, pagination } = useEmailStats();

      expect(logs.value).toEqual([]);
      expect(stats.value).toBeNull();
      expect(queueStats.value).toBeNull();
      expect(loading.value).toBe(false);
      expect(error.value).toBeNull();
      expect(pagination.value).toEqual({
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
      });
    });

    it('should initialize filters as null', () => {
      const { filters } = useEmailStats();

      expect(filters.status).toBeNull();
      expect(filters.templateId).toBeNull();
      expect(filters.recipientEmail).toBeNull();
      expect(filters.dateFrom).toBeNull();
      expect(filters.dateTo).toBeNull();
    });
  });

  describe('Computed Properties', () => {
    it('should compute totalLogs from pagination', () => {
      const { totalLogs, fetchLogs } = useEmailStats();

      mockGetEmailLogs.mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 50, total: 125, totalPages: 3 },
      });

      fetchLogs().then(() => {
        expect(totalLogs.value).toBe(125);
      });
    });

    it('should compute sentEmails from stats', async () => {
      const { sentEmails, fetchStats } = useEmailStats();

      mockGetEmailStats.mockResolvedValue({
        sent: 450,
        failed: 25,
        successRate: 94.7,
      });

      await fetchStats();

      expect(sentEmails.value).toBe(450);
    });

    it('should compute failedEmails from stats', async () => {
      const { failedEmails, fetchStats } = useEmailStats();

      mockGetEmailStats.mockResolvedValue({
        sent: 450,
        failed: 25,
        successRate: 94.7,
      });

      await fetchStats();

      expect(failedEmails.value).toBe(25);
    });

    it('should compute successRate from stats', async () => {
      const { successRate, fetchStats } = useEmailStats();

      mockGetEmailStats.mockResolvedValue({
        sent: 450,
        failed: 25,
        successRate: 94.7,
      });

      await fetchStats();

      expect(successRate.value).toBe(94.7);
    });

    it('should return 0 for computed values when no stats', () => {
      const { sentEmails, failedEmails, successRate } = useEmailStats();

      expect(sentEmails.value).toBe(0);
      expect(failedEmails.value).toBe(0);
      expect(successRate.value).toBe(0);
    });
  });

  describe('fetchLogs', () => {
    it('should fetch logs successfully', async () => {
      const { fetchLogs, logs, pagination, loading } = useEmailStats();

      const mockLogs: EmailLog[] = [
        {
          id: '1',
          templateId: 'template-1',
          recipientEmail: 'user@example.com',
          status: 'SENT',
          subject: 'Test Email',
          sentAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockGetEmailLogs.mockResolvedValue({
        data: mockLogs,
        meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
      });

      await fetchLogs();

      expect(loading.value).toBe(false);
      expect(logs.value).toEqual(mockLogs);
      expect(pagination.value.total).toBe(1);
      expect(mockGetEmailLogs).toHaveBeenCalled();
    });

    it('should set loading state during fetch', async () => {
      const { fetchLogs, loading } = useEmailStats();

      let loadingDuringFetch = false;
      mockGetEmailLogs.mockImplementation(async () => {
        loadingDuringFetch = loading.value;
        return { data: [], meta: { page: 1, limit: 50, total: 0, totalPages: 0 } };
      });

      await fetchLogs();

      expect(loadingDuringFetch).toBe(true);
      expect(loading.value).toBe(false);
    });

    it('should handle errors and show toast', async () => {
      const { fetchLogs, error } = useEmailStats();

      mockGetEmailLogs.mockRejectedValue(new Error('Network error'));

      await fetchLogs();

      expect(error.value).toBe('Network error');
      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Fetch Email Logs Failed',
        detail: 'Network error',
        life: 5000,
      });
    });

    it('should include filters in query params', async () => {
      const { fetchLogs, filters } = useEmailStats();

      filters.status = 'SENT';
      filters.recipientEmail = 'test@example.com';

      mockGetEmailLogs.mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 50, total: 0, totalPages: 0 },
      });

      await fetchLogs();

      expect(mockGetEmailLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'SENT',
          recipientEmail: 'test@example.com',
        })
      );
    });

    it('should accept page and limit parameters', async () => {
      const { fetchLogs } = useEmailStats();

      mockGetEmailLogs.mockResolvedValue({
        data: [],
        meta: { page: 2, limit: 25, total: 100, totalPages: 4 },
      });

      await fetchLogs(2, 25);

      expect(mockGetEmailLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          limit: 25,
        })
      );
    });
  });

  describe('fetchStats', () => {
    it('should fetch statistics successfully', async () => {
      const { fetchStats, stats } = useEmailStats();

      const mockStats: EmailStatsResponse = {
        sent: 100,
        failed: 5,
        pending: 10,
        successRate: 95,
      };

      mockGetEmailStats.mockResolvedValue(mockStats);

      await fetchStats();

      expect(stats.value).toEqual(mockStats);
    });

    it('should accept date range parameters', async () => {
      const { fetchStats } = useEmailStats();

      mockGetEmailStats.mockResolvedValue({
        sent: 50,
        failed: 2,
        successRate: 96,
      });

      await fetchStats('2024-01-01', '2024-01-31');

      expect(mockGetEmailStats).toHaveBeenCalledWith('2024-01-01', '2024-01-31');
    });

    it('should handle errors silently (no toast)', async () => {
      const { fetchStats, stats } = useEmailStats();

      mockGetEmailStats.mockRejectedValue(new Error('Stats error'));

      await fetchStats();

      expect(stats.value).toBeNull();
      expect(mockToastAdd).not.toHaveBeenCalled();
    });
  });

  describe('fetchQueueStats', () => {
    it('should fetch queue statistics successfully', async () => {
      const { fetchQueueStats, queueStats } = useEmailStats();

      const mockQueueStats: QueueStatsResponse = {
        pending: 15,
        processing: 3,
        completed: 250,
        failed: 8,
      };

      mockGetQueueStats.mockResolvedValue(mockQueueStats);

      await fetchQueueStats();

      expect(queueStats.value).toEqual(mockQueueStats);
    });

    it('should handle errors silently (no toast)', async () => {
      const { fetchQueueStats, queueStats } = useEmailStats();

      mockGetQueueStats.mockRejectedValue(new Error('Queue error'));

      await fetchQueueStats();

      expect(queueStats.value).toBeNull();
      expect(mockToastAdd).not.toHaveBeenCalled();
    });
  });

  describe('getLogById', () => {
    it('should fetch specific log by ID', async () => {
      const { getLogById } = useEmailStats();

      const mockLog: EmailLog = {
        id: 'log-123',
        templateId: 'template-1',
        recipientEmail: 'user@example.com',
        status: 'SENT',
        subject: 'Test',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockGetEmailLogById.mockResolvedValue(mockLog);

      const result = await getLogById('log-123');

      expect(result).toEqual(mockLog);
      expect(mockGetEmailLogById).toHaveBeenCalledWith('log-123');
    });

    it('should handle errors and return null', async () => {
      const { getLogById } = useEmailStats();

      mockGetEmailLogById.mockRejectedValue(new Error('Log not found'));

      const result = await getLogById('invalid-id');

      expect(result).toBeNull();
      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          summary: 'Fetch Email Log Failed',
        })
      );
    });
  });

  describe('retryFailedEmail', () => {
    it('should retry failed email successfully', async () => {
      const { retryFailedEmail } = useEmailStats();

      mockRetryFailedEmail.mockResolvedValue({ success: true });
      mockGetEmailLogs.mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 50, total: 0, totalPages: 0 },
      });

      const result = await retryFailedEmail('log-123');

      expect(result).toBe(true);
      expect(mockRetryFailedEmail).toHaveBeenCalledWith('log-123');
      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Email Retried',
        detail: 'The email has been queued for retry.',
        life: 3000,
      });
    });

    it('should handle retry failure', async () => {
      const { retryFailedEmail } = useEmailStats();

      mockRetryFailedEmail.mockResolvedValue({
        success: false,
        error: 'Cannot retry email',
      });

      const result = await retryFailedEmail('log-123');

      expect(result).toBe(false);
      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          summary: 'Retry Email Failed',
        })
      );
    });

    it('should refresh logs after successful retry', async () => {
      const { retryFailedEmail } = useEmailStats();

      mockRetryFailedEmail.mockResolvedValue({ success: true });
      mockGetEmailLogs.mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 50, total: 0, totalPages: 0 },
      });

      await retryFailedEmail('log-123');

      expect(mockGetEmailLogs).toHaveBeenCalled();
    });
  });

  describe('retryQueuedEmail', () => {
    it('should retry queued email successfully', async () => {
      const { retryQueuedEmail } = useEmailStats();

      mockRetryQueuedEmail.mockResolvedValue(undefined);
      mockGetQueueStats.mockResolvedValue({
        pending: 10,
        processing: 2,
        completed: 100,
        failed: 5,
      });

      const result = await retryQueuedEmail('queue-123');

      expect(result).toBe(true);
      expect(mockRetryQueuedEmail).toHaveBeenCalledWith('queue-123');
      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Queued Email Retried',
        detail: 'The queued email has been reset for retry.',
        life: 3000,
      });
    });

    it('should refresh queue stats after retry', async () => {
      const { retryQueuedEmail } = useEmailStats();

      mockRetryQueuedEmail.mockResolvedValue(undefined);
      mockGetQueueStats.mockResolvedValue({
        pending: 10,
        processing: 2,
        completed: 100,
        failed: 5,
      });

      await retryQueuedEmail('queue-123');

      expect(mockGetQueueStats).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      const { retryQueuedEmail } = useEmailStats();

      mockRetryQueuedEmail.mockRejectedValue(new Error('Retry failed'));

      const result = await retryQueuedEmail('queue-123');

      expect(result).toBe(false);
      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          summary: 'Retry Queued Email Failed',
        })
      );
    });
  });

  describe('sendTemplatedEmail', () => {
    it('should send templated email successfully', async () => {
      const { sendTemplatedEmail } = useEmailStats();

      const emailData = {
        templateId: 'template-1',
        recipientEmail: 'user@example.com',
        variables: { name: 'John' },
      };

      mockSendTemplatedEmail.mockResolvedValue({
        success: true,
        messageId: 'msg-123',
      });
      mockGetEmailLogs.mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 50, total: 0, totalPages: 0 },
      });
      mockGetEmailStats.mockResolvedValue({
        sent: 1,
        failed: 0,
        successRate: 100,
      });

      const result = await sendTemplatedEmail(emailData);

      expect(result).toEqual({ success: true, messageId: 'msg-123' });
      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Email Sent',
        detail: 'Email sent successfully to user@example.com.',
        life: 3000,
      });
    });

    it('should refresh logs and stats after sending', async () => {
      const { sendTemplatedEmail } = useEmailStats();

      mockSendTemplatedEmail.mockResolvedValue({ success: true });
      mockGetEmailLogs.mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 50, total: 0, totalPages: 0 },
      });
      mockGetEmailStats.mockResolvedValue({ sent: 1, failed: 0, successRate: 100 });

      await sendTemplatedEmail({
        templateId: 'template-1',
        recipientEmail: 'user@example.com',
        variables: {},
      });

      expect(mockGetEmailLogs).toHaveBeenCalled();
      expect(mockGetEmailStats).toHaveBeenCalled();
    });

    it('should handle send failure', async () => {
      const { sendTemplatedEmail } = useEmailStats();

      mockSendTemplatedEmail.mockResolvedValue({
        success: false,
        error: 'Invalid template',
      });

      const result = await sendTemplatedEmail({
        templateId: 'invalid',
        recipientEmail: 'user@example.com',
        variables: {},
      });

      expect(result).toBeNull();
      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          summary: 'Send Email Failed',
        })
      );
    });
  });

  describe('queueEmail', () => {
    it('should queue email successfully', async () => {
      const { queueEmail } = useEmailStats();

      const emailData = {
        templateId: 'template-1',
        recipientEmail: 'user@example.com',
        variables: {},
        scheduledFor: new Date(),
      };

      mockQueueEmail.mockResolvedValue({
        id: 'queue-123',
        status: 'PENDING',
        ...emailData,
      });
      mockGetQueueStats.mockResolvedValue({
        pending: 11,
        processing: 0,
        completed: 100,
        failed: 0,
      });

      const result = await queueEmail(emailData);

      expect(result).toBeDefined();
      expect(result?.id).toBe('queue-123');
      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Email Queued',
        detail: 'Email queued for user@example.com.',
        life: 3000,
      });
    });

    it('should refresh queue stats after queuing', async () => {
      const { queueEmail } = useEmailStats();

      mockQueueEmail.mockResolvedValue({
        id: 'queue-123',
        status: 'PENDING',
      });
      mockGetQueueStats.mockResolvedValue({
        pending: 11,
        processing: 0,
        completed: 100,
        failed: 0,
      });

      await queueEmail({
        templateId: 'template-1',
        recipientEmail: 'user@example.com',
        variables: {},
      });

      expect(mockGetQueueStats).toHaveBeenCalled();
    });

    it('should handle queue errors', async () => {
      const { queueEmail } = useEmailStats();

      mockQueueEmail.mockRejectedValue(new Error('Queue full'));

      const result = await queueEmail({
        templateId: 'template-1',
        recipientEmail: 'user@example.com',
        variables: {},
      });

      expect(result).toBeNull();
      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          summary: 'Queue Email Failed',
        })
      );
    });
  });

  describe('refreshData', () => {
    it('should refresh all data sources', async () => {
      const { refreshData } = useEmailStats();

      mockGetEmailLogs.mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 50, total: 0, totalPages: 0 },
      });
      mockGetEmailStats.mockResolvedValue({ sent: 100, failed: 5, successRate: 95 });
      mockGetQueueStats.mockResolvedValue({
        pending: 10,
        processing: 2,
        completed: 100,
        failed: 5,
      });

      await refreshData();

      expect(mockGetEmailLogs).toHaveBeenCalled();
      expect(mockGetEmailStats).toHaveBeenCalled();
      expect(mockGetQueueStats).toHaveBeenCalled();
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      mockGetEmailLogs.mockResolvedValue({
        data: [],
        meta: { page: 2, limit: 50, total: 150, totalPages: 3 },
      });
    });

    it('should go to next page', async () => {
      const emailStats = useEmailStats();
      const { nextPage, fetchLogs, pagination } = emailStats;

      // Set initial state to page 1
      mockGetEmailLogs.mockResolvedValueOnce({
        data: [],
        meta: { page: 1, limit: 50, total: 150, totalPages: 3 },
      });

      await fetchLogs();

      // Verify initial state
      expect(pagination.value.page).toBe(1);
      expect(pagination.value.totalPages).toBe(3);

      // Mock next page response
      mockGetEmailLogs.mockResolvedValueOnce({
        data: [],
        meta: { page: 2, limit: 50, total: 150, totalPages: 3 },
      });

      await nextPage();

      expect(mockGetEmailLogs).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 2 })
      );
    });

    it('should not go beyond last page', async () => {
      const emailStats = useEmailStats();
      const { nextPage, fetchLogs, pagination } = emailStats;

      // Set to page 2 first
      mockGetEmailLogs.mockResolvedValueOnce({
        data: [],
        meta: { page: 2, limit: 50, total: 150, totalPages: 3 },
      });

      await fetchLogs(2);

      // Now set to last page (page 3)
      mockGetEmailLogs.mockResolvedValueOnce({
        data: [],
        meta: { page: 3, limit: 50, total: 150, totalPages: 3 },
      });

      await fetchLogs(3);

      // Verify we're on last page
      expect(pagination.value.page).toBe(3);
      expect(pagination.value.totalPages).toBe(3);

      const callsBefore = mockGetEmailLogs.mock.calls.length;

      // Try to go next from last page - should not call API
      await nextPage();

      expect(mockGetEmailLogs.mock.calls.length).toBe(callsBefore);
    });

    it('should go to previous page', async () => {
      const { prevPage, fetchLogs } = useEmailStats();

      mockGetEmailLogs.mockResolvedValueOnce({
        data: [],
        meta: { page: 2, limit: 50, total: 150, totalPages: 3 },
      });
      await fetchLogs(2);

      mockGetEmailLogs.mockResolvedValueOnce({
        data: [],
        meta: { page: 1, limit: 50, total: 150, totalPages: 3 },
      });

      await prevPage();

      expect(mockGetEmailLogs).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 1 })
      );
    });

    it('should not go below page 1', async () => {
      const emailStats = useEmailStats();
      const { prevPage, fetchLogs, pagination } = emailStats;

      // Set to first page
      mockGetEmailLogs.mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 50, total: 150, totalPages: 3 },
      });

      await fetchLogs(1);

      // Verify we're on first page
      expect(pagination.value.page).toBe(1);

      const callsBefore = mockGetEmailLogs.mock.calls.length;

      // Try to go previous from first page
      await prevPage();

      // Should not make additional API call
      expect(mockGetEmailLogs.mock.calls.length).toBe(callsBefore);
    });

    it('should go to specific page', async () => {
      const { goToPage, fetchLogs } = useEmailStats();

      // First set up pagination state
      mockGetEmailLogs.mockResolvedValueOnce({
        data: [],
        meta: { page: 1, limit: 50, total: 150, totalPages: 3 },
      });

      await fetchLogs(1);

      // Now go to page 2
      mockGetEmailLogs.mockResolvedValueOnce({
        data: [],
        meta: { page: 2, limit: 50, total: 150, totalPages: 3 },
      });

      await goToPage(2);

      expect(mockGetEmailLogs).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 2 })
      );
    });

    it('should not navigate to invalid page', async () => {
      const { goToPage, fetchLogs } = useEmailStats();

      // Set up pagination state
      mockGetEmailLogs.mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 50, total: 150, totalPages: 3 },
      });

      await fetchLogs();

      vi.clearAllMocks();

      // Try to go to page 10 (doesn't exist, max is 3)
      await goToPage(10);

      expect(mockGetEmailLogs).not.toHaveBeenCalled();
    });

    it('should set page size', async () => {
      const { setPageSize } = useEmailStats();

      mockGetEmailLogs.mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 25, total: 150, totalPages: 6 },
      });

      await setPageSize(25);

      expect(mockGetEmailLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          limit: 25,
        })
      );
    });
  });

  describe('Filters', () => {
    it('should clear all filters', () => {
      const { filters, clearFilters } = useEmailStats();

      filters.status = 'SENT';
      filters.templateId = 'template-1';
      filters.recipientEmail = 'test@example.com';
      filters.dateFrom = '2024-01-01';
      filters.dateTo = '2024-01-31';

      clearFilters();

      expect(filters.status).toBeNull();
      expect(filters.templateId).toBeNull();
      expect(filters.recipientEmail).toBeNull();
      expect(filters.dateFrom).toBeNull();
      expect(filters.dateTo).toBeNull();
    });

    it('should clear error when filters change', async () => {
      const { filters, error, fetchLogs } = useEmailStats();

      mockGetEmailLogs.mockRejectedValueOnce(new Error('Initial error'));
      await fetchLogs();

      expect(error.value).toBe('Initial error');

      // Change filter
      filters.status = 'SENT';
      await nextTick();

      expect(error.value).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle EmailApiServiceError', async () => {
      const { fetchLogs, error } = useEmailStats();

      const EmailApiServiceError = class extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'EmailApiServiceError';
        }
      };

      mockGetEmailLogs.mockRejectedValue(
        new EmailApiServiceError('API service error')
      );

      await fetchLogs();

      expect(error.value).toBe('API service error');
    });

    it('should handle generic errors', async () => {
      const { fetchLogs } = useEmailStats();

      mockGetEmailLogs.mockRejectedValue({ message: 'Unknown error' });

      await fetchLogs();

      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: 'Unknown error',
        })
      );
    });

    it('should handle errors without message', async () => {
      const { fetchLogs } = useEmailStats();

      mockGetEmailLogs.mockRejectedValue({});

      await fetchLogs();

      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: 'An unexpected error occurred',
        })
      );
    });
  });

  describe('Readonly State', () => {
    it('should expose readonly refs', () => {
      const { logs, stats, loading, error } = useEmailStats();

      // These should be readonly - TypeScript will enforce this
      expect(logs.value).toBeDefined();
      expect(stats.value).toBeDefined();
      expect(loading.value).toBeDefined();
      expect(error.value).toBeDefined();
    });
  });
});
