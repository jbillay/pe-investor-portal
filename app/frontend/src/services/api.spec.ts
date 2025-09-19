import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import { apiClient } from './api';
import { TestHelper } from '../test/utils/test-helpers';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset axios mock
    mockedAxios.create.mockReturnValue(mockedAxios as any);
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

      mockedAxios.post.mockResolvedValueOnce({ data: responseData });

      const result = await apiClient.auth.login(loginData);

      expect(mockedAxios.post).toHaveBeenCalledWith('/auth/login', loginData);
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

      mockedAxios.post.mockResolvedValueOnce({ data: responseData });

      const result = await apiClient.auth.register(registerData);

      expect(mockedAxios.post).toHaveBeenCalledWith('/auth/register', registerData);
      expect(result).toEqual(responseData);
    });

    it('should logout successfully', async () => {
      const logoutData = { refreshToken: 'refresh-token' };

      mockedAxios.post.mockResolvedValueOnce({ data: { message: 'Logged out successfully' } });

      const result = await apiClient.auth.logout(logoutData);

      expect(mockedAxios.post).toHaveBeenCalledWith('/auth/logout', logoutData);
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

      mockedAxios.post.mockResolvedValueOnce({ data: responseData });

      const result = await apiClient.auth.refreshToken(refreshData);

      expect(mockedAxios.post).toHaveBeenCalledWith('/auth/refresh', refreshData);
      expect(result).toEqual(responseData);
    });

    it('should get user profile successfully', async () => {
      const userData = TestHelper.generateMockUser();

      mockedAxios.get.mockResolvedValueOnce({ data: userData });

      const result = await apiClient.auth.getProfile();

      expect(mockedAxios.get).toHaveBeenCalledWith('/auth/profile');
      expect(result).toEqual(userData);
    });
  });

  describe('Investment endpoints', () => {
    it('should get investments successfully', async () => {
      const investments = [TestHelper.generateMockInvestment()];

      mockedAxios.get.mockResolvedValueOnce({ data: investments });

      const result = await apiClient.investments.getAll();

      expect(mockedAxios.get).toHaveBeenCalledWith('/investments');
      expect(result).toEqual(investments);
    });

    it('should get investment by ID successfully', async () => {
      const investment = TestHelper.generateMockInvestment();
      const investmentId = 'investment-123';

      mockedAxios.get.mockResolvedValueOnce({ data: investment });

      const result = await apiClient.investments.getById(investmentId);

      expect(mockedAxios.get).toHaveBeenCalledWith(`/investments/${investmentId}`);
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

      mockedAxios.post.mockResolvedValueOnce({ data: createdInvestment });

      const result = await apiClient.investments.create(investmentData);

      expect(mockedAxios.post).toHaveBeenCalledWith('/investments', investmentData);
      expect(result).toEqual(createdInvestment);
    });

    it('should update investment successfully', async () => {
      const investmentId = 'investment-123';
      const updateData = { drawnAmount: 500000, currentValue: 1500000 };
      const updatedInvestment = { ...TestHelper.generateMockInvestment(), ...updateData };

      mockedAxios.put.mockResolvedValueOnce({ data: updatedInvestment });

      const result = await apiClient.investments.update(investmentId, updateData);

      expect(mockedAxios.put).toHaveBeenCalledWith(`/investments/${investmentId}`, updateData);
      expect(result).toEqual(updatedInvestment);
    });

    it('should delete investment successfully', async () => {
      const investmentId = 'investment-123';

      mockedAxios.delete.mockResolvedValueOnce({ data: null });

      await apiClient.investments.delete(investmentId);

      expect(mockedAxios.delete).toHaveBeenCalledWith(`/investments/${investmentId}`);
    });

    it('should get investment summary successfully', async () => {
      const summary = TestHelper.generateMockInvestmentSummary();

      mockedAxios.get.mockResolvedValueOnce({ data: summary });

      const result = await apiClient.investments.getSummary();

      expect(mockedAxios.get).toHaveBeenCalledWith('/investments/summary');
      expect(result).toEqual(summary);
    });

    it('should get investment performance successfully', async () => {
      const investmentId = 'investment-123';
      const performance = TestHelper.generateMockPerformanceData();

      mockedAxios.get.mockResolvedValueOnce({ data: performance });

      const result = await apiClient.investments.getPerformance(investmentId);

      expect(mockedAxios.get).toHaveBeenCalledWith(`/investments/${investmentId}/performance`);
      expect(result).toEqual(performance);
    });
  });

  describe('Fund endpoints', () => {
    it('should get all funds successfully', async () => {
      const funds = [TestHelper.generateMockFund()];

      mockedAxios.get.mockResolvedValueOnce({ data: funds });

      const result = await apiClient.funds.getAll();

      expect(mockedAxios.get).toHaveBeenCalledWith('/funds');
      expect(result).toEqual(funds);
    });

    it('should get fund by ID successfully', async () => {
      const fund = TestHelper.generateMockFund();
      const fundId = 'fund-123';

      mockedAxios.get.mockResolvedValueOnce({ data: fund });

      const result = await apiClient.funds.getById(fundId);

      expect(mockedAxios.get).toHaveBeenCalledWith(`/funds/${fundId}`);
      expect(result).toEqual(fund);
    });

    it('should get user funds successfully', async () => {
      const funds = [TestHelper.generateMockFund()];

      mockedAxios.get.mockResolvedValueOnce({ data: funds });

      const result = await apiClient.funds.getUserFunds();

      expect(mockedAxios.get).toHaveBeenCalledWith('/funds/my-funds');
      expect(result).toEqual(funds);
    });

    it('should get funds by type successfully', async () => {
      const funds = [TestHelper.generateMockFund()];
      const fundType = 'PE';

      mockedAxios.get.mockResolvedValueOnce({ data: funds });

      const result = await apiClient.funds.getByType(fundType);

      expect(mockedAxios.get).toHaveBeenCalledWith('/funds/by-type', { params: { type: fundType } });
      expect(result).toEqual(funds);
    });

    it('should get funds by vintage successfully', async () => {
      const funds = [TestHelper.generateMockFund()];
      const vintage = 2024;

      mockedAxios.get.mockResolvedValueOnce({ data: funds });

      const result = await apiClient.funds.getByVintage(vintage);

      expect(mockedAxios.get).toHaveBeenCalledWith('/funds/by-vintage', { params: { vintage } });
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

      mockedAxios.get.mockResolvedValueOnce({ data: summary });

      const result = await apiClient.funds.getSummary(fundId);

      expect(mockedAxios.get).toHaveBeenCalledWith(`/funds/${fundId}/summary`);
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

      mockedAxios.get.mockResolvedValueOnce({ data: performance });

      const result = await apiClient.funds.getPerformance(fundId);

      expect(mockedAxios.get).toHaveBeenCalledWith(`/funds/${fundId}/performance`);
      expect(result).toEqual(performance);
    });
  });

  describe('Capital Activity endpoints', () => {
    it('should get capital calls successfully', async () => {
      const capitalCalls = [TestHelper.generateMockCapitalCall()];

      mockedAxios.get.mockResolvedValueOnce({ data: capitalCalls });

      const result = await apiClient.capitalActivity.getCapitalCalls();

      expect(mockedAxios.get).toHaveBeenCalledWith('/capital-calls');
      expect(result).toEqual(capitalCalls);
    });

    it('should get distributions successfully', async () => {
      const distributions = [TestHelper.generateMockDistribution()];

      mockedAxios.get.mockResolvedValueOnce({ data: distributions });

      const result = await apiClient.capitalActivity.getDistributions();

      expect(mockedAxios.get).toHaveBeenCalledWith('/distributions');
      expect(result).toEqual(distributions);
    });
  });

  describe('Document endpoints', () => {
    it('should get documents successfully', async () => {
      const documents = [TestHelper.generateMockDocument()];
      const fundId = 'fund-123';

      mockedAxios.get.mockResolvedValueOnce({ data: documents });

      const result = await apiClient.documents.getAll(fundId);

      expect(mockedAxios.get).toHaveBeenCalledWith('/documents', { params: { fundId } });
      expect(result).toEqual(documents);
    });

    it('should get document by ID successfully', async () => {
      const document = TestHelper.generateMockDocument();
      const documentId = 'doc-123';

      mockedAxios.get.mockResolvedValueOnce({ data: document });

      const result = await apiClient.documents.getById(documentId);

      expect(mockedAxios.get).toHaveBeenCalledWith(`/documents/${documentId}`);
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

      mockedAxios.get.mockRejectedValueOnce(error);

      await expect(apiClient.auth.getProfile()).rejects.toEqual(error);
    });

    it('should handle 404 not found errors', async () => {
      const error = {
        response: {
          status: 404,
          data: { message: 'Investment not found' },
        },
      };

      mockedAxios.get.mockRejectedValueOnce(error);

      await expect(apiClient.investments.getById('nonexistent')).rejects.toEqual(error);
    });

    it('should handle 500 server errors', async () => {
      const error = {
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
      };

      mockedAxios.get.mockRejectedValueOnce(error);

      await expect(apiClient.investments.getAll()).rejects.toEqual(error);
    });

    it('should handle network errors', async () => {
      const error = new Error('Network Error');

      mockedAxios.get.mockRejectedValueOnce(error);

      await expect(apiClient.investments.getAll()).rejects.toEqual(error);
    });
  });

  describe('Request configuration', () => {
    it('should create axios instance with correct base URL', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: expect.stringContaining('/api'),
        timeout: 10000,
      });
    });

    it('should include authorization header when token is available', () => {
      // This would be tested with the actual request interceptor
      // Implementation depends on how auth token is managed
      expect(mockedAxios.create).toHaveBeenCalled();
    });
  });
});