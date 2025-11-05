import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from '../services/user.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { AuthenticatedUser } from '../../auth/interfaces/auth.interface';
import {
  CreateUserAdminDto,
  UpdateUserDto,
  UpdateUserStatusDto,
  UpdateUserVerificationDto,
  ResetPasswordDto,
  QueryUsersDto,
  UserStatsQueryDto,
  AssignRolesDto,
  RevokeRolesDto,
  BulkRoleOperationDto,
  QueryUserRolesDto,
} from '../dto';

describe('UserController', () => {
  let controller: UserController;
  let userService: jest.Mocked<UserService>;

  const mockAuthenticatedUser: AuthenticatedUser = {
    id: 'admin-user-123',
    email: 'admin@example.com',
    roles: ['SUPER_ADMIN'],
    permissions: ['USER:READ', 'USER:CREATE', 'USER:UPDATE', 'USER:DELETE'],
  };

  const mockRequest = {
    user: mockAuthenticatedUser,
  } as any;

  const mockUserService = {
    findAll: jest.fn(),
    getStatistics: jest.fn(),
    findOne: jest.fn(),
    createUserWithTempPassword: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    updateVerification: jest.fn(),
    resetPassword: jest.fn(),
    getUserRoles: jest.fn(),
    assignRoles: jest.fn(),
    revokeRoles: jest.fn(),
    bulkRoleOperation: jest.fn(),
    remove: jest.fn(),
    exportUsers: jest.fn(),
    getUserAuditLogs: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<UserController>(UserController);
    userService = module.get(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated list of users', async () => {
      // Arrange
      const query: QueryUsersDto = {
        page: 1,
        limit: 10,
        search: 'test',
      };

      const mockResult = {
        data: [
          {
            id: 'user-1',
            email: 'test1@example.com',
            firstName: 'Test',
            lastName: 'User',
          },
        ],
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      userService.findAll.mockResolvedValue(mockResult as any);

      // Act
      const result = await controller.findAll(query, mockRequest);

      // Assert
      expect(result).toEqual(mockResult);
      expect(userService.findAll).toHaveBeenCalledWith(query, mockAuthenticatedUser.id);
      expect(userService.findAll).toHaveBeenCalledTimes(1);
    });

    it('should pass empty query parameters', async () => {
      // Arrange
      const query: QueryUsersDto = {};
      const mockResult = {
        data: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };

      userService.findAll.mockResolvedValue(mockResult as any);

      // Act
      await controller.findAll(query, mockRequest);

      // Assert
      expect(userService.findAll).toHaveBeenCalledWith(query, mockAuthenticatedUser.id);
    });

    it('should handle filtering by status', async () => {
      // Arrange
      const query: QueryUsersDto = {
        isActive: true,
      };

      userService.findAll.mockResolvedValue({ data: [], meta: {} } as any);

      // Act
      await controller.findAll(query, mockRequest);

      // Assert
      expect(userService.findAll).toHaveBeenCalledWith(query, mockAuthenticatedUser.id);
    });
  });

  describe('getStats', () => {
    it('should return user statistics', async () => {
      // Arrange
      const query: UserStatsQueryDto = {
        period: '30d',
      };

      const mockStats = {
        totalUsers: 100,
        activeUsers: 85,
        inactiveUsers: 15,
        verifiedUsers: 90,
        unverifiedUsers: 10,
        usersByRole: {
          INVESTOR: 80,
          FUND_MANAGER: 15,
          SUPER_ADMIN: 5,
        },
      };

      userService.getStatistics.mockResolvedValue(mockStats as any);

      // Act
      const result = await controller.getStats(query, mockRequest);

      // Assert
      expect(result).toEqual(mockStats);
      expect(userService.getStatistics).toHaveBeenCalledWith(query);
      expect(userService.getStatistics).toHaveBeenCalledTimes(1);
    });

    it('should handle statistics query without period', async () => {
      // Arrange
      const query: UserStatsQueryDto = {};
      userService.getStatistics.mockResolvedValue({} as any);

      // Act
      await controller.getStats(query, mockRequest);

      // Assert
      expect(userService.getStatistics).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return detailed user information', async () => {
      // Arrange
      const userId = 'clfa2qhe40000j3gbahzp12s4';
      const mockUser = {
        id: userId,
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        profile: {
          phone: '+1234567890',
          timezone: 'America/New_York',
        },
        roles: ['INVESTOR'],
      };

      userService.findOne.mockResolvedValue(mockUser as any);

      // Act
      const result = await controller.findOne(userId, mockRequest);

      // Assert
      expect(result).toEqual(mockUser);
      expect(userService.findOne).toHaveBeenCalledWith(userId, mockAuthenticatedUser.id);
      expect(userService.findOne).toHaveBeenCalledTimes(1);
    });

    it('should handle non-existent user', async () => {
      // Arrange
      const userId = 'non-existent-user-id';
      userService.findOne.mockRejectedValue(new Error('User not found'));

      // Act & Assert
      await expect(controller.findOne(userId, mockRequest)).rejects.toThrow('User not found');
      expect(userService.findOne).toHaveBeenCalledWith(userId, mockAuthenticatedUser.id);
    });
  });

  describe('create', () => {
    it('should create a new user with temporary password', async () => {
      // Arrange
      const createUserDto: CreateUserAdminDto = {
        email: 'newuser@example.com',
        firstName: 'New',
        lastName: 'User',
        timezone: 'America/New_York',
        language: 'en',
        roles: ['INVESTOR'],
      };

      const mockResult = {
        user: {
          id: 'new-user-123',
          email: createUserDto.email,
          firstName: createUserDto.firstName,
          lastName: createUserDto.lastName,
        },
        temporaryPassword: 'TempPass123!@#',
        expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      };

      userService.createUserWithTempPassword.mockResolvedValue(mockResult as any);

      // Act
      const result = await controller.create(createUserDto, mockRequest);

      // Assert
      expect(result).toEqual(mockResult);
      expect(userService.createUserWithTempPassword).toHaveBeenCalledWith(
        createUserDto,
        mockAuthenticatedUser.id
      );
      expect(userService.createUserWithTempPassword).toHaveBeenCalledTimes(1);
    });

    it('should handle duplicate email error', async () => {
      // Arrange
      const createUserDto: CreateUserAdminDto = {
        email: 'existing@example.com',
        firstName: 'Existing',
        lastName: 'User',
        timezone: 'UTC',
        language: 'en',
        roles: ['INVESTOR'],
      };

      userService.createUserWithTempPassword.mockRejectedValue(
        new Error('Email already exists')
      );

      // Act & Assert
      await expect(controller.create(createUserDto, mockRequest)).rejects.toThrow(
        'Email already exists'
      );
      expect(userService.createUserWithTempPassword).toHaveBeenCalledWith(
        createUserDto,
        mockAuthenticatedUser.id
      );
    });

    it('should create user with default role when roles not provided', async () => {
      // Arrange
      const createUserDto: CreateUserAdminDto = {
        email: 'newuser2@example.com',
        firstName: 'New',
        lastName: 'User2',
        timezone: 'UTC',
        language: 'en',
      };

      userService.createUserWithTempPassword.mockResolvedValue({
        user: { id: 'new-user-456', roles: ['INVESTOR'] },
      } as any);

      // Act
      await controller.create(createUserDto, mockRequest);

      // Assert
      expect(userService.createUserWithTempPassword).toHaveBeenCalledWith(
        createUserDto,
        mockAuthenticatedUser.id
      );
    });
  });

  describe('update', () => {
    it('should update user information', async () => {
      // Arrange
      const userId = 'user-to-update';
      const updateUserDto: UpdateUserDto = {
        firstName: 'Updated',
        lastName: 'Name',
        language: 'es',
      };

      const mockUpdatedUser = {
        id: userId,
        email: 'user@example.com',
        firstName: updateUserDto.firstName,
        lastName: updateUserDto.lastName,
        language: updateUserDto.language,
      };

      userService.update.mockResolvedValue(mockUpdatedUser as any);

      // Act
      const result = await controller.update(userId, updateUserDto, mockRequest);

      // Assert
      expect(result).toEqual(mockUpdatedUser);
      expect(userService.update).toHaveBeenCalledWith(
        userId,
        updateUserDto,
        mockAuthenticatedUser.id
      );
      expect(userService.update).toHaveBeenCalledTimes(1);
    });

    it('should handle email conflict during update', async () => {
      // Arrange
      const userId = 'user-123';
      const updateUserDto: UpdateUserDto = {
        email: 'conflicting@example.com',
      };

      userService.update.mockRejectedValue(new Error('Email already exists'));

      // Act & Assert
      await expect(controller.update(userId, updateUserDto, mockRequest)).rejects.toThrow(
        'Email already exists'
      );
      expect(userService.update).toHaveBeenCalledWith(
        userId,
        updateUserDto,
        mockAuthenticatedUser.id
      );
    });

    it('should update user preferences', async () => {
      // Arrange
      const userId = 'user-456';
      const updateUserDto: UpdateUserDto = {
        timezone: 'Europe/London',
        language: 'en-GB',
      };

      userService.update.mockResolvedValue({
        id: userId,
        timezone: updateUserDto.timezone,
        language: updateUserDto.language,
      } as any);

      // Act
      await controller.update(userId, updateUserDto, mockRequest);

      // Assert
      expect(userService.update).toHaveBeenCalledWith(
        userId,
        updateUserDto,
        mockAuthenticatedUser.id
      );
    });
  });

  describe('updateStatus', () => {
    it('should activate a user', async () => {
      // Arrange
      const userId = 'inactive-user';
      const updateStatusDto: UpdateUserStatusDto = {
        isActive: true,
        reason: 'Account reactivation requested',
      };

      const mockResult = {
        id: userId,
        email: 'user@example.com',
        isActive: true,
      };

      userService.updateStatus.mockResolvedValue(mockResult as any);

      // Act
      const result = await controller.updateStatus(userId, updateStatusDto, mockRequest);

      // Assert
      expect(result).toEqual(mockResult);
      expect(userService.updateStatus).toHaveBeenCalledWith(
        userId,
        updateStatusDto,
        mockAuthenticatedUser.id
      );
      expect(userService.updateStatus).toHaveBeenCalledTimes(1);
    });

    it('should deactivate a user', async () => {
      // Arrange
      const userId = 'active-user';
      const updateStatusDto: UpdateUserStatusDto = {
        isActive: false,
        reason: 'Policy violation',
      };

      const mockResult = {
        id: userId,
        email: 'user@example.com',
        isActive: false,
      };

      userService.updateStatus.mockResolvedValue(mockResult as any);

      // Act
      const result = await controller.updateStatus(userId, updateStatusDto, mockRequest);

      // Assert
      expect(result).toEqual(mockResult);
      expect(userService.updateStatus).toHaveBeenCalledWith(
        userId,
        updateStatusDto,
        mockAuthenticatedUser.id
      );
    });

    it('should handle self-deactivation prevention', async () => {
      // Arrange
      const userId = mockAuthenticatedUser.id;
      const updateStatusDto: UpdateUserStatusDto = {
        isActive: false,
      };

      userService.updateStatus.mockRejectedValue(new Error('Cannot deactivate own account'));

      // Act & Assert
      await expect(
        controller.updateStatus(userId, updateStatusDto, mockRequest)
      ).rejects.toThrow('Cannot deactivate own account');
    });
  });

  describe('updateVerification', () => {
    it('should mark user email as verified', async () => {
      // Arrange
      const userId = 'unverified-user';
      const updateVerificationDto: UpdateUserVerificationDto = {
        isVerified: true,
        reason: 'Manual verification by admin',
      };

      const mockResult = {
        id: userId,
        email: 'user@example.com',
        isVerified: true,
      };

      userService.updateVerification.mockResolvedValue(mockResult as any);

      // Act
      const result = await controller.updateVerification(
        userId,
        updateVerificationDto,
        mockRequest
      );

      // Assert
      expect(result).toEqual(mockResult);
      expect(userService.updateVerification).toHaveBeenCalledWith(
        userId,
        updateVerificationDto,
        mockAuthenticatedUser.id
      );
      expect(userService.updateVerification).toHaveBeenCalledTimes(1);
    });

    it('should mark user email as unverified', async () => {
      // Arrange
      const userId = 'verified-user';
      const updateVerificationDto: UpdateUserVerificationDto = {
        isVerified: false,
        reason: 'Email bounce detected',
      };

      userService.updateVerification.mockResolvedValue({
        id: userId,
        isVerified: false,
      } as any);

      // Act
      await controller.updateVerification(userId, updateVerificationDto, mockRequest);

      // Assert
      expect(userService.updateVerification).toHaveBeenCalledWith(
        userId,
        updateVerificationDto,
        mockAuthenticatedUser.id
      );
    });
  });

  describe('resetPassword', () => {
    it('should reset user password and return temporary password', async () => {
      // Arrange
      const userId = 'user-reset-password';
      const resetPasswordDto: ResetPasswordDto = {
        reason: 'User forgot password',
        sendEmail: true,
      };

      const mockResult = {
        message: 'Password reset successfully',
        temporaryPassword: 'NewTempPass123!',
      };

      userService.resetPassword.mockResolvedValue(mockResult);

      // Act
      const result = await controller.resetPassword(userId, resetPasswordDto, mockRequest);

      // Assert
      expect(result).toEqual(mockResult);
      expect(userService.resetPassword).toHaveBeenCalledWith(
        userId,
        resetPasswordDto,
        mockAuthenticatedUser.id
      );
      expect(userService.resetPassword).toHaveBeenCalledTimes(1);
    });

    it('should handle password reset without sending email', async () => {
      // Arrange
      const userId = 'user-123';
      const resetPasswordDto: ResetPasswordDto = {
        reason: 'Admin-initiated reset',
        sendEmail: false,
      };

      userService.resetPassword.mockResolvedValue({
        message: 'Password reset successfully',
        temporaryPassword: 'TempPass456!',
      });

      // Act
      await controller.resetPassword(userId, resetPasswordDto, mockRequest);

      // Assert
      expect(userService.resetPassword).toHaveBeenCalledWith(
        userId,
        resetPasswordDto,
        mockAuthenticatedUser.id
      );
    });

    it('should prevent resetting own password', async () => {
      // Arrange
      const userId = mockAuthenticatedUser.id;
      const resetPasswordDto: ResetPasswordDto = {
        reason: 'Self reset attempt',
      };

      userService.resetPassword.mockRejectedValue(
        new Error('Cannot reset own password through this endpoint')
      );

      // Act & Assert
      await expect(
        controller.resetPassword(userId, resetPasswordDto, mockRequest)
      ).rejects.toThrow('Cannot reset own password through this endpoint');
    });
  });

  describe('getUserRoles', () => {
    it('should return user roles', async () => {
      // Arrange
      const userId = 'user-with-roles';
      const query: QueryUserRolesDto = {
        includePermissions: true,
      };

      const mockRoles = {
        userId,
        roles: [
          {
            id: 'role-1',
            name: 'INVESTOR',
            assignedAt: new Date().toISOString(),
            permissions: ['INVESTMENT:READ', 'DOCUMENT:READ'],
          },
        ],
      };

      userService.getUserRoles.mockResolvedValue(mockRoles as any);

      // Act
      const result = await controller.getUserRoles(userId, query, mockRequest);

      // Assert
      expect(result).toEqual(mockRoles);
      expect(userService.getUserRoles).toHaveBeenCalledWith(userId, query);
      expect(userService.getUserRoles).toHaveBeenCalledTimes(1);
    });

    it('should get roles without permissions', async () => {
      // Arrange
      const userId = 'user-456';
      const query: QueryUserRolesDto = {
        includePermissions: false,
      };

      userService.getUserRoles.mockResolvedValue({ roles: [] } as any);

      // Act
      await controller.getUserRoles(userId, query, mockRequest);

      // Assert
      expect(userService.getUserRoles).toHaveBeenCalledWith(userId, query);
    });
  });

  describe('assignRoles', () => {
    it('should assign roles to user', async () => {
      // Arrange
      const userId = 'user-to-assign-roles';
      const assignRolesDto: AssignRolesDto = {
        roles: ['FUND_MANAGER', 'COMPLIANCE_OFFICER'],
        reason: 'Promotion to fund manager',
      };

      const mockResult = {
        userId,
        assignedRoles: assignRolesDto.roles,
        message: 'Roles assigned successfully',
      };

      userService.assignRoles.mockResolvedValue(mockResult as any);

      // Act
      const result = await controller.assignRoles(userId, assignRolesDto, mockRequest);

      // Assert
      expect(result).toEqual(mockResult);
      expect(userService.assignRoles).toHaveBeenCalledWith(
        userId,
        assignRolesDto,
        mockAuthenticatedUser.id
      );
      expect(userService.assignRoles).toHaveBeenCalledTimes(1);
    });

    it('should assign single role to user', async () => {
      // Arrange
      const userId = 'user-789';
      const assignRolesDto: AssignRolesDto = {
        roles: ['INVESTOR'],
      };

      userService.assignRoles.mockResolvedValue({
        userId,
        assignedRoles: ['INVESTOR'],
      } as any);

      // Act
      await controller.assignRoles(userId, assignRolesDto, mockRequest);

      // Assert
      expect(userService.assignRoles).toHaveBeenCalledWith(
        userId,
        assignRolesDto,
        mockAuthenticatedUser.id
      );
    });

    it('should handle invalid role assignment', async () => {
      // Arrange
      const userId = 'user-123';
      const assignRolesDto: AssignRolesDto = {
        roles: ['INVALID_ROLE'],
      };

      userService.assignRoles.mockRejectedValue(new Error('Invalid role'));

      // Act & Assert
      await expect(
        controller.assignRoles(userId, assignRolesDto, mockRequest)
      ).rejects.toThrow('Invalid role');
    });
  });

  describe('revokeRoles', () => {
    it('should revoke roles from user', async () => {
      // Arrange
      const userId = 'user-to-revoke-roles';
      const revokeRolesDto: RevokeRolesDto = {
        roles: ['FUND_MANAGER'],
        reason: 'Role no longer needed',
      };

      const mockResult = {
        userId,
        revokedRoles: revokeRolesDto.roles,
        message: 'Roles revoked successfully',
      };

      userService.revokeRoles.mockResolvedValue(mockResult as any);

      // Act
      const result = await controller.revokeRoles(userId, revokeRolesDto, mockRequest);

      // Assert
      expect(result).toEqual(mockResult);
      expect(userService.revokeRoles).toHaveBeenCalledWith(
        userId,
        revokeRolesDto,
        mockAuthenticatedUser.id
      );
      expect(userService.revokeRoles).toHaveBeenCalledTimes(1);
    });

    it('should handle revoking multiple roles', async () => {
      // Arrange
      const userId = 'user-multi-roles';
      const revokeRolesDto: RevokeRolesDto = {
        roles: ['FUND_MANAGER', 'COMPLIANCE_OFFICER'],
        reason: 'Restructuring',
      };

      userService.revokeRoles.mockResolvedValue({
        userId,
        revokedRoles: revokeRolesDto.roles,
      } as any);

      // Act
      await controller.revokeRoles(userId, revokeRolesDto, mockRequest);

      // Assert
      expect(userService.revokeRoles).toHaveBeenCalledWith(
        userId,
        revokeRolesDto,
        mockAuthenticatedUser.id
      );
    });

    it('should prevent revoking all roles', async () => {
      // Arrange
      const userId = 'user-last-role';
      const revokeRolesDto: RevokeRolesDto = {
        roles: ['INVESTOR'],
      };

      userService.revokeRoles.mockRejectedValue(
        new Error('Cannot revoke all roles - user must have at least one role')
      );

      // Act & Assert
      await expect(
        controller.revokeRoles(userId, revokeRolesDto, mockRequest)
      ).rejects.toThrow('Cannot revoke all roles - user must have at least one role');
    });
  });

  describe('bulkRoleOperation', () => {
    it('should perform bulk role assignment', async () => {
      // Arrange
      const bulkRoleOperationDto: BulkRoleOperationDto = {
        operation: 'assign',
        userIds: ['user-1', 'user-2', 'user-3'],
        roles: ['INVESTOR'],
        reason: 'Bulk investor onboarding',
      };

      const mockResult = {
        success: true,
        totalUsers: 3,
        successCount: 3,
        failureCount: 0,
        results: [
          { userId: 'user-1', success: true },
          { userId: 'user-2', success: true },
          { userId: 'user-3', success: true },
        ],
      };

      userService.bulkRoleOperation.mockResolvedValue(mockResult as any);

      // Act
      const result = await controller.bulkRoleOperation(bulkRoleOperationDto, mockRequest);

      // Assert
      expect(result).toEqual(mockResult);
      expect(userService.bulkRoleOperation).toHaveBeenCalledWith(
        bulkRoleOperationDto,
        mockAuthenticatedUser.id
      );
      expect(userService.bulkRoleOperation).toHaveBeenCalledTimes(1);
    });

    it('should perform bulk role revocation', async () => {
      // Arrange
      const bulkRoleOperationDto: BulkRoleOperationDto = {
        operation: 'revoke',
        userIds: ['user-4', 'user-5'],
        roles: ['FUND_MANAGER'],
        reason: 'Role cleanup',
      };

      userService.bulkRoleOperation.mockResolvedValue({
        success: true,
        totalUsers: 2,
        successCount: 2,
        failureCount: 0,
      } as any);

      // Act
      await controller.bulkRoleOperation(bulkRoleOperationDto, mockRequest);

      // Assert
      expect(userService.bulkRoleOperation).toHaveBeenCalledWith(
        bulkRoleOperationDto,
        mockAuthenticatedUser.id
      );
    });

    it('should handle partial success in bulk operations', async () => {
      // Arrange
      const bulkRoleOperationDto: BulkRoleOperationDto = {
        operation: 'assign',
        userIds: ['user-1', 'invalid-user', 'user-3'],
        roles: ['COMPLIANCE_OFFICER'],
      };

      const mockResult = {
        success: false,
        totalUsers: 3,
        successCount: 2,
        failureCount: 1,
        results: [
          { userId: 'user-1', success: true },
          { userId: 'invalid-user', success: false, error: 'User not found' },
          { userId: 'user-3', success: true },
        ],
      };

      userService.bulkRoleOperation.mockResolvedValue(mockResult as any);

      // Act
      const result = await controller.bulkRoleOperation(bulkRoleOperationDto, mockRequest);

      // Assert
      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(1);
      expect(userService.bulkRoleOperation).toHaveBeenCalledWith(
        bulkRoleOperationDto,
        mockAuthenticatedUser.id
      );
    });
  });

  describe('remove', () => {
    it('should soft delete a user', async () => {
      // Arrange
      const userId = 'user-to-delete';
      const mockResult = {
        message: 'User successfully deleted',
        deactivatedAt: new Date().toISOString(),
      };

      userService.remove.mockResolvedValue(mockResult);

      // Act
      const result = await controller.remove(userId, mockRequest);

      // Assert
      expect(result).toEqual(mockResult);
      expect(userService.remove).toHaveBeenCalledWith(userId, mockAuthenticatedUser.id);
      expect(userService.remove).toHaveBeenCalledTimes(1);
    });

    it('should prevent deleting own account', async () => {
      // Arrange
      const userId = mockAuthenticatedUser.id;

      userService.remove.mockRejectedValue(new Error('Cannot delete own account'));

      // Act & Assert
      await expect(controller.remove(userId, mockRequest)).rejects.toThrow(
        'Cannot delete own account'
      );
      expect(userService.remove).toHaveBeenCalledWith(userId, mockAuthenticatedUser.id);
    });

    it('should handle non-existent user deletion', async () => {
      // Arrange
      const userId = 'non-existent-user';

      userService.remove.mockRejectedValue(new Error('User not found'));

      // Act & Assert
      await expect(controller.remove(userId, mockRequest)).rejects.toThrow('User not found');
    });
  });

  describe('exportUsers', () => {
    it('should export users data with filters', async () => {
      // Arrange
      const query: QueryUsersDto = {
        isActive: true,
        isVerified: true,
      };

      const mockExportResult = {
        downloadUrl: 'https://example.com/export/users-20250105.csv',
        fileName: 'users-20250105.csv',
        format: 'csv',
        totalRecords: 100,
      };

      userService.exportUsers.mockResolvedValue(mockExportResult as any);

      // Act
      const result = await controller.exportUsers(query, mockRequest);

      // Assert
      expect(result).toEqual(mockExportResult);
      expect(userService.exportUsers).toHaveBeenCalledWith(query, mockAuthenticatedUser.id);
      expect(userService.exportUsers).toHaveBeenCalledTimes(1);
    });

    it('should export all users without filters', async () => {
      // Arrange
      const query: QueryUsersDto = {};

      userService.exportUsers.mockResolvedValue({
        downloadUrl: 'https://example.com/export/all-users.csv',
        totalRecords: 500,
      } as any);

      // Act
      await controller.exportUsers(query, mockRequest);

      // Assert
      expect(userService.exportUsers).toHaveBeenCalledWith(query, mockAuthenticatedUser.id);
    });

    it('should handle export with date range filter', async () => {
      // Arrange
      const query: QueryUsersDto = {
        createdFrom: new Date('2025-01-01').toISOString(),
        createdTo: new Date('2025-01-31').toISOString(),
      };

      userService.exportUsers.mockResolvedValue({
        downloadUrl: 'https://example.com/export/users-january.csv',
      } as any);

      // Act
      await controller.exportUsers(query, mockRequest);

      // Assert
      expect(userService.exportUsers).toHaveBeenCalledWith(query, mockAuthenticatedUser.id);
    });
  });

  describe('getUserAuditLogs', () => {
    it('should return user audit logs with default parameters', async () => {
      // Arrange
      const userId = 'user-audit-logs';
      const mockAuditLogs = {
        userId,
        logs: [
          {
            id: 'log-1',
            action: 'LOGIN',
            timestamp: new Date().toISOString(),
            ipAddress: '192.168.1.1',
          },
          {
            id: 'log-2',
            action: 'PROFILE_UPDATE',
            timestamp: new Date().toISOString(),
            ipAddress: '192.168.1.1',
          },
        ],
        total: 2,
      };

      userService.getUserAuditLogs.mockResolvedValue(mockAuditLogs as any);

      // Act
      const result = await controller.getUserAuditLogs(userId, mockRequest);

      // Assert
      expect(result).toEqual(mockAuditLogs);
      expect(userService.getUserAuditLogs).toHaveBeenCalledWith(
        userId,
        { days: undefined, limit: undefined, action: undefined },
        mockAuthenticatedUser.id
      );
      expect(userService.getUserAuditLogs).toHaveBeenCalledTimes(1);
    });

    it('should return audit logs with custom time period', async () => {
      // Arrange
      const userId = 'user-123';
      const days = 7;

      userService.getUserAuditLogs.mockResolvedValue({ logs: [] } as any);

      // Act
      await controller.getUserAuditLogs(userId, mockRequest, days);

      // Assert
      expect(userService.getUserAuditLogs).toHaveBeenCalledWith(
        userId,
        { days: 7, limit: undefined, action: undefined },
        mockAuthenticatedUser.id
      );
    });

    it('should filter audit logs by action type', async () => {
      // Arrange
      const userId = 'user-456';
      const action = 'PASSWORD_RESET';

      userService.getUserAuditLogs.mockResolvedValue({
        userId,
        logs: [
          {
            id: 'log-3',
            action: 'PASSWORD_RESET',
            timestamp: new Date().toISOString(),
          },
        ],
      } as any);

      // Act
      await controller.getUserAuditLogs(userId, mockRequest, undefined, undefined, action);

      // Assert
      expect(userService.getUserAuditLogs).toHaveBeenCalledWith(
        userId,
        { days: undefined, limit: undefined, action: 'PASSWORD_RESET' },
        mockAuthenticatedUser.id
      );
    });

    it('should limit the number of audit logs returned', async () => {
      // Arrange
      const userId = 'user-789';
      const limit = 10;

      userService.getUserAuditLogs.mockResolvedValue({ logs: [] } as any);

      // Act
      await controller.getUserAuditLogs(userId, mockRequest, undefined, limit);

      // Assert
      expect(userService.getUserAuditLogs).toHaveBeenCalledWith(
        userId,
        { days: undefined, limit: 10, action: undefined },
        mockAuthenticatedUser.id
      );
    });

    it('should handle all query parameters together', async () => {
      // Arrange
      const userId = 'user-complete';
      const days = 90;
      const limit = 100;
      const action = 'LOGIN';

      userService.getUserAuditLogs.mockResolvedValue({ logs: [] } as any);

      // Act
      await controller.getUserAuditLogs(userId, mockRequest, days, limit, action);

      // Assert
      expect(userService.getUserAuditLogs).toHaveBeenCalledWith(
        userId,
        { days: 90, limit: 100, action: 'LOGIN' },
        mockAuthenticatedUser.id
      );
    });
  });

  describe('controller initialization', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should have userService injected', () => {
      expect(controller['userService']).toBeDefined();
    });

    it('should have logger initialized', () => {
      expect(controller['logger']).toBeDefined();
    });
  });
});
