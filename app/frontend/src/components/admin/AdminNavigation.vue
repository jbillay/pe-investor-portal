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
import { useRouter, useRoute } from 'vue-router';

interface NavItem {
  label: string;
  icon: string;
  path: string;
}

const router = useRouter();
const route = useRoute();

const navItems: NavItem[] = [
  {
    label: 'Users',
    icon: 'pi-users',
    path: '/admin/users'
  },
  {
    label: 'Roles',
    icon: 'pi-key',
    path: '/admin/roles'
  },
  {
    label: 'Analytics',
    icon: 'pi-chart-bar',
    path: '/admin/analytics'
  },
  {
    label: 'Email Templates',
    icon: 'pi-envelope',
    path: '/admin/email-templates'
  }
];

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
