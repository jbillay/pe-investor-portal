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
              <i class="pi pi-shield text-blue-600"></i>
            </div>
            <div>
              <h1 class="admin-title">Administration Panel</h1>
              <p class="admin-subtitle">Manage users, roles, permissions, and system settings</p>
            </div>
          </div>
          <div class="admin-actions">
            <Button
              label="System Health"
              icon="pi pi-heart"
              class="p-button-outlined p-button-success admin-action-btn"
              @click="checkSystemHealth"
              severity="success"
            />
            <Button
              label="Audit Trail"
              icon="pi pi-history"
              class="p-button-outlined p-button-info admin-action-btn"
              @click="showAuditDialog = true"
              severity="info"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Main Admin Content Layout -->
    <div class="admin-layout">
      <!-- Enhanced Sidebar Navigation -->
      <aside class="admin-sidebar" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
        <div class="sidebar-header">
          <button
            @click="toggleSidebar"
            class="sidebar-toggle"
            :class="{ 'rotate-180': sidebarCollapsed }"
          >
            <i class="pi pi-angle-left"></i>
          </button>
          <h3 v-show="!sidebarCollapsed" class="sidebar-title">Admin Tools</h3>
        </div>

        <nav class="sidebar-nav">
          <div class="nav-section">
            <h4 v-show="!sidebarCollapsed" class="nav-section-title">User Management</h4>
            <div class="nav-items">
              <button
                @click="setActiveSection('users')"
                :class="['nav-item', { 'nav-item-active': activeSection === 'users' }]"
                :title="sidebarCollapsed ? 'User Management' : ''"
              >
                <i class="pi pi-users"></i>
                <span v-show="!sidebarCollapsed">Users</span>
              </button>
              <button
                @click="setActiveSection('roles')"
                :class="['nav-item', { 'nav-item-active': activeSection === 'roles' }]"
                :title="sidebarCollapsed ? 'Role Management' : ''"
              >
                <i class="pi pi-key"></i>
                <span v-show="!sidebarCollapsed">Roles</span>
              </button>
              <button
                @click="setActiveSection('permissions')"
                :class="['nav-item', { 'nav-item-active': activeSection === 'permissions' }]"
                :title="sidebarCollapsed ? 'Permission Matrix' : ''"
              >
                <i class="pi pi-lock"></i>
                <span v-show="!sidebarCollapsed">Permissions</span>
              </button>
            </div>
          </div>

          <div class="nav-section">
            <h4 v-show="!sidebarCollapsed" class="nav-section-title">System & Analytics</h4>
            <div class="nav-items">
              <button
                @click="setActiveSection('analytics')"
                :class="['nav-item', { 'nav-item-active': activeSection === 'analytics' }]"
                :title="sidebarCollapsed ? 'Analytics & Reports' : ''"
              >
                <i class="pi pi-chart-bar"></i>
                <span v-show="!sidebarCollapsed">Analytics</span>
              </button>
            </div>
          </div>
        </nav>

        <!-- Quick Actions -->
        <div v-show="!sidebarCollapsed" class="sidebar-footer">
          <div class="quick-actions">
            <h4 class="quick-actions-title">Quick Actions</h4>
            <button
              @click="showBulkDialog = true"
              :disabled="!selectedUsers.length"
              class="quick-action-btn"
            >
              <i class="pi pi-users"></i>
              <span>Bulk Actions ({{ selectedUsers.length }})</span>
            </button>
          </div>
        </div>
      </aside>

      <!-- Main Content Area -->
      <main class="admin-content" :class="{ 'content-expanded': sidebarCollapsed }">
        <div class="content-container">
          <!-- Section Headers -->
          <div class="section-header">
            <div class="section-title">
              <h2 class="section-heading">{{ currentSectionTitle }}</h2>
              <p class="section-description">{{ currentSectionDescription }}</p>
            </div>
            <div class="section-actions" v-if="currentSectionActions.length">
              <Button
                v-for="action in currentSectionActions"
                :key="action.key"
                :label="action.label"
                :icon="action.icon"
                :class="action.class"
                @click="action.handler"
                :disabled="action.disabled"
              />
            </div>
          </div>

          <!-- Dynamic Content Based on Active Section -->
          <div class="section-content">
            <transition name="section-transition" mode="out-in">
              <UserManagementPanel
                v-if="activeSection === 'users'"
                v-model:selectedUsers="selectedUsers"
                @edit-user="editUser"
                @assign-role="showRoleAssignmentDialog"
                @bulk-action="handleBulkAction"
              />
              <RoleManagementPanel
                v-else-if="activeSection === 'roles'"
                @edit-role="editRole"
                @create-role="createRole"
                @assign-permissions="showPermissionDialog"
              />
              <PermissionMatrixPanel
                v-else-if="activeSection === 'permissions'"
              />
              <SystemAnalyticsPanel
                v-else-if="activeSection === 'analytics'"
              />
            </transition>
          </div>
        </div>
      </main>
    </div>

        <!-- User Invite Dialog -->
    <Dialog
      v-model:visible="showInviteDialog"
      header="Invite New User"
      :modal="true"
      class="w-96"
    >
      <div class="p-4">
        <p class="text-gray-600 mb-4">
          User invitation functionality will be implemented here.
        </p>
        <div class="flex justify-end gap-2">
          <Button
            label="Cancel"
            class="p-button-outlined"
            @click="showInviteDialog = false"
          />
          <Button label="Send Invite" @click="handleUserInvited" />
        </div>
      </div>
    </Dialog>

    <!-- Role Assignment Dialog -->
    <RoleAssignmentDialog
      v-model:visible="roleAssignmentVisible"
      :user="selectedUser"
      @role-assigned="handleRoleAssigned"
    />

    <!-- Bulk Operations Dialog -->
    <BulkOperationsDialog
      v-model:visible="showBulkDialog"
      :selectedUsers="selectedUsers"
      @bulk-completed="handleBulkCompleted"
    />

    <!-- Permission Management Dialog -->
    <PermissionManagementDialog
      v-model:visible="permissionDialogVisible"
      :role="selectedRole"
      @permissions-updated="handlePermissionsUpdated"
    />

    <!-- Audit Trail Dialog -->
    <AuditTrailDialog
      v-model:visible="showAuditDialog"
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
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { useAuthStore } from '../../stores/auth';

// PrimeVue Components
import Breadcrumb from 'primevue/breadcrumb';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';

// Import all child components
import UserManagementPanel from '@/components/admin/UserManagementPanel.vue';
import RoleManagementPanel from '@/components/admin/RoleManagementPanel.vue';
import PermissionMatrixPanel from '@/components/admin/PermissionMatrixPanel.vue';
import SystemAnalyticsPanel from '@/components/admin/SystemAnalyticsPanel.vue';
import RoleAssignmentDialog from '@/components/admin/RoleAssignmentDialog.vue';
import BulkOperationsDialog from '@/components/admin/BulkOperationsDialog.vue';
import PermissionManagementDialog from '@/components/admin/PermissionManagementDialog.vue';
import AuditTrailDialog from '@/components/admin/AuditTrailDialog.vue';
import UserEditDialog from '@/components/admin/UserEditDialog.vue';

// Composables
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();
const authStore = useAuthStore();

// Component state
const activeSection = ref('users');
const sidebarCollapsed = ref(false);
const selectedUsers = ref([]);
const selectedUser = ref(null);
const selectedRole = ref(null);

// Dialog visibility
const showInviteDialog = ref(false);
const roleAssignmentVisible = ref(false);
const showBulkDialog = ref(false);
const permissionDialogVisible = ref(false);
const showAuditDialog = ref(false);
const userEditVisible = ref(false);

// Breadcrumb
const breadcrumbItems = ref([
  { label: 'Dashboard', icon: 'pi pi-home', to: '/' },
  { label: 'Administration', icon: 'pi pi-shield' }
]);

// Computed properties
const canAccessAdmin = computed(() => {
  // Check if user has SUPER_ADMIN role
  return authStore.user?.roles?.includes('SUPER_ADMIN') || false;
});

const currentSectionTitle = computed(() => {
  const titles = {
    users: 'User Management',
    roles: 'Role Management',
    permissions: 'Permission Matrix',
    analytics: 'System Analytics'
  };
  return titles[activeSection.value] || 'Administration';
});

const currentSectionDescription = computed(() => {
  const descriptions = {
    users: 'Manage user accounts, profiles, and access settings',
    roles: 'Create and configure user roles with specific permissions',
    permissions: 'Visualize and manage role-permission relationships',
    analytics: 'Monitor system performance and security metrics'
  };
  return descriptions[activeSection.value] || '';
});

const currentSectionActions = computed(() => {
  const actions = {
    users: [
      {
        key: 'invite',
        label: 'Invite User',
        icon: 'pi pi-user-plus',
        class: 'p-button-primary',
        handler: () => { showInviteDialog.value = true },
        disabled: false
      },
      {
        key: 'export',
        label: 'Export',
        icon: 'pi pi-download',
        class: 'p-button-outlined',
        handler: () => console.log('Export users'),
        disabled: false
      }
    ],
    roles: [
      {
        key: 'create',
        label: 'Create Role',
        icon: 'pi pi-plus',
        class: 'p-button-primary',
        handler: createRole,
        disabled: false
      },
      {
        key: 'import',
        label: 'Import',
        icon: 'pi pi-upload',
        class: 'p-button-outlined',
        handler: () => console.log('Import roles'),
        disabled: false
      }
    ],
    permissions: [
      {
        key: 'export',
        label: 'Export Matrix',
        icon: 'pi pi-download',
        class: 'p-button-outlined',
        handler: () => console.log('Export matrix'),
        disabled: false
      }
    ],
    analytics: [
      {
        key: 'refresh',
        label: 'Refresh',
        icon: 'pi pi-refresh',
        class: 'p-button-outlined',
        handler: () => console.log('Refresh analytics'),
        disabled: false
      },
      {
        key: 'export',
        label: 'Export Report',
        icon: 'pi pi-file-export',
        class: 'p-button-outlined',
        handler: () => console.log('Export report'),
        disabled: false
      }
    ]
  };
  return actions[activeSection.value] || [];
});

// Navigation guard
onMounted(async () => {
  if (!canAccessAdmin.value) {
    toast.add({
      severity: 'error',
      summary: 'Access Denied',
      detail: 'You do not have permission to access this area.',
      life: 5000
    });
    router.push('/dashboard');
    return;
  }

  // Initialize admin dashboard
  await initializeAdminDashboard();
});

// Methods
const initializeAdminDashboard = async () => {
  try {
    // Load initial data, system health, etc.
    await Promise.all([
      checkSystemHealth(),
      loadRecentActivity()
    ]);
  } catch (error) {
    console.error('Failed to initialize admin dashboard:', error);
    toast.add({
      severity: 'error',
      summary: 'Initialization Error',
      detail: 'Failed to load admin dashboard data.',
      life: 5000
    });
  }
};

const editUser = (user: any) => {
  selectedUser.value = user;
  userEditVisible.value = true;
};

const showRoleAssignmentDialog = (user: any) => {
  selectedUser.value = user;
  roleAssignmentVisible.value = true;
};

const editRole = (role: any) => {
  selectedRole.value = role;
  permissionDialogVisible.value = true;
};

const createRole = () => {
  selectedRole.value = null;
  permissionDialogVisible.value = true;
};

const showPermissionDialog = (role: any) => {
  selectedRole.value = role;
  permissionDialogVisible.value = true;
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

  // Refresh data
  roleAssignmentVisible.value = false;
  selectedUser.value = null;
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
      detail: `${result.failures.length} operations failed. Check audit log for details.`,
      life: 6000
    });
  }

  showBulkDialog.value = false;
  selectedUsers.value = [];
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

const checkSystemHealth = async () => {
  try {
    // API call to check system health - health endpoint is excluded from /api prefix
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5173';
    const healthUrl = `${baseUrl}/health`;

    const response = await fetch(healthUrl, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const health = await response.json();
      console.log('System health:', health);
      toast.add({
        severity: 'success',
        summary: 'System Health Check',
        detail: `System is running normally (${health.service} v${health.version})`,
        life: 3000
      });
    } else {
      throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Failed to check system health:', error);

    let errorMessage = 'Unable to verify system health';
    if (error instanceof Error) {
      errorMessage = error.message.includes('fetch')
        ? 'Cannot connect to backend server'
        : error.message;
    }

    toast.add({
      severity: 'error',
      summary: 'Health Check Failed',
      detail: errorMessage,
      life: 5000
    });
  }
};

const loadRecentActivity = async () => {
  try {
    // Load recent admin activity
    // This would be implemented based on your audit system
  } catch (error) {
    console.error('Failed to load recent activity:', error);
  }
};

// New methods for enhanced navigation
const setActiveSection = (section: string) => {
  activeSection.value = section;
};

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value;
};

// Auto-collapse sidebar on mobile
const handleResize = () => {
  if (window.innerWidth < 768) {
    sidebarCollapsed.value = true;
  }
};

// Add resize listener on mount
onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleResize);
    handleResize(); // Check initial size
  }
});
</script>

<style scoped>
/* Main Layout */
.admin-dashboard {
  @apply min-h-screen bg-gray-50;
}

/* Enhanced Header */
.admin-header {
  @apply bg-white border-b border-gray-200 shadow-sm mb-6;
}

.admin-header-content {
  @apply max-w-7xl mx-auto px-6 py-6;
}

.admin-breadcrumb {
  @apply mb-4;
}

.admin-breadcrumb-nav :deep(.p-breadcrumb) {
  @apply bg-transparent border-none p-0;
}

.admin-breadcrumb-nav :deep(.p-breadcrumb-list) {
  @apply text-sm text-gray-500;
}

.admin-title-section {
  @apply flex justify-between items-start;
}

.admin-title-content {
  @apply flex items-start gap-4;
}

.admin-icon {
  @apply w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center;
}

.admin-icon i {
  @apply text-xl;
}

.admin-title {
  @apply text-3xl font-bold text-gray-900 mb-2;
}

.admin-subtitle {
  @apply text-gray-600 max-w-lg;
}

.admin-actions {
  @apply flex gap-3;
}

.admin-action-btn {
  @apply transition-all duration-200 hover:shadow-md font-medium;
  padding: 10px 16px;
  border-radius: 8px;
}

.admin-action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

/* Layout - Sidebar + Content */
.admin-layout {
  @apply flex min-h-screen bg-gray-50;
}

/* Enhanced Sidebar */
.admin-sidebar {
  @apply w-72 bg-white border-r border-gray-200 shadow-sm transition-all duration-300 ease-in-out;
}

.admin-sidebar.sidebar-collapsed {
  @apply w-16;
}

.sidebar-header {
  @apply p-6 border-b border-gray-200 flex items-center justify-between;
}

.sidebar-toggle {
  @apply p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 text-gray-500 hover:text-gray-700;
}

.sidebar-toggle.rotate-180 {
  transform: rotate(180deg);
}

.sidebar-title {
  @apply text-lg font-semibold text-gray-900;
}

.sidebar-nav {
  @apply flex-1 px-4 py-6 space-y-6;
}

.nav-section {
  @apply space-y-3;
}

.nav-section-title {
  @apply text-xs font-semibold text-gray-500 uppercase tracking-wider px-3;
}

.nav-items {
  @apply space-y-1;
}

.nav-item {
  @apply w-full flex items-center gap-3 px-3 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 cursor-pointer border border-transparent;
  min-height: 44px;
}

.nav-item:hover {
  @apply bg-gray-50 border-gray-200 shadow-sm;
  transform: translateX(2px);
}

.nav-item i {
  @apply flex-shrink-0 w-5 h-5 text-gray-400 transition-colors duration-200;
}

.nav-item-active {
  @apply bg-blue-50 text-blue-700 border-blue-200 shadow-sm;
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
}

.nav-item-active:hover {
  @apply bg-blue-50 border-blue-200;
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
}

.nav-item-active i {
  @apply text-blue-600;
}

.sidebar-footer {
  @apply p-4 border-t border-gray-200;
}

.quick-actions {
  @apply space-y-3;
}

.quick-actions-title {
  @apply text-xs font-semibold text-gray-500 uppercase tracking-wider;
}

.quick-action-btn {
  @apply w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-transparent;
  min-height: 40px;
}

.quick-action-btn:hover:not(:disabled) {
  @apply bg-gray-50 border-gray-200 shadow-sm;
  transform: translateX(1px);
}

.quick-action-btn i {
  @apply w-4 h-4 text-gray-500 transition-colors duration-200;
}

.quick-action-btn:hover:not(:disabled) i {
  @apply text-gray-700;
}

/* Main Content */
.admin-content {
  @apply flex-1 max-w-full overflow-hidden;
}

.admin-content.content-expanded {
  @apply ml-0;
}

.content-container {
  @apply h-full max-w-7xl mx-auto px-6 py-6;
}

/* Section Headers */
.section-header {
  @apply bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6;
}

.section-title {
  @apply flex-1;
}

.section-heading {
  @apply text-2xl font-bold text-gray-900 mb-2;
}

.section-description {
  @apply text-gray-600;
}

.section-actions {
  @apply flex gap-3;
}

/* Content Area */
.section-content {
  @apply bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden;
}

/* Transitions */
.section-transition-enter-active,
.section-transition-leave-active {
  @apply transition-all duration-300 ease-in-out;
}

.section-transition-enter-from {
  @apply opacity-0 transform translate-x-4;
}

.section-transition-leave-to {
  @apply opacity-0 transform -translate-x-4;
}

/* Enhanced Button Styles */
.p-button {
  @apply transition-all duration-200 ease-in-out font-medium;
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.p-button:hover {
  @apply shadow-md transform -translate-y-0.5;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.p-button:active {
  @apply transform translate-y-0;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.p-button:focus {
  @apply ring-2 ring-offset-2;
  outline: none;
}

/* Primary Button */
.p-button:not(.p-button-outlined):not(.p-button-text) {
  @apply bg-blue-600 text-white border-blue-600;
}

.p-button:not(.p-button-outlined):not(.p-button-text):hover {
  @apply bg-blue-700 border-blue-700;
}

.p-button:not(.p-button-outlined):not(.p-button-text):focus {
  @apply ring-blue-500;
}

/* Outlined Buttons */
.p-button.p-button-outlined {
  @apply border-2 bg-white text-gray-700 hover:bg-gray-50;
  border-color: #d1d5db;
}

.p-button.p-button-outlined:hover {
  @apply border-gray-300 bg-gray-50;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.p-button.p-button-outlined:focus {
  @apply ring-gray-500;
}

/* Success Variant */
.p-button.p-button-outlined.p-button-success,
.p-button[severity="success"] {
  @apply border-green-500 text-green-600 bg-white hover:bg-green-50;
}

.p-button.p-button-outlined.p-button-success:hover,
.p-button[severity="success"]:hover {
  @apply border-green-600 bg-green-50;
}

.p-button.p-button-outlined.p-button-success:focus,
.p-button[severity="success"]:focus {
  @apply ring-green-500;
}

/* Info Variant */
.p-button.p-button-outlined.p-button-info,
.p-button[severity="info"] {
  @apply border-blue-500 text-blue-600 bg-white hover:bg-blue-50;
}

.p-button.p-button-outlined.p-button-info:hover,
.p-button[severity="info"]:hover {
  @apply border-blue-600 bg-blue-50;
}

.p-button.p-button-outlined.p-button-info:focus,
.p-button[severity="info"]:focus {
  @apply ring-blue-500;
}

/* Warning Variant */
.p-button.p-button-outlined.p-button-warning,
.p-button[severity="warning"] {
  @apply border-yellow-500 text-yellow-600 bg-white hover:bg-yellow-50;
}

.p-button.p-button-outlined.p-button-warning:hover,
.p-button[severity="warning"]:hover {
  @apply border-yellow-600 bg-yellow-50;
}

/* Danger Variant */
.p-button.p-button-outlined.p-button-danger,
.p-button[severity="danger"] {
  @apply border-red-500 text-red-600 bg-white hover:bg-red-50;
}

.p-button.p-button-outlined.p-button-danger:hover,
.p-button[severity="danger"]:hover {
  @apply border-red-600 bg-red-50;
}

/* Small Buttons */
.p-button.p-button-sm {
  padding: 6px 12px;
  font-size: 12px;
}

/* Large Buttons */
.p-button.p-button-lg {
  padding: 12px 20px;
  font-size: 16px;
}

/* Disabled State */
.p-button:disabled {
  @apply opacity-50 cursor-not-allowed transform-none shadow-none;
}

.p-button:disabled:hover {
  @apply transform-none shadow-none;
}

/* Icon-only buttons */
.p-button.p-button-icon-only {
  @apply w-10 h-10 p-0 flex items-center justify-center;
}

/* Button Groups */
.p-button-group .p-button {
  border-radius: 0;
}

.p-button-group .p-button:first-child {
  border-top-left-radius: 8px;
  border-bottom-left-radius: 8px;
}

.p-button-group .p-button:last-child {
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .admin-layout {
    @apply relative;
  }

  .admin-sidebar {
    @apply absolute left-0 top-0 z-20 h-full;
  }

  .admin-sidebar.sidebar-collapsed {
    @apply w-16;
  }

  .admin-content {
    @apply ml-16;
  }

  .admin-content.content-expanded {
    @apply ml-16;
  }
}

@media (max-width: 768px) {
  .admin-header-content {
    @apply px-4 py-4;
  }

  .admin-title-section {
    @apply flex-col gap-4 items-start;
  }

  .admin-title {
    @apply text-2xl;
  }

  .admin-actions {
    @apply flex-wrap;
  }

  .content-container {
    @apply px-4 py-4;
  }

  .section-header {
    @apply p-4;
  }

  .section-header .section-title {
    @apply mb-4;
  }

  .section-actions {
    @apply flex-wrap gap-2;
  }

  .admin-sidebar {
    @apply fixed inset-y-0 left-0 z-30;
  }

  .admin-content {
    @apply ml-0;
  }
}

@media (max-width: 640px) {
  .admin-actions {
    @apply w-full;
  }

  .admin-action-btn {
    @apply text-sm px-3 py-2;
  }

  .section-actions {
    @apply w-full;
  }

  .section-actions .p-button {
    @apply flex-1 text-sm;
  }
}

/* Dark mode support (future enhancement) */
@media (prefers-color-scheme: dark) {
  .admin-dashboard {
    @apply bg-gray-900;
  }

  .admin-header {
    @apply bg-gray-800 border-gray-700;
  }

  .admin-sidebar {
    @apply bg-gray-800 border-gray-700;
  }

  .section-header,
  .section-content {
    @apply bg-gray-800 border-gray-700;
  }
}
</style>
