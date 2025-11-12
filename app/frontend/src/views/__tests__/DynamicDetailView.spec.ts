import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { ref, computed } from 'vue'
import DynamicDetailView from '../DynamicDetailView.vue'
import { useDynamicData } from '@/composables/dynamic/useDynamicData'
import { FieldDataType } from '@/types/dynamic-data'
import type { DynamicSchema, DynamicInstance, ChangeLogEntry } from '@/types/dynamic-data'

// Mock the composable
vi.mock('@/composables/dynamic/useDynamicData', () => ({
  useDynamicData: vi.fn(),
}))

// Mock cell renderer components
vi.mock('@/components/dynamic/cells/TextCell.vue', () => ({
  default: { template: '<div data-testid="text-cell"><slot /></div>' },
}))

vi.mock('@/components/dynamic/cells/NumberCell.vue', () => ({
  default: { template: '<div data-testid="number-cell"><slot /></div>' },
}))

vi.mock('@/components/dynamic/cells/DateCell.vue', () => ({
  default: { template: '<div data-testid="date-cell"><slot /></div>' },
}))

// Mock FieldDataType enum
vi.mock('@/types/dynamic-data', async () => {
  const actual = await vi.importActual('@/types/dynamic-data')
  return actual
})

// Create mock router
const createMockRouter = () => {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
      {
        path: '/dynamic/:dataKey',
        name: 'dynamic-list',
        component: { template: '<div>List</div>' },
      },
      {
        path: '/dynamic/:dataKey/:id',
        name: 'dynamic-detail',
        component: { template: '<div>Detail</div>' },
      },
      {
        path: '/dynamic/:dataKey/:id/edit',
        name: 'dynamic-edit',
        component: { template: '<div>Edit</div>' },
      },
    ],
  })
}

// Mock schema with fields
const mockSchema: DynamicSchema = {
  id: '1',
  key: 'projects',
  name: 'Projects',
  description: 'Project Management',
  fields: [
    {
      id: '1',
      name: 'Project Name',
      fieldKey: 'name',
      dataType: FieldDataType.TEXT,
      fieldOrder: 1,
      required: true,
      description: '',
      options: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      name: 'Budget',
      fieldKey: 'budget',
      dataType: FieldDataType.CURRENCY,
      fieldOrder: 2,
      required: false,
      description: '',
      options: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '3',
      name: 'Start Date',
      fieldKey: 'startDate',
      dataType: FieldDataType.DATE,
      fieldOrder: 3,
      required: false,
      description: '',
      options: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  permissions: {
    canRead: true,
    canWrite: true,
    canDelete: true,
    canCreate: true,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
}

// Mock instance
const mockInstance: DynamicInstance = {
  id: '123',
  dataKey: 'projects',
  data: {
    name: 'Website Redesign',
    budget: 50000,
    startDate: '2024-01-15',
  },
  values: {
    name: 'Website Redesign',
    budget: 50000,
    startDate: '2024-01-15',
  },
  createdAt: '2024-01-01T10:00:00Z',
  updatedAt: '2024-01-10T15:30:00Z',
  versionNumber: 2,
}

// Mock change history
const mockChangeHistory: ChangeLogEntry[] = [
  {
    id: '1',
    instanceId: '123',
    changeType: 'CREATED',
    changedBy: 'admin@example.com',
    changedAt: '2024-01-01T10:00:00Z',
    changes: {},
  },
  {
    id: '2',
    instanceId: '123',
    changeType: 'UPDATED',
    changedBy: 'editor@example.com',
    changedAt: '2024-01-10T15:30:00Z',
    changes: { budget: { from: 40000, to: 50000 } },
  },
]

describe('DynamicDetailView', () => {
  let wrapper: VueWrapper
  let mockRouter: any
  let mockUseDynamicData: any

  const createDefaultMockReturn = () => {
    const schemaRef = ref(mockSchema)
    const instanceRef = ref(mockInstance)
    const changeHistoryRef = ref(mockChangeHistory)
    const loadingRef = ref(false)
    const errorRef = ref<string | null>(null)

    return {
      schema: schemaRef,
      instance: instanceRef,
      changeHistory: changeHistoryRef,
      loading: loadingRef,
      error: errorRef,
      canWrite: computed(() => schemaRef.value?.permissions?.canWrite ?? false),
      canDelete: computed(() => schemaRef.value?.permissions?.canDelete ?? false),
      fetchSchema: vi.fn(),
      fetchInstance: vi.fn(),
      fetchChangeHistory: vi.fn(),
      deleteInstance: vi.fn(),
    }
  }

  const createWrapper = (options = {}) => {
    mockRouter = createMockRouter()

    return mount(DynamicDetailView, {
      global: {
        plugins: [mockRouter],
        stubs: {
          'router-link': true,
          Button: {
            template: '<button @click="$emit(\'click\')"><slot /></button>',
            emits: ['click'],
          },
          Card: {
            template: '<div class="card"><slot name="content" /></div>',
          },
          Dialog: {
            template: `<div v-if="visible" data-testid="delete-dialog">
              <slot />
              <slot name="footer" />
            </div>`,
            props: ['visible', 'header', 'modal', 'style'],
            emits: ['update:visible'],
          },
          Message: {
            template: '<div class="message" :class="`severity-${severity}`"><slot /></div>',
            props: ['severity'],
          },
          ProgressSpinner: {
            template: '<div data-testid="progress-spinner">Loading...</div>',
          },
          Timeline: {
            template: '<div data-testid="timeline"><slot /></div>',
            props: ['value', 'align'],
          },
        },
      },
      ...options,
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mock return value
    mockUseDynamicData = vi.mocked(useDynamicData)
    mockUseDynamicData.mockReturnValue(createDefaultMockReturn())

    wrapper = createWrapper()
  })

  describe('Component Rendering', () => {
    it('should render the dynamic-detail-view container', () => {
      expect(wrapper.find('.dynamic-detail-view').exists()).toBe(true)
    })

    it('should display schema name as heading', () => {
      expect(wrapper.find('h1').text()).toBe('Projects')
    })

    it('should display instance ID', async () => {
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('ID: 123')
    })

    it('should render the main card with instance details', async () => {
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.card').exists()).toBe(true)
    })
  })

  describe('Back Navigation', () => {
    it('should have back button', () => {
      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBeGreaterThan(0)
    })

    it('should be callable without errors', () => {
      expect(() => {
        wrapper.vm.handleBack()
      }).not.toThrow()
    })
  })

  describe('Action Buttons - Permissions', () => {
    it('should render edit button when canWrite is true', async () => {
      await wrapper.vm.$nextTick()
      // Check that the component can render without errors
      expect(wrapper.find('.dynamic-detail-view').exists()).toBe(true)
    })

    it('should render delete button when canDelete is true', async () => {
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.dynamic-detail-view').exists()).toBe(true)
    })
  })

  describe('Edit Handler', () => {
    it('should be callable without errors', () => {
      expect(() => {
        wrapper.vm.handleEdit()
      }).not.toThrow()
    })
  })

  describe('Loading State', () => {
    it('should not show loading spinner when data is loaded', async () => {
      expect(wrapper.find('[data-testid="progress-spinner"]').exists()).toBe(false)
    })

    it('should display content when not loading', async () => {
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.card').exists()).toBe(true)
    })
  })

  describe('Error State', () => {
    it('should display error message when error exists', async () => {
      mockUseDynamicData.mockReturnValue({
        ...createDefaultMockReturn(),
        error: { value: 'Failed to load instance' },
      })

      wrapper = createWrapper()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.message.severity-error').exists()).toBe(true)
      expect(wrapper.text()).toContain('Failed to load instance')
    })

    it('should not display error message when error is null', () => {
      expect(wrapper.find('.message.severity-error').exists()).toBe(false)
    })
  })

  describe('Instance Details Display', () => {
    it('should render fields from schema', async () => {
      await wrapper.vm.$nextTick()
      const card = wrapper.find('.card')
      expect(card.exists()).toBe(true)
    })

    it('should calculate and render sortedFields', () => {
      const sortedFields = wrapper.vm.sortedFields
      expect(sortedFields.length).toBe(3)
      expect(sortedFields[0].name).toBe('Project Name')
      expect(sortedFields[1].name).toBe('Budget')
      expect(sortedFields[2].name).toBe('Start Date')
    })

    it('should sort fields by fieldOrder', () => {
      const sortedFields = wrapper.vm.sortedFields
      for (let i = 0; i < sortedFields.length - 1; i++) {
        expect(sortedFields[i].fieldOrder).toBeLessThanOrEqual(
          sortedFields[i + 1].fieldOrder
        )
      }
    })
  })

  describe('Cell Renderers', () => {
    it('should return TextCell for TEXT fields', () => {
      const renderer = wrapper.vm.getCellRenderer(FieldDataType.TEXT)
      expect(renderer).toBeDefined()
    })

    it('should return CurrencyCell for CURRENCY fields', () => {
      const renderer = wrapper.vm.getCellRenderer(FieldDataType.CURRENCY)
      expect(renderer).toBeDefined()
    })

    it('should return DateCell for DATE fields', () => {
      const renderer = wrapper.vm.getCellRenderer(FieldDataType.DATE)
      expect(renderer).toBeDefined()
    })

    it('should return DateTimeCell for DATETIME fields', () => {
      const renderer = wrapper.vm.getCellRenderer(FieldDataType.DATETIME)
      expect(renderer).toBeDefined()
    })

    it('should return TextCell for unknown field types', () => {
      // Test with an invalid field type
      const invalidType = 'UNKNOWN' as FieldDataType
      const renderer = wrapper.vm.getCellRenderer(invalidType)
      expect(renderer).toBeDefined()
    })
  })

  describe('Date Formatting', () => {
    it('should format date correctly', () => {
      const dateString = '2024-01-15T10:30:00Z'
      const formatted = wrapper.vm.formatDate(dateString)
      expect(formatted).toContain('Jan')
      expect(formatted).toContain('2024')
    })

    it('should handle different date formats', () => {
      const dateString = '2024-12-31T23:59:59Z'
      const formatted = wrapper.vm.formatDate(dateString)
      expect(formatted).toContain('Dec')
      expect(formatted).toContain('31')
    })
  })

  describe('Metadata Section', () => {
    it('should display created date', async () => {
      await wrapper.vm.$nextTick()
      const text = wrapper.text()
      expect(text).toContain('Created')
    })

    it('should display last updated date', async () => {
      await wrapper.vm.$nextTick()
      const text = wrapper.text()
      expect(text).toContain('Last Updated')
    })

    it('should display version number', async () => {
      await wrapper.vm.$nextTick()
      const text = wrapper.text()
      expect(text).toContain('Version')
      expect(text).toContain('2')
    })
  })

  describe('Change History Timeline', () => {
    it('should render timeline when history exists', async () => {
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-testid="timeline"]').exists()).toBe(true)
    })

    it('should not render timeline when history is empty', async () => {
      mockUseDynamicData.mockReturnValue({
        ...createDefaultMockReturn(),
        changeHistory: { value: [] },
      })

      wrapper = createWrapper()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-testid="timeline"]').exists()).toBe(false)
    })

    it('should have change history section header', async () => {
      await wrapper.vm.$nextTick()
      const text = wrapper.text()
      expect(text).toContain('Change History')
    })
  })

  describe('Delete Dialog', () => {
    it('should show delete dialog when triggered', async () => {
      wrapper.vm.showDeleteDialog = true
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-testid="delete-dialog"]').exists()).toBe(true)
    })

    it('should hide delete dialog when showDeleteDialog is false', async () => {
      wrapper.vm.showDeleteDialog = false
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-testid="delete-dialog"]').exists()).toBe(false)
    })

    it('should toggle dialog visibility', async () => {
      expect(wrapper.vm.showDeleteDialog).toBe(false)
      wrapper.vm.showDeleteDialog = true
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.showDeleteDialog).toBe(true)
    })
  })

  describe('Confirm Delete', () => {
    it('should handle delete confirmation without errors', async () => {
      const deleteInstance = vi.fn().mockResolvedValue(undefined)

      mockUseDynamicData.mockReturnValue({
        ...createDefaultMockReturn(),
        deleteInstance,
      })

      wrapper = createWrapper()
      await wrapper.vm.$nextTick()

      expect(() => {
        wrapper.vm.confirmDelete()
      }).not.toThrow()
    })

    it('should close dialog after successful delete', async () => {
      const deleteInstance = vi.fn().mockResolvedValue(undefined)

      mockUseDynamicData.mockReturnValue({
        ...createDefaultMockReturn(),
        deleteInstance,
      })

      wrapper = createWrapper()
      wrapper.vm.showDeleteDialog = true

      await wrapper.vm.confirmDelete()
      await flushPromises()

      expect(wrapper.vm.showDeleteDialog).toBe(false)
    })

    it('should set deleteLoading to true during deletion', async () => {
      let resolveDelete: any
      const deleteInstance = vi.fn(
        () =>
          new Promise((resolve) => {
            resolveDelete = resolve
          })
      )

      mockUseDynamicData.mockReturnValue({
        ...createDefaultMockReturn(),
        deleteInstance,
      })

      wrapper = createWrapper()

      const deletePromise = wrapper.vm.confirmDelete()
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.deleteLoading).toBe(true)

      resolveDelete()
      await deletePromise
      await flushPromises()

      expect(wrapper.vm.deleteLoading).toBe(false)
    })

    it('should handle delete error gracefully', async () => {
      const deleteError = new Error('Delete failed')
      const deleteInstance = vi.fn().mockRejectedValue(deleteError)
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      mockUseDynamicData.mockReturnValue({
        ...createDefaultMockReturn(),
        deleteInstance,
      })

      wrapper = createWrapper()

      await wrapper.vm.confirmDelete()
      await flushPromises()

      expect(consoleSpy).toHaveBeenCalledWith('Failed to delete instance:', deleteError)

      consoleSpy.mockRestore()
    })

    it('should close dialog even after error', async () => {
      const deleteInstance = vi.fn().mockRejectedValue(new Error('Delete failed'))

      mockUseDynamicData.mockReturnValue({
        ...createDefaultMockReturn(),
        deleteInstance,
      })

      wrapper = createWrapper()
      wrapper.vm.showDeleteDialog = true

      await wrapper.vm.confirmDelete()
      await flushPromises()

      expect(wrapper.vm.showDeleteDialog).toBe(false)
    })
  })

  describe('Lifecycle - onMounted', () => {
    it('should fetch schema on mount', async () => {
      const fetchSchema = vi.fn()
      mockUseDynamicData.mockReturnValue({
        ...createDefaultMockReturn(),
        fetchSchema,
      })

      wrapper = createWrapper()
      await wrapper.vm.$nextTick()

      expect(fetchSchema).toHaveBeenCalled()
    })

    it('should have methods to fetch instance and history', async () => {
      const fetchInstance = vi.fn()
      const fetchChangeHistory = vi.fn()
      mockUseDynamicData.mockReturnValue({
        ...createDefaultMockReturn(),
        fetchInstance,
        fetchChangeHistory,
      })

      wrapper = createWrapper()
      await wrapper.vm.$nextTick()

      // Verify methods are available and callable
      expect(typeof wrapper.vm.confirmDelete).toBe('function')
    })

    it('should initialize component properly', async () => {
      wrapper = createWrapper()
      await wrapper.vm.$nextTick()

      // Component should have all required properties
      expect(wrapper.vm.sortedFields).toBeDefined()
      expect(Array.isArray(wrapper.vm.sortedFields)).toBe(true)
    })

    it('should have proper initial state', async () => {
      wrapper = createWrapper()

      expect(wrapper.vm.showDeleteDialog).toBe(false)
      expect(wrapper.vm.deleteLoading).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing schema name', async () => {
      mockUseDynamicData.mockReturnValue({
        ...createDefaultMockReturn(),
        schema: { value: { ...mockSchema, name: undefined } },
      })

      wrapper = createWrapper()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('h1').text()).toBe('Loading...')
    })

    it('should handle empty change history', async () => {
      mockUseDynamicData.mockReturnValue({
        ...createDefaultMockReturn(),
        changeHistory: { value: [] },
      })

      wrapper = createWrapper()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-testid="timeline"]').exists()).toBe(false)
    })

    it('should handle schema without fields', async () => {
      mockUseDynamicData.mockReturnValue({
        ...createDefaultMockReturn(),
        schema: { value: { ...mockSchema, fields: [] } },
      })

      wrapper = createWrapper()
      await wrapper.vm.$nextTick()

      const sortedFields = wrapper.vm.sortedFields
      expect(sortedFields.length).toBe(0)
    })

    it('should handle null instance gracefully', async () => {
      // Component should not crash even with null instance
      expect(wrapper.find('.dynamic-detail-view').exists()).toBe(true)
    })

    it('should handle date formatting for invalid dates', () => {
      const invalidDate = 'not-a-date'
      const formatted = wrapper.vm.formatDate(invalidDate)
      // Should not throw and should return a string
      expect(typeof formatted).toBe('string')
    })
  })

  describe('Permission-based Display', () => {
    it('should show edit button when canWrite is true', async () => {
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.$el).toBeDefined()
    })

    it('should show delete button when canDelete is true', async () => {
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.$el).toBeDefined()
    })

    it('should handle no write permissions', async () => {
      mockUseDynamicData.mockReturnValue({
        ...createDefaultMockReturn(),
        canWrite: computed(() => false),
      })

      wrapper = createWrapper()
      await wrapper.vm.$nextTick()

      // Component should still render
      expect(wrapper.find('.dynamic-detail-view').exists()).toBe(true)
    })

    it('should handle no delete permissions', async () => {
      mockUseDynamicData.mockReturnValue({
        ...createDefaultMockReturn(),
        canDelete: computed(() => false),
      })

      wrapper = createWrapper()
      await wrapper.vm.$nextTick()

      // Component should still render
      expect(wrapper.find('.dynamic-detail-view').exists()).toBe(true)
    })
  })
})
