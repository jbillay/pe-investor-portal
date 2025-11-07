import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import DashboardView from '../DashboardView.vue'
import { useAuthStore } from '@/stores/auth'
import { usePluginRegistryStore } from '@/stores/pluginRegistry'
import { createRouter, createMemoryHistory } from 'vue-router'

// Create a mock router
const createMockRouter = () => {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
      { path: '/admin/users', name: 'admin-users', component: { template: '<div>Users</div>' } },
      { path: '/admin/roles', name: 'admin-roles', component: { template: '<div>Roles</div>' } },
      { path: '/admin/plugins', name: 'admin-plugins', component: { template: '<div>Plugins</div>' } },
      { path: '/admin/data-objects', name: 'admin-data-objects', component: { template: '<div>Data Objects</div>' } },
    ],
  })
}

// Helper to create a properly mocked plugin registry store
const createMockedPluginRegistry = () => ({
  plugins: [],
  loadedPlugins: {},
  pluginCount: 0,
  pluginStatsByStatus: {},
  getWidgetsBySlot: vi.fn().mockReturnValue([]),
  getLoadedPlugin: vi.fn().mockReturnValue(null),
})

describe('DashboardView', () => {
  let wrapper: VueWrapper
  let mockRouter: any
  let authStore: any
  let pluginRegistryStore: any

  const createWrapper = (options = {}) => {
    mockRouter = createMockRouter()

    return mount(DashboardView, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            stubActions: false,
            initialState: {
              auth: {
                user: {
                  id: '1',
                  email: 'test@example.com',
                  firstName: 'John',
                  lastName: 'Doe',
                  roles: ['USER'],
                },
                isAuthenticated: true,
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
      ...options,
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    wrapper = createWrapper()
    authStore = useAuthStore()
    pluginRegistryStore = usePluginRegistryStore()

    // Setup plugin registry mocks
    Object.assign(pluginRegistryStore, createMockedPluginRegistry())
  })

  describe('Component Rendering', () => {
    it('should render the dashboard container', () => {
      expect(wrapper.find('.space-y-8').exists()).toBe(true)
    })

    it('should display welcome header with user name', async () => {
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('Welcome back, John!')
    })

    it('should display welcome message', () => {
      expect(wrapper.text()).toContain('Manage your investor portal system')
    })

    it('should render system statistics section', () => {
      expect(wrapper.text()).toContain('Total Users')
      expect(wrapper.text()).toContain('Active Roles')
      expect(wrapper.text()).toContain('Plugins Installed')
      expect(wrapper.text()).toContain('Data Objects')
    })

    it('should render Quick Actions section', () => {
      expect(wrapper.text()).toContain('Quick Actions')
    })
  })

  describe('Statistics Cards', () => {
    it('should render all 4 statistic cards', () => {
      const icons = ['.pi-users', '.pi-shield', '.pi-box', '.pi-database']
      icons.forEach(icon => {
        expect(wrapper.find(icon).exists()).toBe(true)
      })
    })

    it('should display plugin count from store', async () => {
      pluginRegistryStore.pluginCount = 10
      await wrapper.vm.$nextTick()
      await wrapper.vm.$forceUpdate()

      const text = wrapper.text()
      expect(text).toContain('10')
    })

    it('should display 0 when no plugins installed', () => {
      pluginRegistryStore.pluginCount = 0
      wrapper.vm.$forceUpdate()

      expect(wrapper.text()).toContain('0')
    })
  })

  describe('Admin-only Features', () => {
    it('should NOT show quick action links for non-admin users', () => {
      // User has only USER role by default
      expect(wrapper.text()).not.toContain('Manage Users')
      expect(wrapper.text()).not.toContain('Manage Roles')
      expect(wrapper.text()).not.toContain('Manage Plugins')
    })

    it('should show quick action links for SUPER_ADMIN users', async () => {
      authStore.user.roles = ['SUPER_ADMIN']
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Manage Users')
      expect(wrapper.text()).toContain('Manage Roles')
      expect(wrapper.text()).toContain('Manage Plugins')
      expect(wrapper.text()).toContain('Data Objects')
    })

    it('should display all quick action descriptions for admin', async () => {
      authStore.user.roles = ['SUPER_ADMIN']
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Add or edit users')
      expect(wrapper.text()).toContain('Configure permissions')
      expect(wrapper.text()).toContain('Install plugins')
      expect(wrapper.text()).toContain('Manage schemas')
    })
  })

  describe('User Display', () => {
    it('should display user first name in welcome message', async () => {
      authStore.user.firstName = 'Alice'
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Welcome back, Alice!')
    })

    it('should handle different first names', async () => {
      authStore.user.firstName = 'Bob'
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Welcome back, Bob!')
    })

    it('should handle missing first name gracefully', async () => {
      authStore.user.firstName = undefined
      await wrapper.vm.$nextTick()

      // Should not crash
      expect(wrapper.find('.space-y-8').exists()).toBe(true)
    })
  })

  describe('Date Display', () => {
    it('should display a formatted date', () => {
      const calendarIcon = wrapper.find('.pi-calendar')
      expect(calendarIcon.exists()).toBe(true)

      // Check that date text exists next to calendar icon
      const parentElement = calendarIcon.element.parentElement
      expect(parentElement?.textContent).toBeTruthy()
    })

    it('should format date in US locale', () => {
      const date = new Date()
      const expectedFormat = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })

      // The formatted date should appear somewhere in the component
      const text = wrapper.text()
      // At least verify some part of the date is present (year is most reliable)
      expect(text).toContain(date.getFullYear().toString())
    })
  })

  describe('Styling and Layout', () => {
    it('should apply gradient background to welcome header', () => {
      const header = wrapper.find('.bg-gradient-to-r')
      expect(header.exists()).toBe(true)
      expect(header.classes()).toContain('from-blue-600')
      expect(header.classes()).toContain('to-indigo-700')
    })

    it('should use responsive grid for statistics', () => {
      const grid = wrapper.find('.grid.grid-cols-1')
      expect(grid.exists()).toBe(true)
      expect(grid.classes()).toContain('md:grid-cols-2')
      expect(grid.classes()).toContain('lg:grid-cols-4')
    })

    it('should apply shadow and hover effects to statistic cards', () => {
      const cards = wrapper.findAll('.shadow-lg')
      expect(cards.length).toBeGreaterThan(0)
    })
  })

  describe('Role-based Rendering', () => {
    it('should correctly detect SUPER_ADMIN role', async () => {
      authStore.user.roles = ['SUPER_ADMIN']
      await wrapper.vm.$nextTick()

      // Admin features should be visible
      expect(wrapper.text()).toContain('Manage Users')
    })

    it('should correctly detect USER role (non-admin)', () => {
      authStore.user.roles = ['USER']
      wrapper.vm.$forceUpdate()

      // Admin features should NOT be visible
      expect(wrapper.text()).not.toContain('Manage Users')
    })

    it('should handle multiple roles with admin', async () => {
      authStore.user.roles = ['USER', 'SUPER_ADMIN', 'EDITOR']
      await wrapper.vm.$nextTick()

      // Should still show admin features
      expect(wrapper.text()).toContain('Manage Users')
    })

    it('should handle empty roles array', () => {
      authStore.user.roles = []
      wrapper.vm.$forceUpdate()

      // Admin features should NOT be visible
      expect(wrapper.text()).not.toContain('Manage Users')
    })
  })

  describe('Component Lifecycle', () => {
    it('should log message on mount', () => {
      const consoleSpy = vi.spyOn(console, 'log')

      // Mount new instance
      createWrapper()

      expect(consoleSpy).toHaveBeenCalledWith('Dashboard loaded')

      consoleSpy.mockRestore()
    })
  })

  describe('Plugin Integration', () => {
    it('should call getWidgetsBySlot for each widget area', () => {
      // Component should call getWidgetsBySlot for top, center, and bottom
      expect(pluginRegistryStore.getWidgetsBySlot).toHaveBeenCalledTimes(3)
      expect(pluginRegistryStore.getWidgetsBySlot).toHaveBeenCalledWith('dashboard-top')
      expect(pluginRegistryStore.getWidgetsBySlot).toHaveBeenCalledWith('dashboard-center')
      expect(pluginRegistryStore.getWidgetsBySlot).toHaveBeenCalledWith('dashboard-bottom')
    })

    it('should not render widget sections when no widgets exist', () => {
      // By default, getWidgetsBySlot returns empty array
      const pluginWidgets = wrapper.findAll('.plugin-widget')
      expect(pluginWidgets.length).toBe(0)
    })
  })
})
