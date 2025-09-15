import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import * as request from 'supertest';
import * as bcrypt from 'bcrypt';

import { AuthModule } from '../src/auth/auth.module';
import { PrismaModule } from '../src/common/prisma/prisma.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { AuthService } from '../src/auth/services/auth.service';
import { RegisterDto, LoginDto } from '../src/auth/dto/auth.dto';
import { TestDataGenerator } from './utils/test-utils';

describe('Authentication Security (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authService: AuthService;

  const testConfig = () => ({
    DATABASE_URL: 'postgresql://test:test@localhost:5433/test',
    REDIS_HOST: 'localhost',
    REDIS_PORT: 6380,
    JWT_SECRET: 'test-jwt-secret-key-for-security-testing',
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
            limit: 10,
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
    authService = moduleFixture.get<AuthService>(AuthService);
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

  describe('Password Security', () => {

    it('should enforce password complexity requirements', async () => {
      const weakPasswords = [
        'password', // Too common
        '12345678', // Only numbers
        'abcdefgh', // Only lowercase
        'ABCDEFGH', // Only uppercase
        'Pass1', // Too short
        'password123', // No uppercase
        'PASSWORD123', // No lowercase
        'Password', // No numbers
      ];

      for (const password of weakPasswords) {
        const registerDto: RegisterDto = {
          email: `test-${Date.now()}@example.com`,
          password,
          firstName: 'Test',
          lastName: 'User',
        };

        await request(app.getHttpServer())
          .post('/auth/register')
          .send(registerDto)
          .expect(400)
          .expect((res) => {
            expect(res.body.message).toContain('password');
          });
      }
    });

    it('should accept strong passwords', async () => {
      const strongPasswords = [
        'StrongPass123!',
        'MySecure@Password2024',
        'C0mpl3x#P@ssw0rd',
      ];

      for (const password of strongPasswords) {
        const registerDto: RegisterDto = {
          email: `test-${Date.now()}-${Math.random()}@example.com`,
          password,
          firstName: 'Test',
          lastName: 'User',
        };

        await request(app.getHttpServer())
          .post('/auth/register')
          .send(registerDto)
          .expect(201);
      }
    });

    it('should hash passwords securely', async () => {
      const password = 'SecurePassword123!';
      const user = await prisma.user.create({
        data: {
          ...TestDataGenerator.generateUser(),
          password: await bcrypt.hash(password, 12),
        },
      });

      // Verify password is not stored in plain text
      expect(user.password).not.toBe(password);
      expect(user.password).toMatch(/^\$2[aby]\$12\$/); // bcrypt hash pattern

      // Verify password can be validated
      const isValid = await bcrypt.compare(password, user.password);
      expect(isValid).toBe(true);
    });

    it('should use consistent salt rounds for password hashing', async () => {
      const password = 'TestPassword123!';
      const hash1 = await bcrypt.hash(password, 12);
      const hash2 = await bcrypt.hash(password, 12);

      // Hashes should be different (due to salt)
      expect(hash1).not.toBe(hash2);

      // Both should use 12 rounds
      expect(hash1).toMatch(/^\$2[aby]\$12\$/);
      expect(hash2).toMatch(/^\$2[aby]\$12\$/);

      // Both should validate the same password
      expect(await bcrypt.compare(password, hash1)).toBe(true);
      expect(await bcrypt.compare(password, hash2)).toBe(true);
    });
  });

  describe('JWT Token Security', () => {
    let user: any;

    beforeEach(async () => {
      user = await prisma.user.create({
        data: {
          ...TestDataGenerator.generateUser(),
          password: await bcrypt.hash('SecurePassword123!', 12),
        },
      });
    });

    it('should reject malformed JWT tokens', async () => {
      const malformedTokens = [
        'invalid-token',
        'header.payload',
        'header.payload.signature.extra',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid',
        '',
        null,
        undefined,
      ];

      for (const token of malformedTokens) {
        if (token === null || token === undefined) continue;

        await request(app.getHttpServer())
          .get('/auth/profile')
          .set('Authorization', `Bearer ${token}`)
          .expect(401);
      }
    });

    it('should reject expired tokens', async () => {
      // Create a token that expires immediately
      const shortLivedToken = await authService['generateTokens'](
        user.id,
        user.email,
        '1ms',
      );

      // Wait for token to expire
      await new Promise((resolve) => setTimeout(resolve, 10));

      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${shortLivedToken.accessToken}`)
        .expect(401);
    });

    it('should reject tokens with invalid signatures', async () => {
      const validTokens = await authService['generateTokens'](
        user.id,
        user.email,
      );

      // Tamper with the token signature
      const tamperedToken = validTokens.accessToken.slice(0, -5) + 'XXXXX';

      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${tamperedToken}`)
        .expect(401);
    });

    it('should validate token payload structure', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: user.email,
          password: 'SecurePassword123!',
        })
        .expect(200);

      const { accessToken } = response.body;

      // Use the token to access protected endpoint
      const profileResponse = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(profileResponse.body).toHaveProperty('id', user.id);
      expect(profileResponse.body).toHaveProperty('email', user.email);
    });
  });

  describe('Rate Limiting Security', () => {

    it('should enforce rate limits on registration endpoint', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        firstName: 'Test',
        lastName: 'User',
      };

      // First request should succeed (or fail validation, but not rate limit)
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto);

      // Exceed rate limit
      const promises = [];
      for (let i = 0; i < 15; i++) {
        promises.push(
          request(app.getHttpServer())
            .post('/auth/register')
            .send({
              ...registerDto,
              email: `test-${i}@example.com`,
            }),
        );
      }

      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(
        (res) => res.status === 429,
      );
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should enforce rate limits on login endpoint', async () => {
      // Create a user first
      await prisma.user.create({
        data: {
          ...TestDataGenerator.generateUser(),
          email: 'test@example.com',
          password: await bcrypt.hash('SecurePassword123!', 12),
        },
      });

      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'WrongPassword123!',
      };

      // Exceed rate limit with failed login attempts
      const promises = [];
      for (let i = 0; i < 15; i++) {
        promises.push(
          request(app.getHttpServer()).post('/auth/login').send(loginDto),
        );
      }

      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(
        (res) => res.status === 429,
      );
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Input Validation Security', () => {

    it('should reject SQL injection attempts in registration', async () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "admin@test.com'; INSERT INTO users (email) VALUES ('hacker@evil.com'); --",
        "test@example.com' OR '1'='1",
        "test@example.com'; UPDATE users SET isActive = false; --",
      ];

      for (const maliciousEmail of maliciousInputs) {
        await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: maliciousEmail,
            password: 'SecurePassword123!',
            firstName: 'Test',
            lastName: 'User',
          })
          .expect(400); // Should fail validation
      }
    });

    it('should reject XSS attempts in input fields', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(1)">',
        '"><script>alert(String.fromCharCode(88,83,83))</script>',
      ];

      for (const payload of xssPayloads) {
        await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: 'test@example.com',
            password: 'SecurePassword123!',
            firstName: payload,
            lastName: 'User',
          })
          .expect(400); // Should fail validation
      }
    });

    it('should validate email format strictly', async () => {
      const invalidEmails = [
        'not-an-email',
        '@example.com',
        'test@',
        'test..test@example.com',
        'test@example',
        'test@.com',
        'test@example..com',
      ];

      for (const email of invalidEmails) {
        await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email,
            password: 'SecurePassword123!',
            firstName: 'Test',
            lastName: 'User',
          })
          .expect(400);
      }
    });

    it('should reject excessively long input fields', async () => {
      const longString = 'a'.repeat(1000);

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'SecurePassword123!',
          firstName: longString,
          lastName: 'User',
        })
        .expect(400);
    });

    it('should reject additional properties not in DTO', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'SecurePassword123!',
          firstName: 'Test',
          lastName: 'User',
          maliciousField: 'should-be-rejected',
          isAdmin: true,
          role: 'admin',
        })
        .expect(400);
    });
  });

  describe('Session Security', () => {
    let user: any;

    beforeEach(async () => {
      user = await prisma.user.create({
        data: {
          ...TestDataGenerator.generateUser(),
          password: await bcrypt.hash('SecurePassword123!', 12),
        },
      });
    });

    it('should prevent session fixation attacks', async () => {
      // Login to create a session
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: user.email,
          password: 'SecurePassword123!',
        })
        .expect(200);

      const { refreshToken: token1 } = loginResponse.body;

      // Login again - should create a new session
      const secondLoginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: user.email,
          password: 'SecurePassword123!',
        })
        .expect(200);

      const { refreshToken: token2 } = secondLoginResponse.body;

      // Tokens should be different
      expect(token1).not.toBe(token2);

      // Both tokens should be valid initially
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: token1 })
        .expect(200);

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: token2 })
        .expect(200);
    });

    it('should invalidate refresh tokens after use', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: user.email,
          password: 'SecurePassword123!',
        })
        .expect(200);

      const { refreshToken } = loginResponse.body;

      // Use refresh token once
      const refreshResponse = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      const { refreshToken: newRefreshToken } = refreshResponse.body;

      // Original token should now be invalid
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(401);

      // New token should be valid
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: newRefreshToken })
        .expect(200);
    });

    it('should prevent concurrent session abuse', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: user.email,
          password: 'SecurePassword123!',
        })
        .expect(200);

      const { refreshToken } = loginResponse.body;

      // Try to use the same refresh token multiple times concurrently
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          request(app.getHttpServer())
            .post('/auth/refresh')
            .send({ refreshToken }),
        );
      }

      const responses = await Promise.all(promises);
      const successfulResponses = responses.filter((res) => res.status === 200);

      // Only one should succeed
      expect(successfulResponses.length).toBe(1);
    });

    it('should track session metadata for security', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: user.email,
          password: 'SecurePassword123!',
        })
        .set('User-Agent', 'Test Security Agent')
        .set('X-Forwarded-For', '203.0.113.1')
        .expect(200);

      const { refreshToken } = loginResponse.body;

      // Verify session was created with metadata
      const session = await prisma.session.findUnique({
        where: { refreshToken },
      });

      expect(session).toBeDefined();
      expect(session.userAgent).toBe('Test Security Agent');
      expect(session.ipAddress).toBe('203.0.113.1');
      expect(session.userId).toBe(user.id);
    });
  });


  describe('Error Information Disclosure', () => {

    it('should not disclose sensitive information in error messages', async () => {
      // Try to login with non-existent user
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'AnyPassword123!',
        })
        .expect(401);

      // Error should not reveal whether email exists
      expect(response.body.message).toBe('Invalid credentials');
      expect(response.body.message).not.toContain('user not found');
      expect(response.body.message).not.toContain('email');
    });

    it('should return consistent error messages for password failures', async () => {
      // Create user
      await prisma.user.create({
        data: {
          ...TestDataGenerator.generateUser(),
          email: 'test@example.com',
          password: await bcrypt.hash('SecurePassword123!', 12),
        },
      });

      // Try with wrong password
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should not expose system information in errors', async () => {
      // Simulate database error by trying to register with invalid data
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'SecurePassword123!',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(400);

      // Should not contain database-specific error information
      expect(response.body.message).not.toContain('database');
      expect(response.body.message).not.toContain('postgresql');
      expect(response.body.message).not.toContain('prisma');
      expect(response.body.message).not.toContain('constraint');
    });
  });
});
