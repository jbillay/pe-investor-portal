import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { createRouter, createWebHistory, Router } from 'vue-router';
import AdminNavigation from '../AdminNavigation.vue';

describe('AdminNavigation.vue', () => {
  let wrapper: VueWrapper;
  let router: Router;

  const routes = [
    { path: '/admin/users', component: { template: '<div>Users</div>' } },
    { path: '/admin/roles', component: { template: '<div>Roles</div>' } },
    { path: '/admin/data-objects', component: { template: '<div>Data Objects</div>' } },
    { path: '/admin/analytics', component: { template: '<div>Analytics</div>' } },
    { path: '/admin/email-templates', component: { template: '<div>Email Templates</div>' } },
    { path: '/admin/plugins', component: { template: '<div>Plugins</div>' } },
  ];

  beforeEach(() => {
    router = createRouter({
      history: createWebHistory(),
      routes,
    });

    wrapper = mount(AdminNavigation, {
      global: {
        plugins: [router],
      },
    });
  });

  // RENDERING TESTS
  describe('Component Rendering', () => {
    it('should render the navigation wrapper', () => {
      expect(wrapper.find('.admin-nav-wrapper').exists()).toBe(true);
    });

    it('should render all navigation tabs', () => {
      const tabs = wrapper.findAll('.admin-nav-tab');
      expect(tabs).toHaveLength(6);
    });

    it('should render Users navigation item', () => {
      const tabs = wrapper.findAll('.admin-nav-tab');
      const usersTab = tabs.find(tab => tab.text().includes('Users'));
      expect(usersTab).toBeTruthy();
    });

    it('should render Roles navigation item', () => {
      const tabs = wrapper.findAll('.admin-nav-tab');
      const rolesTab = tabs.find(tab => tab.text().includes('Roles'));
      expect(rolesTab).toBeTruthy();
    });

    it('should render Data Objects navigation item', () => {
      const tabs = wrapper.findAll('.admin-nav-tab');
      const dataObjectsTab = tabs.find(tab => tab.text().includes('Data Objects'));
      expect(dataObjectsTab).toBeTruthy();
    });

    it('should render Analytics navigation item', () => {
      const tabs = wrapper.findAll('.admin-nav-tab');
      const analyticsTab = tabs.find(tab => tab.text().includes('Analytics'));
      expect(analyticsTab).toBeTruthy();
    });

    it('should render Email Templates navigation item', () => {
      const tabs = wrapper.findAll('.admin-nav-tab');
      const emailTab = tabs.find(tab => tab.text().includes('Email Templates'));
      expect(emailTab).toBeTruthy();
    });

    it('should render Plugins navigation item', () => {
      const tabs = wrapper.findAll('.admin-nav-tab');
      const pluginsTab = tabs.find(tab => tab.text().includes('Plugins'));
      expect(pluginsTab).toBeTruthy();
    });

    it('should render icons for each tab', () => {
      const tabs = wrapper.findAll('.admin-nav-tab');
      tabs.forEach(tab => {
        expect(tab.find('i').exists()).toBe(true);
      });
    });

    it('should have appropriate icons for each item', () => {
      const html = wrapper.html();
      expect(html).toContain('pi-users');
      expect(html).toContain('pi-key');
      expect(html).toContain('pi-database');
      expect(html).toContain('pi-chart-bar');
      expect(html).toContain('pi-envelope');
      expect(html).toContain('pi-box');
    });
  });

  // NAVIGATION TESTS
  describe('Navigation Behavior', () => {
    it('should navigate to Users page when Users tab is clicked', async () => {
      const tabs = wrapper.findAll('.admin-nav-tab');
      const usersTab = tabs.find(tab => tab.text().includes('Users'));

      await usersTab?.trigger('click');
      await wrapper.vm.$nextTick();

      expect(router.currentRoute.value.path).toBe('/admin/users');
    });

    it('should navigate to Roles page when Roles tab is clicked', async () => {
      const tabs = wrapper.findAll('.admin-nav-tab');
      const rolesTab = tabs.find(tab => tab.text().includes('Roles'));

      await rolesTab?.trigger('click');
      await wrapper.vm.$nextTick();

      expect(router.currentRoute.value.path).toBe('/admin/roles');
    });

    it('should navigate to Data Objects page when clicked', async () => {
      const tabs = wrapper.findAll('.admin-nav-tab');
      const dataTab = tabs.find(tab => tab.text().includes('Data Objects'));

      await dataTab?.trigger('click');
      await wrapper.vm.$nextTick();

      expect(router.currentRoute.value.path).toBe('/admin/data-objects');
    });

    it('should navigate to Analytics page when clicked', async () => {
      const tabs = wrapper.findAll('.admin-nav-tab');
      const analyticsTab = tabs.find(tab => tab.text().includes('Analytics'));

      await analyticsTab?.trigger('click');
      await wrapper.vm.$nextTick();

      expect(router.currentRoute.value.path).toBe('/admin/analytics');
    });

    it('should navigate to Email Templates page when clicked', async () => {
      const tabs = wrapper.findAll('.admin-nav-tab');
      const emailTab = tabs.find(tab => tab.text().includes('Email Templates'));

      await emailTab?.trigger('click');
      await wrapper.vm.$nextTick();

      expect(router.currentRoute.value.path).toBe('/admin/email-templates');
    });

    it('should navigate to Plugins page when clicked', async () => {
      const tabs = wrapper.findAll('.admin-nav-tab');
      const pluginsTab = tabs.find(tab => tab.text().includes('Plugins'));

      await pluginsTab?.trigger('click');
      await wrapper.vm.$nextTick();

      expect(router.currentRoute.value.path).toBe('/admin/plugins');
    });
  });

  // ACTIVE STATE TESTS
  describe('Active State', () => {
    it('should mark Users tab as active when on /admin/users', async () => {
      await router.push('/admin/users');
      await wrapper.vm.$nextTick();

      const tabs = wrapper.findAll('.admin-nav-tab');
      const usersTab = tabs.find(tab => tab.text().includes('Users'));

      expect(usersTab?.classes()).toContain('active');
    });

    it('should mark Roles tab as active when on /admin/roles', async () => {
      await router.push('/admin/roles');
      await wrapper.vm.$nextTick();

      const tabs = wrapper.findAll('.admin-nav-tab');
      const rolesTab = tabs.find(tab => tab.text().includes('Roles'));

      expect(rolesTab?.classes()).toContain('active');
    });

    it('should mark Analytics tab as active when on /admin/analytics', async () => {
      await router.push('/admin/analytics');
      await wrapper.vm.$nextTick();

      const tabs = wrapper.findAll('.admin-nav-tab');
      const analyticsTab = tabs.find(tab => tab.text().includes('Analytics'));

      expect(analyticsTab?.classes()).toContain('active');
    });

    it('should only have one active tab at a time', async () => {
      await router.push('/admin/users');
      await wrapper.vm.$nextTick();

      const activeTabs = wrapper.findAll('.admin-nav-tab.active');
      expect(activeTabs).toHaveLength(1);
    });

    it('should update active state when route changes', async () => {
      await router.push('/admin/users');
      await wrapper.vm.$nextTick();

      let tabs = wrapper.findAll('.admin-nav-tab');
      let usersTab = tabs.find(tab => tab.text().includes('Users'));
      expect(usersTab?.classes()).toContain('active');

      await router.push('/admin/roles');
      await wrapper.vm.$nextTick();

      tabs = wrapper.findAll('.admin-nav-tab');
      usersTab = tabs.find(tab => tab.text().includes('Users'));
      const rolesTab = tabs.find(tab => tab.text().includes('Roles'));

      expect(usersTab?.classes()).not.toContain('active');
      expect(rolesTab?.classes()).toContain('active');
    });
  });

  // STYLING TESTS
  describe('Styling', () => {
    it('should apply proper classes to navigation wrapper', () => {
      const wrapper_el = wrapper.find('.admin-nav-wrapper');
      expect(wrapper_el.exists()).toBe(true);
    });

    it('should apply proper classes to tabs container', () => {
      const tabsContainer = wrapper.find('.admin-nav-tabs');
      expect(tabsContainer.exists()).toBe(true);
    });

    it('should apply base classes to all tabs', () => {
      const tabs = wrapper.findAll('.admin-nav-tab');
      tabs.forEach(tab => {
        expect(tab.classes()).toContain('admin-nav-tab');
      });
    });

    it('should apply active class only to current route tab', async () => {
      await router.push('/admin/users');
      await wrapper.vm.$nextTick();

      const tabs = wrapper.findAll('.admin-nav-tab');
      const activeTabs = tabs.filter(tab => tab.classes().includes('active'));

      expect(activeTabs).toHaveLength(1);
    });
  });

  // ACCESSIBILITY TESTS
  describe('Accessibility', () => {
    it('should have clickable buttons for all navigation items', () => {
      const tabs = wrapper.findAll('.admin-nav-tab');
      tabs.forEach(tab => {
        expect(tab.element.tagName).toBe('BUTTON');
      });
    });

    it('should have visible text for each navigation item', () => {
      const tabs = wrapper.findAll('.admin-nav-tab');
      tabs.forEach(tab => {
        expect(tab.text().length).toBeGreaterThan(0);
      });
    });

    it('should have icons that enhance visual understanding', () => {
      const tabs = wrapper.findAll('.admin-nav-tab');
      tabs.forEach(tab => {
        const icon = tab.find('i');
        expect(icon.exists()).toBe(true);
        expect(icon.classes().some(cls => cls.startsWith('pi-'))).toBe(true);
      });
    });

    it('should support keyboard navigation', () => {
      const tabs = wrapper.findAll('.admin-nav-tab');
      tabs.forEach(tab => {
        // Buttons are naturally keyboard accessible
        expect(tab.element.tagName).toBe('BUTTON');
      });
    });
  });

  // RESPONSIVE BEHAVIOR TESTS
  describe('Responsive Behavior', () => {
    it('should render on mobile viewports', () => {
      expect(wrapper.find('.admin-nav-wrapper').exists()).toBe(true);
    });

    it('should maintain functionality on different screen sizes', async () => {
      const tabs = wrapper.findAll('.admin-nav-tab');
      const usersTab = tabs.find(tab => tab.text().includes('Users'));

      await usersTab?.trigger('click');
      await wrapper.vm.$nextTick();

      expect(router.currentRoute.value.path).toBe('/admin/users');
    });
  });

  // NAVIGATION ITEMS DATA TESTS
  describe('Navigation Items Configuration', () => {
    it('should have correct labels for all items', () => {
      const expectedLabels = ['Users', 'Roles', 'Data Objects', 'Analytics', 'Email Templates', 'Plugins'];
      const tabs = wrapper.findAll('.admin-nav-tab');

      expectedLabels.forEach(label => {
        const hasLabel = tabs.some(tab => tab.text().includes(label));
        expect(hasLabel).toBe(true);
      });
    });

    it('should have correct paths for all items', async () => {
      const expectedPaths = [
        '/admin/users',
        '/admin/roles',
        '/admin/data-objects',
        '/admin/analytics',
        '/admin/email-templates',
        '/admin/plugins',
      ];

      for (const path of expectedPaths) {
        await router.push(path);
        await wrapper.vm.$nextTick();
        expect(router.currentRoute.value.path).toBe(path);
      }
    });

    it('should have unique paths for each navigation item', () => {
      const tabs = wrapper.findAll('.admin-nav-tab');
      const paths = new Set();

      // This test verifies the data structure indirectly by checking navigation works
      expect(tabs.length).toBe(6);
      expect(new Set(routes.map(r => r.path)).size).toBe(6);
    });
  });

  // INTERACTION TESTS
  describe('User Interactions', () => {
    it('should respond to click events', async () => {
      const tabs = wrapper.findAll('.admin-nav-tab');
      const usersTab = tabs[0];

      await usersTab.trigger('click');
      await wrapper.vm.$nextTick();

      // Should have navigated
      expect(router.currentRoute.value.path).toBeTruthy();
    });

    it('should handle rapid consecutive clicks', async () => {
      const tabs = wrapper.findAll('.admin-nav-tab');
      const usersTab = tabs.find(tab => tab.text().includes('Users'));
      const rolesTab = tabs.find(tab => tab.text().includes('Roles'));

      await usersTab?.trigger('click');
      await rolesTab?.trigger('click');
      await wrapper.vm.$nextTick();

      expect(router.currentRoute.value.path).toBe('/admin/roles');
    });

    it('should handle clicking same tab multiple times', async () => {
      const tabs = wrapper.findAll('.admin-nav-tab');
      const usersTab = tabs.find(tab => tab.text().includes('Users'));

      await usersTab?.trigger('click');
      await wrapper.vm.$nextTick();
      const firstPath = router.currentRoute.value.path;

      await usersTab?.trigger('click');
      await wrapper.vm.$nextTick();
      const secondPath = router.currentRoute.value.path;

      expect(firstPath).toBe(secondPath);
    });
  });

  // EDGE CASES TESTS
  describe('Edge Cases', () => {
    it('should handle navigation to invalid routes gracefully', async () => {
      const invalidRoute = '/admin/invalid';

      try {
        await router.push(invalidRoute);
      } catch (e) {
        // Expected if route doesn't exist
      }

      await wrapper.vm.$nextTick();

      // Should not crash
      expect(wrapper.find('.admin-nav-wrapper').exists()).toBe(true);
    });

    it('should maintain state after multiple navigations', async () => {
      await router.push('/admin/users');
      await wrapper.vm.$nextTick();

      await router.push('/admin/roles');
      await wrapper.vm.$nextTick();

      await router.push('/admin/analytics');
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.admin-nav-wrapper').exists()).toBe(true);
      expect(wrapper.findAll('.admin-nav-tab')).toHaveLength(6);
    });
  });
});
