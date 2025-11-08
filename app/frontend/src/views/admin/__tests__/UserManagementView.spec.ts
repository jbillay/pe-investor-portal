import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import UserManagementView from '../UserManagementView.vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'

// Mock vue-router
vi.mock('vue-router', () => ({
  useRouter: vi.fn(),
}))

// Mock PrimeVue toast
vi.mock('primevue/usetoast', () => ({
  useToast: vi.fn(),
}))

// Mock child components
vi.mock('@/components/admin/AdminNavigation.vue', () => ({
  default: { name: 'AdminNavigation', template: '<div data-testid="admin-navigation"></div>' },
}))

vi.mock('@/components/admin/UserManagementPanel.vue', () => ({
  default: {
    name: 'UserManagementPanel',
    template: '<div data-testid="user-management-panel"></div>',
    methods: {
      refreshData: vi.fn(),
      updateUserRole: vi.fn(),
    },
  },
}))

vi.mock('@/components/admin/UserCreateDialog.vue', () => ({
  default: { name: 'UserCreateDialog', template: '<div data-testid="user-create-dialog"></div>' },
}))

vi.mock('@/components/admin/RoleManagementDialog.vue', () => ({
  default: { name: 'RoleManagementDialog', template: '<div data-testid="role-management-dialog"></div>' },
}))

vi.mock('@/components/admin/BulkOperationsDialog.vue', () => ({
  default: { name: 'BulkOperationsDialog', template: '<div data-testid="bulk-operations-dialog"></div>' },
}))

vi.mock('@/components/admin/UserEditDialog.vue', () => ({
  default: { name: 'UserEditDialog', template: '<div data-testid="user-edit-dialog"></div>' },
}))

describe('UserManagementView', () => {
  let wrapper: VueWrapper
  let mockRouter: any
  let mockToast: any

  beforeEach(() => {
    mockRouter = {
      push: vi.fn(),
    }
    vi.mocked(useRouter).mockReturnValue(mockRouter)

    mockToast = {
      add: vi.fn(),
    }
    vi.mocked(useToast).mockReturnValue(mockToast)
  })

  const mountComponent = () => {
    return mount(UserManagementView, {
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
        stubs: {
          Breadcrumb: true,
          Button: {
            template: '<button @click="$emit(\'click\')" :class="$attrs.class"><slot /></button>',
          },
          Dialog: true,
        },
      },
    })
  }

  describe('Component Rendering', () => {
    it('should render the component', () => {
      wrapper = mountComponent()
      expect(wrapper.exists()).toBe(true)
    })

    it('should render the admin header with title', () => {
      wrapper = mountComponent()
      expect(wrapper.find('h1').text()).toBe('User Management')
    })

    it('should render the subtitle', () => {
      wrapper = mountComponent()
      expect(wrapper.find('.admin-subtitle').text()).toBe('Manage user accounts, profiles, and access settings')
    })

    it('should render AdminNavigation component', () => {
      wrapper = mountComponent()
      expect(wrapper.find('[data-testid="admin-navigation"]').exists()).toBe(true)
    })

    it('should render UserManagementPanel component', () => {
      wrapper = mountComponent()
      expect(wrapper.find('[data-testid="user-management-panel"]').exists()).toBe(true)
    })

    it('should render action buttons', () => {
      wrapper = mountComponent()
      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Breadcrumb Navigation', () => {
    it('should navigate to dashboard when clicking Dashboard breadcrumb', async () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      // Simulate breadcrumb command
      vm.breadcrumbItems[0].command()

      expect(mockRouter.push).toHaveBeenCalledWith('/')
    })

    it('should navigate to admin when clicking Administration breadcrumb', async () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      // Simulate breadcrumb command
      vm.breadcrumbItems[1].command()

      expect(mockRouter.push).toHaveBeenCalledWith('/admin')
    })
  })

  describe('Refresh Data', () => {
    it('should refresh data successfully', async () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      // Mock the refreshData method on the child component
      const mockRefreshData = vi.fn().mockResolvedValue(undefined)
      vm.userManagementPanelComponent = {
        refreshData: mockRefreshData,
      }

      await vm.refreshData()

      expect(mockRefreshData).toHaveBeenCalled()
      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Data Refreshed',
        detail: 'User data has been refreshed successfully',
        life: 3000,
      })
    })

    it('should handle refresh data error', async () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      // Mock the refreshData method to throw error
      vm.userManagementPanelComponent = {
        refreshData: vi.fn().mockRejectedValue(new Error('Refresh failed')),
      }

      await vm.refreshData()

      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Refresh Failed',
        detail: 'Failed to refresh user data',
        life: 3000,
      })
    })

    it('should set loading state during refresh', async () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      vm.userManagementPanelComponent = {
        refreshData: vi.fn().mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 50))),
      }

      const refreshPromise = vm.refreshData()
      expect(vm.loading).toBe(true)

      await refreshPromise
      expect(vm.loading).toBe(false)
    })
  })

  describe('User Creation', () => {
    it('should show create user dialog when clicking Create User button', async () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      expect(vm.showCreateUserDialog).toBe(false)

      vm.showCreateUserDialog = true
      await wrapper.vm.$nextTick()

      expect(vm.showCreateUserDialog).toBe(true)
    })

    it('should handle user created successfully', async () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      const mockRefreshData = vi.fn().mockResolvedValue(undefined)
      vm.userManagementPanelComponent = {
        refreshData: mockRefreshData,
      }

      const newUser = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      }

      await vm.handleUserCreated(newUser)

      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'User Created',
        detail: 'John Doe has been created successfully',
        life: 4000,
      })
      expect(mockRefreshData).toHaveBeenCalled()
      expect(vm.showCreateUserDialog).toBe(false)
    })
  })

  describe('User Editing', () => {
    it('should show edit user dialog when editUser is called', async () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      const user = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      }

      vm.editUser(user)
      await wrapper.vm.$nextTick()

      expect(vm.selectedUser).toEqual(user)
      expect(vm.userEditVisible).toBe(true)
    })

    it('should handle user updated successfully', async () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      const result = {
        userName: 'John Doe',
      }

      await vm.handleUserUpdated(result)

      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'User Updated',
        detail: 'Successfully updated user John Doe',
        life: 4000,
      })
      expect(vm.userEditVisible).toBe(false)
      expect(vm.selectedUser).toBeNull()
    })
  })

  describe('Role Management', () => {
    it('should show role management dialog', async () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      const user = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        roles: [],
      }

      vm.showRoleManagementDialog(user)
      await wrapper.vm.$nextTick()

      expect(vm.selectedUser).toEqual(user)
      expect(vm.roleAssignmentVisible).toBe(true)
    })

    it('should handle role assigned successfully', async () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      const result = {
        roleName: 'Admin',
        userName: 'John Doe',
      }

      await vm.handleRoleAssigned(result)

      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Role Assigned',
        detail: 'Successfully assigned Admin to John Doe',
        life: 4000,
      })
      expect(vm.roleAssignmentVisible).toBe(false)
      expect(vm.selectedUser).toBeNull()
    })

    it('should handle role revoked successfully', async () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      const result = {
        userName: 'John Doe',
        revokedRoles: ['Admin', 'Editor'],
      }

      await vm.handleRoleRevoked(result)

      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Roles Revoked',
        detail: 'Successfully removed 2 role(s) from John Doe',
        life: 4000,
      })
      expect(vm.roleAssignmentVisible).toBe(false)
      expect(vm.selectedUser).toBeNull()
    })

    it('should handle user role updated', async () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      const mockUpdateUserRole = vi.fn()
      vm.userManagementPanelComponent = {
        updateUserRole: mockUpdateUserRole,
      }

      const data = {
        userId: '1',
        operation: 'assign' as const,
        role: { id: 'role-1', name: 'Admin' },
        updatedUser: { id: '1', email: 'test@example.com' },
      }

      await vm.handleUserRoleUpdated(data)

      expect(mockUpdateUserRole).toHaveBeenCalledWith('1', 'assign', data.role)
    })
  })

  describe('Bulk Operations', () => {
    it('should show bulk dialog when users are selected', async () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      vm.selectedUsers = [{ id: '1' }, { id: '2' }]

      await vm.handleBulkAction('delete')

      expect(vm.showBulkDialog).toBe(true)
    })

    it('should show warning when no users selected for bulk action', async () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      vm.selectedUsers = []

      await vm.handleBulkAction('delete')

      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'warn',
        summary: 'No Selection',
        detail: 'Please select users to perform bulk actions.',
        life: 3000,
      })
      expect(vm.showBulkDialog).toBe(false)
    })

    it('should handle bulk operation completed successfully', async () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      vm.selectedUsers = [{ id: '1' }, { id: '2' }]

      const result = {
        successCount: 2,
        failures: [],
      }

      await vm.handleBulkCompleted(result)

      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Bulk Operation Complete',
        detail: 'Successfully processed 2 users',
        life: 4000,
      })
      expect(vm.showBulkDialog).toBe(false)
      expect(vm.selectedUsers).toEqual([])
    })

    it('should handle bulk operation with some failures', async () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      vm.selectedUsers = [{ id: '1' }, { id: '2' }, { id: '3' }]

      const result = {
        successCount: 2,
        failures: [{ id: '3', error: 'Failed to delete' }],
      }

      await vm.handleBulkCompleted(result)

      expect(mockToast.add).toHaveBeenCalledTimes(2)
      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Bulk Operation Complete',
        detail: 'Successfully processed 2 users',
        life: 4000,
      })
      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'warn',
        summary: 'Some Operations Failed',
        detail: '1 operations failed.',
        life: 6000,
      })
    })
  })

  describe('Component Lifecycle', () => {
    it('should mount without errors', () => {
      expect(() => mountComponent()).not.toThrow()
    })

    it('should initialize with correct default values', () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      expect(vm.loading).toBe(false)
      expect(vm.selectedUsers).toEqual([])
      expect(vm.selectedUser).toBeNull()
      expect(vm.showCreateUserDialog).toBe(false)
      expect(vm.roleAssignmentVisible).toBe(false)
      expect(vm.showBulkDialog).toBe(false)
      expect(vm.userEditVisible).toBe(false)
    })

    it('should have correct breadcrumb structure', () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      expect(vm.breadcrumbItems).toHaveLength(3)
      expect(vm.breadcrumbItems[0].label).toBe('Dashboard')
      expect(vm.breadcrumbItems[1].label).toBe('Administration')
      expect(vm.breadcrumbItems[2].label).toBe('Users')
    })
  })
})
