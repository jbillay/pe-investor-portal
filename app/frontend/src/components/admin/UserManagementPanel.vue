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
      <Column field="user" :sortable="false" style="min-width: 250px">
        <template #header>
          <div class="flex items-center gap-2 text-gray-700 font-semibold">
            <i class="pi pi-user text-blue-600"></i>
            <span>User Profile</span>
          </div>
        </template>
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
                {{
                  data.fullName ||
                  `${data.firstName} ${data.lastName}`.trim() ||
                  'No Name'
                }}
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
      <Column field="roles" style="min-width: 200px">
        <template #header>
          <div class="flex items-center gap-2 text-gray-700 font-semibold">
            <i class="pi pi-shield text-purple-600"></i>
            <span>Assigned Roles</span>
          </div>
        </template>
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
      <Column field="permissionCount" style="min-width: 120px">
        <template #header>
          <div class="flex items-center gap-2 text-gray-700 font-semibold">
            <i class="pi pi-key text-green-600"></i>
            <span>Permissions</span>
          </div>
        </template>
        <template #body="{ data }">
          <div class="flex items-center gap-2">
            <Badge :value="data.permissionCount || 0" severity="info" />
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
      <Column field="lastLoginAt" style="min-width: 150px">
        <template #header>
          <div class="flex items-center gap-2 text-gray-700 font-semibold">
            <i class="pi pi-clock text-orange-600"></i>
            <span>Last Access</span>
          </div>
        </template>
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

      <!-- Actions Column -->
      <Column style="min-width: 120px">
        <template #header>
          <div class="flex items-center gap-2 text-gray-700 font-semibold">
            <i class="pi pi-cog text-gray-600"></i>
            <span>Actions</span>
          </div>
        </template>
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
    <div
      v-if="selectedUsers.length > 0"
      class="selection-summary mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200"
    >
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-3">
          <i class="pi pi-info-circle text-blue-600"></i>
          <span class="text-blue-800 font-medium">
            {{ selectedUsers.length }} user{{
              selectedUsers.length > 1 ? 's' : ''
            }}
            selected
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

    <!-- User Permissions Dialog -->
    <Dialog
      v-model:visible="showPermissionsDialog"
      header="User Permissions"
      :modal="true"
      class="w-5/6 max-w-4xl"
    >
      <div class="p-4">
        <p class="text-gray-600 mb-4">
          Permissions for
          {{
            selectedPermissionUser?.fullName ||
            `${selectedPermissionUser?.firstName || ''} ${selectedPermissionUser?.lastName || ''}`.trim() ||
            selectedPermissionUser?.email
          }}
        </p>
        <div
          v-if="selectedPermissionUser?.permissions?.length"
          class="space-y-2"
        >
          <div
            v-for="permission in selectedPermissionUser.permissions"
            :key="permission.id"
            class="p-3 bg-gray-50 rounded"
          >
            <h4 class="font-medium">{{ permission.name }}</h4>
            <p class="text-sm text-gray-600">
              {{ permission.description || 'No description available' }}
            </p>
            <p class="text-xs text-gray-500 mt-1">
              Assigned: {{ formatDate(permission.updatedAt) }}
            </p>
            <div class="mt-2">
              <Tag
                :value="permission.isActive ? 'Active' : 'Inactive'"
                :severity="getPermissionStatusSeverity(permission.isActive)"
                class="text-xs"
              />
            </div>
          </div>
        </div>
        <div v-else class="text-gray-500">No Permission assigned</div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { FilterMatchMode } from 'primevue/api';
import { useApi } from '@/composables/useApi';
import type { PaginatedUsersResponseDto } from '@/types/admin';

// PrimeVue Components
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import Tag from 'primevue/tag';
import Avatar from 'primevue/avatar';
import Dialog from 'primevue/dialog';

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

// Toast, confirm, and API
const toast = useToast();
const confirm = useConfirm();
const { api } = useApi();

// Computed
const selectedUsers = computed({
  get: () => props.selectedUsers,
  set: (value) => emit('update:selectedUsers', value),
});

const filteredUsers = computed(() => {
  let result = users.value;

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (user) =>
        user.firstName?.toLowerCase().includes(query) ||
        user.lastName?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.roles?.some((role) => role.name.toLowerCase().includes(query)),
    );
  }

  // Apply role filter
  if (selectedRoleFilter.value) {
    result = result.filter((user) =>
      user.roles?.some((role) => role.name === selectedRoleFilter.value),
    );
  }

  // Apply status filter
  if (selectedStatusFilter.value) {
    if (selectedStatusFilter.value === 'active') {
      result = result.filter((user) => user.isActive);
    } else if (selectedStatusFilter.value === 'inactive') {
      result = result.filter((user) => !user.isActive);
    } else if (selectedStatusFilter.value === 'verified') {
      result = result.filter((user) => user.isVerified);
    } else if (selectedStatusFilter.value === 'unverified') {
      result = result.filter((user) => !user.isVerified);
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
  { label: 'Viewer', value: 'VIEWER' },
]);

const statusFilterOptions = ref([
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Verified', value: 'verified' },
  { label: 'Unverified', value: 'unverified' },
]);

// Lifecycle
onMounted(async () => {
  await loadUsers();
});

// Methods
const loadUsers = async () => {
  loading.value = true;
  try {
    // Fetch users list first
    const response = await api.get<PaginatedUsersResponseDto>('/admin/users', {
      params: {
        page: 1,
        limit: 100, // Load more users for the admin panel
        sortBy: 'createdAt',
        sortOrder: 'desc',
        includeProfile: true,
        includeStats: true,
      },
    });

    console.log('API Response:', response);

    // Validate response structure
    if (!response || !response.data) {
      throw new Error('Invalid response structure: missing data');
    }

    // Handle different possible response structures
    let userData;
    if (response.data.data) {
      // Standard paginated response
      userData = response.data.data;
    } else if (Array.isArray(response.data)) {
      // Direct array response
      userData = response.data;
    } else {
      throw new Error('Invalid response structure: data is not an array');
    }

    if (!Array.isArray(userData)) {
      throw new Error(`Expected array but got ${typeof userData}`);
    }

    // Fetch roles and permissions for each user individually
    const usersWithRoles = await Promise.allSettled(
      userData.map(async (user: any) => {
        try {
          // Fetch user roles using the dedicated endpoint
          const rolesResponse = await api.get(`/admin/users/${user.id}/roles`, {
            params: {
              activeOnly: true,
              includeHistory: false,
            },
          });

          // Fix roles data mapping - check different possible response structures
          let roles = [];
          if (rolesResponse?.data?.roles) {
            roles = rolesResponse.data.roles;
          } else if (rolesResponse?.roles) {
            roles = rolesResponse.roles;
          } else if (Array.isArray(rolesResponse?.data)) {
            roles = rolesResponse.data;
          } else if (Array.isArray(rolesResponse)) {
            roles = rolesResponse;
          }

          // Normalize role data structure
          roles = roles.map((role: any) => ({
            id: role.role.id,
            name: role.role.name,
            description: role.role.description,
            assignedAt: role.role.updatedAt || role.role.createdAt,
            isActive: role.role.isActive !== false,
          }));

          // Fetch user permissions count
          const permissionsResponse = await api.get(
            `/admin/permissions/user/${user.id}`,
          );

          let permissionCount = 0;
          let permissions = [];
          if (permissionsResponse?.data?.permissions) {
            permissionCount = permissionsResponse.data.permissions.length;
            permissions = permissionsResponse.data.permissions;
          } else if (permissionsResponse?.permissions) {
            permissionCount = permissionsResponse.permissions.length;
            permissions = permissionsResponse.permissions;
          } else if (Array.isArray(permissionsResponse?.data)) {
            permissionCount = permissionsResponse.data.length;
            permissions = permissionsResponse.data;
          } else if (Array.isArray(permissionsResponse)) {
            permissionCount = permissionsResponse.length;
            permissions = permissionsResponse;
          }

          return {
            id: user.id,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            fullName:
              user.fullName ||
              `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            email: user.email,
            isActive: user.isActive,
            isVerified: user.isVerified,
            lastLoginAt: user.lastLogin,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            phone: user.profile?.phone || null,
            timezone: user.profile?.timezone || 'UTC',
            language: user.profile?.language || 'en',
            roles: roles,
            permissions: permissions,
            permissionCount: permissionCount,
            loginCount: user.stats?.loginCount || 0,
            accountAge: user.stats?.accountAge || 0,
          };
        } catch (roleError) {
          console.warn(`Failed to fetch roles for user ${user.id}:`, roleError);

          // Return user data without roles if role fetch fails
          return {
            id: user.id,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            fullName:
              user.fullName ||
              `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            email: user.email,
            isActive: user.isActive,
            isVerified: user.isVerified,
            lastLoginAt: user.lastLogin,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            avatar: user.profile?.avatar || null,
            phone: user.profile?.phone || null,
            timezone: user.profile?.timezone || 'UTC',
            language: user.profile?.language || 'en',
            roles: [], // Empty roles array if fetch failed
            permissions: [], // Empty roles array if fetch failed
            permissionCount: 0, // Default to 0 if fetch failed
            loginCount: user.stats?.loginCount || 0,
            accountAge: user.stats?.accountAge || 0,
          };
        }
      }),
    );

    // Extract successful results and handle failures
    users.value = usersWithRoles.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(
          `Failed to process user ${userData[index]?.id}:`,
          result.reason,
        );
        // Return basic user data for failed cases
        const user = userData[index];
        return {
          id: user.id,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          fullName:
            user.fullName ||
            `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          email: user.email,
          isActive: user.isActive,
          isVerified: user.isVerified,
          lastLoginAt: user.lastLogin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          avatar: user.profile?.avatar || null,
          phone: user.profile?.phone || null,
          timezone: user.profile?.timezone || 'UTC',
          language: user.profile?.language || 'en',
          roles: [],
          permissions: [],
          permissionCount: 0, // Default to 0 if fetch failed
          loginCount: user.stats?.loginCount || 0,
          accountAge: user.stats?.accountAge || 0,
        };
      }
    });

    // Count how many users had their roles successfully loaded
    const successfulRoleFetches = usersWithRoles.filter(
      (result) => result.status === 'fulfilled',
    ).length;
    const failedRoleFetches = usersWithRoles.length - successfulRoleFetches;

    let detail = `Successfully loaded ${users.value.length} users`;
    if (failedRoleFetches > 0) {
      detail += ` (${failedRoleFetches} users had role fetch issues)`;
    }

    toast.add({
      severity: failedRoleFetches > 0 ? 'warn' : 'success',
      summary: 'Users Loaded',
      detail: detail,
      life: 3000,
    });
  } catch (error) {
    console.error('Error loading users:', error);

    // More detailed error information
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    toast.add({
      severity: 'error',
      summary: 'Error',
      detail:
        error instanceof Error
          ? error.message
          : 'Failed to load users from server',
      life: 5000,
    });

    // Set empty array as fallback
    users.value = [];
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
  const initials = (first + last).trim();
  return initials.toUpperCase() || user.email?.charAt(0).toUpperCase() || '?';
};

const getRoleChipClass = (roleName: string) => {
  const classes = {
    SUPER_ADMIN: 'bg-red-100 text-red-800',
    FUND_MANAGER: 'bg-blue-100 text-blue-800',
    COMPLIANCE_OFFICER: 'bg-purple-100 text-purple-800',
    ANALYST: 'bg-green-100 text-green-800',
    INVESTOR: 'bg-yellow-100 text-yellow-800',
    VIEWER: 'bg-gray-100 text-gray-800',
  };
  return classes[roleName] || 'bg-gray-100 text-gray-800';
};

const getPermissionStatusSeverity = (isActive: boolean) => {
  return isActive ? 'success' : 'danger';
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString();
};

const formatRelativeTime = (date: string) => {
  const now = new Date();
  const loginDate = new Date(date);
  const diffInHours = Math.floor(
    (now.getTime() - loginDate.getTime()) / (1000 * 60 * 60),
  );

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
      command: () => handleUserAction(user, 'view'),
    },
    {
      label: 'View Permissions',
      icon: 'pi pi-key',
      command: () => viewUserPermissions(user),
    },
    {
      label: 'Reset Password',
      icon: 'pi pi-lock',
      command: () => handleUserAction(user, 'reset-password'),
    },
    {
      separator: true,
    },
    {
      label: user.isActive ? 'Deactivate' : 'Activate',
      icon: user.isActive ? 'pi pi-ban' : 'pi pi-check',
      command: () => toggleUserStatus(user),
    },
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
  const userName =
    user.fullName ||
    `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
    user.email;
  const message = `Are you sure you want to ${action} ${userName}?`;

  confirm.require({
    message,
    header: `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
    icon: 'pi pi-exclamation-triangle',
    accept: async () => {
      try {
        // API call to toggle user status
        await api.put(`/admin/users/${user.id}/toggle-status`);

        user.isActive = !user.isActive;

        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: `User ${action}d successfully`,
          life: 3000,
        });
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to ${action} user`,
          life: 3000,
        });
      }
    },
  });
};

const resetUserPassword = (user: any) => {
  confirm.require({
    message: `Send password reset email to ${user.email}?`,
    header: 'Reset Password',
    icon: 'pi pi-key',
    accept: async () => {
      try {
        await api.post(`/admin/users/${user.id}/reset-password`);

        toast.add({
          severity: 'success',
          summary: 'Password Reset Sent',
          detail: `Reset email sent to ${user.email}`,
          life: 3000,
        });
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to send password reset email',
          life: 3000,
        });
      }
    },
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
    life: 3000,
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
  @apply bg-gradient-to-br from-slate-50 to-gray-100 text-gray-800 font-semibold border-b-2 border-gray-300;
  padding: 16px 12px;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  position: relative;
}

.user-data-table :deep(.p-datatable-thead > tr > th:hover) {
  @apply bg-gradient-to-br from-blue-50 to-slate-100;
  transition: all 0.2s ease-in-out;
}

.user-data-table :deep(.p-datatable-thead > tr > th:first-child) {
  border-top-left-radius: 8px;
}

.user-data-table :deep(.p-datatable-thead > tr > th:last-child) {
  border-top-right-radius: 8px;
}

.user-data-table :deep(.p-datatable-thead > tr > th .flex) {
  @apply justify-start items-center;
  font-weight: 600;
}

.user-data-table :deep(.p-datatable-thead > tr > th .pi) {
  @apply mr-2;
  font-size: 0.875rem;
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
