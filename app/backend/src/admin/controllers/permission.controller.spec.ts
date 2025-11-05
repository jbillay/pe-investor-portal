import { Test, TestingModule } from '@nestjs/testing';
import { PermissionController } from './permission.controller';
import { PermissionService } from '../services/permission.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../guards/role.guard';
import {
  CreatePermissionDto,
  UpdatePermissionDto,
  AssignPermissionToRoleDto,
  RevokePermissionFromRoleDto,
  BulkAssignPermissionsDto,
  CheckPermissionDto,
} from '../dto/permission.dto';

describe('PermissionController', () => {
  let controller: PermissionController;
  let permissionService: jest.Mocked<PermissionService>;

  const mockPermissionService = {
    createPermission: jest.fn(),
    getAllPermissions: jest.fn(),
    getPermissionsByResource: jest.fn(),
    getPermissionById: jest.fn(),
    getPermissionByName: jest.fn(),
    updatePermission: jest.fn(),
    deletePermission: jest.fn(),
    assignPermissionToRole: jest.fn(),
    revokePermissionFromRole: jest.fn(),
    bulkAssignPermissions: jest.fn(),
    getRolePermissions: jest.fn(),
    getUserPermissions: jest.fn(),
    checkUserPermission: jest.fn(),
    getPermissionsForResource: jest.fn(),
  };

  const mockUser = {
    id: 'user-admin',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    isActive: true,
    isVerified: true,
    roles: ['SUPER_ADMIN'],
    permissions: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PermissionController],
      providers: [
        {
          provide: PermissionService,
          useValue: mockPermissionService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RoleGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<PermissionController>(PermissionController);
    permissionService = module.get(PermissionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPermission', () => {
    it('should create a new permission', async () => {
      // Arrange
      const createDto: CreatePermissionDto = {
        name: 'users:create',
        resource: 'USER',
        action: 'CREATE',
        description: 'Create users',
      };
      const mockResponse = {
        id: 'perm-123',
        name: 'users:create',
        resource: 'USER',
        action: 'CREATE',
        description: 'Create users',
        isActive: true,
      };

      permissionService.createPermission.mockResolvedValue(mockResponse as any);

      // Act
      const result = await controller.createPermission(createDto, mockUser);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(permissionService.createPermission).toHaveBeenCalledWith(createDto, 'user-admin');
    });
  });

  describe('getAllPermissions', () => {
    it('should return all active permissions by default', async () => {
      // Arrange
      const mockPermissions = [
        { id: 'perm1', name: 'users:read', isActive: true },
        { id: 'perm2', name: 'users:write', isActive: true },
      ];
      permissionService.getAllPermissions.mockResolvedValue(mockPermissions as any);

      // Act
      const result = await controller.getAllPermissions(false);

      // Assert
      expect(result).toEqual(mockPermissions);
      expect(permissionService.getAllPermissions).toHaveBeenCalledWith(false);
    });

    it('should return all permissions including inactive when requested', async () => {
      // Arrange
      const mockPermissions = [
        { id: 'perm1', name: 'users:read', isActive: true },
        { id: 'perm2', name: 'old:permission', isActive: false },
      ];
      permissionService.getAllPermissions.mockResolvedValue(mockPermissions as any);

      // Act
      const result = await controller.getAllPermissions(true);

      // Assert
      expect(result).toEqual(mockPermissions);
      expect(permissionService.getAllPermissions).toHaveBeenCalledWith(true);
    });
  });

  describe('getPermissionsByResource', () => {
    it('should return permissions grouped by resource', async () => {
      // Arrange
      const mockGrouped = {
        USER: [
          { id: 'p1', name: 'users:read' },
          { id: 'p2', name: 'users:write' },
        ],
        ROLE: [{ id: 'p3', name: 'roles:read' }],
      };
      permissionService.getPermissionsByResource.mockResolvedValue(mockGrouped as any);

      // Act
      const result = await controller.getPermissionsByResource();

      // Assert
      expect(result).toEqual(mockGrouped);
      expect(permissionService.getPermissionsByResource).toHaveBeenCalled();
    });
  });

  describe('getPermissionById', () => {
    it('should return a permission by ID', async () => {
      // Arrange
      const mockPermission = {
        id: 'perm-456',
        name: 'roles:delete',
        resource: 'ROLE',
        action: 'DELETE',
      };
      permissionService.getPermissionById.mockResolvedValue(mockPermission as any);

      // Act
      const result = await controller.getPermissionById('perm-456');

      // Assert
      expect(result).toEqual(mockPermission);
      expect(permissionService.getPermissionById).toHaveBeenCalledWith('perm-456');
    });
  });

  describe('getPermissionByName', () => {
    it('should return a permission by name', async () => {
      // Arrange
      const mockPermission = {
        id: 'perm-789',
        name: 'portfolios:read',
        resource: 'PORTFOLIO',
      };
      permissionService.getPermissionByName.mockResolvedValue(mockPermission as any);

      // Act
      const result = await controller.getPermissionByName('portfolios:read');

      // Assert
      expect(result).toEqual(mockPermission);
      expect(permissionService.getPermissionByName).toHaveBeenCalledWith('portfolios:read');
    });
  });

  describe('updatePermission', () => {
    it('should update a permission', async () => {
      // Arrange
      const updateDto: UpdatePermissionDto = {
        description: 'Updated description',
      };
      const mockResponse = {
        id: 'perm-update',
        name: 'permissions:update',
        description: 'Updated description',
      };

      permissionService.updatePermission.mockResolvedValue(mockResponse as any);

      // Act
      const result = await controller.updatePermission('perm-update', updateDto, mockUser);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(permissionService.updatePermission).toHaveBeenCalledWith(
        'perm-update',
        updateDto,
        'user-admin',
      );
    });
  });

  describe('deletePermission', () => {
    it('should delete a permission', async () => {
      // Arrange
      permissionService.deletePermission.mockResolvedValue(undefined);

      // Act
      await controller.deletePermission('perm-delete', mockUser);

      // Assert
      expect(permissionService.deletePermission).toHaveBeenCalledWith('perm-delete', 'user-admin');
    });
  });

  describe('assignPermissionToRole', () => {
    it('should assign a permission to a role', async () => {
      // Arrange
      const assignDto: AssignPermissionToRoleDto = {
        roleId: 'role-123',
        permissionId: 'perm-123',
      };

      permissionService.assignPermissionToRole.mockResolvedValue(undefined);

      // Act
      const result = await controller.assignPermissionToRole(assignDto, mockUser);

      // Assert
      expect(result).toEqual({ message: 'Permission assigned successfully' });
      expect(permissionService.assignPermissionToRole).toHaveBeenCalledWith(
        assignDto,
        'user-admin',
      );
    });
  });

  describe('revokePermissionFromRole', () => {
    it('should revoke a permission from a role', async () => {
      // Arrange
      const revokeDto: RevokePermissionFromRoleDto = {
        roleId: 'role-456',
        permissionId: 'perm-456',
      };

      permissionService.revokePermissionFromRole.mockResolvedValue(undefined);

      // Act
      const result = await controller.revokePermissionFromRole(revokeDto, mockUser);

      // Assert
      expect(result).toEqual({ message: 'Permission revoked successfully' });
      expect(permissionService.revokePermissionFromRole).toHaveBeenCalledWith(
        revokeDto,
        'user-admin',
      );
    });
  });

  describe('bulkAssignPermissions', () => {
    it('should bulk assign permissions to a role', async () => {
      // Arrange
      const bulkAssignDto: BulkAssignPermissionsDto = {
        roleId: 'role-bulk',
        permissionIds: ['perm1', 'perm2', 'perm3'],
      };
      const mockResponse = {
        successCount: 2,
        failures: [{ permissionId: 'perm3', error: 'Permission not found' }],
      };

      permissionService.bulkAssignPermissions.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.bulkAssignPermissions(bulkAssignDto, mockUser);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(permissionService.bulkAssignPermissions).toHaveBeenCalledWith(
        bulkAssignDto,
        'user-admin',
      );
    });
  });

  describe('getRolePermissions', () => {
    it('should return permissions for a specific role', async () => {
      // Arrange
      const mockRolePerms = {
        roleId: 'role-123',
        roleName: 'ADMIN',
        permissions: [
          { id: 'perm1', name: 'users:read' },
          { id: 'perm2', name: 'users:write' },
        ],
      };

      permissionService.getRolePermissions.mockResolvedValue(mockRolePerms as any);

      // Act
      const result = await controller.getRolePermissions('role-123');

      // Assert
      expect(result).toEqual(mockRolePerms);
      expect(permissionService.getRolePermissions).toHaveBeenCalledWith('role-123');
    });
  });

  describe('getUserPermissions', () => {
    it('should return permissions for a specific user', async () => {
      // Arrange
      const mockUserPerms = {
        userId: 'user-123',
        permissions: [
          { id: 'perm1', name: 'users:read' },
          { id: 'perm2', name: 'portfolios:read' },
        ],
      };

      permissionService.getUserPermissions.mockResolvedValue(mockUserPerms as any);

      // Act
      const result = await controller.getUserPermissions('user-123');

      // Assert
      expect(result).toEqual(mockUserPerms);
      expect(permissionService.getUserPermissions).toHaveBeenCalledWith('user-123');
    });
  });

  describe('getCurrentUserPermissions', () => {
    it('should return permissions for the current authenticated user', async () => {
      // Arrange
      const mockCurrentUserPerms = {
        userId: 'user-admin',
        permissions: [
          { id: 'perm1', name: 'users:create' },
          { id: 'perm2', name: 'roles:create' },
        ],
      };

      permissionService.getUserPermissions.mockResolvedValue(mockCurrentUserPerms as any);

      // Act
      const result = await controller.getCurrentUserPermissions(mockUser);

      // Assert
      expect(result).toEqual(mockCurrentUserPerms);
      expect(permissionService.getUserPermissions).toHaveBeenCalledWith('user-admin');
    });
  });

  describe('checkUserPermission', () => {
    it('should check if a user has a specific permission', async () => {
      // Arrange
      const checkDto: CheckPermissionDto = {
        permissionName: 'users:delete',
      };
      const mockCheckResult = {
        hasPermission: true,
        permissionName: 'users:delete',
        userId: 'user-check',
      };

      permissionService.checkUserPermission.mockResolvedValue(mockCheckResult as any);

      // Act
      const result = await controller.checkUserPermission('user-check', checkDto);

      // Assert
      expect(result).toEqual(mockCheckResult);
      expect(permissionService.checkUserPermission).toHaveBeenCalledWith('user-check', checkDto);
    });
  });

  describe('checkCurrentUserPermission', () => {
    it('should check if the current user has a specific permission', async () => {
      // Arrange
      const checkDto: CheckPermissionDto = {
        permissionName: 'roles:update',
      };
      const mockCheckResult = {
        hasPermission: true,
        permissionName: 'roles:update',
        userId: 'user-admin',
      };

      permissionService.checkUserPermission.mockResolvedValue(mockCheckResult as any);

      // Act
      const result = await controller.checkCurrentUserPermission(mockUser, checkDto);

      // Assert
      expect(result).toEqual(mockCheckResult);
      expect(permissionService.checkUserPermission).toHaveBeenCalledWith('user-admin', checkDto);
    });
  });

  describe('getPermissionsForResource', () => {
    it('should return permissions for a specific resource type', async () => {
      // Arrange
      const mockResourcePerms = [
        { id: 'perm1', name: 'users:read', resource: 'USER' },
        { id: 'perm2', name: 'users:write', resource: 'USER' },
        { id: 'perm3', name: 'users:delete', resource: 'USER' },
      ];

      permissionService.getPermissionsForResource.mockResolvedValue(mockResourcePerms as any);

      // Act
      const result = await controller.getPermissionsForResource('USER');

      // Assert
      expect(result).toEqual(mockResourcePerms);
      expect(permissionService.getPermissionsForResource).toHaveBeenCalledWith('USER');
    });
  });
});
