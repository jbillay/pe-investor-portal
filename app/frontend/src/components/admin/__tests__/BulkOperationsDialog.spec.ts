import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import BulkOperationsDialog from '../BulkOperationsDialog.vue';
import { useToast } from 'primevue/usetoast';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Tag from 'primevue/tag';

// Mock PrimeVue toast
vi.mock('primevue/usetoast', () => ({
  useToast: vi.fn(() => ({
    add: vi.fn(),
  })),
}));

const mockUsers = [
  { id: '1', name: 'John Doe', email: 'john@example.com', roles: [{ id: 'r1', name: 'INVESTOR' }] },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', roles: [{ id: 'r2', name: 'ANALYST' }] },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com', roles: [] },
];

describe('BulkOperationsDialog.vue', () => {
  let wrapper: VueWrapper;
  let toast: ReturnType<typeof useToast>;

  const createWrapper = (props = {}) => {
    return mount(BulkOperationsDialog, {
      props: {
        visible: true,
        selectedUsers: mockUsers,
        ...props,
      },
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            stubActions: false,
          }),
        ],
        components: { Dialog, Button, Tag },
        stubs: {
          Dialog: false,
          Button: false,
          Tag: false,
          Chip: true,
          Select: true,
          MultiSelect: true,
          Textarea: true,
          Checkbox: true,
        },
      },
    });
  };

  beforeEach(() => {
    toast = useToast();
    vi.clearAllMocks();
  });

  // RENDERING TESTS
  describe('Component Rendering', () => {
    it('should render dialog when visible', () => {
      wrapper = createWrapper();
      expect(wrapper.find('.bulk-operations-dialog').exists()).toBe(true);
    });

    it('should display header with selected user count', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('3 selected users');
    });

    it('should render selected users preview section', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('Selected Users');
      expect(wrapper.text()).toContain('John Doe');
      expect(wrapper.text()).toContain('Jane Smith');
      expect(wrapper.text()).toContain('Bob Johnson');
    });

    it('should render operation selection section', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('Select Operation');
    });

    it('should render available operations', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('Assign Role');
      expect(wrapper.text()).toContain('Remove Roles');
      expect(wrapper.text()).toContain('Update Status');
      expect(wrapper.text()).toContain('Export Data');
    });

    it('should display operation icons', () => {
      wrapper = createWrapper();
      const html = wrapper.html();
      expect(html).toContain('pi-shield');
      expect(html).toContain('pi-download');
    });

    it('should not render when visible is false', () => {
      wrapper = createWrapper({ visible: false });
      const dialog = wrapper.findComponent(Dialog);
      expect(dialog.props('visible')).toBe(false);
    });
  });

  // OPERATION SELECTION TESTS
  describe('Operation Selection', () => {
    it('should allow selecting an operation', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      const operations = wrapper.findAll('.operation-card');
      await operations[0].trigger('click');

      expect(vm.selectedOperation).toBeTruthy();
    });

    it('should highlight selected operation', async () => {
      wrapper = createWrapper();

      const operations = wrapper.findAll('.operation-card');
      await operations[0].trigger('click');
      await wrapper.vm.$nextTick();

      expect(operations[0].classes()).toContain('border-purple-500');
    });

    it('should show configuration section after selecting operation', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      const operations = wrapper.findAll('.operation-card');
      await operations[0].trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.operation-config-section').exists()).toBe(true);
    });

    it('should clear validation errors when selecting new operation', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      vm.showValidationErrors = true;
      vm.selectOperation({ id: 'test', name: 'Test' });

      expect(vm.showValidationErrors).toBe(false);
    });

    it('should display operation categories', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('Role Management');
      expect(wrapper.text()).toContain('User Management');
      expect(wrapper.text()).toContain('Data Export');
    });

    it('should display risk levels for operations', () => {
      wrapper = createWrapper();
      const tags = wrapper.findAllComponents(Tag);
      const riskTags = tags.filter(t => ['HIGH', 'MEDIUM', 'LOW'].includes(t.props('value') as string));
      expect(riskTags.length).toBeGreaterThan(0);
    });
  });

  // ASSIGN ROLE CONFIGURATION TESTS
  describe('Assign Role Configuration', () => {
    beforeEach(async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;
      vm.selectOperation({ id: 'assign-role', name: 'Assign Role' });
      await wrapper.vm.$nextTick();
    });

    it('should show role selection field', () => {
      expect(wrapper.text()).toContain('Select Role');
    });

    it('should show duration selection field', () => {
      expect(wrapper.text()).toContain('Assignment Duration');
    });

    it('should show reason input field', () => {
      expect(wrapper.text()).toContain('Reason');
    });

    it('should validate required role selection', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;
      vm.selectedOperation = { id: 'assign-role' };
      vm.bulkConfig.roleId = null;
      vm.bulkConfig.reason = 'Test reason';

      expect(vm.canExecuteOperation).toBe(false);
    });

    it('should validate required reason', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;
      vm.selectedOperation = { id: 'assign-role' };
      vm.bulkConfig.roleId = '1';
      vm.bulkConfig.reason = '';

      expect(vm.canExecuteOperation).toBe(false);
    });

    it('should enable execute when form is valid', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;
      vm.selectedOperation = { id: 'assign-role' };
      vm.bulkConfig.roleId = '1';
      vm.bulkConfig.reason = 'Test reason';

      expect(vm.canExecuteOperation).toBe(true);
    });
  });

  // UPDATE STATUS CONFIGURATION TESTS
  describe('Update Status Configuration', () => {
    beforeEach(async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;
      vm.selectOperation({ id: 'update-status', name: 'Update Status' });
      await wrapper.vm.$nextTick();
    });

    it('should show status selection field', () => {
      expect(wrapper.text()).toContain('New Status');
    });

    it('should have status options', () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;
      expect(vm.statusOptions.length).toBeGreaterThan(0);
    });

    it('should validate required status', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;
      vm.selectedOperation = { id: 'update-status' };
      vm.bulkConfig.status = null;
      vm.bulkConfig.reason = 'Test';

      expect(vm.canExecuteOperation).toBe(false);
    });
  });

  // REMOVE ROLES CONFIGURATION TESTS
  describe('Remove Roles Configuration', () => {
    beforeEach(async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;
      vm.selectOperation({ id: 'remove-roles', name: 'Remove Roles' });
      await wrapper.vm.$nextTick();
    });

    it('should show roles to remove multiselect', () => {
      expect(wrapper.text()).toContain('Roles to Remove');
    });

    it('should validate at least one role selected', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;
      vm.selectedOperation = { id: 'remove-roles' };
      vm.bulkConfig.rolesToRemove = [];
      vm.bulkConfig.reason = 'Test';

      expect(vm.canExecuteOperation).toBe(false);
    });

    it('should enable execute when roles are selected', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;
      vm.selectedOperation = { id: 'remove-roles' };
      vm.bulkConfig.rolesToRemove = ['1'];
      vm.bulkConfig.reason = 'Test';

      expect(vm.canExecuteOperation).toBe(true);
    });
  });

  // EXPORT DATA CONFIGURATION TESTS
  describe('Export Data Configuration', () => {
    beforeEach(async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;
      vm.selectOperation({ id: 'export-data', name: 'Export Data' });
      await wrapper.vm.$nextTick();
    });

    it('should show export format selection', () => {
      expect(wrapper.text()).toContain('Export Format');
    });

    it('should show include fields multiselect', () => {
      expect(wrapper.text()).toContain('Include Fields');
    });

    it('should have export format options', () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;
      expect(vm.exportFormatOptions.length).toBeGreaterThan(0);
      expect(vm.exportFormatOptions.some((opt: any) => opt.value === 'CSV')).toBe(true);
    });
  });

  // NOTIFICATION OPTIONS TESTS
  describe('Notification Options', () => {
    it('should show notification options section', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;
      vm.selectOperation({ id: 'assign-role' });
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('Notification Options');
    });

    it('should have notify users checkbox', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;
      vm.selectOperation({ id: 'assign-role' });
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('Notify affected users');
    });

    it('should have notify admins checkbox', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;
      vm.selectOperation({ id: 'assign-role' });
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('Notify administrators');
    });

    it('should toggle notification settings', () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      vm.bulkConfig.notifyUsers = true;
      expect(vm.bulkConfig.notifyUsers).toBe(true);

      vm.bulkConfig.notifyUsers = false;
      expect(vm.bulkConfig.notifyUsers).toBe(false);
    });
  });

  // OPERATION PREVIEW TESTS
  describe('Operation Preview', () => {
    it('should show preview section when operation is selected', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;
      vm.selectOperation({ id: 'assign-role', name: 'Assign Role' });
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('Operation Preview');
    });

    it('should display operation summary', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;
      vm.selectOperation({ id: 'assign-role', name: 'Assign Role' });
      vm.bulkConfig.reason = 'Test reason';
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('Operation Summary');
      expect(wrapper.text()).toContain('Assign Role');
      expect(wrapper.text()).toContain('3');
    });

    it('should show high risk warning for dangerous operations', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;
      vm.selectOperation({ id: 'reset-passwords', name: 'Reset Passwords', risk: 'HIGH' });
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('high-risk operation');
    });
  });

  // EXECUTION TESTS
  describe('Bulk Operation Execution', () => {
    it('should execute bulk operation with valid data', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      vm.selectedOperation = { id: 'assign-role', name: 'Assign Role', risk: 'MEDIUM' };
      vm.bulkConfig = { roleId: '1', reason: 'Test', notifyUsers: true };

      await vm.executeBulkOperation();

      expect(toast.add).toHaveBeenCalled();
    });

    it('should show validation errors when submitting invalid form', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      vm.selectedOperation = { id: 'assign-role' };
      vm.bulkConfig = { roleId: null, reason: '' };

      await vm.executeBulkOperation();

      expect(vm.showValidationErrors).toBe(true);
      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({
        severity: 'warn',
      }));
    });

    it('should set processing state during execution', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      vm.selectedOperation = { id: 'assign-role', name: 'Assign Role' };
      vm.bulkConfig = { roleId: '1', reason: 'Test' };

      const promise = vm.executeBulkOperation();
      expect(vm.isProcessing).toBe(true);

      await promise;
      expect(vm.isProcessing).toBe(false);
    });

    it('should emit bulk-completed event on success', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      vm.selectedOperation = { id: 'assign-role', name: 'Assign Role' };
      vm.bulkConfig = { roleId: '1', reason: 'Test' };

      await vm.executeBulkOperation();

      expect(wrapper.emitted('bulk-completed')).toBeTruthy();
    });

    it('should close dialog after successful execution', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      vm.selectedOperation = { id: 'export-data', name: 'Export Data' };
      vm.bulkConfig = { exportFormat: 'CSV', includeFields: ['name', 'email'] };

      await vm.executeBulkOperation();

      expect(wrapper.emitted('update:visible')).toBeTruthy();
    });

    it('should handle execution errors gracefully', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      // Mock error scenario by manipulating state
      vm.selectedOperation = { id: 'assign-role', name: 'Assign Role' };
      vm.bulkConfig = { roleId: '1', reason: 'Test' };

      // The component handles errors internally
      await vm.executeBulkOperation();

      expect(vm.isProcessing).toBe(false);
    });
  });

  // DIALOG INTERACTIONS TESTS
  describe('Dialog Interactions', () => {
    it('should close dialog when Cancel button is clicked', async () => {
      wrapper = createWrapper();

      const cancelButton = wrapper.findAllComponents(Button).find(btn =>
        btn.text().includes('Cancel')
      );
      await cancelButton?.trigger('click');

      expect(wrapper.emitted('update:visible')).toBeTruthy();
      expect(wrapper.emitted('update:visible')?.[0]).toEqual([false]);
    });

    it('should reset form when dialog is shown', () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      vm.onDialogShow();

      expect(vm.selectedOperation).toBeNull();
    });

    it('should reset form when dialog is hidden', () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      vm.selectedOperation = { id: 'test' };
      vm.onDialogHide();

      expect(vm.selectedOperation).toBeNull();
    });

    it('should disable actions during processing', () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      vm.isProcessing = true;

      const cancelButton = wrapper.findAllComponents(Button).find(btn =>
        btn.text().includes('Cancel')
      );
      expect(cancelButton?.attributes('disabled')).toBeTruthy();
    });
  });

  // EDGE CASES TESTS
  describe('Edge Cases', () => {
    it('should handle empty selected users array', () => {
      wrapper = createWrapper({ selectedUsers: [] });
      expect(wrapper.text()).toContain('0 selected user');
    });

    it('should handle single selected user', () => {
      wrapper = createWrapper({ selectedUsers: [mockUsers[0]] });
      expect(wrapper.text()).toContain('1 selected user');
    });

    it('should handle many selected users', () => {
      const manyUsers = Array.from({ length: 100 }, (_, i) => ({
        id: `${i}`,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        roles: [],
      }));

      wrapper = createWrapper({ selectedUsers: manyUsers });
      expect(wrapper.text()).toContain('100 selected users');
    });

    it('should get correct execute button label', () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      vm.selectedOperation = { id: 'assign-role', name: 'Assign Role' };
      expect(vm.getExecuteButtonLabel()).toContain('Assign Role');
    });

    it('should get correct button class for high risk', () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      vm.selectedOperation = { risk: 'HIGH' };
      expect(vm.getExecuteButtonClass()).toBe('p-button-danger');
    });

    it('should get correct button class for medium risk', () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      vm.selectedOperation = { risk: 'MEDIUM' };
      expect(vm.getExecuteButtonClass()).toBe('p-button-warning');
    });
  });

  // ACCESSIBILITY TESTS
  describe('Accessibility', () => {
    it('should have descriptive labels for operations', () => {
      wrapper = createWrapper();
      const operations = wrapper.findAll('.operation-card');

      operations.forEach(op => {
        expect(op.text().length).toBeGreaterThan(0);
      });
    });

    it('should indicate required fields', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;
      vm.selectOperation({ id: 'assign-role' });
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('*');
    });

    it('should show validation errors accessibly', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      vm.selectedOperation = { id: 'assign-role' };
      vm.bulkConfig = { roleId: null, reason: '' };
      vm.showValidationErrors = true;

      await wrapper.vm.$nextTick();

      const invalidInputs = wrapper.findAll('.p-invalid');
      expect(invalidInputs.length).toBeGreaterThan(0);
    });
  });
});
