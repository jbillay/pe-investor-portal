import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { ref } from 'vue';
import AuditTrailDialog from '../AuditTrailDialog.vue';

// Mock PrimeVue components
vi.mock('primevue/dialog', () => ({
  default: {
    name: 'Dialog',
    template: '<div class="dialog"><slot name="header"></slot><slot></slot><slot name="footer"></slot></div>',
    props: ['visible', 'modal', 'draggable', 'closable', 'style', 'class']
  }
}));

vi.mock('primevue/button', () => ({
  default: {
    name: 'Button',
    template: '<button></button>',
    props: ['label', 'icon', 'class', 'loading', 'disabled']
  }
}));

vi.mock('primevue/inputtext', () => ({
  default: {
    name: 'InputText',
    template: '<input />',
    props: ['modelValue', 'placeholder', 'class', 'aria-label']
  }
}));

vi.mock('primevue/select', () => ({
  default: {
    name: 'Select',
    template: '<select></select>',
    props: ['modelValue', 'options', 'optionLabel', 'optionValue', 'placeholder', 'class', 'showClear', 'filter', 'aria-label']
  }
}));

vi.mock('primevue/datatable', () => ({
  default: {
    name: 'DataTable',
    template: '<div class="datatable"><slot name="header"></slot><slot></slot><slot name="empty"></slot><slot name="loading"></slot></div>',
    props: ['value', 'selection', 'selectionMode', 'paginator', 'rows', 'totalRecords', 'first', 'loading', 'responsiveLayout', 'metaKeySelection', 'dataKey', 'sortField', 'sortOrder', 'class', 'scrollable', 'scrollHeight', 'lazy', 'paginatorTemplate', 'currentPageReportTemplate']
  }
}));

vi.mock('primevue/column', () => ({
  default: {
    name: 'Column',
    template: '<div class="column"><slot name="body"></slot></div>',
    props: ['field', 'header', 'sortable', 'class', 'selectionMode', 'headerStyle']
  }
}));

vi.mock('primevue/tag', () => ({
  default: {
    name: 'Tag',
    template: '<span></span>',
    props: ['value', 'severity', 'class']
  }
}));

vi.mock('primevue/progressspinner', () => ({
  default: {
    name: 'ProgressSpinner',
    template: '<div class="spinner"></div>',
    props: ['class']
  }
}));

vi.mock('primevue/overlaypanel', () => ({
  default: {
    name: 'OverlayPanel',
    template: '<div class="overlay-panel"><slot></slot></div>',
    props: ['visible']
  }
}));

vi.mock('primevue/divider', () => ({
  default: {
    name: 'Divider',
    template: '<hr />'
  }
}));

vi.mock('primevue/inputgroup', () => ({
  default: {
    name: 'InputGroup',
    template: '<div class="input-group"><slot></slot></div>'
  }
}));

vi.mock('primevue/inputgroupaddon', () => ({
  default: {
    name: 'InputGroupAddon',
    template: '<div class="input-group-addon"><slot></slot></div>'
  }
}));

// Mock composables
const mockToast = {
  add: vi.fn(),
};

const loadingRef = ref(false);
const exportLoadingRef = ref(false);
const auditDataRef = ref<any>([]);
const statsDataRef = ref<any>({ summary: {}, topActions: [], topResources: [] });
const transformedAuditLogsRef = ref<any>([]);
const userOptionsRef = ref<any>([]);
const filtersRef = ref({
  search: '',
  action: null,
  resource: null,
  userId: null,
  ipAddress: '',
  days: 7,
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'desc'
});
const totalEventsRef = ref(0);
const successfulEventsRef = ref(0);
const failedEventsRef = ref(0);
const securityEventsRef = ref(0);

const mockLoadAuditLogs = vi.fn();
const mockLoadAuditStatistics = vi.fn();
const mockResetFilters = vi.fn();
const mockRefreshData = vi.fn();
const mockExportAuditLogs = vi.fn();
const mockOnPageChange = vi.fn();
const mockOnFiltersChange = vi.fn();

vi.mock('primevue/usetoast', () => ({
  useToast: () => mockToast,
}));

vi.mock('@/composables/useAuditTrail', () => ({
  useAuditTrail: () => ({
    loading: loadingRef,
    exportLoading: exportLoadingRef,
    auditData: auditDataRef,
    statsData: statsDataRef,
    transformedAuditLogs: transformedAuditLogsRef,
    userOptions: userOptionsRef,
    filters: filtersRef,
    totalEvents: totalEventsRef,
    successfulEvents: successfulEventsRef,
    failedEvents: failedEventsRef,
    securityEvents: securityEventsRef,
    loadAuditLogs: mockLoadAuditLogs,
    loadAuditStatistics: mockLoadAuditStatistics,
    resetFilters: mockResetFilters,
    refreshData: mockRefreshData,
    exportAuditLogs: mockExportAuditLogs,
    onPageChange: mockOnPageChange,
    onFiltersChange: mockOnFiltersChange,
    AUDIT_CONFIG: {
      RETENTION_DAYS: 90,
      DEBOUNCE_DELAY: 300,
      DATE_RANGES: [
        { label: 'Last 7 Days', value: 7 },
        { label: 'Last 30 Days', value: 30 },
        { label: 'Last 90 Days', value: 90 }
      ]
    }
  }),
}));

vi.mock('@/services/auditTrailService', () => ({
  auditTrailService: {
    getFilterOptions: vi.fn(() => ({
      actions: [
        { label: 'Login', value: 'LOGIN' },
        { label: 'Logout', value: 'LOGOUT' }
      ],
      resources: [
        { label: 'User', value: 'USER' },
        { label: 'Role', value: 'ROLE' }
      ]
    })),
    exportAuditTrail: vi.fn(),
    downloadExport: vi.fn(),
  },
}));

// Import the mocked service after the mock is defined
const { auditTrailService: mockAuditTrailService } = await import('@/services/auditTrailService');

describe('AuditTrailDialog', () => {
  let wrapper: VueWrapper<any>;

  const mockAuditEvents = [
    {
      id: '1',
      action: 'LOGIN',
      userId: 'user-1',
      userDisplayName: 'John Doe',
      user: { email: 'john@example.com' },
      resource: 'USER',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      description: 'User logged in',
      severity: 'LOW',
      status: 'SUCCESS',
      createdAt: '2025-01-01T10:00:00Z',
      details: { browser: 'Chrome' }
    },
    {
      id: '2',
      action: 'ROLE_ASSIGNED',
      userId: 'user-2',
      userDisplayName: 'Jane Smith',
      user: { email: 'jane@example.com' },
      resource: 'ROLE',
      ipAddress: '192.168.1.2',
      userAgent: 'Safari/5.0',
      description: 'Role assigned to user',
      severity: 'MEDIUM',
      status: 'SUCCESS',
      createdAt: '2025-01-01T11:00:00Z',
      details: { roleName: 'Admin' }
    }
  ];

  const createWrapper = (props = {}) => {
    return mount(AuditTrailDialog, {
      props: {
        visible: true,
        ...props,
      },
      global: {
        stubs: {
          teleport: true,
        },
      },
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    transformedAuditLogsRef.value = mockAuditEvents;
    statsDataRef.value = {
      summary: { totalEvents: 100 },
      topActions: [
        { action: 'LOGIN', count: 50 },
        { action: 'LOGOUT', count: 30 }
      ],
      topResources: [
        { resource: 'USER', count: 60 },
        { resource: 'ROLE', count: 40 }
      ]
    };
    totalEventsRef.value = 100;
    successfulEventsRef.value = 80;
    failedEventsRef.value = 15;
    securityEventsRef.value = 5;
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('Component Rendering', () => {
    it('should render the dialog', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.dialogVisible).toBe(true);
    });

    it('should display stats summary', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.totalEvents).toBe(100);
      expect(wrapper.vm.successfulEvents).toBe(80);
      expect(wrapper.vm.failedEvents).toBe(15);
      expect(wrapper.vm.securityEvents).toBe(5);
    });

    it('should display top actions from stats', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.statsData?.topActions).toHaveLength(2);
      expect(wrapper.vm.statsData?.topActions[0].action).toBe('LOGIN');
    });

    it('should display top resources from stats', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.statsData?.topResources).toHaveLength(2);
      expect(wrapper.vm.statsData?.topResources[0].resource).toBe('USER');
    });
  });

  describe('Component Lifecycle', () => {
    it('should load audit logs on dialog show', async () => {
      wrapper = createWrapper();
      await wrapper.vm.onDialogShow();
      expect(mockLoadAuditLogs).toHaveBeenCalled();
      expect(mockLoadAuditStatistics).toHaveBeenCalled();
    });

    it('should clear selections on dialog hide', () => {
      wrapper = createWrapper();
      wrapper.vm.selectedEvents = [mockAuditEvents[0]];
      wrapper.vm.showBulkActionsMenu = true;
      wrapper.vm.onDialogHide();
      expect(wrapper.vm.selectedEvents).toEqual([]);
      expect(wrapper.vm.showBulkActionsMenu).toBe(false);
    });

    it('should load data on mount when visible', async () => {
      wrapper = createWrapper({ visible: true });
      await wrapper.vm.$nextTick();
      expect(mockLoadAuditLogs).toHaveBeenCalled();
      expect(mockLoadAuditStatistics).toHaveBeenCalled();
    });
  });

  describe('Filters', () => {
    it('should have default filter values', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.filters.search).toBe('');
      expect(wrapper.vm.filters.days).toBe(7);
      expect(wrapper.vm.filters.page).toBe(1);
    });

    it('should toggle advanced filters', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.showAdvancedFilters).toBe(false);
      wrapper.vm.showAdvancedFilters = true;
      expect(wrapper.vm.showAdvancedFilters).toBe(true);
    });

    it('should reset filters', () => {
      wrapper = createWrapper();
      wrapper.vm.filters.search = 'test';
      wrapper.vm.resetFilters();
      expect(mockResetFilters).toHaveBeenCalled();
    });

    it('should handle date range change', async () => {
      wrapper = createWrapper();
      wrapper.vm.onDateRangeChange({ value: 30 });
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.filters.page).toBe(1);
      expect(mockLoadAuditLogs).toHaveBeenCalled();
    });

    it('should not change date range without value', async () => {
      wrapper = createWrapper();
      const originalDays = wrapper.vm.filters.days;
      await wrapper.vm.onDateRangeChange({});
      expect(wrapper.vm.filters.days).toBe(originalDays);
    });
  });

  describe('Event Display', () => {
    it('should display transformed audit logs', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.transformedAuditLogs).toHaveLength(2);
      expect(wrapper.vm.transformedAuditLogs[0].action).toBe('LOGIN');
    });

    it('should get correct event icon', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.getEventIcon('LOGIN')).toBe('pi pi-sign-in');
      expect(wrapper.vm.getEventIcon('LOGOUT')).toBe('pi pi-sign-out');
      expect(wrapper.vm.getEventIcon('UNKNOWN')).toBe('pi pi-info-circle');
    });

    it('should get correct event color', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.getEventColor('LOGIN')).toBe('#10b981');
      expect(wrapper.vm.getEventColor('LOGIN_FAILED')).toBe('#ef4444');
      expect(wrapper.vm.getEventColor('UNKNOWN')).toBe('#6b7280');
    });

    it('should get correct severity', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.getSeverity('LOW')).toBe('success');
      expect(wrapper.vm.getSeverity('MEDIUM')).toBe('warning');
      expect(wrapper.vm.getSeverity('HIGH')).toBe('danger');
      expect(wrapper.vm.getSeverity('CRITICAL')).toBe('danger');
      expect(wrapper.vm.getSeverity('UNKNOWN')).toBe('info');
    });

    it('should get correct status severity', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.getStatusSeverity('SUCCESS')).toBe('success');
      expect(wrapper.vm.getStatusSeverity('FAILED')).toBe('danger');
      expect(wrapper.vm.getStatusSeverity('PENDING')).toBe('warning');
      expect(wrapper.vm.getStatusSeverity('UNKNOWN')).toBe('info');
    });
  });

  describe('Date Formatting', () => {
    it('should format date correctly', () => {
      wrapper = createWrapper();
      const formatted = wrapper.vm.formatDate('2025-01-15T10:00:00Z');
      expect(formatted).toContain('Jan');
      expect(formatted).toContain('15');
    });

    it('should format time correctly', () => {
      wrapper = createWrapper();
      const formatted = wrapper.vm.formatTime('2025-01-15T10:30:45Z');
      expect(formatted).toMatch(/\d{2}:\d{2}:\d{2}/);
    });

    it('should get relative time for recent events', () => {
      wrapper = createWrapper();
      const now = new Date();
      const justNow = now.toISOString();
      expect(wrapper.vm.getRelativeTime(justNow)).toBe('Just now');
    });

    it('should get relative time for minutes ago', () => {
      wrapper = createWrapper();
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60000).toISOString();
      expect(wrapper.vm.getRelativeTime(fiveMinutesAgo)).toBe('5m ago');
    });

    it('should get relative time for hours ago', () => {
      wrapper = createWrapper();
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 3600000).toISOString();
      expect(wrapper.vm.getRelativeTime(twoHoursAgo)).toBe('2h ago');
    });

    it('should get relative time for days ago', () => {
      wrapper = createWrapper();
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 86400000).toISOString();
      expect(wrapper.vm.getRelativeTime(threeDaysAgo)).toBe('3d ago');
    });
  });

  describe('Event Actions', () => {
    it('should view event details', () => {
      wrapper = createWrapper();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      wrapper.vm.viewEventDetails(mockAuditEvents[0]);
      expect(consoleSpy).toHaveBeenCalledWith('Event Details:', expect.any(Object));
      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'info',
          summary: 'Event Details',
        })
      );
      consoleSpy.mockRestore();
    });

    it('should share event to clipboard', async () => {
      wrapper = createWrapper();
      const mockClipboard = {
        writeText: vi.fn().mockResolvedValue(undefined),
      };
      Object.assign(navigator, { clipboard: mockClipboard });

      await wrapper.vm.shareEvent(mockAuditEvents[0]);
      expect(mockClipboard.writeText).toHaveBeenCalled();
      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
          summary: 'Event Shared',
        })
      );
    });

    it('should handle share event error', async () => {
      wrapper = createWrapper();
      const mockClipboard = {
        writeText: vi.fn().mockRejectedValue(new Error('Clipboard error')),
      };
      Object.assign(navigator, { clipboard: mockClipboard });

      await wrapper.vm.shareEvent(mockAuditEvents[0]);
      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          summary: 'Share Failed',
        })
      );
    });

    it('should flag event', () => {
      wrapper = createWrapper();
      wrapper.vm.flagEvent(mockAuditEvents[0]);
      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'warn',
          summary: 'Event Flagged',
        })
      );
    });
  });

  describe('Bulk Actions', () => {
    it('should export selected events', async () => {
      wrapper = createWrapper();
      wrapper.vm.selectedEvents = [mockAuditEvents[0]];
      mockAuditTrailService.exportAuditTrail.mockResolvedValue({
        downloadUrl: 'http://example.com/export.csv',
        fileName: 'audit-export.csv'
      });

      await wrapper.vm.exportSelectedEvents();
      expect(mockAuditTrailService.exportAuditTrail).toHaveBeenCalled();
      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
          summary: 'Export Complete',
        })
      );
      expect(wrapper.vm.selectedEvents).toEqual([]);
    });

    it('should not export without selection', async () => {
      wrapper = createWrapper();
      wrapper.vm.selectedEvents = [];
      await wrapper.vm.exportSelectedEvents();
      expect(mockAuditTrailService.exportAuditTrail).not.toHaveBeenCalled();
      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'warn',
          summary: 'No Selection',
        })
      );
    });

    it('should handle export error', async () => {
      wrapper = createWrapper();
      wrapper.vm.selectedEvents = [mockAuditEvents[0]];
      mockAuditTrailService.exportAuditTrail.mockRejectedValue(new Error('Export failed'));

      await wrapper.vm.exportSelectedEvents();
      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          summary: 'Export Failed',
        })
      );
    });

    it('should flag selected events', () => {
      wrapper = createWrapper();
      wrapper.vm.selectedEvents = [mockAuditEvents[0], mockAuditEvents[1]];
      wrapper.vm.flagSelectedEvents();
      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'warn',
          summary: 'Events Flagged',
        })
      );
      expect(wrapper.vm.selectedEvents).toEqual([]);
    });

    it('should not flag without selection', () => {
      wrapper = createWrapper();
      wrapper.vm.selectedEvents = [];
      wrapper.vm.flagSelectedEvents();
      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'warn',
          summary: 'No Selection',
        })
      );
    });

    it('should mark events as reviewed', () => {
      wrapper = createWrapper();
      wrapper.vm.selectedEvents = [mockAuditEvents[0]];
      wrapper.vm.markAsReviewed();
      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
          summary: 'Events Reviewed',
        })
      );
      expect(wrapper.vm.selectedEvents).toEqual([]);
    });

    it('should not mark as reviewed without selection', () => {
      wrapper = createWrapper();
      wrapper.vm.selectedEvents = [];
      wrapper.vm.markAsReviewed();
      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'warn',
          summary: 'No Selection',
        })
      );
    });
  });

  describe('Data Refresh', () => {
    it('should refresh data', () => {
      wrapper = createWrapper();
      wrapper.vm.refreshData();
      expect(mockRefreshData).toHaveBeenCalled();
    });

    it('should call export audit logs', () => {
      wrapper = createWrapper();
      wrapper.vm.exportAuditLogsComposable();
      expect(mockExportAuditLogs).toHaveBeenCalled();
    });

    it('should call export with xlsx format', () => {
      wrapper = createWrapper();
      wrapper.vm.exportAuditLogsComposable('xlsx');
      expect(mockExportAuditLogs).toHaveBeenCalledWith('xlsx');
    });
  });

  describe('Pagination', () => {
    it('should handle page change', () => {
      wrapper = createWrapper();
      const event = { page: 2, rows: 20 };
      wrapper.vm.onPageChange(event);
      expect(mockOnPageChange).toHaveBeenCalledWith(event);
    });
  });

  describe('Dialog Visibility', () => {
    it('should close dialog', () => {
      wrapper = createWrapper();
      wrapper.vm.closeDialog();
      expect(wrapper.vm.dialogVisible).toBe(false);
    });

    it('should emit update:visible when closing', async () => {
      wrapper = createWrapper();
      wrapper.vm.dialogVisible = false;
      await wrapper.vm.$nextTick();
      expect(wrapper.emitted('update:visible')).toBeTruthy();
    });

    it('should sync visibility with prop', async () => {
      wrapper = createWrapper({ visible: false });
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.dialogVisible).toBe(false);
    });
  });

  describe('Filter Options', () => {
    it('should load filter options from service', () => {
      wrapper = createWrapper();
      const options = wrapper.vm.filterOptions;
      expect(options.actions).toHaveLength(2);
      expect(options.resources).toHaveLength(2);
    });

    it('should have date range options', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.dateRangeOptions).toHaveLength(3);
      expect(wrapper.vm.dateRangeOptions[0].value).toBe(7);
    });
  });

  describe('Loading States', () => {
    it('should show loading state', () => {
      wrapper = createWrapper();
      loadingRef.value = true;
      expect(wrapper.vm.loading).toBe(true);
    });

    it('should show export loading state', () => {
      wrapper = createWrapper();
      exportLoadingRef.value = true;
      expect(wrapper.vm.exportLoading).toBe(true);
    });
  });

  describe('Empty States', () => {
    it('should handle empty audit logs', () => {
      transformedAuditLogsRef.value = [];
      wrapper = createWrapper();
      expect(wrapper.vm.transformedAuditLogs).toHaveLength(0);
    });

    it('should handle empty stats', () => {
      statsDataRef.value = { topActions: [], topResources: [] };
      wrapper = createWrapper();
      expect(wrapper.vm.statsData?.topActions).toHaveLength(0);
      expect(wrapper.vm.statsData?.topResources).toHaveLength(0);
    });
  });

  describe('Configuration', () => {
    it('should have audit config values', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.AUDIT_CONFIG.RETENTION_DAYS).toBe(90);
      expect(wrapper.vm.AUDIT_CONFIG.DEBOUNCE_DELAY).toBe(300);
    });
  });

  describe('Component State', () => {
    it('should initialize with no selected events', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.selectedEvents).toEqual([]);
    });

    it('should initialize with advanced filters hidden', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.showAdvancedFilters).toBe(false);
    });

    it('should initialize with bulk actions menu hidden', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.showBulkActionsMenu).toBe(false);
    });

    it('should toggle bulk actions menu', () => {
      wrapper = createWrapper();
      wrapper.vm.showBulkActionsMenu = true;
      expect(wrapper.vm.showBulkActionsMenu).toBe(true);
      wrapper.vm.showBulkActionsMenu = false;
      expect(wrapper.vm.showBulkActionsMenu).toBe(false);
    });
  });
});
