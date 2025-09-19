import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from '../database/prisma.module';
import { AuthModule } from '../auth/auth.module';

// Controllers
import { RoleController } from './controllers/role.controller';
import { PermissionController } from './controllers/permission.controller';
import { RBACSetupController } from './controllers/rbac-setup.controller';
import { UserRoleManagementController } from './controllers/user-role-management.controller';
import { UserController } from './controllers/user.controller';

// Services
import { RoleService } from './services/role.service';
import { PermissionService } from './services/permission.service';
import { UserRoleSetupService } from './services/user-role-setup.service';
import { UserService } from './services/user.service';

// Guards
import { RoleGuard } from './guards/role.guard';
import { RolesGuard } from './guards/roles.guard';
import { PermissionGuard } from './guards/permission.guard';
import { PermissionsGuard } from './guards/permissions.guard';

/**
 * Admin Module
 *
 * Consolidated admin functionality including:
 * - User Management
 * - Role Management
 * - Permission Management
 * - RBAC Setup
 * - User Role Management
 *
 * All admin services, controllers, guards, and DTOs are organized
 * in a clean, flat structure under the admin module.
 */
@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ConfigModule,
    EventEmitterModule,
  ],
  controllers: [
    UserController,
    RoleController,
    PermissionController,
    RBACSetupController,
    UserRoleManagementController,
  ],
  providers: [
    // Services
    UserService,
    RoleService,
    PermissionService,
    UserRoleSetupService,

    // Guards
    RoleGuard,
    RolesGuard,
    PermissionGuard,
    PermissionsGuard,
  ],
  exports: [
    // Export services so they can be used by other modules if needed
    UserService,
    RoleService,
    PermissionService,
    UserRoleSetupService,
  ],
})
export class AdminModule {}