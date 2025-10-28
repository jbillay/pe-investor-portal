import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestHelper } from '../test/utils/test-helpers';

// Mock the underlying axios client from composables/useApi
vi.mock('@/composables/useApi', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn()
  }
}));

// Import after mock is set up
const { apiClient } = await import('./api')
const { apiClient: mockAxiosInstance } = await import('@/composables/useApi');

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication endpoints', () => {
    it('should login successfully', async () => {
      const loginData = { email: 'test@example.com', password: 'password' };
      const responseData = {
        accessToken: 'token',
        refreshToken: 'refresh-token',
        user: TestHelper.generateMockUser(),
        expiresIn: 900,
      };

      mockAxiosInstance.post.mockResolvedValueOnce({ data: responseData });

      const result = await apiClient.auth.login(loginData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/login', loginData);
      expect(result).toEqual(responseData);
    });

    it('should register successfully', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'password',
        firstName: 'John',
        lastName: 'Doe',
      };
      const responseData = {
        accessToken: 'token',
        refreshToken: 'refresh-token',
        user: TestHelper.generateMockUser(),
        expiresIn: 900,
      };

      mockAxiosInstance.post.mockResolvedValueOnce({ data: responseData });

      const result = await apiClient.auth.register(registerData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/register', registerData);
      expect(result).toEqual(responseData);
    });

    it('should logout successfully', async () => {
      const logoutData = { refreshToken: 'refresh-token' };

      mockAxiosInstance.post.mockResolvedValueOnce({ data: { message: 'Logged out successfully' } });

      const result = await apiClient.auth.logout(logoutData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/logout', logoutData);
      expect(result).toEqual({ message: 'Logged out successfully' });
    });

    it('should refresh token successfully', async () => {
      const refreshData = { refreshToken: 'refresh-token' };
      const responseData = {
        accessToken: 'new-token',
        refreshToken: 'new-refresh-token',
        user: TestHelper.generateMockUser(),
        expiresIn: 900,
      };

      mockAxiosInstance.post.mockResolvedValueOnce({ data: responseData });

      const result = await apiClient.auth.refreshToken(refreshData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/refresh', refreshData);
      expect(result).toEqual(responseData);
    });

    it('should get user profile successfully', async () => {
      const userData = TestHelper.generateMockUser();

      mockAxiosInstance.get.mockResolvedValueOnce({ data: userData });

      const result = await apiClient.auth.getProfile();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/auth/profile');
      expect(result).toEqual(userData);
    });
  });

  describe('Investment endpoints', () => {
    it('should get investments successfully', async () => {
      const investments = [TestHelper.generateMockInvestment()];

      mockAxiosInstance.get.mockResolvedValueOnce({ data: investments });

      const result = await apiClient.investments.getAll();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/investments');
      expect(result).toEqual(investments);
    });

    it('should get investment by ID successfully', async () => {
      const investment = TestHelper.generateMockInvestment();
      const investmentId = 'investment-123';

      mockAxiosInstance.get.mockResolvedValueOnce({ data: investment });

      const result = await apiClient.investments.getById(investmentId);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/investments/${investmentId}`);
      expect(result).toEqual(investment);
    });

    it('should create investment successfully', async () => {
      const investmentData = {
        fundId: 'fund-123',
        commitmentAmount: 1000000,
        investmentDate: '2024-01-15',
        drawnAmount: 0,
        distributedAmount: 0,
        currentValue: 1000000,
        status: 'ACTIVE',
      };
      const createdInvestment = TestHelper.generateMockInvestment();

      mockAxiosInstance.post.mockResolvedValueOnce({ data: createdInvestment });

      const result = await apiClient.investments.create(investmentData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/investments', investmentData);
      expect(result).toEqual(createdInvestment);
    });

    it('should update investment successfully', async () => {
      const investmentId = 'investment-123';
      const updateData = { drawnAmount: 500000, currentValue: 1500000 };
      const updatedInvestment = { ...TestHelper.generateMockInvestment(), ...updateData };

      mockAxiosInstance.put.mockResolvedValueOnce({ data: updatedInvestment });

      const result = await apiClient.investments.update(investmentId, updateData);

      expect(mockAxiosInstance.put).toHaveBeenCalledWith(`/investments/${investmentId}`, updateData);
      expect(result).toEqual(updatedInvestment);
    });

    it('should delete investment successfully', async () => {
      const investmentId = 'investment-123';

      mockAxiosInstance.delete.mockResolvedValueOnce({ data: null });

      await apiClient.investments.delete(investmentId);

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith(`/investments/${investmentId}`);
    });

    it('should get investment summary successfully', async () => {
      const summary = TestHelper.generateMockInvestmentSummary();

      mockAxiosInstance.get.mockResolvedValueOnce({ data: summary });

      const result = await apiClient.investments.getSummary();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/investments/summary');
      expect(result).toEqual(summary);
    });

    it('should get investment performance successfully', async () => {
      const investmentId = 'investment-123';
      const performance = TestHelper.generateMockPerformanceData();

      mockAxiosInstance.get.mockResolvedValueOnce({ data: performance });

      const result = await apiClient.investments.getPerformance(investmentId);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/investments/${investmentId}/performance`);
      expect(result).toEqual(performance);
    });
  });

  describe('Fund endpoints', () => {
    it('should get all funds successfully', async () => {
      const funds = [TestHelper.generateMockFund()];

      mockAxiosInstance.get.mockResolvedValueOnce({ data: funds });

      const result = await apiClient.funds.getAll();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/funds');
      expect(result).toEqual(funds);
    });

    it('should get fund by ID successfully', async () => {
      const fund = TestHelper.generateMockFund();
      const fundId = 'fund-123';

      mockAxiosInstance.get.mockResolvedValueOnce({ data: fund });

      const result = await apiClient.funds.getById(fundId);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/funds/${fundId}`);
      expect(result).toEqual(fund);
    });

    it('should get user funds successfully', async () => {
      const funds = [TestHelper.generateMockFund()];

      mockAxiosInstance.get.mockResolvedValueOnce({ data: funds });

      const result = await apiClient.funds.getUserFunds();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/funds/my-funds');
      expect(result).toEqual(funds);
    });

    it('should get funds by type successfully', async () => {
      const funds = [TestHelper.generateMockFund()];
      const fundType = 'PE';

      mockAxiosInstance.get.mockResolvedValueOnce({ data: funds });

      const result = await apiClient.funds.getByType(fundType);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/funds/by-type', { params: { type: fundType } });
      expect(result).toEqual(funds);
    });

    it('should get funds by vintage successfully', async () => {
      const funds = [TestHelper.generateMockFund()];
      const vintage = 2024;

      mockAxiosInstance.get.mockResolvedValueOnce({ data: funds });

      const result = await apiClient.funds.getByVintage(vintage);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/funds/by-vintage', { params: { vintage } });
      expect(result).toEqual(funds);
    });

    it('should get fund summary successfully', async () => {
      const fundId = 'fund-123';
      const summary = {
        fund: TestHelper.generateMockFund(),
        investorCount: 10,
        totalInvestorCommitment: 50000000,
        totalDrawn: 12500000,
        totalDistributed: 2500000,
        currentNav: 60000000,
        irr: 0.15,
        multiple: 1.25,
        latestValuationDate: '2024-03-31',
      };

      mockAxiosInstance.get.mockResolvedValueOnce({ data: summary });

      const result = await apiClient.funds.getSummary(fundId);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/funds/${fundId}/summary`);
      expect(result).toEqual(summary);
    });

    it('should get fund performance successfully', async () => {
      const fundId = 'fund-123';
      const performance = {
        fund: TestHelper.generateMockFund(),
        valuations: [],
        capitalCalls: [],
        distributions: [],
        performance: {
          currentNav: 120000000,
          irr: 0.125,
          multiple: 1.2,
          totalCommitted: 85000000,
          totalDrawn: 25000000,
          totalDistributed: 5000000,
          unrealizedValue: 115000000,
          realizedValue: 5000000,
        },
      };

      mockAxiosInstance.get.mockResolvedValueOnce({ data: performance });

      const result = await apiClient.funds.getPerformance(fundId);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/funds/${fundId}/performance`);
      expect(result).toEqual(performance);
    });
  });

  describe('Capital Activity endpoints', () => {
    it('should get capital calls successfully', async () => {
      const capitalCalls = [TestHelper.generateMockCapitalCall()];

      mockAxiosInstance.get.mockResolvedValueOnce({ data: capitalCalls });

      const result = await apiClient.capitalActivity.getCapitalCalls();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/capital-calls');
      expect(result).toEqual(capitalCalls);
    });

    it('should get distributions successfully', async () => {
      const distributions = [TestHelper.generateMockDistribution()];

      mockAxiosInstance.get.mockResolvedValueOnce({ data: distributions });

      const result = await apiClient.capitalActivity.getDistributions();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/distributions');
      expect(result).toEqual(distributions);
    });
  });

  describe('Document endpoints', () => {
    it('should get documents successfully', async () => {
      const documents = [TestHelper.generateMockDocument()];
      const fundId = 'fund-123';

      mockAxiosInstance.get.mockResolvedValueOnce({ data: documents });

      const result = await apiClient.documents.getAll(fundId);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/documents', { params: { fundId } });
      expect(result).toEqual(documents);
    });

    it('should get document by ID successfully', async () => {
      const document = TestHelper.generateMockDocument();
      const documentId = 'doc-123';

      mockAxiosInstance.get.mockResolvedValueOnce({ data: document });

      const result = await apiClient.documents.getById(documentId);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/documents/${documentId}`);
      expect(result).toEqual(document);
    });
  });

  describe('Error handling', () => {
    it('should handle 401 authentication errors', async () => {
      const error = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
        },
      };

      mockAxiosInstance.get.mockRejectedValueOnce(error);

      await expect(apiClient.auth.getProfile()).rejects.toEqual(error);
    });

    it('should handle 404 not found errors', async () => {
      const error = {
        response: {
          status: 404,
          data: { message: 'Investment not found' },
        },
      };

      mockAxiosInstance.get.mockRejectedValueOnce(error);

      await expect(apiClient.investments.getById('nonexistent')).rejects.toEqual(error);
    });

    it('should handle 500 server errors', async () => {
      const error = {
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
      };

      mockAxiosInstance.get.mockRejectedValueOnce(error);

      await expect(apiClient.investments.getAll()).rejects.toEqual(error);
    });

    it('should handle network errors', async () => {
      const error = new Error('Network Error');

      mockAxiosInstance.get.mockRejectedValueOnce(error);

      await expect(apiClient.investments.getAll()).rejects.toEqual(error);
    });
  });

  describe('Request configuration', () => {
    it('should use the underlying axios client', () => {
      // The api client wraps the axios client from composables/useApi
      // Configuration is handled in the ApiClient class
      expect(apiClient).toBeDefined();
      expect(apiClient.auth).toBeDefined();
      expect(apiClient.investments).toBeDefined();
    });
  });
});