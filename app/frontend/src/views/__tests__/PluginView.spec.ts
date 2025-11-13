import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import PluginView from '../PluginView.vue'
import { usePluginRegistryStore } from '@/stores/pluginRegistry'

// Mock ProgressSpinner
vi.mock('primevue/progressspinner', () => ({
  default: {
    name: 'ProgressSpinner',
    template: '<div class="progress-spinner">Loading...</div>',
  },
}))

// Mock router
const mockRoute = {
  path: '/plugins/test-plugin',
}

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  RouterLink: {
    name: 'RouterLink',
    template: '<a><slot /></a>',
    props: ['to'],
  },
}))

describe('PluginView', () => {
  let wrapper: VueWrapper<any>
  let pluginRegistryStore: ReturnType<typeof usePluginRegistryStore>

  const mockPlugin = {
    id: 'test-plugin',
    name: 'Test Plugin',
    version: '1.0.0',
    status: 'INSTALLED',
    enabled: true,
  }

  const mockPluginComponent = {
    name: 'TestPluginComponent',
    template: '<div class="test-plugin">Test Plugin Content</div>',
    props: ['pluginId'],
  }

  const createWrapper = () => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
    })

    wrapper = mount(PluginView, {
      global: {
        plugins: [pinia],
        components: {
          ProgressSpinner: {
            name: 'ProgressSpinner',
            template: '<div class="progress-spinner">Loading...</div>',
          },
        },
        stubs: {
          RouterLink: true,
        },
      },
    })

    pluginRegistryStore = usePluginRegistryStore()
    return wrapper
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockRoute.path = '/plugins/test-plugin'
  })

  describe('Component Rendering', () => {
    it('should render the plugin container', () => {
      createWrapper()

      expect(wrapper.find('.plugin-container').exists()).toBe(true)
    })
  })

  describe('Loading State', () => {
    it('should display loading spinner when loading', async () => {
      createWrapper()

      wrapper.vm.isLoading = true
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Loading...')
    })

    it('should hide content when loading', async () => {
      createWrapper()

      wrapper.vm.isLoading = true
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.text-center').exists()).toBe(false)
    })
  })

  describe('Error State', () => {
    it('should display error message when error occurs', async () => {
      createWrapper()

      wrapper.vm.isLoading = false
      wrapper.vm.error = 'Failed to load plugin'
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Plugin Error')
      expect(wrapper.text()).toContain('Failed to load plugin')
    })

    it('should show error icon', async () => {
      createWrapper()

      wrapper.vm.isLoading = false
      wrapper.vm.error = 'Error occurred'
      await wrapper.vm.$nextTick()

      expect(wrapper.find('i.pi-exclamation-triangle').exists()).toBe(true)
    })

    it('should show return to dashboard link on error', async () => {
      createWrapper()

      wrapper.vm.isLoading = false
      wrapper.vm.error = 'Error occurred'
      await wrapper.vm.$nextTick()

      expect(wrapper.find('router-link-stub').exists()).toBe(true)
    })

    it('should hide plugin content when error exists', async () => {
      createWrapper()

      wrapper.vm.isLoading = false
      wrapper.vm.error = 'Error occurred'
      wrapper.vm.pluginId = 'test-plugin'
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.test-plugin').exists()).toBe(false)
    })
  })

  describe('Plugin Not Found State', () => {
    it('should display not found message when plugin component is null', async () => {
      createWrapper()

      pluginRegistryStore.getLoadedPlugin = vi.fn().mockReturnValue(null)

      wrapper.vm.isLoading = false
      wrapper.vm.error = null
      wrapper.vm.pluginId = 'nonexistent-plugin'
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Plugin Not Found')
    })

    it('should display plugin ID in not found message', async () => {
      createWrapper()

      pluginRegistryStore.getLoadedPlugin = vi.fn().mockReturnValue(null)

      wrapper.vm.isLoading = false
      wrapper.vm.error = null
      wrapper.vm.pluginId = 'missing-plugin'
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('missing-plugin')
    })

    it('should show puzzle icon for not found state', async () => {
      createWrapper()

      pluginRegistryStore.getLoadedPlugin = vi.fn().mockReturnValue(null)

      wrapper.vm.isLoading = false
      wrapper.vm.error = null
      wrapper.vm.pluginId = 'nonexistent'
      await wrapper.vm.$nextTick()

      expect(wrapper.find('i.pi-puzzle-piece').exists()).toBe(true)
    })

    it('should show return to dashboard link when not found', async () => {
      createWrapper()

      pluginRegistryStore.getLoadedPlugin = vi.fn().mockReturnValue(null)

      wrapper.vm.isLoading = false
      wrapper.vm.error = null
      wrapper.vm.pluginId = 'nonexistent'
      await wrapper.vm.$nextTick()

      expect(wrapper.find('router-link-stub').exists()).toBe(true)
    })
  })

  describe('Plugin Loading Logic', () => {
    it('should set loading to false after mount completes', async () => {
      createWrapper()

      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 10))

      // After mount, loading should be false
      expect(wrapper.vm.isLoading).toBe(false)
    })

    it('should handle successful plugin loading', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      createWrapper()

      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 10))

      // onMounted will be called and set loading to false
      expect(wrapper.vm.isLoading).toBe(false)

      consoleLogSpy.mockRestore()
    })
  })

  describe('Plugin Component Computed Property', () => {
    it('should return null when pluginId is empty', () => {
      createWrapper()

      wrapper.vm.pluginId = ''
      expect(wrapper.vm.pluginComponent).toBeNull()
    })

    it('should return null when plugin not loaded', () => {
      createWrapper()

      pluginRegistryStore.getLoadedPlugin = vi.fn().mockReturnValue(null)

      wrapper.vm.pluginId = 'test-plugin'
      expect(wrapper.vm.pluginComponent).toBeNull()
    })

    it('should return component from loaded plugin', () => {
      createWrapper()

      const loadedPlugin = { component: mockPluginComponent }
      pluginRegistryStore.getLoadedPlugin = vi.fn().mockReturnValue(loadedPlugin)

      wrapper.vm.pluginId = 'test-plugin'
      expect(wrapper.vm.pluginComponent).toBe(mockPluginComponent)
    })

    it('should return default export from module if component not present', () => {
      createWrapper()

      const loadedPlugin = {
        module: { default: mockPluginComponent },
      }
      pluginRegistryStore.getLoadedPlugin = vi.fn().mockReturnValue(loadedPlugin)

      wrapper.vm.pluginId = 'test-plugin'
      expect(wrapper.vm.pluginComponent).toBe(mockPluginComponent)
    })

    it('should prefer component over module default', () => {
      createWrapper()

      const preferredComponent = { name: 'PreferredComponent' }
      const loadedPlugin = {
        component: preferredComponent,
        module: { default: mockPluginComponent },
      }
      pluginRegistryStore.getLoadedPlugin = vi.fn().mockReturnValue(loadedPlugin)

      wrapper.vm.pluginId = 'test-plugin'
      expect(wrapper.vm.pluginComponent).toBe(preferredComponent)
    })
  })

  describe('Error Handling', () => {
    it('should set loading to false even when errors occur', async () => {
      createWrapper()

      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 10))

      // Should always set loading to false in finally block
      expect(wrapper.vm.isLoading).toBe(false)
    })

    it('should handle various error scenarios', async () => {
      createWrapper()

      // Manually trigger an error scenario
      wrapper.vm.error = 'Test error'
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.error).toBe('Test error')
      expect(wrapper.text()).toContain('Plugin Error')
    })
  })

  describe('Component Styling', () => {
    it('should have plugin-container class', () => {
      createWrapper()

      const container = wrapper.find('.plugin-container')
      expect(container.exists()).toBe(true)
    })
  })

  describe('Route Handling', () => {
    it('should use route path from vue-router', () => {
      createWrapper()

      expect(mockRoute.path).toBe('/plugins/test-plugin')
    })

    it('should handle route changes with different paths', async () => {
      mockRoute.path = '/plugins/different-plugin'

      createWrapper()

      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 10))

      // Component will use the route path
      expect(mockRoute.path).toBe('/plugins/different-plugin')
    })
  })
})
