/**
 * View Components Basic Tests
 * Simple mounting tests for view components to ensure basic functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';

// Import view components
import ProfileView from '../ProfileView.vue';
import SettingsView from '../SettingsView.vue';
import ContactView from '../ContactView.vue';
import SearchView from '../SearchView.vue';
import PortfolioView from '../PortfolioView.vue';
import DocumentsView from '../DocumentsView.vue';

// Mock API
vi.mock('@composables/useApi', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockRouter = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/profile', component: ProfileView },
    { path: '/settings', component: SettingsView },
    { path: '/contact', component: ContactView },
    { path: '/search', component: SearchView },
    { path: '/portfolio', component: PortfolioView },
    { path: '/documents', component: DocumentsView },
  ],
});

describe('View Components', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('ProfileView', () => {
    it('should mount without errors', () => {
      const wrapper = mount(ProfileView, {
        global: {
          plugins: [createPinia(), mockRouter],
        },
      });

      expect(wrapper.exists()).toBe(true);
      wrapper.unmount();
    });

    it('should have proper component structure', () => {
      const wrapper = mount(ProfileView, {
        global: {
          plugins: [createPinia(), mockRouter],
        },
      });

      expect(wrapper.vm).toBeDefined();
      expect(wrapper.html()).toBeTruthy();
      wrapper.unmount();
    });
  });

  describe('SettingsView', () => {
    it('should mount without errors', () => {
      const wrapper = mount(SettingsView, {
        global: {
          plugins: [createPinia(), mockRouter],
        },
      });

      expect(wrapper.exists()).toBe(true);
      wrapper.unmount();
    });

    it('should have proper component structure', () => {
      const wrapper = mount(SettingsView, {
        global: {
          plugins: [createPinia(), mockRouter],
        },
      });

      expect(wrapper.vm).toBeDefined();
      expect(wrapper.html()).toBeTruthy();
      wrapper.unmount();
    });
  });

  describe('ContactView', () => {
    it('should mount without errors', () => {
      const wrapper = mount(ContactView, {
        global: {
          plugins: [createPinia(), mockRouter],
        },
      });

      expect(wrapper.exists()).toBe(true);
      wrapper.unmount();
    });

    it('should have proper component structure', () => {
      const wrapper = mount(ContactView, {
        global: {
          plugins: [createPinia(), mockRouter],
        },
      });

      expect(wrapper.vm).toBeDefined();
      expect(wrapper.html()).toBeTruthy();
      wrapper.unmount();
    });
  });

  describe('SearchView', () => {
    it('should mount without errors', () => {
      const wrapper = mount(SearchView, {
        global: {
          plugins: [createPinia(), mockRouter],
        },
      });

      expect(wrapper.exists()).toBe(true);
      wrapper.unmount();
    });

    it('should have proper component structure', () => {
      const wrapper = mount(SearchView, {
        global: {
          plugins: [createPinia(), mockRouter],
        },
      });

      expect(wrapper.vm).toBeDefined();
      expect(wrapper.html()).toBeTruthy();
      wrapper.unmount();
    });
  });

  describe('PortfolioView', () => {
    it('should mount without errors', () => {
      const wrapper = mount(PortfolioView, {
        global: {
          plugins: [createPinia(), mockRouter],
        },
      });

      expect(wrapper.exists()).toBe(true);
      wrapper.unmount();
    });

    it('should have proper component structure', () => {
      const wrapper = mount(PortfolioView, {
        global: {
          plugins: [createPinia(), mockRouter],
        },
      });

      expect(wrapper.vm).toBeDefined();
      expect(wrapper.html()).toBeTruthy();
      wrapper.unmount();
    });
  });

  describe('DocumentsView', () => {
    it('should mount without errors', () => {
      const wrapper = mount(DocumentsView, {
        global: {
          plugins: [createPinia(), mockRouter],
        },
      });

      expect(wrapper.exists()).toBe(true);
      wrapper.unmount();
    });

    it('should have proper component structure', () => {
      const wrapper = mount(DocumentsView, {
        global: {
          plugins: [createPinia(), mockRouter],
        },
      });

      expect(wrapper.vm).toBeDefined();
      expect(wrapper.html()).toBeTruthy();
      wrapper.unmount();
    });
  });
});
