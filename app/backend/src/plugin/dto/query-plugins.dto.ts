/**
 * Query Plugins DTO
 * Data Transfer Object for querying plugins
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryPluginsDto {
  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: ['UPLOADED', 'INSTALLED', 'FAILED', 'UNINSTALLED'],
    example: 'INSTALLED',
  })
  @IsOptional()
  @IsEnum(['UPLOADED', 'INSTALLED', 'FAILED', 'UNINSTALLED'])
  status?: 'UPLOADED' | 'INSTALLED' | 'FAILED' | 'UNINSTALLED';

  @ApiPropertyOptional({
    description: 'Search by plugin name or ID',
    example: 'analytics',
  })
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'createdAt',
  })
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
