import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PermissionService } from '../services/permission.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreatePermissionDto,
  UpdatePermissionDto,
  AssignPermissionToRoleDto,
  RevokePermissionFromRoleDto,
  BulkAssignPermissionsDto,
  CheckPermissionDto,
} from '../dto/permission.dto';

describe('PermissionService - Comprehensive Tests', () => {
  let service: PermissionService;
  let prismaService: PrismaService;

  const mockPermission = {
    id: 'permission-123',
    name: 'VIEW_PORTFOLIO',
    description: 'Allows viewing portfolio data',
    resource: 'PORTFOLIO',
    action: 'READ',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    _count: { rolePermissions: 3 },
  };

  const mockRole = {
    id: 'role-123',
    name: 'INVESTOR',
    description: 'Investor role',
    isActive: true,
    isDefault: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    userRoles: [
      {
        id: 'user-role-123',
        userId: 'user-123',
        roleId: 'role-123',
        isActive: true,
        role: {
          ...mockRole,
          rolePermissions: [
            {
              id: 'role-permission-123',
              roleId: 'role-123',
              permissionId: 'permission-123',
              isActive: true,
              permission: mockPermission,
            },
          ],
        },
      },
    ],
  };

  const mockRolePermission = {
    id: 'role-permission-123',
    roleId: 'role-123',
    permissionId: 'permission-123',
    isActive: true,
    role: mockRole,
    permission: mockPermission,
  };

  const mockPrismaService = {
    permission: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    role: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    rolePermission: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    userRole: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<PermissionService>(PermissionService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('createPermission', () => {
    const createPermissionDto: CreatePermissionDto = {
      name: 'EDIT_PORTFOLIO',
      description: 'Allows editing portfolio data',
      resource: 'PORTFOLIO',
      action: 'WRITE',
      isActive: true,
    };

    it('should create a permission successfully', async () => {
      mockPrismaService.permission.findUnique.mockResolvedValue(null);
      mockPrismaService.permission.create.mockResolvedValue({
        ...mockPermission,
        name: createPermissionDto.name,
        description: createPermissionDto.description,
        resource: createPermissionDto.resource,
        action: createPermissionDto.action,
      });

      const result = await service.createPermission(createPermissionDto, 'admin-123');

      expect(mockPrismaService.permission.findUnique).toHaveBeenCalledWith({
        where: { name: createPermissionDto.name },
      });
      expect(mockPrismaService.permission.create).toHaveBeenCalledWith({
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
      expect(result.name).toBe(createPermissionDto.name);
      expect(result.resource).toBe(createPermissionDto.resource);
    });

    it('should throw ConflictException if permission name already exists', async () => {
      mockPrismaService.permission.findUnique.mockResolvedValue(mockPermission);

      await expect(service.createPermission(createPermissionDto, 'admin-123'))
        .rejects.toThrow(ConflictException);

      expect(mockPrismaService.permission.create).not.toHaveBeenCalled();
    });

    it('should handle default values for optional fields', async () => {
      const minimalDto = { name: 'BASIC_PERMISSION' };
      mockPrismaService.permission.findUnique.mockResolvedValue(null);
      mockPrismaService.permission.create.mockResolvedValue(mockPermission);

      await service.createPermission(minimalDto, 'admin-123');

      expect(mockPrismaService.permission.create).toHaveBeenCalledWith({
        data: {
          name: 'BASIC_PERMISSION',
          description: undefined,
          resource: undefined,
          action: undefined,
          isActive: true,
        },
        include: {
          _count: { select: { rolePermissions: true } },
        },
      });
    });
  });

  describe('getAllPermissions', () => {
    it('should return all active permissions by default', async () => {
      const permissions = [
        mockPermission,
        { ...mockPermission, id: 'permission-456', name: 'DELETE_PORTFOLIO' },
      ];
      mockPrismaService.permission.findMany.mockResolvedValue(permissions);

      const result = await service.getAllPermissions();

      expect(mockPrismaService.permission.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        include: {
          _count: { select: { rolePermissions: true } },
        },
        orderBy: [{ resource: 'asc' }, { name: 'asc' }],
      });
      expect(result).toHaveLength(2);
      expect(result[0].roleCount).toBe(3);
    });

    it('should include inactive permissions when requested', async () => {
      const permissions = [
        mockPermission,
        { ...mockPermission, id: 'permission-456', name: 'INACTIVE', isActive: false },
      ];
      mockPrismaService.permission.findMany.mockResolvedValue(permissions);

      await service.getAllPermissions(true);

      expect(mockPrismaService.permission.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          _count: { select: { rolePermissions: true } },
        },
        orderBy: [{ resource: 'asc' }, { name: 'asc' }],
      });
    });

    it('should return empty array when no permissions exist', async () => {
      mockPrismaService.permission.findMany.mockResolvedValue([]);

      const result = await service.getAllPermissions();

      expect(result).toEqual([]);
    });
  });

  describe('getPermissionsByResource', () => {
    it('should group permissions by resource', async () => {
      const permissions = [
        { ...mockPermission, resource: 'PORTFOLIO' },
        { ...mockPermission, id: 'permission-456', name: 'VIEW_DOCUMENTS', resource: 'DOCUMENTS' },
        { ...mockPermission, id: 'permission-789', name: 'GENERAL_PERMISSION', resource: null },
      ];

      jest.spyOn(service, 'getAllPermissions').mockResolvedValue(permissions as any);

      const result = await service.getPermissionsByResource();

      expect(result).toEqual({
        PORTFOLIO: [permissions[0]],
        DOCUMENTS: [permissions[1]],
        GENERAL: [permissions[2]],
      });
    });

    it('should handle empty permissions list', async () => {
      jest.spyOn(service, 'getAllPermissions').mockResolvedValue([]);

      const result = await service.getPermissionsByResource();

      expect(result).toEqual({});
    });
  });

  describe('getPermissionById', () => {
    it('should return permission by ID successfully', async () => {
      mockPrismaService.permission.findUnique.mockResolvedValue(mockPermission);

      const result = await service.getPermissionById('permission-123');

      expect(mockPrismaService.permission.findUnique).toHaveBeenCalledWith({
        where: { id: 'permission-123' },
        include: {
          _count: { select: { rolePermissions: true } },
        },
      });
      expect(result.id).toBe('permission-123');
      expect(result.name).toBe('VIEW_PORTFOLIO');
    });

    it('should throw NotFoundException if permission not found', async () => {
      mockPrismaService.permission.findUnique.mockResolvedValue(null);

      await expect(service.getPermissionById('non-existent'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('getPermissionByName', () => {
    it('should return permission by name successfully', async () => {
      mockPrismaService.permission.findUnique.mockResolvedValue(mockPermission);

      const result = await service.getPermissionByName('VIEW_PORTFOLIO');

      expect(mockPrismaService.permission.findUnique).toHaveBeenCalledWith({
        where: { name: 'VIEW_PORTFOLIO' },
        include: {
          _count: { select: { rolePermissions: true } },
        },
      });
      expect(result.name).toBe('VIEW_PORTFOLIO');
    });

    it('should throw NotFoundException if permission not found', async () => {
      mockPrismaService.permission.findUnique.mockResolvedValue(null);

      await expect(service.getPermissionByName('NON_EXISTENT'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('updatePermission', () => {
    const updatePermissionDto: UpdatePermissionDto = {
      description: 'Updated description',
      resource: 'UPDATED_RESOURCE',
      isActive: false,
    };

    it('should update permission successfully', async () => {
      const updatedPermission = { ...mockPermission, ...updatePermissionDto };
      mockPrismaService.permission.findUnique.mockResolvedValue(mockPermission);
      mockPrismaService.permission.update.mockResolvedValue(updatedPermission);

      const result = await service.updatePermission('permission-123', updatePermissionDto, 'admin-123');

      expect(mockPrismaService.permission.findUnique).toHaveBeenCalledWith({
        where: { id: 'permission-123' },
      });
      expect(mockPrismaService.permission.update).toHaveBeenCalledWith({
        where: { id: 'permission-123' },
        data: {
          description: 'Updated description',
          resource: 'UPDATED_RESOURCE',
          isActive: false,
        },
        include: {
          _count: { select: { rolePermissions: true } },
        },
      });
      expect(result.description).toBe('Updated description');
    });

    it('should throw NotFoundException if permission not found', async () => {
      mockPrismaService.permission.findUnique.mockResolvedValue(null);

      await expect(service.updatePermission('non-existent', updatePermissionDto, 'admin-123'))
        .rejects.toThrow(NotFoundException);
    });

    it('should handle name conflicts during update', async () => {
      const updateWithName = { ...updatePermissionDto, name: 'EXISTING_PERMISSION' };
      mockPrismaService.permission.findUnique
        .mockResolvedValueOnce(mockPermission)
        .mockResolvedValueOnce({ id: 'other-permission', name: 'EXISTING_PERMISSION' });

      await expect(service.updatePermission('permission-123', updateWithName, 'admin-123'))
        .rejects.toThrow(ConflictException);
    });

    it('should allow updating permission with same name', async () => {
      const updateWithSameName = { ...updatePermissionDto, name: 'VIEW_PORTFOLIO' };
      mockPrismaService.permission.findUnique.mockResolvedValue(mockPermission);
      mockPrismaService.permission.update.mockResolvedValue(mockPermission);

      await service.updatePermission('permission-123', updateWithSameName, 'admin-123');

      expect(mockPrismaService.permission.update).toHaveBeenCalled();
    });
  });

  describe('deletePermission', () => {
    it('should delete permission successfully (soft delete)', async () => {
      const permissionWithoutRoles = { ...mockPermission, _count: { rolePermissions: 0 } };
      mockPrismaService.permission.findUnique.mockResolvedValue(permissionWithoutRoles);
      mockPrismaService.permission.update.mockResolvedValue({ ...permissionWithoutRoles, isActive: false });

      await service.deletePermission('permission-123', 'admin-123');

      expect(mockPrismaService.permission.findUnique).toHaveBeenCalledWith({
        where: { id: 'permission-123' },
        include: { _count: { select: { rolePermissions: true } } },
      });
      expect(mockPrismaService.permission.update).toHaveBeenCalledWith({
        where: { id: 'permission-123' },
        data: { isActive: false },
      });
    });

    it('should throw NotFoundException if permission not found', async () => {
      mockPrismaService.permission.findUnique.mockResolvedValue(null);

      await expect(service.deletePermission('non-existent', 'admin-123'))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if permission is assigned to roles', async () => {
      const permissionWithRoles = { ...mockPermission, _count: { rolePermissions: 3 } };
      mockPrismaService.permission.findUnique.mockResolvedValue(permissionWithRoles);

      await expect(service.deletePermission('permission-123', 'admin-123'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('assignPermissionToRole', () => {
    const assignDto: AssignPermissionToRoleDto = {
      roleId: 'role-123',
      permissionId: 'permission-123',
    };

    it('should assign permission to role successfully', async () => {
      mockPrismaService.role.findUnique.mockResolvedValue(mockRole);
      mockPrismaService.permission.findUnique.mockResolvedValue(mockPermission);
      mockPrismaService.rolePermission.findUnique.mockResolvedValue(null);
      mockPrismaService.rolePermission.create.mockResolvedValue(mockRolePermission);
      mockPrismaService.auditLog.create.mockResolvedValue({});

      await service.assignPermissionToRole(assignDto, 'admin-123');

      expect(mockPrismaService.role.findUnique).toHaveBeenCalledWith({
        where: { id: 'role-123' },
      });
      expect(mockPrismaService.permission.findUnique).toHaveBeenCalledWith({
        where: { id: 'permission-123' },
      });
      expect(mockPrismaService.rolePermission.create).toHaveBeenCalledWith({
        data: {
          roleId: 'role-123',
          permissionId: 'permission-123',
          isActive: true,
        },
      });
      expect(mockPrismaService.auditLog.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if role not found or inactive', async () => {
      mockPrismaService.role.findUnique.mockResolvedValue(null);

      await expect(service.assignPermissionToRole(assignDto, 'admin-123'))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if permission not found or inactive', async () => {
      mockPrismaService.role.findUnique.mockResolvedValue(mockRole);
      mockPrismaService.permission.findUnique.mockResolvedValue(null);

      await expect(service.assignPermissionToRole(assignDto, 'admin-123'))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if role already has permission', async () => {
      const existingAssignment = { ...mockRolePermission, isActive: true };
      mockPrismaService.role.findUnique.mockResolvedValue(mockRole);
      mockPrismaService.permission.findUnique.mockResolvedValue(mockPermission);
      mockPrismaService.rolePermission.findUnique.mockResolvedValue(existingAssignment);

      await expect(service.assignPermissionToRole(assignDto, 'admin-123'))
        .rejects.toThrow(ConflictException);
    });

    it('should reactivate existing inactive assignment', async () => {
      const inactiveAssignment = { ...mockRolePermission, isActive: false };
      mockPrismaService.role.findUnique.mockResolvedValue(mockRole);
      mockPrismaService.permission.findUnique.mockResolvedValue(mockPermission);
      mockPrismaService.rolePermission.findUnique.mockResolvedValue(inactiveAssignment);
      mockPrismaService.rolePermission.update.mockResolvedValue({ ...inactiveAssignment, isActive: true });
      mockPrismaService.auditLog.create.mockResolvedValue({});

      await service.assignPermissionToRole(assignDto, 'admin-123');

      expect(mockPrismaService.rolePermission.update).toHaveBeenCalledWith({
        where: { id: inactiveAssignment.id },
        data: { isActive: true },
      });
    });
  });

  describe('revokePermissionFromRole', () => {
    const revokeDto: RevokePermissionFromRoleDto = {
      roleId: 'role-123',
      permissionId: 'permission-123',
    };

    it('should revoke permission from role successfully', async () => {
      mockPrismaService.rolePermission.findUnique.mockResolvedValue(mockRolePermission);
      mockPrismaService.rolePermission.update.mockResolvedValue({ ...mockRolePermission, isActive: false });
      mockPrismaService.auditLog.create.mockResolvedValue({});

      await service.revokePermissionFromRole(revokeDto, 'admin-123');

      expect(mockPrismaService.rolePermission.findUnique).toHaveBeenCalledWith({
        where: {
          roleId_permissionId: {
            roleId: 'role-123',
            permissionId: 'permission-123',
          },
        },
        include: {
          role: true,
          permission: true,
        },
      });
      expect(mockPrismaService.rolePermission.update).toHaveBeenCalledWith({
        where: { id: mockRolePermission.id },
        data: { isActive: false },
      });
      expect(mockPrismaService.auditLog.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if role does not have permission', async () => {
      mockPrismaService.rolePermission.findUnique.mockResolvedValue(null);

      await expect(service.revokePermissionFromRole(revokeDto, 'admin-123'))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if assignment is already inactive', async () => {
      const inactiveAssignment = { ...mockRolePermission, isActive: false };
      mockPrismaService.rolePermission.findUnique.mockResolvedValue(inactiveAssignment);

      await expect(service.revokePermissionFromRole(revokeDto, 'admin-123'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('bulkAssignPermissions', () => {
    const bulkAssignDto: BulkAssignPermissionsDto = {
      roleId: 'role-123',
      permissionIds: ['permission-123', 'permission-456', 'permission-789'],
    };

    it('should successfully assign permissions to role', async () => {
      mockPrismaService.role.findUnique.mockResolvedValue(mockRole);

      jest.spyOn(service, 'assignPermissionToRole').mockResolvedValue(undefined);

      const result = await service.bulkAssignPermissions(bulkAssignDto, 'admin-123');

      expect(result.successCount).toBe(3);
      expect(result.failures).toHaveLength(0);
      expect(service.assignPermissionToRole).toHaveBeenCalledTimes(3);
    });

    it('should handle partial failures in bulk assignment', async () => {
      mockPrismaService.role.findUnique.mockResolvedValue(mockRole);

      jest.spyOn(service, 'assignPermissionToRole')
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new ConflictException('Role already has permission'))
        .mockResolvedValueOnce(undefined);

      const result = await service.bulkAssignPermissions(bulkAssignDto, 'admin-123');

      expect(result.successCount).toBe(2);
      expect(result.failures).toHaveLength(1);
      expect(result.failures[0]).toEqual({
        permissionId: 'permission-456',
        error: 'Role already has permission',
      });
    });

    it('should throw NotFoundException if role not found', async () => {
      mockPrismaService.role.findUnique.mockResolvedValue(null);

      await expect(service.bulkAssignPermissions(bulkAssignDto, 'admin-123'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('getRolePermissions', () => {
    it('should return role with permissions', async () => {
      const roleWithPermissions = {
        ...mockRole,
        rolePermissions: [
          {
            permission: mockPermission,
          },
        ],
      };
      mockPrismaService.role.findUnique.mockResolvedValue(roleWithPermissions);

      const result = await service.getRolePermissions('role-123');

      expect(result.id).toBe('role-123');
      expect(result.name).toBe('INVESTOR');
      expect(result.permissions).toHaveLength(1);
      expect(result.permissions[0].name).toBe('VIEW_PORTFOLIO');
    });

    it('should throw NotFoundException if role not found', async () => {
      mockPrismaService.role.findUnique.mockResolvedValue(null);

      await expect(service.getRolePermissions('non-existent'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserPermissions', () => {
    it('should return user permissions aggregated from roles', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getUserPermissions('user-123');

      expect(result.userId).toBe('user-123');
      expect(result.permissions).toHaveLength(1);
      expect(result.roles).toEqual(['INVESTOR']);
      expect(result.permissionsByResource).toEqual({
        PORTFOLIO: ['VIEW_PORTFOLIO'],
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserPermissions('non-existent'))
        .rejects.toThrow(NotFoundException);
    });

    it('should filter out inactive permissions and roles', async () => {
      const userWithMixedPermissions = {
        ...mockUser,
        userRoles: [
          {
            role: {
              ...mockRole,
              rolePermissions: [
                {
                  isActive: true,
                  permission: { ...mockPermission, isActive: true },
                },
                {
                  isActive: false,
                  permission: { ...mockPermission, id: 'inactive-perm', name: 'INACTIVE_PERMISSION', isActive: true },
                },
                {
                  isActive: true,
                  permission: { ...mockPermission, id: 'disabled-perm', name: 'DISABLED_PERMISSION', isActive: false },
                },
              ],
            },
          },
        ],
      };
      mockPrismaService.user.findUnique.mockResolvedValue(userWithMixedPermissions);

      const result = await service.getUserPermissions('user-123');

      expect(result.permissions).toHaveLength(1);
      expect(result.permissions[0].name).toBe('VIEW_PORTFOLIO');
    });

    it('should handle permissions with null resource', async () => {
      const userWithGeneralPermissions = {
        ...mockUser,
        userRoles: [
          {
            role: {
              ...mockRole,
              rolePermissions: [
                {
                  isActive: true,
                  permission: { ...mockPermission, resource: null },
                },
              ],
            },
          },
        ],
      };
      mockPrismaService.user.findUnique.mockResolvedValue(userWithGeneralPermissions);

      const result = await service.getUserPermissions('user-123');

      expect(result.permissionsByResource).toEqual({
        GENERAL: ['VIEW_PORTFOLIO'],
      });
    });
  });

  describe('checkUserPermission', () => {
    const checkDto: CheckPermissionDto = {
      permission: 'VIEW_PORTFOLIO',
      resource: 'PORTFOLIO',
    };

    it('should return true if user has the permission', async () => {
      const userRoleWithPermission = [
        {
          role: {
            rolePermissions: [{ permission: mockPermission }],
          },
        },
      ];
      mockPrismaService.userRole.findMany.mockResolvedValue(userRoleWithPermission);

      const result = await service.checkUserPermission('user-123', checkDto);

      expect(result.hasPermission).toBe(true);
      expect(result.permission).toBe('VIEW_PORTFOLIO');
      expect(result.resource).toBe('PORTFOLIO');
      expect(result.grantedByRoles).toEqual([undefined]); // role name not included in mock
    });

    it('should return false if user does not have the permission', async () => {
      mockPrismaService.userRole.findMany.mockResolvedValue([]);

      const result = await service.checkUserPermission('user-123', checkDto);

      expect(result.hasPermission).toBe(false);
      expect(result.grantedByRoles).toEqual([]);
    });

    it('should handle permission check without resource filter', async () => {
      const checkWithoutResource = { permission: 'VIEW_PORTFOLIO' };
      mockPrismaService.userRole.findMany.mockResolvedValue([]);

      const result = await service.checkUserPermission('user-123', checkWithoutResource);

      expect(mockPrismaService.userRole.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          isActive: true,
        },
        include: {
          role: {
            include: {
              rolePermissions: {
                where: {
                  isActive: true,
                  permission: {
                    name: 'VIEW_PORTFOLIO',
                    isActive: true,
                  },
                },
                include: { permission: true },
              },
            },
          },
        },
      });
      expect(result.resource).toBeNull();
    });
  });

  describe('userHasAnyPermission', () => {
    it('should return true if user has any of the specified permissions', async () => {
      mockPrismaService.userRole.findFirst.mockResolvedValue({ id: 'user-role-123' });

      const result = await service.userHasAnyPermission('user-123', ['VIEW_PORTFOLIO', 'EDIT_PORTFOLIO']);

      expect(result).toBe(true);
      expect(mockPrismaService.userRole.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          isActive: true,
          role: {
            isActive: true,
            rolePermissions: {
              some: {
                isActive: true,
                permission: {
                  name: { in: ['VIEW_PORTFOLIO', 'EDIT_PORTFOLIO'] },
                  isActive: true,
                },
              },
            },
          },
        },
      });
    });

    it('should return false if user has none of the specified permissions', async () => {
      mockPrismaService.userRole.findFirst.mockResolvedValue(null);

      const result = await service.userHasAnyPermission('user-123', ['ADMIN_ACCESS', 'SUPER_USER']);

      expect(result).toBe(false);
    });

    it('should filter by resource when provided', async () => {
      mockPrismaService.userRole.findFirst.mockResolvedValue({ id: 'user-role-123' });

      await service.userHasAnyPermission('user-123', ['VIEW_PORTFOLIO'], 'PORTFOLIO');

      expect(mockPrismaService.userRole.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          isActive: true,
          role: {
            isActive: true,
            rolePermissions: {
              some: {
                isActive: true,
                permission: {
                  name: { in: ['VIEW_PORTFOLIO'] },
                  isActive: true,
                  resource: 'PORTFOLIO',
                },
              },
            },
          },
        },
      });
    });
  });

  describe('userHasAllPermissions', () => {
    it('should return true if user has all specified permissions', async () => {
      jest.spyOn(service, 'getUserPermissions').mockResolvedValue({
        userId: 'user-123',
        permissions: [
          { ...mockPermission, name: 'VIEW_PORTFOLIO' },
          { ...mockPermission, id: 'permission-456', name: 'EDIT_PORTFOLIO' },
        ],
        roles: ['INVESTOR'],
        permissionsByResource: {},
      } as any);

      const result = await service.userHasAllPermissions('user-123', ['VIEW_PORTFOLIO', 'EDIT_PORTFOLIO']);

      expect(result).toBe(true);
    });

    it('should return false if user is missing any specified permission', async () => {
      jest.spyOn(service, 'getUserPermissions').mockResolvedValue({
        userId: 'user-123',
        permissions: [{ ...mockPermission, name: 'VIEW_PORTFOLIO' }],
        roles: ['INVESTOR'],
        permissionsByResource: {},
      } as any);

      const result = await service.userHasAllPermissions('user-123', ['VIEW_PORTFOLIO', 'EDIT_PORTFOLIO']);

      expect(result).toBe(false);
    });

    it('should filter by resource when provided', async () => {
      jest.spyOn(service, 'getUserPermissions').mockResolvedValue({
        userId: 'user-123',
        permissions: [
          { ...mockPermission, name: 'VIEW_PORTFOLIO', resource: 'PORTFOLIO' },
          { ...mockPermission, id: 'permission-456', name: 'VIEW_DOCUMENTS', resource: 'DOCUMENTS' },
        ],
        roles: ['INVESTOR'],
        permissionsByResource: {},
      } as any);

      const result = await service.userHasAllPermissions('user-123', ['VIEW_PORTFOLIO'], 'PORTFOLIO');

      expect(result).toBe(true);
    });
  });

  describe('getPermissionsForResource', () => {
    it('should return permissions for specific resource', async () => {
      const portfolioPermissions = [
        { ...mockPermission, name: 'VIEW_PORTFOLIO', resource: 'PORTFOLIO' },
        { ...mockPermission, id: 'permission-456', name: 'EDIT_PORTFOLIO', resource: 'PORTFOLIO' },
      ];
      mockPrismaService.permission.findMany.mockResolvedValue(portfolioPermissions);

      const result = await service.getPermissionsForResource('PORTFOLIO');

      expect(mockPrismaService.permission.findMany).toHaveBeenCalledWith({
        where: {
          resource: 'PORTFOLIO',
          isActive: true,
        },
        include: {
          _count: { select: { rolePermissions: true } },
        },
        orderBy: { name: 'asc' },
      });
      expect(result).toHaveLength(2);
      expect(result.every(p => p.resource === 'PORTFOLIO')).toBe(true);
    });

    it('should return empty array if no permissions exist for resource', async () => {
      mockPrismaService.permission.findMany.mockResolvedValue([]);

      const result = await service.getPermissionsForResource('NON_EXISTENT_RESOURCE');

      expect(result).toEqual([]);
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle database connection errors gracefully', async () => {
      mockPrismaService.permission.findMany.mockRejectedValue(new Error('Database connection failed'));

      await expect(service.getAllPermissions()).rejects.toThrow('Database connection failed');
    });

    it('should handle empty permission ID arrays in bulk assignment', async () => {
      const emptyBulkDto: BulkAssignPermissionsDto = {
        roleId: 'role-123',
        permissionIds: [],
      };

      mockPrismaService.role.findUnique.mockResolvedValue(mockRole);

      const result = await service.bulkAssignPermissions(emptyBulkDto, 'admin-123');

      expect(result.successCount).toBe(0);
      expect(result.failures).toHaveLength(0);
    });

    it('should handle duplicate permissions in user permissions aggregation', async () => {
      const userWithDuplicatePermissions = {
        ...mockUser,
        userRoles: [
          {
            role: {
              ...mockRole,
              rolePermissions: [
                {
                  isActive: true,
                  permission: { ...mockPermission, id: 'permission-123', name: 'VIEW_PORTFOLIO' },
                },
              ],
            },
          },
          {
            role: {
              ...mockRole,
              id: 'role-456',
              name: 'ADMIN',
              rolePermissions: [
                {
                  isActive: true,
                  permission: { ...mockPermission, id: 'permission-123', name: 'VIEW_PORTFOLIO' },
                },
              ],
            },
          },
        ],
      };
      mockPrismaService.user.findUnique.mockResolvedValue(userWithDuplicatePermissions);

      const result = await service.getUserPermissions('user-123');

      expect(result.permissions).toHaveLength(1);
      expect(result.roles).toEqual(['INVESTOR', 'ADMIN']);
    });

    it('should handle audit log creation failure gracefully', async () => {
      const assignDto: AssignPermissionToRoleDto = {
        roleId: 'role-123',
        permissionId: 'permission-123',
      };

      mockPrismaService.role.findUnique.mockResolvedValue(mockRole);
      mockPrismaService.permission.findUnique.mockResolvedValue(mockPermission);
      mockPrismaService.rolePermission.findUnique.mockResolvedValue(null);
      mockPrismaService.rolePermission.create.mockResolvedValue(mockRolePermission);
      mockPrismaService.auditLog.create.mockRejectedValue(new Error('Audit log failed'));

      await expect(service.assignPermissionToRole(assignDto, 'admin-123'))
        .rejects.toThrow('Audit log failed');
    });
  });
});