import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpStatus,
  ValidationPipe,
  UseInterceptors,
  ClassSerializerInterceptor,
  Request,
  Logger,
  Post,
  Body
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
  ApiSecurity,
  ApiExtraModels
} from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { AuthenticatedUser } from '../../auth/interfaces/auth.interface';

interface AuthenticatedRequest extends ExpressRequest {
  user: AuthenticatedUser;
}

import { AuditTrailService } from '../services/audit-trail.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { RequireRoles } from '../decorators/roles.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';

import {
  QueryAuditTrailDto,
  AuditStatsQueryDto,
  ExportAuditTrailDto,
  PaginatedAuditTrailResponseDto,
  AuditStatsResponseDto,
  ExportAuditTrailResponseDto
} from '../dto/audit-trail.dto';

/**
 * Audit Trail Controller
 *
 * Provides comprehensive audit trail management and analytics for SUPER_ADMIN users.
 * This controller handles global audit log retrieval, filtering, statistics, and export
 * functionality with the highest level of security and access control.
 *
 * Security Features:
 * - SUPER_ADMIN role required for all endpoints
 * - JWT Authentication with role-based access control
 * - Rate limiting on sensitive operations
 * - Comprehensive audit logging of all access
 * - Input validation and sanitization
 * - Sensitive data filtering and privacy protection
 *
 * Key Features:
 * - Global audit trail access across all users and resources
 * - Advanced filtering by user, action, resource, IP, date range, etc.
 * - Comprehensive statistics and analytics
 * - Export functionality in multiple formats (CSV, Excel, JSON)
 * - Real-time security event monitoring
 * - Timeline analysis and trending
 *
 * @author Backend Team
 * @version 1.0.0
 */
@ApiTags('Audit Trail Management')
@Controller('admin/audit-trail')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@UseInterceptors(ClassSerializerInterceptor)
@ApiBearerAuth()
@ApiSecurity('bearer')
@ApiExtraModels(
  PaginatedAuditTrailResponseDto,
  AuditStatsResponseDto,
  ExportAuditTrailResponseDto
)
export class AuditTrailController {
  private readonly logger = new Logger(AuditTrailController.name);

  constructor(private readonly auditTrailService: AuditTrailService) {}

  /**
   * Get global audit trail logs with comprehensive filtering
   *
   * Retrieves audit logs from across the entire system with advanced filtering,
   * sorting, and pagination capabilities. This endpoint provides complete visibility
   * into all system activities for security monitoring and compliance purposes.
   *
   * @param query - Query parameters for filtering, sorting, and pagination
   * @param req - Authenticated request with user information
   * @returns Paginated list of audit log entries
   */
  @Get()
  @ApiOperation({
    summary: 'Get global audit trail',
    description: `
      Retrieve a comprehensive, paginated list of audit logs from across the entire system.
      This endpoint provides complete visibility into all user activities, system events,
      and security-related actions for monitoring, compliance, and forensic analysis.

      **Advanced Filtering Options:**
      - **User Filtering**: Filter by specific user ID to see all activities for a user
      - **Action Filtering**: Filter by action type (LOGIN, USER_CREATED, PASSWORD_RESET, etc.)
      - **Resource Filtering**: Filter by resource type (USER, ROLE, PERMISSION, FUND, etc.)
      - **IP Address**: Filter by source IP address for security analysis
      - **Date Range**: Flexible date filtering with start/end dates or days lookback
      - **Full-Text Search**: Search across action, resource, and details fields
      - **Sensitive Data**: Option to include/exclude sensitive information

      **Sorting & Pagination:**
      - Sort by creation date, action, user, or resource
      - Configurable page size (1-100 items per page)
      - Ascending or descending order

      **Security & Privacy:**
      - Automatic PII masking unless specifically requested
      - IP address anonymization for privacy protection
      - Sensitive field redaction in audit details
      - Rate limiting to prevent system abuse

      **Use Cases:**
      - Security incident investigation and forensics
      - Compliance auditing and reporting
      - User activity monitoring and analysis
      - System performance and usage analytics
      - Fraud detection and prevention

      **Security Requirements:**
      - **Authentication**: Valid JWT token required
      - **Authorization**: SUPER_ADMIN role mandatory
      - **Rate Limiting**: 60 requests per minute per user
      - **Audit Logging**: All access is comprehensively logged
    `
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved audit trail logs',
    type: PaginatedAuditTrailResponseDto,
    schema: {
      example: {
        data: [
          {
            id: 'clfa2qhe40000j3gbahzp12s4',
            userId: 'clfuser123456789abcdefgh',
            action: 'USER_CREATED',
            resource: 'USER',
            details: {
              targetUserId: 'clfnewuser123456789abcd',
              changes: {
                email: 'newuser@example.com',
                isActive: true,
                roles: ['INVESTOR']
              },
              metadata: {
                correlationId: 'req-789456123',
                sessionId: 'sess-abc123def456'
              }
            },
            ipAddress: '192.168.1.XXX',
            userAgent: 'Chrome/120',
            createdAt: '2024-01-15T10:30:00.000Z',
            user: {
              id: 'clfuser123456789abcdefgh',
              email: 'admin@example.com',
              firstName: 'John',
              lastName: 'Admin'
            }
          }
        ],
        pagination: {
          page: 1,
          limit: 50,
          total: 15000,
          totalPages: 300,
          hasNextPage: true,
          hasPreviousPage: false
        },
        filters: {
          dateRange: '2024-01-01 to 2024-01-31',
          totalDays: 30,
          filters: {
            action: 'USER_CREATED',
            resource: 'USER'
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters or malformed request',
    schema: {
      example: {
        error: {
          code: 'INVALID_QUERY_PARAMETERS',
          message: 'Invalid date range: start date must be before end date',
          details: {
            field: 'startDate',
            value: '2024-12-31',
            constraint: 'Must be before endDate'
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
    schema: {
      example: {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired authentication token'
        }
      }
    }
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions (SUPER_ADMIN required)',
    schema: {
      example: {
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'SUPER_ADMIN role required to access audit trail'
        }
      }
    }
  })
  @ApiResponse({
    status: 429,
    description: 'Too Many Requests - Rate limit exceeded',
    schema: {
      example: {
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
          retryAfter: 60
        }
      }
    }
  })
  @RequireRoles('SUPER_ADMIN')
  @RateLimit({ limit: 60, window: 60 }) // 60 requests per minute
  @AuditLog('AUDIT_TRAIL_ACCESSED', 'AUDIT_LOG')
  async getAuditTrail(
    @Query(new ValidationPipe({ transform: true })) query: QueryAuditTrailDto,
    @Request() req: AuthenticatedRequest
  ): Promise<PaginatedAuditTrailResponseDto> {
    this.logger.log(`SUPER_ADMIN ${req.user.id} accessing global audit trail with filters: ${JSON.stringify(query)}`);
    return this.auditTrailService.getAuditTrail(query, req.user.id);
  }

  /**
   * Get comprehensive audit trail statistics and analytics
   *
   * Provides detailed statistical analysis of audit trail data including
   * timeline trends, top actions/resources/users, security events, and
   * comprehensive system activity metrics.
   *
   * @param query - Statistics query parameters
   * @param req - Authenticated request with user information
   * @returns Comprehensive audit trail statistics and analytics
   */
  @Get('statistics')
  @ApiOperation({
    summary: 'Get audit trail statistics',
    description: `
      Retrieve comprehensive statistics and analytics from the audit trail data.
      This endpoint provides deep insights into system usage patterns, security events,
      user behavior, and overall system health for strategic decision making.

      **Analytics Provided:**
      - **Summary Statistics**: Total events, unique users, actions, and resources
      - **Timeline Analysis**: Activity trends over time with configurable grouping
      - **Top Activity Rankings**: Most frequent actions, resources, and active users
      - **Security Metrics**: Failed logins, password resets, suspicious activities
      - **User Behavior**: Activity patterns and engagement metrics
      - **System Health**: Performance indicators and usage trends

      **Grouping Options:**
      - **Hourly**: Detailed analysis for recent activity (last 24-48 hours)
      - **Daily**: Standard analysis for weekly/monthly periods
      - **Weekly**: Trend analysis for quarterly periods
      - **Monthly**: Long-term trend analysis for yearly periods

      **Time Period Flexibility:**
      - Custom date ranges with start and end dates
      - Quick periods: last 7, 30, 90, 365 days
      - Automatic period selection based on data volume

      **Security Intelligence:**
      - Failed authentication attempts and patterns
      - Password security events and compliance
      - Suspicious activity detection and alerts
      - Account security status and recommendations

      **Performance Metrics:**
      - System usage patterns and peak times
      - User engagement and activity levels
      - Resource utilization and access patterns
      - Operational efficiency indicators

      **Security Requirements:**
      - **Authentication**: Valid JWT token required
      - **Authorization**: SUPER_ADMIN role mandatory
      - **Rate Limiting**: 30 requests per hour per user
      - **Audit Logging**: All access is comprehensively logged
    `
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved audit trail statistics',
    type: AuditStatsResponseDto,
    schema: {
      example: {
        summary: {
          totalEvents: 150000,
          uniqueUsers: 2500,
          uniqueActions: 45,
          uniqueResources: 8,
          timeRange: '2024-01-01T00:00:00.000Z to 2024-01-31T23:59:59.999Z'
        },
        timeline: [
          {
            period: '2024-01-01',
            count: 1500,
            uniqueUsers: 250
          },
          {
            period: '2024-01-02',
            count: 1800,
            uniqueUsers: 300
          }
        ],
        topActions: [
          {
            action: 'LOGIN',
            count: 50000,
            percentage: 33.3
          },
          {
            action: 'USER_READ',
            count: 30000,
            percentage: 20.0
          }
        ],
        topResources: [
          {
            resource: 'USER',
            count: 80000,
            percentage: 53.3
          },
          {
            resource: 'AUTH',
            count: 50000,
            percentage: 33.3
          }
        ],
        topUsers: [
          {
            userId: 'clfadmin123456789abcdef',
            userEmail: 'admin@example.com',
            count: 5000,
            percentage: 3.3
          }
        ],
        securityEvents: {
          failedLogins: 450,
          passwordResets: 120,
          suspiciousActivity: 30,
          accountLockouts: 20
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters for statistics',
    schema: {
      example: {
        error: {
          code: 'INVALID_STATS_PARAMETERS',
          message: 'Invalid groupBy value. Must be one of: hour, day, week, month'
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token'
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - SUPER_ADMIN role required'
  })
  @ApiResponse({
    status: 429,
    description: 'Too Many Requests - Rate limit exceeded'
  })
  @RequireRoles('SUPER_ADMIN')
  @RateLimit({ limit: 30, window: 3600 }) // 30 requests per hour
  @AuditLog('AUDIT_STATISTICS_ACCESSED', 'AUDIT_LOG')
  async getAuditStatistics(
    @Query(new ValidationPipe({ transform: true })) query: AuditStatsQueryDto,
    @Request() req: AuthenticatedRequest
  ): Promise<AuditStatsResponseDto> {
    this.logger.log(`SUPER_ADMIN ${req.user.id} accessing audit trail statistics for period: ${JSON.stringify(query)}`);
    return this.auditTrailService.getAuditStatistics(query, req.user.id);
  }

  /**
   * Export audit trail data in various formats
   *
   * Generates and provides secure download links for audit trail data exports
   * in multiple formats (CSV, Excel, JSON) with customizable field selection
   * and comprehensive security controls.
   *
   * @param exportDto - Export parameters and configuration
   * @param req - Authenticated request with user information
   * @returns Export download information and secure URL
   */
  @Post('export')
  @ApiOperation({
    summary: 'Export audit trail data',
    description: `
      Generate and export audit trail data in various formats with advanced filtering
      and field selection capabilities. This endpoint creates secure, time-limited
      download links for comprehensive audit data exports.

      **Export Formats:**
      - **CSV**: Comma-separated values for spreadsheet analysis
      - **Excel (XLSX)**: Rich formatting with multiple sheets and charts
      - **JSON**: Structured data for programmatic processing and integration

      **Customization Options:**
      - **Field Selection**: Choose specific fields to include in export
      - **Date Range**: Export data from specific time periods
      - **Filtering**: Apply same filters as the main audit trail endpoint
      - **Sensitive Data**: Control inclusion of sensitive information
      - **Format Options**: Customize export structure and formatting

      **Available Fields for Export:**
      - Basic: id, userId, action, resource, createdAt
      - Extended: details, ipAddress, userAgent, user information
      - Sensitive: Full details including PII and security information
      - Custom: Select any combination of available fields

      **Security Features:**
      - **Secure Downloads**: Presigned URLs with expiration (24 hours)
      - **Access Control**: Full audit trail of all export operations
      - **Data Protection**: Automatic PII masking unless explicitly requested
      - **File Encryption**: All export files are encrypted at rest
      - **Compliance**: GDPR/SOX compliant data handling and retention

      **Export Limitations:**
      - **Record Limit**: Maximum 10,000 records per export
      - **File Size**: Maximum 50MB per export file
      - **Rate Limiting**: 5 exports per hour per user
      - **Retention**: Export files are automatically deleted after 24 hours

      **Use Cases:**
      - Compliance reporting and audit documentation
      - Security incident investigation and forensics
      - Data analysis and business intelligence
      - Regulatory reporting and compliance
      - Integration with external security tools

      **Security Requirements:**
      - **Authentication**: Valid JWT token required
      - **Authorization**: SUPER_ADMIN role mandatory
      - **Rate Limiting**: 5 requests per hour per user
      - **Audit Logging**: All exports are comprehensively logged
    `
  })
  @ApiResponse({
    status: 200,
    description: 'Export file generated successfully',
    type: ExportAuditTrailResponseDto,
    schema: {
      example: {
        downloadUrl: 'https://secure-cdn.example.com/exports/audit-trail-2024-01-15-abc123.csv?signature=xyz789&expires=1705401600',
        fileName: 'audit-trail-2024-01-15-abc123.csv',
        format: 'csv',
        recordCount: 8500,
        fileSize: 2048000,
        expiresAt: '2024-01-16T10:30:00.000Z'
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid export parameters or request too large',
    schema: {
      example: {
        error: {
          code: 'EXPORT_REQUEST_TOO_LARGE',
          message: 'Export request exceeds maximum record limit of 10,000',
          details: {
            requestedRecords: 15000,
            maxRecords: 10000,
            suggestion: 'Use date range filtering to reduce the dataset size'
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token'
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - SUPER_ADMIN role required'
  })
  @ApiResponse({
    status: 429,
    description: 'Too Many Requests - Export rate limit exceeded (5 per hour)',
    schema: {
      example: {
        error: {
          code: 'EXPORT_RATE_LIMIT_EXCEEDED',
          message: 'Export rate limit exceeded. Maximum 5 exports per hour.',
          retryAfter: 3600
        }
      }
    }
  })
  @RequireRoles('SUPER_ADMIN')
  @RateLimit({ limit: 5, window: 3600 }) // 5 exports per hour
  @AuditLog('AUDIT_TRAIL_EXPORTED', 'AUDIT_LOG')
  async exportAuditTrail(
    @Body(new ValidationPipe({ transform: true })) exportDto: ExportAuditTrailDto,
    @Request() req: AuthenticatedRequest
  ): Promise<ExportAuditTrailResponseDto> {
    this.logger.log(`SUPER_ADMIN ${req.user.id} exporting audit trail in ${exportDto.format} format with ${exportDto.fields?.length || 'all'} fields`);
    return this.auditTrailService.exportAuditTrail(exportDto, req.user.id);
  }
}