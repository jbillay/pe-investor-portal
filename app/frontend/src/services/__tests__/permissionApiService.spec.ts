import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Permission } from '@/types/permission';

// Mock the API client
vi.mock('@/composables/useApi', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}));

import { PermissionApiService, PermissionApiServiceError, permissionApiService } from '../permissionApiService';
import { apiClient as mockApiClient } from '@/composables/useApi';

describe('PermissionApiServiceError', () => {
  it('should create error with message, code, and details', () => {
    const error = new PermissionApiServiceError('Test error', 'TEST_CODE', { foo: 'bar' });

    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.details).toEqual({ foo: 'bar' });
    expect(error.name).toBe('PermissionApiServiceError');
  });

  it('should create error without details', () => {
    const error = new PermissionApiServiceError('Test error', 'TEST_CODE');

    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.details).toBeUndefined();
  });
});

describe('PermissionApiService', () => {
  let service: PermissionApiService;

  const mockPermission: Permission = {
    id: 'perm-1',
    name: 'READ_USERS',
    description: 'Permission to read user data',
    resource: 'USER',
    action: 'READ',
    isActive: true,
    createdAt: '2025-01-01T10:00:00Z',
    updatedAt: '2025-01-01T10:00:00Z',
    roleCount: 3
  };

  beforeEach(() => {
    service = new PermissionApiService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllPermissions', () => {
    it('should fetch all permissions with includeInactive=true', async () => {
      const mockResponse = { data: [mockPermission] };
      vi.mocked(mockApiClient.get).mockResolvedValue(mockResponse);

      const result = await service.getAllPermissions(true);

      expect(mockApiClient.get).toHaveBeenCalledWith('/admin/permissions?includeInactive=true');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('perm-1');
      expect(result[0].name).toBe('READ_USERS');
    });

    it('should fetch only active permissions with includeInactive=false', async () => {
      const mockResponse = { data: [mockPermission] };
      vi.mocked(mockApiClient.get).mockResolvedValue(mockResponse);

      await service.getAllPermissions(false);

      expect(mockApiClient.get).toHaveBeenCalledWith('/admin/permissions?includeInactive=false');
    });

    it('should default to includeInactive=true when not specified', async () => {
      const mockResponse = { data: [mockPermission] };
      vi.mocked(mockApiClient.get).mockResolvedValue(mockResponse);

      await service.getAllPermissions();

      expect(mockApiClient.get).toHaveBeenCalledWith('/admin/permissions?includeInactive=true');
    });

    it('should handle unwrapped response', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue([mockPermission]);

      const result = await service.getAllPermissions();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('perm-1');
    });

    it('should handle multiple permissions', async () => {
      const permissions = [
        mockPermission,
        { ...mockPermission, id: 'perm-2', name: 'WRITE_USERS', isActive: false },
        { ...mockPermission, id: 'perm-3', name: 'DELETE_USERS', description: null }
      ];
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: permissions });

      const result = await service.getAllPermissions();

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('READ_USERS');
      expect(result[1].name).toBe('WRITE_USERS');
      expect(result[1].isActive).toBe(false);
      expect(result[2].description).toBeNull();
    });

    it('should throw error for invalid response format', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: 'not-an-array' });

      await expect(service.getAllPermissions()).rejects.toThrow(PermissionApiServiceError);
      await expect(service.getAllPermissions()).rejects.toThrow('Invalid response format from server');
    });

    it('should throw error for null response', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: null });

      await expect(service.getAllPermissions()).rejects.toThrow(PermissionApiServiceError);
      await expect(service.getAllPermissions()).rejects.toThrow('Invalid response format from server');
    });

    it('should throw error for object instead of array', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: { permissions: [] } });

      await expect(service.getAllPermissions()).rejects.toThrow(PermissionApiServiceError);
      await expect(service.getAllPermissions()).rejects.toThrow('Invalid response format from server');
    });

    it('should handle network error', async () => {
      const networkError = { name: 'NetworkError', message: 'Network failed' };
      vi.mocked(mockApiClient.get).mockRejectedValue(networkError);

      await expect(service.getAllPermissions()).rejects.toThrow(PermissionApiServiceError);
      await expect(service.getAllPermissions()).rejects.toThrow('Unable to connect to server');
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

      await expect(service.getAllPermissions()).rejects.toThrow('Forbidden');
    });

    it('should handle empty array response', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: [] });

      const result = await service.getAllPermissions();

      expect(result).toHaveLength(0);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getPermissionsByResource', () => {
    it('should fetch permissions grouped by resource', async () => {
      const mockResponse = {
        data: {
          USER: [mockPermission],
          ROLE: [{ ...mockPermission, id: 'perm-2', name: 'READ_ROLES', resource: 'ROLE' }]
        }
      };
      vi.mocked(mockApiClient.get).mockResolvedValue(mockResponse);

      const result = await service.getPermissionsByResource();

      expect(mockApiClient.get).toHaveBeenCalledWith('/admin/permissions/by-resource');
      expect(result.USER).toHaveLength(1);
      expect(result.ROLE).toHaveLength(1);
      expect(result.USER[0].name).toBe('READ_USERS');
      expect(result.ROLE[0].name).toBe('READ_ROLES');
    });

    it('should handle unwrapped response', async () => {
      const groupedPermissions = {
        USER: [mockPermission]
      };
      vi.mocked(mockApiClient.get).mockResolvedValue(groupedPermissions);

      const result = await service.getPermissionsByResource();

      expect(result.USER).toHaveLength(1);
      expect(result.USER[0].id).toBe('perm-1');
    });

    it('should handle empty grouped response', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: {} });

      const result = await service.getPermissionsByResource();

      expect(result).toEqual({});
      expect(typeof result).toBe('object');
    });

    it('should handle data property being null', async () => {
      // When data is null, the code falls back to the response object itself
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: null });

      const result = await service.getPermissionsByResource();

      // The code returns the response object, which has a data property
      expect(result).toEqual({ data: null });
    });

    it('should accept array response as valid object type', async () => {
      // Arrays are objects in JavaScript (typeof [] === 'object')
      // The code accepts arrays as valid responses
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: [mockPermission] });

      const result = await service.getPermissionsByResource();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
    });

    it('should throw error for primitive response', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: 'string' });

      await expect(service.getPermissionsByResource()).rejects.toThrow(PermissionApiServiceError);
      await expect(service.getPermissionsByResource()).rejects.toThrow('Invalid response format from server');
    });

    it('should handle network error', async () => {
      const networkError = { name: 'NetworkError', message: 'Network failed' };
      vi.mocked(mockApiClient.get).mockRejectedValue(networkError);

      await expect(service.getPermissionsByResource()).rejects.toThrow(PermissionApiServiceError);
      await expect(service.getPermissionsByResource()).rejects.toThrow('Unable to connect to server');
    });

    it('should handle API error with response data', async () => {
      const apiError = {
        response: {
          data: {
            message: 'Unauthorized',
            code: 'UNAUTHORIZED'
          }
        }
      };
      vi.mocked(mockApiClient.get).mockRejectedValue(apiError);

      await expect(service.getPermissionsByResource()).rejects.toThrow('Unauthorized');
    });
  });

  describe('getPermissionById', () => {
    it('should fetch permission by id', async () => {
      const mockResponse = { data: mockPermission };
      vi.mocked(mockApiClient.get).mockResolvedValue(mockResponse);

      const result = await service.getPermissionById('perm-1');

      expect(mockApiClient.get).toHaveBeenCalledWith('/admin/permissions/perm-1');
      expect(result.id).toBe('perm-1');
      expect(result.name).toBe('READ_USERS');
    });

    it('should handle unwrapped response', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue(mockPermission);

      const result = await service.getPermissionById('perm-1');

      expect(result.id).toBe('perm-1');
    });

    it('should throw error for empty permission id', async () => {
      await expect(service.getPermissionById('')).rejects.toThrow('Permission ID is required');
      await expect(service.getPermissionById('  ')).rejects.toThrow('Permission ID is required');
    });

    it('should throw error when permission not found', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: null });

      await expect(service.getPermissionById('perm-1')).rejects.toThrow('Permission not found');
    });

    it('should throw error when data is explicitly null', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: null });

      await expect(service.getPermissionById('perm-1')).rejects.toThrow(PermissionApiServiceError);
      await expect(service.getPermissionById('perm-1')).rejects.toThrow('Permission not found');
    });

    it('should handle network error', async () => {
      const networkError = { name: 'NetworkError', message: 'Network failed' };
      vi.mocked(mockApiClient.get).mockRejectedValue(networkError);

      await expect(service.getPermissionById('perm-1')).rejects.toThrow(PermissionApiServiceError);
      await expect(service.getPermissionById('perm-1')).rejects.toThrow('Unable to connect to server');
    });

    it('should handle API error with response data', async () => {
      const apiError = {
        response: {
          data: {
            message: 'Not Found',
            code: 'NOT_FOUND'
          }
        }
      };
      vi.mocked(mockApiClient.get).mockRejectedValue(apiError);

      await expect(service.getPermissionById('perm-999')).rejects.toThrow('Not Found');
    });

    it('should handle generic error', async () => {
      vi.mocked(mockApiClient.get).mockRejectedValue(new Error('Generic error'));

      await expect(service.getPermissionById('perm-1')).rejects.toThrow(PermissionApiServiceError);
      await expect(service.getPermissionById('perm-1')).rejects.toThrow('Generic error');
    });
  });

  describe('singleton instance', () => {
    it('should export singleton instance', () => {
      expect(permissionApiService).toBeInstanceOf(PermissionApiService);
    });
  });
});
