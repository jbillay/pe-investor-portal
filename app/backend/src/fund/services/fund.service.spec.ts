import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { FundService } from './fund.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateFundDto, UpdateFundDto } from '../dto/fund.dto';

describe('FundService', () => {
  let service: FundService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    fund: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    investment: {
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    valuation: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    capitalCall: {
      findMany: jest.fn(),
    },
    distribution: {
      findMany: jest.fn(),
    },
  };

  const mockFund = {
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
    isActive: true,
    managementFee: 0.02,
    carriedInterest: 0.20,
    closeDate: new Date('2024-06-01'),
    finalClose: new Date('2024-12-01'),
    liquidationDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockInvestment = {
    id: 'investment-123',
    userId: 'user-123',
    fundId: 'fund-123',
    commitmentAmount: 1000000,
    drawnAmount: 250000,
    distributedAmount: 50000,
    currentValue: 1200000,
    fund: mockFund,
  };

  const mockValuation = {
    id: 'valuation-123',
    fundId: 'fund-123',
    valuationDate: new Date('2024-03-31'),
    totalValue: 87500000,
    irr: 0.125,
    multiple: 1.15,
    totalCommitted: 85000000,
    totalDrawn: 25000000,
    totalDistributed: 5000000,
    unrealizedValue: 82500000,
    realizedValue: 5000000,
    isActive: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FundService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<FundService>(FundService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createFund', () => {
    const createFundDto: CreateFundDto = {
      name: 'Test PE Fund',
      description: 'A test private equity fund',
      fundType: 'PE',
      vintage: 2024,
      targetSize: 100000000,
      commitedSize: 85000000,
      currency: 'USD',
      managementFee: 0.02,
      carriedInterest: 0.20,
      closeDate: '2024-06-01',
      finalClose: '2024-12-01',
    };

    it('should create a fund successfully', async () => {
      mockPrismaService.fund.create.mockResolvedValue(mockFund);

      const result = await service.createFund(createFundDto);

      expect(mockPrismaService.fund.create).toHaveBeenCalledWith({
        data: {
          ...createFundDto,
          closeDate: new Date('2024-06-01'),
          finalClose: new Date('2024-12-01'),
          liquidationDate: undefined,
        },
      });
      expect(result.targetSize).toBe(100000000);
      expect(result.commitedSize).toBe(85000000);
      expect(typeof result.targetSize).toBe('number');
      expect(typeof result.managementFee).toBe('number');
    });

    it('should handle optional fields correctly', async () => {
      const minimalDto: CreateFundDto = {
        name: 'Minimal Fund',
        fundType: 'VC',
        vintage: 2024,
        targetSize: 50000000,
        commitedSize: 40000000,
      };

      const minimalFund = {
        ...mockFund,
        name: 'Minimal Fund',
        fundType: 'VC',
        targetSize: 50000000,
        commitedSize: 40000000,
        description: null,
        managementFee: null,
        carriedInterest: null,
      };

      mockPrismaService.fund.create.mockResolvedValue(minimalFund);

      const result = await service.createFund(minimalDto);

      expect(result.description).toBeUndefined();
      expect(result.managementFee).toBeNull();
      expect(result.carriedInterest).toBeNull();
    });
  });

  describe('getAllFunds', () => {
    it('should return all active funds with transformations', async () => {
      const funds = [mockFund, { ...mockFund, id: 'fund-456', name: 'Another Fund' }];
      mockPrismaService.fund.findMany.mockResolvedValue(funds);

      const result = await service.getAllFunds();

      expect(mockPrismaService.fund.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(2);
      expect(result[0].targetSize).toBe(100000000);
      expect(typeof result[0].targetSize).toBe('number');
    });

    it('should return empty array when no funds exist', async () => {
      mockPrismaService.fund.findMany.mockResolvedValue([]);

      const result = await service.getAllFunds();

      expect(result).toEqual([]);
    });
  });

  describe('getFundById', () => {
    it('should return fund by id with transformations', async () => {
      mockPrismaService.fund.findFirst.mockResolvedValue(mockFund);

      const result = await service.getFundById('fund-123');

      expect(mockPrismaService.fund.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'fund-123',
          isActive: true,
        },
      });
      expect(result.targetSize).toBe(100000000);
      expect(typeof result.targetSize).toBe('number');
      expect(result.description).toBeUndefined(); // null converted to undefined
    });

    it('should throw NotFoundException when fund not found', async () => {
      mockPrismaService.fund.findFirst.mockResolvedValue(null);

      await expect(service.getFundById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateFund', () => {
    const updateDto: UpdateFundDto = {
      description: 'Updated description',
      drawnSize: 30000000,
      status: 'CLOSED',
    };

    it('should update fund successfully', async () => {
      mockPrismaService.fund.findFirst.mockResolvedValue(mockFund);
      const updatedFund = { ...mockFund, ...updateDto };
      mockPrismaService.fund.update.mockResolvedValue(updatedFund);

      const result = await service.updateFund('fund-123', updateDto);

      expect(mockPrismaService.fund.update).toHaveBeenCalledWith({
        where: { id: 'fund-123' },
        data: {
          description: 'Updated description',
          drawnSize: 30000000,
          status: 'CLOSED',
        },
      });
      expect(result.drawnSize).toBe(30000000);
      expect(typeof result.drawnSize).toBe('number');
    });

    it('should throw NotFoundException when fund not found', async () => {
      mockPrismaService.fund.findFirst.mockResolvedValue(null);

      await expect(service.updateFund('non-existent', updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should handle date fields correctly', async () => {
      const dateUpdateDto: UpdateFundDto = {
        finalClose: '2025-01-01',
        liquidationDate: '2030-12-31',
      };

      mockPrismaService.fund.findFirst.mockResolvedValue(mockFund);
      mockPrismaService.fund.update.mockResolvedValue(mockFund);

      await service.updateFund('fund-123', dateUpdateDto);

      expect(mockPrismaService.fund.update).toHaveBeenCalledWith({
        where: { id: 'fund-123' },
        data: {
          finalClose: new Date('2025-01-01'),
          liquidationDate: new Date('2030-12-31'),
        },
      });
    });
  });

  describe('deleteFund', () => {
    it('should soft delete fund successfully', async () => {
      mockPrismaService.fund.findFirst.mockResolvedValue(mockFund);
      mockPrismaService.fund.update.mockResolvedValue({ ...mockFund, isActive: false });

      await service.deleteFund('fund-123');

      expect(mockPrismaService.fund.update).toHaveBeenCalledWith({
        where: { id: 'fund-123' },
        data: { isActive: false },
      });
    });

    it('should throw NotFoundException when fund not found', async () => {
      mockPrismaService.fund.findFirst.mockResolvedValue(null);

      await expect(service.deleteFund('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getFundSummary', () => {
    it('should return fund summary with correct aggregations', async () => {
      const transformedFund = {
        ...mockFund,
        targetSize: 100000000,
        commitedSize: 85000000,
        drawnSize: 25000000,
        managementFee: 0.02,
        carriedInterest: 0.20,
        description: 'A test private equity fund',
      };

      mockPrismaService.fund.findFirst.mockResolvedValue(mockFund);
      mockPrismaService.investment.aggregate.mockResolvedValue({
        _count: { id: 5 },
        _sum: {
          commitmentAmount: 5000000,
          drawnAmount: 1250000,
          distributedAmount: 250000,
          currentValue: 6000000,
        },
      });
      mockPrismaService.valuation.findFirst.mockResolvedValue(mockValuation);

      // Mock the transformation by calling getFundById
      jest.spyOn(service, 'getFundById').mockResolvedValue(transformedFund);

      const result = await service.getFundSummary('fund-123');

      expect(result.fund).toEqual(transformedFund);
      expect(result.investorCount).toBe(5);
      expect(result.totalInvestorCommitment).toBe(5000000);
      expect(result.totalDrawn).toBe(1250000);
      expect(result.totalDistributed).toBe(250000);
      expect(result.currentNav).toBe(6000000);
      expect(result.irr).toBe(0.125);
      expect(result.multiple).toBe(1.15);
      expect(typeof result.totalInvestorCommitment).toBe('number');
    });

    it('should handle missing valuation data', async () => {
      mockPrismaService.fund.findFirst.mockResolvedValue(mockFund);
      mockPrismaService.investment.aggregate.mockResolvedValue({
        _count: { id: 0 },
        _sum: {
          commitmentAmount: null,
          drawnAmount: null,
          distributedAmount: null,
          currentValue: null,
        },
      });
      mockPrismaService.valuation.findFirst.mockResolvedValue(null);

      jest.spyOn(service, 'getFundById').mockResolvedValue(mockFund);

      const result = await service.getFundSummary('fund-123');

      expect(result.investorCount).toBe(0);
      expect(result.totalInvestorCommitment).toBe(0);
      expect(result.irr).toBeUndefined();
      expect(result.multiple).toBeUndefined();
    });
  });

  describe('getFundsForUser', () => {
    it('should return funds for user with transformations', async () => {
      const userInvestments = [
        mockInvestment,
        { ...mockInvestment, id: 'investment-456', fund: { ...mockFund, id: 'fund-456' } },
      ];
      mockPrismaService.investment.findMany.mockResolvedValue(userInvestments);

      const result = await service.getFundsForUser('user-123');

      expect(mockPrismaService.investment.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          isActive: true,
        },
        include: {
          fund: true,
        },
      });
      expect(result).toHaveLength(2);
      expect(result[0].targetSize).toBe(100000000);
      expect(typeof result[0].targetSize).toBe('number');
    });
  });

  describe('getFundPerformance', () => {
    it('should return fund performance with all related data', async () => {
      const valuations = [mockValuation];
      const capitalCalls = [
        {
          id: 'call-123',
          fundId: 'fund-123',
          callNumber: 1,
          totalAmount: 10000000,
          investors: [],
        },
      ];
      const distributions = [
        {
          id: 'dist-123',
          fundId: 'fund-123',
          distributionNumber: 1,
          totalAmount: 2000000,
          investors: [],
        },
      ];

      jest.spyOn(service, 'getFundById').mockResolvedValue(mockFund);
      mockPrismaService.valuation.findMany.mockResolvedValue(valuations);
      mockPrismaService.capitalCall.findMany.mockResolvedValue(capitalCalls);
      mockPrismaService.distribution.findMany.mockResolvedValue(distributions);

      const result = await service.getFundPerformance('fund-123');

      expect(result.fund).toEqual(mockFund);
      expect(result.valuations).toEqual(valuations);
      expect(result.capitalCalls).toEqual(capitalCalls);
      expect(result.distributions).toEqual(distributions);
      expect(result.performance.currentNav).toBe(87500000);
      expect(result.performance.irr).toBe(0.125);
      expect(result.performance.multiple).toBe(1.15);
      expect(typeof result.performance.currentNav).toBe('number');
    });

    it('should handle missing valuation data in performance', async () => {
      jest.spyOn(service, 'getFundById').mockResolvedValue(mockFund);
      mockPrismaService.valuation.findMany.mockResolvedValue([]);
      mockPrismaService.capitalCall.findMany.mockResolvedValue([]);
      mockPrismaService.distribution.findMany.mockResolvedValue([]);

      const result = await service.getFundPerformance('fund-123');

      expect(result.performance.currentNav).toBe(0);
      expect(result.performance.irr).toBe(0);
      expect(result.performance.multiple).toBe(0);
      expect(result.performance.totalCommitted).toBe(85000000); // from fund.commitedSize
      expect(result.performance.totalDrawn).toBe(25000000); // from fund.drawnSize
    });
  });

  describe('getFundsByType', () => {
    it('should return funds filtered by type', async () => {
      const peFunds = [mockFund, { ...mockFund, id: 'fund-456' }];
      mockPrismaService.fund.findMany.mockResolvedValue(peFunds);

      const result = await service.getFundsByType('PE');

      expect(mockPrismaService.fund.findMany).toHaveBeenCalledWith({
        where: {
          fundType: 'PE',
          isActive: true,
        },
        orderBy: { vintage: 'desc' },
      });
      expect(result).toHaveLength(2);
      expect(result[0].fundType).toBe('PE');
    });
  });

  describe('getFundsByVintage', () => {
    it('should return funds filtered by vintage', async () => {
      const vintage2024Funds = [mockFund];
      mockPrismaService.fund.findMany.mockResolvedValue(vintage2024Funds);

      const result = await service.getFundsByVintage(2024);

      expect(mockPrismaService.fund.findMany).toHaveBeenCalledWith({
        where: {
          vintage: 2024,
          isActive: true,
        },
        orderBy: { name: 'asc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].vintage).toBe(2024);
    });
  });

  describe('transformFundResponse', () => {
    it('should transform Prisma Decimal fields to numbers', () => {
      const prismaFund = {
        ...mockFund,
        targetSize: { toNumber: () => 100000000 },
        commitedSize: { toNumber: () => 85000000 },
        drawnSize: { toNumber: () => 25000000 },
        managementFee: { toNumber: () => 0.02 },
        carriedInterest: { toNumber: () => 0.20 },
        description: 'Test description',
      };

      // Access private method for testing
      const result = (service as any).transformFundResponse(prismaFund);

      expect(typeof result.targetSize).toBe('number');
      expect(typeof result.commitedSize).toBe('number');
      expect(typeof result.drawnSize).toBe('number');
      expect(typeof result.managementFee).toBe('number');
      expect(typeof result.carriedInterest).toBe('number');
      expect(result.description).toBe('Test description');
    });

    it('should handle null values correctly', () => {
      const prismaFund = {
        ...mockFund,
        targetSize: 100000000,
        commitedSize: 85000000,
        drawnSize: 25000000,
        managementFee: null,
        carriedInterest: null,
        description: null,
      };

      const result = (service as any).transformFundResponse(prismaFund);

      expect(result.managementFee).toBeNull();
      expect(result.carriedInterest).toBeNull();
      expect(result.description).toBeUndefined();
    });
  });
});