<template>
  <div class="field mb-4">
    <label :for="field.fieldKey" class="font-semibold mb-2 block">
      {{ field.name }}
      <span v-if="field.isMandatory" class="text-red-500">*</span>
    </label>
    <DatePicker
      :id="field.fieldKey"
      :model-value="dateValue"
      @update:model-value="handleDateTimeChange"
      :placeholder="field.description || `Select ${field.name}`"
      :disabled="field.isReadOnly"
      :class="{ 'p-invalid': error }"
      :show-time="true"
      :show-seconds="false"
      :show-icon="true"
      date-format="yy-mm-dd"
      hour-format="24"
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

const handleDateTimeChange = (date: Date | null) => {
  if (!date) {
    emit('update:modelValue', null);
    return;
  }

  // Format as ISO string
  emit('update:modelValue', date.toISOString());
};
</script>
