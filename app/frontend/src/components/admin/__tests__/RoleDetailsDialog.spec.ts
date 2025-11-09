import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import RoleDetailsDialog from '../RoleDetailsDialog.vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import InputText from 'primevue/inputtext';

const mockRole = {
  id: '1',
  name: 'FUND_MANAGER',
  description: 'Manages investment funds and portfolios',
  status: 'ACTIVE',
  isDefault: false,
  isSystemRole: false,
  userCount: 12,
  createdAt: '2024-01-15T10:00:00Z',
  permissions: [
    { id: 'p1', resource: 'FUND', action: 'CREATE', description: 'Create new funds', level: 'HIGH' },
    { id: 'p2', resource: 'FUND', action: 'READ', description: 'View fund details', level: 'MEDIUM' },
    { id: 'p3', resource: 'INVESTMENT', action: 'CREATE', description: 'Create investments', level: 'HIGH' },
    { id: 'p4', resource: 'INVESTMENT', action: 'UPDATE', description: 'Update investments', level: 'MEDIUM' },
    { id: 'p5', resource: 'DOCUMENT', action: 'UPLOAD', description: 'Upload documents', level: 'LOW' },
  ],
};

describe('RoleDetailsDialog.vue', () => {
  let wrapper: VueWrapper;

  const createWrapper = (props = {}) => {
    return mount(RoleDetailsDialog, {
      props: {
        visible: true,
        role: mockRole,
        ...props,
      },
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            stubActions: false,
          }),
        ],
        components: { Dialog, Button, Tag, InputText },
        stubs: {
          Dialog: false,
          Button: false,
          Tag: false,
          InputText: false,
          InputGroup: true,
          InputGroupAddon: true,
          ProgressSpinner: true,
        },
      },
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // RENDERING TESTS
  describe('Component Rendering', () => {
    it('should render dialog when visible', () => {
      wrapper = createWrapper();
      expect(wrapper.find('.role-details-dialog').exists()).toBe(true);
    });

    it('should not render when visible is false', () => {
      wrapper = createWrapper({ visible: false });
      const dialog = wrapper.findComponent(Dialog);
      expect(dialog.props('visible')).toBe(false);
    });

    it('should render role name in header', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('FUND_MANAGER');
    });

    it('should render role description', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('Manages investment funds and portfolios');
    });

    it('should render role status badge', () => {
      wrapper = createWrapper();
      const tags = wrapper.findAllComponents(Tag);
      const statusTag = tags.find(tag => tag.props('value') === 'ACTIVE');
      expect(statusTag?.exists()).toBe(true);
    });

    it('should render user count metric', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('12');
      expect(wrapper.text()).toContain('Assigned Users');
    });

    it('should render permissions count metric', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('5');
      expect(wrapper.text()).toContain('Permissions');
    });

    it('should render created date', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('2024');
    });

    it('should render default role badge when isDefault is true', () => {
      const defaultRole = { ...mockRole, isDefault: true };
      wrapper = createWrapper({ role: defaultRole });

      const tags = wrapper.findAllComponents(Tag);
      const defaultTag = tags.find(tag => tag.props('value') === 'DEFAULT ROLE');
      expect(defaultTag?.exists()).toBe(true);
    });

    it('should render system role badge when isSystemRole is true', () => {
      const systemRole = { ...mockRole, isSystemRole: true };
      wrapper = createWrapper({ role: systemRole });

      const tags = wrapper.findAllComponents(Tag);
      const systemTag = tags.find(tag => tag.props('value') === 'SYSTEM');
      expect(systemTag?.exists()).toBe(true);
    });
  });

  // PERMISSIONS SECTION TESTS
  describe('Permissions Section', () => {
    it('should render permissions section', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('Permissions');
    });

    it('should render search input for permissions', () => {
      wrapper = createWrapper();
      const searchInput = wrapper.findComponent(InputText);
      expect(searchInput.exists()).toBe(true);
    });

    it('should render all permissions', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('CREATE');
      expect(wrapper.text()).toContain('READ');
      expect(wrapper.text()).toContain('UPDATE');
      expect(wrapper.text()).toContain('UPLOAD');
    });

    it('should group permissions by resource', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('FUND');
      expect(wrapper.text()).toContain('INVESTMENT');
      expect(wrapper.text()).toContain('DOCUMENT');
    });

    it('should render permission descriptions', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('Create new funds');
      expect(wrapper.text()).toContain('View fund details');
    });

    it('should display permission level tags', () => {
      wrapper = createWrapper();
      const tags = wrapper.findAllComponents(Tag);
      const levelTags = tags.filter(tag =>
        ['HIGH', 'MEDIUM', 'LOW'].includes(tag.props('value') as string)
      );
      expect(levelTags.length).toBeGreaterThan(0);
    });

    it('should render empty state when no permissions', () => {
      const roleWithoutPermissions = { ...mockRole, permissions: [] };
      wrapper = createWrapper({ role: roleWithoutPermissions });

      expect(wrapper.text()).toContain('No permissions');
    });
  });

  // SEARCH FUNCTIONALITY TESTS
  describe('Permission Search', () => {
    it('should filter permissions by action name', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      vm.permissionSearch = 'CREATE';
      await wrapper.vm.$nextTick();

      const filteredPermissions = vm.filteredGroupedPermissions;
      expect(Object.values(filteredPermissions).flat().length).toBeLessThan(mockRole.permissions.length);
    });

    it('should filter permissions by resource', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      vm.permissionSearch = 'FUND';
      await wrapper.vm.$nextTick();

      const filteredPermissions = vm.filteredGroupedPermissions;
      const fundPermissions = Object.values(filteredPermissions).flat();
      expect(fundPermissions.length).toBe(2); // Only FUND permissions
    });

    it('should filter permissions by description', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      vm.permissionSearch = 'Upload';
      await wrapper.vm.$nextTick();

      const filteredPermissions = vm.filteredGroupedPermissions;
      expect(Object.keys(filteredPermissions)).toContain('DOCUMENT');
    });

    it('should be case insensitive', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      vm.permissionSearch = 'create';
      await wrapper.vm.$nextTick();

      const filteredPermissions = vm.filteredGroupedPermissions;
      expect(Object.values(filteredPermissions).flat().length).toBeGreaterThan(0);
    });

    it('should show all permissions when search is empty', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      vm.permissionSearch = '';
      await wrapper.vm.$nextTick();

      const filteredPermissions = vm.filteredGroupedPermissions;
      const totalFiltered = Object.values(filteredPermissions).flat().length;
      expect(totalFiltered).toBe(mockRole.permissions.length);
    });

    it('should clear search on dialog hide', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      vm.permissionSearch = 'test';
      vm.onDialogHide();

      expect(vm.permissionSearch).toBe('');
    });
  });

  // COMPUTED PROPERTIES TESTS
  describe('Computed Properties', () => {
    it('should compute permission count correctly', () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      expect(vm.permissionCount).toBe(5);
    });

    it('should handle role with no permissions', () => {
      const roleWithoutPermissions = { ...mockRole, permissions: [] };
      wrapper = createWrapper({ role: roleWithoutPermissions });
      const vm = wrapper.vm as any;

      expect(vm.permissionCount).toBe(0);
    });

    it('should group permissions by resource correctly', () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      const grouped = vm.groupedPermissions;
      expect(grouped.FUND).toHaveLength(2);
      expect(grouped.INVESTMENT).toHaveLength(2);
      expect(grouped.DOCUMENT).toHaveLength(1);
    });
  });

  // DIALOG INTERACTIONS TESTS
  describe('Dialog Interactions', () => {
    it('should close dialog when Close button is clicked', async () => {
      wrapper = createWrapper();

      const closeButton = wrapper.findAllComponents(Button).find(btn =>
        btn.text().includes('Close')
      );
      await closeButton?.trigger('click');

      expect(wrapper.emitted('update:visible')).toBeTruthy();
      expect(wrapper.emitted('update:visible')?.[0]).toEqual([false]);
    });

    it('should reset search when dialog is hidden', () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      vm.permissionSearch = 'test';
      vm.onDialogHide();

      expect(vm.permissionSearch).toBe('');
    });
  });

  // ROLE COLOR AND INITIALS TESTS
  describe('Role Display Helpers', () => {
    it('should generate role color based on name', () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      const color = vm.getRoleColor('FUND_MANAGER');
      expect(color).toBeTruthy();
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it('should generate consistent colors for same role name', () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      const color1 = vm.getRoleColor('FUND_MANAGER');
      const color2 = vm.getRoleColor('FUND_MANAGER');
      expect(color1).toBe(color2);
    });

    it('should generate role initials from name', () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      const initials = vm.getRoleInitials('FUND_MANAGER');
      expect(initials).toBe('FM');
    });

    it('should handle single word role names for initials', () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      const initials = vm.getRoleInitials('ADMIN');
      expect(initials).toBe('AD');
    });
  });

  // STATUS AND SEVERITY TESTS
  describe('Status and Severity Helpers', () => {
    it('should return correct severity for ACTIVE status', () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      expect(vm.getStatusSeverity('ACTIVE')).toBe('success');
    });

    it('should return correct severity for INACTIVE status', () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      expect(vm.getStatusSeverity('INACTIVE')).toBe('danger');
    });

    it('should return correct severity for HIGH level', () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      expect(vm.getLevelSeverity('HIGH')).toBe('danger');
    });

    it('should return correct severity for MEDIUM level', () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      expect(vm.getLevelSeverity('MEDIUM')).toBe('warning');
    });

    it('should return correct severity for LOW level', () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      expect(vm.getLevelSeverity('LOW')).toBe('info');
    });
  });

  // RESOURCE ICON TESTS
  describe('Resource Icon Mapping', () => {
    it('should return correct icon for USER resource', () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      expect(vm.getResourceIcon('USER')).toContain('pi-user');
    });

    it('should return correct icon for FUND resource', () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      expect(vm.getResourceIcon('FUND')).toContain('pi-briefcase');
    });

    it('should return default icon for unknown resource', () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      expect(vm.getResourceIcon('UNKNOWN')).toContain('pi-circle');
    });
  });

  // DATE FORMATTING TESTS
  describe('Date Formatting', () => {
    it('should format dates correctly', () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      const formatted = vm.formatDate('2024-01-15T10:00:00Z');
      expect(formatted).toContain('2024');
    });

    it('should handle invalid dates', () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      const formatted = vm.formatDate('');
      expect(formatted).toBe('N/A');
    });
  });

  // LOADING STATE TESTS
  describe('Loading States', () => {
    it('should show loading spinner when role is null', () => {
      wrapper = createWrapper({ role: null });
      expect(wrapper.text()).toContain('Loading');
    });

    it('should not show loading when role is provided', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).not.toContain('Loading role details');
    });
  });

  // EDGE CASES TESTS
  describe('Edge Cases', () => {
    it('should handle role with empty description', () => {
      const roleWithoutDescription = { ...mockRole, description: '' };
      wrapper = createWrapper({ role: roleWithoutDescription });

      expect(wrapper.text()).toContain('No description provided');
    });

    it('should handle role with zero users', () => {
      const roleWithoutUsers = { ...mockRole, userCount: 0 };
      wrapper = createWrapper({ role: roleWithoutUsers });

      expect(wrapper.text()).toContain('0');
    });

    it('should handle role with many permissions', () => {
      const manyPermissions = Array.from({ length: 50 }, (_, i) => ({
        id: `p${i}`,
        resource: 'TEST',
        action: `ACTION_${i}`,
        description: `Test permission ${i}`,
        level: 'MEDIUM',
      }));

      const roleWithManyPermissions = { ...mockRole, permissions: manyPermissions };
      wrapper = createWrapper({ role: roleWithManyPermissions });

      expect(wrapper.text()).toContain('50');
    });
  });

  // ACCESSIBILITY TESTS
  describe('Accessibility', () => {
    it('should have proper labels for sections', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('Description');
      expect(wrapper.text()).toContain('Permissions');
    });

    it('should have searchable permissions section', () => {
      wrapper = createWrapper();
      const searchInput = wrapper.findComponent(InputText);
      expect(searchInput.attributes('placeholder')).toContain('Search');
    });
  });
});
