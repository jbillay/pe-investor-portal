/**
 * Email Template Interfaces
 *
 * Defines types and interfaces for the email templating system
 */

/**
 * Email category enum
 */
export enum EmailCategory {
  ACCOUNT = 'ACCOUNT',
  DOCUMENT = 'DOCUMENT',
  CAPITAL_CALL = 'CAPITAL_CALL',
  DISTRIBUTION = 'DISTRIBUTION',
  SYSTEM = 'SYSTEM',
  NOTIFICATION = 'NOTIFICATION',
}

/**
 * Email status enum
 */
export enum EmailStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  BOUNCED = 'BOUNCED',
}

/**
 * Email queue status enum
 */
export enum EmailQueueStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * Template variable types
 */
export type TemplateVariableType = 'string' | 'number' | 'boolean' | 'date' | 'currency';

/**
 * Template variable schema definition
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
 * Email template interface
 */
export interface IEmailTemplate {
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
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Rendered email content
 */
export interface RenderedEmail {
  subject: string;
  htmlBody: string;
  textBody: string;
}

/**
 * Email attachment interface
 */
export interface EmailAttachment {
  filename: string;
  content?: Buffer | string;
  path?: string;
  contentType?: string;
  encoding?: string;
}

/**
 * Email options for sending
 */
export interface SendEmailOptions {
  to: string;
  from?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  subject: string;
  text: string;
  html: string;
  attachments?: EmailAttachment[];
  priority?: 'high' | 'normal' | 'low';
}

/**
 * Validation error interface
 */
export interface ValidationError {
  field: string;
  message: string;
  type: string;
}

/**
 * Template validation result
 */
export interface TemplateValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}
