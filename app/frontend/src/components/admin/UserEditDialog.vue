<template>
  <Dialog
    v-model:visible="dialogVisible"
    :modal="true"
    :draggable="false"
    :closable="true"
    :style="{ width: '90vw', maxWidth: '1000px', height: '90vh' }"
    class="user-edit-dialog"
    @show="onDialogShow"
    @hide="onDialogHide"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
          <i class="pi pi-user-edit text-white text-lg"></i>
        </div>
        <div>
          <h3 class="text-xl font-semibold text-gray-900 m-0">
            {{ isNewUser ? 'Create New User' : 'Edit User' }}
          </h3>
          <p class="text-sm text-gray-600 m-0 mt-1">
            {{ isNewUser ? 'Create a new user account and assign roles' : `Manage ${user?.name || 'user'}'s profile and permissions` }}
          </p>
        </div>
      </div>
    </template>

    <div class="user-edit-content h-full overflow-auto custom-scrollbar">
      <!-- Tab Navigation -->
      <TabView v-model:activeIndex="activeTabIndex" class="user-edit-tabs">
        <!-- Basic Information Tab -->
        <TabPanel header="Basic Information" class="p-0">
          <div class="tab-content p-6">
            <!-- User Avatar Section -->
            <div class="avatar-section mb-6 text-center">
              <Avatar
                :label="userInitials"
                size="xlarge"
                shape="circle"
                class="user-avatar shadow-lg bg-gradient-to-br from-blue-500 to-cyan-600 text-white font-semibold"
              />
            </div>

            <!-- Personal Information Form -->
            <div class="form-grid grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="form-field">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  First Name <span class="text-red-500">*</span>
                </label>
                <InputText
                  v-model="formData.firstName"
                  placeholder="Enter first name"
                  class="w-full"
                  :class="{ 'p-invalid': !formData.firstName && showValidationErrors }"
                />
                <small v-if="!formData.firstName && showValidationErrors" class="p-error">
                  First name is required
                </small>
              </div>

              <div class="form-field">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Last Name <span class="text-red-500">*</span>
                </label>
                <InputText
                  v-model="formData.lastName"
                  placeholder="Enter last name"
                  class="w-full"
                  :class="{ 'p-invalid': !formData.lastName && showValidationErrors }"
                />
                <small v-if="!formData.lastName && showValidationErrors" class="p-error">
                  Last name is required
                </small>
              </div>

              <div class="form-field">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Email Address <span class="text-red-500">*</span>
                </label>
                <InputText
                  v-model="formData.email"
                  placeholder="Enter email address"
                  type="email"
                  class="w-full"
                  :class="{ 'p-invalid': (!formData.email || !isValidEmail(formData.email)) && showValidationErrors }"
                />
                <small v-if="!formData.email && showValidationErrors" class="p-error">
                  Email address is required
                </small>
                <small v-else-if="formData.email && !isValidEmail(formData.email) && showValidationErrors" class="p-error">
                  Please enter a valid email address
                </small>
              </div>


              <div class="form-field">
                <label class="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                <Dropdown
                  v-model="formData.timezone"
                  :options="timezoneOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select timezone"
                  class="w-full"
                />
              </div>

              <div class="form-field">
                <label class="block text-sm font-medium text-gray-700 mb-2">Language</label>
                <Dropdown
                  v-model="formData.language"
                  :options="languageOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select language"
                  class="w-full"
                />
              </div>

              <div class="form-field">
                <label class="block text-sm font-medium text-gray-700 mb-2">Account Status</label>
                <div class="flex flex-col gap-4">
                  <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                    <div class="flex items-center gap-2">
                      <i class="pi pi-user text-blue-600"></i>
                      <span class="text-sm font-medium">Active Status</span>
                    </div>
                    <InputSwitch v-model="formData.isActive" />
                  </div>
                  <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                    <div class="flex items-center gap-2">
                      <i class="pi pi-shield text-green-600"></i>
                      <span class="text-sm font-medium">Verification Status</span>
                    </div>
                    <InputSwitch v-model="formData.isVerified" />
                  </div>
                </div>
              </div>

              <!-- User Statistics (Read-only indicators) -->
              <div class="form-field">
                <label class="block text-sm font-medium text-gray-700 mb-2">User Statistics</label>
                <div class="grid grid-cols-2 gap-4">
                  <div class="stat-card bg-gray-50 rounded-lg p-3 border">
                    <div class="text-2xl font-bold text-blue-600">{{ formData.loginCount }}</div>
                    <div class="text-sm text-gray-600">Total Logins</div>
                  </div>
                  <div class="stat-card bg-gray-50 rounded-lg p-3 border">
                    <div class="text-2xl font-bold text-green-600">{{ formData.accountAge }}</div>
                    <div class="text-sm text-gray-600">Days Active</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabPanel>

        <!-- Roles & Permissions Tab -->
        <TabPanel header="Roles & Permissions" class="p-0">
          <div class="tab-content p-6">
            <!-- Current Roles Section -->
            <div class="current-roles-section mb-6">
              <h4 class="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <i class="pi pi-shield text-blue-600"></i>
                Current Roles
              </h4>

              <div class="roles-list">
                <div v-if="formData.roles && formData.roles.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div
                    v-for="role in formData.roles"
                    :key="role.id"
                    class="role-card p-4 bg-blue-50 rounded-lg border border-blue-200"
                  >
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-3">
                        <div
                          class="role-icon w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                          :style="{ backgroundColor: getRoleColor(role.name) }"
                        >
                          {{ getRoleInitials(role.name) }}
                        </div>
                        <div>
                          <div class="font-semibold text-gray-900">{{ role.name }}</div>
                          <div class="text-sm text-gray-600">{{ role.description }}</div>
                        </div>
                      </div>
                      <Button
                        icon="pi pi-times"
                        class="p-button-rounded p-button-sm p-button-text p-button-danger"
                        @click="removeRole(role)"
                        v-tooltip.top="'Remove Role'"
                      />
                    </div>
                  </div>
                </div>

                <div v-else class="empty-roles text-center py-8 text-gray-500">
                  <i class="pi pi-shield text-4xl mb-4"></i>
                  <p class="text-lg mb-2">No roles assigned</p>
                  <p class="text-sm">Add roles to grant permissions to this user</p>
                </div>
              </div>
            </div>

            <!-- Add Role Section -->
            <div class="add-role-section mb-6">
              <h4 class="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <i class="pi pi-plus text-green-600"></i>
                Add New Role
              </h4>

              <div class="add-role-form grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Select Role</label>
                  <Dropdown
                    v-model="newRole.roleId"
                    :options="availableRoles"
                    optionLabel="name"
                    optionValue="id"
                    placeholder="Choose a role"
                    class="w-full"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Assignment Reason</label>
                  <InputText
                    v-model="newRole.reason"
                    placeholder="Reason for assignment"
                    class="w-full"
                  />
                </div>

                <div>
                  <Button
                    label="Add Role"
                    icon="pi pi-plus"
                    class="p-button-primary w-full"
                    @click="addRole"
                    :disabled="!newRole.roleId || !newRole.reason"
                  />
                </div>
              </div>
            </div>

            <!-- Effective Permissions Section -->
            <div class="permissions-section">
              <h4 class="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <i class="pi pi-key text-purple-600"></i>
                Effective Permissions
              </h4>

              <div class="permissions-grid">
                <div v-if="effectivePermissions.length > 0" class="permissions-list max-h-60 overflow-y-auto custom-scrollbar border rounded-lg p-4 bg-gray-50">
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    <div
                      v-for="permission in effectivePermissions"
                      :key="permission"
                      class="permission-chip flex items-center gap-2 px-3 py-1 bg-white rounded-md border text-sm"
                    >
                      <i class="pi pi-check text-green-600 text-xs"></i>
                      <span class="text-gray-700">{{ permission }}</span>
                    </div>
                  </div>
                </div>

                <div v-else class="empty-permissions text-center py-8 text-gray-500">
                  <i class="pi pi-key text-4xl mb-4"></i>
                  <p class="text-lg mb-2">No permissions</p>
                  <p class="text-sm">User will receive permissions when roles are assigned</p>
                </div>
              </div>
            </div>
          </div>
        </TabPanel>

        <!-- Activity Log Tab -->
        <TabPanel header="Activity Log" class="p-0">
          <div class="tab-content p-6">
            <div class="activity-header mb-4 flex items-center justify-between">
              <h4 class="text-lg font-medium text-gray-900 flex items-center gap-2">
                <i class="pi pi-history text-indigo-600"></i>
                User Activity Log
              </h4>
              <Button
                label="View Full Audit Trail"
                icon="pi pi-external-link"
                class="p-button-outlined p-button-sm"
                @click="viewFullAuditTrail"
              />
            </div>

            <div class="activity-timeline">
              <div v-if="userActivities.length > 0" class="space-y-4">
                <div
                  v-for="activity in userActivities"
                  :key="activity.id"
                  class="activity-item flex items-start gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200"
                >
                  <div
                    class="activity-icon w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    :class="getActivityIconClass(activity.type)"
                  >
                    <i :class="getActivityIcon(activity.type)" class="text-white"></i>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="font-medium text-gray-900">{{ activity.title }}</div>
                    <div class="text-sm text-gray-600 mt-1">{{ activity.description }}</div>
                    <div class="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>{{ activity.performedBy }}</span>
                      <span>{{ formatActivityTime(activity.timestamp) }}</span>
                      <Tag
                        :value="activity.type"
                        :severity="getActivitySeverity(activity.type)"
                        class="text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="empty-activity text-center py-8 text-gray-500">
                <i class="pi pi-history text-4xl mb-4"></i>
                <p class="text-lg mb-2">No activity recorded</p>
                <p class="text-sm">User activity will appear here once they start using the system</p>
              </div>
            </div>
          </div>
        </TabPanel>

        <!-- Security Settings Tab -->
        <TabPanel header="Security" class="p-0">
          <div class="tab-content p-6">
            <!-- Account Security Section -->
            <div class="security-section mb-6">
              <h4 class="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <i class="pi pi-lock text-red-600"></i>
                Account Security
              </h4>

              <div class="security-options space-y-4">
                <div class="security-option flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                  <div>
                    <div class="font-medium text-gray-900">Force Password Reset</div>
                    <div class="text-sm text-gray-600">User will be required to change password on next login</div>
                  </div>
                  <Button
                    label="Force Reset"
                    icon="pi pi-key"
                    class="p-button-outlined p-button-sm"
                    @click="forcePasswordReset"
                  />
                </div>

                <div class="security-option flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                  <div>
                    <div class="font-medium text-gray-900">Multi-Factor Authentication</div>
                    <div class="text-sm text-gray-600">Require MFA for enhanced security</div>
                  </div>
                  <InputSwitch
                    v-model="formData.mfaEnabled"
                    @change="toggleMFA"
                  />
                </div>

                <div class="security-option flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                  <div>
                    <div class="font-medium text-gray-900">Account Locked</div>
                    <div class="text-sm text-gray-600">Temporarily suspend user account access</div>
                  </div>
                  <InputSwitch
                    v-model="formData.isLocked"
                    @change="toggleAccountLock"
                  />
                </div>
              </div>
            </div>

            <!-- Session Management -->
            <div class="session-section">
              <h4 class="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <i class="pi pi-desktop text-blue-600"></i>
                Session Management
              </h4>

              <div class="session-actions grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  label="Terminate All Sessions"
                  icon="pi pi-sign-out"
                  class="p-button-danger p-button-outlined"
                  @click="terminateAllSessions"
                />

                <Button
                  label="View Login History"
                  icon="pi pi-history"
                  class="p-button-outlined"
                  @click="viewLoginHistory"
                />
              </div>

              <!-- Last Login Information -->
              <div class="last-login-info mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div class="flex items-center gap-2 mb-2">
                  <i class="pi pi-info-circle text-blue-600"></i>
                  <span class="font-medium text-blue-900">Last Login Information</span>
                </div>
                <div class="text-sm text-blue-800">
                  <div>Time: {{ formData.lastLogin ? formatDateTime(formData.lastLogin) : 'Never' }}</div>
                  <div>IP Address: {{ formData.lastLoginIP || 'Unknown' }}</div>
                  <div>Location: {{ formData.lastLoginLocation || 'Unknown' }}</div>
                </div>
              </div>
            </div>
          </div>
        </TabPanel>
      </TabView>
    </div>

    <template #footer>
      <div class="flex items-center justify-between px-6 py-4 bg-gray-50 border-t">
        <div class="text-sm text-gray-500 flex items-center">
          <i class="pi pi-info-circle mr-2 text-blue-500"></i>
          {{ isNewUser ? 'User will receive a welcome email with login instructions' : 'Changes will be applied immediately' }}
        </div>
        <div class="flex items-center gap-3">
          <Button
            label="Cancel"
            icon="pi pi-times"
            class="p-button-outlined p-button-secondary px-6 py-2"
            @click="closeDialog"
            :disabled="isSaving"
          />
          <Button
            :label="isNewUser ? 'Create User' : 'Save Changes'"
            :icon="isNewUser ? 'pi pi-plus' : 'pi pi-save'"
            class="p-button-primary px-8 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 border-blue-600 hover:border-blue-700"
            @click="saveUser"
            :loading="isSaving"
            :disabled="!canSaveUser"
          />
        </div>
      </div>
    </template>

    <!-- Hidden file input for image upload -->
    <input
      ref="imageUploadInput"
      type="file"
      accept="image/*"
      style="display: none"
      @change="handleImageUpload"
    />
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';

// PrimeVue Components
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import Checkbox from 'primevue/checkbox';
import InputSwitch from 'primevue/inputswitch';
import Tag from 'primevue/tag';
import Avatar from 'primevue/avatar';
import Dialog from 'primevue/dialog';

// Props
const props = defineProps<{
  visible: boolean;
  user?: any;
}>();

// Emits
const emit = defineEmits<{
  'update:visible': [visible: boolean];
  'user-updated': [result: any];
}>();

// Composables
const toast = useToast();

// State
const dialogVisible = ref(props.visible);
const activeTabIndex = ref(0);
const isSaving = ref(false);
const showValidationErrors = ref(false);
const imageUploadInput = ref(null);

// Form data
const formData = ref({
  id: '',
  firstName: '',
  lastName: '',
  email: '',
  timezone: 'UTC',
  language: 'en',
  isActive: true,
  isVerified: false,
  profileImage: '',
  roles: [],
  permissions: [],
  permissionCount: 0,
  loginCount: 0,
  accountAge: 0,
  lastLoginAt: null,
  createdAt: null,
  updatedAt: null,
});

// New role assignment
const newRole = ref({
  roleId: '',
  reason: '',
});

// Options data
const timezoneOptions = [
  { label: 'UTC', value: 'UTC' },
  { label: 'America/New_York (EST/EDT)', value: 'America/New_York' },
  { label: 'America/Chicago (CST/CDT)', value: 'America/Chicago' },
  { label: 'America/Denver (MST/MDT)', value: 'America/Denver' },
  { label: 'America/Los_Angeles (PST/PDT)', value: 'America/Los_Angeles' },
  { label: 'Europe/London (GMT/BST)', value: 'Europe/London' },
  { label: 'Europe/Paris (CET/CEST)', value: 'Europe/Paris' },
  { label: 'Asia/Tokyo (JST)', value: 'Asia/Tokyo' },
  { label: 'Asia/Shanghai (CST)', value: 'Asia/Shanghai' },
  { label: 'Australia/Sydney (AEST/AEDT)', value: 'Australia/Sydney' },
];

const languageOptions = [
  { label: 'English', value: 'en' },
  { label: 'French', value: 'fr' },
  { label: 'German', value: 'de' },
  { label: 'Spanish', value: 'es' },
  { label: 'Italian', value: 'it' },
  { label: 'Portuguese', value: 'pt' },
  { label: 'Chinese', value: 'zh' },
  { label: 'Japanese', value: 'ja' },
];

const availableRoles = ref([
  { id: '1', name: 'SUPER_ADMIN', description: 'System administrators with full access' },
  { id: '2', name: 'FUND_MANAGER', description: 'Fund management team with operational access' },
  { id: '3', name: 'COMPLIANCE_OFFICER', description: 'Compliance and regulatory oversight' },
  { id: '4', name: 'ANALYST', description: 'Read-only access for analysis and reporting' },
  { id: '5', name: 'INVESTOR', description: 'Limited partners with access to their investments' },
  { id: '6', name: 'VIEWER', description: 'Minimum access for basic information' },
]);

const userActivities = ref([
  {
    id: '1',
    type: 'LOGIN',
    title: 'User Login',
    description: 'Successful login from desktop application',
    performedBy: 'System',
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
  },
  {
    id: '2',
    type: 'ROLE_ASSIGNED',
    title: 'Role Assignment',
    description: 'FUND_MANAGER role assigned to user',
    performedBy: 'Admin User',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    id: '3',
    type: 'PROFILE_UPDATED',
    title: 'Profile Updated',
    description: 'User profile information was updated',
    performedBy: 'User',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
  },
]);

// Computed properties
const isNewUser = computed(() => !props.user || !props.user.id);

const userInitials = computed(() => {
  const first = formData.value.firstName?.charAt(0) || '';
  const last = formData.value.lastName?.charAt(0) || '';
  return (first + last).toUpperCase() || 'U';
});

const fullName = computed(() => {
  return `${formData.value.firstName} ${formData.value.lastName}`.trim();
});

const canSaveUser = computed(() => {
  return formData.value.firstName.trim() &&
         formData.value.lastName.trim() &&
         formData.value.email.trim() &&
         isValidEmail(formData.value.email) &&
         !isSaving.value;
});

const effectivePermissions = computed(() => {
  // Mock calculation of effective permissions based on roles
  const permissions = [];
  formData.value.roles.forEach(role => {
    // Add role-specific permissions (this would be fetched from API in real app)
    if (role.name === 'SUPER_ADMIN') {
      permissions.push('USER:CREATE', 'USER:READ', 'USER:UPDATE', 'USER:DELETE', 'SYSTEM:CONFIGURE');
    } else if (role.name === 'FUND_MANAGER') {
      permissions.push('FUND:CREATE', 'FUND:READ', 'FUND:UPDATE', 'INVESTMENT:CREATE');
    } else if (role.name === 'INVESTOR') {
      permissions.push('INVESTMENT:READ_OWN', 'DOCUMENT:READ');
    }
  });
  return [...new Set(permissions)]; // Remove duplicates
});

// Watchers
watch(() => props.visible, (newValue) => {
  dialogVisible.value = newValue;
});

watch(dialogVisible, (newValue) => {
  emit('update:visible', newValue);
});

watch(() => props.user, (newUser) => {
  if (newUser) {
    loadUserData();
  }
});

// Methods
const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
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

const getActivityIconClass = (type: string) => {
  const classes = {
    'LOGIN': 'bg-green-500',
    'LOGOUT': 'bg-gray-500',
    'ROLE_ASSIGNED': 'bg-blue-500',
    'ROLE_REMOVED': 'bg-orange-500',
    'PROFILE_UPDATED': 'bg-purple-500',
    'PASSWORD_CHANGED': 'bg-red-500',
    'MFA_ENABLED': 'bg-teal-500',
  };
  return classes[type] || 'bg-gray-500';
};

const getActivityIcon = (type: string) => {
  const icons = {
    'LOGIN': 'pi pi-sign-in',
    'LOGOUT': 'pi pi-sign-out',
    'ROLE_ASSIGNED': 'pi pi-user-plus',
    'ROLE_REMOVED': 'pi pi-user-minus',
    'PROFILE_UPDATED': 'pi pi-user-edit',
    'PASSWORD_CHANGED': 'pi pi-key',
    'MFA_ENABLED': 'pi pi-shield',
  };
  return icons[type] || 'pi pi-info-circle';
};

const getActivitySeverity = (type: string) => {
  const severities = {
    'LOGIN': 'success',
    'LOGOUT': 'info',
    'ROLE_ASSIGNED': 'info',
    'ROLE_REMOVED': 'warning',
    'PROFILE_UPDATED': 'info',
    'PASSWORD_CHANGED': 'warning',
    'MFA_ENABLED': 'success',
  };
  return severities[type] || 'info';
};

const formatActivityTime = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
};

const formatDateTime = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  }).format(new Date(date));
};

const loadUserData = () => {
  if (props.user) {
    // Calculate account age in days
    const accountAge = props.user.createdAt
      ? Math.floor((Date.now() - new Date(props.user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    formData.value = {
      id: props.user.id || '',
      firstName: props.user.firstName || '',
      lastName: props.user.lastName || '',
      email: props.user.email || '',
      timezone: props.user.timezone || 'UTC',
      language: props.user.language || 'en',
      isActive: props.user.isActive !== undefined ? props.user.isActive : true,
      isVerified: props.user.isVerified !== undefined ? props.user.isVerified : false,
      profileImage: props.user.profileImage || '',
      roles: props.user.roles || [],
      permissions: props.user.permissions || [],
      permissionCount: props.user.permissions?.length || 0,
      loginCount: props.user.loginCount || 0,
      accountAge,
      lastLoginAt: props.user.lastLoginAt || null,
      createdAt: props.user.createdAt || null,
      updatedAt: props.user.updatedAt || null,
      mfaEnabled: props.user.mfaEnabled || false,
      isLocked: props.user.isLocked || false,
      lastLoginIP: props.user.lastLoginIP || '',
      lastLoginLocation: props.user.lastLoginLocation || '',
    };
  } else {
    resetForm();
  }
};

const resetForm = () => {
  formData.value = {
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    timezone: 'UTC',
    language: 'en',
    isActive: true,
    isVerified: false,
    profileImage: '',
    roles: [],
    permissions: [],
    permissionCount: 0,
    loginCount: 0,
    accountAge: 0,
    lastLoginAt: null,
    createdAt: null,
    updatedAt: null,
    mfaEnabled: false,
    isLocked: false,
    lastLoginIP: '',
    lastLoginLocation: '',
  };
  newRole.value = { roleId: '', reason: '' };
  activeTabIndex.value = 0;
  showValidationErrors.value = false;
};

const addRole = () => {
  if (!newRole.value.roleId || !newRole.value.reason) return;

  const role = availableRoles.value.find(r => r.id === newRole.value.roleId);
  if (role && !formData.value.roles.find(r => r.id === role.id)) {
    formData.value.roles.push({
      ...role,
      assignedAt: new Date(),
      assignedBy: 'Current Admin',
      reason: newRole.value.reason
    });

    toast.add({
      severity: 'success',
      summary: 'Role Added',
      detail: `${role.name} role has been added to the user.`,
      life: 3000
    });

    newRole.value = { roleId: '', reason: '' };
  }
};

const removeRole = (role: any) => {
  const index = formData.value.roles.findIndex(r => r.id === role.id);
  if (index > -1) {
    formData.value.roles.splice(index, 1);
    toast.add({
      severity: 'info',
      summary: 'Role Removed',
      detail: `${role.name} role has been removed from the user.`,
      life: 3000
    });
  }
};

const openImageUpload = () => {
  imageUploadInput.value?.click();
};

const handleImageUpload = (event: any) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      formData.value.profileImage = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};

const removeProfileImage = () => {
  formData.value.profileImage = '';
};

const forcePasswordReset = () => {
  toast.add({
    severity: 'info',
    summary: 'Password Reset',
    detail: 'User will be required to reset password on next login.',
    life: 4000
  });
};

const toggleMFA = () => {
  toast.add({
    severity: 'info',
    summary: 'MFA Setting Updated',
    detail: `Multi-factor authentication has been ${formData.value.mfaEnabled ? 'enabled' : 'disabled'}.`,
    life: 3000
  });
};

const toggleAccountLock = () => {
  toast.add({
    severity: formData.value.isLocked ? 'warning' : 'info',
    summary: 'Account Status Updated',
    detail: `Account has been ${formData.value.isLocked ? 'locked' : 'unlocked'}.`,
    life: 3000
  });
};

const terminateAllSessions = () => {
  toast.add({
    severity: 'info',
    summary: 'Sessions Terminated',
    detail: 'All active user sessions have been terminated.',
    life: 4000
  });
};

const viewLoginHistory = () => {
  toast.add({
    severity: 'info',
    summary: 'Login History',
    detail: 'Opening detailed login history for this user.',
    life: 3000
  });
};

const viewFullAuditTrail = () => {
  toast.add({
    severity: 'info',
    summary: 'Audit Trail',
    detail: 'Opening full audit trail for this user.',
    life: 3000
  });
};

const onDialogShow = () => {
  loadUserData();
};

const onDialogHide = () => {
  resetForm();
};

const closeDialog = () => {
  dialogVisible.value = false;
};

const saveUser = async () => {
  showValidationErrors.value = true;

  if (!canSaveUser.value) {
    toast.add({
      severity: 'warn',
      summary: 'Validation Error',
      detail: 'Please fill in all required fields correctly.',
      life: 4000
    });
    return;
  }

  isSaving.value = true;

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    const result = {
      userId: formData.value.id || 'new-user-id',
      firstName: formData.value.firstName,
      lastName: formData.value.lastName,
      email: formData.value.email,
      timezone: formData.value.timezone,
      language: formData.value.language,
      isActive: formData.value.isActive,
      isVerified: formData.value.isVerified,
      isNewUser: isNewUser.value,
      rolesAssigned: formData.value.roles.length,
      updatedAt: new Date(),
    };

    emit('user-updated', result);

    toast.add({
      severity: 'success',
      summary: isNewUser.value ? 'User Created' : 'User Updated',
      detail: `${fullName.value} has been ${isNewUser.value ? 'created' : 'updated'} successfully.`,
      life: 5000
    });

    closeDialog();
  } catch (error) {
    console.error('User save error:', error);
    toast.add({
      severity: 'error',
      summary: 'Save Failed',
      detail: `Failed to ${isNewUser.value ? 'create' : 'update'} user. Please try again.`,
      life: 5000
    });
  } finally {
    isSaving.value = false;
  }
};

// Lifecycle
onMounted(() => {
  if (props.user) {
    loadUserData();
  }
});
</script>

<style scoped>
.user-edit-dialog :deep(.p-dialog-header) {
  @apply border-b border-gray-200 bg-white;
}

.user-edit-dialog :deep(.p-dialog-content) {
  @apply bg-gray-50 p-0;
}

.user-edit-dialog :deep(.p-dialog-footer) {
  @apply border-t border-gray-200 bg-white;
}

.user-edit-content {
  @apply h-full;
}

.user-edit-tabs {
  @apply bg-white h-full;
}

.user-edit-tabs :deep(.p-tabview-nav) {
  @apply bg-gray-50 border-b border-gray-200 px-6 sticky top-0 z-10;
}

.user-edit-tabs :deep(.p-tabview-nav li .p-tabview-nav-link) {
  @apply text-gray-700 border-transparent hover:text-blue-600 hover:border-blue-300 px-6 py-4 font-medium;
}

.user-edit-tabs :deep(.p-tabview-nav li.p-highlight .p-tabview-nav-link) {
  @apply text-blue-600 border-blue-500 bg-white;
}

.user-edit-tabs :deep(.p-tabview-panels) {
  @apply p-0 h-full overflow-auto;
}

.tab-content {
  @apply min-h-full;
}

.user-avatar {
  @apply border-4 border-white;
}

.avatar-edit-btn {
  @apply shadow-lg border-2 border-white;
}

.form-field {
  @apply space-y-2;
}

.role-card {
  @apply transition-all duration-200 hover:shadow-md;
}

.role-icon {
  @apply shadow-sm border border-white/20;
}

.permission-chip {
  @apply shadow-sm;
}

.activity-item {
  @apply transition-all duration-200;
}

.activity-icon {
  @apply shadow-sm;
}

.security-option {
  @apply transition-all duration-200;
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

/* Avatar upload animation */
.avatar-container:hover .avatar-edit-btn {
  @apply scale-110;
}

/* Form validation styles */
.p-invalid {
  @apply border-red-500 focus:border-red-500;
}

.p-error {
  @apply text-red-500 text-xs;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .user-edit-dialog {
    @apply m-4;
  }

  .user-edit-dialog :deep(.p-dialog) {
    @apply w-full h-full max-h-none;
  }

  .tab-content {
    @apply p-4;
  }

  .form-grid {
    @apply grid-cols-1;
  }

  .add-role-form {
    @apply grid-cols-1;
  }

  .session-actions {
    @apply grid-cols-1;
  }

  .user-edit-tabs :deep(.p-tabview-nav) {
    @apply px-4;
  }

  .user-edit-tabs :deep(.p-tabview-nav li .p-tabview-nav-link) {
    @apply px-4 py-3 text-sm;
  }
}

/* Loading animation */
.user-edit-dialog :deep(.p-button .p-button-loading-icon) {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
