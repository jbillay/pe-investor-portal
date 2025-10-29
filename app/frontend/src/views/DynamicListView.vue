<template>
  <div class="dynamic-list-view p-6">
    <div class="mb-6">
      <div class="flex justify-between items-center mb-2">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">{{ schema?.name || 'Loading...' }}</h1>
          <p v-if="schema?.description" class="text-gray-600 mt-1">{{ schema.description }}</p>
        </div>
        <Button
          v-if="!loading && !schemaError"
          label="Back to Admin"
          icon="pi pi-arrow-left"
          class="p-button-text"
          @click="$router.push('/admin/data-objects')"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !schema" class="flex justify-center items-center py-12">
      <ProgressSpinner />
    </div>

    <!-- Error State -->
    <Message v-if="schemaError" severity="error" class="mb-4">
      {{ schemaError }}
    </Message>

    <!-- Permission Error -->
    <Card v-if="schema && !canRead" class="text-center py-12">
      <template #content>
        <i class="pi pi-lock text-6xl text-gray-300 mb-4"></i>
        <h3 class="text-xl font-semibold text-gray-700 mb-2">Access Denied</h3>
        <p class="text-gray-500 mb-4">
          You don't have permission to view {{ schema.name }} records
        </p>
        <Button
          label="Back to Home"
          icon="pi pi-home"
          @click="$router.push('/')"
        />
      </template>
    </Card>

    <!-- Data Table -->
    <DynamicTable
      v-if="schema && canRead"
      :schema="schema"
      :instances="instances"
      :loading="instancesLoading"
      :error="instancesError"
      :pagination="pagination"
      :can-write="canWrite"
      :can-delete="canDelete"
      @fetch="handleFetch"
      @view="handleView"
      @edit="handleEdit"
      @delete="handleDelete"
      @create="handleCreate"
      @export-csv="handleExportCSV"
    />

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
          <p class="font-semibold mb-1">Are you sure you want to delete this record?</p>
          <p class="text-gray-600 text-sm">This action cannot be undone.</p>
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
          @click="confirmDelete"
          :loading="deleteLoading"
          class="p-button-danger"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDynamicData } from '@/composables/dynamic/useDynamicData';
import DynamicTable from '@/components/dynamic/DynamicTable.vue';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Dialog from 'primevue/dialog';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';
import type { DynamicInstance } from '@/types/dynamic-data';

const route = useRoute();
const router = useRouter();
const dataKey = computed(() => route.params.dataKey as string);

const {
  schema,
  instances,
  pagination,
  loading,
  error: schemaError,
  instancesLoading,
  instancesError,
  canRead,
  canWrite,
  canDelete,
  fetchSchema,
  fetchInstances,
  deleteInstance,
  exportCSV,
} = useDynamicData(dataKey.value);

const showDeleteDialog = ref(false);
const deleteLoading = ref(false);
const instanceToDelete = ref<DynamicInstance | null>(null);

onMounted(async () => {
  await fetchSchema();
  if (canRead.value) {
    await fetchInstances({ page: 1, limit: 20 });
  }
});

const handleFetch = async (params: any) => {
  await fetchInstances(params);
};

const handleView = (instance: DynamicInstance) => {
  router.push(`/dynamic/${dataKey.value}/${instance.id}`);
};

const handleEdit = (instance: DynamicInstance) => {
  router.push(`/dynamic/${dataKey.value}/${instance.id}/edit`);
};

const handleDelete = (instance: DynamicInstance) => {
  instanceToDelete.value = instance;
  showDeleteDialog.value = true;
};

const confirmDelete = async () => {
  if (!instanceToDelete.value) return;

  deleteLoading.value = true;
  try {
    await deleteInstance(instanceToDelete.value.id);
    showDeleteDialog.value = false;
    instanceToDelete.value = null;
    // Refresh the list
    await fetchInstances({
      page: pagination.value.page,
      limit: pagination.value.limit,
    });
  } catch (err) {
    console.error('Failed to delete instance:', err);
  } finally {
    deleteLoading.value = false;
  }
};

const handleCreate = () => {
  router.push(`/dynamic/${dataKey.value}/create`);
};

const handleExportCSV = async () => {
  try {
    await exportCSV();
  } catch (err) {
    console.error('Failed to export CSV:', err);
  }
};
</script>
