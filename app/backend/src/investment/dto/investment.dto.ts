import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsDateString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInvestmentDto {
  @ApiProperty({ description: 'Fund ID' })
  @IsUUID()
  fundId: string;

  @ApiProperty({ description: 'Commitment amount', example: 1000000.00 })
  @IsNumber()
  @Type(() => Number)
  commitmentAmount: number;

  @ApiProperty({ description: 'Investment date' })
  @IsDateString()
  investmentDate: string;

  @ApiPropertyOptional({ description: 'Drawn amount', example: 0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  drawnAmount?: number;

  @ApiPropertyOptional({ description: 'Distributed amount', example: 0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  distributedAmount?: number;

  @ApiPropertyOptional({ description: 'Current value', example: 1000000.00 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  currentValue?: number;

  @ApiPropertyOptional({ description: 'Internal Rate of Return', example: 0.125 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  irr?: number;

  @ApiPropertyOptional({ description: 'Multiple of Invested Capital', example: 1.5 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  multiple?: number;

  @ApiPropertyOptional({ description: 'Investment status', enum: ['ACTIVE', 'EXITED', 'DEFAULTED'] })
  @IsOptional()
  @IsEnum(['ACTIVE', 'EXITED', 'DEFAULTED'])
  status?: string;
}

export class UpdateInvestmentDto {
  @ApiPropertyOptional({ description: 'Drawn amount', example: 250000.00 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  drawnAmount?: number;

  @ApiPropertyOptional({ description: 'Distributed amount', example: 50000.00 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  distributedAmount?: number;

  @ApiPropertyOptional({ description: 'Current value', example: 1200000.00 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  currentValue?: number;

  @ApiPropertyOptional({ description: 'Internal Rate of Return', example: 0.125 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  irr?: number;

  @ApiPropertyOptional({ description: 'Multiple of Invested Capital', example: 1.5 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  multiple?: number;

  @ApiPropertyOptional({ description: 'Investment status', enum: ['ACTIVE', 'EXITED', 'DEFAULTED'] })
  @IsOptional()
  @IsEnum(['ACTIVE', 'EXITED', 'DEFAULTED'])
  status?: string;
}

export class InvestmentResponseDto {
  @ApiProperty({ description: 'Investment ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Fund ID' })
  fundId: string;

  @ApiProperty({ description: 'Commitment amount' })
  commitmentAmount: number;

  @ApiProperty({ description: 'Drawn amount' })
  drawnAmount: number;

  @ApiProperty({ description: 'Distributed amount' })
  distributedAmount: number;

  @ApiProperty({ description: 'Current value' })
  currentValue: number;

  @ApiPropertyOptional({ description: 'Internal Rate of Return' })
  irr?: number;

  @ApiPropertyOptional({ description: 'Multiple of Invested Capital' })
  multiple?: number;

  @ApiProperty({ description: 'Investment status' })
  status: string;

  @ApiProperty({ description: 'Investment date' })
  investmentDate: Date;

  @ApiProperty({ description: 'Is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Fund details' })
  fund?: {
    id: string;
    name: string;
    fundType: string;
    vintage: number;
    currency: string;
    status: string;
  };
}

export class InvestmentSummaryDto {
  @ApiProperty({ description: 'Total number of investments' })
  totalInvestments: number;

  @ApiProperty({ description: 'Total committed amount' })
  totalCommitted: number;

  @ApiProperty({ description: 'Total drawn amount' })
  totalDrawn: number;

  @ApiProperty({ description: 'Total distributed amount' })
  totalDistributed: number;

  @ApiProperty({ description: 'Total current value' })
  totalCurrentValue: number;

  @ApiProperty({ description: 'Overall IRR' })
  overallIrr: number;

  @ApiProperty({ description: 'Overall multiple' })
  overallMultiple: number;

  @ApiProperty({ description: 'Unfunded commitment' })
  unfundedCommitment: number;
}