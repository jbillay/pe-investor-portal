import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { ref } from 'vue';
import RoleManagementDialog from '../RoleManagementDialog.vue';

// Mock PrimeVue components
vi.mock('primevue/button', () => ({
  default: {
    name: 'Button',
    template: '<button></button>',
    props: ['label', 'icon', 'class', 'loading', 'disabled', 'severity', 'outlined']
  }
}));

vi.mock('primevue/inputtext', () => ({
  default: {
    name: 'InputText',
    template: '<input />',
    props: ['modelValue', 'placeholder', 'class']
  }
}));

vi.mock('primevue/select', () => ({
  default: {
    name: 'Select',
    template: '<select></select>',
    props: ['modelValue', 'options', 'optionLabel', 'optionValue', 'placeholder', 'class']
  }
}));

vi.mock('primevue/tag', () => ({
  default: {
    name: 'Tag',
    template: '<span></span>',
    props: ['value', 'severity', 'class']
  }
}));

vi.mock('primevue/textarea', () => ({
  default: {
    name: 'Textarea',
    template: '<textarea></textarea>',
    props: ['modelValue', 'placeholder', 'rows', 'class', 'aria-describedby', 'aria-required']
  }
}));

vi.mock('primevue/datepicker', () => ({
  default: {
    name: 'DatePicker',
    template: '<input type="date" />',
    props: ['modelValue', 'dateFormat', 'minDate', 'placeholder', 'class', 'aria-describedby', 'aria-required']
  }
}));

vi.mock('primevue/checkbox', () => ({
  default: {
    name: 'Checkbox',
    template: '<input type="checkbox" />',
    props: ['modelValue', 'inputId', 'binary']
  }
}));

vi.mock('primevue/dialog', () => ({
  default: {
    name: 'Dialog',
    template: '<div class="dialog"><slot name="header"></slot><slot></slot><slot name="footer"></slot></div>',
    props: ['visible', 'modal', 'draggable', 'closable', 'header', 'style', 'class', 'aria-labelledby', 'aria-describedby']
  }
}));

vi.mock('primevue/progressspinner', () => ({
  default: {
    name: 'ProgressSpinner',
    template: '<div class="spinner"></div>',
    props: ['style', 'strokeWidth']
  }
}));

vi.mock('primevue/inputgroup', () => ({
  default: {
    name: 'InputGroup',
    template: '<div class="input-group"><slot></slot></div>'
  }
}));

vi.mock('primevue/inputgroupaddon', () => ({
  default: {
    name: 'InputGroupAddon',
    template: '<div class="input-group-addon"><slot></slot></div>'
  }
}));

// Mock composables
const mockToast = {
  add: vi.fn(),
};

const mockApi = {
  get: vi.fn(),
  post: vi.fn(),
  delete: vi.fn(),
};

vi.mock('primevue/usetoast', () => ({
  useToast: () => mockToast,
}));

vi.mock('@/composables/useApi', () => ({
  useApi: () => ({ api: mockApi }),
}));

describe('RoleManagementDialog', () => {
  let wrapper: VueWrapper<any>;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    fullName: 'John Doe',
    roles: [
      { id: '1', name: 'VIEWER', description: 'Basic viewer role' },
      { id: '2', name: 'ANALYST', description: 'Analyst role' },
    ],
  };

  const mockRoles = [
    { id: '1', name: 'VIEWER', description: 'Basic viewer role', isActive: true, permissions: ['read'] },
    { id: '2', name: 'ANALYST', description: 'Analyst role', isActive: true, permissions: ['read', 'analyze'] },
    { id: '3', name: 'FUND_MANAGER', description: 'Fund manager role', isActive: true, permissions: ['read', 'write', 'manage'] },
    { id: '4', name: 'SUPER_ADMIN', description: 'Super admin role', isActive: true, permissions: ['*'], isDefault: true },
  ];

  const createWrapper = (props = {}) => {
    return mount(RoleManagementDialog, {
      props: {
        visible: true,
        user: mockUser,
        ...props,
      },
      global: {
        stubs: {
          teleport: true,
        },
      },
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.get.mockResolvedValue(mockRoles);
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('Component Rendering', () => {
    it('should render the dialog', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.dialogVisible).toBe(true);
    });

    it('should display user information', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.user?.fullName).toBe('John Doe');
      expect(wrapper.vm.user?.email).toBe('test@example.com');
    });

    it('should display current user roles', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.user?.roles).toHaveLength(2);
      expect(wrapper.vm.user?.roles?.[0].name).toBe('VIEWER');
    });

    it('should not render user info when user is null', () => {
      wrapper = createWrapper({ user: null });
      expect(wrapper.vm.user).toBeNull();
    });
  });

  describe('Component Lifecycle', () => {
    it('should load available roles on dialog show', async () => {
      wrapper = createWrapper();
      await wrapper.vm.onDialogShow();
      expect(mockApi.get).toHaveBeenCalledWith('/admin/roles');
    });

    it('should reset form on dialog hide', () => {
      wrapper = createWrapper();
      wrapper.vm.operationReason = 'Test reason';
      wrapper.vm.selectedRole = mockRoles[0];
      wrapper.vm.onDialogHide();
      expect(wrapper.vm.operationReason).toBe('');
      expect(wrapper.vm.selectedRole).toBeNull();
    });
  });

  describe('Operation Mode', () => {
    it('should default to assign mode', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.operationMode).toBe('assign');
    });

    it('should switch to revoke mode', () => {
      wrapper = createWrapper();
      wrapper.vm.setOperationMode('revoke');
      expect(wrapper.vm.operationMode).toBe('revoke');
    });

    it('should reset operation state when switching modes', () => {
      wrapper = createWrapper();
      wrapper.vm.selectedRole = mockRoles[0];
      wrapper.vm.operationReason = 'Test';
      wrapper.vm.setOperationMode('revoke');
      expect(wrapper.vm.selectedRole).toBeNull();
      expect(wrapper.vm.operationReason).toBe('');
    });
  });

  describe('Role Assignment', () => {
    it('should select a role in assign mode', () => {
      wrapper = createWrapper();
      wrapper.vm.selectRole(mockRoles[2]); // FUND_MANAGER (not in user's roles)
      expect(wrapper.vm.selectedRole).toEqual(mockRoles[2]);
    });

    it('should not select disabled role', () => {
      wrapper = createWrapper();
      wrapper.vm.selectRole(mockRoles[0]); // VIEWER (already in user's roles)
      expect(wrapper.vm.selectedRole).toBeNull();
    });

    it('should not select role in revoke mode', () => {
      wrapper = createWrapper();
      wrapper.vm.setOperationMode('revoke');
      wrapper.vm.selectRole(mockRoles[2]);
      expect(wrapper.vm.selectedRole).toBeNull();
    });

    it('should validate assignment form - missing reason', () => {
      wrapper = createWrapper();
      wrapper.vm.selectedRole = mockRoles[2];
      expect(wrapper.vm.canAssignRole).toBe(false);
    });

    it('should validate assignment form - with reason', () => {
      wrapper = createWrapper();
      wrapper.vm.selectedRole = mockRoles[2];
      wrapper.vm.operationReason = 'Needs access';
      expect(wrapper.vm.canAssignRole).toBe(true);
    });

    it('should validate temporary assignment requires expiry date', () => {
      wrapper = createWrapper();
      wrapper.vm.selectedRole = mockRoles[2];
      wrapper.vm.operationReason = 'Needs access';
      wrapper.vm.assignmentDuration = 'TEMPORARY';
      expect(wrapper.vm.canAssignRole).toBe(false);
      wrapper.vm.expiryDate = new Date();
      expect(wrapper.vm.canAssignRole).toBe(true);
    });

    it('should call API on role assignment', async () => {
      mockApi.post.mockResolvedValue({ success: true });
      wrapper = createWrapper();
      wrapper.vm.selectedRole = mockRoles[2];
      wrapper.vm.operationReason = 'Needs access';
      await wrapper.vm.assignRole();
      expect(mockApi.post).toHaveBeenCalledWith(
        '/admin/users/1/roles',
        expect.objectContaining({
          roles: ['FUND_MANAGER'],
          reason: 'Needs access',
        })
      );
    });

    it('should emit role-assigned event on success', async () => {
      mockApi.post.mockResolvedValue({ success: true });
      wrapper = createWrapper();
      wrapper.vm.selectedRole = mockRoles[2];
      wrapper.vm.operationReason = 'Needs access';
      await wrapper.vm.assignRole();
      expect(wrapper.emitted('role-assigned')).toBeTruthy();
    });

    it('should show toast on successful assignment', async () => {
      mockApi.post.mockResolvedValue({ success: true });
      wrapper = createWrapper();
      wrapper.vm.selectedRole = mockRoles[2];
      wrapper.vm.operationReason = 'Needs access';
      await wrapper.vm.assignRole();
      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
          summary: 'Role Assigned Successfully',
        })
      );
    });

    it('should handle assignment error', async () => {
      mockApi.post.mockRejectedValue(new Error('API Error'));
      wrapper = createWrapper();
      wrapper.vm.selectedRole = mockRoles[2];
      wrapper.vm.operationReason = 'Needs access';
      await wrapper.vm.assignRole();
      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          summary: 'Assignment Failed',
        })
      );
    });

    it('should not assign without user ID', async () => {
      wrapper = createWrapper({ user: { ...mockUser, id: '' } });
      wrapper.vm.selectedRole = mockRoles[2];
      wrapper.vm.operationReason = 'Needs access';
      await wrapper.vm.assignRole();
      expect(mockApi.post).not.toHaveBeenCalled();
      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          summary: 'Invalid User',
        })
      );
    });
  });

  describe('Role Revocation', () => {
    it('should toggle role selection for revocation', () => {
      wrapper = createWrapper();
      wrapper.vm.setOperationMode('revoke');
      wrapper.vm.toggleRoleSelection(mockUser.roles[0]);
      expect(wrapper.vm.selectedRolesToRevoke).toHaveLength(1);
      expect(wrapper.vm.selectedRolesToRevoke[0].name).toBe('VIEWER');
    });

    it('should deselect role when toggled again', () => {
      wrapper = createWrapper();
      wrapper.vm.setOperationMode('revoke');
      wrapper.vm.toggleRoleSelection(mockUser.roles[0]);
      wrapper.vm.toggleRoleSelection(mockUser.roles[0]);
      expect(wrapper.vm.selectedRolesToRevoke).toHaveLength(0);
    });

    it('should not toggle selection in assign mode', () => {
      wrapper = createWrapper();
      wrapper.vm.toggleRoleSelection(mockUser.roles[0]);
      expect(wrapper.vm.selectedRolesToRevoke).toHaveLength(0);
    });

    it('should check if role is selected', () => {
      wrapper = createWrapper();
      wrapper.vm.setOperationMode('revoke');
      wrapper.vm.selectedRolesToRevoke = [mockUser.roles[0]];
      expect(wrapper.vm.isRoleSelected(mockUser.roles[0])).toBe(true);
      expect(wrapper.vm.isRoleSelected(mockUser.roles[1])).toBe(false);
    });

    it('should validate revocation form - missing reason', () => {
      wrapper = createWrapper();
      wrapper.vm.setOperationMode('revoke');
      wrapper.vm.selectedRolesToRevoke = [mockUser.roles[0]];
      expect(wrapper.vm.canRevokeRoles).toBe(false);
    });

    it('should validate revocation form - with reason', () => {
      wrapper = createWrapper();
      wrapper.vm.setOperationMode('revoke');
      wrapper.vm.selectedRolesToRevoke = [mockUser.roles[0]];
      wrapper.vm.operationReason = 'No longer needed';
      expect(wrapper.vm.canRevokeRoles).toBe(true);
    });

    it('should show confirmation dialog before revoking', () => {
      wrapper = createWrapper();
      wrapper.vm.setOperationMode('revoke');
      wrapper.vm.selectedRolesToRevoke = [mockUser.roles[0]];
      wrapper.vm.operationReason = 'No longer needed';
      wrapper.vm.showRevokeConfirmation();
      expect(wrapper.vm.revokeConfirmationVisible).toBe(true);
    });

    it('should not show confirmation without validation', () => {
      wrapper = createWrapper();
      wrapper.vm.setOperationMode('revoke');
      wrapper.vm.showRevokeConfirmation();
      expect(wrapper.vm.revokeConfirmationVisible).toBe(false);
      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'warn',
          summary: 'Validation Error',
        })
      );
    });

    it('should call API on role revocation', async () => {
      mockApi.delete.mockResolvedValue({ success: true });
      wrapper = createWrapper();
      wrapper.vm.setOperationMode('revoke');
      wrapper.vm.selectedRolesToRevoke = [mockUser.roles[0]];
      wrapper.vm.operationReason = 'No longer needed';
      await wrapper.vm.revokeRoles();
      expect(mockApi.delete).toHaveBeenCalledWith(
        '/admin/users/1/roles',
        expect.objectContaining({
          data: {
            roles: ['VIEWER'],
            reason: 'No longer needed',
          },
        })
      );
    });

    it('should emit role-revoked event on success', async () => {
      mockApi.delete.mockResolvedValue({ success: true });
      wrapper = createWrapper();
      wrapper.vm.setOperationMode('revoke');
      wrapper.vm.selectedRolesToRevoke = [mockUser.roles[0]];
      wrapper.vm.operationReason = 'No longer needed';
      await wrapper.vm.revokeRoles();
      expect(wrapper.emitted('role-revoked')).toBeTruthy();
    });

    it('should show toast on successful revocation', async () => {
      mockApi.delete.mockResolvedValue({ success: true });
      wrapper = createWrapper();
      wrapper.vm.setOperationMode('revoke');
      wrapper.vm.selectedRolesToRevoke = [mockUser.roles[0], mockUser.roles[1]];
      wrapper.vm.operationReason = 'No longer needed';
      await wrapper.vm.revokeRoles();
      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
          summary: 'Roles Revoked Successfully',
        })
      );
    });

    it('should handle revocation error', async () => {
      mockApi.delete.mockRejectedValue(new Error('API Error'));
      wrapper = createWrapper();
      wrapper.vm.setOperationMode('revoke');
      wrapper.vm.selectedRolesToRevoke = [mockUser.roles[0]];
      wrapper.vm.operationReason = 'No longer needed';
      await wrapper.vm.revokeRoles();
      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          summary: 'Revocation Failed',
        })
      );
    });
  });

  describe('Role Search and Filter', () => {
    it('should filter roles by search term', async () => {
      wrapper = createWrapper();
      await wrapper.vm.loadAvailableRoles();
      wrapper.vm.roleSearchTerm = 'admin';
      expect(wrapper.vm.filteredAvailableRoles).toHaveLength(1);
      expect(wrapper.vm.filteredAvailableRoles[0].name).toBe('SUPER_ADMIN');
    });

    it('should filter roles by description', async () => {
      wrapper = createWrapper();
      await wrapper.vm.loadAvailableRoles();
      wrapper.vm.roleSearchTerm = 'manager';
      expect(wrapper.vm.filteredAvailableRoles).toHaveLength(1);
      expect(wrapper.vm.filteredAvailableRoles[0].name).toBe('FUND_MANAGER');
    });

    it('should return all roles when search is empty', async () => {
      wrapper = createWrapper();
      await wrapper.vm.loadAvailableRoles();
      wrapper.vm.roleSearchTerm = '';
      expect(wrapper.vm.filteredAvailableRoles).toHaveLength(4);
    });

    it('should filter out inactive roles', async () => {
      const rolesWithInactive = [...mockRoles, { id: '5', name: 'INACTIVE', description: 'Inactive role', isActive: false, permissions: [] }];
      mockApi.get.mockResolvedValue(rolesWithInactive);
      wrapper = createWrapper();
      await wrapper.vm.loadAvailableRoles();
      expect(wrapper.vm.filteredAvailableRoles).toHaveLength(4);
    });
  });

  describe('Loading States', () => {
    it('should show loading state while fetching roles', async () => {
      wrapper = createWrapper();
      const loadPromise = wrapper.vm.loadAvailableRoles();
      expect(wrapper.vm.isLoadingRoles).toBe(true);
      await loadPromise;
      expect(wrapper.vm.isLoadingRoles).toBe(false);
    });

    it('should set error on failed role load', async () => {
      mockApi.get.mockRejectedValue(new Error('Network error'));
      wrapper = createWrapper();
      await wrapper.vm.loadAvailableRoles();
      expect(wrapper.vm.rolesError).toContain('Failed to load available roles');
    });

    it('should show toast on role loading error', async () => {
      mockApi.get.mockRejectedValue(new Error('Network error'));
      wrapper = createWrapper();
      await wrapper.vm.loadAvailableRoles();
      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          summary: 'Loading Error',
        })
      );
    });

    it('should not reload roles while already loading', async () => {
      wrapper = createWrapper();
      const firstCall = wrapper.vm.loadAvailableRoles();
      const secondCall = wrapper.vm.loadAvailableRoles();
      await Promise.all([firstCall, secondCall]);
      expect(mockApi.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('Helper Methods', () => {
    it('should get role color', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.getRoleColor('SUPER_ADMIN')).toBe('#ef4444');
      expect(wrapper.vm.getRoleColor('FUND_MANAGER')).toBe('#8b5cf6');
      expect(wrapper.vm.getRoleColor('UNKNOWN_ROLE')).toBe('#6366f1');
    });

    it('should get role initials', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.getRoleInitials('SUPER_ADMIN')).toBe('SA');
      expect(wrapper.vm.getRoleInitials('FUND_MANAGER')).toBe('FM');
      expect(wrapper.vm.getRoleInitials('VIEWER')).toBe('V');
    });

    it('should get role severity', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.getRoleSeverity('SUPER_ADMIN')).toBe('danger');
      expect(wrapper.vm.getRoleSeverity('FUND_MANAGER')).toBe('warning');
      expect(wrapper.vm.getRoleSeverity('VIEWER')).toBe('secondary');
      expect(wrapper.vm.getRoleSeverity('UNKNOWN')).toBe('info');
    });

    it('should check if role is disabled', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.isRoleDisabled({ name: 'VIEWER' })).toBe(true);
      expect(wrapper.vm.isRoleDisabled({ name: 'SUPER_ADMIN' })).toBe(false);
    });
  });

  describe('Form Reset', () => {
    it('should reset all form fields', () => {
      wrapper = createWrapper();
      wrapper.vm.operationMode = 'revoke';
      wrapper.vm.selectedRole = mockRoles[0];
      wrapper.vm.operationReason = 'Test';
      wrapper.vm.roleSearchTerm = 'search';
      wrapper.vm.assignmentDuration = 'TEMPORARY';
      wrapper.vm.notifyUser = false;
      wrapper.vm.resetForm();
      expect(wrapper.vm.operationMode).toBe('assign');
      expect(wrapper.vm.selectedRole).toBeNull();
      expect(wrapper.vm.operationReason).toBe('');
      expect(wrapper.vm.roleSearchTerm).toBe('');
      expect(wrapper.vm.assignmentDuration).toBe('PERMANENT');
      expect(wrapper.vm.notifyUser).toBe(true);
    });
  });

  describe('Dialog Visibility', () => {
    it('should close dialog', () => {
      wrapper = createWrapper();
      wrapper.vm.closeDialog();
      expect(wrapper.vm.dialogVisible).toBe(false);
    });

    it('should emit update:visible when closing', async () => {
      wrapper = createWrapper();
      wrapper.vm.dialogVisible = false;
      await wrapper.vm.$nextTick();
      expect(wrapper.emitted('update:visible')).toBeTruthy();
    });

    it('should sync visibility with prop', async () => {
      wrapper = createWrapper({ visible: false });
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.dialogVisible).toBe(false);
    });
  });

  describe('Computed Properties', () => {
    it('should compute canAssignRole correctly', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.canAssignRole).toBe(false);
      wrapper.vm.selectedRole = mockRoles[2];
      expect(wrapper.vm.canAssignRole).toBe(false);
      wrapper.vm.operationReason = 'Valid reason';
      expect(wrapper.vm.canAssignRole).toBe(true);
    });

    it('should compute canRevokeRoles correctly', () => {
      wrapper = createWrapper();
      wrapper.vm.setOperationMode('revoke');
      expect(wrapper.vm.canRevokeRoles).toBe(false);
      wrapper.vm.selectedRolesToRevoke = [mockUser.roles[0]];
      expect(wrapper.vm.canRevokeRoles).toBe(false);
      wrapper.vm.operationReason = 'Valid reason';
      expect(wrapper.vm.canRevokeRoles).toBe(true);
    });
  });

  describe('Notification Options', () => {
    it('should default notify user to true', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.notifyUser).toBe(true);
    });

    it('should default notify admins to false', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.notifyAdmins).toBe(false);
    });

    it('should toggle notification options', () => {
      wrapper = createWrapper();
      wrapper.vm.notifyUser = false;
      wrapper.vm.notifyAdmins = true;
      expect(wrapper.vm.notifyUser).toBe(false);
      expect(wrapper.vm.notifyAdmins).toBe(true);
    });
  });
});
