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
              <i class="pi pi-database text-blue-600"></i>
            </div>
            <div>
              <h1 class="admin-title">Data Objects</h1>
              <p class="admin-subtitle">Manage configurable data structures for your application</p>
            </div>
          </div>
          <div class="admin-actions">
            <Button
              label="Refresh Data"
              icon="pi pi-refresh"
              class="p-button-outlined p-button-secondary admin-action-btn"
              @click="fetchDataObjects"
              :loading="loading"
              severity="secondary"
            />
            <Button
              label="Create Data Object"
              icon="pi pi-plus"
              class="p-button-primary admin-action-btn"
              @click="showCreateDialog = true"
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

          <!-- Data Objects Content -->
          <div class="content-section">

            <!-- Loading State -->
            <div v-if="loading && (!dataObjects || dataObjects.length === 0)" class="flex justify-center items-center py-12">
              <ProgressSpinner />
            </div>

            <!-- Error State -->
            <Message v-if="error" severity="error" @close="error = null">
              {{ error }}
            </Message>

            <!-- Data Objects List -->
            <div v-if="!loading && dataObjects && dataObjects.length > 0" class="grid gap-4">
              <Card v-for="dataObject in dataObjects" :key="dataObject.id" class="shadow-sm hover:shadow-md transition-shadow">
                <template #content>
                  <div class="flex justify-between items-start">
                    <div class="flex-1">
                      <div class="flex items-center gap-3 mb-2">
                        <h3 class="text-xl font-semibold text-gray-900">{{ dataObject.name }}</h3>
                        <Tag :value="dataObject.dataKey" severity="info" class="text-xs" />
                        <Tag v-if="!dataObject.isActive" value="Inactive" severity="danger" class="text-xs" />
                      </div>
                      <p v-if="dataObject.description" class="text-gray-600 mb-3">
                        {{ dataObject.description }}
                      </p>
                      <div class="flex gap-4 text-sm text-gray-500">
                        <span class="flex items-center gap-1">
                          <i class="pi pi-list text-xs"></i>
                          {{ dataObject._count?.fields || 0 }} fields
                        </span>
                        <span class="flex items-center gap-1">
                          <i class="pi pi-database text-xs"></i>
                          {{ dataObject._count?.instances || 0 }} instances
                        </span>
                        <span class="flex items-center gap-1">
                          <i class="pi pi-calendar text-xs"></i>
                          Created {{ formatDate(dataObject.createdAt) }}
                        </span>
                      </div>
                    </div>
                    <div class="flex gap-2">
                      <Button
                        icon="pi pi-eye"
                        class="p-button-text p-button-info"
                        v-tooltip.top="'View Details'"
                        @click="viewDataObject(dataObject)"
                      />
                      <Button
                        icon="pi pi-pencil"
                        class="p-button-text p-button-warning"
                        v-tooltip.top="'Edit'"
                        @click="editDataObject(dataObject)"
                      />
                      <Button
                        icon="pi pi-history"
                        class="p-button-text p-button-secondary"
                        v-tooltip.top="'Version History'"
                        @click="viewVersionHistory(dataObject)"
                      />
                      <Button
                        icon="pi pi-trash"
                        class="p-button-text p-button-danger"
                        v-tooltip.top="'Delete'"
                        @click="confirmDelete(dataObject)"
                        :disabled="(dataObject._count?.instances || 0) > 0"
                      />
                    </div>
                  </div>
                </template>
              </Card>
            </div>

            <!-- Empty State -->
            <Card v-if="!loading && (!dataObjects || dataObjects.length === 0)" class="text-center py-12">
              <template #content>
                <i class="pi pi-database text-6xl text-gray-300 mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-700 mb-2">No Data Objects Yet</h3>
                <p class="text-gray-500 mb-4">Create your first data object to get started</p>
                <Button
                  label="Create Data Object"
                  icon="pi pi-plus"
                  @click="showCreateDialog = true"
                  class="p-button-lg"
                />
              </template>
            </Card>
          </div>
        </div>
      </main>
    </div>

    <!-- Create/Edit Dialog -->
    <Dialog
      v-model:visible="showCreateDialog"
      :header="editingDataObject ? 'Edit Data Object' : 'Create Data Object'"
      :modal="true"
      :style="{ width: '600px' }"
      @hide="resetForm"
    >
      <div class="flex flex-col gap-4 py-4">
        <div class="field">
          <label for="name" class="font-semibold mb-2 block">Name *</label>
          <InputText
            id="name"
            v-model="form.name"
            class="w-full"
            placeholder="e.g., Fund, Portfolio, Investment"
            :class="{ 'p-invalid': formErrors.name }"
          />
          <small v-if="formErrors.name" class="p-error">{{ formErrors.name }}</small>
        </div>

        <div class="field">
          <label for="dataKey" class="font-semibold mb-2 block">Data Key</label>
          <InputText
            id="dataKey"
            v-model="form.dataKey"
            class="w-full"
            placeholder="Auto-generated from name (e.g., fund, portfolio)"
            :disabled="!!editingDataObject"
          />
          <small class="text-gray-500">Used in API URLs. Leave blank to auto-generate.</small>
        </div>

        <div class="field">
          <label for="description" class="font-semibold mb-2 block">Description</label>
          <Textarea
            id="description"
            v-model="form.description"
            rows="3"
            class="w-full"
            placeholder="Describe what this data object represents..."
          />
        </div>
      </div>

      <template #footer>
        <Button
          label="Cancel"
          icon="pi pi-times"
          @click="showCreateDialog = false"
          class="p-button-text"
        />
        <Button
          :label="editingDataObject ? 'Update' : 'Create'"
          icon="pi pi-check"
          @click="saveDataObject"
          :loading="loading"
          class="p-button-success"
        />
      </template>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog
      v-model:visible="showDeleteDialog"
      header="Confirm Delete"
      :modal="true"
      :style="{ width: '450px' }"
    >
      <div class="flex items-center gap-3">
        <i class="pi pi-exclamation-triangle text-4xl text-orange-500"></i>
        <div>
          <p class="font-semibold mb-1">Are you sure you want to delete this data object?</p>
          <p class="text-gray-600 text-sm">
            This action cannot be undone. All field definitions will be permanently deleted.
          </p>
        </div>
      </div>

      <template #footer>
        <Button
          label="Cancel"
          icon="pi pi-times"
          @click="showDeleteDialog = false"
          class="p-button-text"
        />
        <Button
          label="Delete"
          icon="pi pi-trash"
          @click="handleDelete"
          :loading="loading"
          class="p-button-danger"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useDataObjects } from '@/composables/admin/useDataObjects';
import type { DataObject, CreateDataObjectDto } from '@/types/dynamic-data';
import Breadcrumb from 'primevue/breadcrumb';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Tag from 'primevue/tag';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';
import AdminNavigation from '@/components/admin/AdminNavigation.vue';

const router = useRouter();
const {
  dataObjects,
  loading,
  error,
  fetchDataObjects,
  createDataObject,
  updateDataObject,
  deleteDataObject
} = useDataObjects();

const showCreateDialog = ref(false);
const showDeleteDialog = ref(false);
const editingDataObject = ref<DataObject | null>(null);
const deletingDataObject = ref<DataObject | null>(null);

const form = ref<CreateDataObjectDto>({
  name: '',
  description: '',
  dataKey: ''
});

const formErrors = ref<Record<string, string>>({});

// Breadcrumb
const breadcrumbItems = ref([
  {
    label: 'Dashboard',
    icon: 'pi pi-home',
    command: () => router.push('/')
  },
  {
    label: 'Administration',
    icon: 'pi pi-shield',
    command: () => router.push('/admin')
  },
  {
    label: 'Data Objects',
    icon: 'pi pi-database'
  }
]);

onMounted(() => {
  fetchDataObjects();
});

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const viewDataObject = (dataObject: DataObject) => {
  router.push(`/admin/data-objects/${dataObject.id}`);
};

const editDataObject = (dataObject: DataObject) => {
  editingDataObject.value = dataObject;
  form.value = {
    name: dataObject.name,
    description: dataObject.description,
    dataKey: dataObject.dataKey
  };
  showCreateDialog.value = true;
};

const confirmDelete = (dataObject: DataObject) => {
  deletingDataObject.value = dataObject;
  showDeleteDialog.value = true;
};

const viewVersionHistory = (dataObject: DataObject) => {
  router.push(`/admin/data-objects/${dataObject.id}/versions`);
};

const validateForm = (): boolean => {
  formErrors.value = {};

  if (!form.value.name?.trim()) {
    formErrors.value.name = 'Name is required';
  }

  return Object.keys(formErrors.value).length === 0;
};

const saveDataObject = async () => {
  if (!validateForm()) return;

  try {
    if (editingDataObject.value) {
      await updateDataObject(editingDataObject.value.id, {
        name: form.value.name,
        description: form.value.description
      });
    } else {
      await createDataObject(form.value);
    }
    showCreateDialog.value = false;
    resetForm();
  } catch (err) {
    console.error('Failed to save data object:', err);
  }
};

const handleDelete = async () => {
  if (!deletingDataObject.value) return;

  try {
    await deleteDataObject(deletingDataObject.value.id);
    showDeleteDialog.value = false;
    deletingDataObject.value = null;
  } catch (err) {
    console.error('Failed to delete data object:', err);
  }
};

const resetForm = () => {
  form.value = {
    name: '',
    description: '',
    dataKey: ''
  };
  formErrors.value = {};
  editingDataObject.value = null;
};
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

.admin-breadcrumb-nav :deep(.p-breadcrumb-list li) {
  color: rgba(255, 255, 255, 0.9);
}

.admin-breadcrumb-nav :deep(.p-breadcrumb-list a) {
  color: white;
  text-decoration: none;
  font-weight: 500;
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
}

.admin-breadcrumb-nav :deep(.p-breadcrumb-list a:hover) {
  background: white;
  color: #1e40af;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.admin-breadcrumb-nav :deep(.p-breadcrumb-list a:hover .p-breadcrumb-item-icon) {
  color: #1e40af;
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

.content-section {
  padding: 1rem 0;
}
</style>
