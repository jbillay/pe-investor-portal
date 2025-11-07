import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useEmailStats } from '../useEmailStats'
import { emailApiService } from '@/services/emailApiService'
import type { EmailLog, EmailStatsResponse, QueueStatsResponse, EmailStatus } from '@/types/email'

// Mock dependencies
vi.mock('primevue/usetoast', () => ({
  useToast: () => ({
    add: vi.fn(),
  }),
}))

vi.mock('@/services/emailApiService', () => ({
  emailApiService: {
    getEmailLogs: vi.fn(),
    getEmailStats: vi.fn(),
    getQueueStats: vi.fn(),
    getEmailLogById: vi.fn(),
    retryFailedEmail: vi.fn(),
    retryQueuedEmail: vi.fn(),
    sendTemplatedEmail: vi.fn(),
    queueEmail: vi.fn(),
  },
  EmailApiServiceError: class EmailApiServiceError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'EmailApiServiceError'
    }
  },
}))

describe('useEmailStats', () => {
  const mockLog: EmailLog = {
    id: '1',
    templateId: 'template-1',
    templateName: 'Welcome Email',
    recipientEmail: 'user@example.com',
    subject: 'Welcome',
    status: 'SENT' as EmailStatus,
    sentAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockLog2: EmailLog = {
    id: '2',
    templateId: 'template-2',
    templateName: 'Password Reset',
    recipientEmail: 'user2@example.com',
    subject: 'Reset Password',
    status: 'FAILED' as EmailStatus,
    error: 'SMTP error',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockStats: EmailStatsResponse = {
    sent: 100,
    failed: 10,
    pending: 5,
    total: 115,
    successRate: 87.0,
  }

  const mockQueueStats: QueueStatsResponse = {
    pending: 5,
    processing: 2,
    completed: 100,
    failed: 3,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should initialize with empty logs array', () => {
      const { logs } = useEmailStats()
      expect(logs.value).toEqual([])
    })

    it('should initialize with loading false', () => {
      const { loading } = useEmailStats()
      expect(loading.value).toBe(false)
    })

    it('should initialize with no error', () => {
      const { error } = useEmailStats()
      expect(error.value).toBeNull()
    })

    it('should initialize with null stats', () => {
      const { stats, queueStats } = useEmailStats()
      expect(stats.value).toBeNull()
      expect(queueStats.value).toBeNull()
    })

    it('should initialize pagination with default values', () => {
      const { pagination } = useEmailStats()
      expect(pagination.value).toEqual({
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
      })
    })
  })

  describe('fetchLogs', () => {
    it('should fetch logs successfully', async () => {
      const mockResponse = {
        data: [mockLog, mockLog2],
        meta: {
          page: 1,
          limit: 50,
          total: 2,
          totalPages: 1,
        },
      }
      vi.mocked(emailApiService.getEmailLogs).mockResolvedValue(mockResponse)

      const { fetchLogs, logs, pagination } = useEmailStats()
      await fetchLogs()

      expect(logs.value).toEqual([mockLog, mockLog2])
      expect(pagination.value).toEqual(mockResponse.meta)
    })

    it('should fetch logs with custom page and limit', async () => {
      const mockResponse = {
        data: [mockLog],
        meta: { page: 2, limit: 25, total: 50, totalPages: 2 },
      }
      vi.mocked(emailApiService.getEmailLogs).mockResolvedValue(mockResponse)

      const { fetchLogs } = useEmailStats()
      await fetchLogs(2, 25)

      expect(emailApiService.getEmailLogs).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2, limit: 25 })
      )
    })

    it('should include filters in query', async () => {
      const mockResponse = {
        data: [],
        meta: { page: 1, limit: 50, total: 0, totalPages: 0 },
      }
      vi.mocked(emailApiService.getEmailLogs).mockResolvedValue(mockResponse)

      const { fetchLogs, filters } = useEmailStats()
      filters.status = 'SENT' as EmailStatus
      filters.recipientEmail = 'test@example.com'

      await fetchLogs()

      expect(emailApiService.getEmailLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'SENT',
          recipientEmail: 'test@example.com',
        })
      )
    })

    it('should handle fetch error', async () => {
      const error = new Error('Failed to fetch logs')
      vi.mocked(emailApiService.getEmailLogs).mockRejectedValue(error)

      const { fetchLogs, error: errorState } = useEmailStats()
      await fetchLogs()

      expect(errorState.value).toBe('Failed to fetch logs')
    })

    it('should set lastUpdated after successful fetch', async () => {
      const mockResponse = {
        data: [mockLog],
        meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
      }
      vi.mocked(emailApiService.getEmailLogs).mockResolvedValue(mockResponse)

      const { fetchLogs, lastUpdated } = useEmailStats()
      const beforeFetch = new Date()
      await fetchLogs()

      expect(lastUpdated.value).toBeTruthy()
      expect(lastUpdated.value!.getTime()).toBeGreaterThanOrEqual(beforeFetch.getTime())
    })
  })

  describe('fetchStats', () => {
    it('should fetch stats successfully', async () => {
      vi.mocked(emailApiService.getEmailStats).mockResolvedValue(mockStats)

      const { fetchStats, stats } = useEmailStats()
      await fetchStats()

      expect(stats.value).toEqual(mockStats)
    })

    it('should fetch stats with date range', async () => {
      vi.mocked(emailApiService.getEmailStats).mockResolvedValue(mockStats)

      const { fetchStats } = useEmailStats()
      await fetchStats('2024-01-01', '2024-01-31')

      expect(emailApiService.getEmailStats).toHaveBeenCalledWith('2024-01-01', '2024-01-31')
    })

    it('should handle fetch stats error gracefully', async () => {
      const error = new Error('Failed to fetch stats')
      vi.mocked(emailApiService.getEmailStats).mockRejectedValue(error)

      const { fetchStats, error: errorState } = useEmailStats()
      await fetchStats()

      // Should not set error state
      expect(errorState.value).toBeNull()
    })
  })

  describe('fetchQueueStats', () => {
    it('should fetch queue stats successfully', async () => {
      vi.mocked(emailApiService.getQueueStats).mockResolvedValue(mockQueueStats)

      const { fetchQueueStats, queueStats } = useEmailStats()
      await fetchQueueStats()

      expect(queueStats.value).toEqual(mockQueueStats)
    })

    it('should handle fetch queue stats error gracefully', async () => {
      const error = new Error('Failed to fetch queue stats')
      vi.mocked(emailApiService.getQueueStats).mockRejectedValue(error)

      const { fetchQueueStats, error: errorState } = useEmailStats()
      await fetchQueueStats()

      // Should not set error state
      expect(errorState.value).toBeNull()
    })
  })

  describe('getLogById', () => {
    it('should get log by ID successfully', async () => {
      vi.mocked(emailApiService.getEmailLogById).mockResolvedValue(mockLog)

      const { getLogById } = useEmailStats()
      const result = await getLogById('1')

      expect(result).toEqual(mockLog)
      expect(emailApiService.getEmailLogById).toHaveBeenCalledWith('1')
    })

    it('should handle get log error', async () => {
      const error = new Error('Log not found')
      vi.mocked(emailApiService.getEmailLogById).mockRejectedValue(error)

      const { getLogById } = useEmailStats()
      const result = await getLogById('999')

      expect(result).toBeNull()
    })
  })

  describe('retryFailedEmail', () => {
    it('should retry failed email successfully', async () => {
      vi.mocked(emailApiService.retryFailedEmail).mockResolvedValue({ success: true, messageId: 'msg-123' })
      vi.mocked(emailApiService.getEmailLogs).mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 50, total: 0, totalPages: 0 },
      })

      const { retryFailedEmail } = useEmailStats()
      const result = await retryFailedEmail('1')

      expect(result).toBe(true)
      expect(emailApiService.retryFailedEmail).toHaveBeenCalledWith('1')
    })

    it('should handle unsuccessful retry result', async () => {
      vi.mocked(emailApiService.retryFailedEmail).mockResolvedValue({
        success: false,
        error: 'Retry limit exceeded',
      })

      const { retryFailedEmail } = useEmailStats()
      const result = await retryFailedEmail('1')

      expect(result).toBe(false)
    })

    it('should handle retry error', async () => {
      const error = new Error('Retry failed')
      vi.mocked(emailApiService.retryFailedEmail).mockRejectedValue(error)

      const { retryFailedEmail } = useEmailStats()
      const result = await retryFailedEmail('1')

      expect(result).toBe(false)
    })
  })

  describe('retryQueuedEmail', () => {
    it('should retry queued email successfully', async () => {
      vi.mocked(emailApiService.retryQueuedEmail).mockResolvedValue(undefined)
      vi.mocked(emailApiService.getQueueStats).mockResolvedValue(mockQueueStats)

      const { retryQueuedEmail } = useEmailStats()
      const result = await retryQueuedEmail('queue-1')

      expect(result).toBe(true)
      expect(emailApiService.retryQueuedEmail).toHaveBeenCalledWith('queue-1')
    })

    it('should handle retry queued email error', async () => {
      const error = new Error('Queue retry failed')
      vi.mocked(emailApiService.retryQueuedEmail).mockRejectedValue(error)

      const { retryQueuedEmail } = useEmailStats()
      const result = await retryQueuedEmail('queue-1')

      expect(result).toBe(false)
    })
  })

  describe('sendTemplatedEmail', () => {
    it('should send templated email successfully', async () => {
      vi.mocked(emailApiService.sendTemplatedEmail).mockResolvedValue({
        success: true,
        messageId: 'msg-123',
      })
      vi.mocked(emailApiService.getEmailLogs).mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 50, total: 0, totalPages: 0 },
      })
      vi.mocked(emailApiService.getEmailStats).mockResolvedValue(mockStats)

      const { sendTemplatedEmail } = useEmailStats()
      const emailData = {
        templateId: 'template-1',
        recipientEmail: 'test@example.com',
        variables: { name: 'John' },
      }
      const result = await sendTemplatedEmail(emailData)

      expect(result?.success).toBe(true)
      expect(emailApiService.sendTemplatedEmail).toHaveBeenCalledWith(emailData)
    })

    it('should handle unsuccessful send result', async () => {
      vi.mocked(emailApiService.sendTemplatedEmail).mockResolvedValue({
        success: false,
        error: 'Invalid template',
      })

      const { sendTemplatedEmail } = useEmailStats()
      const result = await sendTemplatedEmail({
        templateId: 'invalid',
        recipientEmail: 'test@example.com',
      })

      expect(result).toBeNull()
    })

    it('should handle send email error', async () => {
      const error = new Error('Send failed')
      vi.mocked(emailApiService.sendTemplatedEmail).mockRejectedValue(error)

      const { sendTemplatedEmail } = useEmailStats()
      const result = await sendTemplatedEmail({
        templateId: 'template-1',
        recipientEmail: 'test@example.com',
      })

      expect(result).toBeNull()
    })
  })

  describe('queueEmail', () => {
    it('should queue email successfully', async () => {
      const mockQueue = {
        id: 'queue-1',
        templateId: 'template-1',
        recipientEmail: 'test@example.com',
        status: 'PENDING' as const,
        createdAt: new Date(),
      }
      vi.mocked(emailApiService.queueEmail).mockResolvedValue(mockQueue)
      vi.mocked(emailApiService.getQueueStats).mockResolvedValue(mockQueueStats)

      const { queueEmail } = useEmailStats()
      const emailData = {
        templateId: 'template-1',
        recipientEmail: 'test@example.com',
        scheduledFor: new Date(),
      }
      const result = await queueEmail(emailData)

      expect(result).toEqual(mockQueue)
      expect(emailApiService.queueEmail).toHaveBeenCalledWith(emailData)
    })

    it('should handle queue email error', async () => {
      const error = new Error('Queue failed')
      vi.mocked(emailApiService.queueEmail).mockRejectedValue(error)

      const { queueEmail } = useEmailStats()
      const result = await queueEmail({
        templateId: 'template-1',
        recipientEmail: 'test@example.com',
      })

      expect(result).toBeNull()
    })
  })

  describe('Computed Properties', () => {
    it('should compute totalLogs from pagination', async () => {
      const mockResponse = {
        data: [mockLog],
        meta: { page: 1, limit: 50, total: 100, totalPages: 2 },
      }
      vi.mocked(emailApiService.getEmailLogs).mockResolvedValue(mockResponse)

      const { fetchLogs, totalLogs } = useEmailStats()
      await fetchLogs()

      expect(totalLogs.value).toBe(100)
    })

    it('should compute sentEmails from stats', async () => {
      vi.mocked(emailApiService.getEmailStats).mockResolvedValue(mockStats)

      const { fetchStats, sentEmails } = useEmailStats()
      await fetchStats()

      expect(sentEmails.value).toBe(100)
    })

    it('should compute failedEmails from stats', async () => {
      vi.mocked(emailApiService.getEmailStats).mockResolvedValue(mockStats)

      const { fetchStats, failedEmails } = useEmailStats()
      await fetchStats()

      expect(failedEmails.value).toBe(10)
    })

    it('should compute successRate from stats', async () => {
      vi.mocked(emailApiService.getEmailStats).mockResolvedValue(mockStats)

      const { fetchStats, successRate } = useEmailStats()
      await fetchStats()

      expect(successRate.value).toBe(87.0)
    })

    it('should return 0 for computed values when no stats', () => {
      const { sentEmails, failedEmails, successRate } = useEmailStats()

      expect(sentEmails.value).toBe(0)
      expect(failedEmails.value).toBe(0)
      expect(successRate.value).toBe(0)
    })
  })

  describe('Pagination', () => {
    beforeEach(() => {
      const mockResponse = {
        data: [mockLog],
        meta: { page: 2, limit: 50, total: 150, totalPages: 3 },
      }
      vi.mocked(emailApiService.getEmailLogs).mockResolvedValue(mockResponse)
    })

    it('should go to next page', async () => {
      const { fetchLogs, nextPage } = useEmailStats()
      await fetchLogs(2)

      await nextPage()

      expect(emailApiService.getEmailLogs).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 3 })
      )
    })

    it('should not go to next page if on last page', async () => {
      const mockResponse = {
        data: [mockLog],
        meta: { page: 3, limit: 50, total: 150, totalPages: 3 },
      }
      vi.mocked(emailApiService.getEmailLogs).mockResolvedValue(mockResponse)

      const { fetchLogs, nextPage } = useEmailStats()
      await fetchLogs(3)

      vi.clearAllMocks()
      await nextPage()

      expect(emailApiService.getEmailLogs).not.toHaveBeenCalled()
    })

    it('should go to previous page', async () => {
      const { fetchLogs, prevPage } = useEmailStats()
      await fetchLogs(2)

      await prevPage()

      expect(emailApiService.getEmailLogs).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 1 })
      )
    })

    it('should not go to previous page if on first page', async () => {
      const mockResponse = {
        data: [mockLog],
        meta: { page: 1, limit: 50, total: 150, totalPages: 3 },
      }
      vi.mocked(emailApiService.getEmailLogs).mockResolvedValue(mockResponse)

      const { fetchLogs, prevPage } = useEmailStats()
      await fetchLogs(1)

      vi.clearAllMocks()
      await prevPage()

      expect(emailApiService.getEmailLogs).not.toHaveBeenCalled()
    })

    it('should go to specific page', async () => {
      const { fetchLogs, goToPage } = useEmailStats()
      await fetchLogs(2)

      await goToPage(1)

      expect(emailApiService.getEmailLogs).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 1 })
      )
    })

    it('should not go to page outside valid range', async () => {
      const mockResponse = {
        data: [mockLog],
        meta: { page: 2, limit: 50, total: 150, totalPages: 3 },
      }
      vi.mocked(emailApiService.getEmailLogs).mockResolvedValue(mockResponse)

      const { fetchLogs, goToPage } = useEmailStats()
      await fetchLogs(2)

      vi.clearAllMocks()
      await goToPage(0)
      expect(emailApiService.getEmailLogs).not.toHaveBeenCalled()

      await goToPage(4)
      expect(emailApiService.getEmailLogs).not.toHaveBeenCalled()
    })

    it('should set page size and reset to page 1', async () => {
      const { fetchLogs, setPageSize } = useEmailStats()
      await fetchLogs(2)

      await setPageSize(100)

      expect(emailApiService.getEmailLogs).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 1, limit: 100 })
      )
    })
  })

  describe('Filters', () => {
    it('should clear all filters', () => {
      const { filters, clearFilters } = useEmailStats()

      filters.status = 'SENT' as EmailStatus
      filters.templateId = 'template-1'
      filters.recipientEmail = 'test@example.com'
      filters.dateFrom = '2024-01-01'
      filters.dateTo = '2024-01-31'

      clearFilters()

      expect(filters.status).toBeNull()
      expect(filters.templateId).toBeNull()
      expect(filters.recipientEmail).toBeNull()
      expect(filters.dateFrom).toBeNull()
      expect(filters.dateTo).toBeNull()
    })
  })

  describe('refreshData', () => {
    it('should refresh all data', async () => {
      vi.mocked(emailApiService.getEmailLogs).mockResolvedValue({
        data: [mockLog],
        meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
      })
      vi.mocked(emailApiService.getEmailStats).mockResolvedValue(mockStats)
      vi.mocked(emailApiService.getQueueStats).mockResolvedValue(mockQueueStats)

      const { refreshData, logs, stats, queueStats } = useEmailStats()
      await refreshData()

      expect(logs.value).toEqual([mockLog])
      expect(stats.value).toEqual(mockStats)
      expect(queueStats.value).toEqual(mockQueueStats)
    })
  })
})
