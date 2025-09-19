import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsBoolean,
  IsArray,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsDateString,
  IsIn
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { UserLanguage } from './create-user.dto';

export enum UserSortField {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  LAST_LOGIN = 'lastLogin',
  EMAIL = 'email',
  FIRST_NAME = 'firstName',
  LAST_NAME = 'lastName',
  STATUS = 'isActive'
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended'
}

/**
 * DTO for querying users with advanced filtering, sorting, and pagination
 */
export class QueryUsersDto {
  @ApiProperty({
    description: 'Page number (1-based)',
    example: 1,
    minimum: 1,
    default: 1,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit must not exceed 100' })
  limit?: number = 20;

  @ApiProperty({
    description: 'Search term for name, email, or other text fields',
    example: 'john',
    required: false
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  search?: string;

  @ApiProperty({
    description: 'Filter by user status',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
    required: false
  })
  @IsOptional()
  @IsEnum(UserStatus, { message: 'Status must be a valid user status' })
  status?: UserStatus;

  @ApiProperty({
    description: 'Filter by verification status',
    example: true,
    required: false
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isVerified?: boolean;

  @ApiProperty({
    description: 'Filter by roles (exact match)',
    example: ['INVESTOR', 'ADMIN'],
    required: false,
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles?: string[];

  @ApiProperty({
    description: 'Filter by preferred language',
    enum: UserLanguage,
    example: UserLanguage.EN,
    required: false
  })
  @IsOptional()
  @IsEnum(UserLanguage, { message: 'Language must be a valid language code' })
  language?: UserLanguage;

  @ApiProperty({
    description: 'Filter by timezone',
    example: 'America/New_York',
    required: false
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({
    description: 'Filter users created after this date',
    example: '2024-01-01T00:00:00Z',
    format: 'date-time',
    required: false
  })
  @IsOptional()
  @IsDateString({}, { message: 'Created after must be a valid ISO date string' })
  createdAfter?: string;

  @ApiProperty({
    description: 'Filter users created before this date',
    example: '2024-12-31T23:59:59Z',
    format: 'date-time',
    required: false
  })
  @IsOptional()
  @IsDateString({}, { message: 'Created before must be a valid ISO date string' })
  createdBefore?: string;

  @ApiProperty({
    description: 'Filter users with last login after this date',
    example: '2024-01-01T00:00:00Z',
    format: 'date-time',
    required: false
  })
  @IsOptional()
  @IsDateString({}, { message: 'Last login after must be a valid ISO date string' })
  lastLoginAfter?: string;

  @ApiProperty({
    description: 'Filter users with last login before this date',
    example: '2024-12-31T23:59:59Z',
    format: 'date-time',
    required: false
  })
  @IsOptional()
  @IsDateString({}, { message: 'Last login before must be a valid ISO date string' })
  lastLoginBefore?: string;

  @ApiProperty({
    description: 'Include users with no login activity',
    example: false,
    default: true,
    required: false
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeNeverLoggedIn?: boolean = true;

  @ApiProperty({
    description: 'Field to sort by',
    enum: UserSortField,
    example: UserSortField.CREATED_AT,
    default: UserSortField.CREATED_AT,
    required: false
  })
  @IsOptional()
  @IsEnum(UserSortField, { message: 'Sort field must be a valid field name' })
  sortBy?: UserSortField = UserSortField.CREATED_AT;

  @ApiProperty({
    description: 'Sort order',
    enum: SortOrder,
    example: SortOrder.DESC,
    default: SortOrder.DESC,
    required: false
  })
  @IsOptional()
  @IsEnum(SortOrder, { message: 'Sort order must be asc or desc' })
  sortOrder?: SortOrder = SortOrder.DESC;

  @ApiProperty({
    description: 'Include user profile information',
    example: true,
    default: false,
    required: false
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeProfile?: boolean = false;

  @ApiProperty({
    description: 'Include user roles information',
    example: true,
    default: true,
    required: false
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeRoles?: boolean = true;

  @ApiProperty({
    description: 'Include user statistics (login count, last activity, etc.)',
    example: false,
    default: false,
    required: false
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeStats?: boolean = false;
}

/**
 * DTO for user statistics query
 */
export class UserStatsQueryDto {
  @ApiProperty({
    description: 'Start date for statistics period',
    example: '2024-01-01T00:00:00Z',
    format: 'date-time',
    required: false
  })
  @IsOptional()
  @IsDateString({}, { message: 'Start date must be a valid ISO date string' })
  startDate?: string;

  @ApiProperty({
    description: 'End date for statistics period',
    example: '2024-12-31T23:59:59Z',
    format: 'date-time',
    required: false
  })
  @IsOptional()
  @IsDateString({}, { message: 'End date must be a valid ISO date string' })
  endDate?: string;

  @ApiProperty({
    description: 'Group statistics by period',
    example: 'month',
    enum: ['day', 'week', 'month', 'quarter', 'year'],
    default: 'month',
    required: false
  })
  @IsOptional()
  @IsIn(['day', 'week', 'month', 'quarter', 'year'])
  groupBy?: string = 'month';
}