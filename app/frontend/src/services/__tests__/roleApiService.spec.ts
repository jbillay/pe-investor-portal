import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type {
  RoleApiResponse,
  Role,
  CreateRoleData,
  UpdateRoleData,
  BulkRoleOperation,
  RoleStatistics
} from '@/types/role';

// Mock the API client
vi.mock('@/composables/useApi', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}));

import { RoleApiService, RoleApiServiceError, roleApiService } from '../roleApiService';
import { apiClient as mockApiClient } from '@/composables/useApi';

describe('RoleApiServiceError', () => {
  it('should create error with message, code, and details', () => {
    const error = new RoleApiServiceError('Test error', 'TEST_CODE', { foo: 'bar' });

    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.details).toEqual({ foo: 'bar' });
    expect(error.name).toBe('RoleApiServiceError');
  });

  it('should create error without details', () => {
    const error = new RoleApiServiceError('Test error', 'TEST_CODE');

    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.details).toBeUndefined();
  });
});

describe('RoleApiService', () => {
  let service: RoleApiService;

  const mockRoleApiResponse: RoleApiResponse = {
    id: 'role-1',
    name: 'Admin',
    description: 'Administrator role',
    isActive: true,
    isDefault: false,
    userCount: 5,
    permissions: ['READ_USERS', 'WRITE_USERS'],
    createdAt: '2025-01-01T10:00:00Z',
    updatedAt: '2025-01-01T10:00:00Z'
  };

  beforeEach(() => {
    service = new RoleApiService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllRoles', () => {
    it('should fetch all roles with includeInactive=true', async () => {
      const mockResponse = { data: [mockRoleApiResponse] };
      vi.mocked(mockApiClient.get).mockResolvedValue(mockResponse);

      const result = await service.getAllRoles(true);

      expect(mockApiClient.get).toHaveBeenCalledWith('/admin/roles?includeInactive=true');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('role-1');
      expect(result[0].name).toBe('Admin');
      expect(result[0].status).toBe('ACTIVE');
      expect(result[0].isSystemRole).toBe(false);
    });

    it('should fetch only active roles with includeInactive=false', async () => {
      const mockResponse = { data: [mockRoleApiResponse] };
      vi.mocked(mockApiClient.get).mockResolvedValue(mockResponse);

      await service.getAllRoles(false);

      expect(mockApiClient.get).toHaveBeenCalledWith('/admin/roles?includeInactive=false');
    });

    it('should handle unwrapped response', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue([mockRoleApiResponse]);

      const result = await service.getAllRoles();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('role-1');
    });

    it('should transform API response correctly', async () => {
      const inactiveRole: RoleApiResponse = {
        ...mockRoleApiResponse,
        isActive: false,
        description: undefined
      };
      vi.mocked(mockApiClient.get).mockResolvedValue([inactiveRole]);

      const result = await service.getAllRoles();

      expect(result[0].status).toBe('INACTIVE');
      expect(result[0].description).toBe('No description provided');
      expect(result[0].permissionCount).toBe(2);
    });

    it('should identify system roles correctly', async () => {
      const systemRole: RoleApiResponse = {
        ...mockRoleApiResponse,
        name: 'SUPER_ADMIN'
      };
      vi.mocked(mockApiClient.get).mockResolvedValue([systemRole]);

      const result = await service.getAllRoles();

      expect(result[0].isSystemRole).toBe(true);
    });

    it('should identify roles with SYSTEM_ prefix as system roles', async () => {
      const systemRole: RoleApiResponse = {
        ...mockRoleApiResponse,
        name: 'SYSTEM_MODERATOR'
      };
      vi.mocked(mockApiClient.get).mockResolvedValue([systemRole]);

      const result = await service.getAllRoles();

      expect(result[0].isSystemRole).toBe(true);
    });

    it('should throw error for invalid response format', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: 'not-an-array' });

      await expect(service.getAllRoles()).rejects.toThrow(RoleApiServiceError);
      await expect(service.getAllRoles()).rejects.toThrow('Invalid response format from server');
    });

    it('should handle network error', async () => {
      const networkError = { name: 'NetworkError', message: 'Network failed' };
      vi.mocked(mockApiClient.get).mockRejectedValue(networkError);

      await expect(service.getAllRoles()).rejects.toThrow(RoleApiServiceError);
      await expect(service.getAllRoles()).rejects.toThrow('Unable to connect to server');
    });

    it('should handle API error with response data', async () => {
      const apiError = {
        response: {
          data: {
            message: 'Forbidden',
            code: 'FORBIDDEN',
            details: { reason: 'Insufficient permissions' }
          }
        }
      };
      vi.mocked(mockApiClient.get).mockRejectedValue(apiError);

      await expect(service.getAllRoles()).rejects.toThrow('Forbidden');
    });
  });

  describe('getRoleById', () => {
    it('should fetch role by id', async () => {
      const mockResponse = { data: mockRoleApiResponse };
      vi.mocked(mockApiClient.get).mockResolvedValue(mockResponse);

      const result = await service.getRoleById('role-1');

      expect(mockApiClient.get).toHaveBeenCalledWith('/admin/roles/role-1');
      expect(result.id).toBe('role-1');
      expect(result.name).toBe('Admin');
    });

    it('should handle unwrapped response', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue(mockRoleApiResponse);

      const result = await service.getRoleById('role-1');

      expect(result.id).toBe('role-1');
    });

    it('should throw error for empty role id', async () => {
      await expect(service.getRoleById('')).rejects.toThrow('Role ID is required');
      await expect(service.getRoleById('  ')).rejects.toThrow('Role ID is required');
    });

    it('should throw error when role not found', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: null });

      await expect(service.getRoleById('role-1')).rejects.toThrow('Role not found');
    });
  });

  describe('createRole', () => {
    const createData: CreateRoleData = {
      name: 'New Role',
      description: 'New role description',
      permissions: ['READ_USERS']
    };

    it('should create role successfully', async () => {
      const mockResponse = { data: mockRoleApiResponse };
      vi.mocked(mockApiClient.post).mockResolvedValue(mockResponse);

      const result = await service.createRole(createData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/admin/roles', createData);
      expect(result.id).toBe('role-1');
      expect(result.name).toBe('Admin');
    });

    it('should handle unwrapped response', async () => {
      vi.mocked(mockApiClient.post).mockResolvedValue(mockRoleApiResponse);

      const result = await service.createRole(createData);

      expect(result.id).toBe('role-1');
    });

    it('should throw error for empty role name', async () => {
      await expect(service.createRole({ ...createData, name: '' })).rejects.toThrow('Role name is required');
      await expect(service.createRole({ ...createData, name: '  ' })).rejects.toThrow('Role name is required');
    });

    it('should throw error when creation fails', async () => {
      vi.mocked(mockApiClient.post).mockRejectedValue(new Error('API Error'));

      await expect(service.createRole(createData)).rejects.toThrow(RoleApiServiceError);
    });
  });

  describe('updateRole', () => {
    const updateData: UpdateRoleData = {
      id: 'role-1',
      name: 'Updated Role',
      description: 'Updated description'
    };

    it('should update role successfully', async () => {
      const updatedRole = { ...mockRoleApiResponse, name: 'Updated Role' };
      const mockResponse = { data: updatedRole };
      vi.mocked(mockApiClient.put).mockResolvedValue(mockResponse);

      const result = await service.updateRole(updateData);

      expect(mockApiClient.put).toHaveBeenCalledWith('/admin/roles/role-1', {
        name: 'Updated Role',
        description: 'Updated description'
      });
      expect(result.name).toBe('Updated Role');
    });

    it('should handle unwrapped response', async () => {
      vi.mocked(mockApiClient.put).mockResolvedValue(mockRoleApiResponse);

      const result = await service.updateRole(updateData);

      expect(result.id).toBe('role-1');
    });

    it('should throw error for empty role id', async () => {
      await expect(service.updateRole({ ...updateData, id: '' })).rejects.toThrow('Role ID is required for update');
      await expect(service.updateRole({ ...updateData, id: '  ' })).rejects.toThrow('Role ID is required for update');
    });

    it('should throw error when update fails', async () => {
      vi.mocked(mockApiClient.put).mockRejectedValue(new Error('API Error'));

      await expect(service.updateRole(updateData)).rejects.toThrow(RoleApiServiceError);
    });
  });

  describe('deleteRole', () => {
    it('should delete role successfully', async () => {
      vi.mocked(mockApiClient.delete).mockResolvedValue({});

      const result = await service.deleteRole('role-1');

      expect(mockApiClient.delete).toHaveBeenCalledWith('/admin/roles/role-1');
      expect(result).toBe(true);
    });

    it('should throw error for empty role id', async () => {
      await expect(service.deleteRole('')).rejects.toThrow('Role ID is required');
      await expect(service.deleteRole('  ')).rejects.toThrow('Role ID is required');
    });
  });

  describe('performBulkOperation', () => {
    const bulkOperation: BulkRoleOperation = {
      operation: 'activate',
      roleIds: ['role-1', 'role-2'],
      reason: 'Bulk activation'
    };

    it('should perform bulk activate operation', async () => {
      vi.mocked(mockApiClient.post).mockResolvedValue({});

      const result = await service.performBulkOperation(bulkOperation);

      expect(mockApiClient.post).toHaveBeenCalledWith('/admin/roles/bulk-activate', {
        roleIds: ['role-1', 'role-2'],
        reason: 'Bulk activation'
      });
      expect(result).toBe(true);
    });

    it('should perform bulk deactivate operation', async () => {
      vi.mocked(mockApiClient.post).mockResolvedValue({});

      await service.performBulkOperation({ ...bulkOperation, operation: 'deactivate' });

      expect(mockApiClient.post).toHaveBeenCalledWith('/admin/roles/bulk-deactivate', expect.any(Object));
    });

    it('should perform bulk delete operation', async () => {
      vi.mocked(mockApiClient.post).mockResolvedValue({});

      await service.performBulkOperation({ ...bulkOperation, operation: 'delete' });

      expect(mockApiClient.post).toHaveBeenCalledWith('/admin/roles/bulk-delete', expect.any(Object));
    });

    it('should throw error for empty role ids', async () => {
      await expect(service.performBulkOperation({ ...bulkOperation, roleIds: [] })).rejects.toThrow('Role IDs are required for bulk operation');
    });

    it('should throw error for invalid operation type', async () => {
      await expect(service.performBulkOperation({ ...bulkOperation, operation: 'invalid' as any })).rejects.toThrow('Invalid bulk operation type');
    });
  });

  describe('getRoleStatistics', () => {
    it('should calculate role statistics correctly', async () => {
      const roles: RoleApiResponse[] = [
        { ...mockRoleApiResponse, id: '1', isActive: true, isDefault: true, userCount: 10, permissions: ['P1', 'P2'] },
        { ...mockRoleApiResponse, id: '2', name: 'SUPER_ADMIN', isActive: true, isDefault: false, userCount: 5, permissions: ['P1'] },
        { ...mockRoleApiResponse, id: '3', isActive: false, isDefault: false, userCount: 0, permissions: [] },
      ];
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: roles });

      const result = await service.getRoleStatistics();

      expect(result.totalRoles).toBe(3);
      expect(result.activeRoles).toBe(2);
      expect(result.inactiveRoles).toBe(1);
      expect(result.defaultRoles).toBe(1);
      expect(result.systemRoles).toBe(1);
      expect(result.averagePermissions).toBe(1); // (2 + 1 + 0) / 3 = 1
      expect(result.averageUsers).toBe(5); // (10 + 5 + 0) / 3 = 5
    });

    it('should handle empty roles list', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: [] });

      const result = await service.getRoleStatistics();

      expect(result.totalRoles).toBe(0);
      expect(result.activeRoles).toBe(0);
      expect(result.averagePermissions).toBe(0);
      expect(result.averageUsers).toBe(0);
    });
  });

  describe('assignRoleToUser', () => {
    it('should assign role to user successfully', async () => {
      vi.mocked(mockApiClient.post).mockResolvedValue({});

      const result = await service.assignRoleToUser('user-1', 'role-1', 'Promotion');

      expect(mockApiClient.post).toHaveBeenCalledWith('/admin/roles/assign', {
        userId: 'user-1',
        roleId: 'role-1',
        reason: 'Promotion'
      });
      expect(result).toBe(true);
    });

    it('should assign role without reason', async () => {
      vi.mocked(mockApiClient.post).mockResolvedValue({});

      await service.assignRoleToUser('user-1', 'role-1');

      expect(mockApiClient.post).toHaveBeenCalledWith('/admin/roles/assign', {
        userId: 'user-1',
        roleId: 'role-1',
        reason: undefined
      });
    });

    it('should throw error for empty user id', async () => {
      await expect(service.assignRoleToUser('', 'role-1')).rejects.toThrow('User ID and Role ID are required');
      await expect(service.assignRoleToUser('  ', 'role-1')).rejects.toThrow('User ID and Role ID are required');
    });

    it('should throw error for empty role id', async () => {
      await expect(service.assignRoleToUser('user-1', '')).rejects.toThrow('User ID and Role ID are required');
      await expect(service.assignRoleToUser('user-1', '  ')).rejects.toThrow('User ID and Role ID are required');
    });
  });

  describe('revokeRoleFromUser', () => {
    it('should revoke role from user successfully', async () => {
      vi.mocked(mockApiClient.post).mockResolvedValue({});

      const result = await service.revokeRoleFromUser('user-1', 'role-1', 'Demotion');

      expect(mockApiClient.post).toHaveBeenCalledWith('/admin/roles/revoke', {
        userId: 'user-1',
        roleId: 'role-1',
        reason: 'Demotion'
      });
      expect(result).toBe(true);
    });

    it('should revoke role without reason', async () => {
      vi.mocked(mockApiClient.post).mockResolvedValue({});

      await service.revokeRoleFromUser('user-1', 'role-1');

      expect(mockApiClient.post).toHaveBeenCalledWith('/admin/roles/revoke', {
        userId: 'user-1',
        roleId: 'role-1',
        reason: undefined
      });
    });

    it('should throw error for empty user id', async () => {
      await expect(service.revokeRoleFromUser('', 'role-1')).rejects.toThrow('User ID and Role ID are required');
    });

    it('should throw error for empty role id', async () => {
      await expect(service.revokeRoleFromUser('user-1', '')).rejects.toThrow('User ID and Role ID are required');
    });
  });

  describe('syncRolePermissions', () => {
    it('should sync role permissions successfully', async () => {
      const allPermissions = [
        { id: 'perm-1', name: 'READ_USERS' },
        { id: 'perm-2', name: 'WRITE_USERS' }
      ];
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: allPermissions });
      vi.mocked(mockApiClient.post).mockResolvedValue({});

      const result = await service.syncRolePermissions('role-1', ['READ_USERS', 'WRITE_USERS']);

      expect(mockApiClient.get).toHaveBeenCalledWith('/admin/permissions');
      expect(mockApiClient.post).toHaveBeenCalledWith('/admin/permissions/bulk-assign', {
        roleId: 'role-1',
        permissionIds: ['perm-1', 'perm-2']
      });
      expect(result).toBe(true);
    });

    it('should handle unwrapped permissions response', async () => {
      const allPermissions = [{ id: 'perm-1', name: 'READ_USERS' }];
      vi.mocked(mockApiClient.get).mockResolvedValue(allPermissions);
      vi.mocked(mockApiClient.post).mockResolvedValue({});

      const result = await service.syncRolePermissions('role-1', ['READ_USERS']);

      expect(result).toBe(true);
    });

    it('should skip sync when no permissions provided', async () => {
      const result = await service.syncRolePermissions('role-1', []);

      expect(mockApiClient.get).not.toHaveBeenCalled();
      expect(mockApiClient.post).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should handle some invalid permission names', async () => {
      const allPermissions = [{ id: 'perm-1', name: 'READ_USERS' }];
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: allPermissions });
      vi.mocked(mockApiClient.post).mockResolvedValue({});

      const result = await service.syncRolePermissions('role-1', ['READ_USERS', 'INVALID_PERM']);

      expect(mockApiClient.post).toHaveBeenCalledWith('/admin/permissions/bulk-assign', {
        roleId: 'role-1',
        permissionIds: ['perm-1']
      });
      expect(result).toBe(true);
    });

    it('should skip sync when all permission names are invalid', async () => {
      const allPermissions = [{ id: 'perm-1', name: 'READ_USERS' }];
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: allPermissions });

      const result = await service.syncRolePermissions('role-1', ['INVALID_1', 'INVALID_2']);

      expect(mockApiClient.get).toHaveBeenCalled();
      expect(mockApiClient.post).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should throw error for empty role id', async () => {
      await expect(service.syncRolePermissions('', ['READ_USERS'])).rejects.toThrow('Role ID is required');
      await expect(service.syncRolePermissions('  ', ['READ_USERS'])).rejects.toThrow('Role ID is required');
    });
  });

  describe('singleton instance', () => {
    it('should export singleton instance', () => {
      expect(roleApiService).toBeInstanceOf(RoleApiService);
    });
  });
});
