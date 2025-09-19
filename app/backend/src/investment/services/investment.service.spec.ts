import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { InvestmentService } from './investment.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateInvestmentDto, UpdateInvestmentDto } from '../dto/investment.dto';

describe('InvestmentService', () => {
  let service: InvestmentService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    investment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      aggregate: jest.fn(),
    },
    fund: {
      findUnique: jest.fn(),
    },
    valuation: {
      findMany: jest.fn(),
    },
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
    fundType: 'PE',
    vintage: 2024,
    currency: 'USD',
    status: 'ACTIVE',
    targetSize: 100000000,
    commitedSize: 85000000,
    drawnSize: 25000000,
    isActive: true,
  };

  const mockInvestment = {
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
    investmentDate: new Date('2024-01-15'),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    fund: {
      id: 'fund-123',
      name: 'Test Fund',
      fundType: 'PE',
      vintage: 2024,
      currency: 'USD',
      status: 'ACTIVE',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvestmentService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<InvestmentService>(InvestmentService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createInvestment', () => {
    const createInvestmentDto: CreateInvestmentDto = {
      fundId: 'fund-123',
      commitmentAmount: 1000000,
      investmentDate: '2024-01-15',
      drawnAmount: 0,
      distributedAmount: 0,
      currentValue: 1000000,
      status: 'ACTIVE',
    };

    it('should create an investment successfully', async () => {
      mockPrismaService.fund.findUnique.mockResolvedValue(mockFund);
      mockPrismaService.investment.findUnique.mockResolvedValue(null);
      mockPrismaService.investment.create.mockResolvedValue(mockInvestment);

      const result = await service.createInvestment(mockUser.id, createInvestmentDto);

      expect(mockPrismaService.fund.findUnique).toHaveBeenCalledWith({
        where: { id: 'fund-123' },
      });
      expect(mockPrismaService.investment.findUnique).toHaveBeenCalledWith({
        where: {
          userId_fundId: {
            userId: 'user-123',
            fundId: 'fund-123',
          },
        },
      });
      expect(mockPrismaService.investment.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          fundId: 'fund-123',
          commitmentAmount: 1000000,
          drawnAmount: 0,
          distributedAmount: 0,
          currentValue: 1000000,
          irr: undefined,
          multiple: undefined,
          status: 'ACTIVE',
          investmentDate: new Date('2024-01-15'),
        },
        include: {
          fund: {
            select: {
              id: true,
              name: true,
              fundType: true,
              vintage: true,
              currency: true,
              status: true,
            },
          },
        },
      });
      expect(result.commitmentAmount).toBe(1000000);
      expect(result.drawnAmount).toBe(250000);
      expect(result.currentValue).toBe(1200000);
    });

    it('should throw NotFoundException when fund does not exist', async () => {
      mockPrismaService.fund.findUnique.mockResolvedValue(null);

      await expect(
        service.createInvestment(mockUser.id, createInvestmentDto)
      ).rejects.toThrow(NotFoundException);

      expect(mockPrismaService.fund.findUnique).toHaveBeenCalledWith({
        where: { id: 'fund-123' },
      });
    });

    it('should throw ForbiddenException when user already has investment in fund', async () => {
      mockPrismaService.fund.findUnique.mockResolvedValue(mockFund);
      mockPrismaService.investment.findUnique.mockResolvedValue(mockInvestment);

      await expect(
        service.createInvestment(mockUser.id, createInvestmentDto)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getUserInvestments', () => {
    it('should return user investments with transformations', async () => {
      const investments = [mockInvestment, { ...mockInvestment, id: 'investment-456' }];
      mockPrismaService.investment.findMany.mockResolvedValue(investments);

      const result = await service.getUserInvestments(mockUser.id);

      expect(mockPrismaService.investment.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          isActive: true,
        },
        include: {
          fund: {
            select: {
              id: true,
              name: true,
              fundType: true,
              vintage: true,
              currency: true,
              status: true,
            },
          },
        },
        orderBy: {
          investmentDate: 'desc',
        },
      });
      expect(result).toHaveLength(2);
      expect(result[0].commitmentAmount).toBe(1000000);
      expect(typeof result[0].commitmentAmount).toBe('number');
    });

    it('should return empty array when user has no investments', async () => {
      mockPrismaService.investment.findMany.mockResolvedValue([]);

      const result = await service.getUserInvestments(mockUser.id);

      expect(result).toEqual([]);
    });
  });

  describe('getInvestmentById', () => {
    it('should return investment by id with transformations', async () => {
      mockPrismaService.investment.findFirst.mockResolvedValue(mockInvestment);

      const result = await service.getInvestmentById(mockUser.id, 'investment-123');

      expect(mockPrismaService.investment.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'investment-123',
          userId: 'user-123',
          isActive: true,
        },
        include: {
          fund: {
            select: {
              id: true,
              name: true,
              fundType: true,
              vintage: true,
              currency: true,
              status: true,
              description: true,
              targetSize: true,
              commitedSize: true,
              drawnSize: true,
            },
          },
        },
      });
      expect(result.commitmentAmount).toBe(1000000);
      expect(typeof result.commitmentAmount).toBe('number');
    });

    it('should throw NotFoundException when investment not found', async () => {
      mockPrismaService.investment.findFirst.mockResolvedValue(null);

      await expect(
        service.getInvestmentById(mockUser.id, 'non-existent')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateInvestment', () => {
    const updateDto: UpdateInvestmentDto = {
      drawnAmount: 300000,
      currentValue: 1300000,
      irr: 0.15,
    };

    it('should update investment successfully', async () => {
      mockPrismaService.investment.findFirst.mockResolvedValue(mockInvestment);
      mockPrismaService.investment.update.mockResolvedValue({
        ...mockInvestment,
        drawnAmount: 300000,
        currentValue: 1300000,
        irr: 0.15,
      });

      const result = await service.updateInvestment(mockUser.id, 'investment-123', updateDto);

      expect(mockPrismaService.investment.update).toHaveBeenCalledWith({
        where: { id: 'investment-123' },
        data: {
          drawnAmount: 300000,
          currentValue: 1300000,
          irr: 0.15,
        },
        include: {
          fund: {
            select: {
              id: true,
              name: true,
              fundType: true,
              vintage: true,
              currency: true,
              status: true,
            },
          },
        },
      });
      expect(result.drawnAmount).toBe(300000);
      expect(result.currentValue).toBe(1300000);
    });

    it('should throw NotFoundException when investment not found', async () => {
      mockPrismaService.investment.findFirst.mockResolvedValue(null);

      await expect(
        service.updateInvestment(mockUser.id, 'non-existent', updateDto)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteInvestment', () => {
    it('should soft delete investment successfully', async () => {
      mockPrismaService.investment.findFirst.mockResolvedValue(mockInvestment);
      mockPrismaService.investment.update.mockResolvedValue({ ...mockInvestment, isActive: false });

      await service.deleteInvestment(mockUser.id, 'investment-123');

      expect(mockPrismaService.investment.update).toHaveBeenCalledWith({
        where: { id: 'investment-123' },
        data: { isActive: false },
      });
    });

    it('should throw NotFoundException when investment not found', async () => {
      mockPrismaService.investment.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteInvestment(mockUser.id, 'non-existent')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getInvestmentSummary', () => {
    it('should return investment summary with correct calculations', async () => {
      const investments = [
        { commitmentAmount: 1000000, drawnAmount: 250000, distributedAmount: 50000, currentValue: 1200000, irr: 0.125, multiple: 1.2 },
        { commitmentAmount: 2000000, drawnAmount: 500000, distributedAmount: 100000, currentValue: 2400000, irr: 0.15, multiple: 1.25 },
      ];
      mockPrismaService.investment.findMany.mockResolvedValue(investments);

      const result = await service.getInvestmentSummary(mockUser.id);

      expect(result.totalInvestments).toBe(2);
      expect(result.totalCommitted).toBe(3000000);
      expect(result.totalDrawn).toBe(750000);
      expect(result.totalDistributed).toBe(150000);
      expect(result.totalCurrentValue).toBe(3600000);
      expect(result.unfundedCommitment).toBe(2250000);
      expect(typeof result.overallIrr).toBe('number');
      expect(typeof result.overallMultiple).toBe('number');
    });

    it('should return zero values when user has no investments', async () => {
      mockPrismaService.investment.findMany.mockResolvedValue([]);

      const result = await service.getInvestmentSummary(mockUser.id);

      expect(result.totalInvestments).toBe(0);
      expect(result.totalCommitted).toBe(0);
      expect(result.totalDrawn).toBe(0);
      expect(result.totalDistributed).toBe(0);
      expect(result.totalCurrentValue).toBe(0);
      expect(result.overallIrr).toBe(0);
      expect(result.overallMultiple).toBe(0);
      expect(result.unfundedCommitment).toBe(0);
    });
  });

  describe('getInvestmentPerformance', () => {
    it('should return investment performance with valuations', async () => {
      const valuations = [
        { id: 'val-1', valuationDate: new Date('2024-01-01'), totalValue: 1100000 },
        { id: 'val-2', valuationDate: new Date('2024-02-01'), totalValue: 1200000 },
      ];
      mockPrismaService.investment.findFirst.mockResolvedValue(mockInvestment);
      mockPrismaService.valuation.findMany.mockResolvedValue(valuations);

      const result = await service.getInvestmentPerformance(mockUser.id, 'investment-123');

      expect(result.investment).toBeDefined();
      expect(result.valuations).toEqual(valuations);
      expect(result.performance.totalReturn).toBe(1200000 + 50000 - 250000); // currentValue + distributed - drawn
      expect(result.performance.irr).toBe(0.125);
      expect(result.performance.multiple).toBe(1.2);
      expect(typeof result.performance.totalReturn).toBe('number');
    });
  });

  describe('transformInvestmentResponse', () => {
    it('should transform Prisma Decimal fields to numbers', () => {
      const prismaInvestment = {
        ...mockInvestment,
        commitmentAmount: { toNumber: () => 1000000 },
        drawnAmount: { toNumber: () => 250000 },
        currentValue: { toNumber: () => 1200000 },
        irr: { toNumber: () => 0.125 },
        multiple: { toNumber: () => 1.2 },
      };

      // Access private method for testing
      const result = (service as any).transformInvestmentResponse(prismaInvestment);

      expect(typeof result.commitmentAmount).toBe('number');
      expect(typeof result.drawnAmount).toBe('number');
      expect(typeof result.currentValue).toBe('number');
      expect(typeof result.irr).toBe('number');
      expect(typeof result.multiple).toBe('number');
    });

    it('should handle null/undefined IRR and multiple', () => {
      const prismaInvestment = {
        ...mockInvestment,
        commitmentAmount: 1000000,
        drawnAmount: 250000,
        currentValue: 1200000,
        irr: null,
        multiple: undefined,
      };

      const result = (service as any).transformInvestmentResponse(prismaInvestment);

      expect(result.irr).toBeNull();
      expect(result.multiple).toBeNull();
    });
  });
});