import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type {
  Investment,
  InvestmentSummary,
  Fund,
  CapitalCall,
  Distribution,
  Document
} from '@/types/investment';

// Mock the axios client from useApi - must be defined before vi.mock for hoisting
vi.mock('@/composables/useApi', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}));

import { apiClient } from '../api';
import { apiClient as mockAxiosClient } from '@/composables/useApi';

describe('apiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('auth endpoints', () => {
    describe('login', () => {
      it('should login successfully with wrapped response', async () => {
        const loginData = { email: 'test@example.com', password: 'password123' };
        const mockResponse = {
          data: {
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
            user: { id: '1', email: 'test@example.com' },
            expiresIn: 3600
          }
        };
        mockAxiosClient.post.mockResolvedValue(mockResponse);

        const result = await apiClient.auth.login(loginData);

        expect(mockAxiosClient.post).toHaveBeenCalledWith('/auth/login', loginData);
        expect(result).toEqual(mockResponse.data);
      });

      it('should login successfully with unwrapped response', async () => {
        const loginData = { email: 'test@example.com', password: 'password123' };
        const mockResponse = {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          user: { id: '1', email: 'test@example.com' },
          expiresIn: 3600
        };
        mockAxiosClient.post.mockResolvedValue(mockResponse);

        const result = await apiClient.auth.login(loginData);

        expect(result).toEqual(mockResponse);
      });
    });

    describe('register', () => {
      it('should register successfully', async () => {
        const registerData = {
          email: 'new@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe'
        };
        const mockResponse = {
          data: {
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
            user: { id: '1', email: 'new@example.com' },
            expiresIn: 3600
          }
        };
        mockAxiosClient.post.mockResolvedValue(mockResponse);

        const result = await apiClient.auth.register(registerData);

        expect(mockAxiosClient.post).toHaveBeenCalledWith('/auth/register', registerData);
        expect(result).toEqual(mockResponse.data);
      });
    });

    describe('logout', () => {
      it('should logout successfully', async () => {
        const logoutData = { refreshToken: 'refresh-token' };
        const mockResponse = { data: { message: 'Logged out successfully' } };
        mockAxiosClient.post.mockResolvedValue(mockResponse);

        const result = await apiClient.auth.logout(logoutData);

        expect(mockAxiosClient.post).toHaveBeenCalledWith('/auth/logout', logoutData);
        expect(result).toEqual(mockResponse.data);
      });
    });

    describe('refreshToken', () => {
      it('should refresh token successfully', async () => {
        const refreshData = { refreshToken: 'old-refresh-token' };
        const mockResponse = {
          data: {
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
            user: { id: '1' },
            expiresIn: 3600
          }
        };
        mockAxiosClient.post.mockResolvedValue(mockResponse);

        const result = await apiClient.auth.refreshToken(refreshData);

        expect(mockAxiosClient.post).toHaveBeenCalledWith('/auth/refresh', refreshData);
        expect(result).toEqual(mockResponse.data);
      });
    });

    describe('getProfile', () => {
      it('should get user profile successfully', async () => {
        const mockProfile = { id: '1', email: 'user@example.com', firstName: 'John' };
        const mockResponse = { data: mockProfile };
        mockAxiosClient.get.mockResolvedValue(mockResponse);

        const result = await apiClient.auth.getProfile();

        expect(mockAxiosClient.get).toHaveBeenCalledWith('/auth/profile');
        expect(result).toEqual(mockProfile);
      });
    });
  });

  describe('investments endpoints', () => {
    const mockInvestment: Investment = {
      id: 'inv-1',
      fundId: 'fund-1',
      investorId: 'investor-1',
      commitmentAmount: 100000,
      drawdownAmount: 50000,
      distributionAmount: 10000,
      currentValue: 60000,
      status: 'active',
      investmentDate: '2025-01-01',
      createdAt: '2025-01-01T10:00:00Z',
      updatedAt: '2025-01-01T10:00:00Z'
    };

    describe('getAll', () => {
      it('should get all investments', async () => {
        const mockInvestments = [mockInvestment];
        const mockResponse = { data: mockInvestments };
        mockAxiosClient.get.mockResolvedValue(mockResponse);

        const result = await apiClient.investments.getAll();

        expect(mockAxiosClient.get).toHaveBeenCalledWith('/investments');
        expect(result).toEqual(mockInvestments);
      });
    });

    describe('getById', () => {
      it('should get investment by id', async () => {
        const mockResponse = { data: mockInvestment };
        mockAxiosClient.get.mockResolvedValue(mockResponse);

        const result = await apiClient.investments.getById('inv-1');

        expect(mockAxiosClient.get).toHaveBeenCalledWith('/investments/inv-1');
        expect(result).toEqual(mockInvestment);
      });
    });

    describe('create', () => {
      it('should create investment', async () => {
        const createData = { fundId: 'fund-1', commitmentAmount: 100000 };
        const mockResponse = { data: mockInvestment };
        mockAxiosClient.post.mockResolvedValue(mockResponse);

        const result = await apiClient.investments.create(createData);

        expect(mockAxiosClient.post).toHaveBeenCalledWith('/investments', createData);
        expect(result).toEqual(mockInvestment);
      });
    });

    describe('update', () => {
      it('should update investment', async () => {
        const updateData = { commitmentAmount: 150000 };
        const updatedInvestment = { ...mockInvestment, commitmentAmount: 150000 };
        const mockResponse = { data: updatedInvestment };
        mockAxiosClient.put.mockResolvedValue(mockResponse);

        const result = await apiClient.investments.update('inv-1', updateData);

        expect(mockAxiosClient.put).toHaveBeenCalledWith('/investments/inv-1', updateData);
        expect(result).toEqual(updatedInvestment);
      });
    });

    describe('delete', () => {
      it('should delete investment', async () => {
        mockAxiosClient.delete.mockResolvedValue({});

        await apiClient.investments.delete('inv-1');

        expect(mockAxiosClient.delete).toHaveBeenCalledWith('/investments/inv-1');
      });
    });

    describe('getSummary', () => {
      it('should get investment summary', async () => {
        const mockSummary: InvestmentSummary = {
          totalInvestments: 5,
          totalCommitment: 500000,
          totalDrawdown: 300000,
          totalDistribution: 50000,
          totalCurrentValue: 350000
        };
        const mockResponse = { data: mockSummary };
        mockAxiosClient.get.mockResolvedValue(mockResponse);

        const result = await apiClient.investments.getSummary();

        expect(mockAxiosClient.get).toHaveBeenCalledWith('/investments/summary');
        expect(result).toEqual(mockSummary);
      });
    });

    describe('getPerformance', () => {
      it('should get investment performance', async () => {
        const mockPerformance = {
          investment: mockInvestment,
          valuations: [{ date: '2025-01-01', value: 60000 }],
          performance: {
            irr: 12.5,
            multiple: 1.2,
            totalReturn: 20000,
            unrealizedGain: 10000,
            realizedGain: 10000
          }
        };
        const mockResponse = { data: mockPerformance };
        mockAxiosClient.get.mockResolvedValue(mockResponse);

        const result = await apiClient.investments.getPerformance('inv-1');

        expect(mockAxiosClient.get).toHaveBeenCalledWith('/investments/inv-1/performance');
        expect(result).toEqual(mockPerformance);
      });
    });
  });

  describe('funds endpoints', () => {
    const mockFund: Fund = {
      id: 'fund-1',
      name: 'Test Fund',
      type: 'venture',
      vintage: 2024,
      size: 10000000,
      currency: 'USD',
      status: 'active',
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T10:00:00Z'
    };

    describe('getAll', () => {
      it('should get all funds', async () => {
        const mockFunds = [mockFund];
        const mockResponse = { data: mockFunds };
        mockAxiosClient.get.mockResolvedValue(mockResponse);

        const result = await apiClient.funds.getAll();

        expect(mockAxiosClient.get).toHaveBeenCalledWith('/funds');
        expect(result).toEqual(mockFunds);
      });
    });

    describe('getById', () => {
      it('should get fund by id', async () => {
        const mockResponse = { data: mockFund };
        mockAxiosClient.get.mockResolvedValue(mockResponse);

        const result = await apiClient.funds.getById('fund-1');

        expect(mockAxiosClient.get).toHaveBeenCalledWith('/funds/fund-1');
        expect(result).toEqual(mockFund);
      });
    });

    describe('getUserFunds', () => {
      it('should get user funds', async () => {
        const mockFunds = [mockFund];
        const mockResponse = { data: mockFunds };
        mockAxiosClient.get.mockResolvedValue(mockResponse);

        const result = await apiClient.funds.getUserFunds();

        expect(mockAxiosClient.get).toHaveBeenCalledWith('/funds/my-funds');
        expect(result).toEqual(mockFunds);
      });
    });

    describe('getByType', () => {
      it('should get funds by type', async () => {
        const mockFunds = [mockFund];
        const mockResponse = { data: mockFunds };
        mockAxiosClient.get.mockResolvedValue(mockResponse);

        const result = await apiClient.funds.getByType('venture');

        expect(mockAxiosClient.get).toHaveBeenCalledWith('/funds/by-type', { params: { type: 'venture' } });
        expect(result).toEqual(mockFunds);
      });
    });

    describe('getByVintage', () => {
      it('should get funds by vintage', async () => {
        const mockFunds = [mockFund];
        const mockResponse = { data: mockFunds };
        mockAxiosClient.get.mockResolvedValue(mockResponse);

        const result = await apiClient.funds.getByVintage(2024);

        expect(mockAxiosClient.get).toHaveBeenCalledWith('/funds/by-vintage', { params: { vintage: 2024 } });
        expect(result).toEqual(mockFunds);
      });
    });

    describe('getSummary', () => {
      it('should get fund summary', async () => {
        const mockSummary = {
          fund: mockFund,
          investorCount: 10,
          totalInvestorCommitment: 5000000,
          totalDrawn: 3000000,
          totalDistributed: 500000,
          currentNav: 3500000,
          irr: 15.5,
          multiple: 1.17,
          latestValuationDate: '2025-01-01'
        };
        const mockResponse = { data: mockSummary };
        mockAxiosClient.get.mockResolvedValue(mockResponse);

        const result = await apiClient.funds.getSummary('fund-1');

        expect(mockAxiosClient.get).toHaveBeenCalledWith('/funds/fund-1/summary');
        expect(result).toEqual(mockSummary);
      });
    });

    describe('getPerformance', () => {
      it('should get fund performance', async () => {
        const mockPerformance = {
          fund: mockFund,
          valuations: [{ date: '2025-01-01', value: 3500000 }],
          capitalCalls: [],
          distributions: [],
          performance: {
            currentNav: 3500000,
            irr: 15.5,
            multiple: 1.17,
            totalCommitted: 5000000,
            totalDrawn: 3000000,
            totalDistributed: 500000,
            unrealizedValue: 3000000,
            realizedValue: 500000
          }
        };
        const mockResponse = { data: mockPerformance };
        mockAxiosClient.get.mockResolvedValue(mockResponse);

        const result = await apiClient.funds.getPerformance('fund-1');

        expect(mockAxiosClient.get).toHaveBeenCalledWith('/funds/fund-1/performance');
        expect(result).toEqual(mockPerformance);
      });
    });
  });

  describe('capitalActivity endpoints', () => {
    const mockCapitalCall: CapitalCall = {
      id: 'cc-1',
      fundId: 'fund-1',
      callDate: '2025-01-01',
      dueDate: '2025-02-01',
      amount: 100000,
      purpose: 'Investment',
      status: 'pending',
      createdAt: '2025-01-01T10:00:00Z',
      updatedAt: '2025-01-01T10:00:00Z'
    };

    const mockDistribution: Distribution = {
      id: 'dist-1',
      fundId: 'fund-1',
      distributionDate: '2025-01-01',
      amount: 50000,
      type: 'dividend',
      status: 'completed',
      createdAt: '2025-01-01T10:00:00Z',
      updatedAt: '2025-01-01T10:00:00Z'
    };

    describe('getCapitalCalls', () => {
      it('should get all capital calls', async () => {
        const mockCapitalCalls = [mockCapitalCall];
        const mockResponse = { data: mockCapitalCalls };
        mockAxiosClient.get.mockResolvedValue(mockResponse);

        const result = await apiClient.capitalActivity.getCapitalCalls();

        expect(mockAxiosClient.get).toHaveBeenCalledWith('/capital-calls');
        expect(result).toEqual(mockCapitalCalls);
      });
    });

    describe('getDistributions', () => {
      it('should get all distributions', async () => {
        const mockDistributions = [mockDistribution];
        const mockResponse = { data: mockDistributions };
        mockAxiosClient.get.mockResolvedValue(mockResponse);

        const result = await apiClient.capitalActivity.getDistributions();

        expect(mockAxiosClient.get).toHaveBeenCalledWith('/distributions');
        expect(result).toEqual(mockDistributions);
      });
    });
  });

  describe('documents endpoints', () => {
    const mockDocument: Document = {
      id: 'doc-1',
      fundId: 'fund-1',
      name: 'Q1 Report',
      type: 'report',
      url: 'https://example.com/doc.pdf',
      size: 1024,
      uploadedAt: '2025-01-01T10:00:00Z',
      createdAt: '2025-01-01T10:00:00Z',
      updatedAt: '2025-01-01T10:00:00Z'
    };

    describe('getAll', () => {
      it('should get all documents without fundId filter', async () => {
        const mockDocuments = [mockDocument];
        const mockResponse = { data: mockDocuments };
        mockAxiosClient.get.mockResolvedValue(mockResponse);

        const result = await apiClient.documents.getAll();

        expect(mockAxiosClient.get).toHaveBeenCalledWith('/documents', undefined);
        expect(result).toEqual(mockDocuments);
      });

      it('should get all documents with fundId filter', async () => {
        const mockDocuments = [mockDocument];
        const mockResponse = { data: mockDocuments };
        mockAxiosClient.get.mockResolvedValue(mockResponse);

        const result = await apiClient.documents.getAll('fund-1');

        expect(mockAxiosClient.get).toHaveBeenCalledWith('/documents', { params: { fundId: 'fund-1' } });
        expect(result).toEqual(mockDocuments);
      });
    });

    describe('getById', () => {
      it('should get document by id', async () => {
        const mockResponse = { data: mockDocument };
        mockAxiosClient.get.mockResolvedValue(mockResponse);

        const result = await apiClient.documents.getById('doc-1');

        expect(mockAxiosClient.get).toHaveBeenCalledWith('/documents/doc-1');
        expect(result).toEqual(mockDocument);
      });
    });
  });
});
