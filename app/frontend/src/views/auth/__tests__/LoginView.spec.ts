import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import LoginView from '../LoginView.vue'
import { useAuthStore } from '@/stores/auth'
import { createRouter, createMemoryHistory } from 'vue-router'

// Create a mock router
const createMockRouter = (currentRoute = { query: {} }) => {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
      { path: '/login', name: 'login', component: LoginView },
      { path: '/forgot-password', name: 'forgot-password', component: { template: '<div>Forgot Password</div>' } },
      { path: '/set-password', name: 'set-password', component: { template: '<div>Set Password</div>' } },
    ],
  })
}

describe('LoginView', () => {
  let wrapper: VueWrapper
  let mockRouter: any
  let authStore: any

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()

    // Create router
    mockRouter = createMockRouter()

    // Create wrapper with testing pinia
    wrapper = mount(LoginView, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              auth: {
                user: null,
                accessToken: null,
                isLoading: false,
                error: null,
                isAuthenticated: false,
                requiresPasswordChange: false,
              },
            },
          }),
          mockRouter,
        ],
        stubs: {
          'router-link': {
            template: '<a><slot /></a>',
          },
        },
      },
    })

    // Get auth store instance
    authStore = useAuthStore()
  })

  describe('Component Rendering', () => {
    it('should render the login form', () => {
      expect(wrapper.find('form').exists()).toBe(true)
    })

    it('should display the correct heading', () => {
      expect(wrapper.text()).toContain('Sign in to your account')
      expect(wrapper.text()).toContain('Welcome back to PE Investor Portal')
    })

    it('should display branding logo', () => {
      const logo = wrapper.find('.bg-primary-600')
      expect(logo.exists()).toBe(true)
      expect(logo.text()).toContain('PI')
    })

    it('should render email input field', () => {
      const emailInput = wrapper.find('#email')
      expect(emailInput.exists()).toBe(true)
      expect(emailInput.attributes('type')).toBe('email')
      expect(emailInput.attributes('required')).toBeDefined()
    })

    it('should render password input field', () => {
      const passwordInput = wrapper.find('#password')
      expect(passwordInput.exists()).toBe(true)
      expect(passwordInput.attributes('type')).toBe('password')
      expect(passwordInput.attributes('required')).toBeDefined()
    })

    it('should render remember me checkbox', () => {
      const checkbox = wrapper.find('#remember-me')
      expect(checkbox.exists()).toBe(true)
      expect(checkbox.attributes('type')).toBe('checkbox')
    })

    it('should render forgot password link', () => {
      expect(wrapper.text()).toContain('Forgot your password?')
    })

    it('should render sign in button', () => {
      const button = wrapper.find('button[type="submit"]')
      expect(button.exists()).toBe(true)
      expect(button.text()).toContain('Sign in')
    })

    it('should render contact administrator text', () => {
      expect(wrapper.text()).toContain("Don't have an account?")
      expect(wrapper.text()).toContain('Contact your administrator')
    })
  })

  describe('Form Validation', () => {
    it('should show email required error on blur when empty', async () => {
      const emailInput = wrapper.find('#email')

      // Trigger blur event
      await emailInput.trigger('blur')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Email is required')
    })

    it('should show invalid email format error', async () => {
      const emailInput = wrapper.find('#email')

      // Set invalid email
      await emailInput.setValue('invalid-email')
      await emailInput.trigger('blur')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Please enter a valid email address')
    })

    it('should accept valid email format', async () => {
      const emailInput = wrapper.find('#email')

      // Set valid email
      await emailInput.setValue('test@example.com')
      await emailInput.trigger('blur')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).not.toContain('Email is required')
      expect(wrapper.text()).not.toContain('Please enter a valid email address')
    })

    it('should show password required error on blur when empty', async () => {
      const passwordInput = wrapper.find('#password')

      // Trigger blur event
      await passwordInput.trigger('blur')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Password is required')
    })

    it('should show password too short error', async () => {
      const passwordInput = wrapper.find('#password')

      // Set short password
      await passwordInput.setValue('12345')
      await passwordInput.trigger('blur')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Password must be at least 6 characters')
    })

    it('should accept valid password', async () => {
      const passwordInput = wrapper.find('#password')

      // Set valid password
      await passwordInput.setValue('password123')
      await passwordInput.trigger('blur')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).not.toContain('Password is required')
      expect(wrapper.text()).not.toContain('Password must be at least 6 characters')
    })

    it('should clear email error on input', async () => {
      const emailInput = wrapper.find('#email')

      // Trigger error first
      await emailInput.trigger('blur')
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('Email is required')

      // Type in field
      await emailInput.setValue('t')
      await emailInput.trigger('input')
      await wrapper.vm.$nextTick()

      // Error should be cleared
      expect(wrapper.text()).not.toContain('Email is required')
    })

    it('should clear password error on input', async () => {
      const passwordInput = wrapper.find('#password')

      // Trigger error first
      await passwordInput.trigger('blur')
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('Password is required')

      // Type in field
      await passwordInput.setValue('p')
      await passwordInput.trigger('input')
      await wrapper.vm.$nextTick()

      // Error should be cleared
      expect(wrapper.text()).not.toContain('Password is required')
    })

    it('should disable submit button when form is invalid', async () => {
      const button = wrapper.find('button[type="submit"]')
      expect(button.attributes('disabled')).toBeDefined()
    })

    it('should enable submit button when form is valid', async () => {
      const emailInput = wrapper.find('#email')
      const passwordInput = wrapper.find('#password')

      await emailInput.setValue('test@example.com')
      await passwordInput.setValue('password123')
      await wrapper.vm.$nextTick()

      const button = wrapper.find('button[type="submit"]')
      expect(button.attributes('disabled')).toBeUndefined()
    })
  })

  describe('User Interactions', () => {
    it('should toggle password visibility when eye icon is clicked', async () => {
      const passwordInput = wrapper.find('#password')
      const toggleButton = wrapper.findAll('button[type="button"]')[0]

      // Initially password should be hidden
      expect(passwordInput.attributes('type')).toBe('password')

      // Click toggle button
      await toggleButton.trigger('click')
      await wrapper.vm.$nextTick()

      // Password should be visible
      expect(passwordInput.attributes('type')).toBe('text')

      // Click again to hide
      await toggleButton.trigger('click')
      await wrapper.vm.$nextTick()

      // Password should be hidden again
      expect(passwordInput.attributes('type')).toBe('password')
    })

    it('should update email value on input', async () => {
      const emailInput = wrapper.find('#email')

      await emailInput.setValue('user@example.com')
      await wrapper.vm.$nextTick()

      expect((emailInput.element as HTMLInputElement).value).toBe('user@example.com')
    })

    it('should update password value on input', async () => {
      const passwordInput = wrapper.find('#password')

      await passwordInput.setValue('mypassword')
      await wrapper.vm.$nextTick()

      expect((passwordInput.element as HTMLInputElement).value).toBe('mypassword')
    })

    it('should toggle remember me checkbox', async () => {
      const checkbox = wrapper.find('#remember-me')

      // Initially unchecked
      expect((checkbox.element as HTMLInputElement).checked).toBe(false)

      // Check it
      await checkbox.setValue(true)
      await wrapper.vm.$nextTick()

      expect((checkbox.element as HTMLInputElement).checked).toBe(true)
    })
  })

  describe('Login Flow', () => {
    it('should call authStore.login with correct credentials on submit', async () => {
      const emailInput = wrapper.find('#email')
      const passwordInput = wrapper.find('#password')
      const form = wrapper.find('form')

      // Fill in form
      await emailInput.setValue('test@example.com')
      await passwordInput.setValue('password123')
      await wrapper.vm.$nextTick()

      // Mock successful login
      authStore.login.mockResolvedValue(undefined)

      // Submit form
      await form.trigger('submit.prevent')
      await wrapper.vm.$nextTick()

      // Verify login was called with correct credentials
      expect(authStore.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })

    it('should redirect to dashboard on successful login', async () => {
      const emailInput = wrapper.find('#email')
      const passwordInput = wrapper.find('#password')
      const form = wrapper.find('form')

      // Fill in form
      await emailInput.setValue('test@example.com')
      await passwordInput.setValue('password123')
      await wrapper.vm.$nextTick()

      // Mock successful login
      authStore.login.mockResolvedValue(undefined)
      authStore.isAuthenticated = true

      // Spy on router push
      const pushSpy = vi.spyOn(mockRouter, 'push')

      // Submit form
      await form.trigger('submit.prevent')
      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0)) // Wait for async operations

      // Verify redirect
      expect(pushSpy).toHaveBeenCalledWith('/')
    })

    it('should redirect to intended page when redirect query param exists', async () => {
      // Recreate wrapper with redirect query param
      mockRouter = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
          { path: '/login', name: 'login', component: LoginView },
          { path: '/profile', name: 'profile', component: { template: '<div>Profile</div>' } },
        ],
      })

      await mockRouter.push({ path: '/login', query: { redirect: '/profile' } })

      wrapper = mount(LoginView, {
        global: {
          plugins: [
            createTestingPinia({
              createSpy: vi.fn,
              initialState: {
                auth: {
                  user: null,
                  accessToken: null,
                  isLoading: false,
                  error: null,
                  isAuthenticated: false,
                  requiresPasswordChange: false,
                },
              },
            }),
            mockRouter,
          ],
        },
      })

      authStore = useAuthStore()

      const emailInput = wrapper.find('#email')
      const passwordInput = wrapper.find('#password')
      const form = wrapper.find('form')

      // Fill in form
      await emailInput.setValue('test@example.com')
      await passwordInput.setValue('password123')
      await wrapper.vm.$nextTick()

      // Mock successful login
      authStore.login.mockResolvedValue(undefined)
      authStore.isAuthenticated = true

      // Spy on router push
      const pushSpy = vi.spyOn(mockRouter, 'push')

      // Submit form
      await form.trigger('submit.prevent')
      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      // Verify redirect to intended page
      expect(pushSpy).toHaveBeenCalledWith('/profile')
    })

    it('should redirect to set-password when requiresPasswordChange is true', async () => {
      const emailInput = wrapper.find('#email')
      const passwordInput = wrapper.find('#password')
      const form = wrapper.find('form')

      // Fill in form
      await emailInput.setValue('test@example.com')
      await passwordInput.setValue('password123')
      await wrapper.vm.$nextTick()

      // Mock successful login with password change required
      authStore.login.mockResolvedValue(undefined)
      authStore.isAuthenticated = true
      authStore.requiresPasswordChange = true

      // Spy on router push
      const pushSpy = vi.spyOn(mockRouter, 'push')

      // Submit form
      await form.trigger('submit.prevent')
      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      // Verify redirect to set-password
      expect(pushSpy).toHaveBeenCalledWith({ name: 'set-password' })
    })

    it('should display error message on failed login', async () => {
      const emailInput = wrapper.find('#email')
      const passwordInput = wrapper.find('#password')
      const form = wrapper.find('form')

      // Fill in form
      await emailInput.setValue('test@example.com')
      await passwordInput.setValue('wrongpassword')
      await wrapper.vm.$nextTick()

      // Mock failed login
      authStore.login.mockRejectedValue(new Error('Invalid credentials'))
      authStore.error = 'Invalid email or password'

      // Submit form
      await form.trigger('submit.prevent')
      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))

      // Verify error is displayed
      expect(wrapper.text()).toContain('Sign in failed')
      expect(wrapper.text()).toContain('Invalid email or password')
    })

    it('should show loading state during login', async () => {
      const emailInput = wrapper.find('#email')
      const passwordInput = wrapper.find('#password')

      // Fill in form
      await emailInput.setValue('test@example.com')
      await passwordInput.setValue('password123')
      await wrapper.vm.$nextTick()

      // Set loading state
      authStore.isLoading = true
      await wrapper.vm.$nextTick()

      // Verify loading indicator is shown
      expect(wrapper.text()).toContain('Signing in...')

      // Verify button is disabled
      const button = wrapper.find('button[type="submit"]')
      expect(button.attributes('disabled')).toBeDefined()
    })

    it('should not submit form if email is invalid', async () => {
      const emailInput = wrapper.find('#email')
      const passwordInput = wrapper.find('#password')
      const form = wrapper.find('form')

      // Fill in form with invalid email
      await emailInput.setValue('invalid-email')
      await passwordInput.setValue('password123')
      await wrapper.vm.$nextTick()

      // Submit form
      await form.trigger('submit.prevent')
      await wrapper.vm.$nextTick()

      // Verify login was not called
      expect(authStore.login).not.toHaveBeenCalled()
    })

    it('should not submit form if password is too short', async () => {
      const emailInput = wrapper.find('#email')
      const passwordInput = wrapper.find('#password')
      const form = wrapper.find('form')

      // Fill in form with short password
      await emailInput.setValue('test@example.com')
      await passwordInput.setValue('12345')
      await wrapper.vm.$nextTick()

      // Submit form
      await form.trigger('submit.prevent')
      await wrapper.vm.$nextTick()

      // Verify login was not called
      expect(authStore.login).not.toHaveBeenCalled()
    })
  })

  describe('Store Integration', () => {
    it('should clear errors on mount', () => {
      expect(authStore.clearError).toHaveBeenCalled()
    })

    it('should clear store errors when typing in email field', async () => {
      const emailInput = wrapper.find('#email')

      // Reset mock call count
      authStore.clearError.mockClear()

      // Type in email field
      await emailInput.setValue('test@example.com')
      await emailInput.trigger('input')
      await wrapper.vm.$nextTick()

      // Verify clearError was called
      expect(authStore.clearError).toHaveBeenCalled()
    })

    it('should clear store errors when typing in password field', async () => {
      const passwordInput = wrapper.find('#password')

      // Reset mock call count
      authStore.clearError.mockClear()

      // Type in password field
      await passwordInput.setValue('password123')
      await passwordInput.trigger('input')
      await wrapper.vm.$nextTick()

      // Verify clearError was called
      expect(authStore.clearError).toHaveBeenCalled()
    })
  })
})
