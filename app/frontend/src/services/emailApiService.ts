/**
 * Email API Service
 * Handles all email operation-related API communications (sending, logs, queue, stats)
 * Follows enterprise-grade patterns with proper logging and type safety
 */

import { apiClient } from '@/composables/useApi';
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
  PaginatedResponse,
} from '@/types/email';

/**
 * Custom error class for email-specific API errors
 */
export class EmailApiServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'EmailApiServiceError';
  }
}

/**
 * Email API Service Class
 * Centralized service for all email operation-related API operations
 */
export class EmailApiService {
  private readonly baseUrl = '/admin/emails';

  /**
   * Handles API errors with proper error transformation
   */
  private handleApiError(error: any): never {
    // If it's already an EmailApiServiceError, just re-throw it
    if (error instanceof EmailApiServiceError) {
      throw error;
    }

    if (error.name === 'NetworkError') {
      throw new EmailApiServiceError(
        'Unable to connect to server. Please check your connection.',
        'NETWORK_ERROR'
      );
    }

    if (error.response?.data?.message) {
      throw new EmailApiServiceError(
        error.response.data.message,
        error.response.data.code || 'API_ERROR',
        error.response.data.details
      );
    }

    throw new EmailApiServiceError(
      error.message || 'An unexpected error occurred',
      'UNKNOWN_ERROR'
    );
  }

  /**
   * Sends an email directly (without template)
   * @param emailData - The email data
   * @returns Promise<EmailSendResult> - The send result
   */
  async sendEmail(emailData: SendEmailDto): Promise<EmailSendResult> {
    try {
      if (!emailData.recipientEmail?.trim()) {
        throw new EmailApiServiceError('Recipient email is required', 'INVALID_EMAIL');
      }

      if (!emailData.subject?.trim()) {
        throw new EmailApiServiceError('Email subject is required', 'INVALID_SUBJECT');
      }

      if (!emailData.htmlBody?.trim() && !emailData.textBody?.trim()) {
        throw new EmailApiServiceError('Email body is required', 'INVALID_BODY');
      }

      const response = await apiClient.post<EmailSendResult>(`${this.baseUrl}/send`, emailData);
      const sendResult = (response as any).data || response;

      if (!sendResult) {
        throw new EmailApiServiceError('Failed to send email', 'SEND_FAILED');
      }

      return sendResult;
    } catch (error) {
      console.error('Error sending email:', error);
      this.handleApiError(error);
    }
  }

  /**
   * Sends an email using a template
   * @param emailData - The templated email data
   * @returns Promise<EmailSendResult> - The send result
   */
  async sendTemplatedEmail(emailData: SendTemplatedEmailDto): Promise<EmailSendResult> {
    try {
      if (!emailData.templateName?.trim()) {
        throw new EmailApiServiceError('Template name is required', 'INVALID_TEMPLATE_NAME');
      }

      if (!emailData.recipientEmail?.trim()) {
        throw new EmailApiServiceError('Recipient email is required', 'INVALID_EMAIL');
      }

      const response = await apiClient.post<EmailSendResult>(`${this.baseUrl}/send-templated`, emailData);
      const sendResult = (response as any).data || response;

      if (!sendResult) {
        throw new EmailApiServiceError('Failed to send templated email', 'SEND_FAILED');
      }

      return sendResult;
    } catch (error) {
      console.error('Error sending templated email:', error);
      this.handleApiError(error);
    }
  }

  /**
   * Queues an email for later sending
   * @param emailData - The email data to queue
   * @returns Promise<EmailQueue> - The queued email item
   */
  async queueEmail(emailData: QueueEmailDto): Promise<EmailQueue> {
    try {
      if (!emailData.templateName?.trim()) {
        throw new EmailApiServiceError('Template name is required', 'INVALID_TEMPLATE_NAME');
      }

      if (!emailData.recipientEmail?.trim()) {
        throw new EmailApiServiceError('Recipient email is required', 'INVALID_EMAIL');
      }

      const response = await apiClient.post<EmailQueue>(`${this.baseUrl}/queue`, emailData);
      const queuedItem = (response as any).data || response;

      if (!queuedItem) {
        throw new EmailApiServiceError('Failed to queue email', 'QUEUE_FAILED');
      }

      return queuedItem;
    } catch (error) {
      console.error('Error queueing email:', error);
      this.handleApiError(error);
    }
  }

  /**
   * Fetches email logs with filtering and pagination
   * @param query - Query parameters for filtering and pagination
   * @returns Promise<PaginatedResponse<EmailLog>> - Paginated email logs
   */
  async getEmailLogs(query: QueryEmailLogsDto = {}): Promise<PaginatedResponse<EmailLog>> {
    try {
      const queryParams = new URLSearchParams();
      if (query.page) queryParams.append('page', String(query.page));
      if (query.limit) queryParams.append('limit', String(query.limit));
      if (query.status) queryParams.append('status', query.status);
      if (query.templateId) queryParams.append('templateId', query.templateId);
      if (query.recipientEmail) queryParams.append('recipientEmail', query.recipientEmail);
      if (query.dateFrom) queryParams.append('dateFrom', query.dateFrom);
      if (query.dateTo) queryParams.append('dateTo', query.dateTo);

      const url = queryParams.toString() ? `${this.baseUrl}/logs?${queryParams.toString()}` : `${this.baseUrl}/logs`;
      const response = await apiClient.get<PaginatedResponse<EmailLog>>(url);

      // Check if response itself is already properly structured (unwrapped)
      if ((response as any).data && Array.isArray((response as any).data) && (response as any).meta) {
        return response as PaginatedResponse<EmailLog>;
      }

      // Try extracting from data wrapper
      let logsData = (response as any).data;
      if (logsData === undefined) {
        logsData = response;
      }

      if (!logsData) {
        throw new EmailApiServiceError('Failed to fetch email logs', 'FETCH_FAILED');
      }

      // Check if extracted data is properly structured
      if (logsData.data && Array.isArray(logsData.data) && logsData.meta) {
        return logsData;
      }

      // Transform array response to paginated format
      return {
        data: Array.isArray(logsData) ? logsData : [],
        meta: {
          page: query.page || 1,
          limit: query.limit || 50,
          total: Array.isArray(logsData) ? logsData.length : 0,
          totalPages: 1,
        },
      };
    } catch (error) {
      console.error('Error fetching email logs:', error);
      this.handleApiError(error);
    }
  }

  /**
   * Fetches a specific email log by ID
   * @param logId - The email log ID
   * @returns Promise<EmailLog> - The email log
   */
  async getEmailLogById(logId: string): Promise<EmailLog> {
    try {
      if (!logId?.trim()) {
        throw new EmailApiServiceError('Log ID is required', 'INVALID_LOG_ID');
      }

      const response = await apiClient.get<EmailLog>(`${this.baseUrl}/logs/${logId}`);
      let logData = (response as any).data;

      if (logData === undefined) {
        logData = response;
      }

      if (!logData || logData === null) {
        throw new EmailApiServiceError('Email log not found', 'LOG_NOT_FOUND');
      }

      return logData;
    } catch (error) {
      console.error(`Error fetching email log ${logId}:`, error);
      this.handleApiError(error);
    }
  }

  /**
   * Retries a failed email by log ID
   * @param logId - The email log ID to retry
   * @returns Promise<EmailSendResult> - The retry send result
   */
  async retryFailedEmail(logId: string): Promise<EmailSendResult> {
    try {
      if (!logId?.trim()) {
        throw new EmailApiServiceError('Log ID is required', 'INVALID_LOG_ID');
      }

      const response = await apiClient.post<EmailSendResult>(`${this.baseUrl}/logs/${logId}/retry`);
      let retryResult = (response as any).data;

      if (retryResult === undefined) {
        retryResult = response;
      }

      if (!retryResult || retryResult === null) {
        throw new EmailApiServiceError('Failed to retry email', 'RETRY_FAILED');
      }

      return retryResult;
    } catch (error) {
      console.error(`Error retrying email log ${logId}:`, error);
      this.handleApiError(error);
    }
  }

  /**
   * Fetches email statistics
   * @param dateFrom - Start date for stats (ISO string)
   * @param dateTo - End date for stats (ISO string)
   * @returns Promise<EmailStatsResponse> - Email statistics
   */
  async getEmailStats(dateFrom?: string, dateTo?: string): Promise<EmailStatsResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (dateFrom) queryParams.append('dateFrom', dateFrom);
      if (dateTo) queryParams.append('dateTo', dateTo);

      const url = queryParams.toString() ? `${this.baseUrl}/stats?${queryParams.toString()}` : `${this.baseUrl}/stats`;
      const response = await apiClient.get<EmailStatsResponse>(url);

      let statsData = (response as any).data;
      if (statsData === undefined) {
        statsData = response;
      }

      if (!statsData) {
        throw new EmailApiServiceError('Failed to fetch email stats', 'FETCH_FAILED');
      }

      return statsData;
    } catch (error) {
      console.error('Error fetching email stats:', error);
      this.handleApiError(error);
    }
  }

  /**
   * Fetches email queue statistics
   * @returns Promise<QueueStatsResponse> - Queue statistics
   */
  async getQueueStats(): Promise<QueueStatsResponse> {
    try {
      const response = await apiClient.get<QueueStatsResponse>(`${this.baseUrl}/queue/stats`);

      let statsData = (response as any).data;
      if (statsData === undefined) {
        statsData = response;
      }

      if (!statsData) {
        throw new EmailApiServiceError('Failed to fetch queue stats', 'FETCH_FAILED');
      }

      return statsData;
    } catch (error) {
      console.error('Error fetching queue stats:', error);
      this.handleApiError(error);
    }
  }

  /**
   * Retries a queued email by queue item ID
   * @param queueId - The queue item ID to retry
   * @returns Promise<EmailQueue> - The updated queue item
   */
  async retryQueuedEmail(queueId: string): Promise<EmailQueue> {
    try {
      if (!queueId?.trim()) {
        throw new EmailApiServiceError('Queue ID is required', 'INVALID_QUEUE_ID');
      }

      const response = await apiClient.post<EmailQueue>(`${this.baseUrl}/queue/${queueId}/retry`);
      let queueItem = (response as any).data;

      if (queueItem === undefined) {
        queueItem = response;
      }

      if (!queueItem || queueItem === null) {
        throw new EmailApiServiceError('Failed to retry queued email', 'RETRY_FAILED');
      }

      return queueItem;
    } catch (error) {
      console.error(`Error retrying queued email ${queueId}:`, error);
      this.handleApiError(error);
    }
  }
}

/**
 * Export singleton instance of the email API service
 */
export const emailApiService = new EmailApiService();
