<template>
  <div class="admin-nav-wrapper">
    <div class="admin-nav-tabs">
      <button
        v-for="item in navItems"
        :key="item.path"
        @click="navigateTo(item.path)"
        :class="['admin-nav-tab', { 'active': isActive(item.path) }]"
      >
        <i :class="`pi ${item.icon}`"></i>
        <span>{{ item.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { usePluginRegistryStore } from '@/stores/pluginRegistry';

interface NavItem {
  label: string;
  icon: string;
  path: string;
  order: number;
}

const router = useRouter();
const route = useRoute();
const pluginRegistryStore = usePluginRegistryStore();

const navItems = computed(() => {
  // Core admin menu items with order
  const coreItems: NavItem[] = [
    {
      label: 'Users',
      icon: 'pi-users',
      path: '/admin/users',
      order: 10
    },
    {
      label: 'Roles',
      icon: 'pi-key',
      path: '/admin/roles',
      order: 20
    },
    {
      label: 'Data Objects',
      icon: 'pi-database',
      path: '/admin/data-objects',
      order: 30
    },
    {
      label: 'Analytics',
      icon: 'pi-chart-bar',
      path: '/admin/analytics',
      order: 40
    },
    {
      label: 'Email Templates',
      icon: 'pi-envelope',
      path: '/admin/email-templates',
      order: 50
    },
    {
      label: 'Plugins',
      icon: 'pi-box',
      path: '/admin/plugins',
      order: 60
    }
  ];

  // Add plugin admin menu items
  const pluginMenus = pluginRegistryStore.adminMenuItems;
  pluginMenus.forEach(menu => {
    coreItems.push({
      label: menu.label,
      icon: menu.icon || 'pi-puzzle-piece',
      path: menu.route,
      order: menu.order
    });
  });

  // Sort by order
  return coreItems.sort((a, b) => a.order - b.order);
});

const navigateTo = (path: string) => {
  router.push(path);
};

const isActive = (path: string): boolean => {
  return route.path === path;
};
</script>

<style scoped>
.admin-nav-wrapper {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 0.5rem;
  margin-bottom: 1.5rem;
}

.admin-nav-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.admin-nav-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: 0.5rem;
  border: 2px solid transparent;
  background: transparent;
  color: #6b7280;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.admin-nav-tab:hover {
  background: #f3f4f6;
  color: #374151;
}

.admin-nav-tab.active {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1e40af;
  border-color: #93c5fd;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.admin-nav-tab i {
  font-size: 1rem;
}

@media (max-width: 640px) {
  .admin-nav-tabs {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }

  .admin-nav-tab {
    justify-content: center;
    padding: 0.625rem 1rem;
    font-size: 0.8125rem;
  }
}
</style>
