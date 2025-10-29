<template>
  <div class="field mb-4">
    <label :for="field.fieldKey" class="font-semibold mb-2 block">
      {{ field.name }}
      <span v-if="field.isMandatory" class="text-red-500">*</span>
    </label>
    <InputNumber
      :id="field.fieldKey"
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
      :placeholder="field.description || `Enter ${field.name}`"
      :disabled="field.isReadOnly"
      :class="{ 'p-invalid': error }"
      mode="currency"
      currency="USD"
      locale="en-US"
      :min-fraction-digits="2"
      :max-fraction-digits="2"
      class="w-full"
    />
    <small v-if="field.description && !error" class="text-gray-500 block mt-1">
      {{ field.description }}
    </small>
    <small v-if="error" class="p-error block mt-1">{{ error }}</small>
  </div>
</template>

<script setup lang="ts">
import InputNumber from 'primevue/inputnumber';
import type { DynamicField } from '@/types/dynamic-data';

defineProps<{
  field: DynamicField;
  modelValue: number | null;
  error?: string;
}>();

defineEmits<{
  (e: 'update:modelValue', value: number | null): void;
}>();
</script>
