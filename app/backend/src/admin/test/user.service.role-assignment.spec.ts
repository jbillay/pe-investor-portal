import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

import { UserService } from '../services/user.service';
import { PrismaService } from '../../database/prisma.service';
import { AssignRolesDto, RevokeRolesDto } from '../dto';

describe('UserService - Role Assignment Edge Cases', () => {
  let service: UserService;
  let prismaService: jest.Mocked<PrismaService>;
  let configService: jest.Mocked<ConfigService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    isActive: true
  };

  const mockRole = {
    id: 'role-123',
    name: 'INVESTOR',
    description: 'Investor role',
    isActive: true
  };

  const mockInactiveRole = {
    id: 'role-inactive',
    name: 'INACTIVE_ROLE',
    description: 'Inactive role',
    isActive: false
  };

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn()
      },
      role: {
        findMany: jest.fn()
      },
      userRole: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn()
      },
      roleAssignment: {
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn()
      },
      $transaction: jest.fn()
    };

    const mockConfigService = {
      get: jest.fn().mockImplementation((key: string, defaultValue?: any) => {
        const config = {
          'auth.saltRounds': 12,
          'user.maxBulkOperationSize': 100
        };
        return config[key] || defaultValue;
      })
    };

    const mockEventEmitter = {
      emit: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EventEmitter2, useValue: mockEventEmitter }
      ]
    }).compile();

    service = module.get<UserService>(UserService);
    prismaService = module.get(PrismaService);
    configService = module.get(ConfigService);
    eventEmitter = module.get(EventEmitter2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('assignRoles - Edge Cases', () => {
    const assignRolesDto: AssignRolesDto = {
      roles: ['INVESTOR'],
      reason: 'Test assignment'
    };
    const assignedById = 'admin-123';
    const userId = 'user-123';

    it('should handle unique constraint violation by using upsert (main defect fix)', async () => {
      // Arrange
      prismaService.role.findMany.mockResolvedValue([mockRole]);

      const mockTransaction = {
        userRole: {
          findFirst: jest.fn().mockResolvedValue(null), // No active assignment found
          upsert: jest.fn().mockResolvedValue({ id: 'user-role-123' })
        },
        roleAssignment: {
          create: jest.fn().mockResolvedValue({ id: 'assignment-123' })
        }
      };

      prismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockTransaction as any);
      });

      // Act
      const result = await service.assignRoles(userId, assignRolesDto, assignedById);

      // Assert
      expect(result.message).toBe('Roles assigned successfully');
      expect(mockTransaction.userRole.upsert).toHaveBeenCalledWith({
        where: {
          userId_roleId: {
            userId: userId,
            roleId: mockRole.id
          }
        },
        update: {
          isActive: true,
          updatedAt: expect.any(Date)
        },
        create: {
          userId: userId,
          roleId: mockRole.id,
          isActive: true
        }
      });
      expect(mockTransaction.roleAssignment.create).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith('user.roles.assigned', expect.any(Object));
    });

    it('should reactivate previously inactive role assignment', async () => {
      // Arrange
      const inactiveUserRole = {
        id: 'user-role-inactive',
        userId: userId,
        roleId: mockRole.id,
        isActive: false
      };

      prismaService.role.findMany.mockResolvedValue([mockRole]);

      const mockTransaction = {
        userRole: {
          findFirst: jest.fn().mockResolvedValue(null), // No active assignment
          upsert: jest.fn().mockResolvedValue(inactiveUserRole)
        },
        roleAssignment: {
          create: jest.fn().mockResolvedValue({ id: 'assignment-123' })
        }
      };

      prismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockTransaction as any);
      });

      // Act
      const result = await service.assignRoles(userId, assignRolesDto, assignedById);

      // Assert
      expect(result.message).toBe('Roles assigned successfully');
      expect(mockTransaction.userRole.upsert).toHaveBeenCalledWith({
        where: {
          userId_roleId: {
            userId: userId,
            roleId: mockRole.id
          }
        },
        update: {
          isActive: true,
          updatedAt: expect.any(Date)
        },
        create: {
          userId: userId,
          roleId: mockRole.id,
          isActive: true
        }
      });
    });

    it('should skip assignment if role is already active', async () => {
      // Arrange
      const activeUserRole = {
        id: 'user-role-active',
        userId: userId,
        roleId: mockRole.id,
        isActive: true
      };

      prismaService.role.findMany.mockResolvedValue([mockRole]);

      const mockTransaction = {
        userRole: {
          findFirst: jest.fn().mockResolvedValue(activeUserRole), // Active assignment exists
          upsert: jest.fn(),
          create: jest.fn()
        },
        roleAssignment: {
          create: jest.fn()
        }
      };

      prismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockTransaction as any);
      });

      // Act
      const result = await service.assignRoles(userId, assignRolesDto, assignedById);

      // Assert
      expect(result.message).toBe('Roles assigned successfully');
      expect(mockTransaction.userRole.upsert).not.toHaveBeenCalled();
      expect(mockTransaction.userRole.create).not.toHaveBeenCalled();
      expect(mockTransaction.roleAssignment.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for non-existent roles', async () => {
      // Arrange
      const invalidRolesDto: AssignRolesDto = {
        roles: ['INVALID_ROLE', 'ANOTHER_INVALID'],
        reason: 'Test invalid roles'
      };

      prismaService.role.findMany.mockResolvedValue([]); // No roles found

      // Act & Assert
      await expect(service.assignRoles(userId, invalidRolesDto, assignedById))
        .rejects.toThrow(BadRequestException);
      expect(prismaService.role.findMany).toHaveBeenCalledWith({
        where: { name: { in: invalidRolesDto.roles }, isActive: true }
      });
    });

    it('should throw BadRequestException for partially invalid roles', async () => {
      // Arrange
      const partiallyInvalidRolesDto: AssignRolesDto = {
        roles: ['INVESTOR', 'INVALID_ROLE'],
        reason: 'Test partially invalid roles'
      };

      prismaService.role.findMany.mockResolvedValue([mockRole]); // Only one valid role

      // Act & Assert
      await expect(service.assignRoles(userId, partiallyInvalidRolesDto, assignedById))
        .rejects.toThrow(BadRequestException);

      const error = await service.assignRoles(userId, partiallyInvalidRolesDto, assignedById)
        .catch(e => e);
      expect(error.message).toContain('Invalid roles: INVALID_ROLE');
    });

    it('should throw BadRequestException for inactive roles', async () => {
      // Arrange
      const inactiveRolesDto: AssignRolesDto = {
        roles: ['INACTIVE_ROLE'],
        reason: 'Test inactive role'
      };

      prismaService.role.findMany.mockResolvedValue([]); // Inactive role won't be found

      // Act & Assert
      await expect(service.assignRoles(userId, inactiveRolesDto, assignedById))
        .rejects.toThrow(BadRequestException);
    });

    it('should handle multiple roles assignment with mixed existing/new roles', async () => {
      // Arrange
      const multiRolesDto: AssignRolesDto = {
        roles: ['INVESTOR', 'ANALYST'],
        reason: 'Multiple roles assignment'
      };

      const mockRoles = [
        { ...mockRole, name: 'INVESTOR' },
        { id: 'role-456', name: 'ANALYST', isActive: true }
      ];

      prismaService.role.findMany.mockResolvedValue(mockRoles);

      const mockTransaction = {
        userRole: {
          findFirst: jest.fn()
            .mockResolvedValueOnce({ isActive: true }) // INVESTOR already assigned
            .mockResolvedValueOnce(null), // ANALYST not assigned
          upsert: jest.fn().mockResolvedValue({ id: 'new-user-role' })
        },
        roleAssignment: {
          create: jest.fn().mockResolvedValue({ id: 'assignment-123' })
        }
      };

      prismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockTransaction as any);
      });

      // Act
      const result = await service.assignRoles(userId, multiRolesDto, assignedById);

      // Assert
      expect(result.message).toBe('Roles assigned successfully');
      expect(mockTransaction.userRole.findFirst).toHaveBeenCalledTimes(2);
      expect(mockTransaction.userRole.upsert).toHaveBeenCalledTimes(1); // Only for ANALYST
      expect(mockTransaction.roleAssignment.create).toHaveBeenCalledTimes(1);
    });

    it('should handle concurrent role assignments gracefully', async () => {
      // Arrange
      prismaService.role.findMany.mockResolvedValue([mockRole]);

      const mockTransaction = {
        userRole: {
          findFirst: jest.fn().mockResolvedValue(null),
          upsert: jest.fn().mockRejectedValue(
            new PrismaClientKnownRequestError(
              'Unique constraint failed on the fields: (`userId`,`roleId`)',
              {
                code: 'P2002',
                clientVersion: '5.0.0',
                meta: { target: ['userId', 'roleId'] }
              }
            )
          )
        },
        roleAssignment: {
          create: jest.fn()
        }
      };

      prismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockTransaction as any);
      });

      // Act & Assert - Should handle the error and throw InternalServerErrorException
      await expect(service.assignRoles(userId, assignRolesDto, assignedById))
        .rejects.toThrow('Failed to assign roles');
    });

    it('should handle expiration date in role assignments', async () => {
      // Arrange
      const assignRolesWithExpirationDto: AssignRolesDto = {
        roles: ['INVESTOR'],
        reason: 'Test with expiration',
        expiresAt: new Date('2025-12-31T23:59:59Z').toISOString()
      };

      prismaService.role.findMany.mockResolvedValue([mockRole]);

      const mockTransaction = {
        userRole: {
          findFirst: jest.fn().mockResolvedValue(null),
          upsert: jest.fn().mockResolvedValue({ id: 'user-role-123' })
        },
        roleAssignment: {
          create: jest.fn().mockResolvedValue({ id: 'assignment-123' })
        }
      };

      prismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockTransaction as any);
      });

      // Act
      const result = await service.assignRoles(userId, assignRolesWithExpirationDto, assignedById);

      // Assert
      expect(result.message).toBe('Roles assigned successfully');
      expect(mockTransaction.roleAssignment.create).toHaveBeenCalledWith({
        data: {
          userId: userId,
          roleId: mockRole.id,
          assignedBy: assignedById,
          reason: assignRolesWithExpirationDto.reason,
          expiresAt: new Date(assignRolesWithExpirationDto.expiresAt),
          isActive: true
        }
      });
    });
  });

  describe('Role Revocation Tests', () => {
    // Note: The actual revokeRoles implementation differs from my initial assumptions
    // These tests verify edge cases around the role revocation business logic

    it('should validate roles exist before attempting revocation', async () => {
      // This test ensures that revokeRoles properly validates input
      // The actual implementation checks userRole.findMany first
      const revokeRolesDto = {
        roles: ['INVESTOR'],
        reason: 'Test revocation'
      };

      // Mock the case where user has no matching active roles
      prismaService.userRole.findMany.mockResolvedValue([]);

      // Act & Assert
      await expect(service.revokeRoles('user-123', revokeRolesDto, 'admin-123'))
        .rejects.toThrow(BadRequestException);
    });

    it('should prevent revoking all roles (business rule)', async () => {
      // This test verifies the business rule that users must have at least one role
      const revokeRolesDto = {
        roles: ['INVESTOR'],
        reason: 'Test revocation'
      };

      // Mock user has the role to be revoked
      prismaService.userRole.findMany.mockResolvedValue([{
        id: 'user-role-123',
        userId: 'user-123',
        roleId: mockRole.id,
        isActive: true,
        role: mockRole
      }]);

      // Mock that user would have no roles remaining
      prismaService.userRole.count.mockResolvedValue(0);

      // Act & Assert
      await expect(service.revokeRoles('user-123', revokeRolesDto, 'admin-123'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('Role Assignment Data Integrity', () => {
    it('should maintain referential integrity during role operations', async () => {
      // This test ensures that role assignments maintain proper relationships
      const assignRolesDto: AssignRolesDto = {
        roles: ['INVESTOR'],
        reason: 'Integrity test'
      };

      prismaService.role.findMany.mockResolvedValue([mockRole]);

      const mockTransaction = {
        userRole: {
          findFirst: jest.fn().mockResolvedValue(null),
          upsert: jest.fn().mockResolvedValue({ id: 'user-role-123' })
        },
        roleAssignment: {
          create: jest.fn().mockResolvedValue({
            id: 'assignment-123',
            userId: 'user-123',
            roleId: mockRole.id,
            assignedBy: 'admin-123'
          })
        }
      };

      prismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockTransaction as any);
      });

      // Act
      const result = await service.assignRoles('user-123', assignRolesDto, 'admin-123');

      // Assert
      expect(mockTransaction.roleAssignment.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          roleId: mockRole.id,
          assignedBy: 'admin-123',
          reason: assignRolesDto.reason,
          expiresAt: null,
          isActive: true
        }
      });
    });

    it('should handle database transaction rollback scenarios', async () => {
      // Arrange
      const assignRolesDto: AssignRolesDto = {
        roles: ['INVESTOR'],
        reason: 'Transaction rollback test'
      };

      prismaService.role.findMany.mockResolvedValue([mockRole]);
      prismaService.$transaction.mockRejectedValue(new Error('Transaction failed'));

      // Act & Assert
      await expect(service.assignRoles('user-123', assignRolesDto, 'admin-123'))
        .rejects.toThrow('Transaction failed');
    });
  });
});