import { Module } from '@nestjs/common';
import { DataObjectController } from './controllers/data-object.controller';
import { DataObjectService } from './services/data-object.service';
import { FieldService } from './services/field.service';
import { VersioningService } from './services/versioning.service';

@Module({
  controllers: [DataObjectController],
  providers: [DataObjectService, FieldService, VersioningService],
  exports: [DataObjectService, FieldService, VersioningService],
})
export class DataObjectsModule {}
