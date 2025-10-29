<template>
  <div class="admin-dashboard">
    <!-- Enhanced Header -->
    <div class="admin-header">
      <div class="admin-header-content">
        <div class="admin-breadcrumb">
          <Breadcrumb :model="breadcrumbItems" class="admin-breadcrumb-nav" />
        </div>
        <div class="admin-title-section">
          <div class="admin-title-content">
            <div class="admin-icon">
              <i class="pi pi-database text-blue-600"></i>
            </div>
            <div>
              <div class="flex items-center gap-3">
                <h1 class="admin-title">{{ currentDataObject?.name || 'Loading...' }}</h1>
                <Tag v-if="currentDataObject" :value="currentDataObject.dataKey" severity="info" class="admin-tag" />
              </div>
              <p v-if="currentDataObject?.description" class="admin-subtitle">{{ currentDataObject.description }}</p>
            </div>
          </div>
          <div class="admin-actions">
            <Button
              label="Back to List"
              icon="pi pi-arrow-left"
              class="p-button-outlined p-button-secondary admin-action-btn"
              @click="goBack"
              severity="secondary"
            />
            <Button
              label="Add Field"
              icon="pi pi-plus"
              class="p-button-primary admin-action-btn"
              @click="openFieldDialog()"
              severity="primary"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Main Admin Content -->
    <div class="admin-layout">
      <main class="admin-content content-expanded">
        <div class="content-container">
          <!-- Admin Navigation -->
          <AdminNavigation />

          <!-- Data Object Editor Content -->
          <div class="content-section">
            <!-- Loading State -->
            <div v-if="loading && !currentDataObject" class="flex justify-center items-center py-12">
              <ProgressSpinner />
            </div>

            <!-- Error State -->
            <Message v-if="error" severity="error" @close="error = null">
              {{ error }}
            </Message>

            <!-- Toolbar -->
            <div v-if="currentDataObject" class="mb-4 flex justify-end items-center gap-2">
              <Button
                label="Version History"
                icon="pi pi-history"
                @click="showVersionHistory = true"
                class="p-button-outlined"
              />
              <Button
                label="Edit Details"
                icon="pi pi-pencil"
                @click="openEditDialog"
                class="p-button-outlined"
              />
            </div>

      <!-- Fields List -->
      <Card class="mb-4">
        <template #title>
          <div class="flex justify-between items-center">
            <span>Fields ({{ sortedFields.length }})</span>
          </div>
        </template>
        <template #content>
          <div v-if="sortedFields.length === 0" class="text-center py-8 text-gray-500">
            <i class="pi pi-list text-4xl mb-3"></i>
            <p>No fields yet. Add your first field to get started.</p>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="field in sortedFields"
              :key="field.id"
              class="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-2">
                    <i :class="getFieldTypeIcon(field.dataType)" class="text-blue-600"></i>
                    <span class="font-semibold text-lg">{{ field.name }}</span>
                    <Tag :value="field.fieldKey" severity="secondary" class="text-xs" />
                    <Tag v-if="field.isMandatory" value="Required" severity="danger" class="text-xs" />
                    <Tag v-if="field.isReadOnly" value="Read-only" severity="warning" class="text-xs" />
                  </div>
                  <p v-if="field.description" class="text-gray-600 text-sm mb-2">
                    {{ field.description }}
                  </p>
                  <div class="flex gap-4 text-sm text-gray-500">
                    <span>Type: <strong>{{ formatFieldType(field.dataType) }}</strong></span>
                    <span>Order: <strong>{{ field.fieldOrder }}</strong></span>
                    <span v-if="field.validationRules.length">
                      Validations: <strong>{{ field.validationRules.length }}</strong>
                    </span>
                    <span v-if="field.dropdownOptions.length">
                      Options: <strong>{{ field.dropdownOptions.length }}</strong>
                    </span>
                  </div>
                </div>
                <div class="flex gap-2">
                  <Button
                    icon="pi pi-pencil"
                    class="p-button-text p-button-warning"
                    v-tooltip.top="'Edit Field'"
                    @click="openFieldDialog(field)"
                  />
                  <Button
                    icon="pi pi-trash"
                    class="p-button-text p-button-danger"
                    v-tooltip.top="'Delete Field'"
                    @click="confirmDeleteField(field)"
                  />
                </div>
              </div>
            </div>
          </div>
        </template>
      </Card>
          </div>
        </div>
      </main>
    </div>

    <!-- Field Dialog -->
    <Dialog
      v-model:visible="showFieldDialog"
      :header="editingField ? 'Edit Field' : 'Add Field'"
      :modal="true"
      :style="{ width: '700px' }"
      @hide="resetFieldForm"
    >
      <div class="flex flex-col gap-4 py-4">
        <!-- Basic Info -->
        <div class="field">
          <label for="fieldName" class="font-semibold mb-2 block">Field Name *</label>
          <InputText
            id="fieldName"
            v-model="fieldForm.name"
            class="w-full"
            placeholder="e.g., Fund Name, Start Date"
            :class="{ 'p-invalid': fieldErrors.name }"
          />
          <small v-if="fieldErrors.name" class="p-error">{{ fieldErrors.name }}</small>
        </div>

        <div class="field">
          <label for="fieldKey" class="font-semibold mb-2 block">Field Key</label>
          <InputText
            id="fieldKey"
            v-model="fieldForm.fieldKey"
            class="w-full"
            placeholder="Auto-generated (e.g., fundName, startDate)"
            :disabled="!!editingField"
          />
          <small class="text-gray-500">Used in API and forms. Leave blank to auto-generate.</small>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="field">
            <label for="dataType" class="font-semibold mb-2 block">Field Type *</label>
            <Dropdown
              id="dataType"
              v-model="fieldForm.dataType"
              :options="fieldTypeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Select type"
              class="w-full"
              :class="{ 'p-invalid': fieldErrors.dataType }"
            />
            <small v-if="fieldErrors.dataType" class="p-error">{{ fieldErrors.dataType }}</small>
          </div>

          <div class="field">
            <label for="fieldOrder" class="font-semibold mb-2 block">Display Order *</label>
            <InputNumber
              id="fieldOrder"
              v-model="fieldForm.fieldOrder"
              class="w-full"
              :min="0"
            />
          </div>
        </div>

        <div class="field">
          <label for="fieldDescription" class="font-semibold mb-2 block">Description</label>
          <Textarea
            id="fieldDescription"
            v-model="fieldForm.description"
            rows="2"
            class="w-full"
            placeholder="Help text for users..."
          />
        </div>

        <div class="field">
          <label for="defaultValue" class="font-semibold mb-2 block">Default Value</label>
          <InputText
            id="defaultValue"
            v-model="fieldForm.defaultValue"
            class="w-full"
            placeholder="Optional default value"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="field flex items-center">
            <Checkbox
              id="isMandatory"
              v-model="fieldForm.isMandatory"
              :binary="true"
            />
            <label for="isMandatory" class="ml-2 font-semibold">Required Field</label>
          </div>

          <div class="field flex items-center">
            <Checkbox
              id="isReadOnly"
              v-model="fieldForm.isReadOnly"
              :binary="true"
            />
            <label for="isReadOnly" class="ml-2 font-semibold">Read-only</label>
          </div>
        </div>

        <!-- Dropdown Options (for SELECT types) -->
        <div v-if="isSelectType" class="field">
          <label class="font-semibold mb-2 block">Dropdown Options</label>
          <div class="space-y-2 mb-2">
            <div
              v-for="(option, index) in fieldForm.dropdownOptions"
              :key="index"
              class="flex gap-2"
            >
              <InputText
                v-model="option.label"
                placeholder="Label"
                class="flex-1"
              />
              <InputText
                v-model="option.value"
                placeholder="Value"
                class="flex-1"
              />
              <Button
                icon="pi pi-trash"
                class="p-button-danger p-button-text"
                @click="removeOption(index)"
              />
            </div>
          </div>
          <Button
            label="Add Option"
            icon="pi pi-plus"
            @click="addOption"
            class="p-button-sm p-button-outlined"
          />
        </div>

        <!-- Validation Rules -->
        <div class="field">
          <label class="font-semibold mb-2 block">Validation Rules</label>
          <div class="space-y-2 mb-2">
            <div
              v-for="(rule, index) in fieldForm.validationRules"
              :key="index"
              class="grid grid-cols-12 gap-2"
            >
              <Dropdown
                v-model="rule.ruleType"
                :options="validationRuleOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Rule"
                class="col-span-3"
              />
              <InputText
                v-model="rule.ruleValue"
                placeholder="Value"
                class="col-span-3"
              />
              <InputText
                v-model="rule.errorMessage"
                placeholder="Error message"
                class="col-span-5"
              />
              <Button
                icon="pi pi-trash"
                class="p-button-danger p-button-text col-span-1"
                @click="removeRule(index)"
              />
            </div>
          </div>
          <Button
            label="Add Rule"
            icon="pi pi-plus"
            @click="addRule"
            class="p-button-sm p-button-outlined"
          />
        </div>
      </div>

      <template #footer>
        <Button
          label="Cancel"
          icon="pi pi-times"
          @click="showFieldDialog = false"
          class="p-button-text"
        />
        <Button
          :label="editingField ? 'Update' : 'Add'"
          icon="pi pi-check"
          @click="saveField"
          :loading="loading"
          class="p-button-success"
        />
      </template>
    </Dialog>

    <!-- Delete Field Confirmation -->
    <Dialog
      v-model:visible="showDeleteFieldDialog"
      header="Confirm Delete Field"
      :modal="true"
      :style="{ width: '450px' }"
    >
      <div class="flex items-center gap-3">
        <i class="pi pi-exclamation-triangle text-4xl text-orange-500"></i>
        <div>
          <p class="font-semibold mb-1">Delete this field?</p>
          <p class="text-gray-600 text-sm">
            This will create a new version. Existing instances will not be affected.
          </p>
        </div>
      </div>

      <template #footer>
        <Button
          label="Cancel"
          icon="pi pi-times"
          @click="showDeleteFieldDialog = false"
          class="p-button-text"
        />
        <Button
          label="Delete"
          icon="pi pi-trash"
          @click="handleDeleteField"
          :loading="loading"
          class="p-button-danger"
        />
      </template>
    </Dialog>

    <!-- Edit Data Object Dialog -->
    <Dialog
      v-model:visible="showEditDialog"
      header="Edit Data Object"
      :modal="true"
      :style="{ width: '600px' }"
    >
      <div class="flex flex-col gap-4 py-4">
        <div class="field">
          <label for="editName" class="font-semibold mb-2 block">Name *</label>
          <InputText
            id="editName"
            v-model="editForm.name"
            class="w-full"
          />
        </div>

        <div class="field">
          <label for="editDescription" class="font-semibold mb-2 block">Description</label>
          <Textarea
            id="editDescription"
            v-model="editForm.description"
            rows="3"
            class="w-full"
          />
        </div>
      </div>

      <template #footer>
        <Button
          label="Cancel"
          icon="pi pi-times"
          @click="showEditDialog = false"
          class="p-button-text"
        />
        <Button
          label="Update"
          icon="pi pi-check"
          @click="saveDataObject"
          :loading="loading"
          class="p-button-success"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDataObjects } from '@/composables/admin/useDataObjects';
import { FieldDataType, ValidationRuleType, type DataField, type CreateFieldDto } from '@/types/dynamic-data';
import Breadcrumb from 'primevue/breadcrumb';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Textarea from 'primevue/textarea';
import Dropdown from 'primevue/dropdown';
import Checkbox from 'primevue/checkbox';
import Tag from 'primevue/tag';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';
import AdminNavigation from '@/components/admin/AdminNavigation.vue';

const route = useRoute();
const router = useRouter();
const {
  currentDataObject,
  loading,
  error,
  fetchDataObject,
  updateDataObject,
  addField,
  updateField,
  deleteField
} = useDataObjects();

const showFieldDialog = ref(false);
const showDeleteFieldDialog = ref(false);
const showEditDialog = ref(false);
const showVersionHistory = ref(false);
const editingField = ref<DataField | null>(null);
const deletingField = ref<DataField | null>(null);

const fieldForm = ref<CreateFieldDto>({
  name: '',
  fieldKey: '',
  dataType: FieldDataType.TEXT,
  fieldOrder: 0,
  description: '',
  isMandatory: false,
  isReadOnly: false,
  defaultValue: '',
  validationRules: [],
  dropdownOptions: []
});

const editForm = ref({
  name: '',
  description: ''
});

const fieldErrors = ref<Record<string, string>>({});

// Breadcrumb
const breadcrumbItems = ref([
  {
    label: 'Dashboard',
    icon: 'pi pi-home',
    command: () => router.push('/')
  },
  {
    label: 'Administration',
    icon: 'pi pi-shield',
    command: () => router.push('/admin')
  },
  {
    label: 'Data Objects',
    icon: 'pi pi-database',
    command: () => router.push('/admin/data-objects')
  },
  {
    label: currentDataObject.value?.name || 'Loading...',
    icon: 'pi pi-cog'
  }
]);

const fieldTypeOptions = [
  { label: 'Text', value: FieldDataType.TEXT },
  { label: 'Text Area', value: FieldDataType.TEXTAREA },
  { label: 'Number', value: FieldDataType.NUMBER },
  { label: 'Currency', value: FieldDataType.CURRENCY },
  { label: 'Date', value: FieldDataType.DATE },
  { label: 'Date & Time', value: FieldDataType.DATETIME },
  { label: 'Yes/No', value: FieldDataType.BOOLEAN },
  { label: 'Single Select', value: FieldDataType.SINGLE_SELECT },
  { label: 'Multi Select', value: FieldDataType.MULTI_SELECT },
  { label: 'Email', value: FieldDataType.EMAIL },
  { label: 'URL', value: FieldDataType.URL },
  { label: 'File', value: FieldDataType.FILE },
  { label: 'Rich Text', value: FieldDataType.RICH_TEXT },
  { label: 'Relationship', value: FieldDataType.RELATIONSHIP }
];

const validationRuleOptions = [
  { label: 'Min Length', value: ValidationRuleType.MIN_LENGTH },
  { label: 'Max Length', value: ValidationRuleType.MAX_LENGTH },
  { label: 'Min Value', value: ValidationRuleType.MIN_VALUE },
  { label: 'Max Value', value: ValidationRuleType.MAX_VALUE },
  { label: 'Regex', value: ValidationRuleType.REGEX },
  { label: 'Custom', value: ValidationRuleType.CUSTOM }
];

const sortedFields = computed(() => {
  if (!currentDataObject.value?.fields) return [];
  return [...currentDataObject.value.fields].sort((a, b) => a.fieldOrder - b.fieldOrder);
});

const isSelectType = computed(() => {
  return fieldForm.value.dataType === FieldDataType.SINGLE_SELECT ||
         fieldForm.value.dataType === FieldDataType.MULTI_SELECT;
});

onMounted(async () => {
  const id = route.params.id as string;
  await fetchDataObject(id);
});

const goBack = () => {
  router.push('/admin/data-objects');
};

const openEditDialog = () => {
  if (currentDataObject.value) {
    editForm.value = {
      name: currentDataObject.value.name,
      description: currentDataObject.value.description || ''
    };
    showEditDialog.value = true;
  }
};

const saveDataObject = async () => {
  if (!currentDataObject.value) return;

  try {
    await updateDataObject(currentDataObject.value.id, editForm.value);
    showEditDialog.value = false;
  } catch (err) {
    console.error('Failed to update data object:', err);
  }
};

const openFieldDialog = (field?: DataField) => {
  if (field) {
    editingField.value = field;
    fieldForm.value = {
      name: field.name,
      fieldKey: field.fieldKey,
      dataType: field.dataType as FieldDataType,
      fieldOrder: field.fieldOrder,
      description: field.description,
      isMandatory: field.isMandatory,
      isReadOnly: field.isReadOnly,
      defaultValue: field.defaultValue,
      validationRules: [...field.validationRules],
      dropdownOptions: [...field.dropdownOptions]
    };
  } else {
    const maxOrder = sortedFields.value.length > 0
      ? Math.max(...sortedFields.value.map(f => f.fieldOrder))
      : -1;
    fieldForm.value.fieldOrder = maxOrder + 1;
  }
  showFieldDialog.value = true;
};

const validateFieldForm = (): boolean => {
  fieldErrors.value = {};

  if (!fieldForm.value.name?.trim()) {
    fieldErrors.value.name = 'Field name is required';
  }

  if (!fieldForm.value.dataType) {
    fieldErrors.value.dataType = 'Field type is required';
  }

  return Object.keys(fieldErrors.value).length === 0;
};

const saveField = async () => {
  if (!validateFieldForm() || !currentDataObject.value) return;

  try {
    if (editingField.value) {
      await updateField(currentDataObject.value.id, editingField.value.id, fieldForm.value);
    } else {
      await addField(currentDataObject.value.id, fieldForm.value);
    }
    showFieldDialog.value = false;
    resetFieldForm();
  } catch (err) {
    console.error('Failed to save field:', err);
  }
};

const confirmDeleteField = (field: DataField) => {
  deletingField.value = field;
  showDeleteFieldDialog.value = true;
};

const handleDeleteField = async () => {
  if (!deletingField.value || !currentDataObject.value) return;

  try {
    await deleteField(currentDataObject.value.id, deletingField.value.id);
    showDeleteFieldDialog.value = false;
    deletingField.value = null;
  } catch (err) {
    console.error('Failed to delete field:', err);
  }
};

const resetFieldForm = () => {
  fieldForm.value = {
    name: '',
    fieldKey: '',
    dataType: FieldDataType.TEXT,
    fieldOrder: 0,
    description: '',
    isMandatory: false,
    isReadOnly: false,
    defaultValue: '',
    validationRules: [],
    dropdownOptions: []
  };
  fieldErrors.value = {};
  editingField.value = null;
};

const addOption = () => {
  if (!fieldForm.value.dropdownOptions) {
    fieldForm.value.dropdownOptions = [];
  }
  fieldForm.value.dropdownOptions.push({
    label: '',
    value: '',
    orderIndex: fieldForm.value.dropdownOptions.length
  });
};

const removeOption = (index: number) => {
  fieldForm.value.dropdownOptions?.splice(index, 1);
};

const addRule = () => {
  if (!fieldForm.value.validationRules) {
    fieldForm.value.validationRules = [];
  }
  fieldForm.value.validationRules.push({
    ruleType: ValidationRuleType.MIN_LENGTH,
    ruleValue: '',
    errorMessage: ''
  });
};

const removeRule = (index: number) => {
  fieldForm.value.validationRules?.splice(index, 1);
};

const formatFieldType = (type: string): string => {
  return fieldTypeOptions.find(opt => opt.value === type)?.label || type;
};

const getFieldTypeIcon = (type: string): string => {
  const iconMap: Record<string, string> = {
    [FieldDataType.TEXT]: 'pi pi-align-left',
    [FieldDataType.TEXTAREA]: 'pi pi-align-justify',
    [FieldDataType.NUMBER]: 'pi pi-hashtag',
    [FieldDataType.CURRENCY]: 'pi pi-dollar',
    [FieldDataType.DATE]: 'pi pi-calendar',
    [FieldDataType.DATETIME]: 'pi pi-calendar-times',
    [FieldDataType.BOOLEAN]: 'pi pi-check-square',
    [FieldDataType.SINGLE_SELECT]: 'pi pi-list',
    [FieldDataType.MULTI_SELECT]: 'pi pi-list',
    [FieldDataType.EMAIL]: 'pi pi-envelope',
    [FieldDataType.URL]: 'pi pi-link',
    [FieldDataType.FILE]: 'pi pi-file',
    [FieldDataType.RICH_TEXT]: 'pi pi-file-edit',
    [FieldDataType.RELATIONSHIP]: 'pi pi-sitemap'
  };
  return iconMap[type] || 'pi pi-question';
};
</script>

<style scoped>
.admin-dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #f0f2f5 100%);
}

.admin-header {
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.admin-header-content {
  max-width: 1600px;
  margin: 0 auto;
  padding: 1.5rem 2rem;
}

.admin-breadcrumb {
  margin-bottom: 1rem;
}

.admin-breadcrumb-nav {
  background: transparent;
  border: none;
  padding: 0;
}

.admin-breadcrumb-nav :deep(.p-breadcrumb-list) {
  color: white;
}

.admin-breadcrumb-nav :deep(.p-breadcrumb-list li) {
  color: rgba(255, 255, 255, 0.9);
}

.admin-breadcrumb-nav :deep(.p-breadcrumb-list a) {
  color: white;
  text-decoration: none;
  font-weight: 500;
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
}

.admin-breadcrumb-nav :deep(.p-breadcrumb-list a:hover) {
  background: white;
  color: #1e40af;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.admin-breadcrumb-nav :deep(.p-breadcrumb-list a:hover .p-breadcrumb-item-icon) {
  color: #1e40af;
}

.admin-title-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.admin-title-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.admin-icon {
  width: 4rem;
  height: 4rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: white;
}

.admin-title {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin: 0;
}

.admin-subtitle {
  color: rgba(255, 255, 255, 0.9);
  margin: 0.25rem 0 0;
}

.admin-tag {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
}

.admin-actions {
  display: flex;
  gap: 1rem;
}

.admin-action-btn {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  color: white;
}

.admin-action-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.4);
}

.admin-layout {
  max-width: 1600px;
  margin: 0 auto;
  padding: 2rem;
}

.admin-content {
  width: 100%;
}

.content-container {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 2rem;
}

.content-section {
  padding: 1rem 0;
}
</style>
