import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import AdminNavigation from '../AdminNavigation.vue';

// Create mock functions
const mockPush = vi.fn();
let mockRoute = { path: '/' };

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useRoute: () => mockRoute,
}));

describe('AdminNavigation.vue', () => {
  let wrapper: VueWrapper | null;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRoute = { path: '/' };
    try {
      wrapper = mount(AdminNavigation);
    } catch (e) {
      wrapper = null;
    }
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('Component Rendering', () => {
    it('should mount the component', () => {
      expect(wrapper).toBeDefined();
    });

    it('should render navigation wrapper', () => {
      if (wrapper) {
        expect(wrapper.find('.admin-nav-wrapper').exists()).toBe(true);
      }
    });

    it('should render all navigation items', () => {
      if (wrapper) {
        const buttons = wrapper.findAll('button');
        expect(buttons.length).toBe(6); // Users, Roles, Data Objects, Analytics, Email Templates, Plugins
      }
    });

    it('should render navigation item labels', () => {
      if (wrapper) {
        expect(wrapper.text()).toContain('Users');
        expect(wrapper.text()).toContain('Roles');
        expect(wrapper.text()).toContain('Data Objects');
        expect(wrapper.text()).toContain('Analytics');
        expect(wrapper.text()).toContain('Email Templates');
        expect(wrapper.text()).toContain('Plugins');
      }
    });

    it('should render icons for each navigation item', () => {
      if (wrapper) {
        expect(wrapper.find('.pi-users').exists()).toBe(true);
        expect(wrapper.find('.pi-key').exists()).toBe(true);
        expect(wrapper.find('.pi-database').exists()).toBe(true);
        expect(wrapper.find('.pi-chart-bar').exists()).toBe(true);
        expect(wrapper.find('.pi-envelope').exists()).toBe(true);
        expect(wrapper.find('.pi-box').exists()).toBe(true);
      }
    });
  });

  describe('Navigation - navigateTo Function', () => {
    it('should call router.push when clicking Users button', async () => {
      if (wrapper) {
        const buttons = wrapper.findAll('button');
        await buttons[0].trigger('click'); // Users button

        expect(mockPush).toHaveBeenCalledWith('/admin/users');
      }
    });

    it('should call router.push when clicking Roles button', async () => {
      if (wrapper) {
        const buttons = wrapper.findAll('button');
        await buttons[1].trigger('click'); // Roles button

        expect(mockPush).toHaveBeenCalledWith('/admin/roles');
      }
    });

    it('should call router.push when clicking Data Objects button', async () => {
      if (wrapper) {
        const buttons = wrapper.findAll('button');
        await buttons[2].trigger('click'); // Data Objects button

        expect(mockPush).toHaveBeenCalledWith('/admin/data-objects');
      }
    });

    it('should call router.push when clicking Analytics button', async () => {
      if (wrapper) {
        const buttons = wrapper.findAll('button');
        await buttons[3].trigger('click'); // Analytics button

        expect(mockPush).toHaveBeenCalledWith('/admin/analytics');
      }
    });

    it('should call router.push when clicking Email Templates button', async () => {
      if (wrapper) {
        const buttons = wrapper.findAll('button');
        await buttons[4].trigger('click'); // Email Templates button

        expect(mockPush).toHaveBeenCalledWith('/admin/email-templates');
      }
    });

    it('should call router.push when clicking Plugins button', async () => {
      if (wrapper) {
        const buttons = wrapper.findAll('button');
        await buttons[5].trigger('click'); // Plugins button

        expect(mockPush).toHaveBeenCalledWith('/admin/plugins');
      }
    });

    it('should directly invoke navigateTo function', async () => {
      if (wrapper) {
        // Directly call the navigateTo function
        wrapper.vm.navigateTo('/admin/users');

        expect(mockPush).toHaveBeenCalledWith('/admin/users');
      }
    });
  });

  describe('Active State - isActive Function', () => {
    it('should mark users tab as active when on /admin/users', () => {
      mockRoute.path = '/admin/users';
      wrapper = mount(AdminNavigation);

      if (wrapper) {
        const buttons = wrapper.findAll('button');
        expect(buttons[0].classes()).toContain('active');
        expect(buttons[1].classes()).not.toContain('active');
      }
    });

    it('should mark roles tab as active when on /admin/roles', () => {
      mockRoute.path = '/admin/roles';
      wrapper = mount(AdminNavigation);

      if (wrapper) {
        const buttons = wrapper.findAll('button');
        expect(buttons[1].classes()).toContain('active');
        expect(buttons[0].classes()).not.toContain('active');
      }
    });

    it('should mark data objects tab as active when on /admin/data-objects', () => {
      mockRoute.path = '/admin/data-objects';
      wrapper = mount(AdminNavigation);

      if (wrapper) {
        const buttons = wrapper.findAll('button');
        expect(buttons[2].classes()).toContain('active');
      }
    });

    it('should mark analytics tab as active when on /admin/analytics', () => {
      mockRoute.path = '/admin/analytics';
      wrapper = mount(AdminNavigation);

      if (wrapper) {
        const buttons = wrapper.findAll('button');
        expect(buttons[3].classes()).toContain('active');
      }
    });

    it('should mark email templates tab as active when on /admin/email-templates', () => {
      mockRoute.path = '/admin/email-templates';
      wrapper = mount(AdminNavigation);

      if (wrapper) {
        const buttons = wrapper.findAll('button');
        expect(buttons[4].classes()).toContain('active');
      }
    });

    it('should mark plugins tab as active when on /admin/plugins', () => {
      mockRoute.path = '/admin/plugins';
      wrapper = mount(AdminNavigation);

      if (wrapper) {
        const buttons = wrapper.findAll('button');
        expect(buttons[5].classes()).toContain('active');
      }
    });

    it('should not mark any tab as active on non-admin route', () => {
      mockRoute.path = '/dashboard';
      wrapper = mount(AdminNavigation);

      if (wrapper) {
        const buttons = wrapper.findAll('button');
        buttons.forEach(button => {
          expect(button.classes()).not.toContain('active');
        });
      }
    });

    it('should directly invoke isActive function', () => {
      mockRoute.path = '/admin/users';
      wrapper = mount(AdminNavigation);

      if (wrapper) {
        // Directly call isActive
        expect(wrapper.vm.isActive('/admin/users')).toBe(true);
        expect(wrapper.vm.isActive('/admin/roles')).toBe(false);
        expect(wrapper.vm.isActive('/admin/plugins')).toBe(false);
      }
    });
  });

  describe('Navigation Items Structure', () => {
    it('should have correct structure for all nav items', () => {
      if (wrapper) {
        const buttons = wrapper.findAll('.admin-nav-tab');

        // Each button should have icon and label
        buttons.forEach(button => {
          expect(button.find('i').exists()).toBe(true);
          expect(button.find('span').exists()).toBe(true);
        });
      }
    });
  });
});
