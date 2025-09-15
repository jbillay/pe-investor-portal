import { createRouter, createWebHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { createApp } from 'vue'
import { mount, VueWrapper } from '@vue/test-utils'
import { vi } from 'vitest'
import PrimeVue from 'primevue/config'

// Mock API client
export const mockApiClient = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn()
}

// Mock router
export const createMockRouter = (routes = []) => {
  return createRouter({
    history: createWebHistory(),
    routes: [
      {
        path: '/login',
        name: 'login',
        component: { template: '<div>Login Page</div>' }
      },
      {
        path: '/',
        name: 'dashboard',
        component: { template: '<div>Dashboard Page</div>' }
      },
      ...routes
    ]
  })
}

// Test wrapper with all necessary providers
export const createTestWrapper = (component: any, options: any = {}) => {
  const pinia = createPinia()
  setActivePinia(pinia)

  const router = options.router || createMockRouter()

  const app = createApp(component)
  app.use(pinia)
  app.use(router)
  app.use(PrimeVue)

  return mount(component, {
    global: {
      plugins: [pinia, router, PrimeVue],
      stubs: {
        'router-view': true,
        'router-link': true,
        ...options.stubs
      }
    },
    ...options
  })
}

// Mock localStorage
export const mockLocalStorage = () => {
  const storage: Record<string, string> = {}

  return {
    getItem: vi.fn((key: string) => storage[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      storage[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete storage[key]
    }),
    clear: vi.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key])
    })
  }
}

// Mock user data
export const mockUser = {
  id: '1',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'investor',
  tenantId: 'tenant1',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
}

// Mock login response
export const mockLoginResponse = {
  status: 'success' as const,
  data: {
    user: mockUser,
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token'
  }
}

// Setup function for tests
export const setupTest = () => {
  const pinia = createPinia()
  setActivePinia(pinia)

  // Mock localStorage
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage(),
    writable: true
  })

  return { pinia }
}