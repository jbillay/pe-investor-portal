<template>
  <div class="role-management-panel">

    <!-- Filters and Search -->
    <div class="filters-section mb-4 p-4 bg-gray-50 rounded-lg border">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="search-field">
          <label class="block text-sm font-medium text-gray-700 mb-1">Search Roles</label>
          <InputText
            v-model="filters.search"
            placeholder="Search by name or description..."
            class="w-full"
          />
        </div>
        <div class="status-filter">
          <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <Select
            v-model="filters.status"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="All Statuses"
            class="w-full"
            showClear
          />
        </div>
        <div class="type-filter">
          <label class="block text-sm font-medium text-gray-700 mb-1">Role Type</label>
          <Select
            v-model="filters.type"
            :options="roleTypeOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="All Types"
            class="w-full"
            showClear
          />
        </div>
        <div class="actions-field flex items-end">
          <Button
            label="Clear Filters"
            icon="pi pi-filter-slash"
            class="p-button-outlined w-full"
            @click="clearFilters"
          />
        </div>
      </div>
    </div>

    <!-- Roles Data Table -->
    <DataTable
      :value="filteredRoles"
      :paginator="true"
      :rows="15"
      :loading="rolesLoading"
      responsiveLayout="scroll"
      dataKey="id"
      :rowClass="getRowClass"
      class="role-datatable"
      :globalFilterFields="['name', 'description']"
      :sortField="'name'"
      :sortOrder="1"
    >
      <template #header>
        <div class="flex justify-between items-center">
          <span class="text-lg font-medium text-gray-900">
            {{ filteredRoles.length }} roles found
          </span>
        </div>
      </template>

      <!-- Role Name and Details -->
      <Column field="name" :sortable="true" class="min-w-48">
        <template #header>
          <div class="flex items-center gap-2 text-gray-700 font-semibold">
            <i class="pi pi-id-card text-blue-600"></i>
            <span>Role Details</span>
          </div>
        </template>
        <template #body="{ data }">
          <div class="flex items-center gap-3">
            <div
              class="role-icon w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              :style="{ backgroundColor: getRoleColor(data.name) }"
            >
              {{ getRoleInitials(data.name) }}
            </div>
            <div>
              <div class="font-semibold text-gray-900 flex items-center gap-2">
                {{ data.name }}
                <Tag
                  v-if="data.isDefault"
                  value="DEFAULT"
                  severity="info"
                  class="text-xs"
                />
                <Tag
                  v-if="data.isSystemRole"
                  value="SYSTEM"
                  severity="warning"
                  class="text-xs"
                />
              </div>
              <div class="text-sm text-gray-600 mt-1">
                {{ data.description || 'No description' }}
              </div>
            </div>
          </div>
        </template>
      </Column>

      <!-- Users Count -->
      <Column field="userCount" :sortable="true" class="text-center">
        <template #header>
          <div class="flex items-center justify-center gap-2 text-gray-700 font-semibold">
            <i class="pi pi-users text-purple-600"></i>
            <span>Assigned Users</span>
          </div>
        </template>
        <template #body="{ data }">
          <div class="flex flex-col items-center">
            <span class="text-2xl font-bold text-blue-600">{{ data.userCount || 0 }}</span>
            <span class="text-xs text-gray-500">assigned</span>
          </div>
        </template>
      </Column>

      <!-- Permissions Count -->
      <Column field="permissionCount" :sortable="true" class="text-center">
        <template #header>
          <div class="flex items-center justify-center gap-2 text-gray-700 font-semibold">
            <i class="pi pi-shield text-green-600"></i>
            <span>Permission Count</span>
          </div>
        </template>
        <template #body="{ data }">
          <div class="flex flex-col items-center">
            <span class="text-2xl font-bold text-green-600">{{ data.permissionCount || 0 }}</span>
            <span class="text-xs text-gray-500">permissions</span>
          </div>
        </template>
      </Column>

      <!-- Status -->
      <Column field="status" :sortable="true">
        <template #header>
          <div class="flex items-center gap-2 text-gray-700 font-semibold">
            <i class="pi pi-circle text-emerald-600"></i>
            <span>Role Status</span>
          </div>
        </template>
        <template #body="{ data }">
          <Tag
            :value="data.status || 'ACTIVE'"
            :severity="getStatusSeverity(data.status)"
            class="font-medium"
          />
        </template>
      </Column>

      <!-- Created Date -->
      <Column field="createdAt" :sortable="true">
        <template #header>
          <div class="flex items-center gap-2 text-gray-700 font-semibold">
            <i class="pi pi-calendar text-orange-600"></i>
            <span>Date Created</span>
          </div>
        </template>
        <template #body="{ data }">
          <div class="text-sm">
            <div class="text-gray-900">{{ formatDate(data.createdAt) }}</div>
            <div class="text-gray-500">{{ formatTime(data.createdAt) }}</div>
          </div>
        </template>
      </Column>

      <!-- Actions -->
      <Column class="min-w-40">
        <template #header>
          <div class="flex items-center gap-2 text-gray-700 font-semibold">
            <i class="pi pi-cog text-gray-600"></i>
            <span>Actions</span>
          </div>
        </template>
        <template #body="{ data }">
          <div class="flex items-center gap-2">
            <Button
              icon="pi pi-eye"
              class="p-button-sm p-button-text p-button-rounded"
              @click="viewRole(data)"
              v-tooltip.top="'View Details'"
            />
            <Button
              icon="pi pi-pencil"
              class="p-button-sm p-button-text p-button-rounded"
              @click="editRole(data)"
              v-tooltip.top="'Edit Role'"
              :disabled="data.isSystemRole"
            />
            <Button
              icon="pi pi-shield"
              class="p-button-sm p-button-text p-button-rounded"
              @click="assignPermissionsToRole(data)"
              v-tooltip.top="'Manage Permissions'"
            />
            <Button
              icon="pi pi-trash"
              class="p-button-sm p-button-text p-button-rounded p-button-danger"
              @click="confirmDeleteRole(data)"
              v-tooltip.top="'Delete Role'"
              :disabled="data.isSystemRole || data.userCount > 0"
            />
          </div>
        </template>
      </Column>

      <template #empty>
        <div class="text-center py-8">
          <i class="pi pi-users text-4xl text-gray-400 mb-4"></i>
          <p class="text-gray-600 text-lg mb-2">No roles found</p>
          <p class="text-gray-500 text-sm mb-4">Get started by creating your first role</p>
          <Button
            label="Create Role"
            icon="pi pi-plus"
            class="p-button-primary"
            @click="emit('create-role')"
          />
        </div>
      </template>

      <template #loading>
        <div class="text-center py-8">
          <ProgressSpinner class="w-12 h-12" />
          <p class="text-gray-600 mt-4">Loading roles...</p>
        </div>
      </template>
    </DataTable>

    <!-- Role Statistics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
      <Card class="stats-card">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <div class="text-2xl font-bold text-blue-600">{{ totalRoles }}</div>
              <div class="text-sm text-gray-600">Total Roles</div>
            </div>
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i class="pi pi-users text-blue-600 text-xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card class="stats-card">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <div class="text-2xl font-bold text-green-600">{{ activeRoles }}</div>
              <div class="text-sm text-gray-600">Active Roles</div>
            </div>
            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <i class="pi pi-check-circle text-green-600 text-xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card class="stats-card">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <div class="text-2xl font-bold text-purple-600">{{ customRoles }}</div>
              <div class="text-sm text-gray-600">Custom Roles</div>
            </div>
            <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <i class="pi pi-cog text-purple-600 text-xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card class="stats-card">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <div class="text-2xl font-bold text-orange-600">{{ averagePermissions }}</div>
              <div class="text-sm text-gray-600">Avg Permissions</div>
            </div>
            <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <i class="pi pi-shield text-orange-600 text-xl"></i>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Role Details Dialog -->
    <RoleDetailsDialog
      v-model:visible="roleDetailsDialogVisible"
      :role="selectedRoleForDetails"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import RoleDetailsDialog from './RoleDetailsDialog.vue';
import { useRoles } from '@/composables/useRoles';
import type { Role } from '@/types/role';

/**
 * RoleManagementPanel Component
 * Enterprise-grade role management with real-time API integration
 * Follows Vue.js 3 Composition API best practices
 */

// Props - kept for backward compatibility, but loading now comes from composable
defineProps<{
  loading?: boolean;
}>();

// Emits - enhanced with proper typing
const emit = defineEmits<{
  'edit-role': [role: Role];
  'create-role': [];
  'assign-permissions': [role: Role];
  'role-updated': [role: Role];
  'role-deleted': [roleId: string];
}>();

// Composables
const toast = useToast();
const confirm = useConfirm();

// Local state for Role Details Dialog
const roleDetailsDialogVisible = ref(false);
const selectedRoleForDetails = ref<Role | null>(null);

// Role management composable - provides all state and actions
const {
  // State
  roles,
  loading: rolesLoading,
  error,

  // Computed
  filteredRoles,
  totalRoles,
  activeRoles,
  averagePermissions,

  // Filters
  filters,
  clearFilters,

  // Actions
  fetchRoles,
  deleteRole,
} = useRoles();

// Filter options for dropdowns
const statusOptions = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
];

const roleTypeOptions = [
  { label: 'System Roles', value: 'SYSTEM' },
  { label: 'Default Roles', value: 'DEFAULT' },
  { label: 'Custom Roles', value: 'CUSTOM' },
];

// Local computed properties for dashboard stats
const customRoles = computed(() => roles.value.filter(r => !r.isSystemRole && !r.isDefault).length);

/**
 * Component Methods
 * All role-related operations now use the composable
 */

const getRowClass = (data: Role) => {
  if (data.status === 'INACTIVE') return 'opacity-60';
  if (data.isDefault) return 'bg-blue-50';
  return '';
};

const getRoleColor = (roleName: string) => {
  const colors: Record<string, string> = {
    'SUPER_ADMIN': '#ef4444',
    'FUND_MANAGER': '#8b5cf6',
    'COMPLIANCE_OFFICER': '#f59e0b',
    'ANALYST': '#06b6d4',
    'INVESTOR': '#10b981',
    'VIEWER': '#6b7280',
  };
  return colors[roleName] || '#6366f1';
};

const getRoleInitials = (roleName: string) => {
  return roleName.split('_').map(word => word[0]).join('').toUpperCase();
};

const getStatusSeverity = (status: string) => {
  switch (status) {
    case 'ACTIVE': return 'success';
    case 'INACTIVE': return 'warning';
    case 'DEPRECATED': return 'danger';
    default: return 'info';
  }
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(date));
};

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
};

/**
 * Role deletion with confirmation dialog
 * Uses the API service through the composable
 */
const confirmDeleteRole = (role: Role) => {
  confirm.require({
    message: `Are you sure you want to delete the role "${role.name}"? This action cannot be undone.`,
    header: 'Delete Role',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      const success = await deleteRole(role.id);
      if (success) {
        emit('role-deleted', role.id);
      }
    }
  });
};


/**
 * Enhanced role management methods
 */
const viewRole = (role: Role) => {
  selectedRoleForDetails.value = role;
  roleDetailsDialogVisible.value = true;
};

const editRole = (role: Role) => {
  emit('edit-role', role);
};

const assignPermissionsToRole = (role: Role) => {
  emit('assign-permissions', role);
};

/**
 * Component lifecycle
 * Load initial data and set up watchers
 */
onMounted(async () => {
  // Load roles data on component mount
  await fetchRoles(true);
});

// Watch for error state and display notifications
watch(error, (newError) => {
  if (newError) {
    // Error is already handled by the composable with toast notifications
    // This watcher can be used for additional error handling if needed
    console.error('Role management error:', newError);
  }
});

/**
 * Expose methods for parent components
 */
defineExpose({
  refreshRoles: fetchRoles
});
</script>

<style scoped>
.role-management-panel {
  @apply space-y-6;
}

.panel-header {
  @apply bg-white rounded-lg shadow-sm p-6 border border-gray-200;
}

.filters-section {
  @apply transition-all duration-200;
}

.role-datatable {
  @apply bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden;
}

.role-datatable :deep(.p-datatable-header) {
  @apply bg-gray-50 border-b border-gray-200 px-6 py-4;
}

.role-datatable :deep(.p-datatable-thead > tr > th) {
  @apply bg-gradient-to-br from-slate-50 to-gray-100 text-gray-800 font-semibold border-b-2 border-gray-300;
  padding: 16px 12px;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  position: relative;
}

.role-datatable :deep(.p-datatable-thead > tr > th:hover) {
  @apply bg-gradient-to-br from-blue-50 to-slate-100;
  transition: all 0.2s ease-in-out;
}

.role-datatable :deep(.p-datatable-thead > tr > th:first-child) {
  border-top-left-radius: 8px;
}

.role-datatable :deep(.p-datatable-thead > tr > th:last-child) {
  border-top-right-radius: 8px;
}

.role-datatable :deep(.p-datatable-thead > tr > th .flex) {
  @apply justify-start items-center;
  font-weight: 600;
}

.role-datatable :deep(.p-datatable-thead > tr > th .pi) {
  @apply mr-2;
  font-size: 0.875rem;
}

.role-datatable :deep(.p-datatable-tbody > tr > td) {
  @apply px-4 py-4 border-b border-gray-100;
}

.role-datatable :deep(.p-datatable-tbody > tr:hover) {
  @apply bg-gray-50;
}

.role-datatable :deep(.p-datatable-tbody > tr.p-highlight) {
  @apply bg-blue-50 border-blue-200;
}

.stats-card {
  @apply transition-all duration-200 hover:shadow-md;
}

.stats-card :deep(.p-card-body) {
  @apply p-4;
}

.role-icon {
  @apply shadow-sm border border-white/20;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .role-management-panel {
    @apply space-y-4;
  }

  .panel-header {
    @apply p-4;
  }

  .panel-header .flex {
    @apply flex-col gap-4 items-start;
  }

  .filters-section {
    @apply p-3;
  }

  .filters-section .grid {
    @apply grid-cols-1 gap-3;
  }

  .role-datatable :deep(.p-datatable-header) {
    @apply px-4 py-3;
  }

  .role-datatable :deep(.p-datatable-thead > tr > th),
  .role-datatable :deep(.p-datatable-tbody > tr > td) {
    @apply px-3 py-3;
  }
}

/* Loading animation */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.role-datatable :deep(.p-datatable-loading-overlay) {
  @apply bg-white/80 backdrop-blur-sm;
}
</style>
