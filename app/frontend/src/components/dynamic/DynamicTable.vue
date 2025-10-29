<template>
  <div class="dynamic-table">
    <!-- Toolbar -->
    <div class="table-toolbar mb-4 p-4 bg-white rounded-lg shadow-sm">
      <div class="flex justify-between items-center gap-4">
        <div class="flex-1">
          <span class="p-input-icon-left w-full max-w-md">
            <i class="pi pi-search" />
            <InputText
              v-model="searchQuery"
              placeholder="Search..."
              class="w-full"
              @input="handleSearch"
            />
          </span>
        </div>
        <div class="flex gap-2">
          <Button
            v-if="canWrite"
            label="Create"
            icon="pi pi-plus"
            class="p-button-success"
            @click="$emit('create')"
          />
          <Button
            label="Export CSV"
            icon="pi pi-download"
            class="p-button-outlined"
            @click="handleExportCSV"
            :loading="exportLoading"
          />
          <Button
            label="Refresh"
            icon="pi pi-refresh"
            class="p-button-outlined"
            @click="handleRefresh"
            :loading="loading"
          />
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <Message v-if="error" severity="error" class="mb-4">
      {{ error }}
    </Message>

    <!-- Data Table -->
    <DataTable
      :value="instances"
      :loading="loading"
      :paginator="true"
      :rows="pagination.limit"
      :total-records="pagination.total"
      :lazy="true"
      :rows-per-page-options="[10, 20, 50, 100]"
      paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
      current-page-report-template="Showing {first} to {last} of {totalRecords} entries"
      :sort-field="sortField"
      :sort-order="sortOrder"
      @page="onPage"
      @sort="onSort"
      @update:rows="onRowsPerPageChange"
      class="shadow-sm"
      striped-rows
      responsive-layout="scroll"
    >
      <!-- Dynamic Columns -->
      <Column
        v-for="field in visibleFields"
        :key="field.id"
        :field="field.fieldKey"
        :header="field.name"
        :sortable="isSortable(field)"
        :style="{ minWidth: getColumnWidth(field) }"
      >
        <template #body="{ data }">
          <component
            :is="getCellRenderer(field.dataType)"
            :value="data.values[field.fieldKey]"
            :field="field"
          />
        </template>
      </Column>

      <!-- Actions Column -->
      <Column header="Actions" :style="{ width: '150px' }" frozen align-frozen="right">
        <template #body="{ data }">
          <div class="flex gap-1">
            <Button
              icon="pi pi-eye"
              class="p-button-text p-button-sm p-button-info"
              v-tooltip.top="'View'"
              @click="$emit('view', data)"
            />
            <Button
              v-if="canWrite"
              icon="pi pi-pencil"
              class="p-button-text p-button-sm p-button-warning"
              v-tooltip.top="'Edit'"
              @click="$emit('edit', data)"
            />
            <Button
              v-if="canDelete"
              icon="pi pi-trash"
              class="p-button-text p-button-sm p-button-danger"
              v-tooltip.top="'Delete'"
              @click="$emit('delete', data)"
            />
          </div>
        </template>
      </Column>

      <!-- Empty State -->
      <template #empty>
        <div class="text-center py-8">
          <i class="pi pi-inbox text-4xl text-gray-300 mb-3"></i>
          <p class="text-gray-500 text-lg mb-2">No records found</p>
          <p v-if="searchQuery" class="text-gray-400 text-sm mb-4">
            Try adjusting your search criteria
          </p>
          <Button
            v-if="canWrite && !searchQuery"
            label="Create First Record"
            icon="pi pi-plus"
            @click="$emit('create')"
            class="p-button-outlined"
          />
        </div>
      </template>

      <!-- Loading State -->
      <template #loading>
        <div class="flex justify-center items-center py-8">
          <ProgressSpinner />
        </div>
      </template>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';
import { FieldDataType, type DynamicSchema, type DynamicInstance, type DynamicField } from '@/types/dynamic-data';

// Import cell renderers
import TextCell from './cells/TextCell.vue';
import NumberCell from './cells/NumberCell.vue';
import CurrencyCell from './cells/CurrencyCell.vue';
import DateCell from './cells/DateCell.vue';
import DateTimeCell from './cells/DateTimeCell.vue';
import BooleanCell from './cells/BooleanCell.vue';
import SelectCell from './cells/SelectCell.vue';
import EmailCell from './cells/EmailCell.vue';
import UrlCell from './cells/UrlCell.vue';
import FileCell from './cells/FileCell.vue';
import RichTextCell from './cells/RichTextCell.vue';

const props = defineProps<{
  schema: DynamicSchema;
  instances: DynamicInstance[];
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  canWrite?: boolean;
  canDelete?: boolean;
}>();

const emit = defineEmits<{
  (e: 'fetch', params: { page: number; limit: number; sortBy?: string; sortOrder?: string; search?: string }): void;
  (e: 'view', instance: DynamicInstance): void;
  (e: 'edit', instance: DynamicInstance): void;
  (e: 'delete', instance: DynamicInstance): void;
  (e: 'create'): void;
  (e: 'export-csv'): void;
}>();

const searchQuery = ref('');
const sortField = ref<string>('');
const sortOrder = ref<number>(1);
const exportLoading = ref(false);

// Only show fields that are not hidden
const visibleFields = computed(() =>
  props.schema.fields
    .filter(field => !field.isReadOnly || field.dataType !== FieldDataType.RELATIONSHIP)
    .sort((a, b) => a.fieldOrder - b.fieldOrder)
    .slice(0, 8) // Limit to first 8 fields for better table display
);

const getCellRenderer = (dataType: FieldDataType) => {
  const rendererMap: Record<FieldDataType, any> = {
    [FieldDataType.TEXT]: TextCell,
    [FieldDataType.TEXTAREA]: TextCell,
    [FieldDataType.NUMBER]: NumberCell,
    [FieldDataType.CURRENCY]: CurrencyCell,
    [FieldDataType.DATE]: DateCell,
    [FieldDataType.DATETIME]: DateTimeCell,
    [FieldDataType.BOOLEAN]: BooleanCell,
    [FieldDataType.SINGLE_SELECT]: SelectCell,
    [FieldDataType.MULTI_SELECT]: SelectCell,
    [FieldDataType.EMAIL]: EmailCell,
    [FieldDataType.URL]: UrlCell,
    [FieldDataType.FILE]: FileCell,
    [FieldDataType.RICH_TEXT]: RichTextCell,
    [FieldDataType.RELATIONSHIP]: TextCell,
  };
  return rendererMap[dataType] || TextCell;
};

const isSortable = (field: DynamicField): boolean => {
  // Most fields are sortable except FILE and RICH_TEXT
  return ![FieldDataType.FILE, FieldDataType.RICH_TEXT, FieldDataType.MULTI_SELECT].includes(field.dataType);
};

const getColumnWidth = (field: DynamicField): string => {
  const widthMap: Partial<Record<FieldDataType, string>> = {
    [FieldDataType.BOOLEAN]: '120px',
    [FieldDataType.DATE]: '150px',
    [FieldDataType.DATETIME]: '180px',
    [FieldDataType.CURRENCY]: '150px',
    [FieldDataType.NUMBER]: '120px',
  };
  return widthMap[field.dataType] || '200px';
};

let searchTimeout: NodeJS.Timeout;

const handleSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    fetchData();
  }, 500); // Debounce search
};

const onPage = (event: any) => {
  fetchData(event.page + 1, event.rows);
};

const onSort = (event: any) => {
  sortField.value = event.sortField;
  sortOrder.value = event.sortOrder;
  fetchData(props.pagination.page, props.pagination.limit, event.sortField, event.sortOrder === 1 ? 'asc' : 'desc');
};

const onRowsPerPageChange = (rows: number) => {
  fetchData(1, rows);
};

const fetchData = (
  page: number = props.pagination.page,
  limit: number = props.pagination.limit,
  sortBy?: string,
  sortOrderStr?: string
) => {
  emit('fetch', {
    page,
    limit,
    sortBy: sortBy || undefined,
    sortOrder: sortOrderStr || undefined,
    search: searchQuery.value || undefined,
  });
};

const handleRefresh = () => {
  fetchData();
};

const handleExportCSV = async () => {
  exportLoading.value = true;
  try {
    emit('export-csv');
  } finally {
    setTimeout(() => {
      exportLoading.value = false;
    }, 1000);
  }
};

// Watch for schema changes
watch(
  () => props.schema,
  () => {
    searchQuery.value = '';
    sortField.value = '';
    sortOrder.value = 1;
  }
);
</script>

<style scoped>
.dynamic-table {
  width: 100%;
}

:deep(.p-datatable .p-datatable-tbody > tr > td) {
  padding: 0.75rem;
}

:deep(.p-datatable .p-datatable-thead > tr > th) {
  padding: 0.75rem;
  font-weight: 600;
}
</style>
