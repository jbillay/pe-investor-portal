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
});
