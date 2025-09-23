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
      (config) => {
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

        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          // Don't try to refresh if this IS the refresh request - avoid infinite loop
          if (originalRequest.url?.includes('/auth/refresh')) {
            const authStore = useAuthStore()
            authStore.logout()
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
          } catch (refreshError) {
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
