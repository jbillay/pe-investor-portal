<template>
  <div class="field mb-4">
    <label :for="field.fieldKey" class="font-semibold mb-2 block">
      {{ field.name }}
      <span v-if="field.isMandatory" class="text-red-500">*</span>
    </label>

    <div v-if="!field.relatedDataObjectId" class="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
      <p class="text-yellow-800 text-sm">
        <i class="pi pi-exclamation-triangle mr-2"></i>
        This relationship field is not properly configured. Please contact an administrator to set the related data object.
      </p>
    </div>

    <Select
      v-else
      :id="field.fieldKey"
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
      :options="relatedOptions"
      option-label="label"
      option-value="id"
      :placeholder="field.description || `Select related ${field.name}`"
      :disabled="field.isReadOnly || loading"
      :class="{ 'p-invalid': error }"
      :show-clear="!field.isMandatory"
      :filter="true"
      :loading="loading"
      class="w-full"
    />
    <small v-if="field.description && !error && field.relatedDataObjectId" class="text-gray-500 block mt-1">
      {{ field.description }}
    </small>
    <small v-if="error" class="p-error block mt-1">{{ error }}</small>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Select from 'primevue/select';
import { useApi } from '@/composables/useApi';
import type { DynamicField, DataObject, DynamicInstance } from '@/types/dynamic-data';

const props = defineProps<{
  field: DynamicField;
  modelValue: string | null;
  error?: string;
}>();

defineEmits<{
  (e: 'update:modelValue', value: string | null): void;
}>();

const { api } = useApi();
const loading = ref(false);
const relatedOptions = ref<Array<{ id: string; label: string }>>([]);

const getInstanceLabel = (instance: DynamicInstance, dataObject: DataObject): string => {
  // Try to find a good display field
  // Priority: name field > first text field > first field > ID
  const fields = dataObject.fields;

  // Look for a field with "name" in the key
  const nameField = fields.find(f =>
    f.fieldKey.toLowerCase().includes('name') ||
    f.fieldKey.toLowerCase().includes('title')
  );

  if (nameField && instance.values[nameField.fieldKey]) {
    return String(instance.values[nameField.fieldKey]);
  }

  // Look for first text field
  const textField = fields.find(f =>
    f.dataType === 'TEXT' ||
    f.dataType === 'TEXTAREA' ||
    f.dataType === 'EMAIL'
  );

  if (textField && instance.values[textField.fieldKey]) {
    return String(instance.values[textField.fieldKey]);
  }

  // Use first available field value
  const firstField = fields[0];
  if (firstField && instance.values[firstField.fieldKey]) {
    return String(instance.values[firstField.fieldKey]);
  }

  // Fallback to ID
  return `Instance ${instance.id.substring(0, 8)}`;
};

onMounted(async () => {
  // Skip loading if no related data object is configured
  if (!props.field.relatedDataObjectId) {
    return;
  }

  loading.value = true;

  try {
    // Fetch the related data object to get its dataKey
    const dataObject = await api.get<DataObject>(
      `/admin/data-objects/${props.field.relatedDataObjectId}`
    );

    // Fetch instances from the related data object (max limit is 100)
    const response = await api.get<{ items: DynamicInstance[] }>(
      `/dynamic/${dataObject.dataKey}?limit=100`
    );

    // Map instances to dropdown options
    relatedOptions.value = response.items.map(item => ({
      id: item.id,
      label: getInstanceLabel(item, dataObject)
    }));
  } catch (err: any) {
    console.error('Failed to load relationship options:', err);
    console.error('Error details:', err.response?.data);
    relatedOptions.value = [];
  } finally {
    loading.value = false;
  }
});
</script>
