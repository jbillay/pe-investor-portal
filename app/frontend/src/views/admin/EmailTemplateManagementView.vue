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
              <i class="pi pi-envelope text-blue-600"></i>
            </div>
            <div>
              <h1 class="admin-title">Email Template Management</h1>
              <p class="admin-subtitle">Manage email templates, monitor sending activity, and view statistics</p>
            </div>
          </div>
          <div class="admin-actions">
            <Button
              label="Refresh Data"
              icon="pi pi-refresh"
              class="p-button-outlined p-button-secondary admin-action-btn"
              @click="refreshAllData"
              :loading="loading"
              severity="secondary"
            />
            <Button
              label="Create Template"
              icon="pi pi-plus"
              class="p-button-primary admin-action-btn"
              @click="createNewTemplate"
              severity="primary"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Main Admin Content -->
    <div class="admin-layout">
      <main class="admin-content content-expanded">
        <div class="content-container">
          <!-- Admin Navigation -->
          <AdminNavigation />

          <!-- Tab Navigation -->
          <Tabs v-model:value="activeTab" class="email-template-tabs">
            <TabList>
              <Tab value="0">
                <div class="flex items-center gap-2">
                  <i class="pi pi-file-edit"></i>
                  <span>Templates</span>
                  <Badge v-if="totalTemplates > 0" :value="totalTemplates" severity="info" />
                </div>
              </Tab>
              <Tab value="1">
                <div class="flex items-center gap-2">
                  <i class="pi pi-history"></i>
                  <span>Email Logs</span>
                  <Badge v-if="totalLogs > 0" :value="totalLogs" severity="warning" />
                </div>
              </Tab>
              <Tab value="2">
                <div class="flex items-center gap-2">
                  <i class="pi pi-chart-bar"></i>
                  <span>Statistics</span>
                </div>
              </Tab>
              <Tab value="3">
                <div class="flex items-center gap-2">
                  <i class="pi pi-clock"></i>
                  <span>Queue Monitor</span>
                  <Badge v-if="queueStats?.pending" :value="queueStats.pending" severity="info" />
                </div>
              </Tab>
            </TabList>

            <TabPanels>
              <!-- Email Templates Tab -->
              <TabPanel value="0">

              <div class="tab-content">
                <!-- Filters and Search -->
                <div class="filters-section mb-4">
                  <div class="flex flex-wrap gap-3 items-end">
                    <div class="flex-1 min-w-64">
                      <label class="block text-sm font-medium text-gray-700 mb-2">Search</label>
                      <IconField iconPosition="left">
                        <InputIcon class="pi pi-search"></InputIcon>
                        <InputText
                          v-model="filters.search"
                          placeholder="Search templates..."
                          class="w-full"
                        />
                      </IconField>
                    </div>
                    <div class="w-48">
                      <label class="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <Select
                        v-model="filters.category"
                        :options="categoryOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="All Categories"
                        class="w-full"
                        showClear
                      />
                    </div>
                    <div class="w-40">
                      <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <Select
                        v-model="filters.isActive"
                        :options="statusOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="All"
                        class="w-full"
                        showClear
                      />
                    </div>
                    <div class="w-40">
                      <label class="block text-sm font-medium text-gray-700 mb-2">Type</label>
                      <Select
                        v-model="filters.isSystem"
                        :options="typeOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="All"
                        class="w-full"
                        showClear
                      />
                    </div>
                    <Button
                      label="Clear Filters"
                      icon="pi pi-filter-slash"
                      class="p-button-outlined"
                      @click="clearAllFilters"
                    />
                  </div>
                </div>

                <!-- Templates DataTable -->
                <DataTable
                  :value="filteredTemplates"
                  v-model:selection="selectedTemplates"
                  :loading="loading"
                  dataKey="id"
                  :paginator="true"
                  :rows="10"
                  :rowsPerPageOptions="[10, 25, 50]"
                  paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                  currentPageReportTemplate="Showing {first} to {last} of {totalRecords} templates"
                  responsiveLayout="scroll"
                  class="email-templates-table"
                >
                  <template #empty>
                    <div class="text-center py-8 text-gray-500">
                      <i class="pi pi-inbox text-4xl mb-3"></i>
                      <p>No email templates found</p>
                    </div>
                  </template>

                  <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>

                  <Column field="displayName" header="Template Name" :sortable="true">
                    <template #body="slotProps">
                      <div class="flex items-center gap-2">
                        <span class="font-medium">{{ slotProps.data.displayName }}</span>
                        <Tag v-if="slotProps.data.isSystem" severity="info" value="System" />
                      </div>
                      <div class="text-sm text-gray-500">{{ slotProps.data.name }}</div>
                    </template>
                  </Column>

                  <Column field="category" header="Category" :sortable="true">
                    <template #body="slotProps">
                      <Tag :severity="getCategorySeverity(slotProps.data.category)">
                        {{ slotProps.data.category }}
                      </Tag>
                    </template>
                  </Column>

                  <Column field="subject" header="Subject" :sortable="true">
                    <template #body="slotProps">
                      <div class="text-sm truncate max-w-sm" :title="slotProps.data.subject">
                        {{ slotProps.data.subject }}
                      </div>
                    </template>
                  </Column>

                  <Column field="isActive" header="Status" :sortable="true">
                    <template #body="slotProps">
                      <Tag :severity="slotProps.data.isActive ? 'success' : 'danger'">
                        {{ slotProps.data.isActive ? 'Active' : 'Inactive' }}
                      </Tag>
                    </template>
                  </Column>

                  <Column field="updatedAt" header="Last Updated" :sortable="true">
                    <template #body="slotProps">
                      {{ formatDate(slotProps.data.updatedAt) }}
                    </template>
                  </Column>

                  <Column header="Actions" :exportable="false">
                    <template #body="slotProps">
                      <div class="flex gap-2">
                        <Button
                          icon="pi pi-eye"
                          class="p-button-rounded p-button-text p-button-sm"
                          @click="previewTemplate(slotProps.data)"
                          v-tooltip.top="'Preview'"
                        />
                        <Button
                          icon="pi pi-pencil"
                          class="p-button-rounded p-button-text p-button-sm"
                          @click="editTemplate(slotProps.data)"
                          v-tooltip.top="'Edit'"
                          :disabled="slotProps.data.isSystem"
                        />
                        <Button
                          icon="pi pi-copy"
                          class="p-button-rounded p-button-text p-button-sm"
                          @click="duplicateTemplate(slotProps.data)"
                          v-tooltip.top="'Duplicate'"
                        />
                        <Button
                          icon="pi pi-trash"
                          class="p-button-rounded p-button-text p-button-danger p-button-sm"
                          @click="confirmDeleteTemplate(slotProps.data)"
                          v-tooltip.top="'Delete'"
                          :disabled="slotProps.data.isSystem"
                        />
                      </div>
                    </template>
                  </Column>
                </DataTable>
              </div>
            </TabPanel>

            <!-- Email Logs Tab -->
            <TabPanel value="1">
              <div class="tab-content">
                <p class="text-gray-600 mb-4">Email logs component will be integrated here</p>
                <!-- Email logs will be implemented in a separate component -->
              </div>
            </TabPanel>

            <!-- Statistics Tab -->
            <TabPanel value="2">
              <div class="tab-content">
                <p class="text-gray-600 mb-4">Email statistics component will be integrated here</p>
                <!-- Statistics will be implemented in a separate component -->
              </div>
            </TabPanel>

            <!-- Queue Monitor Tab -->
            <TabPanel value="3">
              <div class="tab-content">
                <p class="text-gray-600 mb-4">Queue monitoring component will be integrated here</p>
                <!-- Queue monitor will be implemented in a separate component -->
              </div>
            </TabPanel>
          </TabPanels>
        </Tabs>
        </div>
      </main>
    </div>

    <!-- Template Preview Dialog -->
    <EmailTemplatePreviewDialog
      v-model:visible="previewDialogVisible"
      :template="selectedTemplate"
      @edit="handleEditFromPreview"
    />

    <!-- Template Create Dialog -->
    <EmailTemplateCreateDialog
      v-model:visible="createDialogVisible"
      @created="handleTemplateCreated"
    />

    <!-- Template Edit Dialog -->
    <EmailTemplateEditDialog
      v-model:visible="editDialogVisible"
      :template="selectedTemplate"
      @updated="handleTemplateUpdated"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { useEmailTemplates } from '@/composables/useEmailTemplates';
import { useEmailStats } from '@/composables/useEmailStats';
import type { EmailTemplate, EmailCategory } from '@/types/email';

// PrimeVue Components
import Breadcrumb from 'primevue/breadcrumb';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Select from 'primevue/select';
import Tag from 'primevue/tag';
import Badge from 'primevue/badge';

// Custom Components
import AdminNavigation from '@/components/admin/AdminNavigation.vue';
import EmailTemplatePreviewDialog from '@/components/admin/EmailTemplatePreviewDialog.vue';
import EmailTemplateCreateDialog from '@/components/admin/EmailTemplateCreateDialog.vue';
import EmailTemplateEditDialog from '@/components/admin/EmailTemplateEditDialog.vue';

// Composables
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();

// Email templates composable
const {
  templates,
  selectedTemplates,
  loading: templatesLoading,
  filteredTemplates,
  totalTemplates,
  activeTemplates,
  filters,
  clearFilters,
  fetchTemplates,
  fetchCategories,
  deleteTemplate,
  duplicateTemplate: duplicateTemplateAction,
  refreshData: refreshTemplatesData,
} = useEmailTemplates();

// Email stats composable
const {
  logs,
  stats,
  queueStats,
  loading: statsLoading,
  totalLogs,
  fetchLogs,
  fetchStats,
  fetchQueueStats,
} = useEmailStats();

// Component state
const activeTab = ref('0');
const previewDialogVisible = ref(false);
const createDialogVisible = ref(false);
const editDialogVisible = ref(false);
const selectedTemplate = ref<EmailTemplate | null>(null);

// Combined loading state
const loading = computed(() => templatesLoading.value || statsLoading.value);

// Breadcrumb
const breadcrumbItems = ref([
  { label: 'Dashboard', icon: 'pi pi-home', to: '/' },
  { label: 'Administration', icon: 'pi pi-shield', to: '/admin' },
  { label: 'Email Templates', icon: 'pi pi-envelope' }
]);

// Category options for filter
const categoryOptions = computed(() => [
  { label: 'Account', value: 'ACCOUNT' },
  { label: 'Document', value: 'DOCUMENT' },
  { label: 'Capital Call', value: 'CAPITAL_CALL' },
  { label: 'Distribution', value: 'DISTRIBUTION' },
  { label: 'Investment', value: 'INVESTMENT' },
  { label: 'System', value: 'SYSTEM' },
  { label: 'Notification', value: 'NOTIFICATION' },
  { label: 'Compliance', value: 'COMPLIANCE' },
]);

// Status options for filter
const statusOptions = [
  { label: 'Active', value: true },
  { label: 'Inactive', value: false },
];

// Type options for filter
const typeOptions = [
  { label: 'System Templates', value: true },
  { label: 'Custom Templates', value: false },
];

// Methods
const refreshAllData = async () => {
  await Promise.all([
    refreshTemplatesData(),
    fetchLogs(),
    fetchStats(),
    fetchQueueStats(),
  ]);
  toast.add({
    severity: 'success',
    summary: 'Data Refreshed',
    detail: 'All data has been refreshed successfully',
    life: 3000
  });
};

const clearAllFilters = () => {
  clearFilters();
};

const createNewTemplate = () => {
  createDialogVisible.value = true;
};

const handleTemplateCreated = (template: EmailTemplate) => {
  // The template is already added to the store by the composable
  // Just close the dialog and optionally show a success message
  createDialogVisible.value = false;

  // Optionally switch to the templates tab and clear filters to show the new template
  activeTab.value = '0';

  // Refresh data to ensure we have the latest
  refreshTemplatesData();
};

const editTemplate = (template: EmailTemplate) => {
  selectedTemplate.value = template;
  editDialogVisible.value = true;
};

const handleTemplateUpdated = (template: EmailTemplate) => {
  // The template is already updated in the store by the composable
  editDialogVisible.value = false;
  selectedTemplate.value = null;

  // Refresh data to ensure we have the latest
  refreshTemplatesData();
};

const previewTemplate = (template: EmailTemplate) => {
  selectedTemplate.value = template;
  previewDialogVisible.value = true;
};

const handleEditFromPreview = (template: EmailTemplate) => {
  previewDialogVisible.value = false;
  editTemplate(template);
};

const duplicateTemplate = async (template: EmailTemplate) => {
  const result = await duplicateTemplateAction(template.id);
  if (result) {
    toast.add({
      severity: 'success',
      summary: 'Template Duplicated',
      detail: `Template "${template.displayName}" has been duplicated successfully`,
      life: 3000
    });
  }
};

const confirmDeleteTemplate = (template: EmailTemplate) => {
  confirm.require({
    message: `Are you sure you want to delete the template "${template.displayName}"?`,
    header: 'Confirm Deletion',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      const success = await deleteTemplate(template.id);
      if (success) {
        toast.add({
          severity: 'success',
          summary: 'Template Deleted',
          detail: `Template "${template.displayName}" has been deleted successfully`,
          life: 3000
        });
      }
    }
  });
};

const getCategorySeverity = (category: EmailCategory): string => {
  const severityMap: Record<string, string> = {
    ACCOUNT: 'info',
    DOCUMENT: 'primary',
    CAPITAL_CALL: 'warning',
    DISTRIBUTION: 'success',
    INVESTMENT: 'info',
    SYSTEM: 'secondary',
    NOTIFICATION: 'info',
    COMPLIANCE: 'warning',
  };
  return severityMap[category] || 'info';
};

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Lifecycle hooks
onMounted(async () => {
  await Promise.all([
    fetchTemplates(),
    fetchCategories(),
    fetchLogs(1, 10),
    fetchStats(),
    fetchQueueStats(),
  ]);
});
</script>

<style scoped>
.admin-dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #f0f2f5 100%);
}

.admin-header {
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.admin-header-content {
  max-width: 1600px;
  margin: 0 auto;
  padding: 1.5rem 2rem;
}

.admin-breadcrumb {
  margin-bottom: 1rem;
}

.admin-breadcrumb-nav {
  background: transparent;
  border: none;
  padding: 0;
}

.admin-breadcrumb-nav :deep(.p-breadcrumb-list) {
  color: white;
}

.admin-title-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.admin-title-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.admin-icon {
  width: 4rem;
  height: 4rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: white;
}

.admin-title {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin: 0;
}

.admin-subtitle {
  color: rgba(255, 255, 255, 0.9);
  margin: 0.25rem 0 0;
}

.admin-actions {
  display: flex;
  gap: 1rem;
}

.admin-action-btn {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  color: white;
}

.admin-action-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.4);
}

.admin-layout {
  max-width: 1600px;
  margin: 0 auto;
  padding: 2rem;
}

.admin-content {
  width: 100%;
}

.content-container {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 2rem;
}

.email-template-tabs :deep(.p-tablist) {
  background: #f9fafb;
  border-radius: 0.5rem;
  padding: 0.5rem;
  margin-bottom: 1.5rem;
}

.tab-content {
  padding: 1rem 0;
}

.filters-section {
  background: #f9fafb;
  border-radius: 0.5rem;
  padding: 1.5rem;
}

.email-templates-table {
  margin-top: 1rem;
}

.email-templates-table :deep(.p-datatable-thead > tr > th) {
  background: #f9fafb;
  color: #374151;
  font-weight: 600;
}

.section-transition-enter-active,
.section-transition-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.section-transition-enter-from,
.section-transition-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
