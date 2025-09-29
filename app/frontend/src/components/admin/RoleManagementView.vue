<template>
  <div class="role-management-view space-y-6">
    <!-- Header with Create Button -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-900">Role & Permission Management</h3>
        <p class="text-sm text-gray-600">Comprehensive role and permission management system</p>
      </div>
      <div class="flex items-center gap-3">
        <Button
          label="Bulk Operations"
          icon="pi pi-cog"
          class="p-button-outlined"
          @click="showBulkOperations = !showBulkOperations"
        />
        <Button
          label="Create Role"
          icon="pi pi-plus"
          class="p-button-primary"
          @click="openCreateDialog"
        />
      </div>
    </div>

    <!-- Overview Dashboard -->
    <div class="overview-section">
      <h4 class="text-md font-semibold text-gray-900 mb-4">System Overview</h4>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card class="stats-card">
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Total Roles</p>
                <p class="text-2xl font-bold text-gray-900">{{ stats.totalRoles }}</p>
              </div>
              <i class="pi pi-users text-2xl text-blue-500"></i>
            </div>
          </template>
        </Card>

        <Card class="stats-card">
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Total Users</p>
                <p class="text-2xl font-bold text-gray-900">{{ stats.totalUsers }}</p>
              </div>
              <i class="pi pi-user text-2xl text-green-500"></i>
            </div>
          </template>
        </Card>

        <Card class="stats-card">
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Total Permissions</p>
                <p class="text-2xl font-bold text-gray-900">{{ stats.totalPermissions }}</p>
              </div>
              <i class="pi pi-shield text-2xl text-purple-500"></i>
            </div>
          </template>
        </Card>

        <Card class="stats-card">
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Critical Permissions</p>
                <p class="text-2xl font-bold text-red-600">{{ stats.criticalCount }}</p>
              </div>
              <i class="pi pi-exclamation-triangle text-2xl text-red-500"></i>
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- Critical Permissions Alert -->
    <div v-if="criticalPermissions.length > 0" class="critical-permissions-alert">
      <Card class="bg-red-50 border-red-200">
        <template #content>
          <div class="p-4">
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-3">
                <i class="pi pi-exclamation-triangle text-red-600 text-xl"></i>
                <div>
                  <h5 class="font-semibold text-red-900">High-Risk Permissions Require Review</h5>
                  <p class="text-sm text-red-700">{{ criticalPermissions.length }} critical permissions need attention</p>
                </div>
              </div>
              <Button
                label="Review"
                icon="pi pi-eye"
                class="p-button-outlined p-button-danger p-button-sm"
                @click="showCriticalPermissions = !showCriticalPermissions"
              />
            </div>

            <div v-if="showCriticalPermissions" class="mt-4 pt-4 border-t border-red-200">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div
                  v-for="permission in criticalPermissions"
                  :key="permission.id"
                  class="flex items-center justify-between p-3 bg-white border border-red-200 rounded"
                >
                  <div>
                    <span class="font-medium text-red-900">{{ permission.action }}</span>
                    <p class="text-sm text-red-700">{{ permission.description }}</p>
                    <span class="text-xs text-red-600">{{ permission.resource }}</span>
                  </div>
                  <Tag value="HIGH RISK" severity="danger" class="text-xs" />
                </div>
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Bulk Operations Panel -->
    <div v-if="showBulkOperations" class="bulk-operations-panel">
      <Card>
        <template #header>
          <h4 class="text-md font-semibold text-gray-900 p-6 pb-0">Bulk Operations</h4>
        </template>
        <template #content>
          <BulkOperationsView
            :roles="roles"
            :permissions="permissions"
            :matrix="matrix"
            @bulk-grant="handleBulkGrant"
            @bulk-revoke="handleBulkRevoke"
            @role-copy="handleRoleCopy"
          />
        </template>
      </Card>
    </div>

    <!-- Role Selection -->
    <div class="role-selector">
      <div class="flex flex-wrap gap-3">
        <Button
          v-for="role in roles"
          :key="role.id"
          :label="role.name"
          :class="[
            'role-button',
            selectedRole?.id === role.id ? 'p-button-primary' : 'p-button-outlined'
          ]"
          @click="selectRole(role)"
        >
          <template #default>
            <span>{{ role.name }}</span>
            <Badge :value="role.userCount" class="ml-2" />
          </template>
        </Button>
      </div>
    </div>

    <!-- Selected Role Details -->
    <div v-if="selectedRole" class="role-details">
      <Card>
        <template #header>
          <div class="flex items-center justify-between p-6 border-b">
            <div>
              <h3 class="text-xl font-semibold text-gray-900">{{ selectedRole.name }}</h3>
              <p class="text-sm text-gray-600 mt-1">{{ selectedRole.userCount }} users assigned</p>
            </div>
            <div class="flex gap-2">
              <Button
                label="View Details"
                icon="pi pi-eye"
                class="p-button-outlined p-button-sm"
                @click="openViewDialog(selectedRole)"
              />
              <Button
                label="Edit Role"
                icon="pi pi-pencil"
                class="p-button-outlined p-button-sm"
                @click="openEditDialog(selectedRole)"
              />
              <Button
                label="Clone Role"
                icon="pi pi-copy"
                class="p-button-outlined p-button-sm"
                @click="openCloneDialog(selectedRole)"
              />
            </div>
          </div>
        </template>
        <template #content>
          <!-- Permission Assignment Interface -->
          <div class="permission-assignment">
            <h4 class="text-lg font-medium text-gray-900 mb-4">Permissions</h4>
            <PermissionSelector
              :permissions="permissions"
              :selected-permissions="getRolePermissions(selectedRole.id)"
              :readonly="false"
              :searchable="true"
              @permission-toggle="handlePermissionToggle"
              @bulk-toggle="handleBulkToggle"
            />
          </div>
        </template>
      </Card>
    </div>

    <!-- No Role Selected State -->
    <div v-else class="no-role-selected">
      <Card>
        <template #content>
          <div class="text-center py-12">
            <i class="pi pi-users text-6xl text-gray-300 mb-4"></i>
            <h3 class="text-lg font-medium text-gray-900 mb-2">Select a Role</h3>
            <p class="text-gray-600">Choose a role from above to manage its permissions</p>
          </div>
        </template>
      </Card>
    </div>

    <!-- Role Dialog -->
    <RoleDialog
      :visible="dialogState.visible"
      :mode="dialogState.mode"
      :role="dialogState.role"
      :permissions="permissions"
      :matrix="matrix"
      :existing-role-names="existingRoleNames"
      @close="closeDialog"
      @save="handleRoleSave"
      @delete="handleRoleDelete"
      @clone="handleRoleClone"
      @switch-mode="handleSwitchMode"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useToast } from 'primevue/usetoast';

// Import Components
import RoleDialog from './RoleDialog.vue';
import PermissionSelector from './PermissionSelector.vue';
import BulkOperationsView from './BulkOperationsView.vue';

// Types
interface Role {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  isDefault: boolean;
  userCount: number;
  createdAt?: string;
  updatedAt?: string;
}

interface Permission {
  id: string;
  resource: string;
  action: string;
  description: string;
  criticality: string;
  requiresApproval?: boolean;
}

interface RoleFormData {
  name: string;
  description: string;
  active: boolean;
  isDefault: boolean;
}

// Props
const props = defineProps<{
  roles: Role[];
  permissions: Permission[];
  matrix: Record<string, string[]>;
  stats: {
    totalPermissions: number;
    totalRoles: number;
    totalUsers: number;
    criticalCount: number;
    grantedCount: number;
    unassignedCount: number;
    coveragePercentage: number;
  };
  criticalPermissions: Permission[];
}>();

// Emits
const emit = defineEmits<{
  'permission-toggle': [roleId: string, permissionId: string];
  'bulk-operation': [operation: { type: string; roleId: string; permissionIds: string[] }];
  'role-created': [roleData: RoleFormData, permissions: string[]];
  'role-updated': [roleId: string, roleData: RoleFormData, permissions: string[]];
  'role-deleted': [roleId: string];
}>();

// Composables
const toast = useToast();

// State
const selectedRole = ref<Role | null>(null);
const showBulkOperations = ref(false);
const showCriticalPermissions = ref(false);
const dialogState = ref<{
  visible: boolean;
  mode: 'create' | 'edit' | 'view';
  role: Role | null;
}>({
  visible: false,
  mode: 'create',
  role: null
});

// Computed
const existingRoleNames = computed(() => {
  return props.roles.map(role => role.name.toLowerCase());
});

// Dialog Methods
const openCreateDialog = () => {
  dialogState.value = {
    visible: true,
    mode: 'create',
    role: null
  };
};

const openEditDialog = (role: Role) => {
  dialogState.value = {
    visible: true,
    mode: 'edit',
    role: role
  };
};

const openViewDialog = (role: Role) => {
  dialogState.value = {
    visible: true,
    mode: 'view',
    role: role
  };
};

const openCloneDialog = (role: Role) => {
  dialogState.value = {
    visible: true,
    mode: 'create',
    role: {
      ...role,
      name: `${role.name} (Copy)`,
      id: '', // Will be generated on save
      isDefault: false, // Clones should never be default
      userCount: 0
    }
  };
};

const closeDialog = () => {
  dialogState.value.visible = false;
  // Small delay to allow dialog animation to complete
  setTimeout(() => {
    dialogState.value.role = null;
  }, 300);
};

const handleSwitchMode = (mode: 'edit') => {
  dialogState.value.mode = mode;
};

// CRUD Operations
const handleRoleSave = async (data: { roleData: RoleFormData; permissions: string[] }) => {
  try {
    if (dialogState.value.mode === 'create') {
      emit('role-created', data.roleData, data.permissions);
      toast.add({
        severity: 'success',
        summary: 'Role Created',
        detail: `Role "${data.roleData.name}" has been created successfully.`,
        life: 3000
      });
    } else if (dialogState.value.mode === 'edit' && dialogState.value.role) {
      emit('role-updated', dialogState.value.role.id, data.roleData, data.permissions);
      toast.add({
        severity: 'success',
        summary: 'Role Updated',
        detail: `Role "${data.roleData.name}" has been updated successfully.`,
        life: 3000
      });

      // Update selected role if it was the one being edited
      if (selectedRole.value?.id === dialogState.value.role.id) {
        selectedRole.value = {
          ...selectedRole.value,
          ...data.roleData
        };
      }
    }
    closeDialog();
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Save Failed',
      detail: 'Failed to save role. Please try again.',
      life: 5000
    });
  }
};

const handleRoleDelete = async (roleId: string) => {
  try {
    emit('role-deleted', roleId);

    // Clear selection if deleted role was selected
    if (selectedRole.value?.id === roleId) {
      selectedRole.value = null;
    }

    toast.add({
      severity: 'success',
      summary: 'Role Deleted',
      detail: 'Role has been deleted successfully.',
      life: 3000
    });
    closeDialog();
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Delete Failed',
      detail: 'Failed to delete role. Please try again.',
      life: 5000
    });
  }
};

const handleRoleClone = (role: Role) => {
  // Close current dialog and open clone dialog
  closeDialog();
  setTimeout(() => {
    openCloneDialog(role);
  }, 300);
};

// Role Selection
const selectRole = (role: Role) => {
  selectedRole.value = role;
};

// Permission Management
const getRolePermissions = (roleId: string) => {
  return props.matrix[roleId] || [];
};

const handlePermissionToggle = (permissionId: string) => {
  if (selectedRole.value) {
    emit('permission-toggle', selectedRole.value.id, permissionId);
  }
};

const handleBulkToggle = (permissionIds: string[], grant: boolean) => {
  if (selectedRole.value) {
    emit('bulk-operation', {
      type: grant ? 'grant' : 'revoke',
      roleId: selectedRole.value.id,
      permissionIds
    });
  }
};

// Bulk Operations Handlers
const handleBulkGrant = (data: { roleId: string; permissionIds: string[] }) => {
  emit('bulk-operation', {
    type: 'grant',
    roleId: data.roleId,
    permissionIds: data.permissionIds
  });
};

const handleBulkRevoke = (data: { roleId: string; permissionIds: string[] }) => {
  emit('bulk-operation', {
    type: 'revoke',
    roleId: data.roleId,
    permissionIds: data.permissionIds
  });
};

const handleRoleCopy = (data: { sourceRoleId: string; targetRoleId: string }) => {
  // This would emit to parent for handling
  toast.add({
    severity: 'info',
    summary: 'Role Copy',
    detail: 'Role permissions copied successfully',
    life: 3000
  });
};
</script>

<style scoped>
.role-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.permission-group {
  transition: all 0.2s ease;
}

.permission-group:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.role-management-view {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
