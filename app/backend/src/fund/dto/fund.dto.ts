import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsDateString, IsOptional, IsEnum, IsInt, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFundDto {
  @ApiProperty({ description: 'Fund name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Fund description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Fund type', enum: ['PE', 'VC', 'GROWTH', 'REAL_ESTATE', 'INFRASTRUCTURE', 'DEBT'] })
  @IsEnum(['PE', 'VC', 'GROWTH', 'REAL_ESTATE', 'INFRASTRUCTURE', 'DEBT'])
  fundType: string;

  @ApiProperty({ description: 'Fund vintage year', example: 2024 })
  @IsInt()
  vintage: number;

  @ApiProperty({ description: 'Target fund size', example: 100000000.00 })
  @IsNumber()
  @Type(() => Number)
  targetSize: number;

  @ApiProperty({ description: 'Committed fund size', example: 85000000.00 })
  @IsNumber()
  @Type(() => Number)
  commitedSize: number;

  @ApiPropertyOptional({ description: 'Currency', default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Fund close date' })
  @IsOptional()
  @IsDateString()
  closeDate?: string;

  @ApiPropertyOptional({ description: 'Final close date' })
  @IsOptional()
  @IsDateString()
  finalClose?: string;

  @ApiPropertyOptional({ description: 'Expected liquidation date' })
  @IsOptional()
  @IsDateString()
  liquidationDate?: string;

  @ApiPropertyOptional({ description: 'Management fee percentage', example: 0.02 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  managementFee?: number;

  @ApiPropertyOptional({ description: 'Carried interest percentage', example: 0.20 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  carriedInterest?: number;
}

export class UpdateFundDto {
  @ApiPropertyOptional({ description: 'Fund description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Drawn fund size', example: 25000000.00 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  drawnSize?: number;

  @ApiPropertyOptional({ description: 'Fund status', enum: ['ACTIVE', 'CLOSED', 'LIQUIDATED'] })
  @IsOptional()
  @IsEnum(['ACTIVE', 'CLOSED', 'LIQUIDATED'])
  status?: string;

  @ApiPropertyOptional({ description: 'Final close date' })
  @IsOptional()
  @IsDateString()
  finalClose?: string;

  @ApiPropertyOptional({ description: 'Expected liquidation date' })
  @IsOptional()
  @IsDateString()
  liquidationDate?: string;

  @ApiPropertyOptional({ description: 'Is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class FundResponseDto {
  @ApiProperty({ description: 'Fund ID' })
  id: string;

  @ApiProperty({ description: 'Fund name' })
  name: string;

  @ApiPropertyOptional({ description: 'Fund description' })
  description?: string;

  @ApiProperty({ description: 'Fund type' })
  fundType: string;

  @ApiProperty({ description: 'Fund vintage year' })
  vintage: number;

  @ApiProperty({ description: 'Target fund size' })
  targetSize: number;

  @ApiProperty({ description: 'Committed fund size' })
  commitedSize: number;

  @ApiProperty({ description: 'Drawn fund size' })
  drawnSize: number;

  @ApiProperty({ description: 'Currency' })
  currency: string;

  @ApiProperty({ description: 'Fund status' })
  status: string;

  @ApiPropertyOptional({ description: 'Fund close date' })
  closeDate?: Date;

  @ApiPropertyOptional({ description: 'Final close date' })
  finalClose?: Date;

  @ApiPropertyOptional({ description: 'Expected liquidation date' })
  liquidationDate?: Date;

  @ApiPropertyOptional({ description: 'Management fee percentage' })
  managementFee?: number;

  @ApiPropertyOptional({ description: 'Carried interest percentage' })
  carriedInterest?: number;

  @ApiProperty({ description: 'Is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;
}

export class FundSummaryDto {
  @ApiProperty({ description: 'Fund basic info' })
  fund: FundResponseDto;

  @ApiProperty({ description: 'Number of investors' })
  investorCount: number;

  @ApiProperty({ description: 'Total committed by investors' })
  totalInvestorCommitment: number;

  @ApiProperty({ description: 'Total drawn from investors' })
  totalDrawn: number;

  @ApiProperty({ description: 'Total distributed to investors' })
  totalDistributed: number;

  @ApiProperty({ description: 'Current NAV' })
  currentNav: number;

  @ApiPropertyOptional({ description: 'Fund IRR' })
  irr?: number;

  @ApiPropertyOptional({ description: 'Fund multiple' })
  multiple?: number;

  @ApiProperty({ description: 'Latest valuation date' })
  latestValuationDate?: Date;
}