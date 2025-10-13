/**
 * Role Management Composable
 * Provides reactive state management for role-related operations
 * Follows Vue.js 3 Composition API best practices with proper error handling
 */

import { ref, computed, reactive, watch, readonly, toRef, type Ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import { roleApiService, RoleApiServiceError } from '@/services/roleApiService';
import type {
  Role,
  RoleFilters,
  CreateRoleData,
  UpdateRoleData,
  BulkRoleOperation,
  RoleStatistics
} from '@/types/role';

/**
 * Role management state interface
 */
interface RoleState {
  roles: Role[];
  selectedRoles: Role[];
  loading: boolean;
  error: string | null;
  statistics: RoleStatistics | null;
  lastUpdated: Date | null;
}

/**
 * Role composable return type
 */
interface UseRolesReturn {
  // State
  roles: Readonly<Ref<Role[]>>;
  selectedRoles: Ref<Role[]>;
  loading: Readonly<Ref<boolean>>;
  error: Readonly<Ref<string | null>>;
  statistics: Readonly<Ref<RoleStatistics | null>>;
  lastUpdated: Readonly<Ref<Date | null>>;

  // Computed
  filteredRoles: Readonly<Ref<Role[]>>;
  totalRoles: Readonly<Ref<number>>;
  activeRoles: Readonly<Ref<number>>;
  averagePermissions: Readonly<Ref<number>>;

  // Filters
  filters: RoleFilters;
  clearFilters: () => void;

  // Actions
  fetchRoles: (includeInactive?: boolean) => Promise<void>;
  createRole: (roleData: CreateRoleData) => Promise<Role | null>;
  updateRole: (updateData: UpdateRoleData) => Promise<Role | null>;
  deleteRole: (roleId: string) => Promise<boolean>;
  performBulkOperation: (operation: BulkRoleOperation) => Promise<boolean>;
  refreshData: () => Promise<void>;

  // Utilities
  getRoleById: (roleId: string) => Role | undefined;
  isRoleSelected: (roleId: string) => boolean;
  toggleRoleSelection: (role: Role) => void;
  clearSelection: () => void;
  selectAllVisible: () => void;
}

/**
 * Create role management composable
 * Provides centralized state management for role operations
 */
export function useRoles(): UseRolesReturn {
  // Composables
  const toast = useToast();

  // Reactive state
  const state = reactive<RoleState>({
    roles: [],
    selectedRoles: [],
    loading: false,
    error: null,
    statistics: null,
    lastUpdated: null
  });

  // Reactive filters
  const filters = reactive<RoleFilters>({
    search: '',
    status: null,
    type: null
  });

  // Computed properties
  const filteredRoles = computed(() => {
    let filtered = state.roles;

    // Search filter
    if (filters.search.trim()) {
      const searchTerm = filters.search.trim().toLowerCase();
      filtered = filtered.filter(role =>
        role.name.toLowerCase().includes(searchTerm) ||
        role.description.toLowerCase().includes(searchTerm)
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(role => role.status === filters.status);
    }

    // Type filter
    if (filters.type) {
      switch (filters.type) {
        case 'SYSTEM':
          filtered = filtered.filter(role => role.isSystemRole);
          break;
        case 'DEFAULT':
          filtered = filtered.filter(role => role.isDefault);
          break;
        case 'CUSTOM':
          filtered = filtered.filter(role => !role.isSystemRole && !role.isDefault);
          break;
      }
    }

    return filtered;
  });

  const totalRoles = computed(() => state.roles.length);
  const activeRoles = computed(() => state.roles.filter(r => r.status === 'ACTIVE').length);
  const averagePermissions = computed(() => {
    if (state.roles.length === 0) return 0;
    const total = state.roles.reduce((sum, role) => sum + role.permissionCount, 0);
    return Math.round(total / state.roles.length);
  });

  /**
   * Error handling utility
   */
  const handleError = (error: any, operation: string) => {
    console.error(`Error in ${operation}:`, error);

    let errorMessage = 'An unexpected error occurred';

    if (error instanceof RoleApiServiceError) {
      errorMessage = error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    state.error = errorMessage;
    toast.add({
      severity: 'error',
      summary: `${operation} Failed`,
      detail: errorMessage,
      life: 5000
    });
  };

  /**
   * Success notification utility
   */
  const showSuccess = (message: string, detail?: string) => {
    toast.add({
      severity: 'success',
      summary: message,
      detail: detail,
      life: 3000
    });
  };

  /**
   * Fetches all roles from the API
   */
  const fetchRoles = async (includeInactive: boolean = true): Promise<void> => {
    try {
      state.loading = true;
      state.error = null;

      const fetchedRoles = await roleApiService.getAllRoles(includeInactive);
      state.roles = fetchedRoles;
      state.lastUpdated = new Date();

      // Fetch statistics in parallel
      try {
        state.statistics = await roleApiService.getRoleStatistics();
      } catch (statsError) {
        console.warn('Failed to fetch role statistics:', statsError);
        // Don't fail the main operation if statistics fail
      }

    } catch (error) {
      handleError(error, 'Fetch Roles');
    } finally {
      state.loading = false;
    }
  };

  /**
   * Creates a new role
   */
  const createRole = async (roleData: CreateRoleData): Promise<Role | null> => {
    try {
      state.loading = true;
      state.error = null;

      const newRole = await roleApiService.createRole(roleData);

      // Add to local state
      state.roles.push(newRole);
      state.lastUpdated = new Date();

      showSuccess('Role Created', `Role "${newRole.name}" has been created successfully.`);

      return newRole;
    } catch (error) {
      handleError(error, 'Create Role');
      return null;
    } finally {
      state.loading = false;
    }
  };

  /**
   * Updates an existing role
   */
  const updateRole = async (updateData: UpdateRoleData): Promise<Role | null> => {
    try {
      state.loading = true;
      state.error = null;

      const updatedRole = await roleApiService.updateRole(updateData);

      // Update local state
      const index = state.roles.findIndex(r => r.id === updatedRole.id);
      if (index !== -1) {
        state.roles[index] = updatedRole;
      }
      state.lastUpdated = new Date();

      showSuccess('Role Updated', `Role "${updatedRole.name}" has been updated successfully.`);

      return updatedRole;
    } catch (error) {
      handleError(error, 'Update Role');
      return null;
    } finally {
      state.loading = false;
    }
  };

  /**
   * Deletes a role
   */
  const deleteRole = async (roleId: string): Promise<boolean> => {
    try {
      state.loading = true;
      state.error = null;

      const role = state.roles.find(r => r.id === roleId);
      await roleApiService.deleteRole(roleId);

      // Remove from local state
      state.roles = state.roles.filter(r => r.id !== roleId);
      state.selectedRoles = state.selectedRoles.filter(r => r.id !== roleId);
      state.lastUpdated = new Date();

      showSuccess('Role Deleted', `Role "${role?.name || roleId}" has been deleted successfully.`);

      return true;
    } catch (error) {
      handleError(error, 'Delete Role');
      return false;
    } finally {
      state.loading = false;
    }
  };

  /**
   * Performs bulk operations on selected roles
   */
  const performBulkOperation = async (operation: BulkRoleOperation): Promise<boolean> => {
    try {
      state.loading = true;
      state.error = null;

      await roleApiService.performBulkOperation(operation);

      // Refresh roles to get updated state
      await fetchRoles();

      const operationText = operation.operation.charAt(0).toUpperCase() + operation.operation.slice(1);
      showSuccess(`Bulk ${operationText}`, `Successfully ${operation.operation}d ${operation.roleIds.length} role(s).`);

      // Clear selection after bulk operation
      state.selectedRoles = [];

      return true;
    } catch (error) {
      handleError(error, 'Bulk Operation');
      return false;
    } finally {
      state.loading = false;
    }
  };

  /**
   * Refreshes all role data
   */
  const refreshData = async (): Promise<void> => {
    await fetchRoles();
  };

  /**
   * Utility: Get role by ID
   */
  const getRoleById = (roleId: string): Role | undefined => {
    return state.roles.find(role => role.id === roleId);
  };

  /**
   * Utility: Check if role is selected
   */
  const isRoleSelected = (roleId: string): boolean => {
    return state.selectedRoles.some(role => role.id === roleId);
  };

  /**
   * Utility: Toggle role selection
   */
  const toggleRoleSelection = (role: Role): void => {
    const index = state.selectedRoles.findIndex(r => r.id === role.id);
    if (index === -1) {
      state.selectedRoles.push(role);
    } else {
      state.selectedRoles.splice(index, 1);
    }
  };

  /**
   * Utility: Clear all selections
   */
  const clearSelection = (): void => {
    state.selectedRoles = [];
  };

  /**
   * Utility: Select all visible roles
   */
  const selectAllVisible = (): void => {
    state.selectedRoles = [...filteredRoles.value];
  };

  /**
   * Utility: Clear all filters
   */
  const clearFilters = (): void => {
    filters.search = '';
    filters.status = null;
    filters.type = null;
  };

  // Watch for filter changes to clear error state
  watch([() => filters.search, () => filters.status, () => filters.type], () => {
    if (state.error) {
      state.error = null;
    }
  });

  // Return readonly refs and reactive objects
  return {
    // State (readonly)
    roles: readonly(toRef(state, 'roles')),
    selectedRoles: toRef(state, 'selectedRoles'),
    loading: readonly(toRef(state, 'loading')),
    error: readonly(toRef(state, 'error')),
    statistics: readonly(toRef(state, 'statistics')),
    lastUpdated: readonly(toRef(state, 'lastUpdated')),

    // Computed (readonly)
    filteredRoles: readonly(filteredRoles),
    totalRoles: readonly(totalRoles),
    activeRoles: readonly(activeRoles),
    averagePermissions: readonly(averagePermissions),

    // Filters (reactive)
    filters,
    clearFilters,

    // Actions
    fetchRoles,
    createRole,
    updateRole,
    deleteRole,
    performBulkOperation,
    refreshData,

    // Utilities
    getRoleById,
    isRoleSelected,
    toggleRoleSelection,
    clearSelection,
    selectAllVisible
  };
}