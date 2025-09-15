import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { RoleService } from './role.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateRoleDto, UpdateRoleDto, AssignRoleDto, RevokeRoleDto, BulkAssignRolesDto } from '../dto/role.dto';

// Mock Prisma Client
const mockPrismaService = {
  role: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  userRole: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
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

describe('RoleService', () => {
  let service: RoleService;
  let prisma: typeof mockPrismaService;

  const mockRole = {
    id: 'role-1',
    name: 'ADMIN',
    description: 'Administrator role',
    isActive: true,
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { userRoles: 0 },
    rolePermissions: [],
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
        RoleService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<RoleService>(RoleService);
    prisma = module.get(PrismaService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createRole', () => {
    const createRoleDto: CreateRoleDto = {
      name: 'INVESTOR',
      description: 'Investor role',
      isActive: true,
      isDefault: false,
    };

    it('should create a new role successfully', async () => {
      prisma.role.findUnique.mockResolvedValue(null);
      prisma.role.create.mockResolvedValue({
        ...mockRole,
        name: createRoleDto.name,
        description: createRoleDto.description,
      });

      const result = await service.createRole(createRoleDto, 'admin-1');

      expect(prisma.role.findUnique).toHaveBeenCalledWith({
        where: { name: createRoleDto.name },
      });
      expect(prisma.role.create).toHaveBeenCalledWith({
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
      expect(result).toMatchObject({
        name: createRoleDto.name,
        description: createRoleDto.description,
        isActive: true,
        isDefault: false,
      });
    });

    it('should throw ConflictException when role name already exists', async () => {
      prisma.role.findUnique.mockResolvedValue(mockRole);

      await expect(service.createRole(createRoleDto, 'admin-1')).rejects.toThrow(
        new ConflictException(`Role with name "${createRoleDto.name}" already exists`)
      );
    });

    it('should unset other default roles when creating a default role', async () => {
      const defaultRoleDto = { ...createRoleDto, isDefault: true };

      prisma.role.findUnique.mockResolvedValue(null);
      prisma.role.updateMany.mockResolvedValue({ count: 1 });
      prisma.role.create.mockResolvedValue({
        ...mockRole,
        ...defaultRoleDto,
      });

      await service.createRole(defaultRoleDto, 'admin-1');

      expect(prisma.role.updateMany).toHaveBeenCalledWith({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    });
  });

  describe('getAllRoles', () => {
    it('should return all active roles by default', async () => {
      const roles = [mockRole];
      prisma.role.findMany.mockResolvedValue(roles);

      const result = await service.getAllRoles();

      expect(prisma.role.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        include: {
          _count: { select: { userRoles: true } },
          rolePermissions: {
            include: { permission: true },
          },
        },
        orderBy: { name: 'asc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: mockRole.id,
        name: mockRole.name,
      });
    });

    it('should include inactive roles when requested', async () => {
      const roles = [mockRole, { ...mockRole, id: 'role-2', isActive: false }];
      prisma.role.findMany.mockResolvedValue(roles);

      const result = await service.getAllRoles(true);

      expect(prisma.role.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          _count: { select: { userRoles: true } },
          rolePermissions: {
            include: { permission: true },
          },
        },
        orderBy: { name: 'asc' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('getRoleById', () => {
    it('should return role by ID', async () => {
      prisma.role.findUnique.mockResolvedValue(mockRole);

      const result = await service.getRoleById('role-1');

      expect(prisma.role.findUnique).toHaveBeenCalledWith({
        where: { id: 'role-1' },
        include: {
          _count: { select: { userRoles: true } },
          rolePermissions: {
            include: { permission: true },
          },
        },
      });
      expect(result).toMatchObject({
        id: mockRole.id,
        name: mockRole.name,
      });
    });

    it('should throw NotFoundException when role not found', async () => {
      prisma.role.findUnique.mockResolvedValue(null);

      await expect(service.getRoleById('nonexistent')).rejects.toThrow(
        new NotFoundException('Role with ID "nonexistent" not found')
      );
    });
  });

  describe('updateRole', () => {
    const updateRoleDto: UpdateRoleDto = {
      description: 'Updated description',
    };

    it('should update role successfully', async () => {
      const updatedRole = { ...mockRole, description: updateRoleDto.description };

      prisma.role.findUnique.mockResolvedValue(mockRole);
      prisma.role.update.mockResolvedValue(updatedRole);

      const result = await service.updateRole('role-1', updateRoleDto, 'admin-1');

      expect(prisma.role.findUnique).toHaveBeenCalledWith({
        where: { id: 'role-1' },
      });
      expect(prisma.role.update).toHaveBeenCalledWith({
        where: { id: 'role-1' },
        data: { description: updateRoleDto.description },
        include: {
          _count: { select: { userRoles: true } },
          rolePermissions: {
            include: { permission: true },
          },
        },
      });
      expect(result.description).toBe(updateRoleDto.description);
    });

    it('should throw NotFoundException when role not found', async () => {
      prisma.role.findUnique.mockResolvedValue(null);

      await expect(
        service.updateRole('nonexistent', updateRoleDto, 'admin-1')
      ).rejects.toThrow(
        new NotFoundException('Role with ID "nonexistent" not found')
      );
    });
  });

  describe('deleteRole', () => {
    it('should soft delete role successfully', async () => {
      const roleWithoutUsers = { ...mockRole, _count: { userRoles: 0 } };

      prisma.role.findUnique.mockResolvedValue(roleWithoutUsers);
      prisma.role.update.mockResolvedValue({ ...roleWithoutUsers, isActive: false });

      await service.deleteRole('role-1', 'admin-1');

      expect(prisma.role.update).toHaveBeenCalledWith({
        where: { id: 'role-1' },
        data: { isActive: false },
      });
    });

    it('should throw BadRequestException when trying to delete default role', async () => {
      const defaultRole = { ...mockRole, isDefault: true, _count: { userRoles: 0 } };

      prisma.role.findUnique.mockResolvedValue(defaultRole);

      await expect(service.deleteRole('role-1', 'admin-1')).rejects.toThrow(
        new BadRequestException('Cannot delete a default role')
      );
    });

    it('should throw BadRequestException when role has active users', async () => {
      const roleWithUsers = { ...mockRole, _count: { userRoles: 5 } };

      prisma.role.findUnique.mockResolvedValue(roleWithUsers);

      await expect(service.deleteRole('role-1', 'admin-1')).rejects.toThrow(
        new BadRequestException('Cannot delete role that is assigned to users. Remove all assignments first.')
      );
    });
  });

  describe('assignRole', () => {
    const assignRoleDto: AssignRoleDto = {
      userId: 'user-1',
      roleId: 'role-1',
      reason: 'Promotion',
    };

    const assignmentContext = {
      assignedBy: 'admin-1',
      userAgent: 'test-agent',
      ipAddress: '127.0.0.1',
    };

    it('should assign role to user successfully', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.role.findUnique.mockResolvedValue(mockRole);
      prisma.userRole.findUnique.mockResolvedValue(null);
      prisma.$transaction.mockImplementation((callback) => callback(prisma));
      prisma.userRole.create.mockResolvedValue({});
      prisma.roleAssignment.create.mockResolvedValue({});
      prisma.auditLog.create.mockResolvedValue({});

      await service.assignRole(assignRoleDto, assignmentContext);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: assignRoleDto.userId },
      });
      expect(prisma.role.findUnique).toHaveBeenCalledWith({
        where: { id: assignRoleDto.roleId },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.assignRole(assignRoleDto, assignmentContext)).rejects.toThrow(
        new NotFoundException(`User with ID "${assignRoleDto.userId}" not found`)
      );
    });

    it('should throw ConflictException when user already has role', async () => {
      const existingUserRole = {
        id: 'user-role-1',
        userId: assignRoleDto.userId,
        roleId: assignRoleDto.roleId,
        isActive: true,
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.role.findUnique.mockResolvedValue(mockRole);
      prisma.userRole.findUnique.mockResolvedValue(existingUserRole);

      await expect(service.assignRole(assignRoleDto, assignmentContext)).rejects.toThrow(
        new ConflictException('User already has this role')
      );
    });
  });

  describe('userHasRole', () => {
    it('should return true when user has role', async () => {
      const userRole = {
        id: 'user-role-1',
        userId: 'user-1',
        roleId: 'role-1',
        isActive: true,
      };

      prisma.userRole.findFirst.mockResolvedValue(userRole);

      const result = await service.userHasRole('user-1', 'ADMIN');

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
      expect(result).toBe(true);
    });

    it('should return false when user does not have role', async () => {
      prisma.userRole.findFirst.mockResolvedValue(null);

      const result = await service.userHasRole('user-1', 'ADMIN');

      expect(result).toBe(false);
    });
  });

  describe('userHasAnyRole', () => {
    it('should return true when user has any of the specified roles', async () => {
      const userRole = {
        id: 'user-role-1',
        userId: 'user-1',
        roleId: 'role-1',
        isActive: true,
      };

      prisma.userRole.findFirst.mockResolvedValue(userRole);

      const result = await service.userHasAnyRole('user-1', ['ADMIN', 'INVESTOR']);

      expect(prisma.userRole.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          isActive: true,
          role: {
            name: { in: ['ADMIN', 'INVESTOR'] },
            isActive: true,
          },
        },
      });
      expect(result).toBe(true);
    });

    it('should return false when user has none of the specified roles', async () => {
      prisma.userRole.findFirst.mockResolvedValue(null);

      const result = await service.userHasAnyRole('user-1', ['ADMIN', 'INVESTOR']);

      expect(result).toBe(false);
    });
  });

  describe('getRoleByName', () => {
    it('should return role by name successfully', async () => {
      const mockRoleWithDetails = {
        ...mockRole,
        _count: { userRoles: 5 },
        rolePermissions: [],
      };

      prisma.role.findUnique.mockResolvedValueOnce(mockRoleWithDetails);

      const result = await service.getRoleByName('ADMIN');

      expect(prisma.role.findUnique).toHaveBeenCalledWith({
        where: { name: 'ADMIN' },
        include: {
          _count: { select: { userRoles: true } },
          rolePermissions: {
            include: { permission: true },
          },
        },
      });
      expect(result).toMatchObject({
        id: mockRole.id,
        name: mockRole.name,
      });
    });

    it('should throw NotFoundException when role not found by name', async () => {
      prisma.role.findUnique.mockResolvedValueOnce(null);

      await expect(service.getRoleByName('NONEXISTENT')).rejects.toThrow(
        new NotFoundException('Role with name "NONEXISTENT" not found')
      );
    });
  });

  describe('revokeRole', () => {
    const revokeRoleDto: RevokeRoleDto = {
      userId: 'user-1',
      roleId: 'role-1',
      reason: 'Access revoked',
    };

    const revocationContext = {
      revokedBy: 'admin-1',
      userAgent: 'test-agent',
      ipAddress: '127.0.0.1',
    };

    it('should revoke role from user successfully', async () => {
      const existingUserRole = {
        id: 'user-role-1',
        userId: 'user-1',
        roleId: 'role-1',
        isActive: true,
        role: mockRole,
      };

      prisma.userRole.findUnique.mockResolvedValueOnce(existingUserRole);
      prisma.$transaction.mockImplementation((callback) => callback(prisma));
      prisma.userRole.update.mockResolvedValueOnce({ ...existingUserRole, isActive: false });
      prisma.roleAssignment.findFirst.mockResolvedValueOnce({ id: 'assignment-1', isActive: true });
      prisma.roleAssignment.update.mockResolvedValueOnce({});
      prisma.auditLog.create.mockResolvedValueOnce({});

      await service.revokeRole(revokeRoleDto, revocationContext);

      expect(prisma.userRole.findUnique).toHaveBeenCalledWith({
        where: {
          userId_roleId: {
            userId: revokeRoleDto.userId,
            roleId: revokeRoleDto.roleId,
          },
        },
        include: {
          role: true,
        },
      });
    });

    it('should throw NotFoundException when user does not have the role', async () => {
      prisma.userRole.findUnique.mockResolvedValueOnce(null);

      await expect(service.revokeRole(revokeRoleDto, revocationContext)).rejects.toThrow(
        new NotFoundException('User does not have this role')
      );
    });

    it('should throw NotFoundException when role is inactive', async () => {
      const inactiveUserRole = {
        id: 'user-role-1',
        userId: 'user-1',
        roleId: 'role-1',
        isActive: false,
        role: mockRole,
      };

      prisma.userRole.findUnique.mockResolvedValueOnce(inactiveUserRole);

      await expect(service.revokeRole(revokeRoleDto, revocationContext)).rejects.toThrow(
        new NotFoundException('User does not have this role')
      );
    });
  });

  describe('bulkAssignRoles', () => {
    const bulkAssignDto: BulkAssignRolesDto = {
      userIds: ['user-1', 'user-2'],
      roleId: 'role-1',
      reason: 'Bulk assignment',
    };

    it('should perform bulk assignment successfully', async () => {
      const users = [
        mockUser,
        { ...mockUser, id: 'user-2' },
      ];

      prisma.role.findUnique.mockResolvedValueOnce(mockRole);
      users.forEach((user, index) => {
        prisma.user.findUnique.mockResolvedValueOnce(user);
        prisma.userRole.findUnique.mockResolvedValueOnce(null);
      });
      prisma.$transaction.mockImplementation((callback) => callback(prisma));
      prisma.userRole.create.mockResolvedValue({});
      prisma.roleAssignment.create.mockResolvedValue({});
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.bulkAssignRoles(bulkAssignDto, 'admin-1', 'test-agent', '127.0.0.1');

      expect(result.successCount).toBe(2);
      expect(result.failures).toHaveLength(0);
      expect(prisma.role.findUnique).toHaveBeenCalledWith({
        where: { id: bulkAssignDto.roleId },
      });
    });

    it('should handle bulk assignment with failures', async () => {
      prisma.role.findUnique.mockResolvedValueOnce(mockRole);
      prisma.user.findUnique.mockResolvedValueOnce(mockUser).mockResolvedValueOnce(null); // Second user not found
      prisma.userRole.findUnique.mockResolvedValueOnce(null);
      prisma.$transaction.mockImplementation((callback) => callback(prisma));
      prisma.userRole.create.mockResolvedValue({});
      prisma.roleAssignment.create.mockResolvedValue({});
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.bulkAssignRoles(bulkAssignDto, 'admin-1', 'test-agent', '127.0.0.1');

      expect(result.successCount).toBe(1);
      expect(result.failures).toHaveLength(1);
      expect(result.failures[0].userId).toBe('user-2');
      expect(result.failures[0].error).toContain('User with ID "user-2" not found');
    });

    it('should throw NotFoundException when role not found for bulk assignment', async () => {
      prisma.role.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.bulkAssignRoles(bulkAssignDto, 'admin-1', 'test-agent', '127.0.0.1')
      ).rejects.toThrow(new NotFoundException(`Active role with ID "${bulkAssignDto.roleId}" not found`));
    });
  });

  describe('getUserRoles', () => {
    it('should return user with roles and permissions successfully', async () => {
      const mockUserWithRoles = {
        ...mockUser,
        userRoles: [
          {
            id: 'user-role-1',
            isActive: true,
            assignedAt: new Date(),
            role: {
              ...mockRole,
              rolePermissions: [
                {
                  isActive: true,
                  permission: {
                    id: 'perm-1',
                    name: 'CREATE_USER',
                    action: 'CREATE',
                    resource: 'USER',
                    isActive: true,
                  },
                },
              ],
            },
          },
        ],
      };

      prisma.user.findUnique.mockResolvedValueOnce(mockUserWithRoles);

      const result = await service.getUserRoles('user-1');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        include: {
          userRoles: {
            where: { isActive: true },
            include: {
              role: {
                include: {
                  rolePermissions: {
                    where: { isActive: true },
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
      expect(result).toMatchObject({
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
      });
      expect(result.roles).toHaveLength(1);
      expect(result.permissions).toContain('CREATE_USER');
    });

    it('should throw NotFoundException when user not found for getUserRoles', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);

      await expect(service.getUserRoles('nonexistent')).rejects.toThrow(
        new NotFoundException('User with ID "nonexistent" not found')
      );
    });
  });

  describe('getRoleAssignmentHistory', () => {
    it('should return user role assignment history', async () => {
      const mockHistory = [
        {
          id: 'assignment-1',
          userId: 'user-1',
          roleId: 'role-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          revokedAt: null,
          assignedBy: 'admin-1',
          reason: 'Initial assignment',
          isActive: true,
          expiresAt: null,
          revokedBy: null,
          revokeReason: null,
          role: mockRole,
        },
      ];

      prisma.roleAssignment.findMany.mockResolvedValueOnce(mockHistory);

      const result = await service.getRoleAssignmentHistory('user-1');

      expect(prisma.roleAssignment.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: { role: true },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('assignment-1');
    });

    it('should return empty array when no role assignment history exists', async () => {
      prisma.roleAssignment.findMany.mockResolvedValueOnce([]);

      const result = await service.getRoleAssignmentHistory('user-1');

      expect(result).toHaveLength(0);
    });
  });

  describe('getDefaultRole', () => {
    it('should return default role when exists', async () => {
      const defaultRole = {
        ...mockRole,
        isDefault: true,
        _count: { userRoles: 10 },
        rolePermissions: [],
      };

      prisma.role.findFirst.mockResolvedValueOnce(defaultRole);

      const result = await service.getDefaultRole();

      expect(prisma.role.findFirst).toHaveBeenCalledWith({
        where: { isDefault: true, isActive: true },
        include: {
          _count: { select: { userRoles: true } },
          rolePermissions: {
            include: { permission: true },
          },
        },
      });
      expect(result).toMatchObject({
        id: defaultRole.id,
        name: defaultRole.name,
        isDefault: true,
      });
    });

    it('should return null when no default role exists', async () => {
      prisma.role.findFirst.mockResolvedValueOnce(null);

      const result = await service.getDefaultRole();

      expect(result).toBeNull();
    });
  });

  describe('getUsersWithRole', () => {
    it('should return users with specific role', async () => {
      const mockUserRoles = [
        {
          id: 'user-role-1',
          userId: 'user-1',
          roleId: 'role-1',
          isActive: true,
          user: {
            ...mockUser,
            userRoles: [
              {
                role: {
                  ...mockRole,
                  rolePermissions: [
                    {
                      isActive: true,
                      permission: {
                        id: 'perm-1',
                        name: 'CREATE_USER',
                        isActive: true,
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ];

      prisma.userRole.findMany.mockResolvedValueOnce(mockUserRoles);

      const result = await service.getUsersWithRole('role-1');

      expect(prisma.userRole.findMany).toHaveBeenCalledWith({
        where: {
          roleId: 'role-1',
          isActive: true,
        },
        include: {
          user: {
            include: {
              userRoles: {
                where: { isActive: true },
                include: {
                  role: {
                    include: {
                      rolePermissions: {
                        where: { isActive: true },
                        include: {
                          permission: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockUser.id);
      expect(result[0].email).toBe(mockUser.email);
    });

    it('should return empty array when no users have the role', async () => {
      prisma.userRole.findMany.mockResolvedValueOnce([]);

      const result = await service.getUsersWithRole('role-1');

      expect(result).toHaveLength(0);
    });
  });
});