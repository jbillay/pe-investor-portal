import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiClient } from '@composables/useApi'
import type {
  User,
  LoginCredentials,
  LoginResponse,
  RefreshTokenResponse
} from '@/types/auth'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(localStorage.getItem('accessToken'))
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'))
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!user.value && !!accessToken.value)
  const userInitials = computed(() => {
    if (!user.value) return ''
    return `${user.value.firstName.charAt(0)}${user.value.lastName.charAt(0)}`.toUpperCase()
  })
  const userFullName = computed(() => {
    if (!user.value) return ''
    return `${user.value.firstName} ${user.value.lastName}`
  })

  // Actions
  async function login(credentials: LoginCredentials): Promise<void> {
    try {
      isLoading.value = true
      error.value = null

      console.log('Making login API call...')
      const response = await apiClient.post<LoginResponse>('/auth/login', credentials)
      console.log('Login API response:', response)

      // Handle both wrapped and direct API response formats
      let userData: User, token: string, refresh: string

      if (response.status === 'success' && response.data) {
        // Wrapped format: { status: 'success', data: { user, accessToken, refreshToken } }
        console.log('Using wrapped response format')
        const loginData = response.data
        userData = loginData.user
        token = loginData.accessToken
        refresh = loginData.refreshToken
      } else if ((response as any).user && (response as any).accessToken) {
        // Direct format: { user, accessToken, refreshToken, expiresIn }
        console.log('Using direct response format')
        const directResponse = response as any
        userData = directResponse.user
        token = directResponse.accessToken
        refresh = directResponse.refreshToken
      } else {
        console.error('Login response format unexpected:', response)
        throw new Error('Invalid login response format')
      }

      console.log('Setting auth state:', {
        userData,
        hasToken: !!token,
        hasRefresh: !!refresh
      })

      user.value = userData
      accessToken.value = token
      refreshToken.value = refresh

      // Store tokens in localStorage
      localStorage.setItem('accessToken', token)
      localStorage.setItem('refreshToken', refresh)
      localStorage.setItem('user', JSON.stringify(userData))

      console.log('Auth state updated:', {
        isAuthenticated: isAuthenticated.value,
        userSet: !!user.value,
        tokenSet: !!accessToken.value
      })
    } catch (err: any) {
      console.error('Login API error:', err)
      error.value = err.response?.data?.message || 'Login failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function logout(): Promise<void> {
    try {
      // Call logout endpoint if we have a token
      if (accessToken.value) {
        await apiClient.post('/auth/logout', {
          refreshToken: refreshToken.value
        })
      }
    } catch (err) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', err)
    } finally {
      // Clear state and localStorage
      user.value = null
      accessToken.value = null
      refreshToken.value = null
      error.value = null

      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
    }
  }

  async function refreshTokens(): Promise<void> {
    if (!refreshToken.value) {
      throw new Error('No refresh token available')
    }

    try {
      const response = await apiClient.post<RefreshTokenResponse>('/auth/refresh', {
        refreshToken: refreshToken.value
      })

      if (response.status === 'success' && response.data) {
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data

        accessToken.value = newAccessToken
        refreshToken.value = newRefreshToken

        localStorage.setItem('accessToken', newAccessToken)
        localStorage.setItem('refreshToken', newRefreshToken)
      }
    } catch (err) {
      // If refresh fails, clear all auth data
      await logout()
      throw err
    }
  }

  async function getCurrentUser(): Promise<void> {
    if (!accessToken.value) return

    try {
      isLoading.value = true
      console.log('Fetching current user...')
      const response = await apiClient.get<User>('/auth/profile')
      console.log('getCurrentUser API response:', response)

      // Handle both wrapped and direct response formats
      let userData: User

      if (response.status === 'success' && response.data) {
        // Wrapped format
        userData = response.data
        console.log('Using wrapped format for getCurrentUser')
      } else if ((response as any).id && (response as any).email) {
        // Direct format (user object directly)
        userData = response as any
        console.log('Using direct format for getCurrentUser')
      } else {
        console.error('getCurrentUser response format unexpected:', response)
        throw new Error('Invalid getCurrentUser response format')
      }

      user.value = userData
      localStorage.setItem('user', JSON.stringify(userData))
      console.log('User data updated:', userData)
    } catch (err: any) {
      console.error('getCurrentUser API error:', err)
      error.value = err.response?.data?.message || 'Failed to get user data'
      // If getting current user fails, tokens might be invalid
      if (err.response?.status === 401) {
        console.log('Token invalid, logging out...')
        await logout()
      } else {
        // For non-401 errors, don't logout - just throw the error
        throw err
      }
    } finally {
      isLoading.value = false
    }
  }

  async function updateProfile(profileData: Partial<User>): Promise<void> {
    try {
      isLoading.value = true
      error.value = null

      const response = await apiClient.patch<User>('/auth/profile', profileData)

      if (response.status === 'success' && response.data) {
        user.value = response.data
        localStorage.setItem('user', JSON.stringify(response.data))
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to update profile'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Initialize auth state from localStorage
  function initializeAuth(): void {
    const storedUser = localStorage.getItem('user')
    if (storedUser && accessToken.value) {
      try {
        const parsedUser = JSON.parse(storedUser)
        user.value = parsedUser
        console.log('Auth initialized from localStorage:', {
          userId: parsedUser.id,
          email: parsedUser.email,
          isAuthenticated: isAuthenticated.value
        })
      } catch (err) {
        console.warn('Failed to parse stored user data:', err)
        logout()
      }
    } else {
      console.log('No stored user data or access token found')
    }
  }

  // Clear any auth errors
  function clearError(): void {
    error.value = null
  }

  return {
    // State
    user,
    accessToken,
    refreshToken,
    isLoading,
    error,

    // Getters
    isAuthenticated,
    userInitials,
    userFullName,

    // Actions
    login,
    logout,
    refreshTokens,
    getCurrentUser,
    updateProfile,
    initializeAuth,
    clearError
  }
})
