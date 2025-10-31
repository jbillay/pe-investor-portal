<template>
  <div class="field mb-4">
    <label :for="field.fieldKey" class="font-semibold mb-2 block">
      {{ field.name }}
      <span v-if="field.isMandatory" class="text-red-500">*</span>
    </label>
    <DatePicker
      :id="field.fieldKey"
      :model-value="dateValue"
      @update:model-value="handleDateChange"
      :placeholder="field.description || `Select ${field.name}`"
      :disabled="field.isReadOnly"
      :class="{ 'p-invalid': error }"
      date-format="yy-mm-dd"
      :show-icon="true"
      class="w-full"
    />
    <small v-if="field.description && !error" class="text-gray-500 block mt-1">
      {{ field.description }}
    </small>
    <small v-if="error" class="p-error block mt-1">{{ error }}</small>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import DatePicker from 'primevue/datepicker';
import type { DynamicField } from '@/types/dynamic-data';

const props = defineProps<{
  field: DynamicField;
  modelValue: string | null;
  error?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | null): void;
}>();

const dateValue = computed(() => {
  if (!props.modelValue) return null;
  return new Date(props.modelValue);
});

const handleDateChange = (date: Date | null) => {
  if (!date) {
    emit('update:modelValue', null);
    return;
  }

  // Format as YYYY-MM-DD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  emit('update:modelValue', `${year}-${month}-${day}`);
};
</script>
