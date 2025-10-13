/**
 * Investment API Service Unit Tests
 * Tests for investment-related API calls
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InvestmentApiService } from '../investmentApi';
import type {
  Investment,
  InvestmentSummary,
  Fund,
  CapitalCall,
  Distribution,
  Communication,
  Document,
} from '@/types/investment';

// Mock the API client
vi.mock('@composables/useApi', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from '@composables/useApi';

describe('InvestmentApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Investment Endpoints', () => {
    it('should get all investments', async () => {
      const mockInvestments: Investment[] = [
        {
          id: '1',
          fundId: 'fund-1',
          investorId: 'investor-1',
          commitment: 100000,
          funded: 50000,
          unfunded: 50000,
          status: 'ACTIVE',
          investmentDate: '2024-01-01',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockInvestments });

      const result = await InvestmentApiService.getInvestments();

      expect(apiClient.get).toHaveBeenCalledWith('/investments');
      expect(result).toEqual(mockInvestments);
    });

    it('should get investment summary', async () => {
      const mockSummary: InvestmentSummary = {
        totalCommitment: 1000000,
        totalFunded: 600000,
        totalUnfunded: 400000,
        totalDistributions: 200000,
        netInvested: 400000,
        irr: 15.5,
        tvpi: 1.5,
        dpi: 0.33,
      };

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockSummary });

      const result = await InvestmentApiService.getInvestmentSummary();

      expect(apiClient.get).toHaveBeenCalledWith('/investments/summary');
      expect(result).toEqual(mockSummary);
    });

    it('should get investment by id', async () => {
      const mockInvestment: Investment = {
        id: '123',
        fundId: 'fund-1',
        investorId: 'investor-1',
        commitment: 100000,
        funded: 50000,
        unfunded: 50000,
        status: 'ACTIVE',
        investmentDate: '2024-01-01',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockInvestment });

      const result = await InvestmentApiService.getInvestmentById('123');

      expect(apiClient.get).toHaveBeenCalledWith('/investments/123');
      expect(result).toEqual(mockInvestment);
    });

    it('should get investment performance', async () => {
      const mockPerformance = {
        investment: {
          id: '123',
          fundId: 'fund-1',
          investorId: 'investor-1',
          commitment: 100000,
          funded: 50000,
          unfunded: 50000,
          status: 'ACTIVE',
          investmentDate: '2024-01-01',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        valuations: [],
        performance: {
          irr: 15.5,
          tvpi: 1.5,
          dpi: 0.33,
          rvpi: 1.17,
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockPerformance });

      const result = await InvestmentApiService.getInvestmentPerformance('123');

      expect(apiClient.get).toHaveBeenCalledWith('/investments/123/performance');
      expect(result).toEqual(mockPerformance);
    });
  });

  describe('Fund Endpoints', () => {
    it('should get all funds', async () => {
      const mockFunds: Fund[] = [
        {
          id: 'fund-1',
          name: 'Tech Fund I',
          fundSize: 10000000,
          vintage: 2024,
          status: 'ACTIVE',
          managerId: 'manager-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockFunds });

      const result = await InvestmentApiService.getFunds();

      expect(apiClient.get).toHaveBeenCalledWith('/funds');
      expect(result).toEqual(mockFunds);
    });

    it('should get user funds', async () => {
      const mockFunds: Fund[] = [
        {
          id: 'fund-1',
          name: 'My Fund',
          fundSize: 5000000,
          vintage: 2024,
          status: 'ACTIVE',
          managerId: 'manager-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockFunds });

      const result = await InvestmentApiService.getUserFunds();

      expect(apiClient.get).toHaveBeenCalledWith('/funds/my-funds');
      expect(result).toEqual(mockFunds);
    });

    it('should get fund by id', async () => {
      const mockFund: Fund = {
        id: 'fund-123',
        name: 'Tech Fund I',
        fundSize: 10000000,
        vintage: 2024,
        status: 'ACTIVE',
        managerId: 'manager-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockFund });

      const result = await InvestmentApiService.getFundById('fund-123');

      expect(apiClient.get).toHaveBeenCalledWith('/funds/fund-123');
      expect(result).toEqual(mockFund);
    });

    it('should get fund summary', async () => {
      const mockSummary = {
        fund: {
          id: 'fund-123',
          name: 'Tech Fund I',
          fundSize: 10000000,
          vintage: 2024,
          status: 'ACTIVE',
          managerId: 'manager-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        investorCount: 25,
        totalInvestorCommitment: 8000000,
        totalDrawn: 5000000,
        totalDistributed: 1500000,
        currentNav: 6000000,
        irr: 18.5,
        multiple: 1.5,
        latestValuationDate: '2024-12-31',
      };

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockSummary });

      const result = await InvestmentApiService.getFundSummary('fund-123');

      expect(apiClient.get).toHaveBeenCalledWith('/funds/fund-123/summary');
      expect(result).toEqual(mockSummary);
    });

    it('should get fund performance', async () => {
      const mockPerformance = {
        fund: {
          id: 'fund-123',
          name: 'Tech Fund I',
          fundSize: 10000000,
          vintage: 2024,
          status: 'ACTIVE',
          managerId: 'manager-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        valuations: [],
        capitalCalls: [],
        distributions: [],
        performance: {
          currentNav: 6000000,
          irr: 18.5,
          multiple: 1.5,
          totalCommitted: 8000000,
          totalDrawn: 5000000,
          totalDistributed: 1500000,
          unrealizedValue: 6000000,
          realizedValue: 1500000,
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockPerformance });

      const result = await InvestmentApiService.getFundPerformance('fund-123');

      expect(apiClient.get).toHaveBeenCalledWith('/funds/fund-123/performance');
      expect(result).toEqual(mockPerformance);
    });
  });

  describe('Capital Call Endpoints', () => {
    it('should get capital calls', async () => {
      const mockCalls: CapitalCall[] = [
        {
          id: 'call-1',
          fundId: 'fund-1',
          callNumber: 1,
          amount: 50000,
          dueDate: '2024-12-31',
          status: 'PENDING',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockCalls });

      const result = await InvestmentApiService.getCapitalCalls();

      expect(apiClient.get).toHaveBeenCalledWith('/capital-calls');
      expect(result).toEqual(mockCalls);
    });

    it('should get pending capital calls', async () => {
      const mockCalls: CapitalCall[] = [
        {
          id: 'call-123',
          fundId: 'fund-1',
          callNumber: 1,
          amount: 50000,
          dueDate: '2024-12-31',
          status: 'PENDING',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockCalls });

      const result = await InvestmentApiService.getPendingCapitalCalls();

      expect(apiClient.get).toHaveBeenCalledWith('/capital-calls?status=PENDING');
      expect(result).toEqual(mockCalls);
    });
  });

  describe('Distribution Endpoints', () => {
    it('should get distributions', async () => {
      const mockDistributions: Distribution[] = [
        {
          id: 'dist-1',
          fundId: 'fund-1',
          investmentId: 'inv-1',
          amount: 25000,
          type: 'PROFIT',
          distributionDate: '2024-06-30',
          status: 'COMPLETED',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDistributions });

      const result = await InvestmentApiService.getDistributions();

      expect(apiClient.get).toHaveBeenCalledWith('/distributions');
      expect(result).toEqual(mockDistributions);
    });

    it('should get recent distributions', async () => {
      const mockDistributions: Distribution[] = [
        {
          id: 'dist-123',
          fundId: 'fund-1',
          investmentId: 'inv-1',
          amount: 25000,
          type: 'PROFIT',
          distributionDate: '2024-06-30',
          status: 'COMPLETED',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDistributions });

      const result = await InvestmentApiService.getRecentDistributions();

      expect(apiClient.get).toHaveBeenCalledWith('/distributions?recent=true');
      expect(result).toEqual(mockDistributions);
    });
  });

  describe('Communication Endpoints', () => {
    it('should get communications', async () => {
      const mockComms: Communication[] = [
        {
          id: 'comm-1',
          fundId: 'fund-1',
          title: 'Q1 Update',
          content: 'Quarterly update content',
          type: 'UPDATE',
          sentDate: '2024-03-31',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockComms });

      const result = await InvestmentApiService.getCommunications();

      expect(apiClient.get).toHaveBeenCalledWith('/communications');
      expect(result).toEqual(mockComms);
    });

    it('should get recent communications', async () => {
      const mockComms: Communication[] = [
        {
          id: 'comm-123',
          fundId: 'fund-1',
          title: 'Important Update',
          content: 'Update content',
          type: 'ALERT',
          sentDate: '2024-03-31',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockComms });

      const result = await InvestmentApiService.getRecentCommunications();

      expect(apiClient.get).toHaveBeenCalledWith('/communications?recent=true');
      expect(result).toEqual(mockComms);
    });
  });

  describe('Document Endpoints', () => {
    it('should get documents', async () => {
      const mockDocs: Document[] = [
        {
          id: 'doc-1',
          title: 'Q1 Report',
          fileName: 'q1-report.pdf',
          fileSize: 1024000,
          mimeType: 'application/pdf',
          uploadedBy: 'user-1',
          uploadedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDocs });

      const result = await InvestmentApiService.getDocuments();

      expect(apiClient.get).toHaveBeenCalledWith('/documents');
      expect(result).toEqual(mockDocs);
    });

    it('should get documents by type', async () => {
      const mockDocs: Document[] = [
        {
          id: 'doc-123',
          title: 'Important Document',
          fileName: 'document.pdf',
          fileSize: 2048000,
          mimeType: 'application/pdf',
          uploadedBy: 'user-1',
          uploadedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDocs });

      const result = await InvestmentApiService.getDocumentsByType('report');

      expect(apiClient.get).toHaveBeenCalledWith('/documents?type=report');
      expect(result).toEqual(mockDocs);
    });

    it('should get documents by fund', async () => {
      const mockDocs: Document[] = [
        {
          id: 'doc-456',
          title: 'Fund Document',
          fileName: 'fund-doc.pdf',
          fileSize: 1024000,
          mimeType: 'application/pdf',
          uploadedBy: 'user-1',
          uploadedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDocs });

      const result = await InvestmentApiService.getDocumentsByFund('fund-123');

      expect(apiClient.get).toHaveBeenCalledWith('/documents?fundId=fund-123');
      expect(result).toEqual(mockDocs);
    });
  });

  describe('Dashboard Endpoint', () => {
    it('should get dashboard data', async () => {
      const mockDashboard = {
        summary: {
          totalCommitment: 1000000,
          totalFunded: 600000,
          totalUnfunded: 400000,
          totalDistributions: 200000,
          netInvested: 400000,
          irr: 15.5,
          tvpi: 1.5,
          dpi: 0.33,
        },
        recentActivities: [],
        portfolioHoldings: [],
        pendingActions: [],
      };

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDashboard });

      const result = await InvestmentApiService.getDashboardData();

      expect(apiClient.get).toHaveBeenCalledWith('/dashboard');
      expect(result).toEqual(mockDashboard);
    });
  });

  describe('Response Data Handling', () => {
    it('should handle response.data format', async () => {
      const mockData = [{ id: '1', name: 'Test' }];
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

      const result = await InvestmentApiService.getInvestments();

      expect(result).toEqual(mockData);
    });

    it('should handle direct response format', async () => {
      const mockData = [{ id: '1', name: 'Test' }];
      vi.mocked(apiClient.get).mockResolvedValue(mockData);

      const result = await InvestmentApiService.getInvestments();

      expect(result).toEqual(mockData);
    });
  });
});
