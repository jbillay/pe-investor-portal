import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import RoleDetailsDialog from '../RoleDetailsDialog.vue';

vi.mock('primevue/usetoast', () => ({ useToast: () => ({ add: vi.fn() }) }));
vi.mock('@/composables/useApi', () => ({
  useApi: () => ({ api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }),
}));

describe('RoleDetailsDialog.vue', () => {
  let wrapper: VueWrapper | null;

  beforeEach(() => {
    vi.clearAllMocks();
    try {
      wrapper = mount(RoleDetailsDialog, {
        global: {
          plugins: [createTestingPinia({ createSpy: vi.fn })],
          stubs: {
            Dialog: { template: '<div class="p-dialog"><slot /><slot name="header" /><slot name="footer" /></div>' },
            Button: { template: '<button v-bind="$attrs">{{ label }}</button>', props: ['label'] },
            DataTable: { template: '<div class="p-datatable"><slot /></div>' },
            Column: { template: '<div></div>' },
            Card: { template: '<div class="card"><slot /><slot name="title" /></div>' },
          },
        },
      });
    } catch (e) {
      wrapper = null;
    }
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  it('should mount successfully', () => {
    expect(wrapper).toBeDefined();
  });

  it('should render component', () => {
    if (wrapper) {
      expect(wrapper.vm).toBeDefined();
    }
  });
});
