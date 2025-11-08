import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createMemoryHistory } from 'vue-router'
import AppNavigation from '../AppNavigation.vue'
import { useAuthStore } from '@/stores/auth'
import { usePluginRegistryStore } from '@/stores/pluginRegistry'

// Create a mock router
const createMockRouter = () => {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'dashboard', component: { template: '<div>Dashboard</div>' } },
      { path: '/admin', name: 'admin', component: { template: '<div>Admin</div>' } },
      { path: '/analytics', name: 'analytics', component: { template: '<div>Analytics</div>' } },
      { path: '/reports', name: 'reports', component: { template: '<div>Reports</div>' } },
    ],
  })
}

describe('AppNavigation', () => {
  let wrapper: VueWrapper
  let mockRouter: any
  let authStore: any
  let pluginRegistryStore: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockRouter = createMockRouter()

    wrapper = mount(AppNavigation, {
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
                  role: 'USER',
                  roles: ['USER'],
                },
                accessToken: 'token123',
                isAuthenticated: true,
              },
              pluginRegistry: {
                installedPlugins: [],
                loadedPlugins: new Map(),
                isLoading: false,
                error: null,
              },
            },
          }),
          mockRouter,
        ],
        stubs: {
          'router-link': {
            template: '<a :class="$attrs.class"><slot /></a>',
            props: ['to'],
          },
        },
      },
    })

    authStore = useAuthStore()
    pluginRegistryStore = usePluginRegistryStore()
  })

  afterEach(() => {
    wrapper.unmount()
  })

  describe('Component Rendering', () => {
    it('should render the navigation element', () => {
      const nav = wrapper.find('nav')
      expect(nav.exists()).toBe(true)
    })

    it('should have correct navigation classes', () => {
      const nav = wrapper.find('nav')
      expect(nav.classes()).toContain('bg-white')
      expect(nav.classes()).toContain('border-b')
      expect(nav.classes()).toContain('border-gray-200')
      expect(nav.classes()).toContain('shadow-sm')
    })

    it('should render navigation container with max-width', () => {
      const container = wrapper.find('.max-w-7xl')
      expect(container.exists()).toBe(true)
      expect(container.classes()).toContain('mx-auto')
    })

    it('should center navigation items', () => {
      const flexContainer = wrapper.find('.flex.justify-center')
      expect(flexContainer.exists()).toBe(true)
    })

    it('should render navigation items with spacing', () => {
      const itemsContainer = wrapper.find('.flex.space-x-8')
      expect(itemsContainer.exists()).toBe(true)
    })
  })

  describe('Navigation Items - Default', () => {
    it('should display Dashboard link by default', () => {
      const dashboardLink = wrapper.findAll('a').find(link =>
        link.text().includes('Dashboard')
      )
      expect(dashboardLink).toBeTruthy()
      expect(dashboardLink!.text()).toContain('Dashboard')
    })

    it('should display Dashboard icon', () => {
      const icon = wrapper.find('.pi-home')
      expect(icon.exists()).toBe(true)
    })

    it('should not display admin link for regular user', () => {
      const adminLink = wrapper.findAll('a').find(link =>
        link.text().includes('Administration')
      )
      expect(adminLink).toBeUndefined()
    })

    it('should only display Dashboard for regular user with no plugins', () => {
      const links = wrapper.findAll('a')
      expect(links.length).toBe(1)
      expect(links[0].text()).toContain('Dashboard')
    })
  })

  describe('Navigation Items - Super Admin', () => {
    beforeEach(async () => {
      wrapper.unmount()

      wrapper = mount(AppNavigation, {
        global: {
          plugins: [
            createTestingPinia({
              createSpy: vi.fn,
              initialState: {
                auth: {
                  user: {
                    id: '1',
                    email: 'admin@example.com',
                    firstName: 'Admin',
                    lastName: 'User',
                    role: 'SUPER_ADMIN',
                    roles: ['SUPER_ADMIN'],
                  },
                  accessToken: 'token123',
                  isAuthenticated: true,
                },
                pluginRegistry: {
                  installedPlugins: [],
                  loadedPlugins: new Map(),
                  isLoading: false,
                  error: null,
                },
              },
            }),
            mockRouter,
          ],
          stubs: {
            'router-link': {
              template: '<a :class="$attrs.class"><slot /></a>',
              props: ['to'],
            },
          },
        },
      })

      authStore = useAuthStore()
      pluginRegistryStore = usePluginRegistryStore()
    })

    it('should display admin link for SUPER_ADMIN user', () => {
      const adminLink = wrapper.findAll('a').find(link =>
        link.text().includes('Administration')
      )
      expect(adminLink).toBeTruthy()
      expect(adminLink!.text()).toContain('Administration')
    })

    it('should display admin icon', () => {
      const icon = wrapper.find('.pi-cog')
      expect(icon.exists()).toBe(true)
    })

    it('should display admin link as last item', () => {
      const links = wrapper.findAll('a')
      const lastLink = links[links.length - 1]
      expect(lastLink.text()).toContain('Administration')
    })

    it('should have both Dashboard and Administration links', () => {
      const links = wrapper.findAll('a')
      expect(links.length).toBe(2)
      expect(links[0].text()).toContain('Dashboard')
      expect(links[1].text()).toContain('Administration')
    })
  })

  describe('Navigation Items - With Plugins', () => {
    beforeEach(async () => {
      wrapper.unmount()

      wrapper = mount(AppNavigation, {
        global: {
          plugins: [
            createTestingPinia({
              createSpy: vi.fn,
              initialState: {
                auth: {
                  user: {
                    id: '1',
                    email: 'user@example.com',
                    firstName: 'Test',
                    lastName: 'User',
                    role: 'USER',
                    roles: ['USER'],
                  },
                  accessToken: 'token123',
                  isAuthenticated: true,
                },
                pluginRegistry: {
                  installedPlugins: [],
                  loadedPlugins: new Map(),
                  isLoading: false,
                  error: null,
                },
              },
            }),
            mockRouter,
          ],
          stubs: {
            'router-link': {
              template: '<a :class="$attrs.class"><slot /></a>',
              props: ['to'],
            },
          },
        },
      })

      authStore = useAuthStore()
      pluginRegistryStore = usePluginRegistryStore()

      // Mock plugin menu items
      pluginRegistryStore.mainMenuItems = [
        {
          id: 'analytics',
          label: 'Analytics',
          icon: 'pi pi-chart-bar',
          route: '/analytics',
          type: 'main',
          order: 10
        },
        {
          id: 'reports',
          label: 'Reports',
          icon: 'pi pi-file',
          route: '/reports',
          type: 'main',
          order: 20
        }
      ]

      await wrapper.vm.$nextTick()
    })

    it('should display plugin menu items', () => {
      const analyticsLink = wrapper.findAll('a').find(link =>
        link.text().includes('Analytics')
      )
      expect(analyticsLink).toBeTruthy()

      const reportsLink = wrapper.findAll('a').find(link =>
        link.text().includes('Reports')
      )
      expect(reportsLink).toBeTruthy()
    })

    it('should display plugin icons', () => {
      const chartIcon = wrapper.find('.pi-chart-bar')
      expect(chartIcon.exists()).toBe(true)

      const fileIcon = wrapper.find('.pi-file')
      expect(fileIcon.exists()).toBe(true)
    })

    it('should display Dashboard before plugin menus', () => {
      const links = wrapper.findAll('a')
      expect(links[0].text()).toContain('Dashboard')
      expect(links[1].text()).toContain('Analytics')
      expect(links[2].text()).toContain('Reports')
    })

    it('should display correct number of navigation items', () => {
      const links = wrapper.findAll('a')
      // Dashboard + 2 plugin menus
      expect(links.length).toBe(3)
    })
  })

  describe('Navigation Items - Plugins and Super Admin', () => {
    beforeEach(async () => {
      wrapper.unmount()

      wrapper = mount(AppNavigation, {
        global: {
          plugins: [
            createTestingPinia({
              createSpy: vi.fn,
              initialState: {
                auth: {
                  user: {
                    id: '1',
                    email: 'admin@example.com',
                    firstName: 'Admin',
                    lastName: 'User',
                    role: 'SUPER_ADMIN',
                    roles: ['SUPER_ADMIN'],
                  },
                  accessToken: 'token123',
                  isAuthenticated: true,
                },
                pluginRegistry: {
                  installedPlugins: [],
                  loadedPlugins: new Map(),
                  isLoading: false,
                  error: null,
                },
              },
            }),
            mockRouter,
          ],
          stubs: {
            'router-link': {
              template: '<a :class="$attrs.class"><slot /></a>',
              props: ['to'],
            },
          },
        },
      })

      authStore = useAuthStore()
      pluginRegistryStore = usePluginRegistryStore()

      // Mock plugin menu items
      pluginRegistryStore.mainMenuItems = [
        {
          id: 'analytics',
          label: 'Analytics',
          icon: 'pi pi-chart-bar',
          route: '/analytics',
          type: 'main',
          order: 10
        }
      ]

      await wrapper.vm.$nextTick()
    })

    it('should display plugin menus before admin link', () => {
      const links = wrapper.findAll('a')
      expect(links[0].text()).toContain('Dashboard')
      expect(links[1].text()).toContain('Analytics')
      expect(links[2].text()).toContain('Administration')
    })

    it('should have Dashboard, plugin menus, and Administration', () => {
      const links = wrapper.findAll('a')
      expect(links.length).toBe(3)
    })
  })

  describe('Route Active States', () => {
    it('should highlight Dashboard link when on dashboard route', async () => {
      await mockRouter.push('/')
      await wrapper.vm.$nextTick()

      const dashboardLink = wrapper.findAll('a')[0]
      expect(dashboardLink.classes()).toContain('border-blue-500')
      expect(dashboardLink.classes()).toContain('text-blue-600')
    })

    it('should not highlight Dashboard when on different route', async () => {
      await mockRouter.push('/admin')
      await wrapper.vm.$nextTick()

      const dashboardLink = wrapper.findAll('a')[0]
      expect(dashboardLink.classes()).toContain('border-transparent')
      expect(dashboardLink.classes()).toContain('text-gray-500')
    })

    it('should apply hover styles to inactive links', () => {
      const links = wrapper.findAll('a')
      const inactiveLink = links.find(link => link.classes().includes('border-transparent'))

      if (inactiveLink) {
        expect(inactiveLink.classes()).toContain('hover:text-gray-700')
        expect(inactiveLink.classes()).toContain('hover:border-gray-300')
      }
    })

    it('should apply transition classes to all links', () => {
      const links = wrapper.findAll('a')
      links.forEach(link => {
        expect(link.classes()).toContain('transition-colors')
        expect(link.classes()).toContain('duration-200')
      })
    })
  })

  describe('Navigation Item Styling', () => {
    it('should apply correct flex layout to navigation items', () => {
      const links = wrapper.findAll('a')
      links.forEach(link => {
        expect(link.classes()).toContain('inline-flex')
        expect(link.classes()).toContain('items-center')
      })
    })

    it('should apply correct padding to navigation items', () => {
      const links = wrapper.findAll('a')
      links.forEach(link => {
        expect(link.classes()).toContain('px-1')
        expect(link.classes()).toContain('pt-4')
        expect(link.classes()).toContain('pb-4')
      })
    })

    it('should apply bottom border to navigation items', () => {
      const links = wrapper.findAll('a')
      links.forEach(link => {
        expect(link.classes()).toContain('border-b-2')
      })
    })

    it('should apply correct font styling', () => {
      const links = wrapper.findAll('a')
      links.forEach(link => {
        expect(link.classes()).toContain('text-sm')
        expect(link.classes()).toContain('font-medium')
      })
    })

    it('should add margin to icons', () => {
      const icons = wrapper.findAll('i')
      icons.forEach(icon => {
        expect(icon.classes()).toContain('mr-2')
      })
    })
  })

  describe('Plugin Menu Items - Edge Cases', () => {
    it('should handle plugin menu without icon', async () => {
      pluginRegistryStore.mainMenuItems = [
        {
          id: 'custom',
          label: 'Custom Menu',
          route: '/custom',
          type: 'main',
          order: 10
        }
      ]
      await wrapper.vm.$nextTick()

      const customLink = wrapper.findAll('a').find(link =>
        link.text().includes('Custom Menu')
      )
      expect(customLink).toBeTruthy()

      // Should use default icon
      const defaultIcon = wrapper.find('.pi-puzzle-piece')
      expect(defaultIcon.exists()).toBe(true)
    })

    it('should handle empty plugin menus', () => {
      pluginRegistryStore.mainMenuItems = []

      const links = wrapper.findAll('a')
      // Only Dashboard should be present
      expect(links.length).toBe(1)
      expect(links[0].text()).toContain('Dashboard')
    })

    it('should handle plugin menu with empty route', async () => {
      pluginRegistryStore.mainMenuItems = [
        {
          id: 'test-plugin',
          label: 'Test Plugin',
          icon: 'pi pi-star',
          route: '/',
          type: 'main',
          order: 10
        }
      ]
      await wrapper.vm.$nextTick()

      const testLink = wrapper.findAll('a').find(link =>
        link.text().includes('Test Plugin')
      )
      expect(testLink).toBeTruthy()
    })

    it('should filter out non-main menu items', async () => {
      pluginRegistryStore.mainMenuItems = [
        {
          id: 'main-menu',
          label: 'Main Menu',
          icon: 'pi pi-star',
          route: '/main',
          type: 'main',
          order: 10
        }
      ]

      // Simulate admin menu items that should not appear
      pluginRegistryStore.adminMenuItems = [
        {
          id: 'admin-menu',
          label: 'Admin Menu',
          icon: 'pi pi-cog',
          route: '/admin-menu',
          type: 'admin',
          order: 10
        }
      ]

      await wrapper.vm.$nextTick()

      const mainMenu = wrapper.findAll('a').find(link =>
        link.text().includes('Main Menu')
      )
      expect(mainMenu).toBeTruthy()

      const adminMenu = wrapper.findAll('a').find(link =>
        link.text().includes('Admin Menu')
      )
      expect(adminMenu).toBeUndefined()
    })
  })

  describe('User Roles - Edge Cases', () => {
    it('should not show admin link when user has no roles', async () => {
      wrapper.unmount()

      wrapper = mount(AppNavigation, {
        global: {
          plugins: [
            createTestingPinia({
              createSpy: vi.fn,
              initialState: {
                auth: {
                  user: {
                    id: '1',
                    email: 'user@example.com',
                    firstName: 'Test',
                    lastName: 'User',
                    role: 'USER',
                    roles: [],
                  },
                  accessToken: 'token123',
                  isAuthenticated: true,
                },
                pluginRegistry: {
                  installedPlugins: [],
                  loadedPlugins: new Map(),
                  isLoading: false,
                  error: null,
                },
              },
            }),
            mockRouter,
          ],
          stubs: {
            'router-link': {
              template: '<a :class="$attrs.class"><slot /></a>',
              props: ['to'],
            },
          },
        },
      })

      const adminLink = wrapper.findAll('a').find(link =>
        link.text().includes('Administration')
      )
      expect(adminLink).toBeUndefined()
    })

    it('should not show admin link when user.roles is undefined', async () => {
      wrapper.unmount()

      wrapper = mount(AppNavigation, {
        global: {
          plugins: [
            createTestingPinia({
              createSpy: vi.fn,
              initialState: {
                auth: {
                  user: {
                    id: '1',
                    email: 'user@example.com',
                    firstName: 'Test',
                    lastName: 'User',
                    role: 'USER',
                  },
                  accessToken: 'token123',
                  isAuthenticated: true,
                },
                pluginRegistry: {
                  installedPlugins: [],
                  loadedPlugins: new Map(),
                  isLoading: false,
                  error: null,
                },
              },
            }),
            mockRouter,
          ],
          stubs: {
            'router-link': {
              template: '<a :class="$attrs.class"><slot /></a>',
              props: ['to'],
            },
          },
        },
      })

      const adminLink = wrapper.findAll('a').find(link =>
        link.text().includes('Administration')
      )
      expect(adminLink).toBeUndefined()
    })

    it('should not show admin link when user is null', async () => {
      wrapper.unmount()

      wrapper = mount(AppNavigation, {
        global: {
          plugins: [
            createTestingPinia({
              createSpy: vi.fn,
              initialState: {
                auth: {
                  user: null,
                  accessToken: null,
                  isAuthenticated: false,
                },
                pluginRegistry: {
                  installedPlugins: [],
                  loadedPlugins: new Map(),
                  isLoading: false,
                  error: null,
                },
              },
            }),
            mockRouter,
          ],
          stubs: {
            'router-link': {
              template: '<a :class="$attrs.class"><slot /></a>',
              props: ['to'],
            },
          },
        },
      })

      const adminLink = wrapper.findAll('a').find(link =>
        link.text().includes('Administration')
      )
      expect(adminLink).toBeUndefined()
    })

    it('should handle user with multiple roles including SUPER_ADMIN', async () => {
      wrapper.unmount()

      wrapper = mount(AppNavigation, {
        global: {
          plugins: [
            createTestingPinia({
              createSpy: vi.fn,
              initialState: {
                auth: {
                  user: {
                    id: '1',
                    email: 'admin@example.com',
                    firstName: 'Admin',
                    lastName: 'User',
                    role: 'SUPER_ADMIN',
                    roles: ['USER', 'ADMIN', 'SUPER_ADMIN'],
                  },
                  accessToken: 'token123',
                  isAuthenticated: true,
                },
                pluginRegistry: {
                  installedPlugins: [],
                  loadedPlugins: new Map(),
                  isLoading: false,
                  error: null,
                },
              },
            }),
            mockRouter,
          ],
          stubs: {
            'router-link': {
              template: '<a :class="$attrs.class"><slot /></a>',
              props: ['to'],
            },
          },
        },
      })

      const adminLink = wrapper.findAll('a').find(link =>
        link.text().includes('Administration')
      )
      expect(adminLink).toBeTruthy()
    })
  })

  describe('Computed Property - navigationItems', () => {
    it('should recalculate when plugin menus change', async () => {
      const links = wrapper.findAll('a')
      expect(links.length).toBe(1) // Only Dashboard

      pluginRegistryStore.mainMenuItems = [
        {
          id: 'new-menu',
          label: 'New Menu',
          icon: 'pi pi-plus',
          route: '/new',
          type: 'main',
          order: 10
        }
      ]
      await wrapper.vm.$nextTick()

      const updatedLinks = wrapper.findAll('a')
      expect(updatedLinks.length).toBe(2) // Dashboard + New Menu
    })

    it('should recalculate when user roles change', async () => {
      let links = wrapper.findAll('a')
      expect(links.length).toBe(1) // Only Dashboard

      authStore.user = {
        ...authStore.user,
        roles: ['SUPER_ADMIN']
      }
      await wrapper.vm.$nextTick()

      links = wrapper.findAll('a')
      expect(links.length).toBe(2) // Dashboard + Administration
    })
  })
})
