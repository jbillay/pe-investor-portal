import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../LoginView.vue'
import { useAuthStore } from '@stores/auth'
import { mockUser, mockLoginResponse, setupTest } from '../../../__tests__/utils/test-utils'

// Mock the API client
const mockApiClient = {
  post: vi.fn()
}

vi.mock('@composables/useApi', () => ({
  apiClient: mockApiClient
}))

// Mock router
const mockRouter = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginView },
    { path: '/', name: 'dashboard', component: { template: '<div>Dashboard</div>' } }
  ]
})

const mockRoute = {
  query: {},
  params: {},
  name: 'login',
  path: '/login'
}

describe('LoginView', () => {
  let wrapper: VueWrapper<any>
  let authStore: ReturnType<typeof useAuthStore>

  const createWrapper = (routeQuery = {}) => {
    const pinia = createPinia()
    setActivePinia(pinia)
    authStore = useAuthStore()

    return mount(LoginView, {
      global: {
        plugins: [pinia, mockRouter],
        mocks: {
          $route: { ...mockRoute, query: routeQuery },
          $router: {
            push: vi.fn()
          }
        },
        stubs: {
          'router-link': true
        }
      }
    })
  }

  beforeEach(() => {
    setupTest()
    vi.clearAllMocks()
    wrapper = createWrapper()
  })

  afterEach(() => {
    wrapper.unmount()
    vi.restoreAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render login form correctly', () => {
      expect(wrapper.find('h2').text()).toBe('Sign in to your account')
      expect(wrapper.find('input[type="email"]').exists()).toBe(true)
      expect(wrapper.find('input[type="password"]').exists()).toBe(true)
      expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
    })

    it('should render logo and branding', () => {
      expect(wrapper.find('.bg-primary-600').text()).toContain('PI')
      expect(wrapper.text()).toContain('PE Investor Portal')
    })

    it('should render remember me checkbox', () => {
      expect(wrapper.find('input[type="checkbox"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Remember me')
    })

    it('should render forgot password link', () => {
      expect(wrapper.text()).toContain('Forgot your password?')
    })
  })

  describe('Form Validation', () => {
    it('should show email validation error for invalid email', async () => {
      const emailInput = wrapper.find('input[type="email"]')

      await emailInput.setValue('invalid-email')
      await emailInput.trigger('blur')

      expect(wrapper.text()).toContain('Please enter a valid email address')
      expect(wrapper.find('input[type="email"]').classes()).toContain('border-error-500')
    })

    it('should show email required error', async () => {
      const emailInput = wrapper.find('input[type="email"]')

      await emailInput.setValue('')
      await emailInput.trigger('blur')

      expect(wrapper.text()).toContain('Email is required')
    })

    it('should show password validation error for short password', async () => {
      const passwordInput = wrapper.find('input[type="password"]')

      await passwordInput.setValue('123')
      await passwordInput.trigger('blur')

      expect(wrapper.text()).toContain('Password must be at least 6 characters')
      expect(wrapper.find('input[type="password"]').classes()).toContain('border-error-500')
    })

    it('should show password required error', async () => {
      const passwordInput = wrapper.find('input[type="password"]')

      await passwordInput.setValue('')
      await passwordInput.trigger('blur')

      expect(wrapper.text()).toContain('Password is required')
    })

    it('should clear validation errors on input', async () => {
      const emailInput = wrapper.find('input[type="email"]')

      // Trigger validation error
      await emailInput.setValue('')
      await emailInput.trigger('blur')
      expect(wrapper.text()).toContain('Email is required')

      // Clear error on input
      await emailInput.setValue('test@example.com')
      await emailInput.trigger('input')
      expect(wrapper.text()).not.toContain('Email is required')
    })
  })

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility', async () => {
      const passwordInput = wrapper.find('input[type="password"]')
      const toggleButton = wrapper.find('button[type="button"]')

      expect(passwordInput.attributes('type')).toBe('password')

      await toggleButton.trigger('click')
      expect(wrapper.find('input').attributes('type')).toBe('text')

      await toggleButton.trigger('click')
      expect(wrapper.find('input[type="password"]').attributes('type')).toBe('password')
    })

    it('should show correct icon for password visibility state', async () => {
      const toggleButton = wrapper.find('button[type="button"]')

      expect(toggleButton.find('.pi-eye').exists()).toBe(true)

      await toggleButton.trigger('click')
      expect(toggleButton.find('.pi-eye-slash').exists()).toBe(true)
    })
  })

  describe('Form Submission', () => {
    const fillValidForm = async () => {
      await wrapper.find('input[type="email"]').setValue('test@example.com')
      await wrapper.find('input[type="password"]').setValue('password123')
    }

    it('should not submit form with invalid data', async () => {
      const form = wrapper.find('form')
      const submitButton = wrapper.find('button[type="submit"]')

      expect(submitButton.attributes('disabled')).toBeDefined()

      await form.trigger('submit.prevent')
      expect(mockApiClient.post).not.toHaveBeenCalled()
    })

    it('should enable submit button with valid form data', async () => {
      await fillValidForm()

      const submitButton = wrapper.find('button[type="submit"]')
      expect(submitButton.attributes('disabled')).toBeUndefined()
    })

    it('should call auth store login on form submission', async () => {
      mockApiClient.post.mockResolvedValue(mockLoginResponse)
      const loginSpy = vi.spyOn(authStore, 'login').mockResolvedValue()

      await fillValidForm()
      await wrapper.find('form').trigger('submit.prevent')

      expect(loginSpy).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
    })

    it('should redirect to dashboard on successful login', async () => {
      mockApiClient.post.mockResolvedValue(mockLoginResponse)
      const routerPushSpy = vi.fn()
      wrapper.vm.$router.push = routerPushSpy

      await fillValidForm()
      await wrapper.find('form').trigger('submit.prevent')

      // Wait for async operations
      await wrapper.vm.$nextTick()

      expect(routerPushSpy).toHaveBeenCalledWith('/')
    })

    it('should redirect to intended page from query params', async () => {
      // Remount with redirect query
      wrapper.unmount()
      wrapper = createWrapper({ redirect: '/profile' })

      mockApiClient.post.mockResolvedValue(mockLoginResponse)
      const routerPushSpy = vi.fn()
      wrapper.vm.$router.push = routerPushSpy

      await fillValidForm()
      await wrapper.find('form').trigger('submit.prevent')

      await wrapper.vm.$nextTick()

      expect(routerPushSpy).toHaveBeenCalledWith('/profile')
    })

    it('should show loading state during login', async () => {
      let resolveLogin: (value: any) => void
      const loginPromise = new Promise(resolve => {
        resolveLogin = resolve
      })
      mockApiClient.post.mockReturnValue(loginPromise)

      await fillValidForm()
      const form = wrapper.find('form')
      await form.trigger('submit.prevent')

      // Check loading state
      expect(wrapper.text()).toContain('Signing in...')
      expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()

      // Resolve login and check normal state
      resolveLogin!(mockLoginResponse)
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Sign in')
      expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeUndefined()
    })
  })

  describe('Error Handling', () => {
    const fillValidForm = async () => {
      await wrapper.find('input[type="email"]').setValue('test@example.com')
      await wrapper.find('input[type="password"]').setValue('password123')
    }

    it('should display auth store errors', async () => {
      // Set error in auth store
      authStore.error = 'Invalid credentials'
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Sign in failed')
      expect(wrapper.text()).toContain('Invalid credentials')
    })

    it('should handle login failure', async () => {
      mockApiClient.post.mockRejectedValue({
        response: { data: { message: 'Invalid credentials' } }
      })

      await fillValidForm()
      await wrapper.find('form').trigger('submit.prevent')

      // Wait for error to appear
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Sign in failed')
    })

    it('should clear errors on mount', async () => {
      const clearErrorSpy = vi.spyOn(authStore, 'clearError')

      // Remount component
      wrapper.unmount()
      wrapper = createWrapper()

      expect(clearErrorSpy).toHaveBeenCalled()
    })
  })

  describe('Form State Management', () => {
    it('should handle remember me checkbox', async () => {
      const checkbox = wrapper.find('input[type="checkbox"]')

      expect((checkbox.element as HTMLInputElement).checked).toBe(false)

      await checkbox.setValue(true)
      expect((checkbox.element as HTMLInputElement).checked).toBe(true)
    })

    it('should maintain form state during validation', async () => {
      const emailInput = wrapper.find('input[type="email"]')
      const passwordInput = wrapper.find('input[type="password"]')

      await emailInput.setValue('test@example.com')
      await passwordInput.setValue('password123')

      // Trigger validation
      await emailInput.trigger('blur')
      await passwordInput.trigger('blur')

      // Values should be maintained
      expect((emailInput.element as HTMLInputElement).value).toBe('test@example.com')
      expect((passwordInput.element as HTMLInputElement).value).toBe('password123')
    })
  })

  describe('Accessibility', () => {
    it('should have proper labels for form fields', () => {
      const emailLabel = wrapper.find('label[for="email"]')
      const passwordLabel = wrapper.find('label[for="password"]')

      expect(emailLabel.text()).toBe('Email address')
      expect(passwordLabel.text()).toBe('Password')
    })

    it('should have proper form attributes', () => {
      const emailInput = wrapper.find('input[type="email"]')
      const passwordInput = wrapper.find('input[type="password"]')

      expect(emailInput.attributes('required')).toBeDefined()
      expect(emailInput.attributes('autocomplete')).toBe('email')
      expect(passwordInput.attributes('required')).toBeDefined()
      expect(passwordInput.attributes('autocomplete')).toBe('current-password')
    })
  })
})