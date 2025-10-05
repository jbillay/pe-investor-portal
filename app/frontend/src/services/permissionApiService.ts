/**
 * Permission API Service
 * Handles all permission-related API communications
 */

import { apiClient } from '@/composables/useApi';

/**
 * Permission interface matching backend PermissionResponseDto
 */
export interface Permission {
  id: string;
  name: string;
  description: string | null;
  resource: string | null;
  action: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  roleCount?: number;
}

/**
 * Custom error class for permission-specific API errors
 */
export class PermissionApiServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'PermissionApiServiceError';
  }
}

/**
 * Permission API Service Class
 */
export class PermissionApiService {
  private readonly baseUrl = '/admin/permissions';

  /**
   * Handles API errors with proper error transformation
   */
  private handleApiError(error: any): never {
    if (error instanceof PermissionApiServiceError) {
      throw error;
    }

    if (error.name === 'NetworkError') {
      throw new PermissionApiServiceError(
        'Unable to connect to server. Please check your connection.',
        'NETWORK_ERROR'
      );
    }

    if (error.response?.data?.message) {
      throw new PermissionApiServiceError(
        error.response.data.message,
        error.response.data.code || 'API_ERROR',
        error.response.data.details
      );
    }

    throw new PermissionApiServiceError(
      error.message || 'An unexpected error occurred',
      'UNKNOWN_ERROR'
    );
  }

  /**
   * Fetches all permissions from the backend
   * @param includeInactive - Whether to include inactive permissions
   * @returns Promise<Permission[]> - Array of permission objects
   */
  async getAllPermissions(includeInactive: boolean = true): Promise<Permission[]> {
    try {
      const response = await apiClient.get<Permission[]>(
        `${this.baseUrl}?includeInactive=${includeInactive}`
      );

      const permissionsData = (response as any).data || response;

      if (!Array.isArray(permissionsData)) {
        throw new PermissionApiServiceError(
          'Invalid response format from server',
          'INVALID_RESPONSE'
        );
      }

      return permissionsData;
    } catch (error) {
      console.error('Error fetching permissions:', error);
      this.handleApiError(error);
    }
  }

  /**
   * Fetches permissions grouped by resource
   * @returns Promise<Record<string, Permission[]>> - Permissions grouped by resource
   */
  async getPermissionsByResource(): Promise<Record<string, Permission[]>> {
    try {
      const response = await apiClient.get<Record<string, Permission[]>>(
        `${this.baseUrl}/by-resource`
      );

      const permissionsData = (response as any).data || response;

      if (typeof permissionsData !== 'object' || permissionsData === null) {
        throw new PermissionApiServiceError(
          'Invalid response format from server',
          'INVALID_RESPONSE'
        );
      }

      return permissionsData;
    } catch (error) {
      console.error('Error fetching permissions by resource:', error);
      this.handleApiError(error);
    }
  }

  /**
   * Fetches a single permission by ID
   * @param permissionId - The permission ID to fetch
   * @returns Promise<Permission> - The permission object
   */
  async getPermissionById(permissionId: string): Promise<Permission> {
    try {
      if (!permissionId?.trim()) {
        throw new PermissionApiServiceError('Permission ID is required', 'INVALID_PERMISSION_ID');
      }

      const response = await apiClient.get<Permission>(`${this.baseUrl}/${permissionId}`);
      let permissionData = (response as any).data;

      if (permissionData === undefined) {
        permissionData = response;
      }

      if (!permissionData || permissionData === null) {
        throw new PermissionApiServiceError('Permission not found', 'PERMISSION_NOT_FOUND');
      }

      return permissionData;
    } catch (error) {
      console.error(`Error fetching permission ${permissionId}:`, error);
      this.handleApiError(error);
    }
  }
}

/**
 * Export singleton instance of the permission API service
 */
export const permissionApiService = new PermissionApiService();
