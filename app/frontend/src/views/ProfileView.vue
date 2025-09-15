<template>
  <div class="max-w-4xl mx-auto space-y-8">
    <!-- Page Header -->
    <div class="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Profile Settings</h1>
          <p class="mt-1 text-gray-600">
            Manage your personal information and account preferences
          </p>
        </div>
        <div class="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center">
          <span class="text-white text-xl font-bold">
            {{ authStore.userInitials }}
          </span>
        </div>
      </div>
    </div>

    <!-- Profile Form -->
    <div class="bg-white rounded-lg shadow-soft border border-gray-200">
      <div class="px-6 py-4 border-b border-gray-200">
        <h2 class="text-lg font-semibold text-gray-900">Personal Information</h2>
      </div>

      <form @submit.prevent="handleUpdateProfile" class="p-6 space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- First Name -->
          <div>
            <label for="firstName" class="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              id="firstName"
              v-model="profileForm.firstName"
              type="text"
              required
              :class="[
                'block w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors',
                errors.firstName ? 'border-error-500' : 'border-gray-300'
              ]"
              placeholder="Enter your first name"
            />
            <p v-if="errors.firstName" class="mt-1 text-sm text-error-600">
              {{ errors.firstName }}
            </p>
          </div>

          <!-- Last Name -->
          <div>
            <label for="lastName" class="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              id="lastName"
              v-model="profileForm.lastName"
              type="text"
              required
              :class="[
                'block w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors',
                errors.lastName ? 'border-error-500' : 'border-gray-300'
              ]"
              placeholder="Enter your last name"
            />
            <p v-if="errors.lastName" class="mt-1 text-sm text-error-600">
              {{ errors.lastName }}
            </p>
          </div>

          <!-- Email -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              v-model="profileForm.email"
              type="email"
              required
              :class="[
                'block w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors',
                errors.email ? 'border-error-500' : 'border-gray-300'
              ]"
              placeholder="Enter your email address"
            />
            <p v-if="errors.email" class="mt-1 text-sm text-error-600">
              {{ errors.email }}
            </p>
          </div>

          <!-- Role (Read-only) -->
          <div>
            <label for="role" class="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <input
              id="role"
              :value="authStore.user?.role"
              type="text"
              readonly
              class="block w-full px-3 py-2 border border-gray-300 bg-gray-50 text-gray-500 rounded-lg text-sm cursor-not-allowed"
            />
            <p class="mt-1 text-xs text-gray-500">
              Contact your administrator to change your role
            </p>
          </div>
        </div>

        <!-- Account Information -->
        <div class="pt-6 border-t border-gray-200">
          <h3 class="text-md font-semibold text-gray-900 mb-4">Account Information</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Account Created -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Member Since
              </label>
              <p class="text-sm text-gray-900">
                {{ formatDate(authStore.user?.createdAt) }}
              </p>
            </div>

            <!-- Last Login -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Last Login
              </label>
              <p class="text-sm text-gray-900">
                {{ formatDate(authStore.user?.lastLoginAt) || 'N/A' }}
              </p>
            </div>

            <!-- Tenant -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Organization
              </label>
              <p class="text-sm text-gray-900">
                {{ authStore.user?.tenantId || 'N/A' }}
              </p>
            </div>

            <!-- Account Status -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Account Status
              </label>
              <span
                :class="[
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  authStore.user?.isActive
                    ? 'bg-success-100 text-success-800'
                    : 'bg-error-100 text-error-800'
                ]"
              >
                <i
                  :class="[
                    'mr-1 text-xs',
                    authStore.user?.isActive ? 'pi pi-check' : 'pi pi-times'
                  ]"
                ></i>
                {{ authStore.user?.isActive ? 'Active' : 'Inactive' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            type="button"
            @click="resetForm"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
          >
            Reset Changes
          </button>

          <button
            type="submit"
            :disabled="isLoading || !hasChanges"
            class="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span v-if="!isLoading" class="flex items-center">
              <i class="pi pi-save mr-2"></i>
              Save Changes
            </span>
            <span v-else class="flex items-center">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </span>
          </button>
        </div>
      </form>
    </div>

    <!-- Success/Error Messages -->
    <div v-if="message" :class="[
      'rounded-lg border p-4',
      message.type === 'success'
        ? 'bg-success-50 border-success-200 text-success-800'
        : 'bg-error-50 border-error-200 text-error-800'
    ]">
      <div class="flex">
        <div class="flex-shrink-0">
          <i :class="[
            'text-lg',
            message.type === 'success' ? 'pi pi-check-circle' : 'pi pi-exclamation-triangle'
          ]"></i>
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium">{{ message.text }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@stores/auth'
import type { User } from '@/types/auth'

const authStore = useAuthStore()

const profileForm = ref({
  firstName: '',
  lastName: '',
  email: ''
})

const errors = ref<Record<string, string>>({})
const isLoading = ref(false)
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)

const hasChanges = computed(() => {
  if (!authStore.user) return false

  return (
    profileForm.value.firstName !== authStore.user.firstName ||
    profileForm.value.lastName !== authStore.user.lastName ||
    profileForm.value.email !== authStore.user.email
  )
})

const formatDate = (dateString?: string) => {
  if (!dateString) return null

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateString))
}

const validateForm = () => {
  errors.value = {}

  if (!profileForm.value.firstName.trim()) {
    errors.value.firstName = 'First name is required'
  }

  if (!profileForm.value.lastName.trim()) {
    errors.value.lastName = 'Last name is required'
  }

  if (!profileForm.value.email.trim()) {
    errors.value.email = 'Email is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.value.email)) {
    errors.value.email = 'Please enter a valid email address'
  }

  return Object.keys(errors.value).length === 0
}

const resetForm = () => {
  if (authStore.user) {
    profileForm.value = {
      firstName: authStore.user.firstName,
      lastName: authStore.user.lastName,
      email: authStore.user.email
    }
  }
  errors.value = {}
  message.value = null
}

const handleUpdateProfile = async () => {
  if (!validateForm()) return

  try {
    isLoading.value = true
    message.value = null

    await authStore.updateProfile({
      firstName: profileForm.value.firstName.trim(),
      lastName: profileForm.value.lastName.trim(),
      email: profileForm.value.email.trim()
    })

    message.value = {
      type: 'success',
      text: 'Profile updated successfully!'
    }

    // Clear success message after 5 seconds
    setTimeout(() => {
      message.value = null
    }, 5000)

  } catch (error: any) {
    message.value = {
      type: 'error',
      text: error.response?.data?.message || 'Failed to update profile'
    }
  } finally {
    isLoading.value = false
  }
}

// Initialize form with user data
onMounted(() => {
  resetForm()
})

// Watch for user changes (in case it loads asynchronously)
watch(
  () => authStore.user,
  (newUser) => {
    if (newUser) {
      resetForm()
    }
  },
  { immediate: true }
)
</script>