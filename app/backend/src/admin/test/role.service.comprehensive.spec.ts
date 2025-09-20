import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { RoleService } from '../services/role.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateRoleDto,
  UpdateRoleDto,
  AssignRoleDto,
  RevokeRoleDto,
  BulkAssignRolesDto,
} from '../dto/role.dto';
import { RoleAssignmentContext } from '../../auth/interfaces/auth.interface';

describe('RoleService - Comprehensive Tests', () => {
  let service: RoleService;
  let prismaService: PrismaService;

  const mockRole = {
    id: 'role-123',
    name: 'INVESTOR',
    description: 'Investor with access to portfolio management',
    isActive: true,
    isDefault: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    _count: { userRoles: 5 },
    rolePermissions: [
      {
        permission: { name: 'READ_PORTFOLIO' },
      },
      {
        permission: { name: 'VIEW_DOCUMENTS' },
      },
    ],
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
        role: mockRole,
      },
    ],
  };

  const mockAssignmentContext: RoleAssignmentContext = {
    assignedBy: 'admin-123',
    userAgent: 'Mozilla/5.0 Test',
    ipAddress: '192.168.1.1',
  };

  const mockPrismaService = {
    role: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    userRole: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    roleAssignment: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<RoleService>(RoleService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('createRole', () => {
    const createRoleDto: CreateRoleDto = {
      name: 'PREMIUM_INVESTOR',
      description: 'Premium investor with additional access',
      isActive: true,
      isDefault: false,
    };

    it('should create a role successfully', async () => {
      mockPrismaService.role.findUnique.mockResolvedValue(null);
      mockPrismaService.role.create.mockResolvedValue({
        ...mockRole,
        name: createRoleDto.name,
        description: createRoleDto.description,
      });

      const result = await service.createRole(createRoleDto, 'admin-123');

      expect(mockPrismaService.role.findUnique).toHaveBeenCalledWith({
        where: { name: createRoleDto.name },
      });
      expect(mockPrismaService.role.create).toHaveBeenCalledWith({
        data: {
          name: createRoleDto.name,
          description: createRoleDto.description,
          isActive: true,
          isDefault: false,
        },
        include: {
          _count: { select: { userRoles: true } },
        },
      });
      expect(result.name).toBe(createRoleDto.name);
      expect(result.description).toBe(createRoleDto.description);
    });

    it('should throw ConflictException if role name already exists', async () => {
      mockPrismaService.role.findUnique.mockResolvedValue(mockRole);

      await expect(service.createRole(createRoleDto, 'admin-123'))
        .rejects.toThrow(ConflictException);

      expect(mockPrismaService.role.create).not.toHaveBeenCalled();
    });

    it('should unset other default roles when creating a default role', async () => {
      const defaultRoleDto = { ...createRoleDto, isDefault: true };
      mockPrismaService.role.findUnique.mockResolvedValue(null);
      mockPrismaService.role.create.mockResolvedValue({
        ...mockRole,
        isDefault: true,
      });

      await service.createRole(defaultRoleDto, 'admin-123');

      expect(mockPrismaService.role.updateMany).toHaveBeenCalledWith({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    });

    it('should handle default values for optional fields', async () => {
      const minimalDto = { name: 'BASIC_ROLE' };
      mockPrismaService.role.findUnique.mockResolvedValue(null);
      mockPrismaService.role.create.mockResolvedValue(mockRole);

      await service.createRole(minimalDto, 'admin-123');

      expect(mockPrismaService.role.create).toHaveBeenCalledWith({
        data: {
          name: 'BASIC_ROLE',
          description: undefined,
          isActive: true,
          isDefault: false,
        },
        include: {
          _count: { select: { userRoles: true } },
        },
      });
    });
  });

  describe('getAllRoles', () => {
    it('should return all active roles by default', async () => {
      const roles = [mockRole, { ...mockRole, id: 'role-456', name: 'ADMIN' }];
      mockPrismaService.role.findMany.mockResolvedValue(roles);

      const result = await service.getAllRoles();

      expect(mockPrismaService.role.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        include: {
          _count: { select: { userRoles: true } },
          rolePermissions: {
            include: { permission: true },
          },
        },
        orderBy: { name: 'asc' },
      });
      expect(result).toHaveLength(2);
      expect(result[0].permissions).toEqual(['READ_PORTFOLIO', 'VIEW_DOCUMENTS']);
    });

    it('should include inactive roles when requested', async () => {
      const roles = [
        mockRole,
        { ...mockRole, id: 'role-456', name: 'INACTIVE', isActive: false },
      ];
      mockPrismaService.role.findMany.mockResolvedValue(roles);

      await service.getAllRoles(true);

      expect(mockPrismaService.role.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          _count: { select: { userRoles: true } },
          rolePermissions: {
            include: { permission: true },
          },
        },
        orderBy: { name: 'asc' },
      });
    });

    it('should return empty array when no roles exist', async () => {
      mockPrismaService.role.findMany.mockResolvedValue([]);

      const result = await service.getAllRoles();

      expect(result).toEqual([]);
    });
  });

  describe('getRoleById', () => {
    it('should return role by ID successfully', async () => {
      mockPrismaService.role.findUnique.mockResolvedValue(mockRole);

      const result = await service.getRoleById('role-123');

      expect(mockPrismaService.role.findUnique).toHaveBeenCalledWith({
        where: { id: 'role-123' },
        include: {
          _count: { select: { userRoles: true } },
          rolePermissions: {
            include: { permission: true },
          },
        },
      });
      expect(result.id).toBe('role-123');
      expect(result.permissions).toEqual(['READ_PORTFOLIO', 'VIEW_DOCUMENTS']);
    });

    it('should throw NotFoundException if role not found', async () => {
      mockPrismaService.role.findUnique.mockResolvedValue(null);

      await expect(service.getRoleById('non-existent'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('getRoleByName', () => {
    it('should return role by name successfully', async () => {
      mockPrismaService.role.findUnique.mockResolvedValue(mockRole);

      const result = await service.getRoleByName('INVESTOR');

      expect(mockPrismaService.role.findUnique).toHaveBeenCalledWith({
        where: { name: 'INVESTOR' },
        include: {
          _count: { select: { userRoles: true } },
          rolePermissions: {
            include: { permission: true },
          },
        },
      });
      expect(result.name).toBe('INVESTOR');
    });

    it('should throw NotFoundException if role not found', async () => {
      mockPrismaService.role.findUnique.mockResolvedValue(null);

      await expect(service.getRoleByName('NON_EXISTENT'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('updateRole', () => {
    const updateRoleDto: UpdateRoleDto = {
      description: 'Updated description',
      isActive: false,
    };

    it('should update role successfully', async () => {
      const updatedRole = { ...mockRole, ...updateRoleDto };
      mockPrismaService.role.findUnique.mockResolvedValue(mockRole);
      mockPrismaService.role.update.mockResolvedValue(updatedRole);

      const result = await service.updateRole('role-123', updateRoleDto, 'admin-123');

      expect(mockPrismaService.role.findUnique).toHaveBeenCalledWith({
        where: { id: 'role-123' },
      });
      expect(mockPrismaService.role.update).toHaveBeenCalledWith({
        where: { id: 'role-123' },
        data: {
          description: 'Updated description',
          isActive: false,
        },
        include: {
          _count: { select: { userRoles: true } },
          rolePermissions: {
            include: { permission: true },
          },
        },
      });
      expect(result.description).toBe('Updated description');
    });

    it('should throw NotFoundException if role not found', async () => {
      mockPrismaService.role.findUnique.mockResolvedValue(null);

      await expect(service.updateRole('non-existent', updateRoleDto, 'admin-123'))
        .rejects.toThrow(NotFoundException);
    });

    it('should handle name conflicts during update', async () => {
      const updateWithName = { ...updateRoleDto, name: 'EXISTING_ROLE' };
      mockPrismaService.role.findUnique
        .mockResolvedValueOnce(mockRole)
        .mockResolvedValueOnce({ id: 'other-role', name: 'EXISTING_ROLE' });

      await expect(service.updateRole('role-123', updateWithName, 'admin-123'))
        .rejects.toThrow(ConflictException);
    });

    it('should unset other defaults when setting role as default', async () => {
      const defaultUpdate = { ...updateRoleDto, isDefault: true };
      mockPrismaService.role.findUnique.mockResolvedValue(mockRole);
      mockPrismaService.role.update.mockResolvedValue({ ...mockRole, isDefault: true });

      await service.updateRole('role-123', defaultUpdate, 'admin-123');

      expect(mockPrismaService.role.updateMany).toHaveBeenCalledWith({
        where: { isDefault: true, NOT: { id: 'role-123' } },
        data: { isDefault: false },
      });
    });

    it('should allow updating role with same name', async () => {
      const updateWithSameName = { ...updateRoleDto, name: 'INVESTOR' };
      mockPrismaService.role.findUnique.mockResolvedValue(mockRole);
      mockPrismaService.role.update.mockResolvedValue(mockRole);

      await service.updateRole('role-123', updateWithSameName, 'admin-123');

      expect(mockPrismaService.role.update).toHaveBeenCalled();
    });
  });

  describe('deleteRole', () => {
    it('should delete role successfully (soft delete)', async () => {
      const roleWithoutUsers = { ...mockRole, _count: { userRoles: 0 } };
      mockPrismaService.role.findUnique.mockResolvedValue(roleWithoutUsers);
      mockPrismaService.role.update.mockResolvedValue({ ...roleWithoutUsers, isActive: false });

      await service.deleteRole('role-123', 'admin-123');

      expect(mockPrismaService.role.findUnique).toHaveBeenCalledWith({
        where: { id: 'role-123' },
        include: { _count: { select: { userRoles: true } } },
      });
      expect(mockPrismaService.role.update).toHaveBeenCalledWith({
        where: { id: 'role-123' },
        data: { isActive: false },
      });
    });

    it('should throw NotFoundException if role not found', async () => {
      mockPrismaService.role.findUnique.mockResolvedValue(null);

      await expect(service.deleteRole('non-existent', 'admin-123'))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if role is default', async () => {
      const defaultRole = { ...mockRole, isDefault: true, _count: { userRoles: 0 } };
      mockPrismaService.role.findUnique.mockResolvedValue(defaultRole);

      await expect(service.deleteRole('role-123', 'admin-123'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if role has assigned users', async () => {
      const roleWithUsers = { ...mockRole, _count: { userRoles: 3 } };
      mockPrismaService.role.findUnique.mockResolvedValue(roleWithUsers);

      await expect(service.deleteRole('role-123', 'admin-123'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('assignRole', () => {
    const assignRoleDto: AssignRoleDto = {
      userId: 'user-123',
      roleId: 'role-123',
      reason: 'Promotion to investor',
      expiresAt: '2024-12-31T23:59:59Z',
    };

    it('should assign role to user successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.role.findUnique.mockResolvedValue(mockRole);
      mockPrismaService.userRole.findUnique.mockResolvedValue(null);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback({
          userRole: { create: jest.fn() },
          roleAssignment: { create: jest.fn() },
          auditLog: { create: jest.fn() },
        });
      });

      await service.assignRole(assignRoleDto, mockAssignmentContext);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
      expect(mockPrismaService.role.findUnique).toHaveBeenCalledWith({
        where: { id: 'role-123' },
      });
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.assignRole(assignRoleDto, mockAssignmentContext))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if role not found or inactive', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.role.findUnique.mockResolvedValue(null);

      await expect(service.assignRole(assignRoleDto, mockAssignmentContext))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if user already has active role', async () => {
      const existingUserRole = {
        id: 'user-role-123',
        userId: 'user-123',
        roleId: 'role-123',
        isActive: true,
      };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.role.findUnique.mockResolvedValue(mockRole);
      mockPrismaService.userRole.findUnique.mockResolvedValue(existingUserRole);

      await expect(service.assignRole(assignRoleDto, mockAssignmentContext))
        .rejects.toThrow(ConflictException);
    });

    it('should reactivate existing inactive role assignment', async () => {
      const inactiveUserRole = {
        id: 'user-role-123',
        userId: 'user-123',
        roleId: 'role-123',
        isActive: false,
      };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.role.findUnique.mockResolvedValue(mockRole);
      mockPrismaService.userRole.findUnique.mockResolvedValue(inactiveUserRole);

      const mockTx = {
        userRole: { update: jest.fn() },
        roleAssignment: { create: jest.fn() },
        auditLog: { create: jest.fn() },
      };
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      await service.assignRole(assignRoleDto, mockAssignmentContext);

      expect(mockTx.userRole.update).toHaveBeenCalledWith({
        where: { id: 'user-role-123' },
        data: { isActive: true },
      });
    });
  });

  describe('revokeRole', () => {
    const revokeRoleDto: RevokeRoleDto = {
      userId: 'user-123',
      roleId: 'role-123',
      reason: 'Access no longer required',
    };

    it('should revoke role from user successfully', async () => {
      const activeUserRole = {
        id: 'user-role-123',
        userId: 'user-123',
        roleId: 'role-123',
        isActive: true,
        role: mockRole,
      };
      const activeAssignment = {
        id: 'assignment-123',
        userId: 'user-123',
        roleId: 'role-123',
        isActive: true,
        revokedAt: null,
      };

      mockPrismaService.userRole.findUnique.mockResolvedValue(activeUserRole);

      const mockTx = {
        userRole: { update: jest.fn() },
        roleAssignment: {
          findFirst: jest.fn().mockResolvedValue(activeAssignment),
          update: jest.fn(),
        },
        auditLog: { create: jest.fn() },
      };
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      await service.revokeRole(revokeRoleDto, mockAssignmentContext);

      expect(mockTx.userRole.update).toHaveBeenCalledWith({
        where: { id: 'user-role-123' },
        data: { isActive: false },
      });
      expect(mockTx.roleAssignment.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user does not have the role', async () => {
      mockPrismaService.userRole.findUnique.mockResolvedValue(null);

      await expect(service.revokeRole(revokeRoleDto, mockAssignmentContext))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if role is already inactive', async () => {
      const inactiveUserRole = {
        id: 'user-role-123',
        userId: 'user-123',
        roleId: 'role-123',
        isActive: false,
        role: mockRole,
      };
      mockPrismaService.userRole.findUnique.mockResolvedValue(inactiveUserRole);

      await expect(service.revokeRole(revokeRoleDto, mockAssignmentContext))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('bulkAssignRoles', () => {
    const bulkAssignDto: BulkAssignRolesDto = {
      userIds: ['user-123', 'user-456', 'user-789'],
      roleId: 'role-123',
      reason: 'Bulk promotion',
    };

    it('should successfully assign roles to multiple users', async () => {
      mockPrismaService.role.findUnique.mockResolvedValue(mockRole);

      // Mock successful assignment for all users
      jest.spyOn(service, 'assignRole').mockResolvedValue(undefined);

      const result = await service.bulkAssignRoles(bulkAssignDto, mockAssignmentContext);

      expect(result.successCount).toBe(3);
      expect(result.failures).toHaveLength(0);
      expect(service.assignRole).toHaveBeenCalledTimes(3);
    });

    it('should handle partial failures in bulk assignment', async () => {
      mockPrismaService.role.findUnique.mockResolvedValue(mockRole);

      jest.spyOn(service, 'assignRole')
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new ConflictException('User already has role'))
        .mockResolvedValueOnce(undefined);

      const result = await service.bulkAssignRoles(bulkAssignDto, mockAssignmentContext);

      expect(result.successCount).toBe(2);
      expect(result.failures).toHaveLength(1);
      expect(result.failures[0]).toEqual({
        userId: 'user-456',
        error: 'User already has role',
      });
    });

    it('should throw NotFoundException if role not found', async () => {
      mockPrismaService.role.findUnique.mockResolvedValue(null);

      await expect(service.bulkAssignRoles(bulkAssignDto, mockAssignmentContext))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserRoles', () => {
    it('should return user with roles and permissions', async () => {
      const userWithRoles = {
        ...mockUser,
        userRoles: [
          {
            role: {
              ...mockRole,
              rolePermissions: [
                {
                  isActive: true,
                  permission: { name: 'READ_PORTFOLIO', isActive: true },
                },
                {
                  isActive: true,
                  permission: { name: 'VIEW_DOCUMENTS', isActive: true },
                },
              ],
            },
          },
        ],
      };
      mockPrismaService.user.findUnique.mockResolvedValue(userWithRoles);

      const result = await service.getUserRoles('user-123');

      expect(result.id).toBe('user-123');
      expect(result.roles).toHaveLength(1);
      expect(result.permissions).toEqual(['READ_PORTFOLIO', 'VIEW_DOCUMENTS']);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserRoles('non-existent'))
        .rejects.toThrow(NotFoundException);
    });

    it('should filter out inactive permissions', async () => {
      const userWithMixedPermissions = {
        ...mockUser,
        userRoles: [
          {
            role: {
              ...mockRole,
              rolePermissions: [
                {
                  isActive: true,
                  permission: { name: 'READ_PORTFOLIO', isActive: true },
                },
                {
                  isActive: false,
                  permission: { name: 'INACTIVE_PERMISSION', isActive: true },
                },
                {
                  isActive: true,
                  permission: { name: 'DISABLED_PERMISSION', isActive: false },
                },
              ],
            },
          },
        ],
      };
      mockPrismaService.user.findUnique.mockResolvedValue(userWithMixedPermissions);

      const result = await service.getUserRoles('user-123');

      expect(result.permissions).toEqual(['READ_PORTFOLIO']);
    });
  });

  describe('getRoleAssignmentHistory', () => {
    it('should return role assignment history for user', async () => {
      const assignments = [
        {
          id: 'assignment-123',
          userId: 'user-123',
          roleId: 'role-123',
          role: mockRole,
          assignedBy: 'admin-123',
          reason: 'Initial assignment',
          expiresAt: null,
          revokedAt: null,
          revokedBy: null,
          revokeReason: null,
          isActive: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ];
      mockPrismaService.roleAssignment.findMany.mockResolvedValue(assignments);

      const result = await service.getRoleAssignmentHistory('user-123');

      expect(result).toHaveLength(1);
      expect(result[0].reason).toBe('Initial assignment');
      expect(result[0].role.name).toBe('INVESTOR');
    });
  });

  describe('getDefaultRole', () => {
    it('should return default role if exists', async () => {
      const defaultRole = { ...mockRole, isDefault: true };
      mockPrismaService.role.findFirst.mockResolvedValue(defaultRole);

      const result = await service.getDefaultRole();

      expect(result?.isDefault).toBe(true);
      expect(mockPrismaService.role.findFirst).toHaveBeenCalledWith({
        where: { isDefault: true, isActive: true },
        include: {
          _count: { select: { userRoles: true } },
          rolePermissions: {
            include: { permission: true },
          },
        },
      });
    });

    it('should return null if no default role exists', async () => {
      mockPrismaService.role.findFirst.mockResolvedValue(null);

      const result = await service.getDefaultRole();

      expect(result).toBeNull();
    });
  });

  describe('userHasRole', () => {
    it('should return true if user has the role', async () => {
      mockPrismaService.userRole.findFirst.mockResolvedValue({ id: 'user-role-123' });

      const result = await service.userHasRole('user-123', 'INVESTOR');

      expect(result).toBe(true);
      expect(mockPrismaService.userRole.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          isActive: true,
          role: {
            name: 'INVESTOR',
            isActive: true,
          },
        },
      });
    });

    it('should return false if user does not have the role', async () => {
      mockPrismaService.userRole.findFirst.mockResolvedValue(null);

      const result = await service.userHasRole('user-123', 'ADMIN');

      expect(result).toBe(false);
    });
  });

  describe('userHasAnyRole', () => {
    it('should return true if user has any of the specified roles', async () => {
      mockPrismaService.userRole.findFirst.mockResolvedValue({ id: 'user-role-123' });

      const result = await service.userHasAnyRole('user-123', ['ADMIN', 'INVESTOR']);

      expect(result).toBe(true);
      expect(mockPrismaService.userRole.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          isActive: true,
          role: {
            name: { in: ['ADMIN', 'INVESTOR'] },
            isActive: true,
          },
        },
      });
    });

    it('should return false if user has none of the specified roles', async () => {
      mockPrismaService.userRole.findFirst.mockResolvedValue(null);

      const result = await service.userHasAnyRole('user-123', ['ADMIN', 'MODERATOR']);

      expect(result).toBe(false);
    });
  });

  describe('getUsersWithRole', () => {
    it('should return users with the specified role', async () => {
      const userRoles = [
        {
          user: {
            ...mockUser,
            userRoles: [
              {
                role: {
                  ...mockRole,
                  rolePermissions: [
                    {
                      isActive: true,
                      permission: { name: 'READ_PORTFOLIO', isActive: true },
                    },
                  ],
                },
              },
            ],
          },
        },
      ];
      mockPrismaService.userRole.findMany.mockResolvedValue(userRoles);

      const result = await service.getUsersWithRole('role-123');

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('test@example.com');
      expect(result[0].roles).toHaveLength(1);
      expect(result[0].permissions).toEqual(['READ_PORTFOLIO']);
    });

    it('should return empty array if no users have the role', async () => {
      mockPrismaService.userRole.findMany.mockResolvedValue([]);

      const result = await service.getUsersWithRole('role-123');

      expect(result).toEqual([]);
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle database connection errors gracefully', async () => {
      mockPrismaService.role.findMany.mockRejectedValue(new Error('Database connection failed'));

      await expect(service.getAllRoles()).rejects.toThrow('Database connection failed');
    });

    it('should handle transaction failures in role assignment', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.role.findUnique.mockResolvedValue(mockRole);
      mockPrismaService.userRole.findUnique.mockResolvedValue(null);
      mockPrismaService.$transaction.mockRejectedValue(new Error('Transaction failed'));

      const assignRoleDto: AssignRoleDto = {
        userId: 'user-123',
        roleId: 'role-123',
        reason: 'Test assignment',
      };

      await expect(service.assignRole(assignRoleDto, mockAssignmentContext))
        .rejects.toThrow('Transaction failed');
    });

    it('should handle malformed date in role assignment', async () => {
      const assignRoleDto: AssignRoleDto = {
        userId: 'user-123',
        roleId: 'role-123',
        reason: 'Test assignment',
        expiresAt: 'invalid-date',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.role.findUnique.mockResolvedValue(mockRole);
      mockPrismaService.userRole.findUnique.mockResolvedValue(null);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback({
          userRole: { create: jest.fn() },
          roleAssignment: { create: jest.fn() },
          auditLog: { create: jest.fn() },
        });
      });

      await service.assignRole(assignRoleDto, mockAssignmentContext);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should handle empty user ID arrays in bulk assignment', async () => {
      const emptyBulkDto: BulkAssignRolesDto = {
        userIds: [],
        roleId: 'role-123',
        reason: 'Empty bulk assignment',
      };

      mockPrismaService.role.findUnique.mockResolvedValue(mockRole);

      const result = await service.bulkAssignRoles(emptyBulkDto, mockAssignmentContext);

      expect(result.successCount).toBe(0);
      expect(result.failures).toHaveLength(0);
    });
  });
});