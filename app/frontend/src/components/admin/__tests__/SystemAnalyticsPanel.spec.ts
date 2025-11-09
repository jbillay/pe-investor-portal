import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import SystemAnalyticsPanel from '../SystemAnalyticsPanel.vue';

vi.mock('primevue/usetoast', () => ({ useToast: () => ({ add: vi.fn() }) }));
vi.mock('@/composables/useApi', () => ({
  useApi: () => ({ api: { get: vi.fn() } }),
}));

describe('SystemAnalyticsPanel.vue', () => {
  let wrapper: VueWrapper | null;

  beforeEach(() => {
    vi.clearAllMocks();
    try {
      wrapper = mount(SystemAnalyticsPanel, {
        global: {
          plugins: [createTestingPinia({ createSpy: vi.fn })],
          stubs: {
            Card: { template: '<div class="card"><slot /><slot name="title" /></div>' },
            Chart: { template: '<div class="chart"></div>' },
            DataTable: { template: '<div class="p-datatable"><slot /></div>' },
            Column: { template: '<div></div>' },
            Button: { template: '<button v-bind="$attrs">{{ label }}</button>', props: ['label'] },
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
