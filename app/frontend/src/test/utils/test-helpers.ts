import { mount, VueWrapper } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import { Component } from 'vue';
import { routes } from '../../router';

export interface TestWrapperOptions {
  props?: Record<string, any>;
  global?: {
    plugins?: any[];
    mocks?: Record<string, any>;
    stubs?: Record<string, any>;
  };
}

export class TestHelper {
  static createWrapper(component: Component, options: TestWrapperOptions = {}): VueWrapper<any> {
    const pinia = createPinia();
    const router = createRouter({
      history: createWebHistory(),
      routes,
    });

    const defaultGlobal = {
      plugins: [pinia, router],
      mocks: {
        $t: (key: string) => key, // Mock i18n
      },
      stubs: {
        'router-link': true,
        'router-view': true,
      },
    };

    return mount(component, {
      props: options.props,
      global: {
        ...defaultGlobal,
        ...options.global,
        plugins: [...(defaultGlobal.plugins || []), ...(options.global?.plugins || [])],
        mocks: { ...defaultGlobal.mocks, ...options.global?.mocks },
        stubs: { ...defaultGlobal.stubs, ...options.global?.stubs },
      },
    });
  }

  static mockApiResponse<T>(data: T, status = 200): Promise<{ data: T; status: number }> {
    return Promise.resolve({ data, status });
  }

  static mockApiError(message: string, status = 400): Promise<never> {
    return Promise.reject({
      response: {
        data: { message },
        status,
      },
    });
  }

  static generateMockUser() {
    return {
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      isActive: true,
      isVerified: true,
    };
  }

  static generateMockInvestment() {
    return {
      id: 'investment-123',
      userId: 'user-123',
      fundId: 'fund-123',
      commitmentAmount: 1000000,
      drawnAmount: 250000,
      distributedAmount: 50000,
      currentValue: 1200000,
      irr: 0.125,
      multiple: 1.2,
      status: 'ACTIVE',
      investmentDate: '2024-01-15',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      fund: {
        id: 'fund-123',
        name: 'Test Fund',
        fundType: 'PE',
        vintage: 2024,
        currency: 'USD',
        status: 'ACTIVE',
      },
    };
  }

  static generateMockFund() {
    return {
      id: 'fund-123',
      name: 'Test PE Fund',
      description: 'A test private equity fund',
      fundType: 'PE',
      vintage: 2024,
      targetSize: 100000000,
      commitedSize: 85000000,
      drawnSize: 25000000,
      currency: 'USD',
      status: 'ACTIVE',
      closeDate: '2024-01-15',
      finalClose: '2024-06-15',
      liquidationDate: '2034-01-15',
      managementFee: 0.02,
      carriedInterest: 0.20,
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
    };
  }

  static generateMockCapitalCall() {
    return {
      id: 'call-123',
      fundId: 'fund-123',
      callNumber: 1,
      callDate: '2024-01-15',
      dueDate: '2024-01-30',
      totalAmount: 5000000,
      purpose: 'Investment deployment',
      status: 'PENDING',
      fund: {
        name: 'Test Fund',
        currency: 'USD',
      },
      userAllocation: {
        amount: 100000,
        status: 'PENDING',
      },
    };
  }

  static generateMockDistribution() {
    return {
      id: 'dist-123',
      fundId: 'fund-123',
      distributionNumber: 1,
      recordDate: '2024-02-01',
      paymentDate: '2024-02-15',
      totalAmount: 2000000,
      distributionType: 'DIVIDEND',
      status: 'PAID',
      fund: {
        name: 'Test Fund',
        currency: 'USD',
      },
      userAllocation: {
        amount: 40000,
        status: 'PAID',
      },
    };
  }

  static generateMockDocument() {
    return {
      id: 'doc-123',
      fundId: 'fund-123',
      title: 'Fund Agreement',
      description: 'Primary fund agreement document',
      category: 'LEGAL',
      fileName: 'fund-agreement.pdf',
      fileSize: 2048000,
      mimeType: 'application/pdf',
      uploadDate: '2024-01-01T00:00:00Z',
      version: '1.0',
      isConfidential: true,
      fund: {
        name: 'Test Fund',
      },
    };
  }

  static generateMockAlert() {
    return {
      id: 'alert-123',
      type: 'INFO',
      priority: 'MEDIUM',
      title: 'New Document Available',
      message: 'A new quarterly report has been published for Test Fund.',
      isRead: false,
      createdAt: '2024-01-15T10:00:00Z',
      expiresAt: '2024-02-15T10:00:00Z',
      actionUrl: '/documents/doc-123',
      actionLabel: 'View Document',
    };
  }

  static generateMockInvestmentSummary() {
    return {
      totalInvestments: 3,
      totalCommitted: 5000000,
      totalDrawn: 1250000,
      totalDistributed: 250000,
      totalCurrentValue: 6000000,
      overallIrr: 0.135,
      overallMultiple: 1.22,
      unfundedCommitment: 3750000,
    };
  }

  static generateMockPerformanceData() {
    return {
      investment: this.generateMockInvestment(),
      valuations: [
        {
          id: 'val-1',
          valuationDate: '2024-01-01',
          totalValue: 1100000,
          irr: 0.10,
          multiple: 1.1,
        },
        {
          id: 'val-2',
          valuationDate: '2024-02-01',
          totalValue: 1200000,
          irr: 0.125,
          multiple: 1.2,
        },
      ],
      performance: {
        totalReturn: 1000000,
        totalReturnPercentage: 400,
        irr: 0.125,
        multiple: 1.2,
        unrealizedGain: 950000,
        realizedGain: 50000,
      },
    };
  }

  static waitFor(condition: () => boolean, timeout = 1000): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const check = () => {
        if (condition()) {
          resolve();
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('Timeout waiting for condition'));
        } else {
          setTimeout(check, 10);
        }
      };

      check();
    });
  }

  static async nextTick() {
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  static formatCurrency(amount: number, currency = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  }

  static formatPercentage(value: number, decimals = 2): string {
    return `${(value * 100).toFixed(decimals)}%`;
  }

  static formatDate(date: string | Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  }
}

export class MockApiClient {
  static createMockImplementation() {
    return {
      // Auth endpoints
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshToken: vi.fn(),
      getProfile: vi.fn(),

      // Investment endpoints
      getInvestments: vi.fn(),
      getInvestment: vi.fn(),
      createInvestment: vi.fn(),
      updateInvestment: vi.fn(),
      deleteInvestment: vi.fn(),
      getInvestmentSummary: vi.fn(),
      getInvestmentPerformance: vi.fn(),

      // Fund endpoints
      getFunds: vi.fn(),
      getFund: vi.fn(),
      getUserFunds: vi.fn(),
      getFundsByType: vi.fn(),
      getFundsByVintage: vi.fn(),
      getFundSummary: vi.fn(),
      getFundPerformance: vi.fn(),

      // Capital activity endpoints
      getCapitalCalls: vi.fn(),
      getDistributions: vi.fn(),

      // Document endpoints
      getDocuments: vi.fn(),
      getDocument: vi.fn(),
      uploadDocument: vi.fn(),
      deleteDocument: vi.fn(),

      // Alert endpoints
      getAlerts: vi.fn(),
      markAlertAsRead: vi.fn(),
      dismissAlert: vi.fn(),
    };
  }

  static setupSuccessfulResponses(mockApi: any) {
    mockApi.login.mockResolvedValue(TestHelper.mockApiResponse({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      user: TestHelper.generateMockUser(),
      expiresIn: 900,
    }));

    mockApi.getProfile.mockResolvedValue(TestHelper.mockApiResponse(TestHelper.generateMockUser()));

    mockApi.getInvestments.mockResolvedValue(TestHelper.mockApiResponse([TestHelper.generateMockInvestment()]));

    mockApi.getInvestmentSummary.mockResolvedValue(TestHelper.mockApiResponse(TestHelper.generateMockInvestmentSummary()));

    mockApi.getFunds.mockResolvedValue(TestHelper.mockApiResponse([TestHelper.generateMockFund()]));

    mockApi.getCapitalCalls.mockResolvedValue(TestHelper.mockApiResponse([TestHelper.generateMockCapitalCall()]));

    mockApi.getDistributions.mockResolvedValue(TestHelper.mockApiResponse([TestHelper.generateMockDistribution()]));

    mockApi.getDocuments.mockResolvedValue(TestHelper.mockApiResponse([TestHelper.generateMockDocument()]));

    mockApi.getAlerts.mockResolvedValue(TestHelper.mockApiResponse([TestHelper.generateMockAlert()]));
  }
}

export const testIds = {
  // Dashboard
  dashboardTitle: 'dashboard-title',
  portfolioMetrics: 'portfolio-metrics',
  recentActivity: 'recent-activity',
  alertsPanel: 'alerts-panel',

  // Investments
  investmentsList: 'investments-list',
  investmentCard: 'investment-card',
  investmentDetails: 'investment-details',

  // Capital Activity
  capitalCallsTab: 'capital-calls-tab',
  distributionsTab: 'distributions-tab',
  historyTab: 'history-tab',

  // Documents
  documentsGrid: 'documents-grid',
  documentCard: 'document-card',
  documentViewer: 'document-viewer',

  // Performance
  performanceChart: 'performance-chart',
  performanceMetrics: 'performance-metrics',

  // Common
  loadingSpinner: 'loading-spinner',
  errorMessage: 'error-message',
  successMessage: 'success-message',

  // Forms
  loginForm: 'login-form',
  emailInput: 'email-input',
  passwordInput: 'password-input',
  submitButton: 'submit-button',

  // Navigation
  navMenu: 'nav-menu',
  navItem: 'nav-item',
  userMenu: 'user-menu',
  logoutButton: 'logout-button',
};