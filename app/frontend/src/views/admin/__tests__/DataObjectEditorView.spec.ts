import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { ref } from 'vue'
import DataObjectEditorView from '../DataObjectEditorView.vue'
import { FieldDataType, ValidationRuleType } from '@/types/dynamic-data'

// Mock router
const mockPush = vi.fn()
const mockRoute = {
  params: {
    id: 'test-id',
  },
}

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useRoute: () => mockRoute,
}))

// Mock composable
const mockFetchDataObjects = vi.fn()
const mockFetchDataObject = vi.fn()
const mockUpdateDataObject = vi.fn()
const mockAddField = vi.fn()
const mockUpdateField = vi.fn()
const mockDeleteField = vi.fn()

const dataObjectsRef = ref<any[]>([])
const currentDataObjectRef = ref<any>(null)
const loadingRef = ref(false)
const errorRef = ref<string | null>(null)

vi.mock('@/composables/admin/useDataObjects', () => ({
  useDataObjects: () => ({
    dataObjects: dataObjectsRef,
    currentDataObject: currentDataObjectRef,
    loading: loadingRef,
    error: errorRef,
    fetchDataObjects: mockFetchDataObjects,
    fetchDataObject: mockFetchDataObject,
    updateDataObject: mockUpdateDataObject,
    addField: mockAddField,
    updateField: mockUpdateField,
    deleteField: mockDeleteField,
  }),
}))

// Mock PrimeVue components  - simple stubs
vi.mock('primevue/breadcrumb', () => ({ default: { name: 'Breadcrumb', template: '<div class="breadcrumb"></div>' } }))
vi.mock('primevue/button', () => ({ default: { name: 'Button', template: '<button></button>', props: ['label', 'icon', 'class', 'loading', 'severity'] } }))
vi.mock('primevue/card', () => ({ default: { name: 'Card', template: '<div class="card"></div>' } }))
vi.mock('primevue/dialog', () => ({ default: { name: 'Dialog', template: '<div class="dialog"></div>', props: ['visible', 'header', 'modal', 'style'] } }))
vi.mock('primevue/inputtext', () => ({ default: { name: 'InputText', template: '<input />', props: ['modelValue', 'class', 'disabled', 'placeholder'] } }))
vi.mock('primevue/inputnumber', () => ({ default: { name: 'InputNumber', template: '<input type="number" />', props: ['modelValue', 'min', 'class'] } }))
vi.mock('primevue/textarea', () => ({ default: { name: 'Textarea', template: '<textarea></textarea>', props: ['modelValue', 'rows', 'class', 'placeholder'] } }))
vi.mock('primevue/select', () => ({ default: { name: 'Select', template: '<select></select>', props: ['modelValue', 'options', 'optionLabel', 'optionValue', 'class', 'placeholder', 'filter', 'showClear'] } }))
vi.mock('primevue/checkbox', () => ({ default: { name: 'Checkbox', template: '<input type="checkbox" />', props: ['modelValue', 'binary', 'id'] } }))
vi.mock('primevue/tag', () => ({ default: { name: 'Tag', template: '<span class="tag"></span>', props: ['value', 'severity', 'class'] } }))
vi.mock('primevue/message', () => ({ default: { name: 'Message', template: '<div class="message"></div>', props: ['severity'] } }))
vi.mock('primevue/progressspinner', () => ({ default: { name: 'ProgressSpinner', template: '<div class="progress-spinner"></div>' } }))
vi.mock('@/components/admin/AdminNavigation.vue', () => ({ default: { name: 'AdminNavigation', template: '<div class="admin-navigation"></div>' } }))

describe('DataObjectEditorView', () => {
  let wrapper: VueWrapper<any>

  const mockDataObject = {
    id: 'test-id',
    name: 'Test Data Object',
    dataKey: 'testDataObject',
    description: 'Test description',
    fields: [
      {
        id: 'field-1',
        name: 'Field One',
        fieldKey: 'fieldOne',
        dataType: FieldDataType.TEXT,
        fieldOrder: 0,
        description: 'First field',
        isMandatory: true,
        isReadOnly: false,
        defaultValue: '',
        relatedDataObjectId: null,
        validationRules: [],
        dropdownOptions: [],
      },
      {
        id: 'field-2',
        name: 'Field Two',
        fieldKey: 'fieldTwo',
        dataType: FieldDataType.NUMBER,
        fieldOrder: 1,
        description: '',
        isMandatory: false,
        isReadOnly: true,
        defaultValue: '0',
        relatedDataObjectId: null,
        validationRules: [{ ruleType: ValidationRuleType.MIN_VALUE, ruleValue: '0', errorMessage: 'Must be positive' }],
        dropdownOptions: [],
      },
    ],
  }

  const mockOtherDataObject = {
    id: 'other-id',
    name: 'Other Data Object',
    dataKey: 'otherDataObject',
    description: 'Other description',
    fields: [],
  }

  const createWrapper = () => {
    wrapper = mount(DataObjectEditorView, {
      global: {
        stubs: {},
        directives: { tooltip: {} },
      },
    })
    return wrapper
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockRoute.params.id = 'test-id'
    dataObjectsRef.value = []
    currentDataObjectRef.value = null
    loadingRef.value = false
    errorRef.value = null
    mockFetchDataObjects.mockResolvedValue(undefined)
    mockFetchDataObject.mockResolvedValue(undefined)
    mockUpdateDataObject.mockResolvedValue(undefined)
    mockAddField.mockResolvedValue(undefined)
    mockUpdateField.mockResolvedValue(undefined)
    mockDeleteField.mockResolvedValue(undefined)
  })

  describe('Component Rendering', () => {
    it('should render the admin dashboard', () => {
      createWrapper()
      expect(wrapper.find('.admin-dashboard').exists()).toBe(true)
    })

    it('should render breadcrumb', () => {
      createWrapper()
      expect(wrapper.find('.breadcrumb').exists()).toBe(true)
    })

    it('should render admin navigation', () => {
      createWrapper()
      expect(wrapper.find('.admin-navigation').exists()).toBe(true)
    })

    it('should display loading spinner when loading and no data', async () => {
      loadingRef.value = true
      currentDataObjectRef.value = null
      createWrapper()
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.progress-spinner').exists()).toBe(true)
    })

    it('should not display loading spinner when data is loaded', async () => {
      loadingRef.value = false
      currentDataObjectRef.value = mockDataObject
      createWrapper()
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.progress-spinner').exists()).toBe(false)
    })
  })

  describe('Component Lifecycle', () => {
    it('should fetch data object on mount', async () => {
      createWrapper()
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(mockFetchDataObject).toHaveBeenCalledWith('test-id')
    })

    it('should fetch all data objects on mount', async () => {
      createWrapper()
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(mockFetchDataObjects).toHaveBeenCalled()
    })
  })

  describe('Navigation', () => {
    it('should navigate back to list via goBack method', () => {
      createWrapper()
      wrapper.vm.goBack()
      expect(mockPush).toHaveBeenCalledWith('/admin/data-objects')
    })

    it('should have correct breadcrumb items', () => {
      currentDataObjectRef.value = mockDataObject
      createWrapper()
      const breadcrumbItems = wrapper.vm.breadcrumbItems
      expect(breadcrumbItems).toHaveLength(4)
      expect(breadcrumbItems[0].label).toBe('Dashboard')
      expect(breadcrumbItems[3].label).toBe('Test Data Object')
    })
  })

  describe('Fields Management', () => {
    it('should compute sortedFields correctly', async () => {
      currentDataObjectRef.value = mockDataObject
      createWrapper()
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.sortedFields).toHaveLength(2)
      expect(wrapper.vm.sortedFields[0].fieldOrder).toBe(0)
      expect(wrapper.vm.sortedFields[1].fieldOrder).toBe(1)
    })

    it('should return empty array when no fields', () => {
      currentDataObjectRef.value = { ...mockDataObject, fields: [] }
      createWrapper()
      expect(wrapper.vm.sortedFields).toEqual([])
    })

    it('should return empty array when no currentDataObject', () => {
      currentDataObjectRef.value = null
      createWrapper()
      expect(wrapper.vm.sortedFields).toEqual([])
    })
  })

  describe('Add Field Functionality', () => {
    it('should open add field dialog', async () => {
      currentDataObjectRef.value = mockDataObject
      createWrapper()
      expect(wrapper.vm.showFieldDialog).toBe(false)
      wrapper.vm.openFieldDialog()
      expect(wrapper.vm.showFieldDialog).toBe(true)
    })

    it('should set next field order when opening add dialog', async () => {
      currentDataObjectRef.value = mockDataObject
      createWrapper()
      wrapper.vm.openFieldDialog()
      expect(wrapper.vm.fieldForm.fieldOrder).toBe(2)
    })

    it('should validate field name is required', async () => {
      currentDataObjectRef.value = mockDataObject
      createWrapper()
      wrapper.vm.fieldForm.name = ''
      const isValid = wrapper.vm.validateFieldForm()
      expect(isValid).toBe(false)
      expect(wrapper.vm.fieldErrors.name).toBe('Field name is required')
    })

    it('should validate field type is required', async () => {
      currentDataObjectRef.value = mockDataObject
      createWrapper()
      wrapper.vm.fieldForm.name = 'Test Field'
      wrapper.vm.fieldForm.dataType = null as any
      const isValid = wrapper.vm.validateFieldForm()
      expect(isValid).toBe(false)
      expect(wrapper.vm.fieldErrors.dataType).toBe('Field type is required')
    })

    it('should validate relationship field requires related data object', async () => {
      currentDataObjectRef.value = mockDataObject
      createWrapper()
      wrapper.vm.fieldForm.name = 'Test Field'
      wrapper.vm.fieldForm.dataType = FieldDataType.RELATIONSHIP
      wrapper.vm.fieldForm.relatedDataObjectId = undefined
      const isValid = wrapper.vm.validateFieldForm()
      expect(isValid).toBe(false)
      expect(wrapper.vm.fieldErrors.relatedDataObjectId).toBe('Related data object is required for relationship fields')
    })

    it('should call addField on save new field', async () => {
      currentDataObjectRef.value = mockDataObject
      createWrapper()
      wrapper.vm.showFieldDialog = true
      wrapper.vm.fieldForm.name = 'New Field'
      wrapper.vm.fieldForm.dataType = FieldDataType.TEXT
      await wrapper.vm.saveField()
      await wrapper.vm.$nextTick()
      expect(mockAddField).toHaveBeenCalled()
      expect(wrapper.vm.showFieldDialog).toBe(false)
    })
  })

  describe('Edit Field Functionality', () => {
    it('should open edit field dialog with field data', async () => {
      currentDataObjectRef.value = mockDataObject
      createWrapper()
      await wrapper.vm.$nextTick()
      wrapper.vm.openFieldDialog(mockDataObject.fields[0])
      expect(wrapper.vm.showFieldDialog).toBe(true)
      expect(wrapper.vm.editingField).toEqual(mockDataObject.fields[0])
      expect(wrapper.vm.fieldForm.name).toBe('Field One')
      expect(wrapper.vm.fieldForm.fieldKey).toBe('fieldOne')
    })

    it('should call updateField on save existing field', async () => {
      currentDataObjectRef.value = mockDataObject
      createWrapper()
      wrapper.vm.editingField = mockDataObject.fields[0]
      wrapper.vm.showFieldDialog = true
      wrapper.vm.fieldForm = {
        name: 'Updated Field',
        fieldKey: 'fieldOne',
        dataType: FieldDataType.TEXT,
        fieldOrder: 0,
        description: '',
        isMandatory: false,
        isReadOnly: false,
        defaultValue: '',
        relatedDataObjectId: undefined,
        validationRules: [],
        dropdownOptions: [],
      }
      await wrapper.vm.saveField()
      await wrapper.vm.$nextTick()
      expect(mockUpdateField).toHaveBeenCalled()
      expect(wrapper.vm.showFieldDialog).toBe(false)
    })

    it('should reset field form on resetFieldForm', async () => {
      currentDataObjectRef.value = mockDataObject
      createWrapper()
      wrapper.vm.fieldForm.name = 'Test'
      wrapper.vm.editingField = mockDataObject.fields[0]
      wrapper.vm.resetFieldForm()
      expect(wrapper.vm.fieldForm.name).toBe('')
      expect(wrapper.vm.editingField).toBe(null)
      expect(wrapper.vm.fieldErrors).toEqual({})
    })
  })

  describe('Delete Field Functionality', () => {
    it('should open delete confirmation dialog', async () => {
      currentDataObjectRef.value = mockDataObject
      createWrapper()
      expect(wrapper.vm.showDeleteFieldDialog).toBe(false)
      wrapper.vm.confirmDeleteField(mockDataObject.fields[0])
      expect(wrapper.vm.showDeleteFieldDialog).toBe(true)
      expect(wrapper.vm.deletingField).toEqual(mockDataObject.fields[0])
    })

    it('should call deleteField on confirm', async () => {
      currentDataObjectRef.value = mockDataObject
      createWrapper()
      wrapper.vm.deletingField = mockDataObject.fields[0]
      wrapper.vm.showDeleteFieldDialog = true
      await wrapper.vm.handleDeleteField()
      await wrapper.vm.$nextTick()
      expect(mockDeleteField).toHaveBeenCalledWith('test-id', 'field-1')
      expect(wrapper.vm.showDeleteFieldDialog).toBe(false)
      expect(wrapper.vm.deletingField).toBe(null)
    })
  })

  describe('Edit Data Object Dialog', () => {
    it('should open edit dialog with current data', async () => {
      currentDataObjectRef.value = mockDataObject
      createWrapper()
      wrapper.vm.openEditDialog()
      expect(wrapper.vm.showEditDialog).toBe(true)
      expect(wrapper.vm.editForm.name).toBe('Test Data Object')
      expect(wrapper.vm.editForm.description).toBe('Test description')
    })

    it('should call updateDataObject on save', async () => {
      currentDataObjectRef.value = mockDataObject
      createWrapper()
      wrapper.vm.showEditDialog = true
      wrapper.vm.editForm.name = 'Updated Name'
      wrapper.vm.editForm.description = 'Updated Description'
      await wrapper.vm.saveDataObject()
      await wrapper.vm.$nextTick()
      expect(mockUpdateDataObject).toHaveBeenCalledWith('test-id', wrapper.vm.editForm)
      expect(wrapper.vm.showEditDialog).toBe(false)
    })
  })

  describe('Dropdown Options Management', () => {
    it('should add dropdown option', () => {
      createWrapper()
      wrapper.vm.fieldForm.dropdownOptions = []
      wrapper.vm.addOption()
      expect(wrapper.vm.fieldForm.dropdownOptions).toHaveLength(1)
      expect(wrapper.vm.fieldForm.dropdownOptions[0]).toEqual({ label: '', value: '', orderIndex: 0 })
    })

    it('should remove dropdown option', () => {
      createWrapper()
      wrapper.vm.fieldForm.dropdownOptions = [
        { label: 'Option 1', value: 'opt1', orderIndex: 0 },
        { label: 'Option 2', value: 'opt2', orderIndex: 1 },
      ]
      wrapper.vm.removeOption(0)
      expect(wrapper.vm.fieldForm.dropdownOptions).toHaveLength(1)
      expect(wrapper.vm.fieldForm.dropdownOptions[0].label).toBe('Option 2')
    })

    it('should compute isSelectType correctly', () => {
      createWrapper()
      wrapper.vm.fieldForm.dataType = FieldDataType.SINGLE_SELECT
      expect(wrapper.vm.isSelectType).toBe(true)
      wrapper.vm.fieldForm.dataType = FieldDataType.MULTI_SELECT
      expect(wrapper.vm.isSelectType).toBe(true)
      wrapper.vm.fieldForm.dataType = FieldDataType.TEXT
      expect(wrapper.vm.isSelectType).toBe(false)
    })
  })

  describe('Validation Rules Management', () => {
    it('should add validation rule', () => {
      createWrapper()
      wrapper.vm.fieldForm.validationRules = []
      wrapper.vm.addRule()
      expect(wrapper.vm.fieldForm.validationRules).toHaveLength(1)
      expect(wrapper.vm.fieldForm.validationRules[0]).toEqual({
        ruleType: ValidationRuleType.MIN_LENGTH,
        ruleValue: '',
        errorMessage: '',
      })
    })

    it('should remove validation rule', () => {
      createWrapper()
      wrapper.vm.fieldForm.validationRules = [
        { ruleType: ValidationRuleType.MIN_LENGTH, ruleValue: '5', errorMessage: 'Too short' },
        { ruleType: ValidationRuleType.MAX_LENGTH, ruleValue: '50', errorMessage: 'Too long' },
      ]
      wrapper.vm.removeRule(0)
      expect(wrapper.vm.fieldForm.validationRules).toHaveLength(1)
      expect(wrapper.vm.fieldForm.validationRules[0].ruleType).toBe(ValidationRuleType.MAX_LENGTH)
    })
  })

  describe('Relationship Fields', () => {
    it('should compute isRelationshipType correctly', () => {
      createWrapper()
      wrapper.vm.fieldForm.dataType = FieldDataType.RELATIONSHIP
      expect(wrapper.vm.isRelationshipType).toBe(true)
    })

    it('should filter out current data object from available relationships', () => {
      currentDataObjectRef.value = mockDataObject
      dataObjectsRef.value = [mockDataObject, mockOtherDataObject]
      createWrapper()
      const available = wrapper.vm.availableDataObjects
      expect(available).toHaveLength(1)
      expect(available[0].id).toBe('other-id')
    })

    it('should get related data object name', () => {
      dataObjectsRef.value = [mockDataObject, mockOtherDataObject]
      createWrapper()
      const name = wrapper.vm.getRelatedDataObjectName('other-id')
      expect(name).toBe('Other Data Object')
    })

    it('should return Unknown for non-existent related object', () => {
      dataObjectsRef.value = [mockDataObject]
      createWrapper()
      const name = wrapper.vm.getRelatedDataObjectName('non-existent-id')
      expect(name).toBe('Unknown')
    })
  })

  describe('Helper Functions', () => {
    it('should format field type correctly', () => {
      createWrapper()
      expect(wrapper.vm.formatFieldType(FieldDataType.TEXT)).toBe('Text')
      expect(wrapper.vm.formatFieldType(FieldDataType.NUMBER)).toBe('Number')
      expect(wrapper.vm.formatFieldType(FieldDataType.DATE)).toBe('Date')
      expect(wrapper.vm.formatFieldType('UNKNOWN_TYPE')).toBe('UNKNOWN_TYPE')
    })

    it('should get correct field type icon', () => {
      createWrapper()
      expect(wrapper.vm.getFieldTypeIcon(FieldDataType.TEXT)).toBe('pi pi-align-left')
      expect(wrapper.vm.getFieldTypeIcon(FieldDataType.NUMBER)).toBe('pi pi-hashtag')
      expect(wrapper.vm.getFieldTypeIcon(FieldDataType.EMAIL)).toBe('pi pi-envelope')
      expect(wrapper.vm.getFieldTypeIcon('UNKNOWN')).toBe('pi pi-question')
    })
  })
})
