<template>
  <div class="space-y-8">
    <!-- Welcome Header -->
    <div
      class="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg shadow-lg text-white p-6"
    >
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold">
            Welcome back, {{ authStore.user?.firstName }}!
          </h1>
          <p class="mt-2 text-blue-100">
            Manage your investor portal system, users, roles, and plugins.
          </p>
        </div>
        <div class="hidden sm:block">
          <div class="flex flex-col items-end space-y-1">
            <div class="flex items-center space-x-2 text-blue-100">
              <i class="pi pi-calendar"></i>
              <span>{{ currentDate }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Plugin Widgets: Dashboard Top -->
    <div v-if="dashboardTopWidgets.length > 0" class="space-y-4">
      <div
        v-for="widget in dashboardTopWidgets"
        :key="widget.id"
        class="plugin-widget"
      >
        <component
          :is="getWidgetComponent(widget)"
          v-if="getWidgetComponent(widget)"
          v-bind="widget.props || {}"
        />
      </div>
    </div>

    <!-- System Statistics -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div
        class="bg-white rounded-lg shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow"
      >
        <div class="flex items-center">
          <div class="flex-shrink-0 rounded-lg p-3 bg-blue-100">
            <i class="pi pi-users text-blue-600 text-lg"></i>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Total Users</p>
            <p class="text-2xl font-bold text-gray-900">-</p>
            <p class="text-sm text-gray-500">System users</p>
          </div>
        </div>
      </div>

      <div
        class="bg-white rounded-lg shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow"
      >
        <div class="flex items-center">
          <div class="flex-shrink-0 rounded-lg p-3 bg-green-100">
            <i class="pi pi-shield text-green-600 text-lg"></i>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Active Roles</p>
            <p class="text-2xl font-bold text-gray-900">-</p>
            <p class="text-sm text-gray-500">Role definitions</p>
          </div>
        </div>
      </div>

      <div
        class="bg-white rounded-lg shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow"
      >
        <div class="flex items-center">
          <div class="flex-shrink-0 rounded-lg p-3 bg-purple-100">
            <i class="pi pi-box text-purple-600 text-lg"></i>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Plugins Installed</p>
            <p class="text-2xl font-bold text-gray-900">
              {{ pluginStats.installed }}
            </p>
            <p class="text-sm text-gray-500">Active plugins</p>
          </div>
        </div>
      </div>

      <div
        class="bg-white rounded-lg shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow"
      >
        <div class="flex items-center">
          <div class="flex-shrink-0 rounded-lg p-3 bg-orange-100">
            <i class="pi pi-database text-orange-600 text-lg"></i>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Data Objects</p>
            <p class="text-2xl font-bold text-gray-900">-</p>
            <p class="text-sm text-gray-500">Dynamic objects</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Plugin Widgets: Dashboard Center -->
    <div v-if="dashboardCenterWidgets.length > 0" class="space-y-4">
      <div
        v-for="widget in dashboardCenterWidgets"
        :key="widget.id"
        class="plugin-widget"
      >
        <component
          :is="getWidgetComponent(widget)"
          v-if="getWidgetComponent(widget)"
          v-bind="widget.props || {}"
        />
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="bg-white rounded-lg shadow-lg border border-gray-100 p-6">
      <h2 class="text-xl font-semibold text-gray-900 mb-4 flex items-center">
        <i class="pi pi-bolt mr-2 text-blue-600"></i>
        Quick Actions
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <router-link
          v-if="isAdmin"
          to="/admin/users"
          class="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <i class="pi pi-users text-blue-600 text-xl mr-3"></i>
          <div>
            <p class="font-semibold text-gray-900">Manage Users</p>
            <p class="text-sm text-gray-600">Add or edit users</p>
          </div>
        </router-link>

        <router-link
          v-if="isAdmin"
          to="/admin/roles"
          class="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
        >
          <i class="pi pi-shield text-green-600 text-xl mr-3"></i>
          <div>
            <p class="font-semibold text-gray-900">Manage Roles</p>
            <p class="text-sm text-gray-600">Configure permissions</p>
          </div>
        </router-link>

        <router-link
          v-if="isAdmin"
          to="/admin/plugins"
          class="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
        >
          <i class="pi pi-box text-purple-600 text-xl mr-3"></i>
          <div>
            <p class="font-semibold text-gray-900">Manage Plugins</p>
            <p class="text-sm text-gray-600">Install plugins</p>
          </div>
        </router-link>

        <router-link
          v-if="isAdmin"
          to="/admin/data-objects"
          class="flex items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
        >
          <i class="pi pi-database text-orange-600 text-xl mr-3"></i>
          <div>
            <p class="font-semibold text-gray-900">Data Objects</p>
            <p class="text-sm text-gray-600">Manage schemas</p>
          </div>
        </router-link>
      </div>
    </div>

    <!-- Plugin Widgets: Dashboard Bottom -->
    <div v-if="dashboardBottomWidgets.length > 0" class="space-y-4">
      <div
        v-for="widget in dashboardBottomWidgets"
        :key="widget.id"
        class="plugin-widget"
      >
        <component
          :is="getWidgetComponent(widget)"
          v-if="getWidgetComponent(widget)"
          v-bind="widget.props || {}"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { usePluginRegistryStore } from '@/stores/pluginRegistry';

const authStore = useAuthStore();
const pluginRegistryStore = usePluginRegistryStore();

// Current date for display
const currentDate = computed(() => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
});

// Check if user is admin
const isAdmin = computed(() => {
  return authStore.user?.roles?.includes('SUPER_ADMIN');
});

// Plugin statistics
const pluginStats = computed(() => {
  return {
    installed: pluginRegistryStore.pluginCount || 0,
    active: pluginRegistryStore.pluginStatsByStatus.INSTALLED || 0,
  };
});

// Plugin widgets by slot
const dashboardTopWidgets = computed(() =>
  pluginRegistryStore.getWidgetsBySlot('dashboard-top'),
);

const dashboardCenterWidgets = computed(() =>
  pluginRegistryStore.getWidgetsBySlot('dashboard-center'),
);

const dashboardBottomWidgets = computed(() =>
  pluginRegistryStore.getWidgetsBySlot('dashboard-bottom'),
);

// Get widget component from loaded plugins
const getWidgetComponent = (widget: any) => {
  const plugin = pluginRegistryStore.getLoadedPlugin(widget.pluginId);
  if (!plugin || !plugin.component) {
    console.warn(`Widget component not found for plugin ${widget.pluginId}`);
    return null;
  }
  return plugin.component[widget.componentName] || null;
};

onMounted(() => {
  // Dashboard is now simplified - no need to load portfolio data
  console.log('Dashboard loaded');
});
</script>

<style scoped>
.plugin-widget {
  @apply bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden;
}
</style>
