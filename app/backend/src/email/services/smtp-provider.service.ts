/**
 * SMTP Provider Service
 *
 * Email provider implementation using SMTP (nodemailer)
 * Supports both regular SMTP and Ethereal Email for testing
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
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
 * Automatically creates Ethereal test accounts in development mode
 */
@Injectable()
export class SmtpProviderService implements IEmailProvider, OnModuleInit {
  private readonly logger = new Logger(SmtpProviderService.name);
  private transporter: Transporter;
  private etherealAccount: any;

  async onModuleInit() {
    await this.initializeTransporter();
  }

  /**
   * Initialize SMTP transporter
   * Supports Ethereal Email for testing
   */
  private async initializeTransporter(): Promise<void> {
    const useEthereal = process.env.EMAIL_PROVIDER === 'ethereal' ||
                       (!process.env.SMTP_HOST && process.env.NODE_ENV === 'development');

    if (useEthereal) {
      await this.initializeEtherealTransporter();
    } else {
      this.initializeRegularSmtpTransporter();
    }
  }

  /**
   * Initialize Ethereal Email test account
   * Creates a temporary test account automatically
   */
  private async initializeEtherealTransporter(): Promise<void> {
    try {
      this.logger.log('Creating Ethereal Email test account...');

      // Create a test account
      this.etherealAccount = await nodemailer.createTestAccount();

      const config = {
        host: this.etherealAccount.smtp.host,
        port: this.etherealAccount.smtp.port,
        secure: this.etherealAccount.smtp.secure,
        auth: {
          user: this.etherealAccount.user,
          pass: this.etherealAccount.pass,
        },
      };

      this.transporter = nodemailer.createTransport(config);

      this.logger.log('✅ Ethereal Email configured successfully!');
      this.logger.log(`📧 Test account created: ${this.etherealAccount.user}`);
      this.logger.log(`🔑 Password: ${this.etherealAccount.pass}`);
      this.logger.log(`📬 View emails at: https://ethereal.email/messages`);
      this.logger.log(`💡 Login with the credentials above to see test emails`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to create Ethereal account: ${errorMessage}`);
      this.logger.warn('Falling back to regular SMTP configuration');
      this.initializeRegularSmtpTransporter();
    }
  }

  /**
   * Initialize regular SMTP transporter
   */
  private initializeRegularSmtpTransporter(): void {
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

      // If using Ethereal, log the preview URL
      if (this.etherealAccount) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          this.logger.log(`✉️  Email sent to: ${options.to}`);
          this.logger.log(`📧 Preview URL: ${previewUrl}`);
          this.logger.log(`💡 You can view this email at the URL above`);
        }
      } else {
        this.logger.log(`Email sent successfully: ${info.messageId}`);
      }

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
