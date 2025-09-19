<template>
  <div class="system-analytics-panel">
    <!-- Panel Header -->
    <div class="panel-header mb-6 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-xl font-semibold text-gray-900 mb-1">System Analytics</h2>
          <p class="text-sm text-gray-600">Monitor RBAC system performance, usage patterns, and security metrics</p>
        </div>
        <div class="flex gap-3">
          <Dropdown
            v-model="selectedTimeRange"
            :options="timeRangeOptions"
            optionLabel="label"
            optionValue="value"
            class="time-range-dropdown"
          />
          <Button
            label="Export Report"
            icon="pi pi-download"
            class="p-button-outlined"
            @click="exportReport"
          />
          <Button
            label="Refresh"
            icon="pi pi-refresh"
            class="p-button-outlined"
            @click="refreshData"
            :loading="loading"
          />
        </div>
      </div>
    </div>

    <!-- Key Metrics Cards -->
    <div class="metrics-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <Card class="metric-card">
        <template #content>
          <div class="metric-content p-6">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-3xl font-bold text-blue-600">{{ totalUsers }}</div>
                <div class="text-sm text-gray-600 mt-1">Total Users</div>
                <div class="flex items-center mt-2">
                  <i class="pi pi-arrow-up text-green-500 text-sm mr-1"></i>
                  <span class="text-green-500 text-sm font-medium">+12%</span>
                  <span class="text-gray-500 text-sm ml-1">this month</span>
                </div>
              </div>
              <div class="metric-icon w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <i class="pi pi-users text-blue-600 text-2xl"></i>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <Card class="metric-card">
        <template #content>
          <div class="metric-content p-6">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-3xl font-bold text-green-600">{{ activeRoles }}</div>
                <div class="text-sm text-gray-600 mt-1">Active Roles</div>
                <div class="flex items-center mt-2">
                  <i class="pi pi-minus text-gray-500 text-sm mr-1"></i>
                  <span class="text-gray-500 text-sm font-medium">No change</span>
                </div>
              </div>
              <div class="metric-icon w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <i class="pi pi-shield text-green-600 text-2xl"></i>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <Card class="metric-card">
        <template #content>
          <div class="metric-content p-6">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-3xl font-bold text-purple-600">{{ totalPermissions }}</div>
                <div class="text-sm text-gray-600 mt-1">Total Permissions</div>
                <div class="flex items-center mt-2">
                  <i class="pi pi-arrow-up text-green-500 text-sm mr-1"></i>
                  <span class="text-green-500 text-sm font-medium">+5%</span>
                  <span class="text-gray-500 text-sm ml-1">this week</span>
                </div>
              </div>
              <div class="metric-icon w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <i class="pi pi-key text-purple-600 text-2xl"></i>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <Card class="metric-card">
        <template #content>
          <div class="metric-content p-6">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-3xl font-bold text-orange-600">{{ securityEvents }}</div>
                <div class="text-sm text-gray-600 mt-1">Security Events</div>
                <div class="flex items-center mt-2">
                  <i class="pi pi-arrow-down text-green-500 text-sm mr-1"></i>
                  <span class="text-green-500 text-sm font-medium">-8%</span>
                  <span class="text-gray-500 text-sm ml-1">this week</span>
                </div>
              </div>
              <div class="metric-icon w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                <i class="pi pi-exclamation-triangle text-orange-600 text-2xl"></i>
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Charts Section -->
    <div class="charts-section grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- User Registration Trend -->
      <Card class="chart-card">
        <template #header>
          <div class="chart-header p-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <i class="pi pi-chart-line text-blue-600"></i>
              User Registration Trend
            </h3>
            <p class="text-sm text-gray-600 mt-1">New user registrations over time</p>
          </div>
        </template>
        <template #content>
          <div class="chart-content p-4">
            <div class="mock-chart bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg p-8 text-center">
              <i class="pi pi-chart-line text-blue-600 text-4xl mb-4"></i>
              <p class="text-gray-700">Line Chart: User Registration Trend</p>
              <p class="text-sm text-gray-500 mt-2">{{ selectedTimeRange }} data visualization</p>
            </div>
          </div>
        </template>
      </Card>

      <!-- Role Distribution -->
      <Card class="chart-card">
        <template #header>
          <div class="chart-header p-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <i class="pi pi-chart-pie text-green-600"></i>
              Role Distribution
            </h3>
            <p class="text-sm text-gray-600 mt-1">Distribution of users across roles</p>
          </div>
        </template>
        <template #content>
          <div class="chart-content p-4">
            <div class="role-distribution">
              <div
                v-for="role in roleDistribution"
                :key="role.name"
                class="role-item flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="role-color w-4 h-4 rounded-full"
                    :style="{ backgroundColor: role.color }"
                  ></div>
                  <div>
                    <div class="font-medium text-gray-900">{{ role.name }}</div>
                    <div class="text-sm text-gray-600">{{ role.count }} users</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="font-medium text-gray-900">{{ role.percentage }}%</div>
                  <div class="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      class="h-2 rounded-full"
                      :style="{ width: `${role.percentage}%`, backgroundColor: role.color }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Security and Activity Monitoring -->
    <div class="monitoring-section grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- Recent Activities -->
      <Card class="activity-card lg:col-span-2">
        <template #header>
          <div class="chart-header p-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <i class="pi pi-history text-indigo-600"></i>
              Recent Activities
            </h3>
            <p class="text-sm text-gray-600 mt-1">Latest role and permission changes</p>
          </div>
        </template>
        <template #content>
          <div class="activity-content">
            <div class="activity-list max-h-80 overflow-y-auto custom-scrollbar">
              <div
                v-for="activity in recentActivities"
                :key="activity.id"
                class="activity-item flex items-start gap-4 p-4 border-b border-gray-100 hover:bg-gray-50"
              >
                <div
                  class="activity-icon w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  :class="getActivityIconClass(activity.type)"
                >
                  <i :class="getActivityIcon(activity.type)" class="text-white"></i>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-gray-900">{{ activity.title }}</div>
                  <div class="text-sm text-gray-600 mt-1">{{ activity.description }}</div>
                  <div class="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>{{ activity.user }}</span>
                    <span>{{ formatTime(activity.timestamp) }}</span>
                    <Tag
                      :value="activity.type"
                      :severity="getActivitySeverity(activity.type)"
                      class="text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- System Health -->
      <Card class="health-card">
        <template #header>
          <div class="chart-header p-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <i class="pi pi-heart text-red-600"></i>
              System Health
            </h3>
            <p class="text-sm text-gray-600 mt-1">Current system status</p>
          </div>
        </template>
        <template #content>
          <div class="health-content p-4">
            <div class="space-y-4">
              <div
                v-for="metric in systemHealth"
                :key="metric.name"
                class="health-metric"
              >
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-medium text-gray-700">{{ metric.name }}</span>
                  <span class="text-sm font-medium" :class="getHealthColor(metric.status)">
                    {{ metric.value }}{{ metric.unit }}
                  </span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div
                    class="h-2 rounded-full transition-all duration-300"
                    :style="{
                      width: `${metric.percentage}%`,
                      backgroundColor: getHealthBarColor(metric.status)
                    }"
                  ></div>
                </div>
                <div class="flex items-center justify-between mt-1">
                  <span class="text-xs text-gray-500">{{ metric.label }}</span>
                  <Tag
                    :value="metric.status"
                    :severity="getHealthSeverity(metric.status)"
                    class="text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Security Insights -->
    <div class="security-insights">
      <Card class="insights-card">
        <template #header>
          <div class="chart-header p-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <i class="pi pi-shield text-purple-600"></i>
              Security Insights & Recommendations
            </h3>
            <p class="text-sm text-gray-600 mt-1">AI-powered security analysis and recommendations</p>
          </div>
        </template>
        <template #content>
          <div class="insights-content p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div
                v-for="insight in securityInsights"
                :key="insight.id"
                class="insight-item p-4 rounded-lg border-l-4"
                :class="getInsightClass(insight.severity)"
              >
                <div class="flex items-start gap-3">
                  <i :class="insight.icon" class="text-lg mt-1" :style="{ color: insight.color }"></i>
                  <div class="flex-1">
                    <h4 class="font-semibold text-gray-900 mb-2">{{ insight.title }}</h4>
                    <p class="text-sm text-gray-600 mb-3">{{ insight.description }}</p>
                    <div class="flex items-center justify-between">
                      <Tag
                        :value="insight.severity"
                        :severity="getInsightSeverity(insight.severity)"
                        class="text-xs"
                      />
                      <Button
                        label="View Details"
                        class="p-button-text p-button-sm"
                        @click="viewInsightDetails(insight)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';

// Composables
const toast = useToast();

// State
const loading = ref(false);
const selectedTimeRange = ref('7d');

// Mock data
const totalUsers = ref(178);
const activeRoles = ref(6);
const totalPermissions = ref(48);
const securityEvents = ref(23);

const timeRangeOptions = [
  { label: 'Last 24 hours', value: '24h' },
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
  { label: 'Last year', value: '1y' },
];

const roleDistribution = ref([
  { name: 'INVESTOR', count: 145, percentage: 81, color: '#10b981' },
  { name: 'ANALYST', count: 12, percentage: 7, color: '#06b6d4' },
  { name: 'FUND_MANAGER', count: 8, percentage: 4, color: '#8b5cf6' },
  { name: 'VIEWER', count: 8, percentage: 4, color: '#6b7280' },
  { name: 'COMPLIANCE_OFFICER', count: 3, percentage: 2, color: '#f59e0b' },
  { name: 'SUPER_ADMIN', count: 2, percentage: 1, color: '#ef4444' },
]);

const recentActivities = ref([
  {
    id: '1',
    type: 'ROLE_ASSIGNED',
    title: 'Role Assignment',
    description: 'FUND_MANAGER role assigned to John Smith',
    user: 'Admin User',
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
  },
  {
    id: '2',
    type: 'PERMISSION_CHANGED',
    title: 'Permission Modified',
    description: 'DOCUMENT:DELETE permission added to COMPLIANCE_OFFICER role',
    user: 'System Admin',
    timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
  },
  {
    id: '3',
    type: 'SECURITY_EVENT',
    title: 'Security Alert',
    description: 'Failed permission access attempt detected',
    user: 'Security System',
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
  },
  {
    id: '4',
    type: 'USER_CREATED',
    title: 'New User Created',
    description: 'New investor account created for Sarah Johnson',
    user: 'Registration System',
    timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
  },
  {
    id: '5',
    type: 'ROLE_REMOVED',
    title: 'Role Revoked',
    description: 'ANALYST role removed from Michael Brown',
    user: 'HR Admin',
    timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
  },
]);

const systemHealth = ref([
  {
    name: 'Authentication Success Rate',
    value: 99.8,
    unit: '%',
    percentage: 99.8,
    status: 'HEALTHY',
    label: 'Excellent'
  },
  {
    name: 'Permission Check Performance',
    value: 12,
    unit: 'ms',
    percentage: 95,
    status: 'HEALTHY',
    label: 'Very Good'
  },
  {
    name: 'Failed Login Attempts',
    value: 2.1,
    unit: '%',
    percentage: 21,
    status: 'WARNING',
    label: 'Monitor'
  },
  {
    name: 'System Uptime',
    value: 99.9,
    unit: '%',
    percentage: 99.9,
    status: 'HEALTHY',
    label: 'Excellent'
  },
]);

const securityInsights = ref([
  {
    id: '1',
    severity: 'HIGH',
    title: 'Excessive Admin Permissions',
    description: 'Multiple users have SUPER_ADMIN role. Consider role segregation for better security.',
    icon: 'pi pi-exclamation-triangle',
    color: '#ef4444'
  },
  {
    id: '2',
    severity: 'MEDIUM',
    title: 'Inactive User Accounts',
    description: '8 user accounts have been inactive for over 90 days. Review and deactivate if necessary.',
    icon: 'pi pi-user-minus',
    color: '#f59e0b'
  },
  {
    id: '3',
    severity: 'LOW',
    title: 'Permission Optimization',
    description: 'Some roles have overlapping permissions. Consider consolidating for better management.',
    icon: 'pi pi-cog',
    color: '#10b981'
  },
  {
    id: '4',
    severity: 'MEDIUM',
    title: 'Password Policy Compliance',
    description: '12% of users haven\'t updated their passwords in the last 6 months.',
    icon: 'pi pi-key',
    color: '#f59e0b'
  },
  {
    id: '5',
    severity: 'HIGH',
    title: 'Critical Permission Access',
    description: 'SYSTEM:DELETE permission is assigned to 3 different roles. Review necessity.',
    icon: 'pi pi-shield',
    color: '#ef4444'
  },
  {
    id: '6',
    severity: 'LOW',
    title: 'Role Assignment Patterns',
    description: 'Normal user role assignment patterns detected. No anomalies found.',
    icon: 'pi pi-check-circle',
    color: '#10b981'
  },
]);

// Methods
const getActivityIconClass = (type: string) => {
  const classes = {
    'ROLE_ASSIGNED': 'bg-blue-500',
    'PERMISSION_CHANGED': 'bg-green-500',
    'SECURITY_EVENT': 'bg-red-500',
    'USER_CREATED': 'bg-purple-500',
    'ROLE_REMOVED': 'bg-orange-500',
  };
  return classes[type] || 'bg-gray-500';
};

const getActivityIcon = (type: string) => {
  const icons = {
    'ROLE_ASSIGNED': 'pi pi-user-plus',
    'PERMISSION_CHANGED': 'pi pi-cog',
    'SECURITY_EVENT': 'pi pi-exclamation-triangle',
    'USER_CREATED': 'pi pi-plus',
    'ROLE_REMOVED': 'pi pi-user-minus',
  };
  return icons[type] || 'pi pi-info-circle';
};

const getActivitySeverity = (type: string) => {
  const severities = {
    'ROLE_ASSIGNED': 'info',
    'PERMISSION_CHANGED': 'success',
    'SECURITY_EVENT': 'danger',
    'USER_CREATED': 'info',
    'ROLE_REMOVED': 'warning',
  };
  return severities[type] || 'info';
};

const getHealthColor = (status: string) => {
  switch (status) {
    case 'HEALTHY': return 'text-green-600';
    case 'WARNING': return 'text-yellow-600';
    case 'CRITICAL': return 'text-red-600';
    default: return 'text-gray-600';
  }
};

const getHealthBarColor = (status: string) => {
  switch (status) {
    case 'HEALTHY': return '#10b981';
    case 'WARNING': return '#f59e0b';
    case 'CRITICAL': return '#ef4444';
    default: return '#6b7280';
  }
};

const getHealthSeverity = (status: string) => {
  switch (status) {
    case 'HEALTHY': return 'success';
    case 'WARNING': return 'warning';
    case 'CRITICAL': return 'danger';
    default: return 'info';
  }
};

const getInsightClass = (severity: string) => {
  switch (severity) {
    case 'HIGH': return 'bg-red-50 border-red-400';
    case 'MEDIUM': return 'bg-yellow-50 border-yellow-400';
    case 'LOW': return 'bg-green-50 border-green-400';
    default: return 'bg-gray-50 border-gray-400';
  }
};

const getInsightSeverity = (severity: string) => {
  switch (severity) {
    case 'HIGH': return 'danger';
    case 'MEDIUM': return 'warning';
    case 'LOW': return 'success';
    default: return 'info';
  }
};

const formatTime = (date: Date) => {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 60000); // diff in minutes

  if (diff < 1) return 'Just now';
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
};

const viewInsightDetails = (insight: any) => {
  toast.add({
    severity: 'info',
    summary: 'Insight Details',
    detail: `Viewing details for: ${insight.title}`,
    life: 3000
  });
};

const exportReport = () => {
  toast.add({
    severity: 'info',
    summary: 'Export Started',
    detail: 'Analytics report export will be downloaded shortly.',
    life: 3000
  });
};

const refreshData = async () => {
  loading.value = true;
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.add({
      severity: 'success',
      summary: 'Data Refreshed',
      detail: 'Analytics data has been updated.',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

// Lifecycle
onMounted(() => {
  // Initialize analytics data
});
</script>

<style scoped>
.system-analytics-panel {
  @apply space-y-6;
}

.panel-header {
  @apply transition-all duration-200;
}

.metric-card {
  @apply transition-all duration-200 hover:shadow-lg;
}

.metric-card :deep(.p-card-body) {
  @apply p-0;
}

.metric-icon {
  @apply shadow-sm;
}

.chart-card :deep(.p-card-body) {
  @apply p-0;
}

.activity-card :deep(.p-card-body) {
  @apply p-0;
}

.health-card :deep(.p-card-body) {
  @apply p-0;
}

.insights-card :deep(.p-card-body) {
  @apply p-0;
}

.mock-chart {
  @apply transition-all duration-200 hover:shadow-md;
}

.activity-item {
  @apply transition-all duration-200;
}

.activity-icon {
  @apply shadow-sm;
}

.health-metric {
  @apply transition-all duration-200;
}

.insight-item {
  @apply transition-all duration-200 hover:shadow-md;
}

.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f1f5f9;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  @apply bg-gray-100 rounded-full;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  @apply bg-gray-300 rounded-full hover:bg-gray-400;
}

/* Animation for metrics */
.metric-content {
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Pulse animation for security alerts */
.insight-item.bg-red-50 {
  animation: alertPulse 2s infinite;
}

@keyframes alertPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.9; }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .system-analytics-panel {
    @apply space-y-4;
  }

  .panel-header {
    @apply p-4;
  }

  .panel-header .flex {
    @apply flex-col gap-4 items-start;
  }

  .metrics-grid {
    @apply grid-cols-1 gap-4;
  }

  .charts-section {
    @apply grid-cols-1;
  }

  .monitoring-section {
    @apply grid-cols-1;
  }

  .insights-content .grid {
    @apply grid-cols-1;
  }

  .time-range-dropdown {
    @apply w-full;
  }
}

/* Print styles */
@media print {
  .system-analytics-panel {
    @apply text-sm;
  }

  .panel-header .flex > div:last-child,
  .chart-header .flex > div:last-child {
    @apply hidden;
  }

  .mock-chart {
    @apply bg-gray-100;
  }

  .activity-list {
    @apply max-h-none overflow-visible;
  }
}
</style>