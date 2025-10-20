<template>
  <div class="plugin-manager">
    <!-- Header with Upload -->
    <div class="panel-header mb-6 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Plugin Management</h2>
          <p class="text-gray-600 mt-1">Upload, install, and manage application plugins</p>
        </div>
        <div class="flex gap-3">
          <Button
            label="Refresh"
            icon="pi pi-refresh"
            class="p-button-outlined"
            @click="refreshPlugins"
            :loading="loading"
          />
          <FileUpload
            mode="basic"
            accept=".zip"
            :maxFileSize="10000000"
            :customUpload="true"
            @uploader="handlePluginUpload"
            chooseLabel="Upload Plugin"
            chooseIcon="pi pi-upload"
            class="p-button-primary"
          />
        </div>
      </div>
    </div>

    <!-- Filters and Search -->
    <div class="filters-section mb-4 p-4 bg-gray-50 rounded-lg border">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="search-field">
          <label class="block text-sm font-medium text-gray-700 mb-1">Search Plugins</label>
          <InputText
            v-model="filters.search"
            placeholder="Search by name or author..."
            class="w-full"
          />
        </div>
        <div class="status-filter">
          <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <Select
            v-model="filters.status"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="All Statuses"
            class="w-full"
            showClear
          />
        </div>
        <div class="sort-field">
          <label class="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
          <Select
            v-model="filters.sortBy"
            :options="sortOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Name"
            class="w-full"
          />
        </div>
        <div class="actions-field flex items-end">
          <Button
            label="Clear Filters"
            icon="pi pi-filter-slash"
            class="p-button-outlined w-full"
            @click="clearFilters"
          />
        </div>
      </div>
    </div>

    <!-- Plugins Data Table -->
    <DataTable
      :value="filteredPlugins"
      :paginator="true"
      :rows="15"
      :loading="loading"
      responsiveLayout="scroll"
      dataKey="id"
      class="plugin-datatable"
      :sortField="filters.sortBy || 'name'"
      :sortOrder="1"
    >
      <template #header>
        <div class="flex justify-between items-center">
          <span class="text-lg font-medium text-gray-900">
            {{ filteredPlugins.length }} plugins found
          </span>
        </div>
      </template>

      <!-- Plugin Name and Details -->
      <Column field="name" :sortable="true" class="min-w-64">
        <template #header>
          <div class="flex items-center gap-2 text-gray-700 font-semibold">
            <i class="pi pi-puzzle text-blue-600"></i>
            <span>Plugin Details</span>
          </div>
        </template>
        <template #body="{ data }">
          <div class="flex items-center gap-3">
            <div
              class="plugin-icon w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold bg-gradient-to-br from-purple-500 to-blue-600"
            >
              <i v-if="!data.icon" class="pi pi-puzzle text-2xl"></i>
              <img
                v-else
                :src="getPluginFileUrl(data.pluginId, data.icon)"
                alt="Plugin icon"
                class="w-full h-full object-cover rounded-lg"
              />
            </div>
            <div>
              <div class="font-semibold text-gray-900 flex items-center gap-2">
                {{ data.name }}
                <Tag
                  v-if="data.isInstalled"
                  value="INSTALLED"
                  severity="success"
                  class="text-xs"
                />
              </div>
              <div class="text-sm text-gray-600 mt-1">
                {{ data.description || 'No description' }}
              </div>
              <div class="text-xs text-gray-500 mt-1">
                v{{ data.version }} by {{ data.author }}
              </div>
            </div>
          </div>
        </template>
      </Column>

      <!-- Status -->
      <Column field="status" :sortable="true">
        <template #header>
          <div class="flex items-center gap-2 text-gray-700 font-semibold">
            <i class="pi pi-circle text-emerald-600"></i>
            <span>Status</span>
          </div>
        </template>
        <template #body="{ data }">
          <Tag
            :value="data.status"
            :severity="getStatusSeverity(data.status)"
            class="font-medium"
          />
        </template>
      </Column>

      <!-- Features -->
      <Column class="min-w-32">
        <template #header>
          <div class="flex items-center gap-2 text-gray-700 font-semibold">
            <i class="pi pi-th-large text-purple-600"></i>
            <span>Features</span>
          </div>
        </template>
        <template #body="{ data }">
          <div class="flex flex-col gap-1">
            <div v-if="data.manifest.menus?.length" class="text-xs text-gray-600">
              <i class="pi pi-bars mr-1"></i>
              {{ data.manifest.menus.length }} menu(s)
            </div>
            <div v-if="data.manifest.widgets?.length" class="text-xs text-gray-600">
              <i class="pi pi-th-large mr-1"></i>
              {{ data.manifest.widgets.length }} widget(s)
            </div>
            <div v-if="!data.manifest.menus?.length && !data.manifest.widgets?.length" class="text-xs text-gray-400">
              No features
            </div>
          </div>
        </template>
      </Column>

      <!-- Installed Date -->
      <Column field="installedAt" :sortable="true">
        <template #header>
          <div class="flex items-center gap-2 text-gray-700 font-semibold">
            <i class="pi pi-calendar text-orange-600"></i>
            <span>Installed</span>
          </div>
        </template>
        <template #body="{ data }">
          <div v-if="data.installedAt" class="text-sm">
            <div class="text-gray-900">{{ formatDate(data.installedAt) }}</div>
            <div class="text-gray-500">{{ formatTime(data.installedAt) }}</div>
          </div>
          <div v-else class="text-sm text-gray-400">
            Not installed
          </div>
        </template>
      </Column>

      <!-- Actions -->
      <Column class="min-w-48">
        <template #header>
          <div class="flex items-center gap-2 text-gray-700 font-semibold">
            <i class="pi pi-cog text-gray-600"></i>
            <span>Actions</span>
          </div>
        </template>
        <template #body="{ data }">
          <div class="flex items-center gap-2">
            <Button
              icon="pi pi-info-circle"
              class="p-button-sm p-button-text p-button-rounded"
              @click="viewPluginDetails(data)"
              v-tooltip.top="'View Details'"
            />
            <Button
              v-if="data.canInstall"
              icon="pi pi-download"
              class="p-button-sm p-button-text p-button-rounded p-button-success"
              @click="installPlugin(data)"
              v-tooltip.top="'Install Plugin'"
              :loading="actionLoading[data.id]"
            />
            <Button
              v-if="data.canUninstall"
              icon="pi pi-sign-out"
              class="p-button-sm p-button-text p-button-rounded p-button-warning"
              @click="uninstallPlugin(data)"
              v-tooltip.top="'Uninstall Plugin'"
              :loading="actionLoading[data.id]"
            />
            <Button
              icon="pi pi-trash"
              class="p-button-sm p-button-text p-button-rounded p-button-danger"
              @click="confirmDeletePlugin(data)"
              v-tooltip.top="'Delete Plugin'"
              :disabled="data.status === 'INSTALLED'"
              :loading="actionLoading[data.id]"
            />
          </div>
        </template>
      </Column>

      <template #empty>
        <div class="text-center py-8">
          <i class="pi pi-puzzle text-4xl text-gray-400 mb-4"></i>
          <p class="text-gray-600 text-lg mb-2">No plugins found</p>
          <p class="text-gray-500 text-sm">Use the "Upload Plugin" button above to get started</p>
        </div>
      </template>

      <template #loading>
        <div class="text-center py-8">
          <ProgressSpinner class="w-12 h-12" />
          <p class="text-gray-600 mt-4">Loading plugins...</p>
        </div>
      </template>
    </DataTable>

    <!-- Plugin Statistics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
      <Card class="stats-card">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <div class="text-2xl font-bold text-blue-600">{{ statistics.totalPlugins }}</div>
              <div class="text-sm text-gray-600">Total Plugins</div>
            </div>
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i class="pi pi-puzzle text-blue-600 text-xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card class="stats-card">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <div class="text-2xl font-bold text-green-600">{{ statistics.installedPlugins }}</div>
              <div class="text-sm text-gray-600">Installed</div>
            </div>
            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <i class="pi pi-check-circle text-green-600 text-xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card class="stats-card">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <div class="text-2xl font-bold text-purple-600">{{ statistics.totalMenus }}</div>
              <div class="text-sm text-gray-600">Menu Items</div>
            </div>
            <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <i class="pi pi-bars text-purple-600 text-xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card class="stats-card">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <div class="text-2xl font-bold text-orange-600">{{ statistics.totalWidgets }}</div>
              <div class="text-sm text-gray-600">Widgets</div>
            </div>
            <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <i class="pi pi-th-large text-orange-600 text-xl"></i>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Plugin Details Dialog -->
    <Dialog
      v-model:visible="pluginDetailsDialogVisible"
      :modal="true"
      :closable="true"
      :draggable="false"
      class="w-full max-w-3xl"
    >
      <template #header>
        <div class="flex items-center gap-3">
          <i class="pi pi-puzzle text-blue-600 text-2xl"></i>
          <div>
            <h3 class="text-xl font-bold text-gray-900">Plugin Details</h3>
            <p class="text-sm text-gray-600">{{ selectedPlugin?.name }}</p>
          </div>
        </div>
      </template>

      <div v-if="selectedPlugin" class="space-y-4">
        <!-- Basic Info -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-medium text-gray-700">Plugin ID</label>
            <p class="text-sm text-gray-900 font-mono">{{ selectedPlugin.pluginId }}</p>
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700">Version</label>
            <p class="text-sm text-gray-900">{{ selectedPlugin.version }}</p>
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700">Author</label>
            <p class="text-sm text-gray-900">{{ selectedPlugin.author }}</p>
          </div>
          <div v-if="selectedPlugin.authorEmail">
            <label class="text-sm font-medium text-gray-700">Email</label>
            <p class="text-sm text-gray-900">{{ selectedPlugin.authorEmail }}</p>
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700">License</label>
            <p class="text-sm text-gray-900">{{ selectedPlugin.license || 'N/A' }}</p>
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700">Core Version</label>
            <p class="text-sm text-gray-900">{{ selectedPlugin.manifest.coreVersion }}</p>
          </div>
        </div>

        <!-- Description -->
        <div v-if="selectedPlugin.description">
          <label class="text-sm font-medium text-gray-700">Description</label>
          <p class="text-sm text-gray-600 mt-1">{{ selectedPlugin.description }}</p>
        </div>

        <!-- Menus -->
        <div v-if="selectedPlugin.manifest.menus?.length">
          <label class="text-sm font-medium text-gray-700">Menu Items</label>
          <div class="mt-2 space-y-2">
            <div
              v-for="menu in selectedPlugin.manifest.menus"
              :key="menu.id"
              class="p-3 bg-gray-50 rounded-lg border"
            >
              <div class="flex items-center gap-2">
                <i :class="menu.icon || 'pi pi-circle'" class="text-blue-600"></i>
                <span class="font-medium">{{ menu.label }}</span>
                <Tag :value="menu.type" severity="info" class="text-xs ml-auto" />
              </div>
              <p class="text-xs text-gray-600 mt-1">Route: {{ menu.route }}</p>
            </div>
          </div>
        </div>

        <!-- Widgets -->
        <div v-if="selectedPlugin.manifest.widgets?.length">
          <label class="text-sm font-medium text-gray-700">Widgets</label>
          <div class="mt-2 space-y-2">
            <div
              v-for="widget in selectedPlugin.manifest.widgets"
              :key="widget.id"
              class="p-3 bg-gray-50 rounded-lg border"
            >
              <div class="flex items-center gap-2">
                <i class="pi pi-th-large text-purple-600"></i>
                <span class="font-medium">{{ widget.name }}</span>
              </div>
              <p class="text-xs text-gray-600 mt-1">
                Slot: {{ widget.slot }} | Component: {{ widget.component }}
              </p>
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="selectedPlugin.errorMessage" class="p-4 bg-red-50 rounded-lg border border-red-200">
          <div class="flex items-center gap-2 text-red-800">
            <i class="pi pi-exclamation-triangle"></i>
            <span class="font-medium">Error</span>
          </div>
          <p class="text-sm text-red-700 mt-1">{{ selectedPlugin.errorMessage }}</p>
        </div>
      </div>

      <template #footer>
        <Button
          label="Close"
          icon="pi pi-times"
          class="p-button-text"
          @click="pluginDetailsDialogVisible = false"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { pluginApiService } from '@/services/pluginApiService';
import { usePluginRegistryStore } from '@/stores/pluginRegistry';
import type { Plugin, PluginStatus, PluginStatistics } from '@/types/plugin';
import type { FileUploadUploaderEvent } from 'primevue/fileupload';

// PrimeVue Components
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Card from 'primevue/card';
import Dialog from 'primevue/dialog';
import FileUpload from 'primevue/fileupload';
import ProgressSpinner from 'primevue/progressspinner';

/**
 * PluginManager Component
 * Comprehensive plugin management with upload, install, and monitoring
 */

// Composables
const toast = useToast();
const confirm = useConfirm();
const pluginRegistryStore = usePluginRegistryStore();

// State
const loading = ref(false);
const plugins = ref<Plugin[]>([]);
const statistics = ref<PluginStatistics>({
  totalPlugins: 0,
  installedPlugins: 0,
  uploadedPlugins: 0,
  failedPlugins: 0,
  totalMenus: 0,
  totalWidgets: 0
});

const pluginDetailsDialogVisible = ref(false);
const selectedPlugin = ref<Plugin | null>(null);
const actionLoading = reactive<Record<string, boolean>>({});

// Filters
const filters = reactive({
  search: '',
  status: null as PluginStatus | null,
  sortBy: 'name'
});

// Filter options
const statusOptions = [
  { label: 'Uploaded', value: 'UPLOADED' },
  { label: 'Installed', value: 'INSTALLED' },
  { label: 'Failed', value: 'FAILED' },
  { label: 'Uninstalled', value: 'UNINSTALLED' }
];

const sortOptions = [
  { label: 'Name', value: 'name' },
  { label: 'Version', value: 'version' },
  { label: 'Created Date', value: 'createdAt' },
  { label: 'Updated Date', value: 'updatedAt' }
];

// Computed
const filteredPlugins = computed(() => {
  let filtered = plugins.value;

  // Search filter
  if (filters.search.trim()) {
    const searchTerm = filters.search.trim().toLowerCase();
    filtered = filtered.filter(plugin =>
      plugin.name.toLowerCase().includes(searchTerm) ||
      plugin.author.toLowerCase().includes(searchTerm) ||
      plugin.description?.toLowerCase().includes(searchTerm) ||
      plugin.pluginId.toLowerCase().includes(searchTerm)
    );
  }

  // Status filter
  if (filters.status) {
    filtered = filtered.filter(plugin => plugin.status === filters.status);
  }

  return filtered;
});

// Methods
const clearFilters = () => {
  filters.search = '';
  filters.status = null;
  filters.sortBy = 'name';
};

const getStatusSeverity = (status: PluginStatus) => {
  switch (status) {
    case 'INSTALLED': return 'success';
    case 'UPLOADED': return 'info';
    case 'FAILED': return 'danger';
    case 'UNINSTALLED': return 'warning';
    default: return 'info';
  }
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(date));
};

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
};

const getPluginFileUrl = (pluginId: string, filepath: string) => {
  return pluginApiService.getPluginFileUrl(pluginId, filepath);
};

const viewPluginDetails = (plugin: Plugin) => {
  selectedPlugin.value = plugin;
  pluginDetailsDialogVisible.value = true;
};

// Plugin Actions
const handlePluginUpload = async (event: FileUploadUploaderEvent) => {
  const file = event.files[0];

  if (!file) {
    return;
  }

  try {
    loading.value = true;

    const response = await pluginApiService.uploadPlugin(file);

    toast.add({
      severity: 'success',
      summary: 'Plugin Uploaded',
      detail: response.message,
      life: 3000
    });

    // Show warnings if any
    if (response.warnings && response.warnings.length > 0) {
      response.warnings.forEach(warning => {
        toast.add({
          severity: 'warn',
          summary: 'Warning',
          detail: warning,
          life: 5000
        });
      });
    }

    // Refresh plugin list
    await fetchPlugins();
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Upload Failed',
      detail: error.message || 'Failed to upload plugin',
      life: 5000
    });
  } finally {
    loading.value = false;
  }
};

const installPlugin = async (plugin: Plugin) => {
  try {
    actionLoading[plugin.id] = true;

    const response = await pluginApiService.installPlugin(plugin.id);

    toast.add({
      severity: 'success',
      summary: 'Plugin Installed',
      detail: response.message,
      life: 3000
    });

    // Refresh plugin registry and list
    await pluginRegistryStore.refreshPluginRegistry();
    await fetchPlugins();
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Installation Failed',
      detail: error.message || 'Failed to install plugin',
      life: 5000
    });
  } finally {
    actionLoading[plugin.id] = false;
  }
};

const uninstallPlugin = async (plugin: Plugin) => {
  try {
    actionLoading[plugin.id] = true;

    const response = await pluginApiService.uninstallPlugin(plugin.id);

    toast.add({
      severity: 'success',
      summary: 'Plugin Uninstalled',
      detail: response.message,
      life: 3000
    });

    // Refresh plugin registry and list
    await pluginRegistryStore.refreshPluginRegistry();
    await fetchPlugins();
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Uninstall Failed',
      detail: error.message || 'Failed to uninstall plugin',
      life: 5000
    });
  } finally {
    actionLoading[plugin.id] = false;
  }
};

const confirmDeletePlugin = (plugin: Plugin) => {
  confirm.require({
    message: `Are you sure you want to permanently delete the plugin "${plugin.name}"? This action cannot be undone.`,
    header: 'Delete Plugin',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      await deletePlugin(plugin);
    }
  });
};

const deletePlugin = async (plugin: Plugin) => {
  try {
    actionLoading[plugin.id] = true;

    await pluginApiService.deletePlugin(plugin.id);

    toast.add({
      severity: 'success',
      summary: 'Plugin Deleted',
      detail: `Plugin "${plugin.name}" has been permanently deleted.`,
      life: 3000
    });

    // Refresh list
    await fetchPlugins();
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Delete Failed',
      detail: error.message || 'Failed to delete plugin',
      life: 5000
    });
  } finally {
    actionLoading[plugin.id] = false;
  }
};

const fetchPlugins = async () => {
  try {
    loading.value = true;

    const { plugins: fetchedPlugins } = await pluginApiService.getAllPlugins();
    plugins.value = fetchedPlugins;

    // Fetch statistics
    const stats = await pluginApiService.getPluginStatistics();
    statistics.value = stats;
  } catch (error: any) {
    console.error('Error fetching plugins:', error);
    toast.add({
      severity: 'error',
      summary: 'Fetch Failed',
      detail: error.message || 'Failed to fetch plugins',
      life: 5000
    });
  } finally {
    loading.value = false;
  }
};

const refreshPlugins = async () => {
  await fetchPlugins();
  toast.add({
    severity: 'info',
    summary: 'Refreshed',
    detail: 'Plugin list has been refreshed',
    life: 2000
  });
};

// Lifecycle
onMounted(async () => {
  await fetchPlugins();
});

// Expose methods
defineExpose({
  refreshPlugins: fetchPlugins
});
</script>

<style scoped>
.plugin-manager {
  @apply space-y-6;
}

.panel-header {
  @apply transition-all duration-200;
}

.filters-section {
  @apply transition-all duration-200;
}

.plugin-datatable {
  @apply bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden;
}

.plugin-datatable :deep(.p-datatable-header) {
  @apply bg-gray-50 border-b border-gray-200 px-6 py-4;
}

.plugin-datatable :deep(.p-datatable-thead > tr > th) {
  @apply bg-gradient-to-br from-slate-50 to-gray-100 text-gray-800 font-semibold border-b-2 border-gray-300;
  padding: 16px 12px;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
}

.plugin-datatable :deep(.p-datatable-thead > tr > th:hover) {
  @apply bg-gradient-to-br from-blue-50 to-slate-100;
  transition: all 0.2s ease-in-out;
}

.plugin-datatable :deep(.p-datatable-tbody > tr > td) {
  @apply px-4 py-4 border-b border-gray-100;
}

.plugin-datatable :deep(.p-datatable-tbody > tr:hover) {
  @apply bg-gray-50;
}

.stats-card {
  @apply transition-all duration-200 hover:shadow-md;
}

.stats-card :deep(.p-card-body) {
  @apply p-4;
}

.plugin-icon {
  @apply shadow-sm border border-white/20;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .plugin-manager {
    @apply space-y-4;
  }

  .panel-header {
    @apply p-4;
  }

  .panel-header .flex {
    @apply flex-col gap-4 items-start;
  }

  .filters-section {
    @apply p-3;
  }

  .filters-section .grid {
    @apply grid-cols-1 gap-3;
  }
}
</style>
