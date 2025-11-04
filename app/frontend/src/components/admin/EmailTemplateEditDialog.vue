<template>
  <Dialog
    v-model:visible="dialogVisible"
    modal
    :header="`Edit Email Template: ${template?.displayName || ''}`"
    :style="{ width: '90vw', maxWidth: '1200px' }"
    :closable="!saving"
    :dismissableMask="!saving"
    class="email-template-edit-dialog"
    @hide="handleClose"
  >
    <div v-if="template" class="template-edit-form">
      <!-- Template Information Section -->
      <div class="form-section">
        <h3 class="section-title">
          <i class="pi pi-info-circle"></i>
          Template Information
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Template Name (Read-only) -->
          <div class="field">
            <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
              Template Name
            </label>
            <InputText
              id="name"
              :value="template.name"
              class="w-full"
              disabled
            />
            <small class="block text-gray-500 mt-1">
              Template name cannot be changed
            </small>
          </div>

          <!-- Display Name -->
          <div class="field">
            <label for="displayName" class="block text-sm font-medium text-gray-700 mb-2">
              Display Name <span class="text-red-500">*</span>
            </label>
            <InputText
              id="displayName"
              v-model="formData.displayName"
              placeholder="Account Created Notification"
              class="w-full"
              :class="{ 'p-invalid': errors.displayName }"
              maxlength="200"
            />
            <small v-if="errors.displayName" class="p-error block mt-1">
              {{ errors.displayName }}
            </small>
          </div>

          <!-- Category -->
          <div class="field">
            <label for="category" class="block text-sm font-medium text-gray-700 mb-2">
              Category <span class="text-red-500">*</span>
            </label>
            <Select
              id="category"
              v-model="formData.category"
              :options="categoryOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Select a category"
              class="w-full"
              :class="{ 'p-invalid': errors.category }"
            />
            <small v-if="errors.category" class="p-error block mt-1">
              {{ errors.category }}
            </small>
          </div>

          <!-- Active Status -->
          <div class="field flex items-center pt-8">
            <Checkbox
              id="isActive"
              v-model="formData.isActive"
              binary
            />
            <label for="isActive" class="ml-2 text-sm font-medium text-gray-700">
              Template is active
            </label>
          </div>
        </div>

        <!-- System Template Warning -->
        <div v-if="template.isSystem" class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div class="flex items-start gap-2">
            <i class="pi pi-exclamation-triangle text-yellow-600 mt-0.5"></i>
            <div class="text-sm text-yellow-800">
              <strong>System Template:</strong> This is a system template. Modifications should be done carefully as they may affect core functionality.
            </div>
          </div>
        </div>

        <!-- Description -->
        <div class="field mt-4">
          <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <Textarea
            id="description"
            v-model="formData.description"
            rows="2"
            placeholder="Email sent when a new user account is created"
            class="w-full"
            :autoResize="true"
          />
        </div>
      </div>

      <!-- Email Content Section -->
      <div class="form-section">
        <h3 class="section-title">
          <i class="pi pi-envelope"></i>
          Email Content
        </h3>

        <!-- Subject -->
        <div class="field">
          <label for="subject" class="block text-sm font-medium text-gray-700 mb-2">
            Subject Line <span class="text-red-500">*</span>
          </label>
          <InputText
            id="subject"
            v-model="formData.subject"
            placeholder="Welcome to &#123;&#123;platformName&#125;&#125;, &#123;&#123;firstName&#125;&#125;!"
            class="w-full"
            :class="{ 'p-invalid': errors.subject }"
            maxlength="200"
          />
          <small class="block text-gray-500 mt-1">
            Use &#123;&#123;variableName&#125;&#125; for variables
          </small>
          <small v-if="errors.subject" class="p-error block mt-1">
            {{ errors.subject }}
          </small>
        </div>

        <!-- HTML Body -->
        <div class="field mt-4">
          <label for="htmlBody" class="block text-sm font-medium text-gray-700 mb-2">
            HTML Body <span class="text-red-500">*</span>
          </label>
          <Textarea
            id="htmlBody"
            v-model="formData.htmlBody"
            rows="10"
            placeholder="<h1>Welcome &#123;&#123;firstName&#125;&#125;!</h1><p>Your account has been created.</p>"
            class="w-full font-mono text-sm"
            :class="{ 'p-invalid': errors.htmlBody }"
            :autoResize="true"
          />
          <small v-if="errors.htmlBody" class="p-error block mt-1">
            {{ errors.htmlBody }}
          </small>
        </div>

        <!-- Plain Text Body -->
        <div class="field mt-4">
          <label for="textBody" class="block text-sm font-medium text-gray-700 mb-2">
            Plain Text Body <span class="text-red-500">*</span>
          </label>
          <Textarea
            id="textBody"
            v-model="formData.textBody"
            rows="8"
            placeholder="Welcome &#123;&#123;firstName&#125;&#125;! Your account has been created."
            class="w-full"
            :class="{ 'p-invalid': errors.textBody }"
            :autoResize="true"
          />
          <small v-if="errors.textBody" class="p-error block mt-1">
            {{ errors.textBody }}
          </small>
        </div>
      </div>

      <!-- Variables Section -->
      <div class="form-section">
        <div class="flex items-center justify-between mb-4">
          <h3 class="section-title mb-0">
            <i class="pi pi-list"></i>
            Template Variables
          </h3>
          <Button
            label="Add Variable"
            icon="pi pi-plus"
            size="small"
            @click="addVariable"
          />
        </div>

        <small class="block text-gray-500 mb-4">
          Define variables that can be used in the subject and body using &#123;&#123;variableName&#125;&#125; syntax
        </small>

        <div v-if="formData.variables.length === 0" class="text-center py-8 text-gray-500">
          <i class="pi pi-inbox text-4xl mb-2 block"></i>
          <p>No variables defined yet. Click "Add Variable" to create one.</p>
        </div>

        <div v-else class="variables-list space-y-3">
          <div
            v-for="(variable, index) in formData.variables"
            :key="index"
            class="variable-item"
          >
            <div class="grid grid-cols-1 md:grid-cols-6 gap-3 items-start">
              <!-- Variable Name -->
              <div class="md:col-span-2">
                <label :for="`var-name-${index}`" class="block text-xs font-medium text-gray-700 mb-1">
                  Name <span class="text-red-500">*</span>
                </label>
                <InputText
                  :id="`var-name-${index}`"
                  v-model="variable.name"
                  placeholder="firstName"
                  class="w-full"
                  :class="{ 'p-invalid': errors[`variable_${index}_name`] }"
                  @input="validateVariableName(index)"
                />
                <small v-if="errors[`variable_${index}_name`]" class="p-error block mt-1 text-xs">
                  {{ errors[`variable_${index}_name`] }}
                </small>
              </div>

              <!-- Variable Type -->
              <div>
                <label :for="`var-type-${index}`" class="block text-xs font-medium text-gray-700 mb-1">
                  Type <span class="text-red-500">*</span>
                </label>
                <Select
                  :id="`var-type-${index}`"
                  v-model="variable.type"
                  :options="variableTypeOptions"
                  optionLabel="label"
                  optionValue="value"
                  class="w-full"
                />
              </div>

              <!-- Required -->
              <div class="flex items-end pb-2">
                <div class="flex items-center h-10">
                  <Checkbox
                    :id="`var-required-${index}`"
                    v-model="variable.required"
                    binary
                  />
                  <label :for="`var-required-${index}`" class="ml-2 text-xs font-medium text-gray-700">
                    Required
                  </label>
                </div>
              </div>

              <!-- Description -->
              <div class="md:col-span-2">
                <label :for="`var-desc-${index}`" class="block text-xs font-medium text-gray-700 mb-1">
                  Description
                </label>
                <InputText
                  :id="`var-desc-${index}`"
                  v-model="variable.description"
                  placeholder="User first name"
                  class="w-full"
                />
              </div>

              <!-- Actions -->
              <div class="flex items-end justify-end pb-2">
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  size="small"
                  @click="removeVariable(index)"
                  :aria-label="`Remove variable ${variable.name || index}`"
                />
              </div>
            </div>

            <!-- Example and Default Value -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              <div>
                <label :for="`var-example-${index}`" class="block text-xs font-medium text-gray-700 mb-1">
                  Example Value
                </label>
                <InputText
                  :id="`var-example-${index}`"
                  v-model="variable.example"
                  placeholder="John"
                  class="w-full"
                />
              </div>

              <div>
                <label :for="`var-default-${index}`" class="block text-xs font-medium text-gray-700 mb-1">
                  Default Value
                </label>
                <InputText
                  :id="`var-default-${index}`"
                  v-model="variable.defaultValue"
                  placeholder="Guest"
                  class="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Template Metadata -->
      <div class="form-section bg-gray-50">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span class="font-medium text-gray-700">Version:</span>
            <span class="ml-2 text-gray-600">{{ template.version }}</span>
          </div>
          <div>
            <span class="font-medium text-gray-700">Created:</span>
            <span class="ml-2 text-gray-600">{{ formatDate(template.createdAt) }}</span>
          </div>
          <div>
            <span class="font-medium text-gray-700">Last Updated:</span>
            <span class="ml-2 text-gray-600">{{ formatDate(template.updatedAt) }}</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-between items-center">
        <div class="text-sm text-gray-500">
          <span class="text-red-500">*</span> Required fields
        </div>
        <div class="flex gap-2">
          <Button
            label="Cancel"
            severity="secondary"
            @click="handleClose"
            :disabled="saving"
          />
          <Button
            label="Save Changes"
            icon="pi pi-check"
            @click="handleSubmit"
            :loading="saving"
            :disabled="!isFormValid || !hasChanges"
          />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Select from 'primevue/select';
import Checkbox from 'primevue/checkbox';
import { useEmailTemplates } from '@/composables/useEmailTemplates';
import { EmailCategory, type EmailTemplate, type UpdateEmailTemplateDto, type TemplateVariable } from '@/types/email';

/**
 * Props
 */
interface Props {
  visible: boolean;
  template: EmailTemplate | null;
}

const props = defineProps<Props>();

/**
 * Emits
 */
interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'updated', template: EmailTemplate): void;
}

const emit = defineEmits<Emits>();

/**
 * Composables
 */
const toast = useToast();
const { updateTemplate } = useEmailTemplates();

/**
 * State
 */
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

const saving = ref(false);

const formData = ref<UpdateEmailTemplateDto>({
  displayName: '',
  description: '',
  subject: '',
  htmlBody: '',
  textBody: '',
  category: EmailCategory.SYSTEM,
  variables: [],
  isActive: true,
});

const errors = ref<Record<string, string>>({});

/**
 * Category Options
 */
const categoryOptions = [
  { label: 'Account', value: EmailCategory.ACCOUNT },
  { label: 'System', value: EmailCategory.SYSTEM },
  { label: 'Notification', value: EmailCategory.NOTIFICATION },
  { label: 'Compliance', value: EmailCategory.COMPLIANCE },
];

/**
 * Variable Type Options
 */
const variableTypeOptions = [
  { label: 'String', value: 'string' },
  { label: 'Number', value: 'number' },
  { label: 'Boolean', value: 'boolean' },
  { label: 'Date', value: 'date' },
  { label: 'Currency', value: 'currency' },
];

/**
 * Utilities
 */
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString();
};

/**
 * Detect if form has changes
 */
const hasChanges = computed(() => {
  if (!props.template) return false;

  const original = props.template;
  const current = formData.value;

  // Check basic fields
  if (current.displayName !== original.displayName) return true;
  if (current.description !== original.description) return true;
  if (current.subject !== original.subject) return true;
  if (current.htmlBody !== original.htmlBody) return true;
  if (current.textBody !== original.textBody) return true;
  if (current.category !== original.category) return true;
  if (current.isActive !== original.isActive) return true;

  // Check variables
  if (current.variables.length !== original.variables.length) return true;

  // Deep comparison of variables
  for (let i = 0; i < current.variables.length; i++) {
    const currentVar = current.variables[i];
    const originalVar = original.variables[i];

    if (!originalVar) return true;

    if (currentVar.name !== originalVar.name) return true;
    if (currentVar.type !== originalVar.type) return true;
    if (currentVar.required !== originalVar.required) return true;
    if (currentVar.description !== originalVar.description) return true;
    if (currentVar.example !== originalVar.example) return true;
    if (currentVar.defaultValue !== originalVar.defaultValue) return true;
  }

  return false;
});

/**
 * Validation
 */
const validateVariableName = (index: number) => {
  const variable = formData.value.variables[index];
  const nameRegex = /^[a-zA-Z0-9_]+$/;
  const errorKey = `variable_${index}_name`;

  if (!variable.name) {
    errors.value[errorKey] = 'Variable name is required';
  } else if (!nameRegex.test(variable.name)) {
    errors.value[errorKey] = 'Only letters, numbers, and underscores allowed';
  } else {
    delete errors.value[errorKey];
  }
};

const validateForm = (): boolean => {
  errors.value = {};

  // Validate display name
  if (!formData.value.displayName) {
    errors.value.displayName = 'Display name is required';
  } else if (formData.value.displayName.length > 200) {
    errors.value.displayName = 'Display name must be 200 characters or less';
  }

  // Validate subject
  if (!formData.value.subject) {
    errors.value.subject = 'Subject is required';
  } else if (formData.value.subject.length > 200) {
    errors.value.subject = 'Subject must be 200 characters or less';
  }

  // Validate HTML body
  if (!formData.value.htmlBody) {
    errors.value.htmlBody = 'HTML body is required';
  }

  // Validate text body
  if (!formData.value.textBody) {
    errors.value.textBody = 'Plain text body is required';
  }

  // Validate category
  if (!formData.value.category) {
    errors.value.category = 'Category is required';
  }

  // Validate variables
  formData.value.variables.forEach((variable, index) => {
    if (!variable.name) {
      errors.value[`variable_${index}_name`] = 'Variable name is required';
    } else if (!/^[a-zA-Z0-9_]+$/.test(variable.name)) {
      errors.value[`variable_${index}_name`] = 'Only letters, numbers, and underscores allowed';
    }
  });

  return Object.keys(errors.value).length === 0;
};

const isFormValid = computed(() => {
  return (
    formData.value.displayName &&
    formData.value.displayName.length > 0 &&
    formData.value.subject &&
    formData.value.subject.length > 0 &&
    formData.value.htmlBody &&
    formData.value.htmlBody.length > 0 &&
    formData.value.textBody &&
    formData.value.textBody.length > 0 &&
    formData.value.category &&
    Object.keys(errors.value).length === 0
  );
});

/**
 * Variable Management
 */
const addVariable = () => {
  formData.value.variables.push({
    name: '',
    type: 'string',
    required: false,
    description: '',
    example: '',
    defaultValue: '',
  });
};

const removeVariable = (index: number) => {
  formData.value.variables.splice(index, 1);
  // Clean up any validation errors for this variable
  const errorKey = `variable_${index}_name`;
  delete errors.value[errorKey];
};

/**
 * Form Actions
 */
const handleSubmit = async () => {
  if (!props.template) return;

  if (!validateForm()) {
    toast.add({
      severity: 'error',
      summary: 'Validation Error',
      detail: 'Please fix the errors in the form',
      life: 3000,
    });
    return;
  }

  try {
    saving.value = true;

    const updatedTemplate = await updateTemplate(props.template.id, formData.value);

    if (updatedTemplate) {
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Email template updated successfully',
        life: 3000,
      });

      emit('updated', updatedTemplate);
      handleClose();
    }
  } catch (error) {
    console.error('Error updating template:', error);
    // Error is already handled by the composable
  } finally {
    saving.value = false;
  }
};

const handleClose = () => {
  if (!saving.value) {
    if (hasChanges.value) {
      // Could add confirmation dialog here
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmed) return;
    }

    resetForm();
    dialogVisible.value = false;
  }
};

const resetForm = () => {
  errors.value = {};
};

const loadTemplateData = () => {
  if (props.template) {
    formData.value = {
      displayName: props.template.displayName,
      description: props.template.description || '',
      subject: props.template.subject,
      htmlBody: props.template.htmlBody,
      textBody: props.template.textBody,
      category: props.template.category,
      variables: JSON.parse(JSON.stringify(props.template.variables)), // Deep copy
      isActive: props.template.isActive,
    };
  }
};

/**
 * Watch for template changes
 */
watch(() => props.template, (newTemplate) => {
  if (newTemplate && props.visible) {
    loadTemplateData();
  }
}, { immediate: true });

/**
 * Watch for dialog visibility changes
 */
watch(() => props.visible, (newValue) => {
  if (newValue && props.template) {
    loadTemplateData();
  }
});
</script>

<style scoped>
.email-template-edit-dialog {
  font-family: inherit;
}

.template-edit-form {
  max-height: 70vh;
  overflow-y: auto;
  padding: 0.5rem;
}

.form-section {
  background: #f9fafb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-section:last-child {
  margin-bottom: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
}

.section-title i {
  color: #6366f1;
}

.field {
  margin-bottom: 0;
}

.variable-item {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
}

.variable-item:hover {
  border-color: #d1d5db;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.variables-list {
  max-height: 400px;
  overflow-y: auto;
}

/* Scrollbar styling */
.template-edit-form::-webkit-scrollbar,
.variables-list::-webkit-scrollbar {
  width: 8px;
}

.template-edit-form::-webkit-scrollbar-track,
.variables-list::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.template-edit-form::-webkit-scrollbar-thumb,
.variables-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.template-edit-form::-webkit-scrollbar-thumb:hover,
.variables-list::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
