import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import DashboardView from './DashboardView.vue';
import { TestHelper, testIds } from '../test/utils/test-helpers';
import { useAuthStore } from '../stores/auth';
import { useInvestmentStore } from '../stores/investments';
import { createPinia, setActivePinia } from 'pinia';

// Mock the stores
vi.mock('../stores/auth');
vi.mock('../stores/investments');

const mockAuthStore = {
  user: TestHelper.generateMockUser(),
  isAuthenticated: true,
};

const mockInvestmentStore = {
  investments: [TestHelper.generateMockInvestment()],
  summary: TestHelper.generateMockInvestmentSummary(),
  isLoading: false,
  error: null,
  fetchInvestments: vi.fn(),
  fetchInvestmentSummary: vi.fn(),
};

describe('DashboardView', () => {
  let wrapper: any;

  beforeEach(() => {
    setActivePinia(createPinia());

    vi.mocked(useAuthStore).mockReturnValue(mockAuthStore as any);
    vi.mocked(useInvestmentStore).mockReturnValue(mockInvestmentStore as any);

    vi.clearAllMocks();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('component rendering', () => {
    it('should render dashboard correctly when authenticated', () => {
      wrapper = TestHelper.createWrapper(DashboardView);

      expect(wrapper.find(`[data-testid="${testIds.dashboardTitle}"]`).text()).toContain('Dashboard');
      expect(wrapper.find(`[data-testid="${testIds.portfolioMetrics}"]`).exists()).toBe(true);
      expect(wrapper.find(`[data-testid="${testIds.recentActivity}"]`).exists()).toBe(true);
    });

    it('should display user welcome message', () => {
      wrapper = TestHelper.createWrapper(DashboardView);

      const welcomeMessage = wrapper.find('.welcome-message');
      expect(welcomeMessage.text()).toContain('Welcome back, John');
    });

    it('should display portfolio metrics when summary is available', async () => {
      wrapper = TestHelper.createWrapper(DashboardView);

      await wrapper.vm.$nextTick();

      const metricsSection = wrapper.find(`[data-testid="${testIds.portfolioMetrics}"]`);
      expect(metricsSection.exists()).toBe(true);

      // Check for specific metric values
      expect(metricsSection.text()).toContain('$5,000,000'); // Total committed
      expect(metricsSection.text()).toContain('$6,000,000'); // Total current value
      expect(metricsSection.text()).toContain('13.5%'); // IRR
    });

    it('should display recent investments', async () => {
      wrapper = TestHelper.createWrapper(DashboardView);

      await wrapper.vm.$nextTick();

      const recentActivity = wrapper.find(`[data-testid="${testIds.recentActivity}"]`);
      expect(recentActivity.exists()).toBe(true);
      expect(recentActivity.text()).toContain('Test Fund');
    });

    it('should display alerts panel', () => {
      wrapper = TestHelper.createWrapper(DashboardView);

      const alertsPanel = wrapper.find(`[data-testid="${testIds.alertsPanel}"]`);
      expect(alertsPanel.exists()).toBe(true);
    });
  });

  describe('loading states', () => {
    it('should show loading spinner when data is loading', async () => {
      const loadingMockStore = {
        ...mockInvestmentStore,
        isLoading: true,
      };

      vi.mocked(useInvestmentStore).mockReturnValue(loadingMockStore as any);

      wrapper = TestHelper.createWrapper(DashboardView);

      expect(wrapper.find(`[data-testid="${testIds.loadingSpinner}"]`).exists()).toBe(true);
    });

    it('should hide loading spinner when data is loaded', async () => {
      wrapper = TestHelper.createWrapper(DashboardView);

      await wrapper.vm.$nextTick();

      expect(wrapper.find(`[data-testid="${testIds.loadingSpinner}"]`).exists()).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should display error message when there is an error', async () => {
      const errorMockStore = {
        ...mockInvestmentStore,
        error: 'Failed to load dashboard data',
      };

      vi.mocked(useInvestmentStore).mockReturnValue(errorMockStore as any);

      wrapper = TestHelper.createWrapper(DashboardView);

      await wrapper.vm.$nextTick();

      expect(wrapper.find(`[data-testid="${testIds.errorMessage}"]`).text()).toContain('Failed to load dashboard data');
    });

    it('should show retry button when there is an error', async () => {
      const errorMockStore = {
        ...mockInvestmentStore,
        error: 'Network error',
      };

      vi.mocked(useInvestmentStore).mockReturnValue(errorMockStore as any);

      wrapper = TestHelper.createWrapper(DashboardView);

      await wrapper.vm.$nextTick();

      const retryButton = wrapper.find('[data-testid="retry-button"]');
      expect(retryButton.exists()).toBe(true);
      expect(retryButton.text()).toContain('Retry');
    });

    it('should refetch data when retry button is clicked', async () => {
      const errorMockStore = {
        ...mockInvestmentStore,
        error: 'Network error',
      };

      vi.mocked(useInvestmentStore).mockReturnValue(errorMockStore as any);

      wrapper = TestHelper.createWrapper(DashboardView);

      await wrapper.vm.$nextTick();

      const retryButton = wrapper.find('[data-testid="retry-button"]');
      await retryButton.trigger('click');

      expect(errorMockStore.fetchInvestments).toHaveBeenCalled();
      expect(errorMockStore.fetchInvestmentSummary).toHaveBeenCalled();
    });
  });

  describe('empty states', () => {
    it('should show empty state when user has no investments', async () => {
      const emptyMockStore = {
        ...mockInvestmentStore,
        investments: [],
        summary: {
          ...TestHelper.generateMockInvestmentSummary(),
          totalInvestments: 0,
        },
      };

      vi.mocked(useInvestmentStore).mockReturnValue(emptyMockStore as any);

      wrapper = TestHelper.createWrapper(DashboardView);

      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="empty-investments"]').exists()).toBe(true);
      expect(wrapper.text()).toContain('No investments found');
    });

    it('should show call-to-action for new users', async () => {
      const emptyMockStore = {
        ...mockInvestmentStore,
        investments: [],
        summary: {
          ...TestHelper.generateMockInvestmentSummary(),
          totalInvestments: 0,
        },
      };

      vi.mocked(useInvestmentStore).mockReturnValue(emptyMockStore as any);

      wrapper = TestHelper.createWrapper(DashboardView);

      await wrapper.vm.$nextTick();

      const ctaButton = wrapper.find('[data-testid="cta-explore-funds"]');
      expect(ctaButton.exists()).toBe(true);
      expect(ctaButton.text()).toContain('Explore Available Funds');
    });
  });

  describe('data fetching', () => {
    it('should fetch investments and summary on mount', () => {
      wrapper = TestHelper.createWrapper(DashboardView);

      expect(mockInvestmentStore.fetchInvestments).toHaveBeenCalled();
      expect(mockInvestmentStore.fetchInvestmentSummary).toHaveBeenCalled();
    });

    it('should not fetch data if user is not authenticated', () => {
      const unauthenticatedMockStore = {
        ...mockAuthStore,
        isAuthenticated: false,
        user: null,
      };

      vi.mocked(useAuthStore).mockReturnValue(unauthenticatedMockStore as any);

      wrapper = TestHelper.createWrapper(DashboardView);

      expect(mockInvestmentStore.fetchInvestments).not.toHaveBeenCalled();
    });
  });

  describe('portfolio metrics calculations', () => {
    it('should display correct performance percentages', async () => {
      wrapper = TestHelper.createWrapper(DashboardView);

      await wrapper.vm.$nextTick();

      const irrDisplay = wrapper.find('[data-testid="irr-display"]');
      const multipleDisplay = wrapper.find('[data-testid="multiple-display"]');

      expect(irrDisplay.text()).toContain('13.50%');
      expect(multipleDisplay.text()).toContain('1.22x');
    });

    it('should format currency values correctly', async () => {
      wrapper = TestHelper.createWrapper(DashboardView);

      await wrapper.vm.$nextTick();

      const totalCommitted = wrapper.find('[data-testid="total-committed"]');
      const totalValue = wrapper.find('[data-testid="total-value"]');

      expect(totalCommitted.text()).toMatch(/\$5,000,000/);
      expect(totalValue.text()).toMatch(/\$6,000,000/);
    });

    it('should handle zero or null values gracefully', async () => {
      const zeroSummary = {
        ...TestHelper.generateMockInvestmentSummary(),
        totalCommitted: 0,
        totalCurrentValue: 0,
        overallIrr: 0,
        overallMultiple: 0,
      };

      const zeroMockStore = {
        ...mockInvestmentStore,
        summary: zeroSummary,
      };

      vi.mocked(useInvestmentStore).mockReturnValue(zeroMockStore as any);

      wrapper = TestHelper.createWrapper(DashboardView);

      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="total-committed"]').text()).toContain('$0');
      expect(wrapper.find('[data-testid="irr-display"]').text()).toContain('0.00%');
    });
  });

  describe('responsive design', () => {
    it('should apply mobile classes on small screens', async () => {
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 480,
      });

      wrapper = TestHelper.createWrapper(DashboardView);

      await wrapper.vm.$nextTick();

      expect(wrapper.find('.dashboard-mobile').exists()).toBe(true);
    });

    it('should apply desktop layout on large screens', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      wrapper = TestHelper.createWrapper(DashboardView);

      await wrapper.vm.$nextTick();

      expect(wrapper.find('.dashboard-desktop').exists()).toBe(true);
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      wrapper = TestHelper.createWrapper(DashboardView);

      expect(wrapper.find('[aria-label="Portfolio overview"]').exists()).toBe(true);
      expect(wrapper.find('[aria-label="Recent investment activity"]').exists()).toBe(true);
    });

    it('should have proper heading hierarchy', () => {
      wrapper = TestHelper.createWrapper(DashboardView);

      const h1 = wrapper.find('h1');
      const h2s = wrapper.findAll('h2');

      expect(h1.exists()).toBe(true);
      expect(h2s.length).toBeGreaterThan(0);
    });

    it('should be keyboard navigable', async () => {
      wrapper = TestHelper.createWrapper(DashboardView);

      const focusableElements = wrapper.findAll('button, a, [tabindex]');
      expect(focusableElements.length).toBeGreaterThan(0);

      for (const element of focusableElements) {
        expect(element.attributes('tabindex')).not.toBe('-1');
      }
    });
  });

  describe('real-time updates', () => {
    it('should update when investment data changes', async () => {
      wrapper = TestHelper.createWrapper(DashboardView);

      await wrapper.vm.$nextTick();

      // Simulate store update
      const updatedInvestment = {
        ...TestHelper.generateMockInvestment(),
        currentValue: 1500000,
      };

      mockInvestmentStore.investments = [updatedInvestment];

      await wrapper.vm.$nextTick();

      // Check that the component reflects the updated data
      expect(wrapper.text()).toContain('$1,500,000');
    });
  });
});