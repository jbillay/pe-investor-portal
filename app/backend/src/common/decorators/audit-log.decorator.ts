import { SetMetadata } from '@nestjs/common';

export const AUDIT_LOG_KEY = 'auditLog';

/**
 * Decorator to mark endpoints for audit logging
 * @param action - The action being performed (e.g., 'USER_CREATED', 'USER_UPDATED')
 * @param resource - Optional resource being acted upon
 */
export const AuditLog = (action: string, resource?: string) =>
  SetMetadata(AUDIT_LOG_KEY, { action, resource });

/**
 * Decorator for user-related audit logs
 */
export const AuditUserAction = (action: string) =>
  AuditLog(action, 'USER');

/**
 * Decorator for role-related audit logs
 */
export const AuditRoleAction = (action: string) =>
  AuditLog(action, 'ROLE');

/**
 * Decorator for sensitive operations that require detailed audit logging
 */
export const AuditSensitiveAction = (action: string, resource?: string) =>
  SetMetadata(AUDIT_LOG_KEY, { action, resource, sensitive: true });