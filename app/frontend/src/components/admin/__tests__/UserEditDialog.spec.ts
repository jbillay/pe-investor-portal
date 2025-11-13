import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { ref } from 'vue'
import UserEditDialog from '../UserEditDialog.vue'

// Mock composables
const mockToastAdd = vi.fn()
vi.mock('primevue/usetoast', () => ({
  useToast: () => ({
    add: mockToastAdd,
  }),
}))

const mockApiGet = vi.fn()
const mockApiPost = vi.fn()
const mockApiPut = vi.fn()
const mockApiPatch = vi.fn()

vi.mock('@/composables/useApi', () => ({
  useApi: () => ({
    api: {
      get: mockApiGet,
      post: mockApiPost,
      put: mockApiPut,
      patch: mockApiPatch,
    },
  }),
}))

// Mock PrimeVue components - simple stubs
vi.mock('primevue/dialog', () => ({ default: { name: 'Dialog', template: '<div class="dialog"><slot name="header" /><slot /><slot name="footer" /></div>', props: ['visible', 'modal', 'draggable', 'closable', 'style'] } }))
vi.mock('primevue/button', () => ({ default: { name: 'Button', template: '<button :disabled="disabled || loading"></button>', props: ['label', 'icon', 'class', 'disabled', 'loading'] } }))
vi.mock('primevue/inputtext', () => ({ default: { name: 'InputText', template: '<input />', props: ['modelValue', 'placeholder', 'class', 'type'] } }))
vi.mock('primevue/select', () => ({ default: { name: 'Select', template: '<select></select>', props: ['modelValue', 'options', 'optionLabel', 'optionValue', 'placeholder', 'class'] } }))
vi.mock('primevue/checkbox', () => ({ default: { name: 'Checkbox', template: '<input type="checkbox" />', props: ['modelValue', 'binary'] } }))
vi.mock('primevue/toggleswitch', () => ({ default: { name: 'ToggleSwitch', template: '<input type="checkbox" />', props: ['modelValue'] } }))
vi.mock('primevue/tag', () => ({ default: { name: 'Tag', template: '<span class="tag"></span>', props: ['value', 'severity', 'class'] } }))
vi.mock('primevue/avatar', () => ({ default: { name: 'Avatar', template: '<div class="avatar"></div>', props: ['label', 'size', 'shape', 'class'] } }))
vi.mock('primevue/tabs', () => ({ default: { name: 'Tabs', template: '<div class="tabs"><slot /></div>', props: ['value'] } }))
vi.mock('primevue/tablist', () => ({ default: { name: 'TabList', template: '<div class="tablist"><slot /></div>' } }))
vi.mock('primevue/tab', () => ({ default: { name: 'Tab', template: '<div class="tab"><slot /></div>', props: ['value', 'disabled'] } }))
vi.mock('primevue/tabpanels', () => ({ default: { name: 'TabPanels', template: '<div class="tabpanels"><slot /></div>' } }))
vi.mock('primevue/tabpanel', () => ({ default: { name: 'TabPanel', template: '<div class="tabpanel"><slot /></div>', props: ['value'] } }))

describe('UserEditDialog', () => {
  let wrapper: VueWrapper<any>

  const mockUser = {
    id: 'user-123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    timezone: 'America/New_York',
    language: 'en',
    isActive: true,
    isVerified: true,
    createdAt: '2024-01-01T00:00:00Z',
    roles: [],
    permissions: [],
  }

  const mockApiUserResponse = {
    data: {
      id: 'user-123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      isActive: true,
      isVerified: true,
      createdAt: '2024-01-01T00:00:00Z',
      profile: {
        phone: '+1234567890',
        timezone: 'America/New_York',
        language: 'en',
      },
      stats: {
        loginCount: 42,
      },
      roles: [],
      permissions: [],
    },
  }

  const createWrapper = (props = {}) => {
    wrapper = mount(UserEditDialog, {
      props: {
        visible: true,
        user: null,
        ...props,
      },
      global: {
        stubs: {},
      },
    })
    return wrapper
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockApiGet.mockResolvedValue(mockApiUserResponse)
    mockApiPost.mockResolvedValue({ data: { id: 'new-user-id' } })
    mockApiPut.mockResolvedValue({ data: mockUser })
    mockApiPatch.mockResolvedValue({ data: {} })
  })

  describe('Component Rendering', () => {
    it('should render the dialog', () => {
      createWrapper()
      expect(wrapper.find('.dialog').exists()).toBe(true)
    })

    it('should render tabs', () => {
      createWrapper()
      expect(wrapper.find('.tabs').exists()).toBe(true)
    })

    it('should display Create title for new user', () => {
      createWrapper()
      expect(wrapper.vm.isNewUser).toBe(true)
    })

    it('should display Edit title for existing user', async () => {
      createWrapper({ user: mockUser })
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.isNewUser).toBe(false)
    })
  })

  describe('Form Data', () => {
    it('should initialize with empty form for new user', () => {
      createWrapper()
      expect(wrapper.vm.formData.firstName).toBe('')
      expect(wrapper.vm.formData.lastName).toBe('')
      expect(wrapper.vm.formData.email).toBe('')
    })

    it('should load user data from props', async () => {
      createWrapper({ user: mockUser })
      await wrapper.vm.loadUserDataFromProps()
      expect(wrapper.vm.formData.firstName).toBe('John')
      expect(wrapper.vm.formData.lastName).toBe('Doe')
      expect(wrapper.vm.formData.email).toBe('john.doe@example.com')
    })

    it('should calculate user initials correctly', () => {
      createWrapper({ user: mockUser })
      wrapper.vm.formData.firstName = 'John'
      wrapper.vm.formData.lastName = 'Doe'
      expect(wrapper.vm.userInitials).toBe('JD')
    })

    it('should calculate full name correctly', () => {
      createWrapper({ user: mockUser })
      wrapper.vm.formData.firstName = 'John'
      wrapper.vm.formData.lastName = 'Doe'
      expect(wrapper.vm.fullName).toBe('John Doe')
    })
  })

  describe('Email Validation', () => {
    it('should validate correct email format', () => {
      createWrapper()
      expect(wrapper.vm.isValidEmail('test@example.com')).toBe(true)
      expect(wrapper.vm.isValidEmail('user.name@domain.co.uk')).toBe(true)
    })

    it('should reject invalid email format', () => {
      createWrapper()
      expect(wrapper.vm.isValidEmail('invalid')).toBe(false)
      expect(wrapper.vm.isValidEmail('test@')).toBe(false)
      expect(wrapper.vm.isValidEmail('@example.com')).toBe(false)
      expect(wrapper.vm.isValidEmail('test example.com')).toBe(false)
    })
  })

  describe('Form Validation', () => {
    it('should disable save when firstName is empty', async () => {
      createWrapper()
      wrapper.vm.formData.firstName = ''
      wrapper.vm.formData.lastName = 'Doe'
      wrapper.vm.formData.email = 'test@example.com'
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.canSaveUser).toBeFalsy()
    })

    it('should disable save when lastName is empty', async () => {
      createWrapper()
      wrapper.vm.formData.firstName = 'John'
      wrapper.vm.formData.lastName = ''
      wrapper.vm.formData.email = 'test@example.com'
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.canSaveUser).toBeFalsy()
    })

    it('should disable save when email is empty', async () => {
      createWrapper()
      wrapper.vm.formData.firstName = 'John'
      wrapper.vm.formData.lastName = 'Doe'
      wrapper.vm.formData.email = ''
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.canSaveUser).toBeFalsy()
    })

    it('should disable save when email is invalid', () => {
      createWrapper()
      wrapper.vm.formData.firstName = 'John'
      wrapper.vm.formData.lastName = 'Doe'
      wrapper.vm.formData.email = 'invalid-email'
      expect(wrapper.vm.canSaveUser).toBe(false)
    })

    it('should enable save when all required fields are valid', () => {
      createWrapper()
      wrapper.vm.formData.firstName = 'John'
      wrapper.vm.formData.lastName = 'Doe'
      wrapper.vm.formData.email = 'test@example.com'
      expect(wrapper.vm.canSaveUser).toBe(true)
    })

    it('should disable save when saving is in progress', () => {
      createWrapper()
      wrapper.vm.formData.firstName = 'John'
      wrapper.vm.formData.lastName = 'Doe'
      wrapper.vm.formData.email = 'test@example.com'
      wrapper.vm.isSaving = true
      expect(wrapper.vm.canSaveUser).toBe(false)
    })
  })

  describe('User Creation', () => {
    it('should call API to create new user', async () => {
      createWrapper()
      wrapper.vm.formData.firstName = 'Jane'
      wrapper.vm.formData.lastName = 'Smith'
      wrapper.vm.formData.email = 'jane@example.com'
      wrapper.vm.formData.timezone = 'UTC'
      wrapper.vm.formData.language = 'en'

      await wrapper.vm.saveUser()
      await wrapper.vm.$nextTick()

      expect(mockApiPost).toHaveBeenCalledWith('/admin/users', expect.objectContaining({
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        timezone: 'UTC',
        language: 'en',
      }))
    })

    it('should emit user-updated event on successful creation', async () => {
      createWrapper()
      wrapper.vm.formData.firstName = 'Jane'
      wrapper.vm.formData.lastName = 'Smith'
      wrapper.vm.formData.email = 'jane@example.com'

      await wrapper.vm.saveUser()
      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('user-updated')).toBeTruthy()
      expect(wrapper.emitted('user-updated')?.[0]?.[0]).toMatchObject({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
      })
    })

    it('should show success toast on creation', async () => {
      createWrapper()
      wrapper.vm.formData.firstName = 'Jane'
      wrapper.vm.formData.lastName = 'Smith'
      wrapper.vm.formData.email = 'jane@example.com'

      await wrapper.vm.saveUser()
      await wrapper.vm.$nextTick()

      expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
        severity: 'success',
        summary: 'User Created',
      }))
    })

    it('should close dialog after successful creation', async () => {
      createWrapper()
      wrapper.vm.formData.firstName = 'Jane'
      wrapper.vm.formData.lastName = 'Smith'
      wrapper.vm.formData.email = 'jane@example.com'

      await wrapper.vm.saveUser()
      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('update:visible')).toBeTruthy()
    })
  })

  describe('User Update', () => {
    it('should call API to update existing user', async () => {
      createWrapper({ user: mockUser })
      await wrapper.vm.loadUserDataFromProps()

      wrapper.vm.formData.firstName = 'John Updated'

      await wrapper.vm.saveUser()
      await wrapper.vm.$nextTick()

      expect(mockApiPut).toHaveBeenCalledWith(`/admin/users/${mockUser.id}`, expect.objectContaining({
        firstName: 'John Updated',
      }))
    })

    it('should show success toast on update', async () => {
      createWrapper({ user: mockUser })
      await wrapper.vm.loadUserDataFromProps()

      await wrapper.vm.saveUser()
      await wrapper.vm.$nextTick()

      expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
        severity: 'success',
        summary: 'User Updated',
      }))
    })

    it('should update status separately when changed', async () => {
      createWrapper({ user: mockUser })
      await wrapper.vm.loadUserDataFromProps()

      wrapper.vm.formData.isActive = false

      await wrapper.vm.saveUser()
      await wrapper.vm.$nextTick()

      expect(mockApiPatch).toHaveBeenCalledWith(`/admin/users/${mockUser.id}/status`, expect.objectContaining({
        isActive: false,
      }))
    })

    it('should update verification separately when changed', async () => {
      createWrapper({ user: mockUser })
      await wrapper.vm.loadUserDataFromProps()

      wrapper.vm.formData.isVerified = false

      await wrapper.vm.saveUser()
      await wrapper.vm.$nextTick()

      expect(mockApiPatch).toHaveBeenCalledWith(`/admin/users/${mockUser.id}/verification`, expect.objectContaining({
        isVerified: false,
      }))
    })
  })

  describe('Error Handling', () => {
    it('should show validation error when required fields are missing', async () => {
      createWrapper()
      wrapper.vm.formData.firstName = ''

      await wrapper.vm.saveUser()

      expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
        severity: 'warn',
        summary: 'Validation Error',
      }))
    })

    it('should handle API errors gracefully', async () => {
      mockApiPost.mockRejectedValue(new Error('API Error'))
      createWrapper()
      wrapper.vm.formData.firstName = 'Jane'
      wrapper.vm.formData.lastName = 'Smith'
      wrapper.vm.formData.email = 'jane@example.com'

      await wrapper.vm.saveUser()
      await wrapper.vm.$nextTick()

      expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
        severity: 'error',
        summary: 'Save Failed',
      }))
    })

    it('should stop loading state after error', async () => {
      mockApiPost.mockRejectedValue(new Error('API Error'))
      createWrapper()
      wrapper.vm.formData.firstName = 'Jane'
      wrapper.vm.formData.lastName = 'Smith'
      wrapper.vm.formData.email = 'jane@example.com'

      await wrapper.vm.saveUser()
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.isSaving).toBe(false)
    })
  })

  describe('Activity Helpers', () => {
    it('should get correct activity icon class', () => {
      createWrapper()
      expect(wrapper.vm.getActivityIconClass('LOGIN')).toBe('bg-green-500')
      expect(wrapper.vm.getActivityIconClass('LOGOUT')).toBe('bg-gray-500')
      expect(wrapper.vm.getActivityIconClass('ROLE_ASSIGNED')).toBe('bg-blue-500')
      expect(wrapper.vm.getActivityIconClass('UNKNOWN')).toBe('bg-gray-500')
    })

    it('should get correct activity icon', () => {
      createWrapper()
      expect(wrapper.vm.getActivityIcon('LOGIN')).toBe('pi pi-sign-in')
      expect(wrapper.vm.getActivityIcon('LOGOUT')).toBe('pi pi-sign-out')
      expect(wrapper.vm.getActivityIcon('PASSWORD_CHANGED')).toBe('pi pi-key')
      expect(wrapper.vm.getActivityIcon('UNKNOWN')).toBe('pi pi-info-circle')
    })

    it('should get correct activity severity', () => {
      createWrapper()
      expect(wrapper.vm.getActivitySeverity('LOGIN')).toBe('success')
      expect(wrapper.vm.getActivitySeverity('LOGOUT')).toBe('info')
      expect(wrapper.vm.getActivitySeverity('PASSWORD_CHANGED')).toBe('warning')
      expect(wrapper.vm.getActivitySeverity('UNKNOWN')).toBe('info')
    })

    it('should format activity time correctly', () => {
      createWrapper()
      const date = new Date('2024-01-15T10:30:00Z')
      const formatted = wrapper.vm.formatActivityTime(date)
      expect(formatted).toContain('2024')
      expect(formatted).toContain('Jan')
    })
  })

  describe('Password Generation', () => {
    it('should generate temporary password', () => {
      createWrapper()
      const password = wrapper.vm.generateTempPassword()
      expect(password).toHaveLength(12)
      expect(/[A-Z]/.test(password)).toBe(true) // Has uppercase
      expect(/[a-z]/.test(password)).toBe(true) // Has lowercase
      expect(/[0-9]/.test(password)).toBe(true) // Has number
      expect(/[@$!%*?&]/.test(password)).toBe(true) // Has special char
    })

    it('should generate different passwords each time', () => {
      createWrapper()
      const pass1 = wrapper.vm.generateTempPassword()
      const pass2 = wrapper.vm.generateTempPassword()
      expect(pass1).not.toBe(pass2)
    })
  })

  describe('Dialog Lifecycle', () => {
    it('should track userActivities state', async () => {
      createWrapper()
      expect(wrapper.vm.userActivities).toEqual([])
      wrapper.vm.userActivities = []
      expect(wrapper.vm.userActivities).toEqual([])
    })

    it('should close dialog when closeDialog is called', async () => {
      createWrapper()
      wrapper.vm.closeDialog()
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.dialogVisible).toBe(false)
    })

    it('should track isSaving state', () => {
      createWrapper()
      expect(wrapper.vm.isSaving).toBe(false)
      wrapper.vm.isSaving = true
      expect(wrapper.vm.isSaving).toBe(true)
    })
  })

  describe('Audit Logs', () => {
    it('should fetch audit logs when user has ID', async () => {
      mockApiGet.mockResolvedValue({ data: { data: [] } })
      createWrapper({ user: mockUser })
      wrapper.vm.formData.id = 'user-123'

      await wrapper.vm.loadUserAuditLogs()

      expect(mockApiGet).toHaveBeenCalledWith('/admin/users/user-123/audit-logs', expect.any(Object))
    })

    it('should not fetch audit logs when user has no ID', async () => {
      createWrapper()
      wrapper.vm.formData.id = ''

      await wrapper.vm.loadUserAuditLogs()

      expect(mockApiGet).not.toHaveBeenCalled()
    })

    it('should handle audit logs error gracefully', async () => {
      mockApiGet.mockRejectedValue({ response: { status: 500 } })
      createWrapper({ user: mockUser })
      wrapper.vm.formData.id = 'user-123'

      await wrapper.vm.loadUserAuditLogs()

      expect(wrapper.vm.userActivities).toEqual([])
      expect(wrapper.vm.isLoadingAuditLogs).toBe(false)
    })

    it('should not show toast for 404 audit log errors', async () => {
      mockApiGet.mockRejectedValue({ response: { status: 404 } })
      createWrapper({ user: mockUser })
      wrapper.vm.formData.id = 'user-123'

      await wrapper.vm.loadUserAuditLogs()

      expect(mockToastAdd).not.toHaveBeenCalled()
    })
  })

  describe('Computed Properties', () => {
    it('should compute userInitials with default when no names', () => {
      createWrapper()
      wrapper.vm.formData.firstName = ''
      wrapper.vm.formData.lastName = ''
      expect(wrapper.vm.userInitials).toBe('U')
    })

    it('should handle single name for initials', () => {
      createWrapper()
      wrapper.vm.formData.firstName = 'John'
      wrapper.vm.formData.lastName = ''
      expect(wrapper.vm.userInitials).toBe('J')
    })

    it('should trim fullName correctly', () => {
      createWrapper()
      wrapper.vm.formData.firstName = 'John'
      wrapper.vm.formData.lastName = ''
      expect(wrapper.vm.fullName).toBe('John')
    })
  })
})
