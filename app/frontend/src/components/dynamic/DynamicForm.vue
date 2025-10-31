<template>
  <form @submit.prevent="handleSubmit" class="dynamic-form">
    <Message v-if="formError" severity="error" @close="formError = null" class="mb-4">
      {{ formError }}
    </Message>

    <div class="grid grid-cols-1 gap-4">
      <component
        v-for="field in sortedFields"
        :key="field.id"
        :is="getFieldComponent(field.dataType)"
        :field="field"
        :model-value="formData[field.fieldKey]"
        @update:model-value="handleFieldUpdate(field.fieldKey, $event)"
        :error="errors[field.fieldKey]"
      />
    </div>

    <div class="flex justify-end gap-2 mt-6 pt-4 border-t">
      <Button
        label="Cancel"
        icon="pi pi-times"
        @click="handleCancel"
        class="p-button-text"
        type="button"
        :disabled="loading"
      />
      <Button
        :label="submitLabel"
        icon="pi pi-check"
        type="submit"
        :loading="loading"
        class="p-button-success"
      />
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import Button from 'primevue/button';
import Message from 'primevue/message';
import { FieldDataType, type DynamicSchema, type DynamicField } from '@/types/dynamic-data';
import { validateField } from '@/utils/dynamic-data';

// Import all field components
import TextField from './fields/TextField.vue';
import TextAreaField from './fields/TextAreaField.vue';
import NumberField from './fields/NumberField.vue';
import CurrencyField from './fields/CurrencyField.vue';
import DateField from './fields/DateField.vue';
import DateTimeField from './fields/DateTimeField.vue';
import BooleanField from './fields/BooleanField.vue';
import SingleSelectField from './fields/SingleSelectField.vue';
import MultiSelectField from './fields/MultiSelectField.vue';
import EmailField from './fields/EmailField.vue';
import UrlField from './fields/UrlField.vue';
import FileField from './fields/FileField.vue';
import RichTextField from './fields/RichTextField.vue';
import RelationshipField from './fields/RelationshipField.vue';

const props = defineProps<{
  schema: DynamicSchema;
  initialValues?: Record<string, any>;
  submitLabel?: string;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit', values: Record<string, any>): void;
  (e: 'cancel'): void;
}>();

const formData = ref<Record<string, any>>({});
const errors = ref<Record<string, string>>({});
const formError = ref<string | null>(null);

const getDefaultValue = (field: DynamicField): any => {
  switch (field.dataType) {
    case FieldDataType.BOOLEAN:
      return false;
    case FieldDataType.NUMBER:
    case FieldDataType.CURRENCY:
      return null;
    case FieldDataType.MULTI_SELECT:
      return [];
    case FieldDataType.DATE:
    case FieldDataType.DATETIME:
    case FieldDataType.RELATIONSHIP:
      return null;
    default:
      return '';
  }
};

// Initialize form data with initial values or defaults
watch(
  () => props.initialValues,
  (values) => {
    // Initialize all fields with their default values first
    formData.value = {};
    props.schema.fields.forEach((field) => {
      if (field.defaultValue !== undefined && field.defaultValue !== null) {
        formData.value[field.fieldKey] = field.defaultValue;
      } else {
        formData.value[field.fieldKey] = getDefaultValue(field);
      }
    });

    // Then override with any provided initial values
    if (values) {
      Object.keys(values).forEach((key) => {
        formData.value[key] = values[key];
      });
    }
  },
  { immediate: true }
);

const sortedFields = computed(() =>
  [...props.schema.fields].sort((a, b) => a.fieldOrder - b.fieldOrder)
);

const getFieldComponent = (dataType: FieldDataType) => {
  const componentMap: Record<FieldDataType, any> = {
    [FieldDataType.TEXT]: TextField,
    [FieldDataType.TEXTAREA]: TextAreaField,
    [FieldDataType.NUMBER]: NumberField,
    [FieldDataType.CURRENCY]: CurrencyField,
    [FieldDataType.DATE]: DateField,
    [FieldDataType.DATETIME]: DateTimeField,
    [FieldDataType.BOOLEAN]: BooleanField,
    [FieldDataType.SINGLE_SELECT]: SingleSelectField,
    [FieldDataType.MULTI_SELECT]: MultiSelectField,
    [FieldDataType.EMAIL]: EmailField,
    [FieldDataType.URL]: UrlField,
    [FieldDataType.FILE]: FileField,
    [FieldDataType.RICH_TEXT]: RichTextField,
    [FieldDataType.RELATIONSHIP]: RelationshipField,
  };
  return componentMap[dataType] || TextField;
};

const handleFieldUpdate = (fieldKey: string, value: any) => {
  formData.value[fieldKey] = value;
  // Clear error for this field when user starts typing
  if (errors.value[fieldKey]) {
    delete errors.value[fieldKey];
  }
  formError.value = null;
};

const validateForm = (): boolean => {
  errors.value = {};
  formError.value = null;

  let isValid = true;

  for (const field of props.schema.fields) {
    const value = formData.value[field.fieldKey];
    const error = validateField(value, field);

    if (error) {
      errors.value[field.fieldKey] = error;
      isValid = false;
    }
  }

  if (!isValid) {
    formError.value = 'Please fix the errors above before submitting.';
  }

  return isValid;
};

const handleSubmit = () => {
  if (!validateForm()) {
    return;
  }

  // Clean up the data before submitting
  const cleanedData: Record<string, any> = {};

  for (const field of props.schema.fields) {
    const value = formData.value[field.fieldKey];

    // Skip empty non-mandatory fields
    if (!field.isMandatory && (value === '' || value === null || value === undefined)) {
      continue;
    }

    // Handle different field types
    if (field.dataType === FieldDataType.MULTI_SELECT && Array.isArray(value) && value.length === 0) {
      continue;
    }

    cleanedData[field.fieldKey] = value;
  }

  emit('submit', cleanedData);
};

const handleCancel = () => {
  emit('cancel');
};
</script>

<style scoped>
.dynamic-form {
  width: 100%;
}
</style>
