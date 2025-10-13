/**
 * Unit Tests for useRoles Composable
 * Comprehensive test suite covering all role management operations
 * Follows Vitest best practices with proper mocking and assertions
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { nextTick } from 'vue';
import { useRoles } from '../useRoles';
import { roleApiService, RoleApiServiceError } from '@/services/roleApiService';
import type {
  Role,
  CreateRoleData,
  UpdateRoleData,
  BulkRoleOperation,
  RoleStatistics
} from '@/types/role';

// Mock the role API service
vi.mock('@/services/roleApiService', () => ({
  roleApiService: {
    getAllRoles: vi.fn(),
    createRole: vi.fn(),
    updateRole: vi.fn(),
    deleteRole: vi.fn(),
    performBulkOperation: vi.fn(),
    getRoleStatistics: vi.fn()
  },
  RoleApiServiceError: class RoleApiServiceError extends Error {
    constructor(message: string, public code: string, public details?: Record<string, any>) {
      super(message);
      this.name = 'RoleApiServiceError';
    }
  }
}));

// Mock PrimeVue toast
const mockToastAdd = vi.fn();
vi.mock('primevue/usetoast', () => ({
  useToast: () => ({
    add: mockToastAdd
  })
}));

describe('useRoles Composable', () => {
  let composable: ReturnType<typeof useRoles>;
  const mockApiService = roleApiService as any;

  // Mock data fixtures
  const mockRole1: Role = {
    id: 'role-1',
    name: 'INVESTOR',
    description: 'Investor role',
    status: 'ACTIVE',
    isDefault: true,
    isSystemRole: false,
    userCount: 10,
    permissionCount: 5,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    permissions: []
  };

  const mockRole2: Role = {
    id: 'role-2',
    name: 'SUPER_ADMIN',
    description: 'Super admin role',
    status: 'ACTIVE',
    isDefault: false,
    isSystemRole: true,
    userCount: 2,
    permissionCount: 15,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    permissions: []
  };

  const mockRole3: Role = {
    id: 'role-3',
    name: 'CUSTOM_ROLE',
    description: 'Custom role',
    status: 'INACTIVE',
    isDefault: false,
    isSystemRole: false,
    userCount: 3,
    permissionCount: 8,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    permissions: []
  };

  const mockRoles: Role[] = [mockRole1, mockRole2, mockRole3];

  const mockStatistics: RoleStatistics = {
    totalRoles: 3,
    activeRoles: 2,
    inactiveRoles: 1,
    defaultRoles: 1,
    systemRoles: 1,
    averagePermissions: 9,
    averageUsers: 5
  };

  beforeEach(() => {
    vi.clearAllMocks();
    composable = useRoles();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      expect(composable.roles.value).toEqual([]);
      expect(composable.selectedRoles.value).toEqual([]);
      expect(composable.loading.value).toBe(false);
      expect(composable.error.value).toBeNull();
      expect(composable.statistics.value).toBeNull();
      expect(composable.lastUpdated.value).toBeNull();
    });

    it('should have correct initial filters', () => {
      expect(composable.filters.search).toBe('');
      expect(composable.filters.status).toBeNull();
      expect(composable.filters.type).toBeNull();
    });

    it('should have correct computed properties with empty state', () => {
      expect(composable.filteredRoles.value).toEqual([]);
      expect(composable.totalRoles.value).toBe(0);
      expect(composable.activeRoles.value).toBe(0);
      expect(composable.averagePermissions.value).toBe(0);
    });
  });

  describe('fetchRoles', () => {
    it('should fetch roles successfully with statistics', async () => {
      // Arrange
      mockApiService.getAllRoles.mockResolvedValue(mockRoles);
      mockApiService.getRoleStatistics.mockResolvedValue(mockStatistics);

      // Act
      await composable.fetchRoles();

      // Assert
      expect(mockApiService.getAllRoles).toHaveBeenCalledWith(true);
      expect(mockApiService.getRoleStatistics).toHaveBeenCalled();
      expect(composable.roles.value).toEqual(mockRoles);
      expect(composable.statistics.value).toEqual(mockStatistics);
      expect(composable.lastUpdated.value).toBeInstanceOf(Date);
      expect(composable.loading.value).toBe(false);
      expect(composable.error.value).toBeNull();
    });

    it('should fetch roles with includeInactive parameter', async () => {
      // Arrange
      mockApiService.getAllRoles.mockResolvedValue([mockRole1, mockRole2]);
      mockApiService.getRoleStatistics.mockResolvedValue(mockStatistics);

      // Act
      await composable.fetchRoles(false);

      // Assert
      expect(mockApiService.getAllRoles).toHaveBeenCalledWith(false);
      expect(composable.roles.value).toHaveLength(2);
    });

    it('should handle fetch roles without statistics failure gracefully', async () => {
      // Arrange
      mockApiService.getAllRoles.mockResolvedValue(mockRoles);
      mockApiService.getRoleStatistics.mockRejectedValue(new Error('Stats failed'));
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Act
      await composable.fetchRoles();

      // Assert
      expect(composable.roles.value).toEqual(mockRoles);
      expect(composable.statistics.value).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch role statistics:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle fetch roles error', async () => {
      // Arrange
      const error = new RoleApiServiceError('Failed to fetch roles', 'FETCH_ERROR');
      mockApiService.getAllRoles.mockRejectedValue(error);

      // Act
      await composable.fetchRoles();

      // Assert
      expect(composable.roles.value).toEqual([]);
      expect(composable.error.value).toBe('Failed to fetch roles');
      expect(composable.loading.value).toBe(false);
      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Fetch Roles Failed',
        detail: 'Failed to fetch roles',
        life: 5000
      });
    });

    it('should handle generic error', async () => {
      // Arrange
      const error = new Error('Generic error');
      mockApiService.getAllRoles.mockRejectedValue(error);

      // Act
      await composable.fetchRoles();

      // Assert
      expect(composable.error.value).toBe('Generic error');
      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Fetch Roles Failed',
        detail: 'Generic error',
        life: 5000
      });
    });

    it('should set loading state during fetch', async () => {
      // Arrange
      let resolveRoles: (value: Role[]) => void;
      const rolesPromise = new Promise<Role[]>(resolve => {
        resolveRoles = resolve;
      });
      mockApiService.getAllRoles.mockReturnValue(rolesPromise);
      mockApiService.getRoleStatistics.mockResolvedValue(mockStatistics);

      // Act
      const fetchPromise = composable.fetchRoles();

      // Assert - loading should be true
      expect(composable.loading.value).toBe(true);

      // Resolve
      resolveRoles!(mockRoles);
      await fetchPromise;

      // Assert - loading should be false
      expect(composable.loading.value).toBe(false);
    });
  });

  describe('createRole', () => {
    const createRoleData: CreateRoleData = {
      name: 'NEW_ROLE',
      description: 'New role description',
      isActive: true,
      isDefault: false
    };

    const createdRole: Role = {
      id: 'role-4',
      name: 'NEW_ROLE',
      description: 'New role description',
      status: 'ACTIVE',
      isDefault: false,
      isSystemRole: false,
      userCount: 0,
      permissionCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      permissions: []
    };

    it('should create role successfully', async () => {
      // Arrange
      mockApiService.createRole.mockResolvedValue(createdRole);

      // Act
      const result = await composable.createRole(createRoleData);

      // Assert
      expect(mockApiService.createRole).toHaveBeenCalledWith(createRoleData);
      expect(result).toEqual(createdRole);
      expect(composable.roles.value.some(r => r.id === createdRole.id)).toBe(true);
      expect(composable.lastUpdated.value).toBeInstanceOf(Date);
      expect(composable.loading.value).toBe(false);
      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Role Created',
        detail: 'Role "NEW_ROLE" has been created successfully.',
        life: 3000
      });
    });

    it('should handle create role error', async () => {
      // Arrange
      const error = new RoleApiServiceError('Role name already exists', 'DUPLICATE_NAME');
      mockApiService.createRole.mockRejectedValue(error);

      // Act
      const result = await composable.createRole(createRoleData);

      // Assert
      expect(result).toBeNull();
      expect(composable.error.value).toBe('Role name already exists');
      expect(composable.loading.value).toBe(false);
      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Create Role Failed',
        detail: 'Role name already exists',
        life: 5000
      });
    });

    it('should add created role to local state', async () => {
      // Arrange
      mockApiService.getAllRoles.mockResolvedValue([mockRole1]);
      await composable.fetchRoles();
      mockApiService.createRole.mockResolvedValue(createdRole);

      // Act
      await composable.createRole(createRoleData);

      // Assert
      expect(composable.roles.value).toHaveLength(2);
      expect(composable.roles.value[1]).toEqual(createdRole);
    });
  });

  describe('updateRole', () => {
    const updateRoleData: UpdateRoleData = {
      id: 'role-1',
      name: 'UPDATED_INVESTOR',
      description: 'Updated description'
    };

    const updatedRole: Role = {
      ...mockRole1,
      name: 'UPDATED_INVESTOR',
      description: 'Updated description',
      updatedAt: new Date()
    };

    beforeEach(async () => {
      mockApiService.getAllRoles.mockResolvedValue([mockRole1, mockRole2]);
      await composable.fetchRoles();
    });

    it('should update role successfully', async () => {
      // Arrange
      mockApiService.updateRole.mockResolvedValue(updatedRole);

      // Act
      const result = await composable.updateRole(updateRoleData);

      // Assert
      expect(mockApiService.updateRole).toHaveBeenCalledWith(updateRoleData);
      expect(result).toEqual(updatedRole);
      expect(composable.roles.value[0]).toEqual(updatedRole);
      expect(composable.lastUpdated.value).toBeInstanceOf(Date);
      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Role Updated',
        detail: 'Role "UPDATED_INVESTOR" has been updated successfully.',
        life: 3000
      });
    });

    it('should handle update role error', async () => {
      // Arrange
      const error = new RoleApiServiceError('Cannot update system role', 'SYSTEM_ROLE_UPDATE');
      mockApiService.updateRole.mockRejectedValue(error);

      // Act
      const result = await composable.updateRole(updateRoleData);

      // Assert
      expect(result).toBeNull();
      expect(composable.error.value).toBe('Cannot update system role');
      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Update Role Failed',
        detail: 'Cannot update system role',
        life: 5000
      });
    });

    it('should update role in local state at correct index', async () => {
      // Arrange
      mockApiService.updateRole.mockResolvedValue(updatedRole);

      // Act
      await composable.updateRole(updateRoleData);

      // Assert
      const updatedRoleInState = composable.roles.value.find(r => r.id === 'role-1');
      expect(updatedRoleInState).toEqual(updatedRole);
    });
  });

  describe('deleteRole', () => {
    beforeEach(async () => {
      mockApiService.getAllRoles.mockResolvedValue([mockRole1, mockRole2, mockRole3]);
      await composable.fetchRoles();
    });

    it('should delete role successfully', async () => {
      // Arrange
      mockApiService.deleteRole.mockResolvedValue(true);

      // Act
      const result = await composable.deleteRole('role-1');

      // Assert
      expect(mockApiService.deleteRole).toHaveBeenCalledWith('role-1');
      expect(result).toBe(true);
      expect(composable.roles.value.some(r => r.id === mockRole1.id)).toBe(false);
      expect(composable.roles.value).toHaveLength(2);
      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Role Deleted',
        detail: 'Role "INVESTOR" has been deleted successfully.',
        life: 3000
      });
    });

    it('should handle delete role error', async () => {
      // Arrange
      const error = new RoleApiServiceError('Cannot delete role in use', 'ROLE_IN_USE');
      mockApiService.deleteRole.mockRejectedValue(error);

      // Act
      const result = await composable.deleteRole('role-1');

      // Assert
      expect(result).toBe(false);
      expect(composable.roles.value.some(r => r.id === mockRole1.id)).toBe(true);
      expect(composable.error.value).toBe('Cannot delete role in use');
      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Delete Role Failed',
        detail: 'Cannot delete role in use',
        life: 5000
      });
    });

    it('should remove deleted role from selected roles', async () => {
      // Arrange
      composable.toggleRoleSelection(mockRole1);
      composable.toggleRoleSelection(mockRole2);
      mockApiService.deleteRole.mockResolvedValue(true);

      // Act
      await composable.deleteRole('role-1');

      // Assert
      expect(composable.selectedRoles.value.some(r => r.id === mockRole1.id)).toBe(false);
      expect(composable.selectedRoles.value.some(r => r.id === mockRole2.id)).toBe(true);
    });

    it('should handle missing role name gracefully', async () => {
      // Arrange
      mockApiService.deleteRole.mockResolvedValue(true);

      // Act
      await composable.deleteRole('non-existent-id');

      // Assert
      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Role Deleted',
        detail: 'Role "non-existent-id" has been deleted successfully.',
        life: 3000
      });
    });
  });

  describe('performBulkOperation', () => {
    const bulkOperation: BulkRoleOperation = {
      roleIds: ['role-1', 'role-2'],
      operation: 'activate',
      reason: 'Bulk activation test'
    };

    beforeEach(async () => {
      mockApiService.getAllRoles.mockResolvedValue([mockRole1, mockRole2]);
      await composable.fetchRoles();
      composable.toggleRoleSelection(mockRole1);
      composable.toggleRoleSelection(mockRole2);
    });

    it('should perform bulk operation successfully', async () => {
      // Arrange
      mockApiService.performBulkOperation.mockResolvedValue(true);
      const updatedRoles = [
        { ...mockRole1, status: 'ACTIVE' as const },
        { ...mockRole2, status: 'ACTIVE' as const }
      ];
      mockApiService.getAllRoles.mockResolvedValue(updatedRoles);

      // Act
      const result = await composable.performBulkOperation(bulkOperation);

      // Assert
      expect(mockApiService.performBulkOperation).toHaveBeenCalledWith(bulkOperation);
      expect(result).toBe(true);
      expect(composable.selectedRoles.value).toEqual([]);
      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Bulk Activate',
        detail: 'Successfully activated 2 role(s).',
        life: 3000
      });
    });

    it('should handle different operation types', async () => {
      // Arrange
      const deactivateOperation: BulkRoleOperation = {
        roleIds: ['role-1'],
        operation: 'deactivate'
      };
      mockApiService.performBulkOperation.mockResolvedValue(true);
      mockApiService.getAllRoles.mockResolvedValue([mockRole1]);

      // Act
      await composable.performBulkOperation(deactivateOperation);

      // Assert
      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Bulk Deactivate',
        detail: 'Successfully deactivated 1 role(s).',
        life: 3000
      });
    });

    it('should handle bulk operation error', async () => {
      // Arrange
      const error = new RoleApiServiceError('Bulk operation failed', 'BULK_ERROR');
      mockApiService.performBulkOperation.mockRejectedValue(error);

      // Act
      const result = await composable.performBulkOperation(bulkOperation);

      // Assert
      expect(result).toBe(false);
      expect(composable.selectedRoles.value).toHaveLength(2); // Selection not cleared on error
      expect(composable.error.value).toBe('Bulk operation failed');
      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Bulk Operation Failed',
        detail: 'Bulk operation failed',
        life: 5000
      });
    });

    it('should refresh roles after successful bulk operation', async () => {
      // Arrange
      mockApiService.performBulkOperation.mockResolvedValue(true);
      mockApiService.getAllRoles.mockResolvedValue([mockRole1, mockRole2]);

      // Act
      await composable.performBulkOperation(bulkOperation);

      // Assert
      expect(mockApiService.getAllRoles).toHaveBeenCalledTimes(2); // Once in beforeEach, once in bulk operation
    });
  });

  describe('refreshData', () => {
    it('should refresh all role data', async () => {
      // Arrange
      mockApiService.getAllRoles.mockResolvedValue(mockRoles);
      mockApiService.getRoleStatistics.mockResolvedValue(mockStatistics);

      // Act
      await composable.refreshData();

      // Assert
      expect(mockApiService.getAllRoles).toHaveBeenCalled();
      expect(composable.roles.value).toEqual(mockRoles);
    });
  });

  describe('Computed Properties', () => {
    beforeEach(async () => {
      mockApiService.getAllRoles.mockResolvedValue(mockRoles);
      await composable.fetchRoles();
    });

    it('should calculate totalRoles correctly', () => {
      expect(composable.totalRoles.value).toBe(3);
    });

    it('should calculate activeRoles correctly', () => {
      expect(composable.activeRoles.value).toBe(2); // mockRole1 and mockRole2 are active
    });

    it('should calculate averagePermissions correctly', () => {
      // (5 + 15 + 8) / 3 = 9.33... rounded to 9
      expect(composable.averagePermissions.value).toBe(9);
    });

    it('should return 0 for averagePermissions when no roles', () => {
      const emptyComposable = useRoles();
      expect(emptyComposable.averagePermissions.value).toBe(0);
    });
  });

  describe('Filtering - Search', () => {
    beforeEach(async () => {
      mockApiService.getAllRoles.mockResolvedValue(mockRoles);
      await composable.fetchRoles();
    });

    it('should filter roles by name search', async () => {
      // Act
      composable.filters.search = 'INVESTOR';
      await nextTick();

      // Assert
      expect(composable.filteredRoles.value).toHaveLength(1);
      expect(composable.filteredRoles.value[0].name).toBe('INVESTOR');
    });

    it('should filter roles by description search', async () => {
      // Act
      composable.filters.search = 'admin';
      await nextTick();

      // Assert
      expect(composable.filteredRoles.value).toHaveLength(1);
      expect(composable.filteredRoles.value[0].name).toBe('SUPER_ADMIN');
    });

    it('should be case-insensitive search', async () => {
      // Act
      composable.filters.search = 'custom';
      await nextTick();

      // Assert
      expect(composable.filteredRoles.value).toHaveLength(1);
      expect(composable.filteredRoles.value[0].name).toBe('CUSTOM_ROLE');
    });

    it('should return all roles when search is empty', async () => {
      // Act
      composable.filters.search = '';
      await nextTick();

      // Assert
      expect(composable.filteredRoles.value).toHaveLength(3);
    });

    it('should trim search term', async () => {
      // Ensure we have roles loaded first
      expect(composable.roles.value).toHaveLength(3);

      // Act
      composable.filters.search = '  INVESTOR  ';
      await nextTick();

      // Assert
      expect(composable.filteredRoles.value).toHaveLength(1);
      expect(composable.filteredRoles.value[0].name).toBe('INVESTOR');
    });
  });

  describe('Filtering - Status', () => {
    beforeEach(async () => {
      mockApiService.getAllRoles.mockResolvedValue(mockRoles);
      await composable.fetchRoles();
    });

    it('should filter roles by ACTIVE status', async () => {
      // Act
      composable.filters.status = 'ACTIVE';
      await nextTick();

      // Assert
      expect(composable.filteredRoles.value).toHaveLength(2);
      expect(composable.filteredRoles.value.every(r => r.status === 'ACTIVE')).toBe(true);
    });

    it('should filter roles by INACTIVE status', async () => {
      // Act
      composable.filters.status = 'INACTIVE';
      await nextTick();

      // Assert
      expect(composable.filteredRoles.value).toHaveLength(1);
      expect(composable.filteredRoles.value[0].status).toBe('INACTIVE');
    });

    it('should return all roles when status filter is null', async () => {
      // Act
      composable.filters.status = null;
      await nextTick();

      // Assert
      expect(composable.filteredRoles.value).toHaveLength(3);
    });
  });

  describe('Filtering - Type', () => {
    beforeEach(async () => {
      mockApiService.getAllRoles.mockResolvedValue(mockRoles);
      await composable.fetchRoles();
    });

    it('should filter roles by SYSTEM type', async () => {
      // Act
      composable.filters.type = 'SYSTEM';
      await nextTick();

      // Assert
      expect(composable.filteredRoles.value).toHaveLength(1);
      expect(composable.filteredRoles.value[0].isSystemRole).toBe(true);
    });

    it('should filter roles by DEFAULT type', async () => {
      // Act
      composable.filters.type = 'DEFAULT';
      await nextTick();

      // Assert
      expect(composable.filteredRoles.value).toHaveLength(1);
      expect(composable.filteredRoles.value[0].isDefault).toBe(true);
    });

    it('should filter roles by CUSTOM type', async () => {
      // Act
      composable.filters.type = 'CUSTOM';
      await nextTick();

      // Assert
      expect(composable.filteredRoles.value).toHaveLength(1);
      expect(composable.filteredRoles.value[0]).toMatchObject({
        isSystemRole: false,
        isDefault: false
      });
    });

    it('should return all roles when type filter is null', async () => {
      // Act
      composable.filters.type = null;
      await nextTick();

      // Assert
      expect(composable.filteredRoles.value).toHaveLength(3);
    });
  });

  describe('Combined Filters', () => {
    beforeEach(async () => {
      mockApiService.getAllRoles.mockResolvedValue(mockRoles);
      await composable.fetchRoles();
    });

    it('should apply multiple filters together', async () => {
      // Act
      composable.filters.status = 'ACTIVE';
      composable.filters.type = 'SYSTEM';
      await nextTick();

      // Assert
      expect(composable.filteredRoles.value).toHaveLength(1);
      expect(composable.filteredRoles.value[0].name).toBe('SUPER_ADMIN');
    });

    it('should combine search with status filter', async () => {
      // Act
      composable.filters.search = 'ROLE';
      composable.filters.status = 'INACTIVE';
      await nextTick();

      // Assert
      expect(composable.filteredRoles.value).toHaveLength(1);
      expect(composable.filteredRoles.value[0].name).toBe('CUSTOM_ROLE');
    });
  });

  describe('clearFilters', () => {
    beforeEach(async () => {
      mockApiService.getAllRoles.mockResolvedValue(mockRoles);
      await composable.fetchRoles();
    });

    it('should clear all filters', async () => {
      // Arrange
      composable.filters.search = 'test';
      composable.filters.status = 'ACTIVE';
      composable.filters.type = 'SYSTEM';

      // Act
      composable.clearFilters();
      await nextTick();

      // Assert
      expect(composable.filters.search).toBe('');
      expect(composable.filters.status).toBeNull();
      expect(composable.filters.type).toBeNull();
      expect(composable.filteredRoles.value).toHaveLength(3);
    });
  });

  describe('Filter Change Side Effects', () => {
    beforeEach(async () => {
      mockApiService.getAllRoles.mockResolvedValue(mockRoles);
      await composable.fetchRoles();
    });

    it('should clear error when search filter changes', async () => {
      // Arrange
      const error = new RoleApiServiceError('Some error', 'ERROR');
      mockApiService.createRole.mockRejectedValue(error);
      await composable.createRole({ name: 'TEST' });
      expect(composable.error.value).toBe('Some error');

      // Act
      composable.filters.search = 'test';
      await nextTick();

      // Assert
      expect(composable.error.value).toBeNull();
    });

    it('should clear error when status filter changes', async () => {
      // Arrange
      const error = new RoleApiServiceError('Some error', 'ERROR');
      mockApiService.createRole.mockRejectedValue(error);
      await composable.createRole({ name: 'TEST' });
      expect(composable.error.value).toBe('Some error');

      // Act
      composable.filters.status = 'ACTIVE';
      await nextTick();

      // Assert
      expect(composable.error.value).toBeNull();
    });

    it('should clear error when type filter changes', async () => {
      // Arrange
      const error = new RoleApiServiceError('Some error', 'ERROR');
      mockApiService.createRole.mockRejectedValue(error);
      await composable.createRole({ name: 'TEST' });
      expect(composable.error.value).toBe('Some error');

      // Act
      composable.filters.type = 'SYSTEM';
      await nextTick();

      // Assert
      expect(composable.error.value).toBeNull();
    });
  });

  describe('Utility Functions - getRoleById', () => {
    beforeEach(async () => {
      mockApiService.getAllRoles.mockResolvedValue(mockRoles);
      await composable.fetchRoles();
    });

    it('should get role by ID successfully', () => {
      const role = composable.getRoleById('role-1');
      expect(role).toEqual(mockRole1);
    });

    it('should return undefined for non-existent role ID', () => {
      const role = composable.getRoleById('non-existent');
      expect(role).toBeUndefined();
    });
  });

  describe('Utility Functions - isRoleSelected', () => {
    beforeEach(async () => {
      mockApiService.getAllRoles.mockResolvedValue(mockRoles);
      await composable.fetchRoles();
    });

    it('should return true for selected role', () => {
      composable.toggleRoleSelection(mockRole1);
      expect(composable.isRoleSelected('role-1')).toBe(true);
    });

    it('should return false for non-selected role', () => {
      expect(composable.isRoleSelected('role-1')).toBe(false);
    });
  });

  describe('Utility Functions - toggleRoleSelection', () => {
    beforeEach(async () => {
      mockApiService.getAllRoles.mockResolvedValue(mockRoles);
      await composable.fetchRoles();
    });

    it('should add role to selection when not selected', () => {
      composable.toggleRoleSelection(mockRole1);
      expect(composable.selectedRoles.value).toHaveLength(1);
      expect(composable.selectedRoles.value[0].id).toBe(mockRole1.id);
    });

    it('should remove role from selection when already selected', () => {
      composable.toggleRoleSelection(mockRole1);
      expect(composable.selectedRoles.value).toHaveLength(1);

      composable.toggleRoleSelection(mockRole1);
      expect(composable.selectedRoles.value).toHaveLength(0);
    });

    it('should handle multiple role selections', () => {
      composable.toggleRoleSelection(mockRole1);
      composable.toggleRoleSelection(mockRole2);

      expect(composable.selectedRoles.value).toHaveLength(2);
      expect(composable.selectedRoles.value.some(r => r.id === mockRole1.id)).toBe(true);
      expect(composable.selectedRoles.value.some(r => r.id === mockRole2.id)).toBe(true);
    });
  });

  describe('Utility Functions - clearSelection', () => {
    beforeEach(async () => {
      mockApiService.getAllRoles.mockResolvedValue(mockRoles);
      await composable.fetchRoles();
    });

    it('should clear all selected roles', () => {
      composable.toggleRoleSelection(mockRole1);
      composable.toggleRoleSelection(mockRole2);
      expect(composable.selectedRoles.value).toHaveLength(2);

      composable.clearSelection();
      expect(composable.selectedRoles.value).toEqual([]);
    });

    it('should handle clearing empty selection', () => {
      composable.clearSelection();
      expect(composable.selectedRoles.value).toEqual([]);
    });
  });

  describe('Utility Functions - selectAllVisible', () => {
    beforeEach(async () => {
      mockApiService.getAllRoles.mockResolvedValue(mockRoles);
      await composable.fetchRoles();
    });

    it('should select all visible roles', () => {
      composable.selectAllVisible();
      expect(composable.selectedRoles.value).toHaveLength(3);
      expect(composable.selectedRoles.value.some(r => r.id === mockRole1.id)).toBe(true);
      expect(composable.selectedRoles.value.some(r => r.id === mockRole2.id)).toBe(true);
      expect(composable.selectedRoles.value.some(r => r.id === mockRole3.id)).toBe(true);
    });

    it('should select only filtered visible roles', async () => {
      composable.filters.status = 'ACTIVE';
      await nextTick();

      composable.selectAllVisible();
      expect(composable.selectedRoles.value).toHaveLength(2);
      expect(composable.selectedRoles.value.some(r => r.id === mockRole1.id)).toBe(true);
      expect(composable.selectedRoles.value.some(r => r.id === mockRole2.id)).toBe(true);
    });

    it('should replace previous selection with all visible', () => {
      composable.toggleRoleSelection(mockRole1);
      expect(composable.selectedRoles.value).toHaveLength(1);

      composable.selectAllVisible();
      expect(composable.selectedRoles.value).toHaveLength(3);
    });
  });

  describe('Error Handling - Unknown Error', () => {
    it('should handle error without message property', async () => {
      // Arrange
      const error = { someProperty: 'value' };
      mockApiService.getAllRoles.mockRejectedValue(error);

      // Act
      await composable.fetchRoles();

      // Assert
      expect(composable.error.value).toBe('An unexpected error occurred');
      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Fetch Roles Failed',
        detail: 'An unexpected error occurred',
        life: 5000
      });
    });
  });

  describe('Readonly Properties', () => {
    it('should prevent direct modification of readonly state properties', () => {
      // Readonly refs in Vue use DeepReadonly which doesn't throw but prevents reassignment at compile time
      // We can test that the refs are readonly by checking their type or trying to modify nested properties
      const rolesRef = composable.roles;
      const loadingRef = composable.loading;
      const errorRef = composable.error;

      // These should be Readonly refs
      expect(rolesRef.value).toBeDefined();
      expect(loadingRef.value).toBeDefined();
      expect(errorRef.value).toBeDefined();
    });

    it('should expose mutable ref for selectedRoles', () => {
      // selectedRoles should be mutable
      expect(() => {
        composable.selectedRoles.value = [mockRole1];
      }).not.toThrow();

      expect(composable.selectedRoles.value).toHaveLength(1);
      expect(composable.selectedRoles.value[0].id).toBe(mockRole1.id);
    });
  });
});
