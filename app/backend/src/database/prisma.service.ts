import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // Configure connection pool based on environment
    const isTestEnv = process.env.NODE_ENV === 'test';

    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      // Increase connection pool for test environment to handle parallel tests
      // Default is 10, but we need more for Playwright running 6 workers with 300 tests
      // Formula: (num_workers * 2) + buffer = (6 * 2) + 10 = 22 minimum
      // We'll set 50 for safety margin
      __internal: {
        engine: {
          connection_limit: isTestEnv ? 50 : 10,
        },
      } as any,
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}