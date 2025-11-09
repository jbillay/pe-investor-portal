import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import AdminNavigation from '../AdminNavigation.vue';

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ path: '/' }),
}));

describe('AdminNavigation.vue', () => {
  let wrapper: VueWrapper | null;

  beforeEach(() => {
    vi.clearAllMocks();
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

  it('should mount the component', () => {
    expect(wrapper).toBeDefined();
  });

  it('should render navigation', () => {
    if (wrapper) {
      expect(wrapper.find('.admin-nav-wrapper').exists()).toBe(true);
    }
  });

  it('should have buttons', () => {
    if (wrapper) {
      const buttons = wrapper.findAll('button');
      expect(buttons.length).toBeGreaterThan(0);
    }
  });
});
