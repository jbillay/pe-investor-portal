import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreatePermissionDto,
  UpdatePermissionDto,
  AssignPermissionToRoleDto,
  RevokePermissionFromRoleDto,
  BulkAssignPermissionsDto,
  CheckPermissionDto
} from '../dto/permission.dto';

// Mock Prisma Client
const mockPrismaService = {
  permission: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    groupBy: jest.fn(),
  },
  role: {
    findUnique: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  rolePermission: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  },
  userRole: {
    findMany: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('PermissionService', () => {
  let service: PermissionService;
  let prisma: typeof mockPrismaService;

  const mockPermission = {
    id: 'permission-1',
    name: 'CREATE_USER',
    description: 'Create new users',
    resource: 'USER',
    action: 'CREATE',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { rolePermissions: 0 },
  };

  const mockRole = {
    id: 'role-1',
    name: 'ADMIN',
    description: 'Administrator role',
    isActive: true,
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    isActive: true,
    isVerified: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PermissionService>(PermissionService);
    prisma = module.get(PrismaService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPermission', () => {
    const createPermissionDto: CreatePermissionDto = {
      name: 'VIEW_PORTFOLIO',
      description: 'View portfolio details',
      resource: 'PORTFOLIO',
      action: 'READ',
      isActive: true,
    };

    it('should create a new permission successfully', async () => {
      prisma.permission.findUnique.mockResolvedValue(null);
      prisma.permission.create.mockResolvedValue({
        ...mockPermission,
        name: createPermissionDto.name,
        description: createPermissionDto.description,
        resource: createPermissionDto.resource,
        action: createPermissionDto.action,
      });

      const result = await service.createPermission(createPermissionDto, 'admin-1');

      expect(prisma.permission.findUnique).toHaveBeenCalledWith({
        where: { name: createPermissionDto.name },
      });
      expect(prisma.permission.create).toHaveBeenCalledWith({
        data: {
          name: createPermissionDto.name,
          description: createPermissionDto.description,
          resource: createPermissionDto.resource,
          action: createPermissionDto.action,
          isActive: true,
        },
        include: {
          _count: { select: { rolePermissions: true } },
        },
      });
      expect(result).toMatchObject({
        name: createPermissionDto.name,
        description: createPermissionDto.description,
        resource: createPermissionDto.resource,
        action: createPermissionDto.action,
      });
    });

    it('should throw ConflictException when permission name already exists', async () => {
      prisma.permission.findUnique.mockResolvedValue(mockPermission);

      await expect(service.createPermission(createPermissionDto, 'admin-1')).rejects.toThrow(
        new ConflictException(`Permission with name "${createPermissionDto.name}" already exists`)
      );
    });
  });

  describe('getAllPermissions', () => {
    it('should return all active permissions by default', async () => {
      const permissions = [mockPermission];
      prisma.permission.findMany.mockResolvedValue(permissions);

      const result = await service.getAllPermissions();

      expect(prisma.permission.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        include: {
          _count: { select: { rolePermissions: true } },
        },
        orderBy: [{ resource: 'asc' }, { name: 'asc' }],
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: mockPermission.id,
        name: mockPermission.name,
      });
    });

    it('should include inactive permissions when requested', async () => {
      const permissions = [mockPermission, { ...mockPermission, id: 'permission-2', isActive: false }];
      prisma.permission.findMany.mockResolvedValue(permissions);

      const result = await service.getAllPermissions(true);

      expect(prisma.permission.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          _count: { select: { rolePermissions: true } },
        },
        orderBy: [{ resource: 'asc' }, { name: 'asc' }],
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('getPermissionsByResource', () => {
    it('should return permissions grouped by resource', async () => {
      const permissions = [
        { ...mockPermission, resource: 'USER', name: 'CREATE_USER' },
        { ...mockPermission, id: 'permission-2', resource: 'USER', name: 'VIEW_USER' },
        { ...mockPermission, id: 'permission-3', resource: 'PORTFOLIO', name: 'VIEW_PORTFOLIO' },
      ];

      prisma.permission.findMany.mockResolvedValue(permissions);

      const result = await service.getPermissionsByResource();

      expect(prisma.permission.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        include: {
          _count: { select: { rolePermissions: true } },
        },
        orderBy: [{ resource: 'asc' }, { name: 'asc' }],
      });
      expect(result).toHaveProperty('USER');
      expect(result).toHaveProperty('PORTFOLIO');
      expect(result.USER).toHaveLength(2);
      expect(result.PORTFOLIO).toHaveLength(1);
    });
  });

  describe('getPermissionById', () => {
    it('should return permission by ID', async () => {
      prisma.permission.findUnique.mockResolvedValue(mockPermission);

      const result = await service.getPermissionById('permission-1');

      expect(prisma.permission.findUnique).toHaveBeenCalledWith({
        where: { id: 'permission-1' },
        include: {
          _count: { select: { rolePermissions: true } },
        },
      });
      expect(result).toMatchObject({
        id: mockPermission.id,
        name: mockPermission.name,
      });
    });

    it('should throw NotFoundException when permission not found', async () => {
      prisma.permission.findUnique.mockResolvedValue(null);

      await expect(service.getPermissionById('nonexistent')).rejects.toThrow(
        new NotFoundException('Permission with ID "nonexistent" not found')
      );
    });
  });

  describe('getPermissionByName', () => {
    it('should return permission by name', async () => {
      prisma.permission.findUnique.mockResolvedValue(mockPermission);

      const result = await service.getPermissionByName('CREATE_USER');

      expect(prisma.permission.findUnique).toHaveBeenCalledWith({
        where: { name: 'CREATE_USER' },
        include: {
          _count: { select: { rolePermissions: true } },
        },
      });
      expect(result).toMatchObject({
        id: mockPermission.id,
        name: mockPermission.name,
      });
    });

    it('should throw NotFoundException when permission not found', async () => {
      prisma.permission.findUnique.mockResolvedValue(null);

      await expect(service.getPermissionByName('NONEXISTENT')).rejects.toThrow(
        new NotFoundException('Permission with name "NONEXISTENT" not found')
      );
    });
  });

  describe('updatePermission', () => {
    const updatePermissionDto: UpdatePermissionDto = {
      description: 'Updated description',
      isActive: true,
    };

    it('should update permission successfully', async () => {
      const updatedPermission = { ...mockPermission, description: updatePermissionDto.description };

      prisma.permission.findUnique.mockResolvedValue(mockPermission);
      prisma.permission.update.mockResolvedValue(updatedPermission);

      const result = await service.updatePermission('permission-1', updatePermissionDto, 'admin-1');

      expect(prisma.permission.findUnique).toHaveBeenCalledWith({
        where: { id: 'permission-1' },
      });
      expect(prisma.permission.update).toHaveBeenCalledWith({
        where: { id: 'permission-1' },
        data: {
          description: updatePermissionDto.description,
          isActive: updatePermissionDto.isActive,
        },
        include: {
          _count: { select: { rolePermissions: true } },
        },
      });
      expect(result.description).toBe(updatePermissionDto.description);
    });

    it('should throw NotFoundException when permission not found', async () => {
      prisma.permission.findUnique.mockResolvedValue(null);

      await expect(
        service.updatePermission('nonexistent', updatePermissionDto, 'admin-1')
      ).rejects.toThrow(
        new NotFoundException('Permission with ID "nonexistent" not found')
      );
    });

    it('should check for name conflicts when updating name', async () => {
      const updateWithName = { ...updatePermissionDto, name: 'VIEW_USER' };
      const existingPermission = { ...mockPermission, name: 'VIEW_USER' };

      prisma.permission.findUnique
        .mockResolvedValueOnce(mockPermission) // First call for permission existence
        .mockResolvedValueOnce(existingPermission); // Second call for name conflict

      await expect(
        service.updatePermission('permission-1', updateWithName, 'admin-1')
      ).rejects.toThrow(
        new ConflictException('Permission with name "VIEW_USER" already exists')
      );
    });
  });

  describe('deletePermission', () => {
    it('should soft delete permission successfully', async () => {
      const permissionWithoutRoles = { ...mockPermission, _count: { rolePermissions: 0 } };

      prisma.permission.findUnique.mockResolvedValue(permissionWithoutRoles);
      prisma.permission.update.mockResolvedValue({ ...permissionWithoutRoles, isActive: false });

      await service.deletePermission('permission-1', 'admin-1');

      expect(prisma.permission.update).toHaveBeenCalledWith({
        where: { id: 'permission-1' },
        data: { isActive: false },
      });
    });

    it('should throw BadRequestException when permission is assigned to roles', async () => {
      const permissionWithRoles = { ...mockPermission, _count: { rolePermissions: 5 } };

      prisma.permission.findUnique.mockResolvedValue(permissionWithRoles);

      await expect(service.deletePermission('permission-1', 'admin-1')).rejects.toThrow(
        new BadRequestException('Cannot delete permission that is assigned to roles. Remove all assignments first.')
      );
    });
  });

  describe('assignPermissionToRole', () => {
    const assignDto: AssignPermissionToRoleDto = {
      roleId: 'role-1',
      permissionId: 'permission-1',
      reason: 'Administrative task',
    };

    it('should assign permission to role successfully', async () => {
      prisma.role.findUnique.mockResolvedValue(mockRole);
      prisma.permission.findUnique.mockResolvedValue(mockPermission);
      prisma.rolePermission.findUnique.mockResolvedValue(null);
      prisma.$transaction.mockImplementation((callback) => callback(prisma));
      prisma.rolePermission.create.mockResolvedValue({});
      prisma.auditLog.create.mockResolvedValue({});

      await service.assignPermissionToRole(assignDto, 'admin-1');

      expect(prisma.role.findUnique).toHaveBeenCalledWith({
        where: { id: assignDto.roleId },
      });
      expect(prisma.permission.findUnique).toHaveBeenCalledWith({
        where: { id: assignDto.permissionId },
      });
    });

    it('should throw NotFoundException when role not found', async () => {
      prisma.role.findUnique.mockResolvedValue(null);

      await expect(service.assignPermissionToRole(assignDto, 'admin-1')).rejects.toThrow(
        new NotFoundException(`Active role with ID "${assignDto.roleId}" not found`)
      );
    });

    it('should throw ConflictException when role already has permission', async () => {
      const existingRolePermission = {
        id: 'role-permission-1',
        roleId: assignDto.roleId,
        permissionId: assignDto.permissionId,
        isActive: true,
      };

      prisma.role.findUnique.mockResolvedValue(mockRole);
      prisma.permission.findUnique.mockResolvedValue(mockPermission);
      prisma.rolePermission.findUnique.mockResolvedValue(existingRolePermission);

      await expect(service.assignPermissionToRole(assignDto, 'admin-1')).rejects.toThrow(
        new ConflictException('Role already has this permission')
      );
    });
  });

  describe('revokePermissionFromRole', () => {
    const revokeDto: RevokePermissionFromRoleDto = {
      roleId: 'role-1',
      permissionId: 'permission-1',
      reason: 'Administrative task',
    };

    it('should revoke permission from role successfully', async () => {
      const existingRolePermission = {
        id: 'role-permission-1',
        roleId: revokeDto.roleId,
        permissionId: revokeDto.permissionId,
        isActive: true,
        role: mockRole,
        permission: mockPermission,
      };

      prisma.rolePermission.findUnique.mockResolvedValue(existingRolePermission);
      prisma.rolePermission.update.mockResolvedValue({});
      prisma.auditLog.create.mockResolvedValue({});

      await service.revokePermissionFromRole(revokeDto, 'admin-1');

      expect(prisma.rolePermission.findUnique).toHaveBeenCalledWith({
        where: {
          roleId_permissionId: {
            roleId: revokeDto.roleId,
            permissionId: revokeDto.permissionId,
          },
        },
        include: {
          role: true,
          permission: true,
        },
      });
    });

    it('should throw NotFoundException when role does not have permission', async () => {
      prisma.rolePermission.findUnique.mockResolvedValue(null);

      await expect(service.revokePermissionFromRole(revokeDto, 'admin-1')).rejects.toThrow(
        new NotFoundException('Role does not have this permission')
      );
    });
  });

  describe('bulkAssignPermissions', () => {
    const bulkAssignDto: BulkAssignPermissionsDto = {
      roleId: 'role-1',
      permissionIds: ['permission-1', 'permission-2', 'permission-3'],
      reason: 'Bulk assignment',
    };

    it('should handle bulk assignment with mixed results', async () => {
      prisma.role.findUnique.mockResolvedValue(mockRole);

      // Mock different scenarios for each permission
      prisma.permission.findUnique
        .mockResolvedValueOnce(mockPermission) // permission-1 exists
        .mockResolvedValueOnce(null) // permission-2 doesn't exist
        .mockResolvedValueOnce({ ...mockPermission, id: 'permission-3' }); // permission-3 exists

      prisma.rolePermission.findUnique
        .mockResolvedValueOnce(null) // permission-1 not assigned yet
        .mockResolvedValueOnce({ id: 'existing', isActive: true }); // permission-3 already assigned

      prisma.$transaction.mockImplementation((callback) => callback(prisma));
      prisma.rolePermission.create.mockResolvedValue({});
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.bulkAssignPermissions(bulkAssignDto, 'admin-1');

      expect(result.successCount).toBe(1);
      expect(result.failures).toHaveLength(2);
      expect(result.failures[0].permissionId).toBe('permission-2');
      expect(result.failures[1].permissionId).toBe('permission-3');
    });
  });

  describe('getRolePermissions', () => {
    it('should return role with permissions', async () => {
      const roleWithPermissions = {
        ...mockRole,
        rolePermissions: [
          {
            id: 'role-permission-1',
            isActive: true,
            permission: mockPermission,
          },
        ],
      };

      prisma.role.findUnique.mockResolvedValue(roleWithPermissions);

      const result = await service.getRolePermissions('role-1');

      expect(prisma.role.findUnique).toHaveBeenCalledWith({
        where: { id: 'role-1' },
        include: {
          rolePermissions: {
            where: { isActive: true },
            include: { permission: true },
          },
        },
      });
      expect(result).toMatchObject({
        id: mockRole.id,
        name: mockRole.name,
        description: mockRole.description,
        isActive: mockRole.isActive,
      });
      expect(result.permissions).toHaveLength(1);
      expect(result.permissions[0]).toMatchObject({
        id: mockPermission.id,
        name: mockPermission.name,
        description: mockPermission.description,
        resource: mockPermission.resource,
        action: mockPermission.action,
      });
    });

    it('should throw NotFoundException when role not found', async () => {
      prisma.role.findUnique.mockResolvedValue(null);

      await expect(service.getRolePermissions('nonexistent')).rejects.toThrow(
        new NotFoundException('Role with ID "nonexistent" not found')
      );
    });
  });

  describe('getUserPermissions', () => {
    it('should return user permissions aggregated from roles', async () => {
      const mockUserWithRoles = {
        ...mockUser,
        userRoles: [
          {
            role: {
              ...mockRole,
              rolePermissions: [
                {
                  id: 'role-permission-1',
                  isActive: true,
                  permission: mockPermission,
                },
              ],
            },
          },
        ],
      };

      prisma.user.findUnique.mockResolvedValue(mockUserWithRoles);

      const result = await service.getUserPermissions('user-1');

      expect(result.userId).toBe('user-1');
      expect(result.permissions).toHaveLength(1);
      expect(result.roles).toHaveLength(1);
      expect(result.permissions[0]).toMatchObject({
        id: mockPermission.id,
        name: mockPermission.name,
        description: mockPermission.description,
        resource: mockPermission.resource,
        action: mockPermission.action,
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserPermissions('nonexistent')).rejects.toThrow(
        new NotFoundException('User with ID "nonexistent" not found')
      );
    });
  });

  describe('checkUserPermission', () => {
    const checkDto: CheckPermissionDto = {
      permission: 'CREATE_USER' as any,
      resource: 'USER' as any,
    };

    it('should return true when user has permission', async () => {
      const userRoles = [
        {
          role: {
            name: 'ADMIN',
            rolePermissions: [
              {
                isActive: true,
                permission: { ...mockPermission, name: 'CREATE_USER', resource: 'USER' },
              },
            ],
          },
        },
      ];

      prisma.userRole.findMany.mockResolvedValue(userRoles);

      const result = await service.checkUserPermission('user-1', checkDto);

      expect(result.hasPermission).toBe(true);
      expect(result.permission).toBe('CREATE_USER');
      expect(result.resource).toBe('USER');
      expect(result.grantedByRoles).toContain('ADMIN');
    });

    it('should return false when user does not have permission', async () => {
      prisma.userRole.findMany.mockResolvedValue([]);

      const result = await service.checkUserPermission('user-1', checkDto);

      expect(result.hasPermission).toBe(false);
    });
  });

  describe('getPermissionsForResource', () => {
    it('should return permissions for specific resource', async () => {
      const userPermissions = [
        { ...mockPermission, resource: 'USER', name: 'CREATE_USER' },
        { ...mockPermission, id: 'permission-2', resource: 'USER', name: 'VIEW_USER' },
      ];

      prisma.permission.findMany.mockResolvedValue(userPermissions);

      const result = await service.getPermissionsForResource('USER');

      expect(prisma.permission.findMany).toHaveBeenCalledWith({
        where: {
          resource: 'USER',
          isActive: true,
        },
        include: {
          _count: { select: { rolePermissions: true } },
        },
        orderBy: { name: 'asc' },
      });
      expect(result).toHaveLength(2);
      expect(result.every((p: any) => p.resource === 'USER')).toBe(true);
    });
  });
});