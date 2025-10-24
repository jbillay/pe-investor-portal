import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { useAuthStore } from '@stores/auth'
import type { ApiResponse } from '@/types/api'

class ApiClient {
  private instance: AxiosInstance
  private refreshTokenPromise: Promise<any> | null = null

  constructor() {
    this.instance = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5173/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.instance.interceptors.request.use(
      async (config) => {
        // Don't wait for refresh on logout requests to prevent circular dependency
        const isLogoutRequest = config.url?.includes('/auth/logout')

        // If a token refresh is in progress, wait for it to complete
        // This prevents new requests from using stale tokens
        if (this.refreshTokenPromise && !isLogoutRequest) {
          try {
            // Wait for the refresh to complete (with reasonable timeout)
            await Promise.race([
              this.refreshTokenPromise,
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Refresh wait timeout')), 15000)
              )
            ])
          } catch (err: any) {
            // If refresh fails, don't proceed - the response interceptor will handle logout
            // If it's just a timeout, let the request continue and it will retry refresh
            if (err.message !== 'Refresh wait timeout') {
              throw err
            }
          }
        }

        const authStore = useAuthStore()
        if (authStore.accessToken) {
          config.headers.Authorization = `Bearer ${authStore.accessToken}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor to handle token refresh and better error messages
    this.instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        // Handle timeout errors
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          console.error('Request timeout:', error.config?.url)
          const enhancedError = new Error(
            'Request timeout - The server took too long to respond. Please try again.'
          )
          enhancedError.name = 'TimeoutError'
          return Promise.reject(enhancedError)
        }

        // Handle network errors (backend not available)
        if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
          const enhancedError = new Error(
            'Cannot connect to backend server. Please ensure the backend is running on port 5173.'
          )
          enhancedError.name = 'NetworkError'
          return Promise.reject(enhancedError)
        }

        // Handle HTML responses (typically 404 or 500 errors returning HTML pages)
        if (error.response?.status >= 400 &&
            error.response?.headers['content-type']?.includes('text/html')) {
          const enhancedError = new Error(
            `Server error (${error.response.status}): Endpoint not found or server misconfigured`
          )
          enhancedError.name = 'ServerError'
          return Promise.reject(enhancedError)
        }

        // Handle 429 Rate Limiting - don't retry, just show error
        if (error.response?.status === 429) {
          console.warn('Rate limit exceeded, please wait before retrying')
          const enhancedError = new Error(
            'Too many requests. Please wait a moment before trying again.'
          )
          enhancedError.name = 'RateLimitError'
          return Promise.reject(error)
        }

        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          // For login requests, just return the error - don't logout or reload
          // The login page will handle displaying the error message
          if (originalRequest.url?.includes('/auth/login')) {
            return Promise.reject(error)
          }

          // Don't try to refresh if this IS the refresh request - avoid infinite loop
          if (originalRequest.url?.includes('/auth/refresh')) {
            // Clear the refresh promise immediately so waiting requests fail fast
            this.refreshTokenPromise = null

            // Clear localStorage directly to prevent logout from making API call
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            localStorage.removeItem('user')
            localStorage.removeItem('requiresPasswordChange')

            // Redirect to login immediately
            window.location.href = '/login'
            return Promise.reject(error)
          }

          const authStore = useAuthStore()

          // If a refresh is already in progress, wait for it instead of starting a new one
          if (!this.refreshTokenPromise) {
            this.refreshTokenPromise = authStore.refreshTokens()
              .then(() => {
                this.refreshTokenPromise = null
                return authStore.accessToken
              })
              .catch((refreshError) => {
                this.refreshTokenPromise = null
                // Check if it's a cooldown error - if so, don't logout
                if (refreshError?.message?.includes('cooldown')) {
                  console.warn('Refresh cooldown active, request will be retried later')
                  throw refreshError
                }
                // For other refresh errors (invalid token, max retries), logout
                console.error('Token refresh failed, logging out')
                authStore.logout()
                window.location.href = '/login'
                throw refreshError
              })
          }

          try {
            const newToken = await this.refreshTokenPromise
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`
              return this.instance(originalRequest)
            }
          } catch (refreshError: any) {
            // If it's a cooldown error, return the original 401 to the caller
            if (refreshError?.message?.includes('cooldown')) {
              return Promise.reject(error)
            }
            return Promise.reject(refreshError)
          }
        }

        return Promise.reject(error)
      }
    )
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.instance.get(url, config)
    return response.data
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.instance.post(url, data, config)
    return response.data
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.instance.put(url, data, config)
    return response.data
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.instance.patch(url, data, config)
    return response.data
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.instance.delete(url, config)
    return response.data
  }
}

export const apiClient = new ApiClient()

export function useApi() {
  return {
    api: apiClient
  }
}
