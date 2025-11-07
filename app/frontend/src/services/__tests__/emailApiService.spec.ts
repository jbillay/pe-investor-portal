import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type {
  SendEmailDto,
  SendTemplatedEmailDto,
  QueueEmailDto,
  EmailSendResult,
  EmailLog,
  EmailQueue,
  QueryEmailLogsDto,
  EmailStatsResponse,
  QueueStatsResponse,
  PaginatedResponse
} from '@/types/email';

// Mock the API client
vi.mock('@/composables/useApi', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}));

import { EmailApiService, EmailApiServiceError, emailApiService } from '../emailApiService';
import { apiClient as mockApiClient } from '@/composables/useApi';

describe('EmailApiServiceError', () => {
  it('should create error with message, code, and details', () => {
    const error = new EmailApiServiceError('Test error', 'TEST_CODE', { foo: 'bar' });

    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.details).toEqual({ foo: 'bar' });
    expect(error.name).toBe('EmailApiServiceError');
  });

  it('should create error without details', () => {
    const error = new EmailApiServiceError('Test error', 'TEST_CODE');

    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.details).toBeUndefined();
  });
});

describe('EmailApiService', () => {
  let service: EmailApiService;

  const mockEmailSendResult: EmailSendResult = {
    success: true,
    messageId: 'msg-123',
    provider: 'smtp'
  };

  const mockEmailLog: EmailLog = {
    id: 'log-1',
    templateId: 'template-1',
    recipientEmail: 'test@example.com',
    subject: 'Test Subject',
    status: 'SENT',
    provider: 'smtp',
    messageId: 'msg-123',
    sentAt: '2025-01-01T10:00:00Z',
    createdAt: '2025-01-01T09:00:00Z'
  };

  const mockEmailQueue: EmailQueue = {
    id: 'queue-1',
    templateName: 'welcome_email',
    recipientEmail: 'test@example.com',
    variables: { name: 'John' },
    status: 'PENDING',
    priority: 'NORMAL',
    scheduledAt: null,
    createdAt: '2025-01-01T10:00:00Z'
  };

  beforeEach(() => {
    service = new EmailApiService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('sendEmail', () => {
    const sendEmailDto: SendEmailDto = {
      recipientEmail: 'test@example.com',
      subject: 'Test Email',
      htmlBody: '<p>Hello</p>',
      textBody: 'Hello'
    };

    it('should send email successfully', async () => {
      vi.mocked(mockApiClient.post).mockResolvedValue({ data: mockEmailSendResult });

      const result = await service.sendEmail(sendEmailDto);

      expect(mockApiClient.post).toHaveBeenCalledWith('/admin/emails/send', sendEmailDto);
      expect(result.success).toBe(true);
      expect(result.messageId).toBe('msg-123');
    });

    it('should handle unwrapped response', async () => {
      vi.mocked(mockApiClient.post).mockResolvedValue(mockEmailSendResult);

      const result = await service.sendEmail(sendEmailDto);

      expect(result.success).toBe(true);
    });

    it('should throw error for empty recipient email', async () => {
      await expect(service.sendEmail({ ...sendEmailDto, recipientEmail: '' })).rejects.toThrow('Recipient email is required');
      await expect(service.sendEmail({ ...sendEmailDto, recipientEmail: '  ' })).rejects.toThrow('Recipient email is required');
    });

    it('should throw error for empty subject', async () => {
      await expect(service.sendEmail({ ...sendEmailDto, subject: '' })).rejects.toThrow('Email subject is required');
      await expect(service.sendEmail({ ...sendEmailDto, subject: '  ' })).rejects.toThrow('Email subject is required');
    });

    it('should throw error when both body fields are empty', async () => {
      await expect(service.sendEmail({ ...sendEmailDto, htmlBody: '', textBody: '' })).rejects.toThrow('Email body is required');
      await expect(service.sendEmail({ ...sendEmailDto, htmlBody: '  ', textBody: '  ' })).rejects.toThrow('Email body is required');
    });

    it('should accept email with only htmlBody', async () => {
      vi.mocked(mockApiClient.post).mockResolvedValue({ data: mockEmailSendResult });

      await service.sendEmail({ ...sendEmailDto, textBody: '' });

      expect(mockApiClient.post).toHaveBeenCalled();
    });

    it('should accept email with only textBody', async () => {
      vi.mocked(mockApiClient.post).mockResolvedValue({ data: mockEmailSendResult });

      await service.sendEmail({ ...sendEmailDto, htmlBody: '', textBody: 'Plain text' });

      expect(mockApiClient.post).toHaveBeenCalled();
    });

    it('should handle API error', async () => {
      vi.mocked(mockApiClient.post).mockRejectedValue(new Error('Send failed'));

      await expect(service.sendEmail(sendEmailDto)).rejects.toThrow(EmailApiServiceError);
    });

    it('should handle network error', async () => {
      const networkError = { name: 'NetworkError', message: 'Network failed' };
      vi.mocked(mockApiClient.post).mockRejectedValue(networkError);

      await expect(service.sendEmail(sendEmailDto)).rejects.toThrow('Unable to connect to server');
    });
  });

  describe('sendTemplatedEmail', () => {
    const sendTemplatedDto: SendTemplatedEmailDto = {
      templateName: 'welcome_email',
      recipientEmail: 'test@example.com',
      variables: { name: 'John' }
    };

    it('should send templated email successfully', async () => {
      vi.mocked(mockApiClient.post).mockResolvedValue({ data: mockEmailSendResult });

      const result = await service.sendTemplatedEmail(sendTemplatedDto);

      expect(mockApiClient.post).toHaveBeenCalledWith('/admin/emails/send-templated', sendTemplatedDto);
      expect(result.success).toBe(true);
    });

    it('should handle unwrapped response', async () => {
      vi.mocked(mockApiClient.post).mockResolvedValue(mockEmailSendResult);

      const result = await service.sendTemplatedEmail(sendTemplatedDto);

      expect(result.success).toBe(true);
    });

    it('should throw error for empty template name', async () => {
      await expect(service.sendTemplatedEmail({ ...sendTemplatedDto, templateName: '' })).rejects.toThrow('Template name is required');
      await expect(service.sendTemplatedEmail({ ...sendTemplatedDto, templateName: '  ' })).rejects.toThrow('Template name is required');
    });

    it('should throw error for empty recipient email', async () => {
      await expect(service.sendTemplatedEmail({ ...sendTemplatedDto, recipientEmail: '' })).rejects.toThrow('Recipient email is required');
      await expect(service.sendTemplatedEmail({ ...sendTemplatedDto, recipientEmail: '  ' })).rejects.toThrow('Recipient email is required');
    });

    it('should handle API error', async () => {
      vi.mocked(mockApiClient.post).mockRejectedValue(new Error('Send failed'));

      await expect(service.sendTemplatedEmail(sendTemplatedDto)).rejects.toThrow(EmailApiServiceError);
    });
  });

  describe('queueEmail', () => {
    const queueEmailDto: QueueEmailDto = {
      templateName: 'welcome_email',
      recipientEmail: 'test@example.com',
      variables: { name: 'John' },
      priority: 'NORMAL'
    };

    it('should queue email successfully', async () => {
      vi.mocked(mockApiClient.post).mockResolvedValue({ data: mockEmailQueue });

      const result = await service.queueEmail(queueEmailDto);

      expect(mockApiClient.post).toHaveBeenCalledWith('/admin/emails/queue', queueEmailDto);
      expect(result.id).toBe('queue-1');
      expect(result.status).toBe('PENDING');
    });

    it('should handle unwrapped response', async () => {
      vi.mocked(mockApiClient.post).mockResolvedValue(mockEmailQueue);

      const result = await service.queueEmail(queueEmailDto);

      expect(result.id).toBe('queue-1');
    });

    it('should throw error for empty template name', async () => {
      await expect(service.queueEmail({ ...queueEmailDto, templateName: '' })).rejects.toThrow('Template name is required');
    });

    it('should throw error for empty recipient email', async () => {
      await expect(service.queueEmail({ ...queueEmailDto, recipientEmail: '' })).rejects.toThrow('Recipient email is required');
    });

    it('should handle API error', async () => {
      vi.mocked(mockApiClient.post).mockRejectedValue(new Error('Queue failed'));

      await expect(service.queueEmail(queueEmailDto)).rejects.toThrow(EmailApiServiceError);
    });
  });

  describe('getEmailLogs', () => {
    it('should fetch email logs without query', async () => {
      const mockResponse: PaginatedResponse<EmailLog> = {
        data: [mockEmailLog],
        meta: { page: 1, limit: 50, total: 1, totalPages: 1 }
      };
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: mockResponse });

      const result = await service.getEmailLogs();

      expect(mockApiClient.get).toHaveBeenCalledWith('/admin/emails/logs');
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should fetch logs with query parameters', async () => {
      const mockResponse: PaginatedResponse<EmailLog> = {
        data: [mockEmailLog],
        meta: { page: 2, limit: 20, total: 50, totalPages: 3 }
      };
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: mockResponse });

      const query: QueryEmailLogsDto = {
        page: 2,
        limit: 20,
        status: 'SENT',
        templateId: 'template-1',
        recipientEmail: 'test@example.com'
      };

      await service.getEmailLogs(query);

      const callArg = vi.mocked(mockApiClient.get).mock.calls[0][0] as string;
      expect(callArg).toContain('page=2');
      expect(callArg).toContain('limit=20');
      expect(callArg).toContain('status=SENT');
      expect(callArg).toContain('templateId=template-1');
    });

    it('should handle date range filters', async () => {
      const mockResponse: PaginatedResponse<EmailLog> = {
        data: [],
        meta: { page: 1, limit: 50, total: 0, totalPages: 0 }
      };
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: mockResponse });

      await service.getEmailLogs({
        dateFrom: '2025-01-01',
        dateTo: '2025-01-31'
      });

      const callArg = vi.mocked(mockApiClient.get).mock.calls[0][0] as string;
      expect(callArg).toContain('dateFrom=2025-01-01');
      expect(callArg).toContain('dateTo=2025-01-31');
    });

    it('should handle response with data and meta structure', async () => {
      const mockResponse = {
        data: [mockEmailLog],
        meta: { page: 1, limit: 50, total: 1, totalPages: 1 }
      };
      vi.mocked(mockApiClient.get).mockResolvedValue(mockResponse);

      const result = await service.getEmailLogs();

      expect(result.data).toHaveLength(1);
      expect(result.meta).toBeDefined();
    });

    it('should handle unwrapped response and transform to paginated format', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: [mockEmailLog] });

      const result = await service.getEmailLogs({ page: 1, limit: 10 });

      expect(Array.isArray(result.data)).toBe(true);
      expect(result.meta).toBeDefined();
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });

    it('should handle array response directly', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue([mockEmailLog]);

      const result = await service.getEmailLogs();

      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('should handle network error', async () => {
      const networkError = { name: 'NetworkError', message: 'Network failed' };
      vi.mocked(mockApiClient.get).mockRejectedValue(networkError);

      await expect(service.getEmailLogs()).rejects.toThrow('Unable to connect to server');
    });
  });

  describe('getEmailLogById', () => {
    it('should fetch email log by ID', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: mockEmailLog });

      const result = await service.getEmailLogById('log-1');

      expect(mockApiClient.get).toHaveBeenCalledWith('/admin/emails/logs/log-1');
      expect(result.id).toBe('log-1');
    });

    it('should handle unwrapped response', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue(mockEmailLog);

      const result = await service.getEmailLogById('log-1');

      expect(result.id).toBe('log-1');
    });

    it('should throw error for empty log ID', async () => {
      await expect(service.getEmailLogById('')).rejects.toThrow('Log ID is required');
      await expect(service.getEmailLogById('  ')).rejects.toThrow('Log ID is required');
    });

    it('should throw error when log not found', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: null });

      await expect(service.getEmailLogById('log-1')).rejects.toThrow('Email log not found');
    });

    it('should handle network error', async () => {
      const networkError = { name: 'NetworkError', message: 'Network failed' };
      vi.mocked(mockApiClient.get).mockRejectedValue(networkError);

      await expect(service.getEmailLogById('log-1')).rejects.toThrow('Unable to connect to server');
    });
  });

  describe('retryFailedEmail', () => {
    it('should retry failed email successfully', async () => {
      vi.mocked(mockApiClient.post).mockResolvedValue({ data: mockEmailSendResult });

      const result = await service.retryFailedEmail('log-1');

      expect(mockApiClient.post).toHaveBeenCalledWith('/admin/emails/logs/log-1/retry');
      expect(result.success).toBe(true);
    });

    it('should handle unwrapped response', async () => {
      vi.mocked(mockApiClient.post).mockResolvedValue(mockEmailSendResult);

      const result = await service.retryFailedEmail('log-1');

      expect(result.success).toBe(true);
    });

    it('should throw error for empty log ID', async () => {
      await expect(service.retryFailedEmail('')).rejects.toThrow('Log ID is required');
      await expect(service.retryFailedEmail('  ')).rejects.toThrow('Log ID is required');
    });

    it('should handle API error', async () => {
      vi.mocked(mockApiClient.post).mockRejectedValue(new Error('Retry failed'));

      await expect(service.retryFailedEmail('log-1')).rejects.toThrow(EmailApiServiceError);
    });
  });

  describe('getEmailStats', () => {
    const mockStats: EmailStatsResponse = {
      totalSent: 100,
      totalFailed: 5,
      totalPending: 2,
      successRate: 95.2,
      byStatus: {
        SENT: 100,
        FAILED: 5,
        PENDING: 2
      },
      byTemplate: [
        { templateId: 'template-1', name: 'Welcome Email', count: 50 }
      ]
    };

    it('should fetch email stats without date range', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: mockStats });

      const result = await service.getEmailStats();

      expect(mockApiClient.get).toHaveBeenCalledWith('/admin/emails/stats');
      expect(result.totalSent).toBe(100);
      expect(result.successRate).toBe(95.2);
    });

    it('should fetch stats with date range', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: mockStats });

      await service.getEmailStats('2025-01-01', '2025-01-31');

      const callArg = vi.mocked(mockApiClient.get).mock.calls[0][0] as string;
      expect(callArg).toContain('dateFrom=2025-01-01');
      expect(callArg).toContain('dateTo=2025-01-31');
    });

    it('should handle unwrapped response', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue(mockStats);

      const result = await service.getEmailStats();

      expect(result.totalSent).toBe(100);
    });

    it('should handle network error', async () => {
      const networkError = { name: 'NetworkError', message: 'Network failed' };
      vi.mocked(mockApiClient.get).mockRejectedValue(networkError);

      await expect(service.getEmailStats()).rejects.toThrow('Unable to connect to server');
    });
  });

  describe('getQueueStats', () => {
    const mockQueueStats: QueueStatsResponse = {
      totalPending: 10,
      totalProcessing: 2,
      totalFailed: 1,
      totalCompleted: 50,
      byPriority: {
        HIGH: 3,
        NORMAL: 9,
        LOW: 1
      }
    };

    it('should fetch queue stats successfully', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: mockQueueStats });

      const result = await service.getQueueStats();

      expect(mockApiClient.get).toHaveBeenCalledWith('/admin/emails/queue/stats');
      expect(result.totalPending).toBe(10);
      expect(result.totalProcessing).toBe(2);
    });

    it('should handle unwrapped response', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue(mockQueueStats);

      const result = await service.getQueueStats();

      expect(result.totalPending).toBe(10);
    });

    it('should handle network error', async () => {
      const networkError = { name: 'NetworkError', message: 'Network failed' };
      vi.mocked(mockApiClient.get).mockRejectedValue(networkError);

      await expect(service.getQueueStats()).rejects.toThrow('Unable to connect to server');
    });
  });

  describe('retryQueuedEmail', () => {
    it('should retry queued email successfully', async () => {
      vi.mocked(mockApiClient.post).mockResolvedValue({ data: mockEmailQueue });

      const result = await service.retryQueuedEmail('queue-1');

      expect(mockApiClient.post).toHaveBeenCalledWith('/admin/emails/queue/queue-1/retry');
      expect(result.id).toBe('queue-1');
    });

    it('should handle unwrapped response', async () => {
      vi.mocked(mockApiClient.post).mockResolvedValue(mockEmailQueue);

      const result = await service.retryQueuedEmail('queue-1');

      expect(result.id).toBe('queue-1');
    });

    it('should throw error for empty queue ID', async () => {
      await expect(service.retryQueuedEmail('')).rejects.toThrow('Queue ID is required');
      await expect(service.retryQueuedEmail('  ')).rejects.toThrow('Queue ID is required');
    });

    it('should handle API error', async () => {
      vi.mocked(mockApiClient.post).mockRejectedValue(new Error('Retry failed'));

      await expect(service.retryQueuedEmail('queue-1')).rejects.toThrow(EmailApiServiceError);
    });
  });

  describe('error handling', () => {
    it('should handle API error with details', async () => {
      const apiError = {
        response: {
          data: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: { email: ['Invalid email format'] }
          }
        }
      };
      vi.mocked(mockApiClient.post).mockRejectedValue(apiError);

      try {
        await service.sendEmail({
          recipientEmail: 'invalid',
          subject: 'Test',
          htmlBody: 'Body'
        });
      } catch (error: any) {
        expect(error).toBeInstanceOf(EmailApiServiceError);
        expect(error.message).toBe('Validation failed');
        expect(error.code).toBe('VALIDATION_ERROR');
        expect(error.details).toEqual({ email: ['Invalid email format'] });
      }
    });

    it('should re-throw EmailApiServiceError', async () => {
      const customError = new EmailApiServiceError('Custom error', 'CUSTOM_CODE');
      vi.mocked(mockApiClient.post).mockRejectedValue(customError);

      await expect(service.sendEmail({
        recipientEmail: 'test@example.com',
        subject: 'Test',
        htmlBody: 'Body'
      })).rejects.toThrow(customError);
    });
  });

  describe('singleton instance', () => {
    it('should export singleton instance', () => {
      expect(emailApiService).toBeInstanceOf(EmailApiService);
    });
  });
});
