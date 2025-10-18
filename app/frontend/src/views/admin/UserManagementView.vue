<template>
  <div class="admin-dashboard">
    <!-- Enhanced Header -->
    <div class="admin-header">
      <div class="admin-header-content">
        <div class="admin-breadcrumb">
          <Breadcrumb :model="breadcrumbItems" class="admin-breadcrumb-nav" />
        </div>
        <div class="admin-title-section">
          <div class="admin-title-content">
            <div class="admin-icon">
              <i class="pi pi-users text-blue-600"></i>
            </div>
            <div>
              <h1 class="admin-title">User Management</h1>
              <p class="admin-subtitle">Manage user accounts, profiles, and access settings</p>
            </div>
          </div>
          <div class="admin-actions">
            <Button
              label="Refresh Data"
              icon="pi pi-refresh"
              class="p-button-outlined p-button-secondary admin-action-btn"
              @click="refreshData"
              :loading="loading"
              severity="secondary"
            />
            <Button
              label="Create User"
              icon="pi pi-user-plus"
              class="p-button-primary admin-action-btn"
              @click="showCreateUserDialog = true"
              severity="primary"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Main Admin Content -->
    <div class="admin-layout">
      <main class="admin-content content-expanded">
        <div class="content-container">
          <!-- Admin Navigation -->
          <AdminNavigation />

          <!-- User Management Content -->
          <div class="content-section">
            <UserManagementPanel
              ref="userManagementPanelComponent"
              v-model:selectedUsers="selectedUsers"
              @edit-user="editUser"
              @assign-role="showRoleManagementDialog"
              @bulk-action="handleBulkAction"
            />
          </div>
        </div>
      </main>
    </div>

    <!-- User Create Dialog -->
    <UserCreateDialog
      v-model:visible="showCreateUserDialog"
      @user-created="handleUserCreated"
    />

    <!-- Role Management Dialog -->
    <RoleManagementDialog
      v-model:visible="roleAssignmentVisible"
      :user="selectedUser"
      @role-assigned="handleRoleAssigned"
      @role-revoked="handleRoleRevoked"
      @user-role-updated="handleUserRoleUpdated"
    />

    <!-- Bulk Operations Dialog -->
    <BulkOperationsDialog
      v-model:visible="showBulkDialog"
      :selectedUsers="selectedUsers"
      @bulk-completed="handleBulkCompleted"
    />

    <!-- User Edit Dialog -->
    <UserEditDialog
      v-model:visible="userEditVisible"
      :user="selectedUser"
      @user-updated="handleUserUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';

// PrimeVue Components
import Breadcrumb from 'primevue/breadcrumb';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';

// Custom Components
import AdminNavigation from '@/components/admin/AdminNavigation.vue';
import UserManagementPanel from '@/components/admin/UserManagementPanel.vue';
import RoleManagementDialog from '@/components/admin/RoleManagementDialog.vue';
import BulkOperationsDialog from '@/components/admin/BulkOperationsDialog.vue';
import UserEditDialog from '@/components/admin/UserEditDialog.vue';
import UserCreateDialog from '@/components/admin/UserCreateDialog.vue';

interface UserWithRoles {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  name?: string;
  roles?: Array<{
    id?: string;
    name: string;
    description?: string;
  }>;
}

// Composables
const router = useRouter();
const toast = useToast();

// Component state
const loading = ref(false);
const selectedUsers = ref([]);
const selectedUser = ref(null);
const userManagementPanelComponent = ref(null);

// Dialog visibility
const showCreateUserDialog = ref(false);
const roleAssignmentVisible = ref(false);
const showBulkDialog = ref(false);
const userEditVisible = ref(false);

// Breadcrumb
const breadcrumbItems = ref([
  { label: 'Dashboard', icon: 'pi pi-home', to: '/' },
  { label: 'Administration', icon: 'pi pi-shield', to: '/admin' },
  { label: 'Users', icon: 'pi pi-users' }
]);

// Methods
const refreshData = async () => {
  loading.value = true;
  try {
    if (userManagementPanelComponent.value?.refreshData) {
      await userManagementPanelComponent.value.refreshData();
    }
    toast.add({
      severity: 'success',
      summary: 'Data Refreshed',
      detail: 'User data has been refreshed successfully',
      life: 3000
    });
  } catch (error) {
    console.error('Failed to refresh data:', error);
    toast.add({
      severity: 'error',
      summary: 'Refresh Failed',
      detail: 'Failed to refresh user data',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

const handleUserCreated = (result: any) => {
  toast.add({
    severity: 'success',
    summary: 'User Created',
    detail: `${result.firstName} ${result.lastName} has been created successfully`,
    life: 4000
  });

  // Refresh user list
  if (userManagementPanelComponent.value?.refreshData) {
    userManagementPanelComponent.value.refreshData();
  }

  showCreateUserDialog.value = false;
};

const editUser = (user: any) => {
  selectedUser.value = user;
  userEditVisible.value = true;
};

const showRoleManagementDialog = (user: UserWithRoles) => {
  selectedUser.value = user;
  roleAssignmentVisible.value = true;
};

const handleBulkAction = (action: string) => {
  if (selectedUsers.value.length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'No Selection',
      detail: 'Please select users to perform bulk actions.',
      life: 3000
    });
    return;
  }
  showBulkDialog.value = true;
};

const handleRoleAssigned = (result: any) => {
  toast.add({
    severity: 'success',
    summary: 'Role Assigned',
    detail: `Successfully assigned ${result.roleName} to ${result.userName}`,
    life: 4000
  });
  roleAssignmentVisible.value = false;
  selectedUser.value = null;
};

const handleRoleRevoked = (result: any) => {
  toast.add({
    severity: 'success',
    summary: 'Roles Revoked',
    detail: `Successfully removed ${result.revokedRoles.length} role(s) from ${result.userName}`,
    life: 4000
  });
  roleAssignmentVisible.value = false;
  selectedUser.value = null;
};

const handleUserRoleUpdated = (data: { userId: string; operation: 'assign' | 'remove'; role: any; updatedUser: any }) => {
  if (userManagementPanelComponent.value?.updateUserRole) {
    userManagementPanelComponent.value.updateUserRole(data.userId, data.operation, data.role);
  }
};

const handleBulkCompleted = (result: any) => {
  toast.add({
    severity: 'success',
    summary: 'Bulk Operation Complete',
    detail: `Successfully processed ${result.successCount} users`,
    life: 4000
  });

  if (result.failures?.length > 0) {
    toast.add({
      severity: 'warn',
      summary: 'Some Operations Failed',
      detail: `${result.failures.length} operations failed.`,
      life: 6000
    });
  }

  showBulkDialog.value = false;
  selectedUsers.value = [];
};

const handleUserUpdated = (result: any) => {
  toast.add({
    severity: 'success',
    summary: 'User Updated',
    detail: `Successfully updated user ${result.userName}`,
    life: 4000
  });
  userEditVisible.value = false;
  selectedUser.value = null;
};

onMounted(async () => {
  // Initialize data if needed
});
</script>

<style scoped>
.admin-dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #f0f2f5 100%);
}

.admin-header {
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.admin-header-content {
  max-width: 1600px;
  margin: 0 auto;
  padding: 1.5rem 2rem;
}

.admin-breadcrumb {
  margin-bottom: 1rem;
}

.admin-breadcrumb-nav {
  background: transparent;
  border: none;
  padding: 0;
}

.admin-breadcrumb-nav :deep(.p-breadcrumb-list) {
  color: white;
}

.admin-title-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.admin-title-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.admin-icon {
  width: 4rem;
  height: 4rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: white;
}

.admin-title {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin: 0;
}

.admin-subtitle {
  color: rgba(255, 255, 255, 0.9);
  margin: 0.25rem 0 0;
}

.admin-actions {
  display: flex;
  gap: 1rem;
}

.admin-action-btn {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  color: white;
}

.admin-action-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.4);
}

.admin-layout {
  max-width: 1600px;
  margin: 0 auto;
  padding: 2rem;
}

.admin-content {
  width: 100%;
}

.content-container {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 2rem;
}

.content-section {
  padding: 1rem 0;
}
</style>
