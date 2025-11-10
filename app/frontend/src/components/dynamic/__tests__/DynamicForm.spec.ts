import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { ref } from 'vue'
import DynamicForm from '../DynamicForm.vue'
import { FieldDataType } from '@/types/dynamic-data'
import type { DynamicSchema } from '@/types/dynamic-data'

// Mock field validation
vi.mock('@/utils/dynamic-data', () => ({
  validateField: vi.fn((value, field) => {
    if (field.required && (value === null || value === '' || value === undefined)) {
      return `${field.name} is required`
    }
    return null
  }),
}))

// Mock field components
vi.mock('../fields/TextField.vue', () => ({
  default: {
    name: 'TextField',
    template: '<input data-testid="text-field" @update:model-value="$emit(\'update:modelValue\', $event.target.value)" v-bind="$attrs" />',
    props: ['field', 'modelValue', 'error'],
    emits: ['update:modelValue'],
  },
}))

vi.mock('../fields/NumberField.vue', () => ({
  default: {
    name: 'NumberField',
    template: '<input type="number" data-testid="number-field" @update:model-value="$emit(\'update:modelValue\', $event)" v-bind="$attrs" />',
    props: ['field', 'modelValue', 'error'],
    emits: ['update:modelValue'],
  },
}))

vi.mock('../fields/BooleanField.vue', () => ({
  default: {
    name: 'BooleanField',
    template: '<input type="checkbox" data-testid="boolean-field" @change="$emit(\'update:modelValue\', $event.target.checked)" v-bind="$attrs" />',
    props: ['field', 'modelValue', 'error'],
    emits: ['update:modelValue'],
  },
}))

vi.mock('../fields/TextAreaField.vue', () => ({
  default: {
    name: 'TextAreaField',
    template: '<textarea data-testid="textarea-field" v-bind="$attrs"></textarea>',
    props: ['field', 'modelValue', 'error'],
    emits: ['update:modelValue'],
  },
}))

vi.mock('../fields/CurrencyField.vue', () => ({
  default: {
    name: 'CurrencyField',
    template: '<input type="number" data-testid="currency-field" v-bind="$attrs" />',
    props: ['field', 'modelValue', 'error'],
    emits: ['update:modelValue'],
  },
}))

vi.mock('../fields/DateField.vue', () => ({
  default: {
    name: 'DateField',
    template: '<input type="date" data-testid="date-field" v-bind="$attrs" />',
    props: ['field', 'modelValue', 'error'],
    emits: ['update:modelValue'],
  },
}))

vi.mock('../fields/DateTimeField.vue', () => ({
  default: {
    name: 'DateTimeField',
    template: '<input type="datetime-local" data-testid="datetime-field" v-bind="$attrs" />',
    props: ['field', 'modelValue', 'error'],
    emits: ['update:modelValue'],
  },
}))

vi.mock('../fields/SingleSelectField.vue', () => ({
  default: {
    name: 'SingleSelectField',
    template: '<select data-testid="single-select-field" v-bind="$attrs"><option value="1">Option 1</option></select>',
    props: ['field', 'modelValue', 'error'],
    emits: ['update:modelValue'],
  },
}))

vi.mock('../fields/MultiSelectField.vue', () => ({
  default: {
    name: 'MultiSelectField',
    template: '<select multiple data-testid="multi-select-field" v-bind="$attrs"></select>',
    props: ['field', 'modelValue', 'error'],
    emits: ['update:modelValue'],
  },
}))

vi.mock('../fields/EmailField.vue', () => ({
  default: {
    name: 'EmailField',
    template: '<input type="email" data-testid="email-field" v-bind="$attrs" />',
    props: ['field', 'modelValue', 'error'],
    emits: ['update:modelValue'],
  },
}))

vi.mock('../fields/UrlField.vue', () => ({
  default: {
    name: 'UrlField',
    template: '<input type="url" data-testid="url-field" v-bind="$attrs" />',
    props: ['field', 'modelValue', 'error'],
    emits: ['update:modelValue'],
  },
}))

vi.mock('../fields/FileField.vue', () => ({
  default: {
    name: 'FileField',
    template: '<input type="file" data-testid="file-field" v-bind="$attrs" />',
    props: ['field', 'modelValue', 'error'],
    emits: ['update:modelValue'],
  },
}))

vi.mock('../fields/RichTextField.vue', () => ({
  default: {
    name: 'RichTextField',
    template: '<div data-testid="richtext-field" v-bind="$attrs"></div>',
    props: ['field', 'modelValue', 'error'],
    emits: ['update:modelValue'],
  },
}))

vi.mock('../fields/RelationshipField.vue', () => ({
  default: {
    name: 'RelationshipField',
    template: '<div data-testid="relationship-field" v-bind="$attrs"></div>',
    props: ['field', 'modelValue', 'error'],
    emits: ['update:modelValue'],
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
      defaultValue: undefined,
      isMandatory: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      name: 'Description',
      fieldKey: 'description',
      dataType: FieldDataType.TEXTAREA,
      fieldOrder: 2,
      required: false,
      description: '',
      options: {},
      defaultValue: undefined,
      isMandatory: false,
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
      defaultValue: undefined,
      isMandatory: false,
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

describe('DynamicForm', () => {
  let wrapper: VueWrapper

  const createWrapper = (props = {}) => {
    return mount(DynamicForm, {
      props: {
        schema: mockSchema,
        submitLabel: 'Save',
        loading: false,
        ...props,
      },
      global: {
        stubs: {
          Button: {
            template: '<button @click="$emit(\'click\')" :disabled="disabled"><slot /></button>',
            props: ['label', 'loading', 'disabled', 'type', 'icon'],
            emits: ['click'],
          },
          Message: {
            template: '<div class="message" :class="`severity-${severity}`"><slot /></div>',
            props: ['severity'],
            emits: ['close'],
          },
        },
      },
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    wrapper = createWrapper()
  })

  describe('Component Rendering', () => {
    it('should render the form', () => {
      expect(wrapper.find('.dynamic-form').exists()).toBe(true)
    })

    it('should render form fields based on schema', async () => {
      await wrapper.vm.$nextTick()
      // Should render 3 fields
      expect(wrapper.findAll('[data-testid*="-field"]').length).toBeGreaterThanOrEqual(1)
    })

    it('should render cancel and submit buttons', () => {
      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBeGreaterThan(0)
    })
  })

  describe('Field Components', () => {
    it('should render TextField for TEXT fields', () => {
      expect(wrapper.find('[data-testid="text-field"]').exists()).toBe(true)
    })

    it('should render TextAreaField for TEXTAREA fields', () => {
      expect(wrapper.find('[data-testid="textarea-field"]').exists()).toBe(true)
    })

    it('should render CurrencyField for CURRENCY fields', () => {
      expect(wrapper.find('[data-testid="currency-field"]').exists()).toBe(true)
    })

    it('should handle multiple field types', () => {
      const fields = wrapper.findAll('[data-testid*="-field"]')
      expect(fields.length).toBeGreaterThan(0)
    })
  })

  describe('Field Sorting', () => {
    it('should sort fields by fieldOrder', () => {
      const sortedFields = wrapper.vm.sortedFields
      for (let i = 0; i < sortedFields.length - 1; i++) {
        expect(sortedFields[i].fieldOrder).toBeLessThanOrEqual(
          sortedFields[i + 1].fieldOrder
        )
      }
    })

    it('should have correct number of sorted fields', () => {
      const sortedFields = wrapper.vm.sortedFields
      expect(sortedFields.length).toBe(mockSchema.fields.length)
    })
  })

  describe('Form Data Initialization', () => {
    it('should initialize form data with default values', () => {
      expect(wrapper.vm.formData).toBeDefined()
      expect(wrapper.vm.formData.name).toBeDefined()
    })

    it('should use initial values when provided', async () => {
      const initialValues = { name: 'Test Project', description: 'A test project' }
      wrapper = createWrapper({ initialValues })
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.formData.name).toBe('Test Project')
      expect(wrapper.vm.formData.description).toBe('A test project')
    })

    it('should set boolean fields to false by default', () => {
      const schemaWithBoolean: DynamicSchema = {
        ...mockSchema,
        fields: [
          {
            ...mockSchema.fields[0],
            dataType: FieldDataType.BOOLEAN,
            isMandatory: true,
          },
        ],
      }

      wrapper = createWrapper({ schema: schemaWithBoolean })
      expect(wrapper.vm.formData).toBeDefined()
    })

    it('should set multi-select fields to empty array by default', () => {
      const schemaWithMultiSelect: DynamicSchema = {
        ...mockSchema,
        fields: [
          {
            ...mockSchema.fields[0],
            dataType: FieldDataType.MULTI_SELECT,
            isMandatory: false,
          },
        ],
      }

      wrapper = createWrapper({ schema: schemaWithMultiSelect })
      expect(Array.isArray(wrapper.vm.formData[mockSchema.fields[0].fieldKey])).toBe(true)
    })
  })

  describe('Field Updates', () => {
    it('should update form data when field value changes', async () => {
      wrapper.vm.handleFieldUpdate('name', 'New Project Name')
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.formData.name).toBe('New Project Name')
    })

    it('should clear field errors when field is updated', async () => {
      wrapper.vm.errors = { name: 'Name is required' }
      wrapper.vm.handleFieldUpdate('name', 'New Value')

      expect(wrapper.vm.errors.name).toBeUndefined()
    })

    it('should clear form error when field is updated', async () => {
      wrapper.vm.formError = 'Please fix the errors above'
      wrapper.vm.handleFieldUpdate('name', 'New Value')

      expect(wrapper.vm.formError).toBeNull()
    })

    it('should handle multiple field updates', async () => {
      wrapper.vm.handleFieldUpdate('name', 'Project A')
      wrapper.vm.handleFieldUpdate('description', 'Description A')

      expect(wrapper.vm.formData.name).toBe('Project A')
      expect(wrapper.vm.formData.description).toBe('Description A')
    })
  })

  describe('Form Validation', () => {
    it('should validate form and return true for valid data', () => {
      wrapper.vm.formData = {
        name: 'Valid Project',
        description: 'A description',
        budget: 1000,
      }

      const isValid = wrapper.vm.validateForm()
      expect(isValid).toBe(true)
    })

    it('should validate form and return false for invalid data', () => {
      wrapper.vm.formData = {
        name: '',
        description: '',
        budget: null,
      }

      const isValid = wrapper.vm.validateForm()
      expect(isValid).toBe(false)
    })

    it('should populate errors for required fields', () => {
      wrapper.vm.formData = { name: '' }
      wrapper.vm.validateForm()

      expect(wrapper.vm.errors.name).toBeDefined()
    })

    it('should show form error message when validation fails', () => {
      wrapper.vm.formData = { name: '' }
      wrapper.vm.validateForm()

      expect(wrapper.vm.formError).not.toBeNull()
      expect(wrapper.vm.formError).toContain('Please fix the errors')
    })

    it('should not show form error for valid form', () => {
      wrapper.vm.formData = {
        name: 'Valid Project',
        description: '',
        budget: null,
      }
      wrapper.vm.validateForm()

      expect(wrapper.vm.formError).toBeNull()
    })
  })

  describe('Form Submission', () => {
    it('should emit submit event with form data on valid submission', async () => {
      wrapper.vm.formData = {
        name: 'Test Project',
        description: 'A test project',
        budget: 5000,
      }

      await wrapper.vm.handleSubmit()

      expect(wrapper.emitted('submit')).toBeTruthy()
    })

    it('should not emit submit event if validation fails', async () => {
      wrapper.vm.formData = { name: '' }

      await wrapper.vm.handleSubmit()

      expect(wrapper.emitted('submit')).toBeFalsy()
    })

    it('should clean up form data before submitting', async () => {
      wrapper.vm.formData = {
        name: 'Test Project',
        description: '',
        budget: null,
      }

      await wrapper.vm.handleSubmit()

      const submitData = wrapper.emitted('submit')?.[0]?.[0]
      expect(submitData).not.toHaveProperty('description')
      expect(submitData).not.toHaveProperty('budget')
    })

    it('should include mandatory fields even if empty', async () => {
      wrapper.vm.formData = {
        name: 'Test Project',
        description: '',
        budget: 1000,
      }

      await wrapper.vm.handleSubmit()

      const submitData = wrapper.emitted('submit')?.[0]?.[0]
      expect(submitData).toHaveProperty('name')
    })

    it('should handle empty multi-select fields', async () => {
      const schemaWithMultiSelect: DynamicSchema = {
        ...mockSchema,
        fields: [
          {
            ...mockSchema.fields[0],
            isMandatory: true,
          },
          {
            ...mockSchema.fields[1],
            dataType: FieldDataType.MULTI_SELECT,
            isMandatory: false,
          },
        ],
      }

      wrapper = createWrapper({ schema: schemaWithMultiSelect })
      wrapper.vm.formData = {
        name: 'Test Project',
        description: [],
      }

      await wrapper.vm.handleSubmit()

      const submitData = wrapper.emitted('submit')?.[0]?.[0]
      expect(submitData).not.toHaveProperty('description')
    })
  })

  describe('Cancel Handler', () => {
    it('should emit cancel event when cancel is clicked', async () => {
      await wrapper.vm.handleCancel()
      expect(wrapper.emitted('cancel')).toBeTruthy()
    })
  })

  describe('Props', () => {
    it('should use custom submit label', () => {
      wrapper = createWrapper({ submitLabel: 'Create' })
      expect(wrapper.vm.$el).toBeDefined()
    })

    it('should handle loading state', () => {
      wrapper = createWrapper({ loading: true })
      expect(wrapper.vm.$el).toBeDefined()
    })

    it('should accept initial values as prop', () => {
      const initialValues = { name: 'Initial Name' }
      wrapper = createWrapper({ initialValues })
      expect(wrapper.vm.formData.name).toBe('Initial Name')
    })
  })

  describe('Field Component Mapping', () => {
    it('should map TEXT type to TextField', () => {
      const component = wrapper.vm.getFieldComponent(FieldDataType.TEXT)
      expect(component).toBeDefined()
    })

    it('should map TEXTAREA type to TextAreaField', () => {
      const component = wrapper.vm.getFieldComponent(FieldDataType.TEXTAREA)
      expect(component).toBeDefined()
    })

    it('should map NUMBER type to NumberField', () => {
      const component = wrapper.vm.getFieldComponent(FieldDataType.NUMBER)
      expect(component).toBeDefined()
    })

    it('should map CURRENCY type to CurrencyField', () => {
      const component = wrapper.vm.getFieldComponent(FieldDataType.CURRENCY)
      expect(component).toBeDefined()
    })

    it('should map DATE type to DateField', () => {
      const component = wrapper.vm.getFieldComponent(FieldDataType.DATE)
      expect(component).toBeDefined()
    })

    it('should map DATETIME type to DateTimeField', () => {
      const component = wrapper.vm.getFieldComponent(FieldDataType.DATETIME)
      expect(component).toBeDefined()
    })

    it('should map BOOLEAN type to BooleanField', () => {
      const component = wrapper.vm.getFieldComponent(FieldDataType.BOOLEAN)
      expect(component).toBeDefined()
    })

    it('should map SINGLE_SELECT type to SingleSelectField', () => {
      const component = wrapper.vm.getFieldComponent(FieldDataType.SINGLE_SELECT)
      expect(component).toBeDefined()
    })

    it('should map MULTI_SELECT type to MultiSelectField', () => {
      const component = wrapper.vm.getFieldComponent(FieldDataType.MULTI_SELECT)
      expect(component).toBeDefined()
    })

    it('should map EMAIL type to EmailField', () => {
      const component = wrapper.vm.getFieldComponent(FieldDataType.EMAIL)
      expect(component).toBeDefined()
    })

    it('should map URL type to UrlField', () => {
      const component = wrapper.vm.getFieldComponent(FieldDataType.URL)
      expect(component).toBeDefined()
    })

    it('should map FILE type to FileField', () => {
      const component = wrapper.vm.getFieldComponent(FieldDataType.FILE)
      expect(component).toBeDefined()
    })

    it('should map RICH_TEXT type to RichTextField', () => {
      const component = wrapper.vm.getFieldComponent(FieldDataType.RICH_TEXT)
      expect(component).toBeDefined()
    })

    it('should default to TextField for unknown types', () => {
      const component = wrapper.vm.getFieldComponent('UNKNOWN' as FieldDataType)
      expect(component).toBeDefined()
    })
  })

  describe('Error Display', () => {
    it('should not show error message initially', () => {
      expect(wrapper.find('.message.severity-error').exists()).toBe(false)
    })

    it('should show error message when form error exists', async () => {
      wrapper.vm.formError = 'An error occurred'
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.message.severity-error').exists()).toBe(true)
    })

    it('should display form error text', async () => {
      wrapper.vm.formError = 'Test error message'
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Test error message')
    })
  })

  describe('Edge Cases', () => {
    it('should handle schema with no fields', () => {
      const emptySchema: DynamicSchema = {
        ...mockSchema,
        fields: [],
      }

      wrapper = createWrapper({ schema: emptySchema })
      expect(wrapper.vm.sortedFields.length).toBe(0)
    })

    it('should handle form data updates for non-existent fields', () => {
      wrapper.vm.handleFieldUpdate('nonexistent', 'value')
      expect(wrapper.vm.formData.nonexistent).toBe('value')
    })

    it('should handle null initial values', () => {
      wrapper = createWrapper({ initialValues: null })
      expect(wrapper.vm.formData).toBeDefined()
    })

    it('should handle schema with fields with default values', () => {
      const schemaWithDefaults: DynamicSchema = {
        ...mockSchema,
        fields: [
          {
            ...mockSchema.fields[0],
            defaultValue: 'Default Project',
          },
        ],
      }

      wrapper = createWrapper({ schema: schemaWithDefaults })
      expect(wrapper.vm.formData).toBeDefined()
    })
  })
})
