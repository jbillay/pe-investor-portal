/**
 * Role API Service Unit Tests
 * Comprehensive test suite covering all service methods and error scenarios
 * Follows testing best practices with proper mocking and assertions
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { RoleApiService, RoleApiServiceError } from '../roleApiService';
import { apiClient } from '@/composables/useApi';
import type { RoleApiResponse, CreateRoleData, UpdateRoleData, BulkRoleOperation } from '@/types/role';

// Mock the API client
vi.mock('@/composables/useApi', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}));

describe('RoleApiService', () => {
  let roleService: RoleApiService;
  const mockApiClient = apiClient as any;

  // Mock data fixtures
  const mockRoleApiResponse: RoleApiResponse = {
    id: 'role-123',
    name: 'TEST_ROLE',
    description: 'Test role description',
    isActive: true,
    isDefault: false,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    userCount: 5,
    permissions: ['read:users', 'write:posts']
  };

  const mockRolesApiResponse: RoleApiResponse[] = [
    mockRoleApiResponse,
    {
      id: 'role-456',
      name: 'ADMIN',
      description: 'Administrator role',
      isActive: true,
      isDefault: false,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      userCount: 2,
      permissions: ['read:users', 'write:users', 'delete:users']
    }
  ];

  beforeEach(() => {
    roleService = new RoleApiService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getAllRoles', () => {
    it('should fetch and transform all roles successfully', async () => {
      // Arrange
      mockApiClient.get.mockResolvedValue({ data: mockRolesApiResponse });

      // Act
      const result = await roleService.getAllRoles();

      // Assert
      expect(mockApiClient.get).toHaveBeenCalledWith('/admin/roles?includeInactive=true');
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'role-123',
        name: 'TEST_ROLE',
        description: 'Test role description',
        status: 'ACTIVE',
        isDefault: false,
        isSystemRole: false, // TEST_ROLE should not be system role
        userCount: 5,
        permissionCount: 2
      });
    });

    it('should handle includeInactive parameter', async () => {
      // Arrange
      mockApiClient.get.mockResolvedValue({ data: [] });

      // Act
      await roleService.getAllRoles(false);

      // Assert
      expect(mockApiClient.get).toHaveBeenCalledWith('/admin/roles?includeInactive=false');
    });

    it('should identify system roles correctly', async () => {
      // Arrange
      const systemRoleResponse = {
        ...mockRoleApiResponse,
        name: 'SUPER_ADMIN'
      };
      mockApiClient.get.mockResolvedValue({ data: [systemRoleResponse] });

      // Act
      const result = await roleService.getAllRoles();

      // Assert
      expect(result[0].isSystemRole).toBe(true);
    });

    it('should throw error for invalid response format', async () => {
      // Arrange
      mockApiClient.get.mockResolvedValue({ data: null });

      // Act & Assert
      await expect(roleService.getAllRoles()).rejects.toThrow(RoleApiServiceError);
      await expect(roleService.getAllRoles()).rejects.toThrow('Invalid response format from server');
    });

    it('should handle network errors', async () => {
      // Arrange
      const networkError = new Error('Network Error');
      networkError.name = 'NetworkError';
      mockApiClient.get.mockRejectedValue(networkError);

      // Act & Assert
      await expect(roleService.getAllRoles()).rejects.toThrow(RoleApiServiceError);
      await expect(roleService.getAllRoles()).rejects.toThrow('Unable to connect to server');
    });
  });

  describe('getRoleById', () => {
    it('should fetch role by ID successfully', async () => {
      // Arrange
      mockApiClient.get.mockResolvedValue({ data: mockRoleApiResponse });

      // Act
      const result = await roleService.getRoleById('role-123');

      // Assert
      expect(mockApiClient.get).toHaveBeenCalledWith('/admin/roles/role-123');
      expect(result.id).toBe('role-123');
      expect(result.name).toBe('TEST_ROLE');
    });

    it('should throw error for empty role ID', async () => {
      // Act & Assert
      await expect(roleService.getRoleById('')).rejects.toThrow(RoleApiServiceError);
      await expect(roleService.getRoleById('')).rejects.toThrow('Role ID is required');
    });

    it('should throw error when role not found', async () => {
      // Arrange
      mockApiClient.get.mockResolvedValue({ data: null });

      // Act & Assert
      await expect(roleService.getRoleById('non-existent')).rejects.toThrow(RoleApiServiceError);
      await expect(roleService.getRoleById('non-existent')).rejects.toThrow('Role not found');
    });
  });

  describe('createRole', () => {
    const createRoleData: CreateRoleData = {
      name: 'NEW_ROLE',
      description: 'New role description',
      isActive: true,
      isDefault: false
    };

    it('should create role successfully', async () => {
      // Arrange
      const createdRole = { ...mockRoleApiResponse, name: 'NEW_ROLE' };
      mockApiClient.post.mockResolvedValue({ data: createdRole });

      // Act
      const result = await roleService.createRole(createRoleData);

      // Assert
      expect(mockApiClient.post).toHaveBeenCalledWith('/admin/roles', createRoleData);
      expect(result.name).toBe('NEW_ROLE');
    });

    it('should throw error for empty role name', async () => {
      // Arrange
      const invalidData = { ...createRoleData, name: '' };

      // Act & Assert
      await expect(roleService.createRole(invalidData)).rejects.toThrow(RoleApiServiceError);
      await expect(roleService.createRole(invalidData)).rejects.toThrow('Role name is required');
    });

    it('should handle API errors during creation', async () => {
      // Arrange
      const apiError = {
        response: {
          data: {
            message: 'Role name already exists',
            code: 'DUPLICATE_NAME'
          }
        }
      };
      mockApiClient.post.mockRejectedValue(apiError);

      // Act & Assert
      await expect(roleService.createRole(createRoleData)).rejects.toThrow(RoleApiServiceError);
      await expect(roleService.createRole(createRoleData)).rejects.toThrow('Role name already exists');
    });
  });

  describe('updateRole', () => {
    const updateRoleData: UpdateRoleData = {
      id: 'role-123',
      name: 'UPDATED_ROLE',
      description: 'Updated description'
    };

    it('should update role successfully', async () => {
      // Arrange
      const updatedRole = { ...mockRoleApiResponse, name: 'UPDATED_ROLE' };
      mockApiClient.put.mockResolvedValue({ data: updatedRole });

      // Act
      const result = await roleService.updateRole(updateRoleData);

      // Assert
      expect(mockApiClient.put).toHaveBeenCalledWith('/admin/roles/role-123', {
        name: 'UPDATED_ROLE',
        description: 'Updated description'
      });
      expect(result.name).toBe('UPDATED_ROLE');
    });

    it('should throw error for missing role ID', async () => {
      // Arrange
      const invalidData = { ...updateRoleData, id: '' };

      // Act & Assert
      await expect(roleService.updateRole(invalidData)).rejects.toThrow(RoleApiServiceError);
      await expect(roleService.updateRole(invalidData)).rejects.toThrow('Role ID is required for update');
    });
  });

  describe('deleteRole', () => {
    it('should delete role successfully', async () => {
      // Arrange
      mockApiClient.delete.mockResolvedValue({});

      // Act
      const result = await roleService.deleteRole('role-123');

      // Assert
      expect(mockApiClient.delete).toHaveBeenCalledWith('/admin/roles/role-123');
      expect(result).toBe(true);
    });

    it('should throw error for empty role ID', async () => {
      // Act & Assert
      await expect(roleService.deleteRole('')).rejects.toThrow(RoleApiServiceError);
      await expect(roleService.deleteRole('')).rejects.toThrow('Role ID is required');
    });
  });

  describe('performBulkOperation', () => {
    const bulkOperation: BulkRoleOperation = {
      roleIds: ['role-123', 'role-456'],
      operation: 'activate',
      reason: 'Test bulk activation'
    };

    it('should perform bulk activation successfully', async () => {
      // Arrange
      mockApiClient.post.mockResolvedValue({});

      // Act
      const result = await roleService.performBulkOperation(bulkOperation);

      // Assert
      expect(mockApiClient.post).toHaveBeenCalledWith('/admin/roles/bulk-activate', {
        roleIds: ['role-123', 'role-456'],
        reason: 'Test bulk activation'
      });
      expect(result).toBe(true);
    });

    it('should handle different operation types', async () => {
      // Arrange
      mockApiClient.post.mockResolvedValue({});
      const deactivateOperation = { ...bulkOperation, operation: 'deactivate' as const };

      // Act
      await roleService.performBulkOperation(deactivateOperation);

      // Assert
      expect(mockApiClient.post).toHaveBeenCalledWith('/admin/roles/bulk-deactivate', expect.any(Object));
    });

    it('should throw error for empty role IDs', async () => {
      // Arrange
      const invalidOperation = { ...bulkOperation, roleIds: [] };

      // Act & Assert
      await expect(roleService.performBulkOperation(invalidOperation)).rejects.toThrow(RoleApiServiceError);
      await expect(roleService.performBulkOperation(invalidOperation)).rejects.toThrow('Role IDs are required');
    });

    it('should throw error for invalid operation type', async () => {
      // Arrange
      const invalidOperation = { ...bulkOperation, operation: 'invalid' as any };

      // Act & Assert
      await expect(roleService.performBulkOperation(invalidOperation)).rejects.toThrow(RoleApiServiceError);
      await expect(roleService.performBulkOperation(invalidOperation)).rejects.toThrow('Invalid bulk operation type');
    });
  });

  describe('getRoleStatistics', () => {
    it('should calculate statistics correctly', async () => {
      // Arrange
      const rolesWithStats = [
        { ...mockRolesApiResponse[0], isDefault: true, userCount: 10, permissions: ['a', 'b'] },
        { ...mockRolesApiResponse[1], name: 'SUPER_ADMIN', userCount: 5, permissions: ['a', 'b', 'c'] }
      ];
      mockApiClient.get.mockResolvedValue({ data: rolesWithStats });

      // Act
      const result = await roleService.getRoleStatistics();

      // Assert
      expect(result).toMatchObject({
        totalRoles: 2,
        activeRoles: 2,
        inactiveRoles: 0,
        defaultRoles: 1,
        systemRoles: 1,
        averagePermissions: 3, // (2 + 3) / 2 = 2.5 rounded to 3
        averageUsers: 8 // (10 + 5) / 2 = 7.5 rounded to 8
      });
    });

    it('should handle empty roles list', async () => {
      // Arrange
      mockApiClient.get.mockResolvedValue({ data: [] });

      // Act
      const result = await roleService.getRoleStatistics();

      // Assert
      expect(result).toMatchObject({
        totalRoles: 0,
        activeRoles: 0,
        inactiveRoles: 0,
        defaultRoles: 0,
        systemRoles: 0,
        averagePermissions: 0,
        averageUsers: 0
      });
    });
  });

  describe('assignRoleToUser', () => {
    it('should assign role to user successfully', async () => {
      // Arrange
      mockApiClient.post.mockResolvedValue({});

      // Act
      const result = await roleService.assignRoleToUser('user-123', 'role-123', 'Test assignment');

      // Assert
      expect(mockApiClient.post).toHaveBeenCalledWith('/admin/roles/assign', {
        userId: 'user-123',
        roleId: 'role-123',
        reason: 'Test assignment'
      });
      expect(result).toBe(true);
    });

    it('should throw error for missing IDs', async () => {
      // Act & Assert
      await expect(roleService.assignRoleToUser('', 'role-123')).rejects.toThrow(RoleApiServiceError);
      await expect(roleService.assignRoleToUser('', 'role-123')).rejects.toThrow('User ID and Role ID are required');
    });
  });

  describe('revokeRoleFromUser', () => {
    it('should revoke role from user successfully', async () => {
      // Arrange
      mockApiClient.post.mockResolvedValue({});

      // Act
      const result = await roleService.revokeRoleFromUser('user-123', 'role-123', 'Test revocation');

      // Assert
      expect(mockApiClient.post).toHaveBeenCalledWith('/admin/roles/revoke', {
        userId: 'user-123',
        roleId: 'role-123',
        reason: 'Test revocation'
      });
      expect(result).toBe(true);
    });

    it('should throw error for missing IDs', async () => {
      // Act & Assert
      await expect(roleService.revokeRoleFromUser('user-123', '')).rejects.toThrow(RoleApiServiceError);
      await expect(roleService.revokeRoleFromUser('user-123', '')).rejects.toThrow('User ID and Role ID are required');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors with proper structure', async () => {
      // Arrange
      const apiError = {
        response: {
          data: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: { field: 'name' }
          }
        }
      };
      mockApiClient.get.mockRejectedValue(apiError);

      // Act & Assert
      await expect(roleService.getAllRoles()).rejects.toThrow(RoleApiServiceError);

      try {
        await roleService.getAllRoles();
      } catch (error: any) {
        expect(error).toBeInstanceOf(RoleApiServiceError);
        expect(error.message).toBe('Validation failed');
        expect(error.code).toBe('VALIDATION_ERROR');
        expect(error.details).toEqual({ field: 'name' });
      }
    });

    it('should handle unknown errors gracefully', async () => {
      // Arrange
      const unknownError = new Error('Something went wrong');
      mockApiClient.get.mockRejectedValue(unknownError);

      // Act & Assert
      await expect(roleService.getAllRoles()).rejects.toThrow(RoleApiServiceError);
      await expect(roleService.getAllRoles()).rejects.toThrow('Something went wrong');
    });
  });
});