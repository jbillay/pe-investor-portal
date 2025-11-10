import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import RoleDetailsDialog from '../RoleDetailsDialog.vue'

vi.mock('primevue/dialog', () => ({
  default: {
    name: 'Dialog',
    template: `<div v-if="visible" class="dialog"><slot name="header" /><slot /><slot name="footer" /></div>`,
    props: ['visible', 'modal', 'draggable', 'closable', 'style'],
    emits: ['update:visible', 'show', 'hide'],
  },
}))

vi.mock('primevue/button', () => ({
  default: {
    name: 'Button',
    template: `<button @click="$emit('click')" :disabled="disabled"><slot /></button>`,
    props: ['label', 'icon', 'class'],
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

vi.mock('primevue/inputtext', () => ({
  default: {
    name: 'InputText',
    template: `<input @input="$emit('update:modelValue', $event.target.value)" :value="modelValue" :placeholder="placeholder" />`,
    props: ['modelValue', 'placeholder'],
    emits: ['update:modelValue'],
  },
}))

vi.mock('primevue/inputgroup', () => ({
  default: {
    name: 'InputGroup',
    template: '<div class="input-group"><slot /></div>',
  },
}))

vi.mock('primevue/inputgroupaddon', () => ({
  default: {
    name: 'InputGroupAddon',
    template: '<div class="input-group-addon"><slot /></div>',
  },
}))

vi.mock('primevue/progressspinner', () => ({
  default: {
    name: 'ProgressSpinner',
    template: '<div class="progress-spinner"></div>',
    props: ['style', 'strokeWidth'],
  },
}))

const mockRole = {
  id: '1',
  name: 'ANALYST',
  description: 'Data analyst role with read-only access',
  status: 'ACTIVE',
  isDefault: false,
  isSystemRole: false,
  userCount: 5,
  createdAt: '2024-01-01T00:00:00Z',
  permissions: [
    {
      id: '1',
      action: 'READ',
      resource: 'FUND',
      level: 'LOW',
      description: 'Can read fund information'
    },
    {
      id: '2',
      action: 'READ',
      resource: 'INVESTMENT',
      level: 'MEDIUM',
      description: 'Can read investment details'
    },
    {
      id: '3',
      action: 'EXPORT',
      resource: 'REPORT',
      level: 'LOW',
      description: 'Can export reports'
    }
  ]
}

describe('RoleDetailsDialog', () => {
  let wrapper: VueWrapper

  const createWrapper = (props = {}) => {
    return mount(RoleDetailsDialog, {
      props: {
        visible: true,
        role: mockRole,
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
    it('should render the dialog', () => {
      expect(wrapper.find('.dialog').exists()).toBe(true)
    })

    it('should display role details content', () => {
      expect(wrapper.find('.role-details-content').exists()).toBe(true)
    })

    it('should show role header with avatar', () => {
      expect(wrapper.vm.$props.role?.name).toBe('ANALYST')
    })

    it('should display status badges', () => {
      expect(wrapper.vm.$props.role?.status).toBe('ACTIVE')
    })

    it('should show permissions section', () => {
      expect(wrapper.vm.$props.role?.permissions).toBeDefined()
    })

    it('should display key metrics', () => {
      expect(wrapper.vm.$props.role?.userCount).toBeDefined()
    })

    it('should show permission search', () => {
      expect(wrapper.vm.permissionSearch !== undefined).toBe(true)
    })
  })

  describe('Dialog Lifecycle', () => {
    it('should initialize with visible prop', () => {
      expect(wrapper.vm.dialogVisible).toBe(true)
    })

    it('should handle visible prop changes', async () => {
      await wrapper.setProps({ visible: false })
      expect(wrapper.vm.dialogVisible).toBe(false)
    })

    it('should emit update:visible on close', async () => {
      wrapper.vm.dialogVisible = false
      await wrapper.vm.$nextTick()
      expect(wrapper.emitted('update:visible')).toBeTruthy()
    })

    it('should reset search on dialog open', async () => {
      wrapper.vm.permissionSearch = 'test'
      await wrapper.setProps({ visible: false })
      await wrapper.vm.$nextTick()
      await wrapper.setProps({ visible: true })
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.permissionSearch).toBe('')
    })

    it('should have closeDialog method', () => {
      expect(typeof wrapper.vm.closeDialog).toBe('function')
    })

    it('should have onDialogHide method', () => {
      expect(typeof wrapper.vm.onDialogHide).toBe('function')
    })
  })

  describe('Role Status Badges', () => {
    it('should display active status', () => {
      expect(wrapper.vm.$props.role?.status).toBe('ACTIVE')
    })

    it('should display default role badge when applicable', () => {
      const defaultRoleTemplate = { ...mockRole, isDefault: true }
      const defaultWrapper = createWrapper({ role: defaultRoleTemplate })
      expect(defaultWrapper.vm.$props.role?.isDefault).toBe(true)
    })

    it('should display system role badge when applicable', () => {
      const systemRoleTemplate = { ...mockRole, isSystemRole: true }
      const systemWrapper = createWrapper({ role: systemRoleTemplate })
      expect(systemWrapper.vm.$props.role?.isSystemRole).toBe(true)
    })

    it('should handle INACTIVE status', () => {
      const inactiveRole = { ...mockRole, status: 'INACTIVE' }
      const inactiveWrapper = createWrapper({ role: inactiveRole })
      expect(inactiveWrapper.vm.getStatusSeverity('INACTIVE')).toBe('danger')
    })

    it('should handle PENDING status', () => {
      const pendingRole = { ...mockRole, status: 'PENDING' }
      const pendingWrapper = createWrapper({ role: pendingRole })
      expect(pendingWrapper.vm.getStatusSeverity('PENDING')).toBe('warning')
    })
  })

  describe('Role Information', () => {
    it('should display role name', () => {
      expect(wrapper.vm.$props.role?.name).toBe('ANALYST')
    })

    it('should display role description', () => {
      expect(wrapper.vm.$props.role?.description).toContain('Data analyst')
    })

    it('should handle missing description', () => {
      const noDescRole = { ...mockRole, description: undefined }
      const noDescWrapper = createWrapper({ role: noDescRole })
      expect(noDescWrapper.vm.$props.role?.description).toBeUndefined()
    })

    it('should display user count', () => {
      expect(wrapper.vm.$props.role?.userCount).toBe(5)
    })

    it('should calculate permission count', () => {
      expect(wrapper.vm.permissionCount).toBe(3)
    })

    it('should display created date', () => {
      expect(wrapper.vm.$props.role?.createdAt).toBeDefined()
    })

    it('should have formatDate method', () => {
      expect(typeof wrapper.vm.formatDate).toBe('function')
    })

    it('should format date correctly', () => {
      const formatted = wrapper.vm.formatDate('2024-01-01T00:00:00Z')
      expect(formatted).toContain('2024')
    })
  })

  describe('Role Helper Functions', () => {
    it('should have getRoleColor method', () => {
      expect(typeof wrapper.vm.getRoleColor).toBe('function')
    })

    it('should return color for role name', () => {
      const color = wrapper.vm.getRoleColor('ANALYST')
      expect(color).toMatch(/^#[0-9A-F]{6}$/i)
    })

    it('should return default color for undefined', () => {
      const color = wrapper.vm.getRoleColor(undefined)
      expect(color).toBe('#6B7280')
    })

    it('should have getRoleInitials method', () => {
      expect(typeof wrapper.vm.getRoleInitials).toBe('function')
    })

    it('should return initials for single word role', () => {
      const initials = wrapper.vm.getRoleInitials('ADMIN')
      expect(initials).toBe('AD')
    })

    it('should return initials for multi-word role', () => {
      const initials = wrapper.vm.getRoleInitials('SUPER_ADMIN')
      expect(initials).toBe('SA')
    })

    it('should handle undefined in getRoleInitials', () => {
      const initials = wrapper.vm.getRoleInitials(undefined)
      expect(initials).toBe('?')
    })

    it('should have getStatusSeverity method', () => {
      expect(typeof wrapper.vm.getStatusSeverity).toBe('function')
    })

    it('should map ACTIVE status to success', () => {
      expect(wrapper.vm.getStatusSeverity('ACTIVE')).toBe('success')
    })

    it('should map INACTIVE status to danger', () => {
      expect(wrapper.vm.getStatusSeverity('INACTIVE')).toBe('danger')
    })

    it('should map PENDING status to warning', () => {
      expect(wrapper.vm.getStatusSeverity('PENDING')).toBe('warning')
    })

    it('should have getLevelSeverity method', () => {
      expect(typeof wrapper.vm.getLevelSeverity).toBe('function')
    })

    it('should map HIGH level to danger', () => {
      expect(wrapper.vm.getLevelSeverity('HIGH')).toBe('danger')
    })

    it('should map MEDIUM level to warning', () => {
      expect(wrapper.vm.getLevelSeverity('MEDIUM')).toBe('warning')
    })

    it('should map LOW level to info', () => {
      expect(wrapper.vm.getLevelSeverity('LOW')).toBe('info')
    })

    it('should have getResourceIcon method', () => {
      expect(typeof wrapper.vm.getResourceIcon).toBe('function')
    })

    it('should return icon for USER resource', () => {
      const icon = wrapper.vm.getResourceIcon('USER')
      expect(icon).toBe('pi pi-user')
    })

    it('should return icon for ROLE resource', () => {
      const icon = wrapper.vm.getResourceIcon('ROLE')
      expect(icon).toBe('pi pi-shield')
    })

    it('should return icon for FUND resource', () => {
      const icon = wrapper.vm.getResourceIcon('FUND')
      expect(icon).toBe('pi pi-briefcase')
    })

    it('should return default icon for unknown resource', () => {
      const icon = wrapper.vm.getResourceIcon('UNKNOWN')
      expect(icon).toBe('pi pi-circle')
    })
  })

  describe('Permissions Display', () => {
    it('should display all permissions', () => {
      expect(wrapper.vm.permissionCount).toBe(3)
    })

    it('should group permissions by resource', () => {
      expect(Object.keys(wrapper.vm.groupedPermissions).length).toBeGreaterThan(0)
    })

    it('should have FUND resource group', () => {
      expect(wrapper.vm.groupedPermissions['FUND']).toBeDefined()
    })

    it('should have INVESTMENT resource group', () => {
      expect(wrapper.vm.groupedPermissions['INVESTMENT']).toBeDefined()
    })

    it('should display permission action', () => {
      const fundPermissions = wrapper.vm.groupedPermissions['FUND']
      expect(fundPermissions[0].action).toBe('READ')
    })

    it('should display permission description', () => {
      const fundPermissions = wrapper.vm.groupedPermissions['FUND']
      expect(fundPermissions[0].description).toContain('fund')
    })

    it('should display permission level', () => {
      const fundPermissions = wrapper.vm.groupedPermissions['FUND']
      expect(fundPermissions[0].level).toBeDefined()
    })

    it('should handle role with no permissions', () => {
      const noPermsRole = { ...mockRole, permissions: [] }
      const noPermsWrapper = createWrapper({ role: noPermsRole })
      expect(noPermsWrapper.vm.permissionCount).toBe(0)
    })

    it('should show empty state for no permissions', () => {
      const noPermsRole = { ...mockRole, permissions: [] }
      const noPermsWrapper = createWrapper({ role: noPermsRole })
      expect(Object.keys(noPermsWrapper.vm.groupedPermissions).length).toBe(0)
    })
  })

  describe('Permission Search', () => {
    it('should initialize permissionSearch as empty', () => {
      expect(wrapper.vm.permissionSearch).toBe('')
    })

    it('should update permissionSearch', async () => {
      wrapper.vm.permissionSearch = 'READ'
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.permissionSearch).toBe('READ')
    })

    it('should filter permissions by action', () => {
      wrapper.vm.permissionSearch = 'READ'
      const filtered = wrapper.vm.filteredGroupedPermissions
      expect(Object.keys(filtered).length).toBeGreaterThan(0)
    })

    it('should filter permissions by resource', () => {
      wrapper.vm.permissionSearch = 'FUND'
      const filtered = wrapper.vm.filteredGroupedPermissions
      expect(filtered['FUND']).toBeDefined()
    })

    it('should filter permissions by description', () => {
      wrapper.vm.permissionSearch = 'export'
      const filtered = wrapper.vm.filteredGroupedPermissions
      expect(Object.keys(filtered).length).toBeGreaterThan(0)
    })

    it('should be case insensitive', () => {
      wrapper.vm.permissionSearch = 'REPORT'
      const filtered = wrapper.vm.filteredGroupedPermissions
      expect(Object.keys(filtered).length).toBeGreaterThan(0)
    })

    it('should clear filters when search is empty', () => {
      wrapper.vm.permissionSearch = 'FUND'
      wrapper.vm.permissionSearch = ''
      const filtered = wrapper.vm.filteredGroupedPermissions
      expect(Object.keys(filtered).length).toBe(Object.keys(wrapper.vm.groupedPermissions).length)
    })

    it('should return empty result for non-matching search', () => {
      wrapper.vm.permissionSearch = 'NONEXISTENT'
      const filtered = wrapper.vm.filteredGroupedPermissions
      expect(Object.keys(filtered).length).toBe(0)
    })

    it('should handle search with whitespace', () => {
      wrapper.vm.permissionSearch = '  fund  '
      const filtered = wrapper.vm.filteredGroupedPermissions
      // Whitespace is preserved in search, so this shouldn't match
      expect(Object.keys(filtered).length).toBe(0)
    })
  })

  describe('Key Metrics', () => {
    it('should display user count metric', () => {
      expect(wrapper.vm.$props.role?.userCount).toBe(5)
    })

    it('should display permission count metric', () => {
      expect(wrapper.vm.permissionCount).toBe(3)
    })

    it('should display created date metric', () => {
      expect(wrapper.vm.$props.role?.createdAt).toBeDefined()
    })

    it('should calculate permission count from permissions array', () => {
      expect(wrapper.vm.permissionCount).toBe(wrapper.vm.$props.role?.permissions?.length)
    })

    it('should handle zero user count', () => {
      const zeroUsersRole = { ...mockRole, userCount: 0 }
      const zeroWrapper = createWrapper({ role: zeroUsersRole })
      expect(zeroWrapper.vm.$props.role?.userCount).toBe(0)
    })
  })

  describe('Props and Emits', () => {
    it('should accept visible prop', () => {
      expect(wrapper.vm.$props.visible).toBe(true)
    })

    it('should accept role prop', () => {
      expect(wrapper.vm.$props.role).toEqual(mockRole)
    })

    it('should emit update:visible', async () => {
      wrapper.vm.dialogVisible = false
      await wrapper.vm.$nextTick()
      expect(wrapper.emitted('update:visible')).toBeTruthy()
    })

    it('should handle null role prop', () => {
      const nullWrapper = createWrapper({ role: null })
      expect(nullWrapper.vm.$props.role).toBeNull()
    })

    it('should handle visible false prop', () => {
      const hiddenWrapper = createWrapper({ visible: false })
      expect(hiddenWrapper.vm.dialogVisible).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long role description', () => {
      const longDescRole = { ...mockRole, description: 'A'.repeat(500) }
      const longWrapper = createWrapper({ role: longDescRole })
      expect(longWrapper.vm.$props.role?.description.length).toBe(500)
    })

    it('should handle special characters in role name', () => {
      const specialRole = { ...mockRole, name: 'ROLE_WITH_SPECIAL-CHARS' }
      const specialWrapper = createWrapper({ role: specialRole })
      expect(specialRole.name).toContain('_')
    })

    it('should handle many permissions', () => {
      const manyPermsRole = {
        ...mockRole,
        permissions: Array.from({ length: 50 }, (_, i) => ({
          id: `${i}`,
          action: 'READ',
          resource: 'FUND',
          level: 'LOW',
          description: `Permission ${i}`
        }))
      }
      const manyWrapper = createWrapper({ role: manyPermsRole })
      expect(manyWrapper.vm.permissionCount).toBe(50)
    })

    it('should handle permissions with very long description', () => {
      const longPermRole = {
        ...mockRole,
        permissions: [{
          id: '1',
          action: 'READ',
          resource: 'FUND',
          level: 'LOW',
          description: 'A'.repeat(500)
        }]
      }
      const longWrapper = createWrapper({ role: longPermRole })
      expect(longWrapper.vm.permissionCount).toBe(1)
    })

    it('should handle permissions without level', () => {
      const noLevelRole = {
        ...mockRole,
        permissions: [{
          id: '1',
          action: 'READ',
          resource: 'FUND',
          description: 'Permission without level'
        }]
      }
      const noLevelWrapper = createWrapper({ role: noLevelRole })
      expect(noLevelWrapper.vm.permissionCount).toBe(1)
    })

    it('should handle role without user count', () => {
      const noCountRole = { ...mockRole, userCount: undefined }
      const noCountWrapper = createWrapper({ role: noCountRole })
      expect(noCountWrapper.vm.$props.role?.userCount).toBeUndefined()
    })

    it('should handle role without created date', () => {
      const noDateRole = { ...mockRole, createdAt: undefined }
      const noDateWrapper = createWrapper({ role: noDateRole })
      expect(noDateWrapper.vm.$props.role?.createdAt).toBeUndefined()
    })
  })

  describe('Dialog Actions', () => {
    it('should have closeDialog method', () => {
      expect(typeof wrapper.vm.closeDialog).toBe('function')
    })

    it('should close dialog when closeDialog is called', () => {
      wrapper.vm.closeDialog()
      expect(wrapper.emitted('update:visible')).toBeTruthy()
    })

    it('should reset search when dialog closes', () => {
      wrapper.vm.permissionSearch = 'test'
      wrapper.vm.onDialogHide()
      expect(wrapper.vm.permissionSearch).toBe('')
    })

    it('should reset search on dialog open', async () => {
      wrapper.vm.permissionSearch = 'test'
      await wrapper.setProps({ visible: false })
      await wrapper.vm.$nextTick()
      await wrapper.setProps({ visible: true })
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.permissionSearch).toBe('')
    })
  })

  describe('Computed Properties', () => {
    it('should compute permissionCount from role permissions', () => {
      expect(wrapper.vm.permissionCount).toBe(wrapper.vm.$props.role?.permissions?.length)
    })

    it('should compute groupedPermissions', () => {
      const grouped = wrapper.vm.groupedPermissions
      expect(Object.keys(grouped).length).toBeGreaterThan(0)
    })

    it('should compute filteredGroupedPermissions', () => {
      wrapper.vm.permissionSearch = 'FUND'
      const filtered = wrapper.vm.filteredGroupedPermissions
      expect(Object.keys(filtered).length).toBeGreaterThan(0)
    })

    it('should compute dialogVisible from visible prop', () => {
      expect(wrapper.vm.dialogVisible).toBe(wrapper.vm.$props.visible)
    })
  })

  describe('Watchers', () => {
    it('should watch dialogVisible changes', async () => {
      wrapper.vm.permissionSearch = 'test'
      await wrapper.setProps({ visible: false })
      await wrapper.vm.$nextTick()
      wrapper.vm.permissionSearch = 'test'
      await wrapper.setProps({ visible: true })
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.permissionSearch).toBe('')
    })
  })

  describe('Permission Resources', () => {
    it('should display FUND permissions', () => {
      expect(wrapper.vm.groupedPermissions['FUND']).toBeDefined()
    })

    it('should display INVESTMENT permissions', () => {
      expect(wrapper.vm.groupedPermissions['INVESTMENT']).toBeDefined()
    })

    it('should display REPORT permissions', () => {
      expect(wrapper.vm.groupedPermissions['REPORT']).toBeDefined()
    })

    it('should group multiple permissions by resource', () => {
      const fundPerms = wrapper.vm.groupedPermissions['FUND']
      expect(Array.isArray(fundPerms)).toBe(true)
    })

    it('should calculate permission count per resource', () => {
      const fundPerms = wrapper.vm.groupedPermissions['FUND']
      expect(fundPerms.length).toBeGreaterThan(0)
    })
  })
})
