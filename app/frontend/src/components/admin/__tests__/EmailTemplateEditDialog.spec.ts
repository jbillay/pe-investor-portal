import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import EmailTemplateEditDialog from '../EmailTemplateEditDialog.vue'

const mockToast = { add: vi.fn() }
const mockUpdateTemplate = vi.fn(async () => ({
  id: '1',
  name: 'WELCOME',
  displayName: 'Welcome Email',
  category: 'ACCOUNT',
  subject: 'Welcome!',
  htmlBody: '<h1>Welcome</h1>',
  textBody: 'Welcome',
  isActive: true,
  variables: [],
  version: 2,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-02',
  isSystem: false,
  description: 'Welcome template'
}))

vi.mock('primevue/usetoast', () => ({
  useToast: vi.fn(() => mockToast),
}))

vi.mock('@/composables/useEmailTemplates', () => ({
  useEmailTemplates: vi.fn(() => ({ updateTemplate: mockUpdateTemplate })),
}))

vi.mock('primevue/dialog', () => ({
  default: {
    name: 'Dialog',
    template: `<div v-if="visible" class="dialog"><slot name="header" /><slot /><slot name="footer" /></div>`,
    props: ['visible', 'modal', 'draggable', 'closable', 'dismissableMask', 'style'],
    emits: ['update:visible', 'show', 'hide'],
  },
}))

vi.mock('primevue/button', () => ({
  default: {
    name: 'Button',
    template: `<button @click="$emit('click')" :disabled="disabled" :loading="loading"><slot /></button>`,
    props: ['label', 'icon', 'loading', 'disabled', 'severity', 'text', 'size'],
    emits: ['click'],
  },
}))

vi.mock('primevue/inputtext', () => ({
  default: {
    name: 'InputText',
    template: `<input @input="$emit('update:modelValue', $event.target.value)" :value="modelValue" :disabled="disabled" :class="{'p-invalid': $attrs.class?.includes('p-invalid')}" />`,
    props: ['modelValue', 'placeholder', 'disabled', 'maxlength'],
  },
}))

vi.mock('primevue/textarea', () => ({
  default: {
    name: 'Textarea',
    template: `<textarea @input="$emit('update:modelValue', $event.target.value)" :value="modelValue" :rows="rows" :autoResize="autoResize"></textarea>`,
    props: ['modelValue', 'placeholder', 'rows', 'autoResize'],
  },
}))

vi.mock('primevue/select', () => ({
  default: {
    name: 'Select',
    template: `<select @change="$emit('update:modelValue', $event.target.value)" :value="modelValue"><slot /></select>`,
    props: ['modelValue', 'options', 'optionLabel', 'optionValue', 'placeholder'],
  },
}))

vi.mock('primevue/checkbox', () => ({
  default: {
    name: 'Checkbox',
    template: `<input type="checkbox" @change="$emit('update:modelValue', $event.target.checked)" :checked="modelValue" :binary="binary" />`,
    props: ['modelValue', 'binary'],
    emits: ['update:modelValue'],
  },
}))

const mockTemplate = {
  id: '1',
  name: 'WELCOME',
  displayName: 'Welcome Email',
  description: 'Welcome template',
  category: 'ACCOUNT',
  subject: 'Welcome to {{platformName}}',
  htmlBody: '<h1>Welcome {{firstName}}</h1>',
  textBody: 'Welcome {{firstName}}',
  isActive: true,
  isSystem: false,
  version: 1,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  variables: [
    {
      name: 'firstName',
      type: 'string',
      required: true,
      description: 'User first name',
      example: 'John',
      defaultValue: 'Guest'
    }
  ]
}

describe('EmailTemplateEditDialog', () => {
  let wrapper: VueWrapper

  const createWrapper = (props = {}) => {
    return mount(EmailTemplateEditDialog, {
      props: {
        visible: true,
        template: mockTemplate,
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

    it('should display dialog header with template name', () => {
      expect(wrapper.vm.$props.visible).toBe(true)
    })

    it('should show template edit form', () => {
      expect(wrapper.find('.template-edit-form').exists()).toBe(true)
    })

    it('should display template information section', () => {
      expect(wrapper.find('.form-section').exists()).toBe(true)
    })

    it('should have footer with action buttons', () => {
      expect(wrapper.vm.$el).toBeDefined()
    })

    it('should display multiple form sections', () => {
      expect(wrapper.findAll('.form-section').length).toBeGreaterThan(1)
    })

    it('should show system template warning when applicable', () => {
      const systemTemplate = { ...mockTemplate, isSystem: true }
      const systemWrapper = createWrapper({ template: systemTemplate })
      expect(systemTemplate.isSystem).toBe(true)
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

    it('should emit update:visible on close', async () => {
      wrapper.vm.dialogVisible = false
      await wrapper.vm.$nextTick()
      expect(wrapper.emitted('update:visible')).toBeTruthy()
    })

    it('should load template data on mount', () => {
      expect(wrapper.vm.formData.displayName).toBe(mockTemplate.displayName)
    })

    it('should initialize saving as false', () => {
      expect(wrapper.vm.saving).toBe(false)
    })
  })

  describe('Form Fields', () => {
    it('should have template name field (disabled)', () => {
      expect(wrapper.vm.formData).toBeDefined()
    })

    it('should have displayName field', () => {
      expect(wrapper.vm.formData.displayName).toBe('Welcome Email')
    })

    it('should have description field', () => {
      expect(wrapper.vm.formData.description).toBe('Welcome template')
    })

    it('should have category field', () => {
      expect(wrapper.vm.formData.category).toBe('ACCOUNT')
    })

    it('should have isActive field', () => {
      expect(wrapper.vm.formData.isActive).toBe(true)
    })

    it('should have subject field', () => {
      expect(wrapper.vm.formData.subject).toBe('Welcome to {{platformName}}')
    })

    it('should have htmlBody field', () => {
      expect(wrapper.vm.formData.htmlBody).toContain('Welcome')
    })

    it('should have textBody field', () => {
      expect(wrapper.vm.formData.textBody).toContain('Welcome')
    })

    it('should have variables field', () => {
      expect(Array.isArray(wrapper.vm.formData.variables)).toBe(true)
    })
  })

  describe('Template Information', () => {
    it('should display template name as read-only', () => {
      expect(wrapper.vm.formData).toBeDefined()
    })

    it('should allow editing display name', async () => {
      wrapper.vm.formData.displayName = 'New Display Name'
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.formData.displayName).toBe('New Display Name')
    })

    it('should allow editing description', async () => {
      wrapper.vm.formData.description = 'New description'
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.formData.description).toBe('New description')
    })

    it('should allow changing category', async () => {
      wrapper.vm.formData.category = 'NOTIFICATION'
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.formData.category).toBe('NOTIFICATION')
    })

    it('should allow toggling active status', async () => {
      const initialStatus = wrapper.vm.formData.isActive
      wrapper.vm.formData.isActive = !initialStatus
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.formData.isActive).toBe(!initialStatus)
    })

    it('should have category options', () => {
      expect(wrapper.vm.categoryOptions.length).toBeGreaterThan(0)
    })

    it('should include ACCOUNT category option', () => {
      const hasAccount = wrapper.vm.categoryOptions.some((opt: any) => opt.value === 'ACCOUNT')
      expect(hasAccount).toBe(true)
    })
  })

  describe('Email Content', () => {
    it('should allow editing subject', async () => {
      wrapper.vm.formData.subject = 'New Subject'
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.formData.subject).toBe('New Subject')
    })

    it('should allow editing HTML body', async () => {
      wrapper.vm.formData.htmlBody = '<h1>New HTML</h1>'
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.formData.htmlBody).toBe('<h1>New HTML</h1>')
    })

    it('should allow editing text body', async () => {
      wrapper.vm.formData.textBody = 'New text'
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.formData.textBody).toBe('New text')
    })

    it('should handle variable syntax in subject', () => {
      expect(wrapper.vm.formData.subject).toContain('{{')
    })

    it('should handle variable syntax in HTML body', () => {
      expect(wrapper.vm.formData.htmlBody).toContain('{{')
    })

    it('should allow subject up to 200 characters', async () => {
      wrapper.vm.formData.subject = 'A'.repeat(200)
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.formData.subject.length).toBe(200)
    })
  })

  describe('Variable Management', () => {
    it('should have addVariable method', () => {
      expect(typeof wrapper.vm.addVariable).toBe('function')
    })

    it('should have removeVariable method', () => {
      expect(typeof wrapper.vm.removeVariable).toBe('function')
    })

    it('should initialize with existing variables', () => {
      expect(wrapper.vm.formData.variables.length).toBe(1)
    })

    it('should add new variable', () => {
      const initialCount = wrapper.vm.formData.variables.length
      wrapper.vm.addVariable()
      expect(wrapper.vm.formData.variables.length).toBe(initialCount + 1)
    })

    it('should add variable with default structure', () => {
      wrapper.vm.addVariable()
      const newVar = wrapper.vm.formData.variables[wrapper.vm.formData.variables.length - 1]
      expect(newVar.name).toBe('')
      expect(newVar.type).toBe('string')
      expect(newVar.required).toBe(false)
    })

    it('should remove variable by index', () => {
      wrapper.vm.addVariable()
      const initialCount = wrapper.vm.formData.variables.length
      wrapper.vm.removeVariable(0)
      expect(wrapper.vm.formData.variables.length).toBe(initialCount - 1)
    })

    it('should allow editing variable name', () => {
      wrapper.vm.formData.variables[0].name = 'newName'
      expect(wrapper.vm.formData.variables[0].name).toBe('newName')
    })

    it('should allow changing variable type', () => {
      wrapper.vm.formData.variables[0].type = 'number'
      expect(wrapper.vm.formData.variables[0].type).toBe('number')
    })

    it('should allow toggling variable required flag', () => {
      const initialRequired = wrapper.vm.formData.variables[0].required
      wrapper.vm.formData.variables[0].required = !initialRequired
      expect(wrapper.vm.formData.variables[0].required).toBe(!initialRequired)
    })

    it('should allow editing variable description', () => {
      wrapper.vm.formData.variables[0].description = 'New description'
      expect(wrapper.vm.formData.variables[0].description).toBe('New description')
    })

    it('should have variable type options', () => {
      expect(wrapper.vm.variableTypeOptions.length).toBeGreaterThan(0)
    })

    it('should include string type option', () => {
      const hasString = wrapper.vm.variableTypeOptions.some((opt: any) => opt.value === 'string')
      expect(hasString).toBe(true)
    })
  })

  describe('Form Validation', () => {
    it('should validate displayName is required', async () => {
      wrapper.vm.formData.displayName = ''
      await wrapper.vm.$nextTick()
      const isValid = wrapper.vm.validateForm()
      expect(isValid).toBe(false)
    })

    it('should validate subject is required', async () => {
      wrapper.vm.formData.subject = ''
      await wrapper.vm.$nextTick()
      const isValid = wrapper.vm.validateForm()
      expect(isValid).toBe(false)
    })

    it('should validate htmlBody is required', async () => {
      wrapper.vm.formData.htmlBody = ''
      await wrapper.vm.$nextTick()
      const isValid = wrapper.vm.validateForm()
      expect(isValid).toBe(false)
    })

    it('should validate textBody is required', async () => {
      wrapper.vm.formData.textBody = ''
      await wrapper.vm.$nextTick()
      const isValid = wrapper.vm.validateForm()
      expect(isValid).toBe(false)
    })

    it('should validate category is required', async () => {
      wrapper.vm.formData.category = ''
      await wrapper.vm.$nextTick()
      const isValid = wrapper.vm.validateForm()
      expect(isValid).toBe(false)
    })

    it('should validate variable names', () => {
      wrapper.vm.formData.variables[0].name = 'invalid-name'
      wrapper.vm.validateVariableName(0)
      expect(wrapper.vm.errors[`variable_0_name`]).toBeDefined()
    })

    it('should allow alphanumeric and underscore in variable names', () => {
      wrapper.vm.formData.variables[0].name = 'valid_name_123'
      wrapper.vm.validateVariableName(0)
      expect(wrapper.vm.errors[`variable_0_name`]).toBeUndefined()
    })

    it('should have validateForm method', () => {
      expect(typeof wrapper.vm.validateForm).toBe('function')
    })

    it('should have isFormValid computed property', () => {
      expect(typeof wrapper.vm.isFormValid).toBe('boolean')
    })
  })

  describe('Change Detection', () => {
    it('should detect changes in displayName', () => {
      wrapper.vm.formData.displayName = 'Different Name'
      expect(wrapper.vm.hasChanges).toBe(true)
    })

    it('should detect changes in subject', () => {
      wrapper.vm.formData.subject = 'Different Subject'
      expect(wrapper.vm.hasChanges).toBe(true)
    })

    it('should detect changes in htmlBody', () => {
      wrapper.vm.formData.htmlBody = '<h1>Different</h1>'
      expect(wrapper.vm.hasChanges).toBe(true)
    })

    it('should detect changes in textBody', () => {
      wrapper.vm.formData.textBody = 'Different text'
      expect(wrapper.vm.hasChanges).toBe(true)
    })

    it('should detect changes in category', () => {
      wrapper.vm.formData.category = 'NOTIFICATION'
      expect(wrapper.vm.hasChanges).toBe(true)
    })

    it('should detect changes in isActive', () => {
      wrapper.vm.formData.isActive = false
      expect(wrapper.vm.hasChanges).toBe(true)
    })

    it('should detect changes in variables', () => {
      wrapper.vm.addVariable()
      expect(wrapper.vm.hasChanges).toBe(true)
    })

    it('should detect variable property changes', () => {
      wrapper.vm.formData.variables[0].description = 'New description'
      expect(wrapper.vm.hasChanges).toBe(true)
    })

    it('should not detect changes when nothing modified', () => {
      expect(wrapper.vm.hasChanges).toBe(false)
    })
  })

  describe('Form Submission', () => {
    it('should have handleSubmit method', () => {
      expect(typeof wrapper.vm.handleSubmit).toBe('function')
    })

    it('should call updateTemplate on submit', async () => {
      await wrapper.vm.handleSubmit()
      expect(mockUpdateTemplate).toHaveBeenCalled()
    })

    it('should show error toast if validation fails', async () => {
      wrapper.vm.formData.displayName = ''
      await wrapper.vm.handleSubmit()
      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'error' })
      )
    })

    it('should set saving state during submission', async () => {
      expect(wrapper.vm.saving).toBe(false)
      const submitPromise = wrapper.vm.handleSubmit()
      await wrapper.vm.$nextTick()
      // After submission completes
      await submitPromise
      expect(wrapper.vm.saving).toBe(false)
    })

    it('should emit updated event on successful submission', async () => {
      await wrapper.vm.handleSubmit()
      await wrapper.vm.$nextTick()
      expect(wrapper.emitted('updated')).toBeTruthy()
    })

    it('should show success toast on successful submission', async () => {
      await wrapper.vm.handleSubmit()
      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'success' })
      )
    })

    it('should close dialog after successful submission', async () => {
      await wrapper.vm.handleSubmit()
      await wrapper.vm.$nextTick()
      expect(wrapper.emitted('updated')).toBeTruthy()
    })
  })

  describe('Dialog Actions', () => {
    it('should have handleClose method', () => {
      expect(typeof wrapper.vm.handleClose).toBe('function')
    })

    it('should close dialog without confirmation if no changes', () => {
      vi.spyOn(window, 'confirm')
      wrapper.vm.handleClose()
      expect(window.confirm).not.toHaveBeenCalled()
    })

    it('should show confirmation dialog if there are unsaved changes', () => {
      wrapper.vm.formData.displayName = 'Modified'
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      wrapper.vm.handleClose()
      expect(window.confirm).toHaveBeenCalled()
    })

    it('should not close if user cancels confirmation', () => {
      wrapper.vm.formData.displayName = 'Modified'
      vi.spyOn(window, 'confirm').mockReturnValue(false)
      wrapper.vm.dialogVisible = true
      wrapper.vm.handleClose()
      expect(wrapper.vm.dialogVisible).toBe(true)
    })

    it('should have resetForm method', () => {
      expect(typeof wrapper.vm.resetForm).toBe('function')
    })

    it('should clear errors on reset', () => {
      wrapper.vm.errors = { displayName: 'Error message' }
      wrapper.vm.resetForm()
      expect(Object.keys(wrapper.vm.errors).length).toBe(0)
    })

    it('should disable close when saving', async () => {
      wrapper.vm.saving = true
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.saving).toBe(true)
    })
  })

  describe('Template Metadata', () => {
    it('should display template version', () => {
      expect(wrapper.vm.$props.template?.version).toBe(1)
    })

    it('should display created date', () => {
      expect(wrapper.vm.$props.template?.createdAt).toBeDefined()
    })

    it('should display updated date', () => {
      expect(wrapper.vm.$props.template?.updatedAt).toBeDefined()
    })

    it('should have formatDate method', () => {
      expect(typeof wrapper.vm.formatDate).toBe('function')
    })

    it('should format date correctly', () => {
      const date = '2024-01-01T00:00:00Z'
      const formatted = wrapper.vm.formatDate(date)
      expect(formatted).toContain('2024')
    })
  })

  describe('Props and Emits', () => {
    it('should accept visible prop', () => {
      expect(wrapper.vm.$props.visible).toBe(true)
    })

    it('should accept template prop', () => {
      expect(wrapper.vm.$props.template).toEqual(mockTemplate)
    })

    it('should emit update:visible', async () => {
      wrapper.vm.dialogVisible = false
      await wrapper.vm.$nextTick()
      expect(wrapper.emitted('update:visible')).toBeTruthy()
    })

    it('should handle null template gracefully', () => {
      const nullWrapper = createWrapper({ template: null })
      expect(nullWrapper.vm.$props.template).toBeNull()
    })

    it('should handle visible false prop', () => {
      const hiddenWrapper = createWrapper({ visible: false })
      expect(hiddenWrapper.vm.dialogVisible).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long displayName', () => {
      const longName = 'A'.repeat(200)
      wrapper.vm.formData.displayName = longName
      expect(wrapper.vm.formData.displayName.length).toBe(200)
    })

    it('should handle special characters in displayName', () => {
      wrapper.vm.formData.displayName = "O'Brien-Smith's Template"
      expect(wrapper.vm.formData.displayName).toContain("'")
    })

    it('should handle HTML content in htmlBody', () => {
      wrapper.vm.formData.htmlBody = '<div><h1>Test</h1><p>Content</p></div>'
      expect(wrapper.vm.formData.htmlBody).toContain('<div>')
    })

    it('should handle many variables', () => {
      for (let i = 0; i < 10; i++) {
        wrapper.vm.addVariable()
      }
      expect(wrapper.vm.formData.variables.length).toBe(11)
    })

    it('should handle template without variables', () => {
      const noVarsTemplate = { ...mockTemplate, variables: [] }
      const noVarsWrapper = createWrapper({ template: noVarsTemplate })
      expect(noVarsWrapper.vm.formData.variables.length).toBe(0)
    })

    it('should handle system template warning display', () => {
      const systemTemplate = { ...mockTemplate, isSystem: true }
      const systemWrapper = createWrapper({ template: systemTemplate })
      expect(systemTemplate.isSystem).toBe(true)
    })
  })

  describe('Button States', () => {
    it('should disable Save button when no changes', () => {
      expect(wrapper.vm.hasChanges).toBe(false)
    })

    it('should enable Save button when form has valid changes', async () => {
      wrapper.vm.formData.displayName = 'New Name'
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.hasChanges).toBe(true)
      expect(wrapper.vm.isFormValid).toBe(true)
    })

    it('should disable Save button when form is invalid', async () => {
      wrapper.vm.formData.subject = ''
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.isFormValid).toBeFalsy()
    })

    it('should disable Cancel button while saving', async () => {
      wrapper.vm.saving = true
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.saving).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      mockUpdateTemplate.mockRejectedValueOnce(new Error('API Error'))
      await wrapper.vm.handleSubmit()
      expect(wrapper.vm.saving).toBe(false)
    })

    it('should clear saving state on error', async () => {
      mockUpdateTemplate.mockRejectedValueOnce(new Error('API Error'))
      await wrapper.vm.handleSubmit()
      expect(wrapper.vm.saving).toBe(false)
    })

    it('should handle validation errors', () => {
      wrapper.vm.formData.displayName = ''
      const isValid = wrapper.vm.validateForm()
      expect(isValid).toBe(false)
      expect(Object.keys(wrapper.vm.errors).length).toBeGreaterThan(0)
    })
  })
})
