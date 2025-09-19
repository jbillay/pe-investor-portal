import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import * as request from 'supertest';
import { AuthModule } from '../../auth/auth.module';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TestDataGenerator, ValidationHelper } from '../utils/test-utils';

describe('Auth Integration Tests', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        ThrottlerModule.forRoot([
          {
            ttl: 60000,
            limit: 100,
          },
        ]),
        PrismaModule,
        AuthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();
  });

  afterAll(async () => {
    await prismaService.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await prismaService.refreshToken.deleteMany({});
    await prismaService.user.deleteMany({});
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const registerDto = {
        email: ValidationHelper.generateValidEmail(),
        password: ValidationHelper.generateValidPassword(),
        firstName: 'John',
        lastName: 'Doe',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(registerDto.email);
      expect(response.body.user.firstName).toBe(registerDto.firstName);
      expect(response.body.user.lastName).toBe(registerDto.lastName);
    });

    it('should reject registration with existing email', async () => {
      const registerDto = {
        email: ValidationHelper.generateValidEmail(),
        password: ValidationHelper.generateValidPassword(),
        firstName: 'John',
        lastName: 'Doe',
      };

      // First registration
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      // Second registration with same email
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(409);
    });

    it('should reject registration with invalid email', async () => {
      const registerDto = {
        email: ValidationHelper.generateInvalidEmail(),
        password: ValidationHelper.generateValidPassword(),
        firstName: 'John',
        lastName: 'Doe',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);
    });

    it('should reject registration with weak password', async () => {
      const registerDto = {
        email: ValidationHelper.generateValidEmail(),
        password: ValidationHelper.generateWeakPassword(),
        firstName: 'John',
        lastName: 'Doe',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    let testUser: any;

    beforeEach(async () => {
      const registerDto = {
        email: ValidationHelper.generateValidEmail(),
        password: ValidationHelper.generateValidPassword(),
        firstName: 'John',
        lastName: 'Doe',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto);

      testUser = { ...registerDto, ...response.body.user };
    });

    it('should login successfully with valid credentials', async () => {
      const loginDto = {
        email: testUser.email,
        password: testUser.password,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
    });

    it('should reject login with invalid email', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: testUser.password,
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    });

    it('should reject login with invalid password', async () => {
      const loginDto = {
        email: testUser.email,
        password: 'wrongpassword',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    });
  });

  describe('POST /auth/refresh', () => {
    let testTokens: any;

    beforeEach(async () => {
      const registerDto = {
        email: ValidationHelper.generateValidEmail(),
        password: ValidationHelper.generateValidPassword(),
        firstName: 'John',
        lastName: 'Doe',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto);

      testTokens = response.body;
    });

    it('should refresh tokens successfully', async () => {
      const refreshDto = {
        refreshToken: testTokens.refreshToken,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send(refreshDto)
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.accessToken).not.toBe(testTokens.accessToken);
      expect(response.body.refreshToken).not.toBe(testTokens.refreshToken);
    });

    it('should reject refresh with invalid token', async () => {
      const refreshDto = {
        refreshToken: 'invalid-refresh-token',
      };

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send(refreshDto)
        .expect(401);
    });
  });

  describe('POST /auth/logout', () => {
    let testTokens: any;

    beforeEach(async () => {
      const registerDto = {
        email: ValidationHelper.generateValidEmail(),
        password: ValidationHelper.generateValidPassword(),
        firstName: 'John',
        lastName: 'Doe',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto);

      testTokens = response.body;
    });

    it('should logout successfully', async () => {
      const logoutDto = {
        refreshToken: testTokens.refreshToken,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${testTokens.accessToken}`)
        .send(logoutDto)
        .expect(200);

      expect(response.body.message).toBe('Logged out successfully');

      // Verify refresh token is no longer valid
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: testTokens.refreshToken })
        .expect(401);
    });

    it('should reject logout without authorization', async () => {
      const logoutDto = {
        refreshToken: testTokens.refreshToken,
      };

      await request(app.getHttpServer())
        .post('/auth/logout')
        .send(logoutDto)
        .expect(401);
    });
  });

  describe('POST /auth/logout-all', () => {
    let testTokens: any;

    beforeEach(async () => {
      const registerDto = {
        email: ValidationHelper.generateValidEmail(),
        password: ValidationHelper.generateValidPassword(),
        firstName: 'John',
        lastName: 'Doe',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto);

      testTokens = response.body;
    });

    it('should logout from all devices successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout-all')
        .set('Authorization', `Bearer ${testTokens.accessToken}`)
        .expect(200);

      expect(response.body.message).toBe('Logged out from all devices successfully');

      // Verify refresh token is no longer valid
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: testTokens.refreshToken })
        .expect(401);
    });

    it('should reject logout-all without authorization', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout-all')
        .expect(401);
    });
  });

  describe('GET /auth/profile', () => {
    let testTokens: any;
    let testUser: any;

    beforeEach(async () => {
      const registerDto = {
        email: ValidationHelper.generateValidEmail(),
        password: ValidationHelper.generateValidPassword(),
        firstName: 'John',
        lastName: 'Doe',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto);

      testTokens = response.body;
      testUser = response.body.user;
    });

    it('should get user profile successfully', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${testTokens.accessToken}`)
        .expect(200);

      expect(response.body.id).toBe(testUser.id);
      expect(response.body.email).toBe(testUser.email);
      expect(response.body.firstName).toBe(testUser.firstName);
      expect(response.body.lastName).toBe(testUser.lastName);
      expect(response.body).toHaveProperty('isActive');
      expect(response.body).toHaveProperty('isVerified');
    });

    it('should reject profile request without authorization', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);
    });

    it('should reject profile request with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('GET /auth/validate', () => {
    let testTokens: any;

    beforeEach(async () => {
      const registerDto = {
        email: ValidationHelper.generateValidEmail(),
        password: ValidationHelper.generateValidPassword(),
        firstName: 'John',
        lastName: 'Doe',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto);

      testTokens = response.body;
    });

    it('should validate token successfully', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/validate')
        .set('Authorization', `Bearer ${testTokens.accessToken}`)
        .expect(200);

      expect(response.body.valid).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.id).toBe(testTokens.user.id);
    });

    it('should reject validation without authorization', async () => {
      await request(app.getHttpServer())
        .get('/auth/validate')
        .expect(401);
    });
  });

  describe('Rate limiting', () => {
    it('should apply rate limiting to registration endpoint', async () => {
      const registerDto = {
        email: ValidationHelper.generateValidEmail(),
        password: ValidationHelper.generateValidPassword(),
        firstName: 'John',
        lastName: 'Doe',
      };

      // Make requests up to the limit
      const promises = Array(5).fill(null).map(() =>
        request(app.getHttpServer())
          .post('/auth/register')
          .send({
            ...registerDto,
            email: ValidationHelper.generateValidEmail(),
          })
      );

      await Promise.all(promises);

      // Next request should be rate limited
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...registerDto,
          email: ValidationHelper.generateValidEmail(),
        })
        .expect(429);
    }, 10000);
  });

  describe('Security headers and validation', () => {
    it('should sanitize input data', async () => {
      const maliciousInput = {
        email: '<script>alert("xss")</script>@example.com',
        password: ValidationHelper.generateValidPassword(),
        firstName: '<script>alert("xss")</script>',
        lastName: '<img src=x onerror=alert("xss")>',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(maliciousInput)
        .expect(400); // Should be rejected due to validation
    });

    it('should handle SQL injection attempts', async () => {
      const sqlInjectionAttempt = {
        email: "admin@example.com'; DROP TABLE users; --",
        password: ValidationHelper.generateValidPassword(),
        firstName: 'John',
        lastName: 'Doe',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(sqlInjectionAttempt)
        .expect(400); // Should be rejected due to validation
    });
  });
});