/**
 * Email System TypeScript Definitions
 */

export enum EmailCategory {
  ACCOUNT = 'ACCOUNT',
  SYSTEM = 'SYSTEM',
  NOTIFICATION = 'NOTIFICATION',
  COMPLIANCE = 'COMPLIANCE',
}

export enum EmailStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  BOUNCED = 'BOUNCED',
  DELIVERED = 'DELIVERED',
  OPENED = 'OPENED',
  CLICKED = 'CLICKED',
}

export enum EmailQueueStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export type TemplateVariableType = 'string' | 'number' | 'boolean' | 'date' | 'currency';

/**
 * Template Variable Definition
 */
export interface TemplateVariable {
  name: string;
  type: TemplateVariableType;
  required: boolean;
  description?: string;
  example?: any;
  defaultValue?: any;
}

/**
 * Email Template
 */
export interface EmailTemplate {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  category: EmailCategory;
  variables: TemplateVariable[];
  isActive: boolean;
  isSystem: boolean;
  version: number;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Email Log Entry
 */
export interface EmailLog {
  id: string;
  templateId?: string;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  status: EmailStatus;
  variables?: Record<string, any>;
  errorMessage?: string;
  sentAt?: string;
  openedAt?: string;
  clickedAt?: string;
  provider?: string;
  externalId?: string;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  updatedAt: string;
  template?: EmailTemplate;
}

/**
 * Email Queue Item
 */
export interface EmailQueue {
  id: string;
  templateId?: string;
  recipientEmail: string;
  recipientName?: string;
  variables: Record<string, any>;
  priority: number;
  status: EmailQueueStatus;
  attempts: number;
  maxAttempts: number;
  scheduledFor: string;
  processedAt?: string;
  errorMessage?: string;
  emailLogId?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create Template DTO
 */
export interface CreateEmailTemplateDto {
  name: string;
  displayName: string;
  description?: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  category: EmailCategory;
  variables: TemplateVariable[];
  isActive?: boolean;
}

/**
 * Update Template DTO
 */
export interface UpdateEmailTemplateDto {
  displayName?: string;
  description?: string;
  subject?: string;
  htmlBody?: string;
  textBody?: string;
  category?: EmailCategory;
  variables?: TemplateVariable[];
  isActive?: boolean;
}

/**
 * Template Preview Request
 */
export interface TemplatePreviewDto {
  variables?: Record<string, any>;
}

/**
 * Template Preview Response
 */
export interface TemplatePreviewResponse {
  subject: string;
  htmlBody: string;
  textBody: string;
}

/**
 * Send Test Email DTO
 */
export interface SendTestEmailDto {
  recipientEmail: string;
  variables?: Record<string, any>;
}

/**
 * Send Email DTO
 */
export interface SendEmailDto {
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: EmailAttachment[];
}

/**
 * Send Templated Email DTO
 */
export interface SendTemplatedEmailDto {
  templateName: string;
  recipientEmail: string;
  recipientName?: string;
  variables?: Record<string, any>;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  scheduledFor?: string;
}

/**
 * Queue Email DTO
 */
export interface QueueEmailDto {
  templateName: string;
  recipientEmail: string;
  recipientName?: string;
  variables?: Record<string, any>;
  priority?: number;
  scheduledFor?: string;
}

/**
 * Email Attachment
 */
export interface EmailAttachment {
  filename: string;
  content: string;
  encoding?: string;
  contentType?: string;
}

/**
 * Query Email Logs DTO
 */
export interface QueryEmailLogsDto {
  page?: number;
  limit?: number;
  status?: EmailStatus;
  templateId?: string;
  recipientEmail?: string;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Email Stats Response
 */
export interface EmailStatsResponse {
  total: number;
  sent: number;
  failed: number;
  pending: number;
  opened: number;
  clicked: number;
  bounced: number;
  successRate: number;
  openRate: number;
  clickRate: number;
  byStatus: Record<EmailStatus, number>;
  byTemplate: Array<{
    templateId: string;
    templateName: string;
    count: number;
  }>;
  byDay: Array<{
    date: string;
    sent: number;
    failed: number;
  }>;
}

/**
 * Queue Stats Response
 */
export interface QueueStatsResponse {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
  avgProcessingTime: number;
  oldestPendingAge: number;
}

/**
 * API Response Wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

/**
 * Paginated Response
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Email Send Result
 */
export interface EmailSendResult {
  success: boolean;
  emailLogId?: string;
  messageId?: string;
  error?: string;
}

/**
 * Template Validation Result
 */
export interface TemplateValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  variables: string[];
}
