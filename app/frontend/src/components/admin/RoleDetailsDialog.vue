<template>
  <Dialog
    v-model:visible="dialogVisible"
    :modal="true"
    :draggable="false"
    :closable="true"
    :style="{ width: '90vw', maxWidth: '900px' }"
    class="role-details-dialog"
    @hide="onDialogHide"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div
          class="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md"
          :style="{ backgroundColor: getRoleColor(role?.name) }"
        >
          {{ getRoleInitials(role?.name) }}
        </div>
        <div>
          <h3 class="text-xl font-semibold text-gray-900 m-0">{{ role?.name }}</h3>
          <p class="text-sm text-gray-600 m-0 mt-1">Role Overview</p>
        </div>
      </div>
    </template>

    <div v-if="role" class="role-details-content">
      <!-- Status Badges -->
      <div class="flex items-center gap-2 mb-6">
        <Tag
          :value="role.status || 'ACTIVE'"
          :severity="getStatusSeverity(role.status)"
          class="text-sm font-medium"
        />
        <Tag
          v-if="role.isDefault"
          value="DEFAULT ROLE"
          severity="info"
          class="text-sm font-medium"
        />
        <Tag
          v-if="role.isSystemRole"
          value="SYSTEM"
          severity="warning"
          class="text-sm font-medium"
        />
      </div>

      <!-- Description Card -->
      <div class="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <i class="pi pi-info-circle text-blue-600 text-lg"></i>
          </div>
          <div class="flex-1">
            <h4 class="text-sm font-semibold text-gray-700 mb-1">Description</h4>
            <p class="text-sm text-gray-600 leading-relaxed">
              {{ role.description || 'No description provided' }}
            </p>
          </div>
        </div>
      </div>
      <!-- Key Metrics -->
      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="metric-card p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
          <div class="flex items-center justify-between mb-2">
            <i class="pi pi-users text-blue-600 text-xl"></i>
            <span class="text-2xl font-bold text-blue-700">{{ role.userCount || 0 }}</span>
          </div>
          <div class="text-sm font-medium text-blue-800">Assigned Users</div>
        </div>

        <div class="metric-card p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
          <div class="flex items-center justify-between mb-2">
            <i class="pi pi-shield text-purple-600 text-xl"></i>
            <span class="text-2xl font-bold text-purple-700">{{ permissionCount }}</span>
          </div>
          <div class="text-sm font-medium text-purple-800">Permissions</div>
        </div>

        <div class="metric-card p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
          <div class="flex items-center justify-between mb-2">
            <i class="pi pi-calendar text-green-600 text-xl"></i>
            <span class="text-xs font-semibold text-green-700">{{ formatDate(role.createdAt) }}</span>
          </div>
          <div class="text-sm font-medium text-green-800">Created Date</div>
        </div>
      </div>

      <!-- Permissions Section -->
      <div class="permissions-section">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-lg font-semibold text-gray-900">Permissions</h4>
          <div class="flex items-center gap-2">
            <InputGroup>
              <InputGroupAddon>
                <i class="pi pi-search text-gray-400"></i>
              </InputGroupAddon>
              <InputText
                v-model="permissionSearch"
                placeholder="Search permissions..."
                class="w-64"
              />
            </InputGroup>
          </div>
        </div>

        <!-- Permissions by Resource -->
        <div v-if="groupedPermissions && Object.keys(groupedPermissions).length > 0" class="space-y-4">
          <div
            v-for="(permissions, resource) in filteredGroupedPermissions"
            :key="resource"
            class="permission-group border border-gray-200 rounded-lg overflow-hidden"
          >
            <div class="permission-group-header bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <i :class="getResourceIcon(resource)" class="text-gray-700"></i>
                  </div>
                  <div>
                    <h5 class="font-semibold text-gray-900">{{ resource }}</h5>
                    <p class="text-xs text-gray-600">{{ permissions.length }} permission{{ permissions.length !== 1 ? 's' : '' }}</p>
                  </div>
                </div>
                <Tag
                  :value="`${permissions.length}`"
                  severity="secondary"
                  class="font-medium"
                />
              </div>
            </div>
            <div class="permission-group-body bg-white p-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div
                  v-for="permission in permissions"
                  :key="permission.id"
                  class="permission-item flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
                >
                  <div class="flex-shrink-0 mt-0.5">
                    <i class="pi pi-check-circle text-green-600"></i>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="font-medium text-gray-900 text-sm">{{ permission }}</span>
                      <Tag
                        v-if="permission.level"
                        :value="permission.level"
                        :severity="getLevelSeverity(permission.level)"
                        class="text-xs"
                      />
                    </div>
                    <p class="text-xs text-gray-600 leading-relaxed">
                      {{ permission.description || 'No description' }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- No Permissions State -->
        <div v-else class="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div class="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="pi pi-shield text-gray-400 text-2xl"></i>
          </div>
          <p class="text-gray-600 font-medium mb-1">No permissions assigned</p>
          <p class="text-gray-500 text-sm">This role doesn't have any permissions yet</p>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else class="text-center py-12">
      <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
      <p class="text-gray-600 mt-4">Loading role details...</p>
    </div>

    <template #footer>
      <div class="flex w-full items-center justify-between px-6 py-4 bg-gray-50 border-t">
        <div class="text-sm text-gray-500 flex items-center">
          <i class="pi pi-info-circle mr-2 text-blue-500"></i>
          {{ permissionCount }} permission{{ permissionCount !== 1 ? 's' : '' }} assigned to this role
        </div>
        <div class="flex items-center gap-3">
          <Button
            label="Close"
            icon="pi pi-times"
            class="p-button-outlined px-6 py-2"
            @click="closeDialog"
          />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import InputText from 'primevue/inputtext';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import ProgressSpinner from 'primevue/progressspinner';
import type { Role, Permission } from '@/types/role';

interface Props {
  visible: boolean;
  role: Role | null;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

const permissionSearch = ref('');

const permissionCount = computed(() => {
  return props.role?.permissions?.length || 0;
});

const groupedPermissions = computed(() => {
  if (!props.role?.permissions) return {};

  const grouped: Record<string, Permission[]> = {};

  props.role.permissions.forEach((permission) => {
    const resource = permission.resource || 'OTHER';
    if (!grouped[resource]) {
      grouped[resource] = [];
    }
    grouped[resource].push(permission);
  });

  return grouped;
});

const filteredGroupedPermissions = computed(() => {
  if (!permissionSearch.value.trim()) {
    return groupedPermissions.value;
  }

  const search = permissionSearch.value.toLowerCase();
  const filtered: Record<string, Permission[]> = {};

  Object.entries(groupedPermissions.value).forEach(([resource, permissions]) => {
    const matchingPermissions = permissions.filter(
      (p) =>
        p.action.toLowerCase().includes(search) ||
        p.resource.toLowerCase().includes(search) ||
        (p.description && p.description.toLowerCase().includes(search))
    );

    if (matchingPermissions.length > 0) {
      filtered[resource] = matchingPermissions;
    }
  });

  return filtered;
});

const getRoleColor = (name?: string): string => {
  if (!name) return '#6B7280';

  const colors = [
    '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B',
    '#10B981', '#06B6D4', '#6366F1', '#F97316'
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
};

const getRoleInitials = (name?: string): string => {
  if (!name) return '?';

  const words = name.split('_');
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const getStatusSeverity = (status?: string): string => {
  const statusMap: Record<string, string> = {
    ACTIVE: 'success',
    INACTIVE: 'danger',
    PENDING: 'warning',
  };
  return statusMap[status || 'ACTIVE'] || 'secondary';
};

const getLevelSeverity = (level?: string): string => {
  const levelMap: Record<string, string> = {
    HIGH: 'danger',
    MEDIUM: 'warning',
    LOW: 'info',
  };
  return levelMap[level || 'MEDIUM'] || 'secondary';
};

const getResourceIcon = (resource: string): string => {
  const iconMap: Record<string, string> = {
    USER: 'pi pi-user',
    ROLE: 'pi pi-shield',
    PERMISSION: 'pi pi-lock',
    FUND: 'pi pi-briefcase',
    INVESTMENT: 'pi pi-chart-line',
    CAPITAL_CALL: 'pi pi-wallet',
    DISTRIBUTION: 'pi pi-money-bill',
    DOCUMENT: 'pi pi-file',
    REPORT: 'pi pi-chart-bar',
    AUDIT: 'pi pi-history',
    SYSTEM: 'pi pi-cog',
    PORTFOLIO: 'pi pi-folder',
    COMMUNICATION: 'pi pi-comments',
  };
  return iconMap[resource] || 'pi pi-circle';
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';

  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

const closeDialog = () => {
  dialogVisible.value = false;
};

const onDialogHide = () => {
  permissionSearch.value = '';
};

// Reset search when dialog opens
watch(dialogVisible, (newValue) => {
  if (newValue) {
    permissionSearch.value = '';
  }
});
</script>

<style scoped>
.role-details-dialog :deep(.p-dialog-content) {
  padding: 1.5rem;
}

.metric-card {
  transition: all 0.2s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.permission-group {
  transition: all 0.2s ease;
}

.permission-group:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.permission-item {
  transition: all 0.2s ease;
}

.permission-item:hover {
  transform: translateX(2px);
}
</style>
