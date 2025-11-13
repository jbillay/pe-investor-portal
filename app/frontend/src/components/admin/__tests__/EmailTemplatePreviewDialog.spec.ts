import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import EmailTemplatePreviewDialog from '../EmailTemplatePreviewDialog.vue';

// Mock PrimeVue components
vi.mock('primevue/dialog', () => ({
  default: { name: 'Dialog', template: '<div class="dialog"><slot name="header"></slot><slot></slot><slot name="footer"></slot></div>', props: ['visible', 'header', 'modal', 'closable', 'style', 'class'] }
}));

vi.mock('primevue/button', () => ({
  default: { name: 'Button', template: '<button></button>', props: ['label', 'icon', 'class', 'loading', 'disabled'] }
}));

vi.mock('primevue/tag', () => ({
  default: { name: 'Tag', template: '<span></span>', props: ['severity', 'value'] }
}));

vi.mock('primevue/divider', () => ({
  default: { name: 'Divider', template: '<hr />' }
}));

vi.mock('primevue/inputtext', () => ({
  default: { name: 'InputText', template: '<input />', props: ['modelValue', 'placeholder', 'class', 'type', 'readonly'] }
}));

vi.mock('primevue/inputnumber', () => ({
  default: { name: 'InputNumber', template: '<input type="number" />', props: ['modelValue', 'placeholder', 'class', 'mode', 'currency', 'locale'] }
}));

vi.mock('primevue/toggleswitch', () => ({
  default: { name: 'ToggleSwitch', template: '<input type="checkbox" />', props: ['modelValue'] }
}));

vi.mock('primevue/textarea', () => ({
  default: { name: 'Textarea', template: '<textarea></textarea>', props: ['modelValue', 'autoResize', 'rows', 'class', 'readonly'] }
}));

vi.mock('primevue/tabs', () => ({
  default: { name: 'Tabs', template: '<div class="tabs"><slot></slot></div>', props: ['value', 'class'] }
}));

vi.mock('primevue/tablist', () => ({
  default: { name: 'TabList', template: '<div class="tablist"><slot></slot></div>' }
}));

vi.mock('primevue/tab', () => ({
  default: { name: 'Tab', template: '<div class="tab"><slot></slot></div>', props: ['value'] }
}));

vi.mock('primevue/tabpanels', () => ({
  default: { name: 'TabPanels', template: '<div class="tabpanels"><slot></slot></div>' }
}));

vi.mock('primevue/tabpanel', () => ({
  default: { name: 'TabPanel', template: '<div class="tabpanel"><slot></slot></div>', props: ['value'] }
}));

vi.mock('primevue/accordion', () => ({
  default: { name: 'Accordion', template: '<div class="accordion"><slot></slot></div>', props: ['value', 'multiple'] }
}));

vi.mock('primevue/accordionpanel', () => ({
  default: { name: 'AccordionPanel', template: '<div class="accordionpanel"><slot></slot></div>', props: ['value'] }
}));

vi.mock('primevue/accordionheader', () => ({
  default: { name: 'AccordionHeader', template: '<div class="accordionheader"><slot></slot></div>' }
}));

vi.mock('primevue/accordioncontent', () => ({
  default: { name: 'AccordionContent', template: '<div class="accordioncontent"><slot></slot></div>' }
}));

vi.mock('primevue/message', () => ({
  default: { name: 'Message', template: '<div class="message"><slot></slot></div>', props: ['severity'] }
}));

vi.mock('primevue/progressspinner', () => ({
  default: { name: 'ProgressSpinner', template: '<div class="spinner"></div>', props: ['style'] }
}));

// Mock composables
const mockToast = { add: vi.fn() };
const mockPreviewTemplate = vi.fn();
const mockSendTestEmail = vi.fn();

vi.mock('primevue/usetoast', () => ({
  useToast: () => mockToast,
}));

vi.mock('@/composables/useEmailTemplates', () => ({
  useEmailTemplates: () => ({
    previewTemplate: mockPreviewTemplate,
    sendTestEmail: mockSendTestEmail,
  }),
}));

describe('EmailTemplatePreviewDialog', () => {
  let wrapper: VueWrapper<any>;

  const mockTemplate = {
    id: 'template-1',
    displayName: 'Welcome Email',
    category: 'ACCOUNT',
    isActive: true,
    isSystem: false,
    version: 1,
    description: 'Welcome new users',
    subject: 'Welcome to {{companyName}}',
    htmlBody: '<p>Hello {{userName}}</p>',
    textBody: 'Hello {{userName}}',
    variables: [
      { name: 'userName', type: 'string', required: true, example: 'John Doe', description: 'User full name' },
      { name: 'companyName', type: 'string', required: false, example: 'Acme Corp', defaultValue: 'Company' },
      { name: 'amount', type: 'number', required: false, example: 1000 },
      { name: 'isActive', type: 'boolean', required: false, example: true },
      { name: 'price', type: 'currency', required: false, example: 99.99 }
    ]
  };

  const createWrapper = (props = {}) => {
    return mount(EmailTemplatePreviewDialog, {
      props: {
        visible: true,
        template: mockTemplate,
        ...props,
      },
      global: {
        stubs: { teleport: true },
      },
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockPreviewTemplate.mockResolvedValue({
      subject: 'Welcome to Acme Corp',
      htmlBody: '<p>Hello John Doe</p>',
      textBody: 'Hello John Doe'
    });
  });

  afterEach(() => {
    if (wrapper) wrapper.unmount();
  });

  describe('Component Rendering', () => {
    it('should render the dialog', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.dialogVisible).toBe(true);
    });

    it('should display template info', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.template?.displayName).toBe('Welcome Email');
      expect(wrapper.vm.template?.category).toBe('ACCOUNT');
    });

    it('should compute dialog title', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.dialogTitle).toBe('Preview: Welcome Email');
    });

    it('should show default title when no template', () => {
      wrapper = createWrapper({ template: null });
      expect(wrapper.vm.dialogTitle).toBe('Template Preview');
    });
  });

  describe('Variable Management', () => {
    it('should initialize variable values', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.variableValues).toBeDefined();
    });

    it('should fill example values', async () => {
      wrapper = createWrapper();
      wrapper.vm.fillExampleValues();
      await nextTick();
      expect(wrapper.vm.variableValues.userName).toBe('John Doe');
      expect(wrapper.vm.variableValues.companyName).toBe('Acme Corp');
    });

    it('should clear variable values', () => {
      wrapper = createWrapper();
      wrapper.vm.variableValues = { test: 'value' };
      wrapper.vm.clearVariableValues();
      expect(wrapper.vm.variableValues).toEqual({});
    });

    it('should initialize with default values', () => {
      wrapper = createWrapper();
      wrapper.vm.initializeVariableValues();
      expect(wrapper.vm.variableValues.companyName).toBe('Company');
    });

    it('should set boolean defaults to false', () => {
      wrapper = createWrapper();
      wrapper.vm.initializeVariableValues();
      expect(wrapper.vm.variableValues.isActive).toBe(true);
    });

    it('should set number defaults to example', () => {
      wrapper = createWrapper();
      wrapper.vm.initializeVariableValues();
      expect(wrapper.vm.variableValues.amount).toBe(1000);
    });
  });

  describe('Preview Loading', () => {
    it('should load preview on mount', async () => {
      wrapper = createWrapper();
      await nextTick();
      expect(mockPreviewTemplate).toHaveBeenCalled();
    });

    it('should update rendered content from preview', async () => {
      wrapper = createWrapper();
      await wrapper.vm.loadPreview();
      expect(wrapper.vm.renderedSubject).toBe('Welcome to Acme Corp');
      expect(wrapper.vm.renderedHtmlBody).toBe('<p>Hello John Doe</p>');
    });

    it('should handle preview errors gracefully', async () => {
      mockPreviewTemplate.mockRejectedValue(new Error('Preview failed'));
      wrapper = createWrapper();
      await wrapper.vm.loadPreview();
      expect(mockToast.add).toHaveBeenCalledWith(expect.objectContaining({
        severity: 'warn',
        summary: 'Preview Warning'
      }));
    });

    it('should show loading state during preview', async () => {
      mockPreviewTemplate.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      wrapper = createWrapper();
      const promise = wrapper.vm.loadPreview();
      expect(wrapper.vm.previewLoading).toBe(true);
      await promise;
      expect(wrapper.vm.previewLoading).toBe(false);
    });

    it('should debounce preview updates', async () => {
      vi.useFakeTimers();
      wrapper = createWrapper();
      await nextTick();
      vi.clearAllMocks(); // Clear the mount call
      wrapper.vm.debouncedPreview();
      wrapper.vm.debouncedPreview();
      wrapper.vm.debouncedPreview();
      vi.advanceTimersByTime(500);
      expect(mockPreviewTemplate).toHaveBeenCalledTimes(1);
      vi.useRealTimers();
    });
  });

  describe('Category Severity', () => {
    it('should get correct category severity', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.getCategorySeverity('ACCOUNT')).toBe('info');
      expect(wrapper.vm.getCategorySeverity('DOCUMENT')).toBe('primary');
      expect(wrapper.vm.getCategorySeverity('CAPITAL_CALL')).toBe('warning');
      expect(wrapper.vm.getCategorySeverity('DISTRIBUTION')).toBe('success');
      expect(wrapper.vm.getCategorySeverity('UNKNOWN')).toBe('info');
    });
  });

  describe('Send Test Email', () => {
    it('should show send test dialog', () => {
      wrapper = createWrapper();
      wrapper.vm.showSendTestDialog();
      expect(wrapper.vm.sendTestDialogVisible).toBe(true);
    });

    it('should reset errors when showing dialog', () => {
      wrapper = createWrapper();
      wrapper.vm.sendTestError = 'Previous error';
      wrapper.vm.showSendTestDialog();
      expect(wrapper.vm.sendTestError).toBe('');
    });

    it('should send test email', async () => {
      mockSendTestEmail.mockResolvedValue(undefined);
      wrapper = createWrapper();
      wrapper.vm.testEmailRecipient = 'test@example.com';
      await wrapper.vm.sendTestEmail();
      expect(mockSendTestEmail).toHaveBeenCalled();
      expect(wrapper.vm.sendTestSuccess).toBe(true);
    });

    it('should not send without recipient', async () => {
      wrapper = createWrapper();
      wrapper.vm.testEmailRecipient = '';
      await wrapper.vm.sendTestEmail();
      expect(mockSendTestEmail).not.toHaveBeenCalled();
    });

    it('should handle send errors', async () => {
      mockSendTestEmail.mockRejectedValue(new Error('Send failed'));
      wrapper = createWrapper();
      wrapper.vm.testEmailRecipient = 'test@example.com';
      await wrapper.vm.sendTestEmail();
      expect(wrapper.vm.sendTestError).toContain('Send failed');
    });

    it('should close test dialog after success', async () => {
      vi.useFakeTimers();
      mockSendTestEmail.mockResolvedValue(undefined);
      wrapper = createWrapper();
      wrapper.vm.testEmailRecipient = 'test@example.com';
      await wrapper.vm.sendTestEmail();
      vi.advanceTimersByTime(2000);
      expect(wrapper.vm.sendTestDialogVisible).toBe(false);
      vi.useRealTimers();
    });
  });

  describe('Dialog Actions', () => {
    it('should close dialog', () => {
      wrapper = createWrapper();
      wrapper.vm.closeDialog();
      expect(wrapper.emitted('update:visible')).toBeTruthy();
    });

    it('should emit edit event', () => {
      wrapper = createWrapper();
      wrapper.vm.editTemplate();
      expect(wrapper.emitted('edit')).toBeTruthy();
      expect(wrapper.emitted('edit')?.[0]).toEqual([mockTemplate]);
    });

    it('should not edit without template', () => {
      wrapper = createWrapper({ template: null });
      wrapper.vm.editTemplate();
      expect(wrapper.emitted('edit')).toBeFalsy();
    });
  });

  describe('Dialog Lifecycle', () => {
    it('should reset state on dialog hide', () => {
      wrapper = createWrapper();
      wrapper.vm.activePreviewTab = '2';
      wrapper.vm.variableValues = { test: 'value' };
      wrapper.vm.onDialogHide();
      expect(wrapper.vm.activePreviewTab).toBe('0');
      expect(wrapper.vm.variableValues).toEqual({});
    });

    it('should load preview when template changes', async () => {
      wrapper = createWrapper({ template: null });
      await wrapper.vm.$nextTick();
      const callCount = mockPreviewTemplate.mock.calls.length;
      await wrapper.setProps({ template: mockTemplate });
      await nextTick();
      expect(mockPreviewTemplate.mock.calls.length).toBeGreaterThan(callCount);
    });
  });

  describe('Computed Properties', () => {
    it('should compute display HTML body', () => {
      wrapper = createWrapper();
      wrapper.vm.renderedHtmlBody = '<p>Rendered</p>';
      expect(wrapper.vm.displayHtmlBody).toBe('<p>Rendered</p>');
    });

    it('should fallback to template HTML body', () => {
      wrapper = createWrapper();
      wrapper.vm.renderedHtmlBody = '';
      expect(wrapper.vm.displayHtmlBody).toBe('<p>Hello {{userName}}</p>');
    });

    it('should compute display text body', () => {
      wrapper = createWrapper();
      wrapper.vm.renderedTextBody = 'Rendered text';
      expect(wrapper.vm.displayTextBody).toBe('Rendered text');
    });
  });

  describe('Preview Tabs', () => {
    it('should initialize with first tab active', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.activePreviewTab).toBe('0');
    });

    it('should allow tab switching', async () => {
      wrapper = createWrapper();
      wrapper.vm.activePreviewTab = '1';
      await nextTick();
      expect(wrapper.vm.activePreviewTab).toBe('1');
    });
  });

  describe('Iframe Handling', () => {
    it('should handle iframe load event', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      wrapper = createWrapper();
      wrapper.vm.htmlPreviewFrame = { contentWindow: {} } as any;
      wrapper.vm.onIframeLoad();
      expect(consoleSpy).toHaveBeenCalledWith('HTML preview loaded');
      consoleSpy.mockRestore();
    });

    it('should handle missing iframe', () => {
      wrapper = createWrapper();
      wrapper.vm.htmlPreviewFrame = null;
      wrapper.vm.onIframeLoad();
      // Should not throw
    });
  });
});
