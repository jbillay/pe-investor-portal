import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createMemoryHistory } from 'vue-router'
import AppHeader from '../AppHeader.vue'
import { useAuthStore } from '@/stores/auth'

// Create a mock router
const createMockRouter = () => {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
      { path: '/profile', name: 'profile', component: { template: '<div>Profile</div>' } },
      { path: '/settings', name: 'settings', component: { template: '<div>Settings</div>' } },
      { path: '/search', name: 'search', component: { template: '<div>Search</div>' } },
      { path: '/login', name: 'login', component: { template: '<div>Login</div>' } },
    ],
  })
}

describe('AppHeader', () => {
  let wrapper: VueWrapper
  let mockRouter: any
  let authStore: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockRouter = createMockRouter()

    wrapper = mount(AppHeader, {
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
                },
                accessToken: 'token123',
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
    })

    authStore = useAuthStore()
  })

  afterEach(() => {
    wrapper.unmount()
  })

  describe('Component Rendering', () => {
    it('should render the header element', () => {
      expect(wrapper.find('header').exists()).toBe(true)
    })

    it('should display the logo', () => {
      const logo = wrapper.find('.bg-primary-600')
      expect(logo.exists()).toBe(true)
      expect(logo.text()).toContain('PI')
    })

    it('should display the brand name', () => {
      expect(wrapper.text()).toContain('PE Investor Portal')
    })

    it('should render desktop search bar', () => {
      const searchInput = wrapper.find('.hidden.md\\:flex input[type="text"]')
      expect(searchInput.exists()).toBe(true)
      expect(searchInput.attributes('placeholder')).toContain('Search documents')
    })

    it('should render mobile search button', () => {
      const mobileSearchButtons = wrapper.findAll('button').filter(btn =>
        btn.find('.pi-search').exists()
      )
      expect(mobileSearchButtons.length).toBeGreaterThan(0)
    })

    it('should render notifications button', () => {
      const notificationButton = wrapper.find('.pi-bell').element.parentElement
      expect(notificationButton).toBeTruthy()
    })

    it('should display notification count badge', () => {
      const badge = wrapper.find('.bg-error-500')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toBe('3')
    })

    it('should display user initials', async () => {
      // Mock the computed property
      authStore.userInitials = 'JD'
      await wrapper.vm.$nextTick()

      const userInitials = wrapper.findAll('.bg-primary-600.rounded-full')
      expect(userInitials.length).toBeGreaterThan(0)
    })

    it('should display user full name', async () => {
      authStore.userFullName = 'John Doe'
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('John Doe')
    })

    it('should display user role', () => {
      expect(wrapper.text()).toContain('Admin')
    })
  })

  describe('Search Functionality', () => {
    it('should update search query on input', async () => {
      const searchInput = wrapper.find('.hidden.md\\:flex input[type="text"]')
      await searchInput.setValue('test query')

      expect((wrapper.vm as any).searchQuery).toBe('test query')
    })

    it('should navigate to search page on enter key', async () => {
      const pushSpy = vi.spyOn(mockRouter, 'push')
      const searchInput = wrapper.find('.hidden.md\\:flex input[type="text"]')
      await searchInput.setValue('test query')
      await searchInput.trigger('keyup.enter')
      await wrapper.vm.$nextTick()

      expect(pushSpy).toHaveBeenCalledWith({
        name: 'search',
        query: { q: 'test query' }
      })
    })

    it('should not navigate to search page if query is empty', async () => {
      const currentRoute = mockRouter.currentRoute.value.path
      const searchInput = wrapper.find('.hidden.md\\:flex input[type="text"]')
      await searchInput.setValue('   ')
      await searchInput.trigger('keyup.enter')
      await wrapper.vm.$nextTick()

      expect(mockRouter.currentRoute.value.path).toBe(currentRoute)
    })

    it('should toggle mobile search on button click', async () => {
      const mobileSearchButtons = wrapper.findAll('button').filter(btn =>
        btn.find('.pi-search').exists()
      )
      const mobileSearchButton = mobileSearchButtons[0]

      expect((wrapper.vm as any).showMobileSearch).toBe(false)

      await mobileSearchButton.trigger('click')
      await wrapper.vm.$nextTick()

      expect((wrapper.vm as any).showMobileSearch).toBe(true)
    })

    it('should close mobile search after search', async () => {
      const mobileSearchButtons = wrapper.findAll('button').filter(btn =>
        btn.find('.pi-search').exists()
      )
      const mobileSearchButton = mobileSearchButtons[0]
      await mobileSearchButton.trigger('click')
      await wrapper.vm.$nextTick()

      expect((wrapper.vm as any).showMobileSearch).toBe(true)

      // Find mobile search input and trigger search
      const mobileSearchInput = wrapper.findAll('input[type="text"]').at(1)
      await mobileSearchInput!.setValue('mobile search')
      await mobileSearchInput!.trigger('keyup.enter')
      await wrapper.vm.$nextTick()

      expect((wrapper.vm as any).showMobileSearch).toBe(false)
    })
  })

  describe('User Menu', () => {
    it('should toggle user menu on button click', async () => {
      const userMenuButton = wrapper.find('[data-dropdown] button')

      expect((wrapper.vm as any).showUserMenu).toBe(false)

      await userMenuButton.trigger('click')
      await wrapper.vm.$nextTick()

      expect((wrapper.vm as any).showUserMenu).toBe(true)

      await userMenuButton.trigger('click')
      await wrapper.vm.$nextTick()

      expect((wrapper.vm as any).showUserMenu).toBe(false)
    })

    it('should display user menu dropdown when open', async () => {
      const userMenuButton = wrapper.find('[data-dropdown] button')
      await userMenuButton.trigger('click')
      await wrapper.vm.$nextTick()

      const dropdown = wrapper.find('.absolute.right-0')
      expect(dropdown.exists()).toBe(true)
    })

    it('should display user info in dropdown', async () => {
      authStore.userFullName = 'John Doe'
      authStore.user = {
        id: '1',
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'Admin'
      }

      const userMenuButton = wrapper.find('[data-dropdown] button')
      await userMenuButton.trigger('click')
      await wrapper.vm.$nextTick()

      const dropdown = wrapper.find('.absolute.right-0')
      expect(dropdown.text()).toContain('John Doe')
      expect(dropdown.text()).toContain('john.doe@example.com')
    })

    it('should display profile link in dropdown', async () => {
      const userMenuButton = wrapper.find('[data-dropdown] button')
      await userMenuButton.trigger('click')
      await wrapper.vm.$nextTick()

      const dropdown = wrapper.find('.absolute.right-0')
      expect(dropdown.text()).toContain('View Profile')
    })

    it('should display settings link in dropdown', async () => {
      const userMenuButton = wrapper.find('[data-dropdown] button')
      await userMenuButton.trigger('click')
      await wrapper.vm.$nextTick()

      const dropdown = wrapper.find('.absolute.right-0')
      expect(dropdown.text()).toContain('Settings')
    })

    it('should display sign out button in dropdown', async () => {
      const userMenuButton = wrapper.find('[data-dropdown] button')
      await userMenuButton.trigger('click')
      await wrapper.vm.$nextTick()

      const dropdown = wrapper.find('.absolute.right-0')
      expect(dropdown.text()).toContain('Sign Out')
    })

    it('should close menu when clicking profile link', async () => {
      const userMenuButton = wrapper.find('[data-dropdown] button')
      await userMenuButton.trigger('click')
      await wrapper.vm.$nextTick()

      expect((wrapper.vm as any).showUserMenu).toBe(true)

      const profileLink = wrapper.findAll('a').find(el => el.text().includes('View Profile'))
      await profileLink!.trigger('click')
      await wrapper.vm.$nextTick()

      expect((wrapper.vm as any).showUserMenu).toBe(false)
    })

    it('should close menu when clicking settings link', async () => {
      const userMenuButton = wrapper.find('[data-dropdown] button')
      await userMenuButton.trigger('click')
      await wrapper.vm.$nextTick()

      expect((wrapper.vm as any).showUserMenu).toBe(true)

      const settingsLink = wrapper.findAll('a').find(el => el.text().includes('Settings'))
      await settingsLink!.trigger('click')
      await wrapper.vm.$nextTick()

      expect((wrapper.vm as any).showUserMenu).toBe(false)
    })
  })

  describe('Logout Functionality', () => {
    it('should call logout and redirect on sign out', async () => {
      const pushSpy = vi.spyOn(mockRouter, 'push')
      authStore.logout = vi.fn().mockResolvedValue(undefined)

      const userMenuButton = wrapper.find('[data-dropdown] button')
      await userMenuButton.trigger('click')
      await wrapper.vm.$nextTick()

      const signOutButton = wrapper.findAll('button').find(el => el.text().includes('Sign Out'))
      await signOutButton!.trigger('click')
      await wrapper.vm.$nextTick()

      expect(authStore.logout).toHaveBeenCalled()
      expect(pushSpy).toHaveBeenCalledWith('/login')
    })

    it('should close menu after logout', async () => {
      authStore.logout = vi.fn().mockResolvedValue(undefined)

      const userMenuButton = wrapper.find('[data-dropdown] button')
      await userMenuButton.trigger('click')
      await wrapper.vm.$nextTick()

      const signOutButton = wrapper.findAll('button').find(el => el.text().includes('Sign Out'))
      await signOutButton!.trigger('click')
      await wrapper.vm.$nextTick()

      expect((wrapper.vm as any).showUserMenu).toBe(false)
    })

    it('should handle logout errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      authStore.logout = vi.fn().mockRejectedValue(new Error('Logout failed'))

      const userMenuButton = wrapper.find('[data-dropdown] button')
      await userMenuButton.trigger('click')
      await wrapper.vm.$nextTick()

      const signOutButton = wrapper.findAll('button').find(el => el.text().includes('Sign Out'))
      await signOutButton!.trigger('click')
      await wrapper.vm.$nextTick()

      expect(consoleErrorSpy).toHaveBeenCalledWith('Logout failed:', expect.any(Error))
      expect((wrapper.vm as any).showUserMenu).toBe(false)

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Notification Badge', () => {
    it('should display count when less than 10', () => {
      const badge = wrapper.find('.bg-error-500')
      expect(badge.text()).toBe('3')
    })

    it('should display 9+ when count is 10 or more', async () => {
      (wrapper.vm as any).notificationCount = 15
      await wrapper.vm.$nextTick()

      const badge = wrapper.find('.bg-error-500')
      expect(badge.text()).toBe('9+')
    })

    it('should not display badge when count is 0', async () => {
      (wrapper.vm as any).notificationCount = 0
      await wrapper.vm.$nextTick()

      const badge = wrapper.find('.bg-error-500')
      expect(badge.exists()).toBe(false)
    })
  })

  describe('Click Outside Handling', () => {
    it('should close user menu when clicking outside', async () => {
      const userMenuButton = wrapper.find('[data-dropdown] button')
      await userMenuButton.trigger('click')
      await wrapper.vm.$nextTick()

      expect((wrapper.vm as any).showUserMenu).toBe(true)

      // Simulate click outside
      const clickEvent = new Event('click', { bubbles: true })
      Object.defineProperty(clickEvent, 'target', {
        value: document.body,
        enumerable: true,
      })
      document.dispatchEvent(clickEvent)
      await wrapper.vm.$nextTick()

      expect((wrapper.vm as any).showUserMenu).toBe(false)
    })

    it('should not close menu when clicking inside dropdown', async () => {
      const userMenuButton = wrapper.find('[data-dropdown] button')
      await userMenuButton.trigger('click')
      await wrapper.vm.$nextTick()

      expect((wrapper.vm as any).showUserMenu).toBe(true)

      // Click inside the dropdown area
      const dropdown = wrapper.find('[data-dropdown]')
      await dropdown.trigger('click')
      await wrapper.vm.$nextTick()

      // Menu should stay open
      expect((wrapper.vm as any).showUserMenu).toBe(true)
    })
  })
})
