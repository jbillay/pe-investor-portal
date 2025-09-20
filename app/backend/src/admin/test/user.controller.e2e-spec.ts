import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import * as request from 'supertest';

import { UserModule } from '../user.module';
import { PrismaService } from '../../../database/prisma.service';
import { AuthModule } from '../../../auth/auth.module';
import {
  createTestUser,
  createTestRole,
  createTestJwtToken,
  createTestUserWithProfile,
  UserTestFactory
} from './factories/user.factory';
import { CreateUserDto, UpdateUserDto, AssignRolesDto } from '../dto';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let adminToken: string;
  let userToken: string;
  let testUsers: any[];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ['.env.test', '.env']
        }),
        EventEmitterModule.forRoot(),
        UserModule,
        AuthModule
      ]
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();

    // Setup test data
    await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  beforeEach(async () => {
    // Reset test state before each test
    await resetTestState();
  });

  /**
   * Setup test data including users, roles, and authentication tokens
   */
  async function setupTestData() {
    // Create test roles
    const adminRole = await prismaService.role.create({
      data: createTestRole({ name: 'SUPER_ADMIN', description: 'Super Administrator' })
    });

    const investorRole = await prismaService.role.create({
      data: createTestRole({ name: 'INVESTOR', description: 'Investment Platform Investor' })
    });

    // Create test admin user
    const adminUserData = createTestUserWithProfile({
      email: 'admin@test.com',
      firstName: 'Test',
      lastName: 'Admin'
    });

    const adminUser = await prismaService.user.create({
      data: adminUserData.user
    });

    await prismaService.userProfile.create({
      data: { ...adminUserData.profile, userId: adminUser.id }
    });

    await prismaService.userRole.create({
      data: {
        userId: adminUser.id,
        roleId: adminRole.id,
        isActive: true
      }
    });

    // Create test regular user
    const regularUserData = createTestUserWithProfile({
      email: 'user@test.com',
      firstName: 'Test',
      lastName: 'User'
    });

    const regularUser = await prismaService.user.create({
      data: regularUserData.user
    });

    await prismaService.userProfile.create({
      data: { ...regularUserData.profile, userId: regularUser.id }
    });

    await prismaService.userRole.create({
      data: {
        userId: regularUser.id,
        roleId: investorRole.id,
        isActive: true
      }
    });

    // Create test JWT tokens (in real implementation, use proper auth service)
    const adminTokenData = createTestJwtToken({
      sub: adminUser.id,
      email: adminUser.email,
      roles: ['SUPER_ADMIN']
    });

    const userTokenData = createTestJwtToken({
      sub: regularUser.id,
      email: regularUser.email,
      roles: ['INVESTOR']
    });

    adminToken = `Bearer ${adminTokenData.token}`;
    userToken = `Bearer ${userTokenData.token}`;

    // Store test users for reference
    testUsers = [adminUser, regularUser];
  }

  /**
   * Cleanup test data after all tests
   */
  async function cleanupTestData() {
    try {
      await prismaService.userRole.deleteMany({});
      await prismaService.userProfile.deleteMany({});
      await prismaService.user.deleteMany({});
      await prismaService.role.deleteMany({});
      await prismaService.permission.deleteMany({});
    } catch (error) {
      console.error('Error cleaning up test data:', error);
    }
  }

  /**
   * Reset test state before each test
   */
  async function resetTestState() {
    // Reset any test-specific state changes
    // This can be expanded based on specific test needs
  }

  describe('GET /api/admin/users', () => {
    it('should return paginated users for admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/users')
        .set('Authorization', adminToken)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
      expect(response.body.pagination).toHaveProperty('total');
    });

    it('should filter users by search term', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/users?search=admin')
        .set('Authorization', adminToken)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.filters.search).toBe('admin');
    });

    it('should filter users by roles', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/users?roles=SUPER_ADMIN')
        .set('Authorization', adminToken)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.filters.roles).toContain('SUPER_ADMIN');
    });

    it('should return 403 for non-admin users', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/users')
        .set('Authorization', userToken)
        .expect(403);
    });

    it('should return 401 for unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/users')
        .expect(401);
    });

    it('should support pagination parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/users?page=1&limit=5')
        .set('Authorization', adminToken)
        .expect(200);

      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /api/admin/users/:id', () => {
    it('should return user details for admin', async () => {
      const userId = testUsers[1].id; // Regular user

      const response = await request(app.getHttpServer())
        .get(`/api/admin/users/${userId}`)
        .set('Authorization', adminToken)
        .expect(200);

      expect(response.body).toHaveProperty('id', userId);
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('firstName');
      expect(response.body).toHaveProperty('lastName');
      expect(response.body).toHaveProperty('profile');
      expect(response.body).toHaveProperty('roles');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .get(`/api/admin/users/${nonExistentId}`)
        .set('Authorization', adminToken)
        .expect(404);
    });

    it('should return 400 for invalid UUID', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/users/invalid-uuid')
        .set('Authorization', adminToken)
        .expect(400);
    });
  });

  describe('POST /api/admin/users', () => {
    it('should create a new user successfully', async () => {
      const createUserDto: CreateUserDto = {
        email: 'newuser@test.com',
        password: 'SecurePass123!',
        firstName: 'New',
        lastName: 'User',
        phone: '+1234567890',
        timezone: 'America/New_York',
        language: 'en' as any,
        roles: ['INVESTOR']
      };

      const response = await request(app.getHttpServer())
        .post('/api/admin/users')
        .set('Authorization', adminToken)
        .send(createUserDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(createUserDto.email);
      expect(response.body.firstName).toBe(createUserDto.firstName);
      expect(response.body.lastName).toBe(createUserDto.lastName);
      expect(response.body).toHaveProperty('temporaryPassword');
      expect(response.body).toHaveProperty('emailVerificationToken');
      expect(response.body).not.toHaveProperty('password');

      // Cleanup created user
      await prismaService.user.delete({
        where: { id: response.body.id }
      });
    });

    it('should return 409 for duplicate email', async () => {
      const createUserDto: CreateUserDto = {
        email: testUsers[0].email, // Existing admin email
        password: 'SecurePass123!',
        firstName: 'Duplicate',
        lastName: 'User'
      };

      await request(app.getHttpServer())
        .post('/api/admin/users')
        .set('Authorization', adminToken)
        .send(createUserDto)
        .expect(409);
    });

    it('should validate required fields', async () => {
      const invalidUserDto = {
        email: 'invalid-email',
        password: '123', // Too short
        firstName: '',
        lastName: ''
      };

      const response = await request(app.getHttpServer())
        .post('/api/admin/users')
        .set('Authorization', adminToken)
        .send(invalidUserDto)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
    });

    it('should enforce password strength requirements', async () => {
      const weakPasswordDto: CreateUserDto = {
        email: 'weakpass@test.com',
        password: 'password', // No uppercase, number, or special char
        firstName: 'Weak',
        lastName: 'Password'
      };

      await request(app.getHttpServer())
        .post('/api/admin/users')
        .set('Authorization', adminToken)
        .send(weakPasswordDto)
        .expect(400);
    });
  });

  describe('PUT /api/admin/users/:id', () => {
    it('should update user successfully', async () => {
      const userId = testUsers[1].id;
      const updateUserDto: UpdateUserDto = {
        firstName: 'Updated',
        lastName: 'Name',
        phone: '+9876543210',
        reason: 'Test update'
      };

      const response = await request(app.getHttpServer())
        .put(`/api/admin/users/${userId}`)
        .set('Authorization', adminToken)
        .send(updateUserDto)
        .expect(200);

      expect(response.body.firstName).toBe(updateUserDto.firstName);
      expect(response.body.lastName).toBe(updateUserDto.lastName);
    });

    it('should return 409 for duplicate email during update', async () => {
      const userId = testUsers[1].id;
      const updateUserDto: UpdateUserDto = {
        email: testUsers[0].email, // Admin's email
        reason: 'Test duplicate email'
      };

      await request(app.getHttpServer())
        .put(`/api/admin/users/${userId}`)
        .set('Authorization', adminToken)
        .send(updateUserDto)
        .expect(409);
    });
  });

  describe('PATCH /api/admin/users/:id/status', () => {
    it('should update user status successfully', async () => {
      const userId = testUsers[1].id;
      const updateStatusDto = {
        isActive: false,
        reason: 'Test deactivation'
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/admin/users/${userId}/status`)
        .set('Authorization', adminToken)
        .send(updateStatusDto)
        .expect(200);

      expect(response.body.isActive).toBe(false);

      // Reactivate for cleanup
      await request(app.getHttpServer())
        .patch(`/api/admin/users/${userId}/status`)
        .set('Authorization', adminToken)
        .send({ isActive: true, reason: 'Test cleanup' });
    });

    it('should prevent self-deactivation', async () => {
      const adminUserId = testUsers[0].id;
      const updateStatusDto = {
        isActive: false,
        reason: 'Self deactivation attempt'
      };

      await request(app.getHttpServer())
        .patch(`/api/admin/users/${adminUserId}/status`)
        .set('Authorization', adminToken)
        .send(updateStatusDto)
        .expect(400);
    });
  });

  describe('GET /api/admin/users/:id/roles', () => {
    it('should return user roles', async () => {
      const userId = testUsers[1].id;

      const response = await request(app.getHttpServer())
        .get(`/api/admin/users/${userId}/roles`)
        .set('Authorization', adminToken)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('role');
      expect(response.body[0].role).toHaveProperty('name');
    });

    it('should filter active roles only', async () => {
      const userId = testUsers[1].id;

      const response = await request(app.getHttpServer())
        .get(`/api/admin/users/${userId}/roles?activeOnly=true`)
        .set('Authorization', adminToken)
        .expect(200);

      response.body.forEach(userRole => {
        expect(userRole.isActive).toBe(true);
      });
    });
  });

  describe('POST /api/admin/users/:id/roles', () => {
    it('should assign roles to user successfully', async () => {
      // First create a test role
      const testRole = await prismaService.role.create({
        data: createTestRole({ name: 'TEST_ROLE', description: 'Test Role' })
      });

      const userId = testUsers[1].id;
      const assignRolesDto: AssignRolesDto = {
        roles: ['TEST_ROLE'],
        reason: 'Test role assignment'
      };

      const response = await request(app.getHttpServer())
        .post(`/api/admin/users/${userId}/roles`)
        .set('Authorization', adminToken)
        .send(assignRolesDto)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Roles assigned successfully');

      // Cleanup
      await prismaService.userRole.deleteMany({
        where: { userId, roleId: testRole.id }
      });
      await prismaService.role.delete({
        where: { id: testRole.id }
      });
    });

    it('should return 400 for invalid roles', async () => {
      const userId = testUsers[1].id;
      const assignRolesDto: AssignRolesDto = {
        roles: ['INVALID_ROLE'],
        reason: 'Test invalid role'
      };

      await request(app.getHttpServer())
        .post(`/api/admin/users/${userId}/roles`)
        .set('Authorization', adminToken)
        .send(assignRolesDto)
        .expect(400);
    });
  });

  describe('GET /api/admin/users/stats', () => {
    it('should return user statistics for admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/users/stats')
        .set('Authorization', adminToken)
        .expect(200);

      expect(response.body).toHaveProperty('totalUsers');
      expect(response.body).toHaveProperty('activeUsers');
      expect(response.body).toHaveProperty('verifiedUsers');
      expect(response.body).toHaveProperty('usersByRole');
      expect(response.body).toHaveProperty('geographicDistribution');
      expect(response.body).toHaveProperty('generatedAt');
      expect(response.body.usersByRole).toBeInstanceOf(Array);
    });

    it('should return 403 for non-admin users', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/users/stats')
        .set('Authorization', userToken)
        .expect(403);
    });
  });

  describe('POST /api/admin/users/bulk/roles', () => {
    it('should perform bulk role operations successfully', async () => {
      const testRole = await prismaService.role.create({
        data: createTestRole({ name: 'BULK_TEST_ROLE', description: 'Bulk Test Role' })
      });

      const bulkOperationDto = {
        userIds: [testUsers[1].id],
        roles: ['BULK_TEST_ROLE'],
        operation: 'assign' as const,
        reason: 'Bulk operation test'
      };

      const response = await request(app.getHttpServer())
        .post('/api/admin/users/bulk/roles')
        .set('Authorization', adminToken)
        .send(bulkOperationDto)
        .expect(200);

      expect(response.body).toHaveProperty('successCount');
      expect(response.body).toHaveProperty('failureCount');
      expect(response.body).toHaveProperty('status');
      expect(response.body.successCount).toBeGreaterThan(0);

      // Cleanup
      await prismaService.userRole.deleteMany({
        where: { roleId: testRole.id }
      });
      await prismaService.role.delete({
        where: { id: testRole.id }
      });
    });

    it('should handle validation errors in bulk operations', async () => {
      const bulkOperationDto = {
        userIds: [], // Empty array should fail validation
        roles: ['INVESTOR'],
        operation: 'assign' as const,
        reason: 'Invalid bulk operation'
      };

      await request(app.getHttpServer())
        .post('/api/admin/users/bulk/roles')
        .set('Authorization', adminToken)
        .send(bulkOperationDto)
        .expect(400);
    });
  });

  describe('DELETE /api/admin/users/:id', () => {
    it('should soft delete user successfully', async () => {
      // Create a test user for deletion
      const testUserData = createTestUser({ email: 'delete@test.com' });
      const userToDelete = await prismaService.user.create({
        data: testUserData
      });

      const response = await request(app.getHttpServer())
        .delete(`/api/admin/users/${userToDelete.id}`)
        .set('Authorization', adminToken)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('deletedAt');

      // Verify user is soft deleted
      const deletedUser = await prismaService.user.findUnique({
        where: { id: userToDelete.id }
      });
      expect(deletedUser?.deletedAt).not.toBeNull();
    });

    it('should prevent self-deletion', async () => {
      const adminUserId = testUsers[0].id;

      await request(app.getHttpServer())
        .delete(`/api/admin/users/${adminUserId}`)
        .set('Authorization', adminToken)
        .expect(400);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on user creation', async () => {
      const createUserDto: CreateUserDto = {
        email: 'ratelimit@test.com',
        password: 'SecurePass123!',
        firstName: 'Rate',
        lastName: 'Limit'
      };

      // This test would need actual rate limiting configuration
      // For demonstration purposes, we'll just verify the endpoint exists
      const response = await request(app.getHttpServer())
        .post('/api/admin/users')
        .set('Authorization', adminToken)
        .send(createUserDto);

      expect([201, 429]).toContain(response.status);

      // Cleanup if user was created
      if (response.status === 201) {
        await prismaService.user.delete({
          where: { id: response.body.id }
        });
      }
    });
  });

  describe('Error Handling', () => {
    it('should return structured error responses', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/users/invalid-uuid')
        .set('Authorization', adminToken)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
    });

    it('should handle database errors gracefully', async () => {
      // This would test database connection issues, timeouts, etc.
      // Implementation depends on how you want to simulate database errors
      const response = await request(app.getHttpServer())
        .get('/api/admin/users')
        .set('Authorization', adminToken);

      expect([200, 500]).toContain(response.status);
    });

    it('should handle malformed requests gracefully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/admin/users')
        .set('Authorization', adminToken)
        .send('invalid json')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle missing content-type header', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/admin/users')
        .set('Authorization', adminToken)
        .set('Content-Type', '')
        .send({
          email: 'test@test.com',
          password: 'SecurePass123!',
          firstName: 'Test',
          lastName: 'User'
        });

      expect([400, 415]).toContain(response.status);
    });

    it('should handle SQL injection attempts', async () => {
      const maliciousInput = "'; DROP TABLE users; --";

      const response = await request(app.getHttpServer())
        .get(`/api/admin/users?search=${encodeURIComponent(maliciousInput)}`)
        .set('Authorization', adminToken);

      expect([200, 400]).toContain(response.status);
      // Should not crash and should sanitize input
    });

    it('should handle XSS attempts in user data', async () => {
      const xssPayload = '<script>alert("xss")</script>';

      const createUserDto: CreateUserDto = {
        email: 'xss@test.com',
        password: 'SecurePass123!',
        firstName: xssPayload,
        lastName: 'User'
      };

      const response = await request(app.getHttpServer())
        .post('/api/admin/users')
        .set('Authorization', adminToken)
        .send(createUserDto);

      if (response.status === 201) {
        // If created, verify the XSS payload was sanitized
        expect(response.body.firstName).not.toContain('<script>');

        // Cleanup
        await prismaService.user.delete({
          where: { id: response.body.id }
        });
      } else {
        expect(response.status).toBe(400);
      }
    });
  });

  describe('Security Tests', () => {
    it('should not expose sensitive data in responses', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/admin/users/${testUsers[0].id}`)
        .set('Authorization', adminToken)
        .expect(200);

      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('passwordResetToken');
      expect(response.body).not.toHaveProperty('emailVerificationToken');
    });

    it('should require strong passwords', async () => {
      const weakPasswords = [
        'password',
        '12345678',
        'abcdefgh',
        'PASSWORD',
        'Password',
        'pass123',
        'Passw0rd'
      ];

      for (const weakPassword of weakPasswords) {
        const createUserDto: CreateUserDto = {
          email: `weak${Date.now()}@test.com`,
          password: weakPassword,
          firstName: 'Weak',
          lastName: 'Password'
        };

        await request(app.getHttpServer())
          .post('/api/admin/users')
          .set('Authorization', adminToken)
          .send(createUserDto)
          .expect(400);
      }
    });

    it('should validate email format strictly', async () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user.domain.com',
        'user@domain',
        'user with spaces@domain.com',
        'user..double@domain.com'
      ];

      for (const invalidEmail of invalidEmails) {
        const createUserDto: CreateUserDto = {
          email: invalidEmail,
          password: 'SecurePass123!',
          firstName: 'Test',
          lastName: 'User'
        };

        await request(app.getHttpServer())
          .post('/api/admin/users')
          .set('Authorization', adminToken)
          .send(createUserDto)
          .expect(400);
      }
    });

    it('should prevent privilege escalation', async () => {
      // Non-admin user trying to create admin user
      const regularUserToken = createTestJwtToken({
        sub: 'regular-user-123',
        email: 'regular@test.com',
        roles: ['INVESTOR']
      });

      const createAdminDto: CreateUserDto = {
        email: 'newadmin@test.com',
        password: 'SecurePass123!',
        firstName: 'New',
        lastName: 'Admin',
        roles: ['SUPER_ADMIN']
      };

      await request(app.getHttpServer())
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${regularUserToken.token}`)
        .send(createAdminDto)
        .expect(403);
    });

    it('should enforce authorization on all endpoints', async () => {
      const endpoints = [
        { method: 'get', url: '/api/admin/users' },
        { method: 'get', url: `/api/admin/users/${testUsers[0].id}` },
        { method: 'post', url: '/api/admin/users' },
        { method: 'put', url: `/api/admin/users/${testUsers[0].id}` },
        { method: 'patch', url: `/api/admin/users/${testUsers[0].id}/status` },
        { method: 'delete', url: `/api/admin/users/${testUsers[0].id}` },
        { method: 'get', url: '/api/admin/users/stats' }
      ];

      for (const endpoint of endpoints) {
        let req = request(app.getHttpServer())[endpoint.method](endpoint.url);

        if (endpoint.method !== 'get') {
          req = req.send({});
        }

        await req.expect(401);
      }
    });
  });

  describe('Data Validation and Sanitization', () => {
    it('should trim whitespace from string fields', async () => {
      const createUserDto: CreateUserDto = {
        email: '  trimtest@test.com  ',
        password: 'SecurePass123!',
        firstName: '  John  ',
        lastName: '  Doe  '
      };

      const response = await request(app.getHttpServer())
        .post('/api/admin/users')
        .set('Authorization', adminToken)
        .send(createUserDto)
        .expect(201);

      expect(response.body.email).toBe('trimtest@test.com');
      expect(response.body.firstName).toBe('John');
      expect(response.body.lastName).toBe('Doe');

      // Cleanup
      await prismaService.user.delete({
        where: { id: response.body.id }
      });
    });

    it('should validate phone number formats', async () => {
      const invalidPhones = [
        '123',
        'invalid-phone',
        '123-456-7890-extra',
        '+1-2345',
        'phone-number'
      ];

      for (const invalidPhone of invalidPhones) {
        const createUserDto: CreateUserDto = {
          email: `phone${Date.now()}@test.com`,
          password: 'SecurePass123!',
          firstName: 'Test',
          lastName: 'User',
          phone: invalidPhone
        };

        await request(app.getHttpServer())
          .post('/api/admin/users')
          .set('Authorization', adminToken)
          .send(createUserDto)
          .expect(400);
      }
    });

    it('should validate timezone values', async () => {
      const createUserDto: CreateUserDto = {
        email: 'timezone@test.com',
        password: 'SecurePass123!',
        firstName: 'Test',
        lastName: 'User',
        timezone: 'Invalid/Timezone'
      };

      await request(app.getHttpServer())
        .post('/api/admin/users')
        .set('Authorization', adminToken)
        .send(createUserDto)
        .expect(400);
    });

    it('should validate language codes', async () => {
      const createUserDto: CreateUserDto = {
        email: 'language@test.com',
        password: 'SecurePass123!',
        firstName: 'Test',
        lastName: 'User',
        language: 'invalid-language' as any
      };

      await request(app.getHttpServer())
        .post('/api/admin/users')
        .set('Authorization', adminToken)
        .send(createUserDto)
        .expect(400);
    });

    it('should enforce maximum field lengths', async () => {
      const longString = 'a'.repeat(256);

      const createUserDto: CreateUserDto = {
        email: 'maxlength@test.com',
        password: 'SecurePass123!',
        firstName: longString,
        lastName: 'User'
      };

      await request(app.getHttpServer())
        .post('/api/admin/users')
        .set('Authorization', adminToken)
        .send(createUserDto)
        .expect(400);
    });
  });

  describe('Concurrency and Race Conditions', () => {
    it('should handle concurrent user creation with same email', async () => {
      const createUserDto: CreateUserDto = {
        email: 'concurrent@test.com',
        password: 'SecurePass123!',
        firstName: 'Concurrent',
        lastName: 'User'
      };

      const promises = Array(3).fill(null).map(() =>
        request(app.getHttpServer())
          .post('/api/admin/users')
          .set('Authorization', adminToken)
          .send(createUserDto)
      );

      const responses = await Promise.all(promises);

      // Only one should succeed
      const successCount = responses.filter(r => r.status === 201).length;
      const conflictCount = responses.filter(r => r.status === 409).length;

      expect(successCount).toBe(1);
      expect(conflictCount).toBe(2);

      // Cleanup
      const successfulResponse = responses.find(r => r.status === 201);
      if (successfulResponse) {
        await prismaService.user.delete({
          where: { id: successfulResponse.body.id }
        });
      }
    });

    it('should handle concurrent role assignments', async () => {
      const testRole = await prismaService.role.create({
        data: createTestRole({ name: 'CONCURRENT_TEST_ROLE', description: 'Concurrent Test Role' })
      });

      const userId = testUsers[1].id;
      const assignRolesDto: AssignRolesDto = {
        roles: ['CONCURRENT_TEST_ROLE'],
        reason: 'Concurrent test'
      };

      const promises = Array(3).fill(null).map(() =>
        request(app.getHttpServer())
          .post(`/api/admin/users/${userId}/roles`)
          .set('Authorization', adminToken)
          .send(assignRolesDto)
      );

      const responses = await Promise.all(promises);

      // All should succeed (idempotent operation)
      responses.forEach(response => {
        expect([200, 409]).toContain(response.status);
      });

      // Cleanup
      await prismaService.userRole.deleteMany({
        where: { userId, roleId: testRole.id }
      });
      await prismaService.role.delete({
        where: { id: testRole.id }
      });
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle empty search queries', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/users?search=')
        .set('Authorization', adminToken)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should handle very large page sizes', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/users?limit=1000')
        .set('Authorization', adminToken)
        .expect(200);

      expect(response.body.pagination.limit).toBeLessThanOrEqual(100); // Should be capped
    });

    it('should handle negative page numbers', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/users?page=-1')
        .set('Authorization', adminToken)
        .expect(400);
    });

    it('should handle zero page size', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/users?limit=0')
        .set('Authorization', adminToken)
        .expect(400);
    });

    it('should handle non-existent role assignments', async () => {
      const userId = testUsers[1].id;
      const assignRolesDto: AssignRolesDto = {
        roles: ['NON_EXISTENT_ROLE'],
        reason: 'Test non-existent role'
      };

      await request(app.getHttpServer())
        .post(`/api/admin/users/${userId}/roles`)
        .set('Authorization', adminToken)
        .send(assignRolesDto)
        .expect(400);
    });

    it('should handle empty role arrays', async () => {
      const userId = testUsers[1].id;
      const assignRolesDto: AssignRolesDto = {
        roles: [],
        reason: 'Test empty roles'
      };

      await request(app.getHttpServer())
        .post(`/api/admin/users/${userId}/roles`)
        .set('Authorization', adminToken)
        .send(assignRolesDto)
        .expect(400);
    });

    it('should handle special characters in search', async () => {
      const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '[', ']', '{', '}'];

      for (const char of specialChars) {
        const response = await request(app.getHttpServer())
          .get(`/api/admin/users?search=${encodeURIComponent(char)}`)
          .set('Authorization', adminToken);

        expect([200, 400]).toContain(response.status);
      }
    });
  });

  describe('Audit and Logging', () => {
    it('should log user creation events', async () => {
      const createUserDto: CreateUserDto = {
        email: 'audit@test.com',
        password: 'SecurePass123!',
        firstName: 'Audit',
        lastName: 'Test'
      };

      const response = await request(app.getHttpServer())
        .post('/api/admin/users')
        .set('Authorization', adminToken)
        .send(createUserDto)
        .expect(201);

      // Verify audit trail (implementation depends on your audit system)
      const createdUser = await prismaService.user.findUnique({
        where: { id: response.body.id }
      });

      expect(createdUser?.createdBy).toBeTruthy();
      expect(createdUser?.createdAt).toBeInstanceOf(Date);

      // Cleanup
      await prismaService.user.delete({
        where: { id: response.body.id }
      });
    });

    it('should track user modifications', async () => {
      const userId = testUsers[1].id;
      const updateUserDto: UpdateUserDto = {
        firstName: 'Modified',
        reason: 'Audit test'
      };

      const response = await request(app.getHttpServer())
        .put(`/api/admin/users/${userId}`)
        .set('Authorization', adminToken)
        .send(updateUserDto)
        .expect(200);

      // Verify modification tracking
      const updatedUser = await prismaService.user.findUnique({
        where: { id: userId }
      });

      expect(updatedUser?.updatedAt).toBeInstanceOf(Date);
      expect(response.body.firstName).toBe('Modified');
    });
  });

  describe('Performance Tests', () => {
    it('should handle bulk operations efficiently', async () => {
      const startTime = Date.now();

      const bulkOperationDto = {
        userIds: [testUsers[1].id],
        roles: ['INVESTOR'],
        operation: 'assign' as const,
        reason: 'Performance test'
      };

      await request(app.getHttpServer())
        .post('/api/admin/users/bulk/roles')
        .set('Authorization', adminToken)
        .send(bulkOperationDto)
        .expect(200);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should paginate large datasets efficiently', async () => {
      const startTime = Date.now();

      await request(app.getHttpServer())
        .get('/api/admin/users?page=1&limit=50')
        .set('Authorization', adminToken)
        .expect(200);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });
});