import { IsString, IsOptional, IsBoolean, IsArray, ValidateNested, IsInt, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FieldDataType, ValidationRuleType } from '../../../generated/prisma';

export class ValidationRuleDto {
  @ApiProperty({ enum: ValidationRuleType })
  @IsEnum(ValidationRuleType)
  ruleType: ValidationRuleType;

  @ApiProperty({ description: 'Rule value (e.g., "3" for minLength, regex pattern for REGEX)' })
  @IsString()
  ruleValue: string;

  @ApiProperty({ description: 'Error message to display when validation fails' })
  @IsString()
  errorMessage: string;
}

export class DropdownOptionDto {
  @ApiProperty()
  @IsString()
  label: string;

  @ApiProperty()
  @IsString()
  value: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  orderIndex: number;
}

export class CreateFieldDto {
  @ApiProperty({ description: 'Human-readable field name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'camelCase field key', required: false })
  @IsOptional()
  @IsString()
  fieldKey?: string;

  @ApiProperty({ enum: FieldDataType })
  @IsEnum(FieldDataType)
  dataType: FieldDataType;

  @ApiProperty()
  @IsInt()
  @Min(0)
  fieldOrder: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsBoolean()
  isMandatory: boolean;

  @ApiProperty()
  @IsBoolean()
  isReadOnly: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  defaultValue?: string;

  @ApiPropertyOptional({ type: [ValidationRuleDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ValidationRuleDto)
  validationRules?: ValidationRuleDto[];

  @ApiPropertyOptional({ type: [DropdownOptionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DropdownOptionDto)
  dropdownOptions?: DropdownOptionDto[];
}

export class CreateDataObjectDto {
  @ApiProperty({ description: 'Human-readable data object name' })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'camelCase unique identifier', required: false })
  @IsOptional()
  @IsString()
  dataKey?: string;

  @ApiPropertyOptional({ type: [CreateFieldDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFieldDto)
  fields?: CreateFieldDto[];
}
