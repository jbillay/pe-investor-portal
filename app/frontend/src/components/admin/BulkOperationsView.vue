<template>
  <div class="bulk-operations-view space-y-6">
    <!-- Role Copy Operation -->
    <Card>
      <template #header>
        <h3 class="text-lg font-semibold text-gray-900">Copy Role Permissions</h3>
      </template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Source Role</label>
            <Dropdown
              v-model="copyOperation.sourceRole"
              :options="roleOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Select source role..."
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Target Role</label>
            <Dropdown
              v-model="copyOperation.targetRole"
              :options="roleOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Select target role..."
              class="w-full"
            />
          </div>
          <Button
            label="Copy Permissions"
            icon="pi pi-copy"
            class="p-button-primary"
            :disabled="!copyOperation.sourceRole || !copyOperation.targetRole"
            @click="executeCopyOperation"
          />
        </div>
      </template>
    </Card>

    <!-- Bulk Grant/Revoke -->
    <Card>
      <template #header>
        <h3 class="text-lg font-semibold text-gray-900">Bulk Grant/Revoke Permissions</h3>
      </template>
      <template #content>
        <div class="space-y-4">
          <!-- Role Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Target Role</label>
            <Dropdown
              v-model="bulkOperation.targetRole"
              :options="roleOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Select role for bulk operations..."
              class="w-full"
            />
          </div>

          <!-- Permission Selection -->
          <div v-if="bulkOperation.targetRole">
            <label class="block text-sm font-medium text-gray-700 mb-2">Select Permissions</label>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                v-for="group in permissionGroups"
                :key="group.resource"
                class="permission-group border rounded-lg p-4"
              >
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-2">
                    <Checkbox
                      :model-value="isGroupSelected(group.resource)"
                      :indeterminate="isGroupIndeterminate(group.resource)"
                      @change="toggleGroup(group.resource)"
                    />
                    <i :class="getResourceIcon(group.resource)"></i>
                    <span class="font-medium">{{ group.resource }}</span>
                  </div>
                </div>
                <div class="space-y-2 pl-6">
                  <div
                    v-for="permission in group.permissions"
                    :key="permission.id"
                    class="flex items-center gap-2"
                  >
                    <Checkbox
                      v-model="bulkOperation.selectedPermissions"
                      :value="permission.id"
                    />
                    <span class="text-sm">{{ permission.action }}</span>
                    <Tag
                      :value="permission.criticality"
                      :severity="getCriticalitySeverity(permission.criticality)"
                      class="text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Bulk Actions -->
            <div class="flex gap-3 mt-6">
              <Button
                label="Grant Selected"
                icon="pi pi-check"
                class="p-button-success"
                :disabled="bulkOperation.selectedPermissions.length === 0"
                @click="executeBulkGrant"
              />
              <Button
                label="Revoke Selected"
                icon="pi pi-times"
                class="p-button-danger"
                :disabled="bulkOperation.selectedPermissions.length === 0"
                @click="executeBulkRevoke"
              />
              <Button
                label="Clear Selection"
                icon="pi pi-refresh"
                class="p-button-secondary"
                @click="clearSelection"
              />
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Operation History -->
    <Card>
      <template #header>
        <h3 class="text-lg font-semibold text-gray-900">Recent Operations</h3>
      </template>
      <template #content>
        <div class="text-center py-8 text-gray-500">
          <i class="pi pi-history text-3xl mb-2"></i>
          <p>Operation history will appear here</p>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

// Import PrimeView components
import Checkbox from 'primevue/checkbox';

// Props
const props = defineProps<{
  roles: Array<{
    id: string;
    name: string;
    userCount: number;
  }>;
  permissions: Array<{
    id: string;
    resource: string;
    action: string;
    description: string;
    criticality: string;
  }>;
  matrix: Record<string, string[]>;
}>();

// Emits
const emit = defineEmits<{
  'bulk-grant': [data: { roleId: string; permissionIds: string[] }];
  'bulk-revoke': [data: { roleId: string; permissionIds: string[] }];
  'role-copy': [data: { sourceRoleId: string; targetRoleId: string }];
}>();

// State
const copyOperation = ref({
  sourceRole: '',
  targetRole: ''
});

const bulkOperation = ref({
  targetRole: '',
  selectedPermissions: [] as string[]
});

// Computed
const roleOptions = computed(() => {
  return props.roles.map(role => ({
    label: `${role.name} (${role.userCount} users)`,
    value: role.id
  }));
});

const permissionGroups = computed(() => {
  const groups: Record<string, any> = {};

  props.permissions.forEach(permission => {
    if (!groups[permission.resource]) {
      groups[permission.resource] = {
        resource: permission.resource,
        permissions: []
      };
    }
    groups[permission.resource].permissions.push(permission);
  });

  return Object.values(groups);
});

// Methods
const executeCopyOperation = () => {
  emit('role-copy', {
    sourceRoleId: copyOperation.value.sourceRole,
    targetRoleId: copyOperation.value.targetRole
  });
  copyOperation.value = { sourceRole: '', targetRole: '' };
};

const executeBulkGrant = () => {
  emit('bulk-grant', {
    roleId: bulkOperation.value.targetRole,
    permissionIds: bulkOperation.value.selectedPermissions
  });
  clearSelection();
};

const executeBulkRevoke = () => {
  emit('bulk-revoke', {
    roleId: bulkOperation.value.targetRole,
    permissionIds: bulkOperation.value.selectedPermissions
  });
  clearSelection();
};

const clearSelection = () => {
  bulkOperation.value.selectedPermissions = [];
};

const isGroupSelected = (resource: string) => {
  const groupPermissions = props.permissions
    .filter(p => p.resource === resource)
    .map(p => p.id);

  return groupPermissions.length > 0 &&
    groupPermissions.every(id => bulkOperation.value.selectedPermissions.includes(id));
};

const isGroupIndeterminate = (resource: string) => {
  const groupPermissions = props.permissions
    .filter(p => p.resource === resource)
    .map(p => p.id);

  const selectedCount = groupPermissions.filter(id =>
    bulkOperation.value.selectedPermissions.includes(id)
  ).length;

  return selectedCount > 0 && selectedCount < groupPermissions.length;
};

const toggleGroup = (resource: string) => {
  const groupPermissions = props.permissions
    .filter(p => p.resource === resource)
    .map(p => p.id);

  const allSelected = isGroupSelected(resource);

  if (allSelected) {
    // Remove all group permissions
    bulkOperation.value.selectedPermissions = bulkOperation.value.selectedPermissions
      .filter(id => !groupPermissions.includes(id));
  } else {
    // Add all group permissions
    groupPermissions.forEach(id => {
      if (!bulkOperation.value.selectedPermissions.includes(id)) {
        bulkOperation.value.selectedPermissions.push(id);
      }
    });
  }
};

// Helper functions
const getResourceIcon = (resource: string) => {
  const icons: Record<string, string> = {
    'USER': 'pi pi-users',
    'FUND': 'pi pi-briefcase',
    'INVESTMENT': 'pi pi-chart-line',
    'DOCUMENT': 'pi pi-file',
    'SYSTEM': 'pi pi-cog',
    'AUDIT': 'pi pi-history',
  };
  return icons[resource] || 'pi pi-question';
};

const getCriticalitySeverity = (criticality: string) => {
  switch (criticality) {
    case 'HIGH': return 'danger';
    case 'MEDIUM': return 'warning';
    case 'LOW': return 'success';
    default: return 'info';
  }
};
</script>

<style scoped>
.permission-group {
  transition: all 0.2s ease;
}

.permission-group:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.bulk-operations-view {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
