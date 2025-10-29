<template>
  <div class="dynamic-detail-view p-6">
    <div class="max-w-4xl mx-auto">
      <div class="mb-6">
        <div class="flex justify-between items-center mb-4">
          <div class="flex items-center gap-2">
            <Button
              icon="pi pi-arrow-left"
              class="p-button-text"
              @click="handleBack"
            />
            <div>
              <h1 class="text-3xl font-bold text-gray-900">{{ schema?.name || 'Loading...' }}</h1>
              <p v-if="instance" class="text-sm text-gray-500 mt-1">ID: {{ instance.id }}</p>
            </div>
          </div>
          <div class="flex gap-2">
            <Button
              v-if="canWrite"
              label="Edit"
              icon="pi pi-pencil"
              class="p-button-warning"
              @click="handleEdit"
            />
            <Button
              v-if="canDelete"
              label="Delete"
              icon="pi pi-trash"
              class="p-button-danger p-button-outlined"
              @click="showDeleteDialog = true"
            />
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-12">
        <ProgressSpinner />
      </div>

      <!-- Error State -->
      <Message v-if="error" severity="error" class="mb-4">
        {{ error }}
      </Message>

      <!-- Instance Details -->
      <Card v-if="instance && schema">
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              v-for="field in sortedFields"
              :key="field.id"
              class="detail-field"
            >
              <label class="font-semibold text-gray-700 block mb-2">
                {{ field.name }}
              </label>
              <div class="text-gray-900">
                <component
                  :is="getCellRenderer(field.dataType)"
                  :value="instance.values[field.fieldKey]"
                  :field="field"
                />
              </div>
            </div>
          </div>

          <!-- Metadata -->
          <div class="mt-8 pt-6 border-t">
            <h3 class="text-lg font-semibold text-gray-700 mb-4">Metadata</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-gray-500">Created:</span>
                <span class="ml-2 text-gray-900">{{ formatDate(instance.createdAt) }}</span>
              </div>
              <div>
                <span class="text-gray-500">Last Updated:</span>
                <span class="ml-2 text-gray-900">{{ formatDate(instance.updatedAt) }}</span>
              </div>
              <div>
                <span class="text-gray-500">Version:</span>
                <span class="ml-2 text-gray-900">{{ instance.versionNumber }}</span>
              </div>
            </div>
          </div>

          <!-- History Timeline -->
          <div v-if="changeHistory.length > 0" class="mt-8 pt-6 border-t">
            <h3 class="text-lg font-semibold text-gray-700 mb-4">Change History</h3>
            <Timeline :value="changeHistory" align="left" class="customized-timeline">
              <template #content="{ item }">
                <div>
                  <div class="font-semibold text-gray-900">{{ item.changeType }}</div>
                  <div class="text-sm text-gray-600">{{ item.changedBy }}</div>
                  <div class="text-xs text-gray-400 mt-1">{{ formatDate(item.changedAt) }}</div>
                </div>
              </template>
            </Timeline>
          </div>
        </template>
      </Card>
    </div>

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
import { FieldDataType } from '@/types/dynamic-data';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Dialog from 'primevue/dialog';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';
import Timeline from 'primevue/timeline';

// Import cell renderers
import TextCell from '@/components/dynamic/cells/TextCell.vue';
import NumberCell from '@/components/dynamic/cells/NumberCell.vue';
import CurrencyCell from '@/components/dynamic/cells/CurrencyCell.vue';
import DateCell from '@/components/dynamic/cells/DateCell.vue';
import DateTimeCell from '@/components/dynamic/cells/DateTimeCell.vue';
import BooleanCell from '@/components/dynamic/cells/BooleanCell.vue';
import SelectCell from '@/components/dynamic/cells/SelectCell.vue';
import EmailCell from '@/components/dynamic/cells/EmailCell.vue';
import UrlCell from '@/components/dynamic/cells/UrlCell.vue';
import FileCell from '@/components/dynamic/cells/FileCell.vue';
import RichTextCell from '@/components/dynamic/cells/RichTextCell.vue';

const route = useRoute();
const router = useRouter();

const dataKey = computed(() => route.params.dataKey as string);
const instanceId = computed(() => route.params.id as string);

const {
  schema,
  instance,
  changeHistory,
  loading,
  error,
  canWrite,
  canDelete,
  fetchSchema,
  fetchInstance,
  fetchChangeHistory,
  deleteInstance,
} = useDynamicData(dataKey.value);

const showDeleteDialog = ref(false);
const deleteLoading = ref(false);

const sortedFields = computed(() => {
  if (!schema.value) return [];
  return [...schema.value.fields].sort((a, b) => a.fieldOrder - b.fieldOrder);
});

onMounted(async () => {
  await fetchSchema();
  await fetchInstance(instanceId.value);
  await fetchChangeHistory(instanceId.value);
});

const getCellRenderer = (dataType: FieldDataType) => {
  const rendererMap: Record<FieldDataType, any> = {
    [FieldDataType.TEXT]: TextCell,
    [FieldDataType.TEXTAREA]: TextCell,
    [FieldDataType.NUMBER]: NumberCell,
    [FieldDataType.CURRENCY]: CurrencyCell,
    [FieldDataType.DATE]: DateCell,
    [FieldDataType.DATETIME]: DateTimeCell,
    [FieldDataType.BOOLEAN]: BooleanCell,
    [FieldDataType.SINGLE_SELECT]: SelectCell,
    [FieldDataType.MULTI_SELECT]: SelectCell,
    [FieldDataType.EMAIL]: EmailCell,
    [FieldDataType.URL]: UrlCell,
    [FieldDataType.FILE]: FileCell,
    [FieldDataType.RICH_TEXT]: RichTextCell,
    [FieldDataType.RELATIONSHIP]: TextCell,
  };
  return rendererMap[dataType] || TextCell;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const handleBack = () => {
  router.push(`/dynamic/${dataKey.value}`);
};

const handleEdit = () => {
  router.push(`/dynamic/${dataKey.value}/${instanceId.value}/edit`);
};

const confirmDelete = async () => {
  deleteLoading.value = true;
  try {
    await deleteInstance(instanceId.value);
    router.push(`/dynamic/${dataKey.value}`);
  } catch (err) {
    console.error('Failed to delete instance:', err);
  } finally {
    deleteLoading.value = false;
    showDeleteDialog.value = false;
  }
};
</script>

<style scoped>
.detail-field {
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
}

:deep(.customized-timeline .p-timeline-event-content) {
  line-height: 1.5;
}
</style>
