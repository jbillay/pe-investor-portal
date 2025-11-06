import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useRoles } from '../useRoles'
import { roleApiService } from '@/services/roleApiService'
import type { Role, CreateRoleData, UpdateRoleData } from '@/types/role'

// Mock dependencies
vi.mock('primevue/usetoast', () => ({
  useToast: () => ({
    add: vi.fn(),
  }),
}))

vi.mock('@/services/roleApiService', () => ({
  roleApiService: {
    getAllRoles: vi.fn(),
    getRoleStatistics: vi.fn(),
    createRole: vi.fn(),
    updateRole: vi.fn(),
    deleteRole: vi.fn(),
    performBulkOperation: vi.fn(),
  },
  RoleApiServiceError: class RoleApiServiceError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'RoleApiServiceError'
    }
  },
}))

describe('useRoles', () => {
  const mockRole: Role = {
    id: '1',
    name: 'Admin',
    description: 'Administrator role',
    status: 'ACTIVE',
    isSystemRole: true,
    isDefault: false,
    permissionCount: 10,
    userCount: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockRole2: Role = {
    id: '2',
    name: 'User',
    description: 'Regular user role',
    status: 'ACTIVE',
    isSystemRole: false,
    isDefault: true,
    permissionCount: 3,
    userCount: 20,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should initialize with empty roles array', () => {
      const { roles } = useRoles()
      expect(roles.value).toEqual([])
    })

    it('should initialize with loading false', () => {
      const { loading } = useRoles()
      expect(loading.value).toBe(false)
    })

    it('should initialize with no error', () => {
      const { error } = useRoles()
      expect(error.value).toBeNull()
    })

    it('should initialize with empty selected roles', () => {
      const { selectedRoles } = useRoles()
      expect(selectedRoles.value).toEqual([])
    })

    it('should initialize with null statistics', () => {
      const { statistics } = useRoles()
      expect(statistics.value).toBeNull()
    })
  })

  describe('fetchRoles', () => {
    it('should fetch roles successfully', async () => {
      vi.mocked(roleApiService.getAllRoles).mockResolvedValue([mockRole, mockRole2])
      vi.mocked(roleApiService.getRoleStatistics).mockResolvedValue({
        totalRoles: 2,
        activeRoles: 2,
        inactiveRoles: 0,
        systemRoles: 1,
        customRoles: 1,
      })

      const { fetchRoles, roles, loading } = useRoles()

      await fetchRoles()

      expect(roles.value).toEqual([mockRole, mockRole2])
      expect(loading.value).toBe(false)
      expect(roleApiService.getAllRoles).toHaveBeenCalledWith(true)
    })

    it('should fetch roles without inactive when specified', async () => {
      vi.mocked(roleApiService.getAllRoles).mockResolvedValue([mockRole])

      const { fetchRoles } = useRoles()
      await fetchRoles(false)

      expect(roleApiService.getAllRoles).toHaveBeenCalledWith(false)
    })

    it('should handle fetch roles error', async () => {
      const error = new Error('Failed to fetch')
      vi.mocked(roleApiService.getAllRoles).mockRejectedValue(error)

      const { fetchRoles, error: errorState } = useRoles()
      await fetchRoles()

      expect(errorState.value).toBe('Failed to fetch')
    })

    it('should continue if statistics fetch fails', async () => {
      vi.mocked(roleApiService.getAllRoles).mockResolvedValue([mockRole])
      vi.mocked(roleApiService.getRoleStatistics).mockRejectedValue(new Error('Stats failed'))

      const { fetchRoles, roles, statistics } = useRoles()
      await fetchRoles()

      expect(roles.value).toEqual([mockRole])
      expect(statistics.value).toBeNull()
    })

    it('should set lastUpdated after successful fetch', async () => {
      vi.mocked(roleApiService.getAllRoles).mockResolvedValue([mockRole])

      const { fetchRoles, lastUpdated } = useRoles()
      const beforeFetch = new Date()
      await fetchRoles()

      expect(lastUpdated.value).toBeTruthy()
      expect(lastUpdated.value!.getTime()).toBeGreaterThanOrEqual(beforeFetch.getTime())
    })
  })

  describe('createRole', () => {
    it('should create role successfully', async () => {
      const newRoleData: CreateRoleData = {
        name: 'New Role',
        description: 'New role description',
        permissions: [],
      }
      const createdRole: Role = { ...mockRole, id: '3', name: 'New Role' }

      vi.mocked(roleApiService.createRole).mockResolvedValue(createdRole)

      const { createRole, roles } = useRoles()
      const result = await createRole(newRoleData)

      expect(result).toEqual(createdRole)
      expect(roles.value.some(r => r.id === '3')).toBe(true)
      expect(roleApiService.createRole).toHaveBeenCalledWith(newRoleData)
    })

    it('should handle create role error', async () => {
      const error = new Error('Creation failed')
      vi.mocked(roleApiService.createRole).mockRejectedValue(error)

      const { createRole } = useRoles()
      const result = await createRole({ name: 'Test', description: 'Test', permissions: [] })

      expect(result).toBeNull()
    })
  })

  describe('updateRole', () => {
    it('should update role successfully', async () => {
      vi.mocked(roleApiService.getAllRoles).mockResolvedValue([mockRole])

      const { fetchRoles, updateRole, roles } = useRoles()
      await fetchRoles()

      const updateData: UpdateRoleData = {
        id: '1',
        name: 'Updated Admin',
        description: 'Updated description',
      }
      const updatedRole: Role = { ...mockRole, name: 'Updated Admin' }

      vi.mocked(roleApiService.updateRole).mockResolvedValue(updatedRole)

      const result = await updateRole(updateData)

      expect(result).toEqual(updatedRole)
      expect(roles.value[0].name).toBe('Updated Admin')
    })

    it('should handle update role error', async () => {
      const error = new Error('Update failed')
      vi.mocked(roleApiService.updateRole).mockRejectedValue(error)

      const { updateRole } = useRoles()
      const result = await updateRole({ id: '1', name: 'Test', description: 'Test' })

      expect(result).toBeNull()
    })
  })

  describe('deleteRole', () => {
    it('should delete role successfully', async () => {
      vi.mocked(roleApiService.getAllRoles).mockResolvedValue([mockRole, mockRole2])

      const { fetchRoles, deleteRole, roles } = useRoles()
      await fetchRoles()

      vi.mocked(roleApiService.deleteRole).mockResolvedValue(undefined)

      const result = await deleteRole('1')

      expect(result).toBe(true)
      expect(roles.value).toHaveLength(1)
      expect(roles.value.find((r) => r.id === '1')).toBeUndefined()
    })

    it('should remove deleted role from selection', async () => {
      vi.mocked(roleApiService.getAllRoles).mockResolvedValue([mockRole, mockRole2])

      const { fetchRoles, deleteRole, toggleRoleSelection, selectedRoles, roles } = useRoles()
      await fetchRoles()

      const role = roles.value[0]
      toggleRoleSelection(role)
      expect(selectedRoles.value.some(r => r.id === '1')).toBe(true)

      vi.mocked(roleApiService.deleteRole).mockResolvedValue(undefined)
      await deleteRole('1')

      expect(selectedRoles.value.some(r => r.id === '1')).toBe(false)
    })

    it('should handle delete role error', async () => {
      const error = new Error('Delete failed')
      vi.mocked(roleApiService.deleteRole).mockRejectedValue(error)

      const { deleteRole } = useRoles()
      const result = await deleteRole('1')

      expect(result).toBe(false)
    })
  })

  describe('performBulkOperation', () => {
    it('should perform bulk operation successfully', async () => {
      vi.mocked(roleApiService.performBulkOperation).mockResolvedValue(undefined)
      vi.mocked(roleApiService.getAllRoles).mockResolvedValue([mockRole])

      const { performBulkOperation, selectedRoles, toggleRoleSelection } = useRoles()
      toggleRoleSelection(mockRole)
      toggleRoleSelection(mockRole2)

      const result = await performBulkOperation({
        operation: 'delete',
        roleIds: ['1', '2'],
      })

      expect(result).toBe(true)
      expect(selectedRoles.value).toHaveLength(0)
    })

    it('should handle bulk operation error', async () => {
      const error = new Error('Bulk operation failed')
      vi.mocked(roleApiService.performBulkOperation).mockRejectedValue(error)

      const { performBulkOperation } = useRoles()
      const result = await performBulkOperation({
        operation: 'activate',
        roleIds: ['1'],
      })

      expect(result).toBe(false)
    })
  })

  describe('Computed Properties', () => {
    it('should compute totalRoles correctly', async () => {
      vi.mocked(roleApiService.getAllRoles).mockResolvedValue([mockRole, mockRole2])

      const { fetchRoles, totalRoles } = useRoles()
      await fetchRoles()

      expect(totalRoles.value).toBe(2)
    })

    it('should compute activeRoles correctly', async () => {
      const inactiveRole = { ...mockRole2, id: '3', status: 'INACTIVE' as const }
      vi.mocked(roleApiService.getAllRoles).mockResolvedValue([mockRole, mockRole2, inactiveRole])

      const { fetchRoles, activeRoles } = useRoles()
      await fetchRoles()

      expect(activeRoles.value).toBe(2)
    })

    it('should compute averagePermissions correctly', async () => {
      vi.mocked(roleApiService.getAllRoles).mockResolvedValue([mockRole, mockRole2])

      const { fetchRoles, averagePermissions } = useRoles()
      await fetchRoles()

      // (10 + 3) / 2 = 6.5, rounded = 7
      expect(averagePermissions.value).toBe(7)
    })

    it('should return 0 for averagePermissions when no roles', () => {
      const { averagePermissions } = useRoles()
      expect(averagePermissions.value).toBe(0)
    })
  })

  describe('Filtering', () => {
    beforeEach(async () => {
      vi.mocked(roleApiService.getAllRoles).mockResolvedValue([mockRole, mockRole2])
    })

    it('should filter by search term (name)', async () => {
      const { fetchRoles, filteredRoles, filters } = useRoles()
      await fetchRoles()

      filters.search = 'admin'

      expect(filteredRoles.value).toHaveLength(1)
      expect(filteredRoles.value[0].name).toBe('Admin')
    })

    it('should filter by search term (description)', async () => {
      const { fetchRoles, filteredRoles, filters } = useRoles()
      await fetchRoles()

      filters.search = 'regular'

      expect(filteredRoles.value).toHaveLength(1)
      expect(filteredRoles.value[0].name).toBe('User')
    })

    it('should filter by status', async () => {
      const inactiveRole = { ...mockRole2, id: '3', status: 'INACTIVE' as const }
      vi.mocked(roleApiService.getAllRoles).mockResolvedValue([mockRole, mockRole2, inactiveRole])

      const { fetchRoles, filteredRoles, filters } = useRoles()
      await fetchRoles()

      filters.status = 'INACTIVE'

      expect(filteredRoles.value).toHaveLength(1)
      expect(filteredRoles.value[0].id).toBe('3')
    })

    it('should filter by type SYSTEM', async () => {
      const { fetchRoles, filteredRoles, filters } = useRoles()
      await fetchRoles()

      filters.type = 'SYSTEM'

      expect(filteredRoles.value).toHaveLength(1)
      expect(filteredRoles.value[0].isSystemRole).toBe(true)
    })

    it('should filter by type DEFAULT', async () => {
      const { fetchRoles, filteredRoles, filters } = useRoles()
      await fetchRoles()

      filters.type = 'DEFAULT'

      expect(filteredRoles.value).toHaveLength(1)
      expect(filteredRoles.value[0].isDefault).toBe(true)
    })

    it('should filter by type CUSTOM', async () => {
      const customRole = {
        ...mockRole,
        id: '3',
        isSystemRole: false,
        isDefault: false,
        name: 'Custom',
      }
      vi.mocked(roleApiService.getAllRoles).mockResolvedValue([mockRole, mockRole2, customRole])

      const { fetchRoles, filteredRoles, filters } = useRoles()
      await fetchRoles()

      filters.type = 'CUSTOM'

      expect(filteredRoles.value).toHaveLength(1)
      expect(filteredRoles.value[0].name).toBe('Custom')
    })

    it('should combine multiple filters', async () => {
      const { fetchRoles, filteredRoles, filters } = useRoles()
      await fetchRoles()

      filters.search = 'admin'
      filters.status = 'ACTIVE'

      expect(filteredRoles.value).toHaveLength(1)
      expect(filteredRoles.value[0].name).toBe('Admin')
    })

    it('should clear filters', async () => {
      const { fetchRoles, filters, clearFilters } = useRoles()
      await fetchRoles()

      filters.search = 'test'
      filters.status = 'ACTIVE'
      filters.type = 'SYSTEM'

      clearFilters()

      expect(filters.search).toBe('')
      expect(filters.status).toBeNull()
      expect(filters.type).toBeNull()
    })
  })

  describe('Selection Utilities', () => {
    beforeEach(async () => {
      vi.mocked(roleApiService.getAllRoles).mockResolvedValue([mockRole, mockRole2])
    })

    it('should get role by ID', async () => {
      const { fetchRoles, getRoleById } = useRoles()
      await fetchRoles()

      const role = getRoleById('1')

      expect(role).toEqual(mockRole)
    })

    it('should return undefined for non-existent role ID', async () => {
      const { fetchRoles, getRoleById } = useRoles()
      await fetchRoles()

      const role = getRoleById('999')

      expect(role).toBeUndefined()
    })

    it('should check if role is selected', async () => {
      const { fetchRoles, toggleRoleSelection, isRoleSelected } = useRoles()
      await fetchRoles()

      expect(isRoleSelected('1')).toBe(false)

      toggleRoleSelection(mockRole)

      expect(isRoleSelected('1')).toBe(true)
    })

    it('should toggle role selection on and off', async () => {
      const { fetchRoles, toggleRoleSelection, selectedRoles, roles } = useRoles()
      await fetchRoles()

      const role = roles.value[0]
      toggleRoleSelection(role)
      expect(selectedRoles.value.some(r => r.id === role.id)).toBe(true)

      toggleRoleSelection(role)
      expect(selectedRoles.value.some(r => r.id === role.id)).toBe(false)
    })

    it('should clear all selections', async () => {
      const { fetchRoles, toggleRoleSelection, clearSelection, selectedRoles, roles } = useRoles()
      await fetchRoles()

      const role1 = roles.value[0]
      const role2 = roles.value[1]
      toggleRoleSelection(role1)
      toggleRoleSelection(role2)
      expect(selectedRoles.value).toHaveLength(2)

      clearSelection()
      expect(selectedRoles.value).toHaveLength(0)
    })

    it('should select all visible roles', async () => {
      const { fetchRoles, selectAllVisible, selectedRoles } = useRoles()
      await fetchRoles()

      selectAllVisible()

      expect(selectedRoles.value).toHaveLength(2)
      expect(selectedRoles.value.some(r => r.id === '1')).toBe(true)
      expect(selectedRoles.value.some(r => r.id === '2')).toBe(true)
    })

    it('should select only filtered roles with selectAllVisible', async () => {
      const { fetchRoles, selectAllVisible, selectedRoles, filters } = useRoles()
      await fetchRoles()

      filters.search = 'admin'
      selectAllVisible()

      expect(selectedRoles.value).toHaveLength(1)
      expect(selectedRoles.value[0].name).toBe('Admin')
    })
  })

  describe('refreshData', () => {
    it('should call fetchRoles', async () => {
      vi.mocked(roleApiService.getAllRoles).mockResolvedValue([mockRole])

      const { refreshData, roles } = useRoles()
      await refreshData()

      expect(roles.value).toEqual([mockRole])
    })
  })
})
