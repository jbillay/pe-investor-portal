/**
 * Email Log DTOs
 *
 * Data Transfer Objects for email log operations
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EmailStatus } from '../interfaces/email-template.interface';

/**
 * Query Email Logs DTO
 */
export class QueryEmailLogsDto {
  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: EmailStatus,
  })
  @IsEnum(EmailStatus)
  @IsOptional()
  status?: EmailStatus;

  @ApiPropertyOptional({
    description: 'Filter by template ID',
    example: 'clxxx123456789',
  })
  @IsString()
  @IsOptional()
  templateId?: string;

  @ApiPropertyOptional({
    description: 'Filter by recipient email',
    example: 'user@example.com',
  })
  @IsString()
  @IsOptional()
  recipientEmail?: string;

  @ApiPropertyOptional({
    description: 'Filter by date from (ISO 8601)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter by date to (ISO 8601)',
    example: '2024-12-31T23:59:59Z',
  })
  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 50,
    default: 50,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 50;

  @ApiPropertyOptional({
    description: 'Sort by field',
    example: 'createdAt',
    default: 'createdAt',
  })
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    example: 'desc',
    default: 'desc',
  })
  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

/**
 * Email Log Response DTO
 */
export class EmailLogResponseDto {
  @ApiProperty({ example: 'clxxx123456789' })
  id: string;

  @ApiPropertyOptional({ example: 'clxxx123456789' })
  templateId?: string;

  @ApiProperty({ example: 'user@example.com' })
  recipientEmail: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  recipientName?: string;

  @ApiProperty({ example: 'Welcome to Investor Portal' })
  subject: string;

  @ApiProperty({ example: 'SENT', enum: EmailStatus })
  status: EmailStatus;

  @ApiPropertyOptional({ example: { firstName: 'John' } })
  variables?: Record<string, any>;

  @ApiPropertyOptional({ example: 'SMTP connection failed' })
  errorMessage?: string;

  @ApiPropertyOptional()
  sentAt?: Date;

  @ApiPropertyOptional()
  openedAt?: Date;

  @ApiPropertyOptional()
  clickedAt?: Date;

  @ApiPropertyOptional({ example: 'smtp' })
  provider?: string;

  @ApiPropertyOptional({ example: '<message-id@example.com>' })
  externalId?: string;

  @ApiProperty({ example: 0 })
  retryCount: number;

  @ApiProperty({ example: 3 })
  maxRetries: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

/**
 * Paginated email logs response
 */
export class PaginatedEmailLogsResponseDto {
  @ApiProperty({ type: [EmailLogResponseDto] })
  data: EmailLogResponseDto[];

  @ApiProperty({ example: 150 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 50 })
  limit: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}

/**
 * Email statistics DTO
 */
export class EmailStatsDto {
  @ApiProperty({ example: 1000 })
  totalSent: number;

  @ApiProperty({ example: 950 })
  totalSuccess: number;

  @ApiProperty({ example: 50 })
  totalFailed: number;

  @ApiProperty({ example: 95.0 })
  successRate: number;

  @ApiProperty({ example: 300 })
  totalOpened: number;

  @ApiProperty({ example: 150 })
  totalClicked: number;

  @ApiProperty({ example: 31.58 })
  openRate: number;

  @ApiProperty({ example: 15.79 })
  clickRate: number;

  @ApiProperty({
    example: {
      ACCOUNT: 400,
      DOCUMENT: 300,
      CAPITAL_CALL: 200,
      DISTRIBUTION: 100,
    },
  })
  byCategory: Record<string, number>;

  @ApiProperty({
    example: {
      smtp: 1000,
    },
  })
  byProvider: Record<string, number>;
}

/**
 * Retry Email DTO
 */
export class RetryEmailDto {
  @ApiProperty({
    description: 'Email log ID to retry',
    example: 'clxxx123456789',
  })
  @IsString()
  logId: string;
}
