import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import axios from 'axios'

// Mock axios
vi.mock('axios')

describe('useCsrf', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
    // Clear the token after each test
    vi.doUnmock('../useCsrf')
  })

  describe('fetchCsrfToken', () => {
    it('should fetch CSRF token successfully', async () => {
      // Arrange
      const mockToken = 'test-csrf-token-123'
      vi.mocked(axios.get).mockResolvedValue({
        data: { csrfToken: mockToken },
      })

      // Act
      const { useCsrf } = await import('../useCsrf')
      const { fetchCsrfToken, csrfToken } = useCsrf()
      const token = await fetchCsrfToken()

      // Assert
      expect(token).toBe(mockToken)
      expect(csrfToken.value).toBe(mockToken)
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/auth/csrf'),
        { withCredentials: true }
      )
    })

    it('should handle alternate token property name', async () => {
      // Arrange
      const mockToken = 'test-token-456'
      vi.mocked(axios.get).mockResolvedValue({
        data: { token: mockToken },
      })

      // Act
      const { useCsrf } = await import('../useCsrf')
      const { fetchCsrfToken, csrfToken } = useCsrf()
      const token = await fetchCsrfToken()

      // Assert
      expect(token).toBe(mockToken)
      expect(csrfToken.value).toBe(mockToken)
    })

    it('should throw error when no token received', async () => {
      // Arrange
      vi.mocked(axios.get).mockResolvedValue({
        data: {},
      })

      // Act & Assert
      const { useCsrf } = await import('../useCsrf')
      const { fetchCsrfToken } = useCsrf()
      await expect(fetchCsrfToken()).rejects.toThrow('No CSRF token received from server')
    })

    it('should handle fetch errors', async () => {
      // Arrange
      const mockError = new Error('Network error')
      vi.mocked(axios.get).mockRejectedValue(mockError)

      // Act & Assert
      const { useCsrf } = await import('../useCsrf')
      const { fetchCsrfToken } = useCsrf()
      await expect(fetchCsrfToken()).rejects.toThrow('Network error')
    })

    it('should return cached token if already fetching', async () => {
      // Arrange
      const mockToken = 'cached-token'
      vi.mocked(axios.get).mockImplementation(() =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ data: { csrfToken: mockToken } }), 100)
        )
      )

      // Act
      const { useCsrf } = await import('../useCsrf')
      const { fetchCsrfToken, csrfToken } = useCsrf()

      // Start first fetch
      const firstPromise = fetchCsrfToken()

      // Manually set token to simulate race condition
      csrfToken.value = mockToken

      // Start second fetch while first is in progress
      const secondPromise = fetchCsrfToken()

      const [firstToken, secondToken] = await Promise.all([firstPromise, secondPromise])

      // Assert
      expect(firstToken).toBe(mockToken)
      expect(secondToken).toBe(mockToken)
    })
  })

  describe('getCsrfToken', () => {
    it('should return cached token if available', async () => {
      // Arrange
      vi.resetModules()
      const mockToken = 'cached-token-789'
      vi.mocked(axios.get).mockResolvedValue({
        data: { csrfToken: mockToken },
      })

      // Act
      const { useCsrf } = await import('../useCsrf')
      const { getCsrfToken, fetchCsrfToken } = useCsrf()
      await fetchCsrfToken()
      const token = await getCsrfToken()

      // Assert
      expect(token).toBe(mockToken)
      // Should only call API once
      expect(axios.get).toHaveBeenCalledTimes(1)
    })

    it('should fetch token if not cached', async () => {
      // Arrange
      vi.resetModules()
      const mockToken = 'new-token-101'
      vi.mocked(axios.get).mockResolvedValue({
        data: { csrfToken: mockToken },
      })

      // Act
      const { useCsrf } = await import('../useCsrf')
      const { getCsrfToken } = useCsrf()
      const token = await getCsrfToken()

      // Assert
      expect(token).toBe(mockToken)
      expect(axios.get).toHaveBeenCalledTimes(1)
    })
  })

  describe('clearCsrfToken', () => {
    it('should clear the stored token', async () => {
      // Arrange
      const mockToken = 'token-to-clear'
      vi.mocked(axios.get).mockResolvedValue({
        data: { csrfToken: mockToken },
      })

      // Act
      const { useCsrf } = await import('../useCsrf')
      const { fetchCsrfToken, clearCsrfToken, csrfToken } = useCsrf()
      await fetchCsrfToken()
      expect(csrfToken.value).toBe(mockToken)

      clearCsrfToken()

      // Assert
      expect(csrfToken.value).toBeNull()
    })
  })

  describe('hasCsrfToken', () => {
    it('should return true when token exists', async () => {
      // Arrange
      const mockToken = 'existing-token'
      vi.mocked(axios.get).mockResolvedValue({
        data: { csrfToken: mockToken },
      })

      // Act
      const { useCsrf } = await import('../useCsrf')
      const { fetchCsrfToken, hasCsrfToken } = useCsrf()
      await fetchCsrfToken()

      // Assert
      expect(hasCsrfToken()).toBe(true)
    })

    it('should return false when token does not exist', async () => {
      // Arrange & Act
      const { useCsrf } = await import('../useCsrf')
      const { hasCsrfToken, clearCsrfToken } = useCsrf()

      // Ensure token is cleared
      clearCsrfToken()

      // Assert
      expect(hasCsrfToken()).toBe(false)
    })

    it('should return false after token is cleared', async () => {
      // Arrange
      const mockToken = 'temp-token'
      vi.mocked(axios.get).mockResolvedValue({
        data: { csrfToken: mockToken },
      })

      // Act
      const { useCsrf } = await import('../useCsrf')
      const { fetchCsrfToken, clearCsrfToken, hasCsrfToken } = useCsrf()
      await fetchCsrfToken()
      expect(hasCsrfToken()).toBe(true)

      clearCsrfToken()

      // Assert
      expect(hasCsrfToken()).toBe(false)
    })
  })

  describe('environment configuration', () => {
    it('should use custom API URL from environment', async () => {
      // Arrange
      const customApiUrl = 'https://custom-api.example.com/api'
      vi.stubEnv('VITE_API_URL', customApiUrl)

      const mockToken = 'env-token'
      vi.mocked(axios.get).mockResolvedValue({
        data: { csrfToken: mockToken },
      })

      // Act
      const { useCsrf } = await import('../useCsrf')
      const { fetchCsrfToken } = useCsrf()
      await fetchCsrfToken()

      // Assert
      expect(axios.get).toHaveBeenCalledWith(
        `${customApiUrl}/auth/csrf`,
        { withCredentials: true }
      )

      vi.unstubAllEnvs()
    })

    it('should use default URL when environment variable not set', async () => {
      // Arrange
      vi.unstubAllEnvs()
      const mockToken = 'default-token'
      vi.mocked(axios.get).mockResolvedValue({
        data: { csrfToken: mockToken },
      })

      // Act
      const { useCsrf } = await import('../useCsrf')
      const { fetchCsrfToken } = useCsrf()
      await fetchCsrfToken()

      // Assert
      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:5173/api/auth/csrf',
        { withCredentials: true }
      )
    })
  })
})
