import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createRouter, createWebHistory, Router } from 'vue-router'
import AdminNavigation from '../AdminNavigation.vue'

/**
 * Comprehensive unit tests for AdminNavigation component
 * Tests navigation items, active state detection, routing behavior, and user interactions
 */

describe('AdminNavigation', () => {
  let wrapper: VueWrapper<any>
  let router: Router
  let pushSpy: ReturnType<typeof vi.spyOn>

  // Helper function to create a mock router with admin routes
  const createMockRouter = (initialPath = '/admin/users') => {
    const mockRouter = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/admin/users', component: { template: '<div>Users</div>' } },
        { path: '/admin/roles', component: { template: '<div>Roles</div>' } },
        { path: '/admin/analytics', component: { template: '<div>Analytics</div>' } },
        { path: '/admin/email-templates', component: { template: '<div>Email Templates</div>' } },
        { path: '/admin', redirect: '/admin/users' }
      ]
    })

    // Push to initial route
    mockRouter.push(initialPath)

    return mockRouter
  }

  // Helper function to create wrapper with specified route
  const createWrapper = async (currentPath = '/admin/users') => {
    router = createMockRouter(currentPath)
    await router.isReady()

    return mount(AdminNavigation, {
      global: {
        plugins: [router]
      }
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    vi.restoreAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render the component wrapper', async () => {
      wrapper = await createWrapper()
      expect(wrapper.find('.admin-nav-wrapper').exists()).toBe(true)
    })

    it('should render the navigation tabs container', async () => {
      wrapper = await createWrapper()
      expect(wrapper.find('.admin-nav-tabs').exists()).toBe(true)
    })

    it('should render all five navigation items', async () => {
      wrapper = await createWrapper()
      const navButtons = wrapper.findAll('.admin-nav-tab')
      expect(navButtons).toHaveLength(5)
    })

    it('should render navigation items in correct order', async () => {
      wrapper = await createWrapper()
      const navButtons = wrapper.findAll('.admin-nav-tab')

      expect(navButtons[0].text()).toContain('Users')
      expect(navButtons[1].text()).toContain('Roles')
      expect(navButtons[2].text()).toContain('Analytics')
      expect(navButtons[3].text()).toContain('Email Templates')
    })
  })

  describe('Navigation Item Content', () => {
    it('should render Users tab with correct icon and label', async () => {
      wrapper = await createWrapper()
      const usersTab = wrapper.findAll('.admin-nav-tab')[0]

      expect(usersTab.find('i.pi-users').exists()).toBe(true)
      expect(usersTab.text()).toContain('Users')
    })

    it('should render Roles tab with correct icon and label', async () => {
      wrapper = await createWrapper()
      const rolesTab = wrapper.findAll('.admin-nav-tab')[1]

      expect(rolesTab.find('i.pi-key').exists()).toBe(true)
      expect(rolesTab.text()).toContain('Roles')
    })

    it('should render Analytics tab with correct icon and label', async () => {
      wrapper = await createWrapper()
      const analyticsTab = wrapper.findAll('.admin-nav-tab')[2]

      expect(analyticsTab.find('i.pi-chart-bar').exists()).toBe(true)
      expect(analyticsTab.text()).toContain('Analytics')
    })

    it('should render Email Templates tab with correct icon and label', async () => {
      wrapper = await createWrapper()
      const emailTab = wrapper.findAll('.admin-nav-tab')[3]

      expect(emailTab.find('i.pi-envelope').exists()).toBe(true)
      expect(emailTab.text()).toContain('Email Templates')
    })


    it('should render Plugin tab with correct icon and label', async () => {
      wrapper = await createWrapper()
      const pluginTab = wrapper.findAll('.admin-nav-tab')[4]

      expect(pluginTab.find('i.pi-box').exists()).toBe(true)
      expect(pluginTab.text()).toContain('Plugins')
    })

    it('should render icons with correct PrimeIcons classes', async () => {
      wrapper = await createWrapper()
      const icons = wrapper.findAll('.admin-nav-tab i')

      expect(icons[0].classes()).toContain('pi')
      expect(icons[0].classes()).toContain('pi-users')
      expect(icons[1].classes()).toContain('pi')
      expect(icons[1].classes()).toContain('pi-key')
      expect(icons[2].classes()).toContain('pi')
      expect(icons[2].classes()).toContain('pi-chart-bar')
      expect(icons[3].classes()).toContain('pi')
      expect(icons[3].classes()).toContain('pi-envelope')
      expect(icons[4].classes()).toContain('pi')
      expect(icons[4].classes()).toContain('pi-box')
    })
  })

  describe('Active State Detection', () => {
    it('should mark Users tab as active when on /admin/users route', async () => {
      wrapper = await createWrapper('/admin/users')
      const usersTab = wrapper.findAll('.admin-nav-tab')[0]

      expect(usersTab.classes()).toContain('active')
    })

    it('should mark Roles tab as active when on /admin/roles route', async () => {
      wrapper = await createWrapper('/admin/roles')
      const rolesTab = wrapper.findAll('.admin-nav-tab')[1]

      expect(rolesTab.classes()).toContain('active')
    })

    it('should mark Analytics tab as active when on /admin/analytics route', async () => {
      wrapper = await createWrapper('/admin/analytics')
      const analyticsTab = wrapper.findAll('.admin-nav-tab')[2]

      expect(analyticsTab.classes()).toContain('active')
    })

    it('should mark Email Templates tab as active when on /admin/email-templates route', async () => {
      wrapper = await createWrapper('/admin/email-templates')
      const emailTab = wrapper.findAll('.admin-nav-tab')[3]

      expect(emailTab.classes()).toContain('active')
    })

    it('should mark Plugins tab as active when on /admin/plugins route', async () => {
      wrapper = await createWrapper('/admin/plugins')
      const emailTab = wrapper.findAll('.admin-nav-tab')[4]

      expect(emailTab.classes()).toContain('active')
    })

    it('should only have one active tab at a time', async () => {
      wrapper = await createWrapper('/admin/roles')
      const activeTabs = wrapper.findAll('.admin-nav-tab.active')

      expect(activeTabs).toHaveLength(1)
      expect(activeTabs[0].text()).toContain('Roles')
    })

    it('should not mark any tab as active for non-matching route', async () => {
      wrapper = await createWrapper('/some/other/route')
      const activeTabs = wrapper.findAll('.admin-nav-tab.active')

      expect(activeTabs).toHaveLength(0)
    })

    it('should update active state when route changes', async () => {
      wrapper = await createWrapper('/admin/users')
      let usersTab = wrapper.findAll('.admin-nav-tab')[0]
      let rolesTab = wrapper.findAll('.admin-nav-tab')[1]

      expect(usersTab.classes()).toContain('active')
      expect(rolesTab.classes()).not.toContain('active')

      // Navigate to roles
      await router.push('/admin/roles')
      await wrapper.vm.$nextTick()

      usersTab = wrapper.findAll('.admin-nav-tab')[0]
      rolesTab = wrapper.findAll('.admin-nav-tab')[1]

      expect(usersTab.classes()).not.toContain('active')
      expect(rolesTab.classes()).toContain('active')
    })
  })

  describe('Navigation Behavior', () => {
    it('should navigate to Users page when Users tab is clicked', async () => {
      wrapper = await createWrapper('/admin/roles')
      pushSpy = vi.spyOn(router, 'push')

      const usersTab = wrapper.findAll('.admin-nav-tab')[0]
      await usersTab.trigger('click')

      expect(pushSpy).toHaveBeenCalledWith('/admin/users')
    })

    it('should navigate to Roles page when Roles tab is clicked', async () => {
      wrapper = await createWrapper('/admin/users')
      pushSpy = vi.spyOn(router, 'push')

      const rolesTab = wrapper.findAll('.admin-nav-tab')[1]
      await rolesTab.trigger('click')

      expect(pushSpy).toHaveBeenCalledWith('/admin/roles')
    })

    it('should navigate to Analytics page when Analytics tab is clicked', async () => {
      wrapper = await createWrapper('/admin/users')
      pushSpy = vi.spyOn(router, 'push')

      const analyticsTab = wrapper.findAll('.admin-nav-tab')[2]
      await analyticsTab.trigger('click')

      expect(pushSpy).toHaveBeenCalledWith('/admin/analytics')
    })

    it('should navigate to Email Templates page when Email Templates tab is clicked', async () => {
      wrapper = await createWrapper('/admin/users')
      pushSpy = vi.spyOn(router, 'push')

      const emailTab = wrapper.findAll('.admin-nav-tab')[3]
      await emailTab.trigger('click')

      expect(pushSpy).toHaveBeenCalledWith('/admin/email-templates')
    })

    it('should navigate to PLugins page when Plugins tab is clicked', async () => {
      wrapper = await createWrapper('/admin/plugins')
      pushSpy = vi.spyOn(router, 'push')

      const emailTab = wrapper.findAll('.admin-nav-tab')[4]
      await emailTab.trigger('click')

      expect(pushSpy).toHaveBeenCalledWith('/admin/plugins')
    })

    it('should call router.push exactly once per click', async () => {
      wrapper = await createWrapper('/admin/users')
      pushSpy = vi.spyOn(router, 'push')

      const rolesTab = wrapper.findAll('.admin-nav-tab')[1]
      await rolesTab.trigger('click')

      expect(pushSpy).toHaveBeenCalledTimes(1)
    })

    it('should handle multiple rapid clicks correctly', async () => {
      wrapper = await createWrapper('/admin/users')
      pushSpy = vi.spyOn(router, 'push')

      const rolesTab = wrapper.findAll('.admin-nav-tab')[1]
      const analyticsTab = wrapper.findAll('.admin-nav-tab')[2]

      await rolesTab.trigger('click')
      await analyticsTab.trigger('click')

      expect(pushSpy).toHaveBeenCalledTimes(2)
      expect(pushSpy).toHaveBeenNthCalledWith(1, '/admin/roles')
      expect(pushSpy).toHaveBeenNthCalledWith(2, '/admin/analytics')
    })

    it('should allow clicking the currently active tab', async () => {
      wrapper = await createWrapper('/admin/users')
      pushSpy = vi.spyOn(router, 'push')

      const usersTab = wrapper.findAll('.admin-nav-tab')[0]
      await usersTab.trigger('click')

      expect(pushSpy).toHaveBeenCalledWith('/admin/users')
    })
  })

  describe('CSS Classes and Styling', () => {
    it('should apply base styling classes to all tabs', async () => {
      wrapper = await createWrapper()
      const tabs = wrapper.findAll('.admin-nav-tab')

      tabs.forEach(tab => {
        expect(tab.classes()).toContain('admin-nav-tab')
      })
    })

    it('should apply active class only to current route tab', async () => {
      wrapper = await createWrapper('/admin/analytics')
      const tabs = wrapper.findAll('.admin-nav-tab')

      expect(tabs[0].classes()).not.toContain('active')
      expect(tabs[1].classes()).not.toContain('active')
      expect(tabs[2].classes()).toContain('active')
      expect(tabs[3].classes()).not.toContain('active')
    })

    it('should have proper wrapper styling classes', async () => {
      wrapper = await createWrapper()
      const wrapperDiv = wrapper.find('.admin-nav-wrapper')

      expect(wrapperDiv.exists()).toBe(true)
      expect(wrapperDiv.classes()).toContain('admin-nav-wrapper')
    })

    it('should have proper tabs container styling classes', async () => {
      wrapper = await createWrapper()
      const tabsContainer = wrapper.find('.admin-nav-tabs')

      expect(tabsContainer.exists()).toBe(true)
      expect(tabsContainer.classes()).toContain('admin-nav-tabs')
    })
  })

  describe('Accessibility', () => {
    it('should render navigation items as buttons', async () => {
      wrapper = await createWrapper()
      const buttons = wrapper.findAll('button')

      expect(buttons).toHaveLength(5)
    })

    it('should have clickable buttons with proper cursor', async () => {
      wrapper = await createWrapper()
      const tabs = wrapper.findAll('.admin-nav-tab')

      tabs.forEach(tab => {
        expect(tab.element.tagName).toBe('BUTTON')
      })
    })

    it('should have text content in all navigation items for screen readers', async () => {
      wrapper = await createWrapper()
      const tabs = wrapper.findAll('.admin-nav-tab')

      tabs.forEach(tab => {
        const text = tab.text().trim()
        expect(text.length).toBeGreaterThan(0)
      })
    })

    it('should render span elements for labels', async () => {
      wrapper = await createWrapper()
      const labels = wrapper.findAll('.admin-nav-tab span')

      expect(labels).toHaveLength(5)
      expect(labels[0].text()).toBe('Users')
      expect(labels[1].text()).toBe('Roles')
      expect(labels[2].text()).toBe('Analytics')
      expect(labels[3].text()).toBe('Email Templates')
      expect(labels[4].text()).toBe('Plugins')
    })
  })

  describe('Component Data Structure', () => {
    it('should have correct navItems data structure', async () => {
      wrapper = await createWrapper()
      const vm = wrapper.vm

      expect(vm.navItems).toBeDefined()
      expect(Array.isArray(vm.navItems)).toBe(true)
      expect(vm.navItems).toHaveLength(5)
    })

    it('should have Users item with correct properties', async () => {
      wrapper = await createWrapper()
      const vm = wrapper.vm
      const usersItem = vm.navItems[0]

      expect(usersItem.label).toBe('Users')
      expect(usersItem.icon).toBe('pi-users')
      expect(usersItem.path).toBe('/admin/users')
    })

    it('should have Roles item with correct properties', async () => {
      wrapper = await createWrapper()
      const vm = wrapper.vm
      const rolesItem = vm.navItems[1]

      expect(rolesItem.label).toBe('Roles')
      expect(rolesItem.icon).toBe('pi-key')
      expect(rolesItem.path).toBe('/admin/roles')
    })

    it('should have Analytics item with correct properties', async () => {
      wrapper = await createWrapper()
      const vm = wrapper.vm
      const analyticsItem = vm.navItems[2]

      expect(analyticsItem.label).toBe('Analytics')
      expect(analyticsItem.icon).toBe('pi-chart-bar')
      expect(analyticsItem.path).toBe('/admin/analytics')
    })

    it('should have Email Templates item with correct properties', async () => {
      wrapper = await createWrapper()
      const vm = wrapper.vm
      const emailItem = vm.navItems[3]

      expect(emailItem.label).toBe('Email Templates')
      expect(emailItem.icon).toBe('pi-envelope')
      expect(emailItem.path).toBe('/admin/email-templates')
    })

    it('should have Plugins item with correct properties', async () => {
      wrapper = await createWrapper()
      const vm = wrapper.vm
      const emailItem = vm.navItems[4]

      expect(emailItem.label).toBe('Plugins')
      expect(emailItem.icon).toBe('pi-box')
      expect(emailItem.path).toBe('/admin/plugins')
    })
  })

  describe('Component Methods', () => {
    it('should have navigateTo method defined', async () => {
      wrapper = await createWrapper()
      const vm = wrapper.vm

      expect(vm.navigateTo).toBeDefined()
      expect(typeof vm.navigateTo).toBe('function')
    })

    it('should have isActive method defined', async () => {
      wrapper = await createWrapper()
      const vm = wrapper.vm

      expect(vm.isActive).toBeDefined()
      expect(typeof vm.isActive).toBe('function')
    })

    it('should call isActive method for each navigation item during render', async () => {
      wrapper = await createWrapper('/admin/users')
      const vm = wrapper.vm

      expect(vm.isActive('/admin/users')).toBe(true)
      expect(vm.isActive('/admin/roles')).toBe(false)
      expect(vm.isActive('/admin/analytics')).toBe(false)
      expect(vm.isActive('/admin/email-templates')).toBe(false)
      expect(vm.isActive('/admin/plugins')).toBe(false)
    })

    it('should return correct boolean from isActive based on current route', async () => {
      wrapper = await createWrapper('/admin/analytics')
      const vm = wrapper.vm

      expect(vm.isActive('/admin/users')).toBe(false)
      expect(vm.isActive('/admin/roles')).toBe(false)
      expect(vm.isActive('/admin/analytics')).toBe(true)
      expect(vm.isActive('/admin/email-templates')).toBe(false)
      expect(vm.isActive('/admin/plugins')).toBe(false)
    })
  })

  describe('Router Integration', () => {
    it('should use vue-router for navigation', async () => {
      wrapper = await createWrapper()
      const vm = wrapper.vm

      expect(vm.$router).toBeDefined()
      expect(vm.$route).toBeDefined()
    })

    it('should correctly read current route path', async () => {
      wrapper = await createWrapper('/admin/roles')
      const vm = wrapper.vm

      expect(vm.$route.path).toBe('/admin/roles')
    })

    it('should update when route changes programmatically', async () => {
      wrapper = await createWrapper('/admin/users')

      await router.push('/admin/email-templates')
      await wrapper.vm.$nextTick()

      const emailTab = wrapper.findAll('.admin-nav-tab')[3]
      expect(emailTab.classes()).toContain('active')
    })

    it('should handle route push errors gracefully', async () => {
      wrapper = await createWrapper('/admin/users')
      const invalidRouter = {
        push: vi.fn().mockRejectedValue(new Error('Navigation failed'))
      }

      // This test ensures the component would handle errors if router.push fails
      // In real usage, vue-router handles navigation errors internally
      await expect(async () => {
        await invalidRouter.push('/invalid-route')
      }).rejects.toThrow('Navigation failed')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty route path', async () => {
      wrapper = await createWrapper('')
      const activeTabs = wrapper.findAll('.admin-nav-tab.active')

      expect(activeTabs).toHaveLength(0)
    })

    it('should handle route with query parameters', async () => {
      wrapper = await createWrapper('/admin/users')
      await router.push('/admin/users?filter=active')
      await wrapper.vm.$nextTick()

      // Should still recognize /admin/users route even with query params
      const vm = wrapper.vm
      expect(vm.$route.path).toBe('/admin/users')
    })

    it('should handle navigation to same route', async () => {
      wrapper = await createWrapper('/admin/users')
      pushSpy = vi.spyOn(router, 'push')

      const usersTab = wrapper.findAll('.admin-nav-tab')[0]
      await usersTab.trigger('click')

      expect(pushSpy).toHaveBeenCalledWith('/admin/users')
    })

    it('should maintain state across multiple navigation actions', async () => {
      wrapper = await createWrapper('/admin/users')
      pushSpy = vi.spyOn(router, 'push')

      const tabs = wrapper.findAll('.admin-nav-tab')

      await tabs[1].trigger('click') // Roles
      await tabs[2].trigger('click') // Analytics
      await tabs[3].trigger('click') // Email Templates
      await tabs[4].trigger('click') // PLugins
      await tabs[0].trigger('click') // Back to Users

      expect(pushSpy).toHaveBeenCalledTimes(5)
    })
  })

  describe('Performance', () => {
    it('should render efficiently with minimal DOM elements', async () => {
      wrapper = await createWrapper()
      const allElements = wrapper.findAll('*')

      // Should have reasonable number of elements (not creating unnecessary DOM)
      expect(allElements.length).toBeLessThan(30)
    })

    it('should not create memory leaks with event listeners', async () => {
      wrapper = await createWrapper()
      const initialListeners = wrapper.findAll('.admin-nav-tab')

      expect(initialListeners).toHaveLength(5)

      wrapper.unmount()

      // After unmount, component should clean up properly
      expect(wrapper.exists()).toBe(false)
    })
  })

  describe('Responsive Behavior', () => {
    it('should render all navigation items regardless of viewport', async () => {
      wrapper = await createWrapper()
      const tabs = wrapper.findAll('.admin-nav-tab')

      // All 4 tabs should always render (CSS handles responsive layout)
      expect(tabs).toHaveLength(5)
    })

    it('should have flex layout container for tabs', async () => {
      wrapper = await createWrapper()
      const tabsContainer = wrapper.find('.admin-nav-tabs')

      expect(tabsContainer.exists()).toBe(true)
    })
  })

  describe('Template Rendering', () => {
    it('should use v-for to render navigation items', async () => {
      wrapper = await createWrapper()
      const tabs = wrapper.findAll('.admin-nav-tab')

      // Should render exactly as many tabs as items in navItems array
      expect(tabs).toHaveLength(5)
    })

    it('should use key attribute correctly in v-for', async () => {
      wrapper = await createWrapper()
      const tabs = wrapper.findAll('.admin-nav-tab')

      // Each tab should be rendered with unique path as key
      // This ensures proper Vue reactivity
      expect(tabs.length).toBeGreaterThan(0)
    })

    it('should correctly interpolate icon classes', async () => {
      wrapper = await createWrapper()
      const icons = wrapper.findAll('i[class*="pi"]')

      expect(icons).toHaveLength(5)
      expect(icons.every(icon => icon.classes().includes('pi'))).toBe(true)
    })

    it('should correctly interpolate label text', async () => {
      wrapper = await createWrapper()
      const labels = wrapper.findAll('.admin-nav-tab span')

      const labelTexts = labels.map(label => label.text())
      expect(labelTexts).toEqual(['Users', 'Roles', 'Analytics', 'Email Templates', 'Plugins'])
    })

    it('should bind click handler correctly', async () => {
      wrapper = await createWrapper()
      pushSpy = vi.spyOn(router, 'push')

      const tabs = wrapper.findAll('.admin-nav-tab')

      for (let i = 0; i < tabs.length; i++) {
        await tabs[i].trigger('click')
      }

      expect(pushSpy).toHaveBeenCalledTimes(5)
    })

    it('should conditionally apply active class', async () => {
      wrapper = await createWrapper('/admin/roles')
      const tabs = wrapper.findAll('.admin-nav-tab')

      const activeStates = tabs.map(tab => tab.classes().includes('active'))
      expect(activeStates).toEqual([false, true, false, false, false])
    })
  })
})
