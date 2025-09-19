<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Page Header -->
    <div class="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
      <h1 class="text-2xl font-bold text-gray-900">Settings</h1>
      <p class="mt-1 text-gray-600">
        Manage your account preferences and application settings
      </p>
    </div>

    <!-- Settings Navigation -->
    <div class="bg-white rounded-lg shadow-soft border border-gray-200">
      <div class="border-b border-gray-200">
        <nav class="flex space-x-8 px-6" aria-label="Settings">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === tab.id
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            <i :class="[tab.icon, 'mr-2']"></i>
            {{ tab.name }}
          </button>
        </nav>
      </div>

      <!-- Account Settings -->
      <div v-if="activeTab === 'account'" class="p-6">
        <div class="space-y-6">
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Display Name
                </label>
                <input
                  v-model="authStore.userFullName"
                  type="text"
                  class="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Time Zone
                </label>
                <select
                  v-model="accountSettings.timezone"
                  class="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="Europe/London">Greenwich Mean Time (GMT)</option>
                  <option value="Europe/Paris">Central European Time (CET)</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-4">Security</h3>
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-900">Password</p>
                  <p class="text-sm text-gray-500">Last changed 3 months ago</p>
                </div>
                <button class="px-4 py-2 text-sm font-medium text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-50 transition-colors">
                  Change Password
                </button>
              </div>
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-900">Two-Factor Authentication</p>
                  <p class="text-sm text-gray-500">Add an extra layer of security</p>
                </div>
                <button class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors">
                  Enable 2FA
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Notification Settings -->
      <div v-if="activeTab === 'notifications'" class="p-6">
        <div class="space-y-6">
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-4">Email Notifications</h3>
            <div class="space-y-4">
              <div
                v-for="notification in emailNotifications"
                :key="notification.id"
                class="flex items-center justify-between"
              >
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ notification.title }}</p>
                  <p class="text-sm text-gray-500">{{ notification.description }}</p>
                </div>
                <div class="flex items-center">
                  <input
                    :id="notification.id"
                    v-model="notification.enabled"
                    type="checkbox"
                    class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label :for="notification.id" class="ml-2 text-sm text-gray-700">
                    {{ notification.enabled ? 'Enabled' : 'Disabled' }}
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-4">Push Notifications</h3>
            <div class="space-y-4">
              <div
                v-for="notification in pushNotifications"
                :key="notification.id"
                class="flex items-center justify-between"
              >
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ notification.title }}</p>
                  <p class="text-sm text-gray-500">{{ notification.description }}</p>
                </div>
                <div class="flex items-center">
                  <input
                    :id="notification.id"
                    v-model="notification.enabled"
                    type="checkbox"
                    class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label :for="notification.id" class="ml-2 text-sm text-gray-700">
                    {{ notification.enabled ? 'Enabled' : 'Disabled' }}
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Privacy Settings -->
      <div v-if="activeTab === 'privacy'" class="p-6">
        <div class="space-y-6">
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-4">Data & Privacy</h3>
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-900">Activity Tracking</p>
                  <p class="text-sm text-gray-500">Allow tracking of your activity for analytics</p>
                </div>
                <div class="flex items-center">
                  <input
                    id="activity-tracking"
                    v-model="privacySettings.activityTracking"
                    type="checkbox"
                    class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label for="activity-tracking" class="ml-2 text-sm text-gray-700">
                    {{ privacySettings.activityTracking ? 'Enabled' : 'Disabled' }}
                  </label>
                </div>
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-900">Data Sharing</p>
                  <p class="text-sm text-gray-500">Share anonymized data for product improvement</p>
                </div>
                <div class="flex items-center">
                  <input
                    id="data-sharing"
                    v-model="privacySettings.dataSharing"
                    type="checkbox"
                    class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label for="data-sharing" class="ml-2 text-sm text-gray-700">
                    {{ privacySettings.dataSharing ? 'Enabled' : 'Disabled' }}
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-4">Data Export</h3>
            <div class="space-y-4">
              <div class="bg-gray-50 rounded-lg p-4">
                <p class="text-sm text-gray-700 mb-3">
                  You can request a copy of all your personal data stored in our system.
                </p>
                <button class="px-4 py-2 text-sm font-medium text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-50 transition-colors">
                  Request Data Export
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Display Preferences -->
      <div v-if="activeTab === 'display'" class="p-6">
        <div class="space-y-6">
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-4">Appearance</h3>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Theme
                </label>
                <div class="grid grid-cols-3 gap-3">
                  <div
                    v-for="theme in themes"
                    :key="theme.id"
                    @click="displaySettings.theme = theme.id"
                    :class="[
                      'relative rounded-lg border-2 cursor-pointer transition-colors',
                      displaySettings.theme === theme.id
                        ? 'border-primary-500'
                        : 'border-gray-200 hover:border-gray-300'
                    ]"
                  >
                    <div class="p-4 text-center">
                      <i :class="[theme.icon, 'text-2xl mb-2', theme.color]"></i>
                      <p class="text-sm font-medium text-gray-900">{{ theme.name }}</p>
                    </div>
                    <div
                      v-if="displaySettings.theme === theme.id"
                      class="absolute top-2 right-2 w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center"
                    >
                      <i class="pi pi-check text-white text-xs"></i>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Date Format
                </label>
                <select
                  v-model="displaySettings.dateFormat"
                  class="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Number Format
                </label>
                <select
                  v-model="displaySettings.numberFormat"
                  class="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="1,234.56">1,234.56 (US)</option>
                  <option value="1.234,56">1.234,56 (EU)</option>
                  <option value="1 234.56">1 234.56 (International)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Save Button -->
      <div class="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <div class="flex items-center justify-between">
          <p class="text-sm text-gray-500">
            Settings are saved automatically
          </p>
          <button
            @click="saveSettings"
            :disabled="isSaving"
            class="flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
          >
            <span v-if="!isSaving" class="flex items-center">
              <i class="pi pi-save mr-2"></i>
              Save Changes
            </span>
            <span v-else class="flex items-center">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@stores/auth'

const authStore = useAuthStore()
const activeTab = ref('account')
const isSaving = ref(false)

const tabs = [
  { id: 'account', name: 'Account', icon: 'pi pi-user' },
  { id: 'notifications', name: 'Notifications', icon: 'pi pi-bell' },
  { id: 'privacy', name: 'Privacy', icon: 'pi pi-shield' },
  { id: 'display', name: 'Display', icon: 'pi pi-palette' }
]

const accountSettings = ref({
  displayName: 'John Smith',
  timezone: 'America/New_York'
})

const emailNotifications = ref([
  {
    id: 'portfolio-updates',
    title: 'Portfolio Updates',
    description: 'Receive updates about your portfolio performance',
    enabled: true
  },
  {
    id: 'document-alerts',
    title: 'Document Alerts',
    description: 'Get notified when new documents are available',
    enabled: true
  },
  {
    id: 'capital-calls',
    title: 'Capital Calls',
    description: 'Important notifications about capital calls',
    enabled: true
  },
  {
    id: 'distributions',
    title: 'Distributions',
    description: 'Notifications about distribution payments',
    enabled: true
  },
  {
    id: 'quarterly-reports',
    title: 'Quarterly Reports',
    description: 'Receive quarterly investment reports',
    enabled: false
  }
])

const pushNotifications = ref([
  {
    id: 'urgent-alerts',
    title: 'Urgent Alerts',
    description: 'Critical notifications that require immediate attention',
    enabled: true
  },
  {
    id: 'market-updates',
    title: 'Market Updates',
    description: 'Significant market movements affecting your portfolio',
    enabled: false
  }
])

const privacySettings = ref({
  activityTracking: true,
  dataSharing: false
})

const displaySettings = ref({
  theme: 'light',
  dateFormat: 'MM/DD/YYYY',
  numberFormat: '1,234.56'
})

const themes = [
  {
    id: 'light',
    name: 'Light',
    icon: 'pi pi-sun',
    color: 'text-yellow-500'
  },
  {
    id: 'dark',
    name: 'Dark',
    icon: 'pi pi-moon',
    color: 'text-indigo-500'
  },
  {
    id: 'auto',
    name: 'Auto',
    icon: 'pi pi-desktop',
    color: 'text-gray-500'
  }
]

// Initialize auth on mount
onMounted(() => {
  authStore.initializeAuth()

  // If we have tokens but no user data, fetch current user
  if (authStore.accessToken && !authStore.user) {
    authStore.getCurrentUser()
  }
})

const saveSettings = async () => {
  try {
    isSaving.value = true

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    // In a real app, you would save the settings to the backend
    console.log('Settings saved:', {
      account: accountSettings.value,
      emailNotifications: emailNotifications.value,
      pushNotifications: pushNotifications.value,
      privacy: privacySettings.value,
      display: displaySettings.value
    })

  } catch (error) {
    console.error('Failed to save settings:', error)
  } finally {
    isSaving.value = false
  }
}
</script>
