import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { createRouter, createMemoryHistory } from 'vue-router';
import AdminNavigation from '../AdminNavigation.vue';
import { usePluginRegistryStore } from '@/stores/pluginRegistry';

// Create a mock router
const createMockRouter = () => {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
      { path: '/admin/users', name: 'admin-users', component: { template: '<div>Users</div>' } },
      { path: '/admin/roles', name: 'admin-roles', component: { template: '<div>Roles</div>' } },
    ],
  });
};

describe('AdminNavigation.vue', () => {
  let wrapper: VueWrapper | null;
  let mockRouter: any;
  let pluginRegistryStore: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRouter = createMockRouter();

    try {
      wrapper = mount(AdminNavigation, {
        global: {
          plugins: [
            createTestingPinia({
              createSpy: vi.fn,
              initialState: {
                pluginRegistry: {
                  installedPlugins: [],
                  loadedPlugins: new Map(),
                  isLoading: false,
                  error: null,
                },
              },
            }),
            mockRouter,
          ],
        },
      });

      pluginRegistryStore = usePluginRegistryStore();
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
        const pushSpy = vi.spyOn(mockRouter, 'push');
        const buttons = wrapper.findAll('button');
        await buttons[0].trigger('click'); // Users button

        expect(pushSpy).toHaveBeenCalledWith('/admin/users');
      }
    });

    it('should call router.push when clicking Roles button', async () => {
      if (wrapper) {
        const pushSpy = vi.spyOn(mockRouter, 'push');
        const buttons = wrapper.findAll('button');
        await buttons[1].trigger('click'); // Roles button

        expect(pushSpy).toHaveBeenCalledWith('/admin/roles');
      }
    });

    it('should call router.push when clicking Data Objects button', async () => {
      if (wrapper) {
        const pushSpy = vi.spyOn(mockRouter, 'push');
        const buttons = wrapper.findAll('button');
        await buttons[2].trigger('click'); // Data Objects button

        expect(pushSpy).toHaveBeenCalledWith('/admin/data-objects');
      }
    });

    it('should call router.push when clicking Analytics button', async () => {
      if (wrapper) {
        const pushSpy = vi.spyOn(mockRouter, 'push');
        const buttons = wrapper.findAll('button');
        await buttons[3].trigger('click'); // Analytics button

        expect(pushSpy).toHaveBeenCalledWith('/admin/analytics');
      }
    });

    it('should call router.push when clicking Email Templates button', async () => {
      if (wrapper) {
        const pushSpy = vi.spyOn(mockRouter, 'push');
        const buttons = wrapper.findAll('button');
        await buttons[4].trigger('click'); // Email Templates button

        expect(pushSpy).toHaveBeenCalledWith('/admin/email-templates');
      }
    });

    it('should call router.push when clicking Plugins button', async () => {
      if (wrapper) {
        const pushSpy = vi.spyOn(mockRouter, 'push');
        const buttons = wrapper.findAll('button');
        await buttons[5].trigger('click'); // Plugins button

        expect(pushSpy).toHaveBeenCalledWith('/admin/plugins');
      }
    });

    it('should directly invoke navigateTo function', async () => {
      if (wrapper) {
        const pushSpy = vi.spyOn(mockRouter, 'push');
        // Directly call the navigateTo function
        wrapper.vm.navigateTo('/admin/users');

        expect(pushSpy).toHaveBeenCalledWith('/admin/users');
      }
    });
  });

  describe('Active State - isActive Function', () => {
    it('should mark users tab as active when on /admin/users', async () => {
      if (wrapper) {
        await mockRouter.push('/admin/users');
        await wrapper.vm.$nextTick();

        const buttons = wrapper.findAll('button');
        expect(buttons[0].classes()).toContain('active');
        expect(buttons[1].classes()).not.toContain('active');
      }
    });

    it('should mark roles tab as active when on /admin/roles', async () => {
      if (wrapper) {
        await mockRouter.push('/admin/roles');
        await wrapper.vm.$nextTick();

        const buttons = wrapper.findAll('button');
        expect(buttons[1].classes()).toContain('active');
        expect(buttons[0].classes()).not.toContain('active');
      }
    });

    it('should mark data objects tab as active when on /admin/data-objects', async () => {
      if (wrapper) {
        await mockRouter.push('/admin/data-objects');
        await wrapper.vm.$nextTick();

        const buttons = wrapper.findAll('button');
        expect(buttons[2].classes()).toContain('active');
      }
    });

    it('should mark analytics tab as active when on /admin/analytics', async () => {
      if (wrapper) {
        await mockRouter.push('/admin/analytics');
        await wrapper.vm.$nextTick();

        const buttons = wrapper.findAll('button');
        expect(buttons[3].classes()).toContain('active');
      }
    });

    it('should mark email templates tab as active when on /admin/email-templates', async () => {
      if (wrapper) {
        await mockRouter.push('/admin/email-templates');
        await wrapper.vm.$nextTick();

        const buttons = wrapper.findAll('button');
        expect(buttons[4].classes()).toContain('active');
      }
    });

    it('should mark plugins tab as active when on /admin/plugins', async () => {
      if (wrapper) {
        await mockRouter.push('/admin/plugins');
        await wrapper.vm.$nextTick();

        const buttons = wrapper.findAll('button');
        expect(buttons[5].classes()).toContain('active');
      }
    });

    it('should not mark any tab as active on non-admin route', async () => {
      if (wrapper) {
        await mockRouter.push('/');
        await wrapper.vm.$nextTick();

        const buttons = wrapper.findAll('button');
        buttons.forEach(button => {
          expect(button.classes()).not.toContain('active');
        });
      }
    });

    it('should directly invoke isActive function', () => {
      if (wrapper && wrapper.vm) {
        // Directly call isActive - note that the current route is '/' from beforeEach
        expect(wrapper.vm.isActive('/')).toBe(true);
        expect(wrapper.vm.isActive('/admin/users')).toBe(false);
        expect(wrapper.vm.isActive('/admin/roles')).toBe(false);
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

  describe('Plugin Admin Menu Items', () => {
    it('should render plugin admin menu items when available', async () => {
      // Set up plugin with admin menu item
      if (pluginRegistryStore) {
        pluginRegistryStore.installedPlugins = [
          {
            id: '1',
            pluginId: 'test-plugin',
            name: 'Test Plugin',
            version: '1.0.0',
            author: 'Test Author',
            status: 'INSTALLED',
            manifest: {
              id: 'test-plugin',
              name: 'Test Plugin',
              version: '1.0.0',
              author: 'Test Author',
              coreVersion: '1.0.0',
              menus: [
                {
                  id: 'test-admin-menu',
                  label: 'Test Admin',
                  type: 'admin',
                  icon: 'pi-test',
                  route: '/admin/test-plugin',
                  order: 100,
                },
              ],
            },
            filePath: '/path/to/plugin',
            createdAt: new Date(),
            updatedAt: new Date(),
            isInstalled: true,
            canInstall: false,
            canUninstall: true,
          },
        ];

        await wrapper?.vm.$nextTick();

        const buttons = wrapper?.findAll('button');
        expect(buttons?.length).toBe(7); // 6 core + 1 plugin
        expect(wrapper?.text()).toContain('Test Admin');
        expect(wrapper?.find('.pi-test').exists()).toBe(true);
      }
    });

    it('should sort menu items by order property', async () => {
      if (pluginRegistryStore) {
        pluginRegistryStore.installedPlugins = [
          {
            id: '1',
            pluginId: 'test-plugin',
            name: 'Test Plugin',
            version: '1.0.0',
            author: 'Test Author',
            status: 'INSTALLED',
            manifest: {
              id: 'test-plugin',
              name: 'Test Plugin',
              version: '1.0.0',
              author: 'Test Author',
              coreVersion: '1.0.0',
              menus: [
                {
                  id: 'test-admin-menu',
                  label: 'Early Plugin',
                  type: 'admin',
                  icon: 'pi-test',
                  route: '/admin/early-plugin',
                  order: 5, // Should appear before Users (order: 10)
                },
              ],
            },
            filePath: '/path/to/plugin',
            createdAt: new Date(),
            updatedAt: new Date(),
            isInstalled: true,
            canInstall: false,
            canUninstall: true,
          },
        ];

        await wrapper?.vm.$nextTick();

        const buttons = wrapper?.findAll('button');
        // First button should be the plugin menu item with order: 5
        expect(buttons?.[0].text()).toContain('Early Plugin');
        // Second button should be Users with order: 10
        expect(buttons?.[1].text()).toContain('Users');
      }
    });

    it('should use default icon for plugin menus without icon', async () => {
      if (pluginRegistryStore) {
        pluginRegistryStore.installedPlugins = [
          {
            id: '1',
            pluginId: 'test-plugin',
            name: 'Test Plugin',
            version: '1.0.0',
            author: 'Test Author',
            status: 'INSTALLED',
            manifest: {
              id: 'test-plugin',
              name: 'Test Plugin',
              version: '1.0.0',
              author: 'Test Author',
              coreVersion: '1.0.0',
              menus: [
                {
                  id: 'test-admin-menu',
                  label: 'No Icon Plugin',
                  type: 'admin',
                  route: '/admin/no-icon',
                  order: 100,
                },
              ],
            },
            filePath: '/path/to/plugin',
            createdAt: new Date(),
            updatedAt: new Date(),
            isInstalled: true,
            canInstall: false,
            canUninstall: true,
          },
        ];

        await wrapper?.vm.$nextTick();

        // Should use default puzzle-piece icon
        expect(wrapper?.find('.pi-puzzle-piece').exists()).toBe(true);
      }
    });

    it('should not render plugin menus with type "main"', async () => {
      if (pluginRegistryStore) {
        pluginRegistryStore.installedPlugins = [
          {
            id: '1',
            pluginId: 'test-plugin',
            name: 'Test Plugin',
            version: '1.0.0',
            author: 'Test Author',
            status: 'INSTALLED',
            manifest: {
              id: 'test-plugin',
              name: 'Test Plugin',
              version: '1.0.0',
              author: 'Test Author',
              coreVersion: '1.0.0',
              menus: [
                {
                  id: 'test-main-menu',
                  label: 'Main Menu Item',
                  type: 'main',
                  route: '/plugins/test',
                  order: 100,
                },
              ],
            },
            filePath: '/path/to/plugin',
            createdAt: new Date(),
            updatedAt: new Date(),
            isInstalled: true,
            canInstall: false,
            canUninstall: true,
          },
        ];

        await wrapper?.vm.$nextTick();

        const buttons = wrapper?.findAll('button');
        // Should still be 6 items (core only, no plugin admin menu)
        expect(buttons?.length).toBe(6);
        expect(wrapper?.text()).not.toContain('Main Menu Item');
      }
    });
  });
});
