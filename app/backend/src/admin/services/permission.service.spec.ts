import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PermissionService } from './permission.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { createMockPrismaService } from '../../../test/mocks';
import {
  createMockPermission,
  createMockPermissionList,
  createMockRolePermission,
} from '../../../test/factories';
import { createMockRole, createMockUser } from '../../../test/factories';

describe('PermissionService', () => {
  let service: PermissionService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionService,
        {
          provide: PrismaService,
          useValue: createMockPrismaService(),
        },
      ],
    }).compile();

    service = module.get<PermissionService>(PermissionService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPermission', () => {
    const createPermissionDto = {
      name: 'users.read',
      description: 'Read users permission',
      resource: 'users',
      action: 'read',
      isActive: true,
    };

    it('should create a new permission successfully', async () => {
      // Arrange
      prisma.permission.findUnique.mockResolvedValue(null);
      const mockPermission = {
        ...createMockPermission(createPermissionDto),
        _count: { rolePermissions: 0 },
      };
      prisma.permission.create.mockResolvedValue(mockPermission as any);

      // Act
      const result = await service.createPermission(createPermissionDto, 'admin-1');

      // Assert
      expect(result.name).toBe(createPermissionDto.name);
      expect(result.resource).toBe(createPermissionDto.resource);
      expect(result.action).toBe(createPermissionDto.action);
      expect(prisma.permission.findUnique).toHaveBeenCalledWith({
        where: { name: createPermissionDto.name },
      });
      expect(prisma.permission.create).toHaveBeenCalled();
    });

    it('should throw ConflictException when permission name already exists', async () => {
      // Arrange
      const existingPermission = createMockPermission({ name: createPermissionDto.name });
      prisma.permission.findUnique.mockResolvedValue(existingPermission);

      // Act & Assert
      await expect(
        service.createPermission(createPermissionDto, 'admin-1'),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.createPermission(createPermissionDto, 'admin-1'),
      ).rejects.toThrow(`Permission with name "${createPermissionDto.name}" already exists`);
      expect(prisma.permission.create).not.toHaveBeenCalled();
    });
  });

  describe('getAllPermissions', () => {
    it('should return only active permissions by default', async () => {
      // Arrange
      const mockPermissions = createMockPermissionList(3).map(p => ({
        ...p,
        _count: { rolePermissions: 2 },
      }));
      prisma.permission.findMany.mockResolvedValue(mockPermissions as any);

      // Act
      const result = await service.getAllPermissions();

      // Assert
      expect(result).toHaveLength(3);
      expect(prisma.permission.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        include: expect.any(Object),
        orderBy: [{ resource: 'asc' }, { name: 'asc' }],
      });
    });

    it('should return all permissions including inactive when flag is true', async () => {
      // Arrange
      const mockPermissions = [
        { ...createMockPermission({ isActive: true }), _count: { rolePermissions: 1 } },
        { ...createMockPermission({ isActive: false }), _count: { rolePermissions: 0 } },
      ];
      prisma.permission.findMany.mockResolvedValue(mockPermissions as any);

      // Act
      const result = await service.getAllPermissions(true);

      // Assert
      expect(result).toHaveLength(2);
      expect(prisma.permission.findMany).toHaveBeenCalledWith({
        where: {},
        include: expect.any(Object),
        orderBy: [{ resource: 'asc' }, { name: 'asc' }],
      });
    });
  });

  describe('getPermissionsByResource', () => {
    it('should return permissions grouped by resource', async () => {
      // Arrange
      const mockPermissions = [
        { ...createMockPermission({ resource: 'users', name: 'users.read' }), _count: { rolePermissions: 1 } },
        { ...createMockPermission({ resource: 'users', name: 'users.create' }), _count: { rolePermissions: 1 } },
        { ...createMockPermission({ resource: 'roles', name: 'roles.read' }), _count: { rolePermissions: 1 } },
      ];
      prisma.permission.findMany.mockResolvedValue(mockPermissions as any);

      // Act
      const result = await service.getPermissionsByResource();

      // Assert
      expect(result.users).toHaveLength(2);
      expect(result.roles).toHaveLength(1);
    });
  });

  describe('getPermissionById', () => {
    it('should return permission when found', async () => {
      // Arrange
      const mockPermission = {
        ...createMockPermission(),
        _count: { rolePermissions: 2 },
      };
      prisma.permission.findUnique.mockResolvedValue(mockPermission as any);

      // Act
      const result = await service.getPermissionById('perm-1');

      // Assert
      expect(result.id).toBe(mockPermission.id);
      expect(result.name).toBe(mockPermission.name);
      expect(prisma.permission.findUnique).toHaveBeenCalledWith({
        where: { id: 'perm-1' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when permission not found', async () => {
      // Arrange
      prisma.permission.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getPermissionById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getPermissionById('non-existent')).rejects.toThrow(
        'Permission with ID "non-existent" not found',
      );
    });
  });

  describe('getPermissionByName', () => {
    it('should return permission when found', async () => {
      // Arrange
      const mockPermission = {
        ...createMockPermission({ name: 'users.read' }),
        _count: { rolePermissions: 2 },
      };
      prisma.permission.findUnique.mockResolvedValue(mockPermission as any);

      // Act
      const result = await service.getPermissionByName('users.read');

      // Assert
      expect(result.name).toBe('users.read');
      expect(prisma.permission.findUnique).toHaveBeenCalledWith({
        where: { name: 'users.read' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when permission not found', async () => {
      // Arrange
      prisma.permission.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getPermissionByName('non.existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getPermissionByName('non.existent')).rejects.toThrow(
        'Permission with name "non.existent" not found',
      );
    });
  });

  describe('updatePermission', () => {
    const updatePermissionDto = {
      description: 'Updated description',
      isActive: true,
    };

    it('should update permission successfully', async () => {
      // Arrange
      const existingPermission = createMockPermission();
      prisma.permission.findUnique.mockResolvedValue(existingPermission);
      const updatedPermission = {
        ...existingPermission,
        ...updatePermissionDto,
        _count: { rolePermissions: 2 },
      };
      prisma.permission.update.mockResolvedValue(updatedPermission as any);

      // Act
      const result = await service.updatePermission('perm-1', updatePermissionDto, 'admin-1');

      // Assert
      expect(result.description).toBe(updatePermissionDto.description);
      expect(prisma.permission.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when permission does not exist', async () => {
      // Arrange
      prisma.permission.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.updatePermission('non-existent', updatePermissionDto, 'admin-1'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.updatePermission('non-existent', updatePermissionDto, 'admin-1'),
      ).rejects.toThrow('Permission with ID "non-existent" not found');
    });
  });

  describe('deletePermission', () => {
    it('should soft delete permission successfully', async () => {
      // Arrange
      const mockPermission = {
        ...createMockPermission(),
        _count: { rolePermissions: 0 },
      };
      prisma.permission.findUnique.mockResolvedValue(mockPermission as any);
      prisma.permission.update.mockResolvedValue({ ...mockPermission, isActive: false } as any);

      // Act
      await service.deletePermission('perm-1', 'admin-1');

      // Assert
      expect(prisma.permission.update).toHaveBeenCalledWith({
        where: { id: 'perm-1' },
        data: { isActive: false },
      });
    });

    it('should throw NotFoundException when permission not found', async () => {
      // Arrange
      prisma.permission.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.deletePermission('non-existent', 'admin-1')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.deletePermission('non-existent', 'admin-1')).rejects.toThrow(
        'Permission with ID "non-existent" not found',
      );
    });

    it('should throw BadRequestException when permission is assigned to roles', async () => {
      // Arrange
      const permissionWithRoles = {
        ...createMockPermission(),
        _count: { rolePermissions: 3 },
      };
      prisma.permission.findUnique.mockResolvedValue(permissionWithRoles as any);

      // Act & Assert
      await expect(service.deletePermission('perm-1', 'admin-1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.deletePermission('perm-1', 'admin-1')).rejects.toThrow(
        'Cannot delete permission that is assigned to roles',
      );
    });
  });

  describe('assignPermissionToRole', () => {
    const assignDto = {
      roleId: 'role-1',
      permissionId: 'perm-1',
    };
    const assignedBy = 'admin-1';

    it('should assign permission to role successfully', async () => {
      // Arrange
      const mockRole = createMockRole({ isActive: true });
      const mockPermission = createMockPermission({ isActive: true });
      prisma.role.findUnique.mockResolvedValue(mockRole);
      prisma.permission.findUnique.mockResolvedValue(mockPermission);
      prisma.rolePermission.findUnique.mockResolvedValue(null);
      prisma.rolePermission.create.mockResolvedValue({} as any);
      prisma.auditLog.create.mockResolvedValue({} as any);

      // Act
      await service.assignPermissionToRole(assignDto, assignedBy);

      // Assert
      expect(prisma.role.findUnique).toHaveBeenCalledWith({
        where: { id: assignDto.roleId },
      });
      expect(prisma.permission.findUnique).toHaveBeenCalledWith({
        where: { id: assignDto.permissionId },
      });
      expect(prisma.rolePermission.create).toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException when role not found', async () => {
      // Arrange
      prisma.role.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.assignPermissionToRole(assignDto, assignedBy)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.assignPermissionToRole(assignDto, assignedBy)).rejects.toThrow(
        `Active role with ID "${assignDto.roleId}" not found`,
      );
    });

    it('should throw NotFoundException when permission not found', async () => {
      // Arrange
      const mockRole = createMockRole({ isActive: true });
      prisma.role.findUnique.mockResolvedValue(mockRole);
      prisma.permission.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.assignPermissionToRole(assignDto, assignedBy)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.assignPermissionToRole(assignDto, assignedBy)).rejects.toThrow(
        `Active permission with ID "${assignDto.permissionId}" not found`,
      );
    });

    it('should throw ConflictException when permission already assigned', async () => {
      // Arrange
      const mockRole = createMockRole({ isActive: true });
      const mockPermission = createMockPermission({ isActive: true });
      const existingAssignment = { ...createMockRolePermission(), isActive: true };
      prisma.role.findUnique.mockResolvedValue(mockRole);
      prisma.permission.findUnique.mockResolvedValue(mockPermission);
      prisma.rolePermission.findUnique.mockResolvedValue(existingAssignment as any);

      // Act & Assert
      await expect(service.assignPermissionToRole(assignDto, assignedBy)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.assignPermissionToRole(assignDto, assignedBy)).rejects.toThrow(
        'Role already has this permission',
      );
    });
  });

  describe('getUserPermissions', () => {
    it('should return user with all permissions from roles', async () => {
      // Arrange
      const mockUser = {
        ...createMockUser(),
        userRoles: [
          {
            id: 'user-role-1',
            isActive: true,
            role: {
              ...createMockRole({ name: 'ADMIN' }),
              rolePermissions: [
                {
                  id: 'rp-1',
                  permission: createMockPermission({
                    id: 'perm-1',
                    name: 'users.read',
                    resource: 'users',
                  }),
                  isActive: true,
                },
                {
                  id: 'rp-2',
                  permission: createMockPermission({
                    id: 'perm-2',
                    name: 'users.create',
                    resource: 'users',
                  }),
                  isActive: true,
                },
              ],
            },
          },
        ],
      };
      prisma.user.findUnique.mockResolvedValue(mockUser as any);

      // Act
      const result = await service.getUserPermissions('user-1');

      // Assert
      expect(result.userId).toBe(mockUser.id);
      expect(result.permissions).toHaveLength(2);
      expect(result.permissions[0].name).toBe('users.read');
      expect(result.roles).toContain('ADMIN');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getUserPermissions('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getUserPermissions('non-existent')).rejects.toThrow(
        'User with ID "non-existent" not found',
      );
    });
  });

  describe('checkUserPermission', () => {
    const checkDto = {
      permission: 'users.read',
      resource: 'users',
    };

    it('should return true when user has permission through role', async () => {
      // Arrange
      prisma.userRole.findMany.mockResolvedValue([
        {
          id: 'user-role-1',
          isActive: true,
          role: {
            id: 'role-1',
            name: 'ADMIN',
            rolePermissions: [
              {
                id: 'rp-1',
                permission: createMockPermission({ name: 'users.read' }),
                isActive: true,
              },
            ],
          },
        },
      ] as any);

      // Act
      const result = await service.checkUserPermission('user-1', checkDto);

      // Assert
      expect(result.hasPermission).toBe(true);
      expect(result.grantedByRoles).toContain('ADMIN');
      expect(result.permission).toBe('users.read');
    });

    it('should return false when user does not have permission', async () => {
      // Arrange
      prisma.userRole.findMany.mockResolvedValue([
        {
          id: 'user-role-1',
          isActive: true,
          role: {
            id: 'role-1',
            name: 'USER',
            rolePermissions: [], // No permissions
          },
        },
      ] as any);

      // Act
      const result = await service.checkUserPermission('user-1', checkDto);

      // Assert
      expect(result.hasPermission).toBe(false);
      expect(result.grantedByRoles).toHaveLength(0);
    });
  });

  describe('userHasAnyPermission', () => {
    it('should return true when user has at least one permission', async () => {
      // Arrange
      const permissions = createMockPermissionList(2);
      prisma.permission.findMany.mockResolvedValue(permissions);
      prisma.userRole.findFirst.mockResolvedValue({
        id: 'user-role-1',
      } as any);

      // Act
      const result = await service.userHasAnyPermission('user-1', ['users.read', 'users.create']);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when user has none of the permissions', async () => {
      // Arrange
      const permissions = createMockPermissionList(2);
      prisma.permission.findMany.mockResolvedValue(permissions);
      prisma.userRole.findFirst.mockResolvedValue(null);
      prisma.userPermission.findFirst.mockResolvedValue(null);

      // Act
      const result = await service.userHasAnyPermission('user-1', ['users.read', 'users.create']);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('userHasAllPermissions', () => {
    it('should return true when user has all permissions', async () => {
      // Arrange
      const permissions = createMockPermissionList(2);
      prisma.permission.findMany.mockResolvedValue(permissions);

      const mockUser = {
        ...createMockUser(),
        userRoles: [
          {
            id: 'user-role-1',
            isActive: true,
            role: {
              ...createMockRole({ name: 'ADMIN' }),
              rolePermissions: permissions.map(p => ({
                id: `rp-${p.id}`,
                permission: p,
                isActive: true,
              })),
            },
          },
        ],
      };
      prisma.user.findUnique.mockResolvedValue(mockUser as any);

      // Act
      const result = await service.userHasAllPermissions('user-1', ['users.read', 'roles.read']);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when user is missing some permissions', async () => {
      // Arrange
      const permissions = [createMockPermissionList(1)[0]]; // Only one permission
      prisma.permission.findMany.mockResolvedValue(permissions);

      const mockUser = {
        ...createMockUser(),
        userRoles: [
          {
            id: 'user-role-1',
            isActive: true,
            role: {
              ...createMockRole({ name: 'USER' }),
              rolePermissions: permissions.map(p => ({
                id: `rp-${p.id}`,
                permission: p,
                isActive: true,
              })),
            },
          },
        ],
      };
      prisma.user.findUnique.mockResolvedValue(mockUser as any);

      // Act
      const result = await service.userHasAllPermissions('user-1', ['users.read', 'users.create']);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('assignPermissionToRole - reactivate existing', () => {
    it('should reactivate inactive permission assignment', async () => {
      // Arrange
      const assignDto = {
        roleId: 'role-1',
        permissionId: 'perm-1',
      };
      const mockRole = createMockRole({ isActive: true });
      const mockPermission = createMockPermission({ isActive: true });
      const existingAssignment = { ...createMockRolePermission(), isActive: false };

      prisma.role.findUnique.mockResolvedValue(mockRole);
      prisma.permission.findUnique.mockResolvedValue(mockPermission);
      prisma.rolePermission.findUnique.mockResolvedValue(existingAssignment as any);
      prisma.rolePermission.update.mockResolvedValue({} as any);
      prisma.auditLog.create.mockResolvedValue({} as any);

      // Act
      await service.assignPermissionToRole(assignDto, 'admin-1');

      // Assert
      expect(prisma.rolePermission.update).toHaveBeenCalled();
    });
  });

  describe('revokePermissionFromRole', () => {
    const revokeDto = {
      roleId: 'role-1',
      permissionId: 'perm-1',
    };

    it('should revoke permission from role successfully', async () => {
      // Arrange
      const mockRolePermission = {
        id: 'rp-1',
        roleId: 'role-1',
        permissionId: 'perm-1',
        isActive: true,
        role: createMockRole({ name: 'ADMIN' }),
        permission: createMockPermission({ name: 'users.read' }),
      };
      prisma.rolePermission.findUnique.mockResolvedValue(mockRolePermission as any);
      prisma.rolePermission.update.mockResolvedValue({} as any);
      prisma.auditLog.create.mockResolvedValue({} as any);

      // Act
      await service.revokePermissionFromRole(revokeDto, 'admin-1');

      // Assert
      expect(prisma.rolePermission.update).toHaveBeenCalledWith({
        where: { id: mockRolePermission.id },
        data: { isActive: false },
      });
    });

    it('should throw NotFoundException when role does not have permission', async () => {
      // Arrange
      prisma.rolePermission.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.revokePermissionFromRole(revokeDto, 'admin-1')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.revokePermissionFromRole(revokeDto, 'admin-1')).rejects.toThrow(
        'Role does not have this permission',
      );
    });
  });

  describe('bulkAssignPermissions', () => {
    const bulkDto = {
      roleId: 'role-1',
      permissionIds: ['perm-1', 'perm-2', 'perm-3'],
    };

    it('should assign multiple permissions successfully', async () => {
      // Arrange
      const mockRole = createMockRole({ isActive: true });
      prisma.role.findUnique.mockResolvedValue(mockRole);

      const mockPermission = createMockPermission({ isActive: true });
      prisma.permission.findUnique.mockResolvedValue(mockPermission);
      prisma.rolePermission.findUnique.mockResolvedValue(null);
      prisma.rolePermission.create.mockResolvedValue({} as any);
      prisma.auditLog.create.mockResolvedValue({} as any);

      // Act
      const result = await service.bulkAssignPermissions(bulkDto, 'admin-1');

      // Assert
      expect(result.successCount).toBe(3);
      expect(result.failures).toHaveLength(0);
    });

    it('should throw NotFoundException when role not found', async () => {
      // Arrange
      prisma.role.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.bulkAssignPermissions(bulkDto, 'admin-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle partial failures gracefully', async () => {
      // Arrange
      const mockRole = createMockRole({ isActive: true });
      prisma.role.findUnique.mockResolvedValue(mockRole);

      const mockPermission = createMockPermission({ isActive: true });
      prisma.permission.findUnique
        .mockResolvedValueOnce(mockPermission) // First succeeds
        .mockResolvedValueOnce(null) // Second fails
        .mockResolvedValueOnce(mockPermission); // Third succeeds

      prisma.rolePermission.findUnique.mockResolvedValue(null);
      prisma.rolePermission.create.mockResolvedValue({} as any);
      prisma.auditLog.create.mockResolvedValue({} as any);

      // Act
      const result = await service.bulkAssignPermissions(bulkDto, 'admin-1');

      // Assert
      expect(result.successCount).toBe(2);
      expect(result.failures).toHaveLength(1);
      expect(result.failures[0].permissionId).toBe('perm-2');
    });
  });

  describe('getRolePermissions', () => {
    it('should return role with permissions', async () => {
      // Arrange
      const mockRole = {
        ...createMockRole(),
        rolePermissions: [
          {
            id: 'rp-1',
            isActive: true,
            permission: createMockPermission({ name: 'users.read' }),
          },
          {
            id: 'rp-2',
            isActive: true,
            permission: createMockPermission({ name: 'users.create' }),
          },
        ],
      };
      prisma.role.findUnique.mockResolvedValue(mockRole as any);

      // Act
      const result = await service.getRolePermissions('role-1');

      // Assert
      expect(result.id).toBe(mockRole.id);
      expect(result.permissions).toHaveLength(2);
    });

    it('should throw NotFoundException when role not found', async () => {
      // Arrange
      prisma.role.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getRolePermissions('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPermissionsForResource', () => {
    it('should return permissions for specific resource', async () => {
      // Arrange
      const mockPermissions = [
        { ...createMockPermission({ resource: 'users', name: 'users.read' }), _count: { rolePermissions: 1 } },
        { ...createMockPermission({ resource: 'users', name: 'users.create' }), _count: { rolePermissions: 1 } },
      ];
      prisma.permission.findMany.mockResolvedValue(mockPermissions as any);

      // Act
      const result = await service.getPermissionsForResource('users');

      // Assert
      expect(result).toHaveLength(2);
      expect(prisma.permission.findMany).toHaveBeenCalledWith({
        where: { resource: 'users', isActive: true },
        include: expect.any(Object),
        orderBy: { name: 'asc' },
      });
    });
  });
});
