<template>
  <div class="field mb-4">
    <label :for="field.fieldKey" class="font-semibold mb-2 block">
      {{ field.name }}
      <span v-if="field.isMandatory" class="text-red-500">*</span>
    </label>
    <Editor
      :id="field.fieldKey"
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
      :disabled="field.isReadOnly"
      :class="{ 'p-invalid': error }"
      editor-style="height: 320px"
    >
      <template #toolbar>
        <span class="ql-formats">
          <button class="ql-bold" type="button"></button>
          <button class="ql-italic" type="button"></button>
          <button class="ql-underline" type="button"></button>
        </span>
        <span class="ql-formats">
          <select class="ql-header">
            <option value="1">Heading 1</option>
            <option value="2">Heading 2</option>
            <option value="3">Heading 3</option>
            <option selected>Normal</option>
          </select>
        </span>
        <span class="ql-formats">
          <button class="ql-list" value="ordered" type="button"></button>
          <button class="ql-list" value="bullet" type="button"></button>
        </span>
        <span class="ql-formats">
          <button class="ql-link" type="button"></button>
          <button class="ql-image" type="button"></button>
        </span>
        <span class="ql-formats">
          <button class="ql-clean" type="button"></button>
        </span>
      </template>
    </Editor>
    <small v-if="field.description && !error" class="text-gray-500 block mt-1">
      {{ field.description }}
    </small>
    <small v-if="error" class="p-error block mt-1">{{ error }}</small>
  </div>
</template>

<script setup lang="ts">
import Editor from 'primevue/editor';
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
