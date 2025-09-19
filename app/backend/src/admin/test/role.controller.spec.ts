import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { RoleController } from '../controllers/role.controller';
import { RoleService } from '../services/role.service';
import { CreateRoleDto, UpdateRoleDto, AssignRoleDto, RevokeRoleDto, BulkAssignRolesDto } from '../dto/role.dto';
import { AuthenticatedUser } from '../../auth/interfaces/auth.interface';

// Mock RoleService
const mockRoleService = {
  createRole: jest.fn(),
  getAllRoles: jest.fn(),
  getRoleById: jest.fn(),
  getRoleByName: jest.fn(),
  updateRole: jest.fn(),
  deleteRole: jest.fn(),
  assignRole: jest.fn(),
  revokeRole: jest.fn(),
  bulkAssignRoles: jest.fn(),
  getUserRoles: jest.fn(),
  getUserRoleHistory: jest.fn(),
  getDefaultRole: jest.fn(),
  getRoleUsers: jest.fn(),
  userHasRole: jest.fn(),
  userHasAnyRole: jest.fn(),
};

describe('RoleController', () => {
  let controller: RoleController;
  let roleService: typeof mockRoleService;

  const mockUser: AuthenticatedUser = {
    id: 'admin-1',
    email: 'admin@test.com',
    firstName: 'Admin',
    lastName: 'User',
    isActive: true,
    isVerified: true,
    roles: ['ADMIN'],
    permissions: ['CREATE_ROLE', 'VIEW_ROLE', 'UPDATE_ROLE', 'DELETE_ROLE'],
  };

  const mockRole = {
    id: 'role-1',
    name: 'INVESTOR',
    description: 'Investor role',
    isActive: true,
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    userCount: 5,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoleController],
      providers: [
        {
          provide: RoleService,
          useValue: mockRoleService,
        },
      ],
    }).compile();

    controller = module.get<RoleController>(RoleController);
    roleService = module.get(RoleService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createRole', () => {
    const createRoleDto: CreateRoleDto = {
      name: 'MANAGER',
      description: 'Manager role',
      isActive: true,
      isDefault: false,
    };

    it('should create a new role successfully', async () => {
      const expectedRole = { ...mockRole, ...createRoleDto };
      mockRoleService.createRole.mockResolvedValue(expectedRole);

      const result = await controller.createRole(createRoleDto, mockUser);

      expect(mockRoleService.createRole).toHaveBeenCalledWith(createRoleDto, mockUser.id);
      expect(result).toEqual(expectedRole);
    });

    it('should handle role creation errors', async () => {
      mockRoleService.createRole.mockRejectedValue(new Error('Role already exists'));

      await expect(controller.createRole(createRoleDto, mockUser)).rejects.toThrow('Role already exists');
    });
  });

  describe('getAllRoles', () => {
    it('should return all active roles by default', async () => {
      const roles = [mockRole];
      mockRoleService.getAllRoles.mockResolvedValue(roles);

      const result = await controller.getAllRoles();

      expect(mockRoleService.getAllRoles).toHaveBeenCalledWith(false);
      expect(result).toEqual(roles);
    });

    it('should return all roles including inactive when requested', async () => {
      const roles = [mockRole, { ...mockRole, id: 'role-2', isActive: false }];
      mockRoleService.getAllRoles.mockResolvedValue(roles);

      const result = await controller.getAllRoles(true);

      expect(mockRoleService.getAllRoles).toHaveBeenCalledWith(true);
      expect(result).toEqual(roles);
    });

    it('should handle service errors', async () => {
      mockRoleService.getAllRoles.mockRejectedValue(new Error('Database error'));

      await expect(controller.getAllRoles()).rejects.toThrow('Database error');
    });
  });

  describe('getRoleById', () => {
    it('should return role by ID', async () => {
      mockRoleService.getRoleById.mockResolvedValue(mockRole);

      const result = await controller.getRoleById('role-1');

      expect(mockRoleService.getRoleById).toHaveBeenCalledWith('role-1');
      expect(result).toEqual(mockRole);
    });

    it('should handle not found errors', async () => {
      mockRoleService.getRoleById.mockRejectedValue(new Error('Role not found'));

      await expect(controller.getRoleById('nonexistent')).rejects.toThrow('Role not found');
    });
  });

  describe('getRoleByName', () => {
    it('should return role by name', async () => {
      mockRoleService.getRoleByName.mockResolvedValue(mockRole);

      const result = await controller.getRoleByName('INVESTOR');

      expect(mockRoleService.getRoleByName).toHaveBeenCalledWith('INVESTOR');
      expect(result).toEqual(mockRole);
    });

    it('should handle not found errors', async () => {
      mockRoleService.getRoleByName.mockRejectedValue(new Error('Role not found'));

      await expect(controller.getRoleByName('NONEXISTENT')).rejects.toThrow('Role not found');
    });
  });

  describe('updateRole', () => {
    const updateRoleDto: UpdateRoleDto = {
      description: 'Updated description',
      isActive: true,
    };

    it('should update role successfully', async () => {
      const updatedRole = { ...mockRole, description: updateRoleDto.description };
      mockRoleService.updateRole.mockResolvedValue(updatedRole);

      const result = await controller.updateRole('role-1', updateRoleDto, mockUser);

      expect(mockRoleService.updateRole).toHaveBeenCalledWith('role-1', updateRoleDto, mockUser.id);
      expect(result).toEqual(updatedRole);
    });

    it('should handle update errors', async () => {
      mockRoleService.updateRole.mockRejectedValue(new Error('Role not found'));

      await expect(controller.updateRole('nonexistent', updateRoleDto, mockUser)).rejects.toThrow('Role not found');
    });
  });

  describe('deleteRole', () => {
    it('should delete role successfully', async () => {
      mockRoleService.deleteRole.mockResolvedValue(undefined);

      await controller.deleteRole('role-1', mockUser);

      expect(mockRoleService.deleteRole).toHaveBeenCalledWith('role-1', mockUser.id);
    });

    it('should handle deletion errors', async () => {
      mockRoleService.deleteRole.mockRejectedValue(new Error('Cannot delete role with users'));

      await expect(controller.deleteRole('role-1', mockUser)).rejects.toThrow('Cannot delete role with users');
    });
  });

  describe('assignRole', () => {
    const assignRoleDto: AssignRoleDto = {
      userId: 'user-1',
      roleId: 'role-1',
      reason: 'Promotion',
    };

    const mockRequest = {
      headers: { 'user-agent': 'test-agent' },
      ip: '127.0.0.1',
      connection: { remoteAddress: '127.0.0.1' },
    };

    it('should assign role successfully', async () => {
      mockRoleService.assignRole.mockResolvedValue(undefined);

      const result = await controller.assignRole(assignRoleDto, mockUser, mockRequest as any);

      expect(mockRoleService.assignRole).toHaveBeenCalledWith(
        assignRoleDto,
        {
          assignedBy: mockUser.id,
          userAgent: 'test-agent',
          ipAddress: '127.0.0.1',
        }
      );
      expect(result).toEqual({ message: 'Role assigned successfully' });
    });

    it('should handle assignment errors', async () => {
      mockRoleService.assignRole.mockRejectedValue(new Error('User already has role'));

      await expect(controller.assignRole(assignRoleDto, mockUser, mockRequest as any))
        .rejects.toThrow('User already has role');
    });

    it('should handle missing user agent', async () => {
      const requestWithoutUA = {
        headers: {},
        ip: '127.0.0.1',
        connection: { remoteAddress: '127.0.0.1' },
      };

      mockRoleService.assignRole.mockResolvedValue(undefined);

      await controller.assignRole(assignRoleDto, mockUser, requestWithoutUA as any);

      expect(mockRoleService.assignRole).toHaveBeenCalledWith(
        assignRoleDto,
        {
          assignedBy: mockUser.id,
          userAgent: 'Unknown',
          ipAddress: '127.0.0.1',
        }
      );
    });
  });

  describe('revokeRole', () => {
    const revokeRoleDto: RevokeRoleDto = {
      userId: 'user-1',
      roleId: 'role-1',
      reason: 'Demotion',
    };

    const mockRequest = {
      headers: { 'user-agent': 'test-agent' },
      ip: '127.0.0.1',
      connection: { remoteAddress: '127.0.0.1' },
    };

    it('should revoke role successfully', async () => {
      mockRoleService.revokeRole.mockResolvedValue(undefined);

      const result = await controller.revokeRole(revokeRoleDto, mockUser, mockRequest as any);

      expect(mockRoleService.revokeRole).toHaveBeenCalledWith(
        revokeRoleDto,
        {
          revokedBy: mockUser.id,
          userAgent: 'test-agent',
          ipAddress: '127.0.0.1',
        }
      );
      expect(result).toEqual({ message: 'Role revoked successfully' });
    });

    it('should handle revocation errors', async () => {
      mockRoleService.revokeRole.mockRejectedValue(new Error('User does not have role'));

      await expect(controller.revokeRole(revokeRoleDto, mockUser, mockRequest as any))
        .rejects.toThrow('User does not have role');
    });
  });

  describe('bulkAssignRoles', () => {
    const bulkAssignDto: BulkAssignRolesDto = {
      userIds: ['user-1', 'user-2'],
      roleId: 'role-1',
      reason: 'Bulk assignment',
    };

    const mockRequest = {
      headers: { 'user-agent': 'test-agent' },
      ip: '127.0.0.1',
      connection: { remoteAddress: '127.0.0.1' },
    };

    it('should handle bulk assignment successfully', async () => {
      const bulkResult = {
        successCount: 2,
        failures: [],
      };
      mockRoleService.bulkAssignRoles.mockResolvedValue(bulkResult);

      const result = await controller.bulkAssignRoles(bulkAssignDto, mockUser, mockRequest as any);

      expect(mockRoleService.bulkAssignRoles).toHaveBeenCalledWith(
        bulkAssignDto,
        mockUser.id,
        'test-agent',
        '127.0.0.1'
      );
      expect(result).toEqual(bulkResult);
    });

    it('should handle bulk assignment with failures', async () => {
      const bulkResult = {
        successCount: 1,
        failures: [
          { userId: 'user-2', error: 'User already has role' },
        ],
      };
      mockRoleService.bulkAssignRoles.mockResolvedValue(bulkResult);

      const result = await controller.bulkAssignRoles(bulkAssignDto, mockUser, mockRequest as any);

      expect(result.successCount).toBe(1);
      expect(result.failures).toHaveLength(1);
    });
  });

  describe('getUserRoles', () => {
    const mockUserRoles = {
      user: {
        id: 'user-1',
        email: 'user@test.com',
        firstName: 'Test',
        lastName: 'User',
      },
      roles: ['USER'],
      permissions: ['VIEW_USER_DASHBOARD'],
    };

    it('should return user roles', async () => {
      mockRoleService.getUserRoles.mockResolvedValue(mockUserRoles);

      const result = await controller.getUserRoles('user-1');

      expect(mockRoleService.getUserRoles).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockUserRoles);
    });

    it('should handle user not found', async () => {
      mockRoleService.getUserRoles.mockRejectedValue(new Error('User not found'));

      await expect(controller.getUserRoles('nonexistent')).rejects.toThrow('User not found');
    });
  });

  describe('getCurrentUserRoles', () => {
    it('should return current user roles', async () => {
      const mockCurrentUserRoles = {
        user: mockUser,
        roles: ['ADMIN'],
        permissions: ['CREATE_ROLE', 'VIEW_ROLE'],
      };
      mockRoleService.getUserRoles.mockResolvedValue(mockCurrentUserRoles);

      const result = await controller.getCurrentUserRoles(mockUser);

      expect(mockRoleService.getUserRoles).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockCurrentUserRoles);
    });
  });

  describe('getUserRoleHistory', () => {
    it('should return user role history', async () => {
      const mockHistory = [
        {
          id: 'assignment-1',
          role: mockRole,
          assignedAt: new Date(),
          isActive: true,
        },
      ];
      mockRoleService.getUserRoleHistory.mockResolvedValue(mockHistory);

      const result = await controller.getUserRoleHistory('user-1');

      expect(mockRoleService.getUserRoleHistory).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockHistory);
    });
  });

  describe('getDefaultRole', () => {
    it('should return default role', async () => {
      const defaultRole = { ...mockRole, isDefault: true };
      mockRoleService.getDefaultRole.mockResolvedValue(defaultRole);

      const result = await controller.getDefaultRole();

      expect(mockRoleService.getDefaultRole).toHaveBeenCalled();
      expect(result).toEqual(defaultRole);
    });

    it('should handle no default role found', async () => {
      mockRoleService.getDefaultRole.mockResolvedValue(null);

      const result = await controller.getDefaultRole();

      expect(result).toBeNull();
    });
  });

  describe('getRoleUsers', () => {
    it('should return users with specific role', async () => {
      const mockRoleUsers = [
        {
          id: 'user-1',
          email: 'user1@test.com',
          firstName: 'User',
          lastName: 'One',
          assignedAt: new Date(),
        },
      ];
      mockRoleService.getRoleUsers.mockResolvedValue(mockRoleUsers);

      const result = await controller.getRoleUsers('role-1');

      expect(mockRoleService.getRoleUsers).toHaveBeenCalledWith('role-1');
      expect(result).toEqual(mockRoleUsers);
    });
  });

  describe('checkUserRole', () => {
    it('should return true when user has role', async () => {
      mockRoleService.userHasRole.mockResolvedValue(true);

      const result = await controller.checkUserRole('user-1', 'ADMIN');

      expect(mockRoleService.userHasRole).toHaveBeenCalledWith('user-1', 'ADMIN');
      expect(result).toEqual({
        hasRole: true,
        role: 'ADMIN',
        userId: 'user-1',
      });
    });

    it('should return false when user does not have role', async () => {
      mockRoleService.userHasRole.mockResolvedValue(false);

      const result = await controller.checkUserRole('user-1', 'ADMIN');

      expect(result).toEqual({
        hasRole: false,
        role: 'ADMIN',
        userId: 'user-1',
      });
    });
  });
});