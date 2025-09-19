<template>
  <nav class="bg-white border-b border-gray-200 shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-center">
        <div class="flex space-x-8">
          <router-link
            v-for="item in navigationItems"
            :key="item.name"
            :to="item.to"
            :class="[
              'inline-flex items-center px-1 pt-4 pb-4 border-b-2 text-sm font-medium transition-colors duration-200',
              $route.name === item.name
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            <i :class="item.icon" class="mr-2"></i>
            {{ item.label }}
          </router-link>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const navigationItems = computed(() => {
  const baseItems = [
    {
      name: 'dashboard',
      label: 'Dashboard',
      icon: 'pi pi-home',
      to: '/'
    },
    {
      name: 'portfolio',
      label: 'Portfolio',
      icon: 'pi pi-chart-pie',
      to: '/portfolio'
    },
    {
      name: 'capital-activity',
      label: 'Capital Activity',
      icon: 'pi pi-credit-card',
      to: '/capital-activity'
    },
    {
      name: 'documents',
      label: 'Documents',
      icon: 'pi pi-file-pdf',
      to: '/documents'
    },
    {
      name: 'communications',
      label: 'Communications',
      icon: 'pi pi-bell',
      to: '/communications'
    }
  ]

  // Add admin link if user has SUPER_ADMIN role
  const userRoles = authStore.user?.roles || []
  if (userRoles.includes('SUPER_ADMIN')) {
    baseItems.push({
      name: 'admin',
      label: 'Administration',
      icon: 'pi pi-cog',
      to: '/admin'
    })
  }

  return baseItems
})
</script>
