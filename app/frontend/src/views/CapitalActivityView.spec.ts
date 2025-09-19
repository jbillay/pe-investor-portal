import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import CapitalActivityView from './CapitalActivityView.vue';
import { TestHelper, testIds } from '../test/utils/test-helpers';
import { createPinia, setActivePinia } from 'pinia';

// Mock the API service
const mockApiService = {
  getCapitalCalls: vi.fn(),
  getDistributions: vi.fn(),
  payCapitalCall: vi.fn(),
};

vi.mock('../services/api', () => ({
  apiService: mockApiService,
}));

describe('CapitalActivityView', () => {
  let wrapper: any;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('component initialization', () => {
    it('should render capital activity view correctly', () => {
      wrapper = TestHelper.createWrapper(CapitalActivityView);

      expect(wrapper.find('h1').text()).toContain('Capital Activity');
      expect(wrapper.find(`[data-testid="${testIds.capitalCallsTab}"]`).exists()).toBe(true);
      expect(wrapper.find(`[data-testid="${testIds.distributionsTab}"]`).exists()).toBe(true);
      expect(wrapper.find(`[data-testid="${testIds.historyTab}"]`).exists()).toBe(true);
    });

    it('should have capital calls tab active by default', async () => {
      wrapper = TestHelper.createWrapper(CapitalActivityView);

      await wrapper.vm.$nextTick();

      const capitalCallsTab = wrapper.find(`[data-testid="${testIds.capitalCallsTab}"]`);
      expect(capitalCallsTab.classes()).toContain('active');
    });

    it('should fetch data on mount', () => {
      wrapper = TestHelper.createWrapper(CapitalActivityView);

      expect(mockApiService.getCapitalCalls).toHaveBeenCalled();
      expect(mockApiService.getDistributions).toHaveBeenCalled();
    });
  });

  describe('capital calls tab', () => {
    beforeEach(() => {
      const mockCapitalCalls = [
        TestHelper.generateMockCapitalCall(),
        {
          ...TestHelper.generateMockCapitalCall(),
          id: 'call-456',
          status: 'PAID',
        },
      ];

      mockApiService.getCapitalCalls.mockResolvedValue({ data: mockCapitalCalls });
      wrapper = TestHelper.createWrapper(CapitalActivityView);
    });

    it('should display capital calls list', async () => {
      await TestHelper.waitFor(() => wrapper.vm.capitalCalls.length > 0);

      const capitalCallCards = wrapper.findAll('[data-testid="capital-call-card"]');
      expect(capitalCallCards).toHaveLength(2);
    });

    it('should show capital call details', async () => {
      await TestHelper.waitFor(() => wrapper.vm.capitalCalls.length > 0);

      const firstCallCard = wrapper.find('[data-testid="capital-call-card"]');
      expect(firstCallCard.text()).toContain('Test Fund');
      expect(firstCallCard.text()).toContain('$5,000,000');
      expect(firstCallCard.text()).toContain('Investment deployment');
    });

    it('should display pending calls with payment button', async () => {
      await TestHelper.waitFor(() => wrapper.vm.capitalCalls.length > 0);

      const pendingCall = wrapper.find('[data-call-status="PENDING"]');
      const payButton = pendingCall.find('[data-testid="pay-button"]');

      expect(payButton.exists()).toBe(true);
      expect(payButton.text()).toContain('Pay');
    });

    it('should not show payment button for paid calls', async () => {
      await TestHelper.waitFor(() => wrapper.vm.capitalCalls.length > 0);

      const paidCall = wrapper.find('[data-call-status="PAID"]');
      const payButton = paidCall.find('[data-testid="pay-button"]');

      expect(payButton.exists()).toBe(false);
    });

    it('should handle payment action', async () => {
      mockApiService.payCapitalCall.mockResolvedValue({ data: { success: true } });

      await TestHelper.waitFor(() => wrapper.vm.capitalCalls.length > 0);

      const payButton = wrapper.find('[data-testid="pay-button"]');
      await payButton.trigger('click');

      expect(mockApiService.payCapitalCall).toHaveBeenCalledWith('call-123');
    });

    it('should show confirmation dialog before payment', async () => {
      await TestHelper.waitFor(() => wrapper.vm.capitalCalls.length > 0);

      const payButton = wrapper.find('[data-testid="pay-button"]');
      await payButton.trigger('click');

      const confirmDialog = wrapper.find('[data-testid="payment-confirmation"]');
      expect(confirmDialog.exists()).toBe(true);
    });

    it('should filter capital calls by status', async () => {
      await TestHelper.waitFor(() => wrapper.vm.capitalCalls.length > 0);

      const statusFilter = wrapper.find('[data-testid="status-filter"]');
      await statusFilter.setValue('PENDING');

      const visibleCalls = wrapper.findAll('[data-testid="capital-call-card"]:not([style*="display: none"])');
      expect(visibleCalls).toHaveLength(1);
    });
  });

  describe('distributions tab', () => {
    beforeEach(() => {
      const mockDistributions = [
        TestHelper.generateMockDistribution(),
        {
          ...TestHelper.generateMockDistribution(),
          id: 'dist-456',
          distributionType: 'CAPITAL_RETURN',
        },
      ];

      mockApiService.getDistributions.mockResolvedValue({ data: mockDistributions });
      wrapper = TestHelper.createWrapper(CapitalActivityView);
    });

    it('should switch to distributions tab', async () => {
      const distributionsTab = wrapper.find(`[data-testid="${testIds.distributionsTab}"]`);
      await distributionsTab.trigger('click');

      expect(distributionsTab.classes()).toContain('active');
      expect(wrapper.find(`[data-testid="${testIds.capitalCallsTab}"]`).classes()).not.toContain('active');
    });

    it('should display distributions list', async () => {
      const distributionsTab = wrapper.find(`[data-testid="${testIds.distributionsTab}"]`);
      await distributionsTab.trigger('click');

      await TestHelper.waitFor(() => wrapper.vm.distributions.length > 0);

      const distributionCards = wrapper.findAll('[data-testid="distribution-card"]');
      expect(distributionCards).toHaveLength(2);
    });

    it('should show distribution details', async () => {
      const distributionsTab = wrapper.find(`[data-testid="${testIds.distributionsTab}"]`);
      await distributionsTab.trigger('click');

      await TestHelper.waitFor(() => wrapper.vm.distributions.length > 0);

      const firstDistCard = wrapper.find('[data-testid="distribution-card"]');
      expect(firstDistCard.text()).toContain('Test Fund');
      expect(firstDistCard.text()).toContain('$2,000,000');
      expect(firstDistCard.text()).toContain('DIVIDEND');
    });

    it('should categorize distributions by type', async () => {
      const distributionsTab = wrapper.find(`[data-testid="${testIds.distributionsTab}"]`);
      await distributionsTab.trigger('click');

      await TestHelper.waitFor(() => wrapper.vm.distributions.length > 0);

      const dividendCard = wrapper.find('[data-distribution-type="DIVIDEND"]');
      const capitalReturnCard = wrapper.find('[data-distribution-type="CAPITAL_RETURN"]');

      expect(dividendCard.exists()).toBe(true);
      expect(capitalReturnCard.exists()).toBe(true);
    });
  });

  describe('history tab', () => {
    it('should switch to history tab', async () => {
      const historyTab = wrapper.find(`[data-testid="${testIds.historyTab}"]`);
      await historyTab.trigger('click');

      expect(historyTab.classes()).toContain('active');
    });

    it('should show combined historical data', async () => {
      const historyTab = wrapper.find(`[data-testid="${testIds.historyTab}"]`);
      await historyTab.trigger('click');

      await TestHelper.waitFor(() => wrapper.vm.capitalCalls.length > 0);

      const historyItems = wrapper.findAll('[data-testid="history-item"]');
      expect(historyItems.length).toBeGreaterThan(0);
    });

    it('should sort history items by date', async () => {
      const historyTab = wrapper.find(`[data-testid="${testIds.historyTab}"]`);
      await historyTab.trigger('click');

      await TestHelper.waitFor(() => wrapper.vm.capitalCalls.length > 0);

      const historyItems = wrapper.findAll('[data-testid="history-item"]');
      const dates = historyItems.map(item =>
        new Date(item.find('[data-testid="item-date"]').text())
      );

      // Check if dates are in descending order (newest first)
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i-1].getTime()).toBeGreaterThanOrEqual(dates[i].getTime());
      }
    });
  });

  describe('loading states', () => {
    it('should show loading spinner while fetching data', () => {
      mockApiService.getCapitalCalls.mockImplementation(() =>
        new Promise(resolve => setTimeout(resolve, 100))
      );

      wrapper = TestHelper.createWrapper(CapitalActivityView);

      expect(wrapper.find(`[data-testid="${testIds.loadingSpinner}"]`).exists()).toBe(true);
    });

    it('should hide loading spinner after data is loaded', async () => {
      mockApiService.getCapitalCalls.mockResolvedValue({ data: [] });
      mockApiService.getDistributions.mockResolvedValue({ data: [] });

      wrapper = TestHelper.createWrapper(CapitalActivityView);

      await TestHelper.nextTick();

      expect(wrapper.find(`[data-testid="${testIds.loadingSpinner}"]`).exists()).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should display error message when API fails', async () => {
      mockApiService.getCapitalCalls.mockRejectedValue(new Error('API Error'));
      mockApiService.getDistributions.mockRejectedValue(new Error('API Error'));

      wrapper = TestHelper.createWrapper(CapitalActivityView);

      await TestHelper.nextTick();

      expect(wrapper.find(`[data-testid="${testIds.errorMessage}"]`).exists()).toBe(true);
      expect(wrapper.find(`[data-testid="${testIds.errorMessage}"]`).text()).toContain('API Error');
    });

    it('should show retry button on error', async () => {
      mockApiService.getCapitalCalls.mockRejectedValue(new Error('Network Error'));

      wrapper = TestHelper.createWrapper(CapitalActivityView);

      await TestHelper.nextTick();

      const retryButton = wrapper.find('[data-testid="retry-button"]');
      expect(retryButton.exists()).toBe(true);
    });

    it('should refetch data when retry button is clicked', async () => {
      mockApiService.getCapitalCalls.mockRejectedValueOnce(new Error('Network Error'))
                                    .mockResolvedValueOnce({ data: [] });

      wrapper = TestHelper.createWrapper(CapitalActivityView);

      await TestHelper.nextTick();

      const retryButton = wrapper.find('[data-testid="retry-button"]');
      await retryButton.trigger('click');

      expect(mockApiService.getCapitalCalls).toHaveBeenCalledTimes(2);
    });
  });

  describe('empty states', () => {
    it('should show empty state when no capital calls exist', async () => {
      mockApiService.getCapitalCalls.mockResolvedValue({ data: [] });
      mockApiService.getDistributions.mockResolvedValue({ data: [] });

      wrapper = TestHelper.createWrapper(CapitalActivityView);

      await TestHelper.nextTick();

      expect(wrapper.find('[data-testid="empty-capital-calls"]').exists()).toBe(true);
      expect(wrapper.text()).toContain('No capital calls found');
    });

    it('should show empty state when no distributions exist', async () => {
      mockApiService.getCapitalCalls.mockResolvedValue({ data: [] });
      mockApiService.getDistributions.mockResolvedValue({ data: [] });

      wrapper = TestHelper.createWrapper(CapitalActivityView);

      const distributionsTab = wrapper.find(`[data-testid="${testIds.distributionsTab}"]`);
      await distributionsTab.trigger('click');

      await TestHelper.nextTick();

      expect(wrapper.find('[data-testid="empty-distributions"]').exists()).toBe(true);
      expect(wrapper.text()).toContain('No distributions found');
    });
  });

  describe('formatting and display', () => {
    beforeEach(() => {
      mockApiService.getCapitalCalls.mockResolvedValue({
        data: [TestHelper.generateMockCapitalCall()]
      });
      wrapper = TestHelper.createWrapper(CapitalActivityView);
    });

    it('should format currency amounts correctly', async () => {
      await TestHelper.waitFor(() => wrapper.vm.capitalCalls.length > 0);

      const amountDisplay = wrapper.find('[data-testid="amount-display"]');
      expect(amountDisplay.text()).toMatch(/\$5,000,000/);
    });

    it('should format dates correctly', async () => {
      await TestHelper.waitFor(() => wrapper.vm.capitalCalls.length > 0);

      const dateDisplay = wrapper.find('[data-testid="date-display"]');
      expect(dateDisplay.text()).toMatch(/Jan \d{1,2}, 2024/);
    });

    it('should show status badges with correct styling', async () => {
      await TestHelper.waitFor(() => wrapper.vm.capitalCalls.length > 0);

      const statusBadge = wrapper.find('[data-testid="status-badge"]');
      expect(statusBadge.exists()).toBe(true);
      expect(statusBadge.classes()).toContain('status-pending');
    });
  });

  describe('filtering and search', () => {
    beforeEach(() => {
      const mockCapitalCalls = [
        TestHelper.generateMockCapitalCall(),
        {
          ...TestHelper.generateMockCapitalCall(),
          id: 'call-456',
          fund: { name: 'Different Fund', currency: 'EUR' },
          status: 'PAID',
        },
      ];

      mockApiService.getCapitalCalls.mockResolvedValue({ data: mockCapitalCalls });
      wrapper = TestHelper.createWrapper(CapitalActivityView);
    });

    it('should filter by fund name', async () => {
      await TestHelper.waitFor(() => wrapper.vm.capitalCalls.length > 0);

      const searchInput = wrapper.find('[data-testid="search-input"]');
      await searchInput.setValue('Test Fund');

      const visibleCalls = wrapper.findAll('[data-testid="capital-call-card"]:not([style*="display: none"])');
      expect(visibleCalls).toHaveLength(1);
    });

    it('should filter by date range', async () => {
      await TestHelper.waitFor(() => wrapper.vm.capitalCalls.length > 0);

      const dateFromInput = wrapper.find('[data-testid="date-from"]');
      const dateToInput = wrapper.find('[data-testid="date-to"]');

      await dateFromInput.setValue('2024-01-01');
      await dateToInput.setValue('2024-01-31');

      const visibleCalls = wrapper.findAll('[data-testid="capital-call-card"]:not([style*="display: none"])');
      expect(visibleCalls.length).toBeGreaterThan(0);
    });

    it('should clear filters', async () => {
      await TestHelper.waitFor(() => wrapper.vm.capitalCalls.length > 0);

      const searchInput = wrapper.find('[data-testid="search-input"]');
      await searchInput.setValue('Test Fund');

      const clearButton = wrapper.find('[data-testid="clear-filters"]');
      await clearButton.trigger('click');

      expect(searchInput.element.value).toBe('');

      const visibleCalls = wrapper.findAll('[data-testid="capital-call-card"]:not([style*="display: none"])');
      expect(visibleCalls).toHaveLength(2);
    });
  });

  describe('accessibility', () => {
    beforeEach(() => {
      wrapper = TestHelper.createWrapper(CapitalActivityView);
    });

    it('should have proper ARIA labels', () => {
      expect(wrapper.find('[aria-label="Capital activity navigation"]').exists()).toBe(true);
      expect(wrapper.find('[aria-label="Capital calls list"]').exists()).toBe(true);
    });

    it('should support keyboard navigation between tabs', async () => {
      const tabs = wrapper.findAll('[role="tab"]');
      expect(tabs.length).toBe(3);

      for (const tab of tabs) {
        expect(tab.attributes('tabindex')).toBe('0');
        expect(tab.attributes('aria-selected')).toBeDefined();
      }
    });

    it('should announce tab changes to screen readers', async () => {
      const distributionsTab = wrapper.find(`[data-testid="${testIds.distributionsTab}"]`);
      await distributionsTab.trigger('click');

      expect(distributionsTab.attributes('aria-selected')).toBe('true');
      expect(wrapper.find(`[data-testid="${testIds.capitalCallsTab}"]`).attributes('aria-selected')).toBe('false');
    });

    it('should have descriptive button labels', async () => {
      mockApiService.getCapitalCalls.mockResolvedValue({
        data: [TestHelper.generateMockCapitalCall()]
      });

      await TestHelper.waitFor(() => wrapper.vm.capitalCalls.length > 0);

      const payButton = wrapper.find('[data-testid="pay-button"]');
      expect(payButton.attributes('aria-label')).toContain('Pay capital call');
    });
  });

  describe('responsive design', () => {
    it('should adapt layout for mobile screens', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 480,
      });

      wrapper = TestHelper.createWrapper(CapitalActivityView);

      await wrapper.vm.$nextTick();

      expect(wrapper.find('.mobile-layout').exists()).toBe(true);
    });

    it('should show desktop layout on large screens', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      wrapper = TestHelper.createWrapper(CapitalActivityView);

      await wrapper.vm.$nextTick();

      expect(wrapper.find('.desktop-layout').exists()).toBe(true);
    });
  });
});