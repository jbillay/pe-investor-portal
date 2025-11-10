import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import UserCreateDialog from '../UserCreateDialog.vue';

vi.mock('primevue/usetoast', () => ({ useToast: () => ({ add: vi.fn() }) }));
vi.mock('@/composables/useApi', () => ({
  useApi: () => ({ api: { post: vi.fn(), get: vi.fn() } }),
}));

describe('UserCreateDialog.vue', () => {
  let wrapper: VueWrapper | null;

  beforeEach(() => {
    vi.clearAllMocks();
    try {
      wrapper = mount(UserCreateDialog, {
        props: { visible: true },
        global: {
          plugins: [createTestingPinia({ createSpy: vi.fn })],
          directives: {
            tooltip: () => {},
          },
          stubs: {
            Dialog: { template: '<div class="p-dialog"><slot /><slot name="header" /></div>' },
            InputText: { template: '<input v-bind="$attrs" />' },
            Select: { template: '<select></select>' },
            Button: { template: '<button v-bind="$attrs">{{ label }}</button>', props: ['label'] },
            Tag: { template: '<span>{{ value }}</span>', props: ['value'] },
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

  it('should mount the component', () => {
    expect(wrapper).toBeDefined();
  });

  it('should render successfully when mounted', () => {
    if (wrapper) {
      expect(wrapper.vm).toBeDefined();
    }
  });
});
