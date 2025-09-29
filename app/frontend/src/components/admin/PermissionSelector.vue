<template>
  <div class="permission-selector space-y-4">
    <!-- Search and Controls -->
    <div class="selector-controls" v-if="searchable">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <InputText
            v-model="searchTerm"
            placeholder="Search permissions..."
            class="w-64"
            :readonly="readonly"
          >
            <template #prefix>
              <i class="pi pi-search text-gray-400"></i>
            </template>
          </InputText>
          <Dropdown
            v-if="!readonly"
            v-model="filterBy"
            :options="filterOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Filter by..."
            class="w-48"
          />
        </div>
        <div v-if="!readonly" class="flex items-center gap-2">
          <Button
            label="Select All Visible"
            icon="pi pi-check-square"
            class="p-button-outlined p-button-sm"
            @click="selectAllVisible"
          />
          <Button
            label="Clear Selection"
            icon="pi pi-times"
            class="p-button-outlined p-button-sm"
            @click="clearAllSelection"
          />
        </div>
      </div>
    </div>

    <!-- Permission Groups -->
    <div class="permission-groups space-y-4">
      <div
        v-for="group in filteredGroups"
        :key="group.resource"
        class="permission-group"
      >
        <!-- Group Header -->
        <div class="group-header flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div class="flex items-center gap-3">
            <Button
              :icon="group.expanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
              class="p-button-text p-button-sm"
              @click="toggleGroup(group.resource)"
            />
            <i :class="getResourceIcon(group.resource)" class="text-lg text-blue-600"></i>
            <div>
              <h5 class="font-semibold text-gray-900">{{ group.resource }}</h5>
              <p class="text-xs text-gray-600">{{ group.permissions.length }} permissions</p>
            </div>
            <div class="flex items-center gap-2">
              <Chip
                :label="`${group.assignedCount}/${group.permissions.length}`"
                class="text-xs"
                :class="getGroupChipClass(group.assignedCount, group.permissions.length)"
              />
              <Tag
                v-if="group.criticalCount > 0"
                :value="`${group.criticalCount} critical`"
                severity="danger"
                class="text-xs"
              />
            </div>
          </div>
          <div v-if="!readonly" class="flex items-center gap-2">
            <Button
              :label="group.allAssigned ? 'Revoke All' : 'Grant All'"
              :icon="group.allAssigned ? 'pi pi-times' : 'pi pi-check'"
              :class="group.allAssigned ? 'p-button-danger' : 'p-button-success'"
              class="p-button-outlined p-button-sm"
              @click="toggleGroupPermissions(group)"
            />
          </div>
        </div>

        <!-- Group Permissions -->
        <Transition name="expand">
          <div v-if="group.expanded" class="group-permissions mt-3">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div
                v-for="permission in group.permissions"
                :key="permission.id"
                class="permission-item"
                :class="[
                  'flex items-center justify-between p-3 rounded-lg border transition-all',
                  permission.assigned ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200',
                  readonly ? 'cursor-default' : 'cursor-pointer hover:shadow-sm',
                  permission.criticality === 'HIGH' ? 'border-l-4 border-l-red-500' : '',
                  permission.criticality === 'MEDIUM' ? 'border-l-4 border-l-yellow-500' : '',
                  permission.criticality === 'LOW' ? 'border-l-4 border-l-green-500' : ''
                ]"
                @click="!readonly && togglePermission(permission)"
              >
                <div class="flex items-center gap-3 flex-1">
                  <Checkbox
                    v-if="!readonly"
                    v-model="permission.assigned"
                    :binary="true"
                    @change="togglePermission(permission)"
                  />
                  <div class="permission-icon" v-else>
                    <i
                      :class="permission.assigned ? 'pi pi-check-circle text-green-600' : 'pi pi-times-circle text-gray-400'"
                      class="text-lg"
                    ></i>
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="font-medium text-sm text-gray-900">{{ permission.action }}</span>
                      <Tag
                        :value="permission.criticality"
                        :severity="getCriticalitySeverity(permission.criticality)"
                        class="text-xs"
                      />
                    </div>
                    <p class="text-xs text-gray-600 leading-relaxed">{{ permission.description }}</p>
                    <div v-if="permission.requiresApproval" class="flex items-center gap-1 mt-2">
                      <i class="pi pi-shield text-xs text-orange-500"></i>
                      <span class="text-xs text-orange-600 font-medium">Requires Approval</span>
                    </div>
                  </div>
                </div>
                <div v-if="!readonly" class="permission-actions">
                  <Button
                    :icon="permission.assigned ? 'pi pi-times' : 'pi pi-plus'"
                    :class="permission.assigned ? 'p-button-danger' : 'p-button-success'"
                    class="p-button-text p-button-sm"
                    @click.stop="togglePermission(permission)"
                  />
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <!-- No Results State -->
    <div v-if="filteredGroups.length === 0" class="no-results text-center py-12">
      <i class="pi pi-search text-4xl text-gray-300 mb-4"></i>
      <h4 class="text-lg font-medium text-gray-900 mb-2">No permissions found</h4>
      <p class="text-gray-600">Try adjusting your search or filter criteria</p>
      <Button
        label="Clear Filters"
        icon="pi pi-times"
        class="p-button-outlined mt-4"
        @click="clearFilters"
      />
    </div>

    <!-- Summary -->
    <div v-if="!readonly && selectedPermissions.length > 0" class="selection-summary">
      <Card class="bg-blue-50 border-blue-200">
        <template #content>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <i class="pi pi-info-circle text-blue-600"></i>
              <div>
                <span class="font-medium text-blue-900">
                  {{ selectedPermissions.length }} permission{{ selectedPermissions.length !== 1 ? 's' : '' }} selected
                </span>
                <div class="text-xs text-blue-700 mt-1">
                  Critical: {{ criticalSelectedCount }} |
                  Medium: {{ mediumSelectedCount }} |
                  Low: {{ lowSelectedCount }}
                </div>
              </div>
            </div>
            <Button
              label="Clear All"
              icon="pi pi-times"
              class="p-button-outlined p-button-sm p-button-secondary"
              @click="clearAllSelection"
            />
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

// Types
interface Permission {
  id: string;
  resource: string;
  action: string;
  description: string;
  criticality: string;
  requiresApproval?: boolean;
}

interface PermissionGroup {
  resource: string;
  permissions: Array<Permission & { assigned: boolean }>;
  expanded: boolean;
  assignedCount: number;
  allAssigned: boolean;
  criticalCount: number;
}

// Props
const props = defineProps<{
  permissions: Permission[];
  selectedPermissions: string[];
  readonly?: boolean;
  searchable?: boolean;
}>();

// Emits
const emit = defineEmits<{
  'permission-toggle': [permissionId: string];
  'bulk-toggle': [permissionIds: string[], grant: boolean];
}>();

// State
const searchTerm = ref('');
const filterBy = ref('all');
const expandedGroups = ref<Set<string>>(new Set());

// Filter options
const filterOptions = [
  { label: 'All Permissions', value: 'all' },
  { label: 'Critical Only', value: 'critical' },
  { label: 'Assigned Only', value: 'assigned' },
  { label: 'Unassigned Only', value: 'unassigned' },
  { label: 'Requires Approval', value: 'approval' }
];

// Computed properties
const permissionGroups = computed(() => {
  const groups: Record<string, PermissionGroup> = {};

  props.permissions.forEach(permission => {
    if (!groups[permission.resource]) {
      groups[permission.resource] = {
        resource: permission.resource,
        permissions: [],
        expanded: expandedGroups.value.has(permission.resource) !== false, // Default to expanded
        assignedCount: 0,
        allAssigned: false,
        criticalCount: 0
      };
    }

    const assigned = props.selectedPermissions.includes(permission.id);
    groups[permission.resource].permissions.push({
      ...permission,
      assigned
    });

    if (assigned) {
      groups[permission.resource].assignedCount++;
    }

    if (permission.criticality === 'HIGH') {
      groups[permission.resource].criticalCount++;
    }
  });

  // Calculate allAssigned status
  Object.values(groups).forEach(group => {
    group.allAssigned = group.assignedCount === group.permissions.length && group.permissions.length > 0;
    if (!expandedGroups.value.has(group.resource)) {
      expandedGroups.value.add(group.resource); // Default all groups to expanded
    }
  });

  return Object.values(groups);
});

const filteredGroups = computed(() => {
  return permissionGroups.value
    .map(group => ({
      ...group,
      permissions: group.permissions.filter(permission => {
        // Search filter
        if (searchTerm.value) {
          const search = searchTerm.value.toLowerCase();
          const matchesSearch =
            permission.action.toLowerCase().includes(search) ||
            permission.description.toLowerCase().includes(search) ||
            permission.resource.toLowerCase().includes(search);
          if (!matchesSearch) return false;
        }

        // Category filter
        switch (filterBy.value) {
          case 'critical':
            return permission.criticality === 'HIGH';
          case 'assigned':
            return permission.assigned;
          case 'unassigned':
            return !permission.assigned;
          case 'approval':
            return permission.requiresApproval;
          default:
            return true;
        }
      })
    }))
    .filter(group => group.permissions.length > 0);
});

const criticalSelectedCount = computed(() => {
  return props.permissions.filter(p =>
    props.selectedPermissions.includes(p.id) && p.criticality === 'HIGH'
  ).length;
});

const mediumSelectedCount = computed(() => {
  return props.permissions.filter(p =>
    props.selectedPermissions.includes(p.id) && p.criticality === 'MEDIUM'
  ).length;
});

const lowSelectedCount = computed(() => {
  return props.permissions.filter(p =>
    props.selectedPermissions.includes(p.id) && p.criticality === 'LOW'
  ).length;
});

// Methods
const getResourceIcon = (resource: string) => {
  const icons: Record<string, string> = {
    'USER': 'pi pi-users',
    'FUND': 'pi pi-briefcase',
    'INVESTMENT': 'pi pi-chart-line',
    'DOCUMENT': 'pi pi-file',
    'SYSTEM': 'pi pi-cog',
    'AUDIT': 'pi pi-history',
  };
  return icons[resource] || 'pi pi-question-circle';
};

const getCriticalitySeverity = (criticality: string) => {
  switch (criticality) {
    case 'HIGH': return 'danger';
    case 'MEDIUM': return 'warning';
    case 'LOW': return 'success';
    default: return 'info';
  }
};

const getGroupChipClass = (assigned: number, total: number) => {
  const percentage = total > 0 ? (assigned / total) * 100 : 0;
  if (percentage === 100) return 'bg-green-100 text-green-800';
  if (percentage >= 50) return 'bg-blue-100 text-blue-800';
  if (percentage > 0) return 'bg-yellow-100 text-yellow-800';
  return 'bg-gray-100 text-gray-600';
};

const toggleGroup = (resource: string) => {
  if (expandedGroups.value.has(resource)) {
    expandedGroups.value.delete(resource);
  } else {
    expandedGroups.value.add(resource);
  }
};

const togglePermission = (permission: Permission & { assigned: boolean }) => {
  emit('permission-toggle', permission.id);
};

const toggleGroupPermissions = (group: PermissionGroup) => {
  const permissionIds = group.permissions.map(p => p.id);
  emit('bulk-toggle', permissionIds, !group.allAssigned);
};

const selectAllVisible = () => {
  const visiblePermissionIds = filteredGroups.value
    .flatMap(group => group.permissions)
    .filter(p => !p.assigned)
    .map(p => p.id);

  if (visiblePermissionIds.length > 0) {
    emit('bulk-toggle', visiblePermissionIds, true);
  }
};

const clearAllSelection = () => {
  if (props.selectedPermissions.length > 0) {
    emit('bulk-toggle', [...props.selectedPermissions], false);
  }
};

const clearFilters = () => {
  searchTerm.value = '';
  filterBy.value = 'all';
};

// Initialize expanded state
watch(() => props.permissions, () => {
  // Ensure all groups start expanded by default
  const resources = [...new Set(props.permissions.map(p => p.resource))];
  resources.forEach(resource => {
    if (!expandedGroups.value.has(resource)) {
      expandedGroups.value.add(resource);
    }
  });
}, { immediate: true });
</script>

<style scoped>
.permission-selector {
  max-height: 60vh;
  overflow-y: auto;
}

.permission-item {
  transition: all 0.2s ease;
}

.permission-item:hover:not(.cursor-default) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.group-header {
  transition: all 0.2s ease;
}

.group-header:hover {
  background-color: #f1f5f9;
}

/* Expand/collapse animation */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}

.expand-enter-to,
.expand-leave-from {
  max-height: 1000px;
  opacity: 1;
}

/* Custom scrollbar */
.permission-selector {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f1f5f9;
}

.permission-selector::-webkit-scrollbar {
  width: 6px;
}

.permission-selector::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.permission-selector::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.permission-selector::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Selection summary styling */
.selection-summary {
  position: sticky;
  bottom: 0;
  z-index: 10;
  margin-top: 1rem;
}

/* No results state */
.no-results {
  opacity: 0.8;
}

/* Read-only mode styling */
.readonly .permission-item {
  cursor: default;
}

.readonly .group-header:hover {
  background-color: #f8fafc;
}
</style>