<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- Header -->
      <div class="text-center">
        <div class="flex justify-center">
          <div class="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
            <span class="text-white font-bold text-lg">PI</span>
          </div>
        </div>
        <h2 class="mt-6 text-3xl font-bold text-gray-900">
          Set Your Password
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          Please change your temporary password to continue
        </p>
        <div class="mt-4 rounded-lg bg-primary-50 border border-primary-200 p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <i class="pi pi-info-circle text-primary-400"></i>
            </div>
            <div class="ml-3">
              <p class="text-sm text-primary-700">
                Your password must be at least 12 characters long and include uppercase, lowercase, numbers, and special characters.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Set Password Form -->
      <form @submit.prevent="handleSetPassword" class="mt-8 space-y-6">
        <div class="space-y-4">
          <!-- Temporary Password Field -->
          <div>
            <label for="tempPassword" class="block text-sm font-medium text-gray-700 mb-1">
              Temporary Password
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i class="pi pi-key text-gray-400"></i>
              </div>
              <input
                id="tempPassword"
                v-model="form.tempPassword"
                :type="showTempPassword ? 'text' : 'password'"
                autocomplete="current-password"
                required
                :class="[
                  'block w-full pl-10 pr-10 py-3 border rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors',
                  fieldErrors.tempPassword ? 'border-error-500 focus:ring-error-500' : 'border-gray-300'
                ]"
                placeholder="Enter your temporary password"
                @blur="validateTempPassword"
                @input="clearFieldError('tempPassword')"
              />
              <button
                type="button"
                @click="showTempPassword = !showTempPassword"
                class="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <i :class="showTempPassword ? 'pi pi-eye-slash' : 'pi pi-eye'" class="text-gray-400 hover:text-gray-600"></i>
              </button>
            </div>
            <p v-if="fieldErrors.tempPassword" class="mt-1 text-sm text-error-600">
              {{ fieldErrors.tempPassword }}
            </p>
          </div>

          <!-- New Password Field -->
          <div>
            <label for="newPassword" class="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i class="pi pi-lock text-gray-400"></i>
              </div>
              <input
                id="newPassword"
                v-model="form.newPassword"
                :type="showNewPassword ? 'text' : 'password'"
                autocomplete="new-password"
                required
                :class="[
                  'block w-full pl-10 pr-10 py-3 border rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors',
                  fieldErrors.newPassword ? 'border-error-500 focus:ring-error-500' : 'border-gray-300'
                ]"
                placeholder="Enter your new password"
                @blur="validateNewPassword"
                @input="handleNewPasswordInput"
              />
              <button
                type="button"
                @click="showNewPassword = !showNewPassword"
                class="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <i :class="showNewPassword ? 'pi pi-eye-slash' : 'pi pi-eye'" class="text-gray-400 hover:text-gray-600"></i>
              </button>
            </div>

            <!-- Password Strength Indicator -->
            <div v-if="form.newPassword" class="mt-2">
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-medium text-gray-700">Password Strength:</span>
                <span :class="[
                  'text-xs font-medium',
                  passwordStrength.color
                ]">
                  {{ passwordStrength.label }}
                </span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div
                  :class="[
                    'h-2 rounded-full transition-all duration-300',
                    passwordStrength.bgColor
                  ]"
                  :style="{ width: `${passwordStrength.percentage}%` }"
                ></div>
              </div>
            </div>

            <p v-if="fieldErrors.newPassword" class="mt-1 text-sm text-error-600">
              {{ fieldErrors.newPassword }}
            </p>

            <!-- Password Requirements -->
            <div v-if="form.newPassword" class="mt-2 space-y-1">
              <div class="flex items-center text-xs" :class="passwordRequirements.length ? 'text-success-600' : 'text-gray-500'">
                <i :class="passwordRequirements.length ? 'pi pi-check-circle' : 'pi pi-circle'" class="mr-2"></i>
                At least 12 characters
              </div>
              <div class="flex items-center text-xs" :class="passwordRequirements.uppercase ? 'text-success-600' : 'text-gray-500'">
                <i :class="passwordRequirements.uppercase ? 'pi pi-check-circle' : 'pi pi-circle'" class="mr-2"></i>
                One uppercase letter
              </div>
              <div class="flex items-center text-xs" :class="passwordRequirements.lowercase ? 'text-success-600' : 'text-gray-500'">
                <i :class="passwordRequirements.lowercase ? 'pi pi-check-circle' : 'pi pi-circle'" class="mr-2"></i>
                One lowercase letter
              </div>
              <div class="flex items-center text-xs" :class="passwordRequirements.number ? 'text-success-600' : 'text-gray-500'">
                <i :class="passwordRequirements.number ? 'pi pi-check-circle' : 'pi pi-circle'" class="mr-2"></i>
                One number
              </div>
              <div class="flex items-center text-xs" :class="passwordRequirements.special ? 'text-success-600' : 'text-gray-500'">
                <i :class="passwordRequirements.special ? 'pi pi-check-circle' : 'pi pi-circle'" class="mr-2"></i>
                One special character
              </div>
            </div>
          </div>

          <!-- Confirm Password Field -->
          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i class="pi pi-lock text-gray-400"></i>
              </div>
              <input
                id="confirmPassword"
                v-model="form.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                autocomplete="new-password"
                required
                :class="[
                  'block w-full pl-10 pr-10 py-3 border rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors',
                  fieldErrors.confirmPassword ? 'border-error-500 focus:ring-error-500' : 'border-gray-300'
                ]"
                placeholder="Confirm your new password"
                @blur="validateConfirmPassword"
                @input="clearFieldError('confirmPassword')"
              />
              <button
                type="button"
                @click="showConfirmPassword = !showConfirmPassword"
                class="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <i :class="showConfirmPassword ? 'pi pi-eye-slash' : 'pi pi-eye'" class="text-gray-400 hover:text-gray-600"></i>
              </button>
            </div>
            <p v-if="fieldErrors.confirmPassword" class="mt-1 text-sm text-error-600">
              {{ fieldErrors.confirmPassword }}
            </p>
          </div>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="isLoading || !isFormValid"
          class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span v-if="!isLoading" class="flex items-center">
            <i class="pi pi-check mr-2"></i>
            Set Password
          </span>
          <span v-else class="flex items-center">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Setting password...
          </span>
        </button>

        <!-- Error Message -->
        <div v-if="authStore.error" class="rounded-lg bg-error-50 border border-error-200 p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <i class="pi pi-exclamation-triangle text-error-400"></i>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-error-800">
                Failed to set password
              </h3>
              <div class="mt-2 text-sm text-error-700">
                {{ authStore.error }}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, toRef } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@stores/auth'
import { usePasswordStrength, getPasswordRequirementDescriptions } from '@composables/usePasswordStrength'
import type { SetPasswordRequest } from '@/types/auth'

const router = useRouter()
const authStore = useAuthStore()

const form = ref<SetPasswordRequest>({
  tempPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const showTempPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

const fieldErrors = ref<Record<string, string>>({
  tempPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const isLoading = computed(() => authStore.isLoading)

// Use password strength composable
const newPasswordRef = toRef(form.value, 'newPassword')
const {
  requirements: passwordRequirements,
  strength: passwordStrength,
  meetsAllRequirements,
  validatePassword,
  checkPasswordMatch,
  cannotBeTemporaryPassword
} = usePasswordStrength(newPasswordRef)

const isFormValid = computed(() => {
  return (
    form.value.tempPassword &&
    form.value.newPassword &&
    form.value.confirmPassword &&
    !fieldErrors.value.tempPassword &&
    !fieldErrors.value.newPassword &&
    !fieldErrors.value.confirmPassword &&
    meetsAllRequirements.value &&
    form.value.newPassword === form.value.confirmPassword
  )
})

const validateTempPassword = () => {
  if (!form.value.tempPassword) {
    fieldErrors.value.tempPassword = 'Temporary password is required'
  } else {
    fieldErrors.value.tempPassword = ''
  }
}

const validateNewPassword = () => {
  if (!form.value.newPassword) {
    fieldErrors.value.newPassword = 'New password is required'
    return
  }

  if (!meetsAllRequirements.value) {
    fieldErrors.value.newPassword = 'Password does not meet all requirements'
    return
  }

  if (!cannotBeTemporaryPassword(form.value.newPassword, form.value.tempPassword)) {
    fieldErrors.value.newPassword = 'New password must be different from temporary password'
    return
  }

  fieldErrors.value.newPassword = ''

  // Re-validate confirm password if it has been filled
  if (form.value.confirmPassword) {
    validateConfirmPassword()
  }
}

const validateConfirmPassword = () => {
  if (!form.value.confirmPassword) {
    fieldErrors.value.confirmPassword = 'Please confirm your new password'
  } else if (!checkPasswordMatch(form.value.newPassword, form.value.confirmPassword)) {
    fieldErrors.value.confirmPassword = 'Passwords do not match'
  } else {
    fieldErrors.value.confirmPassword = ''
  }
}

const clearFieldError = (field: string) => {
  fieldErrors.value[field] = ''
  authStore.clearError()
}

const handleNewPasswordInput = () => {
  clearFieldError('newPassword')
  // Re-validate confirm password if it has been filled
  if (form.value.confirmPassword) {
    validateConfirmPassword()
  }
}

const handleSetPassword = async () => {
  // Validate all fields before submission
  validateTempPassword()
  validateNewPassword()
  validateConfirmPassword()

  if (!isFormValid.value) return

  try {
    await authStore.setPassword({
      tempPassword: form.value.tempPassword,
      newPassword: form.value.newPassword,
      confirmPassword: form.value.confirmPassword
    })

    console.log('Password set successfully, redirecting to dashboard...')

    // Redirect to dashboard after successful password change
    await router.push('/')
  } catch (error: any) {
    console.error('Set password error:', error)
    // Error is handled by the auth store and will be displayed
  }
}

// Clear any existing errors when component mounts
onMounted(() => {
  authStore.clearError()

  // Redirect if user doesn't need to change password
  if (!authStore.requiresPasswordChange) {
    router.push('/')
  }
})
</script>
