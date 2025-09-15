import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { AuthService } from '../src/auth/services/auth.service';
import { RoleService } from '../src/auth/services/role.service';
import { CreateRoleDto, AssignRoleDto } from '../src/auth/dto/role.dto';

describe('Role Management (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authService: AuthService;
  let roleService: RoleService;

  // Test data
  let adminUser: any;
  let investorUser: any;
  let regularUser: any;
  let adminToken: string;
  let investorToken: string;
  let regularUserToken: string;
  let testRole: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    authService = moduleFixture.get<AuthService>(AuthService);
    roleService = moduleFixture.get<RoleService>(RoleService);

    await app.init();

    // Set up test data
    await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  describe('POST /roles', () => {
    it('should create a new role as admin', () => {
      const createRoleDto: CreateRoleDto = {
        name: 'TEST_ROLE',
        description: 'A test role for e2e testing',
        isActive: true,
        isDefault: false,
      };

      return request(app.getHttpServer())
        .post('/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createRoleDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe(createRoleDto.name);
          expect(res.body.description).toBe(createRoleDto.description);
          expect(res.body.isActive).toBe(true);
          expect(res.body.isDefault).toBe(false);
          testRole = res.body;
        });
    });

    it('should reject role creation as investor', () => {
      const createRoleDto: CreateRoleDto = {
        name: 'UNAUTHORIZED_ROLE',
        description: 'This should not be created',
      };

      return request(app.getHttpServer())
        .post('/roles')
        .set('Authorization', `Bearer ${investorToken}`)
        .send(createRoleDto)
        .expect(403)
        .expect((res) => {
          expect(res.body.message).toContain('Insufficient permissions');
        });
    });

    it('should reject role creation without authentication', () => {
      const createRoleDto: CreateRoleDto = {
        name: 'UNAUTHENTICATED_ROLE',
        description: 'This should not be created',
      };

      return request(app.getHttpServer())
        .post('/roles')
        .send(createRoleDto)
        .expect(401);
    });

    it('should reject duplicate role names', () => {
      const createRoleDto: CreateRoleDto = {
        name: 'ADMIN', // This already exists from seeding
        description: 'Duplicate admin role',
      };

      return request(app.getHttpServer())
        .post('/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createRoleDto)
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toContain('already exists');
        });
    });
  });

  describe('GET /roles', () => {
    it('should get all roles as admin', () => {
      return request(app.getHttpServer())
        .get('/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThanOrEqual(3); // ADMIN, INVESTOR, USER + TEST_ROLE

          const adminRole = res.body.find((role: any) => role.name === 'ADMIN');
          expect(adminRole).toBeDefined();
          expect(adminRole).toHaveProperty('permissions');
        });
    });

    it('should reject getting roles as investor', () => {
      return request(app.getHttpServer())
        .get('/roles')
        .set('Authorization', `Bearer ${investorToken}`)
        .expect(403);
    });

    it('should get roles including inactive ones when requested', () => {
      return request(app.getHttpServer())
        .get('/roles?includeInactive=true')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('GET /roles/:id', () => {
    it('should get role by ID as admin', async () => {
      const adminRole = await roleService.getRoleByName('ADMIN');

      return request(app.getHttpServer())
        .get(`/roles/${adminRole.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(adminRole.id);
          expect(res.body.name).toBe('ADMIN');
          expect(res.body).toHaveProperty('permissions');
        });
    });

    it('should return 404 for non-existent role', () => {
      const nonExistentId = 'non-existent-role-id';

      return request(app.getHttpServer())
        .get(`/roles/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('PUT /roles/:id', () => {
    it('should update role as admin', async () => {
      const updateData = {
        description: 'Updated test role description',
        isActive: true,
      };

      return request(app.getHttpServer())
        .put(`/roles/${testRole.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(testRole.id);
          expect(res.body.description).toBe(updateData.description);
        });
    });

    it('should reject role update as non-admin', () => {
      const updateData = {
        description: 'This should not work',
      };

      return request(app.getHttpServer())
        .put(`/roles/${testRole.id}`)
        .set('Authorization', `Bearer ${investorToken}`)
        .send(updateData)
        .expect(403);
    });
  });

  describe('POST /roles/assign', () => {
    it('should assign role to user as admin', () => {
      const assignRoleDto: AssignRoleDto = {
        userId: regularUser.id,
        roleId: testRole.id,
        reason: 'E2E testing role assignment',
      };

      return request(app.getHttpServer())
        .post('/roles/assign')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(assignRoleDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toContain('successfully');
        });
    });

    it('should reject role assignment as non-admin', () => {
      const assignRoleDto: AssignRoleDto = {
        userId: regularUser.id,
        roleId: testRole.id,
        reason: 'This should fail',
      };

      return request(app.getHttpServer())
        .post('/roles/assign')
        .set('Authorization', `Bearer ${investorToken}`)
        .send(assignRoleDto)
        .expect(403);
    });

    it('should reject assigning non-existent role', () => {
      const assignRoleDto: AssignRoleDto = {
        userId: regularUser.id,
        roleId: 'non-existent-role',
        reason: 'This should fail',
      };

      return request(app.getHttpServer())
        .post('/roles/assign')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(assignRoleDto)
        .expect(404);
    });
  });

  describe('GET /roles/user/:userId', () => {
    it('should get user roles as admin', () => {
      return request(app.getHttpServer())
        .get(`/roles/user/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('roles');
          expect(res.body).toHaveProperty('permissions');
          expect(Array.isArray(res.body.roles)).toBe(true);
          expect(Array.isArray(res.body.permissions)).toBe(true);

          // Should have both USER (default) and TEST_ROLE (assigned in previous test)
          expect(res.body.roles.length).toBeGreaterThanOrEqual(2);
        });
    });

    it('should get user roles as investor (limited access)', () => {
      return request(app.getHttpServer())
        .get(`/roles/user/${regularUser.id}`)
        .set('Authorization', `Bearer ${investorToken}`)
        .expect(200);
    });

    it('should reject getting user roles as regular user', () => {
      return request(app.getHttpServer())
        .get(`/roles/user/${adminUser.id}`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);
    });
  });

  describe('GET /roles/me/roles', () => {
    it('should get current user roles', () => {
      return request(app.getHttpServer())
        .get('/roles/me/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('roles');
          expect(res.body).toHaveProperty('permissions');
          expect(Array.isArray(res.body.roles)).toBe(true);

          const adminRole = res.body.roles.find((role: any) => role.name === 'ADMIN');
          expect(adminRole).toBeDefined();
        });
    });
  });

  describe('GET /roles/check/:userId/:roleName', () => {
    it('should check if user has role', () => {
      return request(app.getHttpServer())
        .get(`/roles/check/${adminUser.id}/ADMIN`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.hasRole).toBe(true);
          expect(res.body.role).toBe('ADMIN');
          expect(res.body.userId).toBe(adminUser.id);
        });
    });

    it('should return false for role user does not have', () => {
      return request(app.getHttpServer())
        .get(`/roles/check/${regularUser.id}/ADMIN`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.hasRole).toBe(false);
          expect(res.body.role).toBe('ADMIN');
          expect(res.body.userId).toBe(regularUser.id);
        });
    });
  });

  describe('DELETE /roles/:id', () => {
    it('should soft delete role as admin', () => {
      return request(app.getHttpServer())
        .delete(`/roles/${testRole.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
    });

    it('should reject deleting role as non-admin', async () => {
      // Create a role to delete
      const roleToDelete = await roleService.createRole(
        { name: 'DELETE_TEST_ROLE', description: 'For delete testing' },
        adminUser.id
      );

      return request(app.getHttpServer())
        .delete(`/roles/${roleToDelete.id}`)
        .set('Authorization', `Bearer ${investorToken}`)
        .expect(403);
    });
  });

  // Helper functions
  async function setupTestData() {
    // Create test users
    const bcrypt = await import('bcrypt');

    // Admin user
    adminUser = await prisma.user.create({
      data: {
        email: 'admin-e2e@test.com',
        password: await bcrypt.hash('password123', 12),
        firstName: 'Admin',
        lastName: 'User',
        isActive: true,
        isVerified: true,
      },
    });

    // Investor user
    investorUser = await prisma.user.create({
      data: {
        email: 'investor-e2e@test.com',
        password: await bcrypt.hash('password123', 12),
        firstName: 'Investor',
        lastName: 'User',
        isActive: true,
        isVerified: true,
      },
    });

    // Regular user
    regularUser = await prisma.user.create({
      data: {
        email: 'user-e2e@test.com',
        password: await bcrypt.hash('password123', 12),
        firstName: 'Regular',
        lastName: 'User',
        isActive: true,
        isVerified: true,
      },
    });

    // Assign roles
    const adminRole = await roleService.getRoleByName('ADMIN');
    const investorRole = await roleService.getRoleByName('INVESTOR');
    const userRole = await roleService.getRoleByName('USER');

    // Assign admin role
    await prisma.userRole.create({
      data: {
        userId: adminUser.id,
        roleId: adminRole.id,
        isActive: true,
      },
    });

    // Assign investor role
    await prisma.userRole.create({
      data: {
        userId: investorUser.id,
        roleId: investorRole.id,
        isActive: true,
      },
    });

    // Assign user role
    await prisma.userRole.create({
      data: {
        userId: regularUser.id,
        roleId: userRole.id,
        isActive: true,
      },
    });

    // Generate tokens
    const adminAuthResult = await authService.login({
      email: 'admin-e2e@test.com',
      password: 'password123',
    }, 'test-agent', '127.0.0.1');
    adminToken = adminAuthResult.accessToken;

    const investorAuthResult = await authService.login({
      email: 'investor-e2e@test.com',
      password: 'password123',
    }, 'test-agent', '127.0.0.1');
    investorToken = investorAuthResult.accessToken;

    const regularUserAuthResult = await authService.login({
      email: 'user-e2e@test.com',
      password: 'password123',
    }, 'test-agent', '127.0.0.1');
    regularUserToken = regularUserAuthResult.accessToken;
  }

  async function cleanupTestData() {
    // Clean up test data
    await prisma.userRole.deleteMany({
      where: {
        userId: {
          in: [adminUser.id, investorUser.id, regularUser.id],
        },
      },
    });

    await prisma.roleAssignment.deleteMany({
      where: {
        userId: {
          in: [adminUser.id, investorUser.id, regularUser.id],
        },
      },
    });

    await prisma.session.deleteMany({
      where: {
        userId: {
          in: [adminUser.id, investorUser.id, regularUser.id],
        },
      },
    });

    await prisma.auditLog.deleteMany({
      where: {
        userId: {
          in: [adminUser.id, investorUser.id, regularUser.id],
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        id: {
          in: [adminUser.id, investorUser.id, regularUser.id],
        },
      },
    });

    // Clean up test roles
    await prisma.rolePermission.deleteMany({
      where: {
        role: {
          name: {
            in: ['TEST_ROLE', 'DELETE_TEST_ROLE'],
          },
        },
      },
    });

    await prisma.role.deleteMany({
      where: {
        name: {
          in: ['TEST_ROLE', 'DELETE_TEST_ROLE'],
        },
      },
    });
  }
});