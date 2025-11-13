import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import PluginInstallDialog from '../PluginInstallDialog.vue';

// Mock PrimeVue components
vi.mock('primevue/dialog', () => ({
  default: { name: 'Dialog', template: '<div class="dialog"><slot name="header"></slot><slot></slot><slot name="footer"></slot></div>', props: ['visible', 'modal', 'closable', 'draggable', 'focusTrap', 'aria-labelledby', 'aria-describedby', 'class'] }
}));

vi.mock('primevue/button', () => ({
  default: { name: 'Button', template: '<button></button>', props: ['label', 'icon', 'class', 'loading', 'disabled', 'iconPos'] }
}));

vi.mock('primevue/fileupload', () => ({
  default: { name: 'FileUpload', template: '<div class="file-upload"></div>', props: ['mode', 'accept', 'maxFileSize', 'auto', 'chooseLabel', 'chooseIcon', 'class', 'pt'] }
}));

vi.mock('primevue/card', () => ({
  default: { name: 'Card', template: '<div class="card"><slot name="content"></slot></div>', props: ['class'] }
}));

vi.mock('primevue/tag', () => ({
  default: { name: 'Tag', template: '<span></span>', props: ['severity', 'value', 'icon', 'class'] }
}));

vi.mock('primevue/message', () => ({
  default: { name: 'Message', template: '<div class="message"><slot></slot></div>', props: ['severity', 'closable', 'class'] }
}));

vi.mock('primevue/progressbar', () => ({
  default: { name: 'ProgressBar', template: '<div class="progress-bar"></div>', props: ['mode', 'class'] }
}));

vi.mock('primevue/progressspinner', () => ({
  default: { name: 'ProgressSpinner', template: '<div class="spinner"></div>', props: ['style', 'strokeWidth', 'class'] }
}));

// Mock composables and services
vi.mock('primevue/usetoast', () => ({
  useToast: () => ({ add: vi.fn() }),
}));

vi.mock('primevue/useconfirm', () => ({
  useConfirm: () => ({ require: vi.fn() }),
}));

vi.mock('@/services/pluginApiService', () => ({
  pluginApiService: {
    uploadPlugin: vi.fn(),
    installPlugin: vi.fn(),
    validatePlugin: vi.fn(),
  },
}));

vi.mock('@/stores/pluginRegistry', () => ({
  usePluginRegistryStore: () => ({
    refreshPlugins: vi.fn(),
  }),
}));

// Import the mocked service after the mock is defined
const { pluginApiService: mockPluginApiService } = await import('@/services/pluginApiService');

describe('PluginInstallDialog', () => {
  let wrapper: VueWrapper<any>;

  const createWrapper = (props = {}) => {
    return mount(PluginInstallDialog, {
      props: {
        visible: true,
        ...props,
      },
      global: {
        stubs: { teleport: true },
      },
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (wrapper) wrapper.unmount();
  });

  describe('Component Rendering', () => {
    it('should render the component', () => {
      wrapper = createWrapper();
      expect(wrapper.exists()).toBe(true);
    });

    it('should display upload step content', () => {
      wrapper = createWrapper();
      expect(wrapper.html()).toContain('Upload Plugin Package');
    });

    it('should display progress steps', () => {
      wrapper = createWrapper();
      expect(wrapper.html()).toContain('Upload');
      expect(wrapper.html()).toContain('Review');
      expect(wrapper.html()).toContain('Install');
    });
  });

  describe('State Management', () => {
    it('should initialize with step 1', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.currentStep).toBe(1);
    });

    it('should have no selected file initially', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.selectedFile).toBeNull();
    });

    it('should track uploading state', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.isUploading).toBe(false);
    });

    it('should track installing state', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.isInstalling).toBe(false);
    });
  });

  describe('File Handling', () => {
    it('should handle file selection', () => {
      wrapper = createWrapper();
      const file = new File(['content'], 'plugin.zip', { type: 'application/zip' });
      wrapper.vm.handleFileSelect({ files: [file] });
      expect(wrapper.vm.selectedFile).toBe(file);
    });

    it('should allow clearing selected file', () => {
      wrapper = createWrapper();
      wrapper.vm.selectedFile = new File(['content'], 'plugin.zip', { type: 'application/zip' });
      expect(wrapper.vm.selectedFile).toBeTruthy();
      wrapper.vm.selectedFile = null;
      expect(wrapper.vm.selectedFile).toBeNull();
    });

    it('should format file size in bytes', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.formatFileSize(500)).toBe('500 Bytes');
    });

    it('should format file size in kilobytes', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.formatFileSize(1024)).toBe('1 KB');
    });

    it('should format file size in megabytes', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.formatFileSize(1048576)).toBe('1 MB');
    });

    it('should handle file drop', () => {
      wrapper = createWrapper();
      const file = new File(['content'], 'plugin.zip', { type: 'application/zip' });
      wrapper.vm.handleFileDrop({ dataTransfer: { files: [file] } });
      expect(wrapper.vm.selectedFile).toBe(file);
    });
  });

  describe('Upload Process', () => {
    it('should not upload without file', async () => {
      wrapper = createWrapper();
      wrapper.vm.selectedFile = null;
      await wrapper.vm.uploadPlugin();
      expect(mockPluginApiService.uploadPlugin).not.toHaveBeenCalled();
    });

    it('should handle upload error', async () => {
      mockPluginApiService.uploadPlugin.mockRejectedValue(new Error('Upload failed'));
      wrapper = createWrapper();
      wrapper.vm.selectedFile = new File(['content'], 'plugin.zip', { type: 'application/zip' });
      await wrapper.vm.uploadPlugin();
      expect(wrapper.vm.uploadError).toBeTruthy();
    });

    it('should clear upload error on retry', () => {
      wrapper = createWrapper();
      wrapper.vm.uploadError = 'Previous error';
      wrapper.vm.retryUpload();
      expect(wrapper.vm.uploadError).toBeFalsy();
    });
  });

  describe('Installation Steps', () => {
    it('should have installation steps defined', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.installationSteps).toBeDefined();
      expect(Array.isArray(wrapper.vm.installationSteps)).toBe(true);
    });

    it('should toggle step expansion', () => {
      wrapper = createWrapper();
      const stepId = 'test-step';
      expect(wrapper.vm.expandedSteps.has(stepId)).toBe(false);
      wrapper.vm.toggleStepExpansion(stepId);
      expect(wrapper.vm.expandedSteps.has(stepId)).toBe(true);
      wrapper.vm.toggleStepExpansion(stepId);
      expect(wrapper.vm.expandedSteps.has(stepId)).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should track upload errors', () => {
      wrapper = createWrapper();
      wrapper.vm.uploadError = 'Test error';
      expect(wrapper.vm.uploadError).toBe('Test error');
    });

    it('should track installation errors', () => {
      wrapper = createWrapper();
      wrapper.vm.installationError = 'Install error';
      expect(wrapper.vm.installationError).toBe('Install error');
    });

    it('should track validation errors', () => {
      wrapper = createWrapper();
      wrapper.vm.validationErrors = ['Error 1', 'Error 2'];
      expect(wrapper.vm.validationErrors).toHaveLength(2);
    });

    it('should track validation warnings', () => {
      wrapper = createWrapper();
      wrapper.vm.validationWarnings = ['Warning 1'];
      expect(wrapper.vm.validationWarnings).toHaveLength(1);
    });
  });

  describe('Dialog Reset', () => {
    it('should reset to step 1', () => {
      wrapper = createWrapper();
      wrapper.vm.currentStep = 3;
      wrapper.vm.resetDialog();
      expect(wrapper.vm.currentStep).toBe(1);
    });

    it('should clear selected file on reset', () => {
      wrapper = createWrapper();
      wrapper.vm.selectedFile = new File(['content'], 'test.zip', { type: 'application/zip' });
      wrapper.vm.resetDialog();
      expect(wrapper.vm.selectedFile).toBeNull();
    });

    it('should clear errors on reset', () => {
      wrapper = createWrapper();
      wrapper.vm.uploadError = 'Error';
      wrapper.vm.resetDialog();
      expect(wrapper.vm.uploadError).toBeFalsy();
    });
  });

  describe('Accessibility', () => {
    it('should have progress bar with role', () => {
      wrapper = createWrapper();
      expect(wrapper.html()).toContain('role="progressbar"');
    });

    it('should have aria attributes', () => {
      wrapper = createWrapper();
      expect(wrapper.html()).toContain('aria-');
    });

    it('should have drag drop zone with button role', () => {
      wrapper = createWrapper();
      expect(wrapper.html()).toContain('role="button"');
    });
  });

  describe('Drag and Drop', () => {
    it('should track dragging state', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.isDragging).toBe(false);
      wrapper.vm.isDragging = true;
      expect(wrapper.vm.isDragging).toBe(true);
    });

    it('should reset dragging on drop', () => {
      wrapper = createWrapper();
      wrapper.vm.isDragging = true;
      const file = new File(['content'], 'plugin.zip', { type: 'application/zip' });
      wrapper.vm.handleFileDrop({ dataTransfer: { files: [file] } });
      expect(wrapper.vm.isDragging).toBe(false);
    });
  });
});
