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
          Sign in to your account
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          Welcome back to PE Investor Portal
        </p>
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleLogin" class="mt-8 space-y-6">
        <div class="space-y-4">
          <!-- Email Field -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i class="pi pi-envelope text-gray-400"></i>
              </div>
              <input
                id="email"
                v-model="form.email"
                type="email"
                autocomplete="email"
                required
                :class="[
                  'block w-full pl-10 pr-3 py-3 border rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors',
                  emailError ? 'border-error-500 focus:ring-error-500' : 'border-gray-300'
                ]"
                placeholder="Enter your email"
                @blur="validateEmail"
                @input="clearFieldError('email')"
              />
            </div>
            <p v-if="emailError" class="mt-1 text-sm text-error-600">
              {{ emailError }}
            </p>
          </div>

          <!-- Password Field -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i class="pi pi-lock text-gray-400"></i>
              </div>
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                required
                :class="[
                  'block w-full pl-10 pr-10 py-3 border rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors',
                  passwordError ? 'border-error-500 focus:ring-error-500' : 'border-gray-300'
                ]"
                placeholder="Enter your password"
                @blur="validatePassword"
                @input="clearFieldError('password')"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'" class="text-gray-400 hover:text-gray-600"></i>
              </button>
            </div>
            <p v-if="passwordError" class="mt-1 text-sm text-error-600">
              {{ passwordError }}
            </p>
          </div>
        </div>

        <!-- Remember Me & Forgot Password -->
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <input
              id="remember-me"
              v-model="form.rememberMe"
              type="checkbox"
              class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label for="remember-me" class="ml-2 block text-sm text-gray-700">
              Remember me
            </label>
          </div>

          <div class="text-sm">
            <router-link
              to="/forgot-password"
              class="font-medium text-primary-600 hover:text-primary-500 transition-colors"
            >
              Forgot your password?
            </router-link>
          </div>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="isLoading || !isFormValid"
          class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span v-if="!isLoading" class="flex items-center">
            <i class="pi pi-sign-in mr-2"></i>
            Sign in
          </span>
          <span v-else class="flex items-center">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Signing in...
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
                Sign in failed
              </h3>
              <div class="mt-2 text-sm text-error-700">
                {{ authStore.error }}
              </div>
            </div>
          </div>
        </div>
      </form>

      <!-- Footer -->
      <div class="text-center">
        <p class="text-sm text-gray-600">
          Don't have an account?
          <router-link
            to="/register"
            class="font-medium text-primary-600 hover:text-primary-500 transition-colors"
          >
            Contact your administrator
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@stores/auth'
import type { LoginCredentials } from '@/types/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const form = ref<LoginCredentials & { rememberMe: boolean }>({
  email: '',
  password: '',
  rememberMe: false
})

const showPassword = ref(false)
const emailError = ref('')
const passwordError = ref('')
const fieldErrors = ref<Record<string, string>>({})

const isLoading = computed(() => authStore.isLoading)

const isFormValid = computed(() => {
  return (
    form.value.email &&
    form.value.password &&
    !emailError.value &&
    !passwordError.value
  )
})

const validateEmail = () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!form.value.email) {
    emailError.value = 'Email is required'
  } else if (!emailRegex.test(form.value.email)) {
    emailError.value = 'Please enter a valid email address'
  } else {
    emailError.value = ''
  }
}

const validatePassword = () => {
  if (!form.value.password) {
    passwordError.value = 'Password is required'
  } else if (form.value.password.length < 6) {
    passwordError.value = 'Password must be at least 6 characters'
  } else {
    passwordError.value = ''
  }
}

const clearFieldError = (field: string) => {
  if (field === 'email') emailError.value = ''
  if (field === 'password') passwordError.value = ''
  authStore.clearError()
}

const handleLogin = async () => {
  // Validate form before submission
  validateEmail()
  validatePassword()

  if (!isFormValid.value) return

  try {
    await authStore.login({
      email: form.value.email,
      password: form.value.password
    })

    console.log('Login successful, auth state:', {
      isAuthenticated: authStore.isAuthenticated,
      user: authStore.user,
      accessToken: !!authStore.accessToken
    })

    // Redirect to intended page or dashboard
    const redirectTo = route.query.redirect as string || '/'
    console.log('Attempting to redirect to:', redirectTo)
    await router.push(redirectTo)
    console.log('Router push completed')
  } catch (error) {
    // Error is handled by the auth store and will be displayed
    console.error('Login error:', error)
  }
}

// Clear any existing errors when component mounts
onMounted(() => {
  authStore.clearError()
})
</script>
