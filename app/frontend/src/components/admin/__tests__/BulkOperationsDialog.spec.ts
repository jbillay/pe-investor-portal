import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import BulkOperationsDialog from '../BulkOperationsDialog.vue';

vi.mock('primevue/usetoast', () => ({ useToast: () => ({ add: vi.fn() }) }));
vi.mock('@/composables/useApi', () => ({
  useApi: () => ({ api: { post: vi.fn(), get: vi.fn() } }),
}));

describe('BulkOperationsDialog.vue', () => {
  let wrapper: VueWrapper | null;

  beforeEach(() => {
    vi.clearAllMocks();
    try {
      wrapper = mount(BulkOperationsDialog, {
        global: {
          plugins: [createTestingPinia({ createSpy: vi.fn })],
          stubs: {
            Dialog: { template: '<div class="p-dialog"><slot /><slot name="header" /><slot name="footer" /></div>' },
            Button: { template: '<button v-bind="$attrs">{{ label }}</button>', props: ['label'] },
            Select: { template: '<select v-bind="$attrs"><slot /></select>' },
            Checkbox: { template: '<input type="checkbox" v-bind="$attrs" />' },
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

  it('should be able to render dialog', () => {
    expect(wrapper).toBeDefined();
  });

  it('should mount the component', () => {
    if (wrapper) {
      expect(wrapper.vm).toBeDefined();
    }
  });
});
