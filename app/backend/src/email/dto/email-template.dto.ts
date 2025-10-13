/**
 * Email Template DTOs
 *
 * Data Transfer Objects for email template operations
 */

import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsArray,
  ValidateNested,
  Matches,
  MaxLength,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  EmailCategory,
  TemplateVariableType,
} from '../interfaces/email-template.interface';

/**
 * Template Variable DTO
 */
export class TemplateVariableDto {
  @ApiProperty({
    description: 'Variable name (alphanumeric and underscore only)',
    example: 'firstName',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Variable name must contain only letters, numbers, and underscores',
  })
  name: string;

  @ApiProperty({
    description: 'Variable type',
    enum: ['string', 'number', 'boolean', 'date', 'currency'],
    example: 'string',
  })
  @IsString()
  @IsEnum(['string', 'number', 'boolean', 'date', 'currency'])
  type: TemplateVariableType;

  @ApiProperty({
    description: 'Whether the variable is required',
    example: true,
  })
  @IsBoolean()
  required: boolean;

  @ApiPropertyOptional({
    description: 'Variable description',
    example: 'User first name',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Example value for the variable',
    example: 'John',
  })
  @IsOptional()
  example?: any;

  @ApiPropertyOptional({
    description: 'Default value if not provided',
    example: 'Guest',
  })
  @IsOptional()
  defaultValue?: any;
}

/**
 * Create Email Template DTO
 */
export class CreateEmailTemplateDto {
  @ApiProperty({
    description: 'Unique template name (uppercase with underscores)',
    example: 'USER_ACCOUNT_CREATED',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z0-9_]+$/, {
    message: 'Template name must be uppercase with underscores only',
  })
  name: string;

  @ApiProperty({
    description: 'Display name for the template',
    example: 'Account Created Notification',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  displayName: string;

  @ApiPropertyOptional({
    description: 'Template description',
    example: 'Email sent when a new user account is created',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Email subject line (supports Mustache variables)',
    example: 'Welcome to {{platformName}}, {{firstName}}!',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  subject: string;

  @ApiProperty({
    description: 'HTML email body (supports Mustache variables)',
    example: '<h1>Welcome {{firstName}}!</h1><p>Your account has been created.</p>',
  })
  @IsString()
  @IsNotEmpty()
  htmlBody: string;

  @ApiProperty({
    description: 'Plain text email body (supports Mustache variables)',
    example: 'Welcome {{firstName}}! Your account has been created.',
  })
  @IsString()
  @IsNotEmpty()
  textBody: string;

  @ApiProperty({
    description: 'Template category',
    enum: EmailCategory,
    example: EmailCategory.ACCOUNT,
  })
  @IsEnum(EmailCategory)
  category: EmailCategory;

  @ApiProperty({
    description: 'Variable schema definition',
    type: [TemplateVariableDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateVariableDto)
  variables: TemplateVariableDto[];

  @ApiPropertyOptional({
    description: 'Whether the template is active',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

/**
 * Update Email Template DTO
 */
export class UpdateEmailTemplateDto extends PartialType(CreateEmailTemplateDto) {
  @ApiPropertyOptional({
    description: 'Template name cannot be updated',
  })
  name?: never;
}

/**
 * Email Template Response DTO
 */
export class EmailTemplateResponseDto {
  @ApiProperty({ example: 'clxxx123456789' })
  id: string;

  @ApiProperty({ example: 'USER_ACCOUNT_CREATED' })
  name: string;

  @ApiProperty({ example: 'Account Created Notification' })
  displayName: string;

  @ApiPropertyOptional({ example: 'Email sent when a new user account is created' })
  description?: string;

  @ApiProperty({ example: 'Welcome to {{platformName}}, {{firstName}}!' })
  subject: string;

  @ApiProperty({ example: '<h1>Welcome {{firstName}}!</h1>' })
  htmlBody: string;

  @ApiProperty({ example: 'Welcome {{firstName}}!' })
  textBody: string;

  @ApiProperty({ enum: EmailCategory, example: EmailCategory.ACCOUNT })
  category: EmailCategory;

  @ApiProperty({ type: [TemplateVariableDto] })
  variables: TemplateVariableDto[];

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: false })
  isSystem: boolean;

  @ApiProperty({ example: 1 })
  version: number;

  @ApiProperty({ example: 'clxxx123456789' })
  createdBy: string;

  @ApiPropertyOptional({ example: 'clxxx123456789' })
  updatedBy?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

/**
 * Query Email Templates DTO
 */
export class QueryEmailTemplatesDto {
  @ApiPropertyOptional({
    description: 'Filter by category',
    enum: EmailCategory,
  })
  @IsEnum(EmailCategory)
  @IsOptional()
  category?: EmailCategory;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Search by name or display name',
    example: 'account',
  })
  @IsString()
  @IsOptional()
  search?: string;

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
    example: 20,
    default: 20,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;
}

/**
 * Template Preview DTO
 */
export class TemplatePreviewDto {
  @ApiProperty({
    description: 'Sample variables for preview',
    example: { firstName: 'John', platformName: 'Investor Portal' },
  })
  @IsOptional()
  variables?: Record<string, any>;
}

/**
 * Send Test Email DTO
 */
export class SendTestEmailDto {
  @ApiProperty({
    description: 'Recipient email address',
    example: 'admin@example.com',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
    message: 'Invalid email address',
  })
  recipientEmail: string;

  @ApiProperty({
    description: 'Sample variables for test email',
    example: { firstName: 'John', platformName: 'Investor Portal' },
  })
  @IsOptional()
  variables?: Record<string, any>;
}

/**
 * Paginated template response
 */
export class PaginatedTemplatesResponseDto {
  @ApiProperty({ type: [EmailTemplateResponseDto] })
  data: EmailTemplateResponseDto[];

  @ApiProperty({ example: 25 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 2 })
  totalPages: number;
}

/**
 * Template validation response DTO
 */
export class TemplateValidationResponseDto {
  @ApiProperty({ example: true })
  isValid: boolean;

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        field: { type: 'string' },
        message: { type: 'string' },
        type: { type: 'string' },
      },
    },
  })
  errors: Array<{
    field: string;
    message: string;
    type: string;
  }>;
}
