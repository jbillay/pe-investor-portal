<template>
  <Dialog
    :visible="visible"
    :modal="true"
    :closable="true"
    :draggable="false"
    class="role-form-dialog"
    :style="{ width: '800px', maxWidth: '95vw' }"
    @update:visible="handleVisibilityChange"
  >
    <!-- Dialog Header -->
    <template #header>
      <div class="flex items-center gap-3">
        <i :class="isEditMode ? 'pi pi-pencil' : 'pi pi-plus-circle'" class="text-2xl text-blue-600"></i>
        <div>
          <h3 class="text-xl font-bold text-gray-900">
            {{ dialogTitle }}
          </h3>
          <p v-if="isEditMode && role" class="text-sm text-gray-600 mt-1">
            Editing role: <span class="font-semibold">{{ role.name }}</span>
          </p>
        </div>
      </div>
    </template>

    <!-- System Role Warning Banner -->
    <div v-if="isSystemRole" class="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
      <div class="flex items-start gap-3">
        <i class="pi pi-exclamation-triangle text-amber-600 text-xl mt-1"></i>
        <div>
          <p class="font-semibold text-amber-900">System Role</p>
          <p class="text-sm text-amber-700 mt-1">
            This is a system role. The role name cannot be modified and deletion is restricted.
          </p>
        </div>
      </div>
    </div>

    <!-- Multi-Step Progress with Stepper -->
    <Stepper :value="activeStep" linear class="role-stepper">
      <StepList>
        <Step :value="0">Basic Info</Step>
        <Step :value="1">Permissions</Step>
        <Step :value="2">Review</Step>
      </StepList>

      <StepPanels>
        <!-- Step 1: Basic Information -->
        <StepPanel :value="0">
          <div class="space-y-6 p-6">
            <h4 class="text-lg font-semibold text-gray-900 mb-4">Basic Information</h4>

            <!-- Role Name -->
            <div class="form-field">
              <label for="role-name" class="block text-sm font-medium text-gray-700 mb-2">
                Role Name <span class="text-red-500">*</span>
              </label>
              <InputText
                id="role-name"
                v-model="formData.name"
                :disabled="isSystemRole"
                placeholder="e.g., PORTFOLIO_MANAGER"
                class="w-full"
                :class="{ 'border-red-500': errors.name, 'border-green-500': !errors.name && formData.name && isNameValid }"
                @blur="validateName"
                @input="validateName"
              />
              <div v-if="isSystemRole" class="flex items-center gap-2 mt-2 text-sm text-gray-500">
                <i class="pi pi-lock"></i>
                <span>System role names cannot be modified</span>
              </div>
              <div v-else-if="errors.name" class="flex items-center gap-2 mt-2 text-sm text-red-600">
                <i class="pi pi-times-circle"></i>
                <span>{{ errors.name }}</span>
              </div>
              <div v-else-if="formData.name && isNameValid" class="flex items-center gap-2 mt-2 text-sm text-green-600">
                <i class="pi pi-check-circle"></i>
                <span>Role name is available</span>
              </div>
              <p class="text-xs text-gray-500 mt-2">
                Use uppercase letters, numbers, and underscores (e.g., FUND_MANAGER)
              </p>
            </div>

            <!-- Description -->
            <div class="form-field">
              <label for="role-description" class="block text-sm font-medium text-gray-700 mb-2">
                Description <span class="text-red-500">*</span>
              </label>
              <Textarea
                id="role-description"
                v-model="formData.description"
                rows="4"
                placeholder="Describe the role's purpose and responsibilities..."
                class="w-full"
                :class="{ 'border-red-500': errors.description }"
                @blur="validateDescription"
                @input="validateDescription"
              />
              <div class="flex items-center justify-between mt-2">
                <div v-if="errors.description" class="flex items-center gap-2 text-sm text-red-600">
                  <i class="pi pi-times-circle"></i>
                  <span>{{ errors.description }}</span>
                </div>
                <div v-else class="text-sm text-gray-500">
                  {{ formData.description.length }}/500 characters
                </div>
              </div>
              <p class="text-xs text-gray-500 mt-1">
                Minimum 20 characters. Describe what this role can do and who should have it.
              </p>
            </div>

            <!-- Status Toggle -->
            <div class="form-field">
              <label class="block text-sm font-medium text-gray-700 mb-3">
                Status
              </label>
              <div class="flex items-center gap-4">
                <div class="flex items-center gap-2">
                  <RadioButton
                    v-model="formData.isActive"
                    inputId="status-active"
                    :value="true"
                  />
                  <label for="status-active" class="text-sm cursor-pointer">
                    <span class="font-medium text-gray-900">Active</span>
                    <span class="text-gray-500 ml-2">Can be assigned to users</span>
                  </label>
                </div>
                <div class="flex items-center gap-2">
                  <RadioButton
                    v-model="formData.isActive"
                    inputId="status-inactive"
                    :value="false"
                  />
                  <label for="status-inactive" class="text-sm cursor-pointer">
                    <span class="font-medium text-gray-900">Inactive</span>
                    <span class="text-gray-500 ml-2">Cannot be assigned</span>
                  </label>
                </div>
              </div>
            </div>

            <!-- Default Role Checkbox -->
            <div class="form-field">
              <div class="flex items-start gap-3">
                <Checkbox
                  v-model="formData.isDefault"
                  inputId="is-default"
                  :binary="true"
                  :disabled="isSystemRole && !formData.isDefault"
                />
                <div class="flex-1">
                  <label for="is-default" class="text-sm font-medium text-gray-900 cursor-pointer">
                    Set as default role for new users
                  </label>
                  <p class="text-xs text-gray-500 mt-1">
                    Only one role can be set as default. Setting this will remove the default flag from other roles.
                  </p>
                  <div v-if="currentDefaultRole && currentDefaultRole.id !== role?.id && formData.isDefault" class="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                    <i class="pi pi-info-circle mr-1"></i>
                    Current default role "<strong>{{ currentDefaultRole.name }}</strong>" will be updated.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </StepPanel>

        <!-- Step 2: Permission Assignment -->
        <StepPanel :value="1">
          <div class="space-y-4 p-6">
            <div class="flex items-center justify-between mb-4">
              <h4 class="text-lg font-semibold text-gray-900">Permission Assignment</h4>
              <div class="text-sm text-gray-600">
                {{ selectedPermissionsCount }} of {{ totalPermissionsCount }} permissions selected
              </div>
            </div>

            <!-- Loading State -->
            <div v-if="loadingPermissions" class="flex items-center justify-center py-12">
              <i class="pi pi-spin pi-spinner text-4xl text-blue-500"></i>
              <span class="ml-3 text-gray-600">Loading permissions...</span>
            </div>

            <!-- Permissions Content -->
            <template v-else>
              <div v-if="isEditMode && hasPermissionChanges" class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <div class="flex items-center gap-2 text-sm text-blue-700">
                  <i class="pi pi-info-circle"></i>
                  <span>
                    <strong>{{ permissionChangeSummary.added }}</strong> added,
                    <strong>{{ permissionChangeSummary.removed }}</strong> removed,
                    <strong>{{ permissionChangeSummary.unchanged }}</strong> unchanged
                  </span>
                </div>
              </div>

              <!-- Permission Search and Filters -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Search Permissions</label>
                  <span class="p-input-icon-left w-full">
                    <i class="pi pi-search"></i>
                    <InputText
                      v-model="permissionSearch"
                      placeholder="Search by name or description..."
                      class="w-full"
                    />
                  </span>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Resource Filter</label>
                  <Select
                    v-model="permissionResourceFilter"
                    :options="permissionResourceOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="All Resources"
                    class="w-full"
                    showClear
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Status Filter</label>
                  <Select
                    v-model="permissionStatusFilter"
                    :options="permissionStatusOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="All Permissions"
                    class="w-full"
                    showClear
                  />
                </div>
              </div>

              <!-- Bulk Actions -->
              <div class="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded">
                <div class="flex items-center gap-4">
                  <Button
                    label="Select All"
                    icon="pi pi-check-square"
                    class="p-button-sm p-button-outlined"
                    @click="selectAllPermissions"
                  />
                  <Button
                    label="Clear Selection"
                    icon="pi pi-times"
                    class="p-button-sm p-button-outlined p-button-secondary"
                    @click="clearAllPermissions"
                  />
                </div>
                <div class="text-sm text-gray-600">
                  <Button
                    label="Skip for now"
                    class="p-button-sm p-button-text"
                    @click="nextStep"
                  />
                </div>
              </div>

              <!-- Permissions List (Grouped by Resource) -->
              <ScrollPanel style="width: 100%; height: 400px" class="custom-scrollpanel">
                <div class="space-y-4">
                  <div
                    v-for="group in filteredPermissionGroups"
                    :key="group.resource"
                    class="permission-group"
                  >
                    <div class="flex items-center justify-between mb-3 p-3 bg-gray-50 rounded">
                      <div class="flex items-center gap-3">
                        <i class="pi pi-shield text-blue-600 text-lg"></i>
                        <div>
                          <h5 class="font-semibold text-gray-900">{{ group.resource }}</h5>
                          <p class="text-xs text-gray-500">{{ group.description }}</p>
                        </div>
                      </div>
                      <div class="flex items-center gap-3">
                        <span class="text-sm text-gray-600">{{ group.selectedCount }} / {{ group.permissions.length }}</span>
                        <Button
                          :label="group.allSelected ? 'Deselect All' : 'Select All'"
                          icon="pi pi-check"
                          class="p-button-sm p-button-text"
                          @click="toggleGroupPermissions(group)"
                        />
                      </div>
                    </div>

                    <div class="space-y-2 pl-4">
                      <div
                        v-for="permission in group.permissions"
                        :key="permission.name"
                        class="flex items-start gap-3 p-3 hover:bg-gray-50 rounded cursor-pointer"
                        @click="togglePermission(permission.name)"
                      >
                        <Checkbox
                          v-model="formData.permissions"
                          :inputId="`perm-${permission.name}`"
                          :value="permission.name"
                        />
                        <div class="flex-1">
                          <label :for="`perm-${permission.name}`" class="font-medium text-gray-900 cursor-pointer">
                            {{ permission.action }}
                          </label>
                          <p class="text-sm text-gray-600">{{ permission.description }}</p>
                          <div class="flex items-center gap-2 mt-1">
                            <Tag
                              :value="permission.risk"
                              :severity="getRiskSeverity(permission.risk)"
                              class="text-xs"
                            />
                            <Tag
                              v-if="permission.requiresApproval"
                              value="Requires Approval"
                              severity="warning"
                              class="text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div v-if="filteredPermissionGroups.length === 0" class="text-center py-8 text-gray-500">
                    <i class="pi pi-inbox text-4xl mb-2"></i>
                    <p>No permissions found matching your filters</p>
                  </div>
                </div>
              </ScrollPanel>
            </template>
          </div>
        </StepPanel>

        <!-- Step 3: Review & Save -->
        <StepPanel :value="2">
          <div class="space-y-6 p-6">
            <h4 class="text-lg font-semibold text-gray-900 mb-4">Review & Confirm</h4>

            <!-- Role Preview Card -->
            <Card class="role-preview-card">
              <template #content>
                <div class="flex items-start gap-4">
                  <div
                    class="role-icon w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-xl"
                    :style="{ backgroundColor: getRoleColor(formData.name) }"
                  >
                    {{ getRoleInitials(formData.name) }}
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2">
                      <h3 class="text-xl font-bold text-gray-900">{{ formData.name || 'New Role' }}</h3>
                      <Tag
                        v-if="formData.isDefault"
                        value="DEFAULT"
                        severity="info"
                      />
                      <Tag
                        v-if="isSystemRole"
                        value="SYSTEM"
                        severity="warning"
                      />
                      <Tag
                        :value="formData.isActive ? 'ACTIVE' : 'INACTIVE'"
                        :severity="formData.isActive ? 'success' : 'danger'"
                      />
                    </div>
                    <p class="text-gray-600">{{ formData.description || 'No description provided' }}</p>
                  </div>
                </div>
              </template>
            </Card>

            <!-- Changes Summary (Edit Mode) -->
            <div v-if="isEditMode && hasChanges" class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h5 class="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <i class="pi pi-sync"></i>
                Changes Summary
              </h5>
              <div class="space-y-2 text-sm">
                <div v-if="formData.name !== role?.name" class="flex items-center gap-2">
                  <i class="pi pi-arrow-right text-blue-600"></i>
                  <span><strong>Name:</strong> {{ role?.name }} → {{ formData.name }}</span>
                </div>
                <div v-if="formData.description !== role?.description" class="flex items-center gap-2">
                  <i class="pi pi-arrow-right text-blue-600"></i>
                  <span><strong>Description:</strong> Updated</span>
                </div>
                <div v-if="(formData.isActive ? 'ACTIVE' : 'INACTIVE') !== role?.status" class="flex items-center gap-2">
                  <i class="pi pi-arrow-right text-blue-600"></i>
                  <span><strong>Status:</strong> {{ role?.status }} → {{ formData.isActive ? 'ACTIVE' : 'INACTIVE' }}</span>
                </div>
                <div v-if="formData.isDefault !== role?.isDefault" class="flex items-center gap-2">
                  <i class="pi pi-arrow-right text-blue-600"></i>
                  <span><strong>Default Role:</strong> {{ role?.isDefault ? 'Yes' : 'No' }} → {{ formData.isDefault ? 'Yes' : 'No' }}</span>
                </div>
                <div v-if="hasPermissionChanges" class="flex items-center gap-2">
                  <i class="pi pi-arrow-right text-blue-600"></i>
                  <span>
                    <strong>Permissions:</strong>
                    {{ permissionChangeSummary.added }} added,
                    {{ permissionChangeSummary.removed }} removed
                  </span>
                </div>
              </div>
            </div>

            <!-- Permission Summary -->
            <div class="p-4 bg-gray-50 rounded-lg">
              <h5 class="font-semibold text-gray-900 mb-3">Permission Summary</h5>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="text-center">
                  <div class="text-3xl font-bold text-blue-600">{{ selectedPermissionsCount }}</div>
                  <div class="text-sm text-gray-600">Total Permissions</div>
                </div>
                <div class="text-center">
                  <div class="text-3xl font-bold text-green-600">{{ lowRiskPermissionsCount }}</div>
                  <div class="text-sm text-gray-600">Low Risk</div>
                </div>
                <div class="text-center">
                  <div class="text-3xl font-bold text-yellow-600">{{ mediumRiskPermissionsCount }}</div>
                  <div class="text-sm text-gray-600">Medium Risk</div>
                </div>
                <div class="text-center">
                  <div class="text-3xl font-bold text-red-600">{{ highRiskPermissionsCount }}</div>
                  <div class="text-sm text-gray-600">High Risk</div>
                </div>
              </div>
            </div>

            <!-- Warning Messages -->
            <div v-if="!formData.isActive" class="p-3 bg-amber-50 border border-amber-200 rounded">
              <div class="flex items-start gap-2">
                <i class="pi pi-exclamation-triangle text-amber-600 mt-1"></i>
                <p class="text-sm text-amber-700">
                  This role is <strong>inactive</strong> and cannot be assigned to users until activated.
                </p>
              </div>
            </div>

            <div v-if="selectedPermissionsCount === 0" class="p-3 bg-amber-50 border border-amber-200 rounded">
              <div class="flex items-start gap-2">
                <i class="pi pi-exclamation-triangle text-amber-600 mt-1"></i>
                <p class="text-sm text-amber-700">
                  This role has <strong>no permissions</strong> assigned. You can add permissions later.
                </p>
              </div>
            </div>
          </div>
        </StepPanel>
      </StepPanels>
    </Stepper>

    <!-- Dialog Footer -->
    <template #footer>
      <div class="flex items-center justify-between w-full px-6 py-4 bg-gray-50 border-t">
        <!-- Left side: Delete button (edit mode only) -->
        <div class="flex items-center">
          <Button
            v-if="isEditMode && !isSystemRole && canDelete"
            label="Delete Role"
            icon="pi pi-trash"
            class="p-button-danger px-6 py-2 font-semibold text-white bg-red-600 hover:bg-red-700 border-red-600 hover:border-red-700"
            @click="confirmDelete"
          />
        </div>

        <!-- Right side: Navigation buttons -->
        <div class="flex items-center gap-3 ml-auto">
          <Button
            v-if="activeStep > 0"
            label="Previous"
            icon="pi pi-arrow-left"
            class="p-button-outlined px-6 py-2 font-medium text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
            @click="previousStep"
          />
          <Button
            label="Cancel"
            icon="pi pi-times"
            class="p-button-outlined p-button-secondary px-6 py-2 font-medium text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
            @click="handleCancel"
            :disabled="saving"
          />
          <Button
            v-if="activeStep < 2"
            label="Next"
            icon="pi pi-arrow-right"
            iconPos="right"
            class="px-6 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 border-blue-600 hover:border-blue-700"
            :disabled="!canProceedToNextStep"
            @click="nextStep"
          />
          <Button
            v-else
            :label="submitButtonLabel"
            icon="pi pi-check"
            class="px-8 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 border-blue-600 hover:border-blue-700"
            :loading="saving"
            :disabled="!isFormValid"
            @click="handleSubmit"
          />
        </div>
      </div>
    </template>
  </Dialog>

  <!-- Unsaved Changes Confirmation Dialog -->
  <Dialog
    v-model:visible="showUnsavedChangesDialog"
    header="Unsaved Changes"
    :modal="true"
    :closable="false"
    :style="{ width: '400px' }"
  >
    <div class="flex items-start gap-3 mb-4">
      <i class="pi pi-exclamation-triangle text-amber-500 text-2xl"></i>
      <div>
        <p class="text-gray-900 font-medium mb-2">You have unsaved changes.</p>
        <p class="text-sm text-gray-600">Are you sure you want to discard them?</p>
      </div>
    </div>
    <template #footer>
      <Button
        label="Keep Editing"
        class="p-button-outlined"
        @click="showUnsavedChangesDialog = false"
      />
      <Button
        label="Discard Changes"
        class="p-button-danger"
        @click="confirmDiscard"
      />
    </template>
  </Dialog>

  <!-- Delete Confirmation Dialog -->
  <Dialog
    v-model:visible="showDeleteDialog"
    header="Delete Role?"
    :modal="true"
    :closable="false"
    :style="{ width: '400px' }"
  >
    <div class="flex items-start gap-3 mb-4">
      <i class="pi pi-exclamation-circle text-red-500 text-2xl"></i>
      <div>
        <p class="text-gray-900 font-medium mb-2">
          Are you sure you want to delete "{{ role?.name }}"?
        </p>
        <p class="text-sm text-gray-600 mb-3">This action cannot be undone.</p>
        <div v-if="role?.userCount === 0" class="p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
          <i class="pi pi-check-circle mr-1"></i>
          This role has 0 assigned users and can be safely deleted.
        </div>
      </div>
    </div>
    <template #footer>
      <Button
        label="Cancel"
        class="p-button-outlined"
        @click="showDeleteDialog = false"
      />
      <Button
        label="Yes, Delete Role"
        class="p-button-danger"
        :loading="deleting"
        @click="handleDelete"
      />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import Dialog from 'primevue/dialog';
import Stepper from 'primevue/stepper';
import StepList from 'primevue/steplist';
import StepPanels from 'primevue/steppanels';
import Step from 'primevue/step';
import StepPanel from 'primevue/steppanel';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import RadioButton from 'primevue/radiobutton';
import Checkbox from 'primevue/checkbox';
import Button from 'primevue/button';
import Select from 'primevue/select';
import Tag from 'primevue/tag';
import Card from 'primevue/card';
import ScrollPanel from 'primevue/scrollpanel';
import type { Role, CreateRoleData, UpdateRoleData, RoleApiResponse } from '@/types/role';
import { roleApiService } from '@/services/roleApiService';
import { permissionApiService } from '@/services/permissionApiService';

// Props
interface Props {
  visible: boolean;
  role?: Role | null;
  existingRoles?: Role[];
  mode?: 'create' | 'edit';
}

const props = withDefaults(defineProps<Props>(), {
  role: null,
  existingRoles: () => [],
  mode: undefined,
});

// Emits
const emit = defineEmits<{
  'update:visible': [value: boolean];
  'role-created': [role: Role];
  'role-updated': [role: Role];
  'role-deleted': [roleId: string];
}>();

// Composables
const toast = useToast();

// State
const activeStep = ref(0);
const saving = ref(false);
const deleting = ref(false);
const showUnsavedChangesDialog = ref(false);
const showDeleteDialog = ref(false);
const pendingClose = ref(false);
const loadingPermissions = ref(false);

// Form data
interface FormData {
  name: string;
  description: string;
  isActive: boolean;
  isDefault: boolean;
  permissions: string[];
}

const formData = ref<FormData>({
  name: '',
  description: '',
  isActive: true,
  isDefault: false,
  permissions: [],
});

// Validation errors
const errors = ref<Record<string, string>>({});

// Permission filters
const permissionSearch = ref('');
const permissionResourceFilter = ref<string | null>(null);
const permissionStatusFilter = ref<string | null>(null);

// Mode detection
const isEditMode = computed(() => {
  return props.mode === 'edit' || (props.role !== null && props.role !== undefined);
});

const isSystemRole = computed(() => {
  return isEditMode.value && props.role?.isSystemRole === true;
});

const canDelete = computed(() => {
  return isEditMode.value && !isSystemRole.value && props.role?.userCount === 0;
});

// Dialog title and button labels
const dialogTitle = computed(() => {
  return isEditMode.value ? 'Edit Role' : 'Create New Role';
});

const submitButtonLabel = computed(() => {
  return isEditMode.value ? 'Update Role' : 'Create Role';
});

// Permissions data - fetched from API
interface PermissionItem {
  id: string;
  resource: string | null;
  action: string | null;
  name: string;
  description: string | null;
  risk?: string;
  requiresApproval?: boolean;
}

const availablePermissions = ref<PermissionItem[]>([]);

const permissionResourceOptions = computed(() => {
  const resources = [...new Set(availablePermissions.value.map(p => p.resource))];
  return resources.map(r => ({ label: r, value: r }));
});

const permissionStatusOptions = [
  { label: 'All Permissions', value: null },
  { label: 'Selected Only', value: 'selected' },
  { label: 'Unselected Only', value: 'unselected' },
];

// Resource descriptions
const resourceDescriptions: Record<string, string> = {
  USER: 'User account management and administration',
  FUND: 'Fund creation, management, and operations',
  INVESTMENT: 'Investment tracking and portfolio management',
  CAPITAL_CALL: 'Capital call creation and processing',
  DISTRIBUTION: 'Distribution creation and processing',
  DOCUMENT: 'Document storage, access, and management',
  REPORT: 'Reporting and analytics capabilities',
  SYSTEM: 'System configuration and administration',
  AUDIT: 'Audit trail access and management',
};

// Filtered and grouped permissions
const filteredPermissionGroups = computed(() => {
  let permissions = availablePermissions.value;

  // Apply search filter
  if (permissionSearch.value) {
    const search = permissionSearch.value.toLowerCase();
    permissions = permissions.filter(p =>
      p.name.toLowerCase().includes(search) ||
      p.description.toLowerCase().includes(search) ||
      p.action.toLowerCase().includes(search)
    );
  }

  // Apply resource filter
  if (permissionResourceFilter.value) {
    permissions = permissions.filter(p => p.resource === permissionResourceFilter.value);
  }

  // Apply status filter
  if (permissionStatusFilter.value === 'selected') {
    permissions = permissions.filter(p => formData.value.permissions.includes(p.name));
  } else if (permissionStatusFilter.value === 'unselected') {
    permissions = permissions.filter(p => !formData.value.permissions.includes(p.name));
  }

  // Group by resource
  const groups: Record<string, any> = {};
  permissions.forEach(permission => {
    if (!groups[permission.resource]) {
      groups[permission.resource] = {
        resource: permission.resource,
        description: resourceDescriptions[permission.resource] || '',
        permissions: [],
        selectedCount: 0,
        allSelected: false,
      };
    }
    groups[permission.resource].permissions.push(permission);
    if (formData.value.permissions.includes(permission.name)) {
      groups[permission.resource].selectedCount++;
    }
  });

  // Calculate allSelected for each group
  Object.values(groups).forEach((group: any) => {
    group.allSelected = group.selectedCount === group.permissions.length;
  });

  return Object.values(groups);
});

// Permission counts
const selectedPermissionsCount = computed(() => formData.value.permissions.length);
const totalPermissionsCount = computed(() => availablePermissions.value.length);

const lowRiskPermissionsCount = computed(() => {
  return formData.value.permissions.filter(p => {
    const perm = availablePermissions.value.find(ap => ap.name === p);
    return perm?.risk === 'LOW';
  }).length;
});

const mediumRiskPermissionsCount = computed(() => {
  return formData.value.permissions.filter(p => {
    const perm = availablePermissions.value.find(ap => ap.name === p);
    return perm?.risk === 'MEDIUM';
  }).length;
});

const highRiskPermissionsCount = computed(() => {
  return formData.value.permissions.filter(p => {
    const perm = availablePermissions.value.find(ap => ap.name === p);
    return perm?.risk === 'HIGH';
  }).length;
});

// Current default role
const currentDefaultRole = computed(() => {
  return props.existingRoles?.find(r => r.isDefault);
});

// Validation
const isNameValid = computed(() => {
  return formData.value.name && !errors.value.name;
});

const validateName = () => {
  const name = formData.value.name.trim();

  if (!name) {
    errors.value.name = 'Role name is required';
    return false;
  }

  if (name.length < 2) {
    errors.value.name = 'Name must be at least 2 characters';
    return false;
  }

  if (name.length > 50) {
    errors.value.name = 'Name must be less than 50 characters';
    return false;
  }

  if (!/^[A-Z0-9_]+$/.test(name)) {
    errors.value.name = 'Name must be uppercase letters, numbers, and underscores';
    return false;
  }

  // Check uniqueness
  if (!isEditMode.value) {
    const exists = props.existingRoles?.some(r => r.name === name);
    if (exists) {
      errors.value.name = 'Role name already exists';
      return false;
    }
  } else if (props.role) {
    const exists = props.existingRoles?.some(r => r.name === name && r.id !== props.role?.id);
    if (exists) {
      errors.value.name = 'Role name already exists';
      return false;
    }
  }

  delete errors.value.name;
  return true;
};

const validateDescription = () => {
  const description = formData.value.description.trim();

  if (!description) {
    errors.value.description = 'Description is required';
    return false;
  }

  if (description.length < 20) {
    errors.value.description = 'Description must be at least 20 characters';
    return false;
  }

  if (description.length > 500) {
    errors.value.description = 'Description must be less than 500 characters';
    return false;
  }

  delete errors.value.description;
  return true;
};

const canProceedToNextStep = computed(() => {
  if (activeStep.value === 0) {
    return validateName() && validateDescription();
  }
  return true;
});

const isFormValid = computed(() => {
  return validateName() && validateDescription();
});

// Change tracking
const hasChanges = computed(() => {
  if (!isEditMode.value || !props.role) return false;

  const originalPermissions = props.role.permissions || [];
  const currentPermissions = formData.value.permissions || [];

  return (
    formData.value.name !== props.role.name ||
    formData.value.description !== props.role.description ||
    formData.value.isActive !== (props.role.status === 'ACTIVE') ||
    formData.value.isDefault !== props.role.isDefault ||
    JSON.stringify([...currentPermissions].sort()) !== JSON.stringify([...originalPermissions].sort())
  );
});

const hasPermissionChanges = computed(() => {
  if (!isEditMode.value || !props.role) return false;

  const originalPermissions = props.role.permissions || [];
  const currentPermissions = formData.value.permissions || [];

  return JSON.stringify([...currentPermissions].sort()) !== JSON.stringify([...originalPermissions].sort());
});

const permissionChangeSummary = computed(() => {
  if (!isEditMode.value || !props.role) {
    return { added: 0, removed: 0, unchanged: 0 };
  }

  const originalPermissions = props.role.permissions || [];
  const currentPermissions = formData.value.permissions || [];

  const added = currentPermissions.filter(p => !originalPermissions.includes(p)).length;
  const removed = originalPermissions.filter(p => !currentPermissions.includes(p)).length;
  const unchanged = originalPermissions.filter(p => currentPermissions.includes(p)).length;

  return { added, removed, unchanged };
});

/**
 * Fetch permissions from API
 */
const fetchPermissions = async () => {
  try {
    loadingPermissions.value = true;
    const permissions = await permissionApiService.getAllPermissions(false); // Only active permissions

    // Transform API permissions to match form structure and determine risk levels
    availablePermissions.value = permissions.map(perm => ({
      id: perm.id,
      resource: perm.resource,
      action: perm.action,
      name: perm.name,
      description: perm.description || 'No description',
      risk: determineRiskLevel(perm.action),
      requiresApproval: requiresApproval(perm.action),
    }));
  } catch (error) {
    console.error('Error fetching permissions:', error);
    toast.add({
      severity: 'error',
      summary: 'Error Loading Permissions',
      detail: 'Failed to load permissions from server',
      life: 5000,
    });
  } finally {
    loadingPermissions.value = false;
  }
};

/**
 * Determine risk level based on action
 */
const determineRiskLevel = (action: string | null): string => {
  if (!action) return 'LOW';
  const highRiskActions = ['CREATE', 'DELETE', 'PROCESS', 'CONFIGURE', 'EXPORT', 'MANAGE_ROLES', 'READ_CONFIDENTIAL'];
  const mediumRiskActions = ['UPDATE', 'MANAGE_PERFORMANCE', 'GENERATE', 'VIEW_COMPLIANCE', 'MONITOR', 'READ'];

  if (highRiskActions.includes(action)) return 'HIGH';
  if (mediumRiskActions.includes(action)) return 'MEDIUM';
  return 'LOW';
};

/**
 * Determine if permission requires approval
 */
const requiresApproval = (action: string | null): boolean => {
  if (!action) return false;
  const approvalActions = ['CREATE', 'DELETE', 'PROCESS', 'CONFIGURE', 'EXPORT', 'MANAGE_ROLES', 'READ_CONFIDENTIAL'];
  return approvalActions.includes(action);
};

// Form initialization
const initializeForm = () => {
  if (isEditMode.value && props.role) {
    // Create a completely new mutable array from permissions to avoid readonly issues
    // Backend returns permissions in RESOURCE:ACTION format (e.g., INVESTMENT:READ_OWN)
    // No transformation needed - both frontend and backend use the same format
    const permissionsCopy = props.role.permissions
      ? [...props.role.permissions.map(p => String(p))]
      : [];

    formData.value = {
      name: props.role.name,
      description: props.role.description,
      isActive: props.role.status === 'ACTIVE',
      isDefault: props.role.isDefault,
      permissions: permissionsCopy,
    };
  } else {
    formData.value = {
      name: '',
      description: '',
      isActive: true,
      isDefault: false,
      permissions: [],
    };
  }
  errors.value = {};
  activeStep.value = 0;
};

// Watch for role changes
watch(() => props.role, () => {
  if (props.visible) {
    initializeForm();
  }
}, { immediate: true });

watch(() => props.visible, async (newValue) => {
  if (newValue) {
    // Fetch permissions if not already loaded
    if (availablePermissions.value.length === 0) {
      await fetchPermissions();
    }
    initializeForm();
  }
});

// Fetch permissions on component mount
onMounted(async () => {
  await fetchPermissions();
});

// Step navigation
const nextStep = () => {
  if (activeStep.value < 2) {
    activeStep.value++;
  }
};

const previousStep = () => {
  if (activeStep.value > 0) {
    activeStep.value--;
  }
};

// Permission management
const togglePermission = (permissionName: string) => {
  const index = formData.value.permissions.indexOf(permissionName);
  if (index === -1) {
    formData.value.permissions.push(permissionName);
  } else {
    formData.value.permissions.splice(index, 1);
  }
};

const toggleGroupPermissions = (group: any) => {
  if (group.allSelected) {
    // Deselect all
    group.permissions.forEach((p: any) => {
      const index = formData.value.permissions.indexOf(p.name);
      if (index !== -1) {
        formData.value.permissions.splice(index, 1);
      }
    });
  } else {
    // Select all
    group.permissions.forEach((p: any) => {
      if (!formData.value.permissions.includes(p.name)) {
        formData.value.permissions.push(p.name);
      }
    });
  }
};

const selectAllPermissions = () => {
  formData.value.permissions = availablePermissions.value.map(p => p.name);
};

const clearAllPermissions = () => {
  formData.value.permissions = [];
};

// Utility functions
const getRoleColor = (name: string) => {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

const getRoleInitials = (name: string) => {
  if (!name) return '?';
  const words = name.split('_');
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const getRiskSeverity = (risk: string) => {
  switch (risk) {
    case 'LOW': return 'success';
    case 'MEDIUM': return 'warning';
    case 'HIGH': return 'danger';
    default: return 'info';
  }
};

// Form submission
const handleSubmit = async () => {
  if (!isFormValid.value) {
    toast.add({
      severity: 'error',
      summary: 'Validation Error',
      detail: 'Please fix the errors before submitting',
      life: 3000,
    });
    return;
  }

  saving.value = true;

  try {
    if (isEditMode.value && props.role) {
      // Update existing role
      const updateData: UpdateRoleData = {
        id: props.role.id,
        name: formData.value.name,
        description: formData.value.description,
        isActive: formData.value.isActive,
        isDefault: formData.value.isDefault,
        // Note: permissions are managed separately via role-permission endpoints
      };

      const updatedRole = await roleApiService.updateRole(updateData);

      // Sync permissions if any were selected
      if (formData.value.permissions.length > 0) {
        try {
          await roleApiService.syncRolePermissions(updatedRole.id, formData.value.permissions);
        } catch (permError: any) {
          console.error('Error syncing permissions:', permError);
          toast.add({
            severity: 'warn',
            summary: 'Partial Success',
            detail: 'Role updated but failed to sync permissions',
            life: 5000,
          });
          return; // Don't close dialog on permission sync failure
        }
      }

      toast.add({
        severity: 'success',
        summary: 'Role Updated',
        detail: `Role "${updatedRole.name}" has been updated successfully`,
        life: 3000,
      });

      emit('role-updated', updatedRole);
      emit('update:visible', false);
    } else {
      // Create new role - permissions are managed separately via role-permission endpoints
      const createData: CreateRoleData = {
        name: formData.value.name,
        description: formData.value.description,
        isActive: formData.value.isActive,
        isDefault: formData.value.isDefault,
      };

      const newRole = await roleApiService.createRole(createData);

      // Sync permissions if any were selected
      if (formData.value.permissions.length > 0) {
        try {
          await roleApiService.syncRolePermissions(newRole.id, formData.value.permissions);
        } catch (permError: any) {
          console.error('Error syncing permissions:', permError);
          toast.add({
            severity: 'warn',
            summary: 'Partial Success',
            detail: 'Role created but failed to sync permissions',
            life: 5000,
          });
          return; // Don't close dialog on permission sync failure
        }
      }

      toast.add({
        severity: 'success',
        summary: 'Role Created',
        detail: `Role "${newRole.name}" has been created successfully`,
        life: 3000,
      });

      emit('role-created', newRole);
      emit('update:visible', false);
    }
  } catch (error: any) {
    console.error('Error saving role:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Failed to save role',
      life: 5000,
    });
  } finally {
    saving.value = false;
  }
};

// Delete handling
const confirmDelete = () => {
  if (!canDelete.value) {
    toast.add({
      severity: 'error',
      summary: 'Cannot Delete',
      detail: 'This role cannot be deleted',
      life: 3000,
    });
    return;
  }
  showDeleteDialog.value = true;
};

const handleDelete = async () => {
  if (!props.role) return;

  deleting.value = true;

  try {
    await roleApiService.deleteRole(props.role.id);

    toast.add({
      severity: 'success',
      summary: 'Role Deleted',
      detail: `Role "${props.role.name}" has been deleted successfully`,
      life: 3000,
    });

    emit('role-deleted', props.role.id);
    emit('update:visible', false);
    showDeleteDialog.value = false;
  } catch (error: any) {
    console.error('Error deleting role:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Failed to delete role',
      life: 5000,
    });
  } finally {
    deleting.value = false;
  }
};

// Cancel and close handling
const handleCancel = () => {
  if (hasChanges.value) {
    showUnsavedChangesDialog.value = true;
    pendingClose.value = true;
  } else {
    emit('update:visible', false);
  }
};

const handleVisibilityChange = (value: boolean) => {
  if (!value && hasChanges.value && !pendingClose.value) {
    showUnsavedChangesDialog.value = true;
  } else {
    emit('update:visible', value);
  }
};

const confirmDiscard = () => {
  showUnsavedChangesDialog.value = false;
  pendingClose.value = false;
  emit('update:visible', false);
};
</script>

<style scoped>
.role-form-dialog :deep(.p-dialog) {
  max-height: 90vh;
}

.role-form-dialog :deep(.p-dialog-content) {
  max-height: calc(90vh - 200px);
  overflow-y: auto;
}

.permission-group {
  @apply border border-gray-200 rounded-lg p-4 mb-4;
}

.permission-group:hover {
  @apply border-blue-300 bg-blue-50;
}

.role-preview-card {
  @apply shadow-md;
}

.custom-scrollpanel :deep(.p-scrollpanel-content) {
  @apply pr-4;
}
</style>
