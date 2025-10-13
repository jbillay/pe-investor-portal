/**
 * Email Provider Interface
 *
 * Abstract interface for email sending providers (SMTP, SendGrid, SES, etc.)
 */

import { SendEmailOptions } from './email-template.interface';

/**
 * Email send result
 */
export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: string;
}

/**
 * Email provider configuration
 */
export interface EmailProviderConfig {
  provider: 'smtp' | 'sendgrid' | 'ses';
  fromAddress: string;
  fromName: string;
  replyTo?: string;
}

/**
 * Abstract email provider interface
 */
export interface IEmailProvider {
  /**
   * Send an email
   * @param options Email options
   * @returns Send result with message ID or error
   */
  send(options: SendEmailOptions): Promise<EmailSendResult>;

  /**
   * Verify provider configuration
   * @returns True if configuration is valid
   */
  verify(): Promise<boolean>;

  /**
   * Get provider name
   * @returns Provider name
   */
  getProviderName(): string;
}
