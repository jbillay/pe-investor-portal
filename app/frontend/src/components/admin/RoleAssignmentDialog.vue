<template>
  <Dialog
    v-model:visible="dialogVisible"
    :modal="true"
    :draggable="false"
    :closable="true"
    :style="{ width: '90vw', maxWidth: '800px' }"
    class="role-assignment-dialog"
    @show="onDialogShow"
    @hide="onDialogHide"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <i class="pi pi-users text-white text-lg"></i>
        </div>
        <div>
          <h3 class="text-xl font-semibold text-gray-900 m-0">Assign Role to User</h3>
          <p class="text-sm text-gray-600 m-0 mt-1">Grant specific permissions by assigning a role</p>
        </div>
      </div>
    </template>

    <div class="role-assignment-content">
      <!-- User Information Section -->
      <div v-if="user" class="user-info-section mb-6 p-4 bg-gray-50 rounded-lg border">
        <h4 class="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
          <i class="pi pi-user text-blue-600"></i>
          User Information
        </h4>
        <div class="flex items-center gap-4">
          <Avatar
            :image="user.profileImage"
            :label="user.name ? user.name.charAt(0).toUpperCase() : 'U'"
            size="large"
            shape="circle"
            class="user-avatar"
          />
          <div class="flex-1">
            <div class="text-lg font-semibold text-gray-900">{{ user.name || 'Unknown User' }}</div>
            <div class="text-sm text-gray-600">{{ user.email }}</div>
            <div class="flex items-center gap-2 mt-2">
              <span class="text-xs text-gray-500">Current Roles:</span>
              <div class="flex gap-1">
                <Tag
                  v-for="role in user.currentRoles || []"
                  :key="role"
                  :value="role"
                  :severity="getRoleSeverity(role)"
                  class="text-xs"
                />
                <Tag
                  v-if="!user.currentRoles || user.currentRoles.length === 0"
                  value="No roles assigned"
                  severity="warning"
                  class="text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Role Selection Section -->
      <div class="role-selection-section mb-6">
        <h4 class="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <i class="pi pi-shield text-green-600"></i>
          Select Role to Assign
        </h4>

        <!-- Role Search and Filter -->
        <div class="mb-4">
          <div class="p-inputgroup">
            <span class="p-inputgroup-addon">
              <i class="pi pi-search"></i>
            </span>
            <InputText
              v-model="roleSearchTerm"
              placeholder="Search available roles..."
              class="flex-1"
            />
          </div>
        </div>

        <!-- Available Roles Grid -->
        <div class="roles-grid grid grid-cols-1 md:grid-cols-2 gap-4 max-h-80 overflow-y-auto">
          <div
            v-for="role in filteredAvailableRoles"
            :key="role.id"
            class="role-card p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md"
            :class="{
              'border-blue-500 bg-blue-50 shadow-md': selectedRole?.id === role.id,
              'border-gray-200 bg-white hover:border-gray-300': selectedRole?.id !== role.id,
              'opacity-50 cursor-not-allowed': isRoleDisabled(role)
            }"
            @click="selectRole(role)"
          >
            <div class="flex items-start gap-3">
              <div
                class="role-icon w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                :style="{ backgroundColor: getRoleColor(role.name) }"
              >
                {{ getRoleInitials(role.name) }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <h5 class="font-semibold text-gray-900 text-sm truncate">{{ role.name }}</h5>
                  <Tag
                    v-if="role.isDefault"
                    value="DEFAULT"
                    severity="info"
                    class="text-xs"
                  />
                  <i
                    v-if="selectedRole?.id === role.id"
                    class="pi pi-check-circle text-blue-600 text-lg"
                  />
                </div>
                <p class="text-xs text-gray-600 mb-2 line-clamp-2">
                  {{ role.description || 'No description available' }}
                </p>
                <div class="flex items-center justify-between text-xs text-gray-500">
                  <span>{{ role.permissionCount || 0 }} permissions</span>
                  <span v-if="isRoleDisabled(role)" class="text-orange-600 font-medium">
                    Already assigned
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="filteredAvailableRoles.length === 0" class="text-center py-8 text-gray-500">
          <i class="pi pi-info-circle text-2xl mb-2"></i>
          <p>No available roles found</p>
          <p class="text-sm">Try adjusting your search terms</p>
        </div>
      </div>

      <!-- Assignment Details Section -->
      <div v-if="selectedRole" class="assignment-details-section mb-6">
        <h4 class="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <i class="pi pi-cog text-purple-600"></i>
          Assignment Details
        </h4>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Assignment Reason -->
          <div class="col-span-full">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Reason for Assignment <span class="text-red-500">*</span>
            </label>
            <Textarea
              v-model="assignmentReason"
              placeholder="Provide a reason for this role assignment (required for audit trail)..."
              :rows="3"
              class="w-full"
              :class="{ 'p-invalid': !assignmentReason && showValidationErrors }"
            />
            <small v-if="!assignmentReason && showValidationErrors" class="p-error">
              Assignment reason is required for audit purposes
            </small>
          </div>

          <!-- Assignment Duration -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Assignment Duration
            </label>
            <Dropdown
              v-model="assignmentDuration"
              :options="durationOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Select duration"
              class="w-full"
            />
          </div>

          <!-- Expiry Date (if temporary) -->
          <div v-if="assignmentDuration === 'TEMPORARY'">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Expiry Date <span class="text-red-500">*</span>
            </label>
            <Calendar
              v-model="expiryDate"
              dateFormat="mm/dd/yy"
              :minDate="new Date()"
              placeholder="Select expiry date"
              class="w-full"
              :class="{ 'p-invalid': assignmentDuration === 'TEMPORARY' && !expiryDate && showValidationErrors }"
            />
          </div>

          <!-- Notification Options -->
          <div class="col-span-full">
            <label class="block text-sm font-medium text-gray-700 mb-3">Notification Options</label>
            <div class="flex flex-col gap-2">
              <div class="flex items-center">
                <Checkbox
                  v-model="notifyUser"
                  inputId="notify-user"
                  binary
                />
                <label for="notify-user" class="ml-2 text-sm text-gray-700">
                  Notify user via email about role assignment
                </label>
              </div>
              <div class="flex items-center">
                <Checkbox
                  v-model="notifyAdmins"
                  inputId="notify-admins"
                  binary
                />
                <label for="notify-admins" class="ml-2 text-sm text-gray-700">
                  Notify administrators about this assignment
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Permission Preview Section -->
      <div v-if="selectedRole" class="permission-preview-section">
        <h4 class="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <i class="pi pi-eye text-indigo-600"></i>
          Permission Preview
        </h4>

        <div class="permissions-container max-h-40 overflow-y-auto border rounded-lg p-3 bg-gray-50">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            <div
              v-for="permission in selectedRole.permissions || []"
              :key="permission"
              class="permission-chip flex items-center gap-2 px-3 py-1 bg-white rounded-md border text-sm"
            >
              <i class="pi pi-check text-green-600 text-xs"></i>
              <span class="text-gray-700">{{ permission }}</span>
            </div>
          </div>
          <div v-if="!selectedRole.permissions || selectedRole.permissions.length === 0" class="text-center text-gray-500 py-4">
            <i class="pi pi-info-circle"></i>
            <p class="text-sm">No permissions data available</p>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between">
        <div class="text-sm text-gray-500">
          <i class="pi pi-info-circle mr-1"></i>
          Changes will be applied immediately
        </div>
        <div class="flex gap-3">
          <Button
            label="Cancel"
            icon="pi pi-times"
            class="p-button-outlined"
            @click="closeDialog"
            :disabled="isAssigning"
          />
          <Button
            label="Assign Role"
            icon="pi pi-check"
            class="p-button-primary"
            @click="assignRole"
            :loading="isAssigning"
            :disabled="!canAssignRole"
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
  user: any;
}>();

// Emits
const emit = defineEmits<{
  'update:visible': [visible: boolean];
  'role-assigned': [result: any];
}>();

// Composables
const toast = useToast();

// State
const dialogVisible = ref(props.visible);
const selectedRole = ref(null);
const roleSearchTerm = ref('');
const assignmentReason = ref('');
const assignmentDuration = ref('PERMANENT');
const expiryDate = ref(null);
const notifyUser = ref(true);
const notifyAdmins = ref(false);
const isAssigning = ref(false);
const showValidationErrors = ref(false);

// Mock available roles data
const availableRoles = ref([
  {
    id: '1',
    name: 'SUPER_ADMIN',
    description: 'System administrators with full access to all features',
    permissionCount: 48,
    isDefault: false,
    permissions: ['USER:CREATE', 'USER:READ', 'USER:UPDATE', 'USER:DELETE', 'SYSTEM:CONFIGURE', 'AUDIT:READ']
  },
  {
    id: '2',
    name: 'FUND_MANAGER',
    description: 'Fund management team with operational access',
    permissionCount: 35,
    isDefault: false,
    permissions: ['FUND:CREATE', 'FUND:READ', 'FUND:UPDATE', 'INVESTMENT:CREATE', 'CAPITAL_CALL:CREATE']
  },
  {
    id: '3',
    name: 'COMPLIANCE_OFFICER',
    description: 'Compliance and regulatory oversight',
    permissionCount: 28,
    isDefault: false,
    permissions: ['FUND:READ', 'INVESTMENT:READ', 'REPORT:VIEW_COMPLIANCE', 'AUDIT:READ']
  },
  {
    id: '4',
    name: 'ANALYST',
    description: 'Read-only access for analysis and reporting',
    permissionCount: 18,
    isDefault: false,
    permissions: ['FUND:READ', 'INVESTMENT:READ', 'REPORT:VIEW_PERFORMANCE']
  },
  {
    id: '5',
    name: 'INVESTOR',
    description: 'Limited partners with access to their investments',
    permissionCount: 12,
    isDefault: true,
    permissions: ['INVESTMENT:READ_OWN', 'DOCUMENT:READ', 'CAPITAL_CALL:READ']
  },
  {
    id: '6',
    name: 'VIEWER',
    description: 'Minimum access for basic information',
    permissionCount: 6,
    isDefault: false,
    permissions: ['FUND:READ', 'DOCUMENT:READ']
  },
]);

const durationOptions = [
  { label: 'Permanent', value: 'PERMANENT' },
  { label: 'Temporary', value: 'TEMPORARY' },
  { label: '30 Days', value: '30_DAYS' },
  { label: '90 Days', value: '90_DAYS' },
  { label: '1 Year', value: '1_YEAR' },
];

// Computed properties
const filteredAvailableRoles = computed(() => {
  let filtered = availableRoles.value;

  if (roleSearchTerm.value) {
    const search = roleSearchTerm.value.toLowerCase();
    filtered = filtered.filter(role =>
      role.name.toLowerCase().includes(search) ||
      role.description.toLowerCase().includes(search)
    );
  }

  return filtered;
});

const canAssignRole = computed(() => {
  if (!selectedRole.value || !assignmentReason.value.trim()) return false;
  if (assignmentDuration.value === 'TEMPORARY' && !expiryDate.value) return false;
  return !isAssigning.value;
});

// Watchers
watch(() => props.visible, (newValue) => {
  dialogVisible.value = newValue;
});

watch(dialogVisible, (newValue) => {
  emit('update:visible', newValue);
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

const isRoleDisabled = (role: any) => {
  return props.user?.currentRoles?.includes(role.name) || false;
};

const selectRole = (role: any) => {
  if (isRoleDisabled(role)) return;
  selectedRole.value = role;
  showValidationErrors.value = false;
};

const onDialogShow = () => {
  resetForm();
};

const onDialogHide = () => {
  resetForm();
};

const resetForm = () => {
  selectedRole.value = null;
  roleSearchTerm.value = '';
  assignmentReason.value = '';
  assignmentDuration.value = 'PERMANENT';
  expiryDate.value = null;
  notifyUser.value = true;
  notifyAdmins.value = false;
  isAssigning.value = false;
  showValidationErrors.value = false;
};

const closeDialog = () => {
  dialogVisible.value = false;
};

const assignRole = async () => {
  showValidationErrors.value = true;

  if (!canAssignRole.value) {
    toast.add({
      severity: 'warn',
      summary: 'Validation Error',
      detail: 'Please fill in all required fields before proceeding.',
      life: 4000
    });
    return;
  }

  isAssigning.value = true;

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    const result = {
      userId: props.user?.id,
      userName: props.user?.name || props.user?.email,
      roleId: selectedRole.value?.id,
      roleName: selectedRole.value?.name,
      reason: assignmentReason.value,
      duration: assignmentDuration.value,
      expiryDate: expiryDate.value,
      notificationsSent: {
        user: notifyUser.value,
        admins: notifyAdmins.value,
      },
      assignedAt: new Date(),
    };

    emit('role-assigned', result);

    toast.add({
      severity: 'success',
      summary: 'Role Assigned Successfully',
      detail: `${selectedRole.value?.name} role has been assigned to ${props.user?.name || props.user?.email}`,
      life: 5000
    });

    closeDialog();
  } catch (error) {
    console.error('Role assignment error:', error);
    toast.add({
      severity: 'error',
      summary: 'Assignment Failed',
      detail: 'Failed to assign role. Please try again or contact support.',
      life: 5000
    });
  } finally {
    isAssigning.value = false;
  }
};
</script>

<style scoped>
.role-assignment-dialog :deep(.p-dialog-header) {
  @apply border-b border-gray-200 bg-white;
}

.role-assignment-dialog :deep(.p-dialog-content) {
  @apply bg-gray-50;
}

.role-assignment-dialog :deep(.p-dialog-footer) {
  @apply border-t border-gray-200 bg-white;
}

.role-assignment-content {
  @apply space-y-6;
}

.user-avatar {
  @apply shadow-md border-2 border-white;
}

.roles-grid {
  @apply custom-scrollbar;
}

.role-card {
  @apply transform transition-all duration-200;
}

.role-card:hover {
  @apply scale-105;
}

.role-icon {
  @apply shadow-sm border border-white/20;
}

.permission-chip {
  @apply shadow-sm;
}

.permissions-container {
  @apply custom-scrollbar;
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

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Animation for role selection */
.role-card.border-blue-500 {
  animation: selectPulse 0.3s ease-in-out;
}

@keyframes selectPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .role-assignment-dialog {
    @apply m-4;
  }

  .role-assignment-dialog :deep(.p-dialog) {
    @apply w-full h-full max-h-none;
  }

  .roles-grid {
    @apply grid-cols-1;
  }

  .assignment-details-section .grid {
    @apply grid-cols-1;
  }

  .permissions-container .grid {
    @apply grid-cols-1;
  }
}
</style>