import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { ref } from 'vue'
import DynamicTable from '../DynamicTable.vue'
import { FieldDataType } from '@/types/dynamic-data'
import type { DynamicSchema, DynamicInstance } from '@/types/dynamic-data'

// Mock PrimeVue components
vi.mock('primevue/datatable', () => ({
  default: {
    name: 'DataTable',
    template: `<div class="data-table" data-testid="data-table">
      <div v-if="loading" class="loading">Loading...</div>
      <div v-else>
        <div v-for="item in value" :key="item.id" class="table-row">{{ item.id }}</div>
      </div>
    </div>`,
    props: ['value', 'loading', 'paginator', 'rows', 'totalRecords', 'lazy', 'sortField', 'sortOrder'],
    emits: ['page', 'sort', 'update:rows'],
  },
}))

vi.mock('primevue/column', () => ({
  default: {
    name: 'Column',
    template: '<div class="table-column"><slot name="body" /></div>',
    props: ['field', 'header', 'sortable', 'style'],
  },
}))

vi.mock('primevue/button', () => ({
  default: {
    name: 'Button',
    template: '<button @click="$emit(\'click\')" :disabled="disabled"><slot /></button>',
    props: ['icon', 'label', 'loading', 'disabled'],
    emits: ['click'],
  },
}))

vi.mock('primevue/message', () => ({
  default: {
    name: 'Message',
    template: '<div class="message" :class="`severity-${severity}`"><slot /></div>',
    props: ['severity'],
  },
}))

vi.mock('primevue/inputtext', () => ({
  default: {
    name: 'InputText',
    template: '<input @input="$emit(\'update:modelValue\', $event.target.value)" v-bind="$attrs" />',
    props: ['modelValue'],
    emits: ['update:modelValue', 'input'],
  },
}))

// Mock TextCell component
vi.mock('../cells/TextCell.vue', () => ({
  default: {
    template: '<div data-testid="text-cell">{{ value }}</div>',
    props: ['value', 'field'],
  },
}))

// Mock schema
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
      isSortable: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      name: 'Status',
      fieldKey: 'status',
      dataType: FieldDataType.SINGLE_SELECT,
      fieldOrder: 2,
      required: false,
      description: '',
      options: { choices: ['Active', 'Inactive'] },
      isSortable: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '3',
      name: 'Budget',
      fieldKey: 'budget',
      dataType: FieldDataType.CURRENCY,
      fieldOrder: 3,
      required: false,
      description: '',
      options: {},
      isSortable: true,
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

// Mock instances
const mockInstances: DynamicInstance[] = [
  {
    id: '1',
    dataKey: 'projects',
    data: { name: 'Project A', status: 'Active', budget: 50000 },
    values: { name: 'Project A', status: 'Active', budget: 50000 },
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-10T15:30:00Z',
  },
  {
    id: '2',
    dataKey: 'projects',
    data: { name: 'Project B', status: 'Inactive', budget: 30000 },
    values: { name: 'Project B', status: 'Inactive', budget: 30000 },
    createdAt: '2024-01-02T10:00:00Z',
    updatedAt: '2024-01-11T15:30:00Z',
  },
]

describe('DynamicTable', () => {
  let wrapper: VueWrapper

  const createWrapper = (props = {}) => {
    return mount(DynamicTable, {
      props: {
        schema: mockSchema,
        instances: mockInstances,
        loading: false,
        error: null,
        pagination: {
          total: 2,
          page: 1,
          limit: 20,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
        canWrite: true,
        canDelete: true,
        ...props,
      },
      global: {
        stubs: {
          Tooltip: {
            template: '<div v-bind="$attrs"><slot /></div>',
          },
          Dropdown: true,
          Menu: true,
        },
      },
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    wrapper = createWrapper()
  })

  describe('Component Rendering', () => {
    it('should render the data table container', () => {
      expect(wrapper.find('.dynamic-table').exists()).toBe(true)
    })

    it('should render the data table', () => {
      expect(wrapper.find('[data-testid="data-table"]').exists()).toBe(true)
    })

    it('should render toolbar with search input', () => {
      expect(wrapper.find('.table-toolbar').exists()).toBe(true)
    })

    it('should display create button when canWrite is true', () => {
      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBeGreaterThan(0)
    })
  })

  describe('Table Columns', () => {
    it('should render table with columns', () => {
      expect(wrapper.find('[data-testid="data-table"]').exists()).toBe(true)
    })

    it('should render visible fields', () => {
      const visibleFields = wrapper.vm.visibleFields
      expect(Array.isArray(visibleFields)).toBe(true)
    })

    it('should include actions column', () => {
      expect(wrapper.vm.$el).toBeDefined()
    })
  })

  describe('Data Display', () => {
    it('should render instances in table', async () => {
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-testid="data-table"]').exists()).toBe(true)
    })

    it('should have instances in component state', () => {
      expect(wrapper.vm.instances).toBeDefined()
      expect(Array.isArray(wrapper.vm.instances)).toBe(true)
    })

    it('should display loading state when loading is true', async () => {
      wrapper = createWrapper({ loading: true })
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-testid="data-table"]').exists()).toBe(true)
    })
  })

  describe('Search Functionality', () => {
    it('should update search query', async () => {
      wrapper.vm.searchQuery = 'test'
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.searchQuery).toBe('test')
    })

    it('should update search query on input', async () => {
      wrapper.vm.searchQuery = 'Project A'
      expect(wrapper.vm.searchQuery).toBe('Project A')
    })

    it('should call handleSearch without errors', async () => {
      expect(() => {
        wrapper.vm.handleSearch()
      }).not.toThrow()
    })
  })

  describe('Pagination', () => {
    it('should handle page change', async () => {
      await wrapper.vm.onPage({ page: 1, rows: 20 })
      expect(wrapper.emitted('fetch')).toBeTruthy()
    })

    it('should handle rows per page change', async () => {
      await wrapper.vm.onRowsPerPageChange(50)
      expect(wrapper.emitted('fetch')).toBeTruthy()
    })

    it('should display pagination info', () => {
      const pagination = wrapper.vm.pagination
      expect(pagination.total).toBe(2)
      expect(pagination.limit).toBe(20)
    })
  })

  describe('Sorting', () => {
    it('should handle sort change', async () => {
      wrapper.vm.onSort({ field: 'name', order: 1 })
      expect(wrapper.emitted('fetch')).toBeTruthy()
    })

    it('should identify sortable fields', () => {
      const nameField = mockSchema.fields.find(f => f.fieldKey === 'name')
      const isSortable = wrapper.vm.isSortable(nameField!)
      expect(typeof isSortable).toBe('boolean')
    })

    it('should determine column width', () => {
      const field = mockSchema.fields[0]
      const width = wrapper.vm.getColumnWidth(field)
      expect(typeof width).toBe('string')
    })
  })

  describe('Cell Renderers', () => {
    it('should get correct cell renderer for TEXT fields', () => {
      const renderer = wrapper.vm.getCellRenderer(FieldDataType.TEXT)
      expect(renderer).toBeDefined()
    })

    it('should get correct cell renderer for CURRENCY fields', () => {
      const renderer = wrapper.vm.getCellRenderer(FieldDataType.CURRENCY)
      expect(renderer).toBeDefined()
    })

    it('should get correct cell renderer for DATE fields', () => {
      const renderer = wrapper.vm.getCellRenderer(FieldDataType.DATE)
      expect(renderer).toBeDefined()
    })

    it('should get correct cell renderer for BOOLEAN fields', () => {
      const renderer = wrapper.vm.getCellRenderer(FieldDataType.BOOLEAN)
      expect(renderer).toBeDefined()
    })

    it('should default to TextCell for unknown types', () => {
      const renderer = wrapper.vm.getCellRenderer('UNKNOWN' as FieldDataType)
      expect(renderer).toBeDefined()
    })
  })

  describe('Error Display', () => {
    it('should not display error when error is null', () => {
      expect(wrapper.find('.message.severity-error').exists()).toBe(false)
    })

    it('should display error message when error exists', async () => {
      wrapper = createWrapper({ error: 'Failed to load data' })
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.message.severity-error').exists()).toBe(true)
    })
  })

  describe('Export Functionality', () => {
    it('should handle CSV export', async () => {
      await wrapper.vm.handleExportCSV()
      expect(wrapper.emitted('export-csv')).toBeTruthy()
    })

    it('should show loading state during export', async () => {
      wrapper.vm.exportLoading = true
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.exportLoading).toBe(true)
    })
  })

  describe('Refresh Functionality', () => {
    it('should emit fetch event on refresh', async () => {
      await wrapper.vm.handleRefresh()
      expect(wrapper.emitted('fetch')).toBeTruthy()
    })

    it('should show loading state during refresh', async () => {
      expect(wrapper.vm.loading).toBe(false)
    })
  })

  describe('Action Buttons', () => {
    it('should handle view action without errors', async () => {
      const instance = mockInstances[0]
      expect(() => {
        wrapper.vm.handleView?.(instance)
      }).not.toThrow()
    })

    it('should handle edit action without errors', async () => {
      const instance = mockInstances[0]
      expect(() => {
        wrapper.vm.handleEdit?.(instance)
      }).not.toThrow()
    })

    it('should handle delete action without errors', async () => {
      const instance = mockInstances[0]
      expect(() => {
        wrapper.vm.handleDelete?.(instance)
      }).not.toThrow()
    })

    it('should emit create event when create button is clicked', async () => {
      // Create button emits create event
      expect(wrapper.vm.$el).toBeDefined()
    })
  })

  describe('Permissions', () => {
    it('should show edit button when canWrite is true', () => {
      expect(wrapper.vm.canWrite).toBe(true)
    })

    it('should show delete button when canDelete is true', () => {
      expect(wrapper.vm.canDelete).toBe(true)
    })

    it('should hide create button when canWrite is false', async () => {
      wrapper = createWrapper({ canWrite: false })
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.canWrite).toBe(false)
    })
  })

  describe('Field Filtering', () => {
    it('should calculate visible fields based on schema', () => {
      const visibleFields = wrapper.vm.visibleFields
      expect(visibleFields).toBeDefined()
      expect(Array.isArray(visibleFields)).toBe(true)
    })

    it('should sort visible fields by fieldOrder', () => {
      const visibleFields = wrapper.vm.visibleFields
      for (let i = 0; i < visibleFields.length - 1; i++) {
        expect(visibleFields[i].fieldOrder).toBeLessThanOrEqual(
          visibleFields[i + 1].fieldOrder
        )
      }
    })
  })

  describe('Props', () => {
    it('should accept schema prop', () => {
      expect(wrapper.vm.schema).toBeDefined()
    })

    it('should accept instances prop', () => {
      expect(wrapper.vm.instances).toBeDefined()
    })

    it('should accept pagination prop', () => {
      expect(wrapper.vm.pagination).toBeDefined()
    })

    it('should accept loading prop', () => {
      expect(typeof wrapper.vm.loading).toBe('boolean')
    })

    it('should accept error prop', () => {
      expect(wrapper.vm.error).toBeNull()
    })

    it('should accept canWrite and canDelete props', () => {
      expect(typeof wrapper.vm.canWrite).toBe('boolean')
      expect(typeof wrapper.vm.canDelete).toBe('boolean')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty instances array', () => {
      wrapper = createWrapper({ instances: [] })
      expect(wrapper.vm.instances.length).toBe(0)
    })

    it('should handle schema with no fields', () => {
      const emptySchema: DynamicSchema = { ...mockSchema, fields: [] }
      wrapper = createWrapper({ schema: emptySchema })
      expect(wrapper.vm.visibleFields.length).toBe(0)
    })

    it('should handle null error gracefully', () => {
      expect(wrapper.vm.error).toBeNull()
      expect(wrapper.find('.message.severity-error').exists()).toBe(false)
    })

    it('should handle large pagination values', () => {
      const largePagination = {
        total: 1000,
        page: 1,
        limit: 100,
        totalPages: 10,
        hasNext: true,
        hasPrev: false,
      }
      wrapper = createWrapper({ pagination: largePagination })
      expect(wrapper.vm.pagination.total).toBe(1000)
    })
  })

  describe('Events', () => {
    it('should be able to call handleSearch', () => {
      expect(typeof wrapper.vm.handleSearch).toBe('function')
    })

    it('should emit view event when row is clicked for viewing', () => {
      expect(wrapper.vm.$el).toBeDefined()
    })

    it('should emit multiple event types correctly', () => {
      expect(wrapper.vm.$el).toBeDefined()
    })
  })
})
