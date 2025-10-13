/**
 * Email Module
 *
 * Main module for email templating and sending functionality
 */

import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../database/prisma.module';

// Services
import { TemplateCacheService } from './services/template-cache.service';
import { TemplateRendererService } from './services/template-renderer.service';
import { EmailTemplateService } from './services/email-template.service';
import { SmtpProviderService } from './services/smtp-provider.service';
import { EmailQueueService } from './services/email-queue.service';
import { EmailService } from './services/email.service';

// Controllers
import { EmailTemplateController } from './controllers/email-template.controller';
import { EmailController } from './controllers/email.controller';

// Jobs
import { EmailQueueWorker } from './jobs/email-queue.worker';

/**
 * Email Module
 * Provides comprehensive email templating, queuing, and sending capabilities
 */
@Module({
  imports: [
    PrismaModule,
    ScheduleModule.forRoot(), // Enable cron scheduling
  ],
  controllers: [EmailTemplateController, EmailController],
  providers: [
    // Core services
    TemplateCacheService,
    TemplateRendererService,
    EmailTemplateService,

    // Email providers
    SmtpProviderService,

    // Email services
    EmailQueueService,
    EmailService,

    // Background workers
    EmailQueueWorker,
  ],
  exports: [
    // Export services for use in other modules
    EmailTemplateService,
    EmailService,
    EmailQueueService,
  ],
})
export class EmailModule {}
