<template>
  <Dialog
    v-model:visible="dialogVisible"
    :modal="true"
    :draggable="false"
    :closable="true"
    :style="{ width: '95vw', maxWidth: '1200px' }"
    class="permission-management-dialog"
    @show="onDialogShow"
    @hide="onDialogHide"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
          <i class="pi pi-shield text-white text-lg"></i>
        </div>
        <div>
          <h3 class="text-xl font-semibold text-gray-900 m-0">Permission Management</h3>
          <p class="text-sm text-gray-600 m-0 mt-1">
            Configure permissions for {{ role?.name || 'Role' }}
          </p>
        </div>
      </div>
    </template>

    <div class="permission-management-content">
      <!-- Role Information -->
      <div v-if="role" class="role-info-section mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div class="flex items-center gap-4">
          <div
            class="role-icon w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-lg"
            :style="{ backgroundColor: getRoleColor(role.name) }"
          >
            {{ getRoleInitials(role.name) }}
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <h4 class="text-xl font-semibold text-gray-900">{{ role.name }}</h4>
              <Tag
                v-if="role.isDefault"
                value="DEFAULT ROLE"
                severity="info"
                class="text-xs"
              />
              <Tag
                v-if="role.isSystemRole"
                value="SYSTEM ROLE"
                severity="warning"
                class="text-xs"
              />
            </div>
            <p class="text-sm text-gray-600 mb-2">{{ role.description || 'No description available' }}</p>
            <div class="flex items-center gap-4 text-sm text-gray-500">
              <span>{{ role.userCount || 0 }} users assigned</span>
              <span>{{ role.permissionCount || 0 }} permissions currently assigned</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Permission Search and Filters -->
      <div class="search-filters-section mb-6 p-4 bg-gray-50 rounded-lg border">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Search Permissions</label>
            <div class="p-inputgroup">
              <span class="p-inputgroup-addon">
                <i class="pi pi-search"></i>
              </span>
              <InputText
                v-model="searchTerm"
                placeholder="Search by permission name or description..."
                class="flex-1"
              />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Resource Filter</label>
            <Dropdown
              v-model="selectedResource"
              :options="resourceOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="All Resources"
              class="w-full"
              showClear
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Status Filter</label>
            <Dropdown
              v-model="statusFilter"
              :options="statusFilterOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="All Permissions"
              class="w-full"
              showClear
            />
          </div>
        </div>
      </div>

      <!-- Permission Selection Mode Toggle -->
      <div class="selection-mode-section mb-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <h4 class="text-lg font-medium text-gray-900">Permission Assignment</h4>
            <div class="flex items-center gap-2">
              <Button
                :label="`Select All (${filteredPermissions.length})`"
                icon="pi pi-check"
                class="p-button-sm p-button-outlined"
                @click="selectAllPermissions"
              />
              <Button
                label="Clear Selection"
                icon="pi pi-times"
                class="p-button-sm p-button-outlined"
                @click="clearAllPermissions"
              />
            </div>
          </div>
          <div class="flex items-center gap-2 text-sm text-gray-600">
            <span>{{ selectedPermissions.length }} of {{ filteredPermissions.length }} selected</span>
          </div>
        </div>
      </div>

      <!-- Permissions Grid by Resource -->
      <div class="permissions-grid-section">
        <div class="permissions-container max-h-96 overflow-y-auto custom-scrollbar">
          <div
            v-for="resource in groupedPermissions"
            :key="resource.name"
            class="resource-group mb-6 last:mb-0"
          >
            <!-- Resource Header -->
            <div class="resource-header flex items-center justify-between p-3 bg-white border border-gray-200 rounded-t-lg">
              <div class="flex items-center gap-3">
                <i :class="getResourceIcon(resource.name)" class="text-lg" :style="{ color: getResourceColor(resource.name) }"></i>
                <div>
                  <h5 class="font-semibold text-gray-900">{{ resource.name }}</h5>
                  <p class="text-sm text-gray-600">{{ resource.description }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-sm text-gray-500">{{ resource.permissions.length }} permissions</span>
                <Button
                  :label="isResourceFullySelected(resource) ? 'Deselect All' : 'Select All'"
                  :icon="isResourceFullySelected(resource) ? 'pi pi-minus' : 'pi pi-plus'"
                  class="p-button-sm p-button-text"
                  @click="toggleResourceSelection(resource)"
                />
              </div>
            </div>

            <!-- Permissions List -->
            <div class="permissions-list border border-t-0 border-gray-200 rounded-b-lg bg-white">
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
                <div
                  v-for="permission in resource.permissions"
                  :key="permission.id"
                  class="permission-item p-4 border-r border-b border-gray-100 last:border-r-0"
                  :class="{
                    'bg-green-50 border-green-200': selectedPermissions.includes(permission.id),
                    'hover:bg-gray-50': !selectedPermissions.includes(permission.id)
                  }"
                >
                  <div class="flex items-start gap-3">
                    <Checkbox
                      v-model="selectedPermissions"
                      :inputId="`permission-${permission.id}`"
                      :value="permission.id"
                      class="mt-1"
                    />
                    <div class="flex-1 min-w-0">
                      <label
                        :for="`permission-${permission.id}`"
                        class="block font-medium text-gray-900 cursor-pointer"
                      >
                        {{ permission.action }}
                      </label>
                      <p class="text-sm text-gray-600 mt-1">{{ permission.description }}</p>
                      <div class="flex items-center gap-2 mt-2">
                        <Tag
                          :value="permission.criticality"
                          :severity="getCriticalitySeverity(permission.criticality)"
                          class="text-xs"
                        />
                        <span v-if="permission.requiresApproval" class="text-xs text-orange-600 font-medium">
                          Requires Approval
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="resource.permissions.length === 0" class="p-8 text-center text-gray-500">
                <i class="pi pi-info-circle text-2xl mb-2"></i>
                <p>No permissions found for this resource</p>
              </div>
            </div>
          </div>
        </div>

        <div v-if="groupedPermissions.length === 0" class="text-center py-12 text-gray-500">
          <i class="pi pi-shield text-4xl mb-4"></i>
          <p class="text-lg mb-2">No permissions found</p>
          <p class="text-sm">Try adjusting your search criteria</p>
        </div>
      </div>

      <!-- Permission Summary -->
      <div v-if="selectedPermissions.length > 0" class="permission-summary-section mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
        <h4 class="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
          <i class="pi pi-check-circle text-green-600"></i>
          Permission Summary
        </h4>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="summary-card">
            <div class="text-2xl font-bold text-green-600">{{ selectedPermissions.length }}</div>
            <div class="text-sm text-gray-600">Total Selected</div>
          </div>
          <div class="summary-card">
            <div class="text-2xl font-bold text-blue-600">{{ criticalPermissionsCount }}</div>
            <div class="text-sm text-gray-600">Critical Permissions</div>
          </div>
          <div class="summary-card">
            <div class="text-2xl font-bold text-orange-600">{{ approvalRequiredCount }}</div>
            <div class="text-sm text-gray-600">Require Approval</div>
          </div>
        </div>
      </div>

      <!-- Change Reason -->
      <div class="change-reason-section mt-6">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Reason for Changes <span class="text-red-500">*</span>
        </label>
        <Textarea
          v-model="changeReason"
          placeholder="Provide a detailed reason for these permission changes (required for audit trail)..."
          :rows="3"
          class="w-full"
          :class="{ 'p-invalid': !changeReason && showValidationErrors }"
        />
        <small v-if="!changeReason && showValidationErrors" class="p-error">
          Change reason is required for audit purposes
        </small>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between">
        <div class="text-sm text-gray-500">
          <i class="pi pi-info-circle mr-1"></i>
          Changes will be applied immediately and cannot be undone
        </div>
        <div class="flex gap-3">
          <Button
            label="Cancel"
            icon="pi pi-times"
            class="p-button-outlined"
            @click="closeDialog"
            :disabled="isSaving"
          />
          <Button
            label="Save Permissions"
            icon="pi pi-save"
            class="p-button-primary"
            @click="savePermissions"
            :loading="isSaving"
            :disabled="!canSavePermissions"
          />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';

// Props
const props = defineProps<{
  visible: boolean;
  role: any;
}>();

// Emits
const emit = defineEmits<{
  'update:visible': [visible: boolean];
  'permissions-updated': [result: any];
}>();

// Composables
const toast = useToast();

// State
const dialogVisible = ref(props.visible);
const selectedPermissions = ref<string[]>([]);
const searchTerm = ref('');
const selectedResource = ref(null);
const statusFilter = ref(null);
const changeReason = ref('');
const isSaving = ref(false);
const showValidationErrors = ref(false);

// Mock permissions data
const allPermissions = ref([
  // User Management
  { id: '1', resource: 'USER', action: 'CREATE', description: 'Create new users', criticality: 'HIGH', requiresApproval: true },
  { id: '2', resource: 'USER', action: 'READ', description: 'View user information', criticality: 'LOW', requiresApproval: false },
  { id: '3', resource: 'USER', action: 'UPDATE', description: 'Update user details', criticality: 'MEDIUM', requiresApproval: false },
  { id: '4', resource: 'USER', action: 'DELETE', description: 'Delete or deactivate users', criticality: 'HIGH', requiresApproval: true },
  { id: '5', resource: 'USER', action: 'MANAGE_ROLES', description: 'Assign/revoke user roles', criticality: 'HIGH', requiresApproval: true },

  // Fund Management
  { id: '6', resource: 'FUND', action: 'CREATE', description: 'Create new funds', criticality: 'HIGH', requiresApproval: true },
  { id: '7', resource: 'FUND', action: 'READ', description: 'View fund information', criticality: 'LOW', requiresApproval: false },
  { id: '8', resource: 'FUND', action: 'UPDATE', description: 'Update fund details', criticality: 'MEDIUM', requiresApproval: false },
  { id: '9', resource: 'FUND', action: 'DELETE', description: 'Delete funds', criticality: 'HIGH', requiresApproval: true },
  { id: '10', resource: 'FUND', action: 'MANAGE_PERFORMANCE', description: 'Update performance metrics', criticality: 'MEDIUM', requiresApproval: false },

  // Investment Management
  { id: '11', resource: 'INVESTMENT', action: 'CREATE', description: 'Create new investments', criticality: 'HIGH', requiresApproval: true },
  { id: '12', resource: 'INVESTMENT', action: 'READ', description: 'View all investments', criticality: 'MEDIUM', requiresApproval: false },
  { id: '13', resource: 'INVESTMENT', action: 'UPDATE', description: 'Update investment details', criticality: 'MEDIUM', requiresApproval: false },
  { id: '14', resource: 'INVESTMENT', action: 'DELETE', description: 'Delete investments', criticality: 'HIGH', requiresApproval: true },
  { id: '15', resource: 'INVESTMENT', action: 'READ_OWN', description: 'View own investments only', criticality: 'LOW', requiresApproval: false },

  // Capital Activity
  { id: '16', resource: 'CAPITAL_CALL', action: 'CREATE', description: 'Create capital calls', criticality: 'HIGH', requiresApproval: true },
  { id: '17', resource: 'CAPITAL_CALL', action: 'READ', description: 'View capital calls', criticality: 'LOW', requiresApproval: false },
  { id: '18', resource: 'CAPITAL_CALL', action: 'UPDATE', description: 'Update capital calls', criticality: 'MEDIUM', requiresApproval: false },
  { id: '19', resource: 'CAPITAL_CALL', action: 'PROCESS', description: 'Process capital call payments', criticality: 'HIGH', requiresApproval: true },

  { id: '20', resource: 'DISTRIBUTION', action: 'CREATE', description: 'Create distributions', criticality: 'HIGH', requiresApproval: true },
  { id: '21', resource: 'DISTRIBUTION', action: 'READ', description: 'View distributions', criticality: 'LOW', requiresApproval: false },
  { id: '22', resource: 'DISTRIBUTION', action: 'UPDATE', description: 'Update distributions', criticality: 'MEDIUM', requiresApproval: false },
  { id: '23', resource: 'DISTRIBUTION', action: 'PROCESS', description: 'Process distribution payments', criticality: 'HIGH', requiresApproval: true },

  // Document Management
  { id: '24', resource: 'DOCUMENT', action: 'CREATE', description: 'Upload documents', criticality: 'MEDIUM', requiresApproval: false },
  { id: '25', resource: 'DOCUMENT', action: 'READ', description: 'View documents', criticality: 'LOW', requiresApproval: false },
  { id: '26', resource: 'DOCUMENT', action: 'UPDATE', description: 'Update document metadata', criticality: 'MEDIUM', requiresApproval: false },
  { id: '27', resource: 'DOCUMENT', action: 'DELETE', description: 'Delete documents', criticality: 'HIGH', requiresApproval: true },
  { id: '28', resource: 'DOCUMENT', action: 'READ_CONFIDENTIAL', description: 'Access confidential documents', criticality: 'HIGH', requiresApproval: true },

  // Reporting
  { id: '29', resource: 'REPORT', action: 'GENERATE', description: 'Generate reports', criticality: 'MEDIUM', requiresApproval: false },
  { id: '30', resource: 'REPORT', action: 'VIEW_PERFORMANCE', description: 'View performance reports', criticality: 'LOW', requiresApproval: false },
  { id: '31', resource: 'REPORT', action: 'VIEW_COMPLIANCE', description: 'View compliance reports', criticality: 'MEDIUM', requiresApproval: false },
  { id: '32', resource: 'REPORT', action: 'EXPORT', description: 'Export data and reports', criticality: 'MEDIUM', requiresApproval: false },

  // System & Audit
  { id: '33', resource: 'SYSTEM', action: 'CONFIGURE', description: 'Configure system settings', criticality: 'HIGH', requiresApproval: true },
  { id: '34', resource: 'SYSTEM', action: 'MONITOR', description: 'Monitor system health', criticality: 'MEDIUM', requiresApproval: false },
  { id: '35', resource: 'AUDIT', action: 'READ', description: 'View audit logs', criticality: 'MEDIUM', requiresApproval: false },
  { id: '36', resource: 'AUDIT', action: 'EXPORT', description: 'Export audit data', criticality: 'HIGH', requiresApproval: true },
]);

// Resource definitions
const resourceDefinitions = {
  'USER': { description: 'User account management and administration', icon: 'pi pi-users', color: '#3b82f6' },
  'FUND': { description: 'Fund creation, management, and operations', icon: 'pi pi-briefcase', color: '#10b981' },
  'INVESTMENT': { description: 'Investment tracking and portfolio management', icon: 'pi pi-chart-line', color: '#8b5cf6' },
  'CAPITAL_CALL': { description: 'Capital call creation and processing', icon: 'pi pi-money-bill', color: '#f59e0b' },
  'DISTRIBUTION': { description: 'Distribution creation and processing', icon: 'pi pi-send', color: '#ef4444' },
  'DOCUMENT': { description: 'Document storage, access, and management', icon: 'pi pi-file', color: '#06b6d4' },
  'REPORT': { description: 'Reporting and analytics capabilities', icon: 'pi pi-chart-bar', color: '#84cc16' },
  'SYSTEM': { description: 'System configuration and administration', icon: 'pi pi-cog', color: '#6b7280' },
  'AUDIT': { description: 'Audit trail access and management', icon: 'pi pi-history', color: '#ec4899' },
};

// Filter options
const resourceOptions = computed(() => {
  const resources = [...new Set(allPermissions.value.map(p => p.resource))];
  return resources.map(resource => ({
    label: resource,
    value: resource
  }));
});

const statusFilterOptions = [
  { label: 'Assigned Permissions', value: 'assigned' },
  { label: 'Available Permissions', value: 'available' },
  { label: 'Critical Permissions', value: 'critical' },
  { label: 'Requires Approval', value: 'approval' },
];

// Computed properties
const filteredPermissions = computed(() => {
  let filtered = allPermissions.value;

  if (searchTerm.value) {
    const search = searchTerm.value.toLowerCase();
    filtered = filtered.filter(permission =>
      permission.action.toLowerCase().includes(search) ||
      permission.description.toLowerCase().includes(search) ||
      permission.resource.toLowerCase().includes(search)
    );
  }

  if (selectedResource.value) {
    filtered = filtered.filter(permission => permission.resource === selectedResource.value);
  }

  if (statusFilter.value) {
    switch (statusFilter.value) {
      case 'assigned':
        filtered = filtered.filter(permission => selectedPermissions.value.includes(permission.id));
        break;
      case 'available':
        filtered = filtered.filter(permission => !selectedPermissions.value.includes(permission.id));
        break;
      case 'critical':
        filtered = filtered.filter(permission => permission.criticality === 'HIGH');
        break;
      case 'approval':
        filtered = filtered.filter(permission => permission.requiresApproval);
        break;
    }
  }

  return filtered;
});

const groupedPermissions = computed(() => {
  const groups: Record<string, any> = {};

  filteredPermissions.value.forEach(permission => {
    if (!groups[permission.resource]) {
      groups[permission.resource] = {
        name: permission.resource,
        description: resourceDefinitions[permission.resource]?.description || 'Resource permissions',
        permissions: []
      };
    }
    groups[permission.resource].permissions.push(permission);
  });

  return Object.values(groups);
});

const criticalPermissionsCount = computed(() => {
  return selectedPermissions.value.filter(id => {
    const permission = allPermissions.value.find(p => p.id === id);
    return permission?.criticality === 'HIGH';
  }).length;
});

const approvalRequiredCount = computed(() => {
  return selectedPermissions.value.filter(id => {
    const permission = allPermissions.value.find(p => p.id === id);
    return permission?.requiresApproval;
  }).length;
});

const canSavePermissions = computed(() => {
  return changeReason.value.trim().length > 0 && !isSaving.value;
});

// Watchers
watch(() => props.visible, (newValue) => {
  dialogVisible.value = newValue;
});

watch(dialogVisible, (newValue) => {
  emit('update:visible', newValue);
});

watch(() => props.role, (newRole) => {
  if (newRole) {
    loadRolePermissions();
  }
});

// Methods
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

const getResourceIcon = (resource: string) => {
  return resourceDefinitions[resource]?.icon || 'pi pi-question';
};

const getResourceColor = (resource: string) => {
  return resourceDefinitions[resource]?.color || '#6b7280';
};

const getCriticalitySeverity = (criticality: string) => {
  switch (criticality) {
    case 'HIGH': return 'danger';
    case 'MEDIUM': return 'warning';
    case 'LOW': return 'success';
    default: return 'info';
  }
};

const isResourceFullySelected = (resource: any) => {
  return resource.permissions.every((permission: any) => selectedPermissions.value.includes(permission.id));
};

const toggleResourceSelection = (resource: any) => {
  const isFullySelected = isResourceFullySelected(resource);

  if (isFullySelected) {
    // Deselect all permissions for this resource
    resource.permissions.forEach((permission: any) => {
      const index = selectedPermissions.value.indexOf(permission.id);
      if (index > -1) {
        selectedPermissions.value.splice(index, 1);
      }
    });
  } else {
    // Select all permissions for this resource
    resource.permissions.forEach((permission: any) => {
      if (!selectedPermissions.value.includes(permission.id)) {
        selectedPermissions.value.push(permission.id);
      }
    });
  }
};

const selectAllPermissions = () => {
  selectedPermissions.value = filteredPermissions.value.map(p => p.id);
};

const clearAllPermissions = () => {
  selectedPermissions.value = [];
};

const loadRolePermissions = () => {
  // Mock loading existing permissions for the role
  if (props.role) {
    const mockAssignedPermissions = {
      'SUPER_ADMIN': ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '33', '34', '35', '36'],
      'FUND_MANAGER': ['2', '6', '7', '8', '10', '11', '12', '13', '16', '17', '18', '24', '25', '29', '30'],
      'COMPLIANCE_OFFICER': ['2', '7', '12', '17', '21', '25', '31', '35'],
      'ANALYST': ['2', '7', '12', '17', '21', '25', '30'],
      'INVESTOR': ['15', '17', '21', '25'],
      'VIEWER': ['2', '7', '25'],
    };

    selectedPermissions.value = mockAssignedPermissions[props.role.name] || [];
  }
};

const onDialogShow = () => {
  resetForm();
  loadRolePermissions();
};

const onDialogHide = () => {
  resetForm();
};

const resetForm = () => {
  selectedPermissions.value = [];
  searchTerm.value = '';
  selectedResource.value = null;
  statusFilter.value = null;
  changeReason.value = '';
  isSaving.value = false;
  showValidationErrors.value = false;
};

const closeDialog = () => {
  dialogVisible.value = false;
};

const savePermissions = async () => {
  showValidationErrors.value = true;

  if (!canSavePermissions.value) {
    toast.add({
      severity: 'warn',
      summary: 'Validation Error',
      detail: 'Please provide a reason for the permission changes.',
      life: 4000
    });
    return;
  }

  isSaving.value = true;

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    const result = {
      roleId: props.role?.id,
      roleName: props.role?.name,
      permissionsAssigned: selectedPermissions.value.length,
      permissionIds: selectedPermissions.value,
      reason: changeReason.value,
      updatedAt: new Date(),
    };

    emit('permissions-updated', result);

    toast.add({
      severity: 'success',
      summary: 'Permissions Updated',
      detail: `Successfully updated permissions for ${props.role?.name}`,
      life: 5000
    });

    closeDialog();
  } catch (error) {
    console.error('Permission update error:', error);
    toast.add({
      severity: 'error',
      summary: 'Update Failed',
      detail: 'Failed to update permissions. Please try again or contact support.',
      life: 5000
    });
  } finally {
    isSaving.value = false;
  }
};

// Lifecycle
onMounted(() => {
  if (props.role) {
    loadRolePermissions();
  }
});
</script>

<style scoped>
.permission-management-dialog :deep(.p-dialog-header) {
  @apply border-b border-gray-200 bg-white;
}

.permission-management-dialog :deep(.p-dialog-content) {
  @apply bg-gray-50;
}

.permission-management-dialog :deep(.p-dialog-footer) {
  @apply border-t border-gray-200 bg-white;
}

.permission-management-content {
  @apply space-y-6;
}

.role-icon {
  @apply shadow-md border-2 border-white;
}

.permissions-container {
  @apply custom-scrollbar;
}

.resource-group {
  @apply shadow-sm;
}

.resource-header {
  @apply shadow-sm;
}

.permission-item {
  @apply transition-all duration-200 cursor-pointer;
}

.permission-item:hover {
  @apply bg-gray-50;
}

.permission-item.bg-green-50 {
  @apply shadow-sm;
}

.summary-card {
  @apply text-center;
}

.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f1f5f9;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  @apply bg-gray-100 rounded-full;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  @apply bg-gray-300 rounded-full hover:bg-gray-400;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .permission-management-dialog {
    @apply m-4;
  }

  .permission-management-dialog :deep(.p-dialog) {
    @apply w-full h-full max-h-none;
  }

  .search-filters-section .grid {
    @apply grid-cols-1 gap-3;
  }

  .permissions-list .grid {
    @apply grid-cols-1;
  }

  .permission-summary-section .grid {
    @apply grid-cols-3;
  }
}

/* Animation for permission selection */
.permission-item.bg-green-50 {
  animation: selectFade 0.3s ease-in-out;
}

@keyframes selectFade {
  0% { background-color: rgb(34 197 94 / 0.1); }
  50% { background-color: rgb(34 197 94 / 0.2); }
  100% { background-color: rgb(34 197 94 / 0.1); }
}
</style>