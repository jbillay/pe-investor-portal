import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import RoleManagementView from '../RoleManagementView.vue'
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

vi.mock('@/components/admin/RoleManagementPanel.vue', () => ({
  default: {
    name: 'RoleManagementPanel',
    template: '<div data-testid="role-management-panel"></div>',
    methods: {
      refreshRoles: vi.fn(),
    },
  },
}))

vi.mock('@/components/admin/PermissionManagementDialog.vue', () => ({
  default: { name: 'PermissionManagementDialog', template: '<div data-testid="permission-management-dialog"></div>' },
}))

vi.mock('@/components/admin/RoleFormDialog.vue', () => ({
  default: { name: 'RoleFormDialog', template: '<div data-testid="role-form-dialog"></div>' },
}))

describe('RoleManagementView', () => {
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
    return mount(RoleManagementView, {
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
        stubs: {
          Breadcrumb: true,
          Button: {
            template: '<button @click="$emit(\'click\')" :class="$attrs.class"><slot /></button>',
          },
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
      expect(wrapper.find('h1').text()).toBe('Role Management')
    })

    it('should render the subtitle', () => {
      wrapper = mountComponent()
      expect(wrapper.find('.admin-subtitle').text()).toBe('Create and configure user roles with specific permissions')
    })

    it('should render AdminNavigation component', () => {
      wrapper = mountComponent()
      expect(wrapper.find('[data-testid="admin-navigation"]').exists()).toBe(true)
    })

    it('should render RoleManagementPanel component', () => {
      wrapper = mountComponent()
      expect(wrapper.find('[data-testid="role-management-panel"]').exists()).toBe(true)
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

      vm.breadcrumbItems[0].command()

      expect(mockRouter.push).toHaveBeenCalledWith('/')
    })

    it('should navigate to admin when clicking Administration breadcrumb', async () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      vm.breadcrumbItems[1].command()

      expect(mockRouter.push).toHaveBeenCalledWith('/admin')
    })

    it('should have correct breadcrumb items', () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      expect(vm.breadcrumbItems).toHaveLength(3)
      expect(vm.breadcrumbItems[0].label).toBe('Dashboard')
      expect(vm.breadcrumbItems[1].label).toBe('Administration')
      expect(vm.breadcrumbItems[2].label).toBe('Roles')
    })
  })

  describe('Refresh Data', () => {
    it('should refresh data successfully', async () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      const mockRefreshRoles = vi.fn().mockResolvedValue(undefined)
      vm.roleManagementPanelComponent = {
        refreshRoles: mockRefreshRoles,
      }

      await vm.refreshData()

      expect(mockRefreshRoles).toHaveBeenCalled()
      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Data Refreshed',
        detail: 'Role data has been refreshed successfully',
        life: 3000,
      })
    })

    it('should handle refresh data error', async () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      vm.roleManagementPanelComponent = {
        refreshRoles: vi.fn().mockRejectedValue(new Error('Refresh failed')),
      }

      await vm.refreshData()

      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Refresh Failed',
        detail: 'Failed to refresh role data',
        life: 3000,
      })
    })

    it('should set loading state during refresh', async () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      vm.roleManagementPanelComponent = {
        refreshRoles: vi.fn().mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 50))),
      }

      const refreshPromise = vm.refreshData()
      expect(vm.loading).toBe(true)

      await refreshPromise
      expect(vm.loading).toBe(false)
    })
  })

  describe('Role Creation', () => {
    it('should show create role dialog when clicking Create Role button', async () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      expect(vm.roleFormDialogVisible).toBe(false)

      vm.createRole()
      await wrapper.vm.$nextTick()

      expect(vm.roleFormDialogVisible).toBe(true)
      expect(vm.selectedRoleForEdit).toBeNull()
    })

    it('should handle role created successfully', async () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      const mockRefreshRoles = vi.fn().mockResolvedValue(undefined)
      vm.roleManagementPanelComponent = {
        refreshRoles: mockRefreshRoles,
      }

      const newRole = {
        id: 'role-1',
        name: 'Editor',
        description: 'Content editor role',
      }

      await vm.handleRoleCreated(newRole)

      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Role Created',
        detail: 'Role "Editor" has been created successfully',
        life: 3000,
      })
      expect(mockRefreshRoles).toHaveBeenCalled()
      expect(vm.roleFormDialogVisible).toBe(false)
      expect(vm.selectedRoleForEdit).toBeNull()
    })
  })

  describe('Role Editing', () => {
    it('should show edit role dialog when editRole is called', async () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      const role = {
        id: 'role-1',
        name: 'Editor',
        description: 'Content editor role',
      }

      vm.editRole(role)
      await wrapper.vm.$nextTick()

      expect(vm.selectedRoleForEdit).toEqual(role)
      expect(vm.roleFormDialogVisible).toBe(true)
    })

    it('should handle role updated successfully', async () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      const mockRefreshRoles = vi.fn().mockResolvedValue(undefined)
      vm.roleManagementPanelComponent = {
        refreshRoles: mockRefreshRoles,
      }

      const updatedRole = {
        id: 'role-1',
        name: 'Senior Editor',
        description: 'Updated description',
      }

      await vm.handleRoleUpdated(updatedRole)

      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Role Updated',
        detail: 'Role "Senior Editor" has been updated successfully',
        life: 3000,
      })
      expect(mockRefreshRoles).toHaveBeenCalled()
      expect(vm.roleFormDialogVisible).toBe(false)
      expect(vm.selectedRoleForEdit).toBeNull()
    })

    it('should handle role deleted successfully', async () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      const mockRefreshRoles = vi.fn().mockResolvedValue(undefined)
      vm.roleManagementPanelComponent = {
        refreshRoles: mockRefreshRoles,
      }

      await vm.handleRoleDeleted('role-1')

      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Role Deleted',
        detail: 'Role has been deleted successfully',
        life: 3000,
      })
      expect(mockRefreshRoles).toHaveBeenCalled()
      expect(vm.roleFormDialogVisible).toBe(false)
      expect(vm.selectedRoleForEdit).toBeNull()
    })
  })

  describe('Permission Management', () => {
    it('should show permission dialog when showPermissionDialog is called', async () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      const role = {
        id: 'role-1',
        name: 'Editor',
        permissions: [],
      }

      vm.showPermissionDialog(role)
      await wrapper.vm.$nextTick()

      expect(vm.selectedRole).toEqual(role)
      expect(vm.permissionDialogVisible).toBe(true)
    })

    it('should handle permissions updated successfully', async () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      const result = {
        roleName: 'Editor',
        permissionsAdded: 2,
      }

      await vm.handlePermissionsUpdated(result)

      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Permissions Updated',
        detail: 'Successfully updated permissions for Editor',
        life: 4000,
      })
      expect(vm.permissionDialogVisible).toBe(false)
      expect(vm.selectedRole).toBeNull()
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
      expect(vm.selectedRole).toBeNull()
      expect(vm.selectedRoleForEdit).toBeNull()
      expect(vm.permissionDialogVisible).toBe(false)
      expect(vm.roleFormDialogVisible).toBe(false)
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete create role flow', async () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      const mockRefreshRoles = vi.fn().mockResolvedValue(undefined)
      vm.roleManagementPanelComponent = {
        refreshRoles: mockRefreshRoles,
      }

      // Open create dialog
      vm.createRole()
      expect(vm.roleFormDialogVisible).toBe(true)
      expect(vm.selectedRoleForEdit).toBeNull()

      // Handle role creation
      const newRole = { id: 'role-1', name: 'New Role' }
      await vm.handleRoleCreated(newRole)

      // Verify state is reset and data is refreshed
      expect(vm.roleFormDialogVisible).toBe(false)
      expect(vm.selectedRoleForEdit).toBeNull()
      expect(mockRefreshRoles).toHaveBeenCalled()
      expect(mockToast.add).toHaveBeenCalled()
    })

    it('should handle complete edit role flow', async () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      const mockRefreshRoles = vi.fn().mockResolvedValue(undefined)
      vm.roleManagementPanelComponent = {
        refreshRoles: mockRefreshRoles,
      }

      // Open edit dialog
      const role = { id: 'role-1', name: 'Editor' }
      vm.editRole(role)
      expect(vm.roleFormDialogVisible).toBe(true)
      expect(vm.selectedRoleForEdit).toEqual(role)

      // Handle role update
      const updatedRole = { id: 'role-1', name: 'Senior Editor' }
      await vm.handleRoleUpdated(updatedRole)

      // Verify state is reset and data is refreshed
      expect(vm.roleFormDialogVisible).toBe(false)
      expect(vm.selectedRoleForEdit).toBeNull()
      expect(mockRefreshRoles).toHaveBeenCalled()
      expect(mockToast.add).toHaveBeenCalled()
    })

    it('should handle permission management flow', async () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      // Open permission dialog
      const role = { id: 'role-1', name: 'Editor', permissions: [] }
      vm.showPermissionDialog(role)
      expect(vm.permissionDialogVisible).toBe(true)
      expect(vm.selectedRole).toEqual(role)

      // Handle permissions update
      await vm.handlePermissionsUpdated({ roleName: 'Editor' })

      // Verify state is reset
      expect(vm.permissionDialogVisible).toBe(false)
      expect(vm.selectedRole).toBeNull()
      expect(mockToast.add).toHaveBeenCalled()
    })
  })
})
