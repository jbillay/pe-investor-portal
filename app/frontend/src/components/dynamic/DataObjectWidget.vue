<template>
  <div class="bg-white rounded-lg shadow-lg border border-gray-100">
    <div class="px-6 py-4 border-b border-gray-200">
      <h2 class="text-lg font-semibold text-gray-900 flex items-center">
        <i class="pi pi-database mr-2 text-blue-600"></i>
        Dynamic Data Objects
      </h2>
    </div>

    <div class="p-6">
      <!-- Data Object Selector -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Select Data Object
        </label>
        <Select
          v-model="selectedDataObject"
          :options="dataObjects"
          optionLabel="name"
          placeholder="Choose a data object..."
          class="w-full"
          @change="onDataObjectChange"
        >
          <template #value="slotProps">
            <div v-if="slotProps.value" class="flex items-center">
              <i class="pi pi-database mr-2"></i>
              <span>{{ slotProps.value.name }}</span>
            </div>
            <span v-else>{{ slotProps.placeholder }}</span>
          </template>
          <template #option="slotProps">
            <div class="flex items-center justify-between">
              <div>
                <div class="font-medium">{{ slotProps.option.name }}</div>
                <div class="text-sm text-gray-500">{{ slotProps.option.description }}</div>
              </div>
              <Tag
                :value="`${slotProps.option._count?.instances || 0} instances`"
                severity="info"
                class="text-xs"
              />
            </div>
          </template>
        </Select>
      </div>

      <!-- Action Buttons -->
      <div v-if="selectedDataObject" class="flex gap-2 mb-4">
        <Button
          label="Create New"
          icon="pi pi-plus"
          @click="showCreateDialog = true"
          class="flex-1"
          severity="primary"
        />
        <Button
          label="View All"
          icon="pi pi-list"
          @click="showListDialog = true"
          class="flex-1"
          severity="secondary"
          outlined
        />
      </div>

      <!-- Quick Stats -->
      <div v-if="selectedDataObject" class="grid grid-cols-2 gap-4">
        <div class="text-center p-4 bg-blue-50 rounded-lg">
          <div class="text-2xl font-bold text-blue-600">
            {{ selectedDataObject._count?.fields || 0 }}
          </div>
          <div class="text-sm text-gray-600">Fields</div>
        </div>
        <div class="text-center p-4 bg-green-50 rounded-lg">
          <div class="text-2xl font-bold text-green-600">
            {{ selectedDataObject._count?.instances || 0 }}
          </div>
          <div class="text-sm text-gray-600">Instances</div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!selectedDataObject && !loading" class="text-center py-8">
        <i class="pi pi-database text-gray-400 text-4xl mb-3"></i>
        <p class="text-gray-500">Select a data object to get started</p>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-8">
        <ProgressSpinner />
      </div>
    </div>

    <!-- Create Instance Dialog -->
    <Dialog
      v-model:visible="showCreateDialog"
      :header="`Create ${selectedDataObject?.name || 'Instance'}`"
      :modal="true"
      :style="{ width: '600px' }"
      @hide="resetForm"
    >
      <div v-if="schema" class="flex flex-col gap-4 py-4">
        <DynamicFormField
          v-for="field in sortedFields"
          :key="field.id"
          :field="field"
          v-model="formValues[field.fieldKey]"
          :error="formErrors[field.fieldKey]"
        />
      </div>

      <template #footer>
        <Button
          label="Cancel"
          icon="pi pi-times"
          @click="showCreateDialog = false"
          class="p-button-text"
        />
        <Button
          label="Create"
          icon="pi pi-check"
          @click="createInstance"
          :loading="loading"
          class="p-button-success"
        />
      </template>
    </Dialog>

    <!-- List Instances Dialog -->
    <Dialog
      v-model:visible="showListDialog"
      :header="`${selectedDataObject?.name || 'Instances'} (${instances.length})`"
      :modal="true"
      :style="{ width: '900px' }"
    >
      <div class="py-4">
        <!-- Loading -->
        <div v-if="loading" class="text-center py-8">
          <ProgressSpinner />
        </div>

        <!-- Instances List -->
        <div v-else-if="instances.length > 0" class="space-y-3">
          <Card
            v-for="instance in instances"
            :key="instance.id"
            class="hover:shadow-md transition-shadow"
          >
            <template #content>
              <div class="space-y-2">
                <div class="grid grid-cols-2 gap-4">
                  <div
                    v-for="field in sortedFields.slice(0, 4)"
                    :key="field.id"
                  >
                    <div class="text-sm font-medium text-gray-600">{{ field.name }}</div>
                    <div class="text-sm text-gray-900">
                      {{ formatFieldValue(instance.values[field.fieldKey], field.dataType) }}
                    </div>
                  </div>
                </div>
                <div class="flex justify-between items-center pt-2 border-t">
                  <div class="text-xs text-gray-500">
                    Created {{ formatDate(instance.createdAt) }}
                  </div>
                  <div class="flex gap-2">
                    <Button
                      icon="pi pi-eye"
                      @click="viewInstance(instance)"
                      class="p-button-text p-button-sm"
                      v-tooltip.top="'View'"
                    />
                    <Button
                      icon="pi pi-pencil"
                      @click="editInstance(instance)"
                      class="p-button-text p-button-sm p-button-warning"
                      v-tooltip.top="'Edit'"
                    />
                    <Button
                      icon="pi pi-trash"
                      @click="confirmDelete(instance)"
                      class="p-button-text p-button-sm p-button-danger"
                      v-tooltip.top="'Delete'"
                    />
                  </div>
                </div>
              </div>
            </template>
          </Card>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-8">
          <i class="pi pi-inbox text-gray-400 text-4xl mb-3"></i>
          <p class="text-gray-500">No instances yet</p>
          <Button
            label="Create First Instance"
            icon="pi pi-plus"
            @click="showListDialog = false; showCreateDialog = true"
            class="mt-4"
          />
        </div>
      </div>
    </Dialog>

    <!-- Delete Confirmation -->
    <Dialog
      v-model:visible="showDeleteDialog"
      header="Confirm Delete"
      :modal="true"
      :style="{ width: '450px' }"
    >
      <div class="flex items-center gap-3">
        <i class="pi pi-exclamation-triangle text-4xl text-orange-500"></i>
        <div>
          <p class="font-semibold mb-1">Delete this instance?</p>
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
          @click="handleDelete"
          :loading="loading"
          class="p-button-danger"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useDataObjects } from '@/composables/admin/useDataObjects';
import { useDataInstances } from '@/composables/admin/useDataInstances';
import type { DataObject, DynamicInstance, DynamicField, FieldDataType } from '@/types/dynamic-data';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Dialog from 'primevue/dialog';
import Select from 'primevue/select';
import Tag from 'primevue/tag';
import ProgressSpinner from 'primevue/progressspinner';
import DynamicFormField from './fields/DynamicFormField.vue';

const { dataObjects, fetchDataObjects } = useDataObjects();
const {
  instances,
  schema,
  loading,
  error,
  fetchSchema,
  fetchInstances,
  createInstance: createInstanceAPI,
  deleteInstance: deleteInstanceAPI
} = useDataInstances();

const selectedDataObject = ref<DataObject | null>(null);
const showCreateDialog = ref(false);
const showListDialog = ref(false);
const showDeleteDialog = ref(false);
const deletingInstance = ref<DynamicInstance | null>(null);

const formValues = ref<Record<string, any>>({});
const formErrors = ref<Record<string, string>>({});

const sortedFields = computed(() => {
  if (!schema.value?.fields) return [];
  return [...schema.value.fields].sort((a, b) => a.fieldOrder - b.fieldOrder);
});

onMounted(async () => {
  await fetchDataObjects();
});

const onDataObjectChange = async () => {
  if (selectedDataObject.value) {
    await fetchSchema(selectedDataObject.value.id);
    await fetchInstances(selectedDataObject.value.id);
  }
};

const resetForm = () => {
  formValues.value = {};
  formErrors.value = {};

  // Set default values
  if (schema.value?.fields) {
    schema.value.fields.forEach(field => {
      if (field.defaultValue) {
        formValues.value[field.fieldKey] = field.defaultValue;
      }
    });
  }
};

const validateForm = (): boolean => {
  formErrors.value = {};

  if (!schema.value) return false;

  for (const field of schema.value.fields) {
    if (field.isMandatory && !formValues.value[field.fieldKey]) {
      formErrors.value[field.fieldKey] = `${field.name} is required`;
    }
  }

  return Object.keys(formErrors.value).length === 0;
};

const createInstance = async () => {
  if (!validateForm() || !selectedDataObject.value) return;

  try {
    await createInstanceAPI(selectedDataObject.value.id, {
      values: formValues.value
    });

    showCreateDialog.value = false;
    resetForm();

    // Refresh the list
    await fetchInstances(selectedDataObject.value.id);

    // Update instance count
    if (selectedDataObject.value._count) {
      selectedDataObject.value._count.instances = (selectedDataObject.value._count.instances || 0) + 1;
    }
  } catch (err) {
    console.error('Failed to create instance:', err);
  }
};

const viewInstance = (instance: DynamicInstance) => {
  // TODO: Implement view details dialog
  console.log('View instance:', instance);
};

const editInstance = (instance: DynamicInstance) => {
  // TODO: Implement edit functionality
  console.log('Edit instance:', instance);
};

const confirmDelete = (instance: DynamicInstance) => {
  deletingInstance.value = instance;
  showDeleteDialog.value = true;
};

const handleDelete = async () => {
  if (!deletingInstance.value || !selectedDataObject.value) return;

  try {
    await deleteInstanceAPI(selectedDataObject.value.id, deletingInstance.value.id);
    showDeleteDialog.value = false;
    deletingInstance.value = null;

    // Update instance count
    if (selectedDataObject.value._count && selectedDataObject.value._count.instances > 0) {
      selectedDataObject.value._count.instances -= 1;
    }
  } catch (err) {
    console.error('Failed to delete instance:', err);
  }
};

const formatFieldValue = (value: any, dataType: string): string => {
  if (value === null || value === undefined) return '-';

  switch (dataType) {
    case 'BOOLEAN':
      return value ? 'Yes' : 'No';
    case 'DATE':
    case 'DATETIME':
      return new Date(value).toLocaleDateString();
    case 'CURRENCY':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(value);
    default:
      return String(value);
  }
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};
</script>
