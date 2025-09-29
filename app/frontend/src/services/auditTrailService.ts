import { apiClient } from '@composables/useApi';

// Types matching backend DTOs
export interface AuditLogEntry {
  id: string;
  userId: string | null;
  action: string;
  resource: string | null;
  details: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface PaginatedAuditTrailResponse {
  data: AuditLogEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  filters: {
    dateRange?: string;
    totalDays?: number;
    filters: Record<string, any>;
  };
}

export interface AuditStatsResponse {
  summary: {
    totalEvents: number;
    uniqueUsers: number;
    uniqueActions: number;
    uniqueResources: number;
    timeRange: string;
  };
  timeline: Array<{
    period: string;
    count: number;
    uniqueUsers: number;
  }>;
  topActions: Array<{
    action: string;
    count: number;
    percentage: number;
  }>;
  topResources: Array<{
    resource: string;
    count: number;
    percentage: number;
  }>;
  topUsers: Array<{
    userId: string;
    userEmail?: string;
    count: number;
    percentage: number;
  }>;
  securityEvents: {
    failedLogins: number;
    passwordResets: number;
    suspiciousActivity: number;
    accountLockouts: number;
  };
}

export interface ExportAuditTrailResponse {
  downloadUrl: string;
  fileName: string;
  format: string;
  recordCount: number;
  fileSize: number;
  expiresAt: string;
}

export interface AuditTrailQuery {
  userId?: string;
  action?: string;
  resource?: string;
  ipAddress?: string;
  startDate?: string;
  endDate?: string;
  days?: number;
  search?: string;
  sortBy?: 'createdAt' | 'action' | 'userId' | 'resource';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  includeSensitive?: boolean;
}

export interface AuditStatsQuery {
  startDate?: string;
  endDate?: string;
  days?: number;
  groupBy?: 'hour' | 'day' | 'week' | 'month';
}

export interface ExportAuditTrailRequest {
  format: 'csv' | 'xlsx' | 'json';
  includeSensitive?: boolean;
  fields?: string[];
  // Includes all the filtering options from AuditTrailQuery
  userId?: string;
  action?: string;
  resource?: string;
  ipAddress?: string;
  startDate?: string;
  endDate?: string;
  days?: number;
  search?: string;
  sortBy?: 'createdAt' | 'action' | 'userId' | 'resource';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Audit Trail Service
 *
 * Provides methods to interact with the backend audit trail API
 * for retrieving audit logs, statistics, and exporting data.
 */
export class AuditTrailService {
  private readonly baseUrl = '/admin/audit-trail';

  /**
   * Get audit trail logs with filtering and pagination
   */
  async getAuditTrail(query: AuditTrailQuery = {}): Promise<PaginatedAuditTrailResponse> {
    const params = new URLSearchParams();

    // Add query parameters
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    const response = await apiClient.get(`${this.baseUrl}?${params.toString()}`);
    return response.data || response;
  }

  /**
   * Get audit trail statistics and analytics
   */
  async getAuditStatistics(query: AuditStatsQuery = {}): Promise<AuditStatsResponse> {
    const params = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    const response = await apiClient.get(`${this.baseUrl}/statistics?${params.toString()}`);
    return response.data || response;
  }

  /**
   * Export audit trail data
   */
  async exportAuditTrail(request: ExportAuditTrailRequest): Promise<ExportAuditTrailResponse> {
    const response = await apiClient.post(`${this.baseUrl}/export`, request);
    return response.data || response;
  }

  /**
   * Download exported audit trail file
   */
  async downloadExport(downloadUrl: string, fileName: string): Promise<void> {
    try {
      const response = await fetch(downloadUrl);

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  /**
   * Get available filter options for dropdowns
   */
  getFilterOptions() {
    return {
      actions: [
        { label: 'Login', value: 'LOGIN' },
        { label: 'Logout', value: 'LOGOUT' },
        { label: 'Register', value: 'REGISTER' },
        { label: 'Token Refresh', value: 'TOKEN_REFRESH' },
        { label: 'User Created', value: 'USER_CREATED' },
        { label: 'User Updated', value: 'USER_UPDATED' },
        { label: 'User Deleted', value: 'USER_DELETED' },
        { label: 'User Viewed', value: 'USER_VIEWED' },
        { label: 'Role Assigned', value: 'ROLE_ASSIGNED' },
        { label: 'Role Revoked', value: 'ROLE_REVOKED' },
        { label: 'Permission Granted', value: 'PERMISSION_GRANTED' },
        { label: 'Permission Revoked', value: 'PERMISSION_REVOKED' },
        { label: 'Password Reset', value: 'PASSWORD_RESET' },
        { label: 'Password Changed', value: 'PASSWORD_CHANGED' },
        { label: 'Suspicious Activity', value: 'SUSPICIOUS_ACTIVITY' },
        { label: 'Rate Limit Exceeded', value: 'RATE_LIMIT_EXCEEDED' },
        { label: 'Account Locked', value: 'ACCOUNT_LOCKED' },
        { label: 'User Suspended', value: 'USER_SUSPENDED' },
      ],
      resources: [
        { label: 'User', value: 'USER' },
        { label: 'Role', value: 'ROLE' },
        { label: 'Permission', value: 'PERMISSION' },
        { label: 'Authentication', value: 'AUTH' },
        { label: 'System', value: 'SYSTEM' },
        { label: 'Fund', value: 'FUND' },
        { label: 'Investment', value: 'INVESTMENT' },
        { label: 'Document', value: 'DOCUMENT' },
        { label: 'Security', value: 'SECURITY' },
      ],
      dateRanges: [
        { label: 'Last hour', value: { days: undefined, hours: 1 } },
        { label: 'Last 24 hours', value: { days: 1 } },
        { label: 'Last 7 days', value: { days: 7 } },
        { label: 'Last 30 days', value: { days: 30 } },
        { label: 'Last 90 days', value: { days: 90 } },
        { label: 'Last 365 days', value: { days: 365 } },
      ],
      sortFields: [
        { label: 'Created Date', value: 'createdAt' },
        { label: 'Action', value: 'action' },
        { label: 'User', value: 'userId' },
        { label: 'Resource', value: 'resource' },
      ],
      sortOrders: [
        { label: 'Newest First', value: 'desc' },
        { label: 'Oldest First', value: 'asc' },
      ],
      exportFormats: [
        { label: 'CSV', value: 'csv', icon: 'pi pi-file' },
        { label: 'Excel', value: 'xlsx', icon: 'pi pi-file-excel' },
        { label: 'JSON', value: 'json', icon: 'pi pi-code' },
      ],
      exportFields: [
        { label: 'ID', value: 'id' },
        { label: 'User ID', value: 'userId' },
        { label: 'Action', value: 'action' },
        { label: 'Resource', value: 'resource' },
        { label: 'Details', value: 'details' },
        { label: 'IP Address', value: 'ipAddress' },
        { label: 'User Agent', value: 'userAgent' },
        { label: 'Created At', value: 'createdAt' },
        { label: 'User Info', value: 'user' },
      ],
    };
  }

  /**
   * Transform backend audit log entry to frontend format
   */
  transformAuditLogEntry(entry: AuditLogEntry) {
    return {
      id: entry.id,
      userId: entry.userId,
      action: entry.action,
      resource: entry.resource,
      details: entry.details,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      createdAt: entry.createdAt,
      user: entry.user,
      // Additional computed fields for UI
      eventType: this.getEventType(entry.action),
      severity: this.getSeverity(entry.action, entry.details),
      status: this.getStatus(entry.action, entry.details),
      description: this.getDescription(entry.action, entry.resource, entry.details),
      userDisplayName: entry.user
        ? `${entry.user.firstName || ''} ${entry.user.lastName || ''}`.trim() || entry.user.email
        : 'System',
    };
  }

  private getEventType(action: string): string {
    const eventTypeMap: Record<string, string> = {
      'LOGIN': 'AUTHENTICATION',
      'LOGOUT': 'AUTHENTICATION',
      'REGISTER': 'AUTHENTICATION',
      'TOKEN_REFRESH': 'AUTHENTICATION',
      'USER_CREATED': 'USER_MANAGEMENT',
      'USER_UPDATED': 'USER_MANAGEMENT',
      'USER_DELETED': 'USER_MANAGEMENT',
      'USER_VIEWED': 'USER_MANAGEMENT',
      'ROLE_ASSIGNED': 'ACCESS_CONTROL',
      'ROLE_REVOKED': 'ACCESS_CONTROL',
      'PERMISSION_GRANTED': 'ACCESS_CONTROL',
      'PERMISSION_REVOKED': 'ACCESS_CONTROL',
      'PASSWORD_RESET': 'SECURITY',
      'PASSWORD_CHANGED': 'SECURITY',
      'SUSPICIOUS_ACTIVITY': 'SECURITY',
      'RATE_LIMIT_EXCEEDED': 'SECURITY',
      'ACCOUNT_LOCKED': 'SECURITY',
      'USER_SUSPENDED': 'SECURITY',
    };
    return eventTypeMap[action] || 'SYSTEM';
  }

  private getSeverity(action: string, details: any): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const criticalActions = ['SUSPICIOUS_ACTIVITY', 'ACCOUNT_LOCKED', 'USER_SUSPENDED'];
    const highActions = ['ROLE_ASSIGNED', 'ROLE_REVOKED', 'PERMISSION_GRANTED', 'PERMISSION_REVOKED', 'PASSWORD_RESET'];
    const mediumActions = ['USER_CREATED', 'USER_UPDATED', 'USER_DELETED', 'PASSWORD_CHANGED'];

    if (criticalActions.includes(action)) return 'CRITICAL';
    if (highActions.includes(action)) return 'HIGH';
    if (mediumActions.includes(action)) return 'MEDIUM';
    return 'LOW';
  }

  private getStatus(action: string, details: any): 'SUCCESS' | 'FAILED' | 'PENDING' {
    // Check if details indicate failure
    if (details?.error || details?.failed || action.includes('FAILED')) {
      return 'FAILED';
    }
    if (details?.pending || action.includes('PENDING')) {
      return 'PENDING';
    }
    return 'SUCCESS';
  }

  private getDescription(action: string, resource: string | null, details: any): string {
    const descriptions: Record<string, string> = {
      'LOGIN': 'User successfully logged in',
      'LOGOUT': 'User logged out',
      'REGISTER': 'New user account registered',
      'TOKEN_REFRESH': 'Authentication token refreshed',
      'USER_CREATED': 'New user account created',
      'USER_UPDATED': 'User profile information updated',
      'USER_DELETED': 'User account deleted',
      'USER_VIEWED': 'User profile accessed',
      'ROLE_ASSIGNED': 'Role assigned to user',
      'ROLE_REVOKED': 'Role removed from user',
      'PERMISSION_GRANTED': 'Permission granted',
      'PERMISSION_REVOKED': 'Permission revoked',
      'PASSWORD_RESET': 'Password reset by administrator',
      'PASSWORD_CHANGED': 'Password changed',
      'SUSPICIOUS_ACTIVITY': 'Suspicious activity detected',
      'RATE_LIMIT_EXCEEDED': 'Rate limit exceeded',
      'ACCOUNT_LOCKED': 'Account locked due to security policy',
      'USER_SUSPENDED': 'User account suspended',
    };

    let description = descriptions[action] || action.toLowerCase().replace(/_/g, ' ');

    // Add resource context if available
    if (resource) {
      description += ` on ${resource.toLowerCase()}`;
    }

    // Add additional context from details
    if (details?.targetUserId) {
      description += ` for user ${details.targetUserId}`;
    }
    if (details?.roles) {
      description += ` (${details.roles.join(', ')})`;
    }

    return description;
  }
}

// Export singleton instance
export const auditTrailService = new AuditTrailService();
export default auditTrailService;