/**
 * SMTP Provider Service
 *
 * Email provider implementation using SMTP (nodemailer)
 */

import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import {
  IEmailProvider,
  EmailSendResult,
} from '../interfaces/email-provider.interface';
import { SendEmailOptions } from '../interfaces/email-template.interface';

/**
 * SMTP Provider Service
 * Sends emails using SMTP protocol via nodemailer
 */
@Injectable()
export class SmtpProviderService implements IEmailProvider {
  private readonly logger = new Logger(SmtpProviderService.name);
  private transporter: Transporter;

  constructor() {
    this.initializeTransporter();
  }

  /**
   * Initialize SMTP transporter
   */
  private initializeTransporter(): void {
    const config = {
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          }
        : undefined,
    };

    this.transporter = nodemailer.createTransport(config);

    this.logger.log(`SMTP transporter initialized: ${config.host}:${config.port}`);
  }

  /**
   * Send email via SMTP
   * @param options Email options
   * @returns Send result
   */
  async send(options: SendEmailOptions): Promise<EmailSendResult> {
    try {
      const from =
        options.from ||
        `${process.env.EMAIL_FROM_NAME || 'Investor Portal'} <${process.env.EMAIL_FROM_ADDRESS || 'noreply@localhost'}>`;

      const mailOptions = {
        from,
        to: options.to,
        replyTo: options.replyTo || process.env.EMAIL_REPLY_TO,
        cc: options.cc,
        bcc: options.bcc,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
        priority: options.priority || 'normal',
      };

      this.logger.debug(`Sending email to: ${options.to}`);

      const info = await this.transporter.sendMail(mailOptions);

      this.logger.log(`Email sent successfully: ${info.messageId}`);

      return {
        success: true,
        messageId: info.messageId,
        provider: 'smtp',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to send email: ${errorMessage}`, errorStack);

      return {
        success: false,
        error: errorMessage,
        provider: 'smtp',
      };
    }
  }

  /**
   * Verify SMTP connection
   * @returns True if connection is valid
   */
  async verify(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection verified successfully');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`SMTP verification failed: ${errorMessage}`);
      return false;
    }
  }

  /**
   * Get provider name
   * @returns Provider name
   */
  getProviderName(): string {
    return 'smtp';
  }
}
