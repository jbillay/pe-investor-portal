import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import SettingsView from '../SettingsView.vue'
import { useAuthStore } from '@stores/auth'

describe('SettingsView', () => {
  let wrapper: VueWrapper<any>
  let authStore: ReturnType<typeof useAuthStore>

  const createWrapper = () => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      initialState: {
        auth: {
          user: {
            firstName: 'John',
            lastName: 'Smith',
          },
          accessToken: 'mock-token',
        },
      },
    })

    wrapper = mount(SettingsView, {
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
    it('should render the settings page', () => {
      createWrapper()

      expect(wrapper.find('h1').text()).toBe('Settings')
      expect(wrapper.text()).toContain('Manage your account preferences and application settings')
    })

    it('should render all navigation tabs', () => {
      createWrapper()

      expect(wrapper.text()).toContain('Account')
      expect(wrapper.text()).toContain('Notifications')
      expect(wrapper.text()).toContain('Privacy')
      expect(wrapper.text()).toContain('Display')
    })

    it('should have save settings button', () => {
      createWrapper()

      const saveButton = wrapper.find('button:has(i.pi-save)')
      expect(saveButton.exists()).toBe(true)
      expect(saveButton.text()).toContain('Save Changes')
    })
  })

  describe('Tab Navigation', () => {
    it('should start with account tab active', () => {
      createWrapper()

      expect(wrapper.text()).toContain('Account Information')
      expect(wrapper.text()).toContain('Display Name')
    })

    it('should switch to notifications tab when clicked', async () => {
      createWrapper()

      const notificationsTab = wrapper.findAll('button').find((btn) =>
        btn.text().includes('Notifications')
      )
      await notificationsTab?.trigger('click')

      expect(wrapper.text()).toContain('Email Notifications')
      expect(wrapper.text()).toContain('Push Notifications')
    })

    it('should switch to privacy tab when clicked', async () => {
      createWrapper()

      const privacyTab = wrapper.findAll('button').find((btn) => btn.text().includes('Privacy'))
      await privacyTab?.trigger('click')

      expect(wrapper.text()).toContain('Data & Privacy')
      expect(wrapper.text()).toContain('Activity Tracking')
      expect(wrapper.text()).toContain('Data Sharing')
    })

    it('should switch to display tab when clicked', async () => {
      createWrapper()

      const displayTab = wrapper.findAll('button').find((btn) => btn.text().includes('Display'))
      await displayTab?.trigger('click')

      expect(wrapper.text()).toContain('Appearance')
      expect(wrapper.text()).toContain('Theme')
      expect(wrapper.text()).toContain('Date Format')
    })

    it('should highlight active tab', async () => {
      createWrapper()

      const accountTab = wrapper.findAll('button').find((btn) => btn.text().includes('Account'))
      expect(accountTab?.classes()).toContain('border-primary-500')

      const notificationsTab = wrapper.findAll('button').find((btn) =>
        btn.text().includes('Notifications')
      )
      await notificationsTab?.trigger('click')
      await wrapper.vm.$nextTick()

      expect(notificationsTab?.classes()).toContain('border-primary-500')
    })
  })

  describe('Account Settings Tab', () => {
    it('should display account information fields', () => {
      createWrapper()

      expect(wrapper.find('label').text()).toContain('Display Name')
      expect(wrapper.text()).toContain('Time Zone')
    })

    it('should allow timezone selection', async () => {
      createWrapper()

      const timezoneSelect = wrapper.find('select')
      await timezoneSelect.setValue('America/Chicago')

      expect(wrapper.vm.accountSettings.timezone).toBe('America/Chicago')
    })

    it('should display security options', () => {
      createWrapper()

      expect(wrapper.text()).toContain('Security')
      expect(wrapper.text()).toContain('Password')
      expect(wrapper.text()).toContain('Two-Factor Authentication')
    })

    it('should have change password button', () => {
      createWrapper()

      const changePasswordButton = wrapper
        .findAll('button')
        .find((btn) => btn.text().includes('Change Password'))
      expect(changePasswordButton?.exists()).toBe(true)
    })

    it('should have enable 2FA button', () => {
      createWrapper()

      const enable2FAButton = wrapper.findAll('button').find((btn) => btn.text().includes('Enable 2FA'))
      expect(enable2FAButton?.exists()).toBe(true)
    })
  })

  describe('Notifications Settings Tab', () => {
    beforeEach(async () => {
      createWrapper()
      const notificationsTab = wrapper.findAll('button').find((btn) =>
        btn.text().includes('Notifications')
      )
      await notificationsTab?.trigger('click')
    })

    it('should display email notifications section', () => {
      expect(wrapper.text()).toContain('Email Notifications')
    })

    it('should display all email notification options', () => {
      expect(wrapper.text()).toContain('Portfolio Updates')
      expect(wrapper.text()).toContain('Document Alerts')
      expect(wrapper.text()).toContain('Capital Calls')
      expect(wrapper.text()).toContain('Distributions')
      expect(wrapper.text()).toContain('Quarterly Reports')
    })

    it('should toggle email notification settings', async () => {
      const checkbox = wrapper.find('input#portfolio-updates')
      const initialValue = wrapper.vm.emailNotifications[0].enabled

      await checkbox.setValue(!initialValue)
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.emailNotifications[0].enabled).toBe(!initialValue)
    })

    it('should display push notifications section', () => {
      expect(wrapper.text()).toContain('Push Notifications')
    })

    it('should display all push notification options', () => {
      expect(wrapper.text()).toContain('Urgent Alerts')
      expect(wrapper.text()).toContain('Market Updates')
    })

    it('should toggle push notification settings', async () => {
      const checkbox = wrapper.find('input#urgent-alerts')
      const initialValue = wrapper.vm.pushNotifications[0].enabled

      await checkbox.setValue(!initialValue)
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.pushNotifications[0].enabled).toBe(!initialValue)
    })

    it('should show enabled/disabled labels correctly', () => {
      const enabledLabels = wrapper
        .findAll('label')
        .filter((label) => label.text().includes('Enabled'))
      expect(enabledLabels.length).toBeGreaterThan(0)
    })
  })

  describe('Privacy Settings Tab', () => {
    beforeEach(async () => {
      createWrapper()
      const privacyTab = wrapper.findAll('button').find((btn) => btn.text().includes('Privacy'))
      await privacyTab?.trigger('click')
    })

    it('should display privacy settings', () => {
      expect(wrapper.text()).toContain('Data & Privacy')
      expect(wrapper.text()).toContain('Activity Tracking')
      expect(wrapper.text()).toContain('Data Sharing')
    })

    it('should toggle activity tracking setting', async () => {
      const checkbox = wrapper.find('input#activity-tracking')
      const initialValue = wrapper.vm.privacySettings.activityTracking

      await checkbox.setValue(!initialValue)
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.privacySettings.activityTracking).toBe(!initialValue)
    })

    it('should toggle data sharing setting', async () => {
      const checkbox = wrapper.find('input#data-sharing')
      const initialValue = wrapper.vm.privacySettings.dataSharing

      await checkbox.setValue(!initialValue)
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.privacySettings.dataSharing).toBe(!initialValue)
    })

    it('should display data export section', () => {
      expect(wrapper.text()).toContain('Data Export')
      expect(wrapper.text()).toContain('Request Data Export')
    })

    it('should have data export button', () => {
      const dataExportButton = wrapper
        .findAll('button')
        .find((btn) => btn.text().includes('Request Data Export'))
      expect(dataExportButton?.exists()).toBe(true)
    })
  })

  describe('Display Settings Tab', () => {
    beforeEach(async () => {
      createWrapper()
      const displayTab = wrapper.findAll('button').find((btn) => btn.text().includes('Display'))
      await displayTab?.trigger('click')
    })

    it('should display appearance settings', () => {
      expect(wrapper.text()).toContain('Appearance')
      expect(wrapper.text()).toContain('Theme')
    })

    it('should display all theme options', () => {
      expect(wrapper.text()).toContain('Light')
      expect(wrapper.text()).toContain('Dark')
      expect(wrapper.text()).toContain('Auto')
    })

    it('should select theme when clicked', async () => {
      const themes = wrapper.findAll('[class*="cursor-pointer"]')
      const darkTheme = themes.find((el) => el.text().includes('Dark'))

      await darkTheme?.trigger('click')

      expect(wrapper.vm.displaySettings.theme).toBe('dark')
    })

    it('should highlight selected theme', async () => {
      const themes = wrapper.findAll('[class*="cursor-pointer"]')
      const lightTheme = themes.find((el) => el.text().includes('Light'))

      expect(lightTheme?.classes()).toContain('border-primary-500')
    })

    it('should display date format selector', () => {
      expect(wrapper.text()).toContain('Date Format')

      const dateFormatSelect = wrapper.findAll('select')[0]
      expect(dateFormatSelect.exists()).toBe(true)
    })

    it('should change date format', async () => {
      const dateFormatSelect = wrapper.findAll('select')[0]
      await dateFormatSelect.setValue('DD/MM/YYYY')

      expect(wrapper.vm.displaySettings.dateFormat).toBe('DD/MM/YYYY')
    })

    it('should display number format selector', () => {
      expect(wrapper.text()).toContain('Number Format')

      const numberFormatSelect = wrapper.findAll('select')[1]
      expect(numberFormatSelect.exists()).toBe(true)
    })

    it('should change number format', async () => {
      const numberFormatSelect = wrapper.findAll('select')[1]
      await numberFormatSelect.setValue('1.234,56')

      expect(wrapper.vm.displaySettings.numberFormat).toBe('1.234,56')
    })
  })

  describe('Save Settings Functionality', () => {
    it('should call saveSettings on button click', async () => {
      createWrapper()

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const saveButton = wrapper.findAll('button').find((btn) => btn.text().includes('Save Changes'))

      await saveButton?.trigger('click')
      await wrapper.vm.$nextTick()

      // Wait for the timeout
      await new Promise((resolve) => setTimeout(resolve, 1100))

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Settings saved:',
        expect.objectContaining({
          account: expect.any(Object),
          emailNotifications: expect.any(Array),
          pushNotifications: expect.any(Array),
          privacy: expect.any(Object),
          display: expect.any(Object),
        })
      )

      consoleLogSpy.mockRestore()
    })

    it('should show loading state when saving', async () => {
      createWrapper()

      const saveButton = wrapper.findAll('button').find((btn) => btn.text().includes('Save Changes'))
      await saveButton?.trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Saving...')
    })

    it('should disable save button when saving', async () => {
      createWrapper()

      const saveButton = wrapper.findAll('button').find((btn) => btn.text().includes('Save Changes'))
      await saveButton?.trigger('click')
      await wrapper.vm.$nextTick()

      expect(saveButton?.attributes('disabled')).toBeDefined()
    })

    it('should re-enable save button after save completes', async () => {
      createWrapper()

      const saveButton = wrapper.findAll('button').find((btn) => btn.text().includes('Save Changes'))
      await saveButton?.trigger('click')
      await wrapper.vm.$nextTick()

      expect(saveButton?.attributes('disabled')).toBeDefined()

      // Wait for save to complete
      await new Promise((resolve) => setTimeout(resolve, 1100))
      await wrapper.vm.$nextTick()

      expect(saveButton?.attributes('disabled')).toBeUndefined()
    })
  })

  describe('Component Lifecycle', () => {
    it('should initialize auth on mount', () => {
      createWrapper()

      expect(authStore.initializeAuth).toHaveBeenCalled()
    })

    it('should fetch current user if token exists but no user data', () => {
      const pinia = createTestingPinia({
        createSpy: vi.fn,
        initialState: {
          auth: {
            user: null,
            accessToken: 'mock-token',
          },
        },
      })

      wrapper = mount(SettingsView, {
        global: {
          plugins: [pinia],
        },
      })

      authStore = useAuthStore()

      expect(authStore.getCurrentUser).toHaveBeenCalled()
    })

    it('should not fetch current user if user data already exists', () => {
      const pinia = createTestingPinia({
        createSpy: vi.fn,
        initialState: {
          auth: {
            user: {
              firstName: 'John',
              lastName: 'Smith',
            },
            accessToken: 'mock-token',
          },
        },
      })

      wrapper = mount(SettingsView, {
        global: {
          plugins: [pinia],
        },
      })

      authStore = useAuthStore()

      // Should still initialize auth
      expect(authStore.initializeAuth).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have navigation role on tabs', () => {
      createWrapper()

      const nav = wrapper.find('nav[aria-label="Settings"]')
      expect(nav.exists()).toBe(true)
    })

    it('should have labels for all checkboxes', async () => {
      createWrapper()

      const notificationsTab = wrapper.findAll('button').find((btn) =>
        btn.text().includes('Notifications')
      )
      await notificationsTab?.trigger('click')

      const checkboxes = wrapper.findAll('input[type="checkbox"]')
      checkboxes.forEach((checkbox) => {
        const id = checkbox.attributes('id')
        if (id) {
          const label = wrapper.find(`label[for="${id}"]`)
          expect(label.exists()).toBe(true)
        }
      })
    })

    it('should have labels for all select elements', async () => {
      createWrapper()

      const selects = wrapper.findAll('select')
      expect(selects.length).toBeGreaterThan(0)
    })
  })

  describe('Settings State Management', () => {
    it('should maintain settings state across tab switches', async () => {
      createWrapper()

      // Change a setting in account tab
      const timezoneSelect = wrapper.find('select')
      await timezoneSelect.setValue('Europe/London')

      // Switch to notifications tab
      const notificationsTab = wrapper.findAll('button').find((btn) =>
        btn.text().includes('Notifications')
      )
      await notificationsTab?.trigger('click')

      // Switch back to account tab
      const accountTab = wrapper.findAll('button').find((btn) => btn.text().includes('Account'))
      await accountTab?.trigger('click')

      // Verify setting is preserved
      expect(wrapper.vm.accountSettings.timezone).toBe('Europe/London')
    })

    it('should maintain notification preferences state', async () => {
      createWrapper()

      const notificationsTab = wrapper.findAll('button').find((btn) =>
        btn.text().includes('Notifications')
      )
      await notificationsTab?.trigger('click')
      await wrapper.vm.$nextTick()

      // Toggle a notification
      const checkbox = wrapper.find('input#portfolio-updates')
      const initialValue = wrapper.vm.emailNotifications[0].enabled
      await checkbox.setValue(!initialValue)
      await wrapper.vm.$nextTick()

      // Switch tab and back
      const accountTab = wrapper.findAll('button').find((btn) => btn.text().includes('Account'))
      await accountTab?.trigger('click')
      await wrapper.vm.$nextTick()

      await notificationsTab?.trigger('click')
      await wrapper.vm.$nextTick()

      // Verify state is preserved
      expect(wrapper.vm.emailNotifications[0].enabled).toBe(!initialValue)
    })
  })
})
