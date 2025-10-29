<template>
  <div class="field mb-4">
    <label :for="field.fieldKey" class="font-semibold mb-2 block">
      {{ field.name }}
      <span v-if="field.isMandatory" class="text-red-500">*</span>
    </label>
    <Textarea
      :id="field.fieldKey"
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
      :placeholder="field.description || `Enter ${field.name}`"
      :disabled="field.isReadOnly"
      :class="{ 'p-invalid': error }"
      :rows="5"
      :auto-resize="true"
      class="w-full"
    />
    <small v-if="field.description && !error" class="text-gray-500 block mt-1">
      {{ field.description }}
    </small>
    <small v-if="error" class="p-error block mt-1">{{ error }}</small>
  </div>
</template>

<script setup lang="ts">
import Textarea from 'primevue/textarea';
import type { DynamicField } from '@/types/dynamic-data';

defineProps<{
  field: DynamicField;
  modelValue: string;
  error?: string;
}>();

defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();
</script>
