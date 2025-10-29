import { PartialType } from '@nestjs/swagger';
import { CreateDataObjectDto } from './create-data-object.dto';

export class UpdateDataObjectDto extends PartialType(CreateDataObjectDto) {}
