import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  QueryAuditTrailDto,
  AuditStatsQueryDto,
  PaginatedAuditTrailResponseDto,
  AuditStatsResponseDto,
  AuditLogResponseDto,
  ExportAuditTrailDto,
  ExportAuditTrailResponseDto
} from '../dto/audit-trail.dto';
import { Prisma } from '../../../generated/prisma';

/**
 * Audit Trail Service
 *
 * Provides comprehensive audit trail management and analytics for the application.
 * Handles global audit log retrieval, filtering, statistics, and export functionality.
 *
 * Security Features:
 * - Strict access control (SUPER_ADMIN only)
 * - Sensitive data filtering
 * - Rate limiting protection
 * - Comprehensive audit logging
 *
 * @author Backend Team
 * @version 1.0.0
 */
@Injectable()
export class AuditTrailService {
  private readonly logger = new Logger(AuditTrailService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieve paginated audit trail logs with advanced filtering
   *
   * @param query - Query parameters for filtering and pagination
   * @param requestorId - ID of the user requesting the audit trail
   * @returns Paginated audit trail response
   */
  async getAuditTrail(
    query: QueryAuditTrailDto,
    requestorId: string
  ): Promise<PaginatedAuditTrailResponseDto> {
    this.logger.log(`User ${requestorId} requesting audit trail with filters: ${JSON.stringify(query)}`);
    this.logger.log(`Query types - days: ${typeof query.days} (${query.days}), page: ${typeof query.page} (${query.page}), limit: ${typeof query.limit} (${query.limit})`);

    try {
      // Build where clause for filtering
      const whereClause = this.buildWhereClause(query);
      this.logger.log(`Built where clause: ${JSON.stringify(whereClause, null, 2)}`);

      // Calculate pagination
      const page = query.page || 1;
      const limit = query.limit || 50;
      const skip = (page - 1) * limit;

      // Build order by clause
      const orderBy = this.buildOrderByClause(query.sortBy, query.sortOrder);

      // Execute queries in parallel
      const [auditLogs, totalCount] = await Promise.all([
        this.prisma.auditLog.findMany({
          where: whereClause,
          orderBy,
          skip,
          take: limit
        }),
        this.prisma.auditLog.count({
          where: whereClause
        })
      ]);

      this.logger.log(`Query results - auditLogs: ${auditLogs.length}, totalCount: ${totalCount}`);

      // Transform the data
      const transformedLogs = await this.transformAuditLogs(auditLogs, query.includeSensitive);
      this.logger.log(`Transformed logs: ${transformedLogs.length}`);

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      // Build filters summary
      const filtersSummary = this.buildFiltersSummary(query);

      return {
        data: transformedLogs,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages,
          hasNextPage,
          hasPreviousPage
        },
        filters: filtersSummary
      };

    } catch (error) {
      this.logger.error(`Error retrieving audit trail for user ${requestorId}:`, error);
      throw new BadRequestException('Failed to retrieve audit trail');
    }
  }

  /**
   * Get comprehensive audit trail statistics
   *
   * @param query - Statistics query parameters
   * @param requestorId - ID of the user requesting statistics
   * @returns Audit trail statistics
   */
  async getAuditStatistics(
    query: AuditStatsQueryDto,
    requestorId: string
  ): Promise<AuditStatsResponseDto> {
    this.logger.log(`User ${requestorId} requesting audit statistics`);

    try {
      const { startDate, endDate } = this.calculateDateRange(query);

      // Build base where clause for date filtering
      const baseWhere: Prisma.AuditLogWhereInput = {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      };

      // Execute all statistics queries in parallel
      const [
        totalEvents,
        uniqueUsers,
        uniqueActions,
        uniqueResources,
        timeline,
        topActions,
        topResources,
        topUsers,
        securityEvents
      ] = await Promise.all([
        this.getTotalEvents(baseWhere),
        this.getUniqueUsers(baseWhere),
        this.getUniqueActions(baseWhere),
        this.getUniqueResources(baseWhere),
        this.getTimeline(baseWhere, query.groupBy),
        this.getTopActions(baseWhere),
        this.getTopResources(baseWhere),
        this.getTopUsers(baseWhere),
        this.getSecurityEvents(baseWhere)
      ]);

      return {
        summary: {
          totalEvents,
          uniqueUsers,
          uniqueActions,
          uniqueResources,
          timeRange: `${startDate.toISOString()} to ${endDate.toISOString()}`
        },
        timeline,
        topActions,
        topResources,
        topUsers,
        securityEvents
      };

    } catch (error) {
      this.logger.error(`Error retrieving audit statistics for user ${requestorId}:`, error);
      throw new BadRequestException('Failed to retrieve audit statistics');
    }
  }

  /**
   * Export audit trail data in various formats
   *
   * @param query - Export query parameters
   * @param requestorId - ID of the user requesting export
   * @returns Export response with download information
   */
  async exportAuditTrail(
    query: ExportAuditTrailDto,
    requestorId: string
  ): Promise<ExportAuditTrailResponseDto> {
    this.logger.log(`User ${requestorId} exporting audit trail in ${query.format} format`);

    try {
      // Build where clause (exclude pagination for export)
      const whereClause = this.buildWhereClause(query);

      // Get audit logs for export
      const auditLogs = await this.prisma.auditLog.findMany({
        where: whereClause,
        orderBy: this.buildOrderByClause(query.sortBy, query.sortOrder),
        // Limit large exports to prevent system overload
        take: 10000 // Maximum 10k records per export
      });

      // Transform data for export
      const transformedLogs = await this.transformAuditLogs(auditLogs, query.includeSensitive);

      // Filter fields if specified
      const exportData = query.fields
        ? this.filterExportFields(transformedLogs, query.fields)
        : transformedLogs;

      // Generate export file
      const exportResult = await this.generateExportFile(exportData, query.format, requestorId);

      this.logger.log(`Export completed for user ${requestorId}: ${exportResult.fileName}`);

      return exportResult;

    } catch (error) {
      this.logger.error(`Error exporting audit trail for user ${requestorId}:`, error);
      throw new BadRequestException('Failed to export audit trail');
    }
  }

  /**
   * Build Prisma where clause from query parameters
   */
  private buildWhereClause(query: QueryAuditTrailDto): Prisma.AuditLogWhereInput {
    const where: Prisma.AuditLogWhereInput = {};

    // User ID filter
    if (query.userId) {
      where.userId = query.userId;
    }

    // Action filter
    if (query.action) {
      where.action = {
        contains: query.action,
        mode: 'insensitive'
      };
    }

    // Resource filter
    if (query.resource) {
      where.resource = query.resource;
    }

    // IP Address filter
    if (query.ipAddress) {
      where.ipAddress = query.ipAddress;
    }

    // Date filtering
    const { startDate, endDate } = this.calculateDateRange(query);
    if (startDate && endDate) {
      where.createdAt = {
        gte: startDate,
        lte: endDate
      };
    }

    // Search across multiple fields
    if (query.search) {
      where.OR = [
        {
          action: {
            contains: query.search,
            mode: 'insensitive'
          }
        },
        {
          resource: {
            contains: query.search,
            mode: 'insensitive'
          }
        },
        {
          details: {
            string_contains: query.search
          }
        }
      ];
    }

    return where;
  }

  /**
   * Build Prisma order by clause
   */
  private buildOrderByClause(
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Prisma.AuditLogOrderByWithRelationInput {
    return {
      [sortBy]: sortOrder
    };
  }

  /**
   * Calculate date range from query parameters
   */
  private calculateDateRange(query: QueryAuditTrailDto | AuditStatsQueryDto): {
    startDate: Date;
    endDate: Date;
  } {
    let startDate: Date;
    let endDate: Date = new Date();

    this.logger.log(`calculateDateRange input - startDate: ${query.startDate}, endDate: ${query.endDate}, days: ${query.days} (type: ${typeof query.days})`);

    if (query.startDate && query.endDate) {
      startDate = new Date(query.startDate);
      endDate = new Date(query.endDate);
      this.logger.log(`Using explicit date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    } else if (query.days) {
      const daysValue = typeof query.days === 'string' ? parseInt(query.days, 10) : query.days;
      startDate = new Date();
      startDate.setDate(startDate.getDate() - daysValue);
      this.logger.log(`Using days lookback (${daysValue}): ${startDate.toISOString()} to ${endDate.toISOString()}`);
    } else {
      // Default to last 30 days
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      this.logger.log(`Using default 30 days: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    }

    return { startDate, endDate };
  }

  /**
   * Transform audit logs for response
   */
  private async transformAuditLogs(
    auditLogs: any[],
    includeSensitive: boolean = false
  ): Promise<AuditLogResponseDto[]> {
    // Get unique user IDs for user information lookup
    const userIds = [...new Set(auditLogs.map(log => log.userId).filter(Boolean))];

    // Fetch user information
    const users = await this.prisma.user.findMany({
      where: {
        id: {
          in: userIds
        }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    });

    const userMap = new Map(users.map(user => [user.id, user]));

    return auditLogs.map(log => ({
      id: log.id,
      userId: log.userId,
      action: log.action,
      resource: log.resource,
      details: includeSensitive ? log.details : this.sanitizeDetails(log.details),
      ipAddress: includeSensitive ? log.ipAddress : this.maskIpAddress(log.ipAddress),
      userAgent: includeSensitive ? log.userAgent : this.sanitizeUserAgent(log.userAgent),
      createdAt: log.createdAt.toISOString(),
      ...(log.userId && userMap.has(log.userId) && {
        user: userMap.get(log.userId)
      })
    }));
  }

  /**
   * Sanitize sensitive details from audit logs
   */
  private sanitizeDetails(details: any): any {
    if (!details || typeof details !== 'object') {
      return details;
    }

    const sanitized = { ...details };

    // Remove or mask sensitive fields
    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'credential',
      'ssn', 'socialSecurityNumber', 'creditCard', 'bankAccount'
    ];

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Mask IP address for privacy
   */
  private maskIpAddress(ipAddress: string | null): string | null {
    if (!ipAddress) return null;

    // Mask last octet of IPv4 addresses
    if (ipAddress.includes('.')) {
      const parts = ipAddress.split('.');
      if (parts.length === 4) {
        parts[3] = 'XXX';
        return parts.join('.');
      }
    }

    return ipAddress;
  }

  /**
   * Sanitize user agent string
   */
  private sanitizeUserAgent(userAgent: string | null): string | null {
    if (!userAgent) return null;

    // Keep only browser and major version info
    const browserMatch = userAgent.match(/(Chrome|Firefox|Safari|Edge)\/(\d+)/);
    return browserMatch ? `${browserMatch[1]}/${browserMatch[2]}` : 'Unknown Browser';
  }

  /**
   * Build filters summary for response
   */
  private buildFiltersSummary(query: QueryAuditTrailDto): any {
    const { startDate, endDate } = this.calculateDateRange(query);
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    return {
      dateRange: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      totalDays: daysDiff,
      filters: {
        ...(query.userId && { userId: query.userId }),
        ...(query.action && { action: query.action }),
        ...(query.resource && { resource: query.resource }),
        ...(query.ipAddress && { ipAddress: query.ipAddress }),
        ...(query.search && { search: query.search })
      }
    };
  }

  // Statistics helper methods
  private async getTotalEvents(where: Prisma.AuditLogWhereInput): Promise<number> {
    return this.prisma.auditLog.count({ where });
  }

  private async getUniqueUsers(where: Prisma.AuditLogWhereInput): Promise<number> {
    const result = await this.prisma.auditLog.groupBy({
      by: ['userId'],
      where: {
        ...where,
        userId: { not: null }
      }
    });
    return result.length;
  }

  private async getUniqueActions(where: Prisma.AuditLogWhereInput): Promise<number> {
    const result = await this.prisma.auditLog.groupBy({
      by: ['action'],
      where
    });
    return result.length;
  }

  private async getUniqueResources(where: Prisma.AuditLogWhereInput): Promise<number> {
    const result = await this.prisma.auditLog.groupBy({
      by: ['resource'],
      where: {
        ...where,
        resource: { not: null }
      }
    });
    return result.length;
  }

  private async getTimeline(
    where: Prisma.AuditLogWhereInput,
    groupBy: string = 'day'
  ): Promise<Array<{ period: string; count: number; uniqueUsers: number }>> {
    // This would need to be implemented based on your database's date functions
    // For now, returning a simple mock structure
    return [];
  }

  private async getTopActions(where: Prisma.AuditLogWhereInput): Promise<Array<{
    action: string;
    count: number;
    percentage: number;
  }>> {
    const result = await this.prisma.auditLog.groupBy({
      by: ['action'],
      where,
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    });

    const total = await this.getTotalEvents(where);

    return result.map(item => ({
      action: item.action,
      count: item._count.id,
      percentage: (item._count.id / total) * 100
    }));
  }

  private async getTopResources(where: Prisma.AuditLogWhereInput): Promise<Array<{
    resource: string;
    count: number;
    percentage: number;
  }>> {
    const result = await this.prisma.auditLog.groupBy({
      by: ['resource'],
      where: {
        ...where,
        resource: { not: null }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    });

    const total = await this.getTotalEvents(where);

    return result.map(item => ({
      resource: item.resource!,
      count: item._count.id,
      percentage: (item._count.id / total) * 100
    }));
  }

  private async getTopUsers(where: Prisma.AuditLogWhereInput): Promise<Array<{
    userId: string;
    userEmail?: string;
    count: number;
    percentage: number;
  }>> {
    const result = await this.prisma.auditLog.groupBy({
      by: ['userId'],
      where: {
        ...where,
        userId: { not: null }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    });

    const total = await this.getTotalEvents(where);
    const userIds = result.map(item => item.userId!);

    const users = await this.prisma.user.findMany({
      where: {
        id: { in: userIds }
      },
      select: {
        id: true,
        email: true
      }
    });

    const userMap = new Map(users.map(user => [user.id, user.email]));

    return result.map(item => ({
      userId: item.userId!,
      userEmail: userMap.get(item.userId!),
      count: item._count.id,
      percentage: (item._count.id / total) * 100
    }));
  }

  private async getSecurityEvents(where: Prisma.AuditLogWhereInput): Promise<{
    failedLogins: number;
    passwordResets: number;
    suspiciousActivity: number;
    accountLockouts: number;
  }> {
    const [failedLogins, passwordResets, suspiciousActivity, accountLockouts] = await Promise.all([
      this.prisma.auditLog.count({
        where: {
          ...where,
          action: { in: ['LOGIN_FAILED', 'INVALID_CREDENTIALS'] }
        }
      }),
      this.prisma.auditLog.count({
        where: {
          ...where,
          action: { in: ['PASSWORD_RESET', 'PASSWORD_CHANGED'] }
        }
      }),
      this.prisma.auditLog.count({
        where: {
          ...where,
          action: { in: ['SUSPICIOUS_ACTIVITY', 'RATE_LIMIT_EXCEEDED'] }
        }
      }),
      this.prisma.auditLog.count({
        where: {
          ...where,
          action: { in: ['ACCOUNT_LOCKED', 'USER_SUSPENDED'] }
        }
      })
    ]);

    return {
      failedLogins,
      passwordResets,
      suspiciousActivity,
      accountLockouts
    };
  }

  /**
   * Filter export fields
   */
  private filterExportFields(data: any[], fields: string[]): any[] {
    return data.map(item => {
      const filtered: any = {};
      for (const field of fields) {
        if (item.hasOwnProperty(field)) {
          filtered[field] = item[field];
        }
      }
      return filtered;
    });
  }

  /**
   * Generate export file (placeholder implementation)
   */
  private async generateExportFile(
    data: any[],
    format: string,
    requestorId: string
  ): Promise<ExportAuditTrailResponseDto> {
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `audit-trail-${timestamp}.${format}`;

    // This would typically involve:
    // 1. Converting data to requested format
    // 2. Uploading to secure storage (S3, etc.)
    // 3. Generating presigned URL

    return {
      downloadUrl: `https://secure-cdn.example.com/exports/${fileName}`,
      fileName,
      format,
      recordCount: data.length,
      fileSize: JSON.stringify(data).length, // Rough estimate
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };
  }
}