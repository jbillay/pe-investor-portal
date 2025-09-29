import {
  IsOptional,
  IsString,
  IsDateString,
  IsNumber,
  Min,
  Max,
  IsIn,
  IsArray,
  ValidateNested,
  IsBoolean
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Query parameters for retrieving audit trail logs
 */
export class QueryAuditTrailDto {
  @ApiPropertyOptional({
    description: 'Filter by user ID',
    example: 'clfa2qhe40000j3gbahzp12s4'
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Filter by action type',
    example: 'USER_CREATED',
    examples: {
      userActions: {
        summary: 'User Actions',
        value: 'USER_CREATED'
      },
      authActions: {
        summary: 'Authentication Actions',
        value: 'LOGIN'
      },
      roleActions: {
        summary: 'Role Actions',
        value: 'ROLE_ASSIGNED'
      }
    }
  })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({
    description: 'Filter by resource type',
    example: 'USER',
    enum: ['USER', 'ROLE', 'PERMISSION', 'AUTH', 'SYSTEM', 'FUND', 'INVESTMENT', 'DOCUMENT']
  })
  @IsOptional()
  @IsString()
  @IsIn(['USER', 'ROLE', 'PERMISSION', 'AUTH', 'SYSTEM', 'FUND', 'INVESTMENT', 'DOCUMENT'])
  resource?: string;

  @ApiPropertyOptional({
    description: 'Filter by IP address',
    example: '192.168.1.100'
  })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({
    description: 'Start date for filtering (ISO 8601 format)',
    example: '2024-01-01T00:00:00.000Z'
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for filtering (ISO 8601 format)',
    example: '2024-12-31T23:59:59.999Z'
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Number of days to look back from current date',
    example: 30,
    minimum: 1,
    maximum: 365
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(365)
  days?: number;

  @ApiPropertyOptional({
    description: 'Search term for filtering across action, resource, and details',
    example: 'password reset'
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'createdAt',
    enum: ['createdAt', 'action', 'userId', 'resource']
  })
  @IsOptional()
  @IsString()
  @IsIn(['createdAt', 'action', 'userId', 'resource'])
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'desc',
    enum: ['asc', 'desc']
  })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({
    description: 'Page number for pagination (1-based)',
    example: 1,
    minimum: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 50,
    minimum: 1,
    maximum: 100
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @ApiPropertyOptional({
    description: 'Include sensitive audit details (requires special permissions)',
    example: false
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeSensitive?: boolean = false;
}

/**
 * Audit trail statistics query parameters
 */
export class AuditStatsQueryDto {
  @ApiPropertyOptional({
    description: 'Start date for statistics period',
    example: '2024-01-01T00:00:00.000Z'
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for statistics period',
    example: '2024-12-31T23:59:59.999Z'
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Number of days to look back for statistics',
    example: 30,
    minimum: 1,
    maximum: 365
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(365)
  days?: number = 30;

  @ApiPropertyOptional({
    description: 'Group statistics by time period',
    example: 'day',
    enum: ['hour', 'day', 'week', 'month']
  })
  @IsOptional()
  @IsString()
  @IsIn(['hour', 'day', 'week', 'month'])
  groupBy?: string = 'day';
}

/**
 * Single audit log entry response
 */
export class AuditLogResponseDto {
  @ApiProperty({
    description: 'Unique audit log ID',
    example: 'clfa2qhe40000j3gbahzp12s4'
  })
  id: string;

  @ApiProperty({
    description: 'User ID who performed the action',
    example: 'clfa2qhe40000j3gbahzp12s4',
    nullable: true
  })
  userId: string | null;

  @ApiProperty({
    description: 'Action that was performed',
    example: 'USER_CREATED'
  })
  action: string;

  @ApiProperty({
    description: 'Resource that was acted upon',
    example: 'USER',
    nullable: true
  })
  resource: string | null;

  @ApiProperty({
    description: 'Additional details about the action',
    example: {
      targetUserId: 'clfa2qhe40000j3gbahzp12s4',
      changes: {
        email: 'new@example.com',
        isActive: true
      },
      metadata: {
        userAgent: 'Mozilla/5.0...',
        correlationId: 'req-123456'
      }
    },
    nullable: true
  })
  details: Record<string, any> | null;

  @ApiProperty({
    description: 'IP address from which the action was performed',
    example: '192.168.1.100',
    nullable: true
  })
  ipAddress: string | null;

  @ApiProperty({
    description: 'User agent string',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    nullable: true
  })
  userAgent: string | null;

  @ApiProperty({
    description: 'Timestamp when the action was performed',
    example: '2024-01-15T10:30:00.000Z'
  })
  createdAt: string;

  @ApiPropertyOptional({
    description: 'User information (included when available)',
    example: {
      id: 'clfa2qhe40000j3gbahzp12s4',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe'
    }
  })
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

/**
 * Paginated audit trail response
 */
export class PaginatedAuditTrailResponseDto {
  @ApiProperty({
    description: 'Array of audit log entries',
    type: [AuditLogResponseDto]
  })
  @ValidateNested({ each: true })
  @Type(() => AuditLogResponseDto)
  data: AuditLogResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    example: {
      page: 1,
      limit: 50,
      total: 1250,
      totalPages: 25,
      hasNextPage: true,
      hasPreviousPage: false
    }
  })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };

  @ApiProperty({
    description: 'Applied filters summary',
    example: {
      dateRange: '2024-01-01 to 2024-01-31',
      totalDays: 30,
      filters: {
        action: 'USER_CREATED',
        resource: 'USER'
      }
    }
  })
  filters: {
    dateRange?: string;
    totalDays?: number;
    filters: Record<string, any>;
  };
}

/**
 * Audit trail statistics response
 */
export class AuditStatsResponseDto {
  @ApiProperty({
    description: 'Summary statistics',
    example: {
      totalEvents: 15000,
      uniqueUsers: 250,
      uniqueActions: 45,
      uniqueResources: 8,
      timeRange: '2024-01-01 to 2024-01-31'
    }
  })
  summary: {
    totalEvents: number;
    uniqueUsers: number;
    uniqueActions: number;
    uniqueResources: number;
    timeRange: string;
  };

  @ApiProperty({
    description: 'Events grouped by time period',
    example: [
      {
        period: '2024-01-01',
        count: 150,
        uniqueUsers: 25
      },
      {
        period: '2024-01-02',
        count: 180,
        uniqueUsers: 30
      }
    ]
  })
  timeline: Array<{
    period: string;
    count: number;
    uniqueUsers: number;
  }>;

  @ApiProperty({
    description: 'Top actions by frequency',
    example: [
      {
        action: 'LOGIN',
        count: 5000,
        percentage: 33.3
      },
      {
        action: 'USER_READ',
        count: 3000,
        percentage: 20.0
      }
    ]
  })
  topActions: Array<{
    action: string;
    count: number;
    percentage: number;
  }>;

  @ApiProperty({
    description: 'Top resources by activity',
    example: [
      {
        resource: 'USER',
        count: 8000,
        percentage: 53.3
      },
      {
        resource: 'AUTH',
        count: 5000,
        percentage: 33.3
      }
    ]
  })
  topResources: Array<{
    resource: string;
    count: number;
    percentage: number;
  }>;

  @ApiProperty({
    description: 'Most active users',
    example: [
      {
        userId: 'clfa2qhe40000j3gbahzp12s4',
        userEmail: 'admin@example.com',
        count: 500,
        percentage: 3.3
      }
    ]
  })
  topUsers: Array<{
    userId: string;
    userEmail?: string;
    count: number;
    percentage: number;
  }>;

  @ApiProperty({
    description: 'Security-related events',
    example: {
      failedLogins: 45,
      passwordResets: 12,
      suspiciousActivity: 3,
      accountLockouts: 2
    }
  })
  securityEvents: {
    failedLogins: number;
    passwordResets: number;
    suspiciousActivity: number;
    accountLockouts: number;
  };
}

/**
 * Export audit trail query parameters
 */
export class ExportAuditTrailDto extends QueryAuditTrailDto {
  @ApiProperty({
    description: 'Export format',
    example: 'csv',
    enum: ['csv', 'xlsx', 'json']
  })
  @IsString()
  @IsIn(['csv', 'xlsx', 'json'])
  format: 'csv' | 'xlsx' | 'json';

  @ApiPropertyOptional({
    description: 'Include sensitive data in export (requires special permissions)',
    example: false
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeSensitive?: boolean = false;

  @ApiPropertyOptional({
    description: 'Fields to include in export',
    example: ['id', 'userId', 'action', 'resource', 'createdAt']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fields?: string[];
}

/**
 * Export response
 */
export class ExportAuditTrailResponseDto {
  @ApiProperty({
    description: 'Download URL for the exported file',
    example: 'https://secure-cdn.example.com/exports/audit-trail-2024-01-15.csv'
  })
  downloadUrl: string;

  @ApiProperty({
    description: 'Export file name',
    example: 'audit-trail-2024-01-15.csv'
  })
  fileName: string;

  @ApiProperty({
    description: 'Export format',
    example: 'csv'
  })
  format: string;

  @ApiProperty({
    description: 'Number of records exported',
    example: 1500
  })
  recordCount: number;

  @ApiProperty({
    description: 'File size in bytes',
    example: 256000
  })
  fileSize: number;

  @ApiProperty({
    description: 'Export expires at (ISO 8601 format)',
    example: '2024-01-16T10:30:00.000Z'
  })
  expiresAt: string;
}