<template>
  <Dialog
    :visible="visible"
    :modal="true"
    :closable="!loading"
    :draggable="false"
    class="role-dialog"
    :class="[
      mode === 'view' ? 'role-dialog--view' : 'role-dialog--edit',
      isMobile ? 'role-dialog--mobile' : 'role-dialog--desktop'
    ]"
    :style="{ width: isMobile ? '100vw' : '90vw', maxWidth: '1200px', height: isMobile ? '100vh' : 'auto', maxHeight: '90vh' }"
    :contentStyle="{ padding: '0', height: isMobile ? 'calc(100vh - 60px)' : 'auto' }"
    @update:visible="handleClose"
  >
    <template #header>
      <div class="dialog-header flex items-center justify-between w-full p-6 border-b">
        <div class="flex items-center gap-3">
          <i class="pi pi-shield text-2xl text-blue-600"></i>
          <div>
            <h2 class="text-xl font-semibold text-gray-900">
              {{ dialogTitle }}
            </h2>
            <p class="text-sm text-gray-600 mt-1">
              {{ dialogSubtitle }}
            </p>
          </div>
        </div>
        <div v-if="mode !== 'view'" class="flex items-center gap-2">
          <Tag
            :value="formData.active ? 'Active' : 'Inactive'"
            :severity="formData.active ? 'success' : 'secondary'"
            class="text-xs"
          />
          <Tag
            v-if="formData.isDefault"
            value="Default Role"
            severity="info"
            class="text-xs"
          />
        </div>
      </div>
    </template>

    <div class="dialog-content overflow-auto p-6 space-y-6" style="height: calc(100% - 140px);">
      <!-- Role Information Form -->
      <Card>
        <template #header>
          <h3 class="text-lg font-semibold text-gray-900 p-6 pb-0">Role Information</h3>
        </template>
        <template #content>
          <div class="space-y-4">
            <!-- Role Name -->
            <div class="field">
              <label for="roleName" class="block text-sm font-medium text-gray-700 mb-2">
                Role Name *
              </label>
              <InputText
                id="roleName"
                v-model="formData.name"
                :readonly="mode === 'view'"
                :class="{ 'p-invalid': validationErrors.name }"
                placeholder="Enter role name (e.g., 'Senior Analyst', 'Portfolio Manager')"
                class="w-full"
                :maxlength="50"
                @input="validateField('name')"
              />
              <small v-if="validationErrors.name" class="p-error mt-1">
                {{ validationErrors.name }}
              </small>
              <small v-else class="text-gray-500 mt-1">
                {{ formData.name.length }}/50 characters
              </small>
            </div>

            <!-- Role Description -->
            <div class="field">
              <label for="roleDescription" class="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <Textarea
                id="roleDescription"
                v-model="formData.description"
                :readonly="mode === 'view'"
                :class="{ 'p-invalid': validationErrors.description }"
                placeholder="Describe the role's purpose and responsibilities..."
                class="w-full"
                :rows="3"
                :maxlength="500"
                @input="validateField('description')"
              />
              <small v-if="validationErrors.description" class="p-error mt-1">
                {{ validationErrors.description }}
              </small>
              <small v-else class="text-gray-500 mt-1">
                {{ formData.description.length }}/500 characters
              </small>
            </div>

            <!-- Role Status Controls -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Active Status -->
              <div class="field">
                <label class="flex items-center gap-3">
                  <ToggleButton
                    v-model="formData.active"
                    :disabled="mode === 'view'"
                    onLabel="Active"
                    offLabel="Inactive"
                    onIcon="pi pi-check"
                    offIcon="pi pi-times"
                  />
                  <div>
                    <span class="text-sm font-medium text-gray-700">Role Status</span>
                    <p class="text-xs text-gray-500 mt-1">
                      {{ formData.active ? 'Role is active and can be assigned to users' : 'Role is inactive and hidden from assignment' }}
                    </p>
                  </div>
                </label>
              </div>

              <!-- Default Role Status -->
              <div class="field">
                <label class="flex items-center gap-3">
                  <ToggleButton
                    v-model="formData.isDefault"
                    :disabled="mode === 'view' || (mode === 'edit' && role?.isDefault && hasSystemUsers)"
                    onLabel="Default"
                    offLabel="Custom"
                    onIcon="pi pi-star"
                    offIcon="pi pi-star-fill"
                    :class="{ 'p-button-warning': formData.isDefault }"
                  />
                  <div>
                    <span class="text-sm font-medium text-gray-700">Role Type</span>
                    <p class="text-xs text-gray-500 mt-1">
                      {{ formData.isDefault ? 'System default role - cannot be deleted' : 'Custom role - can be modified or deleted' }}
                    </p>
                  </div>
                </label>
                <small v-if="mode === 'edit' && role?.isDefault && hasSystemUsers" class="p-error mt-1">
                  Cannot change default status while users are assigned to this role
                </small>
              </div>
            </div>

            <!-- Role Metadata (View/Edit mode only) -->
            <div v-if="mode !== 'create' && role" class="role-metadata">
              <Divider />
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span class="font-medium text-gray-700">Users Assigned:</span>
                  <span class="ml-2 font-semibold text-blue-600">{{ role.userCount }}</span>
                </div>
                <div v-if="role.createdAt">
                  <span class="font-medium text-gray-700">Created:</span>
                  <span class="ml-2 text-gray-600">{{ formatDate(role.createdAt) }}</span>
                </div>
                <div v-if="role.updatedAt && role.updatedAt !== role.createdAt">
                  <span class="font-medium text-gray-700">Last Modified:</span>
                  <span class="ml-2 text-gray-600">{{ formatDate(role.updatedAt) }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Permission Assignment -->
      <Card>
        <template #header>
          <div class="flex items-center justify-between p-6 pb-0">
            <h3 class="text-lg font-semibold text-gray-900">Permission Assignment</h3>
            <div class="flex items-center gap-2">
              <Tag
                :value="`${selectedPermissions.length} of ${permissions.length} permissions`"
                severity="info"
                class="text-xs"
              />
              <Button
                v-if="mode !== 'view'"
                :label="selectedPermissions.length === permissions.length ? 'Deselect All' : 'Select All'"
                :icon="selectedPermissions.length === permissions.length ? 'pi pi-minus' : 'pi pi-plus'"
                class="p-button-outlined p-button-sm"
                @click="toggleAllPermissions"
              />
            </div>
          </div>
        </template>
        <template #content>
          <PermissionSelector
            :permissions="permissions"
            :selected-permissions="selectedPermissions"
            :readonly="mode === 'view'"
            :searchable="true"
            @permission-toggle="handlePermissionToggle"
            @bulk-toggle="handleBulkToggle"
          />
        </template>
      </Card>
    </div>

    <!-- Dialog Footer -->
    <template #footer>
      <div class="dialog-footer flex items-center justify-between p-6 border-t bg-gray-50">
        <!-- Left side: Additional actions -->
        <div class="flex items-center gap-2">
          <Button
            v-if="mode === 'view'"
            label="Edit Role"
            icon="pi pi-pencil"
            class="p-button-outlined"
            @click="switchToEditMode"
          />
          <Button
            v-if="mode === 'view'"
            label="Clone Role"
            icon="pi pi-copy"
            class="p-button-outlined"
            @click="handleClone"
          />
          <Button
            v-if="mode === 'edit' && role && !role.isDefault"
            label="Delete Role"
            icon="pi pi-trash"
            class="p-button-outlined p-button-danger"
            :disabled="loading || (role.userCount > 0)"
            @click="confirmDelete"
          />
        </div>

        <!-- Right side: Primary actions -->
        <div class="flex items-center gap-3">
          <Button
            label="Cancel"
            icon="pi pi-times"
            class="p-button-outlined"
            :disabled="loading"
            @click="handleClose"
          />
          <Button
            v-if="mode !== 'view'"
            :label="mode === 'create' ? 'Create Role' : 'Save Changes'"
            :icon="loading ? 'pi pi-spinner pi-spin' : (mode === 'create' ? 'pi pi-plus' : 'pi pi-check')"
            class="p-button-primary"
            :disabled="loading || !isFormValid"
            @click="handleSave"
          />
        </div>
      </div>
    </template>
  </Dialog>

  <!-- Delete Confirmation Dialog -->
  <ConfirmDialog />
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useConfirm } from 'primevue/useconfirm';
import PermissionSelector from './PermissionSelector.vue';

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
}

interface RoleFormData {
  name: string;
  description: string;
  active: boolean;
  isDefault: boolean;
}

// Props
const props = defineProps<{
  visible: boolean;
  mode: 'create' | 'edit' | 'view';
  role?: Role;
  permissions: Permission[];
  matrix: Record<string, string[]>;
  existingRoleNames: string[];
}>();

// Emits
const emit = defineEmits<{
  'close': [];
  'save': [{ roleData: RoleFormData; permissions: string[] }];
  'delete': [roleId: string];
  'clone': [role: Role];
  'switch-mode': [mode: 'edit'];
}>();

// Composables
const confirm = useConfirm();

// State
const loading = ref(false);
const formData = ref<RoleFormData>({
  name: '',
  description: '',
  active: true,
  isDefault: false
});
const selectedPermissions = ref<string[]>([]);
const validationErrors = ref<Record<string, string>>({});
const isMobile = ref(false);

// Computed properties
const dialogTitle = computed(() => {
  switch (props.mode) {
    case 'create': return 'Create New Role';
    case 'edit': return `Edit Role: ${props.role?.name || ''}`;
    case 'view': return `Role Details: ${props.role?.name || ''}`;
    default: return 'Role Management';
  }
});

const dialogSubtitle = computed(() => {
  switch (props.mode) {
    case 'create': return 'Define a new role with specific permissions and settings';
    case 'edit': return 'Modify role information and permission assignments';
    case 'view': return 'View role information and current permission assignments';
    default: return '';
  }
});

const hasSystemUsers = computed(() => {
  return props.role?.userCount && props.role.userCount > 0;
});

const isFormValid = computed(() => {
  return formData.value.name.trim().length > 0 &&
         Object.keys(validationErrors.value).length === 0;
});

// Watchers
watch(() => props.visible, (newValue) => {
  if (newValue) {
    initializeDialog();
    checkMobileView();
  }
});

watch(() => props.role, () => {
  if (props.visible) {
    initializeDialog();
  }
});

// Methods
const initializeDialog = () => {
  if (props.mode === 'create') {
    formData.value = {
      name: '',
      description: '',
      active: true,
      isDefault: false
    };
    selectedPermissions.value = [];
  } else if (props.role) {
    formData.value = {
      name: props.role.name,
      description: props.role.description || '',
      active: props.role.active,
      isDefault: props.role.isDefault
    };
    selectedPermissions.value = [...(props.matrix[props.role.id] || [])];
  }
  validationErrors.value = {};
};

const checkMobileView = () => {
  isMobile.value = window.innerWidth < 768;
};

const validateField = (field: string) => {
  const errors: Record<string, string> = {};

  switch (field) {
    case 'name':
      const name = formData.value.name.trim();
      if (!name) {
        errors.name = 'Role name is required';
      } else if (name.length < 2) {
        errors.name = 'Role name must be at least 2 characters';
      } else if (name.length > 50) {
        errors.name = 'Role name cannot exceed 50 characters';
      } else if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
        errors.name = 'Role name can only contain letters, numbers, spaces, hyphens, and underscores';
      } else if (props.existingRoleNames.includes(name.toLowerCase()) &&
                 (props.mode === 'create' || props.role?.name.toLowerCase() !== name.toLowerCase())) {
        errors.name = 'A role with this name already exists';
      }
      break;

    case 'description':
      if (formData.value.description.length > 500) {
        errors.description = 'Description cannot exceed 500 characters';
      }
      break;
  }

  // Update validation errors
  Object.keys(errors).forEach(key => {
    validationErrors.value[key] = errors[key];
  });

  // Remove errors that are no longer present
  Object.keys(validationErrors.value).forEach(key => {
    if (!errors[key] && validationErrors.value[key]) {
      delete validationErrors.value[key];
    }
  });
};

const handlePermissionToggle = (permissionId: string) => {
  const index = selectedPermissions.value.indexOf(permissionId);
  if (index > -1) {
    selectedPermissions.value.splice(index, 1);
  } else {
    selectedPermissions.value.push(permissionId);
  }
};

const handleBulkToggle = (permissionIds: string[], grant: boolean) => {
  if (grant) {
    permissionIds.forEach(id => {
      if (!selectedPermissions.value.includes(id)) {
        selectedPermissions.value.push(id);
      }
    });
  } else {
    selectedPermissions.value = selectedPermissions.value.filter(id =>
      !permissionIds.includes(id)
    );
  }
};

const toggleAllPermissions = () => {
  if (selectedPermissions.value.length === props.permissions.length) {
    selectedPermissions.value = [];
  } else {
    selectedPermissions.value = [...props.permissions.map(p => p.id)];
  }
};

const handleSave = async () => {
  // Validate all fields
  validateField('name');
  validateField('description');

  if (!isFormValid.value) {
    return;
  }

  loading.value = true;
  try {
    emit('save', {
      roleData: { ...formData.value },
      permissions: [...selectedPermissions.value]
    });
  } finally {
    loading.value = false;
  }
};

const handleClose = () => {
  if (!loading.value) {
    emit('close');
  }
};

const switchToEditMode = () => {
  emit('switch-mode', 'edit');
};

const handleClone = () => {
  if (props.role) {
    emit('clone', props.role);
  }
};

const confirmDelete = () => {
  if (!props.role) return;

  confirm.require({
    message: `Are you sure you want to delete the role "${props.role.name}"? This action cannot be undone.`,
    header: 'Delete Role Confirmation',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    acceptLabel: 'Delete Role',
    rejectLabel: 'Cancel',
    accept: () => {
      if (props.role) {
        emit('delete', props.role.id);
      }
    }
  });
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Lifecycle
onMounted(() => {
  window.addEventListener('resize', checkMobileView);
});
</script>

<style scoped>
.role-dialog :deep(.p-dialog-content) {
  padding: 0;
}

.role-dialog--mobile {
  margin: 0;
}

.role-dialog--mobile :deep(.p-dialog) {
  height: 100vh;
  max-height: 100vh;
  margin: 0;
  border-radius: 0;
}

.dialog-content {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.role-dialog--mobile .dialog-content {
  max-height: calc(100vh - 140px);
}

.field {
  margin-bottom: 1rem;
}

.p-error {
  color: #ef4444;
  font-size: 0.75rem;
}

.role-metadata {
  background: #f8fafc;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-top: 1rem;
}

/* Animation for dialog appearance */
.role-dialog :deep(.p-dialog) {
  animation: dialogSlideIn 0.3s ease-out;
}

@keyframes dialogSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Loading state styling */
.p-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Custom toggle button styling for role status */
.p-togglebutton.p-highlight.p-button-warning {
  background: #f59e0b;
  border-color: #f59e0b;
}

.p-togglebutton.p-highlight.p-button-warning:hover {
  background: #d97706;
  border-color: #d97706;
}
</style>