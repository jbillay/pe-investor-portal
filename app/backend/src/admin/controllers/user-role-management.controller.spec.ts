import { Test, TestingModule } from '@nestjs/testing';
import { UserRoleManagementController } from './user-role-management.controller';
import { UserRoleSetupService } from '../services/user-role-setup.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../guards/role.guard';
import { AuthenticatedUser } from '../../auth/interfaces/auth.interface';

describe('UserRoleManagementController', () => {
  let controller: UserRoleManagementController;
  let userRoleSetupService: jest.Mocked<UserRoleSetupService>;

  const mockAuthenticatedUser: AuthenticatedUser = {
    id: 'admin-user-123',
    email: 'admin@example.com',
    roles: ['SUPER_ADMIN'],
    permissions: ['USER:MANAGE', 'ROLE:ASSIGN'],
  };

  const mockUserRoleSetupService = {
    promoteUserToFundManager: jest.fn(),
    assignComplianceOfficerRole: jest.fn(),
    bulkAssignRolesToUsers: jest.fn(),
    initializeUserPermissions: jest.fn(),
    checkUserAccess: jest.fn(),
    getUserEffectivePermissions: jest.fn(),
    getRecommendedRoleForUser: jest.fn(),
    removeAllUserRoles: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserRoleManagementController],
      providers: [
        {
          provide: UserRoleSetupService,
          useValue: mockUserRoleSetupService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RoleGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<UserRoleManagementController>(UserRoleManagementController);
    userRoleSetupService = module.get(UserRoleSetupService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('assignRoleToUser', () => {
    it('should assign FUND_MANAGER role to user', async () => {
      // Arrange
      const assignDto = {
        userId: 'user-123',
        roleName: 'FUND_MANAGER',
        reason: 'Promotion to fund manager position',
      };

      userRoleSetupService.promoteUserToFundManager.mockResolvedValue(undefined);

      // Act
      const result = await controller.assignRoleToUser(assignDto, mockAuthenticatedUser);

      // Assert
      expect(result).toEqual({
        message: 'Successfully assigned FUND_MANAGER role to user',
        userId: 'user-123',
        roleName: 'FUND_MANAGER',
      });
      expect(userRoleSetupService.promoteUserToFundManager).toHaveBeenCalledWith(
        'user-123',
        mockAuthenticatedUser.id,
        { reason: 'Promotion to fund manager position' }
      );
      expect(userRoleSetupService.promoteUserToFundManager).toHaveBeenCalledTimes(1);
    });

    it('should assign FUND_MANAGER role without reason', async () => {
      // Arrange
      const assignDto = {
        userId: 'user-456',
        roleName: 'FUND_MANAGER',
      };

      userRoleSetupService.promoteUserToFundManager.mockResolvedValue(undefined);

      // Act
      const result = await controller.assignRoleToUser(assignDto, mockAuthenticatedUser);

      // Assert
      expect(result.roleName).toBe('FUND_MANAGER');
      expect(userRoleSetupService.promoteUserToFundManager).toHaveBeenCalledWith(
        'user-456',
        mockAuthenticatedUser.id,
        { reason: undefined }
      );
    });

    it('should assign COMPLIANCE_OFFICER role to user', async () => {
      // Arrange
      const assignDto = {
        userId: 'user-789',
        roleName: 'COMPLIANCE_OFFICER',
        reason: 'Assigned to compliance team',
      };

      userRoleSetupService.assignComplianceOfficerRole.mockResolvedValue(undefined);

      // Act
      const result = await controller.assignRoleToUser(assignDto, mockAuthenticatedUser);

      // Assert
      expect(result).toEqual({
        message: 'Successfully assigned COMPLIANCE_OFFICER role to user',
        userId: 'user-789',
        roleName: 'COMPLIANCE_OFFICER',
      });
      expect(userRoleSetupService.assignComplianceOfficerRole).toHaveBeenCalledWith(
        'user-789',
        mockAuthenticatedUser.id,
        { reason: 'Assigned to compliance team' }
      );
      expect(userRoleSetupService.assignComplianceOfficerRole).toHaveBeenCalledTimes(1);
    });

    it('should assign COMPLIANCE_OFFICER role without reason', async () => {
      // Arrange
      const assignDto = {
        userId: 'user-321',
        roleName: 'COMPLIANCE_OFFICER',
      };

      userRoleSetupService.assignComplianceOfficerRole.mockResolvedValue(undefined);

      // Act
      await controller.assignRoleToUser(assignDto, mockAuthenticatedUser);

      // Assert
      expect(userRoleSetupService.assignComplianceOfficerRole).toHaveBeenCalledWith(
        'user-321',
        mockAuthenticatedUser.id,
        { reason: undefined }
      );
    });

    it('should throw error for unsupported role type', async () => {
      // Arrange
      const assignDto = {
        userId: 'user-999',
        roleName: 'INVESTOR',
      };

      // Act & Assert
      await expect(
        controller.assignRoleToUser(assignDto, mockAuthenticatedUser)
      ).rejects.toThrow('Generic role assignment not yet implemented');
      expect(userRoleSetupService.promoteUserToFundManager).not.toHaveBeenCalled();
      expect(userRoleSetupService.assignComplianceOfficerRole).not.toHaveBeenCalled();
    });

    it('should throw error for unsupported custom role', async () => {
      // Arrange
      const assignDto = {
        userId: 'user-888',
        roleName: 'CUSTOM_ROLE',
      };

      // Act & Assert
      await expect(
        controller.assignRoleToUser(assignDto, mockAuthenticatedUser)
      ).rejects.toThrow('Generic role assignment not yet implemented');
    });

    it('should handle service error when assigning FUND_MANAGER role', async () => {
      // Arrange
      const assignDto = {
        userId: 'user-error',
        roleName: 'FUND_MANAGER',
      };

      userRoleSetupService.promoteUserToFundManager.mockRejectedValue(
        new Error('User not found')
      );

      // Act & Assert
      await expect(
        controller.assignRoleToUser(assignDto, mockAuthenticatedUser)
      ).rejects.toThrow('User not found');
    });
  });

  describe('bulkAssignRoles', () => {
    it('should assign roles to multiple users', async () => {
      // Arrange
      const bulkDto = {
        assignments: [
          {
            userId: 'user-1',
            roleName: 'FUND_MANAGER',
            reason: 'Promotion',
          },
          {
            userId: 'user-2',
            roleName: 'COMPLIANCE_OFFICER',
            reason: 'New hire',
          },
        ],
      };

      const mockResult = {
        successCount: 2,
        failures: [],
      };

      userRoleSetupService.bulkAssignRolesToUsers.mockResolvedValue(mockResult as any);

      // Act
      const result = await controller.bulkAssignRoles(bulkDto, mockAuthenticatedUser);

      // Assert
      expect(result).toEqual(mockResult);
      expect(userRoleSetupService.bulkAssignRolesToUsers).toHaveBeenCalledWith([
        {
          userId: 'user-1',
          roleName: 'FUND_MANAGER',
          assignedBy: mockAuthenticatedUser.id,
          metadata: { reason: 'Promotion' },
        },
        {
          userId: 'user-2',
          roleName: 'COMPLIANCE_OFFICER',
          assignedBy: mockAuthenticatedUser.id,
          metadata: { reason: 'New hire' },
        },
      ]);
      expect(userRoleSetupService.bulkAssignRolesToUsers).toHaveBeenCalledTimes(1);
    });

    it('should handle bulk assignment without reasons', async () => {
      // Arrange
      const bulkDto = {
        assignments: [
          {
            userId: 'user-3',
            roleName: 'FUND_MANAGER',
          },
          {
            userId: 'user-4',
            roleName: 'COMPLIANCE_OFFICER',
          },
        ],
      };

      userRoleSetupService.bulkAssignRolesToUsers.mockResolvedValue({
        successCount: 2,
        failures: [],
      } as any);

      // Act
      await controller.bulkAssignRoles(bulkDto, mockAuthenticatedUser);

      // Assert
      expect(userRoleSetupService.bulkAssignRolesToUsers).toHaveBeenCalledWith([
        {
          userId: 'user-3',
          roleName: 'FUND_MANAGER',
          assignedBy: mockAuthenticatedUser.id,
          metadata: { reason: undefined },
        },
        {
          userId: 'user-4',
          roleName: 'COMPLIANCE_OFFICER',
          assignedBy: mockAuthenticatedUser.id,
          metadata: { reason: undefined },
        },
      ]);
    });

    it('should handle partial failures in bulk assignment', async () => {
      // Arrange
      const bulkDto = {
        assignments: [
          { userId: 'user-1', roleName: 'FUND_MANAGER' },
          { userId: 'invalid-user', roleName: 'COMPLIANCE_OFFICER' },
          { userId: 'user-3', roleName: 'FUND_MANAGER' },
        ],
      };

      const mockResult = {
        successCount: 2,
        failures: [
          {
            userId: 'invalid-user',
            error: 'User not found',
          },
        ],
      };

      userRoleSetupService.bulkAssignRolesToUsers.mockResolvedValue(mockResult as any);

      // Act
      const result = await controller.bulkAssignRoles(bulkDto, mockAuthenticatedUser);

      // Assert
      expect(result.successCount).toBe(2);
      expect(result.failures).toHaveLength(1);
      expect(result.failures[0].userId).toBe('invalid-user');
    });

    it('should handle empty assignments array', async () => {
      // Arrange
      const bulkDto = {
        assignments: [],
      };

      userRoleSetupService.bulkAssignRolesToUsers.mockResolvedValue({
        successCount: 0,
        failures: [],
      } as any);

      // Act
      const result = await controller.bulkAssignRoles(bulkDto, mockAuthenticatedUser);

      // Assert
      expect(result.successCount).toBe(0);
      expect(userRoleSetupService.bulkAssignRolesToUsers).toHaveBeenCalledWith([]);
    });
  });

  describe('initializeUserPermissions', () => {
    it('should initialize permissions for specified user', async () => {
      // Arrange
      const userId = 'user-to-initialize';
      userRoleSetupService.initializeUserPermissions.mockResolvedValue(undefined);

      // Act
      const result = await controller.initializeUserPermissions(userId);

      // Assert
      expect(result).toEqual({
        message: 'User permissions initialized successfully',
        userId: 'user-to-initialize',
      });
      expect(userRoleSetupService.initializeUserPermissions).toHaveBeenCalledWith(userId);
      expect(userRoleSetupService.initializeUserPermissions).toHaveBeenCalledTimes(1);
    });

    it('should handle non-existent user initialization', async () => {
      // Arrange
      const userId = 'non-existent-user';
      userRoleSetupService.initializeUserPermissions.mockRejectedValue(
        new Error('User not found')
      );

      // Act & Assert
      await expect(controller.initializeUserPermissions(userId)).rejects.toThrow(
        'User not found'
      );
    });
  });

  describe('initializeCurrentUserPermissions', () => {
    it('should initialize permissions for current user', async () => {
      // Arrange
      userRoleSetupService.initializeUserPermissions.mockResolvedValue(undefined);

      // Act
      const result = await controller.initializeCurrentUserPermissions(mockAuthenticatedUser);

      // Assert
      expect(result).toEqual({
        message: 'Your permissions have been initialized successfully',
        userId: mockAuthenticatedUser.id,
      });
      expect(userRoleSetupService.initializeUserPermissions).toHaveBeenCalledWith(
        mockAuthenticatedUser.id
      );
      expect(userRoleSetupService.initializeUserPermissions).toHaveBeenCalledTimes(1);
    });

    it('should handle initialization error for current user', async () => {
      // Arrange
      userRoleSetupService.initializeUserPermissions.mockRejectedValue(
        new Error('Initialization failed')
      );

      // Act & Assert
      await expect(
        controller.initializeCurrentUserPermissions(mockAuthenticatedUser)
      ).rejects.toThrow('Initialization failed');
    });
  });

  describe('checkUserAccess', () => {
    it('should check user access to resource and action', async () => {
      // Arrange
      const userId = 'user-check-access';
      const checkDto = {
        resource: 'FUND',
        action: 'READ',
      };

      const mockAccessResult = {
        hasAccess: true,
        permissions: ['FUND:READ', 'FUND:LIST'],
        roles: ['INVESTOR'],
      };

      userRoleSetupService.checkUserAccess.mockResolvedValue(mockAccessResult as any);

      // Act
      const result = await controller.checkUserAccess(userId, checkDto);

      // Assert
      expect(result).toEqual(mockAccessResult);
      expect(userRoleSetupService.checkUserAccess).toHaveBeenCalledWith(
        userId,
        'FUND',
        'READ'
      );
      expect(userRoleSetupService.checkUserAccess).toHaveBeenCalledTimes(1);
    });

    it('should return no access when user lacks permissions', async () => {
      // Arrange
      const userId = 'user-no-access';
      const checkDto = {
        resource: 'ADMIN_PANEL',
        action: 'ACCESS',
      };

      const mockAccessResult = {
        hasAccess: false,
        permissions: [],
        roles: ['INVESTOR'],
      };

      userRoleSetupService.checkUserAccess.mockResolvedValue(mockAccessResult as any);

      // Act
      const result = await controller.checkUserAccess(userId, checkDto);

      // Assert
      expect(result.hasAccess).toBe(false);
      expect(userRoleSetupService.checkUserAccess).toHaveBeenCalledWith(
        userId,
        'ADMIN_PANEL',
        'ACCESS'
      );
    });

    it('should handle various resource and action combinations', async () => {
      // Arrange
      const userId = 'user-123';
      const checkDto = {
        resource: 'DOCUMENT',
        action: 'UPDATE',
      };

      userRoleSetupService.checkUserAccess.mockResolvedValue({
        hasAccess: true,
        permissions: ['DOCUMENT:UPDATE'],
        roles: ['FUND_MANAGER'],
      } as any);

      // Act
      await controller.checkUserAccess(userId, checkDto);

      // Assert
      expect(userRoleSetupService.checkUserAccess).toHaveBeenCalledWith(
        userId,
        'DOCUMENT',
        'UPDATE'
      );
    });
  });

  describe('checkCurrentUserAccess', () => {
    it('should check current user access to resource and action', async () => {
      // Arrange
      const checkDto = {
        resource: 'INVESTMENT',
        action: 'CREATE',
      };

      const mockAccessResult = {
        hasAccess: true,
        permissions: ['INVESTMENT:CREATE'],
        roles: ['FUND_MANAGER'],
      };

      userRoleSetupService.checkUserAccess.mockResolvedValue(mockAccessResult as any);

      // Act
      const result = await controller.checkCurrentUserAccess(mockAuthenticatedUser, checkDto);

      // Assert
      expect(result).toEqual(mockAccessResult);
      expect(userRoleSetupService.checkUserAccess).toHaveBeenCalledWith(
        mockAuthenticatedUser.id,
        'INVESTMENT',
        'CREATE'
      );
      expect(userRoleSetupService.checkUserAccess).toHaveBeenCalledTimes(1);
    });

    it('should return no access when current user lacks permissions', async () => {
      // Arrange
      const checkDto = {
        resource: 'USER_MANAGEMENT',
        action: 'DELETE',
      };

      userRoleSetupService.checkUserAccess.mockResolvedValue({
        hasAccess: false,
        permissions: [],
        roles: ['INVESTOR'],
      } as any);

      // Act
      const result = await controller.checkCurrentUserAccess(mockAuthenticatedUser, checkDto);

      // Assert
      expect(result.hasAccess).toBe(false);
    });
  });

  describe('getUserEffectivePermissions', () => {
    it('should return effective permissions for specified user', async () => {
      // Arrange
      const userId = 'user-permissions';
      const mockPermissions = {
        userId: 'user-permissions',
        roles: ['INVESTOR', 'FUND_MANAGER'],
        permissions: [
          'FUND:READ',
          'FUND:CREATE',
          'INVESTMENT:READ',
          'INVESTMENT:CREATE',
        ],
        resourcePermissions: {
          FUND: ['READ', 'CREATE', 'UPDATE'],
          INVESTMENT: ['READ', 'CREATE'],
        },
      };

      userRoleSetupService.getUserEffectivePermissions.mockResolvedValue(
        mockPermissions as any
      );

      // Act
      const result = await controller.getUserEffectivePermissions(userId);

      // Assert
      expect(result).toEqual(mockPermissions);
      expect(userRoleSetupService.getUserEffectivePermissions).toHaveBeenCalledWith(userId);
      expect(userRoleSetupService.getUserEffectivePermissions).toHaveBeenCalledTimes(1);
    });

    it('should return empty permissions for user with no roles', async () => {
      // Arrange
      const userId = 'user-no-roles';
      const mockPermissions = {
        userId: 'user-no-roles',
        roles: [],
        permissions: [],
        resourcePermissions: {},
      };

      userRoleSetupService.getUserEffectivePermissions.mockResolvedValue(
        mockPermissions as any
      );

      // Act
      const result = await controller.getUserEffectivePermissions(userId);

      // Assert
      expect(result.roles).toEqual([]);
      expect(result.permissions).toEqual([]);
    });

    it('should handle non-existent user', async () => {
      // Arrange
      const userId = 'non-existent-user';
      userRoleSetupService.getUserEffectivePermissions.mockRejectedValue(
        new Error('User not found')
      );

      // Act & Assert
      await expect(controller.getUserEffectivePermissions(userId)).rejects.toThrow(
        'User not found'
      );
    });
  });

  describe('getCurrentUserEffectivePermissions', () => {
    it('should return effective permissions for current user', async () => {
      // Arrange
      const mockPermissions = {
        userId: mockAuthenticatedUser.id,
        roles: ['SUPER_ADMIN'],
        permissions: ['USER:MANAGE', 'ROLE:ASSIGN', 'SYSTEM:ADMIN'],
        resourcePermissions: {
          USER: ['READ', 'CREATE', 'UPDATE', 'DELETE'],
          ROLE: ['READ', 'CREATE', 'UPDATE', 'DELETE'],
          SYSTEM: ['ADMIN'],
        },
      };

      userRoleSetupService.getUserEffectivePermissions.mockResolvedValue(
        mockPermissions as any
      );

      // Act
      const result = await controller.getCurrentUserEffectivePermissions(mockAuthenticatedUser);

      // Assert
      expect(result).toEqual(mockPermissions);
      expect(userRoleSetupService.getUserEffectivePermissions).toHaveBeenCalledWith(
        mockAuthenticatedUser.id
      );
      expect(userRoleSetupService.getUserEffectivePermissions).toHaveBeenCalledTimes(1);
    });

    it('should handle error retrieving current user permissions', async () => {
      // Arrange
      userRoleSetupService.getUserEffectivePermissions.mockRejectedValue(
        new Error('Failed to retrieve permissions')
      );

      // Act & Assert
      await expect(
        controller.getCurrentUserEffectivePermissions(mockAuthenticatedUser)
      ).rejects.toThrow('Failed to retrieve permissions');
    });
  });

  describe('getRecommendedRole', () => {
    it('should return role recommendation for user', async () => {
      // Arrange
      const userId = 'user-recommend';
      const mockRecommendation = {
        recommendedRole: 'FUND_MANAGER',
        reason: 'User has demonstrated leadership and has significant investments',
        confidence: 0.85,
      };

      userRoleSetupService.getRecommendedRoleForUser.mockResolvedValue(
        mockRecommendation as any
      );

      // Act
      const result = await controller.getRecommendedRole(userId);

      // Assert
      expect(result).toEqual(mockRecommendation);
      expect(userRoleSetupService.getRecommendedRoleForUser).toHaveBeenCalledWith(userId);
      expect(userRoleSetupService.getRecommendedRoleForUser).toHaveBeenCalledTimes(1);
    });

    it('should return low confidence recommendation', async () => {
      // Arrange
      const userId = 'user-new';
      const mockRecommendation = {
        recommendedRole: 'INVESTOR',
        reason: 'Insufficient activity data for higher roles',
        confidence: 0.45,
      };

      userRoleSetupService.getRecommendedRoleForUser.mockResolvedValue(
        mockRecommendation as any
      );

      // Act
      const result = await controller.getRecommendedRole(userId);

      // Assert
      expect(result.recommendedRole).toBe('INVESTOR');
      expect(result.confidence).toBeLessThan(0.5);
    });

    it('should handle recommendation for non-existent user', async () => {
      // Arrange
      const userId = 'non-existent';
      userRoleSetupService.getRecommendedRoleForUser.mockRejectedValue(
        new Error('User not found')
      );

      // Act & Assert
      await expect(controller.getRecommendedRole(userId)).rejects.toThrow('User not found');
    });
  });

  describe('removeAllUserRoles', () => {
    it('should remove all roles from user', async () => {
      // Arrange
      const userId = 'user-remove-roles';
      userRoleSetupService.removeAllUserRoles.mockResolvedValue(undefined);

      // Act
      await controller.removeAllUserRoles(userId, mockAuthenticatedUser);

      // Assert
      expect(userRoleSetupService.removeAllUserRoles).toHaveBeenCalledWith(
        userId,
        mockAuthenticatedUser.id,
        'Admin-requested role cleanup'
      );
      expect(userRoleSetupService.removeAllUserRoles).toHaveBeenCalledTimes(1);
    });

    it('should handle removing roles from non-existent user', async () => {
      // Arrange
      const userId = 'non-existent-user';
      userRoleSetupService.removeAllUserRoles.mockRejectedValue(
        new Error('User not found')
      );

      // Act & Assert
      await expect(
        controller.removeAllUserRoles(userId, mockAuthenticatedUser)
      ).rejects.toThrow('User not found');
    });

    it('should handle service error during role removal', async () => {
      // Arrange
      const userId = 'user-error';
      userRoleSetupService.removeAllUserRoles.mockRejectedValue(
        new Error('Failed to remove roles')
      );

      // Act & Assert
      await expect(
        controller.removeAllUserRoles(userId, mockAuthenticatedUser)
      ).rejects.toThrow('Failed to remove roles');
    });
  });

  describe('controller initialization', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should have userRoleSetupService injected', () => {
      expect(controller['userRoleSetupService']).toBeDefined();
    });
  });
});
