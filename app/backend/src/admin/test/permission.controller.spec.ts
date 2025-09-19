import { Test, TestingModule } from '@nestjs/testing';
import { PermissionController } from '../controllers/permission.controller';
import { PermissionService } from '../services/permission.service';
import {
  CreatePermissionDto,
  UpdatePermissionDto,
  AssignPermissionToRoleDto,
  RevokePermissionFromRoleDto,
  BulkAssignPermissionsDto,
  CheckPermissionDto,
} from '../dto/permission.dto';
import { AuthenticatedUser } from '../../auth/interfaces/auth.interface';

// Mock PermissionService
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

describe('PermissionController', () => {
  let controller: PermissionController;
  let permissionService: typeof mockPermissionService;

  const mockUser: AuthenticatedUser = {
    id: 'admin-1',
    email: 'admin@test.com',
    firstName: 'Admin',
    lastName: 'User',
    isActive: true,
    isVerified: true,
    roles: ['ADMIN'],
    permissions: ['CREATE_PERMISSION', 'VIEW_PERMISSION', 'UPDATE_PERMISSION', 'DELETE_PERMISSION'],
  };

  const mockPermission = {
    id: 'permission-1',
    name: 'VIEW_PORTFOLIO',
    description: 'View portfolio details',
    resource: 'PORTFOLIO',
    action: 'READ',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    roleCount: 2,
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
    }).compile();

    controller = module.get<PermissionController>(PermissionController);
    permissionService = module.get(PermissionService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createPermission', () => {
    const createPermissionDto: CreatePermissionDto = {
      name: 'EDIT_PORTFOLIO',
      description: 'Edit portfolio details',
      resource: 'PORTFOLIO',
      action: 'UPDATE',
      isActive: true,
    };

    it('should create a new permission successfully', async () => {
      const expectedPermission = { ...mockPermission, ...createPermissionDto };
      mockPermissionService.createPermission.mockResolvedValue(expectedPermission);

      const result = await controller.createPermission(createPermissionDto, mockUser);

      expect(mockPermissionService.createPermission).toHaveBeenCalledWith(createPermissionDto, mockUser.id);
      expect(result).toEqual(expectedPermission);
    });

    it('should handle permission creation errors', async () => {
      mockPermissionService.createPermission.mockRejectedValue(new Error('Permission already exists'));

      await expect(controller.createPermission(createPermissionDto, mockUser))
        .rejects.toThrow('Permission already exists');
    });
  });

  describe('getAllPermissions', () => {
    it('should return all active permissions by default', async () => {
      const permissions = [mockPermission];
      mockPermissionService.getAllPermissions.mockResolvedValue(permissions);

      const result = await controller.getAllPermissions();

      expect(mockPermissionService.getAllPermissions).toHaveBeenCalledWith(false);
      expect(result).toEqual(permissions);
    });

    it('should return all permissions including inactive when requested', async () => {
      const permissions = [mockPermission, { ...mockPermission, id: 'permission-2', isActive: false }];
      mockPermissionService.getAllPermissions.mockResolvedValue(permissions);

      const result = await controller.getAllPermissions(true);

      expect(mockPermissionService.getAllPermissions).toHaveBeenCalledWith(true);
      expect(result).toEqual(permissions);
    });

    it('should handle service errors', async () => {
      mockPermissionService.getAllPermissions.mockRejectedValue(new Error('Database error'));

      await expect(controller.getAllPermissions()).rejects.toThrow('Database error');
    });
  });

  describe('getPermissionsByResource', () => {
    it('should return permissions grouped by resource', async () => {
      const groupedPermissions = {
        PORTFOLIO: [mockPermission],
        USER: [{ ...mockPermission, id: 'permission-2', resource: 'USER' }],
      };
      mockPermissionService.getPermissionsByResource.mockResolvedValue(groupedPermissions);

      const result = await controller.getPermissionsByResource();

      expect(mockPermissionService.getPermissionsByResource).toHaveBeenCalled();
      expect(result).toEqual(groupedPermissions);
    });

    it('should handle service errors', async () => {
      mockPermissionService.getPermissionsByResource.mockRejectedValue(new Error('Database error'));

      await expect(controller.getPermissionsByResource()).rejects.toThrow('Database error');
    });
  });

  describe('getPermissionById', () => {
    it('should return permission by ID', async () => {
      mockPermissionService.getPermissionById.mockResolvedValue(mockPermission);

      const result = await controller.getPermissionById('permission-1');

      expect(mockPermissionService.getPermissionById).toHaveBeenCalledWith('permission-1');
      expect(result).toEqual(mockPermission);
    });

    it('should handle not found errors', async () => {
      mockPermissionService.getPermissionById.mockRejectedValue(new Error('Permission not found'));

      await expect(controller.getPermissionById('nonexistent')).rejects.toThrow('Permission not found');
    });
  });

  describe('getPermissionByName', () => {
    it('should return permission by name', async () => {
      mockPermissionService.getPermissionByName.mockResolvedValue(mockPermission);

      const result = await controller.getPermissionByName('VIEW_PORTFOLIO');

      expect(mockPermissionService.getPermissionByName).toHaveBeenCalledWith('VIEW_PORTFOLIO');
      expect(result).toEqual(mockPermission);
    });

    it('should handle not found errors', async () => {
      mockPermissionService.getPermissionByName.mockRejectedValue(new Error('Permission not found'));

      await expect(controller.getPermissionByName('NONEXISTENT')).rejects.toThrow('Permission not found');
    });
  });

  describe('updatePermission', () => {
    const updatePermissionDto: UpdatePermissionDto = {
      description: 'Updated description',
      isActive: true,
    };

    it('should update permission successfully', async () => {
      const updatedPermission = { ...mockPermission, description: updatePermissionDto.description };
      mockPermissionService.updatePermission.mockResolvedValue(updatedPermission);

      const result = await controller.updatePermission('permission-1', updatePermissionDto, mockUser);

      expect(mockPermissionService.updatePermission).toHaveBeenCalledWith('permission-1', updatePermissionDto, mockUser.id);
      expect(result).toEqual(updatedPermission);
    });

    it('should handle update errors', async () => {
      mockPermissionService.updatePermission.mockRejectedValue(new Error('Permission not found'));

      await expect(controller.updatePermission('nonexistent', updatePermissionDto, mockUser))
        .rejects.toThrow('Permission not found');
    });
  });

  describe('deletePermission', () => {
    it('should delete permission successfully', async () => {
      mockPermissionService.deletePermission.mockResolvedValue(undefined);

      await controller.deletePermission('permission-1', mockUser);

      expect(mockPermissionService.deletePermission).toHaveBeenCalledWith('permission-1', mockUser.id);
    });

    it('should handle deletion errors', async () => {
      mockPermissionService.deletePermission.mockRejectedValue(new Error('Cannot delete permission assigned to roles'));

      await expect(controller.deletePermission('permission-1', mockUser))
        .rejects.toThrow('Cannot delete permission assigned to roles');
    });
  });

  describe('assignPermissionToRole', () => {
    const assignDto: AssignPermissionToRoleDto = {
      roleId: 'role-1',
      permissionId: 'permission-1',
      reason: 'Adding portfolio management',
    };

    it('should assign permission to role successfully', async () => {
      mockPermissionService.assignPermissionToRole.mockResolvedValue(undefined);

      const result = await controller.assignPermissionToRole(assignDto, mockUser);

      expect(mockPermissionService.assignPermissionToRole).toHaveBeenCalledWith(assignDto, mockUser.id);
      expect(result).toEqual({ message: 'Permission assigned successfully' });
    });

    it('should handle assignment errors', async () => {
      mockPermissionService.assignPermissionToRole.mockRejectedValue(new Error('Role already has permission'));

      await expect(controller.assignPermissionToRole(assignDto, mockUser))
        .rejects.toThrow('Role already has permission');
    });
  });

  describe('revokePermissionFromRole', () => {
    const revokeDto: RevokePermissionFromRoleDto = {
      roleId: 'role-1',
      permissionId: 'permission-1',
      reason: 'Removing access',
    };

    it('should revoke permission from role successfully', async () => {
      mockPermissionService.revokePermissionFromRole.mockResolvedValue(undefined);

      const result = await controller.revokePermissionFromRole(revokeDto, mockUser);

      expect(mockPermissionService.revokePermissionFromRole).toHaveBeenCalledWith(revokeDto, mockUser.id);
      expect(result).toEqual({ message: 'Permission revoked successfully' });
    });

    it('should handle revocation errors', async () => {
      mockPermissionService.revokePermissionFromRole.mockRejectedValue(new Error('Role does not have permission'));

      await expect(controller.revokePermissionFromRole(revokeDto, mockUser))
        .rejects.toThrow('Role does not have permission');
    });
  });

  describe('bulkAssignPermissions', () => {
    const bulkAssignDto: BulkAssignPermissionsDto = {
      roleId: 'role-1',
      permissionIds: ['permission-1', 'permission-2'],
      reason: 'Bulk assignment',
    };

    it('should handle bulk assignment successfully', async () => {
      const bulkResult = {
        successCount: 2,
        failures: [],
      };
      mockPermissionService.bulkAssignPermissions.mockResolvedValue(bulkResult);

      const result = await controller.bulkAssignPermissions(bulkAssignDto, mockUser);

      expect(mockPermissionService.bulkAssignPermissions).toHaveBeenCalledWith(bulkAssignDto, mockUser.id);
      expect(result).toEqual(bulkResult);
    });

    it('should handle bulk assignment with failures', async () => {
      const bulkResult = {
        successCount: 1,
        failures: [
          { permissionId: 'permission-2', error: 'Permission already assigned' },
        ],
      };
      mockPermissionService.bulkAssignPermissions.mockResolvedValue(bulkResult);

      const result = await controller.bulkAssignPermissions(bulkAssignDto, mockUser);

      expect(result.successCount).toBe(1);
      expect(result.failures).toHaveLength(1);
    });
  });

  describe('getRolePermissions', () => {
    it('should return role permissions', async () => {
      const mockRolePermissions = {
        id: 'role-1',
        name: 'ADMIN',
        description: 'Administrator role',
        isActive: true,
        permissions: [mockPermission],
      };
      mockPermissionService.getRolePermissions.mockResolvedValue(mockRolePermissions);

      const result = await controller.getRolePermissions('role-1');

      expect(mockPermissionService.getRolePermissions).toHaveBeenCalledWith('role-1');
      expect(result).toEqual(mockRolePermissions);
    });

    it('should handle role not found', async () => {
      mockPermissionService.getRolePermissions.mockRejectedValue(new Error('Role not found'));

      await expect(controller.getRolePermissions('nonexistent')).rejects.toThrow('Role not found');
    });
  });

  describe('getUserPermissions', () => {
    it('should return user permissions', async () => {
      const mockUserPermissions = {
        userId: 'user-1',
        permissions: [mockPermission],
        roles: ['USER'],
        permissionsByResource: {
          PORTFOLIO: ['VIEW_PORTFOLIO'],
        },
      };
      mockPermissionService.getUserPermissions.mockResolvedValue(mockUserPermissions);

      const result = await controller.getUserPermissions('user-1');

      expect(mockPermissionService.getUserPermissions).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockUserPermissions);
    });

    it('should handle user not found', async () => {
      mockPermissionService.getUserPermissions.mockRejectedValue(new Error('User not found'));

      await expect(controller.getUserPermissions('nonexistent')).rejects.toThrow('User not found');
    });
  });

  describe('getCurrentUserPermissions', () => {
    it('should return current user permissions', async () => {
      const mockCurrentUserPermissions = {
        userId: mockUser.id,
        permissions: [mockPermission],
        roles: ['ADMIN'],
        permissionsByResource: {
          PORTFOLIO: ['VIEW_PORTFOLIO'],
        },
      };
      mockPermissionService.getUserPermissions.mockResolvedValue(mockCurrentUserPermissions);

      const result = await controller.getCurrentUserPermissions(mockUser);

      expect(mockPermissionService.getUserPermissions).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockCurrentUserPermissions);
    });
  });

  describe('checkUserPermission', () => {
    const checkDto: CheckPermissionDto = {
      permission: 'VIEW_PORTFOLIO' as any,
      resource: 'PORTFOLIO' as any,
    };

    it('should return permission check result', async () => {
      const checkResult = {
        hasPermission: true,
        permission: 'VIEW_PORTFOLIO',
        resource: 'PORTFOLIO',
        grantedByRoles: ['ADMIN'],
      };
      mockPermissionService.checkUserPermission.mockResolvedValue(checkResult);

      const result = await controller.checkUserPermission('user-1', checkDto);

      expect(mockPermissionService.checkUserPermission).toHaveBeenCalledWith('user-1', checkDto);
      expect(result).toEqual(checkResult);
    });

    it('should handle user not found', async () => {
      mockPermissionService.checkUserPermission.mockRejectedValue(new Error('User not found'));

      await expect(controller.checkUserPermission('nonexistent', checkDto))
        .rejects.toThrow('User not found');
    });
  });

  describe('checkCurrentUserPermission', () => {
    const checkDto: CheckPermissionDto = {
      permission: 'VIEW_PORTFOLIO' as any,
      resource: 'PORTFOLIO' as any,
    };

    it('should return current user permission check result', async () => {
      const checkResult = {
        hasPermission: true,
        permission: 'VIEW_PORTFOLIO',
        resource: 'PORTFOLIO',
        grantedByRoles: ['ADMIN'],
      };
      mockPermissionService.checkUserPermission.mockResolvedValue(checkResult);

      const result = await controller.checkCurrentUserPermission(mockUser, checkDto);

      expect(mockPermissionService.checkUserPermission).toHaveBeenCalledWith(mockUser.id, checkDto);
      expect(result).toEqual(checkResult);
    });
  });

  describe('getPermissionsForResource', () => {
    it('should return permissions for specific resource', async () => {
      const resourcePermissions = [
        mockPermission,
        { ...mockPermission, id: 'permission-2', name: 'CREATE_PORTFOLIO', action: 'CREATE' },
      ];
      mockPermissionService.getPermissionsForResource.mockResolvedValue(resourcePermissions);

      const result = await controller.getPermissionsForResource('PORTFOLIO');

      expect(mockPermissionService.getPermissionsForResource).toHaveBeenCalledWith('PORTFOLIO');
      expect(result).toEqual(resourcePermissions);
    });

    it('should handle service errors', async () => {
      mockPermissionService.getPermissionsForResource.mockRejectedValue(new Error('Resource not found'));

      await expect(controller.getPermissionsForResource('NONEXISTENT'))
        .rejects.toThrow('Resource not found');
    });
  });
});