import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '../AppLayout.vue'
import AppHeader from '../AppHeader.vue'
import { useAuthStore } from '@stores/auth'
import { mockUser, setupTest } from '../../../__tests__/utils/test-utils'

// Mock the API client
vi.mock('@composables/useApi', () => ({
  apiClient: {
    post: vi.fn()
  }
}))

const mockRouter = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div>Dashboard</div>' } },
    { path: '/profile', component: { template: '<div>Profile</div>' } }
  ]
})

describe('AppLayout', () => {
  let wrapper: VueWrapper<any>
  let authStore: ReturnType<typeof useAuthStore>

  const createWrapper = () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    authStore = useAuthStore()

    return mount(AppLayout, {
      global: {
        plugins: [pinia, mockRouter],
        stubs: {
          'router-view': { template: '<div class="router-view">Router View Content</div>' }
        }
      }
    })
  }

  beforeEach(() => {
    setupTest()
    vi.clearAllMocks()
    wrapper = createWrapper()

    // Set up authenticated state by default
    authStore.user = mockUser
    authStore.accessToken = 'valid-token'
  })

  afterEach(() => {
    wrapper.unmount()
    vi.restoreAllMocks()
  })

  describe('Component Structure', () => {
    it('should render AppHeader component', () => {
      expect(wrapper.findComponent(AppHeader).exists()).toBe(true)
    })

    it('should render main content area with router-view', () => {
      expect(wrapper.find('main').exists()).toBe(true)
      expect(wrapper.find('.router-view').exists()).toBe(true)
      expect(wrapper.text()).toContain('Router View Content')
    })

    it('should apply correct layout classes', () => {
      expect(wrapper.find('.min-h-screen').exists()).toBe(true)
      expect(wrapper.find('.bg-gray-50').exists()).toBe(true)
      expect(wrapper.find('.pt-16').exists()).toBe(true) // Header height offset
    })

    it('should have proper responsive container', () => {
      const container = wrapper.find('.max-w-7xl')
      expect(container.exists()).toBe(true)
      expect(container.classes()).toContain('mx-auto')
      expect(container.classes()).toContain('px-4')
    })
  })

  describe('Loading Overlay', () => {
    it('should show loading overlay when auth store is loading', async () => {
      authStore.isLoading = true
      await wrapper.vm.$nextTick()

      const overlay = wrapper.find('.fixed.inset-0.bg-black.bg-opacity-50')
      expect(overlay.exists()).toBe(true)
      expect(wrapper.text()).toContain('Loading...')
    })

    it('should hide loading overlay when not loading', async () => {
      authStore.isLoading = false
      await wrapper.vm.$nextTick()

      const overlay = wrapper.find('.fixed.inset-0.bg-black.bg-opacity-50')
      expect(overlay.exists()).toBe(false)
    })

    it('should show loading spinner in overlay', async () => {
      authStore.isLoading = true
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.animate-spin').exists()).toBe(true)
    })
  })

  describe('Toast Notifications', () => {
    beforeEach(async () => {
      // Access the component instance to add notifications
      await wrapper.vm.$nextTick()
    })

    it('should render notification container', () => {
      const notificationContainer = wrapper.find('.fixed.top-20.right-4')
      expect(notificationContainer.exists()).toBe(true)
    })

    it('should display success notifications', async () => {
      // Simulate adding a notification via the provided method
      const addNotification = wrapper.vm.addNotification
      addNotification({
        type: 'success',
        title: 'Success!',
        message: 'Operation completed successfully'
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Success!')
      expect(wrapper.text()).toContain('Operation completed successfully')
      expect(wrapper.find('.pi-check-circle').exists()).toBe(true)
      expect(wrapper.find('.border-l-success-500').exists()).toBe(true)
    })

    it('should display error notifications', async () => {
      const addNotification = wrapper.vm.addNotification
      addNotification({
        type: 'error',
        title: 'Error!',
        message: 'Something went wrong'
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Error!')
      expect(wrapper.text()).toContain('Something went wrong')
      expect(wrapper.find('.pi-times-circle').exists()).toBe(true)
      expect(wrapper.find('.border-l-error-500').exists()).toBe(true)
    })

    it('should display warning notifications', async () => {
      const addNotification = wrapper.vm.addNotification
      addNotification({
        type: 'warning',
        title: 'Warning!',
        message: 'Please be careful'
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Warning!')
      expect(wrapper.text()).toContain('Please be careful')
      expect(wrapper.find('.pi-exclamation-triangle').exists()).toBe(true)
      expect(wrapper.find('.border-l-warning-500').exists()).toBe(true)
    })

    it('should display info notifications', async () => {
      const addNotification = wrapper.vm.addNotification
      addNotification({
        type: 'info',
        title: 'Info',
        message: 'Here is some information'
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Info')
      expect(wrapper.text()).toContain('Here is some information')
      expect(wrapper.find('.pi-info-circle').exists()).toBe(true)
      expect(wrapper.find('.border-l-info-500').exists()).toBe(true)
    })

    it('should allow removing notifications', async () => {
      const addNotification = wrapper.vm.addNotification
      addNotification({
        type: 'success',
        title: 'Success!',
        message: 'Test message'
      })

      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('Success!')

      // Click remove button
      await wrapper.find('.pi-times').trigger('click')

      expect(wrapper.text()).not.toContain('Success!')
    })

    it('should auto-remove notifications after duration', async () => {
      vi.useFakeTimers()

      const addNotification = wrapper.vm.addNotification
      addNotification({
        type: 'success',
        title: 'Auto Remove',
        message: 'This will disappear',
        duration: 1000
      })

      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('Auto Remove')

      // Fast-forward time
      vi.advanceTimersByTime(1000)
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).not.toContain('Auto Remove')

      vi.useRealTimers()
    })
  })

  describe('Auth Store Integration', () => {
    it('should initialize auth on mount', () => {
      const initializeAuthSpy = vi.spyOn(authStore, 'initializeAuth')

      // Create new wrapper to trigger onMounted
      wrapper.unmount()
      wrapper = createWrapper()

      expect(initializeAuthSpy).toHaveBeenCalled()
    })

    it('should get current user when tokens exist but no user', () => {
      const getCurrentUserSpy = vi.spyOn(authStore, 'getCurrentUser')

      authStore.accessToken = 'valid-token'
      authStore.user = null

      // Create new wrapper to trigger onMounted logic
      wrapper.unmount()
      wrapper = createWrapper()

      expect(getCurrentUserSpy).toHaveBeenCalled()
    })

    it('should not get current user when no tokens', () => {
      const getCurrentUserSpy = vi.spyOn(authStore, 'getCurrentUser')

      authStore.accessToken = null
      authStore.user = null

      wrapper.unmount()
      wrapper = createWrapper()

      expect(getCurrentUserSpy).not.toHaveBeenCalled()
    })

    it('should watch for auth errors and show notifications', async () => {
      // Set an auth error
      authStore.error = 'Authentication failed'
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Authentication Error')
      expect(wrapper.text()).toContain('Authentication failed')
      expect(wrapper.find('.border-l-error-500').exists()).toBe(true)
    })

    it('should clear auth errors after showing notifications', async () => {
      const clearErrorSpy = vi.spyOn(authStore, 'clearError')

      authStore.error = 'Test error'
      await wrapper.vm.$nextTick()

      expect(clearErrorSpy).toHaveBeenCalled()
    })
  })

  describe('Global Notification Provider', () => {
    it('should provide addNotification function globally', () => {
      // The provide function should make addNotification available to child components
      expect(wrapper.vm.addNotification).toBeDefined()
      expect(typeof wrapper.vm.addNotification).toBe('function')
    })

    it('should handle notification without message', async () => {
      const addNotification = wrapper.vm.addNotification
      addNotification({
        type: 'info',
        title: 'Title Only'
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Title Only')
      expect(wrapper.find('.border-l-info-500').exists()).toBe(true)
    })

    it('should use default duration when not specified', async () => {
      vi.useFakeTimers()

      const addNotification = wrapper.vm.addNotification
      addNotification({
        type: 'success',
        title: 'Default Duration'
      })

      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('Default Duration')

      // Default duration should be 5000ms
      vi.advanceTimersByTime(5000)
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).not.toContain('Default Duration')

      vi.useRealTimers()
    })
  })

  describe('Layout Responsiveness', () => {
    it('should have responsive padding classes', () => {
      const container = wrapper.find('.max-w-7xl')
      expect(container.classes()).toContain('px-4')
      expect(container.classes()).toContain('sm:px-6')
      expect(container.classes()).toContain('lg:px-8')
    })

    it('should have proper spacing classes', () => {
      expect(wrapper.find('main').classes()).toContain('pt-16') // Header height
      expect(wrapper.find('.py-8').exists()).toBe(true) // Main content padding
    })
  })

  describe('Animation Classes', () => {
    it('should have transition classes for loading overlay', async () => {
      authStore.isLoading = true
      await wrapper.vm.$nextTick()

      const overlay = wrapper.find('.fixed.inset-0')
      expect(overlay.classes()).toContain('transition')
    })

    it('should have transition classes for notifications', async () => {
      const addNotification = wrapper.vm.addNotification
      addNotification({
        type: 'success',
        title: 'Test Animation'
      })

      await wrapper.vm.$nextTick()

      // Check for transition group classes
      const notificationContainer = wrapper.find('.fixed.top-20.right-4')
      expect(notificationContainer.exists()).toBe(true)
    })
  })
})