import { Test, TestingModule } from '@nestjs/testing';
import { RoleController } from './role.controller';
import { RoleService } from '../services/role.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../guards/role.guard';
import {
  CreateRoleDto,
  UpdateRoleDto,
  AssignRoleDto,
  RevokeRoleDto,
  BulkAssignRolesDto,
} from '../dto/role.dto';
import { Request } from 'express';

describe('RoleController', () => {
  let controller: RoleController;
  let roleService: jest.Mocked<RoleService>;

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
    getRoleAssignmentHistory: jest.fn(),
    getDefaultRole: jest.fn(),
    getUsersWithRole: jest.fn(),
    userHasRole: jest.fn(),
  };

  const mockUser = {
    id: 'user-123',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    isActive: true,
    isVerified: true,
    roles: ['ADMIN'],
    permissions: [],
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
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RoleGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<RoleController>(RoleController);
    roleService = module.get(RoleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createRole', () => {
    it('should create a new role', async () => {
      // Arrange
      const createRoleDto: CreateRoleDto = {
        name: 'NEW_ROLE',
        description: 'A new role',
        permissionIds: ['perm1', 'perm2'],
      };
      const mockResponse = {
        id: 'role-123',
        name: 'NEW_ROLE',
        description: 'A new role',
        isActive: true,
        isDefault: false,
        permissions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      roleService.createRole.mockResolvedValue(mockResponse as any);

      // Act
      const result = await controller.createRole(createRoleDto, mockUser);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(roleService.createRole).toHaveBeenCalledWith(createRoleDto, 'user-123');
    });
  });

  describe('getAllRoles', () => {
    it('should return all active roles by default', async () => {
      // Arrange
      const mockRoles = [
        { id: 'role1', name: 'ADMIN', isActive: true },
        { id: 'role2', name: 'USER', isActive: true },
      ];
      roleService.getAllRoles.mockResolvedValue(mockRoles as any);

      // Act
      const result = await controller.getAllRoles(false);

      // Assert
      expect(result).toEqual(mockRoles);
      expect(roleService.getAllRoles).toHaveBeenCalledWith(false);
    });

    it('should return all roles including inactive when requested', async () => {
      // Arrange
      const mockRoles = [
        { id: 'role1', name: 'ADMIN', isActive: true },
        { id: 'role2', name: 'OLD_ROLE', isActive: false },
      ];
      roleService.getAllRoles.mockResolvedValue(mockRoles as any);

      // Act
      const result = await controller.getAllRoles(true);

      // Assert
      expect(result).toEqual(mockRoles);
      expect(roleService.getAllRoles).toHaveBeenCalledWith(true);
    });
  });

  describe('getRoleById', () => {
    it('should return a role by ID', async () => {
      // Arrange
      const mockRole = {
        id: 'role-456',
        name: 'INVESTOR',
        description: 'Investor role',
        isActive: true,
      };
      roleService.getRoleById.mockResolvedValue(mockRole as any);

      // Act
      const result = await controller.getRoleById('role-456');

      // Assert
      expect(result).toEqual(mockRole);
      expect(roleService.getRoleById).toHaveBeenCalledWith('role-456');
    });
  });

  describe('getRoleByName', () => {
    it('should return a role by name', async () => {
      // Arrange
      const mockRole = {
        id: 'role-789',
        name: 'MANAGER',
        description: 'Manager role',
        isActive: true,
      };
      roleService.getRoleByName.mockResolvedValue(mockRole as any);

      // Act
      const result = await controller.getRoleByName('MANAGER');

      // Assert
      expect(result).toEqual(mockRole);
      expect(roleService.getRoleByName).toHaveBeenCalledWith('MANAGER');
    });
  });

  describe('updateRole', () => {
    it('should update a role', async () => {
      // Arrange
      const updateRoleDto: UpdateRoleDto = {
        description: 'Updated description',
        permissionIds: ['perm3', 'perm4'],
      };
      const mockResponse = {
        id: 'role-update',
        name: 'UPDATED_ROLE',
        description: 'Updated description',
        isActive: true,
      };

      roleService.updateRole.mockResolvedValue(mockResponse as any);

      // Act
      const result = await controller.updateRole('role-update', updateRoleDto, mockUser);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(roleService.updateRole).toHaveBeenCalledWith(
        'role-update',
        updateRoleDto,
        'user-123',
      );
    });
  });

  describe('deleteRole', () => {
    it('should delete a role', async () => {
      // Arrange
      roleService.deleteRole.mockResolvedValue(undefined);

      // Act
      await controller.deleteRole('role-delete', mockUser);

      // Assert
      expect(roleService.deleteRole).toHaveBeenCalledWith('role-delete', 'user-123');
    });
  });

  describe('assignRole', () => {
    it('should assign a role to a user', async () => {
      // Arrange
      const assignRoleDto: AssignRoleDto = {
        userId: 'user-target',
        roleId: 'role-assign',
      };
      const mockRequest = {
        get: jest.fn((header: string) => {
          if (header === 'User-Agent') return 'Mozilla/5.0';
          return null;
        }),
        headers: { 'x-forwarded-for': '192.168.1.1' },
        connection: {},
        socket: {},
      } as unknown as Request;

      roleService.assignRole.mockResolvedValue(undefined);

      // Act
      const result = await controller.assignRole(assignRoleDto, mockUser, mockRequest);

      // Assert
      expect(result).toEqual({ message: 'Role assigned successfully' });
      expect(roleService.assignRole).toHaveBeenCalledWith(assignRoleDto, {
        assignedBy: 'user-123',
        userAgent: 'Mozilla/5.0',
        ipAddress: '192.168.1.1',
      });
    });
  });

  describe('revokeRole', () => {
    it('should revoke a role from a user', async () => {
      // Arrange
      const revokeRoleDto: RevokeRoleDto = {
        userId: 'user-target',
        roleId: 'role-revoke',
      };
      const mockRequest = {
        get: jest.fn((header: string) => {
          if (header === 'User-Agent') return 'Chrome/90.0';
          return null;
        }),
        headers: { 'x-forwarded-for': '10.0.0.1' },
        connection: {},
        socket: {},
      } as unknown as Request;

      roleService.revokeRole.mockResolvedValue(undefined);

      // Act
      const result = await controller.revokeRole(revokeRoleDto, mockUser, mockRequest);

      // Assert
      expect(result).toEqual({ message: 'Role revoked successfully' });
      expect(roleService.revokeRole).toHaveBeenCalledWith(revokeRoleDto, {
        assignedBy: 'user-123',
        userAgent: 'Chrome/90.0',
        ipAddress: '10.0.0.1',
      });
    });
  });

  describe('bulkAssignRoles', () => {
    it('should bulk assign roles to multiple users', async () => {
      // Arrange
      const bulkAssignDto: BulkAssignRolesDto = {
        userIds: ['user1', 'user2', 'user3'],
        roleId: 'role-bulk',
      };
      const mockRequest = {
        get: jest.fn(() => 'Safari/14.0'),
        headers: { 'x-forwarded-for': '172.16.0.1' },
        connection: {},
        socket: {},
      } as unknown as Request;

      const mockResponse = {
        successCount: 2,
        failures: [{ userId: 'user3', error: 'User not found' }],
      };

      roleService.bulkAssignRoles.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.bulkAssignRoles(bulkAssignDto, mockUser, mockRequest);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(roleService.bulkAssignRoles).toHaveBeenCalledWith(bulkAssignDto, {
        assignedBy: 'user-123',
        userAgent: 'Safari/14.0',
        ipAddress: '172.16.0.1',
      });
    });
  });

  describe('getUserRoles', () => {
    it('should return roles for a specific user', async () => {
      // Arrange
      const mockUserRoles = {
        id: 'user-roles',
        email: 'testuser@example.com',
        roles: [
          { id: 'role1', name: 'USER' },
          { id: 'role2', name: 'INVESTOR' },
        ],
      };

      roleService.getUserRoles.mockResolvedValue(mockUserRoles as any);

      // Act
      const result = await controller.getUserRoles('user-roles');

      // Assert
      expect(result).toEqual(mockUserRoles);
      expect(roleService.getUserRoles).toHaveBeenCalledWith('user-roles');
    });
  });

  describe('getCurrentUserRoles', () => {
    it('should return roles for the current authenticated user', async () => {
      // Arrange
      const mockCurrentUserRoles = {
        id: 'user-123',
        email: 'admin@example.com',
        roles: [{ id: 'role-admin', name: 'ADMIN' }],
      };

      roleService.getUserRoles.mockResolvedValue(mockCurrentUserRoles as any);

      // Act
      const result = await controller.getCurrentUserRoles(mockUser);

      // Assert
      expect(result).toEqual(mockCurrentUserRoles);
      expect(roleService.getUserRoles).toHaveBeenCalledWith('user-123');
    });
  });

  describe('getRoleAssignmentHistory', () => {
    it('should return role assignment history for a user', async () => {
      // Arrange
      const mockHistory = [
        {
          id: 'assignment1',
          roleId: 'role1',
          userId: 'user-history',
          assignedAt: new Date(),
          assignedBy: 'admin-user',
        },
        {
          id: 'assignment2',
          roleId: 'role2',
          userId: 'user-history',
          assignedAt: new Date(),
          assignedBy: 'admin-user',
        },
      ];

      roleService.getRoleAssignmentHistory.mockResolvedValue(mockHistory as any);

      // Act
      const result = await controller.getRoleAssignmentHistory('user-history');

      // Assert
      expect(result).toEqual(mockHistory);
      expect(roleService.getRoleAssignmentHistory).toHaveBeenCalledWith('user-history');
    });
  });

  describe('getDefaultRole', () => {
    it('should return the default role', async () => {
      // Arrange
      const mockDefaultRole = {
        id: 'role-default',
        name: 'USER',
        isDefault: true,
        isActive: true,
      };

      roleService.getDefaultRole.mockResolvedValue(mockDefaultRole as any);

      // Act
      const result = await controller.getDefaultRole();

      // Assert
      expect(result).toEqual(mockDefaultRole);
      expect(roleService.getDefaultRole).toHaveBeenCalled();
    });

    it('should return null when no default role is configured', async () => {
      // Arrange
      roleService.getDefaultRole.mockResolvedValue(null);

      // Act
      const result = await controller.getDefaultRole();

      // Assert
      expect(result).toBeNull();
      expect(roleService.getDefaultRole).toHaveBeenCalled();
    });
  });

  describe('getUsersWithRole', () => {
    it('should return all users with a specific role', async () => {
      // Arrange
      const mockUsers = [
        { id: 'user1', email: 'user1@example.com', roles: [{ name: 'INVESTOR' }] },
        { id: 'user2', email: 'user2@example.com', roles: [{ name: 'INVESTOR' }] },
      ];

      roleService.getUsersWithRole.mockResolvedValue(mockUsers as any);

      // Act
      const result = await controller.getUsersWithRole('role-investor');

      // Assert
      expect(result).toEqual(mockUsers);
      expect(roleService.getUsersWithRole).toHaveBeenCalledWith('role-investor');
    });
  });

  describe('checkUserRole', () => {
    it('should return true when user has the role', async () => {
      // Arrange
      roleService.userHasRole.mockResolvedValue(true);

      // Act
      const result = await controller.checkUserRole('user-check', 'ADMIN');

      // Assert
      expect(result).toEqual({
        hasRole: true,
        role: 'ADMIN',
        userId: 'user-check',
      });
      expect(roleService.userHasRole).toHaveBeenCalledWith('user-check', 'ADMIN');
    });

    it('should return false when user does not have the role', async () => {
      // Arrange
      roleService.userHasRole.mockResolvedValue(false);

      // Act
      const result = await controller.checkUserRole('user-check', 'SUPER_ADMIN');

      // Assert
      expect(result).toEqual({
        hasRole: false,
        role: 'SUPER_ADMIN',
        userId: 'user-check',
      });
      expect(roleService.userHasRole).toHaveBeenCalledWith('user-check', 'SUPER_ADMIN');
    });
  });

  describe('getClientIp', () => {
    it('should extract IP from x-forwarded-for header', async () => {
      // Arrange
      const assignRoleDto: AssignRoleDto = {
        userId: 'user-ip',
        roleId: 'role-ip',
      };
      const mockRequest = {
        get: jest.fn(() => null),
        headers: { 'x-forwarded-for': '203.0.113.1, 198.51.100.1' },
        connection: {},
        socket: {},
      } as unknown as Request;

      roleService.assignRole.mockResolvedValue(undefined);

      // Act
      await controller.assignRole(assignRoleDto, mockUser, mockRequest);

      // Assert
      expect(roleService.assignRole).toHaveBeenCalledWith(
        assignRoleDto,
        expect.objectContaining({
          ipAddress: '203.0.113.1',
        }),
      );
    });

    it('should extract IP from x-real-ip header when x-forwarded-for is absent', async () => {
      // Arrange
      const assignRoleDto: AssignRoleDto = {
        userId: 'user-ip',
        roleId: 'role-ip',
      };
      const mockRequest = {
        get: jest.fn(() => null),
        headers: { 'x-real-ip': '10.0.0.50' },
        connection: {},
        socket: {},
      } as unknown as Request;

      roleService.assignRole.mockResolvedValue(undefined);

      // Act
      await controller.assignRole(assignRoleDto, mockUser, mockRequest);

      // Assert
      expect(roleService.assignRole).toHaveBeenCalledWith(
        assignRoleDto,
        expect.objectContaining({
          ipAddress: '10.0.0.50',
        }),
      );
    });

    it('should use unknown when no IP headers are present', async () => {
      // Arrange
      const assignRoleDto: AssignRoleDto = {
        userId: 'user-ip',
        roleId: 'role-ip',
      };
      const mockRequest = {
        get: jest.fn(() => null),
        headers: {},
        connection: {},
        socket: {},
      } as unknown as Request;

      roleService.assignRole.mockResolvedValue(undefined);

      // Act
      await controller.assignRole(assignRoleDto, mockUser, mockRequest);

      // Assert
      expect(roleService.assignRole).toHaveBeenCalledWith(
        assignRoleDto,
        expect.objectContaining({
          ipAddress: 'unknown',
        }),
      );
    });
  });
});
