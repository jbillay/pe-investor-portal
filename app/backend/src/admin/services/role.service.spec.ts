import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { createMockPrismaService } from '../../../test/mocks';
import { createMockRole, createMockRoleWithPermissions } from '../../../test/factories';
import { createMockUser } from '../../../test/factories';

describe('RoleService', () => {
  let service: RoleService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleService,
        {
          provide: PrismaService,
          useValue: createMockPrismaService(),
        },
      ],
    }).compile();

    service = module.get<RoleService>(RoleService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createRole', () => {
    const createRoleDto = {
      name: 'MANAGER',
      description: 'Manager role',
      isActive: true,
      isDefault: false,
    };

    it('should create a new role successfully', async () => {
      // Arrange
      prisma.role.findUnique.mockResolvedValue(null);
      const mockRole = createMockRole({
        name: createRoleDto.name,
        description: createRoleDto.description,
        _count: { userRoles: 0 },
      });
      prisma.role.create.mockResolvedValue(mockRole);

      // Act
      const result = await service.createRole(createRoleDto, 'admin-1');

      // Assert
      expect(result.name).toBe(createRoleDto.name);
      expect(result.description).toBe(createRoleDto.description);
      expect(prisma.role.findUnique).toHaveBeenCalledWith({
        where: { name: createRoleDto.name },
      });
      expect(prisma.role.create).toHaveBeenCalled();
    });

    it('should throw ConflictException when role name already exists', async () => {
      // Arrange
      const existingRole = createMockRole({ name: createRoleDto.name });
      prisma.role.findUnique.mockResolvedValue(existingRole);

      // Act & Assert
      await expect(service.createRole(createRoleDto, 'admin-1')).rejects.toThrow(
        ConflictException,
      );
      await expect(service.createRole(createRoleDto, 'admin-1')).rejects.toThrow(
        `Role with name "${createRoleDto.name}" already exists`,
      );
      expect(prisma.role.create).not.toHaveBeenCalled();
    });

    it('should unset other default roles when creating default role', async () => {
      // Arrange
      const defaultRoleDto = { ...createRoleDto, isDefault: true };
      prisma.role.findUnique.mockResolvedValue(null);
      const mockRole = createMockRole({
        ...defaultRoleDto,
        _count: { userRoles: 0 },
      });
      prisma.role.create.mockResolvedValue(mockRole);
      prisma.role.updateMany.mockResolvedValue({ count: 1 });

      // Act
      await service.createRole(defaultRoleDto, 'admin-1');

      // Assert
      expect(prisma.role.updateMany).toHaveBeenCalledWith({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    });
  });

  describe('getAllRoles', () => {
    it('should return only active roles by default', async () => {
      // Arrange
      const mockRoles = [
        createMockRoleWithPermissions({ name: 'ADMIN', isActive: true }),
        createMockRoleWithPermissions({ name: 'USER', isActive: true }),
      ];
      prisma.role.findMany.mockResolvedValue(mockRoles);

      // Act
      const result = await service.getAllRoles();

      // Assert
      expect(result).toHaveLength(2);
      expect(prisma.role.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        include: expect.any(Object),
        orderBy: { name: 'asc' },
      });
    });

    it('should return all roles including inactive when flag is true', async () => {
      // Arrange
      const mockRoles = [
        createMockRoleWithPermissions({ name: 'ADMIN', isActive: true }),
        createMockRoleWithPermissions({ name: 'OLD_ROLE', isActive: false }),
      ];
      prisma.role.findMany.mockResolvedValue(mockRoles);

      // Act
      const result = await service.getAllRoles(true);

      // Assert
      expect(result).toHaveLength(2);
      expect(prisma.role.findMany).toHaveBeenCalledWith({
        where: {},
        include: expect.any(Object),
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('getRoleById', () => {
    it('should return role when found', async () => {
      // Arrange
      const mockRole = createMockRoleWithPermissions();
      prisma.role.findUnique.mockResolvedValue(mockRole);

      // Act
      const result = await service.getRoleById('role-1');

      // Assert
      expect(result.id).toBe(mockRole.id);
      expect(result.name).toBe(mockRole.name);
      expect(prisma.role.findUnique).toHaveBeenCalledWith({
        where: { id: 'role-1' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when role not found', async () => {
      // Arrange
      prisma.role.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getRoleById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getRoleById('non-existent')).rejects.toThrow(
        'Role with ID "non-existent" not found',
      );
    });
  });

  describe('getRoleByName', () => {
    it('should return role when found', async () => {
      // Arrange
      const mockRole = createMockRoleWithPermissions({ name: 'ADMIN' });
      prisma.role.findUnique.mockResolvedValue(mockRole);

      // Act
      const result = await service.getRoleByName('ADMIN');

      // Assert
      expect(result.name).toBe('ADMIN');
      expect(prisma.role.findUnique).toHaveBeenCalledWith({
        where: { name: 'ADMIN' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when role not found', async () => {
      // Arrange
      prisma.role.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getRoleByName('NON_EXISTENT')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getRoleByName('NON_EXISTENT')).rejects.toThrow(
        'Role with name "NON_EXISTENT" not found',
      );
    });
  });

  describe('updateRole', () => {
    const updateRoleDto = {
      name: 'UPDATED_ROLE',
      description: 'Updated description',
    };

    it('should update role successfully', async () => {
      // Arrange
      const existingRole = createMockRole({ name: 'OLD_NAME' });
      prisma.role.findUnique.mockResolvedValueOnce(existingRole); // First call for existence check
      prisma.role.findUnique.mockResolvedValueOnce(null); // Second call for name conflict check
      const updatedRole = createMockRoleWithPermissions({
        ...existingRole,
        ...updateRoleDto,
      });
      prisma.role.update.mockResolvedValue(updatedRole);

      // Act
      const result = await service.updateRole('role-1', updateRoleDto, 'admin-1');

      // Assert
      expect(result.name).toBe(updateRoleDto.name);
      expect(result.description).toBe(updateRoleDto.description);
      expect(prisma.role.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when role does not exist', async () => {
      // Arrange
      prisma.role.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.updateRole('non-existent', updateRoleDto, 'admin-1'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.updateRole('non-existent', updateRoleDto, 'admin-1'),
      ).rejects.toThrow('Role with ID "non-existent" not found');
    });

    it('should throw ConflictException when new name already exists', async () => {
      // Arrange
      const existingRole = createMockRole({ name: 'OLD_NAME' });
      const conflictingRole = createMockRole({ name: updateRoleDto.name });

      // First call checks if role exists, second call checks for name conflict
      prisma.role.findUnique
        .mockResolvedValueOnce(existingRole)
        .mockResolvedValueOnce(conflictingRole);

      // Act & Assert
      await expect(
        service.updateRole('role-1', updateRoleDto, 'admin-1'),
      ).rejects.toThrow(ConflictException);

      // Reset mocks for second assertion
      prisma.role.findUnique
        .mockResolvedValueOnce(existingRole)
        .mockResolvedValueOnce(conflictingRole);

      await expect(
        service.updateRole('role-1', updateRoleDto, 'admin-1'),
      ).rejects.toThrow(`Role with name "${updateRoleDto.name}" already exists`);
    });

    it('should unset other default roles when updating to default', async () => {
      // Arrange
      const existingRole = createMockRole();
      prisma.role.findUnique.mockResolvedValue(existingRole);
      const updatedRole = createMockRoleWithPermissions({ isDefault: true });
      prisma.role.update.mockResolvedValue(updatedRole);
      prisma.role.updateMany.mockResolvedValue({ count: 1 });

      // Act
      await service.updateRole('role-1', { isDefault: true }, 'admin-1');

      // Assert
      expect(prisma.role.updateMany).toHaveBeenCalledWith({
        where: { isDefault: true, NOT: { id: 'role-1' } },
        data: { isDefault: false },
      });
    });
  });

  describe('deleteRole', () => {
    it('should soft delete role successfully', async () => {
      // Arrange
      const mockRole = createMockRole({
        isDefault: false,
        _count: { userRoles: 0 },
      });
      prisma.role.findUnique.mockResolvedValue(mockRole);
      prisma.role.update.mockResolvedValue({ ...mockRole, isActive: false });

      // Act
      await service.deleteRole('role-1', 'admin-1');

      // Assert
      expect(prisma.role.update).toHaveBeenCalledWith({
        where: { id: 'role-1' },
        data: { isActive: false },
      });
    });

    it('should throw NotFoundException when role not found', async () => {
      // Arrange
      prisma.role.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.deleteRole('non-existent', 'admin-1')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.deleteRole('non-existent', 'admin-1')).rejects.toThrow(
        'Role with ID "non-existent" not found',
      );
    });

    it('should throw BadRequestException when trying to delete default role', async () => {
      // Arrange
      const defaultRole = createMockRole({
        isDefault: true,
        _count: { userRoles: 0 },
      });
      prisma.role.findUnique.mockResolvedValue(defaultRole);

      // Act & Assert
      await expect(service.deleteRole('role-1', 'admin-1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.deleteRole('role-1', 'admin-1')).rejects.toThrow(
        'Cannot delete a default role',
      );
    });

    it('should throw BadRequestException when role has assigned users', async () => {
      // Arrange
      const roleWithUsers = createMockRole({
        isDefault: false,
        _count: { userRoles: 5 },
      });
      prisma.role.findUnique.mockResolvedValue(roleWithUsers);

      // Act & Assert
      await expect(service.deleteRole('role-1', 'admin-1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.deleteRole('role-1', 'admin-1')).rejects.toThrow(
        'Cannot delete role that is assigned to users',
      );
    });
  });

  describe('assignRole', () => {
    const assignRoleDto = {
      userId: 'user-1',
      roleId: 'role-1',
      reason: 'Promoted to manager',
      expiresAt: null,
    };
    const context = {
      assignedBy: 'admin-1',
      userAgent: 'Mozilla/5.0',
      ipAddress: '127.0.0.1',
    };

    it('should assign role to user successfully', async () => {
      // Arrange
      const mockUser = createMockUser();
      const mockRole = createMockRole({ isActive: true });
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.role.findUnique.mockResolvedValue(mockRole);
      prisma.userRole.findUnique.mockResolvedValue(null);

      const mockTransaction = jest.fn(async (callback) => {
        return callback(prisma);
      });
      prisma.$transaction.mockImplementation(mockTransaction as any);

      // Act
      await service.assignRole(assignRoleDto, context);

      // Assert
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: assignRoleDto.userId },
      });
      expect(prisma.role.findUnique).toHaveBeenCalledWith({
        where: { id: assignRoleDto.roleId },
      });
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.assignRole(assignRoleDto, context)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.assignRole(assignRoleDto, context)).rejects.toThrow(
        `User with ID "${assignRoleDto.userId}" not found`,
      );
    });

    it('should throw NotFoundException when role not found', async () => {
      // Arrange
      const mockUser = createMockUser();
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.role.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.assignRole(assignRoleDto, context)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.assignRole(assignRoleDto, context)).rejects.toThrow(
        `Active role with ID "${assignRoleDto.roleId}" not found`,
      );
    });

    it('should throw NotFoundException when role is inactive', async () => {
      // Arrange
      const mockUser = createMockUser();
      const inactiveRole = createMockRole({ isActive: false });
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.role.findUnique.mockResolvedValue(inactiveRole);

      // Act & Assert
      await expect(service.assignRole(assignRoleDto, context)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when user already has active role', async () => {
      // Arrange
      const mockUser = createMockUser();
      const mockRole = createMockRole({ isActive: true });
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.role.findUnique.mockResolvedValue(mockRole);
      prisma.userRole.findUnique.mockResolvedValue({
        id: 'user-role-1',
        userId: assignRoleDto.userId,
        roleId: assignRoleDto.roleId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act & Assert
      await expect(service.assignRole(assignRoleDto, context)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.assignRole(assignRoleDto, context)).rejects.toThrow(
        'User already has this role',
      );
    });
  });

  describe('revokeRole', () => {
    const revokeRoleDto = {
      userId: 'user-1',
      roleId: 'role-1',
      reason: 'User changed departments',
    };
    const context = {
      assignedBy: 'admin-1',
      userAgent: 'Mozilla/5.0',
      ipAddress: '127.0.0.1',
    };

    it('should revoke role from user successfully', async () => {
      // Arrange
      const mockUserRole = {
        id: 'user-role-1',
        userId: 'user-1',
        roleId: 'role-1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        role: createMockRole({ name: 'MANAGER' }),
      };
      prisma.userRole.findUnique.mockResolvedValue(mockUserRole);

      const mockTransaction = jest.fn(async (callback) => {
        return callback(prisma);
      });
      prisma.$transaction.mockImplementation(mockTransaction as any);

      const mockAssignment = {
        id: 'assignment-1',
        userId: 'user-1',
        roleId: 'role-1',
        isActive: true,
        revokedAt: null,
      };
      prisma.roleAssignment.findFirst.mockResolvedValue(mockAssignment as any);

      // Act
      await service.revokeRole(revokeRoleDto, context);

      // Assert
      expect(prisma.userRole.findUnique).toHaveBeenCalledWith({
        where: {
          userId_roleId: {
            userId: revokeRoleDto.userId,
            roleId: revokeRoleDto.roleId,
          },
        },
        include: { role: true },
      });
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user does not have role', async () => {
      // Arrange
      prisma.userRole.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.revokeRole(revokeRoleDto, context)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.revokeRole(revokeRoleDto, context)).rejects.toThrow(
        'User does not have this role',
      );
    });

    it('should throw NotFoundException when user role is inactive', async () => {
      // Arrange
      const inactiveUserRole = {
        id: 'user-role-1',
        userId: 'user-1',
        roleId: 'role-1',
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        role: createMockRole(),
      };
      prisma.userRole.findUnique.mockResolvedValue(inactiveUserRole);

      // Act & Assert
      await expect(service.revokeRole(revokeRoleDto, context)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('bulkAssignRoles', () => {
    const bulkAssignDto = {
      userIds: ['user-1', 'user-2', 'user-3'],
      roleId: 'role-1',
      reason: 'Quarterly role updates',
      expiresAt: null,
    };
    const context = {
      assignedBy: 'admin-1',
      userAgent: 'Mozilla/5.0',
      ipAddress: '127.0.0.1',
    };

    it('should successfully assign role to all users', async () => {
      // Arrange
      const mockRole = createMockRole({ isActive: true });
      prisma.role.findUnique.mockResolvedValue(mockRole);

      // Mock successful assignments
      const mockUser = createMockUser();
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.userRole.findUnique.mockResolvedValue(null);

      const mockTransaction = jest.fn(async (callback) => {
        return callback(prisma);
      });
      prisma.$transaction.mockImplementation(mockTransaction as any);

      // Act
      const result = await service.bulkAssignRoles(bulkAssignDto, context);

      // Assert
      expect(result.successCount).toBe(3);
      expect(result.failures).toHaveLength(0);
      expect(prisma.role.findUnique).toHaveBeenCalledWith({
        where: { id: bulkAssignDto.roleId },
      });
    });

    it('should throw NotFoundException when role not found', async () => {
      // Arrange
      prisma.role.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.bulkAssignRoles(bulkAssignDto, context)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.bulkAssignRoles(bulkAssignDto, context)).rejects.toThrow(
        `Active role with ID "${bulkAssignDto.roleId}" not found`,
      );
    });

    it('should throw NotFoundException when role is inactive', async () => {
      // Arrange
      const inactiveRole = createMockRole({ isActive: false });
      prisma.role.findUnique.mockResolvedValue(inactiveRole);

      // Act & Assert
      await expect(service.bulkAssignRoles(bulkAssignDto, context)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle partial failures gracefully', async () => {
      // Arrange
      const mockRole = createMockRole({ isActive: true });
      prisma.role.findUnique.mockResolvedValue(mockRole);

      const mockUser = createMockUser();
      prisma.user.findUnique
        .mockResolvedValueOnce(mockUser) // First user succeeds
        .mockResolvedValueOnce(null) // Second user not found
        .mockResolvedValueOnce(mockUser); // Third user succeeds

      prisma.userRole.findUnique.mockResolvedValue(null);

      const mockTransaction = jest.fn(async (callback) => {
        return callback(prisma);
      });
      prisma.$transaction.mockImplementation(mockTransaction as any);

      // Act
      const result = await service.bulkAssignRoles(bulkAssignDto, context);

      // Assert
      expect(result.successCount).toBe(2);
      expect(result.failures).toHaveLength(1);
      expect(result.failures[0].userId).toBe('user-2');
    });
  });

  describe('getUserRoles', () => {
    it('should return user with active roles and permissions', async () => {
      // Arrange
      const mockUser = {
        ...createMockUser(),
        userRoles: [
          {
            id: 'user-role-1',
            userId: 'user-1',
            roleId: 'role-1',
            isActive: true,
            role: {
              ...createMockRole({ name: 'ADMIN' }),
              rolePermissions: [
                {
                  id: 'rp-1',
                  roleId: 'role-1',
                  permissionId: 'perm-1',
                  isActive: true,
                  permission: {
                    id: 'perm-1',
                    name: 'USER:READ',
                    description: 'Read users',
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  },
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              ],
            },
          },
        ],
      };
      prisma.user.findUnique.mockResolvedValue(mockUser as any);

      // Act
      const result = await service.getUserRoles('user-1');

      // Assert
      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
      expect(result.roles).toHaveLength(1);
      expect(result.roles[0].name).toBe('ADMIN');
      expect(result.permissions).toContain('USER:READ');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getUserRoles('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getUserRoles('non-existent')).rejects.toThrow(
        'User with ID "non-existent" not found',
      );
    });
  });

  describe('getRoleAssignmentHistory', () => {
    it('should return role assignment history for user', async () => {
      // Arrange
      const mockAssignments = [
        {
          id: 'assignment-1',
          userId: 'user-1',
          roleId: 'role-1',
          role: createMockRole({ name: 'ADMIN' }),
          assignedBy: 'admin-1',
          reason: 'Promoted',
          expiresAt: null,
          revokedAt: null,
          revokedBy: null,
          revokeReason: null,
          isActive: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          id: 'assignment-2',
          userId: 'user-1',
          roleId: 'role-2',
          role: createMockRole({ name: 'USER' }),
          assignedBy: 'admin-1',
          reason: 'Initial role',
          expiresAt: null,
          revokedAt: new Date('2024-01-15'),
          revokedBy: 'admin-1',
          revokeReason: 'Changed role',
          isActive: false,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-15'),
        },
      ];
      prisma.roleAssignment.findMany.mockResolvedValue(mockAssignments as any);

      // Act
      const result = await service.getRoleAssignmentHistory('user-1');

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].role.name).toBe('ADMIN');
      expect(result[0].isActive).toBe(true);
      expect(result[1].isActive).toBe(false);
      expect(result[1].revokedBy).toBe('admin-1');
      expect(prisma.roleAssignment.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: { role: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getDefaultRole', () => {
    it('should return default role when one exists', async () => {
      // Arrange
      const mockRole = {
        ...createMockRoleWithPermissions({ isDefault: true, isActive: true }),
        _count: { userRoles: 5 },
      };
      prisma.role.findFirst.mockResolvedValue(mockRole as any);

      // Act
      const result = await service.getDefaultRole();

      // Assert
      expect(result).not.toBeNull();
      expect(result?.isDefault).toBe(true);
      expect(result?.userCount).toBe(5);
      expect(prisma.role.findFirst).toHaveBeenCalledWith({
        where: { isDefault: true, isActive: true },
        include: expect.any(Object),
      });
    });

    it('should return null when no default role exists', async () => {
      // Arrange
      prisma.role.findFirst.mockResolvedValue(null);

      // Act
      const result = await service.getDefaultRole();

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('userHasRole', () => {
    it('should return true when user has the role', async () => {
      // Arrange
      const mockUserRole = {
        id: 'user-role-1',
        userId: 'user-1',
        roleId: 'role-1',
        isActive: true,
      };
      prisma.userRole.findFirst.mockResolvedValue(mockUserRole as any);

      // Act
      const result = await service.userHasRole('user-1', 'ADMIN');

      // Assert
      expect(result).toBe(true);
      expect(prisma.userRole.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          isActive: true,
          role: {
            name: 'ADMIN',
            isActive: true,
          },
        },
      });
    });

    it('should return false when user does not have the role', async () => {
      // Arrange
      prisma.userRole.findFirst.mockResolvedValue(null);

      // Act
      const result = await service.userHasRole('user-1', 'ADMIN');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('userHasAnyRole', () => {
    it('should return true when user has any of the specified roles', async () => {
      // Arrange
      const mockUserRole = {
        id: 'user-role-1',
        userId: 'user-1',
        roleId: 'role-1',
        isActive: true,
      };
      prisma.userRole.findFirst.mockResolvedValue(mockUserRole as any);

      // Act
      const result = await service.userHasAnyRole('user-1', ['ADMIN', 'MANAGER']);

      // Assert
      expect(result).toBe(true);
      expect(prisma.userRole.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          isActive: true,
          role: {
            name: { in: ['ADMIN', 'MANAGER'] },
            isActive: true,
          },
        },
      });
    });

    it('should return false when user does not have any of the specified roles', async () => {
      // Arrange
      prisma.userRole.findFirst.mockResolvedValue(null);

      // Act
      const result = await service.userHasAnyRole('user-1', ['ADMIN', 'MANAGER']);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getUsersWithRole', () => {
    it('should return all users with the specified role', async () => {
      // Arrange
      const mockUserRoles = [
        {
          id: 'user-role-1',
          userId: 'user-1',
          roleId: 'role-1',
          isActive: true,
          user: {
            ...createMockUser({ id: 'user-1', email: 'user1@example.com' }),
            userRoles: [
              {
                id: 'user-role-1',
                userId: 'user-1',
                roleId: 'role-1',
                isActive: true,
                role: {
                  ...createMockRole({ name: 'ADMIN' }),
                  rolePermissions: [
                    {
                      id: 'rp-1',
                      roleId: 'role-1',
                      permissionId: 'perm-1',
                      isActive: true,
                      permission: {
                        id: 'perm-1',
                        name: 'USER:READ',
                        description: 'Read users',
                        isActive: true,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                      },
                      createdAt: new Date(),
                      updatedAt: new Date(),
                    },
                  ],
                },
              },
            ],
          },
        },
      ];
      prisma.userRole.findMany.mockResolvedValue(mockUserRoles as any);

      // Act
      const result = await service.getUsersWithRole('role-1');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('user1@example.com');
      expect(result[0].roles).toHaveLength(1);
      expect(result[0].roles[0].name).toBe('ADMIN');
      expect(result[0].permissions).toContain('USER:READ');
      expect(prisma.userRole.findMany).toHaveBeenCalledWith({
        where: {
          roleId: 'role-1',
          isActive: true,
        },
        include: expect.any(Object),
      });
    });

    it('should return empty array when no users have the role', async () => {
      // Arrange
      prisma.userRole.findMany.mockResolvedValue([]);

      // Act
      const result = await service.getUsersWithRole('role-1');

      // Assert
      expect(result).toHaveLength(0);
    });
  });
});
