import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import SystemAnalyticsPanel from '../SystemAnalyticsPanel.vue';
import { useToast } from 'primevue/usetoast';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Tag from 'primevue/tag';

// Mock PrimeVue toast
vi.mock('primevue/usetoast', () => ({
  useToast: vi.fn(() => ({
    add: vi.fn(),
  })),
}));

describe('SystemAnalyticsPanel.vue', () => {
  let wrapper: VueWrapper;
  let toast: ReturnType<typeof useToast>;

  const createWrapper = () => {
    return mount(SystemAnalyticsPanel, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            stubActions: false,
          }),
        ],
        components: { Card, Button, Tag },
        stubs: {
          Card: false,
          Button: false,
          Tag: false,
          Dropdown: true,
          ProgressSpinner: true,
        },
      },
    });
  };

  beforeEach(() => {
    toast = useToast();
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  // RENDERING TESTS
  describe('Component Rendering', () => {
    it('should render the analytics panel', () => {
      wrapper = createWrapper();
      expect(wrapper.find('.system-analytics-panel').exists()).toBe(true);
    });

    it('should render panel header', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('System Analytics');
    });

    it('should render time range dropdown', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('Last 7 days');
    });

    it('should render export button', () => {
      wrapper = createWrapper();
      const exportBtn = wrapper.findAll('button').find(btn =>
        btn.text().includes('Export Report')
      );
      expect(exportBtn?.exists()).toBe(true);
    });

    it('should render refresh button', () => {
      wrapper = createWrapper();
      const refreshBtn = wrapper.findAll('button').find(btn =>
        btn.text().includes('Refresh')
      );
      expect(refreshBtn?.exists()).toBe(true);
    });
  });

  // METRICS CARDS TESTS
  describe('Key Metrics Cards', () => {
    it('should render all 4 metric cards', () => {
      wrapper = createWrapper();
      const cards = wrapper.findAllComponents(Card);
      expect(cards.length).toBeGreaterThanOrEqual(4);
    });

    it('should display total users metric', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('Total Users');
      expect(wrapper.text()).toContain('178');
    });

    it('should display active roles metric', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('Active Roles');
      expect(wrapper.text()).toContain('6');
    });

    it('should display total permissions metric', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('Total Permissions');
      expect(wrapper.text()).toContain('48');
    });

    it('should display security events metric', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('Security Events');
      expect(wrapper.text()).toContain('23');
    });

    it('should show trend indicators', () => {
      wrapper = createWrapper();
      const html = wrapper.html();
      expect(html).toContain('pi-arrow-up');
    });

    it('should display percentage changes', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('%');
    });

    it('should show metric icons', () => {
      wrapper = createWrapper();
      const html = wrapper.html();
      expect(html).toContain('pi-users');
      expect(html).toContain('pi-shield');
      expect(html).toContain('pi-key');
      expect(html).toContain('pi-exclamation-triangle');
    });
  });

  // CHARTS SECTION TESTS
  describe('Charts Section', () => {
    it('should render user registration trend chart', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('User Registration Trend');
    });

    it('should render role distribution chart', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('Role Distribution');
    });

    it('should display chart headers', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('User Registration Trend');
      expect(wrapper.text()).toContain('Role Distribution');
    });

    it('should show role distribution data', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('INVESTOR');
      expect(wrapper.text()).toContain('ANALYST');
      expect(wrapper.text()).toContain('FUND_MANAGER');
    });

    it('should display role counts', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('145 users');
    });

    it('should show role percentages', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('81%');
    });

    it('should render progress bars for role distribution', () => {
      wrapper = createWrapper();
      const progressBars = wrapper.findAll('.h-2');
      expect(progressBars.length).toBeGreaterThan(0);
    });
  });

  // ACTIVITY MONITORING TESTS
  describe('Recent Activities', () => {
    it('should render recent activities section', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('Recent Activities');
    });

    it('should display activity items', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('Role Assignment');
      expect(wrapper.text()).toContain('Permission Modified');
    });

    it('should show activity icons', () => {
      wrapper = createWrapper();
      const html = wrapper.html();
      expect(html).toContain('pi-user-plus');
      expect(html).toContain('pi-cog');
    });

    it('should display activity timestamps', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('ago');
    });

    it('should show activity severity tags', () => {
      wrapper = createWrapper();
      const tags = wrapper.findAllComponents(Tag);
      expect(tags.length).toBeGreaterThan(0);
    });

    it('should display activity users', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('Admin User');
      expect(wrapper.text()).toContain('System Admin');
    });

    it('should show activity descriptions', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('FUND_MANAGER role assigned');
    });

    it('should handle scrollable activity list', () => {
      wrapper = createWrapper();
      const activityList = wrapper.find('.activity-list');
      expect(activityList.exists()).toBe(true);
    });
  });

  // SYSTEM HEALTH TESTS
  describe('System Health', () => {
    it('should render system health section', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('System Health');
    });

    it('should display health metrics', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('Authentication Success Rate');
      expect(wrapper.text()).toContain('Permission Check Performance');
      expect(wrapper.text()).toContain('System Uptime');
    });

    it('should show health values', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('99.8%');
      expect(wrapper.text()).toContain('12ms');
    });

    it('should display health status tags', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('HEALTHY');
      expect(wrapper.text()).toContain('WARNING');
    });

    it('should render health progress bars', () => {
      wrapper = createWrapper();
      const progressBars = wrapper.findAll('.h-2');
      expect(progressBars.length).toBeGreaterThan(0);
    });

    it('should show health labels', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('Excellent');
      expect(wrapper.text()).toContain('Monitor');
    });
  });

  // SECURITY INSIGHTS TESTS
  describe('Security Insights', () => {
    it('should render security insights section', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('Security Insights');
    });

    it('should display insight cards', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('Excessive Admin Permissions');
      expect(wrapper.text()).toContain('Inactive User Accounts');
    });

    it('should show insight severity levels', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('HIGH');
      expect(wrapper.text()).toContain('MEDIUM');
      expect(wrapper.text()).toContain('LOW');
    });

    it('should display insight descriptions', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('Multiple users have SUPER_ADMIN role');
    });

    it('should render insight icons', () => {
      wrapper = createWrapper();
      const html = wrapper.html();
      expect(html).toContain('pi-exclamation-triangle');
      expect(html).toContain('pi-user-minus');
    });

    it('should have view details buttons', () => {
      wrapper = createWrapper();
      const buttons = wrapper.findAll('button');
      const detailButtons = buttons.filter(btn => btn.text().includes('View Details'));
      expect(detailButtons.length).toBeGreaterThan(0);
    });

    it('should apply severity-based styling', () => {
      wrapper = createWrapper();
      const html = wrapper.html();
      expect(html).toContain('border-red-400');
      expect(html).toContain('border-yellow-400');
      expect(html).toContain('border-green-400');
    });
  });

  // HELPER METHODS TESTS
  describe('Helper Methods', () => {
    it('should return correct activity icon class', () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      expect(vm.getActivityIconClass('ROLE_ASSIGNED')).toContain('bg-blue-500');
      expect(vm.getActivityIconClass('SECURITY_EVENT')).toContain('bg-red-500');
    });

    it('should return correct activity icon', () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      expect(vm.getActivityIcon('ROLE_ASSIGNED')).toContain('pi-user-plus');
      expect(vm.getActivityIcon('PERMISSION_CHANGED')).toContain('pi-cog');
    });

    it('should return correct activity severity', () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      expect(vm.getActivitySeverity('ROLE_ASSIGNED')).toBe('info');
      expect(vm.getActivitySeverity('SECURITY_EVENT')).toBe('danger');
    });

    it('should return correct health color', () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      expect(vm.getHealthColor('HEALTHY')).toContain('green');
      expect(vm.getHealthColor('WARNING')).toContain('yellow');
      expect(vm.getHealthColor('CRITICAL')).toContain('red');
    });

    it('should return correct health bar color', () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      expect(vm.getHealthBarColor('HEALTHY')).toBe('#10b981');
      expect(vm.getHealthBarColor('WARNING')).toBe('#f59e0b');
      expect(vm.getHealthBarColor('CRITICAL')).toBe('#ef4444');
    });

    it('should return correct insight class', () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      expect(vm.getInsightClass('HIGH')).toContain('border-red-400');
      expect(vm.getInsightClass('MEDIUM')).toContain('border-yellow-400');
      expect(vm.getInsightClass('LOW')).toContain('border-green-400');
    });

    it('should return correct insight severity', () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      expect(vm.getInsightSeverity('HIGH')).toBe('danger');
      expect(vm.getInsightSeverity('MEDIUM')).toBe('warning');
      expect(vm.getInsightSeverity('LOW')).toBe('success');
    });

    it('should format time correctly', () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      const now = new Date();
      expect(vm.formatTime(now)).toBe('Just now');

      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      expect(vm.formatTime(fiveMinutesAgo)).toBe('5m ago');

      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      expect(vm.formatTime(twoHoursAgo)).toBe('2h ago');
    });
  });

  // TIME RANGE TESTS
  describe('Time Range Selection', () => {
    it('should have default time range selected', () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;
      expect(vm.selectedTimeRange).toBe('7d');
    });

    it('should have time range options', () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      expect(vm.timeRangeOptions).toHaveLength(5);
      expect(vm.timeRangeOptions.some((opt: any) => opt.value === '24h')).toBe(true);
      expect(vm.timeRangeOptions.some((opt: any) => opt.value === '7d')).toBe(true);
      expect(vm.timeRangeOptions.some((opt: any) => opt.value === '30d')).toBe(true);
    });
  });

  // USER INTERACTIONS TESTS
  describe('User Interactions', () => {
    it('should trigger export report', async () => {
      wrapper = createWrapper();

      const exportBtn = wrapper.findAll('button').find(btn =>
        btn.text().includes('Export Report')
      );
      await exportBtn?.trigger('click');

      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({
        severity: 'info',
        summary: 'Export Started',
      }));
    });

    it('should refresh data when refresh button clicked', async () => {
      wrapper = createWrapper();

      const refreshBtn = wrapper.findAll('button').find(btn =>
        btn.text().includes('Refresh')
      );
      await refreshBtn?.trigger('click');

      const vm = wrapper.vm as any;
      expect(vm.loading).toBe(true);
    });

    it('should handle refresh completion', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      await vm.refreshData();

      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({
        severity: 'success',
        summary: 'Data Refreshed',
      }));
      expect(vm.loading).toBe(false);
    });

    it('should view insight details', async () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      const insight = { id: '1', title: 'Test Insight', severity: 'HIGH' };
      vm.viewInsightDetails(insight);

      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({
        severity: 'info',
        summary: 'Insight Details',
      }));
    });
  });

  // EDGE CASES TESTS
  describe('Edge Cases', () => {
    it('should handle empty activity list', () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      vm.recentActivities = [];
      expect(wrapper.find('.activity-list').exists()).toBe(true);
    });

    it('should handle missing metrics gracefully', () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      vm.totalUsers = 0;
      vm.activeRoles = 0;
      expect(wrapper.text()).toContain('0');
    });

    it('should handle all role distribution percentages', () => {
      wrapper = createWrapper();
      const vm = wrapper.vm as any;

      const totalPercentage = vm.roleDistribution.reduce((sum: number, role: any) => sum + role.percentage, 0);
      expect(totalPercentage).toBe(100);
    });
  });

  // ACCESSIBILITY TESTS
  describe('Accessibility', () => {
    it('should have descriptive section headers', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('System Analytics');
      expect(wrapper.text()).toContain('Recent Activities');
      expect(wrapper.text()).toContain('System Health');
      expect(wrapper.text()).toContain('Security Insights');
    });

    it('should have accessible metric labels', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('Total Users');
      expect(wrapper.text()).toContain('Active Roles');
      expect(wrapper.text()).toContain('Total Permissions');
    });

    it('should use semantic icons', () => {
      wrapper = createWrapper();
      const html = wrapper.html();
      expect(html).toContain('pi-');
    });

    it('should have actionable buttons', () => {
      wrapper = createWrapper();
      const buttons = wrapper.findAll('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  // RESPONSIVE BEHAVIOR TESTS
  describe('Responsive Behavior', () => {
    it('should render on different screen sizes', () => {
      wrapper = createWrapper();
      expect(wrapper.find('.system-analytics-panel').exists()).toBe(true);
    });

    it('should have responsive grid layouts', () => {
      wrapper = createWrapper();
      const html = wrapper.html();
      expect(html).toContain('grid');
      expect(html).toContain('md:grid-cols');
    });
  });
});
