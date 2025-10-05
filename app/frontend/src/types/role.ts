/**
 * Role-related TypeScript interfaces and types
 * Ensures type safety between frontend and backend
 */

/**
 * Backend API Response DTO - matches backend RoleResponseDto
 */
export interface RoleApiResponse {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string; // ISO date string from API
  updatedAt: string; // ISO date string from API
  userCount?: number;
  permissions?: string[];
}

/**
 * Permission interface for role details
 */
export interface Permission {
  id: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
  level?: string;
}

/**
 * Frontend Role interface - matches DataTable requirements
 */
export interface Role {
  id: string;
  name: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
  isDefault: boolean;
  isSystemRole: boolean;
  userCount: number;
  permissionCount: number;
  createdAt: Date;
  updatedAt: Date;
  permissions?: Permission[];
}

/**
 * Role creation/update data transfer object
 */
export interface CreateRoleData {
  name: string;
  description?: string;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface UpdateRoleData extends Partial<CreateRoleData> {
  id: string;
}

/**
 * Role filters for DataTable
 */
export interface RoleFilters {
  search: string;
  status: 'ACTIVE' | 'INACTIVE' | null;
  type: 'DEFAULT' | 'SYSTEM' | 'CUSTOM' | null;
}

/**
 * Bulk operations data structures
 */
export interface BulkRoleOperation {
  roleIds: string[];
  operation: 'activate' | 'deactivate' | 'delete';
  reason?: string;
}

/**
 * Role statistics for dashboard cards
 */
export interface RoleStatistics {
  totalRoles: number;
  activeRoles: number;
  inactiveRoles: number;
  defaultRoles: number;
  systemRoles: number;
  averagePermissions: number;
  averageUsers: number;
}

/**
 * API error structure
 */
export interface RoleApiError {
  message: string;
  code: string;
  details?: Record<string, any>;
}

/**
 * Role assignment data structures
 */
export interface RoleAssignment {
  userId: string;
  roleId: string;
  assignedBy: string;
  assignedAt: Date;
  expiresAt?: Date;
  reason?: string;
}

/**
 * System role names enum for type safety
 * Note: Only SUPER_ADMIN and roles with SYSTEM_ prefix are protected from editing/deletion
 * Other roles (ADMIN, FUND_MANAGER, INVESTOR, VIEWER) are editable custom roles
 */
export enum SystemRoles {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  FUND_MANAGER = 'FUND_MANAGER',
  INVESTOR = 'INVESTOR',
  VIEWER = 'VIEWER'
}

/**
 * Role type classification
 */
export type RoleType = 'SYSTEM' | 'DEFAULT' | 'CUSTOM';

/**
 * Data transformation utility type
 */
export type RoleTransformer = (apiRole: RoleApiResponse) => Role;