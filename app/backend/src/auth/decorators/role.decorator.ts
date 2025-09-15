import { SetMetadata } from '@nestjs/common';

// Keys for metadata
export const REQUIRE_ROLES_KEY = 'requireRoles';
export const REQUIRE_ANY_ROLE_KEY = 'requireAnyRole';
export const REQUIRE_PERMISSIONS_KEY = 'requirePermissions';
export const REQUIRE_ANY_PERMISSION_KEY = 'requireAnyPermission';

/**
 * Decorator to require ALL specified roles
 * User must have all the roles listed
 */
export const RequireRoles = (...roles: string[]) =>
  SetMetadata(REQUIRE_ROLES_KEY, roles);

/**
 * Decorator to require ANY of the specified roles
 * User needs to have at least one of the roles listed
 */
export const RequireAnyRole = (...roles: string[]) =>
  SetMetadata(REQUIRE_ANY_ROLE_KEY, roles);

/**
 * Decorator to require ALL specified permissions
 * User must have all the permissions listed
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(REQUIRE_PERMISSIONS_KEY, permissions);

/**
 * Decorator to require ANY of the specified permissions
 * User needs to have at least one of the permissions listed
 */
export const RequireAnyPermission = (...permissions: string[]) =>
  SetMetadata(REQUIRE_ANY_PERMISSION_KEY, permissions);

/**
 * Composite decorator for admin-only endpoints
 * Equivalent to @RequireRoles('ADMIN')
 */
export const AdminOnly = () => RequireRoles('ADMIN');

/**
 * Composite decorator for admin or investor endpoints
 * Equivalent to @RequireAnyRole('ADMIN', 'INVESTOR')
 */
export const AdminOrInvestor = () => RequireAnyRole('ADMIN', 'INVESTOR');

/**
 * Composite decorator for user management permissions
 * Requires permissions to manage users
 */
export const RequireUserManagement = () =>
  RequireAnyPermission('CREATE_USER', 'UPDATE_USER', 'DELETE_USER', 'VIEW_USER');

/**
 * Composite decorator for role management permissions
 * Requires permissions to manage roles
 */
export const RequireRoleManagement = () =>
  RequireAnyPermission('CREATE_ROLE', 'UPDATE_ROLE', 'DELETE_ROLE', 'ASSIGN_ROLE', 'REVOKE_ROLE');

/**
 * Composite decorator for portfolio access
 * Requires permissions to access portfolios
 */
export const RequirePortfolioAccess = () =>
  RequireAnyPermission('VIEW_PORTFOLIO', 'CREATE_PORTFOLIO', 'UPDATE_PORTFOLIO');