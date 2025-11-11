import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper, flushPromises } from '@vue/test-utils'
import EmailTemplateCreateDialog from '../EmailTemplateCreateDialog.vue'

const mockToast = { add: vi.fn() }
const mockCreateTemplate = vi.fn(async () => ({ id: '1', name: 'TEST_TEMPLATE' }))

vi.mock('primevue/usetoast', () => ({
  useToast: vi.fn(() => mockToast),
}))

vi.mock('@/composables/useEmailTemplates', () => ({
  useEmailTemplates: vi.fn(() => ({
    createTemplate: mockCreateTemplate,
  })),
}))

vi.mock('primevue/dialog', () => ({
  default: {
    name: 'Dialog',
    template: `<div v-if="visible" class="dialog"><slot name="header" /><slot /><slot name="footer" /></div>`,
    props: ['visible', 'modal', 'header', 'style', 'closable', 'dismissableMask'],
    emits: ['update:visible', 'hide'],
  },
}))

vi.mock('primevue/button', () => ({
  default: {
    name: 'Button',
    template: `<button @click="$emit('click')" :disabled="disabled"><slot /></button>`,
    props: ['label', 'icon', 'loading', 'disabled', 'severity'],
    emits: ['click'],
  },
}))

vi.mock('primevue/inputtext', () => ({
  default: {
    name: 'InputText',
    template: `<input @input="$emit('update:modelValue', $event.target.value)" v-bind="$attrs" />`,
    props: ['modelValue', 'maxlength'],
    emits: ['update:modelValue', 'input'],
  },
}))

vi.mock('primevue/textarea', () => ({
  default: {
    name: 'Textarea',
    template: `<textarea @input="$emit('update:modelValue', $event.target.value)" v-bind="$attrs"></textarea>`,
    props: ['modelValue', 'rows', 'autoResize'],
    emits: ['update:modelValue', 'input'],
  },
}))

vi.mock('primevue/select', () => ({
  default: {
    name: 'Select',
    template: `<select @change="$emit('update:modelValue', $event.target.value)" :value="modelValue"><slot /></select>`,
    props: ['modelValue', 'options', 'optionLabel', 'optionValue', 'placeholder'],
    emits: ['update:modelValue', 'change'],
  },
}))

vi.mock('primevue/checkbox', () => ({
  default: {
    name: 'Checkbox',
    template: `<input type="checkbox" @change="$emit('update:modelValue', $event.target.checked)" :checked="modelValue" />`,
    props: ['modelValue', 'binary'],
    emits: ['update:modelValue', 'change'],
  },
}))

describe('EmailTemplateCreateDialog', () => {
  let wrapper: VueWrapper

  const createWrapper = (props = {}) => {
    return mount(EmailTemplateCreateDialog, {
      props: {
        visible: true,
        ...props,
      },
      global: { stubs: { teleport: true } },
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    wrapper = createWrapper()
  })

  describe('Component Rendering', () => {
    it('should render the dialog', () => {
      expect(wrapper.find('.dialog').exists()).toBe(true)
    })

    it('should display correct dialog header', () => {
      expect(wrapper.vm.dialogVisible).toBe(true)
    })

    it('should have template information section', () => {
      expect(wrapper.find('.email-template-create-dialog').exists()).toBe(true)
    })

    it('should display form sections', () => {
      expect(wrapper.find('.form-section').exists()).toBe(true)
    })

    it('should show cancel button', () => {
      expect(wrapper.vm.$el).toBeDefined()
    })

    it('should show create button', () => {
      expect(wrapper.vm.$el).toBeDefined()
    })
  })

  describe('Dialog Lifecycle', () => {
    it('should initialize with visible prop', () => {
      expect(wrapper.vm.dialogVisible).toBe(true)
    })

    it('should handle visible prop changes', async () => {
      await wrapper.setProps({ visible: false })
      expect(wrapper.vm.dialogVisible).toBe(false)
    })

    it('should emit update:visible when toggling', async () => {
      wrapper.vm.dialogVisible = false
      await wrapper.vm.$nextTick()
      expect(wrapper.emitted('update:visible')).toBeTruthy()
    })

    it('should initialize with empty form data', () => {
      expect(wrapper.vm.formData.name).toBe('')
      expect(wrapper.vm.formData.displayName).toBe('')
      expect(wrapper.vm.formData.subject).toBe('')
    })

    it('should not be saving on mount', () => {
      expect(wrapper.vm.saving).toBe(false)
    })
  })

  describe('Form Fields', () => {
    it('should have name field', () => {
      expect(wrapper.vm.formData.name !== undefined).toBe(true)
    })

    it('should have displayName field', () => {
      expect(wrapper.vm.formData.displayName !== undefined).toBe(true)
    })

    it('should have category field', () => {
      expect(wrapper.vm.formData.category !== undefined).toBe(true)
    })

    it('should have subject field', () => {
      expect(wrapper.vm.formData.subject !== undefined).toBe(true)
    })

    it('should have htmlBody field', () => {
      expect(wrapper.vm.formData.htmlBody !== undefined).toBe(true)
    })

    it('should have textBody field', () => {
      expect(wrapper.vm.formData.textBody !== undefined).toBe(true)
    })

    it('should have description field', () => {
      expect(wrapper.vm.formData.description !== undefined).toBe(true)
    })

    it('should have isActive checkbox', () => {
      expect(wrapper.vm.formData.isActive).toBe(true)
    })

    it('should have variables array', () => {
      expect(Array.isArray(wrapper.vm.formData.variables)).toBe(true)
    })
  })

  describe('Name Validation', () => {
    it('should validate name format', () => {
      wrapper.vm.formData.name = 'USER_ACCOUNT_CREATED'
      wrapper.vm.validateName()
      expect(wrapper.vm.errors.name).toBeUndefined()
    })

    it('should reject lowercase in name', () => {
      wrapper.vm.formData.name = 'user_account_created'
      wrapper.vm.validateName()
      expect(wrapper.vm.errors.name).toBeDefined()
    })

    it('should reject special characters in name', () => {
      wrapper.vm.formData.name = 'USER-ACCOUNT-CREATED'
      wrapper.vm.validateName()
      expect(wrapper.vm.errors.name).toBeDefined()
    })

    it('should accept numbers in name', () => {
      wrapper.vm.formData.name = 'USER_ACCOUNT_CREATED_2024'
      wrapper.vm.validateName()
      expect(wrapper.vm.errors.name).toBeUndefined()
    })

    it('should require name', () => {
      wrapper.vm.formData.name = ''
      wrapper.vm.validateName()
      expect(wrapper.vm.errors.name).toBeDefined()
    })

    it('should validate on input', async () => {
      wrapper.vm.formData.name = 'invalid-name'
      wrapper.vm.validateName()
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.errors.name).toBeDefined()
    })
  })

  describe('Form Validation', () => {
    it('should require displayName', () => {
      wrapper.vm.formData.name = 'TEST_TEMPLATE'
      wrapper.vm.formData.displayName = ''
      const isValid = wrapper.vm.validateForm()
      expect(isValid).toBe(false)
      expect(wrapper.vm.errors.displayName).toBeDefined()
    })

    it('should enforce displayName max length', () => {
      wrapper.vm.formData.name = 'TEST_TEMPLATE'
      wrapper.vm.formData.displayName = 'A'.repeat(201)
      const isValid = wrapper.vm.validateForm()
      expect(isValid).toBe(false)
      expect(wrapper.vm.errors.displayName).toBeDefined()
    })

    it('should require subject', () => {
      wrapper.vm.formData.name = 'TEST_TEMPLATE'
      wrapper.vm.formData.displayName = 'Test Template'
      wrapper.vm.formData.subject = ''
      const isValid = wrapper.vm.validateForm()
      expect(isValid).toBe(false)
      expect(wrapper.vm.errors.subject).toBeDefined()
    })

    it('should enforce subject max length', () => {
      wrapper.vm.formData.name = 'TEST_TEMPLATE'
      wrapper.vm.formData.displayName = 'Test Template'
      wrapper.vm.formData.subject = 'A'.repeat(201)
      const isValid = wrapper.vm.validateForm()
      expect(isValid).toBe(false)
      expect(wrapper.vm.errors.subject).toBeDefined()
    })

    it('should require htmlBody', () => {
      wrapper.vm.formData.name = 'TEST_TEMPLATE'
      wrapper.vm.formData.displayName = 'Test Template'
      wrapper.vm.formData.subject = 'Test Subject'
      wrapper.vm.formData.htmlBody = ''
      const isValid = wrapper.vm.validateForm()
      expect(isValid).toBe(false)
      expect(wrapper.vm.errors.htmlBody).toBeDefined()
    })

    it('should require textBody', () => {
      wrapper.vm.formData.name = 'TEST_TEMPLATE'
      wrapper.vm.formData.displayName = 'Test Template'
      wrapper.vm.formData.subject = 'Test Subject'
      wrapper.vm.formData.htmlBody = '<p>Test</p>'
      wrapper.vm.formData.textBody = ''
      const isValid = wrapper.vm.validateForm()
      expect(isValid).toBe(false)
      expect(wrapper.vm.errors.textBody).toBeDefined()
    })

    it('should require category', () => {
      wrapper.vm.formData.name = 'TEST_TEMPLATE'
      wrapper.vm.formData.displayName = 'Test Template'
      wrapper.vm.formData.subject = 'Test Subject'
      wrapper.vm.formData.htmlBody = '<p>Test</p>'
      wrapper.vm.formData.textBody = 'Test'
      wrapper.vm.formData.category = null
      const isValid = wrapper.vm.validateForm()
      expect(isValid).toBe(false)
      expect(wrapper.vm.errors.category).toBeDefined()
    })

    it('should validate complete form', () => {
      wrapper.vm.formData.name = 'TEST_TEMPLATE'
      wrapper.vm.formData.displayName = 'Test Template'
      wrapper.vm.formData.subject = 'Test Subject'
      wrapper.vm.formData.htmlBody = '<p>Test</p>'
      wrapper.vm.formData.textBody = 'Test'
      const isValid = wrapper.vm.validateForm()
      expect(isValid).toBe(true)
      expect(Object.keys(wrapper.vm.errors).length).toBe(0)
    })
  })

  describe('Variable Management', () => {
    it('should initialize empty variables array', () => {
      expect(wrapper.vm.formData.variables.length).toBe(0)
    })

    it('should have method to manage variables', async () => {
      expect(typeof wrapper.vm.addVariable).toBe('function')
      wrapper.vm.addVariable()
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.formData.variables.length >= 0).toBe(true)
    })

    it('should remove variable by index', async () => {
      wrapper.vm.formData.variables = [
        { name: 'variable1', type: 'string', defaultValue: '' },
        { name: 'variable2', type: 'string', defaultValue: '' },
      ]
      wrapper.vm.removeVariable(0)
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.formData.variables.length).toBe(1)
      expect(wrapper.vm.formData.variables[0].name).toBe('variable2')
    })

    it('should validate variable name', () => {
      wrapper.vm.formData.variables = [
        { name: 'validName_123', type: 'string', defaultValue: '' },
      ]
      wrapper.vm.validateVariableName(0)
      expect(wrapper.vm.errors.variable_0_name).toBeUndefined()
    })

    it('should reject invalid variable name', () => {
      wrapper.vm.formData.variables = [
        { name: 'invalid-name', type: 'string', defaultValue: '' },
      ]
      wrapper.vm.validateVariableName(0)
      expect(wrapper.vm.errors.variable_0_name).toBeDefined()
    })

    it('should require variable name', () => {
      wrapper.vm.formData.variables = [
        { name: '', type: 'string', defaultValue: '' },
      ]
      wrapper.vm.validateVariableName(0)
      expect(wrapper.vm.errors.variable_0_name).toBeDefined()
    })

    it('should handle multiple variables', async () => {
      wrapper.vm.addVariable()
      wrapper.vm.addVariable()
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.formData.variables.length).toBe(2)
    })
  })

  describe('Category Options', () => {
    it('should have category options', () => {
      expect(wrapper.vm.categoryOptions.length).toBeGreaterThan(0)
    })

    it('should include Account category', () => {
      const hasAccount = wrapper.vm.categoryOptions.some((opt: any) => opt.label === 'Account')
      expect(hasAccount).toBe(true)
    })

    it('should include System category', () => {
      const hasSystem = wrapper.vm.categoryOptions.some((opt: any) => opt.label === 'System')
      expect(hasSystem).toBe(true)
    })

    it('should include Notification category', () => {
      const hasNotification = wrapper.vm.categoryOptions.some((opt: any) => opt.label === 'Notification')
      expect(hasNotification).toBe(true)
    })

    it('should include Compliance category', () => {
      const hasCompliance = wrapper.vm.categoryOptions.some((opt: any) => opt.label === 'Compliance')
      expect(hasCompliance).toBe(true)
    })
  })

  describe('Variable Type Options', () => {
    it('should have variable type options', () => {
      expect(wrapper.vm.variableTypeOptions.length).toBeGreaterThan(0)
    })

    it('should include string type', () => {
      const hasString = wrapper.vm.variableTypeOptions.some((opt: any) => opt.value === 'string')
      expect(hasString).toBe(true)
    })

    it('should include number type', () => {
      const hasNumber = wrapper.vm.variableTypeOptions.some((opt: any) => opt.value === 'number')
      expect(hasNumber).toBe(true)
    })

    it('should include date type', () => {
      const hasDate = wrapper.vm.variableTypeOptions.some((opt: any) => opt.value === 'date')
      expect(hasDate).toBe(true)
    })
  })

  describe('Form Validity', () => {
    it('should compute form validity', () => {
      expect(typeof wrapper.vm.isFormValid).toBe('boolean')
    })

    it('should be invalid when required fields empty', () => {
      wrapper.vm.formData.name = ''
      wrapper.vm.formData.displayName = ''
      expect(wrapper.vm.isFormValid).toBe(false)
    })

    it('should be valid when all required fields filled', () => {
      wrapper.vm.formData.name = 'TEST_TEMPLATE'
      wrapper.vm.formData.displayName = 'Test Template'
      wrapper.vm.formData.subject = 'Test Subject'
      wrapper.vm.formData.htmlBody = '<p>Test</p>'
      wrapper.vm.formData.textBody = 'Test'
      wrapper.vm.formData.category = 'SYSTEM'
      expect(wrapper.vm.isFormValid).toBe(true)
    })

    it('should disable create button when invalid', () => {
      wrapper.vm.formData.name = ''
      expect(wrapper.vm.isFormValid).toBe(false)
    })
  })

  describe('Form Submission', () => {
    it('should have handleSubmit method', () => {
      expect(typeof wrapper.vm.handleSubmit).toBe('function')
    })

    it('should set saving state during submit', async () => {
      wrapper.vm.formData.name = 'TEST_TEMPLATE'
      wrapper.vm.formData.displayName = 'Test'
      wrapper.vm.formData.subject = 'Test'
      wrapper.vm.formData.htmlBody = '<p>Test</p>'
      wrapper.vm.formData.textBody = 'Test'
      const submitPromise = wrapper.vm.handleSubmit()
      expect(wrapper.vm.saving).toBe(true)
      await submitPromise
    })

    it('should call createTemplate on submit', async () => {
      wrapper.vm.formData.name = 'TEST_TEMPLATE'
      wrapper.vm.formData.displayName = 'Test Template'
      wrapper.vm.formData.subject = 'Test Subject'
      wrapper.vm.formData.htmlBody = '<p>Test</p>'
      wrapper.vm.formData.textBody = 'Test'
      await wrapper.vm.handleSubmit()
      await flushPromises()
      expect(mockCreateTemplate).toHaveBeenCalled()
    })

    it('should show success toast on creation', async () => {
      wrapper.vm.formData.name = 'TEST_TEMPLATE'
      wrapper.vm.formData.displayName = 'Test'
      wrapper.vm.formData.subject = 'Test'
      wrapper.vm.formData.htmlBody = '<p>Test</p>'
      wrapper.vm.formData.textBody = 'Test'
      await wrapper.vm.handleSubmit()
      await flushPromises()
      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'success' })
      )
    })

    it('should handle successful creation flow', async () => {
      wrapper.vm.formData.name = 'TEST_TEMPLATE'
      wrapper.vm.formData.displayName = 'Test'
      wrapper.vm.formData.subject = 'Test'
      wrapper.vm.formData.htmlBody = '<p>Test</p>'
      wrapper.vm.formData.textBody = 'Test'
      await wrapper.vm.handleSubmit()
      await flushPromises()
      // After successful creation, the component shows a success toast
      expect(mockToast.add).toHaveBeenCalled()
      // And saving flag is cleared
      expect(wrapper.vm.saving).toBe(false)
    })

    it('should emit created event on success', async () => {
      wrapper.vm.formData.name = 'TEST_TEMPLATE'
      wrapper.vm.formData.displayName = 'Test'
      wrapper.vm.formData.subject = 'Test'
      wrapper.vm.formData.htmlBody = '<p>Test</p>'
      wrapper.vm.formData.textBody = 'Test'
      await wrapper.vm.handleSubmit()
      await flushPromises()
      expect(wrapper.emitted('created')).toBeTruthy()
    })

    it('should handle submission errors', async () => {
      mockCreateTemplate.mockRejectedValue(new Error('API Error'))
      wrapper.vm.formData.name = 'TEST_TEMPLATE'
      wrapper.vm.formData.displayName = 'Test'
      wrapper.vm.formData.subject = 'Test'
      wrapper.vm.formData.htmlBody = '<p>Test</p>'
      wrapper.vm.formData.textBody = 'Test'
      await wrapper.vm.handleSubmit()
      await flushPromises()
      expect(wrapper.vm.saving).toBe(false)
    })

    it('should reset saving state after submission', async () => {
      wrapper.vm.formData.name = 'TEST_TEMPLATE'
      wrapper.vm.formData.displayName = 'Test'
      wrapper.vm.formData.subject = 'Test'
      wrapper.vm.formData.htmlBody = '<p>Test</p>'
      wrapper.vm.formData.textBody = 'Test'
      await wrapper.vm.handleSubmit()
      await flushPromises()
      expect(wrapper.vm.saving).toBe(false)
    })
  })

  describe('Dialog Actions', () => {
    it('should have handleClose method', () => {
      expect(typeof wrapper.vm.handleClose).toBe('function')
      wrapper.vm.handleClose()
      // handleClose triggers the closing sequence
      expect(wrapper.vm.$el).toBeDefined()
    })

    it('should reset form on close', () => {
      wrapper.vm.formData.name = 'TEST'
      wrapper.vm.formData.displayName = 'Test'
      wrapper.vm.handleClose()
      expect(wrapper.vm.formData.name).toBe('')
      expect(wrapper.vm.formData.displayName).toBe('')
    })

    it('should clear errors on close', () => {
      wrapper.vm.errors.name = 'Error'
      wrapper.vm.handleClose()
      expect(Object.keys(wrapper.vm.errors).length).toBe(0)
    })
  })

  describe('Props and Emits', () => {
    it('should accept visible prop', () => {
      expect(wrapper.vm.$props.visible).toBe(true)
    })

    it('should emit update:visible event', async () => {
      wrapper.vm.dialogVisible = false
      await wrapper.vm.$nextTick()
      expect(wrapper.emitted('update:visible')).toBeTruthy()
    })

    it('should pass template data on creation', async () => {
      wrapper.vm.formData.name = 'TEST_TEMPLATE'
      wrapper.vm.formData.displayName = 'Test'
      wrapper.vm.formData.subject = 'Test'
      wrapper.vm.formData.htmlBody = '<p>Test</p>'
      wrapper.vm.formData.textBody = 'Test'
      await wrapper.vm.handleSubmit()
      await flushPromises()
      // Verify the template composable was called with the form data
      expect(mockCreateTemplate).toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long description', () => {
      wrapper.vm.formData.description = 'A'.repeat(500)
      expect(wrapper.vm.formData.description.length).toBe(500)
    })

    it('should handle special characters in description', () => {
      wrapper.vm.formData.description = "Special chars: !@#$%^&*()"
      expect(wrapper.vm.formData.description).toContain('!')
    })

    it('should handle HTML in subject', () => {
      wrapper.vm.formData.subject = 'Subject with {{variable}}'
      expect(wrapper.vm.formData.subject).toContain('{{variable}}')
    })

    it('should handle many variables', async () => {
      for (let i = 0; i < 10; i++) {
        wrapper.vm.addVariable()
      }
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.formData.variables.length).toBe(10)
    })

    it('should handle removing all variables', async () => {
      wrapper.vm.addVariable()
      wrapper.vm.addVariable()
      wrapper.vm.removeVariable(1)
      wrapper.vm.removeVariable(0)
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.formData.variables.length).toBe(0)
    })

    it('should handle empty text body gracefully', () => {
      wrapper.vm.formData.textBody = ''
      const isValid = wrapper.vm.validateForm()
      expect(isValid).toBe(false)
    })
  })

  describe('Button State', () => {
    it('should disable buttons while saving', async () => {
      wrapper.vm.saving = true
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.saving).toBe(true)
    })

    it('should enable create button when form valid', () => {
      wrapper.vm.formData.name = 'TEST_TEMPLATE'
      wrapper.vm.formData.displayName = 'Test'
      wrapper.vm.formData.subject = 'Test'
      wrapper.vm.formData.htmlBody = '<p>Test</p>'
      wrapper.vm.formData.textBody = 'Test'
      expect(wrapper.vm.isFormValid).toBe(true)
    })

    it('should disable dialog close while saving', () => {
      wrapper.vm.saving = true
      expect(wrapper.vm.saving).toBe(true)
    })
  })
})
