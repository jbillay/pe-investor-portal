import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { TestDataGenerator } from './utils/test-utils';

/**
 * E2E tests for User Creation with Temporary Password Flow
 *
 * Tests the complete flow:
 * 1. Admin creates user with temp password
 * 2. User logs in with temp password
 * 3. User is forced to set permanent password
 * 4. User can then use the system normally
 */
describe('User Creation with Temporary Password (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  let superAdminToken: string;
  let superAdminUser: any;
  let createdUserId: string;
  let tempPassword: string;
  let tempPasswordRefreshToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);

    // Clean up any existing test data
    await cleanupTestData();

    // Create a super admin user for testing
    superAdminUser = await createSuperAdmin();
    superAdminToken = await generateAdminToken(superAdminUser);
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  describe('POST /admin/users - Create user with temp password', () => {
    it('should create a new user with temporary password (SUPER_ADMIN)', async () => {
      const createUserDto = {
        email: 'temppasswordtest@example.com',
        firstName: 'Temp',
        lastName: 'User',
        timezone: 'America/New_York',
      };

      const response = await request(app.getHttpServer())
        .post('/admin/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(createUserDto)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        email: createUserDto.email,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        tempPassword: expect.any(String),
        tempPasswordExpiresAt: expect.any(String),
        roles: expect.arrayContaining(['INVESTOR']),
        timezone: createUserDto.timezone,
        emailSent: expect.any(Boolean),
        createdAt: expect.any(String),
      });

      // Store for later tests
      createdUserId = response.body.id;
      tempPassword = response.body.tempPassword;

      // Verify temp password format (at least 16 characters)
      expect(tempPassword.length).toBeGreaterThanOrEqual(16);

      // Verify user in database
      const dbUser = await prisma.user.findUnique({
        where: { id: createdUserId },
      });

      expect(dbUser).toMatchObject({
        email: createUserDto.email,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        isActive: true,
        isVerified: false,
        isTempPassword: true,
        tempPasswordExpiresAt: expect.any(Date),
      });

      // Verify temp password expires in approximately 72 hours
      const expiryDate = new Date(dbUser!.tempPasswordExpiresAt!);
      const now = new Date();
      const hoursDiff = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      expect(hoursDiff).toBeGreaterThan(71);
      expect(hoursDiff).toBeLessThan(73);
    });

    it('should return 400 for invalid email format', async () => {
      const invalidDto = {
        email: 'not-an-email',
        firstName: 'Test',
        lastName: 'User',
      };

      await request(app.getHttpServer())
        .post('/admin/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(invalidDto)
        .expect(400);
    });

    it('should return 409 if user email already exists', async () => {
      const duplicateDto = {
        email: 'temppasswordtest@example.com', // Same as created above
        firstName: 'Duplicate',
        lastName: 'User',
      };

      await request(app.getHttpServer())
        .post('/admin/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(duplicateDto)
        .expect(409);
    });

    it('should return 401 without authentication', async () => {
      const createUserDto = {
        email: 'noauth@example.com',
        firstName: 'No',
        lastName: 'Auth',
      };

      await request(app.getHttpServer())
        .post('/admin/users')
        .send(createUserDto)
        .expect(401);
    });

    it('should return 403 for non-SUPER_ADMIN users', async () => {
      // Create a regular user token
      const regularUser = TestDataGenerator.generateUser({
        id: 'regular-user-id',
        email: 'regular@example.com',
      });
      const regularToken = jwtService.sign({
        sub: regularUser.id,
        email: regularUser.email,
        roles: ['INVESTOR'], // Not SUPER_ADMIN
      });

      const createUserDto = {
        email: 'forbidden@example.com',
        firstName: 'Forbidden',
        lastName: 'User',
      };

      await request(app.getHttpServer())
        .post('/admin/users')
        .set('Authorization', `Bearer ${regularToken}`)
        .send(createUserDto)
        .expect(403);
    });

    it('should use UTC timezone if not provided', async () => {
      const dtoWithoutTimezone = {
        email: 'notimezone@example.com',
        firstName: 'No',
        lastName: 'Timezone',
      };

      const response = await request(app.getHttpServer())
        .post('/admin/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(dtoWithoutTimezone)
        .expect(201);

      expect(response.body.timezone).toBe('UTC');

      // Cleanup
      await prisma.user.delete({ where: { id: response.body.id } });
    });
  });

  describe('POST /auth/login - Login with temporary password', () => {
    it('should allow login with temporary password and return requiresPasswordChange flag', async () => {
      const loginDto = {
        email: 'temppasswordtest@example.com',
        password: tempPassword,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200);

      expect(response.body).toMatchObject({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        user: {
          id: createdUserId,
          email: loginDto.email,
          firstName: 'Temp',
          lastName: 'User',
        },
        expiresIn: expect.any(Number),
        requiresPasswordChange: true, // Important: User must change password
      });

      // Store refresh token for later tests
      tempPasswordRefreshToken = response.body.refreshToken;
    });

    it('should return requiresPasswordChange: false for users with permanent passwords', async () => {
      // Create user with permanent password
      const permanentUser = await createUserWithPermanentPassword();

      const loginDto = {
        email: permanentUser.email,
        password: 'PermanentPass123!',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200);

      expect(response.body.requiresPasswordChange).toBe(false);

      // Cleanup
      await prisma.user.delete({ where: { id: permanentUser.id } });
    });

    it('should return 401 for wrong temporary password', async () => {
      const loginDto = {
        email: 'temppasswordtest@example.com',
        password: 'WrongPassword123!',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    });
  });

  describe('POST /auth/set-password - Set permanent password', () => {
    let userAccessToken: string;

    beforeAll(async () => {
      // Get a fresh access token for the user with temp password
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'temppasswordtest@example.com',
          password: tempPassword,
        });

      userAccessToken = loginResponse.body.accessToken;
    });

    it('should successfully set permanent password', async () => {
      const setPasswordDto = {
        tempPassword: tempPassword,
        newPassword: 'NewSecurePassword123!@#',
        confirmPassword: 'NewSecurePassword123!@#',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/set-password')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send(setPasswordDto)
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Password set successfully',
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        user: {
          id: createdUserId,
          email: 'temppasswordtest@example.com',
          firstName: 'Temp',
          lastName: 'User',
          roles: expect.arrayContaining(['INVESTOR']),
        },
      });

      // Verify user in database
      const dbUser = await prisma.user.findUnique({
        where: { id: createdUserId },
      });

      expect(dbUser).toMatchObject({
        isTempPassword: false,
        tempPasswordExpiresAt: null,
        passwordSetAt: expect.any(Date),
        isVerified: true, // Should be verified after setting password
      });

      // Verify old refresh token is revoked
      const oldSession = await prisma.session.findFirst({
        where: { refreshToken: tempPasswordRefreshToken },
      });

      expect(oldSession?.isRevoked).toBe(true);
    });

    it('should allow login with new permanent password', async () => {
      const loginDto = {
        email: 'temppasswordtest@example.com',
        password: 'NewSecurePassword123!@#',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200);

      expect(response.body.requiresPasswordChange).toBe(false);
    });

    it('should return 401 for invalid temp password', async () => {
      // Create another user with temp password
      const anotherUser = await createUserWithTempPassword('another@example.com');

      const setPasswordDto = {
        tempPassword: 'WrongTempPassword123!',
        newPassword: 'NewSecurePassword123!@#',
        confirmPassword: 'NewSecurePassword123!@#',
      };

      await request(app.getHttpServer())
        .post('/auth/set-password')
        .set('Authorization', `Bearer ${anotherUser.accessToken}`)
        .send(setPasswordDto)
        .expect(401);

      // Cleanup
      await prisma.user.delete({ where: { id: anotherUser.userId } });
    });

    it('should return 400 if new password is too weak', async () => {
      const weakPasswordUser = await createUserWithTempPassword('weakpass@example.com');

      const setPasswordDto = {
        tempPassword: weakPasswordUser.tempPassword,
        newPassword: 'weak', // Too short, no complexity
        confirmPassword: 'weak',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/set-password')
        .set('Authorization', `Bearer ${weakPasswordUser.accessToken}`)
        .send(setPasswordDto)
        .expect(400);

      expect(response.body.message).toContain('Password validation failed');
      expect(response.body.errors).toBeInstanceOf(Array);
      expect(response.body.errors.length).toBeGreaterThan(0);

      // Cleanup
      await prisma.user.delete({ where: { id: weakPasswordUser.userId } });
    });

    it('should return 400 if passwords do not match', async () => {
      const mismatchUser = await createUserWithTempPassword('mismatch@example.com');

      const setPasswordDto = {
        tempPassword: mismatchUser.tempPassword,
        newPassword: 'NewSecurePassword123!@#',
        confirmPassword: 'DifferentPassword123!@#',
      };

      await request(app.getHttpServer())
        .post('/auth/set-password')
        .set('Authorization', `Bearer ${mismatchUser.accessToken}`)
        .send(setPasswordDto)
        .expect(400);

      // Cleanup
      await prisma.user.delete({ where: { id: mismatchUser.userId } });
    });

    it('should return 400 if new password is same as temp password', async () => {
      const samePasswordUser = await createUserWithTempPassword('samepass@example.com');

      const setPasswordDto = {
        tempPassword: samePasswordUser.tempPassword,
        newPassword: samePasswordUser.tempPassword, // Same as temp
        confirmPassword: samePasswordUser.tempPassword,
      };

      await request(app.getHttpServer())
        .post('/auth/set-password')
        .set('Authorization', `Bearer ${samePasswordUser.accessToken}`)
        .send(setPasswordDto)
        .expect(400);

      // Cleanup
      await prisma.user.delete({ where: { id: samePasswordUser.userId } });
    });

    it('should return 400 if user does not have temp password', async () => {
      const permanentUser = await createUserWithPermanentPassword();
      const permanentToken = await generateUserToken(permanentUser);

      const setPasswordDto = {
        tempPassword: 'AnyPassword123!',
        newPassword: 'NewSecurePassword123!@#',
        confirmPassword: 'NewSecurePassword123!@#',
      };

      await request(app.getHttpServer())
        .post('/auth/set-password')
        .set('Authorization', `Bearer ${permanentToken}`)
        .send(setPasswordDto)
        .expect(400);

      // Cleanup
      await prisma.user.delete({ where: { id: permanentUser.id } });
    });

    it('should return 401 without authentication', async () => {
      const setPasswordDto = {
        tempPassword: 'AnyPassword123!',
        newPassword: 'NewSecurePassword123!@#',
        confirmPassword: 'NewSecurePassword123!@#',
      };

      await request(app.getHttpServer())
        .post('/auth/set-password')
        .send(setPasswordDto)
        .expect(401);
    });
  });

  // Helper functions
  async function cleanupTestData() {
    // Delete test users
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'temppasswordtest@example.com',
            'testadmin@example.com',
            'another@example.com',
            'weakpass@example.com',
            'mismatch@example.com',
            'samepass@example.com',
            'notimezone@example.com',
            'permanentuser@example.com',
          ],
        },
      },
    });
  }

  async function createSuperAdmin() {
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('AdminPass123!', 12);

    const admin = await prisma.user.create({
      data: {
        email: 'testadmin@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'Admin',
        isActive: true,
        isVerified: true,
        isTempPassword: false,
      },
    });

    await prisma.userProfile.create({
      data: {
        userId: admin.id,
        timezone: 'UTC',
        language: 'en',
      },
    });

    // Assign SUPER_ADMIN role
    const superAdminRole = await prisma.role.findFirst({
      where: { name: 'SUPER_ADMIN' },
    });

    if (superAdminRole) {
      await prisma.userRole.create({
        data: {
          userId: admin.id,
          roleId: superAdminRole.id,
          isActive: true,
        },
      });
    }

    return admin;
  }

  async function generateAdminToken(admin: any): Promise<string> {
    return jwtService.sign({
      sub: admin.id,
      email: admin.email,
      roles: ['SUPER_ADMIN'],
    });
  }

  async function generateUserToken(user: any): Promise<string> {
    return jwtService.sign({
      sub: user.id,
      email: user.email,
      roles: ['INVESTOR'],
    });
  }

  async function createUserWithPermanentPassword() {
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('PermanentPass123!', 12);

    const user = await prisma.user.create({
      data: {
        email: 'permanentuser@example.com',
        password: hashedPassword,
        firstName: 'Permanent',
        lastName: 'User',
        isActive: true,
        isVerified: true,
        isTempPassword: false,
        passwordSetAt: new Date(),
      },
    });

    await prisma.userProfile.create({
      data: {
        userId: user.id,
        timezone: 'UTC',
        language: 'en',
      },
    });

    return user;
  }

  async function createUserWithTempPassword(email: string) {
    // Use the API to create user
    const response = await request(app.getHttpServer())
      .post('/admin/users')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        email,
        firstName: 'Test',
        lastName: 'User',
      });

    const tempPassword = response.body.tempPassword;
    const userId = response.body.id;

    // Login to get access token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email,
        password: tempPassword,
      });

    return {
      userId,
      tempPassword,
      accessToken: loginResponse.body.accessToken,
      refreshToken: loginResponse.body.refreshToken,
    };
  }
});
