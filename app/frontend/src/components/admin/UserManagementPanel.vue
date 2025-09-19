<template>
  <div class="user-management-panel">
    <!-- Toolbar with Search and Filters -->
    <Toolbar class="mb-6 border-none shadow-sm">
      <template #start>
        <div class="flex gap-4 items-center">
          <div class="p-input-icon-left">
            <i class="pi pi-search" />
            <InputText
              v-model="searchQuery"
              placeholder="Search users by name, email, or role..."
              class="w-80"
              @input="handleSearch"
            />
          </div>

          <Dropdown
            v-model="selectedRoleFilter"
            :options="roleFilterOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Filter by Role"
            class="w-48"
            showClear
            @change="applyFilters"
          />

          <Dropdown
            v-model="selectedStatusFilter"
            :options="statusFilterOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Filter by Status"
            class="w-44"
            showClear
            @change="applyFilters"
          />
        </div>
      </template>

      <template #end>
        <div class="flex gap-3">
          <Button
            label="Export Users"
            icon="pi pi-download"
            class="p-button-outlined"
            @click="exportUsers"
          />

          <Button
            label="Invite User"
            icon="pi pi-user-plus"
            @click="showInviteDialog = true"
          />
        </div>
      </template>
    </Toolbar>

    <!-- Users DataTable -->
    <DataTable
      v-model:selection="selectedUsers"
      :value="filteredUsers"
      :loading="loading"
      :paginator="true"
      :rows="20"
      :rowsPerPageOptions="[10, 20, 50, 100]"
      selectionMode="multiple"
      dataKey="id"
      class="user-data-table"
      :globalFilterFields="['firstName', 'lastName', 'email']"
      responsiveLayout="scroll"
      :scrollable="true"
      scrollHeight="600px"
      showGridlines
      stripedRows
      @row-select="onRowSelect"
      @row-unselect="onRowUnselect"
    >
      <!-- Selection Column -->
      <Column selectionMode="multiple" headerStyle="width: 3rem" />

      <!-- Avatar and User Info Column -->
      <Column field="user" header="User" :sortable="false" style="min-width: 250px">
        <template #body="{ data }">
          <div class="flex items-center gap-3">
            <Avatar
              :label="getUserInitials(data)"
              :image="data.avatar"
              class="flex-shrink-0"
              shape="circle"
              size="large"
            />
            <div class="flex flex-col">
              <span class="font-semibold text-gray-900">
                {{ data.firstName }} {{ data.lastName }}
              </span>
              <span class="text-sm text-gray-500">{{ data.email }}</span>
              <div class="flex items-center gap-2 mt-1">
                <Tag
                  :value="data.isVerified ? 'Verified' : 'Unverified'"
                  :severity="data.isVerified ? 'success' : 'warning'"
                  class="text-xs"
                />
                <Tag
                  :value="data.isActive ? 'Active' : 'Inactive'"
                  :severity="data.isActive ? 'success' : 'danger'"
                  class="text-xs"
                />
              </div>
            </div>
          </div>
        </template>
      </Column>

      <!-- Roles Column -->
      <Column field="roles" header="Roles" style="min-width: 200px">
        <template #body="{ data }">
          <div class="flex flex-wrap gap-1">
            <Chip
              v-for="role in data.roles"
              :key="role.id"
              :label="role.name"
              :class="getRoleChipClass(role.name)"
              class="text-xs"
            />
            <Button
              icon="pi pi-plus"
              class="p-button-text p-button-sm p-button-rounded"
              @click="$emit('assign-role', data)"
              v-tooltip.top="'Assign Role'"
            />
          </div>
        </template>
      </Column>

      <!-- Permissions Count -->
      <Column field="permissionCount" header="Permissions" style="min-width: 120px">
        <template #body="{ data }">
          <div class="flex items-center gap-2">
            <Badge
              :value="data.effectivePermissions?.length || 0"
              severity="info"
            />
            <Button
              icon="pi pi-eye"
              class="p-button-text p-button-sm"
              @click="viewUserPermissions(data)"
              v-tooltip.top="'View Permissions'"
            />
          </div>
        </template>
      </Column>

      <!-- Last Login -->
      <Column field="lastLoginAt" header="Last Login" style="min-width: 150px">
        <template #body="{ data }">
          <div class="flex flex-col">
            <span v-if="data.lastLoginAt" class="text-sm">
              {{ formatDate(data.lastLoginAt) }}
            </span>
            <span v-else class="text-sm text-gray-400">Never</span>
            <span v-if="data.lastLoginAt" class="text-xs text-gray-500">
              {{ formatRelativeTime(data.lastLoginAt) }}
            </span>
          </div>
        </template>
      </Column>

      <!-- Investment Activity -->
      <Column field="investmentActivity" header="Activity" style="min-width: 120px">
        <template #body="{ data }">
          <div class="flex flex-col items-center">
            <ProgressBar
              :value="getActivityScore(data)"
              class="w-16 h-2 mb-1"
              :showValue="false"
            />
            <span class="text-xs text-gray-600">
              {{ data.investmentCount || 0 }} investments
            </span>
          </div>
        </template>
      </Column>

      <!-- Actions Column -->
      <Column header="Actions" style="min-width: 120px">
        <template #body="{ data }">
          <div class="flex gap-1">
            <Button
              icon="pi pi-pencil"
              class="p-button-rounded p-button-text p-button-sm"
              @click="$emit('edit-user', data)"
              v-tooltip.top="'Edit User'"
            />

            <Button
              icon="pi pi-shield"
              class="p-button-rounded p-button-text p-button-sm p-button-info"
              @click="$emit('assign-role', data)"
              v-tooltip.top="'Manage Roles'"
            />

            <SplitButton
              icon="pi pi-ellipsis-v"
              class="p-button-rounded p-button-text p-button-sm"
              :model="getUserActions(data)"
              @click="handleUserAction(data, 'view')"
            />
          </div>
        </template>
      </Column>
    </DataTable>

    <!-- Selection Summary -->
    <div v-if="selectedUsers.length > 0" class="selection-summary mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-3">
          <i class="pi pi-info-circle text-blue-600"></i>
          <span class="text-blue-800 font-medium">
            {{ selectedUsers.length }} user{{ selectedUsers.length > 1 ? 's' : '' }} selected
          </span>
        </div>
        <div class="flex gap-2">
          <Button
            label="Bulk Assign Role"
            icon="pi pi-users"
            class="p-button-sm"
            @click="$emit('bulk-action', 'assign-role')"
          />
          <Button
            label="Export Selected"
            icon="pi pi-download"
            class="p-button-outlined p-button-sm"
            @click="exportSelectedUsers"
          />
          <Button
            label="Clear Selection"
            icon="pi pi-times"
            class="p-button-text p-button-sm"
            @click="clearSelection"
          />
        </div>
      </div>
    </div>

    <!-- User Invite Dialog -->
    <Dialog
      v-model:visible="showInviteDialog"
      header="Invite New User"
      :modal="true"
      class="w-96"
    >
      <div class="p-4">
        <p class="text-gray-600 mb-4">User invitation functionality will be implemented here.</p>
        <div class="flex justify-end gap-2">
          <Button label="Cancel" class="p-button-outlined" @click="showInviteDialog = false" />
          <Button label="Send Invite" @click="handleUserInvited" />
        </div>
      </div>
    </Dialog>

    <!-- User Permissions Dialog -->
    <Dialog
      v-model:visible="showPermissionsDialog"
      header="User Permissions"
      :modal="true"
      class="w-5/6 max-w-4xl"
    >
      <div class="p-4">
        <p class="text-gray-600 mb-4">Permissions for {{ selectedPermissionUser?.firstName }} {{ selectedPermissionUser?.lastName }}</p>
        <div v-if="selectedPermissionUser?.roles" class="space-y-2">
          <div v-for="role in selectedPermissionUser.roles" :key="role.id" class="p-3 bg-gray-50 rounded">
            <h4 class="font-medium">{{ role.name }}</h4>
            <p class="text-sm text-gray-600">{{ role.description }}</p>
          </div>
        </div>
        <div v-else class="text-gray-500">No roles assigned</div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { FilterMatchMode } from 'primevue/api';

// PrimeVue Components
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import Tag from 'primevue/tag';
import Avatar from 'primevue/avatar';
import Card from 'primevue/card';
import ProgressSpinner from 'primevue/progressspinner';
import Dialog from 'primevue/dialog';
import Divider from 'primevue/divider';
import OverlayPanel from 'primevue/overlaypanel';
import MultiSelect from 'primevue/multiselect';

// Define props and emits
const props = defineProps<{
  selectedUsers: any[];
}>();

const emit = defineEmits<{
  'update:selectedUsers': [users: any[]];
  'edit-user': [user: any];
  'assign-role': [user: any];
  'bulk-action': [action: string];
}>();

// Component state
const loading = ref(false);
const users = ref([]);
const searchQuery = ref('');
const selectedRoleFilter = ref(null);
const selectedStatusFilter = ref(null);
const showInviteDialog = ref(false);
const showPermissionsDialog = ref(false);
const selectedPermissionUser = ref(null);

// Toast and confirm
const toast = useToast();
const confirm = useConfirm();

// Computed
const selectedUsers = computed({
  get: () => props.selectedUsers,
  set: (value) => emit('update:selectedUsers', value)
});

const filteredUsers = computed(() => {
  let result = users.value;

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(user =>
      user.firstName?.toLowerCase().includes(query) ||
      user.lastName?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.roles?.some(role => role.name.toLowerCase().includes(query))
    );
  }

  // Apply role filter
  if (selectedRoleFilter.value) {
    result = result.filter(user =>
      user.roles?.some(role => role.name === selectedRoleFilter.value)
    );
  }

  // Apply status filter
  if (selectedStatusFilter.value) {
    if (selectedStatusFilter.value === 'active') {
      result = result.filter(user => user.isActive);
    } else if (selectedStatusFilter.value === 'inactive') {
      result = result.filter(user => !user.isActive);
    } else if (selectedStatusFilter.value === 'verified') {
      result = result.filter(user => user.isVerified);
    } else if (selectedStatusFilter.value === 'unverified') {
      result = result.filter(user => !user.isVerified);
    }
  }

  return result;
});

// Filter options
const roleFilterOptions = ref([
  { label: 'Super Admin', value: 'SUPER_ADMIN' },
  { label: 'Fund Manager', value: 'FUND_MANAGER' },
  { label: 'Investor', value: 'INVESTOR' },
  { label: 'Compliance Officer', value: 'COMPLIANCE_OFFICER' },
  { label: 'Analyst', value: 'ANALYST' },
  { label: 'Viewer', value: 'VIEWER' }
]);

const statusFilterOptions = ref([
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Verified', value: 'verified' },
  { label: 'Unverified', value: 'unverified' }
]);

// Lifecycle
onMounted(async () => {
  await loadUsers();
});

// Methods
const loadUsers = async () => {
  loading.value = true;
  try {
    // Mock data for development - replace with actual API when backend is ready
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

    users.value = [
      {
        id: '1',
        firstName: 'Jeremy',
        lastName: 'Billay',
        email: 'john.doe@example.com',
        roles: ['SUPER_ADMIN'],
        status: 'ACTIVE',
        lastLogin: '2025-01-15T10:30:00Z',
        createdAt: '2024-01-10T08:00:00Z',
        avatar: null
      },
      {
        id: '2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        roles: ['FUND_MANAGER'],
        status: 'ACTIVE',
        lastLogin: '2025-01-14T16:45:00Z',
        createdAt: '2024-02-15T09:30:00Z',
        avatar: null
      },
      {
        id: '3',
        firstName: 'Bob',
        lastName: 'Johnson',
        email: 'bob.johnson@example.com',
        roles: ['ANALYST'],
        status: 'ACTIVE',
        lastLogin: '2025-01-13T14:20:00Z',
        createdAt: '2024-03-01T11:15:00Z',
        avatar: null
      },
      {
        id: '4',
        firstName: 'Alice',
        lastName: 'Williams',
        email: 'alice.williams@example.com',
        roles: ['COMPLIANCE_OFFICER'],
        status: 'INACTIVE',
        lastLogin: '2025-01-10T09:00:00Z',
        createdAt: '2024-04-12T13:45:00Z',
        avatar: null
      },
      {
        id: '5',
        firstName: 'Charlie',
        lastName: 'Brown',
        email: 'charlie.brown@example.com',
        roles: ['INVESTOR'],
        status: 'PENDING',
        lastLogin: null,
        createdAt: '2025-01-14T15:30:00Z',
        avatar: null
      }
    ];

    toast.add({
      severity: 'success',
      summary: 'Users Loaded',
      detail: `Successfully loaded ${users.value.length} users`,
      life: 2000
    });
  } catch (error) {
    console.error('Error loading users:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load users',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  // Debounced search implementation could be added here
};

const applyFilters = () => {
  // Filters are reactive through computed property
};

const getUserInitials = (user: any) => {
  const first = user.firstName?.charAt(0) || '';
  const last = user.lastName?.charAt(0) || '';
  return (first + last).toUpperCase() || user.email?.charAt(0).toUpperCase() || '?';
};

const getRoleChipClass = (roleName: string) => {
  const classes = {
    'SUPER_ADMIN': 'bg-red-100 text-red-800',
    'FUND_MANAGER': 'bg-blue-100 text-blue-800',
    'COMPLIANCE_OFFICER': 'bg-purple-100 text-purple-800',
    'ANALYST': 'bg-green-100 text-green-800',
    'INVESTOR': 'bg-yellow-100 text-yellow-800',
    'VIEWER': 'bg-gray-100 text-gray-800'
  };
  return classes[roleName] || 'bg-gray-100 text-gray-800';
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString();
};

const formatRelativeTime = (date: string) => {
  const now = new Date();
  const loginDate = new Date(date);
  const diffInHours = Math.floor((now.getTime() - loginDate.getTime()) / (1000 * 60 * 60));

  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  }
};

const getActivityScore = (user: any) => {
  // Calculate activity score based on investments, logins, etc.
  const investments = user.investmentCount || 0;
  const maxInvestments = 20; // Assumed max for scaling
  return Math.min((investments / maxInvestments) * 100, 100);
};

const getUserActions = (user: any) => {
  return [
    {
      label: 'View Profile',
      icon: 'pi pi-user',
      command: () => handleUserAction(user, 'view')
    },
    {
      label: 'View Permissions',
      icon: 'pi pi-key',
      command: () => viewUserPermissions(user)
    },
    {
      label: 'Reset Password',
      icon: 'pi pi-lock',
      command: () => handleUserAction(user, 'reset-password')
    },
    {
      separator: true
    },
    {
      label: user.isActive ? 'Deactivate' : 'Activate',
      icon: user.isActive ? 'pi pi-ban' : 'pi pi-check',
      command: () => toggleUserStatus(user)
    }
  ];
};

const handleUserAction = (user: any, action: string) => {
  switch (action) {
    case 'view':
      emit('edit-user', user);
      break;
    case 'reset-password':
      resetUserPassword(user);
      break;
  }
};

const viewUserPermissions = (user: any) => {
  selectedPermissionUser.value = user;
  showPermissionsDialog.value = true;
};

const toggleUserStatus = (user: any) => {
  const action = user.isActive ? 'deactivate' : 'activate';
  const message = `Are you sure you want to ${action} ${user.firstName} ${user.lastName}?`;

  confirm.require({
    message,
    header: `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
    icon: 'pi pi-exclamation-triangle',
    accept: async () => {
      try {
        // API call to toggle user status
        await fetch(`/api/admin/users/${user.id}/toggle-status`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });

        user.isActive = !user.isActive;

        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: `User ${action}d successfully`,
          life: 3000
        });
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to ${action} user`,
          life: 3000
        });
      }
    }
  });
};

const resetUserPassword = (user: any) => {
  confirm.require({
    message: `Send password reset email to ${user.email}?`,
    header: 'Reset Password',
    icon: 'pi pi-key',
    accept: async () => {
      try {
        await fetch(`/api/admin/users/${user.id}/reset-password`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });

        toast.add({
          severity: 'success',
          summary: 'Password Reset Sent',
          detail: `Reset email sent to ${user.email}`,
          life: 3000
        });
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to send password reset email',
          life: 3000
        });
      }
    }
  });
};

const exportUsers = () => {
  // Implementation for exporting all users
  console.log('Exporting all users...');
};

const exportSelectedUsers = () => {
  // Implementation for exporting selected users
  console.log('Exporting selected users:', selectedUsers.value);
};

const clearSelection = () => {
  selectedUsers.value = [];
};

const onRowSelect = (event: any) => {
  // Handle row selection
};

const onRowUnselect = (event: any) => {
  // Handle row unselection
};

const handleUserInvited = () => {
  showInviteDialog.value = false;
  loadUsers(); // Refresh the user list
  toast.add({
    severity: 'success',
    summary: 'User Invited',
    detail: 'Invitation sent successfully',
    life: 3000
  });
};
</script>

<style scoped>
.user-management-panel {
  @apply space-y-6;
}

.user-data-table {
  @apply border border-gray-200 rounded-lg overflow-hidden;
}

.user-data-table :deep(.p-datatable-header) {
  @apply bg-gray-50 border-b border-gray-200;
}

.user-data-table :deep(.p-datatable-thead > tr > th) {
  @apply bg-gray-50 text-gray-700 font-semibold border-b border-gray-200;
}

.user-data-table :deep(.p-datatable-tbody > tr:hover) {
  @apply bg-blue-50;
}

.user-data-table :deep(.p-datatable-tbody > tr.p-highlight) {
  @apply bg-blue-100;
}

.selection-summary {
  @apply transition-all duration-200 ease-in-out;
}

/* Avatar hover effects */
.user-data-table :deep(.p-avatar) {
  @apply transition-all duration-200 hover:scale-105;
}

/* Chip styling */
.user-data-table :deep(.p-chip) {
  @apply font-medium;
}

/* Button hover effects */
.user-data-table :deep(.p-button-text:hover) {
  @apply bg-gray-100;
}

/* Progress bar styling */
.user-data-table :deep(.p-progressbar) {
  @apply bg-gray-200;
}

.user-data-table :deep(.p-progressbar .p-progressbar-value) {
  @apply bg-gradient-to-r from-blue-500 to-blue-600;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .user-data-table :deep(.p-datatable-wrapper) {
    @apply text-sm;
  }

  .selection-summary {
    @apply p-3;
  }

  .selection-summary .flex {
    @apply flex-col gap-3 items-start;
  }
}
</style>
