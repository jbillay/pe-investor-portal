import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateFundDto, UpdateFundDto, FundSummaryDto } from '../dto/fund.dto';

@Injectable()
export class FundService {
  constructor(private prisma: PrismaService) {}

  async createFund(createFundDto: CreateFundDto) {
    const data = {
      ...createFundDto,
      targetSize: createFundDto.targetSize,
      commitedSize: createFundDto.commitedSize,
      closeDate: createFundDto.closeDate ? new Date(createFundDto.closeDate) : undefined,
      finalClose: createFundDto.finalClose ? new Date(createFundDto.finalClose) : undefined,
      liquidationDate: createFundDto.liquidationDate ? new Date(createFundDto.liquidationDate) : undefined,
      managementFee: createFundDto.managementFee,
      carriedInterest: createFundDto.carriedInterest,
    };

    const fund = await this.prisma.fund.create({ data });
    return this.transformFundResponse(fund);
  }

  private transformFundResponse(fund: any) {
    return {
      ...fund,
      targetSize: Number(fund.targetSize),
      commitedSize: Number(fund.commitedSize),
      drawnSize: Number(fund.drawnSize),
      managementFee: fund.managementFee ? Number(fund.managementFee) : null,
      carriedInterest: fund.carriedInterest ? Number(fund.carriedInterest) : null,
      description: fund.description || undefined,
    };
  }

  async getAllFunds() {
    const funds = await this.prisma.fund.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    return funds.map(fund => this.transformFundResponse(fund));
  }

  async getFundById(fundId: string) {
    const fund = await this.prisma.fund.findFirst({
      where: {
        id: fundId,
        isActive: true,
      },
    });

    if (!fund) {
      throw new NotFoundException('Fund not found');
    }

    return this.transformFundResponse(fund);
  }

  async updateFund(fundId: string, updateFundDto: UpdateFundDto) {
    // Get fund without transformation to avoid recursion
    const fund = await this.prisma.fund.findFirst({
      where: { id: fundId, isActive: true }
    });

    if (!fund) {
      throw new NotFoundException('Fund not found');
    }

    const updateData: any = {};

    if (updateFundDto.description !== undefined) {
      updateData.description = updateFundDto.description;
    }
    if (updateFundDto.drawnSize !== undefined) {
      updateData.drawnSize = updateFundDto.drawnSize;
    }
    if (updateFundDto.status !== undefined) {
      updateData.status = updateFundDto.status;
    }
    if (updateFundDto.finalClose !== undefined) {
      updateData.finalClose = new Date(updateFundDto.finalClose);
    }
    if (updateFundDto.liquidationDate !== undefined) {
      updateData.liquidationDate = new Date(updateFundDto.liquidationDate);
    }
    if (updateFundDto.isActive !== undefined) {
      updateData.isActive = updateFundDto.isActive;
    }

    const updatedFund = await this.prisma.fund.update({
      where: { id: fundId },
      data: updateData,
    });

    return this.transformFundResponse(updatedFund);
  }

  async deleteFund(fundId: string): Promise<void> {
    await this.getFundById(fundId);

    await this.prisma.fund.update({
      where: { id: fundId },
      data: { isActive: false },
    });
  }

  async getFundSummary(fundId: string) {
    const fund = await this.getFundById(fundId);

    // Get investment aggregations
    const investmentAggregation = await this.prisma.investment.aggregate({
      where: {
        fundId,
        isActive: true,
      },
      _count: { id: true },
      _sum: {
        commitmentAmount: true,
        drawnAmount: true,
        distributedAmount: true,
        currentValue: true,
      },
    });

    // Get latest valuation
    const latestValuation = await this.prisma.valuation.findFirst({
      where: {
        fundId,
        isActive: true,
      },
      orderBy: {
        valuationDate: 'desc',
      },
    });

    return {
      fund,
      investorCount: investmentAggregation._count.id,
      totalInvestorCommitment: Number(investmentAggregation._sum.commitmentAmount) || 0,
      totalDrawn: Number(investmentAggregation._sum.drawnAmount) || 0,
      totalDistributed: Number(investmentAggregation._sum.distributedAmount) || 0,
      currentNav: Number(investmentAggregation._sum.currentValue) || 0,
      irr: latestValuation?.irr ? Number(latestValuation.irr) : undefined,
      multiple: latestValuation?.multiple ? Number(latestValuation.multiple) : undefined,
      latestValuationDate: latestValuation?.valuationDate,
    };
  }

  async getFundsForUser(userId: string) {
    // Get funds where user has investments
    const userInvestments = await this.prisma.investment.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        fund: true,
      },
    });

    return userInvestments.map(investment => this.transformFundResponse(investment.fund));
  }

  async getFundPerformance(fundId: string) {
    const fund = await this.getFundById(fundId);

    // Get all valuations for the fund
    const valuations = await this.prisma.valuation.findMany({
      where: {
        fundId,
        isActive: true,
      },
      orderBy: {
        valuationDate: 'asc',
      },
    });

    // Get capital calls and distributions
    const capitalCalls = await this.prisma.capitalCall.findMany({
      where: {
        fundId,
        isActive: true,
      },
      include: {
        investors: {
          include: {
            investment: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        callDate: 'desc',
      },
    });

    const distributions = await this.prisma.distribution.findMany({
      where: {
        fundId,
        isActive: true,
      },
      include: {
        investors: {
          include: {
            investment: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        paymentDate: 'desc',
      },
    });

    const latestValuation = valuations[valuations.length - 1];

    return {
      fund,
      valuations,
      capitalCalls,
      distributions,
      performance: {
        currentNav: latestValuation?.totalValue ? Number(latestValuation.totalValue) : 0,
        irr: latestValuation?.irr ? Number(latestValuation.irr) : 0,
        multiple: latestValuation?.multiple ? Number(latestValuation.multiple) : 0,
        totalCommitted: latestValuation?.totalCommitted ? Number(latestValuation.totalCommitted) : Number(fund.commitedSize),
        totalDrawn: latestValuation?.totalDrawn ? Number(latestValuation.totalDrawn) : Number(fund.drawnSize),
        totalDistributed: latestValuation?.totalDistributed ? Number(latestValuation.totalDistributed) : 0,
        unrealizedValue: latestValuation?.unrealizedValue ? Number(latestValuation.unrealizedValue) : 0,
        realizedValue: latestValuation?.realizedValue ? Number(latestValuation.realizedValue) : 0,
      },
    };
  }

  async getFundsByType(fundType: string) {
    const funds = await this.prisma.fund.findMany({
      where: {
        fundType,
        isActive: true,
      },
      orderBy: { vintage: 'desc' },
    });
    return funds.map(fund => this.transformFundResponse(fund));
  }

  async getFundsByVintage(vintage: number) {
    const funds = await this.prisma.fund.findMany({
      where: {
        vintage,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });
    return funds.map(fund => this.transformFundResponse(fund));
  }
}