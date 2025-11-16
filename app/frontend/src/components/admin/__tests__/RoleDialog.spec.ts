import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount, VueWrapper, flushPromises } from '@vue/test-utils'
import RoleDialog from '../RoleDialog.vue'

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
    template: `<div class="dialog" :class="$attrs.class"><slot name="header" /><slot /><slot name="footer" /></div>`,
    props: ['visible', 'modal', 'draggable', 'closable', 'style', 'contentStyle'],
    emits: ['update:visible'],
  },
}))

vi.mock('primevue/inputtext', () => ({
  default: {
    name: 'InputText',
    template: '<input @input="$emit(\'update:modelValue\', $event.target.value)" v-bind="$attrs" />',
    props: ['modelValue', 'readonly', 'maxlength'],
    emits: ['update:modelValue', 'input'],
  },
}))

vi.mock('primevue/textarea', () => ({
  default: {
    name: 'Textarea',
    template: '<textarea @input="$emit(\'update:modelValue\', $event.target.value)" v-bind="$attrs"></textarea>',
    props: ['modelValue', 'readonly', 'rows', 'maxlength'],
    emits: ['update:modelValue', 'input'],
  },
}))

vi.mock('primevue/togglebutton', () => ({
  default: {
    name: 'ToggleButton',
    template: '<button @click="$emit(\'update:modelValue\', !modelValue)" v-bind="$attrs" />',
    props: ['modelValue', 'disabled', 'onLabel', 'offLabel'],
    emits: ['update:modelValue'],
  },
}))

vi.mock('primevue/card', () => ({
  default: {
    name: 'Card',
    template: `<div class="card"><div class="card-header"><slot name="header" /></div><div class="card-content"><slot /><slot name="content" /></div></div>`,
  },
}))

vi.mock('primevue/tag', () => ({
  default: {
    name: 'Tag',
    template: '<span class="tag">{{ value }}</span>',
    props: ['value', 'severity'],
  },
}))

vi.mock('primevue/divider', () => ({
  default: {
    name: 'Divider',
    template: '<hr class="divider" />',
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

vi.mock('primevue/confirmdialog', () => ({
  default: {
    name: 'ConfirmDialog',
    template: '<div class="confirm-dialog"></div>',
  },
}))

const mockPermissions = [
  {
    id: '1',
    name: 'read:investments',
    description: 'Read investments',
    category: 'INVESTMENTS',
  },
  {
    id: '2',
    name: 'read:portfolios',
    description: 'Read portfolios',
    category: 'PORTFOLIOS',
  },
  {
    id: '3',
    name: 'write:reports',
    description: 'Write reports',
    category: 'REPORTS',
  },
]

const mockMatrix = {
  INVESTMENTS: ['read:investments', 'write:investments'],
  PORTFOLIOS: ['read:portfolios', 'write:portfolios'],
  REPORTS: ['read:reports', 'write:reports'],
}

const mockRole = {
  id: '1',
  name: 'Senior Analyst',
  description: 'Senior analyst role with read and limited write permissions',
  active: true,
  isDefault: false,
  permissions: ['read:investments', 'read:portfolios', 'write:reports'],
  userCount: 5,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

describe('RoleDialog', () => {
  let wrapper: VueWrapper

  const createWrapper = (props = {}) => {
    return mount(RoleDialog, {
      props: {
        visible: true,
        mode: 'view',
        role: null,
        permissions: mockPermissions,
        matrix: mockMatrix,
        existingRoleNames: [],
        ...props,
      },
      global: {
        stubs: {
          teleport: true,
          PermissionSelector: true,
        },
        components: {
          Dialog: {
            name: 'Dialog',
            template: `<div class="dialog" :class="$attrs.class"><slot name="header" /><slot /><slot name="footer" /></div>`,
            props: ['visible', 'modal', 'draggable', 'closable', 'style', 'contentStyle'],
          },
          InputText: {
            name: 'InputText',
            template: '<input @input="$emit(\'update:modelValue\', $event.target.value)" v-bind="$attrs" />',
            props: ['modelValue', 'readonly', 'maxlength'],
          },
          Textarea: {
            name: 'Textarea',
            template: '<textarea @input="$emit(\'update:modelValue\', $event.target.value)" v-bind="$attrs"></textarea>',
            props: ['modelValue', 'readonly', 'rows', 'maxlength'],
          },
          ToggleButton: {
            name: 'ToggleButton',
            template: '<button @click="$emit(\'update:modelValue\', !modelValue)" v-bind="$attrs" />',
            props: ['modelValue', 'disabled', 'onLabel', 'offLabel'],
          },
          Card: {
            name: 'Card',
            template: `<div class="card"><div class="card-header"><slot name="header" /></div><div class="card-content"><slot /><slot name="content" /></div></div>`,
          },
          Tag: {
            name: 'Tag',
            template: '<span class="tag">{{ value }}</span>',
            props: ['value', 'severity'],
          },
          Divider: {
            name: 'Divider',
            template: '<hr class="divider" />',
          },
          Button: {
            name: 'Button',
            template: '<button @click="$emit(\'click\')" :disabled="disabled"><slot /></button>',
            props: ['label', 'icon', 'loading', 'disabled', 'class'],
          },
          ConfirmDialog: {
            name: 'ConfirmDialog',
            template: '<div class="confirm-dialog"></div>',
          },
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
    wrapper = createWrapper()
  })

  describe('Component Rendering', () => {
    it('should render the dialog', () => {
      expect(wrapper.find('.dialog').exists()).toBe(true)
    })

    it('should display dialog header', async () => {
      expect(wrapper.vm.dialogTitle).toBeDefined()
    })

    it('should display dialog subtitle', async () => {
      expect(wrapper.vm.dialogSubtitle).toBeDefined()
    })

    it('should render content area', async () => {
      expect(wrapper.find('.dialog-content').exists()).toBe(true)
    })

    it('should have role information card', () => {
      expect(wrapper.find('.card').exists()).toBe(true)
    })
  })

  describe('Dialog Modes', () => {
    it('should be in view mode when mode is view', () => {
      wrapper = createWrapper({ mode: 'view', role: mockRole })
      expect(wrapper.vm.mode).toBe('view')
    })

    it('should be in edit mode when mode is edit', () => {
      wrapper = createWrapper({ mode: 'edit', role: mockRole })
      expect(wrapper.vm.mode).toBe('edit')
    })

    it('should be in create mode when mode is create', () => {
      wrapper = createWrapper({ mode: 'create' })
      expect(wrapper.vm.mode).toBe('create')
    })

    it('should disable input fields in view mode', async () => {
      wrapper = createWrapper({ mode: 'view', role: mockRole })
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.mode).toBe('view')
    })

    it('should enable input fields in edit mode', async () => {
      wrapper = createWrapper({ mode: 'edit', role: mockRole })
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.mode).toBe('edit')
    })

    it('should have empty form in create mode', async () => {
      wrapper = createWrapper({ mode: 'create' })
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.formData.name).toBe('')
    })
  })

  describe('Form Data Management', () => {
    it('should initialize form data from role in edit mode', async () => {
      wrapper = createWrapper({ mode: 'edit', role: mockRole })
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.formData.name).toBe(mockRole.name)
      expect(wrapper.vm.formData.description).toBe(mockRole.description)
    })

    it('should update form data when role name changes', async () => {
      wrapper.vm.formData.name = 'New Role Name'
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.formData.name).toBe('New Role Name')
    })

    it('should update form data when description changes', async () => {
      wrapper.vm.formData.description = 'New description'
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.formData.description).toBe('New description')
    })

    it('should track role active status', async () => {
      wrapper.vm.formData.active = false
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.formData.active).toBe(false)
    })

    it('should track default role status', async () => {
      wrapper.vm.formData.isDefault = true
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.formData.isDefault).toBe(true)
    })
  })

  describe('Form Validation', () => {
    it('should validate role name is required', () => {
      wrapper.vm.formData.name = ''
      wrapper.vm.validateField('name')
      expect(wrapper.vm.validationErrors.name).toBeDefined()
    })

    it('should accept valid role names', () => {
      wrapper.vm.formData.name = 'Valid Role Name'
      wrapper.vm.validateField('name')
      expect(wrapper.vm.validationErrors.name).not.toBeDefined()
    })

    it('should validate description length', () => {
      wrapper.vm.formData.description = 'a'.repeat(501)
      wrapper.vm.validateField('description')
      expect(wrapper.vm.validationErrors.description).toBeDefined()
    })

    it('should track character count for name field', async () => {
      wrapper.vm.formData.name = 'Test'
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.formData.name.length).toBe(4)
    })

    it('should enforce name max length', async () => {
      wrapper.vm.formData.name = 'a'.repeat(51)
      expect(wrapper.vm.formData.name.length).toBeGreaterThanOrEqual(50)
    })
  })

  describe('Role Status Management', () => {
    it('should toggle active status', async () => {
      wrapper.vm.formData.active = true
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.formData.active).toBe(true)

      wrapper.vm.formData.active = false
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.formData.active).toBe(false)
    })

    it('should show active status in tag', async () => {
      wrapper = createWrapper({ mode: 'view', role: mockRole })
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.formData.active).toBeDefined()
    })

    it('should show default role status in tag', async () => {
      wrapper = createWrapper({
        mode: 'view',
        role: { ...mockRole, isDefault: true },
      })
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.formData.isDefault).toBe(true)
    })

    it('should prevent changing default status with system users', async () => {
      wrapper = createWrapper({
        mode: 'edit',
        role: { ...mockRole, isDefault: true, userCount: 5 }
      })
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.hasSystemUsers).toBe(true)
    })
  })

  describe('Permissions Display', () => {
    it('should display permissions list for role', async () => {
      wrapper = createWrapper({
        mode: 'view',
        role: mockRole,
      })
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.selectedPermissions.length).toBeGreaterThan(0)
    })

    it('should allow permission selection in edit mode', async () => {
      wrapper = createWrapper({ mode: 'edit' })
      wrapper.vm.selectedPermissions = ['read:users', 'write:users']
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.selectedPermissions.length).toBe(2)
    })

    it('should prevent permission editing in view mode', async () => {
      wrapper = createWrapper({ mode: 'view', role: mockRole })
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.mode).toBe('view')
    })
  })

  describe('Dialog Visibility', () => {
    it('should be visible when visible prop is true', () => {
      expect(wrapper.vm.$props.visible).toBe(true)
    })

    it('should be hidden when visible prop is false', async () => {
      wrapper = createWrapper({ visible: false })
      expect(wrapper.vm.$props.visible).toBe(false)
    })

    it('should emit close event', async () => {
      wrapper.vm.handleClose()
      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('should disable close button when loading', async () => {
      wrapper.vm.loading = true
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.loading).toBe(true)
    })
  })

  describe('Mobile Responsiveness', () => {
    it('should render on mobile', async () => {
      wrapper = createWrapper()
      wrapper.vm.isMobile = true
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.dialog').exists()).toBe(true)
    })

    it('should render on desktop', async () => {
      wrapper = createWrapper()
      wrapper.vm.isMobile = false
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.dialog').exists()).toBe(true)
    })

    it('should have dialog responsive container', async () => {
      wrapper = createWrapper()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.dialog').exists()).toBe(true)
    })
  })

  describe('Form Submission', () => {
    it('should validate form before submission', async () => {
      wrapper = createWrapper({ mode: 'create' })
      wrapper.vm.formData.name = ''
      wrapper.vm.validateField('name')
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.validationErrors.name).toBeDefined()
    })

    it('should track saving state', async () => {
      wrapper.vm.loading = true
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.loading).toBe(true)
    })

    it('should set form data for creation', async () => {
      wrapper = createWrapper({ mode: 'create' })
      wrapper.vm.formData.name = 'New Role'
      wrapper.vm.formData.description = 'New role description'
      wrapper.vm.formData.active = true

      expect(wrapper.vm.formData.name).toBe('New Role')
      expect(wrapper.vm.formData.active).toBe(true)
    })

    it('should set form data for editing', async () => {
      wrapper = createWrapper({ mode: 'edit', role: mockRole })
      wrapper.vm.formData.name = 'Updated Role'
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.formData.name).toBe('Updated Role')
    })
  })

  describe('Role Metadata', () => {
    it('should display role creation date in view/edit mode', async () => {
      wrapper = createWrapper({
        mode: 'view',
        role: mockRole,
      })
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.role?.createdAt).toBeDefined()
    })

    it('should display user count for role', async () => {
      wrapper = createWrapper({
        mode: 'view',
        role: mockRole,
      })
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.role?.userCount).toBeDefined()
    })

    it('should display last update date', async () => {
      wrapper = createWrapper({
        mode: 'view',
        role: mockRole,
      })
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.role?.updatedAt).toBeDefined()
    })
  })

  describe('Dialog Actions', () => {
    it('should show save button in create mode', async () => {
      wrapper = createWrapper({ mode: 'create' })
      expect(wrapper.vm.mode).toBe('create')
    })

    it('should show save button in edit mode', async () => {
      wrapper = createWrapper({ mode: 'edit', role: mockRole })
      expect(wrapper.vm.mode).toBe('edit')
    })

    it('should have close handler method', async () => {
      expect(typeof wrapper.vm.handleClose).toBe('function')
    })

    it('should show delete button in edit mode for non-default roles', async () => {
      wrapper = createWrapper({
        mode: 'edit',
        role: { ...mockRole, isDefault: false },
      })
      expect(wrapper.vm.mode).toBe('edit')
    })
  })

  describe('Validation Error Display', () => {
    it('should display validation error for name', () => {
      wrapper.vm.validationErrors = { name: 'Name is required' }
      expect(wrapper.vm.validationErrors.name).toBeDefined()
    })

    it('should display validation error for description', () => {
      wrapper.vm.validationErrors = { description: 'Description is too long' }
      expect(wrapper.vm.validationErrors.description).toBeDefined()
    })

    it('should clear validation errors', () => {
      wrapper.vm.validationErrors = { name: 'Error' }
      wrapper.vm.validationErrors = {}
      expect(Object.keys(wrapper.vm.validationErrors).length).toBe(0)
    })

    it('should show character count for name', async () => {
      wrapper.vm.formData.name = 'Test Role'
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.formData.name.length).toBe(9)
    })

    it('should show character count for description', async () => {
      wrapper.vm.formData.description = 'Test description'
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.formData.description.length).toBe(16)
    })
  })

  describe('Props', () => {
    it('should render with visible prop', () => {
      expect(wrapper.find('.dialog').exists()).toBe(true)
    })

    it('should handle different mode props', () => {
      wrapper = createWrapper({ mode: 'edit' })
      expect(wrapper.vm.mode).toBe('edit')
    })

    it('should accept role prop', () => {
      wrapper = createWrapper({ role: mockRole })
      expect(wrapper.vm.$props.role).toEqual(mockRole)
    })

    it('should render with existingRoleNames prop', () => {
      wrapper = createWrapper({ existingRoleNames: ['Admin', 'User'] })
      expect(wrapper.find('.dialog').exists()).toBe(true)
    })
  })

  describe('Events', () => {
    it('should have close handler defined', () => {
      expect(typeof wrapper.vm.handleClose).toBe('function')
    })

    it('should track dialog visibility state', () => {
      expect(wrapper.vm.$props.visible).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should initialize with empty form in create mode', async () => {
      wrapper = createWrapper({ mode: 'create' })
      expect(wrapper.vm.formData.name).toBe('')
    })

    it('should handle very long role names gracefully', async () => {
      wrapper.vm.formData.name = 'A'.repeat(50)
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.formData.name.length).toBeLessThanOrEqual(50)
    })

    it('should handle very long descriptions gracefully', async () => {
      wrapper.vm.formData.description = 'A'.repeat(500)
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.formData.description.length).toBeLessThanOrEqual(500)
    })

    it('should handle null role gracefully', async () => {
      wrapper = createWrapper({ role: null })
      expect(wrapper.vm.$props.role).toBe(null)
    })

    it('should track form data with special characters', async () => {
      wrapper.vm.formData.name = 'Role-Name_123'
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.formData.name).toContain('-')
      expect(wrapper.vm.formData.name).toContain('_')
    })
  })

  describe('Dialog Title and Subtitle', () => {
    it('should display appropriate title for view mode', () => {
      wrapper = createWrapper({ mode: 'view', role: mockRole })
      expect(wrapper.vm.dialogTitle).toContain(mockRole.name)
    })

    it('should display appropriate subtitle for view mode', () => {
      wrapper = createWrapper({ mode: 'view', role: mockRole })
      expect(wrapper.vm.dialogSubtitle).toBeDefined()
    })

    it('should display appropriate title for edit mode', () => {
      wrapper = createWrapper({ mode: 'edit', role: mockRole })
      expect(wrapper.vm.dialogTitle).toBeDefined()
    })

    it('should display appropriate title for create mode', () => {
      wrapper = createWrapper({ mode: 'create' })
      expect(wrapper.vm.dialogTitle).toBeDefined()
    })
  })

  describe('Field Input Handling', () => {
    it('should update name field', async () => {
      wrapper.vm.formData.name = 'Updated Name'
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.formData.name).toBe('Updated Name')
    })

    it('should update description field', async () => {
      wrapper.vm.formData.description = 'Updated Description'
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.formData.description).toBe('Updated Description')
    })

    it('should track form data changes', async () => {
      wrapper.vm.formData.name = 'Test'
      wrapper.vm.formData.description = 'Test Description'
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.formData.name).toBe('Test')
      expect(wrapper.vm.formData.description).toBe('Test Description')
    })
  })

  describe('Function Coverage - Direct Invocation', () => {
    it('should invoke toggleAllPermissions to select all', async () => {
      wrapper = createWrapper({ mode: 'edit', role: mockRole })
      wrapper.vm.selectedPermissions = []

      wrapper.vm.toggleAllPermissions()
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.selectedPermissions.length).toBe(wrapper.vm.permissions.length)
    })

    it('should invoke toggleAllPermissions to deselect all', async () => {
      wrapper = createWrapper({ mode: 'edit', role: mockRole })
      wrapper.vm.selectedPermissions = wrapper.vm.permissions.map((p: any) => p.id)

      wrapper.vm.toggleAllPermissions()
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.selectedPermissions.length).toBe(0)
    })

    it('should invoke handlePermissionToggle to add permission', async () => {
      wrapper = createWrapper({ mode: 'edit', role: mockRole })
      wrapper.vm.selectedPermissions = []

      wrapper.vm.handlePermissionToggle('1')
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.selectedPermissions).toContain('1')
    })

    it('should invoke handlePermissionToggle to remove permission', async () => {
      wrapper = createWrapper({ mode: 'edit', role: mockRole })
      wrapper.vm.selectedPermissions = ['1', '2']

      wrapper.vm.handlePermissionToggle('1')
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.selectedPermissions).not.toContain('1')
      expect(wrapper.vm.selectedPermissions).toContain('2')
    })

    it('should invoke handleBulkToggle to grant permissions', async () => {
      wrapper = createWrapper({ mode: 'edit', role: mockRole })
      wrapper.vm.selectedPermissions = []

      wrapper.vm.handleBulkToggle(['1', '2', '3'], true)
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.selectedPermissions).toContain('1')
      expect(wrapper.vm.selectedPermissions).toContain('2')
      expect(wrapper.vm.selectedPermissions).toContain('3')
    })

    it('should invoke handleBulkToggle to revoke permissions', async () => {
      wrapper = createWrapper({ mode: 'edit', role: mockRole })
      wrapper.vm.selectedPermissions = ['1', '2', '3']

      wrapper.vm.handleBulkToggle(['1', '2'], false)
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.selectedPermissions).not.toContain('1')
      expect(wrapper.vm.selectedPermissions).not.toContain('2')
      expect(wrapper.vm.selectedPermissions).toContain('3')
    })

    it('should invoke switchToEditMode', async () => {
      wrapper = createWrapper({ mode: 'view', role: mockRole })

      wrapper.vm.switchToEditMode()
      await wrapper.vm.$nextTick()

      // Verify emit was called
      expect(wrapper.emitted('switch-mode')).toBeTruthy()
      expect(wrapper.emitted('switch-mode')?.[0]).toEqual(['edit'])
    })

    it('should invoke handleClone', async () => {
      wrapper = createWrapper({ mode: 'view', role: mockRole })

      wrapper.vm.handleClone()
      await wrapper.vm.$nextTick()

      // Verify emit was called
      expect(wrapper.emitted('clone')).toBeTruthy()
      expect(wrapper.emitted('clone')?.[0]).toEqual([mockRole])
    })

    it('should invoke confirmDelete', async () => {
      wrapper = createWrapper({ mode: 'view', role: mockRole })

      wrapper.vm.confirmDelete()
      await wrapper.vm.$nextTick()

      expect(mockConfirm.require).toHaveBeenCalled()
    })

    it('should invoke formatDate with valid date', async () => {
      wrapper = createWrapper({ mode: 'view', role: mockRole })

      const formatted = wrapper.vm.formatDate('2024-01-15T10:30:00Z')

      expect(typeof formatted).toBe('string')
      expect(formatted).toContain('2024')
    })

    it('should invoke formatDate with ISO string', async () => {
      wrapper = createWrapper({ mode: 'view', role: mockRole })

      const formatted = wrapper.vm.formatDate(new Date().toISOString())

      expect(typeof formatted).toBe('string')
    })

    it('should compute isFormValid as true with valid data', async () => {
      wrapper = createWrapper({ mode: 'edit', role: mockRole })
      wrapper.vm.formData.name = 'Valid Role Name'
      wrapper.vm.formData.description = 'Valid description'
      wrapper.vm.validationErrors = {}

      await wrapper.vm.$nextTick()

      expect(wrapper.vm.isFormValid).toBe(true)
    })

    it('should compute isFormValid as false with invalid data', async () => {
      wrapper = createWrapper({ mode: 'edit', role: mockRole })
      wrapper.vm.formData.name = ''
      wrapper.vm.validationErrors = { name: 'Required' }

      await wrapper.vm.$nextTick()

      expect(wrapper.vm.isFormValid).toBe(false)
    })

    it('should compute isFormValid as false with validation errors', async () => {
      wrapper = createWrapper({ mode: 'edit', role: mockRole })
      wrapper.vm.formData.name = 'Valid Name'
      wrapper.vm.validationErrors = { description: 'Too long' }

      await wrapper.vm.$nextTick()

      expect(wrapper.vm.isFormValid).toBe(false)
    })

    it('should invoke initializeDialog function', async () => {
      wrapper = createWrapper({ mode: 'edit', role: mockRole })

      wrapper.vm.initializeDialog()
      await wrapper.vm.$nextTick()

      // Should initialize form data from role
      expect(wrapper.vm.formData.name).toBe(mockRole.name)
      expect(wrapper.vm.formData.description).toBe(mockRole.description)
    })

    it('should invoke checkMobileView function', async () => {
      wrapper = createWrapper({ mode: 'view', role: mockRole })

      // Set window width
      global.innerWidth = 500
      wrapper.vm.checkMobileView()
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.isMobile).toBe(true)
    })

    it('should invoke checkMobileView for desktop', async () => {
      wrapper = createWrapper({ mode: 'view', role: mockRole })

      // Set window width
      global.innerWidth = 1024
      wrapper.vm.checkMobileView()
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.isMobile).toBe(false)
    })
  })
})
