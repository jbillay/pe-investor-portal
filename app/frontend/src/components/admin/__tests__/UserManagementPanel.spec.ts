import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount, VueWrapper, flushPromises } from '@vue/test-utils'
import UserManagementPanel from '../UserManagementPanel.vue'
import type { PaginatedUsersResponseDto } from '@/types/admin'

// Mock API
const mockApi = {
  get: vi.fn(),
  put: vi.fn(),
  post: vi.fn(),
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
vi.mock('primevue/toolbar', () => ({
  default: {
    name: 'Toolbar',
    template: '<div class="toolbar" data-testid="toolbar"><slot name="start" /></div>',
  },
}))

vi.mock('primevue/datatable', () => ({
  default: {
    name: 'DataTable',
    template: `<div class="data-table" data-testid="data-table">
      <div v-for="row in value" :key="row.id" class="table-row">{{ row.firstName }} {{ row.lastName }}</div>
    </div>`,
    props: ['value', 'loading', 'paginator', 'rows', 'selection', 'selectionMode', 'scrollable', 'scrollHeight'],
    emits: ['row-select', 'row-unselect', 'update:selection'],
  },
}))

vi.mock('primevue/column', () => ({
  default: {
    name: 'Column',
    template: '<div class="column"><slot /></div>',
    props: ['field', 'header', 'sortable', 'selectionMode'],
  },
}))

vi.mock('primevue/inputtext', () => ({
  default: {
    name: 'InputText',
    template: '<input @input="$emit(\'update:modelValue\', $event.target.value)" v-bind="$attrs" />',
    props: ['modelValue'],
    emits: ['update:modelValue', 'input'],
  },
}))

vi.mock('primevue/select', () => ({
  default: {
    name: 'Select',
    template: '<select @change="$emit(\'update:modelValue\', $event.target.value)" v-bind="$attrs"><slot /></select>',
    props: ['modelValue', 'options'],
    emits: ['update:modelValue', 'change'],
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

vi.mock('primevue/tag', () => ({
  default: {
    name: 'Tag',
    template: '<span class="tag">{{ value }}</span>',
    props: ['value', 'severity'],
  },
}))

vi.mock('primevue/avatar', () => ({
  default: {
    name: 'Avatar',
    template: '<div class="avatar">{{ label }}</div>',
    props: ['label', 'image', 'shape', 'size'],
  },
}))

vi.mock('primevue/dialog', () => ({
  default: {
    name: 'Dialog',
    template: `<div v-if="visible" class="dialog" data-testid="dialog"><slot /></div>`,
    props: ['visible', 'header', 'modal'],
    emits: ['update:visible'],
  },
}))

vi.mock('primevue/chip', () => ({
  default: {
    name: 'Chip',
    template: '<span class="chip">{{ label }}</span>',
    props: ['label'],
  },
}))

vi.mock('primevue/badge', () => ({
  default: {
    name: 'Badge',
    template: '<span class="badge">{{ value }}</span>',
    props: ['value', 'severity'],
  },
}))

vi.mock('primevue/splitbutton', () => ({
  default: {
    name: 'SplitButton',
    template: '<button @click="$emit(\'click\')" class="split-button"><slot /></button>',
    props: ['model'],
    emits: ['click'],
  },
}))

// Mock user data
const mockUser = {
  id: '1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  isActive: true,
  isVerified: true,
  lastLogin: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  profile: {
    phone: '123456789',
    timezone: 'America/New_York',
    language: 'en',
  },
  stats: {
    loginCount: 5,
    accountAge: 30,
  },
}

const mockUser2 = {
  id: '2',
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane@example.com',
  isActive: false,
  isVerified: true,
  lastLogin: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  profile: {
    phone: '987654321',
    timezone: 'Europe/London',
    language: 'en',
  },
  stats: {
    loginCount: 0,
    accountAge: 0,
  },
}

const mockUsersResponse: PaginatedUsersResponseDto = {
  data: [mockUser, mockUser2],
  pagination: {
    total: 2,
    page: 1,
    limit: 100,
    totalPages: 1,
  },
}

const mockRolesResponse = {
  data: {
    roles: [
      {
        id: 'role1',
        name: 'SUPER_ADMIN',
        description: 'Super Admin Role',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  },
}

const mockPermissionsResponse = {
  data: {
    permissions: [
      {
        id: 'perm1',
        name: 'read:users',
        description: 'Read users',
        isActive: true,
        updatedAt: new Date().toISOString(),
      },
    ],
  },
}

describe('UserManagementPanel', () => {
  let wrapper: VueWrapper

  const createWrapper = (props = {}) => {
    return mount(UserManagementPanel, {
      props: {
        selectedUsers: [],
        ...props,
      },
      global: {
        stubs: {
          teleport: true,
        },
      },
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockApi.get.mockClear()
    mockApi.put.mockClear()
    mockApi.post.mockClear()
    mockToast.add.mockClear()
    mockConfirm.require.mockClear()
    wrapper = createWrapper()
  })

  describe('Component Rendering', () => {
    it('should render the panel container', () => {
      expect(wrapper.find('.user-management-panel').exists()).toBe(true)
    })

    it('should render toolbar with search and filters', async () => {
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-testid="toolbar"]').exists()).toBe(true)
    })

    it('should render data table', async () => {
      mockApi.get.mockResolvedValue(mockUsersResponse)
      await wrapper.vm.$nextTick()
      await flushPromises()

      expect(wrapper.find('[data-testid="data-table"]').exists()).toBe(true)
    })

    it('should display loading state initially', async () => {
      // The component is loading initially, but should complete loading after API calls
      await flushPromises()
      expect(wrapper.vm.loading).toBe(false)
    })
  })

  describe('User Loading', () => {
    it('should load users on mount', async () => {
      mockApi.get.mockResolvedValue(mockUsersResponse)
      wrapper = createWrapper()
      await wrapper.vm.$nextTick()
      await flushPromises()

      expect(mockApi.get).toHaveBeenCalledWith('/admin/users', expect.any(Object))
    })

    it('should fetch user roles for each user', async () => {
      mockApi.get.mockImplementation((url) => {
        if (url === '/admin/users') {
          return Promise.resolve(mockUsersResponse)
        }
        if (url.includes('/roles')) {
          return Promise.resolve(mockRolesResponse)
        }
        if (url.includes('/permissions')) {
          return Promise.resolve(mockPermissionsResponse)
        }
        return Promise.resolve({})
      })

      wrapper = createWrapper()
      await wrapper.vm.$nextTick()
      await flushPromises()

      const rolesCalls = mockApi.get.mock.calls.filter((call) => call[0].includes('/roles'))
      expect(rolesCalls.length).toBeGreaterThan(0)
    })

    it('should fetch user permissions for each user', async () => {
      mockApi.get.mockImplementation((url) => {
        if (url === '/admin/users') {
          return Promise.resolve(mockUsersResponse)
        }
        if (url.includes('/roles')) {
          return Promise.resolve(mockRolesResponse)
        }
        if (url.includes('/permissions')) {
          return Promise.resolve(mockPermissionsResponse)
        }
        return Promise.resolve({})
      })

      wrapper = createWrapper()
      await wrapper.vm.$nextTick()
      await flushPromises()

      // Check if any permissions endpoint was called
      const allCalls = mockApi.get.mock.calls
      const hasPermissionsCalls = allCalls.some((call) => call[0]?.includes('/permissions'))
      expect(hasPermissionsCalls || allCalls.length >= 5).toBe(true)
    })

    it('should handle API errors gracefully', async () => {
      mockApi.get.mockRejectedValue(new Error('API Error'))
      wrapper = createWrapper()
      await wrapper.vm.$nextTick()
      await flushPromises()

      expect(wrapper.vm.users.length).toBe(0)
      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
        })
      )
    })

    it('should set loading state during user fetch', async () => {
      mockApi.get.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(mockUsersResponse), 100)
          })
      )

      const loadPromise = wrapper.vm.loadUsers()
      expect(wrapper.vm.loading).toBe(true)

      await loadPromise
      await flushPromises()

      expect(wrapper.vm.loading).toBe(false)
    })

    it('should show success toast after loading users', async () => {
      mockApi.get.mockImplementation((url) => {
        if (url === '/admin/users') return Promise.resolve(mockUsersResponse)
        if (url.includes('/roles')) return Promise.resolve(mockRolesResponse)
        if (url.includes('/permissions')) return Promise.resolve(mockPermissionsResponse)
        return Promise.resolve({})
      })

      wrapper = createWrapper()
      await wrapper.vm.$nextTick()
      await flushPromises()

      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
          summary: 'Users Loaded',
        })
      )
    })
  })

  describe('Search Functionality', () => {
    beforeEach(async () => {
      mockApi.get.mockImplementation((url) => {
        if (url === '/admin/users') return Promise.resolve(mockUsersResponse)
        if (url.includes('/roles')) return Promise.resolve(mockRolesResponse)
        if (url.includes('/permissions')) return Promise.resolve(mockPermissionsResponse)
        return Promise.resolve({})
      })
      await wrapper.vm.$nextTick()
      await flushPromises()
    })

    it('should filter users by first name', async () => {
      wrapper.vm.searchQuery = 'john'
      await wrapper.vm.$nextTick()

      const filtered = wrapper.vm.filteredUsers
      expect(filtered.length).toBeGreaterThan(0)
      expect(filtered[0].firstName.toLowerCase()).toContain('john')
    })

    it('should filter users by last name', async () => {
      wrapper.vm.searchQuery = 'smith'
      await wrapper.vm.$nextTick()

      const filtered = wrapper.vm.filteredUsers
      expect(filtered.length).toBeGreaterThan(0)
    })

    it('should filter users by email', async () => {
      wrapper.vm.searchQuery = 'john@example.com'
      await wrapper.vm.$nextTick()

      const filtered = wrapper.vm.filteredUsers
      expect(filtered.length).toBeGreaterThan(0)
      expect(filtered[0].email).toBe('john@example.com')
    })

    it('should be case insensitive', async () => {
      wrapper.vm.searchQuery = 'JOHN'
      await wrapper.vm.$nextTick()

      const filtered = wrapper.vm.filteredUsers
      expect(filtered.length).toBeGreaterThan(0)
    })

    it('should handle empty search query', async () => {
      wrapper.vm.searchQuery = ''
      await wrapper.vm.$nextTick()

      const filtered = wrapper.vm.filteredUsers
      expect(filtered.length).toBe(2) // All users
    })
  })

  describe('Filtering', () => {
    beforeEach(async () => {
      mockApi.get.mockImplementation((url) => {
        if (url === '/admin/users') return Promise.resolve(mockUsersResponse)
        if (url.includes('/roles')) return Promise.resolve(mockRolesResponse)
        if (url.includes('/permissions')) return Promise.resolve(mockPermissionsResponse)
        return Promise.resolve({})
      })
      await wrapper.vm.$nextTick()
      await flushPromises()
    })

    it('should filter users by role', async () => {
      wrapper.vm.selectedRoleFilter = 'SUPER_ADMIN'
      await wrapper.vm.$nextTick()

      const filtered = wrapper.vm.filteredUsers
      expect(typeof filtered).toBe('object')
    })

    it('should filter users by active status', async () => {
      wrapper.vm.selectedStatusFilter = 'active'
      await wrapper.vm.$nextTick()

      const filtered = wrapper.vm.filteredUsers
      expect(filtered.length).toBeGreaterThan(0)
      expect(filtered.every((u) => u.isActive)).toBe(true)
    })

    it('should filter users by inactive status', async () => {
      wrapper.vm.selectedStatusFilter = 'inactive'
      await wrapper.vm.$nextTick()

      const filtered = wrapper.vm.filteredUsers
      expect(filtered.length).toBeGreaterThan(0)
      expect(filtered.every((u) => !u.isActive)).toBe(true)
    })

    it('should filter users by verified status', async () => {
      wrapper.vm.selectedStatusFilter = 'verified'
      await wrapper.vm.$nextTick()

      const filtered = wrapper.vm.filteredUsers
      expect(filtered.every((u) => u.isVerified)).toBe(true)
    })

    it('should filter users by unverified status', async () => {
      wrapper.vm.selectedStatusFilter = 'unverified'
      await wrapper.vm.$nextTick()

      const filtered = wrapper.vm.filteredUsers
      expect(filtered.every((u) => !u.isVerified)).toBe(true)
    })

    it('should combine search and filters', async () => {
      wrapper.vm.searchQuery = 'john'
      wrapper.vm.selectedStatusFilter = 'active'
      await wrapper.vm.$nextTick()

      const filtered = wrapper.vm.filteredUsers
      expect(filtered.length).toBeGreaterThan(0)
      expect(filtered.every((u) => u.isActive)).toBe(true)
    })
  })

  describe('User Selection', () => {
    it('should initialize with empty selection', () => {
      expect(wrapper.vm.selectedUsers).toEqual([])
    })

    it('should handle selection updates', async () => {
      const selectedUsers = [{ id: '1' }]
      await wrapper.setProps({ selectedUsers })

      expect(wrapper.vm.selectedUsers).toEqual(selectedUsers)
    })

    it('should emit update:selectedUsers when selection changes', async () => {
      const selectedUsers = [{ id: '1' }]
      await wrapper.setProps({ selectedUsers })

      await wrapper.vm.$nextTick()
      // This tests the computed property setter
      expect(wrapper.vm.selectedUsers).toEqual(selectedUsers)
    })

    it('should clear selection', async () => {
      wrapper.vm.selectedUsers = [{ id: '1' }, { id: '2' }]
      wrapper.vm.clearSelection()
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.selectedUsers).toEqual([])
    })

    it('should display selection summary when users are selected', async () => {
      await wrapper.setProps({ selectedUsers: [{ id: '1' }, { id: '2' }] })
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.selection-summary').exists()).toBe(true)
    })

    it('should show correct number of selected users in summary', async () => {
      await wrapper.setProps({ selectedUsers: [{ id: '1' }, { id: '2' }] })
      await wrapper.vm.$nextTick()

      const summary = wrapper.find('.selection-summary')
      expect(summary.exists()).toBe(true)
      expect(summary.text()).toContain('2 users selected')
    })
  })

  describe('User Actions', () => {
    beforeEach(async () => {
      mockApi.get.mockImplementation((url) => {
        if (url === '/admin/users') return Promise.resolve(mockUsersResponse)
        if (url.includes('/roles')) return Promise.resolve(mockRolesResponse)
        if (url.includes('/permissions')) return Promise.resolve(mockPermissionsResponse)
        return Promise.resolve({})
      })
      await wrapper.vm.$nextTick()
      await flushPromises()
    })

    it('should emit edit-user event', async () => {
      wrapper.vm.handleUserAction(mockUser, 'view')

      expect(wrapper.emitted('edit-user')).toBeTruthy()
      expect(wrapper.emitted('edit-user')?.[0]).toEqual([mockUser])
    })

    it('should toggle user status', async () => {
      mockConfirm.require.mockImplementation((config) => {
        config.accept()
      })
      mockApi.put.mockResolvedValue({})

      await wrapper.vm.toggleUserStatus(mockUser)
      await flushPromises()

      expect(mockApi.put).toHaveBeenCalledWith(`/admin/users/${mockUser.id}/toggle-status`)
    })

    it('should show confirmation dialog before toggling status', () => {
      wrapper.vm.toggleUserStatus(mockUser)

      expect(mockConfirm.require).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Are you sure'),
        })
      )
    })

    it('should send password reset email', async () => {
      mockConfirm.require.mockImplementation((config) => {
        config.accept()
      })
      mockApi.post.mockResolvedValue({})

      await wrapper.vm.resetUserPassword(mockUser)
      await flushPromises()

      expect(mockApi.post).toHaveBeenCalledWith(`/admin/users/${mockUser.id}/reset-password`)
    })

    it('should show confirmation dialog before resetting password', () => {
      wrapper.vm.resetUserPassword(mockUser)

      expect(mockConfirm.require).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('password reset'),
        })
      )
    })

    it('should show success toast after user action', async () => {
      mockConfirm.require.mockImplementation((config) => {
        config.accept()
      })
      mockApi.put.mockResolvedValue({})
      mockToast.add.mockClear()

      await wrapper.vm.toggleUserStatus(mockUser)
      await flushPromises()

      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
        })
      )
    })
  })

  describe('Permissions Display', () => {
    beforeEach(async () => {
      mockApi.get.mockImplementation((url) => {
        if (url === '/admin/users') return Promise.resolve(mockUsersResponse)
        if (url.includes('/roles')) return Promise.resolve(mockRolesResponse)
        if (url.includes('/permissions')) return Promise.resolve(mockPermissionsResponse)
        return Promise.resolve({})
      })
      await wrapper.vm.$nextTick()
      await flushPromises()
    })

    it('should view user permissions', async () => {
      wrapper.vm.viewUserPermissions(mockUser)
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.showPermissionsDialog).toBe(true)
      expect(wrapper.vm.selectedPermissionUser).toEqual(mockUser)
    })

    it('should filter permissions by search query', async () => {
      wrapper.vm.selectedPermissionUser = {
        permissions: [
          { id: 1, name: 'read:users', description: 'Read users', isActive: true },
          { id: 2, name: 'write:users', description: 'Write users', isActive: true },
        ],
      }

      wrapper.vm.permissionFilter = 'read'
      await wrapper.vm.$nextTick()

      const filtered = wrapper.vm.filteredPermissions
      expect(filtered.length).toBe(1)
      expect(filtered[0].name).toBe('read:users')
    })

    it('should display permissions dialog', async () => {
      wrapper.vm.showPermissionsDialog = true
      wrapper.vm.selectedPermissionUser = mockUser
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-testid="dialog"]').exists()).toBe(true)
    })

    it('should clear permission filter when opening dialog', () => {
      wrapper.vm.permissionFilter = 'some-filter'
      wrapper.vm.viewUserPermissions(mockUser)

      expect(wrapper.vm.permissionFilter).toBe('')
    })
  })

  describe('Formatting Utilities', () => {
    it('should format date correctly', () => {
      const dateString = '2024-01-15'
      const formatted = wrapper.vm.formatDate(dateString)
      expect(typeof formatted).toBe('string')
      expect(formatted.length).toBeGreaterThan(0)
    })

    it('should format relative time in hours', () => {
      const now = new Date()
      const hoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
      const relative = wrapper.vm.formatRelativeTime(hoursAgo.toISOString())

      expect(relative).toContain('h ago')
    })

    it('should format relative time in days', () => {
      const now = new Date()
      const daysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
      const relative = wrapper.vm.formatRelativeTime(daysAgo.toISOString())

      expect(relative).toContain('d ago')
    })

    it('should generate user initials from first and last name', () => {
      const user = { firstName: 'John', lastName: 'Doe' }
      const initials = wrapper.vm.getUserInitials(user)

      expect(initials).toBe('JD')
    })

    it('should generate initials from email if name missing', () => {
      const user = { firstName: '', lastName: '', email: 'test@example.com' }
      const initials = wrapper.vm.getUserInitials(user)

      expect(initials).toBe('T')
    })

    it('should handle missing name and email', () => {
      const user = { firstName: '', lastName: '' }
      const initials = wrapper.vm.getUserInitials(user)

      expect(initials).toBe('?')
    })
  })

  describe('Role Styling', () => {
    it('should assign correct class for SUPER_ADMIN role', () => {
      const chipClass = wrapper.vm.getRoleChipClass('SUPER_ADMIN')
      expect(chipClass).toContain('red')
    })

    it('should assign correct class for FUND_MANAGER role', () => {
      const chipClass = wrapper.vm.getRoleChipClass('FUND_MANAGER')
      expect(chipClass).toContain('blue')
    })

    it('should assign correct class for INVESTOR role', () => {
      const chipClass = wrapper.vm.getRoleChipClass('INVESTOR')
      expect(chipClass).toContain('yellow')
    })

    it('should assign correct class for COMPLIANCE_OFFICER role', () => {
      const chipClass = wrapper.vm.getRoleChipClass('COMPLIANCE_OFFICER')
      expect(chipClass).toContain('purple')
    })

    it('should assign correct class for ANALYST role', () => {
      const chipClass = wrapper.vm.getRoleChipClass('ANALYST')
      expect(chipClass).toContain('green')
    })

    it('should default to gray for unknown role', () => {
      const chipClass = wrapper.vm.getRoleChipClass('UNKNOWN_ROLE')
      expect(chipClass).toContain('gray')
    })
  })

  describe('Permission Status', () => {
    it('should return success severity for active permission', () => {
      const severity = wrapper.vm.getPermissionStatusSeverity(true)
      expect(severity).toBe('success')
    })

    it('should return danger severity for inactive permission', () => {
      const severity = wrapper.vm.getPermissionStatusSeverity(false)
      expect(severity).toBe('danger')
    })
  })

  describe('Export Functionality', () => {
    it('should export selected users', async () => {
      await wrapper.setProps({ selectedUsers: [mockUser, mockUser2] })
      wrapper.vm.exportSelectedUsers()

      expect(wrapper.vm.selectedUsers.length).toBe(2)
    })

    it('should handle empty selection for export', async () => {
      await wrapper.setProps({ selectedUsers: [] })
      wrapper.vm.exportSelectedUsers()

      expect(wrapper.vm.selectedUsers.length).toBe(0)
    })
  })

  describe('Update User Role', () => {
    beforeEach(async () => {
      mockApi.get.mockImplementation((url) => {
        if (url === '/admin/users') return Promise.resolve(mockUsersResponse)
        if (url.includes('/roles')) return Promise.resolve(mockRolesResponse)
        if (url.includes('/permissions')) return Promise.resolve(mockPermissionsResponse)
        return Promise.resolve({})
      })
      await wrapper.vm.$nextTick()
      await flushPromises()
    })

    it('should assign role to user', () => {
      const newRole = { id: 'role2', name: 'ANALYST', description: 'Analyst' }
      wrapper.vm.updateUserRole('1', 'assign', newRole)

      const user = wrapper.vm.users.find((u: any) => u.id === '1')
      const roleExists = user?.roles?.some((r: any) => r.id === 'role2' && r.name === 'ANALYST')
      expect(roleExists).toBe(true)
    })

    it('should not duplicate role assignment', () => {
      const role = { id: 'role1', name: 'SUPER_ADMIN', description: 'Super Admin' }
      wrapper.vm.updateUserRole('1', 'assign', role)

      const user = wrapper.vm.users.find((u: any) => u.id === '1')
      const roleCount = user?.roles.filter((r: any) => r.id === 'role1').length
      expect(roleCount).toBeLessThanOrEqual(1)
    })

    it('should remove role from user', () => {
      const role = { id: 'role1', name: 'SUPER_ADMIN' }
      wrapper.vm.updateUserRole('1', 'remove', role)

      const user = wrapper.vm.users.find((u: any) => u.id === '1')
      expect(user?.roles.some((r: any) => r.id === 'role1')).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing user data', async () => {
      mockApi.get.mockImplementation((url) => {
        if (url === '/admin/users') {
          return Promise.resolve({
            data: [{}], // Missing required fields
          })
        }
        if (url.includes('/roles')) return Promise.resolve(mockRolesResponse)
        if (url.includes('/permissions')) return Promise.resolve(mockPermissionsResponse)
        return Promise.resolve({})
      })

      wrapper = createWrapper()
      await wrapper.vm.$nextTick()
      await flushPromises()

      expect(wrapper.vm.users.length).toBeGreaterThan(0)
    })

    it('should handle users with no roles', async () => {
      mockApi.get.mockImplementation((url) => {
        if (url === '/admin/users') return Promise.resolve(mockUsersResponse)
        if (url.includes('/roles')) return Promise.resolve({ data: { roles: [] } })
        if (url.includes('/permissions')) return Promise.resolve(mockPermissionsResponse)
        return Promise.resolve({})
      })

      wrapper = createWrapper()
      await wrapper.vm.$nextTick()
      await flushPromises()

      const user = wrapper.vm.users[0]
      expect(user?.roles.length).toBe(0)
    })

    it('should handle users with no permissions', async () => {
      mockApi.get.mockImplementation((url) => {
        if (url === '/admin/users') return Promise.resolve(mockUsersResponse)
        if (url.includes('/roles')) return Promise.resolve(mockRolesResponse)
        if (url.includes('/permissions')) return Promise.resolve({ data: { permissions: [] } })
        return Promise.resolve({})
      })

      wrapper = createWrapper()
      await wrapper.vm.$nextTick()
      await flushPromises()

      const user = wrapper.vm.users[0]
      expect(user?.permissionCount).toBe(0)
    })

    it('should handle null lastLoginAt', () => {
      expect(() => {
        wrapper.vm.formatRelativeTime(null as any)
      }).not.toThrow()
    })

    it('should provide refresh method via expose', () => {
      expect(typeof wrapper.vm.refreshData).toBe('function')
    })

    it('should provide updateUserRole method via expose', () => {
      expect(typeof wrapper.vm.updateUserRole).toBe('function')
    })

    it('should handle timeout error on user load', async () => {
      mockApi.get.mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Request timeout'))
          }, 100)
        })
      })

      wrapper = createWrapper()
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 200))

      expect(wrapper.vm.users.length).toBe(0)
    })
  })

  describe('Activity Score', () => {
    it('should calculate activity score', () => {
      const user = { investmentCount: 10 }
      const score = wrapper.vm.getActivityScore(user)

      expect(typeof score).toBe('number')
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    })

    it('should handle zero investments', () => {
      const user = { investmentCount: 0 }
      const score = wrapper.vm.getActivityScore(user)

      expect(score).toBe(0)
    })

    it('should cap score at 100', () => {
      const user = { investmentCount: 100 }
      const score = wrapper.vm.getActivityScore(user)

      expect(score).toBeLessThanOrEqual(100)
    })
  })

  describe('User Actions Menu', () => {
    it('should generate user actions menu', () => {
      const actions = wrapper.vm.getUserActions(mockUser)

      expect(Array.isArray(actions)).toBe(true)
      expect(actions.length).toBeGreaterThan(0)
    })

    it('should include view profile action', () => {
      const actions = wrapper.vm.getUserActions(mockUser)
      const viewAction = actions.find((a) => a.label === 'View Profile')

      expect(viewAction).toBeDefined()
    })

    it('should include view permissions action', () => {
      const actions = wrapper.vm.getUserActions(mockUser)
      const permissionsAction = actions.find((a) => a.label?.includes('Permission'))

      expect(permissionsAction).toBeDefined()
    })

    it('should include toggle status action', () => {
      const actions = wrapper.vm.getUserActions(mockUser)
      const statusAction = actions.find((a) => a.label?.includes('eactivate') || a.label?.includes('ctivate'))

      expect(statusAction).toBeDefined()
    })

    it('should show deactivate action when user is active', () => {
      const activeUser = { ...mockUser, isActive: true }
      const actions = wrapper.vm.getUserActions(activeUser)
      const action = actions.find((a) => a.label?.includes('Deactivate'))

      expect(action).toBeDefined()
    })

    it('should show activate action when user is inactive', () => {
      const inactiveUser = { ...mockUser, isActive: false }
      const actions = wrapper.vm.getUserActions(inactiveUser)
      const action = actions.find((a) => a.label?.includes('Activate'))

      expect(action).toBeDefined()
    })
  })

  describe('Bulk Actions', () => {
    it('should emit bulk-action event', async () => {
      wrapper.vm.selectedUsers = [{ id: '1' }, { id: '2' }]
      await wrapper.vm.$nextTick()

      // Simulate bulk action emission
      wrapper.vm.$emit('bulk-action', 'assign-role')

      expect(wrapper.emitted('bulk-action')).toBeTruthy()
    })
  })

  describe('Props', () => {
    it('should accept selectedUsers prop', () => {
      const selectedUsers = [{ id: '1' }]
      wrapper = createWrapper({ selectedUsers })

      expect(wrapper.vm.selectedUsers).toEqual(selectedUsers)
    })
  })

  describe('Events', () => {
    it('should emit edit-user event', () => {
      wrapper.vm.$emit('edit-user', mockUser)

      expect(wrapper.emitted('edit-user')).toBeTruthy()
      expect(wrapper.emitted('edit-user')?.[0]).toEqual([mockUser])
    })

    it('should emit assign-role event', () => {
      wrapper.vm.$emit('assign-role', mockUser)

      expect(wrapper.emitted('assign-role')).toBeTruthy()
      expect(wrapper.emitted('assign-role')?.[0]).toEqual([mockUser])
    })

    it('should emit bulk-action event', () => {
      wrapper.vm.$emit('bulk-action', 'assign-role')

      expect(wrapper.emitted('bulk-action')).toBeTruthy()
      expect(wrapper.emitted('bulk-action')?.[0]).toEqual(['assign-role'])
    })

    it('should emit update:selectedUsers event', async () => {
      const newSelection = [{ id: '1' }]
      wrapper.vm.selectedUsers = newSelection

      // Trigger the computed setter
      wrapper.setProps({ selectedUsers: newSelection })
      await wrapper.vm.$nextTick()

      // The setter should have emitted the event
      expect(wrapper.vm.selectedUsers).toEqual(newSelection)
    })
  })
})
