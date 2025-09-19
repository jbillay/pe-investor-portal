import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedUser } from '../../auth/interfaces/auth.interface';
import { PermissionService } from '../services/permission.service';
import { IS_PUBLIC_KEY } from '../../auth/decorators/public.decorator';

// Metadata keys for permission checking
export const PERMISSION_CHECK_KEY = 'permissionCheck';
export const RESOURCE_KEY = 'resource';
export const ACTION_KEY = 'action';

// Interface for permission check metadata
export interface PermissionCheckMetadata {
  permission: string;
  resource?: string;
  action?: string;
}

/**
 * Decorator to check specific permission with optional resource and action
 */
export const CheckPermission = (
  permission: string,
  resource?: string,
  action?: string,
) =>
  (target: any, propertyKey?: string | symbol | undefined, descriptor?: PropertyDescriptor) => {
    const metadata: PermissionCheckMetadata = {
      permission,
      resource,
      action,
    };
    if (propertyKey && descriptor) {
      Reflector.createDecorator<PermissionCheckMetadata>()(metadata)(target, propertyKey, descriptor);
    }
  };

@Injectable()
export class PermissionGuard implements CanActivate {
  private readonly logger = new Logger(PermissionGuard.name);

  constructor(
    private reflector: Reflector,
    private permissionService: PermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Get the user from the request
    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Get permission check metadata
    const permissionCheck = this.reflector.getAllAndOverride<PermissionCheckMetadata>(
      PERMISSION_CHECK_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no permission check required, allow access
    if (!permissionCheck) {
      return true;
    }

    try {
      const { permission, resource, action } = permissionCheck;

      // Get resource ID from request parameters if available
      const resourceId = request.params?.id || request.params?.resourceId;

      // Check user permission
      const permissionResult = await this.permissionService.checkUserPermission(user.id, {
        permission: permission,
        resource: resource,
        resourceId,
      });

      if (!permissionResult.hasPermission) {
        this.logger.warn(
          `User ${user.id} denied access. Required permission: ${permission}${resource ? ` on ${resource}` : ''}${resourceId ? ` (ID: ${resourceId})` : ''}`
        );
        throw new ForbiddenException(
          `Insufficient permissions. Required: ${permission}${resource ? ` on ${resource}` : ''}`
        );
      }

      // Log successful permission check
      this.logger.log(
        `User ${user.id} has permission ${permission}${resource ? ` on ${resource}` : ''} - granted by roles: [${permissionResult.grantedByRoles.join(', ')}]`
      );

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      this.logger.error(`Error checking user permissions: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw new ForbiddenException('Error verifying user permissions');
    }
  }
}

/**
 * Resource-specific permission decorators
 */

// User management permissions
export const RequireCreateUser = () => CheckPermission('CREATE_USER', 'USER', 'CREATE');
export const RequireViewUser = () => CheckPermission('VIEW_USER', 'USER', 'READ');
export const RequireUpdateUser = () => CheckPermission('UPDATE_USER', 'USER', 'UPDATE');
export const RequireDeleteUser = () => CheckPermission('DELETE_USER', 'USER', 'DELETE');

// Role management permissions
export const RequireCreateRole = () => CheckPermission('CREATE_ROLE', 'ROLE', 'CREATE');
export const RequireViewRole = () => CheckPermission('VIEW_ROLE', 'ROLE', 'READ');
export const RequireUpdateRole = () => CheckPermission('UPDATE_ROLE', 'ROLE', 'UPDATE');
export const RequireDeleteRole = () => CheckPermission('DELETE_ROLE', 'ROLE', 'DELETE');
export const RequireAssignRole = () => CheckPermission('ASSIGN_ROLE', 'ROLE', 'ASSIGN');
export const RequireRevokeRole = () => CheckPermission('REVOKE_ROLE', 'ROLE', 'REVOKE');

// Permission management permissions
export const RequireCreatePermission = () => CheckPermission('CREATE_PERMISSION', 'PERMISSION', 'CREATE');
export const RequireViewPermission = () => CheckPermission('VIEW_PERMISSION', 'PERMISSION', 'READ');
export const RequireUpdatePermission = () => CheckPermission('UPDATE_PERMISSION', 'PERMISSION', 'UPDATE');
export const RequireDeletePermission = () => CheckPermission('DELETE_PERMISSION', 'PERMISSION', 'DELETE');

// Portfolio management permissions
export const RequireCreatePortfolio = () => CheckPermission('CREATE_PORTFOLIO', 'PORTFOLIO', 'CREATE');
export const RequireViewPortfolio = () => CheckPermission('VIEW_PORTFOLIO', 'PORTFOLIO', 'READ');
export const RequireUpdatePortfolio = () => CheckPermission('UPDATE_PORTFOLIO', 'PORTFOLIO', 'UPDATE');
export const RequireDeletePortfolio = () => CheckPermission('DELETE_PORTFOLIO', 'PORTFOLIO', 'DELETE');

// Dashboard access permissions
export const RequireAdminDashboard = () => CheckPermission('VIEW_ADMIN_DASHBOARD', 'DASHBOARD', 'READ');
export const RequireInvestorDashboard = () => CheckPermission('VIEW_INVESTOR_DASHBOARD', 'DASHBOARD', 'READ');
export const RequireUserDashboard = () => CheckPermission('VIEW_USER_DASHBOARD', 'DASHBOARD', 'READ');

// System management permissions
export const RequireViewAuditLogs = () => CheckPermission('VIEW_AUDIT_LOGS', 'SYSTEM', 'READ');
export const RequireManageSystemSettings = () => CheckPermission('MANAGE_SYSTEM_SETTINGS', 'SYSTEM', 'MANAGE');
export const RequireViewSystemMetrics = () => CheckPermission('VIEW_SYSTEM_METRICS', 'SYSTEM', 'READ');