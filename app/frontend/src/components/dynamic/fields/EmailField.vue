<template>
  <div class="field mb-4">
    <label :for="field.fieldKey" class="font-semibold mb-2 block">
      {{ field.name }}
      <span v-if="field.isMandatory" class="text-red-500">*</span>
    </label>
    <InputText
      :id="field.fieldKey"
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
      type="email"
      :placeholder="field.description || 'Enter email address'"
      :disabled="field.isReadOnly"
      :class="{ 'p-invalid': error }"
      class="w-full"
    />
    <small v-if="field.description && !error" class="text-gray-500 block mt-1">
      {{ field.description }}
    </small>
    <small v-if="error" class="p-error block mt-1">{{ error }}</small>
  </div>
</template>

<script setup lang="ts">
import InputText from 'primevue/inputtext';
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
