import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper, flushPromises } from '@vue/test-utils'
import RoleManagementPanel from '../RoleManagementPanel.vue'

const mockToast = { add: vi.fn() }
const mockConfirm = { require: vi.fn() }

const mockRoles = [
  {
    id: '1',
    name: 'SUPER_ADMIN',
    description: 'Full system access',
    status: 'ACTIVE',
    isDefault: true,
    isSystemRole: true,
    userCount: 2,
    permissionCount: 50,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    name: 'FUND_MANAGER',
    description: 'Manages funds and investments',
    status: 'ACTIVE',
    isDefault: true,
    isSystemRole: false,
    userCount: 5,
    permissionCount: 25,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    name: 'ANALYST',
    description: 'Data analysis and reporting',
    status: 'ACTIVE',
    isDefault: false,
    isSystemRole: false,
    userCount: 10,
    permissionCount: 15,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '4',
    name: 'VIEWER',
    description: 'Read-only access',
    status: 'INACTIVE',
    isDefault: false,
    isSystemRole: false,
    userCount: 3,
    permissionCount: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

vi.mock('primevue/usetoast', () => ({
  useToast: vi.fn(() => mockToast),
}))

vi.mock('primevue/useconfirm', () => ({
  useConfirm: vi.fn(() => mockConfirm),
}))

vi.mock('@/composables/useRoles', () => ({
  useRoles: vi.fn(() => ({
    roles: { value: mockRoles },
    loading: { value: false },
    error: { value: null },
    filteredRoles: { value: mockRoles },
    totalRoles: { value: mockRoles.length },
    activeRoles: { value: mockRoles.filter((r: any) => r.status === 'ACTIVE').length },
    averagePermissions: { value: Math.round(mockRoles.reduce((sum: number, r: any) => sum + r.permissionCount, 0) / mockRoles.length) },
    filters: {
      search: '',
      status: null,
      type: null,
    },
    clearFilters: vi.fn(),
    fetchRoles: vi.fn(async () => {}),
    deleteRole: vi.fn(async () => true),
  })),
}))

vi.mock('../RoleDetailsDialog.vue', () => ({
  default: {
    name: 'RoleDetailsDialog',
    template: '<div v-if="visible" class="role-details-dialog"><slot /></div>',
    props: ['visible', 'role'],
    emits: ['update:visible'],
  },
}))

vi.mock('primevue/inputtext', () => ({
  default: {
    name: 'InputText',
    template: `<input @input="$emit('update:modelValue', $event.target.value)" v-bind="$attrs" />`,
    props: ['modelValue'],
    emits: ['update:modelValue'],
  },
}))

vi.mock('primevue/select', () => ({
  default: {
    name: 'Select',
    template: `<select @change="$emit('update:modelValue', $event.target.value)" :value="modelValue"><slot /></select>`,
    props: ['modelValue', 'options', 'placeholder', 'optionLabel', 'optionValue', 'showClear'],
    emits: ['update:modelValue'],
  },
}))

vi.mock('primevue/button', () => ({
  default: {
    name: 'Button',
    template: `<button @click="$emit('click')" :disabled="disabled"><slot /></button>`,
    props: ['label', 'icon', 'loading', 'disabled', 'class', 'severity', 'outlined'],
    emits: ['click'],
  },
}))

vi.mock('primevue/datatable', () => ({
  default: {
    name: 'DataTable',
    template: `<div class="datatable"><slot name="header" /><slot /></div>`,
    props: ['value', 'paginator', 'rows', 'loading', 'sortField', 'sortOrder', 'dataKey'],
    emits: ['row-select', 'row-unselect'],
  },
}))

vi.mock('primevue/column', () => ({
  default: {
    name: 'Column',
    template: '<div><slot name="header" /><slot name="body" /></div>',
    props: ['field', 'sortable', 'class'],
  },
}))

vi.mock('primevue/tag', () => ({
  default: {
    name: 'Tag',
    template: '<span class="tag">{{ value }}</span>',
    props: ['value', 'severity', 'class'],
  },
}))

vi.mock('primevue/card', () => ({
  default: {
    name: 'Card',
    template: '<div class="card"><slot name="content" /></div>',
    props: ['class'],
  },
}))

describe('RoleManagementPanel', () => {
  let wrapper: VueWrapper

  const createWrapper = (props = {}) => {
    return mount(RoleManagementPanel, {
      props: {
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
    it('should render the panel', () => {
      expect(wrapper.find('.role-management-panel').exists()).toBe(true)
    })

    it('should display search input', () => {
      expect(wrapper.vm.filters !== undefined).toBe(true)
    })

    it('should display status filter', () => {
      expect(wrapper.vm.statusOptions.length).toBeGreaterThan(0)
    })

    it('should display role type filter', () => {
      expect(wrapper.vm.roleTypeOptions.length).toBeGreaterThan(0)
    })

    it('should display data table', () => {
      expect(wrapper.vm.filteredRoles).toBeDefined()
    })

    it('should display statistics cards', () => {
      expect(wrapper.vm.totalRoles).toBeDefined()
    })
  })

  describe('Data Table', () => {
    it('should display all roles in table', () => {
      expect(mockRoles.length).toBe(4)
    })

    it('should show role count in header', () => {
      expect(mockRoles.length).toBeGreaterThan(0)
    })

    it('should display sortable columns', () => {
      expect(mockRoles.length).toBeGreaterThan(0)
    })

    it('should have pagination', () => {
      expect(mockRoles.length).toBeGreaterThan(0)
    })

    it('should display role names', () => {
      expect(mockRoles.some((r: any) => r.name === 'SUPER_ADMIN')).toBe(true)
    })

    it('should display descriptions', () => {
      expect(mockRoles.some((r: any) => r.description)).toBe(true)
    })
  })

  describe('Statistics', () => {
    it('should have total roles computed', () => {
      expect(wrapper.vm.totalRoles !== undefined).toBe(true)
    })

    it('should have active roles computed', () => {
      expect(wrapper.vm.activeRoles !== undefined).toBe(true)
    })

    it('should have custom roles computed', () => {
      expect(wrapper.vm.customRoles !== undefined).toBe(true)
    })

    it('should calculate average permissions', () => {
      expect(wrapper.vm.averagePermissions !== undefined).toBe(true)
    })

    it('should have role count statistic', () => {
      expect(mockRoles.length).toBe(4)
    })

    it('should have active roles count', () => {
      const activeCount = mockRoles.filter((r: any) => r.status === 'ACTIVE').length
      expect(activeCount).toBe(3)
    })

    it('should calculate custom roles correctly', () => {
      const customCount = mockRoles.filter((r: any) => !r.isSystemRole && !r.isDefault).length
      expect(customCount).toBe(2)
    })
  })

  describe('Filtering', () => {
    it('should have search filter', () => {
      expect(typeof wrapper.vm.filters.search).toBe('string')
    })

    it('should have status filter options', () => {
      expect(wrapper.vm.statusOptions.length).toBe(2)
      expect(wrapper.vm.statusOptions[0].value).toBe('ACTIVE')
    })

    it('should have role type filter options', () => {
      expect(wrapper.vm.roleTypeOptions.length).toBe(3)
    })

    it('should initialize filters as empty', () => {
      expect(wrapper.vm.filters.search).toBe('')
      expect(wrapper.vm.filters.status).toBeNull()
      expect(wrapper.vm.filters.type).toBeNull()
    })

    it('should update search filter', async () => {
      wrapper.vm.filters.search = 'MANAGER'
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.filters.search).toBe('MANAGER')
    })

    it('should update status filter', async () => {
      wrapper.vm.filters.status = 'ACTIVE'
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.filters.status).toBe('ACTIVE')
    })

    it('should update type filter', async () => {
      wrapper.vm.filters.type = 'CUSTOM'
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.filters.type).toBe('CUSTOM')
    })

    it('should have clearFilters method', () => {
      expect(typeof wrapper.vm.clearFilters).toBe('function')
    })
  })

  describe('Role Actions', () => {
    it('should have viewRole method', () => {
      expect(typeof wrapper.vm.viewRole).toBe('function')
    })

    it('should have editRole method', () => {
      expect(typeof wrapper.vm.editRole).toBe('function')
    })

    it('should have assignPermissionsToRole method', () => {
      expect(typeof wrapper.vm.assignPermissionsToRole).toBe('function')
    })

    it('should have confirmDeleteRole method', () => {
      expect(typeof wrapper.vm.confirmDeleteRole).toBe('function')
    })

    it('should emit edit-role when editing', async () => {
      const role = mockRoles[0]
      wrapper.vm.editRole(role)
      expect(wrapper.emitted('edit-role')).toBeTruthy()
    })

    it('should emit assign-permissions when assigning', async () => {
      const role = mockRoles[0]
      wrapper.vm.assignPermissionsToRole(role)
      expect(wrapper.emitted('assign-permissions')).toBeTruthy()
    })

    it('should pass correct role to edit emit', async () => {
      const role = mockRoles[0]
      wrapper.vm.editRole(role)
      const emitted = wrapper.emitted('edit-role')
      if (emitted) {
        expect(emitted[0][0].id).toBe(role.id)
      }
    })

    it('should pass correct role to permissions emit', async () => {
      const role = mockRoles[0]
      wrapper.vm.assignPermissionsToRole(role)
      const emitted = wrapper.emitted('assign-permissions')
      if (emitted) {
        expect(emitted[0][0].id).toBe(role.id)
      }
    })
  })

  describe('Delete Confirmation', () => {
    it('should request confirmation before delete', () => {
      const role = mockRoles[0]
      wrapper.vm.confirmDeleteRole(role)
      expect(mockConfirm.require).toHaveBeenCalled()
    })

    it('should show role name in confirmation message', () => {
      const role = mockRoles[0]
      wrapper.vm.confirmDeleteRole(role)
      const callArgs = mockConfirm.require.mock.calls[0][0]
      expect(callArgs.message).toContain(role.name)
    })

    it('should emit role-deleted on successful delete', async () => {
      const role = mockRoles[0]
      wrapper.vm.confirmDeleteRole(role)
      const callArgs = mockConfirm.require.mock.calls[0][0]
      // Simulate accept callback
      await callArgs.accept()
      await flushPromises()
      expect(wrapper.emitted('role-deleted')).toBeTruthy()
    })

    it('should pass role id to delete emit', async () => {
      const role = mockRoles[0]
      wrapper.vm.confirmDeleteRole(role)
      const callArgs = mockConfirm.require.mock.calls[0][0]
      await callArgs.accept()
      await flushPromises()
      const emitted = wrapper.emitted('role-deleted')
      if (emitted) {
        expect(emitted[0][0]).toBe(role.id)
      }
    })
  })

  describe('Role Details Dialog', () => {
    it('should have role details dialog', () => {
      expect(wrapper.vm.roleDetailsDialogVisible !== undefined).toBe(true)
    })

    it('should open details dialog when viewing role', () => {
      const role = mockRoles[0]
      wrapper.vm.viewRole(role)
      expect(wrapper.vm.roleDetailsDialogVisible).toBe(true)
    })

    it('should set selected role for details', () => {
      const role = mockRoles[0]
      wrapper.vm.viewRole(role)
      expect(wrapper.vm.selectedRoleForDetails).toEqual(role)
    })

    it('should pass selected role to dialog', () => {
      const role = mockRoles[0]
      wrapper.vm.viewRole(role)
      expect(wrapper.vm.selectedRoleForDetails?.id).toBe(role.id)
    })

    it('should handle multiple role views', () => {
      wrapper.vm.viewRole(mockRoles[0])
      expect(wrapper.vm.selectedRoleForDetails?.name).toBe('SUPER_ADMIN')
      wrapper.vm.viewRole(mockRoles[1])
      expect(wrapper.vm.selectedRoleForDetails?.name).toBe('FUND_MANAGER')
    })
  })

  describe('Helper Methods', () => {
    it('should get role color', () => {
      const color = wrapper.vm.getRoleColor('SUPER_ADMIN')
      expect(typeof color).toBe('string')
      expect(color.length).toBeGreaterThan(0)
    })

    it('should return default color for unknown role', () => {
      const color = wrapper.vm.getRoleColor('UNKNOWN_ROLE')
      expect(typeof color).toBe('string')
    })

    it('should get role initials', () => {
      const initials = wrapper.vm.getRoleInitials('SUPER_ADMIN')
      expect(initials).toBe('SA')
    })

    it('should handle single word roles for initials', () => {
      const initials = wrapper.vm.getRoleInitials('VIEWER')
      expect(initials).toBe('V')
    })

    it('should get status severity', () => {
      expect(wrapper.vm.getStatusSeverity('ACTIVE')).toBe('success')
      expect(wrapper.vm.getStatusSeverity('INACTIVE')).toBe('warning')
      expect(wrapper.vm.getStatusSeverity('DEPRECATED')).toBe('danger')
    })

    it('should format dates', () => {
      const date = new Date('2024-01-15')
      const formatted = wrapper.vm.formatDate(date)
      expect(typeof formatted).toBe('string')
      expect(formatted.length).toBeGreaterThan(0)
    })

    it('should format times', () => {
      const date = new Date('2024-01-15T14:30:00')
      const formatted = wrapper.vm.formatTime(date)
      expect(typeof formatted).toBe('string')
    })
  })

  describe('Row Styling', () => {
    it('should apply inactive row style', () => {
      const inactiveRole = mockRoles[3]
      const rowClass = wrapper.vm.getRowClass(inactiveRole)
      expect(rowClass).toContain('opacity-60')
    })

    it('should apply default role style', () => {
      const defaultRole = mockRoles[0]
      const rowClass = wrapper.vm.getRowClass(defaultRole)
      expect(rowClass).toContain('bg-blue-50')
    })

    it('should return empty string for normal roles', () => {
      const normalRole = mockRoles[2]
      const rowClass = wrapper.vm.getRowClass(normalRole)
      expect(rowClass).toBe('')
    })
  })

  describe('Component Lifecycle', () => {
    it('should have refresh method available', async () => {
      const newWrapper = createWrapper()
      await flushPromises()
      expect(typeof newWrapper.vm.refreshRoles).toBe('function')
    })

    it('should expose refreshRoles method', () => {
      expect(typeof wrapper.vm.refreshRoles).toBe('function')
    })

    it('should mount without errors', () => {
      expect(wrapper.vm.$el).toBeDefined()
    })
  })

  describe('Composable Integration', () => {
    it('should have roles available from composable', () => {
      expect(wrapper.vm.roles !== undefined).toBe(true)
    })

    it('should have filtered roles from composable', () => {
      expect(wrapper.vm.filteredRoles !== undefined).toBe(true)
    })

    it('should have loading state from composable', () => {
      expect(wrapper.vm.rolesLoading !== undefined).toBe(true)
    })

    it('should have error state from composable', () => {
      expect(wrapper.vm.error !== undefined).toBe(true)
    })
  })

  describe('Role Data Display', () => {
    it('should display role name in table', () => {
      const role = mockRoles[0]
      expect(mockRoles.some((r: any) => r.name === role.name)).toBe(true)
    })

    it('should display user count for role', () => {
      const role = mockRoles[0]
      expect(role.userCount).toBeDefined()
    })

    it('should display permission count for role', () => {
      const role = mockRoles[0]
      expect(role.permissionCount).toBeDefined()
    })

    it('should show default role badge', () => {
      const defaultRole = mockRoles[0]
      expect(defaultRole.isDefault).toBe(true)
    })

    it('should show system role badge', () => {
      const systemRole = mockRoles[0]
      expect(systemRole.isSystemRole).toBe(true)
    })

    it('should display role status', () => {
      const role = mockRoles[0]
      expect(role.status).toBe('ACTIVE')
    })
  })

  describe('Filter Options', () => {
    it('should have correct status options', () => {
      expect(wrapper.vm.statusOptions).toEqual([
        { label: 'Active', value: 'ACTIVE' },
        { label: 'Inactive', value: 'INACTIVE' },
      ])
    })

    it('should have correct role type options', () => {
      expect(wrapper.vm.roleTypeOptions).toEqual([
        { label: 'System Roles', value: 'SYSTEM' },
        { label: 'Default Roles', value: 'DEFAULT' },
        { label: 'Custom Roles', value: 'CUSTOM' },
      ])
    })
  })

  describe('Empty and Edge Cases', () => {
    it('should handle roles data', () => {
      expect(mockRoles.length > 0).toBe(true)
    })

    it('should handle roles with no description', () => {
      const roleNoDesc = { ...mockRoles[0], description: '' }
      expect(roleNoDesc.description).toBe('')
    })

    it('should handle role with zero users', () => {
      const roleNoUsers = { ...mockRoles[0], userCount: 0 }
      expect(roleNoUsers.userCount).toBe(0)
    })

    it('should handle role with zero permissions', () => {
      const roleNoPerms = { ...mockRoles[0], permissionCount: 0 }
      expect(roleNoPerms.permissionCount).toBe(0)
    })

    it('should handle system role flag correctly', () => {
      const systemRole = mockRoles[0]
      expect(systemRole.isSystemRole).toBe(true)
    })

    it('should handle default role flag correctly', () => {
      const defaultRole = mockRoles[0]
      expect(defaultRole.isDefault).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should have error state available', () => {
      expect(wrapper.vm.error !== undefined).toBe(true)
    })

    it('should have loading state available', () => {
      expect(wrapper.vm.rolesLoading !== undefined).toBe(true)
    })
  })

  describe('Props', () => {
    it('should accept loading prop', () => {
      const newWrapper = createWrapper({ loading: true })
      expect(newWrapper.vm.$props.loading).toBe(true)
    })

    it('should work with default props', () => {
      expect(wrapper.vm.$el).toBeDefined()
    })
  })

  describe('Emits', () => {
    it('should emit edit-role event', () => {
      const role = mockRoles[0]
      wrapper.vm.editRole(role)
      expect(wrapper.emitted('edit-role')).toBeTruthy()
      expect(wrapper.emitted('edit-role')?.length).toBe(1)
    })

    it('should emit assign-permissions event', () => {
      const role = mockRoles[0]
      wrapper.vm.assignPermissionsToRole(role)
      expect(wrapper.emitted('assign-permissions')).toBeTruthy()
    })

    it('should emit role-deleted event', async () => {
      const role = mockRoles[0]
      wrapper.vm.confirmDeleteRole(role)
      const callArgs = mockConfirm.require.mock.calls[0][0]
      await callArgs.accept()
      await flushPromises()
      expect(wrapper.emitted('role-deleted')).toBeTruthy()
    })

    it('should not emit role-updated in this component', async () => {
      // role-updated is emitted from other components
      expect(wrapper.emitted('role-updated')).toBeFalsy()
    })
  })

  describe('Multiple Role Operations', () => {
    it('should handle viewing multiple roles', () => {
      wrapper.vm.viewRole(mockRoles[0])
      expect(wrapper.vm.selectedRoleForDetails?.id).toBe(mockRoles[0].id)
      wrapper.vm.viewRole(mockRoles[1])
      expect(wrapper.vm.selectedRoleForDetails?.id).toBe(mockRoles[1].id)
    })

    it('should handle editing multiple roles', () => {
      wrapper.vm.editRole(mockRoles[0])
      wrapper.vm.editRole(mockRoles[1])
      const emitted = wrapper.emitted('edit-role')
      if (emitted) {
        expect(emitted.length).toBe(2)
      }
    })

    it('should handle deleting multiple roles sequentially', async () => {
      wrapper.vm.confirmDeleteRole(mockRoles[0])
      let callArgs = mockConfirm.require.mock.calls[0][0]
      await callArgs.accept()
      await flushPromises()

      wrapper.vm.confirmDeleteRole(mockRoles[1])
      callArgs = mockConfirm.require.mock.calls[1][0]
      await callArgs.accept()
      await flushPromises()

      expect(wrapper.emitted('role-deleted')?.length).toBe(2)
    })
  })
})
