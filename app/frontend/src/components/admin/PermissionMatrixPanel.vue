<template>
  <div class="permission-matrix-panel">

    <!-- Matrix Controls -->
    <div class="matrix-controls mb-6 p-4 bg-gray-50 rounded-lg border">
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Search Permissions</label>
          <InputText
            v-model="searchTerm"
            placeholder="Filter permissions..."
            class="w-full"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Resource Filter</label>
          <Dropdown
            v-model="selectedResource"
            :options="resourceOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="All Resources"
            class="w-full"
            showClear
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Role Filter</label>
          <MultiSelect
            v-model="selectedRoles"
            :options="roleOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="All Roles"
            class="w-full"
            display="chip"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">View Mode</label>
          <Dropdown
            v-model="viewMode"
            :options="viewModeOptions"
            optionLabel="label"
            optionValue="value"
            class="w-full"
          />
        </div>
        <div class="flex items-end">
          <Button
            label="Reset Filters"
            icon="pi pi-filter-slash"
            class="p-button-outlined w-full"
            @click="resetFilters"
          />
        </div>
      </div>
    </div>

    <!-- Matrix Legend -->
    <div class="matrix-legend mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
      <div class="flex items-center gap-6 text-sm">
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 bg-green-500 rounded"></div>
          <span>Granted Permission</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 bg-red-500 rounded"></div>
          <span>Denied Permission</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 bg-yellow-500 rounded"></div>
          <span>Conditional Permission</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 bg-gray-300 rounded"></div>
          <span>Not Assigned</span>
        </div>
      </div>
    </div>

    <!-- Matrix Table -->
    <div class="matrix-table-container bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="matrix-table-wrapper overflow-auto max-h-96 custom-scrollbar">
        <table class="matrix-table w-full">
          <thead class="bg-gray-50 sticky top-0 z-10">
            <tr>
              <!-- Permission column header -->
              <th class="permission-header text-left p-4 border-b border-gray-200 min-w-64">
                <div class="flex items-center gap-2">
                  <i class="pi pi-shield text-gray-600"></i>
                  <span class="font-semibold text-gray-900">Permissions</span>
                  <span class="text-xs text-gray-500">({{ filteredPermissions.length }})</span>
                </div>
              </th>
              <!-- Role column headers -->
              <th
                v-for="role in filteredRoles"
                :key="role.id"
                class="role-header text-center p-4 border-b border-gray-200 min-w-24"
                :style="{ backgroundColor: getRoleColor(role.name, 0.1) }"
              >
                <div class="flex flex-col items-center gap-2">
                  <div
                    class="role-icon w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                    :style="{ backgroundColor: getRoleColor(role.name) }"
                  >
                    {{ getRoleInitials(role.name) }}
                  </div>
                  <div class="text-xs font-medium text-gray-900 writing-mode-vertical transform -rotate-45 origin-center">
                    {{ role.name }}
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ role.userCount || 0 }}
                  </div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <template
              v-for="(group, groupIndex) in groupedPermissions"
              :key="group.resource"
            >
              <tr class="resource-group-row">
                <!-- Resource Group Header -->
                <td
                  :colspan="filteredRoles.length + 1"
                  class="resource-group-header p-3 bg-gray-50 border-b border-gray-200"
                >
                  <div class="flex items-center gap-3">
                    <i :class="getResourceIcon(group.resource)" class="text-lg" :style="{ color: getResourceColor(group.resource) }"></i>
                    <div>
                      <h4 class="font-semibold text-gray-900">{{ group.resource }}</h4>
                      <p class="text-sm text-gray-600">{{ group.permissions.length }} permissions</p>
                    </div>
                    <Button
                      :icon="group.expanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
                      class="p-button-text p-button-sm p-button-rounded ml-auto"
                      @click="toggleResourceGroup(groupIndex)"
                    />
                  </div>
                </td>
              </tr>
              <tr
                v-for="permission in group.permissions"
                v-show="group.expanded"
                :key="permission.id"
                class="permission-row hover:bg-gray-50"
              >
                <!-- Permission cell -->
                <td class="permission-cell p-4 border-b border-gray-100">
                  <div class="flex items-start gap-3">
                    <div
                      class="permission-badge w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      :style="{ backgroundColor: getPermissionColor(permission.criticality) }"
                    >
                      {{ permission.criticality.charAt(0) }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="font-medium text-gray-900">{{ permission.action }}</div>
                      <div class="text-sm text-gray-600">{{ permission.description }}</div>
                      <div class="flex items-center gap-2 mt-1">
                        <Tag
                          :value="permission.criticality"
                          :severity="getCriticalitySeverity(permission.criticality)"
                          class="text-xs"
                        />
                        <span v-if="permission.requiresApproval" class="text-xs text-orange-600 font-medium">
                          Approval Required
                        </span>
                      </div>
                    </div>
                  </div>
                </td>
                <!-- Role permission cells -->
                <td
                  v-for="role in filteredRoles"
                  :key="`${permission.id}-${role.id}`"
                  class="role-permission-cell text-center p-4 border-b border-gray-100 cursor-pointer"
                  @click="togglePermission(role.id, permission.id)"
                >
                  <div class="permission-indicator-wrapper">
                    <div
                      class="permission-indicator w-6 h-6 rounded-full border-2 mx-auto transition-all duration-200 hover:scale-110"
                      :class="getPermissionIndicatorClass(role.id, permission.id)"
                      :title="getPermissionTooltip(role.id, permission.id)"
                    >
                      <i
                        v-if="hasPermission(role.id, permission.id)"
                        class="pi pi-check text-white text-xs"
                      ></i>
                      <i
                        v-else-if="isConditionalPermission(role.id, permission.id)"
                        class="pi pi-question text-white text-xs"
                      ></i>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Matrix Summary -->
      <div class="matrix-summary p-4 border-t border-gray-200 bg-gray-50">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div class="summary-stat">
            <div class="text-2xl font-bold text-blue-600">{{ totalPermissions }}</div>
            <div class="text-sm text-gray-600">Total Permissions</div>
          </div>
          <div class="summary-stat">
            <div class="text-2xl font-bold text-green-600">{{ grantedPermissions }}</div>
            <div class="text-sm text-gray-600">Granted</div>
          </div>
          <div class="summary-stat">
            <div class="text-2xl font-bold text-yellow-600">{{ conditionalPermissions }}</div>
            <div class="text-sm text-gray-600">Conditional</div>
          </div>
          <div class="summary-stat">
            <div class="text-2xl font-bold text-gray-600">{{ unassignedPermissions }}</div>
            <div class="text-sm text-gray-600">Unassigned</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Matrix Analysis Cards -->
    <div class="matrix-analysis mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Role Coverage Analysis -->
      <Card class="analysis-card">
        <template #header>
          <div class="p-4 border-b border-gray-200">
            <h4 class="font-semibold text-gray-900 flex items-center gap-2">
              <i class="pi pi-chart-pie text-blue-600"></i>
              Role Coverage
            </h4>
          </div>
        </template>
        <template #content>
          <div class="space-y-3">
            <div
              v-for="role in filteredRoles"
              :key="role.id"
              class="role-coverage-item flex items-center justify-between"
            >
              <div class="flex items-center gap-2">
                <div
                  class="w-4 h-4 rounded"
                  :style="{ backgroundColor: getRoleColor(role.name) }"
                ></div>
                <span class="text-sm font-medium text-gray-900">{{ role.name }}</span>
              </div>
              <div class="text-sm text-gray-600">
                {{ getRoleCoveragePercentage(role.id) }}%
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Permission Hotspots -->
      <Card class="analysis-card">
        <template #header>
          <div class="p-4 border-b border-gray-200">
            <h4 class="font-semibold text-gray-900 flex items-center gap-2">
              <i class="pi pi-exclamation-triangle text-orange-600"></i>
              High-Risk Permissions
            </h4>
          </div>
        </template>
        <template #content>
          <div class="space-y-3">
            <div
              v-for="permission in criticalPermissions"
              :key="permission.id"
              class="critical-permission-item p-2 bg-red-50 rounded border border-red-200"
            >
              <div class="font-medium text-sm text-gray-900">{{ permission.action }}</div>
              <div class="text-xs text-gray-600">{{ permission.resource }}</div>
              <div class="text-xs text-red-600 mt-1">
                Assigned to {{ getPermissionRoleCount(permission.id) }} role(s)
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Recommendations -->
      <Card class="analysis-card">
        <template #header>
          <div class="p-4 border-b border-gray-200">
            <h4 class="font-semibold text-gray-900 flex items-center gap-2">
              <i class="pi pi-lightbulb text-yellow-600"></i>
              Recommendations
            </h4>
          </div>
        </template>
        <template #content>
          <div class="space-y-3">
            <div
              v-for="recommendation in recommendations"
              :key="recommendation.id"
              class="recommendation-item p-3 bg-yellow-50 rounded border border-yellow-200"
            >
              <div class="flex items-start gap-2">
                <i :class="recommendation.icon" class="text-yellow-600 mt-1"></i>
                <div>
                  <div class="font-medium text-sm text-gray-900">{{ recommendation.title }}</div>
                  <div class="text-xs text-gray-600 mt-1">{{ recommendation.description }}</div>
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
const searchTerm = ref('');
const selectedResource = ref(null);
const selectedRoles = ref([]);
const viewMode = ref('FULL');

// Mock data
const allPermissions = ref([
  // User Management
  { id: '1', resource: 'USER', action: 'CREATE', description: 'Create new users', criticality: 'HIGH', requiresApproval: true },
  { id: '2', resource: 'USER', action: 'READ', description: 'View user information', criticality: 'LOW', requiresApproval: false },
  { id: '3', resource: 'USER', action: 'UPDATE', description: 'Update user details', criticality: 'MEDIUM', requiresApproval: false },
  { id: '4', resource: 'USER', action: 'DELETE', description: 'Delete or deactivate users', criticality: 'HIGH', requiresApproval: true },
  { id: '5', resource: 'USER', action: 'MANAGE_ROLES', description: 'Assign/revoke user roles', criticality: 'HIGH', requiresApproval: true },

  // Fund Management
  { id: '6', resource: 'FUND', action: 'CREATE', description: 'Create new funds', criticality: 'HIGH', requiresApproval: true },
  { id: '7', resource: 'FUND', action: 'READ', description: 'View fund information', criticality: 'LOW', requiresApproval: false },
  { id: '8', resource: 'FUND', action: 'UPDATE', description: 'Update fund details', criticality: 'MEDIUM', requiresApproval: false },
  { id: '9', resource: 'FUND', action: 'DELETE', description: 'Delete funds', criticality: 'HIGH', requiresApproval: true },

  // Investment Management
  { id: '10', resource: 'INVESTMENT', action: 'CREATE', description: 'Create new investments', criticality: 'HIGH', requiresApproval: true },
  { id: '11', resource: 'INVESTMENT', action: 'READ', description: 'View all investments', criticality: 'MEDIUM', requiresApproval: false },
  { id: '12', resource: 'INVESTMENT', action: 'UPDATE', description: 'Update investment details', criticality: 'MEDIUM', requiresApproval: false },
  { id: '13', resource: 'INVESTMENT', action: 'READ_OWN', description: 'View own investments only', criticality: 'LOW', requiresApproval: false },

  // Document Management
  { id: '14', resource: 'DOCUMENT', action: 'CREATE', description: 'Upload documents', criticality: 'MEDIUM', requiresApproval: false },
  { id: '15', resource: 'DOCUMENT', action: 'READ', description: 'View documents', criticality: 'LOW', requiresApproval: false },
  { id: '16', resource: 'DOCUMENT', action: 'DELETE', description: 'Delete documents', criticality: 'HIGH', requiresApproval: true },

  // System & Audit
  { id: '17', resource: 'SYSTEM', action: 'CONFIGURE', description: 'Configure system settings', criticality: 'HIGH', requiresApproval: true },
  { id: '18', resource: 'AUDIT', action: 'READ', description: 'View audit logs', criticality: 'MEDIUM', requiresApproval: false },
]);

const allRoles = ref([
  { id: '1', name: 'SUPER_ADMIN', userCount: 2 },
  { id: '2', name: 'FUND_MANAGER', userCount: 8 },
  { id: '3', name: 'COMPLIANCE_OFFICER', userCount: 3 },
  { id: '4', name: 'ANALYST', userCount: 12 },
  { id: '5', name: 'INVESTOR', userCount: 145 },
  { id: '6', name: 'VIEWER', userCount: 8 },
]);

// Mock role-permission matrix
const rolePermissionMatrix = ref({
  '1': ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '14', '15', '16', '17', '18'], // SUPER_ADMIN
  '2': ['2', '6', '7', '8', '10', '11', '12', '14', '15'], // FUND_MANAGER
  '3': ['2', '7', '11', '15', '18'], // COMPLIANCE_OFFICER
  '4': ['2', '7', '11', '15'], // ANALYST
  '5': ['13', '15'], // INVESTOR
  '6': ['2', '7', '15'], // VIEWER
});

// Grouped permissions state
const groupedPermissionsState = ref([
  { resource: 'USER', expanded: true },
  { resource: 'FUND', expanded: true },
  { resource: 'INVESTMENT', expanded: true },
  { resource: 'DOCUMENT', expanded: true },
  { resource: 'SYSTEM', expanded: true },
  { resource: 'AUDIT', expanded: true },
]);

// Resource definitions
const resourceDefinitions = {
  'USER': { icon: 'pi pi-users', color: '#3b82f6' },
  'FUND': { icon: 'pi pi-briefcase', color: '#10b981' },
  'INVESTMENT': { icon: 'pi pi-chart-line', color: '#8b5cf6' },
  'DOCUMENT': { icon: 'pi pi-file', color: '#06b6d4' },
  'SYSTEM': { icon: 'pi pi-cog', color: '#6b7280' },
  'AUDIT': { icon: 'pi pi-history', color: '#ec4899' },
};

// Filter options
const resourceOptions = computed(() => {
  const resources = [...new Set(allPermissions.value.map(p => p.resource))];
  return resources.map(resource => ({ label: resource, value: resource }));
});

const roleOptions = computed(() => {
  return allRoles.value.map(role => ({ label: role.name, value: role.id }));
});

const viewModeOptions = [
  { label: 'Full Matrix', value: 'FULL' },
  { label: 'Granted Only', value: 'GRANTED' },
  { label: 'Critical Only', value: 'CRITICAL' },
  { label: 'Compact View', value: 'COMPACT' },
];

// Computed properties
const filteredPermissions = computed(() => {
  let filtered = allPermissions.value;

  if (searchTerm.value) {
    const search = searchTerm.value.toLowerCase();
    filtered = filtered.filter(permission =>
      permission.action.toLowerCase().includes(search) ||
      permission.description.toLowerCase().includes(search) ||
      permission.resource.toLowerCase().includes(search)
    );
  }

  if (selectedResource.value) {
    filtered = filtered.filter(permission => permission.resource === selectedResource.value);
  }

  if (viewMode.value === 'CRITICAL') {
    filtered = filtered.filter(permission => permission.criticality === 'HIGH');
  }

  return filtered;
});

const filteredRoles = computed(() => {
  if (selectedRoles.value.length === 0) {
    return allRoles.value;
  }
  return allRoles.value.filter(role => selectedRoles.value.includes(role.id));
});

const groupedPermissions = computed(() => {
  const groups: Record<string, any> = {};

  filteredPermissions.value.forEach(permission => {
    if (!groups[permission.resource]) {
      const groupState = groupedPermissionsState.value.find(g => g.resource === permission.resource);
      groups[permission.resource] = {
        resource: permission.resource,
        permissions: [],
        expanded: groupState?.expanded ?? true
      };
    }
    groups[permission.resource].permissions.push(permission);
  });

  return Object.values(groups);
});

const totalPermissions = computed(() => {
  return filteredPermissions.value.length * filteredRoles.value.length;
});

const grantedPermissions = computed(() => {
  let count = 0;
  filteredRoles.value.forEach(role => {
    filteredPermissions.value.forEach(permission => {
      if (hasPermission(role.id, permission.id)) count++;
    });
  });
  return count;
});

const conditionalPermissions = computed(() => {
  let count = 0;
  filteredRoles.value.forEach(role => {
    filteredPermissions.value.forEach(permission => {
      if (isConditionalPermission(role.id, permission.id)) count++;
    });
  });
  return count;
});

const unassignedPermissions = computed(() => {
  return totalPermissions.value - grantedPermissions.value - conditionalPermissions.value;
});

const criticalPermissions = computed(() => {
  return filteredPermissions.value.filter(p => p.criticality === 'HIGH').slice(0, 5);
});

const recommendations = computed(() => [
  {
    id: '1',
    icon: 'pi pi-exclamation-triangle',
    title: 'Review SUPER_ADMIN permissions',
    description: 'Consider limiting high-risk permissions for better security'
  },
  {
    id: '2',
    icon: 'pi pi-users',
    title: 'Analyst role optimization',
    description: 'Some permissions might be redundant for this role'
  },
  {
    id: '3',
    icon: 'pi pi-shield',
    title: 'Add approval workflows',
    description: 'High-risk permissions should require approval'
  },
]);

// Methods
const getRoleColor = (roleName: string, opacity = 1) => {
  const colors: Record<string, string> = {
    'SUPER_ADMIN': '#ef4444',
    'FUND_MANAGER': '#8b5cf6',
    'COMPLIANCE_OFFICER': '#f59e0b',
    'ANALYST': '#06b6d4',
    'INVESTOR': '#10b981',
    'VIEWER': '#6b7280',
  };
  const color = colors[roleName] || '#6366f1';
  if (opacity < 1) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color;
};

const getRoleInitials = (roleName: string) => {
  return roleName.split('_').map(word => word[0]).join('').toUpperCase();
};

const getResourceIcon = (resource: string) => {
  return resourceDefinitions[resource]?.icon || 'pi pi-question';
};

const getResourceColor = (resource: string) => {
  return resourceDefinitions[resource]?.color || '#6b7280';
};

const getPermissionColor = (criticality: string) => {
  switch (criticality) {
    case 'HIGH': return '#ef4444';
    case 'MEDIUM': return '#f59e0b';
    case 'LOW': return '#10b981';
    default: return '#6b7280';
  }
};

const getCriticalitySeverity = (criticality: string) => {
  switch (criticality) {
    case 'HIGH': return 'danger';
    case 'MEDIUM': return 'warning';
    case 'LOW': return 'success';
    default: return 'info';
  }
};

const hasPermission = (roleId: string, permissionId: string) => {
  return rolePermissionMatrix.value[roleId]?.includes(permissionId) || false;
};

const isConditionalPermission = (roleId: string, permissionId: string) => {
  // Mock conditional logic - in real app this would check specific conditions
  return false;
};

const getPermissionIndicatorClass = (roleId: string, permissionId: string) => {
  if (hasPermission(roleId, permissionId)) {
    return 'bg-green-500 border-green-600';
  } else if (isConditionalPermission(roleId, permissionId)) {
    return 'bg-yellow-500 border-yellow-600';
  } else {
    return 'bg-gray-300 border-gray-400';
  }
};

const getPermissionTooltip = (roleId: string, permissionId: string) => {
  const role = allRoles.value.find(r => r.id === roleId);
  const permission = allPermissions.value.find(p => p.id === permissionId);

  if (hasPermission(roleId, permissionId)) {
    return `${role?.name} has ${permission?.action} permission`;
  } else if (isConditionalPermission(roleId, permissionId)) {
    return `${role?.name} has conditional ${permission?.action} permission`;
  } else {
    return `${role?.name} does not have ${permission?.action} permission`;
  }
};

const togglePermission = (roleId: string, permissionId: string) => {
  if (!rolePermissionMatrix.value[roleId]) {
    rolePermissionMatrix.value[roleId] = [];
  }

  const permissions = rolePermissionMatrix.value[roleId];
  const index = permissions.indexOf(permissionId);

  if (index > -1) {
    permissions.splice(index, 1);
  } else {
    permissions.push(permissionId);
  }

  toast.add({
    severity: 'info',
    summary: 'Permission Updated',
    detail: `Permission ${hasPermission(roleId, permissionId) ? 'granted' : 'revoked'}`,
    life: 2000
  });
};

const toggleResourceGroup = (groupIndex: number) => {
  const group = groupedPermissions.value[groupIndex];
  if (group) {
    group.expanded = !group.expanded;
    // Update the state
    const stateGroup = groupedPermissionsState.value.find(g => g.resource === group.resource);
    if (stateGroup) {
      stateGroup.expanded = group.expanded;
    }
  }
};

const getRoleCoveragePercentage = (roleId: string) => {
  const totalPermissions = allPermissions.value.length;
  const assignedPermissions = rolePermissionMatrix.value[roleId]?.length || 0;
  return Math.round((assignedPermissions / totalPermissions) * 100);
};

const getPermissionRoleCount = (permissionId: string) => {
  let count = 0;
  Object.values(rolePermissionMatrix.value).forEach(permissions => {
    if (permissions.includes(permissionId)) count++;
  });
  return count;
};

const resetFilters = () => {
  searchTerm.value = '';
  selectedResource.value = null;
  selectedRoles.value = [];
  viewMode.value = 'FULL';
};

const exportMatrix = () => {
  toast.add({
    severity: 'info',
    summary: 'Export Started',
    detail: 'Permission matrix export will be downloaded shortly.',
    life: 3000
  });
};

const printMatrix = () => {
  window.print();
};

const refreshMatrix = async () => {
  loading.value = true;
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.add({
      severity: 'success',
      summary: 'Matrix Refreshed',
      detail: 'Permission matrix has been updated.',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

// Lifecycle
onMounted(() => {
  // Initialize matrix data
});
</script>

<style scoped>
.permission-matrix-panel {
  @apply space-y-6;
}

.panel-header {
  @apply transition-all duration-200;
}

.matrix-table-container {
  @apply transition-all duration-200;
}

.matrix-table {
  @apply border-collapse;
}

.permission-header {
  @apply sticky left-0 z-20 bg-gray-50 border-r border-gray-200;
}

.role-header {
  @apply border-r border-gray-200;
}

.resource-group-header {
  @apply sticky left-0 z-10 bg-gray-50;
}

.permission-cell {
  @apply sticky left-0 z-10 bg-white border-r border-gray-200;
}

.role-permission-cell {
  @apply border-r border-gray-200 hover:bg-gray-50;
}

.permission-indicator {
  @apply shadow-sm;
}

.permission-indicator:hover {
  @apply shadow-md;
}

.analysis-card :deep(.p-card-body) {
  @apply p-0;
}

.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f1f5f9;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  @apply bg-gray-100;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  @apply bg-gray-300 rounded hover:bg-gray-400;
}

/* Print styles */
@media print {
  .permission-matrix-panel {
    @apply text-xs;
  }

  .matrix-controls,
  .panel-header .flex > div:last-child {
    @apply hidden;
  }

  .matrix-table-wrapper {
    @apply max-h-none overflow-visible;
  }

  .matrix-analysis {
    @apply hidden;
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .permission-matrix-panel {
    @apply space-y-4;
  }

  .panel-header {
    @apply p-4;
  }

  .panel-header .flex {
    @apply flex-col gap-4 items-start;
  }

  .matrix-controls .grid {
    @apply grid-cols-1 gap-3;
  }

  .matrix-legend .flex {
    @apply flex-wrap gap-3;
  }

  .matrix-analysis {
    @apply grid-cols-1;
  }

  .role-header .text-xs {
    @apply transform-none rotate-0;
  }
}

/* Animation for permission toggle */
.permission-indicator {
  transition: all 0.2s ease-in-out;
}

.permission-indicator.bg-green-500 {
  animation: grantPulse 0.4s ease-in-out;
}

@keyframes grantPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}
</style>