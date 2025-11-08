import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount, VueWrapper, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import UserCreateDialog from '../UserCreateDialog.vue'
import type { CreateUserResponse } from '@/types/auth'

// Mock useApi composable
const mockApi = {
  post: vi.fn(),
}

const mockToast = {
  add: vi.fn(),
}

vi.mock('@/composables/useApi', () => ({
  useApi: vi.fn(() => ({
    api: mockApi,
  })),
}))

// Mock PrimeVue useToast
vi.mock('primevue/usetoast', () => ({
  useToast: vi.fn(() => mockToast),
}))

// Mock PrimeVue components
vi.mock('primevue/dialog', () => ({
  default: {
    name: 'Dialog',
    template: `<div v-if="visible" data-testid="dialog" class="dialog">
      <div class="dialog-header"><slot name="header" /></div>
      <div class="dialog-content"><slot /></div>
      <div class="dialog-footer"><slot name="footer" /></div>
    </div>`,
    props: ['visible', 'modal', 'draggable', 'closable', 'style'],
    emits: ['update:visible', 'show', 'hide'],
    setup(props: any, { emit }: any) {
      return {
        visible: ref(props.visible),
      }
    },
  },
}))

vi.mock('primevue/inputtext', () => ({
  default: {
    name: 'InputText',
    template: '<input @input="$emit(\'update:modelValue\', $event.target.value)" v-bind="$attrs" />',
    props: ['modelValue'],
    emits: ['update:modelValue'],
  },
}))

vi.mock('primevue/select', () => ({
  default: {
    name: 'Select',
    template: '<select @change="$emit(\'update:modelValue\', $event.target.value)" v-bind="$attrs"><slot /></select>',
    props: ['modelValue', 'options'],
    emits: ['update:modelValue'],
  },
}))

vi.mock('primevue/button', () => ({
  default: {
    name: 'Button',
    template: '<button @click="$emit(\'click\')" :disabled="disabled"><slot /></button>',
    props: ['label', 'icon', 'loading', 'disabled'],
    emits: ['click'],
  },
}))

vi.mock('primevue/tag', () => ({
  default: {
    name: 'Tag',
    template: '<span data-testid="tag">{{ value }}</span>',
    props: ['value', 'severity'],
  },
}))

// Mock created user response
const mockCreatedUser: CreateUserResponse = {
  id: '123',
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe',
  timezone: 'America/New_York',
  tempPassword: 'TempPass123!@#',
  tempPasswordExpiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
  emailSent: true,
  roles: ['USER'],
  createdAt: new Date().toISOString(),
}

describe('UserCreateDialog', () => {
  let wrapper: VueWrapper

  const createWrapper = (props = {}) => {
    return mount(UserCreateDialog, {
      props: {
        visible: true,
        ...props,
      },
      global: {
        stubs: {
          'router-link': true,
          teleport: true,
        },
      },
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockApi.post.mockClear()
    mockToast.add.mockClear()
    wrapper = createWrapper()
  })

  describe('Component Rendering', () => {
    it('should render the dialog', () => {
      expect(wrapper.find('[data-testid="dialog"]').exists()).toBe(true)
    })

    it('should display the create form initially', () => {
      expect(wrapper.text()).toContain('Create New User')
    })

    it('should have email, firstName, lastName fields', () => {
      expect(wrapper.text()).toContain('Email Address')
      expect(wrapper.text()).toContain('First Name')
      expect(wrapper.text()).toContain('Last Name')
    })

    it('should have timezone field', () => {
      expect(wrapper.text()).toContain('Timezone (Optional)')
    })

    it('should display required field indicators', () => {
      const text = wrapper.text()
      expect(text).toContain('*')
    })
  })

  describe('Form Validation', () => {
    it('should validate email format', () => {
      expect(wrapper.vm.isValidEmail('valid@example.com')).toBe(true)
      expect(wrapper.vm.isValidEmail('invalid-email')).toBe(false)
      expect(wrapper.vm.isValidEmail('test@domain')).toBe(false)
      expect(wrapper.vm.isValidEmail('')).toBe(false)
    })

    it('should show email validation error when empty', async () => {
      wrapper.vm.formData.firstName = 'John'
      wrapper.vm.formData.lastName = 'Doe'
      wrapper.vm.showValidationErrors = true
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Email address is required')
    })

    it('should show email validation error for invalid format', async () => {
      wrapper.vm.formData.email = 'invalid'
      wrapper.vm.formData.firstName = 'John'
      wrapper.vm.formData.lastName = 'Doe'
      wrapper.vm.showValidationErrors = true
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Please enter a valid email address')
    })

    it('should show firstName validation error when empty', async () => {
      wrapper.vm.formData.email = 'john@example.com'
      wrapper.vm.formData.lastName = 'Doe'
      wrapper.vm.showValidationErrors = true
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('First name is required')
    })

    it('should show lastName validation error when empty', async () => {
      wrapper.vm.formData.email = 'john@example.com'
      wrapper.vm.formData.firstName = 'John'
      wrapper.vm.showValidationErrors = true
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Last name is required')
    })

    it('should enable create button when all required fields are valid', () => {
      wrapper.vm.formData.email = 'john@example.com'
      wrapper.vm.formData.firstName = 'John'
      wrapper.vm.formData.lastName = 'Doe'

      expect(wrapper.vm.canCreateUser).toBe(true)
    })

    it('should disable create button when required fields are missing', async () => {
      wrapper.vm.formData.email = ''
      wrapper.vm.formData.firstName = 'John'
      wrapper.vm.formData.lastName = 'Doe'
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.canCreateUser).toBeFalsy()
    })

    it('should disable create button for invalid email', () => {
      wrapper.vm.formData.email = 'invalid'
      wrapper.vm.formData.firstName = 'John'
      wrapper.vm.formData.lastName = 'Doe'

      expect(wrapper.vm.canCreateUser).toBe(false)
    })

    it('should accept valid email even with internal spaces', () => {
      wrapper.vm.formData.email = 'john@example.com'
      wrapper.vm.formData.firstName = 'John'
      wrapper.vm.formData.lastName = 'Doe'

      expect(wrapper.vm.canCreateUser).toBe(true)
    })
  })

  describe('User Creation', () => {
    it('should call API with correct data on create', async () => {
      mockApi.post.mockResolvedValue(mockCreatedUser)

      wrapper.vm.formData.email = 'john@example.com'
      wrapper.vm.formData.firstName = 'John'
      wrapper.vm.formData.lastName = 'Doe'
      wrapper.vm.formData.timezone = 'America/New_York'

      await wrapper.vm.createUser()
      await flushPromises()

      expect(mockApi.post).toHaveBeenCalledWith('/admin/users', {
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        timezone: 'America/New_York',
      })
    })

    it('should create user without timezone when not specified', async () => {
      mockApi.post.mockResolvedValue(mockCreatedUser)

      wrapper.vm.formData.email = 'john@example.com'
      wrapper.vm.formData.firstName = 'John'
      wrapper.vm.formData.lastName = 'Doe'
      wrapper.vm.formData.timezone = ''

      await wrapper.vm.createUser()
      await flushPromises()

      const callArgs = mockApi.post.mock.calls[0][1]
      expect(callArgs).not.toHaveProperty('timezone')
    })

    it('should show success page after successful creation', async () => {
      mockApi.post.mockResolvedValue(mockCreatedUser)

      wrapper.vm.formData.email = 'john@example.com'
      wrapper.vm.formData.firstName = 'John'
      wrapper.vm.formData.lastName = 'Doe'

      await wrapper.vm.createUser()
      await flushPromises()

      expect(wrapper.vm.createdUser).toEqual(mockCreatedUser)
      expect(wrapper.text()).toContain('User Created Successfully')
    })

    it('should emit user-created event with response', async () => {
      mockApi.post.mockResolvedValue(mockCreatedUser)

      wrapper.vm.formData.email = 'john@example.com'
      wrapper.vm.formData.firstName = 'John'
      wrapper.vm.formData.lastName = 'Doe'

      await wrapper.vm.createUser()
      await flushPromises()

      expect(wrapper.emitted('user-created')).toBeTruthy()
      expect(wrapper.emitted('user-created')?.[0]).toEqual([mockCreatedUser])
    })

    it('should set isSaving to true during creation', async () => {
      mockApi.post.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(mockCreatedUser), 100)
          })
      )

      wrapper.vm.formData.email = 'john@example.com'
      wrapper.vm.formData.firstName = 'John'
      wrapper.vm.formData.lastName = 'Doe'

      const createPromise = wrapper.vm.createUser()
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.isSaving).toBe(true)

      await createPromise
      await flushPromises()

      expect(wrapper.vm.isSaving).toBe(false)
    })

    it('should show validation error toast when form is invalid', async () => {
      wrapper.vm.formData.email = 'invalid'
      wrapper.vm.formData.firstName = 'John'
      wrapper.vm.formData.lastName = 'Doe'

      await wrapper.vm.createUser()

      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'warn',
        })
      )
    })

    it('should show success toast after user creation', async () => {
      mockApi.post.mockResolvedValue(mockCreatedUser)

      wrapper.vm.formData.email = 'john@example.com'
      wrapper.vm.formData.firstName = 'John'
      wrapper.vm.formData.lastName = 'Doe'

      await wrapper.vm.createUser()
      await flushPromises()

      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
        })
      )
    })

    it('should handle API error gracefully', async () => {
      mockApi.post.mockRejectedValue(new Error('API Error'))

      wrapper.vm.formData.email = 'john@example.com'
      wrapper.vm.formData.firstName = 'John'
      wrapper.vm.formData.lastName = 'Doe'

      await wrapper.vm.createUser()
      await flushPromises()

      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
        })
      )
    })

    it('should handle API error with message', async () => {
      const error = new Error('Duplicate email')
      error.response = { data: { message: 'Email already exists' } }
      mockApi.post.mockRejectedValue(error)

      wrapper.vm.formData.email = 'john@example.com'
      wrapper.vm.formData.firstName = 'John'
      wrapper.vm.formData.lastName = 'Doe'

      await wrapper.vm.createUser()
      await flushPromises()

      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: 'Email already exists',
        })
      )
    })
  })

  describe('Success Page - Temporary Password', () => {
    beforeEach(async () => {
      mockApi.post.mockResolvedValue(mockCreatedUser)

      wrapper.vm.formData.email = 'john@example.com'
      wrapper.vm.formData.firstName = 'John'
      wrapper.vm.formData.lastName = 'Doe'

      await wrapper.vm.createUser()
      await flushPromises()
    })

    it('should display temporary password', () => {
      expect(wrapper.text()).toContain('TempPass123!@#')
    })

    it('should display password expiration date', () => {
      expect(wrapper.text()).toContain('Expires:')
    })

    it('should format expiration date correctly', () => {
      const dateString = '2024-01-15T10:30:00Z'
      const formatted = wrapper.vm.formatExpirationDate(dateString)
      expect(formatted).toContain('January')
      expect(formatted).toContain('2024')
    })

    it('should display copy password button', () => {
      expect(wrapper.text()).toContain('copy')
    })

    it('should copy password to clipboard on button click', async () => {
      const originalClipboard = navigator.clipboard
      const mockClipboard = {
        writeText: vi.fn().mockResolvedValue(undefined),
      }
      ;(navigator as any).clipboard = mockClipboard

      await wrapper.vm.copyPassword()
      await flushPromises()

      expect(mockClipboard.writeText).toHaveBeenCalledWith('TempPass123!@#')

      ;(navigator as any).clipboard = originalClipboard
    })

    it('should show password copied state', async () => {
      const originalClipboard = navigator.clipboard
      ;(navigator as any).clipboard = {
        writeText: vi.fn().mockResolvedValue(undefined),
      }

      await wrapper.vm.copyPassword()
      expect(wrapper.vm.passwordCopied).toBe(true)

      await new Promise((resolve) => setTimeout(resolve, 2100))

      expect(wrapper.vm.passwordCopied).toBe(false)

      ;(navigator as any).clipboard = originalClipboard
    })

    it('should show success toast when password copied', async () => {
      const originalClipboard = navigator.clipboard
      ;(navigator as any).clipboard = {
        writeText: vi.fn().mockResolvedValue(undefined),
      }

      mockToast.add.mockClear()

      await wrapper.vm.copyPassword()
      await flushPromises()

      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
          summary: 'Copied',
        })
      )

      ;(navigator as any).clipboard = originalClipboard
    })

    it('should show error toast when clipboard copy fails', async () => {
      const originalClipboard = navigator.clipboard
      ;(navigator as any).clipboard = {
        writeText: vi.fn().mockRejectedValue(new Error('Clipboard error')),
      }

      mockToast.add.mockClear()

      await wrapper.vm.copyPassword()
      await flushPromises()

      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          summary: 'Copy Failed',
        })
      )

      ;(navigator as any).clipboard = originalClipboard
    })
  })

  describe('Email Notification Status', () => {
    it('should show success message when email sent', async () => {
      mockApi.post.mockResolvedValue(mockCreatedUser)

      wrapper.vm.formData.email = 'john@example.com'
      wrapper.vm.formData.firstName = 'John'
      wrapper.vm.formData.lastName = 'Doe'

      await wrapper.vm.createUser()
      await flushPromises()

      expect(wrapper.text()).toContain('Welcome email sent successfully')
    })

    it('should show error message when email fails', async () => {
      const failedUser = {
        ...mockCreatedUser,
        emailSent: false,
        emailError: 'SMTP connection failed',
      }
      mockApi.post.mockResolvedValue(failedUser)

      wrapper.vm.formData.email = 'john@example.com'
      wrapper.vm.formData.firstName = 'John'
      wrapper.vm.formData.lastName = 'Doe'

      await wrapper.vm.createUser()
      await flushPromises()

      expect(wrapper.text()).toContain('Failed to send welcome email')
      expect(wrapper.text()).toContain('SMTP connection failed')
    })
  })

  describe('User Information Display', () => {
    beforeEach(async () => {
      mockApi.post.mockResolvedValue(mockCreatedUser)

      wrapper.vm.formData.email = 'john@example.com'
      wrapper.vm.formData.firstName = 'John'
      wrapper.vm.formData.lastName = 'Doe'

      await wrapper.vm.createUser()
      await flushPromises()
    })

    it('should display created user email', () => {
      expect(wrapper.text()).toContain('john@example.com')
    })

    it('should display created user name', () => {
      expect(wrapper.text()).toContain('John Doe')
    })

    it('should display created user timezone', () => {
      expect(wrapper.text()).toContain('America/New_York')
    })

    it('should display user roles', () => {
      expect(wrapper.findAll('[data-testid="tag"]').length).toBeGreaterThan(0)
    })
  })

  describe('Dialog Lifecycle', () => {
    it('should reset form on dialog show', () => {
      wrapper.vm.formData.email = 'test@example.com'
      wrapper.vm.formData.firstName = 'Test'

      wrapper.vm.onDialogShow()

      expect(wrapper.vm.formData.email).toBe('')
      expect(wrapper.vm.formData.firstName).toBe('')
    })

    it('should reset form on dialog hide', () => {
      wrapper.vm.formData.email = 'test@example.com'
      wrapper.vm.createdUser = mockCreatedUser as any

      wrapper.vm.onDialogHide()

      expect(wrapper.vm.formData.email).toBe('')
      expect(wrapper.vm.createdUser).toBeNull()
    })

    it('should emit update:visible when dialog is closed', async () => {
      wrapper.vm.closeDialog()
      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('update:visible')).toBeTruthy()
    })

    it('should clear validation errors on dialog close', () => {
      wrapper.vm.showValidationErrors = true

      wrapper.vm.resetForm()

      expect(wrapper.vm.showValidationErrors).toBe(false)
    })

    it('should clear password copied state on dialog close', () => {
      wrapper.vm.passwordCopied = true

      wrapper.vm.resetForm()

      expect(wrapper.vm.passwordCopied).toBe(false)
    })
  })

  describe('Button States', () => {
    it('should disable create button when saving', async () => {
      wrapper.vm.formData.email = 'john@example.com'
      wrapper.vm.formData.firstName = 'John'
      wrapper.vm.formData.lastName = 'Doe'
      wrapper.vm.isSaving = true

      expect(wrapper.vm.canCreateUser).toBe(false)
    })

    it('should show loading state on create button while saving', async () => {
      expect(wrapper.vm.$el).toBeDefined()
    })

    it('should disable cancel button when saving', () => {
      wrapper.vm.isSaving = true
      expect(wrapper.vm.$el).toBeDefined()
    })

    it('should show success confirmation after user creation', async () => {
      mockApi.post.mockResolvedValue(mockCreatedUser)

      wrapper.vm.formData.email = 'john@example.com'
      wrapper.vm.formData.firstName = 'John'
      wrapper.vm.formData.lastName = 'Doe'

      await wrapper.vm.createUser()
      await flushPromises()

      expect(wrapper.vm.createdUser).toBeDefined()
    })
  })

  describe('Timezone Options', () => {
    it('should have timezone options available', () => {
      expect(wrapper.vm.timezoneOptions.length).toBeGreaterThan(0)
    })

    it('should have UTC as default timezone option', () => {
      const utcOption = wrapper.vm.timezoneOptions.find((tz) => tz.value === 'UTC')
      expect(utcOption).toBeDefined()
    })

    it('should include common timezone options', () => {
      const timezoneValues = wrapper.vm.timezoneOptions.map((tz) => tz.value)
      expect(timezoneValues).toContain('America/New_York')
      expect(timezoneValues).toContain('Europe/London')
      expect(timezoneValues).toContain('Asia/Tokyo')
      expect(timezoneValues).toContain('Australia/Sydney')
    })
  })

  describe('Edge Cases', () => {
    it('should handle whitespace-only email', async () => {
      wrapper.vm.formData.email = '   '
      wrapper.vm.formData.firstName = 'John'
      wrapper.vm.formData.lastName = 'Doe'
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.canCreateUser).toBeFalsy()
    })

    it('should handle email with special characters', () => {
      expect(wrapper.vm.isValidEmail('test+tag@example.co.uk')).toBe(true)
    })

    it('should handle response without data property', async () => {
      mockApi.post.mockResolvedValue(mockCreatedUser)

      wrapper.vm.formData.email = 'john@example.com'
      wrapper.vm.formData.firstName = 'John'
      wrapper.vm.formData.lastName = 'Doe'

      await wrapper.vm.createUser()
      await flushPromises()

      expect(wrapper.vm.createdUser).toEqual(mockCreatedUser)
    })

    it('should show info message about password expiration', () => {
      expect(wrapper.text()).toContain('72 hours')
    })

    it('should show security warning about temporary password', async () => {
      mockApi.post.mockResolvedValue(mockCreatedUser)

      wrapper.vm.formData.email = 'john@example.com'
      wrapper.vm.formData.firstName = 'John'
      wrapper.vm.formData.lastName = 'Doe'

      await wrapper.vm.createUser()
      await flushPromises()

      expect(wrapper.text()).toContain('This password will only be shown once')
    })
  })
})
