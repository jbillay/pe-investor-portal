import { ref } from 'vue'
import axios from 'axios'

/**
 * CSRF Token Management Composable
 *
 * Handles fetching and storing CSRF tokens for protection against
 * Cross-Site Request Forgery attacks.
 */

// Global state for CSRF token (shared across all components)
const csrfToken = ref<string | null>(null)
const isFetching = ref(false)

export function useCsrf() {
  /**
   * Fetch a new CSRF token from the backend
   */
  const fetchCsrfToken = async (): Promise<string> => {
    // If already fetching, wait for it to complete
    if (isFetching.value && csrfToken.value) {
      return csrfToken.value
    }

    try {
      isFetching.value = true
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5173/api'

      const response = await axios.get(`${baseURL}/auth/csrf`, {
        withCredentials: true, // Important: Include cookies
      })

      const token = response.data?.csrfToken || response.data?.token
      if (!token) {
        throw new Error('No CSRF token received from server')
      }

      csrfToken.value = token
      console.log('[CSRF] Token fetched successfully')
      return token
    } catch (error) {
      console.error('[CSRF] Failed to fetch token:', error)
      throw error
    } finally {
      isFetching.value = false
    }
  }

  /**
   * Get the current CSRF token, fetching if necessary
   */
  const getCsrfToken = async (): Promise<string> => {
    if (csrfToken.value) {
      return csrfToken.value
    }
    return await fetchCsrfToken()
  }

  /**
   * Clear the stored CSRF token (e.g., on logout)
   */
  const clearCsrfToken = () => {
    csrfToken.value = null
    console.log('[CSRF] Token cleared')
  }

  /**
   * Check if we have a CSRF token
   */
  const hasCsrfToken = (): boolean => {
    return csrfToken.value !== null
  }

  return {
    csrfToken,
    fetchCsrfToken,
    getCsrfToken,
    clearCsrfToken,
    hasCsrfToken,
  }
}
