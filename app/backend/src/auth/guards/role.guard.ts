import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  REQUIRE_ROLES_KEY,
  REQUIRE_ANY_ROLE_KEY,
  REQUIRE_PERMISSIONS_KEY,
  REQUIRE_ANY_PERMISSION_KEY,
} from '../decorators/role.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthenticatedUser } from '../interfaces/auth.interface';
import { RoleService } from '../services/role.service';
import { PermissionService } from '../services/permission.service';

@Injectable()
export class RoleGuard implements CanActivate {
  private readonly logger = new Logger(RoleGuard.name);

  constructor(
    private reflector: Reflector,
    private roleService: RoleService,
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

    // Get the user from the request (should be set by JWT guard)
    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Get role and permission requirements from decorators
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      REQUIRE_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const requiredAnyRole = this.reflector.getAllAndOverride<string[]>(
      REQUIRE_ANY_ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      REQUIRE_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    const requiredAnyPermission = this.reflector.getAllAndOverride<string[]>(
      REQUIRE_ANY_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no role/permission requirements, allow access
    if (
      !requiredRoles?.length &&
      !requiredAnyRole?.length &&
      !requiredPermissions?.length &&
      !requiredAnyPermission?.length
    ) {
      return true;
    }

    try {
      // Get user's complete role and permission information
      const userWithRoles = await this.roleService.getUserRoles(user.id);

      // Update user object with roles and permissions for downstream use
      request.user.roles = userWithRoles.roles.map(role => role.name);
      request.user.permissions = userWithRoles.permissions || [];

      const userRoleNames = userWithRoles.roles.map(role => role.name);
      const userPermissions = userWithRoles.permissions || [];

      // Check required roles (ALL must be present)
      if (requiredRoles?.length) {
        const hasAllRoles = requiredRoles.every(role =>
          userRoleNames.includes(role)
        );

        if (!hasAllRoles) {
          this.logger.warn(
            `User ${user.id} denied access. Required roles: [${requiredRoles.join(', ')}], User roles: [${userRoleNames.join(', ')}]`
          );
          throw new ForbiddenException(
            `Insufficient permissions. Required roles: ${requiredRoles.join(', ')}`
          );
        }
      }

      // Check required any role (at least ONE must be present)
      if (requiredAnyRole?.length) {
        const hasAnyRole = requiredAnyRole.some(role =>
          userRoleNames.includes(role)
        );

        if (!hasAnyRole) {
          this.logger.warn(
            `User ${user.id} denied access. Required any role: [${requiredAnyRole.join(', ')}], User roles: [${userRoleNames.join(', ')}]`
          );
          throw new ForbiddenException(
            `Insufficient permissions. Required any of roles: ${requiredAnyRole.join(', ')}`
          );
        }
      }

      // Check required permissions (ALL must be present)
      if (requiredPermissions?.length) {
        const hasAllPermissions = requiredPermissions.every(permission =>
          userPermissions.includes(permission)
        );

        if (!hasAllPermissions) {
          this.logger.warn(
            `User ${user.id} denied access. Required permissions: [${requiredPermissions.join(', ')}], User permissions: [${userPermissions.join(', ')}]`
          );
          throw new ForbiddenException(
            `Insufficient permissions. Required permissions: ${requiredPermissions.join(', ')}`
          );
        }
      }

      // Check required any permission (at least ONE must be present)
      if (requiredAnyPermission?.length) {
        const hasAnyPermission = requiredAnyPermission.some(permission =>
          userPermissions.includes(permission)
        );

        if (!hasAnyPermission) {
          this.logger.warn(
            `User ${user.id} denied access. Required any permission: [${requiredAnyPermission.join(', ')}], User permissions: [${userPermissions.join(', ')}]`
          );
          throw new ForbiddenException(
            `Insufficient permissions. Required any of permissions: ${requiredAnyPermission.join(', ')}`
          );
        }
      }

      // Log successful authorization
      this.logger.log(`User ${user.id} authorized for ${context.getClass().name}.${context.getHandler().name}`);

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      this.logger.error(`Error checking user roles/permissions: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw new ForbiddenException('Error verifying user permissions');
    }
  }
}