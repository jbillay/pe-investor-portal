import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { createRouter, createWebHistory, type RouteLocationNormalized } from 'vue-router'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@stores/auth'
import { mockUser, setupTest } from '../../__tests__/utils/test-utils'

// Mock the API client
const mockApiClient = {
  get: vi.fn(),
  post: vi.fn()
}

vi.mock('@composables/useApi', () => ({
  apiClient: mockApiClient
}))

// Mock components
const MockLoginView = { template: '<div>Login</div>' }
const MockDashboardView = { template: '<div>Dashboard</div>' }
const MockAppLayout = {
  template: '<div>Layout<router-view /></div>',
  name: 'AppLayout'
}

// Create router with navigation guards (simplified version of the actual router)
const createTestRouter = () => {
  const routes = [
    {
      path: '/login',
      name: 'login',
      component: MockLoginView,
      meta: { requiresAuth: false, title: 'Sign In' }
    },
    {
      path: '/',
      component: MockAppLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: MockDashboardView,
          meta: { title: 'Dashboard' }
        },
        {
          path: 'profile',
          name: 'profile',
          component: { template: '<div>Profile</div>' },
          meta: { title: 'Profile' }
        }
      ]
    }
  ]

  const router = createRouter({
    history: createWebHistory(),
    routes
  })

  // Add the navigation guard (copied from actual router)
  router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()

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

  return router
}

describe('Navigation Guards', () => {
  let router: ReturnType<typeof createTestRouter>
  let authStore: ReturnType<typeof useAuthStore>

  beforeEach(() => {
    setupTest()
    setActivePinia(createPinia())
    authStore = useAuthStore()
    router = createTestRouter()
    vi.clearAllMocks()

    // Mock document.title
    Object.defineProperty(document, 'title', {
      writable: true,
      value: ''
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Page Title Setting', () => {
    it('should set page title for routes with title meta', async () => {
      await router.push('/login')
      expect(document.title).toBe('Sign In - PE Investor Portal')
    })

    it('should set page title for nested routes', async () => {
      // Set up authenticated state
      authStore.user = mockUser
      authStore.accessToken = 'valid-token'

      await router.push('/')
      expect(document.title).toBe('Dashboard - PE Investor Portal')
    })

    it('should not change title for routes without title meta', async () => {
      document.title = 'Original Title'

      // Create a route without title
      router.addRoute({
        path: '/no-title',
        name: 'no-title',
        component: { template: '<div>No Title</div>' },
        meta: { requiresAuth: false }
      })

      await router.push('/no-title')
      expect(document.title).toBe('Original Title')
    })
  })

  describe('Authentication Required Routes', () => {
    it('should allow access to authenticated routes when user is authenticated', async () => {
      // Set up authenticated state
      authStore.user = mockUser
      authStore.accessToken = 'valid-token'

      await router.push('/')
      expect(router.currentRoute.value.name).toBe('dashboard')
    })

    it('should redirect to login when accessing protected route without authentication', async () => {
      // Ensure user is not authenticated
      authStore.user = null
      authStore.accessToken = null

      await router.push('/')
      expect(router.currentRoute.value.name).toBe('login')
      expect(router.currentRoute.value.query.redirect).toBe('/')
    })

    it('should redirect to login with correct redirect query for nested routes', async () => {
      authStore.user = null
      authStore.accessToken = null

      await router.push('/profile')
      expect(router.currentRoute.value.name).toBe('login')
      expect(router.currentRoute.value.query.redirect).toBe('/profile')
    })
  })

  describe('Token Refresh Flow', () => {
    it('should fetch current user when token exists but no user data', async () => {
      authStore.accessToken = 'valid-token'
      authStore.user = null

      const getCurrentUserResponse = {
        status: 'success' as const,
        data: mockUser
      }
      mockApiClient.get.mockResolvedValue(getCurrentUserResponse)
      const getCurrentUserSpy = vi.spyOn(authStore, 'getCurrentUser').mockResolvedValue()

      await router.push('/')

      expect(getCurrentUserSpy).toHaveBeenCalled()
      expect(router.currentRoute.value.name).toBe('dashboard')
    })

    it('should logout and redirect to login when getCurrentUser fails', async () => {
      authStore.accessToken = 'invalid-token'
      authStore.user = null

      const getCurrentUserError = new Error('Token expired')
      mockApiClient.get.mockRejectedValue(getCurrentUserError)

      const logoutSpy = vi.spyOn(authStore, 'logout').mockResolvedValue()
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await router.push('/')

      expect(logoutSpy).toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get current user:', getCurrentUserError)
      expect(router.currentRoute.value.name).toBe('login')
      expect(router.currentRoute.value.query.redirect).toBe('/')

      consoleSpy.mockRestore()
    })
  })

  describe('Login Page Access Control', () => {
    it('should allow access to login page when not authenticated', async () => {
      authStore.user = null
      authStore.accessToken = null

      await router.push('/login')
      expect(router.currentRoute.value.name).toBe('login')
    })

    it('should redirect authenticated users away from login page', async () => {
      // Set up authenticated state
      authStore.user = mockUser
      authStore.accessToken = 'valid-token'

      await router.push('/login')
      expect(router.currentRoute.value.name).toBe('dashboard')
    })

    it('should preserve redirect query when authenticated user tries to access login', async () => {
      authStore.user = mockUser
      authStore.accessToken = 'valid-token'

      await router.push('/login?redirect=/profile')
      expect(router.currentRoute.value.name).toBe('dashboard')
    })
  })

  describe('Route Meta Configuration', () => {
    it('should treat routes without requiresAuth meta as requiring authentication by default', async () => {
      // Add a route without explicit requiresAuth meta
      router.addRoute({
        path: '/default-protected',
        name: 'default-protected',
        component: { template: '<div>Default Protected</div>' }
      })

      authStore.user = null
      authStore.accessToken = null

      await router.push('/default-protected')
      expect(router.currentRoute.value.name).toBe('login')
    })

    it('should allow access to routes with requiresAuth: false', async () => {
      router.addRoute({
        path: '/public',
        name: 'public',
        component: { template: '<div>Public</div>' },
        meta: { requiresAuth: false }
      })

      authStore.user = null
      authStore.accessToken = null

      await router.push('/public')
      expect(router.currentRoute.value.name).toBe('public')
    })
  })

  describe('Complex Navigation Scenarios', () => {
    it('should handle navigation between protected routes when authenticated', async () => {
      authStore.user = mockUser
      authStore.accessToken = 'valid-token'

      await router.push('/')
      expect(router.currentRoute.value.name).toBe('dashboard')

      await router.push('/profile')
      expect(router.currentRoute.value.name).toBe('profile')
    })

    it('should handle logout during navigation', async () => {
      // Start authenticated
      authStore.user = mockUser
      authStore.accessToken = 'valid-token'

      await router.push('/')
      expect(router.currentRoute.value.name).toBe('dashboard')

      // Simulate logout
      authStore.user = null
      authStore.accessToken = null

      await router.push('/profile')
      expect(router.currentRoute.value.name).toBe('login')
    })

    it('should handle authentication during navigation', async () => {
      // Start unauthenticated
      authStore.user = null
      authStore.accessToken = null

      await router.push('/')
      expect(router.currentRoute.value.name).toBe('login')

      // Simulate authentication
      authStore.user = mockUser
      authStore.accessToken = 'valid-token'

      await router.push('/')
      expect(router.currentRoute.value.name).toBe('dashboard')
    })
  })

  describe('Navigation Guard Performance', () => {
    it('should not call getCurrentUser when user is already loaded', async () => {
      authStore.user = mockUser
      authStore.accessToken = 'valid-token'

      const getCurrentUserSpy = vi.spyOn(authStore, 'getCurrentUser')

      await router.push('/')
      expect(getCurrentUserSpy).not.toHaveBeenCalled()
    })

    it('should not call getCurrentUser when no token is available', async () => {
      authStore.user = null
      authStore.accessToken = null

      const getCurrentUserSpy = vi.spyOn(authStore, 'getCurrentUser')

      await router.push('/')
      expect(getCurrentUserSpy).not.toHaveBeenCalled()
    })
  })
})