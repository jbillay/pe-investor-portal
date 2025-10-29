<template>
  <div class="field">
    <!-- Text Field -->
    <TextField
      v-if="field.dataType === 'TEXT'"
      :field="field"
      :modelValue="modelValue"
      @update:modelValue="$emit('update:modelValue', $event)"
      :error="error"
    />

    <!-- Textarea Field -->
    <TextareaField
      v-else-if="field.dataType === 'TEXTAREA'"
      :field="field"
      :modelValue="modelValue"
      @update:modelValue="$emit('update:modelValue', $event)"
      :error="error"
    />

    <!-- Number Field -->
    <NumberField
      v-else-if="field.dataType === 'NUMBER'"
      :field="field"
      :modelValue="modelValue"
      @update:modelValue="$emit('update:modelValue', $event)"
      :error="error"
    />

    <!-- Currency Field -->
    <CurrencyField
      v-else-if="field.dataType === 'CURRENCY'"
      :field="field"
      :modelValue="modelValue"
      @update:modelValue="$emit('update:modelValue', $event)"
      :error="error"
    />

    <!-- Date Field -->
    <DateField
      v-else-if="field.dataType === 'DATE'"
      :field="field"
      :modelValue="modelValue"
      @update:modelValue="$emit('update:modelValue', $event)"
      :error="error"
    />

    <!-- DateTime Field -->
    <DateTimeField
      v-else-if="field.dataType === 'DATETIME'"
      :field="field"
      :modelValue="modelValue"
      @update:modelValue="$emit('update:modelValue', $event)"
      :error="error"
    />

    <!-- Boolean Field -->
    <BooleanField
      v-else-if="field.dataType === 'BOOLEAN'"
      :field="field"
      :modelValue="modelValue"
      @update:modelValue="$emit('update:modelValue', $event)"
      :error="error"
    />

    <!-- Single Select Field -->
    <SelectField
      v-else-if="field.dataType === 'SINGLE_SELECT'"
      :field="field"
      :modelValue="modelValue"
      @update:modelValue="$emit('update:modelValue', $event)"
      :error="error"
    />

    <!-- Multi Select Field -->
    <MultiSelectField
      v-else-if="field.dataType === 'MULTI_SELECT'"
      :field="field"
      :modelValue="modelValue"
      @update:modelValue="$emit('update:modelValue', $event)"
      :error="error"
    />

    <!-- Email Field -->
    <EmailField
      v-else-if="field.dataType === 'EMAIL'"
      :field="field"
      :modelValue="modelValue"
      @update:modelValue="$emit('update:modelValue', $event)"
      :error="error"
    />

    <!-- URL Field -->
    <UrlField
      v-else-if="field.dataType === 'URL'"
      :field="field"
      :modelValue="modelValue"
      @update:modelValue="$emit('update:modelValue', $event)"
      :error="error"
    />

    <!-- File Field -->
    <FileField
      v-else-if="field.dataType === 'FILE'"
      :field="field"
      :modelValue="modelValue"
      @update:modelValue="$emit('update:modelValue', $event)"
      :error="error"
    />

    <!-- Rich Text Field -->
    <RichTextField
      v-else-if="field.dataType === 'RICH_TEXT'"
      :field="field"
      :modelValue="modelValue"
      @update:modelValue="$emit('update:modelValue', $event)"
      :error="error"
    />

    <!-- Fallback to Text Field -->
    <TextField
      v-else
      :field="field"
      :modelValue="modelValue"
      @update:modelValue="$emit('update:modelValue', $event)"
      :error="error"
    />
  </div>
</template>

<script setup lang="ts">
import type { DynamicField } from '@/types/dynamic-data';
import TextField from './TextField.vue';
import TextareaField from './TextAreaField.vue';
import NumberField from './NumberField.vue';
import CurrencyField from './CurrencyField.vue';
import DateField from './DateField.vue';
import DateTimeField from './DateTimeField.vue';
import BooleanField from './BooleanField.vue';
import SelectField from './SingleSelectField.vue';
import MultiSelectField from './MultiSelectField.vue';
import EmailField from './EmailField.vue';
import UrlField from './UrlField.vue';
import FileField from './FileField.vue';
import RichTextField from './RichTextField.vue';

defineProps<{
  field: DynamicField;
  modelValue: any;
  error?: string;
}>();

defineEmits<{
  (e: 'update:modelValue', value: any): void;
}>();
</script>
