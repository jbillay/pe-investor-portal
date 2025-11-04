import { Module, Global } from '@nestjs/common';
import { AuditLoggerService } from './audit-logger.service';
import { SanitizationService } from '../utils/sanitization.service';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Common Services Module
 *
 * This global module provides shared services that can be used across the entire application.
 * Being marked as @Global, these services are available without explicit imports in other modules.
 *
 * Services provided:
 * - AuditLoggerService: Audit logging for security events
 * - SanitizationService: Input sanitization to prevent XSS and SQL injection
 */
@Global()
@Module({
  imports: [PrismaModule],
  providers: [AuditLoggerService, SanitizationService],
  exports: [AuditLoggerService, SanitizationService],
})
export class CommonServicesModule {}
