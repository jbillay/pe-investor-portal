import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditEventData {
  action: string;
  userId?: string;
  resource?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: any;
}

/**
 * Global Audit Logger Service
 *
 * Provides centralized audit logging functionality for the entire application.
 * This service should be used across all modules to maintain consistent audit trails.
 *
 * Features:
 * - Centralized audit logging
 * - Error handling that doesn't break main operations
 * - Structured logging with optional metadata
 * - Type-safe audit event data
 *
 * @author Backend Team
 * @version 1.0.0
 */
@Injectable()
export class AuditLoggerService {
  private readonly logger = new Logger(AuditLoggerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Log an audit event to the database
   *
   * @param eventData - The audit event data to log
   * @returns Promise that resolves when the event is logged (or fails silently)
   */
  async logEvent(eventData: AuditEventData): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: eventData.action,
          userId: eventData.userId || null,
          resource: eventData.resource || null,
          ipAddress: eventData.ipAddress || null,
          userAgent: eventData.userAgent || null,
          details: eventData.details || null,
        },
      });

      this.logger.debug(`Audit event logged: ${eventData.action} by user ${eventData.userId}`);
    } catch (error) {
      // Log audit errors but don't fail the main operation
      this.logger.error(`Failed to log audit event: ${eventData.action}`, error);
    }
  }

  /**
   * Convenience method for logging authentication events
   */
  async logAuthEvent(
    action: 'LOGIN' | 'LOGOUT' | 'REGISTER' | 'TOKEN_REFRESH' | 'LOGOUT_ALL' | 'LOGIN_FAILED',
    userId: string,
    ipAddress?: string,
    userAgent?: string,
    details?: any
  ): Promise<void> {
    await this.logEvent({
      action,
      userId,
      resource: 'auth',
      ipAddress,
      userAgent,
      details,
    });
  }

  /**
   * Convenience method for logging user management events
   */
  async logUserEvent(
    action: 'USER_CREATED' | 'USER_UPDATED' | 'USER_DELETED' | 'USER_VIEWED' | 'ROLE_ASSIGNED' | 'ROLE_REVOKED' | 'PERMISSION_GRANTED' | 'PERMISSION_REVOKED',
    performedByUserId: string,
    targetUserId?: string,
    ipAddress?: string,
    userAgent?: string,
    details?: any
  ): Promise<void> {
    await this.logEvent({
      action,
      userId: performedByUserId,
      resource: 'user',
      ipAddress,
      userAgent,
      details: {
        ...details,
        targetUserId,
      },
    });
  }

  /**
   * Convenience method for logging resource access events
   */
  async logResourceEvent(
    action: 'CREATED' | 'UPDATED' | 'DELETED' | 'VIEWED' | 'DOWNLOADED' | 'UPLOADED',
    resourceType: string,
    userId: string,
    resourceId?: string,
    ipAddress?: string,
    userAgent?: string,
    details?: any
  ): Promise<void> {
    await this.logEvent({
      action: `${resourceType.toUpperCase()}_${action}`,
      userId,
      resource: resourceType,
      ipAddress,
      userAgent,
      details: {
        ...details,
        resourceId,
      },
    });
  }

  /**
   * Convenience method for logging security events
   */
  async logSecurityEvent(
    action: 'SUSPICIOUS_ACTIVITY' | 'RATE_LIMIT_EXCEEDED' | 'ACCOUNT_LOCKED' | 'PASSWORD_RESET' | 'PASSWORD_CHANGED',
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
    details?: any
  ): Promise<void> {
    await this.logEvent({
      action,
      userId,
      resource: 'security',
      ipAddress,
      userAgent,
      details,
    });
  }

  /**
   * Convenience method for logging admin actions
   */
  async logAdminEvent(
    action: string,
    adminUserId: string,
    targetResource?: string,
    ipAddress?: string,
    userAgent?: string,
    details?: any
  ): Promise<void> {
    await this.logEvent({
      action: `ADMIN_${action.toUpperCase()}`,
      userId: adminUserId,
      resource: targetResource || 'admin',
      ipAddress,
      userAgent,
      details,
    });
  }
}