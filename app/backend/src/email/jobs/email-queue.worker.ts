/**
 * Email Queue Worker
 *
 * Background worker that processes queued emails using cron scheduling
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EmailService } from '../services/email.service';
import { EmailQueueService } from '../services/email-queue.service';

/**
 * Email Queue Worker
 * Processes queued emails on a scheduled basis
 */
@Injectable()
export class EmailQueueWorker {
  private readonly logger = new Logger(EmailQueueWorker.name);
  private isProcessing = false;

  constructor(
    private readonly emailService: EmailService,
    private readonly queueService: EmailQueueService,
  ) {}

  /**
   * Process queued emails every minute
   * Processes batch of emails from the queue
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async processEmailQueue(): Promise<void> {
    // Prevent concurrent processing
    if (this.isProcessing) {
      this.logger.debug('Queue processing already in progress, skipping...');
      return;
    }

    this.isProcessing = true;

    try {
      const batchSize = parseInt(
        process.env.EMAIL_QUEUE_BATCH_SIZE || '10',
        10,
      );

      this.logger.debug(`Processing email queue (batch size: ${batchSize})`);

      const processed = await this.emailService.processQueue(batchSize);

      if (processed > 0) {
        this.logger.log(`Processed ${processed} queued emails`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error processing email queue: ${errorMessage}`);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Clean up old completed queue items every day at midnight
   * Removes completed items older than 7 days
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupCompletedJobs(): Promise<void> {
    try {
      this.logger.debug('Cleaning up old completed queue items');

      const olderThanDays = parseInt(
        process.env.EMAIL_QUEUE_CLEANUP_DAYS || '7',
        10,
      );

      const count = await this.queueService.cleanupCompleted(olderThanDays);

      this.logger.log(`Cleaned up ${count} old completed queue items`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error cleaning up queue: ${errorMessage}`);
    }
  }

  /**
   * Get queue statistics (called on-demand)
   */
  async getQueueStats() {
    return this.queueService.getQueueStats();
  }
}
