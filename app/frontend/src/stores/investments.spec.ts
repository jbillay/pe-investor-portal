import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useInvestmentStore } from './investments';
import { TestHelper, MockApiClient } from '../test/utils/test-helpers';

// Mock the API client
const mockApiClient = MockApiClient.createMockImplementation();
vi.mock('../services/api', () => ({
  apiClient: {
    investments: mockApiClient,
  },
}));

describe('Investment Store', () => {
  let investmentStore: ReturnType<typeof useInvestmentStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    investmentStore = useInvestmentStore();
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      expect(investmentStore.investments).toEqual([]);
      expect(investmentStore.currentInvestment).toBeNull();
      expect(investmentStore.summary).toBeNull();
      expect(investmentStore.performanceData).toBeNull();
      expect(investmentStore.isLoading).toBe(false);
      expect(investmentStore.error).toBeNull();
    });
  });

  describe('fetchInvestments', () => {
    it('should fetch investments successfully', async () => {
      const mockInvestments = [
        TestHelper.generateMockInvestment(),
        { ...TestHelper.generateMockInvestment(), id: 'investment-456' },
      ];

      mockApiClient.getInvestments.mockResolvedValueOnce({ data: mockInvestments });

      await investmentStore.fetchInvestments();

      expect(mockApiClient.getInvestments).toHaveBeenCalled();
      expect(investmentStore.investments).toEqual(mockInvestments);
      expect(investmentStore.error).toBeNull();
      expect(investmentStore.isLoading).toBe(false);
    });

    it('should handle fetch investments error', async () => {
      const mockError = {
        response: {
          data: { message: 'Failed to fetch investments' },
          status: 500,
        },
      };

      mockApiClient.getInvestments.mockRejectedValueOnce(mockError);

      await investmentStore.fetchInvestments();

      expect(investmentStore.investments).toEqual([]);
      expect(investmentStore.error).toBe('Failed to fetch investments');
      expect(investmentStore.isLoading).toBe(false);
    });

    it('should set loading state during fetch', async () => {
      mockApiClient.getInvestments.mockImplementation(() => {
        expect(investmentStore.isLoading).toBe(true);
        return Promise.resolve({ data: [] });
      });

      await investmentStore.fetchInvestments();

      expect(investmentStore.isLoading).toBe(false);
    });
  });

  describe('fetchInvestmentById', () => {
    it('should fetch investment by ID successfully', async () => {
      const mockInvestment = TestHelper.generateMockInvestment();
      const investmentId = 'investment-123';

      mockApiClient.getInvestment.mockResolvedValueOnce({ data: mockInvestment });

      await investmentStore.fetchInvestmentById(investmentId);

      expect(mockApiClient.getInvestment).toHaveBeenCalledWith(investmentId);
      expect(investmentStore.currentInvestment).toEqual(mockInvestment);
      expect(investmentStore.error).toBeNull();
    });

    it('should handle fetch investment by ID error', async () => {
      const mockError = {
        response: {
          data: { message: 'Investment not found' },
          status: 404,
        },
      };

      mockApiClient.getInvestment.mockRejectedValueOnce(mockError);

      await investmentStore.fetchInvestmentById('nonexistent');

      expect(investmentStore.currentInvestment).toBeNull();
      expect(investmentStore.error).toBe('Investment not found');
    });
  });

  describe('createInvestment', () => {
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
      const mockCreatedInvestment = TestHelper.generateMockInvestment();

      mockApiClient.createInvestment.mockResolvedValueOnce({ data: mockCreatedInvestment });

      const result = await investmentStore.createInvestment(investmentData);

      expect(mockApiClient.createInvestment).toHaveBeenCalledWith(investmentData);
      expect(result).toEqual(mockCreatedInvestment);
      expect(investmentStore.investments).toContain(mockCreatedInvestment);
      expect(investmentStore.error).toBeNull();
    });

    it('should handle create investment error', async () => {
      const investmentData = {
        fundId: 'fund-123',
        commitmentAmount: 1000000,
        investmentDate: '2024-01-15',
        drawnAmount: 0,
        distributedAmount: 0,
        currentValue: 1000000,
        status: 'ACTIVE',
      };
      const mockError = {
        response: {
          data: { message: 'Investment creation failed' },
          status: 400,
        },
      };

      mockApiClient.createInvestment.mockRejectedValueOnce(mockError);

      await expect(investmentStore.createInvestment(investmentData)).rejects.toEqual(mockError);
      expect(investmentStore.error).toBe('Investment creation failed');
    });
  });

  describe('updateInvestment', () => {
    beforeEach(() => {
      const mockInvestment = TestHelper.generateMockInvestment();
      investmentStore.investments = [mockInvestment];
    });

    it('should update investment successfully', async () => {
      const investmentId = 'investment-123';
      const updateData = { drawnAmount: 500000, currentValue: 1500000 };
      const mockUpdatedInvestment = {
        ...TestHelper.generateMockInvestment(),
        ...updateData,
      };

      mockApiClient.updateInvestment.mockResolvedValueOnce({ data: mockUpdatedInvestment });

      const result = await investmentStore.updateInvestment(investmentId, updateData);

      expect(mockApiClient.updateInvestment).toHaveBeenCalledWith(investmentId, updateData);
      expect(result).toEqual(mockUpdatedInvestment);

      // Check that the investment was updated in the store
      const updatedInvestment = investmentStore.investments.find(inv => inv.id === investmentId);
      expect(updatedInvestment).toEqual(mockUpdatedInvestment);
      expect(investmentStore.error).toBeNull();
    });

    it('should handle update investment error', async () => {
      const investmentId = 'investment-123';
      const updateData = { drawnAmount: 500000 };
      const mockError = {
        response: {
          data: { message: 'Update failed' },
          status: 400,
        },
      };

      mockApiClient.updateInvestment.mockRejectedValueOnce(mockError);

      await expect(investmentStore.updateInvestment(investmentId, updateData)).rejects.toEqual(mockError);
      expect(investmentStore.error).toBe('Update failed');
    });
  });

  describe('deleteInvestment', () => {
    beforeEach(() => {
      const mockInvestments = [
        TestHelper.generateMockInvestment(),
        { ...TestHelper.generateMockInvestment(), id: 'investment-456' },
      ];
      investmentStore.investments = mockInvestments;
    });

    it('should delete investment successfully', async () => {
      const investmentId = 'investment-123';

      mockApiClient.deleteInvestment.mockResolvedValueOnce({ data: null });

      await investmentStore.deleteInvestment(investmentId);

      expect(mockApiClient.deleteInvestment).toHaveBeenCalledWith(investmentId);

      // Check that the investment was removed from the store
      const deletedInvestment = investmentStore.investments.find(inv => inv.id === investmentId);
      expect(deletedInvestment).toBeUndefined();
      expect(investmentStore.investments).toHaveLength(1);
      expect(investmentStore.error).toBeNull();
    });

    it('should handle delete investment error', async () => {
      const investmentId = 'investment-123';
      const mockError = {
        response: {
          data: { message: 'Delete failed' },
          status: 400,
        },
      };

      mockApiClient.deleteInvestment.mockRejectedValueOnce(mockError);

      await expect(investmentStore.deleteInvestment(investmentId)).rejects.toEqual(mockError);
      expect(investmentStore.error).toBe('Delete failed');

      // Check that the investment was not removed from the store
      expect(investmentStore.investments).toHaveLength(2);
    });
  });

  describe('fetchInvestmentSummary', () => {
    it('should fetch investment summary successfully', async () => {
      const mockSummary = TestHelper.generateMockInvestmentSummary();

      mockApiClient.getInvestmentSummary.mockResolvedValueOnce({ data: mockSummary });

      await investmentStore.fetchInvestmentSummary();

      expect(mockApiClient.getInvestmentSummary).toHaveBeenCalled();
      expect(investmentStore.summary).toEqual(mockSummary);
      expect(investmentStore.error).toBeNull();
    });

    it('should handle fetch summary error', async () => {
      const mockError = {
        response: {
          data: { message: 'Failed to fetch summary' },
          status: 500,
        },
      };

      mockApiClient.getInvestmentSummary.mockRejectedValueOnce(mockError);

      await investmentStore.fetchInvestmentSummary();

      expect(investmentStore.summary).toBeNull();
      expect(investmentStore.error).toBe('Failed to fetch summary');
    });
  });

  describe('fetchInvestmentPerformance', () => {
    it('should fetch investment performance successfully', async () => {
      const mockPerformance = TestHelper.generateMockPerformanceData();
      const investmentId = 'investment-123';

      mockApiClient.getInvestmentPerformance.mockResolvedValueOnce({ data: mockPerformance });

      await investmentStore.fetchInvestmentPerformance(investmentId);

      expect(mockApiClient.getInvestmentPerformance).toHaveBeenCalledWith(investmentId);
      expect(investmentStore.performanceData).toEqual(mockPerformance);
      expect(investmentStore.error).toBeNull();
    });

    it('should handle fetch performance error', async () => {
      const mockError = {
        response: {
          data: { message: 'Failed to fetch performance' },
          status: 500,
        },
      };

      mockApiClient.getInvestmentPerformance.mockRejectedValueOnce(mockError);

      await investmentStore.fetchInvestmentPerformance('investment-123');

      expect(investmentStore.performanceData).toBeNull();
      expect(investmentStore.error).toBe('Failed to fetch performance');
    });
  });

  describe('computed properties', () => {
    beforeEach(() => {
      const mockInvestments = [
        TestHelper.generateMockInvestment(),
        {
          ...TestHelper.generateMockInvestment(),
          id: 'investment-456',
          status: 'CLOSED',
          fund: { ...TestHelper.generateMockInvestment().fund, fundType: 'VC' },
        },
      ];
      investmentStore.investments = mockInvestments;
    });

    it('should compute active investments correctly', () => {
      expect(investmentStore.activeInvestments).toHaveLength(1);
      expect(investmentStore.activeInvestments[0].status).toBe('ACTIVE');
    });

    it('should compute investments by fund type correctly', () => {
      const peInvestments = investmentStore.getInvestmentsByType('PE');
      const vcInvestments = investmentStore.getInvestmentsByType('VC');

      expect(peInvestments).toHaveLength(1);
      expect(vcInvestments).toHaveLength(1);
      expect(peInvestments[0].fund.fundType).toBe('PE');
      expect(vcInvestments[0].fund.fundType).toBe('VC');
    });

    it('should compute total committed amount correctly', () => {
      expect(investmentStore.totalCommitted).toBe(2000000); // 2 * 1000000
    });

    it('should compute total current value correctly', () => {
      expect(investmentStore.totalCurrentValue).toBe(2400000); // 2 * 1200000
    });

    it('should compute performance metrics correctly', () => {
      expect(investmentStore.overallPerformance.totalReturn).toBeGreaterThan(0);
      expect(investmentStore.overallPerformance.irr).toBeGreaterThan(0);
      expect(investmentStore.overallPerformance.multiple).toBeGreaterThan(1);
    });
  });

  describe('utility methods', () => {
    it('should clear error', () => {
      investmentStore.error = 'Some error';
      investmentStore.clearError();
      expect(investmentStore.error).toBeNull();
    });

    it('should clear current investment', () => {
      investmentStore.currentInvestment = TestHelper.generateMockInvestment();
      investmentStore.clearCurrentInvestment();
      expect(investmentStore.currentInvestment).toBeNull();
    });

    it('should reset store state', () => {
      investmentStore.investments = [TestHelper.generateMockInvestment()];
      investmentStore.currentInvestment = TestHelper.generateMockInvestment();
      investmentStore.summary = TestHelper.generateMockInvestmentSummary();
      investmentStore.error = 'Some error';

      investmentStore.resetStore();

      expect(investmentStore.investments).toEqual([]);
      expect(investmentStore.currentInvestment).toBeNull();
      expect(investmentStore.summary).toBeNull();
      expect(investmentStore.error).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should clear error on successful operations', async () => {
      investmentStore.error = 'Previous error';
      const mockInvestments = [TestHelper.generateMockInvestment()];

      mockApiClient.getInvestments.mockResolvedValueOnce({ data: mockInvestments });

      await investmentStore.fetchInvestments();

      expect(investmentStore.error).toBeNull();
    });

    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network Error');
      mockApiClient.getInvestments.mockRejectedValueOnce(networkError);

      await investmentStore.fetchInvestments();

      expect(investmentStore.error).toBe('Network Error');
    });

    it('should handle API errors with custom messages', async () => {
      const apiError = {
        response: {
          data: { message: 'Custom API error' },
          status: 400,
        },
      };

      mockApiClient.getInvestments.mockRejectedValueOnce(apiError);

      await investmentStore.fetchInvestments();

      expect(investmentStore.error).toBe('Custom API error');
    });
  });

  describe('data persistence', () => {
    it('should maintain state consistency after operations', async () => {
      const mockInvestments = [TestHelper.generateMockInvestment()];
      mockApiClient.getInvestments.mockResolvedValueOnce({ data: mockInvestments });

      await investmentStore.fetchInvestments();

      expect(investmentStore.investments).toEqual(mockInvestments);
      expect(investmentStore.investments).toHaveLength(1);

      const newInvestment = { ...TestHelper.generateMockInvestment(), id: 'new-investment' };
      mockApiClient.createInvestment.mockResolvedValueOnce({ data: newInvestment });

      await investmentStore.createInvestment({
        fundId: 'fund-123',
        commitmentAmount: 1000000,
        investmentDate: '2024-01-15',
        drawnAmount: 0,
        distributedAmount: 0,
        currentValue: 1000000,
        status: 'ACTIVE',
      });

      expect(investmentStore.investments).toHaveLength(2);
      expect(investmentStore.investments).toContainEqual(newInvestment);
    });
  });
});