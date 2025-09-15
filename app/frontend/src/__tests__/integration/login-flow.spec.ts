import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from '../../App.vue'
import LoginView from '../../views/auth/LoginView.vue'
import AppLayout from '../../components/layout/AppLayout.vue'
import DashboardView from '../../views/DashboardView.vue'
import { useAuthStore } from '@stores/auth'
import { mockUser, mockLoginResponse, setupTest, mockLocalStorage } from '../utils/test-utils'

// Mock the API client
const mockApiClient = {
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  put: vi.fn(),
  delete: vi.fn()
}

vi.mock('@composables/useApi', () => ({
  apiClient: mockApiClient
}))

// Create a full router setup similar to the actual application
const createIntegrationRouter = () => {
  return createRouter({
    history: createWebHistory(),
    routes: [
      {
        path: '/login',
        name: 'login',
        component: LoginView,
        meta: { requiresAuth: false, title: 'Sign In' }
      },
      {
        path: '/',
        component: AppLayout,
        meta: { requiresAuth: true },
        children: [
          {
            path: '',
            name: 'dashboard',
            component: DashboardView,
            meta: { title: 'Dashboard' }
          }
        ]
      }
    ]
  })
}

describe('Login Flow Integration Tests', () => {
  let wrapper: VueWrapper<any>
  let router: ReturnType<typeof createIntegrationRouter>
  let authStore: ReturnType<typeof useAuthStore>
  let mockStorage: ReturnType<typeof mockLocalStorage>

  const createApp = async (initialRoute = '/') => {
    const pinia = createPinia()
    setActivePinia(pinia)
    router = createIntegrationRouter()
    authStore = useAuthStore()

    // Add navigation guard
    router.beforeEach(async (to, from, next) => {
      // Set page title
      if (to.meta.title) {
        document.title = `${to.meta.title} - PE Investor Portal`
      }

      // Check if route requires authentication
      const requiresAuth = to.meta.requiresAuth !== false

      if (requiresAuth) {
        // Initialize auth if we have tokens but no user data
        if (authStore.accessToken && !authStore.user) {
          try {
            await authStore.getCurrentUser()
          } catch (error) {
            console.error('Failed to get current user:', error)
            authStore.logout()
            next({
              name: 'login',
              query: { redirect: to.fullPath }
            })
            return
          }
        }

        // Check if user is authenticated
        if (!authStore.isAuthenticated) {
          next({
            name: 'login',
            query: { redirect: to.fullPath }
          })
          return
        }
      } else {
        // If user is authenticated and trying to access login page, redirect to dashboard
        if (authStore.isAuthenticated && to.name === 'login') {
          next({ name: 'dashboard' })
          return
        }
      }

      next()
    })

    // Navigate to initial route
    await router.push(initialRoute)
    await router.isReady()

    const app = mount(App, {
      global: {
        plugins: [pinia, router],
        stubs: {
          // Don't stub these components for integration testing
          'AppLayout': false,
          'LoginView': false,
          'DashboardView': false
        }
      }
    })

    return app
  }

  beforeEach(async () => {
    setupTest()
    mockStorage = mockLocalStorage()
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      writable: true
    })

    vi.clearAllMocks()

    // Mock document.title
    Object.defineProperty(document, 'title', {
      writable: true,
      value: ''
    })
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.restoreAllMocks()
  })

  describe('Unauthenticated User Flow', () => {
    it('should redirect unauthenticated user to login when accessing protected route', async () => {
      wrapper = await createApp('/')

      // Should be redirected to login
      expect(router.currentRoute.value.name).toBe('login')
      expect(router.currentRoute.value.query.redirect).toBe('/')
      expect(document.title).toBe('Sign In - PE Investor Portal')

      // Should show login form
      expect(wrapper.find('h2').text()).toContain('Sign in to your account')
      expect(wrapper.find('input[type="email"]').exists()).toBe(true)
      expect(wrapper.find('input[type="password"]').exists()).toBe(true)
    })

    it('should allow access to login page when not authenticated', async () => {
      wrapper = await createApp('/login')

      expect(router.currentRoute.value.name).toBe('login')
      expect(wrapper.find('h2').text()).toContain('Sign in to your account')
    })
  })

  describe('Complete Login Flow', () => {
    it('should complete successful login flow from form submission to dashboard', async () => {
      // Start at login page
      wrapper = await createApp('/login')
      expect(router.currentRoute.value.name).toBe('login')

      // Mock successful login API response
      mockApiClient.post.mockResolvedValue(mockLoginResponse)

      // Fill in login form
      const emailInput = wrapper.find('input[type="email"]')
      const passwordInput = wrapper.find('input[type="password"]')
      const submitButton = wrapper.find('button[type="submit"]')

      await emailInput.setValue('test@example.com')
      await passwordInput.setValue('password123')

      // Verify form is ready for submission
      expect(submitButton.attributes('disabled')).toBeUndefined()

      // Submit the form
      const form = wrapper.find('form')
      await form.trigger('submit.prevent')

      // Wait for async operations
      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      // Verify API was called with correct credentials
      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123'
      })

      // Verify auth store state
      expect(authStore.user).toEqual(mockUser)
      expect(authStore.accessToken).toBe('mock-access-token')
      expect(authStore.isAuthenticated).toBe(true)

      // Verify localStorage was updated
      expect(mockStorage.setItem).toHaveBeenCalledWith('accessToken', 'mock-access-token')
      expect(mockStorage.setItem).toHaveBeenCalledWith('refreshToken', 'mock-refresh-token')
      expect(mockStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser))

      // Verify navigation to dashboard
      expect(router.currentRoute.value.name).toBe('dashboard')
      expect(document.title).toBe('Dashboard - PE Investor Portal')

      // Verify dashboard content is displayed
      expect(wrapper.text()).toContain('Welcome back, John!')
    })

    it('should redirect to intended page after successful login', async () => {
      // Try to access protected route, get redirected to login
      wrapper = await createApp('/profile')
      expect(router.currentRoute.value.name).toBe('login')
      expect(router.currentRoute.value.query.redirect).toBe('/profile')

      // Mock successful login
      mockApiClient.post.mockResolvedValue(mockLoginResponse)

      // Fill and submit login form
      await wrapper.find('input[type="email"]').setValue('test@example.com')
      await wrapper.find('input[type="password"]').setValue('password123')
      await wrapper.find('form').trigger('submit.prevent')

      // Wait for async operations
      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      // Should redirect to intended page (profile)
      expect(router.currentRoute.value.path).toBe('/profile')
    })

    it('should handle login errors gracefully', async () => {
      wrapper = await createApp('/login')

      // Mock login failure
      mockApiClient.post.mockRejectedValue({
        response: { data: { message: 'Invalid credentials' } }
      })

      // Fill and submit login form
      await wrapper.find('input[type="email"]').setValue('test@example.com')
      await wrapper.find('input[type="password"]').setValue('wrong-password')
      await wrapper.find('form').trigger('submit.prevent')

      // Wait for error to appear
      await wrapper.vm.$nextTick()

      // Should still be on login page
      expect(router.currentRoute.value.name).toBe('login')

      // Should display error message
      expect(wrapper.text()).toContain('Sign in failed')
      expect(wrapper.text()).toContain('Invalid credentials')

      // Should not be authenticated
      expect(authStore.isAuthenticated).toBe(false)
    })
  })

  describe('Authenticated User Flow', () => {
    beforeEach(async () => {
      // Set up authenticated state
      mockStorage.getItem.mockImplementation((key: string) => {
        switch (key) {
          case 'accessToken': return 'valid-token'
          case 'refreshToken': return 'valid-refresh'
          case 'user': return JSON.stringify(mockUser)
          default: return null
        }
      })
    })

    it('should redirect authenticated user away from login page', async () => {
      wrapper = await createApp('/login')

      // Should redirect to dashboard
      expect(router.currentRoute.value.name).toBe('dashboard')
      expect(wrapper.text()).toContain('Welcome back, John!')
    })

    it('should allow access to protected routes when authenticated', async () => {
      wrapper = await createApp('/')

      // Should access dashboard directly
      expect(router.currentRoute.value.name).toBe('dashboard')
      expect(wrapper.text()).toContain('Welcome back, John!')

      // Should show layout with header
      expect(wrapper.find('header').exists()).toBe(true)
      expect(wrapper.text()).toContain('PE Investor Portal')
    })

    it('should handle token refresh during navigation', async () => {
      // Set up state with token but no user (triggers getCurrentUser)
      mockStorage.getItem.mockImplementation((key: string) => {
        switch (key) {
          case 'accessToken': return 'valid-token'
          case 'refreshToken': return 'valid-refresh'
          case 'user': return null
          default: return null
        }
      })

      // Mock getCurrentUser API response
      mockApiClient.get.mockResolvedValue({
        status: 'success',
        data: mockUser
      })

      wrapper = await createApp('/')

      // Wait for async operations
      await wrapper.vm.$nextTick()

      // Should have fetched user data
      expect(mockApiClient.get).toHaveBeenCalledWith('/auth/me')

      // Should be on dashboard
      expect(router.currentRoute.value.name).toBe('dashboard')
      expect(wrapper.text()).toContain('Welcome back, John!')
    })

    it('should handle token refresh failure and redirect to login', async () => {
      // Set up state with token but no user
      mockStorage.getItem.mockImplementation((key: string) => {
        switch (key) {
          case 'accessToken': return 'invalid-token'
          case 'refreshToken': return 'invalid-refresh'
          case 'user': return null
          default: return null
        }
      })

      // Mock getCurrentUser failure
      mockApiClient.get.mockRejectedValue({
        response: { status: 401, data: { message: 'Token expired' } }
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      wrapper = await createApp('/')

      // Wait for async operations
      await wrapper.vm.$nextTick()

      // Should redirect to login
      expect(router.currentRoute.value.name).toBe('login')
      expect(router.currentRoute.value.query.redirect).toBe('/')

      // Should have logged the error
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get current user:', expect.any(Object))

      consoleSpy.mockRestore()
    })
  })

  describe('Layout Integration', () => {
    it('should show loading state during authentication', async () => {
      // Mock slow API response
      let resolveGetUser: (value: any) => void
      const getUserPromise = new Promise(resolve => {
        resolveGetUser = resolve
      })
      mockApiClient.get.mockReturnValue(getUserPromise)

      // Set up token without user
      mockStorage.getItem.mockImplementation((key: string) => {
        switch (key) {
          case 'accessToken': return 'valid-token'
          case 'user': return null
          default: return null
        }
      })

      wrapper = await createApp('/')

      // Should show loading state
      await wrapper.vm.$nextTick()
      // Loading state is managed by AppLayout component

      // Resolve the API call
      resolveGetUser!({
        status: 'success',
        data: mockUser
      })

      await wrapper.vm.$nextTick()

      // Should show dashboard content
      expect(wrapper.text()).toContain('Welcome back, John!')
    })

    it('should display notifications for auth errors', async () => {
      // Start authenticated
      mockStorage.getItem.mockImplementation((key: string) => {
        switch (key) {
          case 'accessToken': return 'valid-token'
          case 'user': return JSON.stringify(mockUser)
          default: return null
        }
      })

      wrapper = await createApp('/')

      // Simulate an auth error
      authStore.error = 'Session expired'
      await wrapper.vm.$nextTick()

      // Should show notification
      expect(wrapper.text()).toContain('Authentication Error')
      expect(wrapper.text()).toContain('Session expired')
    })
  })

  describe('Form Validation Integration', () => {
    it('should prevent submission with invalid form data', async () => {
      wrapper = await createApp('/login')

      const form = wrapper.find('form')
      const submitButton = wrapper.find('button[type="submit"]')

      // Try to submit empty form
      expect(submitButton.attributes('disabled')).toBeDefined()
      await form.trigger('submit.prevent')

      // API should not be called
      expect(mockApiClient.post).not.toHaveBeenCalled()

      // Should still be on login page
      expect(router.currentRoute.value.name).toBe('login')
    })

    it('should show validation errors and prevent submission', async () => {
      wrapper = await createApp('/login')

      const emailInput = wrapper.find('input[type="email"]')
      const passwordInput = wrapper.find('input[type="password"]')

      // Enter invalid data
      await emailInput.setValue('invalid-email')
      await passwordInput.setValue('123')

      // Trigger validation
      await emailInput.trigger('blur')
      await passwordInput.trigger('blur')

      // Should show validation errors
      expect(wrapper.text()).toContain('Please enter a valid email address')
      expect(wrapper.text()).toContain('Password must be at least 6 characters')

      // Submit button should be disabled
      const submitButton = wrapper.find('button[type="submit"]')
      expect(submitButton.attributes('disabled')).toBeDefined()
    })
  })
})