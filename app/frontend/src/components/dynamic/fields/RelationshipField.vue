<template>
  <div class="field mb-4">
    <label :for="field.fieldKey" class="font-semibold mb-2 block">
      {{ field.name }}
      <span v-if="field.isMandatory" class="text-red-500">*</span>
    </label>
    <Dropdown
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
    <small v-if="field.description && !error" class="text-gray-500 block mt-1">
      {{ field.description }}
    </small>
    <small v-if="error" class="p-error block mt-1">{{ error }}</small>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Dropdown from 'primevue/dropdown';
import type { DynamicField } from '@/types/dynamic-data';

const props = defineProps<{
  field: DynamicField;
  modelValue: string | null;
  error?: string;
}>();

defineEmits<{
  (e: 'update:modelValue', value: string | null): void;
}>();

const loading = ref(false);
const relatedOptions = ref<Array<{ id: string; label: string }>>([]);

onMounted(async () => {
  // TODO: Fetch related data objects based on field configuration
  // This will require implementing relationship configuration in the backend
  // For now, we'll just show a placeholder
  loading.value = true;

  try {
    // const relatedDataKey = field.relationshipConfig?.relatedDataKey;
    // const response = await fetch(`/api/dynamic/${relatedDataKey}?limit=100`);
    // const data = await response.json();
    // relatedOptions.value = data.items.map(item => ({
    //   id: item.id,
    //   label: item.values[displayField] || item.id
    // }));

    // Placeholder for now
    relatedOptions.value = [];
  } catch (err) {
    console.error('Failed to load relationship options:', err);
  } finally {
    loading.value = false;
  }
});
</script>
