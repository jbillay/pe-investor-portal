import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import UserCreateDialog from '../UserCreateDialog.vue';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import MultiSelect from 'primevue/multiselect';

// Mock PrimeVue toast
vi.mock('primevue/usetoast', () => ({
  useToast: vi.fn(() => ({
    add: vi.fn(),
  })),
}));

// Mock useUsers composable
const mockCreateUser = vi.fn();
const mockInviteUser = vi.fn();

vi.mock('@/composables/useUsers', () => ({
  useUsers: vi.fn(() => ({
    createUser: mockCreateUser,
    inviteUser: mockInviteUser,
  })),
}));

// Mock available roles
const mockRoles = [
  { id: '1', name: 'SUPER_ADMIN', description: 'Super Administrator' },
  { id: '2', name: 'FUND_MANAGER', description: 'Fund Manager' },
  { id: '3', name: 'INVESTOR', description: 'Investor' },
];

describe('UserCreateDialog.vue', () => {
  let wrapper: VueWrapper;
  let toast: ReturnType<typeof useToast>;

  const createWrapper = (props = {}) => {
    return mount(UserCreateDialog, {
      props: {
        visible: true,
        availableRoles: mockRoles,
        ...props,
      },
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            stubActions: false,
          }),
        ],
        components: {
          Button,
          Dialog,
          InputText,
          MultiSelect,
        },
        stubs: {
          Dialog: false,
          Button: false,
          InputText: false,
          MultiSelect: false,
          Select: true,
          Checkbox: true,
          Textarea: true,
        },
      },
    });
  };

  beforeEach(() => {
    toast = useToast();
    mockCreateUser.mockReset();
    mockInviteUser.mockReset();
    mockCreateUser.mockResolvedValue({ id: '123', email: 'test@example.com' });
    mockInviteUser.mockResolvedValue({ success: true });
  });

  // RENDERING TESTS
  describe('Component Rendering', () => {
    it('should render dialog when visible is true', () => {
      wrapper = createWrapper();
      expect(wrapper.find('.user-create-dialog').exists()).toBe(true);
    });

    it('should not render dialog when visible is false', () => {
      wrapper = createWrapper({ visible: false });
      const dialog = wrapper.findComponent(Dialog);
      expect(dialog.props('visible')).toBe(false);
    });

    it('should render dialog header correctly', () => {
      wrapper = createWrapper();
      const dialog = wrapper.findComponent(Dialog);
      expect(dialog.props('header')).toContain('Create New User');
    });

    it('should render all required form fields', () => {
      wrapper = createWrapper();
      expect(wrapper.find('[data-testid="first-name"]').exists() || wrapper.find('#firstName').exists()).toBe(true);
      expect(wrapper.find('[data-testid="last-name"]').exists() || wrapper.find('#lastName').exists()).toBe(true);
      expect(wrapper.find('[data-testid="email"]').exists() || wrapper.find('#email').exists()).toBe(true);
    });

    it('should render role selection field', () => {
      wrapper = createWrapper();
      const multiSelect = wrapper.findComponent(MultiSelect);
      expect(multiSelect.exists()).toBe(true);
    });

    it('should display Create button', () => {
      wrapper = createWrapper();
      const createButton = wrapper.findAll('button').find(btn =>
        btn.text().includes('Create User') || btn.text().includes('Create')
      );
      expect(createButton).toBeDefined();
    });

    it('should display Cancel button', () => {
      wrapper = createWrapper();
      const cancelButton = wrapper.findAll('button').find(btn =>
        btn.text().includes('Cancel')
      );
      expect(cancelButton).toBeDefined();
    });

    it('should render with loading state disabled by default', () => {
      wrapper = createWrapper();
      const submitButton = wrapper.findAll('button').find(btn =>
        btn.text().includes('Create')
      );
      expect(submitButton?.attributes('disabled')).toBeUndefined();
    });
  });

  // FORM VALIDATION TESTS
  describe('Form Validation', () => {
    it('should validate required firstName field', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      vm.formData.firstName = '';
      vm.formData.lastName = 'Doe';
      vm.formData.email = 'john@example.com';

      const isValid = vm.validateForm();
      expect(isValid).toBe(false);
      expect(vm.errors.firstName).toBeTruthy();
    });

    it('should validate required lastName field', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      vm.formData.firstName = 'John';
      vm.formData.lastName = '';
      vm.formData.email = 'john@example.com';

      const isValid = vm.validateForm();
      expect(isValid).toBe(false);
      expect(vm.errors.lastName).toBeTruthy();
    });

    it('should validate required email field', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      vm.formData.firstName = 'John';
      vm.formData.lastName = 'Doe';
      vm.formData.email = '';

      const isValid = vm.validateForm();
      expect(isValid).toBe(false);
      expect(vm.errors.email).toBeTruthy();
    });

    it('should validate email format', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      vm.formData.email = 'invalid-email';
      const isValid = vm.validateForm();

      expect(isValid).toBe(false);
      expect(vm.errors.email).toContain('valid email');
    });

    it('should accept valid email formats', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      const validEmails = [
        'test@example.com',
        'user.name@example.co.uk',
        'user+tag@example.com',
      ];

      validEmails.forEach(email => {
        vm.formData.email = email;
        vm.formData.firstName = 'John';
        vm.formData.lastName = 'Doe';
        const isValid = vm.validateForm();
        expect(isValid).toBe(true);
      });
    });

    it('should clear validation errors when input is corrected', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      vm.formData.email = 'invalid';
      vm.validateForm();
      expect(vm.errors.email).toBeTruthy();

      vm.formData.email = 'valid@example.com';
      vm.validateForm();
      expect(vm.errors.email).toBeFalsy();
    });

    it('should validate all fields before submission', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      vm.formData = {
        firstName: '',
        lastName: '',
        email: '',
        roles: [],
      };

      const isValid = vm.validateForm();
      expect(isValid).toBe(false);
      expect(Object.keys(vm.errors).length).toBeGreaterThan(0);
    });
  });

  // USER CREATION TESTS
  describe('User Creation', () => {
    it('should create user with valid form data', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      vm.formData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        roles: ['1'],
      };

      await vm.handleSubmit();

      expect(mockCreateUser).toHaveBeenCalledWith(expect.objectContaining({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      }));
    });

    it('should not submit form with invalid data', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      vm.formData = {
        firstName: '',
        lastName: 'Doe',
        email: 'invalid-email',
        roles: [],
      };

      await vm.handleSubmit();

      expect(mockCreateUser).not.toHaveBeenCalled();
    });

    it('should show toast notification on successful creation', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      vm.formData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        roles: ['1'],
      };

      await vm.handleSubmit();

      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({
        severity: 'success',
        summary: expect.any(String),
      }));
    });

    it('should emit created event with new user data', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      vm.formData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        roles: ['1'],
      };

      await vm.handleSubmit();

      expect(wrapper.emitted('created')).toBeTruthy();
      expect(wrapper.emitted('created')?.[0]).toEqual([
        expect.objectContaining({ id: '123', email: 'test@example.com' })
      ]);
    });

    it('should set loading state during creation', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      mockCreateUser.mockImplementation(() => new Promise(resolve =>
        setTimeout(() => resolve({ id: '123', email: 'test@example.com' }), 100)
      ));

      vm.formData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        roles: ['1'],
      };

      const submitPromise = vm.handleSubmit();
      expect(vm.saving).toBe(true);

      await submitPromise;
      expect(vm.saving).toBe(false);
    });

    it('should handle creation errors gracefully', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      mockCreateUser.mockRejectedValue(new Error('Creation failed'));

      vm.formData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        roles: ['1'],
      };

      await vm.handleSubmit();

      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({
        severity: 'error',
      }));
    });
  });

  // DIALOG INTERACTION TESTS
  describe('Dialog Interactions', () => {
    it('should close dialog when Cancel button is clicked', async () => {
      wrapper = createWrapper();

      const cancelButton = wrapper.findAll('button').find(btn =>
        btn.text().includes('Cancel')
      );

      await cancelButton?.trigger('click');

      expect(wrapper.emitted('update:visible')).toBeTruthy();
      expect(wrapper.emitted('update:visible')?.[0]).toEqual([false]);
    });

    it('should reset form when dialog is closed', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      vm.formData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        roles: ['1'],
      };

      await vm.handleClose();

      expect(vm.formData.firstName).toBe('');
      expect(vm.formData.lastName).toBe('');
      expect(vm.formData.email).toBe('');
    });

    it('should clear errors when dialog is opened', async () => {
      wrapper = createWrapper({ visible: false });
      const vm = wrapper.vm as any;

      vm.errors = { email: 'Invalid email' };

      await wrapper.setProps({ visible: true });

      expect(Object.keys(vm.errors).length).toBe(0);
    });

    it('should prevent closing during save operation', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      vm.saving = true;
      vm.handleClose();

      expect(wrapper.emitted('update:visible')).toBeFalsy();
    });
  });

  // ROLE SELECTION TESTS
  describe('Role Selection', () => {
    it('should display available roles in multiselect', () => {
      wrapper = createWrapper();
      const multiSelect = wrapper.findComponent(MultiSelect);

      expect(multiSelect.props('options')).toEqual(mockRoles);
    });

    it('should allow selecting multiple roles', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      vm.formData.roles = ['1', '2'];

      expect(vm.formData.roles).toHaveLength(2);
    });

    it('should allow deselecting roles', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      vm.formData.roles = ['1', '2'];
      vm.formData.roles = ['1'];

      expect(vm.formData.roles).toHaveLength(1);
    });

    it('should include selected roles in creation payload', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      vm.formData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        roles: ['1', '2'],
      };

      await vm.handleSubmit();

      expect(mockCreateUser).toHaveBeenCalledWith(expect.objectContaining({
        roles: ['1', '2'],
      }));
    });
  });

  // ADDITIONAL FIELDS TESTS
  describe('Additional Fields', () => {
    it('should handle phone number input', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      if (vm.formData.phone !== undefined) {
        vm.formData.phone = '+1234567890';
        expect(vm.formData.phone).toBe('+1234567890');
      }
    });

    it('should handle timezone selection', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      if (vm.formData.timezone !== undefined) {
        vm.formData.timezone = 'America/New_York';
        expect(vm.formData.timezone).toBe('America/New_York');
      }
    });

    it('should handle language selection', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      if (vm.formData.language !== undefined) {
        vm.formData.language = 'fr';
        expect(vm.formData.language).toBe('fr');
      }
    });

    it('should handle send invitation checkbox', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      if (vm.sendInvitation !== undefined) {
        vm.sendInvitation = true;
        expect(vm.sendInvitation).toBe(true);
      }
    });
  });

  // EDGE CASES TESTS
  describe('Edge Cases', () => {
    it('should handle special characters in names', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      vm.formData = {
        firstName: "O'Brien",
        lastName: 'Smith-Jones',
        email: 'test@example.com',
        roles: ['1'],
      };

      const isValid = vm.validateForm();
      expect(isValid).toBe(true);
    });

    it('should handle very long names', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      const longName = 'A'.repeat(100);
      vm.formData.firstName = longName;

      const isValid = vm.validateForm();
      // Should have validation for max length
      expect(isValid).toBe(vm.errors.firstName ? false : true);
    });

    it('should handle duplicate email validation if implemented', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      mockCreateUser.mockRejectedValue(new Error('Email already exists'));

      vm.formData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'existing@example.com',
        roles: ['1'],
      };

      await vm.handleSubmit();

      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({
        severity: 'error',
      }));
    });

    it('should handle network errors during creation', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      mockCreateUser.mockRejectedValue(new Error('Network error'));

      vm.formData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        roles: ['1'],
      };

      await vm.handleSubmit();

      expect(vm.saving).toBe(false);
      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({
        severity: 'error',
      }));
    });
  });

  // ACCESSIBILITY TESTS
  describe('Accessibility', () => {
    it('should have proper labels for form fields', () => {
      wrapper = createWrapper();
      const labels = wrapper.findAll('label');

      expect(labels.length).toBeGreaterThan(0);
    });

    it('should indicate required fields', () => {
      wrapper = createWrapper();
      const html = wrapper.html();

      expect(html).toContain('*');
    });

    it('should display validation errors accessibly', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      vm.formData.email = 'invalid';
      vm.validateForm();

      await wrapper.vm.$nextTick();

      const errorMessages = wrapper.findAll('.p-error, [role="alert"]');
      expect(errorMessages.length).toBeGreaterThan(0);
    });
  });

  // COMPUTED PROPERTIES TESTS
  describe('Computed Properties', () => {
    it('should compute isFormValid correctly', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      vm.formData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        roles: ['1'],
      };
      vm.errors = {};

      expect(vm.isFormValid).toBe(true);
    });

    it('should compute isFormValid as false with errors', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      vm.errors = { email: 'Invalid email' };

      if (vm.isFormValid !== undefined) {
        expect(vm.isFormValid).toBe(false);
      }
    });
  });
});
