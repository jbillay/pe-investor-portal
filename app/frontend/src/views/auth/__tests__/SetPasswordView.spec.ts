import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import SetPasswordView from '../SetPasswordView.vue'
import { useAuthStore } from '@stores/auth'
import type { Router } from 'vue-router'

// Mock router
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock password strength composable
vi.mock('@composables/usePasswordStrength', () => ({
  usePasswordStrength: () => ({
    requirements: {
      length: true,
      uppercase: true,
      lowercase: true,
      number: true,
      special: true,
    },
    strength: {
      label: 'Strong',
      color: 'text-success-600',
      bgColor: 'bg-success-600',
      percentage: 100,
    },
    meetsAllRequirements: { value: true },
    validatePassword: vi.fn(),
    checkPasswordMatch: vi.fn((pass1, pass2) => pass1 === pass2),
    cannotBeTemporaryPassword: vi.fn((newPass, tempPass) => newPass !== tempPass),
  }),
  getPasswordRequirementDescriptions: vi.fn(() => []),
}))

describe('SetPasswordView', () => {
  let wrapper: VueWrapper<any>
  let authStore: ReturnType<typeof useAuthStore>

  const createWrapper = (requiresPasswordChange = true) => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      initialState: {
        auth: {
          requiresPasswordChange,
          isLoading: false,
          error: null,
        },
      },
    })

    wrapper = mount(SetPasswordView, {
      global: {
        plugins: [pinia],
        stubs: {
          // Stub nothing to test the full component
        },
      },
    })

    authStore = useAuthStore()
    return wrapper
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render the set password form', () => {
      createWrapper()

      expect(wrapper.find('h2').text()).toBe('Set Your Password')
      expect(wrapper.find('input#tempPassword').exists()).toBe(true)
      expect(wrapper.find('input#newPassword').exists()).toBe(true)
      expect(wrapper.find('input#confirmPassword').exists()).toBe(true)
    })

    it('should display password requirements information', () => {
      createWrapper()

      expect(wrapper.text()).toContain('at least 12 characters long')
      expect(wrapper.text()).toContain('uppercase, lowercase, numbers, and special characters')
    })

    it('should render submit button', () => {
      createWrapper()

      const submitButton = wrapper.find('button[type="submit"]')
      expect(submitButton.exists()).toBe(true)
      expect(submitButton.text()).toContain('Set Password')
    })
  })

  describe('Form Validation', () => {
    it('should validate temporary password field on blur', async () => {
      createWrapper()

      const tempPasswordInput = wrapper.find('input#tempPassword')
      await tempPasswordInput.setValue('')
      await tempPasswordInput.trigger('blur')

      expect(wrapper.text()).toContain('Temporary password is required')
    })

    it('should validate new password field on blur', async () => {
      createWrapper()

      const newPasswordInput = wrapper.find('input#newPassword')
      await newPasswordInput.setValue('')
      await newPasswordInput.trigger('blur')

      expect(wrapper.text()).toContain('New password is required')
    })

    it('should validate confirm password field on blur', async () => {
      createWrapper()

      const confirmPasswordInput = wrapper.find('input#confirmPassword')
      await confirmPasswordInput.setValue('')
      await confirmPasswordInput.trigger('blur')

      expect(wrapper.text()).toContain('Please confirm your new password')
    })

    it('should show error when passwords do not match', async () => {
      createWrapper()

      const newPasswordInput = wrapper.find('input#newPassword')
      const confirmPasswordInput = wrapper.find('input#confirmPassword')

      await newPasswordInput.setValue('NewPassword123!@#')
      await confirmPasswordInput.setValue('DifferentPassword123!@#')
      await confirmPasswordInput.trigger('blur')

      expect(wrapper.text()).toContain('Passwords do not match')
    })

    it('should clear field error on input', async () => {
      createWrapper()

      const tempPasswordInput = wrapper.find('input#tempPassword')
      await tempPasswordInput.setValue('')
      await tempPasswordInput.trigger('blur')

      expect(wrapper.text()).toContain('Temporary password is required')

      await tempPasswordInput.setValue('TempPassword123')

      expect(authStore.clearError).toHaveBeenCalled()
    })
  })

  describe('Password Visibility Toggle', () => {
    it('should toggle temporary password visibility', async () => {
      createWrapper()

      const tempPasswordInput = wrapper.find('input#tempPassword')
      const toggleButton = wrapper.findAll('button[type="button"]')[0]

      expect(tempPasswordInput.attributes('type')).toBe('password')

      await toggleButton.trigger('click')
      expect(tempPasswordInput.attributes('type')).toBe('text')

      await toggleButton.trigger('click')
      expect(tempPasswordInput.attributes('type')).toBe('password')
    })

    it('should toggle new password visibility', async () => {
      createWrapper()

      const newPasswordInput = wrapper.find('input#newPassword')
      const toggleButton = wrapper.findAll('button[type="button"]')[1]

      expect(newPasswordInput.attributes('type')).toBe('password')

      await toggleButton.trigger('click')
      expect(newPasswordInput.attributes('type')).toBe('text')

      await toggleButton.trigger('click')
      expect(newPasswordInput.attributes('type')).toBe('password')
    })

    it('should toggle confirm password visibility', async () => {
      createWrapper()

      const confirmPasswordInput = wrapper.find('input#confirmPassword')
      const toggleButton = wrapper.findAll('button[type="button"]')[2]

      expect(confirmPasswordInput.attributes('type')).toBe('password')

      await toggleButton.trigger('click')
      expect(confirmPasswordInput.attributes('type')).toBe('text')

      await toggleButton.trigger('click')
      expect(confirmPasswordInput.attributes('type')).toBe('password')
    })
  })

  describe('Password Strength Indicator', () => {
    it('should show password strength indicator when new password is entered', async () => {
      createWrapper()

      const newPasswordInput = wrapper.find('input#newPassword')
      await newPasswordInput.setValue('StrongPassword123!@#')

      expect(wrapper.text()).toContain('Password Strength:')
      expect(wrapper.text()).toContain('Strong')
    })

    it('should not show password strength indicator when new password is empty', () => {
      createWrapper()

      expect(wrapper.text()).not.toContain('Password Strength:')
    })

    it('should show password requirements checklist when new password is entered', async () => {
      createWrapper()

      const newPasswordInput = wrapper.find('input#newPassword')
      await newPasswordInput.setValue('StrongPassword123!@#')

      expect(wrapper.text()).toContain('At least 12 characters')
      expect(wrapper.text()).toContain('One uppercase letter')
      expect(wrapper.text()).toContain('One lowercase letter')
      expect(wrapper.text()).toContain('One number')
      expect(wrapper.text()).toContain('One special character')
    })
  })

  describe('Form Submission', () => {
    it('should call authStore.setPassword on valid form submission', async () => {
      createWrapper()

      authStore.setPassword = vi.fn().mockResolvedValue(undefined)

      const tempPasswordInput = wrapper.find('input#tempPassword')
      const newPasswordInput = wrapper.find('input#newPassword')
      const confirmPasswordInput = wrapper.find('input#confirmPassword')

      await tempPasswordInput.setValue('TempPassword123!@#')
      await newPasswordInput.setValue('NewPassword123!@#')
      await confirmPasswordInput.setValue('NewPassword123!@#')

      const form = wrapper.find('form')
      await form.trigger('submit.prevent')

      expect(authStore.setPassword).toHaveBeenCalledWith({
        tempPassword: 'TempPassword123!@#',
        newPassword: 'NewPassword123!@#',
        confirmPassword: 'NewPassword123!@#',
      })
    })

    it('should redirect to dashboard after successful password change', async () => {
      createWrapper()

      authStore.setPassword = vi.fn().mockResolvedValue(undefined)

      const tempPasswordInput = wrapper.find('input#tempPassword')
      const newPasswordInput = wrapper.find('input#newPassword')
      const confirmPasswordInput = wrapper.find('input#confirmPassword')

      await tempPasswordInput.setValue('TempPassword123!@#')
      await newPasswordInput.setValue('NewPassword123!@#')
      await confirmPasswordInput.setValue('NewPassword123!@#')

      const form = wrapper.find('form')
      await form.trigger('submit.prevent')

      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(mockPush).toHaveBeenCalledWith('/')
    })

    it('should not submit form when validation fails', async () => {
      createWrapper()

      authStore.setPassword = vi.fn()

      const form = wrapper.find('form')
      await form.trigger('submit.prevent')

      expect(authStore.setPassword).not.toHaveBeenCalled()
    })

    it('should disable submit button when loading', async () => {
      createWrapper()

      authStore.isLoading = true
      await wrapper.vm.$nextTick()

      const submitButton = wrapper.find('button[type="submit"]')
      expect(submitButton.attributes('disabled')).toBeDefined()
    })

    it('should show loading state on submit button when loading', async () => {
      createWrapper()

      authStore.isLoading = true
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Setting password...')
    })
  })

  describe('Error Handling', () => {
    it('should display error message when authStore has error', async () => {
      createWrapper()

      authStore.error = 'Invalid temporary password'
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Failed to set password')
      expect(wrapper.text()).toContain('Invalid temporary password')
    })

    it('should handle password setting error', async () => {
      createWrapper()

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      authStore.setPassword = vi.fn().mockRejectedValue(new Error('Network error'))

      const tempPasswordInput = wrapper.find('input#tempPassword')
      const newPasswordInput = wrapper.find('input#newPassword')
      const confirmPasswordInput = wrapper.find('input#confirmPassword')

      await tempPasswordInput.setValue('TempPassword123!@#')
      await newPasswordInput.setValue('NewPassword123!@#')
      await confirmPasswordInput.setValue('NewPassword123!@#')

      const form = wrapper.find('form')
      await form.trigger('submit.prevent')

      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(consoleErrorSpy).toHaveBeenCalled()
      consoleErrorSpy.mockRestore()
    })
  })

  describe('Component Lifecycle', () => {
    it('should clear errors on mount', () => {
      createWrapper()

      expect(authStore.clearError).toHaveBeenCalled()
    })

    it('should redirect to home if user does not require password change', () => {
      createWrapper(false)

      expect(mockPush).toHaveBeenCalledWith('/')
    })

    it('should not redirect if user requires password change', () => {
      createWrapper(true)

      // Should not redirect on mount when password change is required
      // The push call count should be 0 initially
      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('Form Field Interactions', () => {
    it('should re-validate confirm password when new password changes', async () => {
      createWrapper()

      const newPasswordInput = wrapper.find('input#newPassword')
      const confirmPasswordInput = wrapper.find('input#confirmPassword')

      await confirmPasswordInput.setValue('Password123!@#')
      await confirmPasswordInput.trigger('blur')

      await newPasswordInput.setValue('DifferentPassword123!@#')
      await newPasswordInput.trigger('input')

      // Confirm password should be re-validated
      expect(wrapper.text()).toContain('Passwords do not match')
    })

    it('should clear error and re-validate confirm password on new password blur', async () => {
      createWrapper()

      const newPasswordInput = wrapper.find('input#newPassword')
      const confirmPasswordInput = wrapper.find('input#confirmPassword')

      await confirmPasswordInput.setValue('Password123!@#')
      await newPasswordInput.setValue('Password123!@#')
      await newPasswordInput.trigger('blur')

      // Should re-validate confirm password if it's filled
      await wrapper.vm.$nextTick()

      // No error should be shown as passwords match
      expect(wrapper.text()).not.toContain('Passwords do not match')
    })
  })

  describe('Accessibility', () => {
    it('should have proper labels for all input fields', () => {
      createWrapper()

      expect(wrapper.find('label[for="tempPassword"]').text()).toContain('Temporary Password')
      expect(wrapper.find('label[for="newPassword"]').text()).toContain('New Password')
      expect(wrapper.find('label[for="confirmPassword"]').text()).toContain('Confirm New Password')
    })

    it('should have required attribute on all password fields', () => {
      createWrapper()

      expect(wrapper.find('input#tempPassword').attributes('required')).toBeDefined()
      expect(wrapper.find('input#newPassword').attributes('required')).toBeDefined()
      expect(wrapper.find('input#confirmPassword').attributes('required')).toBeDefined()
    })

    it('should have appropriate autocomplete attributes', () => {
      createWrapper()

      expect(wrapper.find('input#tempPassword').attributes('autocomplete')).toBe('current-password')
      expect(wrapper.find('input#newPassword').attributes('autocomplete')).toBe('new-password')
      expect(wrapper.find('input#confirmPassword').attributes('autocomplete')).toBe('new-password')
    })
  })
})
