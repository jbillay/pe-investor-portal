import { Module, Global } from '@nestjs/common';
import { AuditLoggerService } from './audit-logger.service';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Common Services Module
 *
 * This global module provides shared services that can be used across the entire application.
 * Being marked as @Global, these services are available without explicit imports in other modules.
 */
@Global()
@Module({
  imports: [PrismaModule],
  providers: [AuditLoggerService],
  exports: [AuditLoggerService],
})
export class CommonServicesModule {}