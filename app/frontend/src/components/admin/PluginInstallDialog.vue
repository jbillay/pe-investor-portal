<template>
  <Dialog
    v-model:visible="dialogVisible"
    :modal="true"
    :closable="false"
    :draggable="false"
    class="plugin-install-dialog w-full max-w-4xl"
  >
    <template #header>
      <div class="flex items-center justify-between w-full">
        <div class="flex items-center gap-3">
          <i class="pi pi-download text-2xl text-blue-600"></i>
          <div>
            <h3 class="text-xl font-bold text-gray-900">Install Plugin</h3>
            <p class="text-sm text-gray-600">Step {{ currentStep }} of 2</p>
          </div>
        </div>
        <div class="flex gap-2">
          <div
            v-for="step in 2"
            :key="step"
            class="w-2 h-2 rounded-full transition-colors"
            :class="step <= currentStep ? 'bg-blue-600' : 'bg-gray-300'"
          ></div>
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
          <FileUpload
            ref="fileUploadRef"
            mode="basic"
            accept=".zip"
            :maxFileSize="10000000"
            :auto="false"
            chooseLabel="Choose Plugin File"
            chooseIcon="pi pi-upload"
            class="w-full"
            @select="handleFileSelect"
          />

          <!-- Drag and Drop Zone -->
          <div
            class="drag-drop-zone mt-4 p-8 border-2 border-dashed rounded-lg text-center transition-colors"
            :class="isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleFileDrop"
          >
            <i class="pi pi-cloud-upload text-4xl text-gray-400 mb-3"></i>
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
            <div class="flex items-center gap-2">
              <i class="pi pi-exclamation-triangle"></i>
              <div>
                <p class="font-medium">Upload Failed</p>
                <p class="text-sm mt-1">{{ uploadError }}</p>
              </div>
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
    </div>

    <!-- Dialog Footer -->
    <template #footer>
      <div class="flex items-center justify-between w-full">
        <Button
          label="Cancel"
          icon="pi pi-times"
          class="p-button-text p-button-secondary"
          @click="handleCancel"
          :disabled="isUploading || isInstalling"
        />
        <div class="flex gap-2">
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
            @click="installPlugin"
            :disabled="hasValidationErrors || isInstalling"
            :loading="isInstalling"
          />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { pluginApiService } from '@/services/pluginApiService';
import type { PluginManifest } from '@/types/plugin';

// PrimeVue Components
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import FileUpload from 'primevue/fileupload';
import Card from 'primevue/card';
import Tag from 'primevue/tag';
import Message from 'primevue/message';
import ProgressBar from 'primevue/progressbar';

/**
 * PluginInstallDialog Component
 * Multi-step wizard for uploading and installing plugins
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

// Refs
const fileUploadRef = ref();

// State
const dialogVisible = ref(false);
const currentStep = ref<1 | 2>(1);
const selectedFile = ref<File | null>(null);
const uploadedPluginId = ref<string | null>(null);
const pluginData = ref<any | null>(null);
const pluginManifest = ref<PluginManifest | null>(null);
const validationErrors = ref<string[]>([]);
const validationWarnings = ref<string[]>([]);
const isUploading = ref(false);
const isInstalling = ref(false);
const uploadError = ref<string | null>(null);
const isDragging = ref(false);

// Computed
const hasValidationErrors = computed(() => validationErrors.value.length > 0);

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

// Methods
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
  uploadError.value = null;
  isDragging.value = false;
};

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

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

const uploadPlugin = async () => {
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

const installPlugin = async () => {
  if (!uploadedPluginId.value) return;

  try {
    isInstalling.value = true;

    await pluginApiService.installPlugin(uploadedPluginId.value);

    // Success - close dialog and emit event
    dialogVisible.value = false;
    emit('plugin-installed');

    // Reset dialog state
    resetDialog();
  } catch (error: any) {
    console.error('Installation error:', error);
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

const handleCancel = async () => {
  // If plugin was uploaded but not installed, clean it up
  if (uploadedPluginId.value) {
    try {
      await pluginApiService.deletePlugin(uploadedPluginId.value);
      console.log('Cleaned up uploaded plugin:', uploadedPluginId.value);
    } catch (error) {
      console.warn('Failed to cleanup uploaded plugin:', error);
      // Don't block dialog close on cleanup error
    }
  }

  // Close dialog
  dialogVisible.value = false;
  resetDialog();
};

const goBackToUpload = () => {
  currentStep.value = 1;
  // Keep the uploaded file info but allow re-upload
};

const getPluginIconUrl = (): string => {
  if (!uploadedPluginId.value || !pluginData.value?.icon) {
    return '';
  }
  return pluginApiService.getPluginFileUrl(uploadedPluginId.value, pluginData.value.icon);
};
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

/* Scrollbar styling */
.preview-step::-webkit-scrollbar {
  width: 8px;
}

.preview-step::-webkit-scrollbar-track {
  @apply bg-gray-100 rounded;
}

.preview-step::-webkit-scrollbar-thumb {
  @apply bg-gray-400 rounded;
}

.preview-step::-webkit-scrollbar-thumb:hover {
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
