<template>
  <Dialog
    v-model:visible="dialogVisible"
    :modal="true"
    :draggable="false"
    :closable="!isSaving"
    :style="{ width: '90vw', maxWidth: '600px' }"
    class="user-create-dialog"
    @show="onDialogShow"
    @hide="onDialogHide"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
          <i class="pi pi-user-plus text-white text-lg"></i>
        </div>
        <div>
          <h3 class="text-xl font-semibold text-gray-900 m-0">
            {{ createdUser ? 'User Created Successfully' : 'Create New User' }}
          </h3>
          <p class="text-sm text-gray-600 m-0 mt-1">
            {{ createdUser ? 'Please securely share the temporary password with the user' : 'Create a new user account with a temporary password' }}
          </p>
        </div>
      </div>
    </template>

    <div class="user-create-content p-6">
      <!-- Creation Form (shown before user is created) -->
      <div v-if="!createdUser" class="form-content space-y-4">
        <!-- Email Field -->
        <div class="form-field">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Email Address <span class="text-red-500">*</span>
          </label>
          <InputText
            v-model="formData.email"
            placeholder="user@example.com"
            type="email"
            class="w-full"
            :class="{ 'p-invalid': (!formData.email || !isValidEmail(formData.email)) && showValidationErrors }"
            autofocus
          />
          <small v-if="!formData.email && showValidationErrors" class="p-error">
            Email address is required
          </small>
          <small v-else-if="formData.email && !isValidEmail(formData.email) && showValidationErrors" class="p-error">
            Please enter a valid email address
          </small>
        </div>

        <!-- First Name Field -->
        <div class="form-field">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            First Name <span class="text-red-500">*</span>
          </label>
          <InputText
            v-model="formData.firstName"
            placeholder="John"
            class="w-full"
            :class="{ 'p-invalid': !formData.firstName && showValidationErrors }"
          />
          <small v-if="!formData.firstName && showValidationErrors" class="p-error">
            First name is required
          </small>
        </div>

        <!-- Last Name Field -->
        <div class="form-field">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Last Name <span class="text-red-500">*</span>
          </label>
          <InputText
            v-model="formData.lastName"
            placeholder="Doe"
            class="w-full"
            :class="{ 'p-invalid': !formData.lastName && showValidationErrors }"
          />
          <small v-if="!formData.lastName && showValidationErrors" class="p-error">
            Last name is required
          </small>
        </div>

        <!-- Timezone Field (Optional) -->
        <div class="form-field">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Timezone (Optional)
          </label>
          <Select
            v-model="formData.timezone"
            :options="timezoneOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Select timezone (defaults to UTC)"
            class="w-full"
          />
          <small class="text-gray-500 text-xs">
            If not specified, UTC will be used as the default timezone
          </small>
        </div>

        <!-- Info Message -->
        <div class="rounded-lg bg-blue-50 border border-blue-200 p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <i class="pi pi-info-circle text-blue-400"></i>
            </div>
            <div class="ml-3">
              <p class="text-sm text-blue-700">
                A secure temporary password will be automatically generated and sent to the user via email.
                The password will expire in 72 hours and must be changed on first login.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Success View (shown after user is created) -->
      <div v-else class="success-content space-y-4">
        <!-- Success Message -->
        <div class="rounded-lg bg-success-50 border border-success-200 p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <i class="pi pi-check-circle text-success-600 text-xl"></i>
            </div>
            <div class="ml-3">
              <h4 class="text-sm font-medium text-success-800">
                User Created Successfully
              </h4>
              <p class="text-sm text-success-700 mt-1">
                {{ createdUser.firstName }} {{ createdUser.lastName }} has been added to the system.
              </p>
            </div>
          </div>
        </div>

        <!-- User Info -->
        <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-sm font-medium text-gray-700">Email:</span>
              <span class="text-sm text-gray-900">{{ createdUser.email }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm font-medium text-gray-700">Name:</span>
              <span class="text-sm text-gray-900">{{ createdUser.firstName }} {{ createdUser.lastName }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm font-medium text-gray-700">Timezone:</span>
              <span class="text-sm text-gray-900">{{ createdUser.timezone }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm font-medium text-gray-700">Roles:</span>
              <div class="flex gap-2">
                <Tag v-for="role in createdUser.roles" :key="role" :value="role" severity="info" />
              </div>
            </div>
          </div>
        </div>

        <!-- Temporary Password Display -->
        <div class="bg-warning-50 rounded-lg p-4 border-2 border-warning-300">
          <div class="flex items-start gap-3">
            <i class="pi pi-key text-warning-600 text-xl mt-1"></i>
            <div class="flex-1">
              <h4 class="text-sm font-semibold text-warning-900 mb-2">
                Temporary Password
              </h4>
              <div class="bg-white border-2 border-warning-200 rounded-lg p-3 mb-3">
                <div class="flex items-center justify-between gap-3">
                  <code class="text-lg font-mono text-gray-900 select-all break-all">
                    {{ createdUser.tempPassword }}
                  </code>
                  <Button
                    :icon="passwordCopied ? 'pi pi-check' : 'pi pi-copy'"
                    class="p-button-sm p-button-warning"
                    :class="{ 'p-button-success': passwordCopied }"
                    @click="copyPassword"
                    v-tooltip.top="passwordCopied ? 'Copied!' : 'Copy password'"
                  />
                </div>
              </div>
              <p class="text-xs text-warning-800 mb-2">
                <i class="pi pi-exclamation-triangle mr-1"></i>
                <strong>Important:</strong> This password will only be shown once. Please copy it now and securely share it with the user.
              </p>
              <p class="text-xs text-warning-700">
                Expires: {{ formatExpirationDate(createdUser.tempPasswordExpiresAt) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Email Status -->
        <div v-if="createdUser.emailSent" class="rounded-lg bg-success-50 border border-success-200 p-4">
          <div class="flex items-center">
            <i class="pi pi-envelope text-success-600 mr-3"></i>
            <div>
              <p class="text-sm font-medium text-success-800">
                Welcome email sent successfully
              </p>
              <p class="text-xs text-success-700 mt-1">
                The user will receive login instructions and their temporary password via email.
              </p>
            </div>
          </div>
        </div>

        <div v-else class="rounded-lg bg-error-50 border border-error-200 p-4">
          <div class="flex items-start">
            <i class="pi pi-exclamation-circle text-error-600 mr-3 mt-0.5"></i>
            <div>
              <p class="text-sm font-medium text-error-800">
                Failed to send welcome email
              </p>
              <p class="text-xs text-error-700 mt-1" v-if="createdUser.emailError">
                Error: {{ createdUser.emailError }}
              </p>
              <p class="text-xs text-error-700 mt-1">
                Please manually share the temporary password with the user.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t">
        <Button
          v-if="!createdUser"
          label="Cancel"
          icon="pi pi-times"
          class="p-button-outlined p-button-secondary"
          @click="closeDialog"
          :disabled="isSaving"
        />
        <Button
          v-if="!createdUser"
          label="Create User"
          icon="pi pi-user-plus"
          class="p-button-primary"
          @click="createUser"
          :loading="isSaving"
          :disabled="!canCreateUser"
        />
        <Button
          v-else
          label="Done"
          icon="pi pi-check"
          class="p-button-primary"
          @click="closeDialog"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useApi } from '@/composables/useApi';
import type { CreateUserAdminRequest, CreateUserResponse } from '@/types/auth';

// PrimeVue Components
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Tag from 'primevue/tag';
import Dialog from 'primevue/dialog';

// Props
const props = defineProps<{
  visible: boolean;
}>();

// Emits
const emit = defineEmits<{
  'update:visible': [visible: boolean];
  'user-created': [result: CreateUserResponse];
}>();

// Composables
const toast = useToast();
const { api } = useApi();

// State
const dialogVisible = ref(props.visible);
const isSaving = ref(false);
const showValidationErrors = ref(false);
const passwordCopied = ref(false);
const createdUser = ref<CreateUserResponse | null>(null);

// Form data
const formData = ref<CreateUserAdminRequest>({
  email: '',
  firstName: '',
  lastName: '',
  timezone: '',
});

// Timezone options
const timezoneOptions = [
  { label: 'UTC', value: 'UTC' },
  { label: 'America/New_York (EST/EDT)', value: 'America/New_York' },
  { label: 'America/Chicago (CST/CDT)', value: 'America/Chicago' },
  { label: 'America/Denver (MST/MDT)', value: 'America/Denver' },
  { label: 'America/Los_Angeles (PST/PDT)', value: 'America/Los_Angeles' },
  { label: 'Europe/London (GMT/BST)', value: 'Europe/London' },
  { label: 'Europe/Paris (CET/CEST)', value: 'Europe/Paris' },
  { label: 'Europe/Berlin (CET/CEST)', value: 'Europe/Berlin' },
  { label: 'Asia/Tokyo (JST)', value: 'Asia/Tokyo' },
  { label: 'Asia/Shanghai (CST)', value: 'Asia/Shanghai' },
  { label: 'Asia/Singapore (SGT)', value: 'Asia/Singapore' },
  { label: 'Australia/Sydney (AEST/AEDT)', value: 'Australia/Sydney' },
];

// Computed properties
const canCreateUser = computed(() => {
  return (
    formData.value.email.trim() &&
    formData.value.firstName.trim() &&
    formData.value.lastName.trim() &&
    isValidEmail(formData.value.email) &&
    !isSaving.value
  );
});

// Watchers
watch(() => props.visible, (newValue) => {
  dialogVisible.value = newValue;
});

watch(dialogVisible, (newValue) => {
  emit('update:visible', newValue);
});

// Methods
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const formatExpirationDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  }).format(date);
};

const copyPassword = async () => {
  if (createdUser.value?.tempPassword) {
    try {
      await navigator.clipboard.writeText(createdUser.value.tempPassword);
      passwordCopied.value = true;
      toast.add({
        severity: 'success',
        summary: 'Copied',
        detail: 'Temporary password copied to clipboard',
        life: 2000
      });
      setTimeout(() => {
        passwordCopied.value = false;
      }, 2000);
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Copy Failed',
        detail: 'Failed to copy password to clipboard',
        life: 3000
      });
    }
  }
};

const createUser = async () => {
  showValidationErrors.value = true;

  if (!canCreateUser.value) {
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
    // Prepare request data
    const requestData: CreateUserAdminRequest = {
      email: formData.value.email.trim(),
      firstName: formData.value.firstName.trim(),
      lastName: formData.value.lastName.trim(),
    };

    // Only include timezone if specified
    if (formData.value.timezone) {
      requestData.timezone = formData.value.timezone;
    }

    console.log('Creating user with data:', requestData);

    // Call API to create user
    const response = await api.post<CreateUserResponse>('/admin/users', requestData);

    console.log('User creation response:', response);

    // Handle different response formats
    let userData: CreateUserResponse;
    if (response.data) {
      userData = response.data;
    } else {
      userData = response as CreateUserResponse;
    }

    createdUser.value = userData;

    toast.add({
      severity: 'success',
      summary: 'User Created',
      detail: `${userData.firstName} ${userData.lastName} has been created successfully.`,
      life: 5000
    });

    // Emit the result
    emit('user-created', userData);

  } catch (error: any) {
    console.error('User creation error:', error);

    let errorMessage = 'Failed to create user. Please try again.';

    if (error?.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error?.message) {
      errorMessage = error.message;
    }

    toast.add({
      severity: 'error',
      summary: 'Creation Failed',
      detail: errorMessage,
      life: 5000
    });
  } finally {
    isSaving.value = false;
  }
};

const resetForm = () => {
  formData.value = {
    email: '',
    firstName: '',
    lastName: '',
    timezone: '',
  };
  showValidationErrors.value = false;
  createdUser.value = null;
  passwordCopied.value = false;
};

const closeDialog = () => {
  dialogVisible.value = false;
};

const onDialogShow = () => {
  resetForm();
};

const onDialogHide = () => {
  resetForm();
};
</script>

<style scoped>
.user-create-dialog :deep(.p-dialog-header) {
  @apply border-b border-gray-200 bg-white;
}

.user-create-dialog :deep(.p-dialog-content) {
  @apply bg-white p-0;
}

.user-create-dialog :deep(.p-dialog-footer) {
  @apply border-t border-gray-200 bg-white p-0;
}

.form-field {
  @apply space-y-2;
}

.p-invalid {
  @apply border-red-500 focus:border-red-500;
}

.p-error {
  @apply text-red-500 text-xs;
}

code {
  @apply font-mono bg-gray-50 px-2 py-1 rounded;
}
</style>
