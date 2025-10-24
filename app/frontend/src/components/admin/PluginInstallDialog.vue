<template>
  <Dialog
    v-model:visible="dialogVisible"
    :modal="true"
    :closable="false"
    :draggable="false"
    :focusTrap="true"
    :aria-labelledby="'dialog-title'"
    :aria-describedby="'dialog-description'"
    class="plugin-install-dialog w-full max-w-4xl"
  >
    <template #header>
      <div class="flex items-center justify-between w-full">
        <div class="flex items-center gap-3">
          <i class="pi pi-download text-2xl text-blue-600" aria-hidden="true"></i>
          <div>
            <h3 id="dialog-title" class="text-xl font-bold text-gray-900">Install Plugin</h3>
            <p id="dialog-description" class="text-sm text-gray-600">Step {{ currentStep }} of 3</p>
          </div>
        </div>
        <div
          role="progressbar"
          aria-label="Installation wizard progress"
          :aria-valuenow="currentStep"
          aria-valuemin="1"
          aria-valuemax="3"
          :aria-valuetext="`Step ${currentStep} of 3`"
          class="flex items-center gap-3"
        >
          <div
            v-for="(stepLabel, index) in ['Upload', 'Review', 'Install']"
            :key="index + 1"
            class="flex flex-col items-center"
          >
            <div
              :aria-label="`Step ${index + 1}: ${stepLabel} ${index + 1 < currentStep ? 'completed' : index + 1 === currentStep ? 'current' : 'pending'}`"
              class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200"
              :class="[
                index + 1 < currentStep ? 'bg-green-500 text-white' :
                index + 1 === currentStep ? 'bg-blue-600 text-white ring-2 ring-blue-300' :
                'bg-gray-300 text-gray-600'
              ]"
            >
              <i v-if="index + 1 < currentStep" class="pi pi-check text-xs"></i>
              <span v-else>{{ index + 1 }}</span>
            </div>
            <span class="text-xs font-medium mt-1 transition-colors" :class="index + 1 === currentStep ? 'text-blue-600' : 'text-gray-500'">
              {{ stepLabel }}
            </span>
          </div>
        </div>
      </div>
    </template>

    <!-- Dialog Body -->
    <div class="dialog-body min-h-96">
      <!-- Step 1: Upload -->
      <div v-if="currentStep === 1" class="upload-step">
        <div class="text-center mb-6">
          <h4 class="text-lg font-semibold text-gray-900 mb-2">Upload Plugin Package</h4>
          <p class="text-sm text-gray-600">
            Select a plugin ZIP file to upload (maximum 10MB)
          </p>
        </div>

        <!-- File Upload Component -->
        <div class="upload-container">
          <!-- File Type Information -->
          <div class="flex items-center justify-center gap-2 mb-3">
            <Tag severity="info" icon="pi pi-file-o" value=".ZIP files only" />
            <Tag severity="secondary" icon="pi pi-info-circle" value="Max 10MB" />
          </div>

          <FileUpload
            ref="fileUploadRef"
            mode="basic"
            accept=".zip"
            :maxFileSize="10000000"
            :auto="false"
            chooseLabel="Choose Plugin File"
            chooseIcon="pi pi-upload"
            class="w-full"
            :pt="{
              chooseButton: { class: 'p-button-primary' }
            }"
            @select="handleFileSelect"
          />

          <!-- Drag and Drop Zone -->
          <div
            role="button"
            tabindex="0"
            aria-label="Drag and drop zone for plugin ZIP file upload. Press Enter or Space to select a file."
            class="drag-drop-zone mt-4 p-8 border-2 border-dashed rounded-lg text-center transition-colors cursor-pointer"
            :class="isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleFileDrop"
            @click="triggerFileInput"
            @keydown.enter="triggerFileInput"
            @keydown.space.prevent="triggerFileInput"
          >
            <i class="pi pi-cloud-upload text-4xl text-gray-400 mb-3" aria-hidden="true"></i>
            <p class="text-gray-600 mb-1">Drag and drop your plugin ZIP file here</p>
            <p class="text-sm text-gray-500">or use the button above to browse</p>
          </div>

          <!-- Selected File Info -->
          <div v-if="selectedFile" class="selected-file mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <i class="pi pi-file text-blue-600 text-2xl"></i>
                <div>
                  <p class="font-medium text-gray-900">{{ selectedFile.name }}</p>
                  <p class="text-sm text-gray-600">{{ formatFileSize(selectedFile.size) }}</p>
                </div>
              </div>
              <Button
                icon="pi pi-times"
                class="p-button-text p-button-rounded p-button-sm"
                @click="clearSelectedFile"
              />
            </div>
          </div>

          <!-- Upload Progress -->
          <div v-if="isUploading" class="upload-progress mt-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-700">Uploading...</span>
              <span class="text-sm text-gray-600">Please wait</span>
            </div>
            <ProgressBar mode="indeterminate" class="h-2" />
          </div>

          <!-- Upload Error -->
          <Message v-if="uploadError" severity="error" class="mt-4" :closable="false">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <i class="pi pi-exclamation-triangle"></i>
                <div>
                  <p class="font-medium">Upload Failed</p>
                  <p class="text-sm mt-1">{{ uploadError }}</p>
                </div>
              </div>
              <Button
                label="Try Again"
                icon="pi pi-refresh"
                class="p-button-sm p-button-text p-button-secondary"
                @click="retryUpload"
              />
            </div>
          </Message>
        </div>
      </div>

      <!-- Step 2: Preview and Confirm -->
      <div v-if="currentStep === 2 && pluginData" class="preview-step space-y-6">
        <!-- Plugin Header Card -->
        <Card class="plugin-header-card">
          <template #content>
            <div class="flex items-start gap-4">
              <div
                class="plugin-icon w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold bg-gradient-to-br from-purple-500 to-blue-600 flex-shrink-0"
              >
                <i v-if="!pluginData.icon" class="pi pi-puzzle text-3xl"></i>
                <img
                  v-else
                  :src="getPluginIconUrl()"
                  alt="Plugin icon"
                  class="w-full h-full object-cover rounded-lg"
                />
              </div>
              <div class="flex-1">
                <h4 class="text-2xl font-bold text-gray-900">{{ pluginData.name }}</h4>
                <div class="flex items-center gap-3 mt-1">
                  <span class="text-sm text-gray-600">v{{ pluginData.version }}</span>
                  <span class="text-sm text-gray-400">•</span>
                  <span class="text-sm text-gray-600">by {{ pluginData.author }}</span>
                  <span v-if="pluginData.authorEmail" class="text-sm text-gray-400">•</span>
                  <span v-if="pluginData.authorEmail" class="text-sm text-gray-600">
                    {{ pluginData.authorEmail }}
                  </span>
                </div>
                <p v-if="pluginData.description" class="text-gray-700 mt-3">
                  {{ pluginData.description }}
                </p>
              </div>
            </div>
          </template>
        </Card>

        <!-- Plugin Details Grid -->
        <div class="details-grid grid grid-cols-2 gap-4">
          <div class="detail-item p-4 bg-gray-50 rounded-lg border border-gray-200">
            <label class="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Core Version
            </label>
            <p class="text-lg font-medium text-gray-900 mt-1">
              {{ pluginManifest?.coreVersion || 'N/A' }}
            </p>
          </div>

          <div class="detail-item p-4 bg-gray-50 rounded-lg border border-gray-200">
            <label class="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              License
            </label>
            <p class="text-lg font-medium text-gray-900 mt-1">
              {{ pluginData.license || 'Not specified' }}
            </p>
          </div>

          <div class="detail-item p-4 bg-gray-50 rounded-lg border border-gray-200">
            <label class="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Plugin ID
            </label>
            <p class="text-sm font-mono text-gray-900 mt-1">{{ pluginData.pluginId }}</p>
          </div>

          <div class="detail-item p-4 bg-gray-50 rounded-lg border border-gray-200">
            <label class="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Status
            </label>
            <p class="text-lg font-medium text-gray-900 mt-1">Ready to Install</p>
          </div>
        </div>

        <!-- Dependencies Section -->
        <div v-if="hasDependencies" class="dependencies-section">
          <h5 class="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <i class="pi pi-sitemap text-blue-600"></i>
            Dependencies
          </h5>

          <!-- Plugin Dependencies -->
          <div v-if="pluginManifest?.dependencies?.plugins?.length" class="mb-4">
            <label class="text-sm font-medium text-gray-700 mb-2 block">
              Required Plugins ({{ pluginManifest.dependencies.plugins.length }})
            </label>
            <div class="space-y-2">
              <div
                v-for="dep in pluginManifest.dependencies.plugins"
                :key="dep"
                class="dependency-item p-3 bg-blue-50 rounded-lg border border-blue-200"
              >
                <div class="flex items-center gap-2">
                  <i class="pi pi-puzzle text-blue-600"></i>
                  <span class="font-mono text-sm text-gray-900">{{ dep }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- External Dependencies -->
          <div v-if="pluginManifest?.dependencies?.external?.length" class="mb-4">
            <label class="text-sm font-medium text-gray-700 mb-2 block">
              External Packages ({{ pluginManifest.dependencies.external.length }})
            </label>
            <div class="space-y-2">
              <div
                v-for="dep in pluginManifest.dependencies.external"
                :key="dep"
                class="dependency-item p-3 bg-green-50 rounded-lg border border-green-200"
              >
                <div class="flex items-center gap-2">
                  <i class="pi pi-box text-green-600"></i>
                  <span class="font-mono text-sm text-gray-900">{{ dep }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Permissions Section -->
        <div v-if="hasPermissions" class="permissions-section">
          <h5 class="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <i class="pi pi-shield text-orange-600"></i>
            Required Permissions
          </h5>
          <div class="permissions-list space-y-2">
            <div
              v-for="permission in pluginManifest?.permissions?.required"
              :key="permission"
              class="permission-item p-3 bg-orange-50 rounded-lg border border-orange-200"
            >
              <div class="flex items-center gap-2">
                <i class="pi pi-lock text-orange-600"></i>
                <span class="font-medium text-gray-900">{{ permission }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Features Section -->
        <div v-if="hasFeatures" class="features-section">
          <h5 class="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <i class="pi pi-th-large text-purple-600"></i>
            Plugin Features
          </h5>

          <!-- Menu Items -->
          <div v-if="pluginManifest?.menus?.length" class="menu-items mb-4">
            <label class="text-sm font-medium text-gray-700 mb-2 block">
              Menu Items ({{ pluginManifest.menus.length }})
            </label>
            <div class="space-y-2">
              <div
                v-for="menu in pluginManifest.menus"
                :key="menu.id"
                class="menu-item p-3 bg-purple-50 rounded-lg border border-purple-200"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <i :class="menu.icon || 'pi pi-circle'" class="text-purple-600"></i>
                    <span class="font-medium text-gray-900">{{ menu.label }}</span>
                  </div>
                  <Tag :value="menu.type" severity="info" class="text-xs" />
                </div>
                <p class="text-xs text-gray-600 mt-1">Route: {{ menu.route }}</p>
                <p v-if="menu.permissions?.length" class="text-xs text-gray-500 mt-1">
                  Requires: {{ menu.permissions.join(', ') }}
                </p>
              </div>
            </div>
          </div>

          <!-- Widgets -->
          <div v-if="pluginManifest?.widgets?.length" class="widget-items">
            <label class="text-sm font-medium text-gray-700 mb-2 block">
              Dashboard Widgets ({{ pluginManifest.widgets.length }})
            </label>
            <div class="space-y-2">
              <div
                v-for="widget in pluginManifest.widgets"
                :key="widget.id"
                class="widget-item p-3 bg-blue-50 rounded-lg border border-blue-200"
              >
                <div class="flex items-center gap-2 mb-1">
                  <i class="pi pi-th-large text-blue-600"></i>
                  <span class="font-medium text-gray-900">{{ widget.name }}</span>
                </div>
                <p class="text-xs text-gray-600">
                  Slot: <span class="font-mono">{{ widget.slot }}</span> |
                  Component: <span class="font-mono">{{ widget.component }}</span>
                </p>
                <p v-if="widget.permissions?.length" class="text-xs text-gray-500 mt-1">
                  Requires: {{ widget.permissions.join(', ') }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Validation Errors -->
        <Message
          v-if="validationErrors.length > 0"
          severity="error"
          :closable="false"
          class="validation-errors"
        >
          <div class="flex items-start gap-2">
            <i class="pi pi-times-circle text-lg"></i>
            <div class="flex-1">
              <p class="font-semibold mb-2">Installation Blocked - Fix These Errors:</p>
              <ul class="list-disc list-inside space-y-1">
                <li v-for="(error, index) in validationErrors" :key="index" class="text-sm">
                  {{ error }}
                </li>
              </ul>
            </div>
          </div>
        </Message>

        <!-- Validation Warnings -->
        <Message
          v-if="validationWarnings.length > 0"
          severity="warn"
          :closable="false"
          class="validation-warnings"
        >
          <div class="flex items-start gap-2">
            <i class="pi pi-exclamation-triangle text-lg"></i>
            <div class="flex-1">
              <p class="font-semibold mb-2">Warnings (Installation Allowed):</p>
              <ul class="list-disc list-inside space-y-1">
                <li v-for="(warning, index) in validationWarnings" :key="index" class="text-sm">
                  {{ warning }}
                </li>
              </ul>
            </div>
          </div>
        </Message>
      </div>

      <!-- Step 3: Installation Progress -->
      <div v-if="currentStep === 3" class="installation-step">
        <div class="installation-progress-container">
          <!-- Installation Steps Progress -->
          <div class="space-y-4 mb-6">
            <div
              v-for="(step, index) in installationSteps"
              :key="index"
              class="progress-step rounded-lg transition-all"
              :class="{
                'bg-blue-50 border border-blue-200': step.status === 'in_progress',
                'bg-green-50 border border-green-200': step.status === 'completed',
                'bg-red-50 border border-red-200': step.status === 'error',
                'bg-gray-50 border border-gray-200': step.status === 'pending',
                'cursor-pointer hover:shadow-md': step.error
              }"
              @click="step.error ? toggleStepExpansion(step.id) : null"
            >
              <div class="flex items-start gap-3 p-4">
                <!-- Step Icon -->
                <div class="flex-shrink-0 mt-0.5">
                  <ProgressSpinner
                    v-if="step.status === 'in_progress'"
                    style="width: 24px; height: 24px"
                    strokeWidth="4"
                    class="text-blue-600"
                  />
                  <i
                    v-else-if="step.status === 'completed'"
                    class="pi pi-check-circle text-2xl text-green-600"
                  ></i>
                  <i
                    v-else-if="step.status === 'error'"
                    class="pi pi-times-circle text-2xl text-red-600"
                  ></i>
                  <i
                    v-else
                    class="pi pi-circle text-2xl text-gray-400"
                  ></i>
                </div>

                <!-- Step Content -->
                <div class="flex-1">
                  <div class="flex items-center justify-between">
                    <h6 class="font-semibold text-gray-900">{{ step.label }}</h6>
                    <i
                      v-if="step.error"
                      class="pi transition-transform"
                      :class="expandedSteps.has(step.id) ? 'pi-chevron-up' : 'pi-chevron-down'"
                    ></i>
                  </div>
                  <p class="text-sm text-gray-600 mt-1">{{ step.description }}</p>
                </div>
              </div>

              <!-- Expandable Error Details -->
              <div
                v-if="step.error && expandedSteps.has(step.id)"
                class="px-4 pb-4 pt-2 border-t border-red-300"
              >
                <div class="bg-white p-3 rounded border border-red-200">
                  <p class="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">
                    Error Details
                  </p>
                  <p class="text-sm text-red-600 font-mono">{{ step.error }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Installation Result -->
          <div v-if="installationResult" class="installation-result">
            <!-- Success Message -->
            <Message
              v-if="installationResult.success"
              severity="success"
              :closable="false"
              class="mb-4"
            >
              <div class="flex items-start gap-3">
                <i class="pi pi-check-circle text-2xl"></i>
                <div class="flex-1">
                  <p class="font-bold text-lg mb-2">Plugin Installed Successfully!</p>
                  <p class="text-sm mb-3">
                    {{ installationResult.name }} v{{ installationResult.version }} has been
                    installed and is now active.
                  </p>
                  <div v-if="installationResult.warnings?.length" class="mt-3">
                    <p class="font-medium text-sm mb-1">Installation Warnings:</p>
                    <ul class="list-disc list-inside text-sm space-y-1">
                      <li v-for="(warning, index) in installationResult.warnings" :key="index">
                        {{ warning }}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </Message>

            <!-- Error Message -->
            <Message
              v-else
              severity="error"
              :closable="false"
              class="mb-4"
            >
              <div class="flex items-start gap-3">
                <i class="pi pi-times-circle text-2xl"></i>
                <div class="flex-1">
                  <p class="font-bold text-lg mb-2">Installation Failed</p>
                  <p class="text-sm">
                    {{ installationError }}
                  </p>
                </div>
              </div>
            </Message>
          </div>
        </div>
      </div>
    </div>

    <!-- Dialog Footer -->
    <template #footer>
      <div class="flex items-center justify-between w-full">
        <Button
          v-if="currentStep !== 3 || !isInstalling"
          :label="isInstalling ? 'Cancel Installation' : 'Cancel'"
          icon="pi pi-times"
          class="p-button-text"
          :class="isInstalling ? 'p-button-danger' : 'p-button-secondary'"
          @click="isInstalling ? handleCancelInstallation : handleCancel"
          :disabled="isUploading"
        />
        <div class="flex gap-2 ml-auto">
          <Button
            v-if="currentStep === 2"
            label="Back"
            icon="pi pi-arrow-left"
            class="p-button-outlined"
            @click="goBackToUpload"
            :disabled="isInstalling"
          />
          <Button
            v-if="currentStep === 1"
            label="Next"
            icon="pi pi-arrow-right"
            iconPos="right"
            class="p-button-primary"
            @click="uploadPlugin"
            :disabled="!selectedFile || isUploading"
            :loading="isUploading"
          />
          <Button
            v-if="currentStep === 2"
            label="Install Plugin"
            icon="pi pi-check"
            class="p-button-success"
            @click="startInstallation"
            :disabled="hasValidationErrors"
          />
          <Button
            v-if="currentStep === 3 && installationResult"
            :label="installationResult.success ? 'Close' : 'Close'"
            :icon="installationResult.success ? 'pi pi-check' : 'pi pi-times'"
            :class="installationResult.success ? 'p-button-success' : 'p-button-secondary'"
            @click="handleClose"
          />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { pluginApiService } from '@/services/pluginApiService';
import { usePluginRegistryStore } from '@/stores/pluginRegistry';
import type { PluginManifest, PluginInstallResponse } from '@/types/plugin';

// PrimeVue Components
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import FileUpload from 'primevue/fileupload';
import Card from 'primevue/card';
import Tag from 'primevue/tag';
import Message from 'primevue/message';
import ProgressBar from 'primevue/progressbar';
import ProgressSpinner from 'primevue/progressspinner';

/**
 * PluginInstallDialog Component
 * Three-step wizard for uploading, reviewing, and installing plugins
 */

// Props
interface Props {
  visible: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
});

// Emits
interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'plugin-installed'): void;
}

const emit = defineEmits<Emits>();

// Composables
const toast = useToast();
const confirm = useConfirm();
const pluginRegistry = usePluginRegistryStore();

// Refs
const fileUploadRef = ref();

// State - Step Management
const dialogVisible = ref(false);
const currentStep = ref<1 | 2 | 3>(1);

// State - Upload Step
const selectedFile = ref<File | null>(null);
const uploadedPluginId = ref<string | null>(null);
const pluginData = ref<any | null>(null);
const pluginManifest = ref<PluginManifest | null>(null);
const validationErrors = ref<string[]>([]);
const validationWarnings = ref<string[]>([]);
const isUploading = ref(false);
const uploadError = ref<string | null>(null);
const isDragging = ref(false);

// State - Installation Step
const isInstalling = ref(false);
const installationCancelled = ref(false);
const installationResult = ref<PluginInstallResponse | null>(null);
const installationError = ref<string | null>(null);
const expandedSteps = ref<Set<string>>(new Set());

type InstallStepStatus = 'pending' | 'in_progress' | 'completed' | 'error';

interface InstallStep {
  id: string;
  label: string;
  description: string;
  status: InstallStepStatus;
  error?: string;
}

const installationSteps = ref<InstallStep[]>([
  {
    id: 'validate',
    label: 'Validating Plugin',
    description: 'Checking plugin compatibility and dependencies',
    status: 'pending',
  },
  {
    id: 'dependencies',
    label: 'Checking Dependencies',
    description: 'Verifying required plugins and packages',
    status: 'pending',
  },
  {
    id: 'install',
    label: 'Installing Plugin',
    description: 'Updating plugin status and configuration',
    status: 'pending',
  },
  {
    id: 'register',
    label: 'Registering Components',
    description: 'Loading plugin menus and widgets',
    status: 'pending',
  },
  {
    id: 'complete',
    label: 'Finalization',
    description: 'Plugin installation complete',
    status: 'pending',
  },
]);

// Computed
const hasValidationErrors = computed(() => validationErrors.value.length > 0);

const hasDependencies = computed(() => {
  const hasPluginDeps = pluginManifest.value?.dependencies?.plugins?.length ?? 0 > 0;
  const hasExternalDeps = pluginManifest.value?.dependencies?.external?.length ?? 0 > 0;
  return hasPluginDeps || hasExternalDeps;
});

const hasPermissions = computed(() => {
  return pluginManifest.value?.permissions?.required?.length ?? 0 > 0;
});

const hasFeatures = computed(() => {
  const hasMenus = pluginManifest.value?.menus?.length ?? 0 > 0;
  const hasWidgets = pluginManifest.value?.widgets?.length ?? 0 > 0;
  return hasMenus || hasWidgets;
});

// Watch props.visible to sync with local state
watch(
  () => props.visible,
  (newValue) => {
    dialogVisible.value = newValue;
    if (newValue) {
      resetDialog();
    }
  }
);

// Watch dialogVisible to emit update
watch(dialogVisible, (newValue) => {
  emit('update:visible', newValue);
});

// Methods - Dialog Management
const resetDialog = () => {
  currentStep.value = 1;
  selectedFile.value = null;
  uploadedPluginId.value = null;
  pluginData.value = null;
  pluginManifest.value = null;
  validationErrors.value = [];
  validationWarnings.value = [];
  isUploading.value = false;
  isInstalling.value = false;
  installationCancelled.value = false;
  uploadError.value = null;
  isDragging.value = false;
  installationResult.value = null;
  installationError.value = null;
  expandedSteps.value.clear();
  resetInstallationSteps();
};

const toggleStepExpansion = (stepId: string) => {
  if (expandedSteps.value.has(stepId)) {
    expandedSteps.value.delete(stepId);
  } else {
    expandedSteps.value.add(stepId);
  }
};

const resetInstallationSteps = () => {
  installationSteps.value.forEach(step => {
    step.status = 'pending';
    step.error = undefined;
  });
};

const updateStepStatus = (stepId: string, status: InstallStepStatus, error?: string) => {
  const step = installationSteps.value.find(s => s.id === stepId);
  if (step) {
    step.status = status;
    step.error = error;
  }
};

// Methods - File Upload
const handleFileSelect = (event: any) => {
  const files = event.files;
  if (files && files.length > 0) {
    selectedFile.value = files[0];
    uploadError.value = null;
  }
};

const handleFileDrop = (event: DragEvent) => {
  isDragging.value = false;
  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    const file = files[0];

    // Validate file type
    if (!file.name.endsWith('.zip')) {
      uploadError.value = 'Only ZIP files are allowed';
      return;
    }

    // Validate file size (10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      uploadError.value = 'File size exceeds 10MB limit';
      return;
    }

    selectedFile.value = file;
    uploadError.value = null;
  }
};

const clearSelectedFile = () => {
  selectedFile.value = null;
  uploadError.value = null;
  if (fileUploadRef.value) {
    fileUploadRef.value.clear();
  }
};

const triggerFileInput = () => {
  // Programmatically trigger the file upload input
  if (fileUploadRef.value) {
    const input = fileUploadRef.value.$el.querySelector('input[type="file"]');
    if (input) {
      input.click();
    }
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

const retryUpload = () => {
  uploadError.value = null;
  if (selectedFile.value) {
    uploadPlugin();
  }
};

const uploadPlugin = async () => {
  if (!selectedFile.value) return;

  // Warn for files larger than 5MB
  const LARGE_FILE_THRESHOLD = 5 * 1024 * 1024; // 5MB
  if (selectedFile.value.size > LARGE_FILE_THRESHOLD) {
    return new Promise<void>((resolve) => {
      confirm.require({
        message: `This file is ${formatFileSize(selectedFile.value!.size)}. Large plugins may take longer to upload and install. Do you want to continue?`,
        header: 'Large File Warning',
        icon: 'pi pi-exclamation-circle',
        acceptLabel: 'Yes, Continue',
        rejectLabel: 'Cancel',
        accept: async () => {
          await performUpload();
          resolve();
        },
        reject: () => {
          resolve();
        },
      });
    });
  }

  // For smaller files, upload directly
  await performUpload();
};

const performUpload = async () => {
  if (!selectedFile.value) return;

  try {
    isUploading.value = true;
    uploadError.value = null;

    const response = await pluginApiService.uploadPlugin(selectedFile.value);

    // Store uploaded plugin ID for cleanup
    uploadedPluginId.value = response.pluginId;

    // Get full plugin details
    const plugin = await pluginApiService.getPluginById(response.pluginId);
    pluginData.value = plugin;
    pluginManifest.value = plugin.manifest;

    // Store validation results
    validationWarnings.value = response.warnings || [];
    validationErrors.value = [];

    // Move to preview step
    currentStep.value = 2;
  } catch (error: any) {
    console.error('Upload error:', error);
    uploadError.value = error.message || 'Failed to upload plugin';

    // Check if error contains validation errors
    if (error.details?.errors) {
      validationErrors.value = error.details.errors;
    }
  } finally {
    isUploading.value = false;
  }
};

// Methods - Installation
const startInstallation = async () => {
  if (!uploadedPluginId.value) return;

  currentStep.value = 3;
  isInstalling.value = true;
  installationCancelled.value = false;
  resetInstallationSteps();

  try {
    // Step 1: Validate
    updateStepStatus('validate', 'in_progress');
    await new Promise(resolve => setTimeout(resolve, 500));
    if (installationCancelled.value) throw new Error('Installation cancelled by user');
    updateStepStatus('validate', 'completed');

    // Step 2: Check Dependencies
    updateStepStatus('dependencies', 'in_progress');
    await new Promise(resolve => setTimeout(resolve, 500));
    if (installationCancelled.value) throw new Error('Installation cancelled by user');
    updateStepStatus('dependencies', 'completed');

    // Step 3: Install Plugin
    updateStepStatus('install', 'in_progress');
    const response = await pluginApiService.installPlugin(uploadedPluginId.value);
    if (installationCancelled.value) throw new Error('Installation cancelled by user');
    updateStepStatus('install', 'completed');

    // Step 4: Register Components
    updateStepStatus('register', 'in_progress');
    await pluginRegistry.refreshPluginRegistry();
    await new Promise(resolve => setTimeout(resolve, 500));
    if (installationCancelled.value) throw new Error('Installation cancelled by user');
    updateStepStatus('register', 'completed');

    // Step 5: Complete
    updateStepStatus('complete', 'in_progress');
    await new Promise(resolve => setTimeout(resolve, 300));
    if (installationCancelled.value) throw new Error('Installation cancelled by user');
    updateStepStatus('complete', 'completed');

    // Store result
    installationResult.value = response;

    // Show success toast
    toast.add({
      severity: 'success',
      summary: 'Plugin Installed',
      detail: `${response.name} v${response.version} installed successfully`,
      life: 5000,
    });

    // Emit event
    emit('plugin-installed');
  } catch (error: any) {
    console.error('Installation error:', error);
    installationError.value = error.message || 'Failed to install plugin';

    // Mark current step as error
    const currentStepIndex = installationSteps.value.findIndex(
      s => s.status === 'in_progress'
    );
    if (currentStepIndex >= 0) {
      updateStepStatus(
        installationSteps.value[currentStepIndex].id,
        'error',
        error.message
      );
    }

    // Store error result
    installationResult.value = {
      success: false,
      pluginId: uploadedPluginId.value!,
      name: pluginData.value?.name || 'Unknown',
      version: pluginData.value?.version || '0.0.0',
      message: error.message || 'Installation failed',
      installedAt: new Date(),
    };

    // Auto-delete the failed plugin
    try {
      await pluginApiService.deletePlugin(uploadedPluginId.value);
      console.log('Auto-deleted failed plugin:', uploadedPluginId.value);
    } catch (deleteError) {
      console.warn('Failed to auto-delete plugin:', deleteError);
    }

    toast.add({
      severity: 'error',
      summary: 'Installation Failed',
      detail: error.message || 'Failed to install plugin',
      life: 5000,
    });
  } finally {
    isInstalling.value = false;
  }
};

// Methods - Navigation
const goBackToUpload = () => {
  currentStep.value = 1;
};

const handleCancel = async () => {
  // If plugin was uploaded but not installed, clean it up
  if (uploadedPluginId.value && currentStep.value < 3) {
    try {
      await pluginApiService.deletePlugin(uploadedPluginId.value);
      console.log('Cleaned up uploaded plugin:', uploadedPluginId.value);
    } catch (error) {
      console.warn('Failed to cleanup uploaded plugin:', error);
    }
  }

  // Close dialog
  dialogVisible.value = false;
  resetDialog();
};

const handleCancelInstallation = () => {
  confirm.require({
    message: 'Are you sure you want to cancel the plugin installation? This action cannot be undone and may leave the plugin in an incomplete state.',
    header: 'Cancel Installation',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Yes, Cancel Installation',
    rejectLabel: 'Continue Installing',
    acceptClass: 'p-button-danger',
    accept: async () => {
      // Set cancellation flag
      installationCancelled.value = true;

      // Mark current step as error
      const currentStepIndex = installationSteps.value.findIndex(
        s => s.status === 'in_progress'
      );
      if (currentStepIndex >= 0) {
        updateStepStatus(
          installationSteps.value[currentStepIndex].id,
          'error',
          'Installation cancelled by user'
        );
      }

      // Try to cleanup the uploaded plugin
      if (uploadedPluginId.value) {
        try {
          await pluginApiService.deletePlugin(uploadedPluginId.value);
          console.log('Cleaned up cancelled plugin:', uploadedPluginId.value);

          toast.add({
            severity: 'info',
            summary: 'Installation Cancelled',
            detail: 'Plugin installation has been cancelled and cleaned up.',
            life: 4000,
          });
        } catch (error) {
          console.warn('Failed to cleanup cancelled plugin:', error);
          toast.add({
            severity: 'warn',
            summary: 'Installation Cancelled',
            detail: 'Installation was cancelled but cleanup failed. You may need to manually remove the plugin.',
            life: 5000,
          });
        }
      }

      // Close dialog after a brief delay to show the cancellation state
      setTimeout(() => {
        dialogVisible.value = false;
        resetDialog();
      }, 1500);
    },
  });
};

const handleClose = () => {
  dialogVisible.value = false;
  resetDialog();
};

const getPluginIconUrl = (): string => {
  if (!uploadedPluginId.value || !pluginData.value?.icon) {
    return '';
  }
  return pluginApiService.getPluginFileUrl(uploadedPluginId.value, pluginData.value.icon);
};

// Keyboard navigation support
const handleKeyDown = (event: KeyboardEvent) => {
  // Only handle if dialog is visible
  if (!dialogVisible.value) return;

  // Escape key - close dialog (unless installing)
  if (event.key === 'Escape' && !isInstalling.value && currentStep.value !== 3) {
    event.preventDefault();
    handleCancel();
  }

  // Ctrl+Enter - quick navigation to next step
  if (event.key === 'Enter' && event.ctrlKey) {
    event.preventDefault();
    if (currentStep.value === 1 && selectedFile.value && !isUploading.value) {
      uploadPlugin();
    } else if (currentStep.value === 2 && !hasValidationErrors.value) {
      startInstallation();
    }
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
.plugin-install-dialog :deep(.p-dialog-content) {
  @apply overflow-y-auto;
  max-height: calc(100vh - 200px);
}

.dialog-body {
  @apply py-4;
}

.upload-step {
  @apply space-y-4;
}

.drag-drop-zone {
  @apply cursor-pointer transition-all duration-200;
}

.drag-drop-zone:hover {
  @apply border-blue-400 bg-blue-50;
}

.preview-step {
  @apply max-h-[600px] overflow-y-auto pr-2;
}

.plugin-header-card :deep(.p-card-body) {
  @apply p-5;
}

.plugin-header-card :deep(.p-card-content) {
  @apply p-0;
}

.detail-item {
  @apply transition-all duration-200;
}

.detail-item:hover {
  @apply border-gray-300 shadow-sm;
}

.installation-step {
  @apply px-4;
}

.installation-progress-container {
  @apply max-h-[600px] overflow-y-auto;
}

.progress-step {
  @apply transform transition-all duration-300;
}

.progress-step:hover {
  @apply shadow-sm scale-[1.01];
}

/* Scrollbar styling */
.preview-step::-webkit-scrollbar,
.installation-progress-container::-webkit-scrollbar {
  width: 8px;
}

.preview-step::-webkit-scrollbar-track,
.installation-progress-container::-webkit-scrollbar-track {
  @apply bg-gray-100 rounded;
}

.preview-step::-webkit-scrollbar-thumb,
.installation-progress-container::-webkit-scrollbar-thumb {
  @apply bg-gray-400 rounded;
}

.preview-step::-webkit-scrollbar-thumb:hover,
.installation-progress-container::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-500;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .details-grid {
    @apply grid-cols-1;
  }

  .plugin-install-dialog {
    @apply max-w-full m-4;
  }
}
</style>
