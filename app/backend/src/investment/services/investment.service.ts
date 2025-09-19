import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateInvestmentDto, UpdateInvestmentDto, InvestmentSummaryDto } from '../dto/investment.dto';
import { Prisma } from '../../../generated/prisma';

@Injectable()
export class InvestmentService {
  constructor(private prisma: PrismaService) {}

  async createInvestment(userId: string, createInvestmentDto: CreateInvestmentDto) {
    // Check if fund exists
    const fund = await this.prisma.fund.findUnique({
      where: { id: createInvestmentDto.fundId },
    });

    if (!fund) {
      throw new NotFoundException('Fund not found');
    }

    // Check if user already has investment in this fund
    const existingInvestment = await this.prisma.investment.findUnique({
      where: {
        userId_fundId: {
          userId,
          fundId: createInvestmentDto.fundId,
        },
      },
    });

    if (existingInvestment) {
      throw new ForbiddenException('User already has an investment in this fund');
    }

    const investment = await this.prisma.investment.create({
      data: {
        userId,
        fundId: createInvestmentDto.fundId,
        commitmentAmount: createInvestmentDto.commitmentAmount,
        drawnAmount: createInvestmentDto.drawnAmount || 0,
        distributedAmount: createInvestmentDto.distributedAmount || 0,
        currentValue: createInvestmentDto.currentValue || createInvestmentDto.commitmentAmount,
        irr: createInvestmentDto.irr,
        multiple: createInvestmentDto.multiple,
        status: createInvestmentDto.status || 'ACTIVE',
        investmentDate: new Date(createInvestmentDto.investmentDate),
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

    return this.transformInvestmentResponse(investment);
  }

  private transformInvestmentResponse(investment: any) {
    return {
      ...investment,
      commitmentAmount: Number(investment.commitmentAmount),
      drawnAmount: Number(investment.drawnAmount),
      distributedAmount: Number(investment.distributedAmount),
      currentValue: Number(investment.currentValue),
      irr: investment.irr ? Number(investment.irr) : null,
      multiple: investment.multiple ? Number(investment.multiple) : null,
    };
  }

  async getUserInvestments(userId: string) {
    const investments = await this.prisma.investment.findMany({
      where: {
        userId,
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

    return investments.map(investment => this.transformInvestmentResponse(investment));
  }

  async getInvestmentById(userId: string, investmentId: string) {
    const investment = await this.prisma.investment.findFirst({
      where: {
        id: investmentId,
        userId,
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

    if (!investment) {
      throw new NotFoundException('Investment not found');
    }

    return this.transformInvestmentResponse(investment);
  }

  async updateInvestment(
    userId: string,
    investmentId: string,
    updateInvestmentDto: UpdateInvestmentDto,
  ) {
    const investment = await this.prisma.investment.findFirst({
      where: {
        id: investmentId,
        userId,
        isActive: true,
      },
    });

    if (!investment) {
      throw new NotFoundException('Investment not found');
    }

    const updateData: any = {};

    if (updateInvestmentDto.drawnAmount !== undefined) {
      updateData.drawnAmount = updateInvestmentDto.drawnAmount;
    }
    if (updateInvestmentDto.distributedAmount !== undefined) {
      updateData.distributedAmount = updateInvestmentDto.distributedAmount;
    }
    if (updateInvestmentDto.currentValue !== undefined) {
      updateData.currentValue = updateInvestmentDto.currentValue;
    }
    if (updateInvestmentDto.irr !== undefined) {
      updateData.irr = updateInvestmentDto.irr;
    }
    if (updateInvestmentDto.multiple !== undefined) {
      updateData.multiple = updateInvestmentDto.multiple;
    }
    if (updateInvestmentDto.status !== undefined) {
      updateData.status = updateInvestmentDto.status;
    }

    const updatedInvestment = await this.prisma.investment.update({
      where: { id: investmentId },
      data: updateData,
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

    return this.transformInvestmentResponse(updatedInvestment);
  }

  async deleteInvestment(userId: string, investmentId: string): Promise<void> {
    const investment = await this.prisma.investment.findFirst({
      where: {
        id: investmentId,
        userId,
        isActive: true,
      },
    });

    if (!investment) {
      throw new NotFoundException('Investment not found');
    }

    await this.prisma.investment.update({
      where: { id: investmentId },
      data: { isActive: false },
    });
  }

  async getInvestmentSummary(userId: string) {
    const investments = await this.prisma.investment.findMany({
      where: {
        userId,
        isActive: true,
      },
    });

    if (investments.length === 0) {
      return {
        totalInvestments: 0,
        totalCommitted: 0,
        totalDrawn: 0,
        totalDistributed: 0,
        totalCurrentValue: 0,
        overallIrr: 0,
        overallMultiple: 0,
        unfundedCommitment: 0,
      };
    }

    const totalCommitted = investments.reduce(
      (sum, inv) => sum + Number(inv.commitmentAmount),
      0,
    );
    const totalDrawn = investments.reduce(
      (sum, inv) => sum + Number(inv.drawnAmount),
      0,
    );
    const totalDistributed = investments.reduce(
      (sum, inv) => sum + Number(inv.distributedAmount),
      0,
    );
    const totalCurrentValue = investments.reduce(
      (sum, inv) => sum + Number(inv.currentValue),
      0,
    );

    // Calculate weighted average IRR and multiple
    let weightedIrr = 0;
    let weightedMultiple = 0;

    investments.forEach((inv) => {
      const currentValue = Number(inv.currentValue);
      if (inv.irr && currentValue > 0) {
        weightedIrr += Number(inv.irr) * currentValue;
      }
      if (inv.multiple && currentValue > 0) {
        weightedMultiple += Number(inv.multiple) * currentValue;
      }
    });

    const overallIrr = totalCurrentValue > 0 ? weightedIrr / totalCurrentValue : 0;
    const overallMultiple = totalCurrentValue > 0 ? weightedMultiple / totalCurrentValue : 0;
    const unfundedCommitment = totalCommitted - totalDrawn;

    return {
      totalInvestments: investments.length,
      totalCommitted,
      totalDrawn,
      totalDistributed,
      totalCurrentValue,
      overallIrr,
      overallMultiple,
      unfundedCommitment,
    };
  }

  async getInvestmentPerformance(userId: string, investmentId: string) {
    const investment = await this.getInvestmentById(userId, investmentId);

    // Get fund valuations for performance tracking
    const valuations = await this.prisma.valuation.findMany({
      where: {
        fundId: investment.fundId,
        isActive: true,
      },
      orderBy: {
        valuationDate: 'asc',
      },
    });

    const currentValue = Number(investment.currentValue);
    const distributedAmount = Number(investment.distributedAmount);
    const drawnAmount = Number(investment.drawnAmount);
    const totalReturn = currentValue + distributedAmount - drawnAmount;

    return {
      investment,
      valuations,
      performance: {
        totalReturn,
        totalReturnPercentage: drawnAmount > 0 ? (totalReturn / drawnAmount) * 100 : 0,
        irr: Number(investment.irr) || 0,
        multiple: Number(investment.multiple) || 0,
        unrealizedGain: currentValue - drawnAmount,
        realizedGain: distributedAmount,
      },
    };
  }
}