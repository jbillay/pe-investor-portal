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
      <!-- Filters and Search -->
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
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
            <Dropdown
              v-model="filters.eventType"
              :options="eventTypeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="All Events"
              class="w-full"
              showClear
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Severity</label>
            <Dropdown
              v-model="filters.severity"
              :options="severityOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="All Severities"
              class="w-full"
              showClear
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <Dropdown
              v-model="filters.dateRange"
              :options="dateRangeOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full"
            />
          </div>

          <div class="flex items-end">
            <Button
              label="Export"
              icon="pi pi-download"
              class="p-button-outlined w-full"
              @click="exportAuditLogs"
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
                :options="resourceOptions"
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

      <!-- Quick Stats -->
      <div class="stats-section mb-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="stat-card p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div class="text-lg font-bold text-blue-600">{{ totalEvents }}</div>
          <div class="text-sm text-gray-600">Total Events</div>
        </div>
        <div class="stat-card p-3 bg-green-50 rounded-lg border border-green-200">
          <div class="text-lg font-bold text-green-600">{{ successfulEvents }}</div>
          <div class="text-sm text-gray-600">Successful</div>
        </div>
        <div class="stat-card p-3 bg-red-50 rounded-lg border border-red-200">
          <div class="text-lg font-bold text-red-600">{{ failedEvents }}</div>
          <div class="text-sm text-gray-600">Failed</div>
        </div>
        <div class="stat-card p-3 bg-orange-50 rounded-lg border border-orange-200">
          <div class="text-lg font-bold text-orange-600">{{ securityEvents }}</div>
          <div class="text-sm text-gray-600">Security Alerts</div>
        </div>
      </div>

      <!-- Audit Log Table -->
      <div class="audit-table-section flex-1 min-h-0">
        <DataTable
          v-model:selection="selectedEvents"
          :value="filteredAuditLogs"
          selectionMode="multiple"
          :paginator="true"
          :rows="20"
          :loading="loading"
          responsiveLayout="scroll"
          :metaKeySelection="false"
          dataKey="id"
          :sortField="'timestamp'"
          :sortOrder="-1"
          class="audit-datatable h-full"
          :scrollable="true"
          scrollHeight="flex"
        >
          <template #header>
            <div class="flex justify-between items-center">
              <span class="text-lg font-medium text-gray-900">
                {{ filteredAuditLogs.length }} events found
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
                  @click="refreshAuditLogs"
                  :loading="loading"
                />
              </div>
            </div>
          </template>

          <Column selectionMode="multiple" headerStyle="width: 3rem" />

          <!-- Event Type and Severity -->
          <Column field="eventType" header="Event" :sortable="true" class="min-w-40">
            <template #body="{ data }">
              <div class="flex items-center gap-2">
                <i
                  :class="getEventIcon(data.eventType)"
                  class="text-lg"
                  :style="{ color: getEventColor(data.eventType) }"
                ></i>
                <div>
                  <div class="font-medium text-gray-900">{{ data.eventType }}</div>
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
          <Column field="user" header="User" :sortable="true" class="min-w-48">
            <template #body="{ data }">
              <div class="flex items-center gap-3">
                <Avatar
                  :image="data.user.avatar"
                  :label="data.user.name ? data.user.name.charAt(0).toUpperCase() : 'U'"
                  size="normal"
                  shape="circle"
                />
                <div>
                  <div class="font-medium text-gray-900">{{ data.user.name || 'Unknown User' }}</div>
                  <div class="text-sm text-gray-600">{{ data.user.email }}</div>
                  <div class="text-xs text-gray-500">{{ data.user.role }}</div>
                </div>
              </div>
            </template>
          </Column>

          <!-- Action Description -->
          <Column field="description" header="Description" :sortable="true" class="min-w-80">
            <template #body="{ data }">
              <div>
                <div class="font-medium text-gray-900">{{ data.action }}</div>
                <div class="text-sm text-gray-600 mt-1">{{ data.description }}</div>
                <div v-if="data.details" class="text-xs text-gray-500 mt-1">
                  {{ data.details }}
                </div>
              </div>
            </template>
          </Column>

          <!-- Resource and Target -->
          <Column field="resource" header="Resource" :sortable="true" class="min-w-32">
            <template #body="{ data }">
              <div v-if="data.resource">
                <div class="font-medium text-gray-900">{{ data.resource }}</div>
                <div v-if="data.targetId" class="text-sm text-gray-600">ID: {{ data.targetId }}</div>
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

          <!-- IP Address and Location -->
          <Column field="metadata" header="Location" class="min-w-40">
            <template #body="{ data }">
              <div class="text-sm">
                <div class="text-gray-900">{{ data.metadata?.ipAddress || 'Unknown' }}</div>
                <div class="text-gray-600">{{ data.metadata?.location || 'Unknown Location' }}</div>
                <div class="text-gray-500">{{ data.metadata?.userAgent || '' }}</div>
              </div>
            </template>
          </Column>

          <!-- Timestamp -->
          <Column field="timestamp" header="Time" :sortable="true" class="min-w-44">
            <template #body="{ data }">
              <div class="text-sm">
                <div class="text-gray-900">{{ formatDate(data.timestamp) }}</div>
                <div class="text-gray-600">{{ formatTime(data.timestamp) }}</div>
                <div class="text-gray-500">{{ getRelativeTime(data.timestamp) }}</div>
              </div>
            </template>
          </Column>

          <!-- Actions -->
          <Column header="Actions" class="min-w-32">
            <template #body="{ data }">
              <div class="flex items-center gap-1">
                <Button
                  icon="pi pi-eye"
                  class="p-button-sm p-button-text p-button-rounded"
                  @click="viewEventDetails(data)"
                  v-tooltip.top="'View Details'"
                />
                <Button
                  icon="pi pi-share-alt"
                  class="p-button-sm p-button-text p-button-rounded"
                  @click="shareEvent(data)"
                  v-tooltip.top="'Share Event'"
                />
                <Button
                  v-if="data.severity === 'HIGH' || data.status === 'FAILED'"
                  icon="pi pi-flag"
                  class="p-button-sm p-button-text p-button-rounded p-button-danger"
                  @click="flagEvent(data)"
                  v-tooltip.top="'Flag for Review'"
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
            <div class="text-center py-8">
              <ProgressSpinner class="w-12 h-12" />
              <p class="text-gray-600 mt-4">Loading audit trail...</p>
            </div>
          </template>
        </DataTable>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between">
        <div class="text-sm text-gray-500">
          <i class="pi pi-info-circle mr-1"></i>
          Audit logs are retained for 365 days
        </div>
        <div class="flex gap-3">
          <Button
            label="Generate Report"
            icon="pi pi-file-pdf"
            class="p-button-outlined"
            @click="generateReport"
          />
          <Button
            label="Close"
            icon="pi pi-times"
            class="p-button-outlined"
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
import { ref, computed, watch, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';

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

// State
const dialogVisible = ref(props.visible);
const selectedEvents = ref([]);
const showAdvancedFilters = ref(false);
const showBulkActionsMenu = ref(false);
const loading = ref(false);

// Filters
const filters = ref({
  search: '',
  eventType: null,
  severity: null,
  dateRange: '7d',
  userId: null,
  resource: null,
  ipAddress: '',
});

// Mock audit log data
const auditLogs = ref([
  {
    id: '1',
    eventType: 'ROLE_ASSIGNED',
    action: 'Role Assignment',
    description: 'FUND_MANAGER role assigned to user',
    severity: 'MEDIUM',
    status: 'SUCCESS',
    resource: 'USER',
    targetId: 'user-123',
    user: {
      id: 'admin-1',
      name: 'Admin User',
      email: 'admin@company.com',
      role: 'SUPER_ADMIN',
      avatar: null
    },
    metadata: {
      ipAddress: '192.168.1.100',
      location: 'New York, US',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    },
    details: 'User promoted from INVESTOR to FUND_MANAGER role',
    timestamp: new Date('2024-01-20T14:30:00Z')
  },
  {
    id: '2',
    eventType: 'PERMISSION_DENIED',
    action: 'Permission Denied',
    description: 'Attempted access to restricted resource',
    severity: 'HIGH',
    status: 'FAILED',
    resource: 'SYSTEM',
    targetId: 'config-settings',
    user: {
      id: 'user-456',
      name: 'John Smith',
      email: 'john@company.com',
      role: 'ANALYST',
      avatar: null
    },
    metadata: {
      ipAddress: '10.0.0.50',
      location: 'London, UK',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
    },
    details: 'User attempted to access system configuration without proper permissions',
    timestamp: new Date('2024-01-20T14:25:00Z')
  },
  {
    id: '3',
    eventType: 'LOGIN_SUCCESS',
    action: 'Successful Login',
    description: 'User logged in successfully',
    severity: 'LOW',
    status: 'SUCCESS',
    resource: null,
    targetId: null,
    user: {
      id: 'user-789',
      name: 'Sarah Johnson',
      email: 'sarah@company.com',
      role: 'INVESTOR',
      avatar: null
    },
    metadata: {
      ipAddress: '203.0.113.45',
      location: 'Sydney, AU',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
    },
    details: 'Multi-factor authentication completed successfully',
    timestamp: new Date('2024-01-20T14:20:00Z')
  },
  {
    id: '4',
    eventType: 'PERMISSION_CHANGED',
    action: 'Permission Modified',
    description: 'Role permissions updated',
    severity: 'MEDIUM',
    status: 'SUCCESS',
    resource: 'ROLE',
    targetId: 'role-compliance',
    user: {
      id: 'admin-2',
      name: 'System Admin',
      email: 'sysadmin@company.com',
      role: 'SUPER_ADMIN',
      avatar: null
    },
    metadata: {
      ipAddress: '192.168.1.101',
      location: 'San Francisco, US',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    },
    details: 'Added DOCUMENT:READ_CONFIDENTIAL permission to COMPLIANCE_OFFICER role',
    timestamp: new Date('2024-01-20T14:15:00Z')
  },
  {
    id: '5',
    eventType: 'SECURITY_VIOLATION',
    action: 'Security Violation',
    description: 'Multiple failed login attempts detected',
    severity: 'HIGH',
    status: 'FAILED',
    resource: 'AUTH',
    targetId: 'login-endpoint',
    user: {
      id: 'unknown',
      name: 'Unknown User',
      email: 'suspicious@external.com',
      role: 'UNKNOWN',
      avatar: null
    },
    metadata: {
      ipAddress: '185.220.101.42',
      location: 'Unknown Location',
      userAgent: 'curl/7.68.0'
    },
    details: '15 failed login attempts within 5 minutes - potential brute force attack',
    timestamp: new Date('2024-01-20T14:10:00Z')
  }
]);

// Filter options
const eventTypeOptions = [
  { label: 'Role Assignment', value: 'ROLE_ASSIGNED' },
  { label: 'Role Removal', value: 'ROLE_REMOVED' },
  { label: 'Permission Changed', value: 'PERMISSION_CHANGED' },
  { label: 'Permission Denied', value: 'PERMISSION_DENIED' },
  { label: 'Login Success', value: 'LOGIN_SUCCESS' },
  { label: 'Login Failed', value: 'LOGIN_FAILED' },
  { label: 'Security Violation', value: 'SECURITY_VIOLATION' },
  { label: 'User Created', value: 'USER_CREATED' },
  { label: 'User Updated', value: 'USER_UPDATED' },
  { label: 'User Deleted', value: 'USER_DELETED' },
];

const severityOptions = [
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'High', value: 'HIGH' },
  { label: 'Critical', value: 'CRITICAL' },
];

const dateRangeOptions = [
  { label: 'Last hour', value: '1h' },
  { label: 'Last 24 hours', value: '24h' },
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
];

const userOptions = ref([
  { label: 'Admin User', value: 'admin-1' },
  { label: 'System Admin', value: 'admin-2' },
  { label: 'John Smith', value: 'user-456' },
  { label: 'Sarah Johnson', value: 'user-789' },
]);

const resourceOptions = [
  { label: 'User', value: 'USER' },
  { label: 'Role', value: 'ROLE' },
  { label: 'Permission', value: 'PERMISSION' },
  { label: 'System', value: 'SYSTEM' },
  { label: 'Auth', value: 'AUTH' },
  { label: 'Fund', value: 'FUND' },
  { label: 'Investment', value: 'INVESTMENT' },
  { label: 'Document', value: 'DOCUMENT' },
];

// Computed properties
const filteredAuditLogs = computed(() => {
  let filtered = auditLogs.value;

  if (filters.value.search) {
    const search = filters.value.search.toLowerCase();
    filtered = filtered.filter(log =>
      log.action.toLowerCase().includes(search) ||
      log.description.toLowerCase().includes(search) ||
      log.user.name?.toLowerCase().includes(search) ||
      log.user.email?.toLowerCase().includes(search) ||
      log.details?.toLowerCase().includes(search)
    );
  }

  if (filters.value.eventType) {
    filtered = filtered.filter(log => log.eventType === filters.value.eventType);
  }

  if (filters.value.severity) {
    filtered = filtered.filter(log => log.severity === filters.value.severity);
  }

  if (filters.value.userId) {
    filtered = filtered.filter(log => log.user.id === filters.value.userId);
  }

  if (filters.value.resource) {
    filtered = filtered.filter(log => log.resource === filters.value.resource);
  }

  if (filters.value.ipAddress) {
    filtered = filtered.filter(log =>
      log.metadata?.ipAddress?.includes(filters.value.ipAddress)
    );
  }

  return filtered;
});

const totalEvents = computed(() => filteredAuditLogs.value.length);
const successfulEvents = computed(() => filteredAuditLogs.value.filter(log => log.status === 'SUCCESS').length);
const failedEvents = computed(() => filteredAuditLogs.value.filter(log => log.status === 'FAILED').length);
const securityEvents = computed(() => filteredAuditLogs.value.filter(log => log.severity === 'HIGH' || log.severity === 'CRITICAL').length);

// Watchers
watch(() => props.visible, (newValue) => {
  dialogVisible.value = newValue;
});

watch(dialogVisible, (newValue) => {
  emit('update:visible', newValue);
});

// Methods
const getEventIcon = (eventType: string) => {
  const icons = {
    'ROLE_ASSIGNED': 'pi pi-user-plus',
    'ROLE_REMOVED': 'pi pi-user-minus',
    'PERMISSION_CHANGED': 'pi pi-cog',
    'PERMISSION_DENIED': 'pi pi-ban',
    'LOGIN_SUCCESS': 'pi pi-sign-in',
    'LOGIN_FAILED': 'pi pi-times-circle',
    'SECURITY_VIOLATION': 'pi pi-exclamation-triangle',
    'USER_CREATED': 'pi pi-plus',
    'USER_UPDATED': 'pi pi-pencil',
    'USER_DELETED': 'pi pi-trash',
  };
  return icons[eventType] || 'pi pi-info-circle';
};

const getEventColor = (eventType: string) => {
  const colors = {
    'ROLE_ASSIGNED': '#10b981',
    'ROLE_REMOVED': '#f59e0b',
    'PERMISSION_CHANGED': '#3b82f6',
    'PERMISSION_DENIED': '#ef4444',
    'LOGIN_SUCCESS': '#10b981',
    'LOGIN_FAILED': '#ef4444',
    'SECURITY_VIOLATION': '#dc2626',
    'USER_CREATED': '#8b5cf6',
    'USER_UPDATED': '#06b6d4',
    'USER_DELETED': '#ef4444',
  };
  return colors[eventType] || '#6b7280';
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

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(date));
};

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date(date));
};

const getRelativeTime = (date: Date) => {
  const now = new Date();
  const diff = Math.floor((now.getTime() - new Date(date).getTime()) / 60000); // diff in minutes

  if (diff < 1) return 'Just now';
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
};

const resetFilters = () => {
  filters.value = {
    search: '',
    eventType: null,
    severity: null,
    dateRange: '7d',
    userId: null,
    resource: null,
    ipAddress: '',
  };
};

const onDialogShow = () => {
  loadAuditLogs();
};

const onDialogHide = () => {
  selectedEvents.value = [];
  showBulkActionsMenu.value = false;
};

const closeDialog = () => {
  dialogVisible.value = false;
};

const loadAuditLogs = async () => {
  loading.value = true;
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
  } finally {
    loading.value = false;
  }
};

const refreshAuditLogs = async () => {
  loading.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.add({
      severity: 'success',
      summary: 'Refreshed',
      detail: 'Audit logs have been refreshed.',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

const viewEventDetails = (event: any) => {
  toast.add({
    severity: 'info',
    summary: 'Event Details',
    detail: `Viewing details for: ${event.action}`,
    life: 3000
  });
};

const shareEvent = (event: any) => {
  toast.add({
    severity: 'info',
    summary: 'Event Shared',
    detail: `Event details copied to clipboard.`,
    life: 3000
  });
};

const flagEvent = (event: any) => {
  toast.add({
    severity: 'info',
    summary: 'Event Flagged',
    detail: `Event has been flagged for review.`,
    life: 3000
  });
};

const exportAuditLogs = () => {
  toast.add({
    severity: 'info',
    summary: 'Export Started',
    detail: 'Audit logs export will be downloaded shortly.',
    life: 3000
  });
};

const exportSelectedEvents = () => {
  toast.add({
    severity: 'info',
    summary: 'Export Started',
    detail: `Exporting ${selectedEvents.value.length} selected events.`,
    life: 3000
  });
  selectedEvents.value = [];
  showBulkActionsMenu.value = false;
};

const flagSelectedEvents = () => {
  toast.add({
    severity: 'info',
    summary: 'Events Flagged',
    detail: `${selectedEvents.value.length} events have been flagged for review.`,
    life: 3000
  });
  selectedEvents.value = [];
  showBulkActionsMenu.value = false;
};

const markAsReviewed = () => {
  toast.add({
    severity: 'success',
    summary: 'Events Reviewed',
    detail: `${selectedEvents.value.length} events marked as reviewed.`,
    life: 3000
  });
  selectedEvents.value = [];
  showBulkActionsMenu.value = false;
};

const generateReport = () => {
  toast.add({
    severity: 'info',
    summary: 'Report Generation',
    detail: 'Comprehensive audit report will be generated.',
    life: 3000
  });
};

// Lifecycle
onMounted(() => {
  if (props.visible) {
    loadAuditLogs();
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

/* Animation for severity indicators */
.audit-datatable :deep(.p-tag.p-tag-danger) {
  animation: alertPulse 2s infinite;
}

@keyframes alertPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}
</style>