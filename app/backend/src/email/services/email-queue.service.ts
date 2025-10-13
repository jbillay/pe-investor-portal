/**
 * Email Queue Service
 *
 * Database-backed email queue management
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EmailQueueStatus } from '../interfaces/email-template.interface';

/**
 * Queue statistics interface
 */
export interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}

/**
 * Email Queue Service
 * Manages database-backed email queue
 */
@Injectable()
export class EmailQueueService {
  private readonly logger = new Logger(EmailQueueService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Add email to queue
   * @param data Email queue data
   * @returns Queued email record
   */
  async enqueue(data: {
    templateId?: string;
    recipientEmail: string;
    recipientName?: string;
    variables: Record<string, any>;
    priority?: number;
    scheduledFor?: Date;
  }) {
    this.logger.debug(`Enqueueing email to: ${data.recipientEmail}`);

    const queueItem = await this.prisma.emailQueue.create({
      data: {
        templateId: data.templateId,
        recipientEmail: data.recipientEmail,
        recipientName: data.recipientName,
        variables: data.variables as any,
        priority: data.priority || 5,
        scheduledFor: data.scheduledFor || new Date(),
        status: EmailQueueStatus.PENDING,
      },
    });

    this.logger.log(`Email queued: ${queueItem.id}`);

    return queueItem;
  }

  /**
   * Get pending emails ready to process
   * @param batchSize Number of emails to fetch
   * @returns Array of pending emails
   */
  async getPendingEmails(batchSize: number = 10) {
    const now = new Date();

    // Get pending emails that are scheduled for now or earlier
    // Order by priority (1=highest) and then by scheduled time
    const pending = await this.prisma.emailQueue.findMany({
      where: {
        status: EmailQueueStatus.PENDING,
        scheduledFor: { lte: now },
        attempts: { lt: this.prisma.emailQueue.fields.maxAttempts },
      },
      orderBy: [{ priority: 'asc' }, { scheduledFor: 'asc' }],
      take: batchSize,
    });

    this.logger.debug(`Found ${pending.length} pending emails`);

    return pending;
  }

  /**
   * Mark email as processing
   * @param id Queue item ID
   */
  async markAsProcessing(id: string) {
    await this.prisma.emailQueue.update({
      where: { id },
      data: {
        status: EmailQueueStatus.PROCESSING,
        attempts: { increment: 1 },
      },
    });
  }

  /**
   * Mark email as completed
   * @param id Queue item ID
   * @param emailLogId Associated email log ID
   */
  async markAsCompleted(id: string, emailLogId: string) {
    await this.prisma.emailQueue.update({
      where: { id },
      data: {
        status: EmailQueueStatus.COMPLETED,
        processedAt: new Date(),
        emailLogId,
      },
    });

    this.logger.debug(`Email queue item completed: ${id}`);
  }

  /**
   * Mark email as failed
   * @param id Queue item ID
   * @param errorMessage Error message
   */
  async markAsFailed(id: string, errorMessage: string) {
    const queueItem = await this.prisma.emailQueue.findUnique({
      where: { id },
    });

    if (!queueItem) {
      return;
    }

    // If max attempts reached, mark as failed permanently
    // Otherwise, keep as pending for retry
    const status =
      queueItem.attempts >= queueItem.maxAttempts
        ? EmailQueueStatus.FAILED
        : EmailQueueStatus.PENDING;

    // Calculate exponential backoff for retry
    // 5 minutes * 2^attempts
    const retryDelay = 5 * 60 * 1000 * Math.pow(2, queueItem.attempts);
    const scheduledFor = new Date(Date.now() + retryDelay);

    await this.prisma.emailQueue.update({
      where: { id },
      data: {
        status,
        errorMessage,
        scheduledFor: status === EmailQueueStatus.PENDING ? scheduledFor : undefined,
      },
    });

    this.logger.warn(
      `Email queue item ${status === EmailQueueStatus.FAILED ? 'failed permanently' : 'scheduled for retry'}: ${id}`,
    );
  }

  /**
   * Get queue statistics
   * @returns Queue stats
   */
  async getQueueStats(): Promise<QueueStats> {
    const [pending, processing, completed, failed, total] = await Promise.all([
      this.prisma.emailQueue.count({
        where: { status: EmailQueueStatus.PENDING },
      }),
      this.prisma.emailQueue.count({
        where: { status: EmailQueueStatus.PROCESSING },
      }),
      this.prisma.emailQueue.count({
        where: { status: EmailQueueStatus.COMPLETED },
      }),
      this.prisma.emailQueue.count({
        where: { status: EmailQueueStatus.FAILED },
      }),
      this.prisma.emailQueue.count(),
    ]);

    return {
      pending,
      processing,
      completed,
      failed,
      total,
    };
  }

  /**
   * Clean up old completed queue items
   * @param olderThanDays Remove completed items older than this many days
   */
  async cleanupCompleted(olderThanDays: number = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.prisma.emailQueue.deleteMany({
      where: {
        status: EmailQueueStatus.COMPLETED,
        processedAt: { lt: cutoffDate },
      },
    });

    this.logger.log(
      `Cleaned up ${result.count} completed queue items older than ${olderThanDays} days`,
    );

    return result.count;
  }

  /**
   * Retry failed email
   * @param id Queue item ID
   */
  async retryFailed(id: string) {
    const queueItem = await this.prisma.emailQueue.findUnique({
      where: { id },
    });

    if (!queueItem) {
      throw new Error(`Queue item ${id} not found`);
    }

    if (queueItem.status !== EmailQueueStatus.FAILED) {
      throw new Error(`Queue item ${id} is not in failed status`);
    }

    await this.prisma.emailQueue.update({
      where: { id },
      data: {
        status: EmailQueueStatus.PENDING,
        attempts: 0,
        errorMessage: null,
        scheduledFor: new Date(),
      },
    });

    this.logger.log(`Email queue item reset for retry: ${id}`);
  }
}
