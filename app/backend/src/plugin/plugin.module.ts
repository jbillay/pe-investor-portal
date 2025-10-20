/**
 * Plugin Module
 * Main module for plugin system
 */

import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { PrismaModule } from '../common/prisma/prisma.module';
import { PluginController } from './controllers/plugin.controller';
import { PluginFilesController } from './controllers/plugin-files.controller';
import { PluginService } from './services/plugin.service';
import { PluginValidatorService } from './services/plugin-validator.service';
import { PluginStorageService } from './services/plugin-storage.service';
import { PluginRegistryService } from './services/plugin-registry.service';

@Module({
  imports: [
    PrismaModule,
    MulterModule.register({
      dest: './plugins/uploads',
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  ],
  controllers: [PluginController, PluginFilesController],
  providers: [
    PluginService,
    PluginValidatorService,
    PluginStorageService,
    PluginRegistryService,
  ],
  exports: [PluginService, PluginRegistryService, PluginStorageService],
})
export class PluginModule {}
