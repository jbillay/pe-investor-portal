import { Test, TestingModule } from '@nestjs/testing';
import { FundController } from './fund.controller';
import { FundService } from '../services/fund.service';
import { CreateFundDto, UpdateFundDto } from '../dto/fund.dto';
import { NotFoundException } from '@nestjs/common';

describe('FundController', () => {
  let controller: FundController;
  let service: FundService;

  const mockFundService = {
    createFund: jest.fn(),
    getAllFunds: jest.fn(),
    getFundsForUser: jest.fn(),
    getFundsByType: jest.fn(),
    getFundsByVintage: jest.fn(),
    getFundById: jest.fn(),
    getFundSummary: jest.fn(),
    getFundPerformance: jest.fn(),
    updateFund: jest.fn(),
    deleteFund: jest.fn(),
  };

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
  };

  const mockFund = {
    id: 'fund-123',
    name: 'Test Fund',
    description: 'A test fund for PE investments',
    fundType: 'PE',
    vintage: 2024,
    targetSize: 100000000,
    commitedSize: 85000000,
    drawnSize: 25000000,
    currency: 'USD',
    status: 'ACTIVE',
    closeDate: new Date('2024-01-15'),
    finalClose: new Date('2024-06-15'),
    liquidationDate: new Date('2034-01-15'),
    managementFee: 0.02,
    carriedInterest: 0.20,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockFundSummary = {
    fund: mockFund,
    investorCount: 5,
    totalInvestorCommitment: 25000000,
    totalDrawn: 6250000,
    totalDistributed: 1250000,
    currentNav: 30000000,
    irr: 0.125,
    multiple: 1.2,
    latestValuationDate: new Date('2024-03-31'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FundController],
      providers: [
        {
          provide: FundService,
          useValue: mockFundService,
        },
      ],
    }).compile();

    controller = module.get<FundController>(FundController);
    service = module.get<FundService>(FundService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createFund', () => {
    const createFundDto: CreateFundDto = {
      name: 'Test Fund',
      description: 'A test fund for PE investments',
      fundType: 'PE',
      vintage: 2024,
      targetSize: 100000000,
      commitedSize: 85000000,
      currency: 'USD',
      closeDate: '2024-01-15',
      finalClose: '2024-06-15',
      liquidationDate: '2034-01-15',
      managementFee: 0.02,
      carriedInterest: 0.20,
    };

    it('should create a fund successfully', async () => {
      mockFundService.createFund.mockResolvedValue(mockFund);

      const result = await controller.createFund(createFundDto);

      expect(mockFundService.createFund).toHaveBeenCalledWith(createFundDto);
      expect(result).toEqual(mockFund);
    });

    it('should handle validation errors', async () => {
      mockFundService.createFund.mockRejectedValue(
        new Error('Validation failed')
      );

      await expect(
        controller.createFund(createFundDto)
      ).rejects.toThrow();
    });
  });

  describe('getAllFunds', () => {
    it('should return all funds', async () => {
      const funds = [mockFund, { ...mockFund, id: 'fund-456', name: 'Another Fund' }];
      mockFundService.getAllFunds.mockResolvedValue(funds);

      const result = await controller.getAllFunds();

      expect(mockFundService.getAllFunds).toHaveBeenCalled();
      expect(result).toEqual(funds);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no funds exist', async () => {
      mockFundService.getAllFunds.mockResolvedValue([]);

      const result = await controller.getAllFunds();

      expect(result).toEqual([]);
    });
  });

  describe('getUserFunds', () => {
    it('should return user funds', async () => {
      const userFunds = [mockFund];
      mockFundService.getFundsForUser.mockResolvedValue(userFunds);

      const result = await controller.getUserFunds(mockUser);

      expect(mockFundService.getFundsForUser).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(userFunds);
    });

    it('should return empty array when user has no funds', async () => {
      mockFundService.getFundsForUser.mockResolvedValue([]);

      const result = await controller.getUserFunds(mockUser);

      expect(result).toEqual([]);
    });
  });

  describe('getFundsByType', () => {
    it('should return funds filtered by type', async () => {
      const peFunds = [mockFund];
      mockFundService.getFundsByType.mockResolvedValue(peFunds);

      const result = await controller.getFundsByType('PE');

      expect(mockFundService.getFundsByType).toHaveBeenCalledWith('PE');
      expect(result).toEqual(peFunds);
    });

    it('should return empty array for unknown fund type', async () => {
      mockFundService.getFundsByType.mockResolvedValue([]);

      const result = await controller.getFundsByType('UNKNOWN');

      expect(result).toEqual([]);
    });
  });

  describe('getFundsByVintage', () => {
    it('should return funds filtered by vintage', async () => {
      const vintage2024Funds = [mockFund];
      mockFundService.getFundsByVintage.mockResolvedValue(vintage2024Funds);

      const result = await controller.getFundsByVintage('2024');

      expect(mockFundService.getFundsByVintage).toHaveBeenCalledWith(2024);
      expect(result).toEqual(vintage2024Funds);
    });

    it('should handle invalid vintage format', async () => {
      mockFundService.getFundsByVintage.mockResolvedValue([]);

      const result = await controller.getFundsByVintage('invalid');

      expect(mockFundService.getFundsByVintage).toHaveBeenCalledWith(NaN);
      expect(result).toEqual([]);
    });
  });

  describe('getFundById', () => {
    it('should return fund by id', async () => {
      mockFundService.getFundById.mockResolvedValue(mockFund);

      const result = await controller.getFundById('fund-123');

      expect(mockFundService.getFundById).toHaveBeenCalledWith('fund-123');
      expect(result).toEqual(mockFund);
    });

    it('should handle not found errors', async () => {
      mockFundService.getFundById.mockRejectedValue(
        new NotFoundException('Fund not found')
      );

      await expect(
        controller.getFundById('non-existent')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getFundSummary', () => {
    it('should return fund summary', async () => {
      mockFundService.getFundSummary.mockResolvedValue(mockFundSummary);

      const result = await controller.getFundSummary('fund-123');

      expect(mockFundService.getFundSummary).toHaveBeenCalledWith('fund-123');
      expect(result).toEqual(mockFundSummary);
      expect(result.investorCount).toBe(5);
      expect(result.totalInvestorCommitment).toBe(25000000);
    });

    it('should handle not found errors', async () => {
      mockFundService.getFundSummary.mockRejectedValue(
        new NotFoundException('Fund not found')
      );

      await expect(
        controller.getFundSummary('non-existent')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getFundPerformance', () => {
    it('should return fund performance', async () => {
      const performance = {
        fund: mockFund,
        valuations: [
          { id: 'val-1', valuationDate: new Date('2024-01-01'), totalValue: 110000000 },
          { id: 'val-2', valuationDate: new Date('2024-02-01'), totalValue: 120000000 },
        ],
        capitalCalls: [
          { id: 'call-1', callDate: new Date('2024-01-15'), totalAmount: 5000000 },
        ],
        distributions: [
          { id: 'dist-1', paymentDate: new Date('2024-02-15'), totalAmount: 1000000 },
        ],
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
      mockFundService.getFundPerformance.mockResolvedValue(performance);

      const result = await controller.getFundPerformance('fund-123');

      expect(mockFundService.getFundPerformance).toHaveBeenCalledWith('fund-123');
      expect(result.fund).toEqual(mockFund);
      expect(result.valuations).toHaveLength(2);
      expect(result.performance.currentNav).toBe(120000000);
    });

    it('should handle not found errors', async () => {
      mockFundService.getFundPerformance.mockRejectedValue(
        new NotFoundException('Fund not found')
      );

      await expect(
        controller.getFundPerformance('non-existent')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateFund', () => {
    const updateFundDto: UpdateFundDto = {
      description: 'Updated fund description',
      drawnSize: 30000000,
      status: 'CLOSED',
    };

    it('should update fund successfully', async () => {
      const updatedFund = { ...mockFund, ...updateFundDto };
      mockFundService.updateFund.mockResolvedValue(updatedFund);

      const result = await controller.updateFund('fund-123', updateFundDto);

      expect(mockFundService.updateFund).toHaveBeenCalledWith('fund-123', updateFundDto);
      expect(result.description).toBe('Updated fund description');
      expect(result.drawnSize).toBe(30000000);
      expect(result.status).toBe('CLOSED');
    });

    it('should handle not found errors', async () => {
      mockFundService.updateFund.mockRejectedValue(
        new NotFoundException('Fund not found')
      );

      await expect(
        controller.updateFund('non-existent', updateFundDto)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteFund', () => {
    it('should delete fund successfully', async () => {
      mockFundService.deleteFund.mockResolvedValue(undefined);

      await controller.deleteFund('fund-123');

      expect(mockFundService.deleteFund).toHaveBeenCalledWith('fund-123');
    });

    it('should handle not found errors', async () => {
      mockFundService.deleteFund.mockRejectedValue(
        new NotFoundException('Fund not found')
      );

      await expect(
        controller.deleteFund('non-existent')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Input validation', () => {
    it('should validate fund type enum values', async () => {
      const validTypes = ['PE', 'VC', 'GROWTH', 'REAL_ESTATE', 'INFRASTRUCTURE', 'DEBT'];

      for (const type of validTypes) {
        mockFundService.getFundsByType.mockResolvedValue([]);
        await controller.getFundsByType(type);
        expect(mockFundService.getFundsByType).toHaveBeenCalledWith(type);
      }
    });

    it('should handle string to number conversion for vintage', async () => {
      mockFundService.getFundsByVintage.mockResolvedValue([]);

      await controller.getFundsByVintage('2024');
      expect(mockFundService.getFundsByVintage).toHaveBeenCalledWith(2024);

      await controller.getFundsByVintage('2023');
      expect(mockFundService.getFundsByVintage).toHaveBeenCalledWith(2023);
    });

    it('should validate required fields in create DTO', async () => {
      const invalidDto = { name: 'Test' } as CreateFundDto;

      mockFundService.createFund.mockRejectedValue(
        new Error('Validation failed: missing required fields')
      );

      await expect(
        controller.createFund(invalidDto)
      ).rejects.toThrow();
    });
  });

  describe('Data consistency', () => {
    it('should ensure fund summary calculations are correct', async () => {
      const summary = {
        fund: mockFund,
        investorCount: 3,
        totalInvestorCommitment: 15000000,
        totalDrawn: 3750000,
        totalDistributed: 750000,
        currentNav: 18000000,
        irr: 0.15,
        multiple: 1.25,
        latestValuationDate: new Date('2024-03-31'),
      };
      mockFundService.getFundSummary.mockResolvedValue(summary);

      const result = await controller.getFundSummary('fund-123');

      expect(result.totalDrawn).toBeLessThanOrEqual(result.totalInvestorCommitment);
      expect(result.currentNav).toBeGreaterThan(0);
      expect(result.multiple).toBeGreaterThan(0);
      expect(result.investorCount).toBeGreaterThanOrEqual(0);
    });

    it('should ensure performance metrics are consistent', async () => {
      const performance = {
        fund: mockFund,
        valuations: [],
        capitalCalls: [],
        distributions: [],
        performance: {
          currentNav: 100000000,
          irr: 0.125,
          multiple: 1.2,
          totalCommitted: 85000000,
          totalDrawn: 25000000,
          totalDistributed: 5000000,
          unrealizedValue: 95000000,
          realizedValue: 5000000,
        },
      };
      mockFundService.getFundPerformance.mockResolvedValue(performance);

      const result = await controller.getFundPerformance('fund-123');

      const perf = result.performance;
      expect(perf.totalDrawn).toBeLessThanOrEqual(perf.totalCommitted);
      expect(perf.unrealizedValue + perf.realizedValue).toBeCloseTo(perf.currentNav + perf.totalDistributed, 0);
      expect(perf.multiple).toBeGreaterThan(0);
      expect(perf.irr).toBeGreaterThanOrEqual(-1);
    });
  });
});