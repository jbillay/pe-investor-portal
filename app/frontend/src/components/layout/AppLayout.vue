<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <AppHeader />

    <!-- Navigation -->
    <div class="pt-16">
      <AppNavigation />
    </div>

    <!-- Main Content -->
    <main class="pt-2">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <router-view />
      </div>
    </main>

    <!-- Loading Overlay -->
    <transition
      enter-active-class="transition ease-out duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="authStore.isLoading"
        class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
      >
        <div class="bg-white rounded-lg p-6 flex items-center space-x-3 shadow-strong">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          <span class="text-gray-900 font-medium">Loading...</span>
        </div>
      </div>
    </transition>

    <!-- Toast Notifications -->
    <div class="fixed top-20 right-4 z-40 space-y-2">
      <transition-group
        enter-active-class="transition ease-out duration-300"
        enter-from-class="transform opacity-0 translate-x-full"
        enter-to-class="transform opacity-100 translate-x-0"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="transform opacity-100 translate-x-0"
        leave-to-class="transform opacity-0 translate-x-full"
      >
        <div
          v-for="notification in notifications"
          :key="notification.id"
          :class="[
            'max-w-sm w-full bg-white shadow-medium rounded-lg border border-gray-200 p-4',
            {
              'border-l-4 border-l-success-500': notification.type === 'success',
              'border-l-4 border-l-error-500': notification.type === 'error',
              'border-l-4 border-l-warning-500': notification.type === 'warning',
              'border-l-4 border-l-info-500': notification.type === 'info'
            }
          ]"
        >
          <div class="flex">
            <div class="flex-shrink-0">
              <i
                :class="[
                  'text-lg',
                  {
                    'pi pi-check-circle text-success-500': notification.type === 'success',
                    'pi pi-times-circle text-error-500': notification.type === 'error',
                    'pi pi-exclamation-triangle text-warning-500': notification.type === 'warning',
                    'pi pi-info-circle text-info-500': notification.type === 'info'
                  }
                ]"
              ></i>
            </div>
            <div class="ml-3 w-0 flex-1">
              <p class="text-sm font-medium text-gray-900">
                {{ notification.title }}
              </p>
              <p v-if="notification.message" class="mt-1 text-sm text-gray-500">
                {{ notification.message }}
              </p>
            </div>
            <div class="ml-4 flex-shrink-0 flex">
              <button
                @click="removeNotification(notification.id)"
                class="rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <i class="pi pi-times text-sm"></i>
              </button>
            </div>
          </div>
        </div>
      </transition-group>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, provide } from 'vue'
import { useAuthStore } from '@stores/auth'
import AppHeader from './AppHeader.vue'
import AppNavigation from './AppNavigation.vue'

const authStore = useAuthStore()

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

const notifications = ref<Notification[]>([])

const addNotification = (notification: Omit<Notification, 'id'>) => {
  const id = Date.now().toString()
  const newNotification = { ...notification, id }

  notifications.value.push(newNotification)

  // Auto-remove after duration (default 5 seconds)
  const duration = notification.duration || 5000
  setTimeout(() => {
    removeNotification(id)
  }, duration)
}

const removeNotification = (id: string) => {
  const index = notifications.value.findIndex(n => n.id === id)
  if (index > -1) {
    notifications.value.splice(index, 1)
  }
}

// Initialize auth on mount
onMounted(() => {
  authStore.initializeAuth()

  // If we have tokens but no user data, fetch current user
  if (authStore.accessToken && !authStore.user) {
    authStore.getCurrentUser()
  }
})

// Watch for auth errors and show notifications
watch(
  () => authStore.error,
  (error) => {
    if (error) {
      addNotification({
        type: 'error',
        title: 'Authentication Error',
        message: error
      })
      authStore.clearError()
    }
  },
  { immediate: true }
)

// Provide notification function globally
provide('addNotification', addNotification)
</script>