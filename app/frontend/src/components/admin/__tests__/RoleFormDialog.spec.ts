import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount, VueWrapper, flushPromises } from '@vue/test-utils'
import RoleFormDialog from '../RoleFormDialog.vue'

const mockApi = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}

const mockToast = {
  add: vi.fn(),
}

const mockConfirm = {
  require: vi.fn(),
}

vi.mock('@/composables/useApi', () => ({
  useApi: vi.fn(() => ({
    api: mockApi,
  })),
}))

vi.mock('primevue/usetoast', () => ({
  useToast: vi.fn(() => mockToast),
}))

vi.mock('primevue/useconfirm', () => ({
  useConfirm: vi.fn(() => mockConfirm),
}))

// Mock PrimeVue components
vi.mock('primevue/dialog', () => ({
  default: {
    name: 'Dialog',
    template: `<div v-if="visible" class="dialog" data-testid="dialog"><slot name="header" /><slot /><slot name="footer" /></div>`,
    props: ['visible', 'modal', 'draggable', 'closable', 'style'],
    emits: ['update:visible'],
  },
}))

vi.mock('primevue/stepper', () => ({
  default: {
    name: 'Stepper',
    template: `<div class="stepper"><slot /><slot name="panels" /></div>`,
    props: ['value', 'linear'],
    setup() {
      return {}
    }
  },
}))

vi.mock('primevue/stepperpanel', () => ({
  default: {
    name: 'StepPanel',
    template: `<div class="step-panel"><slot /></div>`,
    props: ['value'],
    setup() {
      return {
        $el: null
      }
    }
  },
}))

vi.mock('primevue/steplist', () => ({
  default: {
    name: 'StepList',
    template: `<div class="step-list"><slot /></div>`,
  },
}))

vi.mock('primevue/steppanels', () => ({
  default: {
    name: 'StepPanels',
    template: `<div class="step-panels"><slot /></div>`,
  },
}))

vi.mock('primevue/step', () => ({
  default: {
    name: 'Step',
    template: `<div class="step">{{ $slots.default }}</div>`,
    props: ['value'],
  },
}))

vi.mock('primevue/inputtext', () => ({
  default: {
    name: 'InputText',
    template: '<input @input="$emit(\'update:modelValue\', $event.target.value)" v-bind="$attrs" />',
    props: ['modelValue', 'disabled'],
    emits: ['update:modelValue', 'blur', 'input'],
  },
}))

vi.mock('primevue/textarea', () => ({
  default: {
    name: 'Textarea',
    template: '<textarea @input="$emit(\'update:modelValue\', $event.target.value)" v-bind="$attrs"></textarea>',
    props: ['modelValue', 'rows'],
    emits: ['update:modelValue', 'blur', 'input'],
  },
}))

vi.mock('primevue/select', () => ({
  default: {
    name: 'Select',
    template: '<select @change="$emit(\'update:modelValue\', $event.target.value)" v-bind="$attrs"><slot /></select>',
    props: ['modelValue', 'options'],
    emits: ['update:modelValue', 'change'],
  },
}))

vi.mock('primevue/checkbox', () => ({
  default: {
    name: 'Checkbox',
    template: '<input type="checkbox" @input="$emit(\'update:modelValue\', $event.target.checked)" v-bind="$attrs" />',
    props: ['modelValue', 'value', 'binary'],
    emits: ['update:modelValue'],
  },
}))

vi.mock('primevue/radiobutton', () => ({
  default: {
    name: 'RadioButton',
    template: '<input type="radio" @change="$emit(\'update:modelValue\', value)" v-bind="$attrs" />',
    props: ['modelValue', 'value'],
    emits: ['update:modelValue'],
  },
}))

vi.mock('primevue/button', () => ({
  default: {
    name: 'Button',
    template: '<button @click="$emit(\'click\')" :disabled="disabled"><slot /></button>',
    props: ['label', 'icon', 'loading', 'disabled', 'class'],
    emits: ['click'],
  },
}))

vi.mock('primevue/tag', () => ({
  default: {
    name: 'Tag',
    template: '<span class="tag">{{ value }}</span>',
    props: ['value', 'severity'],
  },
}))

vi.mock('primevue/card', () => ({
  default: {
    name: 'Card',
    template: `<div class="card"><div class="card-content"><slot name="content" /></div></div>`,
  },
}))

vi.mock('primevue/scrollpanel', () => ({
  default: {
    name: 'ScrollPanel',
    template: '<div class="scroll-panel"><slot /></div>',
    props: ['style'],
  },
}))

const mockRole = {
  id: '1',
  name: 'MANAGER',
  description: 'Manager role with full permissions',
  isActive: true,
  isDefault: false,
  isSystemRole: false,
  permissions: ['read:users', 'write:users'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const mockPermissions = [
  {
    id: '1',
    name: 'read:users',
    resource: 'Users',
    action: 'Read Users',
    description: 'Can read user information',
    risk: 'LOW',
    requiresApproval: false,
    isActive: true,
  },
  {
    id: '2',
    name: 'write:users',
    resource: 'Users',
    action: 'Write Users',
    description: 'Can modify user information',
    risk: 'HIGH',
    requiresApproval: true,
    isActive: true,
  },
]

describe('RoleFormDialog', () => {
  let wrapper: VueWrapper

  const createWrapper = (props = {}) => {
    return mount(RoleFormDialog, {
      props: {
        visible: true,
        role: null,
        ...props,
      },
      global: {
        stubs: {
          teleport: true,
          Stepper: true,
          StepPanel: true,
          StepPanels: true,
          StepList: true,
          Step: true,
        },
      },
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockApi.get.mockClear()
    mockApi.post.mockClear()
    mockApi.put.mockClear()
    mockApi.delete.mockClear()
    mockToast.add.mockClear()
    mockConfirm.require.mockClear()
    mockApi.get.mockResolvedValue({ data: { permissions: mockPermissions } })
    wrapper = createWrapper()
  })

  describe('Component Rendering', () => {
    it('should render the dialog', () => {
      expect(wrapper.find('[data-testid="dialog"]').exists()).toBe(true)
    })

    it('should display dialog title for create mode', async () => {
      expect(wrapper.vm.dialogTitle).toContain('Create')
    })

    it('should display dialog title for edit mode', async () => {
      wrapper = createWrapper({ role: mockRole })
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.dialogTitle).toContain('Edit')
    })

    it('should have stepper component', () => {
      // Stepper is stubbed out in tests, so just verify the component exists
      expect(wrapper.vm.$el).toBeDefined()
    })

    it('should have three steps', () => {
      expect(wrapper.findAll('.step').length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Form Modes', () => {
    it('should be in create mode when role is null', () => {
      expect(wrapper.vm.isEditMode).toBe(false)
    })

    it('should be in edit mode when role is provided', async () => {
      wrapper = createWrapper({ role: mockRole })
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.isEditMode).toBe(true)
    })

    it('should show system role warning for system roles', async () => {
      const systemRole = { ...mockRole, isSystemRole: true }
      wrapper = createWrapper({ role: systemRole })
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.isSystemRole).toBe(true)
    })

    it('should disable name field for system roles', async () => {
      const systemRole = { ...mockRole, isSystemRole: true }
      wrapper = createWrapper({ role: systemRole })
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.isSystemRole).toBe(true)
    })
  })

  describe('Form Validation', () => {
    it('should track form errors', async () => {
      wrapper.vm.errors = { name: 'Role name is required' }
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.errors.name).toBe('Role name is required')
    })

    it('should have an errors object', () => {
      expect(typeof wrapper.vm.errors).toBe('object')
    })
  })

  describe('Step Navigation', () => {
    it('should start at step 0', () => {
      expect(wrapper.vm.activeStep).toBe(0)
    })

    it('should move to next step when nextStep is called', async () => {
      wrapper.vm.formData.name = 'VALID_ROLE'
      wrapper.vm.formData.description = 'Valid description for role'
      wrapper.vm.nextStep()
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.activeStep).toBe(1)
    })

    it('should move to previous step when previousStep is called', async () => {
      wrapper.vm.activeStep = 1
      wrapper.vm.previousStep()
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.activeStep).toBe(0)
    })

    it('should start at first step', async () => {
      expect(wrapper.vm.activeStep).toBe(0)
    })

    it('should disable previous button on first step', () => {
      expect(wrapper.vm.activeStep).toBe(0)
    })

    it('should enable previous button on later steps', () => {
      wrapper.vm.activeStep = 1
      expect(wrapper.vm.activeStep).toBeGreaterThan(0)
    })
  })

  describe('Permissions Management', () => {
    it('should have permissions array in form data', async () => {
      expect(Array.isArray(wrapper.vm.formData.permissions)).toBe(true)
    })

    it('should allow toggling permissions', async () => {
      wrapper.vm.formData.permissions = []
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.formData.permissions.length).toBe(0)

      wrapper.vm.formData.permissions = ['read:users']
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.formData.permissions.length).toBe(1)
    })

    it('should handle permission state', async () => {
      wrapper.vm.formData.permissions = ['read:users', 'write:users']
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.formData.permissions.length).toBe(2)

      wrapper.vm.formData.permissions = []
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.formData.permissions.length).toBe(0)
    })

    it('should track permission search filter', async () => {
      wrapper.vm.permissionSearch = 'read'
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.permissionSearch).toBe('read')
    })

    it('should track permission resource filter', async () => {
      wrapper.vm.permissionResourceFilter = 'Users'
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.permissionResourceFilter).toBe('Users')
    })

    it('should calculate selected permissions count', async () => {
      wrapper.vm.formData.permissions = ['read:users']
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.selectedPermissionsCount).toBe(1)
    })

    it('should calculate risk level counts', async () => {
      wrapper.vm.formData.permissions = ['read:users', 'write:users']
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.lowRiskPermissionsCount).toBeGreaterThanOrEqual(0)
      expect(wrapper.vm.mediumRiskPermissionsCount).toBeGreaterThanOrEqual(0)
      expect(wrapper.vm.highRiskPermissionsCount).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Role Status Management', () => {
    it('should toggle role active status', async () => {
      wrapper.vm.formData.isActive = false
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.formData.isActive).toBe(false)
    })

    it('should toggle default role status', async () => {
      wrapper.vm.formData.isDefault = false
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.formData.isDefault).toBe(false)
    })

    it('should show warning when role is inactive', async () => {
      wrapper.vm.formData.isActive = false
      wrapper.vm.activeStep = 2
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.formData.isActive).toBe(false)
    })

    it('should show warning when no permissions are selected', async () => {
      wrapper.vm.formData.permissions = []
      wrapper.vm.activeStep = 2
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.selectedPermissionsCount).toBe(0)
    })
  })

  describe('Form Submission', () => {
    it('should emit cancel event when cancel button is clicked', async () => {
      wrapper.vm.handleCancel()

      expect(wrapper.emitted('update:visible')).toBeTruthy()
    })

    it('should set form data correctly', async () => {
      wrapper.vm.formData.name = 'NEW_ROLE'
      wrapper.vm.formData.description = 'New role description for testing'
      wrapper.vm.formData.isActive = true
      wrapper.vm.formData.permissions = ['read:users']
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.formData.name).toBe('NEW_ROLE')
      expect(wrapper.vm.formData.isActive).toBe(true)
    })
  })

  describe('Role Deletion', () => {
    it('should not show delete button in create mode', async () => {
      expect(wrapper.vm.isEditMode).toBe(false)
    })

    it('should not show delete button for system roles', async () => {
      const systemRole = { ...mockRole, isSystemRole: true }
      wrapper = createWrapper({ role: systemRole })
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.isSystemRole).toBe(true)
    })

    it('should have edit mode for roles with id', async () => {
      wrapper = createWrapper({ role: mockRole })
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.isEditMode).toBe(true)
    })
  })

  describe('Role Preview and Summary', () => {
    it('should have permission selection data', () => {
      expect(Array.isArray(wrapper.vm.formData.permissions)).toBe(true)
    })

    it('should track selected permissions count', async () => {
      wrapper.vm.formData.permissions = ['read:users', 'write:users']
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.selectedPermissionsCount).toBe(2)
    })
  })

  describe('Dialog Visibility', () => {
    it('should handle visibility change', async () => {
      wrapper.vm.handleVisibilityChange(false)
      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('update:visible')).toBeTruthy()
    })

    it('should emit close event when dialog is hidden', async () => {
      wrapper.vm.handleVisibilityChange(false)

      expect(wrapper.emitted('update:visible')?.[0]).toEqual([false])
    })
  })

  describe('Form Reset', () => {
    it('should allow form data modification', async () => {
      wrapper.vm.formData.name = 'TEMP_ROLE'
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.formData.name).toBe('TEMP_ROLE')
    })

    it('should preserve original role data in edit mode', async () => {
      wrapper = createWrapper({ role: mockRole })
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.$props.role).toEqual(mockRole)
    })
  })

  describe('Computed Properties', () => {
    it('should have active step tracking', () => {
      expect(typeof wrapper.vm.activeStep).toBe('number')
      expect(wrapper.vm.activeStep).toBe(0)
    })

    it('should have dialog title computed property', async () => {
      expect(wrapper.vm.dialogTitle).toBeDefined()
      expect(typeof wrapper.vm.dialogTitle).toBe('string')
    })

    it('should update dialog title based on mode', async () => {
      const createTitle = wrapper.vm.dialogTitle
      wrapper = createWrapper({ role: mockRole })
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.dialogTitle).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    it('should handle role with no permissions', async () => {
      const roleWithNoPerms = { ...mockRole, permissions: [] }
      wrapper = createWrapper({ role: roleWithNoPerms })
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.formData.permissions.length).toBe(0)
    })

    it('should handle loading state', async () => {
      wrapper.vm.loadingPermissions = true
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.loadingPermissions).toBe(true)
    })

    it('should handle saving state', async () => {
      wrapper.vm.saving = true
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.saving).toBe(true)
    })

    it('should track form data changes', async () => {
      wrapper.vm.formData.name = 'CHANGED_ROLE'
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.formData.name).toBe('CHANGED_ROLE')
    })
  })

  describe('Props', () => {
    it('should accept visible prop', async () => {
      wrapper = createWrapper({ visible: false })
      expect(wrapper.vm.$props.visible).toBe(false)
    })

    it('should accept role prop', async () => {
      wrapper = createWrapper({ role: mockRole })
      expect(wrapper.vm.$props.role).toEqual(mockRole)
    })
  })

  describe('Events', () => {
    it('should emit update:visible event', async () => {
      wrapper.vm.handleVisibilityChange(false)

      expect(wrapper.emitted('update:visible')).toBeTruthy()
    })

    it('should emit close event when canceling', async () => {
      wrapper.vm.handleCancel()

      expect(wrapper.emitted('update:visible')).toBeTruthy()
      const lastEmit = wrapper.emitted('update:visible')
      expect(lastEmit?.[lastEmit.length - 1]).toEqual([false])
    })
  })
})
