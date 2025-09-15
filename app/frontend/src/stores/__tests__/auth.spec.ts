import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../auth'
import { mockApiClient, mockUser, mockLoginResponse, mockLocalStorage } from '../../__tests__/utils/test-utils'

// Mock the API client
vi.mock('@composables/useApi', () => ({
  apiClient: mockApiClient
}))

describe('Auth Store', () => {
  let authStore: ReturnType<typeof useAuthStore>
  let mockStorage: ReturnType<typeof mockLocalStorage>

  beforeEach(() => {
    setActivePinia(createPinia())
    authStore = useAuthStore()

    // Mock localStorage
    mockStorage = mockLocalStorage()
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      writable: true
    })

    // Clear all mocks
    vi.clearAllMocks()
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

    it('should login successfully', async () => {
      mockApiClient.post.mockResolvedValue(mockLoginResponse)

      await authStore.login(loginCredentials)

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/login', loginCredentials)
      expect(authStore.user).toEqual(mockUser)
      expect(authStore.accessToken).toBe('mock-access-token')
      expect(authStore.refreshToken).toBe('mock-refresh-token')
      expect(authStore.error).toBeNull()
      expect(authStore.isLoading).toBe(false)

      // Check localStorage calls
      expect(mockStorage.setItem).toHaveBeenCalledWith('accessToken', 'mock-access-token')
      expect(mockStorage.setItem).toHaveBeenCalledWith('refreshToken', 'mock-refresh-token')
      expect(mockStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser))
    })

    it('should handle login failure', async () => {
      const errorMessage = 'Invalid credentials'
      mockApiClient.post.mockRejectedValue({
        response: { data: { message: errorMessage } }
      })

      await expect(authStore.login(loginCredentials)).rejects.toThrow()

      expect(authStore.user).toBeNull()
      expect(authStore.accessToken).toBeNull()
      expect(authStore.refreshToken).toBeNull()
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
      const logoutSpy = vi.spyOn(authStore, 'logout').mockImplementation(() => Promise.resolve())

      await expect(authStore.refreshTokens()).rejects.toThrow()
      expect(logoutSpy).toHaveBeenCalled()

      logoutSpy.mockRestore()
    })
  })

  describe('Get Current User Action', () => {
    beforeEach(() => {
      authStore.accessToken = 'valid-token'
    })

    it('should get current user successfully', async () => {
      const userResponse = {
        status: 'success' as const,
        data: mockUser
      }
      mockApiClient.get.mockResolvedValue(userResponse)

      await authStore.getCurrentUser()

      expect(mockApiClient.get).toHaveBeenCalledWith('/auth/me')
      expect(authStore.user).toEqual(mockUser)
      expect(authStore.isLoading).toBe(false)
      expect(mockStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser))
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
      const logoutSpy = vi.spyOn(authStore, 'logout').mockImplementation(() => Promise.resolve())

      await authStore.getCurrentUser()

      expect(logoutSpy).toHaveBeenCalled()
      expect(authStore.error).toBe('Unauthorized')

      logoutSpy.mockRestore()
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
      mockStorage.getItem.mockImplementation((key: string) => {
        if (key === 'user') return JSON.stringify(mockUser)
        if (key === 'accessToken') return 'stored-token'
        return null
      })

      authStore.initializeAuth()

      expect(authStore.user).toEqual(mockUser)
    })

    it('should logout on invalid stored user data', () => {
      mockStorage.getItem.mockImplementation((key: string) => {
        if (key === 'user') return 'invalid-json'
        if (key === 'accessToken') return 'stored-token'
        return null
      })

      const logoutSpy = vi.spyOn(authStore, 'logout').mockImplementation(() => Promise.resolve())
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      authStore.initializeAuth()

      expect(logoutSpy).toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith('Failed to parse stored user data:', expect.any(SyntaxError))

      logoutSpy.mockRestore()
      consoleSpy.mockRestore()
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