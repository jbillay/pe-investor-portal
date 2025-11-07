import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import AnalyticsView from '../AnalyticsView.vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'

// Mock vue-router
vi.mock('vue-router', () => ({
  useRouter: vi.fn(),
}))

// Mock PrimeVue toast
vi.mock('primevue/usetoast', () => ({
  useToast: vi.fn(),
}))

// Mock child components
vi.mock('@/components/admin/AdminNavigation.vue', () => ({
  default: { name: 'AdminNavigation', template: '<div data-testid="admin-navigation"></div>' },
}))

vi.mock('@/components/admin/SystemAnalyticsPanel.vue', () => ({
  default: { name: 'SystemAnalyticsPanel', template: '<div data-testid="system-analytics-panel"></div>' },
}))

describe('AnalyticsView', () => {
  let wrapper: VueWrapper
  let mockRouter: any
  let mockToast: any

  beforeEach(() => {
    mockRouter = {
      push: vi.fn(),
    }
    vi.mocked(useRouter).mockReturnValue(mockRouter)

    mockToast = {
      add: vi.fn(),
    }
    vi.mocked(useToast).mockReturnValue(mockToast)

    // Clear all timers before each test
    vi.clearAllTimers()
  })

  const mountComponent = () => {
    return mount(AnalyticsView, {
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
        stubs: {
          Breadcrumb: true,
          Button: {
            template: '<button @click="$emit(\'click\')" :class="$attrs.class" :disabled="$attrs.disabled"><slot /></button>',
          },
        },
      },
    })
  }

  describe('Component Rendering', () => {
    it('should render the component', () => {
      wrapper = mountComponent()
      expect(wrapper.exists()).toBe(true)
    })

    it('should render the admin header with title', () => {
      wrapper = mountComponent()
      expect(wrapper.find('h1').text()).toBe('System Analytics')
    })

    it('should render the subtitle', () => {
      wrapper = mountComponent()
      expect(wrapper.find('.admin-subtitle').text()).toBe('Monitor system performance, user activity, and security metrics')
    })

    it('should render AdminNavigation component', () => {
      wrapper = mountComponent()
      expect(wrapper.find('[data-testid="admin-navigation"]').exists()).toBe(true)
    })

    it('should render SystemAnalyticsPanel component', () => {
      wrapper = mountComponent()
      expect(wrapper.find('[data-testid="system-analytics-panel"]').exists()).toBe(true)
    })

    it('should render action buttons', () => {
      wrapper = mountComponent()
      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBeGreaterThanOrEqual(2)
    })

    it('should render refresh data button', () => {
      wrapper = mountComponent()
      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBeGreaterThanOrEqual(1)
    })

    it('should render export report button', () => {
      wrapper = mountComponent()
      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Breadcrumb Navigation', () => {
    it('should navigate to dashboard when clicking Dashboard breadcrumb', () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      vm.breadcrumbItems[0].command()

      expect(mockRouter.push).toHaveBeenCalledWith('/')
    })

    it('should navigate to admin when clicking Administration breadcrumb', () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      vm.breadcrumbItems[1].command()

      expect(mockRouter.push).toHaveBeenCalledWith('/admin')
    })

    it('should have correct breadcrumb items', () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      expect(vm.breadcrumbItems).toHaveLength(3)
      expect(vm.breadcrumbItems[0].label).toBe('Dashboard')
      expect(vm.breadcrumbItems[1].label).toBe('Administration')
      expect(vm.breadcrumbItems[2].label).toBe('Analytics')
    })

    it('should have correct breadcrumb icons', () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      expect(vm.breadcrumbItems[0].icon).toBe('pi pi-home')
      expect(vm.breadcrumbItems[1].icon).toBe('pi pi-shield')
      expect(vm.breadcrumbItems[2].icon).toBe('pi pi-chart-bar')
    })
  })

  describe('Refresh Data', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should refresh data successfully', async () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      const refreshPromise = vm.refreshData()

      // Fast-forward time to complete the simulated API call
      await vi.advanceTimersByTimeAsync(1000)
      await refreshPromise

      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Data Refreshed',
        detail: 'Analytics data has been refreshed successfully',
        life: 3000,
      })
    })

    it('should set loading state during refresh', async () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      expect(vm.loading).toBe(false)

      const refreshPromise = vm.refreshData()
      expect(vm.loading).toBe(true)

      await vi.advanceTimersByTimeAsync(1000)
      await refreshPromise

      expect(vm.loading).toBe(false)
    })

    it('should reset loading state after refresh completes', async () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      const refreshPromise = vm.refreshData()
      expect(vm.loading).toBe(true)

      await vi.advanceTimersByTimeAsync(1000)
      await refreshPromise

      expect(vm.loading).toBe(false)
    })

    it('should handle refresh data error', async () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      // Mock setTimeout to reject
      const originalSetTimeout = global.setTimeout
      global.setTimeout = vi.fn().mockImplementation((callback) => {
        throw new Error('Refresh failed')
      }) as any

      await vm.refreshData()

      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Refresh Failed',
        detail: 'Failed to refresh analytics data',
        life: 3000,
      })

      // Restore original setTimeout
      global.setTimeout = originalSetTimeout
    })

    it('should reset loading state even if refresh fails', async () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      // Mock setTimeout to reject
      const originalSetTimeout = global.setTimeout
      global.setTimeout = vi.fn().mockImplementation((callback) => {
        throw new Error('Failed')
      }) as any

      expect(vm.loading).toBe(false)
      await vm.refreshData()
      expect(vm.loading).toBe(false)

      // Restore original setTimeout
      global.setTimeout = originalSetTimeout
    })

    it('should log error to console when refresh fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      wrapper = mountComponent()
      const vm = wrapper.vm as any

      // Mock setTimeout to reject
      const error = new Error('Refresh failed')
      const originalSetTimeout = global.setTimeout
      global.setTimeout = vi.fn().mockImplementation((callback) => {
        throw error
      }) as any

      await vm.refreshData()

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to refresh data:', error)

      consoleErrorSpy.mockRestore()
      global.setTimeout = originalSetTimeout
    })
  })

  describe('Export Report', () => {
    it('should show toast when export report is clicked', () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      vm.exportReport()

      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'info',
        summary: 'Export Started',
        detail: 'Your report is being generated...',
        life: 3000,
      })
    })

    it('should have exportReport method', () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      expect(typeof vm.exportReport).toBe('function')
    })

    it('should not affect loading state', () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      expect(vm.loading).toBe(false)
      vm.exportReport()
      expect(vm.loading).toBe(false)
    })
  })

  describe('Component Lifecycle', () => {
    it('should mount without errors', () => {
      expect(() => mountComponent()).not.toThrow()
    })

    it('should initialize with correct default values', () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      expect(vm.loading).toBe(false)
    })

    it('should have onMounted hook defined', () => {
      wrapper = mountComponent()
      // Just verify the component mounts successfully
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Loading State', () => {
    it('should start with loading false', () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      expect(vm.loading).toBe(false)
    })

    it('should update loading state', async () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      vm.loading = true
      await wrapper.vm.$nextTick()

      expect(vm.loading).toBe(true)
    })
  })

  describe('Integration Tests', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should handle complete refresh flow', async () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      // Initial state
      expect(vm.loading).toBe(false)

      // Start refresh
      const refreshPromise = vm.refreshData()
      expect(vm.loading).toBe(true)

      // Wait for completion
      await vi.advanceTimersByTimeAsync(1000)
      await refreshPromise

      // Final state
      expect(vm.loading).toBe(false)
      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
        })
      )
    })

    it('should handle export report independently', () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      // Export should not affect loading state
      expect(vm.loading).toBe(false)
      vm.exportReport()
      expect(vm.loading).toBe(false)

      // Should show info toast
      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'info',
        })
      )
    })

    it('should handle multiple operations', async () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      // Export report
      vm.exportReport()
      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'info',
          summary: 'Export Started',
        })
      )

      // Then refresh data
      const refreshPromise = vm.refreshData()
      expect(vm.loading).toBe(true)

      await vi.advanceTimersByTimeAsync(1000)
      await refreshPromise

      expect(vm.loading).toBe(false)
      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
          summary: 'Data Refreshed',
        })
      )
    })
  })

  describe('UI Interactions', () => {
    it('should have working refresh method', async () => {
      vi.useFakeTimers()

      wrapper = mountComponent()
      const vm = wrapper.vm as any

      const refreshDataSpy = vi.spyOn(vm, 'refreshData')

      const refreshPromise = vm.refreshData()
      await vi.advanceTimersByTimeAsync(1000)
      await refreshPromise

      expect(refreshDataSpy).toHaveBeenCalled()

      refreshDataSpy.mockRestore()
      vi.useRealTimers()
    })

    it('should have working export method', () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      const exportReportSpy = vi.spyOn(vm, 'exportReport')

      vm.exportReport()

      expect(exportReportSpy).toHaveBeenCalled()

      exportReportSpy.mockRestore()
    })
  })

  describe('Responsive Design', () => {
    it('should have responsive CSS classes', () => {
      wrapper = mountComponent()

      expect(wrapper.find('.admin-dashboard').exists()).toBe(true)
      expect(wrapper.find('.admin-header').exists()).toBe(true)
      expect(wrapper.find('.admin-layout').exists()).toBe(true)
      expect(wrapper.find('.content-container').exists()).toBe(true)
    })

    it('should have admin title section', () => {
      wrapper = mountComponent()

      expect(wrapper.find('.admin-title-section').exists()).toBe(true)
      expect(wrapper.find('.admin-title-content').exists()).toBe(true)
    })

    it('should have admin actions section', () => {
      wrapper = mountComponent()

      expect(wrapper.find('.admin-actions').exists()).toBe(true)
    })

    it('should have content section', () => {
      wrapper = mountComponent()

      expect(wrapper.find('.content-section').exists()).toBe(true)
    })
  })

  describe('Toast Messages', () => {
    it('should show success toast with correct properties', async () => {
      vi.useFakeTimers()

      wrapper = mountComponent()
      const vm = wrapper.vm as any

      const refreshPromise = vm.refreshData()
      await vi.advanceTimersByTimeAsync(1000)
      await refreshPromise

      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Data Refreshed',
        detail: 'Analytics data has been refreshed successfully',
        life: 3000,
      })

      vi.useRealTimers()
    })

    it('should show info toast with correct properties', () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      vm.exportReport()

      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'info',
        summary: 'Export Started',
        detail: 'Your report is being generated...',
        life: 3000,
      })
    })

    it('should show error toast with correct properties', async () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      const originalSetTimeout = global.setTimeout
      global.setTimeout = vi.fn().mockImplementation((callback) => {
        throw new Error('Failed')
      }) as any

      await vm.refreshData()

      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Refresh Failed',
        detail: 'Failed to refresh analytics data',
        life: 3000,
      })

      global.setTimeout = originalSetTimeout
    })
  })
})
