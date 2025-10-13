/**
 * Send Email DTOs
 *
 * Data Transfer Objects for email sending operations
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsNumber,
  Min,
  Max,
  Matches,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Email Attachment DTO
 */
export class EmailAttachmentDto {
  @ApiProperty({
    description: 'Attachment filename',
    example: 'document.pdf',
  })
  @IsString()
  @IsNotEmpty()
  filename: string;

  @ApiPropertyOptional({
    description: 'Attachment content (base64 encoded)',
  })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({
    description: 'File path (alternative to content)',
  })
  @IsString()
  @IsOptional()
  path?: string;

  @ApiPropertyOptional({
    description: 'Content type',
    example: 'application/pdf',
  })
  @IsString()
  @IsOptional()
  contentType?: string;
}

/**
 * Send Email DTO
 */
export class SendEmailDto {
  @ApiProperty({
    description: 'Recipient email address',
    example: 'user@example.com',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
    message: 'Invalid email address',
  })
  to: string;

  @ApiProperty({
    description: 'Email subject',
    example: 'Welcome to Investor Portal',
  })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({
    description: 'Plain text content',
    example: 'Welcome to our platform!',
  })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({
    description: 'HTML content',
    example: '<h1>Welcome to our platform!</h1>',
  })
  @IsString()
  @IsNotEmpty()
  html: string;

  @ApiPropertyOptional({
    description: 'Reply-to email address',
    example: 'noreply@example.com',
  })
  @IsString()
  @IsOptional()
  @Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
  replyTo?: string;

  @ApiPropertyOptional({
    description: 'CC recipients',
    type: [String],
    example: ['cc@example.com'],
  })
  @IsArray()
  @IsOptional()
  cc?: string[];

  @ApiPropertyOptional({
    description: 'BCC recipients',
    type: [String],
    example: ['bcc@example.com'],
  })
  @IsArray()
  @IsOptional()
  bcc?: string[];

  @ApiPropertyOptional({
    description: 'Email attachments',
    type: [EmailAttachmentDto],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => EmailAttachmentDto)
  attachments?: EmailAttachmentDto[];

  @ApiPropertyOptional({
    description: 'Email priority (1=highest, 10=lowest)',
    example: 5,
    default: 5,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(10)
  priority?: number;
}

/**
 * Send Templated Email DTO
 */
export class SendTemplatedEmailDto {
  @ApiProperty({
    description: 'Template name',
    example: 'USER_ACCOUNT_CREATED',
  })
  @IsString()
  @IsNotEmpty()
  templateName: string;

  @ApiProperty({
    description: 'Recipient email address',
    example: 'user@example.com',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
    message: 'Invalid email address',
  })
  recipientEmail: string;

  @ApiPropertyOptional({
    description: 'Recipient name',
    example: 'John Doe',
  })
  @IsString()
  @IsOptional()
  recipientName?: string;

  @ApiProperty({
    description: 'Template variables',
    example: { firstName: 'John', platformName: 'Investor Portal' },
  })
  @IsOptional()
  variables?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Reply-to email address',
    example: 'support@example.com',
  })
  @IsString()
  @IsOptional()
  @Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
  replyTo?: string;

  @ApiPropertyOptional({
    description: 'CC recipients',
    type: [String],
  })
  @IsArray()
  @IsOptional()
  cc?: string[];

  @ApiPropertyOptional({
    description: 'BCC recipients',
    type: [String],
  })
  @IsArray()
  @IsOptional()
  bcc?: string[];

  @ApiPropertyOptional({
    description: 'Email attachments',
    type: [EmailAttachmentDto],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => EmailAttachmentDto)
  attachments?: EmailAttachmentDto[];

  @ApiPropertyOptional({
    description: 'Email priority (1=highest, 10=lowest)',
    example: 5,
    default: 5,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(10)
  priority?: number;

  @ApiPropertyOptional({
    description: 'Schedule email for future delivery',
    example: '2024-12-31T23:59:59Z',
  })
  @IsDateString()
  @IsOptional()
  scheduledFor?: string;
}

/**
 * Queue Email DTO
 */
export class QueueEmailDto extends SendTemplatedEmailDto {
  // Inherits all properties from SendTemplatedEmailDto
}

/**
 * Email Send Response DTO
 */
export class EmailSendResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'clxxx123456789' })
  emailLogId: string;

  @ApiPropertyOptional({ example: '<message-id@example.com>' })
  messageId?: string;

  @ApiProperty({ example: 'Email sent successfully' })
  message: string;
}

/**
 * Email Queue Response DTO
 */
export class EmailQueueResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'clxxx123456789' })
  queueId: string;

  @ApiProperty({ example: 'Email queued for delivery' })
  message: string;

  @ApiPropertyOptional()
  scheduledFor?: Date;
}
