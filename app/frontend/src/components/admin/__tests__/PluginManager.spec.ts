import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, VueWrapper, flushPromises } from '@vue/test-utils';
import PluginManager from '../PluginManager.vue';
import type { Plugin, PluginStatistics } from '@/types/plugin';

// Create persistent mock instances
const mockToast = { add: vi.fn() };
const mockConfirm = { require: vi.fn() };
const mockPluginRegistryStore = { refreshPluginRegistry: vi.fn() };

// Mock API and services
vi.mock('@/services/pluginApiService', () => ({
  pluginApiService: {
    getAllPlugins: vi.fn(),
    getPluginStatistics: vi.fn(),
    installPlugin: vi.fn(),
    uninstallPlugin: vi.fn(),
    deletePlugin: vi.fn(),
    getPluginFileUrl: vi.fn(),
  },
}));

vi.mock('primevue/usetoast', () => ({
  useToast: () => mockToast,
}));

vi.mock('primevue/useconfirm', () => ({
  useConfirm: () => mockConfirm,
}));

vi.mock('@/stores/pluginRegistry', () => ({
  usePluginRegistryStore: () => mockPluginRegistryStore,
}));

// Mock PrimeVue components
vi.mock('primevue/button', () => ({
  default: {
    name: 'Button',
    template: '<button @click="$emit(\'click\')" :disabled="disabled || loading"><slot /></button>',
    props: ['label', 'icon', 'class', 'loading', 'disabled']
  }
}));

vi.mock('primevue/inputtext', () => ({
  default: {
    name: 'InputText',
    template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'placeholder', 'class']
  }
}));

vi.mock('primevue/select', () => ({
  default: {
    name: 'Select',
    template: '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"></select>',
    props: ['modelValue', 'options', 'optionLabel', 'optionValue', 'placeholder', 'class', 'showClear']
  }
}));

vi.mock('primevue/datatable', () => ({
  default: {
    name: 'DataTable',
    template: '<div class="datatable"><slot name="header"></slot><slot></slot></div>',
    props: ['value', 'paginator', 'rows', 'loading', 'responsiveLayout', 'dataKey', 'class', 'sortField', 'sortOrder']
  }
}));

vi.mock('primevue/column', () => ({
  default: {
    name: 'Column',
    template: '<div class="column"></div>',
    props: ['field', 'sortable', 'class']
  }
}));

vi.mock('primevue/tag', () => ({
  default: {
    name: 'Tag',
    template: '<span class="tag">{{value}}</span>',
    props: ['value', 'severity', 'class']
  }
}));

vi.mock('primevue/card', () => ({
  default: {
    name: 'Card',
    template: '<div class="card"><slot name="content"></slot></div>',
    props: ['class']
  }
}));

vi.mock('primevue/dialog', () => ({
  default: {
    name: 'Dialog',
    template: '<div v-if="visible" class="dialog"><slot name="header"></slot><slot></slot><slot name="footer"></slot></div>',
    props: ['visible', 'modal', 'closable', 'draggable', 'class']
  }
}));

vi.mock('primevue/progressspinner', () => ({
  default: {
    name: 'ProgressSpinner',
    template: '<div class="spinner"></div>',
    props: ['class']
  }
}));

// Mock PluginInstallDialog component
vi.mock('../PluginInstallDialog.vue', () => ({
  default: {
    name: 'PluginInstallDialog',
    template: '<div class="plugin-install-dialog"></div>',
    props: ['visible']
  }
}));

describe('PluginManager', () => {
  let wrapper: VueWrapper<any>;

  const mockPlugin: Plugin = {
    id: 'plugin-1',
    pluginId: 'test-plugin',
    name: 'Test Plugin',
    description: 'A test plugin',
    version: '1.0.0',
    author: 'Test Author',
    authorEmail: 'test@example.com',
    license: 'MIT',
    icon: 'icon.png',
    status: 'UPLOADED',
    isInstalled: false,
    canInstall: true,
    canUninstall: false,
    installedAt: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    manifest: {
      coreVersion: '1.0.0',
      menus: [
        {
          id: 'menu-1',
          label: 'Test Menu',
          route: '/test',
          icon: 'pi pi-test',
          type: 'main',
          order: 1,
        }
      ],
      widgets: [
        {
          id: 'widget-1',
          name: 'Test Widget',
          component: 'TestWidget',
          slot: 'dashboard',
          props: {},
        }
      ],
    },
  };

  const mockStatistics: PluginStatistics = {
    totalPlugins: 5,
    installedPlugins: 2,
    uploadedPlugins: 2,
    failedPlugins: 1,
    totalMenus: 3,
    totalWidgets: 2,
  };

  const createWrapper = () => {
    return mount(PluginManager, {
      global: {
        stubs: {
          teleport: true,
        },
      },
    });
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const { pluginApiService } = await import('@/services/pluginApiService');
    vi.mocked(pluginApiService.getAllPlugins).mockResolvedValue({ plugins: [mockPlugin] });
    vi.mocked(pluginApiService.getPluginStatistics).mockResolvedValue(mockStatistics);
    vi.mocked(pluginApiService.installPlugin).mockResolvedValue({ message: 'Plugin installed' });
    vi.mocked(pluginApiService.uninstallPlugin).mockResolvedValue({ message: 'Plugin uninstalled' });
    vi.mocked(pluginApiService.deletePlugin).mockResolvedValue(undefined);
    vi.mocked(pluginApiService.getPluginFileUrl).mockReturnValue('/plugins/test-plugin/icon.png');
  });

  afterEach(() => {
    if (wrapper) wrapper.unmount();
  });

  describe('Component Rendering', () => {
    it('should render the component', async () => {
      wrapper = createWrapper();
      await flushPromises();
      expect(wrapper.exists()).toBe(true);
    });

    it('should display the component title', async () => {
      wrapper = createWrapper();
      await flushPromises();
      expect(wrapper.html()).toContain('Plugin Management');
    });

    it('should display statistics', async () => {
      wrapper = createWrapper();
      await flushPromises();
      expect(wrapper.html()).toContain('Total Plugins');
      expect(wrapper.html()).toContain('Installed');
    });
  });

  describe('Data Fetching', () => {
    it('should fetch plugins on mount', async () => {
      const { pluginApiService } = await import('@/services/pluginApiService');
      wrapper = createWrapper();
      await flushPromises();
      expect(pluginApiService.getAllPlugins).toHaveBeenCalled();
      expect(pluginApiService.getPluginStatistics).toHaveBeenCalled();
    });

    it('should handle fetch error gracefully', async () => {
      const { pluginApiService } = await import('@/services/pluginApiService');

      vi.mocked(pluginApiService.getAllPlugins).mockRejectedValueOnce(new Error('Fetch failed'));
      wrapper = createWrapper();
      await flushPromises();

      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          summary: 'Fetch Failed',
        })
      );
    });
  });

  describe('Filtering', () => {
    it('should filter plugins by search term', async () => {
      wrapper = createWrapper();
      await flushPromises();

      wrapper.vm.filters.search = 'Test Plugin';
      await wrapper.vm.$nextTick();

      const filtered = wrapper.vm.filteredPlugins;
      expect(filtered.length).toBeGreaterThan(0);
    });

    it('should filter plugins by status', async () => {
      wrapper = createWrapper();
      await flushPromises();

      wrapper.vm.filters.status = 'UPLOADED';
      await wrapper.vm.$nextTick();

      const filtered = wrapper.vm.filteredPlugins;
      expect(filtered.every((p: Plugin) => p.status === 'UPLOADED')).toBe(true);
    });

    it('should clear filters', async () => {
      wrapper = createWrapper();
      await flushPromises();

      wrapper.vm.filters.search = 'test';
      wrapper.vm.filters.status = 'UPLOADED';
      wrapper.vm.clearFilters();

      expect(wrapper.vm.filters.search).toBe('');
      expect(wrapper.vm.filters.status).toBeNull();
    });
  });

  describe('Plugin Actions', () => {
    it('should install a plugin', async () => {
      const { pluginApiService } = await import('@/services/pluginApiService');

      wrapper = createWrapper();
      await flushPromises();

      await wrapper.vm.installPlugin(mockPlugin);
      await flushPromises();

      expect(pluginApiService.installPlugin).toHaveBeenCalledWith('plugin-1');
      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
          summary: 'Plugin Installed',
        })
      );
    });

    it('should handle install error', async () => {
      const { pluginApiService } = await import('@/services/pluginApiService');

      vi.mocked(pluginApiService.installPlugin).mockRejectedValueOnce(new Error('Install failed'));
      wrapper = createWrapper();
      await flushPromises();

      await wrapper.vm.installPlugin(mockPlugin);
      await flushPromises();

      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          summary: 'Installation Failed',
        })
      );
    });

    it('should uninstall a plugin', async () => {
      const { pluginApiService } = await import('@/services/pluginApiService');

      wrapper = createWrapper();
      await flushPromises();

      await wrapper.vm.uninstallPlugin(mockPlugin);
      await flushPromises();

      expect(pluginApiService.uninstallPlugin).toHaveBeenCalledWith('plugin-1');
      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
          summary: 'Plugin Uninstalled',
        })
      );
    });

    it('should show confirmation dialog before delete', async () => {
      wrapper = createWrapper();
      await flushPromises();

      wrapper.vm.confirmDeletePlugin(mockPlugin);

      expect(mockConfirm.require).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Test Plugin'),
          header: 'Delete Plugin',
        })
      );
    });

    it('should delete a plugin', async () => {
      const { pluginApiService } = await import('@/services/pluginApiService');

      wrapper = createWrapper();
      await flushPromises();

      await wrapper.vm.deletePlugin(mockPlugin);
      await flushPromises();

      expect(pluginApiService.deletePlugin).toHaveBeenCalledWith('plugin-1');
    });
  });

  describe('Utility Methods', () => {
    it('should get status severity', async () => {
      wrapper = createWrapper();
      await flushPromises();

      expect(wrapper.vm.getStatusSeverity('INSTALLED')).toBe('success');
      expect(wrapper.vm.getStatusSeverity('UPLOADED')).toBe('info');
      expect(wrapper.vm.getStatusSeverity('FAILED')).toBe('danger');
    });

    it('should format date', async () => {
      wrapper = createWrapper();
      await flushPromises();

      const date = new Date('2024-01-15');
      const formatted = wrapper.vm.formatDate(date);
      expect(formatted).toContain('2024');
    });

    it('should format time', async () => {
      wrapper = createWrapper();
      await flushPromises();

      const date = new Date('2024-01-15 14:30:00');
      const formatted = wrapper.vm.formatTime(date);
      expect(typeof formatted).toBe('string');
    });

    it('should get plugin file URL', async () => {
      const { pluginApiService } = await import('@/services/pluginApiService');

      wrapper = createWrapper();
      await flushPromises();

      const url = wrapper.vm.getPluginFileUrl('test-plugin', 'icon.png');
      expect(pluginApiService.getPluginFileUrl).toHaveBeenCalledWith('test-plugin', 'icon.png');
    });
  });

  describe('Plugin Details Dialog', () => {
    it('should view plugin details', async () => {
      wrapper = createWrapper();
      await flushPromises();

      wrapper.vm.viewPluginDetails(mockPlugin);
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.pluginDetailsDialogVisible).toBe(true);
      expect(wrapper.vm.selectedPlugin).toEqual(mockPlugin);
    });
  });

  describe('Refresh', () => {
    it('should refresh plugins', async () => {
      const { pluginApiService } = await import('@/services/pluginApiService');

      wrapper = createWrapper();
      await flushPromises();

      vi.clearAllMocks();

      await wrapper.vm.refreshPlugins();
      await flushPromises();

      expect(pluginApiService.getAllPlugins).toHaveBeenCalled();
    });
  });
});
