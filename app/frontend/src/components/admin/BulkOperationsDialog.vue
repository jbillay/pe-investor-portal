<template>
  <Dialog
    v-model:visible="dialogVisible"
    :modal="true"
    :draggable="false"
    :closable="true"
    :style="{ width: '90vw', maxWidth: '900px' }"
    class="bulk-operations-dialog"
    @show="onDialogShow"
    @hide="onDialogHide"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
          <i class="pi pi-users text-white text-lg"></i>
        </div>
        <div>
          <h3 class="text-xl font-semibold text-gray-900 m-0">Bulk Operations</h3>
          <p class="text-sm text-gray-600 m-0 mt-1">
            Manage {{ selectedUsers.length }} selected user{{ selectedUsers.length !== 1 ? 's' : '' }}
          </p>
        </div>
      </div>
    </template>

    <div class="bulk-operations-content">
      <!-- Selected Users Summary -->
      <div class="selected-users-section mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 class="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
          <i class="pi pi-check-circle text-blue-600"></i>
          Selected Users ({{ selectedUsers.length }})
        </h4>

        <div class="users-preview max-h-40 overflow-y-auto custom-scrollbar">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div
              v-for="user in selectedUsers"
              :key="user.id"
              class="user-item flex items-center gap-3 p-3 bg-white rounded-lg border"
            >
              <Avatar
                :image="user.profileImage"
                :label="user.name ? user.name.charAt(0).toUpperCase() : 'U'"
                size="normal"
                shape="circle"
              />
              <div class="flex-1 min-w-0">
                <div class="font-medium text-gray-900 truncate">{{ user.name || 'Unknown User' }}</div>
                <div class="text-sm text-gray-600 truncate">{{ user.email }}</div>
                <div class="flex gap-1 mt-1">
                  <Tag
                    v-for="role in user.roles || []"
                    :key="role"
                    :value="role"
                    :severity="getRoleSeverity(role)"
                    class="text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Operation Selection -->
      <div class="operation-selection-section mb-6">
        <h4 class="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <i class="pi pi-cog text-purple-600"></i>
          Select Operation
        </h4>

        <div class="operations-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="operation in availableOperations"
            :key="operation.id"
            class="operation-card p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md"
            :class="{
              'border-purple-500 bg-purple-50 shadow-md': selectedOperation?.id === operation.id,
              'border-gray-200 bg-white hover:border-gray-300': selectedOperation?.id !== operation.id,
              'opacity-50 cursor-not-allowed': operation.disabled
            }"
            @click="selectOperation(operation)"
          >
            <div class="flex items-start gap-3">
              <div
                class="operation-icon w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0"
                :style="{ backgroundColor: operation.color }"
              >
                <i :class="operation.icon" class="text-lg"></i>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <h5 class="font-semibold text-gray-900 text-sm">{{ operation.name }}</h5>
                  <i
                    v-if="selectedOperation?.id === operation.id"
                    class="pi pi-check-circle text-purple-600 text-lg"
                  />
                </div>
                <p class="text-xs text-gray-600 mb-2">{{ operation.description }}</p>
                <div class="flex items-center justify-between text-xs">
                  <span class="text-gray-500">{{ operation.category }}</span>
                  <Tag
                    v-if="operation.risk"
                    :value="operation.risk"
                    :severity="getRiskSeverity(operation.risk)"
                    class="text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Operation Configuration -->
      <div v-if="selectedOperation" class="operation-config-section mb-6">
        <h4 class="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <i class="pi pi-sliders-h text-indigo-600"></i>
          Configuration for {{ selectedOperation.name }}
        </h4>

        <!-- Role Assignment Configuration -->
        <div v-if="selectedOperation.id === 'assign-role'" class="config-content">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Select Role <span class="text-red-500">*</span>
              </label>
              <Dropdown
                v-model="bulkConfig.roleId"
                :options="availableRoles"
                optionLabel="name"
                optionValue="id"
                placeholder="Select a role to assign"
                class="w-full"
                :class="{ 'p-invalid': !bulkConfig.roleId && showValidationErrors }"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Assignment Duration</label>
              <Dropdown
                v-model="bulkConfig.duration"
                :options="durationOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Select duration"
                class="w-full"
              />
            </div>
            <div class="col-span-full">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Reason <span class="text-red-500">*</span>
              </label>
              <Textarea
                v-model="bulkConfig.reason"
                placeholder="Provide a reason for this bulk assignment..."
                :rows="3"
                class="w-full"
                :class="{ 'p-invalid': !bulkConfig.reason && showValidationErrors }"
              />
            </div>
          </div>
        </div>

        <!-- Status Update Configuration -->
        <div v-else-if="selectedOperation.id === 'update-status'" class="config-content">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                New Status <span class="text-red-500">*</span>
              </label>
              <Dropdown
                v-model="bulkConfig.status"
                :options="statusOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Select new status"
                class="w-full"
                :class="{ 'p-invalid': !bulkConfig.status && showValidationErrors }"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Reason <span class="text-red-500">*</span>
              </label>
              <InputText
                v-model="bulkConfig.reason"
                placeholder="Reason for status change"
                class="w-full"
                :class="{ 'p-invalid': !bulkConfig.reason && showValidationErrors }"
              />
            </div>
          </div>
        </div>

        <!-- Remove Roles Configuration -->
        <div v-else-if="selectedOperation.id === 'remove-roles'" class="config-content">
          <div class="grid grid-cols-1 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Roles to Remove <span class="text-red-500">*</span>
              </label>
              <MultiSelect
                v-model="bulkConfig.rolesToRemove"
                :options="availableRoles"
                optionLabel="name"
                optionValue="id"
                placeholder="Select roles to remove"
                class="w-full"
                :class="{ 'p-invalid': (!bulkConfig.rolesToRemove || bulkConfig.rolesToRemove.length === 0) && showValidationErrors }"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Reason <span class="text-red-500">*</span>
              </label>
              <Textarea
                v-model="bulkConfig.reason"
                placeholder="Provide a reason for removing these roles..."
                :rows="3"
                class="w-full"
                :class="{ 'p-invalid': !bulkConfig.reason && showValidationErrors }"
              />
            </div>
          </div>
        </div>

        <!-- Export Configuration -->
        <div v-else-if="selectedOperation.id === 'export-data'" class="config-content">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
              <Dropdown
                v-model="bulkConfig.exportFormat"
                :options="exportFormatOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Select format"
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Include Fields</label>
              <MultiSelect
                v-model="bulkConfig.includeFields"
                :options="exportFieldOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Select fields to include"
                class="w-full"
              />
            </div>
          </div>
        </div>

        <!-- Notification Options -->
        <div class="notification-options mt-4 pt-4 border-t border-gray-200">
          <label class="block text-sm font-medium text-gray-700 mb-3">Notification Options</label>
          <div class="flex flex-col gap-2">
            <div class="flex items-center">
              <Checkbox
                v-model="bulkConfig.notifyUsers"
                inputId="notify-users"
                binary
              />
              <label for="notify-users" class="ml-2 text-sm text-gray-700">
                Notify affected users via email
              </label>
            </div>
            <div class="flex items-center">
              <Checkbox
                v-model="bulkConfig.notifyAdmins"
                inputId="notify-admins"
                binary
              />
              <label for="notify-admins" class="ml-2 text-sm text-gray-700">
                Notify administrators about bulk operation
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Preview and Confirmation -->
      <div v-if="selectedOperation" class="preview-section">
        <h4 class="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <i class="pi pi-eye text-orange-600"></i>
          Operation Preview
        </h4>

        <div class="preview-content p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div class="flex items-start gap-3">
            <i class="pi pi-exclamation-triangle text-yellow-600 text-xl mt-1"></i>
            <div class="flex-1">
              <h5 class="font-semibold text-gray-900 mb-2">Operation Summary</h5>
              <div class="text-sm text-gray-700 space-y-1">
                <p><strong>Operation:</strong> {{ selectedOperation.name }}</p>
                <p><strong>Affected Users:</strong> {{ selectedUsers.length }}</p>
                <p v-if="bulkConfig.reason"><strong>Reason:</strong> {{ bulkConfig.reason }}</p>
                <p v-if="selectedOperation.risk"><strong>Risk Level:</strong> {{ selectedOperation.risk }}</p>
              </div>
              <div v-if="selectedOperation.risk === 'HIGH'" class="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                <p class="text-sm text-red-800 font-medium">
                  ⚠️ This is a high-risk operation that cannot be undone. Please ensure you have proper authorization.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between">
        <div class="text-sm text-gray-500">
          <i class="pi pi-info-circle mr-1"></i>
          This operation will affect {{ selectedUsers.length }} user{{ selectedUsers.length !== 1 ? 's' : '' }}
        </div>
        <div class="flex gap-3">
          <Button
            label="Cancel"
            icon="pi pi-times"
            class="p-button-outlined"
            @click="closeDialog"
            :disabled="isProcessing"
          />
          <Button
            :label="getExecuteButtonLabel()"
            icon="pi pi-check"
            :class="getExecuteButtonClass()"
            @click="executeBulkOperation"
            :loading="isProcessing"
            :disabled="!canExecuteOperation"
          />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useToast } from 'primevue/usetoast';

// Props
const props = defineProps<{
  visible: boolean;
  selectedUsers: any[];
}>();

// Emits
const emit = defineEmits<{
  'update:visible': [visible: boolean];
  'bulk-completed': [result: any];
}>();

// Composables
const toast = useToast();

// State
const dialogVisible = ref(props.visible);
const selectedOperation = ref(null);
const isProcessing = ref(false);
const showValidationErrors = ref(false);

// Bulk operation configuration
const bulkConfig = ref({
  roleId: null,
  duration: 'PERMANENT',
  status: null,
  reason: '',
  rolesToRemove: [],
  exportFormat: 'CSV',
  includeFields: ['name', 'email', 'roles'],
  notifyUsers: true,
  notifyAdmins: false,
});

// Available operations
const availableOperations = ref([
  {
    id: 'assign-role',
    name: 'Assign Role',
    description: 'Assign a specific role to all selected users',
    icon: 'pi pi-shield',
    color: '#10b981',
    category: 'Role Management',
    risk: 'MEDIUM'
  },
  {
    id: 'remove-roles',
    name: 'Remove Roles',
    description: 'Remove selected roles from all users',
    icon: 'pi pi-minus-circle',
    color: '#ef4444',
    category: 'Role Management',
    risk: 'HIGH'
  },
  {
    id: 'update-status',
    name: 'Update Status',
    description: 'Change the status of all selected users',
    icon: 'pi pi-refresh',
    color: '#f59e0b',
    category: 'User Management',
    risk: 'MEDIUM'
  },
  {
    id: 'export-data',
    name: 'Export Data',
    description: 'Export selected users data in various formats',
    icon: 'pi pi-download',
    color: '#06b6d4',
    category: 'Data Export',
    risk: 'LOW'
  },
  {
    id: 'send-invitation',
    name: 'Send Invitations',
    description: 'Send welcome or re-invitation emails',
    icon: 'pi pi-send',
    color: '#8b5cf6',
    category: 'Communication',
    risk: 'LOW'
  },
  {
    id: 'reset-passwords',
    name: 'Reset Passwords',
    description: 'Force password reset for selected users',
    icon: 'pi pi-key',
    color: '#ec4899',
    category: 'Security',
    risk: 'HIGH'
  },
]);

// Mock data
const availableRoles = ref([
  { id: '1', name: 'SUPER_ADMIN' },
  { id: '2', name: 'FUND_MANAGER' },
  { id: '3', name: 'COMPLIANCE_OFFICER' },
  { id: '4', name: 'ANALYST' },
  { id: '5', name: 'INVESTOR' },
  { id: '6', name: 'VIEWER' },
]);

const durationOptions = [
  { label: 'Permanent', value: 'PERMANENT' },
  { label: 'Temporary', value: 'TEMPORARY' },
  { label: '30 Days', value: '30_DAYS' },
  { label: '90 Days', value: '90_DAYS' },
  { label: '1 Year', value: '1_YEAR' },
];

const statusOptions = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
  { label: 'Suspended', value: 'SUSPENDED' },
  { label: 'Pending', value: 'PENDING' },
];

const exportFormatOptions = [
  { label: 'CSV', value: 'CSV' },
  { label: 'Excel', value: 'XLSX' },
  { label: 'JSON', value: 'JSON' },
  { label: 'PDF Report', value: 'PDF' },
];

const exportFieldOptions = [
  { label: 'Name', value: 'name' },
  { label: 'Email', value: 'email' },
  { label: 'Roles', value: 'roles' },
  { label: 'Status', value: 'status' },
  { label: 'Last Login', value: 'lastLogin' },
  { label: 'Created Date', value: 'createdAt' },
];

// Computed properties
const canExecuteOperation = computed(() => {
  if (!selectedOperation.value || isProcessing.value) return false;

  switch (selectedOperation.value.id) {
    case 'assign-role':
      return bulkConfig.value.roleId && bulkConfig.value.reason.trim();
    case 'update-status':
      return bulkConfig.value.status && bulkConfig.value.reason.trim();
    case 'remove-roles':
      return bulkConfig.value.rolesToRemove.length > 0 && bulkConfig.value.reason.trim();
    case 'export-data':
      return bulkConfig.value.exportFormat && bulkConfig.value.includeFields.length > 0;
    default:
      return true;
  }
});

// Watchers
watch(() => props.visible, (newValue) => {
  dialogVisible.value = newValue;
});

watch(dialogVisible, (newValue) => {
  emit('update:visible', newValue);
});

// Methods
const getRoleSeverity = (roleName: string) => {
  const severities: Record<string, string> = {
    'SUPER_ADMIN': 'danger',
    'FUND_MANAGER': 'warning',
    'COMPLIANCE_OFFICER': 'info',
    'ANALYST': 'success',
    'INVESTOR': 'success',
    'VIEWER': 'secondary',
  };
  return severities[roleName] || 'info';
};

const getRiskSeverity = (risk: string) => {
  switch (risk) {
    case 'HIGH': return 'danger';
    case 'MEDIUM': return 'warning';
    case 'LOW': return 'success';
    default: return 'info';
  }
};

const selectOperation = (operation: any) => {
  if (operation.disabled) return;
  selectedOperation.value = operation;
  showValidationErrors.value = false;
  resetConfig();
};

const resetConfig = () => {
  bulkConfig.value = {
    roleId: null,
    duration: 'PERMANENT',
    status: null,
    reason: '',
    rolesToRemove: [],
    exportFormat: 'CSV',
    includeFields: ['name', 'email', 'roles'],
    notifyUsers: true,
    notifyAdmins: false,
  };
};

const onDialogShow = () => {
  resetForm();
};

const onDialogHide = () => {
  resetForm();
};

const resetForm = () => {
  selectedOperation.value = null;
  resetConfig();
  isProcessing.value = false;
  showValidationErrors.value = false;
};

const closeDialog = () => {
  dialogVisible.value = false;
};

const getExecuteButtonLabel = () => {
  if (!selectedOperation.value) return 'Execute';
  return `Execute ${selectedOperation.value.name}`;
};

const getExecuteButtonClass = () => {
  if (!selectedOperation.value) return 'p-button-primary';

  switch (selectedOperation.value.risk) {
    case 'HIGH': return 'p-button-danger';
    case 'MEDIUM': return 'p-button-warning';
    default: return 'p-button-primary';
  }
};

const executeBulkOperation = async () => {
  showValidationErrors.value = true;

  if (!canExecuteOperation.value) {
    toast.add({
      severity: 'warn',
      summary: 'Validation Error',
      detail: 'Please fill in all required fields before proceeding.',
      life: 4000
    });
    return;
  }

  isProcessing.value = true;

  try {
    // Simulate API call based on operation type
    const delay = selectedOperation.value.risk === 'HIGH' ? 4000 : 2000;
    await new Promise(resolve => setTimeout(resolve, delay));

    // Mock processing results
    const processedUsers = props.selectedUsers.length;
    const failures = Math.floor(Math.random() * 2); // Random failures for demo
    const successCount = processedUsers - failures;

    const result = {
      operation: selectedOperation.value.name,
      operationId: selectedOperation.value.id,
      totalUsers: processedUsers,
      successCount,
      failures: failures > 0 ? [
        { userId: 'user1', error: 'User not found' },
        { userId: 'user2', error: 'Permission denied' }
      ].slice(0, failures) : [],
      config: { ...bulkConfig.value },
      executedAt: new Date(),
    };

    emit('bulk-completed', result);

    toast.add({
      severity: successCount === processedUsers ? 'success' : 'warn',
      summary: `${selectedOperation.value.name} Completed`,
      detail: `Successfully processed ${successCount} of ${processedUsers} users.`,
      life: 5000
    });

    closeDialog();
  } catch (error) {
    console.error('Bulk operation error:', error);
    toast.add({
      severity: 'error',
      summary: 'Operation Failed',
      detail: 'Failed to execute bulk operation. Please try again or contact support.',
      life: 5000
    });
  } finally {
    isProcessing.value = false;
  }
};
</script>

<style scoped>
.bulk-operations-dialog :deep(.p-dialog-header) {
  @apply border-b border-gray-200 bg-white;
}

.bulk-operations-dialog :deep(.p-dialog-content) {
  @apply bg-gray-50;
}

.bulk-operations-dialog :deep(.p-dialog-footer) {
  @apply border-t border-gray-200 bg-white;
}

.bulk-operations-content {
  @apply space-y-6;
}

.users-preview {
  @apply custom-scrollbar;
}

.user-item {
  @apply shadow-sm;
}

.operations-grid .operation-card {
  @apply transform transition-all duration-200;
}

.operations-grid .operation-card:hover:not(.opacity-50) {
  @apply scale-105;
}

.operation-icon {
  @apply shadow-sm border border-white/20;
}

.config-content {
  @apply p-4 bg-white rounded-lg border border-gray-200;
}

.preview-content {
  @apply shadow-sm;
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

/* Animation for operation selection */
.operation-card.border-purple-500 {
  animation: selectPulse 0.3s ease-in-out;
}

@keyframes selectPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .bulk-operations-dialog {
    @apply m-4;
  }

  .bulk-operations-dialog :deep(.p-dialog) {
    @apply w-full h-full max-h-none;
  }

  .operations-grid {
    @apply grid-cols-1;
  }

  .users-preview .grid {
    @apply grid-cols-1;
  }

  .config-content .grid {
    @apply grid-cols-1;
  }
}
</style>