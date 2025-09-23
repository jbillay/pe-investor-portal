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
          <Dropdown
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
          <Dropdown
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
      v-model:selection="selectedRoles"
      :value="filteredRoles"
      selectionMode="multiple"
      :paginator="true"
      :rows="15"
      :loading="loading"
      responsiveLayout="scroll"
      :metaKeySelection="false"
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
          <div class="flex gap-2">
            <Button
              v-if="selectedRoles.length > 0"
              :label="`Bulk Actions (${selectedRoles.length})`"
              icon="pi pi-cog"
              class="p-button-sm p-button-outlined"
              @click="showBulkActionsMenu = !showBulkActionsMenu"
            />
          </div>
        </div>
      </template>

      <Column selectionMode="multiple" headerStyle="width: 3rem" />

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
              icon="pi pi-users"
              class="p-button-sm p-button-text p-button-rounded"
              @click="manageRoleUsers(data)"
              v-tooltip.top="'Manage Users'"
            />
            <Button
              icon="pi pi-shield"
              class="p-button-sm p-button-text p-button-rounded"
              @click="$emit('assign-permissions', data)"
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
            @click="openCreateRoleDialog"
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

    <!-- Bulk Actions Menu Overlay -->
    <OverlayPanel ref="bulkActionsMenu" v-model:visible="showBulkActionsMenu">
      <div class="flex flex-col gap-2 min-w-48">
        <Button
          label="Activate Selected"
          icon="pi pi-check"
          class="p-button-text p-button-sm justify-start"
          @click="bulkActivateRoles"
        />
        <Button
          label="Deactivate Selected"
          icon="pi pi-times"
          class="p-button-text p-button-sm justify-start"
          @click="bulkDeactivateRoles"
        />
        <Divider />
        <Button
          label="Export Selected"
          icon="pi pi-download"
          class="p-button-text p-button-sm justify-start"
          @click="exportSelectedRoles"
        />
        <Button
          label="Duplicate Selected"
          icon="pi pi-copy"
          class="p-button-text p-button-sm justify-start"
          @click="duplicateSelectedRoles"
        />
      </div>
    </OverlayPanel>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';

// Props
defineProps<{
  loading?: boolean;
}>();

// Emits
const emit = defineEmits<{
  'edit-role': [role: any];
  'create-role': [];
  'assign-permissions': [role: any];
}>();

// Composables
const toast = useToast();
const confirm = useConfirm();

// State
const selectedRoles = ref([]);
const showBulkActionsMenu = ref(false);
const showImportDialog = ref(false);
const loading = ref(false);

// Filters
const filters = ref({
  search: '',
  status: null,
  type: null,
});

// Mock data - replace with actual API calls
const roles = ref([
  {
    id: '1',
    name: 'SUPER_ADMIN',
    description: 'System administrators with full access to all features',
    status: 'ACTIVE',
    isDefault: false,
    isSystemRole: true,
    userCount: 2,
    permissionCount: 48,
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'FUND_MANAGER',
    description: 'Fund management team with operational access',
    status: 'ACTIVE',
    isDefault: false,
    isSystemRole: true,
    userCount: 8,
    permissionCount: 35,
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '3',
    name: 'COMPLIANCE_OFFICER',
    description: 'Compliance and regulatory oversight',
    status: 'ACTIVE',
    isDefault: false,
    isSystemRole: true,
    userCount: 3,
    permissionCount: 28,
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '4',
    name: 'ANALYST',
    description: 'Read-only access for analysis and reporting',
    status: 'ACTIVE',
    isDefault: false,
    isSystemRole: true,
    userCount: 12,
    permissionCount: 18,
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '5',
    name: 'INVESTOR',
    description: 'Limited partners with access to their investments',
    status: 'ACTIVE',
    isDefault: true,
    isSystemRole: true,
    userCount: 145,
    permissionCount: 12,
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '6',
    name: 'VIEWER',
    description: 'Minimum access for basic information',
    status: 'ACTIVE',
    isDefault: false,
    isSystemRole: true,
    userCount: 8,
    permissionCount: 6,
    createdAt: new Date('2024-01-15'),
  },
]);

// Filter options
const statusOptions = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
  { label: 'Deprecated', value: 'DEPRECATED' },
];

const roleTypeOptions = [
  { label: 'System Role', value: 'SYSTEM' },
  { label: 'Custom Role', value: 'CUSTOM' },
];

// Computed properties
const filteredRoles = computed(() => {
  let filtered = roles.value;

  if (filters.value.search) {
    const search = filters.value.search.toLowerCase();
    filtered = filtered.filter(role =>
      role.name.toLowerCase().includes(search) ||
      role.description?.toLowerCase().includes(search)
    );
  }

  if (filters.value.status) {
    filtered = filtered.filter(role => role.status === filters.value.status);
  }

  if (filters.value.type) {
    const isSystemRole = filters.value.type === 'SYSTEM';
    filtered = filtered.filter(role => role.isSystemRole === isSystemRole);
  }

  return filtered;
});

const totalRoles = computed(() => roles.value.length);
const activeRoles = computed(() => roles.value.filter(r => r.status === 'ACTIVE').length);
const customRoles = computed(() => roles.value.filter(r => !r.isSystemRole).length);
const averagePermissions = computed(() => {
  const total = roles.value.reduce((sum, role) => sum + (role.permissionCount || 0), 0);
  return Math.round(total / roles.value.length) || 0;
});

// Methods
const clearFilters = () => {
  filters.value = {
    search: '',
    status: null,
    type: null,
  };
};

const getRowClass = (data: any) => {
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

const openCreateRoleDialog = () => {
  emit('create-role');
};

const viewRole = (role: any) => {
  // Implement role details view
  console.log('View role:', role);
};

const editRole = (role: any) => {
  emit('edit-role', role);
};

const manageRoleUsers = (role: any) => {
  // Implement user management for role
  console.log('Manage users for role:', role);
};

const confirmDeleteRole = (role: any) => {
  confirm.require({
    message: `Are you sure you want to delete the role "${role.name}"? This action cannot be undone.`,
    header: 'Delete Role',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: () => {
      deleteRole(role);
    }
  });
};

const deleteRole = async (role: any) => {
  try {
    // API call to delete role
    const index = roles.value.findIndex(r => r.id === role.id);
    if (index !== -1) {
      roles.value.splice(index, 1);
    }

    toast.add({
      severity: 'success',
      summary: 'Role Deleted',
      detail: `Role "${role.name}" has been successfully deleted.`,
      life: 4000
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Delete Failed',
      detail: 'Failed to delete the role. Please try again.',
      life: 4000
    });
  }
};

const exportRoles = () => {
  // Implement export functionality
  toast.add({
    severity: 'info',
    summary: 'Export Started',
    detail: 'Role export will be downloaded shortly.',
    life: 3000
  });
};

const bulkActivateRoles = async () => {
  try {
    selectedRoles.value.forEach((role: any) => {
      role.status = 'ACTIVE';
    });

    toast.add({
      severity: 'success',
      summary: 'Roles Activated',
      detail: `${selectedRoles.value.length} roles have been activated.`,
      life: 4000
    });

    selectedRoles.value = [];
    showBulkActionsMenu.value = false;
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Activation Failed',
      detail: 'Failed to activate roles. Please try again.',
      life: 4000
    });
  }
};

const bulkDeactivateRoles = async () => {
  try {
    selectedRoles.value.forEach((role: any) => {
      role.status = 'INACTIVE';
    });

    toast.add({
      severity: 'success',
      summary: 'Roles Deactivated',
      detail: `${selectedRoles.value.length} roles have been deactivated.`,
      life: 4000
    });

    selectedRoles.value = [];
    showBulkActionsMenu.value = false;
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Deactivation Failed',
      detail: 'Failed to deactivate roles. Please try again.',
      life: 4000
    });
  }
};

const exportSelectedRoles = () => {
  toast.add({
    severity: 'info',
    summary: 'Export Started',
    detail: `Exporting ${selectedRoles.value.length} selected roles.`,
    life: 3000
  });
  selectedRoles.value = [];
  showBulkActionsMenu.value = false;
};

const duplicateSelectedRoles = () => {
  toast.add({
    severity: 'info',
    summary: 'Duplication Started',
    detail: `Creating copies of ${selectedRoles.value.length} selected roles.`,
    life: 3000
  });
  selectedRoles.value = [];
  showBulkActionsMenu.value = false;
};

// Lifecycle
onMounted(() => {
  // Load roles data
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