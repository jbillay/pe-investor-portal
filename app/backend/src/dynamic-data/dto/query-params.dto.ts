import { IsOptional, IsString, IsInt, Min, Max, IsEnum, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc'
}

export class QueryParamsDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Field key to sort by' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.ASC })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.ASC;

  @ApiPropertyOptional({ description: 'Global search term' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter object with field keys and values',
    example: { fundType: 'pe', fundValue: { gte: 1000000 } }
  })
  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;
}

export class SearchInstancesDto {
  @ApiPropertyOptional({
    description: 'Array of filter criteria',
    example: [
      { fieldKey: 'fundValue', operator: 'gte', value: 1000000 },
      { fieldKey: 'fundStartDate', operator: 'between', value: ['2010-01-01', '2020-12-31'] }
    ]
  })
  @IsOptional()
  filters?: Array<{
    fieldKey: string;
    operator: string;
    value: any;
  }>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: SortOrder })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
