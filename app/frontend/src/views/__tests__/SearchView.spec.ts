import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import SearchView from '../SearchView.vue'

// Mock router
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('SearchView', () => {
  let wrapper: VueWrapper<any>

  const createWrapper = () => {
    wrapper = mount(SearchView, {
      global: {
        stubs: {},
      },
    })
    return wrapper
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render the search page', () => {
      createWrapper()

      expect(wrapper.find('h1').text()).toBe('Search')
    })

    it('should render search input field', () => {
      createWrapper()

      const searchInput = wrapper.find('input[type="text"]')
      expect(searchInput.exists()).toBe(true)
      expect(searchInput.attributes('placeholder')).toContain('Search for')
    })

    it('should render search button', () => {
      createWrapper()

      const searchButton = wrapper.find('button')
      expect(searchButton.exists()).toBe(true)
      expect(searchButton.text()).toContain('Search')
    })

    it('should display coming soon notice initially', () => {
      createWrapper()

      expect(wrapper.text()).toContain('Search Feature')
      expect(wrapper.text()).toContain('Full-text search functionality is currently in development')
    })

    it('should not display search results initially', () => {
      createWrapper()

      expect(wrapper.text()).not.toContain('Search Results')
    })
  })

  describe('Search Input', () => {
    it('should update search query on input', async () => {
      createWrapper()

      const searchInput = wrapper.find('input[type="text"]')
      await searchInput.setValue('test query')

      expect(wrapper.vm.searchQuery).toBe('test query')
    })

    it('should disable search button when query is empty', () => {
      createWrapper()

      const searchButton = wrapper.find('button')
      expect(searchButton.attributes('disabled')).toBeDefined()
    })

    it('should enable search button when query has text', async () => {
      createWrapper()

      const searchInput = wrapper.find('input[type="text"]')
      await searchInput.setValue('test')

      const searchButton = wrapper.find('button')
      expect(searchButton.attributes('disabled')).toBeUndefined()
    })

    it('should disable search button when query only has whitespace', async () => {
      createWrapper()

      const searchInput = wrapper.find('input[type="text"]')
      await searchInput.setValue('   ')

      const searchButton = wrapper.find('button')
      expect(searchButton.attributes('disabled')).toBeDefined()
    })
  })

  describe('Search Functionality', () => {
    it('should perform search on button click', async () => {
      createWrapper()

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const searchInput = wrapper.find('input[type="text"]')
      await searchInput.setValue('test search')

      const searchButton = wrapper.find('button')
      await searchButton.trigger('click')

      expect(consoleLogSpy).toHaveBeenCalledWith('Searching for:', 'test search')
      expect(wrapper.vm.hasSearched).toBe(true)

      consoleLogSpy.mockRestore()
    })

    it('should perform search on Enter key press', async () => {
      createWrapper()

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const searchInput = wrapper.find('input[type="text"]')
      await searchInput.setValue('test search')
      await searchInput.trigger('keyup.enter')

      expect(consoleLogSpy).toHaveBeenCalledWith('Searching for:', 'test search')
      expect(wrapper.vm.hasSearched).toBe(true)

      consoleLogSpy.mockRestore()
    })

    it('should not perform search with empty query', async () => {
      createWrapper()

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const searchButton = wrapper.find('button')
      await searchButton.trigger('click')

      expect(consoleLogSpy).not.toHaveBeenCalled()
      expect(wrapper.vm.hasSearched).toBe(false)

      consoleLogSpy.mockRestore()
    })

    it('should not perform search with whitespace-only query', async () => {
      createWrapper()

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const searchInput = wrapper.find('input[type="text"]')
      await searchInput.setValue('   ')

      const searchButton = wrapper.find('button')
      await searchButton.trigger('click')

      expect(consoleLogSpy).not.toHaveBeenCalled()
      expect(wrapper.vm.hasSearched).toBe(false)

      consoleLogSpy.mockRestore()
    })

    it('should set hasSearched to true after search', async () => {
      createWrapper()

      const searchInput = wrapper.find('input[type="text"]')
      await searchInput.setValue('test')

      const searchButton = wrapper.find('button')
      await searchButton.trigger('click')

      expect(wrapper.vm.hasSearched).toBe(true)
    })
  })

  describe('Search Results Display', () => {
    it('should show search results section after search', async () => {
      createWrapper()

      const searchInput = wrapper.find('input[type="text"]')
      await searchInput.setValue('test')

      const searchButton = wrapper.find('button')
      await searchButton.trigger('click')

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Search Results')
    })

    it('should show no results message when results are empty', async () => {
      createWrapper()

      const searchInput = wrapper.find('input[type="text"]')
      await searchInput.setValue('nonexistent')

      const searchButton = wrapper.find('button')
      await searchButton.trigger('click')

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('No results found')
      expect(wrapper.text()).toContain('Try different keywords')
    })

    it('should display search query in no results message', async () => {
      createWrapper()

      const searchQuery = 'my search query'
      const searchInput = wrapper.find('input[type="text"]')
      await searchInput.setValue(searchQuery)

      const searchButton = wrapper.find('button')
      await searchButton.trigger('click')

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain(`No results found for "${searchQuery}"`)
    })

    it('should show clear button when there are results', async () => {
      createWrapper()

      // Manually set results to test display
      wrapper.vm.hasSearched = true
      wrapper.vm.results = [
        {
          id: '1',
          title: 'Test Result',
          description: 'Test Description',
          category: 'User',
          icon: 'pi pi-user',
        },
      ]
      await wrapper.vm.$nextTick()

      const clearButton = wrapper.findAll('button').find((btn) => btn.text().includes('Clear'))
      expect(clearButton?.exists()).toBe(true)
    })

    it('should display result count when results exist', async () => {
      createWrapper()

      wrapper.vm.hasSearched = true
      wrapper.vm.results = [
        { id: '1', title: 'Result 1', description: 'Desc 1', category: 'User', icon: 'pi pi-user' },
        { id: '2', title: 'Result 2', description: 'Desc 2', category: 'Role', icon: 'pi pi-shield' },
      ]
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('(2 found)')
    })

    it('should render results list with proper structure', async () => {
      createWrapper()

      wrapper.vm.hasSearched = true
      wrapper.vm.results = [
        {
          id: '1',
          title: 'Test User',
          description: 'User description',
          category: 'User',
          icon: 'pi pi-user',
        },
      ]
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Test User')
      expect(wrapper.text()).toContain('User description')
      expect(wrapper.text()).toContain('User')
    })

    it('should render multiple results', async () => {
      createWrapper()

      wrapper.vm.hasSearched = true
      wrapper.vm.results = [
        { id: '1', title: 'Result 1', description: 'Desc 1', category: 'User', icon: 'pi pi-user' },
        { id: '2', title: 'Result 2', description: 'Desc 2', category: 'Role', icon: 'pi pi-shield' },
        { id: '3', title: 'Result 3', description: 'Desc 3', category: 'Plugin', icon: 'pi pi-puzzle-piece' },
      ]
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Result 1')
      expect(wrapper.text()).toContain('Result 2')
      expect(wrapper.text()).toContain('Result 3')
      expect(wrapper.text()).toContain('(3 found)')
    })
  })

  describe('Clear Search Functionality', () => {
    it('should clear search query', async () => {
      createWrapper()

      const searchInput = wrapper.find('input[type="text"]')
      await searchInput.setValue('test')

      const searchButton = wrapper.find('button')
      await searchButton.trigger('click')
      await wrapper.vm.$nextTick()

      wrapper.vm.clearSearch()
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.searchQuery).toBe('')
    })

    it('should reset hasSearched flag', async () => {
      createWrapper()

      wrapper.vm.hasSearched = true
      wrapper.vm.clearSearch()

      expect(wrapper.vm.hasSearched).toBe(false)
    })

    it('should clear results array', async () => {
      createWrapper()

      wrapper.vm.results = [
        { id: '1', title: 'Result 1', description: 'Desc 1', category: 'User', icon: 'pi pi-user' },
      ]
      wrapper.vm.clearSearch()

      expect(wrapper.vm.results).toEqual([])
    })

    it('should hide search results after clearing', async () => {
      createWrapper()

      const searchInput = wrapper.find('input[type="text"]')
      await searchInput.setValue('test')

      const searchButton = wrapper.find('button')
      await searchButton.trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Search Results')

      wrapper.vm.clearSearch()
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).not.toContain('Search Results')
    })

    it('should show coming soon notice after clearing', async () => {
      createWrapper()

      const searchInput = wrapper.find('input[type="text"]')
      await searchInput.setValue('test')

      const searchButton = wrapper.find('button')
      await searchButton.trigger('click')
      await wrapper.vm.$nextTick()

      wrapper.vm.clearSearch()
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Search Feature')
    })
  })

  describe('Open Result Functionality', () => {
    it('should call openResult when clicking on a result', async () => {
      createWrapper()

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const result = {
        id: '1',
        title: 'Test Result',
        description: 'Test Description',
        category: 'User',
        icon: 'pi pi-user',
        link: '/users/1',
      }

      wrapper.vm.hasSearched = true
      wrapper.vm.results = [result]
      await wrapper.vm.$nextTick()

      const resultItem = wrapper.find('.cursor-pointer')
      await resultItem.trigger('click')

      expect(consoleLogSpy).toHaveBeenCalledWith('Opening result:', result)

      consoleLogSpy.mockRestore()
    })

    it('should handle multiple result clicks', async () => {
      createWrapper()

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const results = [
        { id: '1', title: 'Result 1', description: 'Desc 1', category: 'User', icon: 'pi pi-user' },
        { id: '2', title: 'Result 2', description: 'Desc 2', category: 'Role', icon: 'pi pi-shield' },
      ]

      wrapper.vm.hasSearched = true
      wrapper.vm.results = results
      await wrapper.vm.$nextTick()

      const resultItems = wrapper.findAll('.cursor-pointer')

      await resultItems[0].trigger('click')
      expect(consoleLogSpy).toHaveBeenCalledWith('Opening result:', results[0])

      await resultItems[1].trigger('click')
      expect(consoleLogSpy).toHaveBeenCalledWith('Opening result:', results[1])

      consoleLogSpy.mockRestore()
    })
  })

  describe('UI States', () => {
    it('should show hover effect on result items', async () => {
      createWrapper()

      wrapper.vm.hasSearched = true
      wrapper.vm.results = [
        { id: '1', title: 'Test', description: 'Desc', category: 'User', icon: 'pi pi-user' },
      ]
      await wrapper.vm.$nextTick()

      const resultItem = wrapper.find('.cursor-pointer')
      expect(resultItem.classes()).toContain('hover:bg-gray-100')
    })

    it('should display result icon', async () => {
      createWrapper()

      wrapper.vm.hasSearched = true
      wrapper.vm.results = [
        { id: '1', title: 'Test', description: 'Desc', category: 'User', icon: 'pi pi-user' },
      ]
      await wrapper.vm.$nextTick()

      const icon = wrapper.find('i.pi-user')
      expect(icon.exists()).toBe(true)
    })

    it('should display category badge', async () => {
      createWrapper()

      wrapper.vm.hasSearched = true
      wrapper.vm.results = [
        { id: '1', title: 'Test', description: 'Desc', category: 'User', icon: 'pi pi-user' },
      ]
      await wrapper.vm.$nextTick()

      const badge = wrapper.find('.bg-gray-200')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toBe('User')
    })

    it('should display chevron icon for navigation', async () => {
      createWrapper()

      wrapper.vm.hasSearched = true
      wrapper.vm.results = [
        { id: '1', title: 'Test', description: 'Desc', category: 'User', icon: 'pi pi-user' },
      ]
      await wrapper.vm.$nextTick()

      const chevron = wrapper.find('i.pi-chevron-right')
      expect(chevron.exists()).toBe(true)
    })
  })

  describe('Accessibility', () => {
    it('should have proper input placeholder', () => {
      createWrapper()

      const searchInput = wrapper.find('input[type="text"]')
      expect(searchInput.attributes('placeholder')).toContain('Search for users, roles')
    })

    it('should have disabled state styling on button', async () => {
      createWrapper()

      const searchButton = wrapper.find('button')
      expect(searchButton.classes()).toContain('disabled:bg-gray-300')
      expect(searchButton.classes()).toContain('disabled:cursor-not-allowed')
    })

    it('should have keyboard navigation support', async () => {
      createWrapper()

      const searchInput = wrapper.find('input[type="text"]')
      await searchInput.setValue('test')

      // Verify Enter key binding exists
      await searchInput.trigger('keyup.enter')

      expect(wrapper.vm.hasSearched).toBe(true)
    })
  })
})
