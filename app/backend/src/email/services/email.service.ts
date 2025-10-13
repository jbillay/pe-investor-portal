/**
 * Email Service
 *
 * Core email sending service with templating, queuing, and logging
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EmailTemplateService } from './email-template.service';
import { TemplateRendererService } from './template-renderer.service';
import { SmtpProviderService } from './smtp-provider.service';
import { EmailQueueService } from './email-queue.service';
import {
  SendEmailDto,
  SendTemplatedEmailDto,
  QueueEmailDto,
} from '../dto/send-email.dto';
import {
  QueryEmailLogsDto,
  EmailStatsDto,
} from '../dto/email-log.dto';
import { EmailStatus } from '../interfaces/email-template.interface';

/**
 * Email Service
 * Comprehensive email management service
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly templateService: EmailTemplateService,
    private readonly rendererService: TemplateRendererService,
    private readonly smtpProvider: SmtpProviderService,
    private readonly queueService: EmailQueueService,
  ) {}

  /**
   * Send email directly (without template)
   * @param dto Send email DTO
   * @returns Send result
   */
  async sendEmail(dto: SendEmailDto) {
    this.logger.log(`Sending email to: ${dto.to}`);

    // Create email log
    const emailLog = await this.createEmailLog({
      recipientEmail: dto.to,
      subject: dto.subject,
      htmlBody: dto.html,
      textBody: dto.text,
      provider: 'smtp',
    });

    try {
      // Send email
      const result = await this.smtpProvider.send({
        to: dto.to,
        subject: dto.subject,
        text: dto.text,
        html: dto.html,
        replyTo: dto.replyTo,
        cc: dto.cc,
        bcc: dto.bcc,
        attachments: dto.attachments,
        priority: dto.priority === 1 ? 'high' : dto.priority === 10 ? 'low' : 'normal',
      });

      // Update email log
      await this.updateEmailLog(emailLog.id, {
        status: result.success ? EmailStatus.SENT : EmailStatus.FAILED,
        externalId: result.messageId,
        errorMessage: result.error,
        sentAt: result.success ? new Date() : null,
      });

      return {
        success: result.success,
        emailLogId: emailLog.id,
        messageId: result.messageId,
        message: result.success ? 'Email sent successfully' : 'Failed to send email',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error sending email: ${errorMessage}`, errorStack);

      await this.updateEmailLog(emailLog.id, {
        status: EmailStatus.FAILED,
        errorMessage,
      });

      throw error;
    }
  }

  /**
   * Send email using template
   * @param dto Send templated email DTO
   * @returns Send result
   */
  async sendTemplatedEmail(dto: SendTemplatedEmailDto) {
    this.logger.log(
      `Sending templated email (${dto.templateName}) to: ${dto.recipientEmail}`,
    );

    // Get template
    const template = await this.templateService.findByName(dto.templateName);

    if (!template.isActive) {
      throw new NotFoundException(`Template '${dto.templateName}' is not active`);
    }

    // Render template
    const rendered = await this.rendererService.render(template, dto.variables || {});

    // Create email log
    const emailLog = await this.createEmailLog({
      templateId: template.id,
      recipientEmail: dto.recipientEmail,
      recipientName: dto.recipientName,
      subject: rendered.subject,
      htmlBody: rendered.htmlBody,
      textBody: rendered.textBody,
      variables: dto.variables,
      provider: 'smtp',
    });

    try {
      // Send email
      const result = await this.smtpProvider.send({
        to: dto.recipientEmail,
        subject: rendered.subject,
        text: rendered.textBody,
        html: rendered.htmlBody,
        replyTo: dto.replyTo,
        cc: dto.cc,
        bcc: dto.bcc,
        attachments: dto.attachments,
        priority: dto.priority === 1 ? 'high' : dto.priority === 10 ? 'low' : 'normal',
      });

      // Update email log
      await this.updateEmailLog(emailLog.id, {
        status: result.success ? EmailStatus.SENT : EmailStatus.FAILED,
        externalId: result.messageId,
        errorMessage: result.error,
        sentAt: result.success ? new Date() : null,
      });

      return {
        success: result.success,
        emailLogId: emailLog.id,
        messageId: result.messageId,
        message: result.success ? 'Email sent successfully' : 'Failed to send email',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error sending templated email: ${errorMessage}`, errorStack);

      await this.updateEmailLog(emailLog.id, {
        status: EmailStatus.FAILED,
        errorMessage,
      });

      throw error;
    }
  }

  /**
   * Queue email for later delivery
   * @param dto Queue email DTO
   * @returns Queue result
   */
  async queueEmail(dto: QueueEmailDto) {
    this.logger.log(
      `Queueing email (${dto.templateName}) for: ${dto.recipientEmail}`,
    );

    // Validate template exists
    const template = await this.templateService.findByName(dto.templateName);

    // Validate variables if template requires them
    if (template.variables && template.variables.length > 0) {
      const requiredVars = template.variables.filter((v) => v.required);
      const missingVars = requiredVars.filter(
        (v) => !(dto.variables && v.name in dto.variables),
      );

      if (missingVars.length > 0) {
        throw new Error(
          `Missing required variables: ${missingVars.map((v) => v.name).join(', ')}`,
        );
      }
    }

    // Queue the email
    const queueItem = await this.queueService.enqueue({
      templateId: template.id,
      recipientEmail: dto.recipientEmail,
      recipientName: dto.recipientName,
      variables: dto.variables || {},
      priority: dto.priority,
      scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : undefined,
    });

    return {
      success: true,
      queueId: queueItem.id,
      message: 'Email queued for delivery',
      scheduledFor: queueItem.scheduledFor,
    };
  }

  /**
   * Process queued emails (called by cron job)
   * @param batchSize Number of emails to process
   * @returns Number of emails processed
   */
  async processQueue(batchSize: number = 10): Promise<number> {
    const pendingEmails = await this.queueService.getPendingEmails(batchSize);

    if (pendingEmails.length === 0) {
      return 0;
    }

    this.logger.log(`Processing ${pendingEmails.length} queued emails`);

    let processed = 0;

    for (const queueItem of pendingEmails) {
      try {
        // Mark as processing
        await this.queueService.markAsProcessing(queueItem.id);

        // Get template if specified
        let templateId: string | undefined;
        let subject: string;
        let htmlBody: string;
        let textBody: string;

        if (queueItem.templateId) {
          const template = await this.templateService.findOne(
            queueItem.templateId,
          );
          const rendered = await this.rendererService.render(
            template,
            queueItem.variables as any,
          );

          templateId = template.id;
          subject = rendered.subject;
          htmlBody = rendered.htmlBody;
          textBody = rendered.textBody;
        } else {
          // Direct email without template
          const vars = queueItem.variables as any;
          subject = vars.subject || 'No subject';
          htmlBody = vars.htmlBody || '';
          textBody = vars.textBody || '';
        }

        // Create email log
        const emailLog = await this.createEmailLog({
          templateId,
          recipientEmail: queueItem.recipientEmail,
          recipientName: queueItem.recipientName || undefined,
          subject,
          htmlBody,
          textBody,
          variables: queueItem.variables as any,
          provider: 'smtp',
        });

        // Send email
        const result = await this.smtpProvider.send({
          to: queueItem.recipientEmail,
          subject,
          text: textBody,
          html: htmlBody,
        });

        // Update email log
        await this.updateEmailLog(emailLog.id, {
          status: result.success ? EmailStatus.SENT : EmailStatus.FAILED,
          externalId: result.messageId,
          errorMessage: result.error,
          sentAt: result.success ? new Date() : null,
        });

        if (result.success) {
          // Mark queue item as completed
          await this.queueService.markAsCompleted(queueItem.id, emailLog.id);
          processed++;
        } else {
          // Mark as failed (will retry if attempts < max)
          await this.queueService.markAsFailed(queueItem.id, result.error || 'Unknown error');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;
        this.logger.error(
          `Error processing queue item ${queueItem.id}: ${errorMessage}`,
          errorStack,
        );

        await this.queueService.markAsFailed(queueItem.id, errorMessage);
      }
    }

    this.logger.log(`Processed ${processed} emails successfully`);

    return processed;
  }

  /**
   * Get email logs with filtering
   * @param query Query parameters
   * @returns Paginated email logs
   */
  async getEmailLogs(query: QueryEmailLogsDto) {
    const {
      status,
      templateId,
      recipientEmail,
      dateFrom,
      dateTo,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (templateId) {
      where.templateId = templateId;
    }

    if (recipientEmail) {
      where.recipientEmail = { contains: recipientEmail, mode: 'insensitive' };
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.emailLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          template: {
            select: {
              id: true,
              name: true,
              displayName: true,
              category: true,
            },
          },
        },
      }),
      this.prisma.emailLog.count({ where }),
    ]);

    return {
      data: logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get email log by ID
   * @param id Email log ID
   * @returns Email log
   */
  async getEmailLog(id: string) {
    const log = await this.prisma.emailLog.findUnique({
      where: { id },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            displayName: true,
            category: true,
          },
        },
      },
    });

    if (!log) {
      throw new NotFoundException(`Email log with ID '${id}' not found`);
    }

    return log;
  }

  /**
   * Retry failed email
   * @param logId Email log ID
   * @returns Retry result
   */
  async retryFailedEmail(logId: string) {
    const log = await this.getEmailLog(logId);

    if (log.status !== EmailStatus.FAILED) {
      throw new Error(`Email log ${logId} is not in failed status`);
    }

    if (log.retryCount >= log.maxRetries) {
      throw new Error(`Email log ${logId} has exceeded max retries`);
    }

    this.logger.log(`Retrying failed email: ${logId}`);

    try {
      // Send email
      const result = await this.smtpProvider.send({
        to: log.recipientEmail,
        subject: log.subject,
        text: log.textBody,
        html: log.htmlBody,
      });

      // Update email log
      await this.updateEmailLog(logId, {
        status: result.success ? EmailStatus.SENT : EmailStatus.FAILED,
        externalId: result.messageId,
        errorMessage: result.error,
        sentAt: result.success ? new Date() : null,
        retryCount: log.retryCount + 1,
      });

      return {
        success: result.success,
        message: result.success ? 'Email sent successfully' : 'Failed to send email',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error retrying email: ${errorMessage}`, errorStack);

      await this.updateEmailLog(logId, {
        errorMessage,
        retryCount: log.retryCount + 1,
      });

      throw error;
    }
  }

  /**
   * Get email statistics
   * @param dateFrom Start date
   * @param dateTo End date
   * @returns Email statistics
   */
  async getEmailStats(
    dateFrom?: string,
    dateTo?: string,
  ): Promise<EmailStatsDto> {
    const where: any = {};

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    const [totalSent, totalSuccess, totalFailed, totalOpened, totalClicked] =
      await Promise.all([
        this.prisma.emailLog.count({ where }),
        this.prisma.emailLog.count({
          where: { ...where, status: EmailStatus.SENT },
        }),
        this.prisma.emailLog.count({
          where: { ...where, status: EmailStatus.FAILED },
        }),
        this.prisma.emailLog.count({
          where: { ...where, openedAt: { not: null } },
        }),
        this.prisma.emailLog.count({
          where: { ...where, clickedAt: { not: null } },
        }),
      ]);

    const successRate = totalSent > 0 ? (totalSuccess / totalSent) * 100 : 0;
    const openRate = totalSuccess > 0 ? (totalOpened / totalSuccess) * 100 : 0;
    const clickRate = totalSuccess > 0 ? (totalClicked / totalSuccess) * 100 : 0;

    // Get stats by category
    const byCategory: Record<string, number> = {};
    const categoryStats = await this.prisma.emailLog.groupBy({
      by: ['templateId'],
      where,
      _count: true,
    });

    // Map template IDs to categories
    for (const stat of categoryStats) {
      if (stat.templateId) {
        const template = await this.templateService.findOne(stat.templateId);
        byCategory[template.category] =
          (byCategory[template.category] || 0) + stat._count;
      }
    }

    // Get stats by provider
    const providerStats = await this.prisma.emailLog.groupBy({
      by: ['provider'],
      where,
      _count: true,
    });

    const byProvider: Record<string, number> = {};
    providerStats.forEach((stat) => {
      if (stat.provider) {
        byProvider[stat.provider] = stat._count;
      }
    });

    return {
      totalSent,
      totalSuccess,
      totalFailed,
      successRate: parseFloat(successRate.toFixed(2)),
      totalOpened,
      totalClicked,
      openRate: parseFloat(openRate.toFixed(2)),
      clickRate: parseFloat(clickRate.toFixed(2)),
      byCategory,
      byProvider,
    };
  }

  /**
   * Create email log
   * @param data Log data
   * @returns Created log
   */
  private async createEmailLog(data: {
    templateId?: string;
    recipientEmail: string;
    recipientName?: string;
    subject: string;
    htmlBody: string;
    textBody: string;
    variables?: Record<string, any>;
    provider: string;
  }) {
    return this.prisma.emailLog.create({
      data: {
        templateId: data.templateId,
        recipientEmail: data.recipientEmail,
        recipientName: data.recipientName,
        subject: data.subject,
        htmlBody: data.htmlBody,
        textBody: data.textBody,
        variables: data.variables as any,
        provider: data.provider,
        status: EmailStatus.PENDING,
      },
    });
  }

  /**
   * Update email log
   * @param id Log ID
   * @param data Update data
   */
  private async updateEmailLog(
    id: string,
    data: {
      status?: EmailStatus;
      externalId?: string;
      errorMessage?: string;
      sentAt?: Date | null;
      retryCount?: number;
    },
  ) {
    await this.prisma.emailLog.update({
      where: { id },
      data,
    });
  }
}
