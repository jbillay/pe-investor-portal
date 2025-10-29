<template>
  <div class="field mb-4">
    <div class="flex align-items-center gap-3">
      <InputSwitch
        :id="field.fieldKey"
        :model-value="modelValue"
        @update:model-value="$emit('update:modelValue', $event)"
        :disabled="field.isReadOnly"
        :class="{ 'p-invalid': error }"
      />
      <label :for="field.fieldKey" class="font-semibold cursor-pointer">
        {{ field.name }}
        <span v-if="field.isMandatory" class="text-red-500">*</span>
      </label>
    </div>
    <small v-if="field.description && !error" class="text-gray-500 block mt-1 ml-1">
      {{ field.description }}
    </small>
    <small v-if="error" class="p-error block mt-1 ml-1">{{ error }}</small>
  </div>
</template>

<script setup lang="ts">
import InputSwitch from 'primevue/inputswitch';
import type { DynamicField } from '@/types/dynamic-data';

defineProps<{
  field: DynamicField;
  modelValue: boolean;
  error?: string;
}>();

defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();
</script>
