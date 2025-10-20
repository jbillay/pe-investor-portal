import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // Configure connection pool based on environment
    const isTestEnv = process.env.NODE_ENV === 'test';
    const baseUrl = process.env.DATABASE_URL || '';

    // Add connection pool parameters to the URL
    // Default is 10, but we need more for Playwright running 6 workers with 300 tests
    // Formula: (num_workers * 2) + buffer = (6 * 2) + 10 = 22 minimum
    // We'll set 50 for safety margin in test environment
    const connectionLimit = isTestEnv ? 50 : 10;
    const poolTimeout = 20; // seconds

    // Append connection pool parameters to DATABASE_URL
    const urlWithParams = baseUrl.includes('?')
      ? `${baseUrl}&connection_limit=${connectionLimit}&pool_timeout=${poolTimeout}`
      : `${baseUrl}?connection_limit=${connectionLimit}&pool_timeout=${poolTimeout}`;

    super({
      datasources: {
        db: {
          url: urlWithParams,
        },
      },
      log: isTestEnv ? ['error', 'warn'] : ['error', 'warn', 'info'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
