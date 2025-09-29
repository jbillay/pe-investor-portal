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
      <!-- Loading State -->
      <div v-if="isLoading" class="loading-container flex items-center justify-center h-96">
        <div class="text-center">
          <i class="pi pi-spin pi-spinner text-4xl text-blue-600 mb-4"></i>
          <p class="text-lg text-gray-600">Loading user information...</p>
        </div>
      </div>

      <!-- Tab Navigation -->
      <TabView v-else v-model:activeIndex="activeTabIndex" class="user-edit-tabs">
        <!-- Basic Information Tab -->
        <TabPanel header="Basic Information">
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
                <label class="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <InputText
                  v-model="formData.phone"
                  placeholder="Enter phone number (e.g., +1234567890)"
                  type="tel"
                  class="w-full"
                />
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


        <!-- Activity Log Tab -->
        <TabPanel header="Activity Log">
          <div class="tab-content p-6">
            <div class="activity-header mb-4 flex items-center justify-between">
              <h4 class="text-lg font-medium text-gray-900 flex items-center gap-2">
                <i class="pi pi-history text-indigo-600"></i>
                User Activity Log
              </h4>
              <div class="flex items-center gap-3">
                <div class="flex items-center gap-2">
                  <label class="text-sm font-medium text-gray-700">Time Period:</label>
                  <Dropdown
                    v-model="selectedTimePeriod"
                    :options="timePeriodOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select period"
                    class="w-40"
                    @change="loadUserAuditLogs"
                  />
                </div>
                <Button
                  label="View Full Audit Trail"
                  icon="pi pi-external-link"
                  class="p-button-outlined p-button-sm"
                  @click="viewFullAuditTrail"
                />
              </div>
            </div>

            <div class="activity-timeline">
              <!-- Loading state -->
              <div v-if="isLoadingAuditLogs" class="flex items-center justify-center py-8">
                <div class="text-center">
                  <i class="pi pi-spin pi-spinner text-3xl text-blue-600 mb-3"></i>
                  <p class="text-gray-600">Loading activity logs...</p>
                </div>
              </div>

              <!-- Activity logs -->
              <div v-else-if="userActivities.length > 0" class="space-y-4">
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
                <p class="text-lg mb-2">No activity found</p>
                <p class="text-sm">No audit logs found for the selected time period</p>
                <Button
                  label="Try Different Period"
                  icon="pi pi-refresh"
                  class="p-button-text p-button-sm mt-3"
                  @click="selectedTimePeriod = 0"
                />
              </div>
            </div>
          </div>
        </TabPanel>

        <!-- Security Settings Tab -->
        <TabPanel header="Security" :disabled="true">
          <div class="tab-content p-6">
            <!-- Under Development Message -->
            <div class="flex flex-col items-center justify-center h-64 text-center">
              <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <i class="pi pi-lock text-4xl text-gray-400"></i>
              </div>
              <h4 class="text-xl font-semibold text-gray-600 mb-2">Security Settings</h4>
              <p class="text-gray-500 mb-4">This section is currently under development</p>
              <div class="flex items-center gap-2 text-sm text-gray-400">
                <i class="pi pi-wrench"></i>
                <span>Coming soon...</span>
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
import { useApi } from '@/composables/useApi';

// PrimeVue Components
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import Checkbox from 'primevue/checkbox';
import InputSwitch from 'primevue/inputswitch';
import Tag from 'primevue/tag';
import Avatar from 'primevue/avatar';
import Dialog from 'primevue/dialog';
import TabPanel from 'primevue/tabpanel';
import TabView from 'primevue/tabview';

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
const { api } = useApi();

// State
const dialogVisible = ref(props.visible);
const activeTabIndex = ref(0);
const isSaving = ref(false);
const isLoading = ref(false);
const isLoadingAuditLogs = ref(false);
const showValidationErrors = ref(false);
const imageUploadInput = ref(null);
const selectedTimePeriod = ref(30);

// Form data
const formData = ref({
  id: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
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
  preferences: null,
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

// Time period options for audit log filtering
const timePeriodOptions = [
  { label: 'All Time', value: 0 },
  { label: 'Last 7 days', value: 7 },
  { label: 'Last 30 days', value: 30 },
  { label: 'Last 90 days', value: 90 },
  { label: 'Last 180 days', value: 180 },
  { label: 'Last Year', value: 365 }
];

// User activities - will be loaded from API
const userActivities = ref([]);

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
         !isSaving.value &&
         !isLoading.value;
});


// Watchers
watch(() => props.visible, (newValue) => {
  dialogVisible.value = newValue;
});

watch(dialogVisible, (newValue) => {
  emit('update:visible', newValue);
});

watch(() => props.user, async (newUser) => {
  if (newUser) {
    await loadUserData();
    await loadUserAuditLogs();
  }
});

// Watch time period changes to reload audit logs
watch(selectedTimePeriod, async (newPeriod) => {
  if (formData.value.id && dialogVisible.value) {
    await loadUserAuditLogs();
  }
});

// Methods
const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
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

const loadUserData = async () => {
  if (props.user && props.user.id) {
    isLoading.value = true;

    try {
      // Fetch complete user data including profile information from backend
      const response = await api.get(`/admin/users/${props.user.id}`);

      // Log the response to understand the structure
      console.log('Full API Response:', response);
      console.log('Response data field:', response.data);

      // Try different possible locations for the user data
      let userData = response.data;

      // If response.data doesn't have the expected user fields, try response itself
      if (!userData || !userData.id) {
        console.log('Trying response directly...');
        userData = response;
      }

      if (!userData || typeof userData !== 'object') {
        console.warn('No user data in response, falling back to props');
        console.log('userData type:', typeof userData);
        console.log('userData value:', userData);
        loadUserDataFromProps();
        return;
      }

      console.log('User data:', userData);

      // Calculate account age in days with safe access
      let accountAge = 0;
      try {
        if (userData.createdAt) {
          const createdDate = new Date(userData.createdAt);
          if (!isNaN(createdDate.getTime())) {
            accountAge = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
          }
        }
      } catch (dateError) {
        console.warn('Failed to calculate account age:', dateError);
        accountAge = 0;
      }

      formData.value = {
        id: userData.id || '',
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        phone: userData.profile?.phone || '',
        timezone: userData.profile?.timezone || 'UTC',
        language: userData.profile?.language || 'en',
        isActive: userData.isActive !== undefined ? userData.isActive : true,
        isVerified: userData.isVerified !== undefined ? userData.isVerified : false,
        profileImage: userData.profile?.avatar || '',
        roles: userData.roles || [],
        permissions: userData.permissions || [],
        permissionCount: userData.permissions?.length || 0,
        loginCount: userData.stats?.loginCount || 0,
        accountAge,
        lastLoginAt: userData.lastLogin || null,
        createdAt: userData.createdAt || null,
        updatedAt: userData.updatedAt || null,
        preferences: userData.profile?.preferences || null,
        mfaEnabled: userData.mfaEnabled || false,
        isLocked: userData.isLocked || false,
        lastLoginIP: userData.lastLoginIP || '',
        lastLoginLocation: userData.lastLoginLocation || '',
      };
    } catch (error) {
      console.error('Failed to load user data:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      // Fall back to props data if API call fails
      loadUserDataFromProps();

      // Only show toast for non-404 errors (404 means endpoint doesn't exist yet)
      if (error.response?.status !== 404) {
        toast.add({
          severity: 'warn',
          summary: 'Data Loading Warning',
          detail: error.message || 'Some user data may not be complete. Please refresh and try again.',
          life: 5000
        });
      } else {
        console.info('User detail endpoint not available, using basic user data from props');
      }
    } finally {
      isLoading.value = false;
    }
  } else if (props.user) {
    // For users without ID (partial data), use props as fallback
    loadUserDataFromProps();
  } else {
    resetForm();
  }
};

// Fallback method to load data from props
const loadUserDataFromProps = () => {
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
      phone: props.user.phone || '',
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
      preferences: props.user.preferences || null,
      mfaEnabled: props.user.mfaEnabled || false,
      isLocked: props.user.isLocked || false,
      lastLoginIP: props.user.lastLoginIP || '',
      lastLoginLocation: props.user.lastLoginLocation || '',
    };
  }
};

const resetForm = () => {
  formData.value = {
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
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
    preferences: null,
    mfaEnabled: false,
    isLocked: false,
    lastLoginIP: '',
    lastLoginLocation: '',
  };
  activeTabIndex.value = 0;
  showValidationErrors.value = false;
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

const onDialogShow = async () => {
  await loadUserData();
  await loadUserAuditLogs();
};

const onDialogHide = () => {
  resetForm();
  userActivities.value = []; // Clear audit logs when dialog closes
};

// Load user audit logs from API
const loadUserAuditLogs = async () => {
  if (!formData.value.id) {
    userActivities.value = [];
    return;
  }

  isLoadingAuditLogs.value = true;

  try {
    const response = await api.get(`/admin/users/${formData.value.id}/audit-logs`, {
      params: {
        days: selectedTimePeriod.value,
        limit: 50
      }
    });

    console.log('Audit logs response:', response);

    // The response should have the activities in the data field
    userActivities.value = response.data?.data || response.data || [];

    if (userActivities.value.length === 0) {
      console.log(`No audit logs found for user ${formData.value.id} in the last ${selectedTimePeriod.value} days`);
    }

  } catch (error) {
    console.error('Failed to load user audit logs:', error);

    // Don't show error toast for 404 (endpoint might not be implemented yet)
    if (error.response?.status !== 404) {
      toast.add({
        severity: 'warn',
        summary: 'Audit Logs Unavailable',
        detail: 'Could not load user activity logs. Please try again later.',
        life: 4000
      });
    } else {
      console.info('Audit logs endpoint not available yet');
    }

    userActivities.value = [];
  } finally {
    isLoadingAuditLogs.value = false;
  }
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
    let result;

    if (isNewUser.value) {
      // Create new user
      const createUserData = {
        email: formData.value.email,
        password: generateTempPassword(), // Generate a temporary password
        firstName: formData.value.firstName,
        lastName: formData.value.lastName,
        phone: formData.value.phone || undefined,
        timezone: formData.value.timezone,
        language: formData.value.language,
        isActive: formData.value.isActive,
        isVerified: formData.value.isVerified,
        preferences: formData.value.preferences || undefined,
        reason: 'User created via admin panel'
      };

      const createResponse = await api.post('/admin/users', createUserData);
      result = createResponse.data;

      toast.add({
        severity: 'success',
        summary: 'User Created',
        detail: `${fullName.value} has been created successfully.`,
        life: 5000
      });
    } else {
      // Update existing user
      const updateUserData = {
        email: formData.value.email,
        firstName: formData.value.firstName,
        lastName: formData.value.lastName,
        phone: formData.value.phone || undefined,
        timezone: formData.value.timezone,
        language: formData.value.language,
        preferences: formData.value.preferences || undefined,
        reason: 'User updated via admin panel'
      };

      const updateResponse = await api.put(`/admin/users/${formData.value.id}`, updateUserData);
      result = updateResponse.data;

      // Handle status and verification updates separately if they changed
      const currentUser = props.user;
      if (currentUser && (
        currentUser.isActive !== formData.value.isActive ||
        currentUser.isVerified !== formData.value.isVerified
      )) {
        // Update status if changed
        if (currentUser.isActive !== formData.value.isActive) {
          await api.patch(`/admin/users/${formData.value.id}/status`, {
            isActive: formData.value.isActive,
            reason: `User ${formData.value.isActive ? 'activated' : 'deactivated'} via admin panel`
          });
        }

        // Update verification if changed
        if (currentUser.isVerified !== formData.value.isVerified) {
          await api.patch(`/admin/users/${formData.value.id}/verification`, {
            isVerified: formData.value.isVerified,
            reason: `User verification ${formData.value.isVerified ? 'confirmed' : 'revoked'} via admin panel`
          });
        }
      }

      toast.add({
        severity: 'success',
        summary: 'User Updated',
        detail: `${fullName.value} has been updated successfully.`,
        life: 5000
      });
    }

    // Emit the result to parent component
    emit('user-updated', {
      userId: result?.id || formData.value.id,
      firstName: formData.value.firstName,
      lastName: formData.value.lastName,
      email: formData.value.email,
      timezone: formData.value.timezone,
      language: formData.value.language,
      isActive: formData.value.isActive,
      isVerified: formData.value.isVerified,
      isNewUser: isNewUser.value,
      updatedAt: new Date(),
    });

    closeDialog();
  } catch (error) {
    console.error('User save error:', error);

    let errorMessage = `Failed to ${isNewUser.value ? 'create' : 'update'} user. Please try again.`;

    // Handle specific API error messages
    if (error?.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error?.message) {
      errorMessage = error.message;
    }

    toast.add({
      severity: 'error',
      summary: 'Save Failed',
      detail: errorMessage,
      life: 5000
    });
  } finally {
    isSaving.value = false;
  }
};

// Helper function to generate temporary password for new users
const generateTempPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@$!%*?&';
  let password = '';

  // Ensure password meets requirements (uppercase, lowercase, number, special char)
  password += 'A'; // uppercase
  password += 'a'; // lowercase
  password += '1'; // number
  password += '@'; // special char

  // Add 8 more random characters to make it 12 chars total
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

// Lifecycle
onMounted(async () => {
  if (props.user) {
    await loadUserData();
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
