<template>
  <Dialog
    v-model:visible="dialogVisible"
    :modal="true"
    :draggable="false"
    :closable="true"
    :style="{ width: '95vw', maxWidth: '1400px', height: '90vh' }"
    class="audit-trail-dialog"
    @show="onDialogShow"
    @hide="onDialogHide"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
          <i class="pi pi-history text-white text-lg"></i>
        </div>
        <div>
          <h3 class="text-xl font-semibold text-gray-900 m-0">Audit Trail</h3>
          <p class="text-sm text-gray-600 m-0 mt-1">Comprehensive activity log and security monitoring</p>
        </div>
      </div>
    </template>

    <div class="audit-trail-content h-full flex flex-col">
      <!-- Quick Stats (Color Blocks) - Moved to Top -->
      <div class="stats-section mb-4">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="stat-card p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div class="text-lg font-bold text-blue-600">{{ totalEvents.toLocaleString() }}</div>
            <div class="text-sm text-gray-600">Total Events</div>
          </div>
          <div class="stat-card p-3 bg-green-50 rounded-lg border border-green-200">
            <div class="text-lg font-bold text-green-600">{{ successfulEvents.toLocaleString() }}</div>
            <div class="text-sm text-gray-600">Successful</div>
          </div>
          <div class="stat-card p-3 bg-red-50 rounded-lg border border-red-200">
            <div class="text-lg font-bold text-red-600">{{ failedEvents.toLocaleString() }}</div>
            <div class="text-sm text-gray-600">Failed</div>
          </div>
          <div class="stat-card p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div class="text-lg font-bold text-orange-600">{{ securityEvents.toLocaleString() }}</div>
            <div class="text-sm text-gray-600">Security Alerts</div>
          </div>
        </div>
      </div>

      <!-- Filters and Search - Under Color Blocks -->
      <div class="filters-section mb-4 p-4 bg-gray-50 rounded-lg border">
        <div class="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div class="col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Search Events</label>
            <div class="p-inputgroup">
              <span class="p-inputgroup-addon">
                <i class="pi pi-search"></i>
              </span>
              <InputText
                v-model="filters.search"
                placeholder="Search by user, action, or description..."
                class="flex-1"
                aria-label="Search audit events by user, action, or description"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Action</label>
            <Dropdown
              v-model="filters.action"
              :options="filterOptions.actions"
              optionLabel="label"
              optionValue="value"
              placeholder="All Actions"
              class="w-full"
              showClear
              aria-label="Filter events by action type"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Resource</label>
            <Dropdown
              v-model="filters.resource"
              :options="filterOptions.resources"
              optionLabel="label"
              optionValue="value"
              placeholder="All Resources"
              class="w-full"
              showClear
              aria-label="Filter events by resource type"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <Dropdown
              :model-value="dateRangeOptions.find(opt => opt.value === filters.days)"
              :options="dateRangeOptions"
              optionLabel="label"
              @update:model-value="onDateRangeChange"
              class="w-full"
            />
          </div>

          <div class="flex items-end">
            <Button
              label="Export"
              icon="pi pi-download"
              class="p-button-outlined w-full"
              :loading="exportLoading"
              @click="() => exportAuditLogsComposable()"
            />
          </div>
        </div>

        <!-- Advanced Filters Toggle -->
        <div class="mt-4">
          <Button
            :label="showAdvancedFilters ? 'Hide Advanced Filters' : 'Show Advanced Filters'"
            :icon="showAdvancedFilters ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
            class="p-button-text p-button-sm"
            @click="showAdvancedFilters = !showAdvancedFilters"
          />
        </div>

        <!-- Advanced Filters -->
        <div v-if="showAdvancedFilters" class="advanced-filters mt-4 pt-4 border-t border-gray-200">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">User</label>
              <Dropdown
                v-model="filters.userId"
                :options="userOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Any User"
                class="w-full"
                showClear
                filter
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Resource</label>
              <Dropdown
                v-model="filters.resource"
                :options="filterOptions.resources"
                optionLabel="label"
                optionValue="value"
                placeholder="Any Resource"
                class="w-full"
                showClear
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">IP Address</label>
              <InputText
                v-model="filters.ipAddress"
                placeholder="Filter by IP address"
                class="w-full"
              />
            </div>

            <div class="flex items-end">
              <Button
                label="Reset All Filters"
                icon="pi pi-filter-slash"
                class="p-button-outlined w-full"
                @click="resetFilters"
              />
            </div>
          </div>
        </div>
      </div>


      <!-- Audit Log Table -->
      <div class="audit-table-section flex-1 min-h-0">
        <DataTable
          v-model:selection="selectedEvents"
          :value="transformedAuditLogs"
          selectionMode="multiple"
          :paginator="true"
          :rows="filters.limit"
          :totalRecords="statsData?.summary?.totalEvents || auditData?.pagination?.total || auditData?.length || 0"
          :first="(filters.page - 1) * filters.limit"
          :loading="loading"
          responsiveLayout="scroll"
          :metaKeySelection="false"
          dataKey="id"
          :sortField="filters.sortBy"
          :sortOrder="filters.sortOrder === 'desc' ? -1 : 1"
          class="audit-datatable h-full"
          :scrollable="true"
          scrollHeight="flex"
          :lazy="true"
          @page="onPageChange"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
        >
          <template #header>
            <div class="flex justify-between items-center">
              <span class="text-lg font-medium text-gray-900">
                {{ statsData?.summary?.totalEvents || auditData?.pagination?.total || auditData?.length || 0 }} events found (page {{ filters.page }})
              </span>
              <div class="flex gap-2">
                <Button
                  v-if="selectedEvents.length > 0"
                  :label="`Actions (${selectedEvents.length})`"
                  icon="pi pi-cog"
                  class="p-button-sm p-button-outlined"
                  @click="showBulkActionsMenu = !showBulkActionsMenu"
                />
                <Button
                  label="Refresh"
                  icon="pi pi-refresh"
                  class="p-button-sm p-button-outlined"
                  @click="refreshData"
                  :loading="loading"
                />
              </div>
            </div>
          </template>

          <Column selectionMode="multiple" headerStyle="width: 3rem" />

          <!-- Event Type and Severity -->
          <Column field="action" header="Action" :sortable="true" class="w-32 sm:w-40 lg:min-w-40">
            <template #body="{ data }">
              <div class="flex items-center gap-2">
                <i
                  :class="getEventIcon(data.action)"
                  class="text-lg"
                  :style="{ color: getEventColor(data.action) }"
                ></i>
                <div>
                  <div class="font-medium text-gray-900">{{ data.action }}</div>
                  <Tag
                    :value="data.severity"
                    :severity="getSeverity(data.severity)"
                    class="text-xs mt-1"
                  />
                </div>
              </div>
            </template>
          </Column>

          <!-- User Information -->
          <Column field="userId" header="User" :sortable="true" class="w-36 sm:w-48 lg:min-w-48">
            <template #body="{ data }">
              <div class="flex items-center gap-3">
                <div>
                  <div class="font-medium text-gray-900">{{ data.userDisplayName || 'System' }}</div>
                  <div v-if="data.user" class="text-sm text-gray-600">{{ data.user.email }}</div>
                  <div v-if="data.userId" class="text-xs text-gray-500">ID: {{ data.userId }}</div>
                </div>
              </div>
            </template>
          </Column>

          <!-- Action Description -->
          <Column field="description" header="Description" :sortable="false" class="w-48 sm:w-64 lg:min-w-80">
            <template #body="{ data }">
              <div>
                <div class="font-medium text-gray-900">{{ data.description }}</div>
                <div v-if="data.details && typeof data.details === 'object'" class="text-xs text-gray-500 mt-1">
                  <details class="cursor-pointer">
                    <summary class="text-blue-600 hover:text-blue-800">View details</summary>
                    <pre class="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">{{ JSON.stringify(data.details, null, 2) }}</pre>
                  </details>
                </div>
                <div v-else-if="data.details" class="text-xs text-gray-500 mt-1">
                  {{ data.details }}
                </div>
              </div>
            </template>
          </Column>

          <!-- Resource -->
          <Column field="resource" header="Resource" :sortable="true" class="w-24 sm:w-32 lg:min-w-32">
            <template #body="{ data }">
              <div v-if="data.resource">
                <div class="font-medium text-gray-900">{{ data.resource }}</div>
              </div>
              <span v-else class="text-gray-400">-</span>
            </template>
          </Column>

          <!-- Status -->
          <Column field="status" header="Status" :sortable="true" class="text-center">
            <template #body="{ data }">
              <Tag
                :value="data.status"
                :severity="getStatusSeverity(data.status)"
                class="font-medium"
              />
            </template>
          </Column>

          <!-- IP Address and User Agent -->
          <Column field="ipAddress" header="Location" class="w-32 sm:w-40 lg:min-w-40">
            <template #body="{ data }">
              <div class="text-sm">
                <div class="text-gray-900">{{ data.ipAddress || 'Unknown' }}</div>
                <div v-if="data.userAgent" class="text-gray-500 truncate max-w-32" :title="data.userAgent">
                  {{ data.userAgent.split('/')[0] || 'Unknown' }}
                </div>
              </div>
            </template>
          </Column>

          <!-- Timestamp -->
          <Column field="createdAt" header="Time" :sortable="true" class="w-36 sm:w-44 lg:min-w-44">
            <template #body="{ data }">
              <div class="text-sm">
                <div class="text-gray-900">{{ formatDate(data.createdAt) }}</div>
                <div class="text-gray-600">{{ formatTime(data.createdAt) }}</div>
                <div class="text-gray-500">{{ getRelativeTime(data.createdAt) }}</div>
              </div>
            </template>
          </Column>

          <!-- Actions -->
          <Column header="Actions" class="w-24 sm:w-32 lg:min-w-32">
            <template #body="{ data }">
              <div class="flex items-center gap-1">
                <Button
                  icon="pi pi-eye"
                  class="p-button-sm p-button-text p-button-rounded"
                  @click="viewEventDetails(data)"
                  v-tooltip.top="'View Details'"
                  :aria-label="`View details for ${data.action} event by ${data.userDisplayName}`"
                />
                <Button
                  icon="pi pi-share-alt"
                  class="p-button-sm p-button-text p-button-rounded"
                  @click="shareEvent(data)"
                  v-tooltip.top="'Share Event'"
                  :aria-label="`Share ${data.action} event details`"
                />
                <Button
                  v-if="data.severity === 'HIGH' || data.status === 'FAILED'"
                  icon="pi pi-flag"
                  class="p-button-sm p-button-text p-button-rounded p-button-danger"
                  @click="flagEvent(data)"
                  v-tooltip.top="'Flag for Review'"
                  :aria-label="`Flag ${data.action} event for security review`"
                />
              </div>
            </template>
          </Column>

          <template #empty>
            <div class="text-center py-8">
              <i class="pi pi-history text-4xl text-gray-400 mb-4"></i>
              <p class="text-gray-600 text-lg mb-2">No audit events found</p>
              <p class="text-gray-500 text-sm">Try adjusting your search criteria</p>
            </div>
          </template>

          <template #loading>
            <div class="space-y-4 p-6" role="status" aria-label="Loading audit events">
              <div v-for="i in 5" :key="i" class="animate-pulse">
                <div class="flex items-center space-x-4">
                  <div class="h-4 bg-gray-200 rounded w-8"></div>
                  <div class="h-4 bg-gray-200 rounded w-20"></div>
                  <div class="h-4 bg-gray-200 rounded w-32"></div>
                  <div class="h-4 bg-gray-200 rounded flex-1"></div>
                  <div class="h-4 bg-gray-200 rounded w-16"></div>
                  <div class="h-4 bg-gray-200 rounded w-20"></div>
                  <div class="h-4 bg-gray-200 rounded w-24"></div>
                  <div class="h-4 bg-gray-200 rounded w-16"></div>
                </div>
                <div class="mt-2 flex items-center space-x-4">
                  <div class="h-3 bg-gray-100 rounded w-6"></div>
                  <div class="h-3 bg-gray-100 rounded w-16"></div>
                  <div class="h-3 bg-gray-100 rounded w-24"></div>
                  <div class="h-3 bg-gray-100 rounded w-48"></div>
                  <div class="h-3 bg-gray-100 rounded w-12"></div>
                  <div class="h-3 bg-gray-100 rounded w-16"></div>
                  <div class="h-3 bg-gray-100 rounded w-20"></div>
                  <div class="h-3 bg-gray-100 rounded w-12"></div>
                </div>
              </div>
              <div class="text-center pt-4">
                <div class="inline-flex items-center">
                  <ProgressSpinner class="w-5 h-5 mr-2" />
                  <span class="text-gray-600 text-sm">Loading audit events...</span>
                </div>
              </div>
            </div>
          </template>
        </DataTable>
      </div>
    </div>

    <!-- Top Actions & Resources Summary - Moved to Bottom -->
    <div class="summary-section mt-6 mb-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Top Actions -->
        <div class="action-summary">
          <h3 class="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <i class="pi pi-chart-bar mr-2 text-blue-600"></i>
            Top Actions
          </h3>
          <div class="space-y-2">
            <div v-if="statsData?.topActions?.length" class="space-y-2">
              <div
                v-for="action in statsData.topActions.slice(0, 5)"
                :key="action.action"
                class="flex items-center justify-between p-2 bg-gray-50 rounded border"
              >
                <span class="text-sm font-medium text-gray-700">{{ action.action }}</span>
                <span class="text-sm text-blue-600 font-semibold">{{ action.count }}</span>
              </div>
            </div>
            <div v-else class="text-sm text-gray-500 italic">
              No action data available
            </div>
          </div>
        </div>

        <!-- Top Resources -->
        <div class="resource-summary">
          <h3 class="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <i class="pi pi-database mr-2 text-green-600"></i>
            Top Resources
          </h3>
          <div class="space-y-2">
            <div v-if="statsData?.topResources?.length" class="space-y-2">
              <div
                v-for="resource in statsData.topResources.slice(0, 5)"
                :key="resource.resource"
                class="flex items-center justify-between p-2 bg-gray-50 rounded border"
              >
                <span class="text-sm font-medium text-gray-700">{{ resource.resource }}</span>
                <span class="text-sm text-green-600 font-semibold">{{ resource.count }}</span>
              </div>
            </div>
            <div v-else class="text-sm text-gray-500 italic">
              No resource data available
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between px-6 py-4 bg-gray-50 border-t">
        <div class="text-sm text-gray-500 flex items-center">
          <i class="pi pi-info-circle mr-2 text-blue-500"></i>
          Audit logs are retained for {{ AUDIT_CONFIG.RETENTION_DAYS }} days
        </div>
        <div class="flex items-center gap-3">
          <Button
            label="Generate Report"
            icon="pi pi-file-pdf"
            class="p-button-outlined p-button-secondary px-6 py-2"
            @click="() => exportAuditLogsComposable('xlsx')"
          />
          <Button
            label="Close"
            icon="pi pi-times"
            class="p-button-primary px-8 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 border-blue-600 hover:border-blue-700"
            @click="closeDialog"
          />
        </div>
      </div>
    </template>

    <!-- Bulk Actions Menu -->
    <OverlayPanel ref="bulkActionsMenu" v-model:visible="showBulkActionsMenu">
      <div class="flex flex-col gap-2 min-w-48">
        <Button
          label="Export Selected"
          icon="pi pi-download"
          class="p-button-text p-button-sm justify-start"
          @click="exportSelectedEvents"
        />
        <Button
          label="Flag Selected"
          icon="pi pi-flag"
          class="p-button-text p-button-sm justify-start"
          @click="flagSelectedEvents"
        />
        <Divider />
        <Button
          label="Mark as Reviewed"
          icon="pi pi-check"
          class="p-button-text p-button-sm justify-start"
          @click="markAsReviewed"
        />
      </div>
    </OverlayPanel>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useAuditTrail } from '@/composables/useAuditTrail';
import { auditTrailService } from '@/services/auditTrailService';

// Simple debounce function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

import Dialog from 'primevue/dialog';

// Props
const props = defineProps<{
  visible: boolean;
}>();

// Emits
const emit = defineEmits<{
  'update:visible': [visible: boolean];
}>();

// Composables
const toast = useToast();
const {
  loading,
  exportLoading,
  auditData,
  statsData,
  transformedAuditLogs,
  userOptions,
  filters,
  totalEvents,
  successfulEvents,
  failedEvents,
  securityEvents,
  loadAuditLogs,
  loadAuditStatistics,
  resetFilters,
  refreshData,
  exportAuditLogs: exportAuditLogsComposable,
  onPageChange,
  onFiltersChange,
  AUDIT_CONFIG
} = useAuditTrail();

// Component state
const dialogVisible = ref(props.visible);
const selectedEvents = ref([]);
const showAdvancedFilters = ref(false);
const showBulkActionsMenu = ref(false);

// Get filter options from service
const filterOptions = auditTrailService.getFilterOptions();

// Use date range options from composable
const dateRangeOptions = AUDIT_CONFIG.DATE_RANGES;

// Computed properties for display

// Watchers
watch(() => props.visible, (newValue) => {
  dialogVisible.value = newValue;
});

watch(dialogVisible, (newValue) => {
  emit('update:visible', newValue);
});

// Methods
const getEventIcon = (action: string) => {
  const icons: Record<string, string> = {
    'ROLE_ASSIGNED': 'pi pi-user-plus',
    'ROLE_REVOKED': 'pi pi-user-minus',
    'PERMISSION_GRANTED': 'pi pi-cog',
    'PERMISSION_REVOKED': 'pi pi-ban',
    'LOGIN': 'pi pi-sign-in',
    'LOGOUT': 'pi pi-sign-out',
    'LOGIN_FAILED': 'pi pi-times-circle',
    'SUSPICIOUS_ACTIVITY': 'pi pi-exclamation-triangle',
    'USER_CREATED': 'pi pi-plus',
    'USER_UPDATED': 'pi pi-pencil',
    'USER_DELETED': 'pi pi-trash',
    'USER_VIEWED': 'pi pi-eye',
    'TOKEN_REFRESH': 'pi pi-refresh',
    'PASSWORD_RESET': 'pi pi-key',
    'PASSWORD_CHANGED': 'pi pi-lock',
    'ACCOUNT_LOCKED': 'pi pi-lock',
    'RATE_LIMIT_EXCEEDED': 'pi pi-clock',
  };
  return icons[action] || 'pi pi-info-circle';
};

const getEventColor = (action: string) => {
  const colors: Record<string, string> = {
    'ROLE_ASSIGNED': '#10b981',
    'ROLE_REVOKED': '#f59e0b',
    'PERMISSION_GRANTED': '#3b82f6',
    'PERMISSION_REVOKED': '#ef4444',
    'LOGIN': '#10b981',
    'LOGOUT': '#6b7280',
    'LOGIN_FAILED': '#ef4444',
    'SUSPICIOUS_ACTIVITY': '#dc2626',
    'USER_CREATED': '#8b5cf6',
    'USER_UPDATED': '#06b6d4',
    'USER_DELETED': '#ef4444',
    'USER_VIEWED': '#3b82f6',
    'TOKEN_REFRESH': '#10b981',
    'PASSWORD_RESET': '#f59e0b',
    'PASSWORD_CHANGED': '#10b981',
    'ACCOUNT_LOCKED': '#dc2626',
    'RATE_LIMIT_EXCEEDED': '#f59e0b',
  };
  return colors[action] || '#6b7280';
};

const getSeverity = (severity: string) => {
  switch (severity) {
    case 'LOW': return 'success';
    case 'MEDIUM': return 'warning';
    case 'HIGH': return 'danger';
    case 'CRITICAL': return 'danger';
    default: return 'info';
  }
};

const getStatusSeverity = (status: string) => {
  switch (status) {
    case 'SUCCESS': return 'success';
    case 'FAILED': return 'danger';
    case 'PENDING': return 'warning';
    default: return 'info';
  }
};

const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(dateString));
};

const formatTime = (dateString: string) => {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date(dateString));
};

const getRelativeTime = (dateString: string) => {
  const now = new Date();
  const diff = Math.floor((now.getTime() - new Date(dateString).getTime()) / 60000); // diff in minutes

  if (diff < 1) return 'Just now';
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
};

// resetFilters is now provided by the composable

// Debounced filter change function for better performance
const debouncedFiltersChange = debounce(() => {
  onFiltersChange();
}, AUDIT_CONFIG.DEBOUNCE_DELAY);

// Watch for filter changes and reload both data sources with debouncing
watch(
  () => [filters.search, filters.action, filters.resource, filters.userId, filters.ipAddress, filters.days],
  () => {
    debouncedFiltersChange();
  },
  { deep: true }
);

// Handle date range selection
const onDateRangeChange = (selectedRange: any) => {
  if (selectedRange?.value) {
    filters.days = selectedRange.value;
    // Immediate load for date range changes as they're less frequent
    filters.page = 1;
    loadAuditLogs();
  }
};

// onPageChange is now provided by the composable

const onDialogShow = () => {
  console.log('Dialog shown - loading audit logs and statistics');
  loadAuditLogs();
  loadAuditStatistics();
};

const onDialogHide = () => {
  selectedEvents.value = [];
  showBulkActionsMenu.value = false;
};

const closeDialog = () => {
  dialogVisible.value = false;
};

// loadAuditLogs is now provided by the composable

// loadAuditStatistics is now provided by the composable

// refreshData is now provided by the composable

const viewEventDetails = (event: any) => {
  // Create a detailed view of the event
  const details = {
    id: event.id,
    action: event.action,
    user: event.user,
    resource: event.resource,
    ipAddress: event.ipAddress,
    userAgent: event.userAgent,
    details: event.details,
    createdAt: event.createdAt
  };

  // For now, show in console and toast - could be enhanced with a modal
  console.log('Event Details:', details);
  toast.add({
    severity: 'info',
    summary: 'Event Details',
    detail: `Details logged to console for: ${event.action}`,
    life: 3000
  });
};

const shareEvent = async (event: any) => {
  try {
    const eventText = `Audit Event: ${event.action} by ${event.userDisplayName} at ${formatDate(event.createdAt)} ${formatTime(event.createdAt)}`;
    await navigator.clipboard.writeText(eventText);
    toast.add({
      severity: 'success',
      summary: 'Event Shared',
      detail: 'Event details copied to clipboard.',
      life: 3000
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Share Failed',
      detail: 'Could not copy to clipboard.',
      life: 3000
    });
  }
};

const flagEvent = (event: any) => {
  // In a real implementation, this would call an API to flag the event
  toast.add({
    severity: 'warn',
    summary: 'Event Flagged',
    detail: `Event ${event.id} has been flagged for review. TO BE DEVELOPED`,
    life: 3000
  });
};

// exportAuditLogs is now provided by the composable

const exportSelectedEvents = async () => {
  if (selectedEvents.value.length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'No Selection',
      detail: 'Please select events to export.',
      life: 3000
    });
    return;
  }

  try {
    const exportRequest = {
      format: 'csv' as const,
      fields: ['id', 'action', 'userId', 'resource', 'ipAddress', 'createdAt'],
      ...filters
    };

    const response = await auditTrailService.exportAuditTrail(exportRequest);
    await auditTrailService.downloadExport(response.downloadUrl, response.fileName);

    toast.add({
      severity: 'success',
      summary: 'Export Complete',
      detail: `Exported ${selectedEvents.value.length} selected events.`,
      life: 3000
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Export Failed',
      detail: 'Failed to export selected events.',
      life: 3000
    });
  }

  selectedEvents.value = [];
  showBulkActionsMenu.value = false;
};

const flagSelectedEvents = () => {
  if (selectedEvents.value.length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'No Selection',
      detail: 'Please select events to flag.',
      life: 3000
    });
    return;
  }

  // In a real implementation, this would call an API to flag the events
  toast.add({
    severity: 'warn',
    summary: 'Events Flagged',
    detail: `${selectedEvents.value.length} events have been flagged for review. TO BE DEVELOPED`,
    life: 3000
  });
  selectedEvents.value = [];
  showBulkActionsMenu.value = false;
};

const markAsReviewed = () => {
  if (selectedEvents.value.length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'No Selection',
      detail: 'Please select events to mark as reviewed.',
      life: 3000
    });
    return;
  }

  // In a real implementation, this would call an API to mark events as reviewed
  toast.add({
    severity: 'success',
    summary: 'Events Reviewed',
    detail: `${selectedEvents.value.length} events marked as reviewed. TO BE DEVELOPED`,
    life: 3000
  });
  selectedEvents.value = [];
  showBulkActionsMenu.value = false;
};

// generateReport is now handled by exportAuditLogsComposable('xlsx')

// Lifecycle
onMounted(() => {
  console.log('AuditTrailDialog mounted, props.visible:', props.visible);
  if (props.visible) {
    console.log('Component is visible on mount, loading data');
    loadAuditLogs();
    loadAuditStatistics();
  }
});
</script>

<style scoped>
.audit-trail-dialog :deep(.p-dialog-header) {
  @apply border-b border-gray-200 bg-white;
}

.audit-trail-dialog :deep(.p-dialog-content) {
  @apply bg-gray-50 p-0;
}

.audit-trail-dialog :deep(.p-dialog-footer) {
  @apply border-t border-gray-200 bg-white;
}

.audit-trail-content {
  @apply p-6;
}

.filters-section {
  @apply transition-all duration-200;
}

.advanced-filters {
  @apply transition-all duration-300;
}

.audit-datatable {
  @apply bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden;
}

.audit-datatable :deep(.p-datatable-header) {
  @apply bg-gray-50 border-b border-gray-200 px-6 py-4;
}

.audit-datatable :deep(.p-datatable-thead > tr > th) {
  @apply bg-gray-50 border-b border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700;
}

.audit-datatable :deep(.p-datatable-tbody > tr > td) {
  @apply px-4 py-4 border-b border-gray-100;
}

.audit-datatable :deep(.p-datatable-tbody > tr:hover) {
  @apply bg-gray-50;
}

.audit-datatable :deep(.p-datatable-tbody > tr.p-highlight) {
  @apply bg-blue-50 border-blue-200;
}

.stat-card {
  @apply transition-all duration-200 hover:shadow-md;
}

/* Custom scrollbar for the dialog content */
.audit-trail-content {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f1f5f9;
}

.audit-trail-content::-webkit-scrollbar {
  width: 6px;
}

.audit-trail-content::-webkit-scrollbar-track {
  @apply bg-gray-100 rounded-full;
}

.audit-trail-content::-webkit-scrollbar-thumb {
  @apply bg-gray-300 rounded-full hover:bg-gray-400;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .audit-trail-dialog {
    @apply m-4;
  }

  .audit-trail-dialog :deep(.p-dialog) {
    @apply w-full h-full max-h-none;
  }

  .audit-trail-content {
    @apply p-4;
  }

  .filters-section .grid {
    @apply grid-cols-1 gap-3;
  }

  .advanced-filters .grid {
    @apply grid-cols-1 gap-3;
  }

  .stats-section {
    @apply grid-cols-2;
  }

  .audit-datatable :deep(.p-datatable-header) {
    @apply px-4 py-3;
  }

  .audit-datatable :deep(.p-datatable-thead > tr > th),
  .audit-datatable :deep(.p-datatable-tbody > tr > td) {
    @apply px-3 py-3;
  }
}

/* Focus indicators for better accessibility */
.audit-datatable :deep(.p-button:focus-visible) {
  @apply ring-2 ring-blue-500 ring-offset-2 outline-none;
}

.audit-datatable :deep(.p-checkbox:focus-visible .p-checkbox-box) {
  @apply ring-2 ring-blue-500 ring-offset-2;
}

.audit-datatable :deep(.p-datatable-tbody > tr:focus-visible) {
  @apply ring-2 ring-blue-500 ring-offset-2 outline-none;
}

.filters-section :deep(.p-inputtext:focus-visible),
.filters-section :deep(.p-dropdown:focus-visible .p-dropdown-label) {
  @apply ring-2 ring-blue-500 ring-offset-2 outline-none;
}

/* Animation for severity indicators */
.audit-datatable :deep(.p-tag.p-tag-danger) {
  animation: alertPulse 2s infinite;
}

@keyframes alertPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}
</style>
