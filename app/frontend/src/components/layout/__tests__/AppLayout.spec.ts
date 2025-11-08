import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createMemoryHistory } from 'vue-router'
import { nextTick } from 'vue'
import AppLayout from '../AppLayout.vue'
import { useAuthStore } from '@/stores/auth'

// Create a mock router
const createMockRouter = () => {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'dashboard', component: { template: '<div>Dashboard</div>' } },
      { path: '/login', name: 'login', component: { template: '<div>Login</div>' } },
    ],
  })
}

describe('AppLayout', () => {
  let wrapper: VueWrapper
  let mockRouter: any
  let authStore: any

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockRouter = createMockRouter()

    wrapper = mount(AppLayout, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              auth: {
                user: {
                  id: '1',
                  email: 'john.doe@example.com',
                  firstName: 'John',
                  lastName: 'Doe',
                  role: 'Admin',
                  roles: ['USER'],
                },
                accessToken: 'token123',
                isAuthenticated: true,
                isLoading: false,
                error: null,
              },
            },
          }),
          mockRouter,
        ],
        stubs: {
          'router-view': { template: '<div class="router-view-stub">Router View</div>' },
          AppHeader: { template: '<header class="app-header-stub">App Header</header>' },
          AppNavigation: { template: '<nav class="app-navigation-stub">App Navigation</nav>' },
        },
      },
    })

    authStore = useAuthStore()
  })

  afterEach(() => {
    wrapper.unmount()
    vi.useRealTimers()
  })

  describe('Component Rendering', () => {
    it('should render the main layout container', () => {
      const container = wrapper.find('.min-h-screen')
      expect(container.exists()).toBe(true)
      expect(container.classes()).toContain('bg-gray-50')
    })

    it('should render AppHeader component', () => {
      const header = wrapper.find('.app-header-stub')
      expect(header.exists()).toBe(true)
    })

    it('should render AppNavigation component', () => {
      const navigation = wrapper.find('.app-navigation-stub')
      expect(navigation.exists()).toBe(true)
    })

    it('should render AppNavigation with correct wrapper classes', () => {
      const navWrapper = wrapper.find('.pt-16')
      expect(navWrapper.exists()).toBe(true)
    })

    it('should render main content area', () => {
      const main = wrapper.find('main')
      expect(main.exists()).toBe(true)
      expect(main.classes()).toContain('pt-2')
    })

    it('should render main content with max-width container', () => {
      const container = wrapper.find('.max-w-7xl')
      expect(container.exists()).toBe(true)
      expect(container.classes()).toContain('mx-auto')
    })

    it('should render router-view inside main content', () => {
      const routerView = wrapper.find('.router-view-stub')
      expect(routerView.exists()).toBe(true)
    })
  })

  describe('Loading Overlay', () => {
    it('should not display loading overlay by default', () => {
      const loadingOverlay = wrapper.find('.fixed.inset-0.bg-black')
      expect(loadingOverlay.exists()).toBe(false)
    })

    it('should display loading overlay when isLoading is true', async () => {
      authStore.isLoading = true
      await nextTick()

      const loadingOverlay = wrapper.find('.fixed.inset-0.bg-black')
      expect(loadingOverlay.exists()).toBe(true)
    })

    it('should display loading overlay with correct z-index', async () => {
      authStore.isLoading = true
      await nextTick()

      const loadingOverlay = wrapper.find('.fixed.inset-0')
      expect(loadingOverlay.classes()).toContain('z-50')
    })

    it('should display loading spinner when loading', async () => {
      authStore.isLoading = true
      await nextTick()

      const spinner = wrapper.find('.animate-spin')
      expect(spinner.exists()).toBe(true)
      expect(spinner.classes()).toContain('rounded-full')
    })

    it('should display loading text when loading', async () => {
      authStore.isLoading = true
      await nextTick()

      expect(wrapper.text()).toContain('Loading...')
    })

    it('should hide loading overlay when isLoading is false', async () => {
      authStore.isLoading = true
      await nextTick()

      let loadingOverlay = wrapper.find('.fixed.inset-0.bg-black')
      expect(loadingOverlay.exists()).toBe(true)

      authStore.isLoading = false
      await nextTick()

      loadingOverlay = wrapper.find('.fixed.inset-0.bg-black')
      expect(loadingOverlay.exists()).toBe(false)
    })
  })

  describe('Toast Notifications', () => {
    it('should render notifications container', () => {
      const notificationContainer = wrapper.find('.fixed.top-20.right-4')
      expect(notificationContainer.exists()).toBe(true)
      expect(notificationContainer.classes()).toContain('z-40')
    })

    it('should not display notifications by default', () => {
      const notifications = wrapper.findAll('.max-w-sm')
      expect(notifications.length).toBe(0)
    })

    it('should display success notification', async () => {
      // Call addNotification through the provide
      const vm = wrapper.vm as any
      vm.addNotification({
        type: 'success',
        title: 'Success!',
        message: 'Operation completed successfully'
      })
      await nextTick()

      const notification = wrapper.find('.border-l-success-500')
      expect(notification.exists()).toBe(true)
      expect(notification.text()).toContain('Success!')
      expect(notification.text()).toContain('Operation completed successfully')
    })

    it('should display error notification', async () => {
      const vm = wrapper.vm as any
      vm.addNotification({
        type: 'error',
        title: 'Error!',
        message: 'Something went wrong'
      })
      await nextTick()

      const notification = wrapper.find('.border-l-error-500')
      expect(notification.exists()).toBe(true)
      expect(notification.text()).toContain('Error!')
      expect(notification.text()).toContain('Something went wrong')
    })

    it('should display warning notification', async () => {
      const vm = wrapper.vm as any
      vm.addNotification({
        type: 'warning',
        title: 'Warning!',
        message: 'Please be careful'
      })
      await nextTick()

      const notification = wrapper.find('.border-l-warning-500')
      expect(notification.exists()).toBe(true)
      expect(notification.text()).toContain('Warning!')
      expect(notification.text()).toContain('Please be careful')
    })

    it('should display info notification', async () => {
      const vm = wrapper.vm as any
      vm.addNotification({
        type: 'info',
        title: 'Info',
        message: 'Here is some information'
      })
      await nextTick()

      const notification = wrapper.find('.border-l-info-500')
      expect(notification.exists()).toBe(true)
      expect(notification.text()).toContain('Info')
      expect(notification.text()).toContain('Here is some information')
    })

    it('should display notification without message', async () => {
      const vm = wrapper.vm as any
      vm.addNotification({
        type: 'success',
        title: 'Success!'
      })
      await nextTick()

      const notification = wrapper.find('.border-l-success-500')
      expect(notification.exists()).toBe(true)
      expect(notification.text()).toContain('Success!')
    })

    it('should display success icon for success notification', async () => {
      const vm = wrapper.vm as any
      vm.addNotification({
        type: 'success',
        title: 'Success!'
      })
      await nextTick()

      const icon = wrapper.find('.pi-check-circle')
      expect(icon.exists()).toBe(true)
      expect(icon.classes()).toContain('text-success-500')
    })

    it('should display error icon for error notification', async () => {
      const vm = wrapper.vm as any
      vm.addNotification({
        type: 'error',
        title: 'Error!'
      })
      await nextTick()

      const icon = wrapper.find('.pi-times-circle')
      expect(icon.exists()).toBe(true)
      expect(icon.classes()).toContain('text-error-500')
    })

    it('should display warning icon for warning notification', async () => {
      const vm = wrapper.vm as any
      vm.addNotification({
        type: 'warning',
        title: 'Warning!'
      })
      await nextTick()

      const icon = wrapper.find('.pi-exclamation-triangle')
      expect(icon.exists()).toBe(true)
      expect(icon.classes()).toContain('text-warning-500')
    })

    it('should display info icon for info notification', async () => {
      const vm = wrapper.vm as any
      vm.addNotification({
        type: 'info',
        title: 'Info'
      })
      await nextTick()

      const icon = wrapper.find('.pi-info-circle')
      expect(icon.exists()).toBe(true)
      expect(icon.classes()).toContain('text-info-500')
    })

    it('should display close button for notifications', async () => {
      const vm = wrapper.vm as any
      vm.addNotification({
        type: 'success',
        title: 'Success!'
      })
      await nextTick()

      const closeButton = wrapper.find('.pi-times')
      expect(closeButton.exists()).toBe(true)
    })

    it('should remove notification when close button is clicked', async () => {
      const vm = wrapper.vm as any
      vm.addNotification({
        type: 'success',
        title: 'Success!'
      })
      await nextTick()

      let notification = wrapper.find('.border-l-success-500')
      expect(notification.exists()).toBe(true)

      const closeButton = notification.find('button')
      await closeButton.trigger('click')
      await nextTick()

      notification = wrapper.find('.border-l-success-500')
      expect(notification.exists()).toBe(false)
    })

    it('should auto-remove notification after default duration', async () => {
      const vm = wrapper.vm as any
      vm.addNotification({
        type: 'success',
        title: 'Success!'
      })
      await nextTick()

      let notification = wrapper.find('.border-l-success-500')
      expect(notification.exists()).toBe(true)

      // Fast-forward time by 5 seconds (default duration)
      vi.advanceTimersByTime(5000)
      await nextTick()

      notification = wrapper.find('.border-l-success-500')
      expect(notification.exists()).toBe(false)
    })

    it('should auto-remove notification after custom duration', async () => {
      const vm = wrapper.vm as any
      vm.addNotification({
        type: 'success',
        title: 'Success!',
        duration: 3000
      })
      await nextTick()

      let notification = wrapper.find('.border-l-success-500')
      expect(notification.exists()).toBe(true)

      // Fast-forward time by 3 seconds (custom duration)
      vi.advanceTimersByTime(3000)
      await nextTick()

      notification = wrapper.find('.border-l-success-500')
      expect(notification.exists()).toBe(false)
    })

    it('should display multiple notifications simultaneously', async () => {
      const vm = wrapper.vm as any
      vm.addNotification({
        type: 'success',
        title: 'Success 1'
      })
      vm.addNotification({
        type: 'error',
        title: 'Error 1'
      })
      vm.addNotification({
        type: 'warning',
        title: 'Warning 1'
      })
      await nextTick()

      const notifications = wrapper.findAll('.max-w-sm')
      expect(notifications.length).toBe(3)
    })

    it('should handle removing notification that does not exist', async () => {
      const vm = wrapper.vm as any
      // This should not throw an error
      expect(() => vm.removeNotification('non-existent-id')).not.toThrow()
    })
  })

  describe('Lifecycle Hooks', () => {
    it('should call initializeAuth on mount', () => {
      expect(authStore.initializeAuth).toHaveBeenCalled()
    })

    it('should call getCurrentUser on mount if accessToken exists and no user', async () => {
      // Create a new wrapper with no user but with token
      wrapper.unmount()

      wrapper = mount(AppLayout, {
        global: {
          plugins: [
            createTestingPinia({
              createSpy: vi.fn,
              initialState: {
                auth: {
                  user: null,
                  accessToken: 'token123',
                  isAuthenticated: false,
                  isLoading: false,
                  error: null,
                },
              },
            }),
            mockRouter,
          ],
          stubs: {
            'router-view': { template: '<div class="router-view-stub">Router View</div>' },
            AppHeader: { template: '<header class="app-header-stub">App Header</header>' },
            AppNavigation: { template: '<nav class="app-navigation-stub">App Navigation</nav>' },
          },
        },
      })

      const newAuthStore = useAuthStore()
      expect(newAuthStore.getCurrentUser).toHaveBeenCalled()
    })

    it('should not call getCurrentUser if no accessToken', async () => {
      wrapper.unmount()

      wrapper = mount(AppLayout, {
        global: {
          plugins: [
            createTestingPinia({
              createSpy: vi.fn,
              initialState: {
                auth: {
                  user: null,
                  accessToken: null,
                  isAuthenticated: false,
                  isLoading: false,
                  error: null,
                },
              },
            }),
            mockRouter,
          ],
          stubs: {
            'router-view': { template: '<div class="router-view-stub">Router View</div>' },
            AppHeader: { template: '<header class="app-header-stub">App Header</header>' },
            AppNavigation: { template: '<nav class="app-navigation-stub">App Navigation</nav>' },
          },
        },
      })

      const newAuthStore = useAuthStore()
      expect(newAuthStore.getCurrentUser).not.toHaveBeenCalled()
    })

    it('should not call getCurrentUser if user already exists', async () => {
      wrapper.unmount()

      wrapper = mount(AppLayout, {
        global: {
          plugins: [
            createTestingPinia({
              createSpy: vi.fn,
              initialState: {
                auth: {
                  user: {
                    id: '1',
                    email: 'test@example.com',
                    firstName: 'Test',
                    lastName: 'User',
                    role: 'USER',
                    roles: ['USER'],
                  },
                  accessToken: 'token123',
                  isAuthenticated: true,
                  isLoading: false,
                  error: null,
                },
              },
            }),
            mockRouter,
          ],
          stubs: {
            'router-view': { template: '<div class="router-view-stub">Router View</div>' },
            AppHeader: { template: '<header class="app-header-stub">App Header</header>' },
            AppNavigation: { template: '<nav class="app-navigation-stub">App Navigation</nav>' },
          },
        },
      })

      const newAuthStore = useAuthStore()
      expect(newAuthStore.getCurrentUser).not.toHaveBeenCalled()
    })
  })

  describe('Auth Error Watcher', () => {
    it('should display error notification when auth error occurs', async () => {
      authStore.error = 'Authentication failed'
      await nextTick()

      // Wait for the watcher to trigger
      await nextTick()

      const notification = wrapper.find('.border-l-error-500')
      expect(notification.exists()).toBe(true)
      expect(notification.text()).toContain('Authentication Error')
      expect(notification.text()).toContain('Authentication failed')
    })

    it('should call clearError after displaying error notification', async () => {
      authStore.error = 'Authentication failed'
      await nextTick()
      await nextTick()

      expect(authStore.clearError).toHaveBeenCalled()
    })

    it('should not display notification when error is null', async () => {
      authStore.error = null
      await nextTick()

      const notification = wrapper.find('.border-l-error-500')
      expect(notification.exists()).toBe(false)
    })

    it('should handle multiple auth errors', async () => {
      authStore.error = 'Error 1'
      await nextTick()
      await nextTick()

      authStore.clearError.mockClear()

      authStore.error = 'Error 2'
      await nextTick()
      await nextTick()

      expect(authStore.clearError).toHaveBeenCalled()

      const notifications = wrapper.findAll('.border-l-error-500')
      expect(notifications.length).toBeGreaterThan(0)
    })
  })

  describe('Provide/Inject', () => {
    it('should provide addNotification function', () => {
      const vm = wrapper.vm as any
      expect(typeof vm.addNotification).toBe('function')
    })

    it('should allow child components to use provided addNotification', async () => {
      const vm = wrapper.vm as any

      // Test that we can call addNotification
      vm.addNotification({
        type: 'success',
        title: 'Test from provide'
      })
      await nextTick()

      const notification = wrapper.find('.border-l-success-500')
      expect(notification.exists()).toBe(true)
      expect(notification.text()).toContain('Test from provide')
    })
  })

  describe('Notification ID Generation', () => {
    it('should generate unique IDs for notifications', async () => {
      const vm = wrapper.vm as any

      const spy = vi.spyOn(Date, 'now')
      spy.mockReturnValueOnce(1000)

      vm.addNotification({
        type: 'success',
        title: 'First'
      })
      await nextTick()

      spy.mockReturnValueOnce(2000)

      vm.addNotification({
        type: 'success',
        title: 'Second'
      })
      await nextTick()

      const notifications = wrapper.findAll('.border-l-success-500')
      expect(notifications.length).toBe(2)

      spy.mockRestore()
    })
  })

  describe('Edge Cases', () => {
    it('should handle notification with empty title', async () => {
      const vm = wrapper.vm as any
      vm.addNotification({
        type: 'info',
        title: ''
      })
      await nextTick()

      const notification = wrapper.find('.border-l-info-500')
      expect(notification.exists()).toBe(true)
    })

    it('should handle notification with very long message', async () => {
      const vm = wrapper.vm as any
      const longMessage = 'A'.repeat(500)

      vm.addNotification({
        type: 'info',
        title: 'Long Message',
        message: longMessage
      })
      await nextTick()

      const notification = wrapper.find('.border-l-info-500')
      expect(notification.exists()).toBe(true)
      expect(notification.text()).toContain(longMessage)
    })

    it('should handle rapid notification additions', async () => {
      const vm = wrapper.vm as any

      for (let i = 0; i < 10; i++) {
        vm.addNotification({
          type: 'success',
          title: `Notification ${i}`
        })
      }
      await nextTick()

      const notifications = wrapper.findAll('.max-w-sm')
      expect(notifications.length).toBe(10)
    })
  })
})
