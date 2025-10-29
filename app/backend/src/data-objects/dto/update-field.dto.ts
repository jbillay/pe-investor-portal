import { PartialType } from '@nestjs/swagger';
import { CreateFieldDto } from './create-data-object.dto';

export class UpdateFieldDto extends PartialType(CreateFieldDto) {}
