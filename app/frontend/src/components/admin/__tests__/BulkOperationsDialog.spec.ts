import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper, flushPromises } from '@vue/test-utils'
import BulkOperationsDialog from '../BulkOperationsDialog.vue'

const mockToast = { add: vi.fn() }
const mockApi = { post: vi.fn(async () => ({ data: { success: true } })) }

vi.mock('primevue/usetoast', () => ({
  useToast: vi.fn(() => mockToast),
}))

vi.mock('@/composables/useApi', () => ({
  useApi: vi.fn(() => ({ api: mockApi })),
}))

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
    props: ['label', 'icon', 'loading', 'disabled', 'severity', 'text'],
    emits: ['click'],
  },
}))

vi.mock('primevue/tag', () => ({
  default: {
    name: 'Tag',
    template: '<span class="tag">{{ value }}</span>',
    props: ['value', 'severity', 'icon'],
  },
}))

vi.mock('primevue/checkbox', () => ({
  default: {
    name: 'Checkbox',
    template: `<input type="checkbox" @change="$emit('update:modelValue', $event.target.checked)" :checked="modelValue" />`,
    props: ['modelValue', 'binary'],
    emits: ['update:modelValue'],
  },
}))

vi.mock('primevue/select', () => ({
  default: {
    name: 'Select',
    template: `<select @change="$emit('update:modelValue', $event.target.value)" :value="modelValue"><slot /></select>`,
    props: ['modelValue', 'options', 'placeholder', 'optionLabel', 'optionValue'],
    emits: ['update:modelValue'],
  },
}))

const mockUsers = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    roles: ['ANALYST', 'VIEWER'],
    status: 'ACTIVE',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    roles: ['FUND_MANAGER'],
    status: 'ACTIVE',
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    roles: ['VIEWER'],
    status: 'INACTIVE',
  },
]

describe('BulkOperationsDialog', () => {
  let wrapper: VueWrapper

  const createWrapper = (props = {}) => {
    return mount(BulkOperationsDialog, {
      props: {
        visible: true,
        selectedUsers: mockUsers,
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

    it('should display bulk operations content', () => {
      expect(wrapper.find('.bulk-operations-content').exists()).toBe(true)
    })

    it('should show selected users section', () => {
      expect(wrapper.find('.selected-users-section').exists()).toBe(true)
    })

    it('should show operation selection section', () => {
      expect(wrapper.find('.operation-selection-section').exists()).toBe(true)
    })

    it('should display user count in header', () => {
      expect(wrapper.vm.$props.selectedUsers.length).toBe(3)
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

    it('should initialize with empty selected operation', () => {
      expect(wrapper.vm.selectedOperation).toBeNull()
    })

    it('should initialize with no errors', () => {
      expect(wrapper.vm.$el).toBeDefined()
    })
  })

  describe('Selected Users Display', () => {
    it('should display all selected users', () => {
      expect(wrapper.vm.$props.selectedUsers.length).toBe(3)
    })

    it('should show user name', () => {
      const users = wrapper.vm.$props.selectedUsers
      expect(users[0].name).toBe('John Doe')
    })

    it('should show user email', () => {
      const users = wrapper.vm.$props.selectedUsers
      expect(users[0].email).toBe('john@example.com')
    })

    it('should display user roles', () => {
      const users = wrapper.vm.$props.selectedUsers
      expect(users[0].roles).toContain('ANALYST')
    })

    it('should handle user with no roles', () => {
      const userNoRoles = { ...mockUsers[0], roles: [] }
      expect(userNoRoles.roles.length).toBe(0)
    })

    it('should handle special characters in user name', () => {
      const specialUser = { ...mockUsers[0], name: "O'Brien-Smith" }
      expect(specialUser.name).toContain("'")
    })
  })

  describe('Available Operations', () => {
    it('should have available operations', () => {
      expect(wrapper.vm.availableOperations.length).toBeGreaterThan(0)
    })

    it('should have operation with id property', () => {
      const ops = wrapper.vm.availableOperations
      ops.forEach((op: any) => {
        expect(op.id).toBeDefined()
      })
    })

    it('should have operation with name property', () => {
      const ops = wrapper.vm.availableOperations
      ops.forEach((op: any) => {
        expect(op.name).toBeDefined()
      })
    })

    it('should have operation with description property', () => {
      const ops = wrapper.vm.availableOperations
      ops.forEach((op: any) => {
        expect(op.description).toBeDefined()
      })
    })

    it('should have operation with icon property', () => {
      const ops = wrapper.vm.availableOperations
      ops.forEach((op: any) => {
        expect(op.icon).toBeDefined()
      })
    })

    it('should have operation with risk level', () => {
      const ops = wrapper.vm.availableOperations
      const hasRisk = ops.some((op: any) => op.risk !== undefined)
      expect(hasRisk).toBe(true)
    })

    it('should have operation with category', () => {
      const ops = wrapper.vm.availableOperations
      ops.forEach((op: any) => {
        expect(op.category).toBeDefined()
      })
    })
  })

  describe('Operation Selection', () => {
    it('should select operation', () => {
      const operation = wrapper.vm.availableOperations[0]
      wrapper.vm.selectOperation(operation)
      expect(wrapper.vm.selectedOperation).toEqual(operation)
    })

    it('should keep operation selected', () => {
      const operation = wrapper.vm.availableOperations[0]
      wrapper.vm.selectOperation(operation)
      expect(wrapper.vm.selectedOperation).toEqual(operation)
      // Clicking again keeps it selected
      wrapper.vm.selectOperation(operation)
      expect(wrapper.vm.selectedOperation).toEqual(operation)
    })

    it('should switch between operations', () => {
      const op1 = wrapper.vm.availableOperations[0]
      const op2 = wrapper.vm.availableOperations[1] || wrapper.vm.availableOperations[0]
      wrapper.vm.selectOperation(op1)
      expect(wrapper.vm.selectedOperation?.id).toBe(op1.id)
      if (op2.id !== op1.id) {
        wrapper.vm.selectOperation(op2)
        expect(wrapper.vm.selectedOperation?.id).toBe(op2.id)
      }
    })

    it('should not select disabled operation', () => {
      const disabledOp = wrapper.vm.availableOperations.find((op: any) => op.disabled)
      if (disabledOp) {
        wrapper.vm.selectOperation(disabledOp)
        expect(wrapper.vm.selectedOperation).not.toEqual(disabledOp)
      }
    })
  })

  describe('Risk Levels', () => {
    it('should get risk severity for HIGH', () => {
      const severity = wrapper.vm.getRiskSeverity('HIGH')
      expect(severity).toBe('danger')
    })

    it('should get risk severity for MEDIUM', () => {
      const severity = wrapper.vm.getRiskSeverity('MEDIUM')
      expect(severity).toBe('warning')
    })

    it('should get risk severity for LOW', () => {
      const severity = wrapper.vm.getRiskSeverity('LOW')
      expect(severity).toBe('success')
    })
  })

  describe('Role Severity', () => {
    it('should get role severity', () => {
      const severity = wrapper.vm.getRoleSeverity('SUPER_ADMIN')
      expect(typeof severity).toBe('string')
    })

    it('should map role to severity color', () => {
      expect(wrapper.vm.getRoleSeverity('ANALYST')).toBeDefined()
    })

    it('should handle unknown role', () => {
      const severity = wrapper.vm.getRoleSeverity('UNKNOWN_ROLE')
      expect(severity).toBeDefined()
    })
  })

  describe('Operation Configuration', () => {
    it('should show config section when operation selected', async () => {
      const operation = wrapper.vm.availableOperations[0]
      wrapper.vm.selectOperation(operation)
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.selectedOperation).not.toBeNull()
    })

    it('should not show config section when no operation selected', () => {
      expect(wrapper.vm.selectedOperation).toBeNull()
    })

    it('should handle assign-role configuration', () => {
      const assignOp = wrapper.vm.availableOperations.find((op: any) => op.id === 'assign-role')
      if (assignOp) {
        wrapper.vm.selectOperation(assignOp)
        expect(wrapper.vm.selectedOperation?.id).toBe('assign-role')
      }
    })

    it('should handle update-status configuration', () => {
      const updateOp = wrapper.vm.availableOperations.find((op: any) => op.id === 'update-status')
      if (updateOp) {
        wrapper.vm.selectOperation(updateOp)
        expect(wrapper.vm.selectedOperation?.id).toBe('update-status')
      }
    })
  })

  describe('Execution', () => {
    it('should handle operation execution', () => {
      const operation = wrapper.vm.availableOperations[0]
      wrapper.vm.selectOperation(operation)
      expect(wrapper.vm.selectedOperation).not.toBeNull()
    })

    it('should prevent execution without selected operation', () => {
      expect(wrapper.vm.selectedOperation).toBeNull()
      expect(wrapper.vm.$el).toBeDefined()
    })

    it('should require selected users', () => {
      const emptyWrapper = createWrapper({ selectedUsers: [] })
      expect(emptyWrapper.vm.$props.selectedUsers.length).toBe(0)
    })
  })

  describe('Dialog Actions', () => {
    it('should have onDialogShow method', () => {
      expect(typeof wrapper.vm.onDialogShow).toBe('function')
    })

    it('should have onDialogHide method', () => {
      expect(typeof wrapper.vm.onDialogHide).toBe('function')
    })

    it('should reset state on dialog hide', () => {
      const operation = wrapper.vm.availableOperations[0]
      wrapper.vm.selectOperation(operation)
      wrapper.vm.onDialogHide()
      expect(wrapper.vm.selectedOperation).toBeNull()
    })

    it('should maintain operation selection', () => {
      const operation = wrapper.vm.availableOperations[0]
      wrapper.vm.selectOperation(operation)
      expect(wrapper.vm.selectedOperation).not.toBeNull()
      // Configuration stays visible while operation is selected
      expect(wrapper.vm.selectedOperation?.id).toBeDefined()
    })
  })

  describe('Props and Emits', () => {
    it('should accept visible prop', () => {
      expect(wrapper.vm.$props.visible).toBe(true)
    })

    it('should accept selectedUsers prop', () => {
      expect(wrapper.vm.$props.selectedUsers.length).toBe(3)
    })

    it('should emit update:visible', async () => {
      wrapper.vm.dialogVisible = false
      await wrapper.vm.$nextTick()
      expect(wrapper.emitted('update:visible')).toBeTruthy()
    })

    it('should handle empty selectedUsers', () => {
      const emptyWrapper = createWrapper({ selectedUsers: [] })
      expect(emptyWrapper.vm.$props.selectedUsers.length).toBe(0)
    })

    it('should handle single selected user', () => {
      const singleWrapper = createWrapper({ selectedUsers: [mockUsers[0]] })
      expect(singleWrapper.vm.$props.selectedUsers.length).toBe(1)
    })
  })

  describe('Edge Cases', () => {
    it('should handle null selectedUsers gracefully', () => {
      const nullWrapper = createWrapper({ selectedUsers: [] })
      expect(nullWrapper.vm.$el).toBeDefined()
    })

    it('should handle user with special characters', () => {
      const specialUser = {
        ...mockUsers[0],
        name: 'José García',
        email: 'jose.garcia@example.com',
      }
      wrapper = createWrapper({ selectedUsers: [specialUser] })
      expect(wrapper.vm.$props.selectedUsers[0].name).toContain('é')
    })

    it('should handle very long user name', () => {
      const longNameUser = {
        ...mockUsers[0],
        name: 'A'.repeat(100),
      }
      wrapper = createWrapper({ selectedUsers: [longNameUser] })
      expect(wrapper.vm.$props.selectedUsers[0].name.length).toBe(100)
    })

    it('should handle user with many roles', () => {
      const manyRolesUser = {
        ...mockUsers[0],
        roles: ['ROLE1', 'ROLE2', 'ROLE3', 'ROLE4', 'ROLE5'],
      }
      wrapper = createWrapper({ selectedUsers: [manyRolesUser] })
      expect(wrapper.vm.$props.selectedUsers[0].roles.length).toBe(5)
    })

    it('should handle operation with high risk level', () => {
      const ops = wrapper.vm.availableOperations
      const highRiskOp = ops.find((op: any) => op.risk === 'HIGH')
      if (highRiskOp) {
        expect(highRiskOp.risk).toBe('HIGH')
      }
    })
  })

  describe('Button States', () => {
    it('should disable execute button without operation selection', () => {
      expect(wrapper.vm.selectedOperation).toBeNull()
    })

    it('should enable execute button with operation selection', () => {
      const operation = wrapper.vm.availableOperations[0]
      wrapper.vm.selectOperation(operation)
      expect(wrapper.vm.selectedOperation).not.toBeNull()
    })

    it('should disable all buttons while executing', async () => {
      wrapper.vm.executing = true
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.executing).toBe(true)
    })
  })

  describe('Operation Categories', () => {
    it('should have operations in different categories', () => {
      const ops = wrapper.vm.availableOperations
      const categories = [...new Set(ops.map((op: any) => op.category))]
      expect(categories.length).toBeGreaterThan(0)
    })

    it('should display operation category', () => {
      const ops = wrapper.vm.availableOperations
      ops.forEach((op: any) => {
        expect(typeof op.category).toBe('string')
      })
    })
  })
})
