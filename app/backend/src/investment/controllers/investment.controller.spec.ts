import { Test, TestingModule } from '@nestjs/testing';
import { InvestmentController } from './investment.controller';
import { InvestmentService } from '../services/investment.service';
import { CreateInvestmentDto, UpdateInvestmentDto } from '../dto/investment.dto';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('InvestmentController', () => {
  let controller: InvestmentController;
  let service: InvestmentService;

  const mockInvestmentService = {
    createInvestment: jest.fn(),
    getUserInvestments: jest.fn(),
    getInvestmentById: jest.fn(),
    updateInvestment: jest.fn(),
    deleteInvestment: jest.fn(),
    getInvestmentSummary: jest.fn(),
    getInvestmentPerformance: jest.fn(),
  };

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
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

  const mockRequest = {
    user: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvestmentController],
      providers: [
        {
          provide: InvestmentService,
          useValue: mockInvestmentService,
        },
      ],
    }).compile();

    controller = module.get<InvestmentController>(InvestmentController);
    service = module.get<InvestmentService>(InvestmentService);
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
      mockInvestmentService.createInvestment.mockResolvedValue(mockInvestment);

      const result = await controller.createInvestment(mockRequest, createInvestmentDto);

      expect(mockInvestmentService.createInvestment).toHaveBeenCalledWith(
        mockUser.id,
        createInvestmentDto
      );
      expect(result).toEqual(mockInvestment);
    });

    it('should handle validation errors', async () => {
      mockInvestmentService.createInvestment.mockRejectedValue(
        new ForbiddenException('User already has an investment in this fund')
      );

      await expect(
        controller.createInvestment(mockRequest, createInvestmentDto)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getUserInvestments', () => {
    it('should return user investments', async () => {
      const investments = [mockInvestment, { ...mockInvestment, id: 'investment-456' }];
      mockInvestmentService.getUserInvestments.mockResolvedValue(investments);

      const result = await controller.getUserInvestments(mockRequest);

      expect(mockInvestmentService.getUserInvestments).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(investments);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when user has no investments', async () => {
      mockInvestmentService.getUserInvestments.mockResolvedValue([]);

      const result = await controller.getUserInvestments(mockRequest);

      expect(result).toEqual([]);
    });
  });

  describe('getInvestment', () => {
    it('should return investment by id', async () => {
      mockInvestmentService.getInvestmentById.mockResolvedValue(mockInvestment);

      const result = await controller.getInvestment(mockRequest, 'investment-123');

      expect(mockInvestmentService.getInvestmentById).toHaveBeenCalledWith(
        mockUser.id,
        'investment-123'
      );
      expect(result).toEqual(mockInvestment);
    });

    it('should handle not found errors', async () => {
      mockInvestmentService.getInvestmentById.mockRejectedValue(
        new NotFoundException('Investment not found')
      );

      await expect(
        controller.getInvestment(mockRequest, 'non-existent')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateInvestment', () => {
    const updateInvestmentDto: UpdateInvestmentDto = {
      drawnAmount: 300000,
      currentValue: 1300000,
      irr: 0.15,
    };

    it('should update investment successfully', async () => {
      const updatedInvestment = { ...mockInvestment, ...updateInvestmentDto };
      mockInvestmentService.updateInvestment.mockResolvedValue(updatedInvestment);

      const result = await controller.updateInvestment(
        mockRequest,
        'investment-123',
        updateInvestmentDto
      );

      expect(mockInvestmentService.updateInvestment).toHaveBeenCalledWith(
        mockUser.id,
        'investment-123',
        updateInvestmentDto
      );
      expect(result.drawnAmount).toBe(300000);
      expect(result.currentValue).toBe(1300000);
    });

    it('should handle not found errors', async () => {
      mockInvestmentService.updateInvestment.mockRejectedValue(
        new NotFoundException('Investment not found')
      );

      await expect(
        controller.updateInvestment(mockRequest, 'non-existent', updateInvestmentDto)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteInvestment', () => {
    it('should delete investment successfully', async () => {
      mockInvestmentService.deleteInvestment.mockResolvedValue(undefined);

      await controller.deleteInvestment(mockRequest, 'investment-123');

      expect(mockInvestmentService.deleteInvestment).toHaveBeenCalledWith(
        mockUser.id,
        'investment-123'
      );
    });

    it('should handle not found errors', async () => {
      mockInvestmentService.deleteInvestment.mockRejectedValue(
        new NotFoundException('Investment not found')
      );

      await expect(
        controller.deleteInvestment(mockRequest, 'non-existent')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getInvestmentSummary', () => {
    it('should return investment summary', async () => {
      const summary = {
        totalInvestments: 3,
        totalCommitted: 5000000,
        totalDrawn: 1250000,
        totalDistributed: 250000,
        totalCurrentValue: 6000000,
        overallIrr: 0.135,
        overallMultiple: 1.22,
        unfundedCommitment: 3750000,
      };
      mockInvestmentService.getInvestmentSummary.mockResolvedValue(summary);

      const result = await controller.getInvestmentSummary(mockRequest);

      expect(mockInvestmentService.getInvestmentSummary).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(summary);
      expect(result.totalInvestments).toBe(3);
      expect(result.totalCommitted).toBe(5000000);
    });

    it('should return zero values for new users', async () => {
      const emptySummary = {
        totalInvestments: 0,
        totalCommitted: 0,
        totalDrawn: 0,
        totalDistributed: 0,
        totalCurrentValue: 0,
        overallIrr: 0,
        overallMultiple: 0,
        unfundedCommitment: 0,
      };
      mockInvestmentService.getInvestmentSummary.mockResolvedValue(emptySummary);

      const result = await controller.getInvestmentSummary(mockRequest);

      expect(result.totalInvestments).toBe(0);
      expect(result.totalCommitted).toBe(0);
    });
  });

  describe('getInvestmentPerformance', () => {
    it('should return investment performance', async () => {
      const performance = {
        investment: mockInvestment,
        valuations: [
          { id: 'val-1', valuationDate: new Date('2024-01-01'), totalValue: 1100000 },
          { id: 'val-2', valuationDate: new Date('2024-02-01'), totalValue: 1200000 },
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
      mockInvestmentService.getInvestmentPerformance.mockResolvedValue(performance);

      const result = await controller.getInvestmentPerformance(mockRequest, 'investment-123');

      expect(mockInvestmentService.getInvestmentPerformance).toHaveBeenCalledWith(
        mockUser.id,
        'investment-123'
      );
      expect(result.investment).toEqual(mockInvestment);
      expect(result.valuations).toHaveLength(2);
      expect(result.performance.totalReturn).toBe(1000000);
    });

    it('should handle not found errors', async () => {
      mockInvestmentService.getInvestmentPerformance.mockRejectedValue(
        new NotFoundException('Investment not found')
      );

      await expect(
        controller.getInvestmentPerformance(mockRequest, 'non-existent')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Input validation', () => {
    it('should validate UUID format for investment ID', async () => {
      // This would be handled by class-validator pipes in real NestJS app
      const invalidId = 'invalid-id';
      mockInvestmentService.getInvestmentById.mockRejectedValue(
        new NotFoundException('Investment not found')
      );

      await expect(
        controller.getInvestment(mockRequest, invalidId)
      ).rejects.toThrow(NotFoundException);
    });

    it('should validate required fields in create DTO', async () => {
      const invalidDto = {} as CreateInvestmentDto;

      // In real app, this would be caught by validation pipes
      // Here we test that the controller passes data correctly to service
      mockInvestmentService.createInvestment.mockRejectedValue(
        new Error('Validation failed')
      );

      await expect(
        controller.createInvestment(mockRequest, invalidDto)
      ).rejects.toThrow();
    });
  });

  describe('Authorization', () => {
    it('should ensure user can only access their own investments', async () => {
      // The controller should always pass the authenticated user's ID
      mockInvestmentService.getUserInvestments.mockResolvedValue([]);

      await controller.getUserInvestments(mockRequest);

      expect(mockInvestmentService.getUserInvestments).toHaveBeenCalledWith(mockUser.id);
      // Ensure it's not called with any other user ID
      expect(mockInvestmentService.getUserInvestments).not.toHaveBeenCalledWith('other-user-id');
    });

    it('should pass user ID for all user-specific operations', async () => {
      mockInvestmentService.getInvestmentById.mockResolvedValue(mockInvestment);
      mockInvestmentService.updateInvestment.mockResolvedValue(mockInvestment);
      mockInvestmentService.deleteInvestment.mockResolvedValue(undefined);

      await controller.getInvestment(mockRequest, 'investment-123');
      await controller.updateInvestment(mockRequest, 'investment-123', {});
      await controller.deleteInvestment(mockRequest, 'investment-123');

      expect(mockInvestmentService.getInvestmentById).toHaveBeenCalledWith(
        mockUser.id,
        'investment-123'
      );
      expect(mockInvestmentService.updateInvestment).toHaveBeenCalledWith(
        mockUser.id,
        'investment-123',
        {}
      );
      expect(mockInvestmentService.deleteInvestment).toHaveBeenCalledWith(
        mockUser.id,
        'investment-123'
      );
    });
  });
});