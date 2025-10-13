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
              <i class="pi pi-key text-blue-600"></i>
            </div>
            <div>
              <h1 class="admin-title">Role Management</h1>
              <p class="admin-subtitle">Create and configure user roles with specific permissions</p>
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
              label="Create Role"
              icon="pi pi-plus"
              class="p-button-primary admin-action-btn"
              @click="createRole"
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

          <!-- Role Management Content -->
          <div class="content-section">
            <RoleManagementPanel
              ref="roleManagementPanelComponent"
              @edit-role="editRole"
              @create-role="createRole"
              @assign-permissions="showPermissionDialog"
            />
          </div>
        </div>
      </main>
    </div>

    <!-- Permission Management Dialog -->
    <PermissionManagementDialog
      v-model:visible="permissionDialogVisible"
      :role="selectedRole"
      @permissions-updated="handlePermissionsUpdated"
    />

    <!-- Role Form Dialog (Create/Edit) -->
    <RoleFormDialog
      v-model:visible="roleFormDialogVisible"
      :role="selectedRoleForEdit"
      :existing-roles="[]"
      @role-created="handleRoleCreated"
      @role-updated="handleRoleUpdated"
      @role-deleted="handleRoleDeleted"
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

// Custom Components
import AdminNavigation from '@/components/admin/AdminNavigation.vue';
import RoleManagementPanel from '@/components/admin/RoleManagementPanel.vue';
import PermissionManagementDialog from '@/components/admin/PermissionManagementDialog.vue';
import RoleFormDialog from '@/components/admin/RoleFormDialog.vue';

// Composables
const router = useRouter();
const toast = useToast();

// Component state
const loading = ref(false);
const selectedRole = ref(null);
const roleManagementPanelComponent = ref(null);

// Dialog visibility
const permissionDialogVisible = ref(false);
const roleFormDialogVisible = ref(false);
const selectedRoleForEdit = ref(null);

// Breadcrumb
const breadcrumbItems = ref([
  { label: 'Dashboard', icon: 'pi pi-home', to: '/' },
  { label: 'Administration', icon: 'pi pi-shield', to: '/admin' },
  { label: 'Roles', icon: 'pi pi-key' }
]);

// Methods
const refreshData = async () => {
  loading.value = true;
  try {
    if (roleManagementPanelComponent.value?.refreshRoles) {
      await roleManagementPanelComponent.value.refreshRoles();
    }
    toast.add({
      severity: 'success',
      summary: 'Data Refreshed',
      detail: 'Role data has been refreshed successfully',
      life: 3000
    });
  } catch (error) {
    console.error('Failed to refresh data:', error);
    toast.add({
      severity: 'error',
      summary: 'Refresh Failed',
      detail: 'Failed to refresh role data',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

const editRole = (role: any) => {
  selectedRoleForEdit.value = role;
  roleFormDialogVisible.value = true;
};

const createRole = () => {
  selectedRoleForEdit.value = null;
  roleFormDialogVisible.value = true;
};

const showPermissionDialog = (role: any) => {
  selectedRole.value = role;
  permissionDialogVisible.value = true;
};

const handlePermissionsUpdated = (result: any) => {
  toast.add({
    severity: 'success',
    summary: 'Permissions Updated',
    detail: `Successfully updated permissions for ${result.roleName}`,
    life: 4000
  });
  permissionDialogVisible.value = false;
  selectedRole.value = null;
};

const handleRoleCreated = async (role: any) => {
  toast.add({
    severity: 'success',
    summary: 'Role Created',
    detail: `Role "${role.name}" has been created successfully`,
    life: 3000
  });
  roleFormDialogVisible.value = false;
  selectedRoleForEdit.value = null;

  if (roleManagementPanelComponent.value?.refreshRoles) {
    await roleManagementPanelComponent.value.refreshRoles();
  }
};

const handleRoleUpdated = async (role: any) => {
  toast.add({
    severity: 'success',
    summary: 'Role Updated',
    detail: `Role "${role.name}" has been updated successfully`,
    life: 3000
  });
  roleFormDialogVisible.value = false;
  selectedRoleForEdit.value = null;

  if (roleManagementPanelComponent.value?.refreshRoles) {
    await roleManagementPanelComponent.value.refreshRoles();
  }
};

const handleRoleDeleted = async (roleId: string) => {
  toast.add({
    severity: 'success',
    summary: 'Role Deleted',
    detail: 'Role has been deleted successfully',
    life: 3000
  });
  roleFormDialogVisible.value = false;
  selectedRoleForEdit.value = null;

  if (roleManagementPanelComponent.value?.refreshRoles) {
    await roleManagementPanelComponent.value.refreshRoles();
  }
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
