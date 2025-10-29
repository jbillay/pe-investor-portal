import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { EmailModule } from './email/email.module';
import { InvestmentModule } from './investment/investment.module';
import { FundModule } from './fund/fund.module';
import { PluginModule } from './plugin/plugin.module';
import { DataObjectsModule } from './data-objects/data-objects.module';
import { DynamicDataModule } from './dynamic-data/dynamic-data.module';
import { HealthController } from './health/health.controller';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { SecurityMiddleware } from './common/middleware/security.middleware';
import { LoggingMiddleware } from './common/middleware/logging.middleware';
import { PrismaService } from './common/prisma/prisma.service';
import { CommonServicesModule } from './common/services/common-services.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    EventEmitterModule.forRoot(),
    CommonServicesModule,
    AuthModule,
    AdminModule,
    EmailModule,
    InvestmentModule,
    FundModule,
    PluginModule,
    DataObjectsModule,
    DynamicDataModule,
  ],
  controllers: [HealthController],
  providers: [
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SecurityMiddleware, LoggingMiddleware)
      .forRoutes('*');
  }
}
