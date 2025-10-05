/**
 * Role API Service
 * Handles all role-related API communications with comprehensive error handling
 * Follows enterprise-grade patterns with proper logging and type safety
 */

import { apiClient } from '@/composables/useApi';
import type { ApiResponse } from '@/types/api';
import type {
  RoleApiResponse,
  Role,
  CreateRoleData,
  UpdateRoleData,
  BulkRoleOperation,
  RoleStatistics,
  RoleApiError,
  RoleAssignment
} from '@/types/role';

/**
 * Custom error class for role-specific API errors
 */
export class RoleApiServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'RoleApiServiceError';
  }
}

/**
 * Role API Service Class
 * Centralized service for all role-related API operations
 */
export class RoleApiService {
  private readonly baseUrl = '/admin/roles';

  /**
   * Transforms backend API response to frontend Role interface
   * Handles data mapping and type conversion
   */
  private transformApiResponseToRole(apiRole: RoleApiResponse): Role {
    return {
      id: apiRole.id,
      name: apiRole.name,
      description: apiRole.description || 'No description provided',
      status: apiRole.isActive ? 'ACTIVE' : 'INACTIVE',
      isDefault: apiRole.isDefault,
      isSystemRole: this.isSystemRole(apiRole.name),
      userCount: apiRole.userCount || 0,
      permissionCount: apiRole.permissions?.length || 0,
      createdAt: new Date(apiRole.createdAt),
      updatedAt: new Date(apiRole.updatedAt),
      permissions: apiRole.permissions || []
    };
  }

  /**
   * Determines if a role is a system role based on name pattern
   * System roles: SUPER_ADMIN and roles with SYSTEM_ prefix
   * These roles are protected and cannot be edited or deleted
   */
  private isSystemRole(roleName: string): boolean {
    const systemRolePatterns = [
      'SUPER_ADMIN',
      'SYSTEM_'
    ];
    return systemRolePatterns.some(pattern => roleName.includes(pattern));
  }

  /**
   * Handles API errors with proper error transformation
   */
  private handleApiError(error: any): never {
    // If it's already a RoleApiServiceError, just re-throw it
    if (error instanceof RoleApiServiceError) {
      throw error;
    }

    if (error.name === 'NetworkError') {
      throw new RoleApiServiceError(
        'Unable to connect to server. Please check your connection.',
        'NETWORK_ERROR'
      );
    }

    if (error.response?.data?.message) {
      throw new RoleApiServiceError(
        error.response.data.message,
        error.response.data.code || 'API_ERROR',
        error.response.data.details
      );
    }

    throw new RoleApiServiceError(
      error.message || 'An unexpected error occurred',
      'UNKNOWN_ERROR'
    );
  }

  /**
   * Fetches all roles from the backend
   * @param includeInactive - Whether to include inactive roles
   * @returns Promise<Role[]> - Array of transformed role objects
   */
  async getAllRoles(includeInactive: boolean = true): Promise<Role[]> {
    try {
      const response = await apiClient.get<RoleApiResponse[]>(
        `${this.baseUrl}?includeInactive=${includeInactive}`
      );

      // Handle both wrapped and unwrapped responses (consistent with other services)
      const rolesData = (response as any).data || response;

      if (!Array.isArray(rolesData)) {
        throw new RoleApiServiceError(
          'Invalid response format from server',
          'INVALID_RESPONSE'
        );
      }

      return rolesData.map(role => this.transformApiResponseToRole(role));
    } catch (error) {
      console.error('Error fetching roles:', error);
      this.handleApiError(error);
    }
  }

  /**
   * Fetches a single role by ID
   * @param roleId - The role ID to fetch
   * @returns Promise<Role> - The role object
   */
  async getRoleById(roleId: string): Promise<Role> {
    try {
      if (!roleId?.trim()) {
        throw new RoleApiServiceError('Role ID is required', 'INVALID_ROLE_ID');
      }

      const response = await apiClient.get<RoleApiResponse>(`${this.baseUrl}/${roleId}`);
      let roleData = (response as any).data;

      // If no data property, the response itself is the role data
      if (roleData === undefined) {
        roleData = response;
      }

      if (!roleData || roleData === null) {
        throw new RoleApiServiceError('Role not found', 'ROLE_NOT_FOUND');
      }

      return this.transformApiResponseToRole(roleData);
    } catch (error) {
      console.error(`Error fetching role ${roleId}:`, error);
      this.handleApiError(error);
    }
  }

  /**
   * Creates a new role
   * @param roleData - The role creation data
   * @returns Promise<Role> - The created role
   */
  async createRole(roleData: CreateRoleData): Promise<Role> {
    try {
      if (!roleData.name?.trim()) {
        throw new RoleApiServiceError('Role name is required', 'INVALID_ROLE_NAME');
      }

      const response = await apiClient.post<RoleApiResponse>(this.baseUrl, roleData);
      const createdRole = (response as any).data || response;

      if (!createdRole) {
        throw new RoleApiServiceError('Failed to create role', 'CREATE_FAILED');
      }

      return this.transformApiResponseToRole(createdRole);
    } catch (error) {
      console.error('Error creating role:', error);
      this.handleApiError(error);
    }
  }

  /**
   * Updates an existing role
   * @param updateData - The role update data including ID
   * @returns Promise<Role> - The updated role
   */
  async updateRole(updateData: UpdateRoleData): Promise<Role> {
    try {
      if (!updateData.id?.trim()) {
        throw new RoleApiServiceError('Role ID is required for update', 'INVALID_ROLE_ID');
      }

      const { id, ...data } = updateData;
      const response = await apiClient.put<RoleApiResponse>(`${this.baseUrl}/${id}`, data);
      const updatedRole = (response as any).data || response;

      if (!updatedRole) {
        throw new RoleApiServiceError('Failed to update role', 'UPDATE_FAILED');
      }

      return this.transformApiResponseToRole(updatedRole);
    } catch (error) {
      console.error(`Error updating role ${updateData.id}:`, error);
      this.handleApiError(error);
    }
  }

  /**
   * Deletes a role by ID
   * @param roleId - The role ID to delete
   * @returns Promise<boolean> - Success status
   */
  async deleteRole(roleId: string): Promise<boolean> {
    try {
      if (!roleId?.trim()) {
        throw new RoleApiServiceError('Role ID is required', 'INVALID_ROLE_ID');
      }

      await apiClient.delete(`${this.baseUrl}/${roleId}`);
      return true;
    } catch (error) {
      console.error(`Error deleting role ${roleId}:`, error);
      this.handleApiError(error);
    }
  }

  /**
   * Performs bulk operations on multiple roles
   * @param operation - The bulk operation to perform
   * @returns Promise<boolean> - Success status
   */
  async performBulkOperation(operation: BulkRoleOperation): Promise<boolean> {
    try {
      if (!operation.roleIds?.length) {
        throw new RoleApiServiceError('Role IDs are required for bulk operation', 'INVALID_ROLE_IDS');
      }

      // Map frontend operation types to backend endpoints
      const operationMap = {
        activate: 'bulk-activate',
        deactivate: 'bulk-deactivate',
        delete: 'bulk-delete'
      };

      const endpoint = operationMap[operation.operation];
      if (!endpoint) {
        throw new RoleApiServiceError('Invalid bulk operation type', 'INVALID_OPERATION');
      }

      await apiClient.post(`${this.baseUrl}/${endpoint}`, {
        roleIds: operation.roleIds,
        reason: operation.reason
      });

      return true;
    } catch (error) {
      console.error('Error performing bulk operation:', error);
      this.handleApiError(error);
    }
  }

  /**
   * Fetches role statistics for dashboard
   * @returns Promise<RoleStatistics> - Role statistics object
   */
  async getRoleStatistics(): Promise<RoleStatistics> {
    try {
      // For now, calculate statistics from all roles
      // In the future, this could be a dedicated endpoint
      const roles = await this.getAllRoles(true);

      const activeRoles = roles.filter(r => r.status === 'ACTIVE').length;
      const defaultRoles = roles.filter(r => r.isDefault).length;
      const systemRoles = roles.filter(r => r.isSystemRole).length;

      const totalPermissions = roles.reduce((sum, role) => sum + role.permissionCount, 0);
      const totalUsers = roles.reduce((sum, role) => sum + role.userCount, 0);

      return {
        totalRoles: roles.length,
        activeRoles,
        inactiveRoles: roles.length - activeRoles,
        defaultRoles,
        systemRoles,
        averagePermissions: roles.length > 0 ? Math.round(totalPermissions / roles.length) : 0,
        averageUsers: roles.length > 0 ? Math.round(totalUsers / roles.length) : 0
      };
    } catch (error) {
      console.error('Error fetching role statistics:', error);
      this.handleApiError(error);
    }
  }

  /**
   * Assigns a role to a user
   * @param userId - User ID to assign role to
   * @param roleId - Role ID to assign
   * @param reason - Optional reason for assignment
   * @returns Promise<boolean> - Success status
   */
  async assignRoleToUser(userId: string, roleId: string, reason?: string): Promise<boolean> {
    try {
      if (!userId?.trim() || !roleId?.trim()) {
        throw new RoleApiServiceError('User ID and Role ID are required', 'INVALID_IDS');
      }

      await apiClient.post(`${this.baseUrl}/assign`, {
        userId,
        roleId,
        reason
      });

      return true;
    } catch (error) {
      console.error('Error assigning role to user:', error);
      this.handleApiError(error);
    }
  }

  /**
   * Revokes a role from a user
   * @param userId - User ID to revoke role from
   * @param roleId - Role ID to revoke
   * @param reason - Optional reason for revocation
   * @returns Promise<boolean> - Success status
   */
  async revokeRoleFromUser(userId: string, roleId: string, reason?: string): Promise<boolean> {
    try {
      if (!userId?.trim() || !roleId?.trim()) {
        throw new RoleApiServiceError('User ID and Role ID are required', 'INVALID_IDS');
      }

      await apiClient.post(`${this.baseUrl}/revoke`, {
        userId,
        roleId,
        reason
      });

      return true;
    } catch (error) {
      console.error('Error revoking role from user:', error);
      this.handleApiError(error);
    }
  }

  /**
   * Syncs permissions for a role (bulk assign/revoke to match desired state)
   * @param roleId - Role ID to sync permissions for
   * @param permissionNames - Array of permission names to assign to the role
   * @returns Promise<boolean> - Success status
   */
  async syncRolePermissions(roleId: string, permissionNames: string[]): Promise<boolean> {
    try {
      if (!roleId?.trim()) {
        throw new RoleApiServiceError('Role ID is required', 'INVALID_ROLE_ID');
      }

      if (!permissionNames || permissionNames.length === 0) {
        // No permissions to sync, skip API call
        // The backend requires at least 1 permission in the array (@ArrayMinSize(1))
        console.log('No permissions to sync, skipping permission sync');
        return true;
      }

      // Fetch all permissions to get their IDs
      const allPermissionsResponse = await apiClient.get<any[]>('/admin/permissions');
      const allPermissions = (allPermissionsResponse as any).data || allPermissionsResponse;

      // Map permission names to IDs
      const permissionIds = permissionNames
        .map(name => {
          const permission = allPermissions.find((p: any) => p.name === name);
          return permission?.id;
        })
        .filter((id): id is string => id !== undefined);

      if (permissionIds.length !== permissionNames.length) {
        console.warn(`Some permissions were not found: ${permissionNames.length} requested, ${permissionIds.length} found`);
      }

      if (permissionIds.length === 0) {
        // All permission names were invalid, skip API call
        console.warn('No valid permission IDs found, skipping permission sync');
        return true;
      }

      // Use the permissions bulk-assign endpoint with permission IDs
      await apiClient.post('/admin/permissions/bulk-assign', {
        roleId,
        permissionIds
      });

      return true;
    } catch (error) {
      console.error('Error syncing role permissions:', error);
      this.handleApiError(error);
    }
  }
}

/**
 * Export singleton instance of the role API service
 */
export const roleApiService = new RoleApiService();