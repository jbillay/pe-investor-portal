import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import * as request from 'supertest';
import * as bcrypt from 'bcrypt';

import { AuthModule } from '../src/auth/auth.module';
import { PrismaModule } from '../src/common/prisma/prisma.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { TestDataGenerator } from './utils/test-utils';

describe('Authentication Performance (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const testConfig = () => ({
    DATABASE_URL: 'postgresql://test:test@localhost:5433/test',
    REDIS_HOST: 'localhost',
    REDIS_PORT: 6380,
    JWT_SECRET: 'test-jwt-secret-key-for-performance-testing',
    JWT_EXPIRES_IN: '15m',
    REFRESH_TOKEN_EXPIRES_IN: '7d',
    BCRYPT_ROUNDS: 12,
  });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [testConfig],
        }),
        ThrottlerModule.forRoot([
          {
            ttl: 60000,
            limit: 1000, // Higher limit for performance tests
          },
        ]),
        PrismaModule,
        AuthModule,
      ],
      providers: [
        {
          provide: APP_GUARD,
          useClass: ThrottlerGuard,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    // Clean up database and Redis before each test
    await prisma.session.deleteMany();
    await prisma.userProfile.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('Registration Performance', () => {

    it('should register users within acceptable time limits', async () => {
      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'performance-test@example.com',
          password: 'SecurePassword123!',
          firstName: 'Performance',
          lastName: 'Test',
        })
        .expect(201);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Registration should complete within 3 seconds (bcrypt is slow but should be reasonable)
      expect(responseTime).toBeLessThan(3000);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should handle concurrent registrations efficiently', async () => {
      const concurrentUsers = 10;
      const startTime = Date.now();

      const promises = [];
      for (let i = 0; i < concurrentUsers; i++) {
        promises.push(
          request(app.getHttpServer())
            .post('/auth/register')
            .send({
              email: `user-${i}@example.com`,
              password: 'SecurePassword123!',
              firstName: 'User',
              lastName: String(i),
            }),
        );
      }

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All registrations should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('accessToken');
      });

      // Should complete all registrations within reasonable time (parallel processing)
      expect(totalTime).toBeLessThan(8000); // 8 seconds for 10 concurrent registrations

      // Average time per registration should be reasonable
      const averageTime = totalTime / concurrentUsers;
      expect(averageTime).toBeLessThan(1000); // Less than 1 second average
    });
  });

  describe('Login Performance', () => {
    let users: any[] = [];

    beforeEach(async () => {
      // Create test users
      const userPromises = [];
      for (let i = 0; i < 5; i++) {
        userPromises.push(
          prisma.user.create({
            data: {
              ...TestDataGenerator.generateUser(),
              email: `user-${i}@example.com`,
              password: await bcrypt.hash('SecurePassword123!', 12),
            },
          }),
        );
      }
      users = await Promise.all(userPromises);
    });

    it('should authenticate users quickly', async () => {
      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: users[0].email,
          password: 'SecurePassword123!',
        })
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Login should be fast (password verification is the main bottleneck)
      expect(responseTime).toBeLessThan(2000);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should handle concurrent logins efficiently', async () => {
      const concurrentLogins = 5;
      const startTime = Date.now();

      const promises = [];
      for (let i = 0; i < concurrentLogins; i++) {
        promises.push(
          request(app.getHttpServer()).post('/auth/login').send({
            email: users[i].email,
            password: 'SecurePassword123!',
          }),
        );
      }

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All logins should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('accessToken');
      });

      // Should complete all logins within reasonable time
      expect(totalTime).toBeLessThan(5000); // 5 seconds for 5 concurrent logins
    });

    it('should fail authentication quickly for non-existent users', async () => {
      const startTime = Date.now();

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SecurePassword123!',
        })
        .expect(401);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Should fail quickly without expensive bcrypt comparison
      expect(responseTime).toBeLessThan(500);
    });
  });

  describe('Token Refresh Performance', () => {
    let refreshTokens: string[] = [];

    beforeEach(async () => {
      // Create users and get their refresh tokens
      const tokenPromises = [];
      for (let i = 0; i < 5; i++) {
        const user = await prisma.user.create({
          data: {
            ...TestDataGenerator.generateUser(),
            email: `user-${i}@example.com`,
            password: await bcrypt.hash('SecurePassword123!', 12),
          },
        });

        tokenPromises.push(
          request(app.getHttpServer()).post('/auth/login').send({
            email: user.email,
            password: 'SecurePassword123!',
          }),
        );
      }

      const responses = await Promise.all(tokenPromises);
      refreshTokens = responses.map((res) => res.body.refreshToken);
    });

    it('should refresh tokens quickly', async () => {
      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: refreshTokens[0],
        })
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Token refresh should be very fast
      expect(responseTime).toBeLessThan(500);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should handle concurrent token refreshes efficiently', async () => {
      const startTime = Date.now();

      const promises = refreshTokens.map((token) =>
        request(app.getHttpServer())
          .post('/auth/refresh')
          .send({ refreshToken: token }),
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All refreshes should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('accessToken');
      });

      // Should complete all refreshes very quickly
      expect(totalTime).toBeLessThan(1000); // 1 second for 5 concurrent refreshes
    });
  });

  describe('Session Management Performance', () => {
    let user: any;
    let accessToken: string;

    beforeEach(async () => {
      user = await prisma.user.create({
        data: {
          ...TestDataGenerator.generateUser(),
          password: await bcrypt.hash('SecurePassword123!', 12),
        },
      });

      // Login to get access token
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: user.email,
          password: 'SecurePassword123!',
        });

      accessToken = loginResponse.body.accessToken;
    });

    it('should validate tokens and return profile quickly', async () => {
      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Profile retrieval should be very fast (cached in Redis)
      expect(responseTime).toBeLessThan(300);
      expect(response.body).toHaveProperty('id', user.id);
    });

    it('should handle multiple concurrent profile requests efficiently', async () => {
      const concurrentRequests = 10;
      const startTime = Date.now();

      const promises = [];
      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          request(app.getHttpServer())
            .get('/auth/profile')
            .set('Authorization', `Bearer ${accessToken}`),
        );
      }

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All requests should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id', user.id);
      });

      // Should handle concurrent requests efficiently
      expect(totalTime).toBeLessThan(1000); // 1 second for 10 concurrent requests
    });
  });

  describe('Database Query Performance', () => {

    it('should perform user lookup efficiently', async () => {
      // Create multiple users to test query performance
      const userPromises = [];
      for (let i = 0; i < 100; i++) {
        userPromises.push(
          prisma.user.create({
            data: {
              ...TestDataGenerator.generateUser(),
              email: `user-${i}@example.com`,
              password: await bcrypt.hash('SecurePassword123!', 12),
            },
          }),
        );
      }
      await Promise.all(userPromises);

      const startTime = Date.now();

      // Test user lookup (simulating login process)
      const user = await prisma.user.findUnique({
        where: { email: 'user-50@example.com' },
      });

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(user).toBeDefined();
      expect(queryTime).toBeLessThan(100); // Should be very fast with proper indexing
    });

    it('should handle session cleanup efficiently', async () => {
      // Create many expired sessions
      const sessionPromises = [];
      const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday

      for (let i = 0; i < 50; i++) {
        sessionPromises.push(
          prisma.session.create({
            data: {
              ...TestDataGenerator.generateSession({
                userId: 'test-user-id',
                expiresAt: expiredDate,
                refreshToken: `expired-token-${i}`,
              }),
            },
          }),
        );
      }
      await Promise.all(sessionPromises);

      const startTime = Date.now();

      // Cleanup expired sessions
      const result = await prisma.session.deleteMany({
        where: {
          OR: [{ expiresAt: { lt: new Date() } }, { isRevoked: true }],
        },
      });

      const endTime = Date.now();
      const cleanupTime = endTime - startTime;

      expect(result.count).toBe(50);
      expect(cleanupTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });


  describe('Memory Usage and Resource Management', () => {
    it('should not leak memory during authentication operations', async () => {
      const initialMemory = process.memoryUsage();

      // Perform many authentication operations
      const operations = 50;
      for (let i = 0; i < operations; i++) {
        const user = await prisma.user.create({
          data: {
            ...TestDataGenerator.generateUser(),
            email: `memory-test-${i}@example.com`,
            password: await bcrypt.hash('SecurePassword123!', 12),
          },
        });

        // Login
        await request(app.getHttpServer()).post('/auth/login').send({
          email: user.email,
          password: 'SecurePassword123!',
        });

        // Cleanup user to prevent database bloat affecting memory test
        await prisma.user.delete({ where: { id: user.id } });
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // Memory increase should be reasonable (less than 50MB for 50 operations)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });
});
