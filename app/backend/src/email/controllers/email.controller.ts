/**
 * Email Controller
 *
 * RESTful API for email operations, logs, and queue management
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../guards/super-admin.guard';
import { EmailService } from '../services/email.service';
import { EmailQueueService } from '../services/email-queue.service';
import { EmailQueueWorker } from '../jobs/email-queue.worker';
import {
  SendEmailDto,
  SendTemplatedEmailDto,
  QueueEmailDto,
  EmailSendResponseDto,
  EmailQueueResponseDto,
} from '../dto/send-email.dto';
import {
  QueryEmailLogsDto,
  EmailLogResponseDto,
  PaginatedEmailLogsResponseDto,
  EmailStatsDto,
} from '../dto/email-log.dto';

@ApiTags('Email Operations')
@Controller('admin/emails')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@ApiBearerAuth('JWT-auth')
export class EmailController {
  constructor(
    private readonly emailService: EmailService,
    private readonly queueService: EmailQueueService,
    private readonly queueWorker: EmailQueueWorker,
  ) {}

  @ApiOperation({
    summary: 'Send email directly',
    description: 'Send an email immediately without using a template. Requires SUPER_ADMIN role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Email sent successfully',
    type: EmailSendResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid email data' })
  @ApiForbiddenResponse({ description: 'SUPER_ADMIN role required' })
  @Post('send')
  async sendEmail(@Body() dto: SendEmailDto) {
    return this.emailService.sendEmail(dto);
  }

  @ApiOperation({
    summary: 'Send templated email',
    description: 'Send an email using a template with variables. Requires SUPER_ADMIN role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Email sent successfully',
    type: EmailSendResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Template not found or inactive' })
  @ApiBadRequestResponse({ description: 'Invalid template variables' })
  @Post('send-templated')
  async sendTemplatedEmail(@Body() dto: SendTemplatedEmailDto) {
    return this.emailService.sendTemplatedEmail(dto);
  }

  @ApiOperation({
    summary: 'Queue email for later',
    description: 'Add email to queue for background processing.',
  })
  @ApiResponse({
    status: 201,
    description: 'Email queued successfully',
    type: EmailQueueResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Template not found' })
  @ApiBadRequestResponse({ description: 'Invalid template variables' })
  @Post('queue')
  async queueEmail(@Body() dto: QueueEmailDto) {
    return this.emailService.queueEmail(dto);
  }

  @ApiOperation({
    summary: 'Get email logs',
    description: 'Retrieve email logs with filtering and pagination.',
  })
  @ApiResponse({
    status: 200,
    description: 'Email logs retrieved successfully',
    type: PaginatedEmailLogsResponseDto,
  })
  @Get('logs')
  async getEmailLogs(@Query() query: QueryEmailLogsDto) {
    return this.emailService.getEmailLogs(query);
  }

  @ApiOperation({
    summary: 'Get email log by ID',
    description: 'Retrieve a specific email log with full details.',
  })
  @ApiParam({ name: 'id', description: 'Email log ID' })
  @ApiResponse({
    status: 200,
    description: 'Email log retrieved successfully',
    type: EmailLogResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Email log not found' })
  @Get('logs/:id')
  async getEmailLog(@Param('id') id: string) {
    return this.emailService.getEmailLog(id);
  }

  @ApiOperation({
    summary: 'Retry failed email',
    description: 'Retry sending a failed email.',
  })
  @ApiParam({ name: 'id', description: 'Email log ID' })
  @ApiResponse({
    status: 200,
    description: 'Email retry initiated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Email log not found' })
  @ApiBadRequestResponse({
    description: 'Email is not in failed status or exceeded max retries',
  })
  @Post('logs/:id/retry')
  async retryEmail(@Param('id') id: string) {
    return this.emailService.retryFailedEmail(id);
  }

  @ApiOperation({
    summary: 'Get email statistics',
    description: 'Retrieve email statistics for a given time period.',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    type: EmailStatsDto,
  })
  @Get('stats')
  async getStats(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.emailService.getEmailStats(dateFrom, dateTo);
  }

  @ApiOperation({
    summary: 'Get queue statistics',
    description: 'Retrieve current email queue statistics.',
  })
  @ApiResponse({
    status: 200,
    description: 'Queue statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        pending: { type: 'number' },
        processing: { type: 'number' },
        completed: { type: 'number' },
        failed: { type: 'number' },
        total: { type: 'number' },
      },
    },
  })
  @Get('queue/stats')
  async getQueueStats() {
    return this.queueWorker.getQueueStats();
  }

  @ApiOperation({
    summary: 'Retry failed queue item',
    description: 'Reset a failed queue item for retry.',
  })
  @ApiParam({ name: 'id', description: 'Queue item ID' })
  @ApiResponse({
    status: 200,
    description: 'Queue item reset successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Queue item not found' })
  @ApiBadRequestResponse({ description: 'Queue item is not in failed status' })
  @Post('queue/:id/retry')
  async retryQueueItem(@Param('id') id: string) {
    await this.queueService.retryFailed(id);
    return {
      success: true,
      message: 'Queue item reset for retry',
    };
  }
}
