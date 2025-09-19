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

      // Fetch basic user profile
      const profileResponse = await apiClient.get<User>('/auth/profile')
      console.log('getCurrentUser API response:', profileResponse)

      // Handle both wrapped and direct response formats for profile
      let userData: User

      if (profileResponse.status === 'success' && profileResponse.data) {
        // Wrapped format
        userData = profileResponse.data
        console.log('Using wrapped format for getCurrentUser')
      } else if ((profileResponse as any).id && (profileResponse as any).email) {
        // Direct format (user object directly)
        userData = profileResponse as any
        console.log('Using direct format for getCurrentUser')
      } else {
        console.error('getCurrentUser response format unexpected:', profileResponse)
        throw new Error('Invalid getCurrentUser response format')
      }

      // Fetch user roles and permissions
      try {
        console.log('Fetching user roles and permissions...')
        const rolesResponse = await apiClient.get('admin/roles/me/roles')
        console.log('User roles API response:', rolesResponse)

        // Handle both wrapped and direct response formats for roles
        let rolesData: any

        if (rolesResponse.status === 'success' && rolesResponse.data) {
          // Wrapped format
          rolesData = rolesResponse.data
        } else if ((rolesResponse as any).roles) {
          // Direct format
          rolesData = rolesResponse as any
        } else {
          console.warn('No roles data found in response, using empty roles')
          rolesData = { roles: [], permissions: [] }
        }

        // Extract role names and permissions
        const roles = rolesData.roles?.map((role: any) => role.name || role) || []
        const permissions = rolesData.permissions?.map((perm: any) => perm.name || perm) || []

        // Merge user data with roles and permissions
        userData = {
          ...userData,
          roles,
          permissions
        }

        console.log('User roles and permissions:', { roles, permissions })

      } catch (rolesError: any) {
        console.warn('Failed to fetch user roles, continuing without roles:', rolesError)
        // Continue with basic user data even if roles fetch fails
        userData = {
          ...userData,
          roles: [],
          permissions: []
        }
      }

      user.value = userData
      localStorage.setItem('user', JSON.stringify(userData))
      console.log('User data updated with roles:', userData)

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
          roles: parsedUser.roles,
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

  // Refresh user roles and permissions only
  async function refreshUserRoles(): Promise<void> {
    if (!accessToken.value || !user.value) return

    try {
      console.log('Refreshing user roles and permissions...')
      const rolesResponse = await apiClient.get('/roles/me/roles')
      console.log('User roles refresh response:', rolesResponse)

      // Handle both wrapped and direct response formats for roles
      let rolesData: any

      if (rolesResponse.status === 'success' && rolesResponse.data) {
        // Wrapped format
        rolesData = rolesResponse.data
      } else if ((rolesResponse as any).roles) {
        // Direct format
        rolesData = rolesResponse as any
      } else {
        console.warn('No roles data found in response, using empty roles')
        rolesData = { roles: [], permissions: [] }
      }

      // Extract role names and permissions
      const roles = rolesData.roles?.map((role: any) => role.name || role) || []
      const permissions = rolesData.permissions?.map((perm: any) => perm.name || perm) || []

      // Update user data with new roles and permissions
      user.value = {
        ...user.value,
        roles,
        permissions
      }

      localStorage.setItem('user', JSON.stringify(user.value))
      console.log('User roles refreshed:', { roles, permissions })

    } catch (rolesError: any) {
      console.warn('Failed to refresh user roles:', rolesError)
      // Don't throw error, just log it
    }
  }

  // Check if user has a specific role
  function hasRole(roleName: string): boolean {
    return user.value?.roles?.includes(roleName) || false
  }

  // Check if user has a specific permission
  function hasPermission(permissionName: string): boolean {
    return user.value?.permissions?.includes(permissionName) || false
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
    refreshUserRoles,
    hasRole,
    hasPermission,
    clearError
  }
})
