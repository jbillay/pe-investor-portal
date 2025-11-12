import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import ProfileView from '../ProfileView.vue'
import { useAuthStore } from '@stores/auth'

describe('ProfileView', () => {
  let wrapper: VueWrapper<any>
  let authStore: ReturnType<typeof useAuthStore>

  const mockUser = {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    role: 'ADMIN',
    isActive: true,
    tenantId: 'tenant-123',
    createdAt: '2024-01-01T10:00:00Z',
    lastLoginAt: '2024-11-12T08:00:00Z',
  }

  const createWrapper = (user = mockUser) => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      initialState: {
        auth: {
          user,
        },
      },
    })

    wrapper = mount(ProfileView, {
      global: {
        plugins: [pinia],
      },
    })

    authStore = useAuthStore()
    return wrapper
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render the profile settings page', () => {
      createWrapper()

      expect(wrapper.find('h1').text()).toBe('Profile Settings')
      expect(wrapper.text()).toContain('Manage your personal information and account preferences')
    })

    it('should display user initials', () => {
      createWrapper()

      authStore.userInitials = 'JD'
      wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('JD')
    })

    it('should render all form fields', () => {
      createWrapper()

      expect(wrapper.find('input#firstName').exists()).toBe(true)
      expect(wrapper.find('input#lastName').exists()).toBe(true)
      expect(wrapper.find('input#email').exists()).toBe(true)
      expect(wrapper.find('input#role').exists()).toBe(true)
    })

    it('should populate form fields with user data', async () => {
      createWrapper()

      await wrapper.vm.$nextTick()

      expect(wrapper.find('input#firstName').element.value).toBe('John')
      expect(wrapper.find('input#lastName').element.value).toBe('Doe')
      expect(wrapper.find('input#email').element.value).toBe('john.doe@example.com')
    })

    it('should display role as read-only', () => {
      createWrapper()

      const roleInput = wrapper.find('input#role')
      expect(roleInput.attributes('readonly')).toBeDefined()
      expect(roleInput.element.value).toBe('ADMIN')
    })
  })

  describe('Account Information Display', () => {
    it('should display member since date', () => {
      createWrapper()

      expect(wrapper.text()).toContain('Member Since')
      expect(wrapper.text()).toContain('January 1, 2024')
    })

    it('should display last login date', () => {
      createWrapper()

      expect(wrapper.text()).toContain('Last Login')
      expect(wrapper.text()).toContain('November 12, 2024')
    })

    it('should display N/A for null last login', () => {
      const userWithoutLastLogin = { ...mockUser, lastLoginAt: undefined }
      createWrapper(userWithoutLastLogin)

      expect(wrapper.text()).toContain('Last Login')
      expect(wrapper.text()).toContain('N/A')
    })

    it('should display organization/tenant ID', () => {
      createWrapper()

      expect(wrapper.text()).toContain('Organization')
      expect(wrapper.text()).toContain('tenant-123')
    })

    it('should display active account status', () => {
      createWrapper()

      expect(wrapper.text()).toContain('Account Status')
      expect(wrapper.text()).toContain('Active')
    })

    it('should display inactive account status', async () => {
      const inactiveUser = { ...mockUser, isActive: false }
      createWrapper(inactiveUser)

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Inactive')
    })
  })

  describe('Form Validation', () => {
    it('should validate required first name', async () => {
      createWrapper()

      const firstNameInput = wrapper.find('input#firstName')
      await firstNameInput.setValue('')

      const form = wrapper.find('form')
      await form.trigger('submit.prevent')

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('First name is required')
    })

    it('should validate required last name', async () => {
      createWrapper()

      const lastNameInput = wrapper.find('input#lastName')
      await lastNameInput.setValue('')

      const form = wrapper.find('form')
      await form.trigger('submit.prevent')

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Last name is required')
    })

    it('should validate required email', async () => {
      createWrapper()

      const emailInput = wrapper.find('input#email')
      await emailInput.setValue('')

      const form = wrapper.find('form')
      await form.trigger('submit.prevent')

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Email is required')
    })

    it('should validate email format', async () => {
      createWrapper()

      const emailInput = wrapper.find('input#email')
      await emailInput.setValue('invalid-email')

      const form = wrapper.find('form')
      await form.trigger('submit.prevent')

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Please enter a valid email address')
    })

    it('should accept valid email format', async () => {
      createWrapper()

      authStore.updateProfile = vi.fn().mockResolvedValue(undefined)

      const emailInput = wrapper.find('input#email')
      await emailInput.setValue('valid.email@example.com')

      const form = wrapper.find('form')
      await form.trigger('submit.prevent')

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).not.toContain('Please enter a valid email address')
    })
  })

  describe('Form Changes Detection', () => {
    it('should detect changes in form fields', async () => {
      createWrapper()

      const firstNameInput = wrapper.find('input#firstName')
      await firstNameInput.setValue('Jane')

      await wrapper.vm.$nextTick()

      const submitButton = wrapper.find('button[type="submit"]')
      expect(submitButton.attributes('disabled')).toBeUndefined()
    })

    it('should disable submit button when no changes', async () => {
      createWrapper()

      await wrapper.vm.$nextTick()

      const submitButton = wrapper.find('button[type="submit"]')
      expect(submitButton.attributes('disabled')).toBeDefined()
    })

    it('should enable submit button when changes are made', async () => {
      createWrapper()

      const emailInput = wrapper.find('input#email')
      await emailInput.setValue('new.email@example.com')

      await wrapper.vm.$nextTick()

      const submitButton = wrapper.find('button[type="submit"]')
      expect(submitButton.attributes('disabled')).toBeUndefined()
    })
  })

  describe('Form Submission', () => {
    it('should call authStore.updateProfile on valid form submission', async () => {
      createWrapper()

      authStore.updateProfile = vi.fn().mockResolvedValue(undefined)

      const firstNameInput = wrapper.find('input#firstName')
      await firstNameInput.setValue('Jane')

      const form = wrapper.find('form')
      await form.trigger('submit.prevent')

      await wrapper.vm.$nextTick()

      expect(authStore.updateProfile).toHaveBeenCalledWith({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'john.doe@example.com',
      })
    })

    it('should show success message on successful update', async () => {
      createWrapper()

      authStore.updateProfile = vi.fn().mockResolvedValue(undefined)

      const firstNameInput = wrapper.find('input#firstName')
      await firstNameInput.setValue('Jane')

      const form = wrapper.find('form')
      await form.trigger('submit.prevent')

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Profile updated successfully!')
    })

    it('should show loading state during submission', async () => {
      createWrapper()

      authStore.updateProfile = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      )

      const firstNameInput = wrapper.find('input#firstName')
      await firstNameInput.setValue('Jane')

      const form = wrapper.find('form')
      await form.trigger('submit.prevent')

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Saving...')
    })

    it('should handle update errors', async () => {
      createWrapper()

      const errorMessage = 'Email already exists'
      authStore.updateProfile = vi.fn().mockRejectedValue({
        response: { data: { message: errorMessage } },
      })

      const emailInput = wrapper.find('input#email')
      await emailInput.setValue('existing@example.com')

      const form = wrapper.find('form')
      await form.trigger('submit.prevent')

      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(wrapper.text()).toContain(errorMessage)
    })

    it('should show generic error message when no specific message provided', async () => {
      createWrapper()

      authStore.updateProfile = vi.fn().mockRejectedValue(new Error('Network error'))

      const emailInput = wrapper.find('input#email')
      await emailInput.setValue('new@example.com')

      const form = wrapper.find('form')
      await form.trigger('submit.prevent')

      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(wrapper.text()).toContain('Failed to update profile')
    })

    it('should trim whitespace from form fields before submission', async () => {
      createWrapper()

      authStore.updateProfile = vi.fn().mockResolvedValue(undefined)

      const firstNameInput = wrapper.find('input#firstName')
      await firstNameInput.setValue('  Jane  ')

      const form = wrapper.find('form')
      await form.trigger('submit.prevent')

      await wrapper.vm.$nextTick()

      expect(authStore.updateProfile).toHaveBeenCalledWith({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'john.doe@example.com',
      })
    })

    it('should not submit form with validation errors', async () => {
      createWrapper()

      authStore.updateProfile = vi.fn()

      const emailInput = wrapper.find('input#email')
      await emailInput.setValue('invalid-email')

      const form = wrapper.find('form')
      await form.trigger('submit.prevent')

      await wrapper.vm.$nextTick()

      expect(authStore.updateProfile).not.toHaveBeenCalled()
    })
  })

  describe('Reset Functionality', () => {
    it('should reset form to original values', async () => {
      createWrapper()

      const firstNameInput = wrapper.find('input#firstName')
      await firstNameInput.setValue('Jane')

      const resetButton = wrapper.find('button[type="button"]')
      await resetButton.trigger('click')

      await wrapper.vm.$nextTick()

      expect(firstNameInput.element.value).toBe('John')
    })

    it('should clear errors on reset', async () => {
      createWrapper()

      const emailInput = wrapper.find('input#email')
      await emailInput.setValue('invalid')

      const form = wrapper.find('form')
      await form.trigger('submit.prevent')

      await wrapper.vm.$nextTick()

      const resetButton = wrapper.find('button[type="button"]')
      await resetButton.trigger('click')

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).not.toContain('Please enter a valid email address')
    })

    it('should clear messages on reset', async () => {
      createWrapper()

      authStore.updateProfile = vi.fn().mockResolvedValue(undefined)

      const firstNameInput = wrapper.find('input#firstName')
      await firstNameInput.setValue('Jane')

      const form = wrapper.find('form')
      await form.trigger('submit.prevent')

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Profile updated successfully!')

      const resetButton = wrapper.find('button[type="button"]')
      await resetButton.trigger('click')

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).not.toContain('Profile updated successfully!')
    })
  })

  describe('Component Lifecycle', () => {
    it('should initialize form with user data on mount', () => {
      createWrapper()

      const firstNameInput = wrapper.find('input#firstName')
      expect(firstNameInput.element.value).toBe('John')
    })

    it('should watch for user changes and update form', async () => {
      createWrapper()

      const newUser = {
        ...mockUser,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
      }

      authStore.user = newUser
      await wrapper.vm.$nextTick()

      const firstNameInput = wrapper.find('input#firstName')
      const lastNameInput = wrapper.find('input#lastName')
      const emailInput = wrapper.find('input#email')

      expect(firstNameInput.element.value).toBe('Jane')
      expect(lastNameInput.element.value).toBe('Smith')
      expect(emailInput.element.value).toBe('jane.smith@example.com')
    })

    it('should handle null user gracefully', () => {
      createWrapper(null as any)

      expect(wrapper.find('input#firstName').element.value).toBe('')
    })
  })

  describe('Message Auto-Hide', () => {
    it('should auto-hide success message after 5 seconds', async () => {
      vi.useFakeTimers()

      createWrapper()

      authStore.updateProfile = vi.fn().mockResolvedValue(undefined)

      const firstNameInput = wrapper.find('input#firstName')
      await firstNameInput.setValue('Jane')

      const form = wrapper.find('form')
      await form.trigger('submit.prevent')

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Profile updated successfully!')

      vi.advanceTimersByTime(5000)
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).not.toContain('Profile updated successfully!')

      vi.useRealTimers()
    })
  })

  describe('Accessibility', () => {
    it('should have proper labels for all input fields', () => {
      createWrapper()

      expect(wrapper.find('label[for="firstName"]').text()).toContain('First Name')
      expect(wrapper.find('label[for="lastName"]').text()).toContain('Last Name')
      expect(wrapper.find('label[for="email"]').text()).toContain('Email Address')
      expect(wrapper.find('label[for="role"]').text()).toContain('Role')
    })

    it('should have required attribute on editable fields', () => {
      createWrapper()

      expect(wrapper.find('input#firstName').attributes('required')).toBeDefined()
      expect(wrapper.find('input#lastName').attributes('required')).toBeDefined()
      expect(wrapper.find('input#email').attributes('required')).toBeDefined()
    })

    it('should have appropriate input types', () => {
      createWrapper()

      expect(wrapper.find('input#firstName').attributes('type')).toBe('text')
      expect(wrapper.find('input#lastName').attributes('type')).toBe('text')
      expect(wrapper.find('input#email').attributes('type')).toBe('email')
    })
  })

  describe('Date Formatting', () => {
    it('should format dates correctly', () => {
      createWrapper()

      // The exact format might vary based on locale, but should contain the date parts
      const text = wrapper.text()
      expect(text).toMatch(/January.*1.*2024/)
      expect(text).toMatch(/November.*12.*2024/)
    })

    it('should handle null dates', () => {
      const userWithNullDates = {
        ...mockUser,
        createdAt: undefined,
        lastLoginAt: undefined,
      }
      createWrapper(userWithNullDates)

      // Should not throw errors
      expect(wrapper.text()).toBeTruthy()
    })
  })
})
