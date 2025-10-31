<template>
  <Dialog
    v-model:visible="dialogVisible"
    :modal="true"
    :draggable="false"
    :closable="true"
    :style="{ width: '90vw', maxWidth: '900px' }"
    class="role-management-dialog"
    aria-labelledby="dialog-title"
    aria-describedby="dialog-description"
    @show="onDialogShow"
    @hide="onDialogHide"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <i class="pi pi-users text-white text-lg"></i>
        </div>
        <div>
          <h3 id="dialog-title" class="text-xl font-semibold text-gray-900 m-0">Manage User Roles</h3>
          <p id="dialog-description" class="text-sm text-gray-600 m-0 mt-1">Assign or revoke roles with audit trail</p>
        </div>
      </div>
    </template>

    <div class="role-management-content">
      <!-- User Information Section -->
      <div v-if="user" class="user-info-section mb-4 p-4 bg-gray-50 rounded-lg border" role="region" aria-labelledby="user-info-heading">
        <h4 id="user-info-heading" class="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <i class="pi pi-user text-blue-600"></i>
          User Information
        </h4>
        <div class="flex items-center gap-4">
          <div class="flex-1">
            <div class="text-lg font-semibold text-gray-900">{{
                  user.fullName ||
                  `${user.firstName} ${user.lastName}`.trim() ||
                  'Unknown User'
                }}</div>
            <div class="text-sm text-gray-600">{{ user.email }}</div>
            <div class="flex items-center gap-2 mt-2">
              <span class="text-xs text-gray-500">Current Roles:</span>
              <div class="flex gap-1 flex-wrap">
                <div
                  v-for="role in user.roles || []"
                  :key="role.id || role.name"
                  class="role-chip flex items-center gap-1 px-2 py-1 rounded-md text-xs border transition-all duration-200"
                  :class="[
                    operationMode === 'revoke' && isRoleSelected(role) ?
                      'bg-red-50 border-red-200 text-red-800' :
                      'bg-white border-gray-200 text-gray-700',
                    operationMode === 'revoke' ? 'cursor-pointer hover:bg-red-50' : ''
                  ]"
                  @click="operationMode === 'revoke' ? toggleRoleSelection(role) : null"
                >
                  <i
                    v-if="operationMode === 'revoke' && isRoleSelected(role)"
                    class="pi pi-times text-red-600"
                  ></i>
                  <Tag
                    :value="role.name"
                    :severity="getRoleSeverity(role.name)"
                    class="text-xs"
                  />
                </div>
                <Tag
                  v-if="!user.roles || user.roles.length === 0"
                  value="No roles assigned"
                  severity="warning"
                  class="text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Operation Mode Toggle - Improved Tab-Style Interface -->
      <div class="operation-mode-section mb-4" role="region" aria-labelledby="operation-mode-heading">
        <h4 id="operation-mode-heading" class="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <i class="pi pi-cog text-purple-600"></i>
          Choose Action
        </h4>

        <!-- Tab-style Operation Mode Selection -->
        <div class="operation-tabs" role="tablist" aria-label="Role operation mode selection">
          <button
            role="tab"
            :aria-selected="operationMode === 'assign'"
            :aria-controls="operationMode === 'assign' ? 'assign-panel' : undefined"
            :tabindex="operationMode === 'assign' ? 0 : -1"
            class="operation-tab"
            :class="{
              'operation-tab-active': operationMode === 'assign',
              'operation-tab-inactive': operationMode !== 'assign'
            }"
            @click="setOperationMode('assign')"
            @keydown.enter="setOperationMode('assign')"
            @keydown.space.prevent="setOperationMode('assign')"
          >
            <div class="flex items-center gap-3">
              <div class="tab-icon" :class="operationMode === 'assign' ? 'tab-icon-active text-green-600' : 'tab-icon-inactive text-gray-500'">
                <i class="pi pi-user-plus text-xl"></i>
              </div>
              <div class="text-left">
                <div class="font-semibold">Add Roles</div>
                <div class="text-xs opacity-80">Grant new permissions to user</div>
              </div>
            </div>
            <div v-if="operationMode === 'assign'" class="ml-auto">
              <i class="pi pi-check text-green-600"></i>
            </div>
          </button>

          <button
            role="tab"
            :aria-selected="operationMode === 'revoke'"
            :aria-controls="operationMode === 'revoke' ? 'revoke-panel' : undefined"
            :tabindex="operationMode === 'revoke' ? 0 : -1"
            class="operation-tab"
            :class="{
              'operation-tab-active': operationMode === 'revoke',
              'operation-tab-inactive': operationMode !== 'revoke'
            }"
            :disabled="!user?.roles || user.roles.length === 0"
            @click="setOperationMode('revoke')"
            @keydown.enter="setOperationMode('revoke')"
            @keydown.space.prevent="setOperationMode('revoke')"
          >
            <div class="flex items-center gap-3">
              <div class="tab-icon" :class="operationMode === 'revoke' ? 'tab-icon-active text-red-600' : 'tab-icon-inactive text-gray-500'">
                <i class="pi pi-user-minus text-xl"></i>
              </div>
              <div class="text-left">
                <div class="font-semibold">Remove Roles</div>
                <div class="text-xs opacity-80">Revoke existing permissions</div>
              </div>
            </div>
            <div v-if="operationMode === 'revoke'" class="ml-auto">
              <i class="pi pi-check text-red-600"></i>
            </div>
          </button>
        </div>
      </div>

      <!-- Role Assignment Section (shown when operationMode === 'assign') -->
      <div v-if="operationMode === 'assign'" id="assign-panel" role="tabpanel" aria-labelledby="assign-tab" class="role-assignment-section mb-6">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-lg font-medium text-gray-900 flex items-center gap-2">
            <i class="pi pi-shield text-green-600"></i>
            Select Roles to Assign
          </h4>
          <Button
            label="Refresh Roles"
            icon="pi pi-refresh"
            class="p-button-sm p-button-outlined"
            @click="loadAvailableRoles"
            :loading="isLoadingRoles"
            v-tooltip.left="'Reload available roles from server'"
          />
        </div>

        <!-- Role Search and Filter -->
        <div class="mb-4">
          <InputGroup>
            <InputGroupAddon>
              <i class="pi pi-search"></i>
            </InputGroupAddon>
            <InputText
              v-model="roleSearchTerm"
              placeholder="Search available roles..."
              class="flex-1"
            />
          </InputGroup>
        </div>

        <!-- Loading State -->
        <div v-if="isLoadingRoles" class="flex items-center justify-center py-8">
          <ProgressSpinner style="width: 40px; height: 40px" strokeWidth="3" />
          <span class="ml-3 text-gray-600">Loading available roles...</span>
        </div>

        <!-- Error State -->
        <div v-else-if="rolesError" class="border border-red-200 rounded-lg p-6 bg-red-50">
          <div class="text-center">
            <i class="pi pi-exclamation-triangle text-red-500 text-3xl mb-3"></i>
            <h5 class="text-red-800 font-semibold mb-2">Unable to Load Roles</h5>
            <p class="text-red-600 mb-4">{{ rolesError }}</p>
            <div class="flex gap-2 justify-center">
              <Button
                label="Retry Loading"
                icon="pi pi-refresh"
                class="p-button-sm"
                @click="loadAvailableRoles"
                :loading="isLoadingRoles"
              />
            </div>
          </div>
        </div>

        <!-- Available Roles Grid -->
        <div v-else class="roles-grid grid grid-cols-1 md:grid-cols-2 gap-4 max-h-80 overflow-y-auto">
          <div
            v-for="role in filteredAvailableRoles"
            :key="role.id"
            class="role-card p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md focus:outline-2 focus:outline-offset-2 focus:outline-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            :class="{
              'border-blue-500 bg-blue-50 shadow-md': selectedRole?.id === role.id,
              'border-gray-200 bg-white hover:border-gray-300': selectedRole?.id !== role.id,
              'opacity-50 cursor-not-allowed': isRoleDisabled(role)
            }"
            :aria-label="`${role.name} role - ${role.description} - ${role.permissions?.length || 0} permissions${isRoleDisabled(role) ? ' - Already assigned' : ''}`"
            :aria-pressed="selectedRole?.id === role.id"
            role="button"
            tabindex="0"
            @click="selectRole(role)"
            @keydown.enter="selectRole(role)"
            @keydown.space.prevent="selectRole(role)"
          >
            <div class="flex items-start gap-3">
              <div
                class="role-icon w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                :style="{ backgroundColor: getRoleColor(role.name) }"
              >
                {{ getRoleInitials(role.name) }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <h5 class="font-semibold text-gray-900 text-sm truncate">{{ role.name }}</h5>
                  <Tag
                    v-if="role.isDefault"
                    value="DEFAULT"
                    severity="info"
                    class="text-xs"
                  />
                  <i
                    v-if="selectedRole?.id === role.id"
                    class="pi pi-check-circle text-blue-600 text-lg"
                  />
                </div>
                <p class="text-xs text-gray-600 mb-2 line-clamp-2">
                  {{ role.description || 'No description available' }}
                </p>
                <div class="flex items-center justify-between text-xs text-gray-500">
                  <span>{{ role.permissions?.length || 0 }} permissions</span>
                  <span v-if="isRoleDisabled(role)" class="text-amber-700 font-medium bg-amber-50 px-2 py-1 rounded text-xs">
                    Already assigned
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="!isLoadingRoles && !rolesError && filteredAvailableRoles.length === 0" class="col-span-full text-center py-8 text-gray-500">
            <i class="pi pi-info-circle text-2xl mb-2"></i>
            <p>No available roles found</p>
            <p class="text-sm">Try adjusting your search terms</p>
          </div>
        </div>
      </div>

      <!-- Role Removal Section (shown when operationMode === 'revoke') -->
      <div v-if="operationMode === 'revoke'" id="revoke-panel" role="tabpanel" aria-labelledby="revoke-tab" class="role-removal-section mb-6">
        <h4 class="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <i class="pi pi-minus-circle text-red-600"></i>
          Select Roles to Remove
        </h4>

        <div v-if="user?.roles && user.roles.length > 0" class="roles-grid grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="role in user.roles"
            :key="role.id || role.name"
            class="role-card p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md focus:outline-2 focus:outline-offset-2 focus:outline-red-500 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            :class="{
              'border-red-500 bg-red-50 shadow-md': isRoleSelected(role),
              'border-gray-200 bg-white hover:border-red-300': !isRoleSelected(role)
            }"
            :aria-label="`${role.name} role - ${role.description || 'No description'} - Click to ${isRoleSelected(role) ? 'deselect' : 'select'} for removal`"
            :aria-pressed="isRoleSelected(role)"
            role="button"
            tabindex="0"
            @click="toggleRoleSelection(role)"
            @keydown.enter="toggleRoleSelection(role)"
            @keydown.space.prevent="toggleRoleSelection(role)"
          >
            <div class="flex items-start gap-3">
              <div
                class="role-icon w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                :style="{ backgroundColor: getRoleColor(role.name) }"
              >
                {{ getRoleInitials(role.name) }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <h5 class="font-semibold text-gray-900 text-sm truncate">{{ role.name }}</h5>
                  <i
                    v-if="isRoleSelected(role)"
                    class="pi pi-check-circle text-red-600 text-lg"
                  />
                </div>
                <p class="text-xs text-gray-600 mb-2 line-clamp-2">
                  {{ role.description || 'No description available' }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8 text-gray-500">
          <i class="pi pi-info-circle text-2xl mb-2"></i>
          <p>User has no roles to remove</p>
        </div>
      </div>

      <!-- Operation Details Section -->
      <div v-if="(operationMode === 'assign' && selectedRole) || (operationMode === 'revoke' && selectedRolesToRevoke.length > 0)" class="operation-details-section mb-6">
        <h4 class="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <i class="pi pi-info-circle text-purple-600"></i>
          {{ operationMode === 'assign' ? 'Assignment' : 'Revocation' }} Details
        </h4>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Reason (required for both operations) -->
          <div class="col-span-full">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              {{ operationMode === 'assign' ? 'Reason for Assignment' : 'Reason for Revocation' }}
              <span class="text-red-500">*</span>
            </label>
            <Textarea
              v-model="operationReason"
              :placeholder="`Provide a reason for this role ${operationMode}ment (required for audit trail)...`"
              :rows="3"
              class="w-full"
              :class="{ 'p-invalid': !operationReason && showValidationErrors }"
              :aria-describedby="!operationReason && showValidationErrors ? 'reason-error' : undefined"
              aria-required="true"
            />
            <small v-if="!operationReason && showValidationErrors" id="reason-error" class="p-error" role="alert">
              {{ operationMode === 'assign' ? 'Assignment' : 'Revocation' }} reason is required for audit purposes
            </small>
          </div>

          <!-- Assignment-specific fields (only shown for assign mode) -->
          <template v-if="operationMode === 'assign'">
            <!-- Assignment Duration -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Assignment Duration
              </label>
              <Select
                v-model="assignmentDuration"
                :options="durationOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Select duration"
                class="w-full"
              />
            </div>

            <!-- Expiry Date (if temporary) -->
            <div v-if="assignmentDuration === 'TEMPORARY'">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Expiry Date <span class="text-red-500">*</span>
              </label>
              <DatePicker
                v-model="expiryDate"
                dateFormat="mm/dd/yy"
                :minDate="new Date()"
                placeholder="Select expiry date"
                class="w-full"
                :class="{ 'p-invalid': assignmentDuration === 'TEMPORARY' && !expiryDate && showValidationErrors }"
                :aria-describedby="assignmentDuration === 'TEMPORARY' && !expiryDate && showValidationErrors ? 'expiry-error' : undefined"
                aria-required="true"
              />
              <small v-if="assignmentDuration === 'TEMPORARY' && !expiryDate && showValidationErrors" id="expiry-error" class="p-error" role="alert">
                Expiry date is required for temporary assignments
              </small>
            </div>

            <!-- Notification Options -->
            <div class="col-span-full">
              <label class="block text-sm font-medium text-gray-700 mb-3">Notification Options</label>
              <div class="flex flex-col gap-2">
                <div class="flex items-center">
                  <Checkbox
                    v-model="notifyUser"
                    inputId="notify-user"
                    binary
                  />
                  <label for="notify-user" class="ml-2 text-sm text-gray-700">
                    Notify user via email about role {{ operationMode }}ment
                  </label>
                </div>
                <div class="flex items-center">
                  <Checkbox
                    v-model="notifyAdmins"
                    inputId="notify-admins"
                    binary
                  />
                  <label for="notify-admins" class="ml-2 text-sm text-gray-700">
                    Notify administrators about this {{ operationMode }}ment
                  </label>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- Permission Preview Section (only for assignment) -->
      <div v-if="operationMode === 'assign' && selectedRole" class="permission-preview-section">
        <h4 class="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <i class="pi pi-eye text-indigo-600"></i>
          Permission Preview
        </h4>

        <div class="permissions-container max-h-40 overflow-y-auto border rounded-lg p-3 bg-gray-50">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            <div
              v-for="permission in selectedRole.permissions || []"
              :key="permission"
              class="permission-chip flex items-center gap-2 px-3 py-1 bg-white rounded-md border text-sm"
            >
              <i class="pi pi-check text-green-600 text-xs"></i>
              <span class="text-gray-700">{{ permission }}</span>
            </div>
          </div>
          <div v-if="!selectedRole.permissions || selectedRole.permissions.length === 0" class="text-center text-gray-500 py-4">
            <i class="pi pi-info-circle"></i>
            <p class="text-sm">No permissions data available</p>
          </div>
        </div>
      </div>

      <!-- Selected Roles Summary (only for revocation) -->
      <div v-if="operationMode === 'revoke' && selectedRolesToRevoke.length > 0" class="selected-roles-summary">
        <h4 class="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <i class="pi pi-list text-red-600"></i>
          Roles to Remove ({{ selectedRolesToRevoke.length }})
        </h4>
        <div class="flex gap-2 flex-wrap">
          <Tag
            v-for="role in selectedRolesToRevoke"
            :key="role.id || role.name"
            :value="role.name"
            severity="danger"
            class="text-sm"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between bg-gray-50 border-t px-8 py-6 -mx-6 -mb-6">
        <div class="flex items-center text-sm text-gray-600">
          <i class="pi pi-info-circle mr-2 text-blue-500"></i>
          <span class="font-medium">Changes will be applied immediately</span>
        </div>
        <div class="flex gap-4 ml-8">
          <Button
            label="Cancel"
            icon="pi pi-times"
            class="p-button-outlined p-button-secondary px-6 py-3 text-gray-700 font-medium"
            @click="closeDialog"
            :disabled="isProcessing"
          />
          <!-- Assign Mode Action Button -->
          <Button
            v-if="operationMode === 'assign'"
            :label="selectedRole ? `Grant ${selectedRole.name}` : 'Select Role to Grant'"
            icon="pi pi-user-plus"
            class="p-button-success px-6 py-3 text-white font-semibold"
            @click="assignRole"
            :loading="isProcessing"
            :disabled="!canAssignRole"
          />
          <!-- Remove Mode Action Button -->
          <Button
            v-else-if="operationMode === 'revoke'"
            :label="selectedRolesToRevoke.length > 0 ? `Remove ${selectedRolesToRevoke.length} Role${selectedRolesToRevoke.length > 1 ? 's' : ''}` : 'Select Roles to Remove'"
            icon="pi pi-user-minus"
            class="p-button-danger px-6 py-3 text-white font-semibold"
            @click="showRevokeConfirmation"
            :loading="isProcessing"
            :disabled="!canRevokeRoles"
          />
        </div>
      </div>
    </template>
  </Dialog>

  <!-- Revoke Confirmation Dialog -->
  <Dialog
    v-model:visible="revokeConfirmationVisible"
    modal
    header="Confirm Role Removal"
    :style="{ width: '500px' }"
    class="revoke-confirmation-dialog"
  >
    <div class="confirmation-content">
      <div class="flex items-center gap-3 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
        <i class="pi pi-exclamation-triangle text-red-500 text-2xl"></i>
        <div>
          <h5 class="text-red-800 font-semibold mb-1">Confirm Role Removal</h5>
          <p class="text-red-700 text-sm">This action will immediately revoke the selected roles from the user.</p>
        </div>
      </div>

      <div class="mb-4">
        <h6 class="font-semibold text-gray-900 mb-2">User:</h6>
        <p class="text-gray-700">{{ user?.fullName || user?.email }}</p>
      </div>

      <div class="mb-4">
        <h6 class="font-semibold text-gray-900 mb-2">Roles to Remove:</h6>
        <div class="flex gap-2 flex-wrap">
          <Tag
            v-for="role in selectedRolesToRevoke"
            :key="role.id || role.name"
            :value="role.name"
            severity="danger"
          />
        </div>
      </div>

      <div class="mb-4">
        <h6 class="font-semibold text-gray-900 mb-2">Reason:</h6>
        <p class="text-gray-700 p-3 bg-gray-50 rounded border">{{ operationReason }}</p>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button
          label="Cancel"
          icon="pi pi-times"
          class="p-button-outlined px-6 py-3 text-gray-700"
          @click="revokeConfirmationVisible = false"
          :disabled="isProcessing"
        />
        <Button
          label="Confirm Removal"
          icon="pi pi-check"
          class="p-button-danger px-6 py-3 text-white font-semibold"
          @click="revokeRoles"
          :loading="isProcessing"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useApi } from '@/composables/useApi';
import type { RoleResponseDto } from '@/types/admin';

import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Tag from 'primevue/tag';
import Textarea from 'primevue/textarea';
import DatePicker from 'primevue/datepicker';
import Checkbox from 'primevue/checkbox';
import Dialog from 'primevue/dialog';
import ProgressSpinner from 'primevue/progressspinner';

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

interface RoleOperationResult {
  userId: string;
  userName: string;
  operation: 'assign' | 'revoke';
  roleName?: string;
  revokedRoles?: Array<{ id?: string; name: string }>;
  reason: string;
  assignedAt?: Date;
  revokedAt?: Date;
  backendResponse?: unknown;
}

// Props
const props = defineProps<{
  visible: boolean;
  user: UserWithRoles | null;
}>();

// Emits
const emit = defineEmits<{
  'update:visible': [visible: boolean];
  'role-assigned': [result: RoleOperationResult];
  'role-revoked': [result: RoleOperationResult];
  'user-role-updated': [data: { userId: string; operation: 'assign' | 'remove'; role: any; updatedUser: UserWithRoles }];
}>();

// Composables
const toast = useToast();
const { api } = useApi();

// State
const dialogVisible = ref(props.visible);
const operationMode = ref<'assign' | 'revoke'>('assign');
const selectedRole = ref<RoleResponseDto | null>(null);
const selectedRolesToRevoke = ref<UserWithRoles['roles']>([]);
const roleSearchTerm = ref('');
const operationReason = ref('');
const assignmentDuration = ref('PERMANENT');
const expiryDate = ref(null);
const notifyUser = ref(true);
const notifyAdmins = ref(false);
const isProcessing = ref(false);
const showValidationErrors = ref(false);
const isLoadingRoles = ref(false);
const rolesError = ref<string | null>(null);
const revokeConfirmationVisible = ref(false);

// Available roles from API
const availableRoles = ref<RoleResponseDto[]>([]);

const durationOptions = [
  { label: 'Permanent', value: 'PERMANENT' },
  { label: 'Temporary', value: 'TEMPORARY' },
  { label: '30 Days', value: '30_DAYS' },
  { label: '90 Days', value: '90_DAYS' },
  { label: '1 Year', value: '1_YEAR' },
];

// Computed properties
const filteredAvailableRoles = computed(() => {
  let filtered = availableRoles.value.filter(role => role.isActive);

  if (roleSearchTerm.value) {
    const search = roleSearchTerm.value.toLowerCase();
    filtered = filtered.filter(role =>
      role.name.toLowerCase().includes(search) ||
      (role.description && role.description.toLowerCase().includes(search))
    );
  }

  return filtered;
});

const canAssignRole = computed(() => {
  if (operationMode.value !== 'assign') return false;
  if (!selectedRole.value || !operationReason.value.trim()) return false;
  if (assignmentDuration.value === 'TEMPORARY' && !expiryDate.value) return false;
  return !isProcessing.value;
});

const canRevokeRoles = computed(() => {
  if (operationMode.value !== 'revoke') return false;
  if (selectedRolesToRevoke.value.length === 0 || !operationReason.value.trim()) return false;
  return !isProcessing.value;
});

// Watchers
watch(() => props.visible, (newValue) => {
  dialogVisible.value = newValue;
});

watch(dialogVisible, (newValue) => {
  emit('update:visible', newValue);
});

// Methods
const setOperationMode = (mode: 'assign' | 'revoke') => {
  operationMode.value = mode;
  resetOperationState();
};

const isRoleSelected = (role: UserWithRoles['roles'][0]) => {
  return selectedRolesToRevoke.value.some(r => (r.id || r.name) === (role.id || role.name));
};

const toggleRoleSelection = (role: UserWithRoles['roles'][0]) => {
  if (operationMode.value !== 'revoke') return;

  const index = selectedRolesToRevoke.value.findIndex(r => (r.id || r.name) === (role.id || role.name));
  if (index >= 0) {
    selectedRolesToRevoke.value.splice(index, 1);
  } else {
    selectedRolesToRevoke.value.push(role);
  }
  showValidationErrors.value = false;
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

const getRoleSeverity = (roleName: string) => {
  const severities: Record<string, string> = {
    'SUPER_ADMIN': 'danger',
    'FUND_MANAGER': 'warning',
    'COMPLIANCE_OFFICER': 'info',
    'ANALYST': 'success',
    'INVESTOR': 'success',
    'VIEWER': 'secondary',
  };
  return severities[roleName] || 'info';
};

const isRoleDisabled = (role: RoleResponseDto) => {
  return props.user?.roles?.some((userRole) => userRole.name === role.name) || false;
};

const selectRole = (role: RoleResponseDto) => {
  if (operationMode.value !== 'assign' || isRoleDisabled(role)) return;
  selectedRole.value = role;
  showValidationErrors.value = false;
};

const onDialogShow = async () => {
  resetForm();
  await loadAvailableRoles();
};

const onDialogHide = () => {
  resetForm();
};

const loadAvailableRoles = async () => {
  if (isLoadingRoles.value) return;

  console.log('🔄 Loading available roles...');
  isLoadingRoles.value = true;
  rolesError.value = null;

  try {
    const response = await api.get<RoleResponseDto[]>('/admin/roles');
    availableRoles.value = response || [];
    console.log('📋 Loaded roles:', availableRoles.value.length, 'roles');
  } catch (error: unknown) {
    console.error('❌ Failed to load available roles:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    rolesError.value = `Failed to load available roles: ${errorMessage}. Please try again.`;

    toast.add({
      severity: 'error',
      summary: 'Loading Error',
      detail: 'Failed to load available roles from the server.',
      life: 7000
    });
  } finally {
    isLoadingRoles.value = false;
  }
};

const resetOperationState = () => {
  selectedRole.value = null;
  selectedRolesToRevoke.value = [];
  operationReason.value = '';
  showValidationErrors.value = false;
};

const resetForm = () => {
  operationMode.value = 'assign';
  resetOperationState();
  roleSearchTerm.value = '';
  assignmentDuration.value = 'PERMANENT';
  expiryDate.value = null;
  notifyUser.value = true;
  notifyAdmins.value = false;
  isProcessing.value = false;
  rolesError.value = null;
  revokeConfirmationVisible.value = false;
};

const closeDialog = () => {
  dialogVisible.value = false;
};

const assignRole = async () => {
  showValidationErrors.value = true;

  if (!props.user?.id) {
    toast.add({
      severity: 'error',
      summary: 'Invalid User',
      detail: 'User ID is missing. Please close this dialog and try again.',
      life: 4000
    });
    return;
  }

  if (!canAssignRole.value) {
    toast.add({
      severity: 'warn',
      summary: 'Validation Error',
      detail: 'Please fill in all required fields before proceeding.',
      life: 4000
    });
    return;
  }

  isProcessing.value = true;

  try {
    const assignmentPayload = {
      roles: [selectedRole.value!.name],
      reason: operationReason.value,
      ...(expiryDate.value && {
        expiresAt: new Date(expiryDate.value).toISOString()
      })
    };

    const response = await api.post(`/admin/users/${props.user.id}/roles`, assignmentPayload);

    const result = {
      userId: props.user?.id,
      userName: props.user?.name || props.user?.email,
      roleId: selectedRole.value?.id,
      roleName: selectedRole.value?.name,
      reason: operationReason.value,
      duration: assignmentDuration.value,
      expiryDate: expiryDate.value,
      operation: 'assign',
      assignedAt: new Date(),
      backendResponse: response
    };

    emit('role-assigned', result);

    // Emit event to notify parent component for datatable update
    emit('user-role-updated', {
      userId: props.user!.id,
      operation: 'assign',
      role: selectedRole.value!,
      updatedUser: props.user!
    });

    toast.add({
      severity: 'success',
      summary: 'Role Assigned Successfully',
      detail: `${selectedRole.value?.name} role has been assigned to ${props.user?.name || props.user?.email}`,
      life: 5000
    });

    closeDialog();
  } catch (error: unknown) {
    console.error('❌ Role assignment error:', error);

    toast.add({
      severity: 'error',
      summary: 'Assignment Failed',
      detail: 'Failed to assign role. Please try again or contact support.',
      life: 7000
    });
  } finally {
    isProcessing.value = false;
  }
};

const showRevokeConfirmation = () => {
  showValidationErrors.value = true;

  if (!canRevokeRoles.value) {
    toast.add({
      severity: 'warn',
      summary: 'Validation Error',
      detail: 'Please select roles and provide a reason before proceeding.',
      life: 4000
    });
    return;
  }

  revokeConfirmationVisible.value = true;
};

const revokeRoles = async () => {
  if (!props.user?.id) {
    toast.add({
      severity: 'error',
      summary: 'Invalid User',
      detail: 'User ID is missing. Please close this dialog and try again.',
      life: 4000
    });
    return;
  }

  isProcessing.value = true;

  try {
    const revokePayload = {
      roles: selectedRolesToRevoke.value.map(role => role.name),
      reason: operationReason.value
    };

    console.log('📤 Sending revoke payload:', revokePayload);

    const response = await api.delete(`/admin/users/${props.user.id}/roles`, {
      data: revokePayload
    });

    const result = {
      userId: props.user?.id,
      userName: props.user?.name || props.user?.email,
      revokedRoles: selectedRolesToRevoke.value.map(role => ({
        id: role.id,
        name: role.name
      })),
      reason: operationReason.value,
      operation: 'revoke',
      revokedAt: new Date(),
      backendResponse: response
    };

    emit('role-revoked', result);

    // Emit event to notify parent component for datatable update (for each revoked role)
    selectedRolesToRevoke.value.forEach(role => {
      emit('user-role-updated', {
        userId: props.user!.id,
        operation: 'remove',
        role: role,
        updatedUser: props.user!
      });
    });

    toast.add({
      severity: 'success',
      summary: 'Roles Revoked Successfully',
      detail: `${selectedRolesToRevoke.value.length} role(s) have been removed from ${props.user?.name || props.user?.email}`,
      life: 5000
    });

    revokeConfirmationVisible.value = false;
    closeDialog();
  } catch (error: unknown) {
    console.error('❌ Role revocation error:', error);

    let errorDetail = 'Failed to revoke roles. Please try again or contact support.';

    if (error.response?.status === 400) {
      if (error.response.data?.message) {
        errorDetail = error.response.data.message;
      }
    }

    toast.add({
      severity: 'error',
      summary: 'Revocation Failed',
      detail: errorDetail,
      life: 7000
    });
  } finally {
    isProcessing.value = false;
  }
};
</script>

<style scoped>
.role-management-dialog :deep(.p-dialog-header) {
  @apply border-b border-gray-200 bg-white;
}

.role-management-dialog :deep(.p-dialog-content) {
  @apply bg-gray-50;
}

.role-management-dialog :deep(.p-dialog-footer) {
  @apply border-t border-gray-200 bg-white;
}

.role-management-content {
  @apply space-y-6;
}

.role-chip {
  transition: all 0.2s ease;
}

.role-chip:hover {
  transform: translateY(-1px);
}

.roles-grid {
  @apply custom-scrollbar;
}

.role-card {
  @apply transform transition-all duration-200;
}

.role-card:hover {
  @apply scale-105;
}

.role-icon {
  @apply shadow-sm border border-white/20;
}

.permission-chip {
  @apply shadow-sm;
}

.permissions-container {
  @apply custom-scrollbar;
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

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Animation for role selection */
.role-card.border-blue-500,
.role-card.border-red-500 {
  animation: selectPulse 0.3s ease-in-out;
}

@keyframes selectPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}

/* Enhanced Tab-Style Operation Mode Styles */
.operation-tabs {
  @apply flex flex-col gap-3;
}

.operation-tab {
  @apply w-full p-4 text-left border-2 rounded-lg transition-all duration-200 focus:outline-2 focus:outline-offset-2 focus:outline-blue-500;
  @apply hover:shadow-md;
}

.operation-tab-active {
  @apply border-blue-500 bg-blue-50 shadow-md;
}

.operation-tab-inactive {
  @apply border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50;
}

.operation-tab:disabled {
  @apply opacity-50 cursor-not-allowed hover:shadow-none hover:border-gray-200 hover:bg-white;
}

.tab-icon {
  @apply w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200;
}

.tab-icon-active {
  @apply bg-gradient-to-br from-green-100 to-blue-100 border border-green-200;
}

.tab-icon-inactive {
  @apply bg-gray-100 border border-gray-200;
}

.operation-tab:hover .tab-icon-inactive {
  @apply bg-gray-200 border-gray-300;
}

/* Enhanced footer styling */
.p-dialog-footer .p-button-success {
  @apply bg-green-600 border-green-600 hover:bg-green-700 hover:border-green-700;
}

.p-dialog-footer .p-button-danger {
  @apply bg-red-600 border-red-600 hover:bg-red-700 hover:border-red-700;
}

/* Confirmation dialog specific styling */
.revoke-confirmation-dialog :deep(.p-dialog-footer .p-button) {
  @apply min-h-[44px] font-medium transition-all duration-200 shadow-sm;
}

.revoke-confirmation-dialog :deep(.p-dialog-footer .p-button-danger) {
  @apply bg-red-600 border-red-600 hover:bg-red-700 hover:border-red-700 hover:shadow-md;
}

.revoke-confirmation-dialog :deep(.p-dialog-footer .p-button-danger .p-button-label) {
  @apply text-white font-semibold;
}

.revoke-confirmation-dialog :deep(.p-dialog-footer .p-button-outlined) {
  @apply bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md;
}

.revoke-confirmation-dialog :deep(.p-dialog-footer .p-button-outlined .p-button-label) {
  @apply text-gray-700 font-medium;
}

/* Main dialog footer styling */
.role-management-dialog :deep(.p-dialog-footer .p-button) {
  @apply min-h-[44px] font-medium transition-all duration-200 shadow-sm;
}

.role-management-dialog :deep(.p-dialog-footer .p-button-success) {
  @apply bg-green-600 border-green-600 hover:bg-green-700 hover:border-green-700 hover:shadow-md;
}

.role-management-dialog :deep(.p-dialog-footer .p-button-success .p-button-label) {
  @apply text-white font-semibold;
}

.role-management-dialog :deep(.p-dialog-footer .p-button-danger) {
  @apply bg-red-600 border-red-600 hover:bg-red-700 hover:border-red-700 hover:shadow-md;
}

.role-management-dialog :deep(.p-dialog-footer .p-button-danger .p-button-label) {
  @apply text-white font-semibold;
}

.role-management-dialog :deep(.p-dialog-footer .p-button-outlined) {
  @apply bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md;
}

.role-management-dialog :deep(.p-dialog-footer .p-button-outlined .p-button-label) {
  @apply text-gray-700 font-medium;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .role-management-dialog {
    @apply m-4;
  }

  .role-management-dialog :deep(.p-dialog) {
    @apply w-full h-full max-h-none;
  }

  .roles-grid {
    @apply grid-cols-1;
  }

  .operation-details-section .grid {
    @apply grid-cols-1;
  }

  .permissions-container .grid {
    @apply grid-cols-1;
  }
}
</style>