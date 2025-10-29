import { IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInstanceDto {
  @ApiProperty({
    description: 'Dynamic field values as key-value pairs',
    example: {
      fundName: 'OPC II',
      fundValue: 1000000,
      fundStartDate: '1981-10-12',
      fundType: 'pe'
    }
  })
  @IsObject()
  values: Record<string, any>;
}

export class UpdateInstanceDto {
  @ApiProperty({
    description: 'Dynamic field values to update as key-value pairs',
    example: {
      fundValue: 1500000,
      fundDescription: 'Updated description'
    }
  })
  @IsObject()
  values: Record<string, any>;
}
