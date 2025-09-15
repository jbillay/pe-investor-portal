import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { TestDataGenerator } from './utils/test-utils';
import * as bcrypt from 'bcrypt';

describe('Authentication (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Test data
  const testUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    password: 'Password123',
    firstName: 'Test',
    lastName: 'User',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply same validation pipe as in main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // Enable CORS for testing
    app.enableCors();

    await app.init();

    prisma = app.get(PrismaService);
    redis = app.get(RedisService);
  });

  afterAll(async () => {
    // Cleanup
    await cleanupDatabase();
    await app.close();
  });

  beforeEach(async () => {
    // Clean up before each test
    await cleanupDatabase();
  });

  async function cleanupDatabase() {
    // Clean up in correct order due to foreign key constraints
    await prisma.auditLog.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.userProfile.deleteMany({});
    await prisma.user.deleteMany({});

    // Clear Redis
    try {
      const client = redis.getClient();
      await client.flushall();
    } catch (error) {
      // Redis might not be available in test environment
      console.warn('Redis cleanup failed:', error.message);
    }
  }

  async function createTestUser(hashedPassword?: string) {
    const password =
      hashedPassword || (await bcrypt.hash(testUser.password, 4));
    return await prisma.user.create({
      data: {
        ...testUser,
        password,
      },
    });
  }

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        password: 'Password123',
        firstName: 'New',
        lastName: 'User',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toEqual({
        id: expect.any(String),
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
      });
      expect(response.body).toHaveProperty('expiresIn', 900);

      // Verify user was created in database
      const createdUser = await prisma.user.findUnique({
        where: { email: registerDto.email },
        include: { profile: true },
      });

      expect(createdUser).toBeTruthy();
      expect(createdUser.email).toBe(registerDto.email);
      expect(createdUser.firstName).toBe(registerDto.firstName);
      expect(createdUser.lastName).toBe(registerDto.lastName);
      expect(createdUser.profile).toBeTruthy();
      expect(createdUser.isActive).toBe(true);
      expect(createdUser.isVerified).toBe(false);
    });


    it('should return 409 when user already exists', async () => {
      await createTestUser();

      const registerDto = {
        email: testUser.email,
        password: 'Password123',
        firstName: 'Another',
        lastName: 'User',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerDto)
        .expect(409);

      expect(response.body.message).toContain('already exists');
    });


    it('should validate registration input', async () => {
      const invalidDto = {
        email: 'invalid-email',
        password: '123', // Too short
        firstName: '',
        lastName: '',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(invalidDto)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message.some((msg) => msg.includes('email'))).toBe(
        true,
      );
      expect(
        response.body.message.some((msg) => msg.includes('password')),
      ).toBe(true);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await createTestUser();
    });

    it('should login with valid credentials', async () => {
      const loginDto = {
        email: testUser.email,
        password: testUser.password,
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(loginDto)
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toEqual({
        id: testUser.id,
        email: testUser.email,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
      });

      // Verify last login was updated
      const updatedUser = await prisma.user.findUnique({
        where: { id: testUser.id },
      });
      expect(updatedUser.lastLogin).toBeTruthy();
    });

    it('should return 401 for invalid credentials', async () => {
      const loginDto = {
        email: testUser.email,
        password: 'wrongpassword',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(loginDto)
        .expect(401);

      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return 401 for non-existent user', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'Password123',
      };

      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(loginDto)
        .expect(401);
    });

    it('should return 401 for inactive user', async () => {
      await prisma.user.update({
        where: { id: testUser.id },
        data: { isActive: false },
      });

      const loginDto = {
        email: testUser.email,
        password: testUser.password,
      };

      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(loginDto)
        .expect(401);
    });


  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      await createTestUser();

      // Login to get refresh token
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      refreshToken = loginResponse.body.refreshToken;
    });

    it('should refresh tokens successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.refreshToken).not.toBe(refreshToken); // New token should be different
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.id).toBe(testUser.id);

      // Old refresh token should be invalid now
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken }) // Use old token
        .expect(401);
    });

    it('should return 401 for invalid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.message).toBe('Invalid refresh token');
    });

    it('should return 401 for revoked refresh token', async () => {
      // Revoke the token first
      await prisma.session.updateMany({
        where: { refreshToken },
        data: { isRevoked: true },
      });

      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    let accessToken: string;
    let refreshToken: string;

    beforeEach(async () => {
      await createTestUser();

      // Login to get tokens
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      accessToken = loginResponse.body.accessToken;
      refreshToken = loginResponse.body.refreshToken;
    });

    it('should logout successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

      expect(response.body.message).toBe('Logged out successfully');

      // Verify session is revoked
      const session = await prisma.session.findUnique({
        where: { refreshToken },
      });
      expect(session.isRevoked).toBe(true);

      // Refresh token should not work anymore
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(401);
    });

    it('should return 401 without access token', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .send({ refreshToken })
        .expect(401);
    });

    it('should return 401 with invalid access token', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer invalid-token')
        .send({ refreshToken })
        .expect(401);
    });
  });

  describe('POST /api/auth/logout-all', () => {
    let accessToken1: string;
    let accessToken2: string;
    let refreshToken1: string;
    let refreshToken2: string;

    beforeEach(async () => {
      await createTestUser();

      // Create multiple sessions
      const login1 = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      const login2 = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      accessToken1 = login1.body.accessToken;
      refreshToken1 = login1.body.refreshToken;
      accessToken2 = login2.body.accessToken;
      refreshToken2 = login2.body.refreshToken;
    });

    it('should logout from all devices successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/logout-all')
        .set('Authorization', `Bearer ${accessToken1}`)
        .expect(200);

      expect(response.body.message).toBe(
        'Logged out from all devices successfully',
      );

      // Verify all sessions are revoked
      const sessions = await prisma.session.findMany({
        where: { userId: testUser.id },
      });

      sessions.forEach((session) => {
        expect(session.isRevoked).toBe(true);
      });

      // Both refresh tokens should not work anymore
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: refreshToken1 })
        .expect(401);

      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: refreshToken2 })
        .expect(401);
    });

    it('should return 401 without access token', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/logout-all')
        .expect(401);
    });
  });

  describe('GET /api/auth/profile', () => {
    let accessToken: string;

    beforeEach(async () => {
      await createTestUser();

      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      accessToken = loginResponse.body.accessToken;
    });

    it('should return user profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toEqual({
        id: testUser.id,
        email: testUser.email,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        isActive: true,
        isVerified: false,
      });
    });

    it('should return 401 without access token', async () => {
      await request(app.getHttpServer()).get('/api/auth/profile').expect(401);
    });

    it('should return 401 with invalid access token', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('GET /api/auth/validate', () => {
    let accessToken: string;

    beforeEach(async () => {
      await createTestUser();

      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      accessToken = loginResponse.body.accessToken;
    });

    it('should validate token successfully', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/validate')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toEqual({
        valid: true,
        user: {
          id: testUser.id,
          email: testUser.email,
          firstName: testUser.firstName,
          lastName: testUser.lastName,
          isActive: true,
          isVerified: false,
        },
      });
    });

    it('should return 401 for invalid token', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/validate')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('Authentication Flow Integration', () => {
    it('should complete full authentication flow', async () => {
      // 1. Register user
      const registerDto = {
        email: 'flow@example.com',
        password: 'FlowPassword123',
        firstName: 'Flow',
        lastName: 'User',
      };

      const registerResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerDto)
        .expect(201);

      const {
        accessToken: registerAccessToken,
        refreshToken: registerRefreshToken,
      } = registerResponse.body;

      // 2. Get profile with register token
      await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${registerAccessToken}`)
        .expect(200);

      // 3. Refresh token
      const refreshResponse = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: registerRefreshToken })
        .expect(200);

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        refreshResponse.body;

      // 4. Login with same credentials (should create new session)
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: registerDto.email,
          password: registerDto.password,
        })
        .expect(200);

      const { accessToken: loginAccessToken, refreshToken: loginRefreshToken } =
        loginResponse.body;

      // 5. Should have multiple active sessions
      const user = await prisma.user.findUnique({
        where: { email: registerDto.email },
      });

      const activeSessions = await prisma.session.findMany({
        where: {
          userId: user.id,
          isRevoked: false,
        },
      });

      expect(activeSessions.length).toBeGreaterThanOrEqual(2);

      // 6. Logout from all devices
      await request(app.getHttpServer())
        .post('/api/auth/logout-all')
        .set('Authorization', `Bearer ${loginAccessToken}`)
        .expect(200);

      // 7. All refresh tokens should be invalid
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: newRefreshToken })
        .expect(401);

      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: loginRefreshToken })
        .expect(401);

      // 8. Access tokens should still work until they expire (but they're short-lived)
      // Note: In a real scenario, you might want to implement token blacklisting
      const profileResponse = await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${loginAccessToken}`)
        .expect(200);

      expect(profileResponse.body.email).toBe(registerDto.email);
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit registration attempts', async () => {
      const registerDto = {
        email: 'ratelimit@example.com',
        password: 'Password123',
        firstName: 'Rate',
        lastName: 'Limit',
      };

      // Make multiple rapid requests (more than the limit)
      const promises = Array.from({ length: 7 }, (_, i) =>
        request(app.getHttpServer())
          .post('/api/auth/register')
          .send({ ...registerDto, email: `ratelimit${i}@example.com` }),
      );

      const responses = await Promise.allSettled(promises);

      // Some requests should be rate limited (429)
      const rateLimitedResponses = responses.filter(
        (response) =>
          response.status === 'fulfilled' && response.value.status === 429,
      );

      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    }, 10000);

    it('should rate limit login attempts', async () => {
      await createTestUser();

      const loginDto = {
        email: testUser.email,
        password: 'wrongpassword',
      };

      // Make multiple failed login attempts
      const promises = Array.from({ length: 12 }, () =>
        request(app.getHttpServer()).post('/api/auth/login').send(loginDto),
      );

      const responses = await Promise.allSettled(promises);

      // Some requests should be rate limited (429)
      const rateLimitedResponses = responses.filter(
        (response) =>
          response.status === 'fulfilled' && response.value.status === 429,
      );

      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    }, 10000);
  });

  describe('Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      // Check for security headers (these are set by the security middleware)
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
      expect(response.headers).toHaveProperty('referrer-policy');
    });
  });
});
