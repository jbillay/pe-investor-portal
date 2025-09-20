import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import * as request from 'supertest';

import { RBACSetupController } from '../controllers/rbac-setup.controller';
import { RoleService } from '../services/role.service';
import { PermissionService } from '../services/permission.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../guards/role.guard';
import { PrismaService } from '../../../database/prisma.service';
import { createTestJwtToken } from './factories/user.factory';

describe('RBACSetupController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let roleService: RoleService;
  let permissionService: PermissionService;
  let adminToken: string;
  let adminUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ['.env.test', '.env']
        }),
        EventEmitterModule.forRoot(),
      ],
      controllers: [RBACSetupController],
      providers: [
        RoleService,
        PermissionService,
        PrismaService,
        {
          provide: JwtAuthGuard,
          useValue: {
            canActivate: jest.fn(() => true),
          },
        },
        {
          provide: RoleGuard,
          useValue: {
            canActivate: jest.fn(() => true),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    roleService = moduleFixture.get<RoleService>(RoleService);
    permissionService = moduleFixture.get<PermissionService>(PermissionService);

    await app.init();

    // Setup test admin user and token
    await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  beforeEach(async () => {
    // Clean up any existing permissions and roles before each test
    await cleanupRBACData();
  });

  async function setupTestData() {
    // Create admin user for testing
    const adminUser = await prismaService.user.create({
      data: {
        email: 'rbac-admin@test.com',
        password: 'hashedPassword',
        firstName: 'RBAC',
        lastName: 'Admin',
        isActive: true,
        isEmailVerified: true,
        createdBy: 'system',
      },
    });

    adminUserId = adminUser.id;

    // Create admin token
    const tokenData = createTestJwtToken({
      sub: adminUser.id,
      email: adminUser.email,
      roles: ['SUPER_ADMIN'],
    });

    adminToken = `Bearer ${tokenData.token}`;
  }

  async function cleanupTestData() {
    try {
      await prismaService.userRole.deleteMany({});
      await prismaService.rolePermission.deleteMany({});
      await prismaService.permission.deleteMany({});
      await prismaService.role.deleteMany({});
      await prismaService.userProfile.deleteMany({});
      await prismaService.user.deleteMany({
        where: { email: 'rbac-admin@test.com' },
      });
    } catch (error) {
      console.error('Error cleaning up test data:', error);
    }
  }

  async function cleanupRBACData() {
    try {
      await prismaService.rolePermission.deleteMany({});
      await prismaService.permission.deleteMany({});
      await prismaService.role.deleteMany({});
    } catch (error) {
      console.error('Error cleaning up RBAC data:', error);
    }
  }

  describe('POST /admin/rbac-setup/initialize', () => {
    it('should successfully initialize RBAC system from scratch', async () => {
      const response = await request(app.getHttpServer())
        .post('/admin/rbac-setup/initialize')
        .set('Authorization', adminToken)
        .expect(HttpStatus.OK);

      expect(response.body).toMatchObject({
        permissionsCreated: expect.any(Number),
        rolesCreated: expect.any(Number),
        rolePermissionsAssigned: expect.any(Number),
        message: expect.stringContaining('RBAC system initialized successfully'),
      });

      expect(response.body.permissionsCreated).toBeGreaterThan(40);
      expect(response.body.rolesCreated).toBe(6);
      expect(response.body.rolePermissionsAssigned).toBeGreaterThan(100);
    });

    it('should handle re-initialization without duplicating data', async () => {
      // First initialization
      const firstResponse = await request(app.getHttpServer())
        .post('/admin/rbac-setup/initialize')
        .set('Authorization', adminToken)
        .expect(HttpStatus.OK);

      expect(firstResponse.body.permissionsCreated).toBeGreaterThan(0);
      expect(firstResponse.body.rolesCreated).toBeGreaterThan(0);

      // Second initialization should skip existing data
      const secondResponse = await request(app.getHttpServer())
        .post('/admin/rbac-setup/initialize')
        .set('Authorization', adminToken)
        .expect(HttpStatus.OK);

      expect(secondResponse.body.permissionsCreated).toBe(0);
      expect(secondResponse.body.rolesCreated).toBe(0);
      expect(secondResponse.body.rolePermissionsAssigned).toBe(0);
    });

    it('should create all expected permissions', async () => {
      await request(app.getHttpServer())
        .post('/admin/rbac-setup/initialize')
        .set('Authorization', adminToken)
        .expect(HttpStatus.OK);

      // Verify specific permissions exist
      const userCreatePerm = await prismaService.permission.findFirst({
        where: { name: 'USER:CREATE' },
      });
      expect(userCreatePerm).toBeTruthy();
      expect(userCreatePerm?.resource).toBe('USER');
      expect(userCreatePerm?.action).toBe('CREATE');

      const fundManagePerfPerm = await prismaService.permission.findFirst({
        where: { name: 'FUND:MANAGE_PERFORMANCE' },
      });
      expect(fundManagePerfPerm).toBeTruthy();

      const systemConfigPerm = await prismaService.permission.findFirst({
        where: { name: 'SYSTEM:CONFIGURE' },
      });
      expect(systemConfigPerm).toBeTruthy();

      // Count total permissions
      const totalPermissions = await prismaService.permission.count();
      expect(totalPermissions).toBeGreaterThan(40);
    });

    it('should create all expected roles with correct properties', async () => {
      await request(app.getHttpServer())
        .post('/admin/rbac-setup/initialize')
        .set('Authorization', adminToken)
        .expect(HttpStatus.OK);

      // Verify SUPER_ADMIN role
      const superAdminRole = await prismaService.role.findFirst({
        where: { name: 'SUPER_ADMIN' },
      });
      expect(superAdminRole).toBeTruthy();
      expect(superAdminRole?.description).toContain('System administrator');
      expect(superAdminRole?.isActive).toBe(true);
      expect(superAdminRole?.isDefault).toBe(false);

      // Verify INVESTOR role
      const investorRole = await prismaService.role.findFirst({
        where: { name: 'INVESTOR' },
      });
      expect(investorRole).toBeTruthy();
      expect(investorRole?.isDefault).toBe(true);

      // Verify FUND_MANAGER role
      const fundManagerRole = await prismaService.role.findFirst({
        where: { name: 'FUND_MANAGER' },
      });
      expect(fundManagerRole).toBeTruthy();

      // Count total roles
      const totalRoles = await prismaService.role.count();
      expect(totalRoles).toBe(6);
    });

    it('should correctly assign permissions to roles', async () => {
      await request(app.getHttpServer())
        .post('/admin/rbac-setup/initialize')
        .set('Authorization', adminToken)
        .expect(HttpStatus.OK);

      // Verify SUPER_ADMIN has comprehensive permissions
      const superAdminRole = await prismaService.role.findFirst({
        where: { name: 'SUPER_ADMIN' },
        include: {
          rolePermissions: {
            include: { permission: true },
          },
        },
      });

      expect(superAdminRole?.rolePermissions.length).toBeGreaterThan(40);

      const superAdminPermissions = superAdminRole?.rolePermissions.map(
        rp => rp.permission.name
      );

      expect(superAdminPermissions).toContain('USER:CREATE');
      expect(superAdminPermissions).toContain('SYSTEM:CONFIGURE');
      expect(superAdminPermissions).toContain('AUDIT:READ');

      // Verify INVESTOR has limited permissions
      const investorRole = await prismaService.role.findFirst({
        where: { name: 'INVESTOR' },
        include: {
          rolePermissions: {
            include: { permission: true },
          },
        },
      });

      expect(investorRole?.rolePermissions.length).toBeLessThan(10);

      const investorPermissions = investorRole?.rolePermissions.map(
        rp => rp.permission.name
      );

      expect(investorPermissions).toContain('INVESTMENT:READ_OWN');
      expect(investorPermissions).toContain('PORTFOLIO:READ_OWN');
      expect(investorPermissions).not.toContain('USER:DELETE');
      expect(investorPermissions).not.toContain('SYSTEM:CONFIGURE');
    });

    it('should handle database constraints properly', async () => {
      // First create a permission manually to test conflict handling
      await prismaService.permission.create({
        data: {
          name: 'USER:CREATE',
          description: 'Manually created permission',
          resource: 'USER',
          action: 'CREATE',
          createdBy: adminUserId,
        },
      });

      const response = await request(app.getHttpServer())
        .post('/admin/rbac-setup/initialize')
        .set('Authorization', adminToken)
        .expect(HttpStatus.OK);

      // Should still succeed and report fewer permissions created
      expect(response.body.permissionsCreated).toBeGreaterThan(0);
      expect(response.body.message).toContain('RBAC system initialized successfully');
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/admin/rbac-setup/initialize')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should require admin role', async () => {
      // Create a non-admin token
      const regularUserToken = createTestJwtToken({
        sub: 'user-123',
        email: 'user@test.com',
        roles: ['INVESTOR'],
      });

      await request(app.getHttpServer())
        .post('/admin/rbac-setup/initialize')
        .set('Authorization', `Bearer ${regularUserToken.token}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should return proper error structure on validation failures', async () => {
      // Mock a service to throw an error for testing error handling
      const originalCreatePermission = permissionService.createPermission;
      jest.spyOn(permissionService, 'createPermission')
        .mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app.getHttpServer())
        .post('/admin/rbac-setup/initialize')
        .set('Authorization', adminToken)
        .expect(HttpStatus.OK); // Should still return 200 as errors are handled gracefully

      // Should still complete but with some failures logged
      expect(response.body).toHaveProperty('message');

      // Restore original method
      jest.spyOn(permissionService, 'createPermission')
        .mockImplementation(originalCreatePermission);
    });

    it('should maintain referential integrity during initialization', async () => {
      await request(app.getHttpServer())
        .post('/admin/rbac-setup/initialize')
        .set('Authorization', adminToken)
        .expect(HttpStatus.OK);

      // Verify all role-permission assignments have valid references
      const rolePermissions = await prismaService.rolePermission.findMany({
        include: {
          role: true,
          permission: true,
        },
      });

      expect(rolePermissions.length).toBeGreaterThan(0);

      rolePermissions.forEach(rp => {
        expect(rp.role).toBeTruthy();
        expect(rp.permission).toBeTruthy();
        expect(rp.roleId).toBe(rp.role.id);
        expect(rp.permissionId).toBe(rp.permission.id);
      });
    });

    it('should set correct audit fields', async () => {
      await request(app.getHttpServer())
        .post('/admin/rbac-setup/initialize')
        .set('Authorization', adminToken)
        .expect(HttpStatus.OK);

      // Verify all created entities have proper audit fields
      const permissions = await prismaService.permission.findMany();
      permissions.forEach(permission => {
        expect(permission.createdBy).toBe(adminUserId);
        expect(permission.createdAt).toBeInstanceOf(Date);
        expect(permission.updatedAt).toBeInstanceOf(Date);
      });

      const roles = await prismaService.role.findMany();
      roles.forEach(role => {
        expect(role.createdBy).toBe(adminUserId);
        expect(role.createdAt).toBeInstanceOf(Date);
        expect(role.updatedAt).toBeInstanceOf(Date);
      });

      const rolePermissions = await prismaService.rolePermission.findMany();
      rolePermissions.forEach(rp => {
        expect(rp.createdBy).toBe(adminUserId);
        expect(rp.createdAt).toBeInstanceOf(Date);
      });
    });
  });

  describe('Performance and Scalability', () => {
    it('should complete initialization within reasonable time', async () => {
      const startTime = Date.now();

      await request(app.getHttpServer())
        .post('/admin/rbac-setup/initialize')
        .set('Authorization', adminToken)
        .expect(HttpStatus.OK);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 10 seconds
      expect(duration).toBeLessThan(10000);
    });

    it('should handle large datasets efficiently', async () => {
      // Pre-create some data to test performance with existing records
      const existingPermissions = [];
      for (let i = 0; i < 50; i++) {
        existingPermissions.push({
          name: `EXISTING:PERMISSION_${i}`,
          description: `Existing permission ${i}`,
          resource: 'EXISTING',
          action: `ACTION_${i}`,
          createdBy: adminUserId,
        });
      }

      await prismaService.permission.createMany({
        data: existingPermissions,
      });

      const response = await request(app.getHttpServer())
        .post('/admin/rbac-setup/initialize')
        .set('Authorization', adminToken)
        .expect(HttpStatus.OK);

      expect(response.body.message).toContain('RBAC system initialized successfully');
    });
  });
});