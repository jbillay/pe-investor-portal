<template>
  <div class="field mb-4">
    <label :for="field.fieldKey" class="font-semibold mb-2 block">
      {{ field.name }}
      <span v-if="field.isMandatory" class="text-red-500">*</span>
    </label>
    <FileUpload
      :id="field.fieldKey"
      mode="basic"
      :disabled="field.isReadOnly"
      :class="{ 'p-invalid': error }"
      :choose-label="currentFileName || 'Choose File'"
      :auto="false"
      @select="handleFileSelect"
      class="w-full"
    />
    <div v-if="currentFileName" class="flex items-center gap-2 mt-2">
      <i class="pi pi-file text-gray-500"></i>
      <span class="text-sm text-gray-700">{{ currentFileName }}</span>
      <Button
        v-if="!field.isReadOnly"
        icon="pi pi-times"
        class="p-button-text p-button-sm p-button-danger"
        @click="handleRemoveFile"
      />
    </div>
    <small v-if="field.description && !error" class="text-gray-500 block mt-1">
      {{ field.description }}
    </small>
    <small v-if="error" class="p-error block mt-1">{{ error }}</small>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import FileUpload from 'primevue/fileupload';
import Button from 'primevue/button';
import type { DynamicField } from '@/types/dynamic-data';

const props = defineProps<{
  field: DynamicField;
  modelValue: any;
  error?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void;
}>();

const currentFileName = ref<string>('');

watch(
  () => props.modelValue,
  (value) => {
    if (value) {
      currentFileName.value = value.name || value.fileName || 'File selected';
    } else {
      currentFileName.value = '';
    }
  },
  { immediate: true }
);

const handleFileSelect = (event: any) => {
  const file = event.files?.[0];
  if (file) {
    currentFileName.value = file.name;
    emit('update:modelValue', {
      name: file.name,
      size: file.size,
      type: file.type,
      file: file
    });
  }
};

const handleRemoveFile = () => {
  currentFileName.value = '';
  emit('update:modelValue', null);
};
</script>
