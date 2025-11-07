import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../auth'
import { apiClient } from '@composables/useApi'
import { useCsrf } from '@/composables/useCsrf'
import type { User, LoginResponse } from '@/types/auth'

// Mock dependencies
vi.mock('@composables/useApi', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}))

vi.mock('@/composables/useCsrf')

describe('Auth Store', () => {
  let store: ReturnType<typeof useAuthStore>

  beforeEach(() => {
    // Create a fresh pinia instance for each test
    setActivePinia(createPinia())
    store = useAuthStore()

    // Clear localStorage
    localStorage.clear()

    // Clear all mocks
    vi.clearAllMocks()

    // Mock useCsrf
    vi.mocked(useCsrf).mockReturnValue({
      clearCsrfToken: vi.fn(),
      csrfToken: { value: null },
      fetchCsrfToken: vi.fn(),
      getCsrfToken: vi.fn(),
      hasCsrfToken: vi.fn(),
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('Initialization', () => {
    it('should initialize with default state when localStorage is empty', () => {
      // Arrange - Ensure localStorage is completely clear
      localStorage.clear()

      // Act - Create a new store instance after clearing
      setActivePinia(createPinia())
      const freshStore = useAuthStore()

      // Assert
      expect(freshStore.user).toBeNull()
      expect(freshStore.accessToken).toBeNull()
      expect(freshStore.refreshToken).toBeNull()
      expect(freshStore.isAuthenticated).toBe(false)
      expect(freshStore.isLoading).toBe(false)
      expect(freshStore.error).toBeNull()
    })

    it('should initialize from localStorage if tokens exist', () => {
      // Arrange
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        roles: ['USER'],
        permissions: [],
      }
      localStorage.clear()
      localStorage.setItem('accessToken', 'token-123')
      localStorage.setItem('refreshToken', 'refresh-456')
      localStorage.setItem('user', JSON.stringify(mockUser))

      // Act
      setActivePinia(createPinia())
      const freshStore = useAuthStore()
      freshStore.initializeAuth()

      // Assert
      expect(freshStore.user).toEqual(mockUser)
      expect(freshStore.accessToken).toBe('token-123')
    })

    it('should handle invalid stored user data', () => {
      // Arrange
      localStorage.clear()
      localStorage.setItem('accessToken', 'token-123')
      localStorage.setItem('user', 'invalid-json')

      // Act
      setActivePinia(createPinia())
      const freshStore = useAuthStore()
      freshStore.initializeAuth()

      // Assert
      expect(freshStore.user).toBeNull()
      expect(freshStore.accessToken).toBeNull()
      expect(localStorage.getItem('accessToken')).toBeNull()
    })
  })

  describe('Login', () => {
    const mockUser: User = {
      id: '1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      roles: ['USER'],
      permissions: ['read:posts'],
    }

    const mockLoginResponse: LoginResponse = {
      user: mockUser,
      accessToken: 'access-token-123',
      refreshToken: 'refresh-token-456',
      requiresPasswordChange: false,
    }

    it('should login successfully with valid credentials', async () => {
      // Arrange
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        status: 'success',
        data: mockLoginResponse,
      })
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        status: 'success',
        data: { roles: [{ name: 'USER' }], permissions: [{ name: 'read:posts' }] },
      })

      // Act
      await store.login({ email: 'test@example.com', password: 'password123' })

      // Assert
      expect(store.user).toEqual(mockUser)
      expect(store.accessToken).toBe('access-token-123')
      expect(store.refreshToken).toBe('refresh-token-456')
      expect(store.isAuthenticated).toBe(true)
      expect(store.requiresPasswordChange).toBe(false)
      expect(localStorage.getItem('accessToken')).toBe('access-token-123')
    })

    it('should handle direct response format', async () => {
      // Arrange
      vi.mocked(apiClient.post).mockResolvedValueOnce(mockLoginResponse as any)
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        status: 'success',
        data: { roles: [], permissions: [] },
      })

      // Act
      await store.login({ email: 'test@example.com', password: 'password123' })

      // Assert
      expect(store.isAuthenticated).toBe(true)
      expect(store.user).toBeTruthy()
    })

    it('should set requiresPasswordChange flag when true', async () => {
      // Arrange
      const responseWithPasswordChange = {
        ...mockLoginResponse,
        requiresPasswordChange: true,
      }
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        status: 'success',
        data: responseWithPasswordChange,
      })
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        status: 'success',
        data: { roles: [], permissions: [] },
      })

      // Act
      await store.login({ email: 'test@example.com', password: 'password123' })

      // Assert
      expect(store.requiresPasswordChange).toBe(true)
      expect(localStorage.getItem('requiresPasswordChange')).toBe('true')
    })

    it('should handle login failure', async () => {
      // Arrange
      const error = {
        response: {
          data: { message: 'Invalid credentials' },
        },
      }
      vi.mocked(apiClient.post).mockRejectedValueOnce(error)

      // Act & Assert
      await expect(
        store.login({ email: 'test@example.com', password: 'wrong' })
      ).rejects.toThrow()
      expect(store.error).toBe('Invalid credentials')
      expect(store.isAuthenticated).toBe(false)
    })

    it('should fetch user roles and permissions after login', async () => {
      // Arrange
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        status: 'success',
        data: mockLoginResponse,
      })
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        status: 'success',
        data: {
          roles: [{ name: 'ADMIN' }, { name: 'USER' }],
          permissions: [{ name: 'read:all' }, { name: 'write:all' }],
        },
      })

      // Act
      await store.login({ email: 'test@example.com', password: 'password123' })

      // Assert
      expect(store.user?.roles).toEqual(['ADMIN', 'USER'])
      expect(store.user?.permissions).toEqual(['read:all', 'write:all'])
    })
  })

  describe('Logout', () => {
    beforeEach(() => {
      // Set up logged-in state
      store.user = {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        roles: [],
        permissions: [],
      }
      store.accessToken = 'token-123'
      store.refreshToken = 'refresh-456'
      localStorage.setItem('accessToken', 'token-123')
      localStorage.setItem('user', JSON.stringify(store.user))
    })

    it('should logout successfully and clear state', async () => {
      // Arrange
      vi.mocked(apiClient.post).mockResolvedValueOnce({})

      // Act
      await store.logout()

      // Assert
      expect(store.user).toBeNull()
      expect(store.accessToken).toBeNull()
      expect(store.refreshToken).toBeNull()
      expect(store.isAuthenticated).toBe(false)
      expect(localStorage.getItem('accessToken')).toBeNull()
      expect(localStorage.getItem('user')).toBeNull()
    })

    it('should clear CSRF token on logout', async () => {
      // Arrange
      const clearCsrfTokenMock = vi.fn()
      vi.mocked(useCsrf).mockReturnValue({
        clearCsrfToken: clearCsrfTokenMock,
        csrfToken: { value: 'test-token' },
        fetchCsrfToken: vi.fn(),
        getCsrfToken: vi.fn(),
        hasCsrfToken: vi.fn(),
      })
      vi.mocked(apiClient.post).mockResolvedValueOnce({})

      // Act
      await store.logout()

      // Assert
      expect(clearCsrfTokenMock).toHaveBeenCalled()
    })

    it('should clear state even if logout API call fails', async () => {
      // Arrange
      vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Network error'))

      // Act
      await store.logout()

      // Assert
      expect(store.user).toBeNull()
      expect(store.accessToken).toBeNull()
      expect(localStorage.getItem('accessToken')).toBeNull()
    })
  })

  describe('Token Refresh', () => {
    beforeEach(() => {
      store.accessToken = 'old-token'
      store.refreshToken = 'refresh-token'
    })

    it('should refresh tokens successfully', async () => {
      // Arrange
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        status: 'success',
        data: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        },
      })

      // Act
      await store.refreshTokens()

      // Assert
      expect(store.accessToken).toBe('new-access-token')
      expect(store.refreshToken).toBe('new-refresh-token')
      expect(localStorage.getItem('accessToken')).toBe('new-access-token')
    })

    it('should handle direct response format for token refresh', async () => {
      // Arrange
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        accessToken: 'new-token',
        refreshToken: 'new-refresh',
      } as any)

      // Act
      await store.refreshTokens()

      // Assert
      expect(store.accessToken).toBe('new-token')
      expect(store.refreshToken).toBe('new-refresh')
    })

    it('should throw error when no refresh token available', async () => {
      // Arrange
      store.refreshToken = null

      // Act & Assert
      await expect(store.refreshTokens()).rejects.toThrow('No refresh token available')
    })

    it('should enforce refresh cooldown', async () => {
      // Arrange
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        status: 'success',
        data: {
          accessToken: 'new-token',
          refreshToken: 'new-refresh',
        },
      })

      // Act
      await store.refreshTokens()

      // Try to refresh again immediately
      await expect(store.refreshTokens()).rejects.toThrow('Refresh cooldown active')
    })

    it('should logout after max refresh retries exceeded', async () => {
      // Arrange
      vi.mocked(apiClient.post).mockRejectedValue(new Error('Refresh failed'))

      // Use fake timers
      vi.useFakeTimers()

      try {
        // Act - Try refreshing multiple times
        for (let i = 0; i < 3; i++) {
          try {
            await store.refreshTokens()
          } catch (e) {
            // Expected to fail
          }
          // Advance timers for cooldown
          vi.advanceTimersByTime(5100)
        }

        // Try one more time - should exceed max retries and logout
        try {
          await store.refreshTokens()
        } catch (e) {
          // Expected
        }

        // Assert
        expect(store.accessToken).toBeNull()
        expect(store.refreshToken).toBeNull()
      } finally {
        vi.useRealTimers()
      }
    })

    it('should handle 401 error during refresh', async () => {
      // Arrange
      const error = { response: { status: 401 } }
      vi.mocked(apiClient.post).mockRejectedValueOnce(error)

      // Act & Assert
      await expect(store.refreshTokens()).rejects.toThrow()
      expect(store.accessToken).toBeNull()
      expect(store.refreshToken).toBeNull()
    })
  })

  describe('getCurrentUser', () => {
    beforeEach(() => {
      store.accessToken = 'token-123'
    })

    it('should fetch current user successfully', async () => {
      // Arrange
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      }
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce({
          status: 'success',
          data: mockUser,
        })
        .mockResolvedValueOnce({
          status: 'success',
          data: { roles: [{ name: 'USER' }], permissions: [] },
        })

      // Act
      await store.getCurrentUser()

      // Assert
      expect(store.user).toBeTruthy()
      expect(store.user?.email).toBe('test@example.com')
    })

    it('should not fetch user if no access token', async () => {
      // Arrange
      store.accessToken = null

      // Act
      await store.getCurrentUser()

      // Assert
      expect(apiClient.get).not.toHaveBeenCalled()
    })

    it('should logout on 401 error', async () => {
      // Arrange
      const error = { response: { status: 401 } }
      vi.mocked(apiClient.get).mockRejectedValueOnce(error)

      // Act
      await store.getCurrentUser()

      // Assert
      expect(store.user).toBeNull()
      expect(store.accessToken).toBeNull()
    })
  })

  describe('updateProfile', () => {
    beforeEach(() => {
      store.user = {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        roles: ['USER'],
        permissions: ['read:posts'],
      }
    })

    it('should update profile successfully', async () => {
      // Arrange
      const updatedUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
      }
      vi.mocked(apiClient.patch).mockResolvedValueOnce({
        status: 'success',
        data: updatedUser,
      })

      // Act
      await store.updateProfile({ firstName: 'Jane', lastName: 'Smith' })

      // Assert
      expect(store.user?.firstName).toBe('Jane')
      expect(store.user?.lastName).toBe('Smith')
      // Should preserve roles and permissions
      expect(store.user?.roles).toEqual(['USER'])
      expect(store.user?.permissions).toEqual(['read:posts'])
    })

    it('should handle update profile error', async () => {
      // Arrange
      const error = { response: { data: { message: 'Update failed' } } }
      vi.mocked(apiClient.patch).mockRejectedValueOnce(error)

      // Act & Assert
      await expect(
        store.updateProfile({ firstName: 'Jane' })
      ).rejects.toThrow()
      expect(store.error).toBe('Update failed')
    })
  })

  describe('setPassword', () => {
    it('should set password successfully', async () => {
      // Arrange
      const mockResponse = {
        user: {
          id: '1',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
        },
        accessToken: 'new-token',
        refreshToken: 'new-refresh',
      }
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        status: 'success',
        data: mockResponse,
      })
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        status: 'success',
        data: { roles: [], permissions: [] },
      })

      store.requiresPasswordChange = true

      // Act
      await store.setPassword({ password: 'newpass123', confirmPassword: 'newpass123' })

      // Assert
      expect(store.requiresPasswordChange).toBe(false)
      expect(store.accessToken).toBe('new-token')
      expect(store.refreshToken).toBe('new-refresh')
      expect(store.user).toBeTruthy()
      expect(localStorage.getItem('requiresPasswordChange')).toBeNull()
    })

    it('should handle password set errors', async () => {
      // Arrange
      const error = { response: { data: { message: 'Password too weak' } } }
      vi.mocked(apiClient.post).mockRejectedValueOnce(error)

      // Act & Assert
      await expect(
        store.setPassword({ password: 'weak', confirmPassword: 'weak' })
      ).rejects.toThrow()
      expect(store.error).toBe('Password too weak')
    })
  })

  describe('Role and Permission Checks', () => {
    beforeEach(() => {
      store.user = {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        roles: ['ADMIN', 'USER'],
        permissions: ['read:all', 'write:all'],
      }
    })

    it('should return true when user has role', () => {
      // Act & Assert
      expect(store.hasRole('ADMIN')).toBe(true)
      expect(store.hasRole('USER')).toBe(true)
    })

    it('should return false when user does not have role', () => {
      // Act & Assert
      expect(store.hasRole('SUPER_ADMIN')).toBe(false)
    })

    it('should return false when user is null', () => {
      // Arrange
      store.user = null

      // Act & Assert
      expect(store.hasRole('ADMIN')).toBe(false)
    })

    it('should return true when user has permission', () => {
      // Act & Assert
      expect(store.hasPermission('read:all')).toBe(true)
      expect(store.hasPermission('write:all')).toBe(true)
    })

    it('should return false when user does not have permission', () => {
      // Act & Assert
      expect(store.hasPermission('delete:all')).toBe(false)
    })
  })

  describe('Computed Properties', () => {
    it('should compute userInitials correctly', () => {
      // Arrange
      store.user = {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        roles: [],
        permissions: [],
      }

      // Act & Assert
      expect(store.userInitials).toBe('JD')
    })

    it('should return empty string for userInitials when user is null', () => {
      // Arrange
      store.user = null

      // Act & Assert
      expect(store.userInitials).toBe('')
    })

    it('should compute userFullName correctly', () => {
      // Arrange
      store.user = {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        roles: [],
        permissions: [],
      }

      // Act & Assert
      expect(store.userFullName).toBe('John Doe')
    })

    it('should return empty string for userFullName when user is null', () => {
      // Arrange
      store.user = null

      // Act & Assert
      expect(store.userFullName).toBe('')
    })
  })

  describe('clearError', () => {
    it('should clear error state', () => {
      // Arrange
      store.error = 'Some error'

      // Act
      store.clearError()

      // Assert
      expect(store.error).toBeNull()
    })
  })

  describe('refreshUserRoles', () => {
    beforeEach(() => {
      store.accessToken = 'token-123'
      store.user = {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        roles: ['USER'],
        permissions: [],
      }
    })

    it('should refresh user roles and permissions', async () => {
      // Arrange
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        status: 'success',
        data: {
          roles: [{ name: 'ADMIN' }],
          permissions: [{ name: 'write:all' }],
        },
      })

      // Act
      await store.refreshUserRoles()

      // Assert
      expect(store.user?.roles).toEqual(['ADMIN'])
      expect(store.user?.permissions).toEqual(['write:all'])
    })

    it('should not refresh if no access token', async () => {
      // Arrange
      store.accessToken = null

      // Act
      await store.refreshUserRoles()

      // Assert
      expect(apiClient.get).not.toHaveBeenCalled()
    })

    it('should not refresh if no user', async () => {
      // Arrange
      store.user = null

      // Act
      await store.refreshUserRoles()

      // Assert
      expect(apiClient.get).not.toHaveBeenCalled()
    })

    it('should handle refresh roles error gracefully', async () => {
      // Arrange
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Failed to fetch roles'))

      // Act
      await store.refreshUserRoles()

      // Assert - Should not throw, just log warning
      expect(store.user).toBeTruthy() // User should still exist
    })
  })
})
