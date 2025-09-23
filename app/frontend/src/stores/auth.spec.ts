import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mockUser, mockLoginResponse, mockLocalStorage } from '../__tests__/utils/test-utils'

// Mock API client
const mockApiClient = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn()
}

// Mock the API client module
vi.mock('@composables/useApi', () => ({
  apiClient: mockApiClient
}))

// Import after mocking
const { useAuthStore } = await import('./auth')

describe('Auth Store', () => {
  let authStore: ReturnType<typeof useAuthStore>
  let mockStorage: ReturnType<typeof mockLocalStorage>

  beforeEach(() => {
    setActivePinia(createPinia())

    // Mock localStorage
    mockStorage = mockLocalStorage()
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      writable: true
    })

    // Clear all mocks
    vi.clearAllMocks()

    // Create fresh store instance after clearing mocks
    authStore = useAuthStore()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      expect(authStore.user).toBeNull()
      expect(authStore.accessToken).toBeNull()
      expect(authStore.refreshToken).toBeNull()
      expect(authStore.isLoading).toBe(false)
      expect(authStore.error).toBeNull()
      expect(authStore.isAuthenticated).toBe(false)
    })

    it('should initialize with stored tokens', () => {
      // Mock localStorage with stored tokens
      mockStorage.getItem.mockImplementation((key: string) => {
        switch (key) {
          case 'accessToken': return 'stored-access-token'
          case 'refreshToken': return 'stored-refresh-token'
          case 'user': return JSON.stringify(mockUser)
          default: return null
        }
      })

      // Create new store instance to trigger initialization
      setActivePinia(createPinia())
      const newAuthStore = useAuthStore()

      expect(newAuthStore.accessToken).toBe('stored-access-token')
      expect(newAuthStore.refreshToken).toBe('stored-refresh-token')
    })
  })

  describe('Computed Properties', () => {
    beforeEach(() => {
      // Set up authenticated state
      authStore.user = mockUser
      authStore.accessToken = 'test-token'
    })

    it('should compute isAuthenticated correctly', () => {
      expect(authStore.isAuthenticated).toBe(true)

      authStore.user = null
      expect(authStore.isAuthenticated).toBe(false)

      authStore.user = mockUser
      authStore.accessToken = null
      expect(authStore.isAuthenticated).toBe(false)
    })

    it('should compute userInitials correctly', () => {
      expect(authStore.userInitials).toBe('JD') // John Doe

      authStore.user = null
      expect(authStore.userInitials).toBe('')
    })

    it('should compute userFullName correctly', () => {
      expect(authStore.userFullName).toBe('John Doe')

      authStore.user = null
      expect(authStore.userFullName).toBe('')
    })
  })

  describe('Login Action', () => {
    const loginCredentials = {
      email: 'test@example.com',
      password: 'password123'
    }

    const mockRolesResponse = {
      status: 'success' as const,
      data: {
        roles: [{ name: 'INVESTOR' }, { name: 'USER' }],
        permissions: [{ name: 'READ_PROFILE' }, { name: 'UPDATE_PROFILE' }]
      }
    }

    it('should login successfully with roles and permissions', async () => {
      mockApiClient.post.mockResolvedValue(mockLoginResponse)
      mockApiClient.get.mockResolvedValue(mockRolesResponse)

      await authStore.login(loginCredentials)

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/login', loginCredentials)
      expect(mockApiClient.get).toHaveBeenCalledWith('admin/roles/me/roles')

      expect(authStore.user).toEqual({
        ...mockUser,
        roles: ['INVESTOR', 'USER'],
        permissions: ['READ_PROFILE', 'UPDATE_PROFILE']
      })
      expect(authStore.accessToken).toBe('mock-access-token')
      expect(authStore.refreshToken).toBe('mock-refresh-token')
      expect(authStore.error).toBeNull()
      expect(authStore.isLoading).toBe(false)

      // Check localStorage calls
      expect(mockStorage.setItem).toHaveBeenCalledWith('accessToken', 'mock-access-token')
      expect(mockStorage.setItem).toHaveBeenCalledWith('refreshToken', 'mock-refresh-token')
      expect(mockStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify({
        ...mockUser,
        roles: ['INVESTOR', 'USER'],
        permissions: ['READ_PROFILE', 'UPDATE_PROFILE']
      }))
    })

    it('should login successfully even if roles fetch fails', async () => {
      mockApiClient.post.mockResolvedValue(mockLoginResponse)
      mockApiClient.get.mockRejectedValue(new Error('Roles fetch failed'))

      await authStore.login(loginCredentials)

      expect(authStore.user).toEqual({
        ...mockUser,
        roles: [],
        permissions: []
      })
      expect(authStore.accessToken).toBe('mock-access-token')
      expect(authStore.refreshToken).toBe('mock-refresh-token')
    })

    it('should handle direct response format', async () => {
      const directLoginResponse = {
        user: mockUser,
        accessToken: 'direct-access-token',
        refreshToken: 'direct-refresh-token'
      }

      mockApiClient.post.mockResolvedValue(directLoginResponse)
      mockApiClient.get.mockResolvedValue(mockRolesResponse)

      await authStore.login(loginCredentials)

      expect(authStore.accessToken).toBe('direct-access-token')
      expect(authStore.refreshToken).toBe('direct-refresh-token')
    })

    it('should handle login failure', async () => {
      const errorMessage = 'Invalid credentials'
      mockApiClient.post.mockRejectedValue({
        response: { data: { message: errorMessage } }
      })

      await expect(authStore.login(loginCredentials)).rejects.toThrow()

      expect(authStore.user).toBeNull()
      expect(authStore.error).toBe(errorMessage)
      expect(authStore.isLoading).toBe(false)
    })

    it('should set loading state during login', async () => {
      let resolveLogin: (value: any) => void
      const loginPromise = new Promise(resolve => {
        resolveLogin = resolve
      })
      mockApiClient.post.mockReturnValue(loginPromise)

      const loginCall = authStore.login(loginCredentials)

      expect(authStore.isLoading).toBe(true)

      resolveLogin!(mockLoginResponse)
      await loginCall

      expect(authStore.isLoading).toBe(false)
    })
  })

  describe('Logout Action', () => {
    beforeEach(() => {
      // Set up authenticated state
      authStore.user = mockUser
      authStore.accessToken = 'test-token'
      authStore.refreshToken = 'refresh-token'
    })

    it('should logout successfully', async () => {
      mockApiClient.post.mockResolvedValue({ status: 'success' })

      await authStore.logout()

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/logout', {
        refreshToken: 'refresh-token'
      })
      expect(authStore.user).toBeNull()
      expect(authStore.accessToken).toBeNull()
      expect(authStore.refreshToken).toBeNull()
      expect(authStore.error).toBeNull()

      // Check localStorage calls
      expect(mockStorage.removeItem).toHaveBeenCalledWith('accessToken')
      expect(mockStorage.removeItem).toHaveBeenCalledWith('refreshToken')
      expect(mockStorage.removeItem).toHaveBeenCalledWith('user')
    })

    it('should logout even if API call fails', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Network error'))
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      await authStore.logout()

      expect(authStore.user).toBeNull()
      expect(authStore.accessToken).toBeNull()
      expect(authStore.refreshToken).toBeNull()
      expect(consoleSpy).toHaveBeenCalledWith('Logout API call failed:', expect.any(Error))

      consoleSpy.mockRestore()
    })
  })

  describe('Refresh Token Action', () => {
    beforeEach(() => {
      authStore.refreshToken = 'valid-refresh-token'
    })

    it('should refresh tokens successfully', async () => {
      const refreshResponse = {
        status: 'success' as const,
        data: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token'
        }
      }
      mockApiClient.post.mockResolvedValue(refreshResponse)

      await authStore.refreshTokens()

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/refresh', {
        refreshToken: 'valid-refresh-token'
      })
      expect(authStore.accessToken).toBe('new-access-token')
      expect(authStore.refreshToken).toBe('new-refresh-token')

      expect(mockStorage.setItem).toHaveBeenCalledWith('accessToken', 'new-access-token')
      expect(mockStorage.setItem).toHaveBeenCalledWith('refreshToken', 'new-refresh-token')
    })

    it('should throw error if no refresh token available', async () => {
      authStore.refreshToken = null

      await expect(authStore.refreshTokens()).rejects.toThrow('No refresh token available')
    })

    it('should logout on refresh failure', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Refresh failed'))

      // Mock logout to track if it's called
      let logoutCalled = false
      const originalLogout = authStore.logout
      authStore.logout = vi.fn(async () => {
        logoutCalled = true
        return originalLogout.call(authStore)
      })

      await expect(authStore.refreshTokens()).rejects.toThrow()
      expect(logoutCalled).toBe(true)

      // Restore original method
      authStore.logout = originalLogout
    })
  })

  describe('Get Current User Action', () => {
    beforeEach(() => {
      authStore.accessToken = 'valid-token'
    })

    const mockRolesResponse = {
      status: 'success' as const,
      data: {
        roles: [{ name: 'INVESTOR' }],
        permissions: [{ name: 'READ_PROFILE' }]
      }
    }

    it('should get current user successfully with roles and permissions', async () => {
      const userResponse = {
        status: 'success' as const,
        data: mockUser
      }
      mockApiClient.get
        .mockResolvedValueOnce(userResponse) // profile call
        .mockResolvedValueOnce(mockRolesResponse) // roles call

      await authStore.getCurrentUser()

      expect(mockApiClient.get).toHaveBeenCalledWith('/auth/profile')
      expect(mockApiClient.get).toHaveBeenCalledWith('admin/roles/me/roles')

      expect(authStore.user).toEqual({
        ...mockUser,
        roles: ['INVESTOR'],
        permissions: ['READ_PROFILE']
      })
      expect(authStore.isLoading).toBe(false)
      expect(mockStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify({
        ...mockUser,
        roles: ['INVESTOR'],
        permissions: ['READ_PROFILE']
      }))
    })

    it('should handle direct response format', async () => {
      const directUserResponse = {
        ...mockUser,
        id: mockUser.id,
        email: mockUser.email
      }

      mockApiClient.get
        .mockResolvedValueOnce(directUserResponse)
        .mockResolvedValueOnce(mockRolesResponse)

      await authStore.getCurrentUser()

      expect(authStore.user).toEqual({
        ...mockUser,
        roles: ['INVESTOR'],
        permissions: ['READ_PROFILE']
      })
    })

    it('should not fetch user if no access token', async () => {
      authStore.accessToken = null

      await authStore.getCurrentUser()

      expect(mockApiClient.get).not.toHaveBeenCalled()
    })

    it('should logout on 401 error', async () => {
      mockApiClient.get.mockRejectedValue({
        response: { status: 401, data: { message: 'Unauthorized' } }
      })

      // Mock logout to track if it's called
      let logoutCalled = false
      const originalLogout = authStore.logout
      authStore.logout = vi.fn(async () => {
        logoutCalled = true
        return originalLogout.call(authStore)
      })

      await authStore.getCurrentUser()

      expect(logoutCalled).toBe(true)
      expect(authStore.error).toBe('Unauthorized')

      // Restore original method
      authStore.logout = originalLogout
    })
  })

  describe('Update Profile Action', () => {
    const profileData = {
      firstName: 'Jane',
      lastName: 'Smith'
    }

    it('should update profile successfully', async () => {
      const updatedUser = { ...mockUser, ...profileData }
      const updateResponse = {
        status: 'success' as const,
        data: updatedUser
      }
      mockApiClient.patch.mockResolvedValue(updateResponse)

      await authStore.updateProfile(profileData)

      expect(mockApiClient.patch).toHaveBeenCalledWith('/auth/profile', profileData)
      expect(authStore.user).toEqual(updatedUser)
      expect(authStore.isLoading).toBe(false)
      expect(mockStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(updatedUser))
    })

    it('should handle update profile failure', async () => {
      const errorMessage = 'Validation failed'
      mockApiClient.patch.mockRejectedValue({
        response: { data: { message: errorMessage } }
      })

      await expect(authStore.updateProfile(profileData)).rejects.toThrow()
      expect(authStore.error).toBe(errorMessage)
      expect(authStore.isLoading).toBe(false)
    })
  })

  describe('Initialize Auth', () => {
    it('should initialize with valid stored user data', () => {
      // Set up localStorage mock to return stored data
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: vi.fn((key: string) => {
            if (key === 'user') return JSON.stringify(mockUser)
            if (key === 'accessToken') return 'stored-token'
            if (key === 'refreshToken') return 'stored-refresh-token'
            return null
          }),
          setItem: vi.fn(),
          removeItem: vi.fn(),
          clear: vi.fn()
        },
        writable: true
      })

      // Create a new store instance that will use the mocked localStorage
      setActivePinia(createPinia())
      const newAuthStore = useAuthStore()
      newAuthStore.initializeAuth()

      expect(newAuthStore.user).toEqual(mockUser)
    })

    it('should logout on invalid stored user data', () => {
      // Mock logout to track if it's called
      let logoutCalled = false
      const originalLogout = authStore.logout
      authStore.logout = vi.fn(async () => {
        logoutCalled = true
        return originalLogout.call(authStore)
      })

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // Set up localStorage to return invalid JSON
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: vi.fn((key: string) => {
            if (key === 'user') return 'invalid-json'
            if (key === 'accessToken') return 'stored-token'
            return null
          }),
          setItem: vi.fn(),
          removeItem: vi.fn(),
          clear: vi.fn()
        },
        writable: true
      })

      authStore.initializeAuth()

      expect(logoutCalled).toBe(true)
      expect(consoleSpy).toHaveBeenCalledWith('Failed to parse stored user data:', expect.any(SyntaxError))

      // Restore original method
      authStore.logout = originalLogout
      consoleSpy.mockRestore()
    })
  })

  describe('Role and Permission Checking', () => {
    beforeEach(() => {
      authStore.user = {
        ...mockUser,
        roles: ['INVESTOR', 'USER'],
        permissions: ['READ_PROFILE', 'UPDATE_PROFILE']
      }
    })

    it('should check if user has role correctly', () => {
      expect(authStore.hasRole('INVESTOR')).toBe(true)
      expect(authStore.hasRole('ADMIN')).toBe(false)
    })

    it('should check if user has permission correctly', () => {
      expect(authStore.hasPermission('READ_PROFILE')).toBe(true)
      expect(authStore.hasPermission('DELETE_USER')).toBe(false)
    })

    it('should return false for roles/permissions when user is null', () => {
      authStore.user = null

      expect(authStore.hasRole('INVESTOR')).toBe(false)
      expect(authStore.hasPermission('READ_PROFILE')).toBe(false)
    })
  })

  describe('Refresh User Roles', () => {
    beforeEach(() => {
      authStore.accessToken = 'valid-token'
      authStore.user = {
        ...mockUser,
        roles: ['OLD_ROLE'],
        permissions: ['OLD_PERMISSION']
      }
    })

    it('should refresh user roles successfully', async () => {
      const rolesResponse = {
        status: 'success' as const,
        data: {
          roles: [{ name: 'NEW_ROLE' }],
          permissions: [{ name: 'NEW_PERMISSION' }]
        }
      }
      mockApiClient.get.mockResolvedValue(rolesResponse)

      await authStore.refreshUserRoles()

      expect(mockApiClient.get).toHaveBeenCalledWith('/roles/me/roles')
      expect(authStore.user?.roles).toEqual(['NEW_ROLE'])
      expect(authStore.user?.permissions).toEqual(['NEW_PERMISSION'])
    })

    it('should handle refresh roles failure gracefully', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Failed to fetch'))
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      await authStore.refreshUserRoles()

      expect(consoleSpy).toHaveBeenCalledWith('Failed to refresh user roles:', expect.any(Error))
      consoleSpy.mockRestore()
    })

    it('should not refresh if no token or user', async () => {
      authStore.accessToken = null

      await authStore.refreshUserRoles()

      expect(mockApiClient.get).not.toHaveBeenCalled()
    })
  })

  describe('Update Profile Action', () => {
    const profileData = {
      firstName: 'Jane',
      lastName: 'Smith'
    }

    beforeEach(() => {
      authStore.user = {
        ...mockUser,
        roles: ['INVESTOR'],
        permissions: ['READ_PROFILE']
      }
    })

    it('should update profile and preserve roles/permissions', async () => {
      const updatedUser = { ...mockUser, ...profileData }
      const updateResponse = {
        status: 'success' as const,
        data: updatedUser
      }
      mockApiClient.patch.mockResolvedValue(updateResponse)

      await authStore.updateProfile(profileData)

      expect(mockApiClient.patch).toHaveBeenCalledWith('/auth/profile', profileData)
      expect(authStore.user).toEqual({
        ...updatedUser,
        roles: ['INVESTOR'],
        permissions: ['READ_PROFILE']
      })
      expect(authStore.isLoading).toBe(false)
    })

    it('should handle update profile failure', async () => {
      const errorMessage = 'Validation failed'
      mockApiClient.patch.mockRejectedValue({
        response: { data: { message: errorMessage } }
      })

      await expect(authStore.updateProfile(profileData)).rejects.toThrow()
      expect(authStore.error).toBe(errorMessage)
      expect(authStore.isLoading).toBe(false)
    })
  })

  describe('Clear Error', () => {
    it('should clear error', () => {
      authStore.error = 'Some error'

      authStore.clearError()

      expect(authStore.error).toBeNull()
    })
  })
})
