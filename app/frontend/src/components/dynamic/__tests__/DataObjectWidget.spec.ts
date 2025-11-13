import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { ref } from 'vue'
import DataObjectWidget from '../DataObjectWidget.vue'

// Mock composables
const mockFetchDataObjects = vi.fn()
const mockFetchSchema = vi.fn()
const mockFetchInstances = vi.fn()
const mockCreateInstance = vi.fn()
const mockDeleteInstance = vi.fn()

const dataObjectsRef = ref<any[]>([])
const instancesRef = ref<any[]>([])
const schemaRef = ref<any>(null)
const loadingRef = ref(false)
const errorRef = ref<string | null>(null)

vi.mock('@/composables/admin/useDataObjects', () => ({
  useDataObjects: () => ({
    dataObjects: dataObjectsRef,
    fetchDataObjects: mockFetchDataObjects,
  }),
}))

vi.mock('@/composables/admin/useDataInstances', () => ({
  useDataInstances: () => ({
    instances: instancesRef,
    schema: schemaRef,
    loading: loadingRef,
    error: errorRef,
    fetchSchema: mockFetchSchema,
    fetchInstances: mockFetchInstances,
    createInstance: mockCreateInstance,
    deleteInstance: mockDeleteInstance,
  }),
}))

// Mock PrimeVue components - simple stubs
vi.mock('primevue/button', () => ({ default: { name: 'Button', template: '<button></button>', props: ['label', 'icon', 'class', 'loading', 'severity', 'outlined'] } }))
vi.mock('primevue/card', () => ({ default: { name: 'Card', template: '<div class="card"><slot name="content" /></div>' } }))
vi.mock('primevue/dialog', () => ({ default: { name: 'Dialog', template: '<div class="dialog" v-if="visible"><slot /><slot name="footer" /></div>', props: ['visible', 'header', 'modal', 'style'] } }))
vi.mock('primevue/select', () => ({ default: { name: 'Select', template: '<select></select>', props: ['modelValue', 'options', 'optionLabel', 'placeholder', 'class'] } }))
vi.mock('primevue/tag', () => ({ default: { name: 'Tag', template: '<span class="tag"></span>', props: ['value', 'severity', 'class'] } }))
vi.mock('primevue/progressspinner', () => ({ default: { name: 'ProgressSpinner', template: '<div class="progress-spinner"></div>' } }))
vi.mock('../fields/DynamicFormField.vue', () => ({ default: { name: 'DynamicFormField', template: '<div class="dynamic-form-field"></div>', props: ['field', 'modelValue', 'error'] } }))

describe('DataObjectWidget', () => {
  let wrapper: VueWrapper<any>

  const mockDataObjects = [
    {
      id: 'obj-1',
      name: 'Contact',
      description: 'Contact information',
      dataKey: 'contact',
      _count: { fields: 5, instances: 10 },
    },
    {
      id: 'obj-2',
      name: 'Product',
      description: 'Product catalog',
      dataKey: 'product',
      _count: { fields: 8, instances: 25 },
    },
  ]

  const mockSchema = {
    id: 'schema-1',
    fields: [
      {
        id: 'field-1',
        name: 'Name',
        fieldKey: 'name',
        dataType: 'TEXT',
        fieldOrder: 0,
        isMandatory: true,
        defaultValue: '',
      },
      {
        id: 'field-2',
        name: 'Email',
        fieldKey: 'email',
        dataType: 'EMAIL',
        fieldOrder: 1,
        isMandatory: true,
        defaultValue: '',
      },
    ],
  }

  const mockInstances = [
    {
      id: 'inst-1',
      values: {
        name: 'John Doe',
        email: 'john@example.com',
      },
      createdAt: '2024-01-15T10:30:00Z',
    },
    {
      id: 'inst-2',
      values: {
        name: 'Jane Smith',
        email: 'jane@example.com',
      },
      createdAt: '2024-01-16T14:20:00Z',
    },
  ]

  const createWrapper = () => {
    wrapper = mount(DataObjectWidget, {
      global: {
        stubs: {},
        directives: {
          tooltip: {},
        },
      },
    })
    return wrapper
  }

  beforeEach(() => {
    vi.clearAllMocks()
    dataObjectsRef.value = []
    instancesRef.value = []
    schemaRef.value = null
    loadingRef.value = false
    errorRef.value = null
    mockFetchDataObjects.mockResolvedValue(undefined)
    mockFetchSchema.mockResolvedValue(undefined)
    mockFetchInstances.mockResolvedValue(undefined)
    mockCreateInstance.mockResolvedValue(undefined)
    mockDeleteInstance.mockResolvedValue(undefined)
  })

  describe('Component Rendering', () => {
    it('should render the widget', () => {
      createWrapper()
      expect(wrapper.find('.bg-white').exists()).toBe(true)
    })

    it('should display title', () => {
      createWrapper()
      expect(wrapper.text()).toContain('Dynamic Data Objects')
    })

    it('should show empty state when no data object selected', () => {
      createWrapper()
      expect(wrapper.text()).toContain('Select a data object to get started')
    })

    it('should display loading spinner when loading', async () => {
      loadingRef.value = true
      createWrapper()
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.progress-spinner').exists()).toBe(true)
    })
  })

  describe('Component Lifecycle', () => {
    it('should fetch data objects on mount', async () => {
      createWrapper()
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(mockFetchDataObjects).toHaveBeenCalled()
    })
  })

  describe('Data Object Selection', () => {
    it('should fetch schema when data object is selected', async () => {
      dataObjectsRef.value = mockDataObjects
      createWrapper()
      wrapper.vm.selectedDataObject = mockDataObjects[0]
      await wrapper.vm.onDataObjectChange()
      expect(mockFetchSchema).toHaveBeenCalledWith('obj-1')
    })

    it('should fetch instances when data object is selected', async () => {
      dataObjectsRef.value = mockDataObjects
      createWrapper()
      wrapper.vm.selectedDataObject = mockDataObjects[0]
      await wrapper.vm.onDataObjectChange()
      expect(mockFetchInstances).toHaveBeenCalledWith('obj-1')
    })

    it('should not fetch when no data object selected', async () => {
      createWrapper()
      wrapper.vm.selectedDataObject = null
      await wrapper.vm.onDataObjectChange()
      expect(mockFetchSchema).not.toHaveBeenCalled()
      expect(mockFetchInstances).not.toHaveBeenCalled()
    })
  })

  describe('Stats Display', () => {
    it('should display field count', async () => {
      dataObjectsRef.value = mockDataObjects
      createWrapper()
      wrapper.vm.selectedDataObject = mockDataObjects[0]
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('5')
      expect(wrapper.text()).toContain('Fields')
    })

    it('should display instance count', async () => {
      dataObjectsRef.value = mockDataObjects
      createWrapper()
      wrapper.vm.selectedDataObject = mockDataObjects[0]
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('10')
      expect(wrapper.text()).toContain('Instances')
    })

    it('should handle missing _count', async () => {
      const objWithoutCount = { ...mockDataObjects[0], _count: undefined }
      createWrapper()
      wrapper.vm.selectedDataObject = objWithoutCount
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('0')
    })
  })

  describe('Create Instance Dialog', () => {
    it('should open create dialog', async () => {
      dataObjectsRef.value = mockDataObjects
      createWrapper()
      wrapper.vm.selectedDataObject = mockDataObjects[0]
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.showCreateDialog).toBe(false)
      wrapper.vm.showCreateDialog = true
      expect(wrapper.vm.showCreateDialog).toBe(true)
    })

    it('should reset form on dialog hide', () => {
      createWrapper()
      wrapper.vm.formValues = { name: 'Test' }
      wrapper.vm.formErrors = { email: 'Required' }
      wrapper.vm.resetForm()
      expect(wrapper.vm.formValues).toEqual({})
      expect(wrapper.vm.formErrors).toEqual({})
    })

    it('should set default values on reset', () => {
      schemaRef.value = {
        fields: [
          { fieldKey: 'status', defaultValue: 'active' },
          { fieldKey: 'count', defaultValue: '0' },
        ],
      }
      createWrapper()
      wrapper.vm.resetForm()
      expect(wrapper.vm.formValues.status).toBe('active')
      expect(wrapper.vm.formValues.count).toBe('0')
    })
  })

  describe('Form Validation', () => {
    it('should validate mandatory fields', () => {
      schemaRef.value = mockSchema
      createWrapper()
      wrapper.vm.formValues = {}
      const isValid = wrapper.vm.validateForm()
      expect(isValid).toBe(false)
      expect(wrapper.vm.formErrors.name).toBe('Name is required')
      expect(wrapper.vm.formErrors.email).toBe('Email is required')
    })

    it('should pass validation when all mandatory fields are filled', () => {
      schemaRef.value = mockSchema
      createWrapper()
      wrapper.vm.formValues = {
        name: 'John Doe',
        email: 'john@example.com',
      }
      const isValid = wrapper.vm.validateForm()
      expect(isValid).toBe(true)
      expect(Object.keys(wrapper.vm.formErrors)).toHaveLength(0)
    })

    it('should return false when no schema', () => {
      schemaRef.value = null
      createWrapper()
      const isValid = wrapper.vm.validateForm()
      expect(isValid).toBe(false)
    })
  })

  describe('Instance Creation', () => {
    it('should create instance with valid data', async () => {
      schemaRef.value = mockSchema
      dataObjectsRef.value = mockDataObjects
      createWrapper()
      wrapper.vm.selectedDataObject = mockDataObjects[0]
      wrapper.vm.formValues = {
        name: 'John Doe',
        email: 'john@example.com',
      }
      await wrapper.vm.createInstance()
      expect(mockCreateInstance).toHaveBeenCalledWith('obj-1', {
        values: { name: 'John Doe', email: 'john@example.com' },
      })
    })

    it('should close dialog after successful creation', async () => {
      schemaRef.value = mockSchema
      dataObjectsRef.value = mockDataObjects
      createWrapper()
      wrapper.vm.selectedDataObject = mockDataObjects[0]
      wrapper.vm.formValues = { name: 'Test', email: 'test@example.com' }
      wrapper.vm.showCreateDialog = true
      await wrapper.vm.createInstance()
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.showCreateDialog).toBe(false)
    })

    it('should refresh instances after creation', async () => {
      schemaRef.value = mockSchema
      dataObjectsRef.value = mockDataObjects
      createWrapper()
      wrapper.vm.selectedDataObject = mockDataObjects[0]
      wrapper.vm.formValues = { name: 'Test', email: 'test@example.com' }
      await wrapper.vm.createInstance()
      expect(mockFetchInstances).toHaveBeenCalledWith('obj-1')
    })

    it('should not create without validation', async () => {
      schemaRef.value = mockSchema
      createWrapper()
      wrapper.vm.selectedDataObject = mockDataObjects[0]
      wrapper.vm.formValues = {}
      await wrapper.vm.createInstance()
      expect(mockCreateInstance).not.toHaveBeenCalled()
    })

    it('should not create without selected data object', async () => {
      schemaRef.value = mockSchema
      createWrapper()
      wrapper.vm.selectedDataObject = null
      wrapper.vm.formValues = { name: 'Test', email: 'test@example.com' }
      await wrapper.vm.createInstance()
      expect(mockCreateInstance).not.toHaveBeenCalled()
    })

    it('should handle creation errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockCreateInstance.mockRejectedValue(new Error('API Error'))
      schemaRef.value = mockSchema
      dataObjectsRef.value = mockDataObjects
      createWrapper()
      wrapper.vm.selectedDataObject = mockDataObjects[0]
      wrapper.vm.formValues = { name: 'Test', email: 'test@example.com' }
      await wrapper.vm.createInstance()
      expect(consoleErrorSpy).toHaveBeenCalled()
      consoleErrorSpy.mockRestore()
    })
  })

  describe('Instance Actions', () => {
    it('should log view instance action', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      createWrapper()
      wrapper.vm.viewInstance(mockInstances[0])
      expect(consoleLogSpy).toHaveBeenCalledWith('View instance:', mockInstances[0])
      consoleLogSpy.mockRestore()
    })

    it('should log edit instance action', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      createWrapper()
      wrapper.vm.editInstance(mockInstances[0])
      expect(consoleLogSpy).toHaveBeenCalledWith('Edit instance:', mockInstances[0])
      consoleLogSpy.mockRestore()
    })

    it('should open delete confirmation dialog', () => {
      createWrapper()
      wrapper.vm.confirmDelete(mockInstances[0])
      expect(wrapper.vm.showDeleteDialog).toBe(true)
      expect(wrapper.vm.deletingInstance).toStrictEqual(mockInstances[0])
    })
  })

  describe('Instance Deletion', () => {
    it('should delete instance', async () => {
      dataObjectsRef.value = mockDataObjects
      createWrapper()
      wrapper.vm.selectedDataObject = mockDataObjects[0]
      wrapper.vm.deletingInstance = mockInstances[0]
      await wrapper.vm.handleDelete()
      expect(mockDeleteInstance).toHaveBeenCalledWith('obj-1', 'inst-1')
    })

    it('should close dialog after deletion', async () => {
      dataObjectsRef.value = mockDataObjects
      createWrapper()
      wrapper.vm.selectedDataObject = mockDataObjects[0]
      wrapper.vm.deletingInstance = mockInstances[0]
      wrapper.vm.showDeleteDialog = true
      await wrapper.vm.handleDelete()
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.showDeleteDialog).toBe(false)
      expect(wrapper.vm.deletingInstance).toBe(null)
    })

    it('should not delete without deleting instance', async () => {
      createWrapper()
      wrapper.vm.selectedDataObject = mockDataObjects[0]
      wrapper.vm.deletingInstance = null
      await wrapper.vm.handleDelete()
      expect(mockDeleteInstance).not.toHaveBeenCalled()
    })

    it('should not delete without selected data object', async () => {
      createWrapper()
      wrapper.vm.selectedDataObject = null
      wrapper.vm.deletingInstance = mockInstances[0]
      await wrapper.vm.handleDelete()
      expect(mockDeleteInstance).not.toHaveBeenCalled()
    })

    it('should handle deletion errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockDeleteInstance.mockRejectedValue(new Error('API Error'))
      dataObjectsRef.value = mockDataObjects
      createWrapper()
      wrapper.vm.selectedDataObject = mockDataObjects[0]
      wrapper.vm.deletingInstance = mockInstances[0]
      await wrapper.vm.handleDelete()
      expect(consoleErrorSpy).toHaveBeenCalled()
      consoleErrorSpy.mockRestore()
    })
  })

  describe('Field Value Formatting', () => {
    it('should format null as dash', () => {
      createWrapper()
      expect(wrapper.vm.formatFieldValue(null, 'TEXT')).toBe('-')
      expect(wrapper.vm.formatFieldValue(undefined, 'TEXT')).toBe('-')
    })

    it('should format boolean values', () => {
      createWrapper()
      expect(wrapper.vm.formatFieldValue(true, 'BOOLEAN')).toBe('Yes')
      expect(wrapper.vm.formatFieldValue(false, 'BOOLEAN')).toBe('No')
    })

    it('should format date values', () => {
      createWrapper()
      const date = '2024-01-15T10:30:00Z'
      const formatted = wrapper.vm.formatFieldValue(date, 'DATE')
      expect(formatted).toContain('2024')
    })

    it('should format currency values', () => {
      createWrapper()
      const formatted = wrapper.vm.formatFieldValue(1234.56, 'CURRENCY')
      expect(formatted).toContain('$')
      expect(formatted).toContain('1,234.56')
    })

    it('should format text values', () => {
      createWrapper()
      expect(wrapper.vm.formatFieldValue('Hello', 'TEXT')).toBe('Hello')
      expect(wrapper.vm.formatFieldValue(123, 'NUMBER')).toBe('123')
    })
  })

  describe('Date Formatting', () => {
    it('should format dates correctly', () => {
      createWrapper()
      const formatted = wrapper.vm.formatDate('2024-01-15T10:30:00Z')
      expect(formatted).toContain('Jan')
      expect(formatted).toContain('15')
      expect(formatted).toContain('2024')
    })
  })

  describe('Computed Properties', () => {
    it('should compute sorted fields', () => {
      schemaRef.value = {
        fields: [
          { id: 'f1', fieldOrder: 2 },
          { id: 'f2', fieldOrder: 0 },
          { id: 'f3', fieldOrder: 1 },
        ],
      }
      createWrapper()
      const sorted = wrapper.vm.sortedFields
      expect(sorted[0].fieldOrder).toBe(0)
      expect(sorted[1].fieldOrder).toBe(1)
      expect(sorted[2].fieldOrder).toBe(2)
    })

    it('should return empty array when no schema fields', () => {
      schemaRef.value = null
      createWrapper()
      expect(wrapper.vm.sortedFields).toEqual([])
    })
  })
})
