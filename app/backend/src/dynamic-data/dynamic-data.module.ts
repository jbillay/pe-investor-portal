import { Module } from '@nestjs/common';
import { DynamicController } from './controllers/dynamic.controller';
import { DataInstanceController } from './controllers/data-instance.controller';
import { SchemaService } from './services/schema.service';
import { InstanceService } from './services/instance.service';
import { ValidationService } from './services/validation.service';
import { ExportService } from './services/export.service';
import { DynamicPermissionGuard } from './guards/dynamic-permission.guard';

@Module({
  controllers: [DynamicController, DataInstanceController],
  providers: [
    SchemaService,
    InstanceService,
    ValidationService,
    ExportService,
    DynamicPermissionGuard,
  ],
  exports: [
    SchemaService,
    InstanceService,
    ValidationService,
    ExportService,
  ],
})
export class DynamicDataModule {}
