import { SetMetadata } from '@nestjs/common';
import {
  RequireRoles,
  RequireAnyRole,
  RequirePermissions,
  RequireAnyPermission,
  AdminOnly,
  AdminOrInvestor,
  RequireUserManagement,
  RequireRoleManagement,
  RequirePortfolioAccess,
  REQUIRE_ROLES_KEY,
  REQUIRE_ANY_ROLE_KEY,
  REQUIRE_PERMISSIONS_KEY,
  REQUIRE_ANY_PERMISSION_KEY,
} from '../decorators/role.decorator';

// Mock SetMetadata to test decorator behavior
jest.mock('@nestjs/common', () => ({
  ...jest.requireActual('@nestjs/common'),
  SetMetadata: jest.fn(),
}));

const mockSetMetadata = SetMetadata as jest.MockedFunction<typeof SetMetadata>;

describe('Role Decorators - Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock SetMetadata to return a function
    mockSetMetadata.mockReturnValue(jest.fn());
  });

  describe('RequireRoles decorator', () => {
    it('should set metadata with correct key and single role', () => {
      const roles = ['ADMIN'];
      RequireRoles(...roles);

      expect(mockSetMetadata).toHaveBeenCalledWith(REQUIRE_ROLES_KEY, roles);
      expect(mockSetMetadata).toHaveBeenCalledTimes(1);
    });

    it('should set metadata with correct key and multiple roles', () => {
      const roles = ['ADMIN', 'INVESTOR', 'FUND_MANAGER'];
      RequireRoles(...roles);

      expect(mockSetMetadata).toHaveBeenCalledWith(REQUIRE_ROLES_KEY, roles);
      expect(mockSetMetadata).toHaveBeenCalledTimes(1);
    });

    it('should handle empty roles array', () => {
      const roles: string[] = [];
      RequireRoles(...roles);

      expect(mockSetMetadata).toHaveBeenCalledWith(REQUIRE_ROLES_KEY, roles);
      expect(mockSetMetadata).toHaveBeenCalledTimes(1);
    });

    it('should handle roles with special characters', () => {
      const roles = ['ROLE_WITH_UNDERSCORES', 'ROLE-WITH-DASHES', 'ROLE.WITH.DOTS'];
      RequireRoles(...roles);

      expect(mockSetMetadata).toHaveBeenCalledWith(REQUIRE_ROLES_KEY, roles);
    });
  });

  describe('RequireAnyRole decorator', () => {
    it('should set metadata with correct key and single role', () => {
      const roles = ['ADMIN'];
      RequireAnyRole(...roles);

      expect(mockSetMetadata).toHaveBeenCalledWith(REQUIRE_ANY_ROLE_KEY, roles);
      expect(mockSetMetadata).toHaveBeenCalledTimes(1);
    });

    it('should set metadata with correct key and multiple roles', () => {
      const roles = ['ADMIN', 'INVESTOR'];
      RequireAnyRole(...roles);

      expect(mockSetMetadata).toHaveBeenCalledWith(REQUIRE_ANY_ROLE_KEY, roles);
      expect(mockSetMetadata).toHaveBeenCalledTimes(1);
    });

    it('should handle empty roles array', () => {
      const roles: string[] = [];
      RequireAnyRole(...roles);

      expect(mockSetMetadata).toHaveBeenCalledWith(REQUIRE_ANY_ROLE_KEY, roles);
    });
  });

  describe('RequirePermissions decorator', () => {
    it('should set metadata with correct key and single permission', () => {
      const permissions = ['VIEW_PORTFOLIO'];
      RequirePermissions(...permissions);

      expect(mockSetMetadata).toHaveBeenCalledWith(REQUIRE_PERMISSIONS_KEY, permissions);
      expect(mockSetMetadata).toHaveBeenCalledTimes(1);
    });

    it('should set metadata with correct key and multiple permissions', () => {
      const permissions = ['VIEW_PORTFOLIO', 'EDIT_PORTFOLIO', 'DELETE_PORTFOLIO'];
      RequirePermissions(...permissions);

      expect(mockSetMetadata).toHaveBeenCalledWith(REQUIRE_PERMISSIONS_KEY, permissions);
      expect(mockSetMetadata).toHaveBeenCalledTimes(1);
    });

    it('should handle empty permissions array', () => {
      const permissions: string[] = [];
      RequirePermissions(...permissions);

      expect(mockSetMetadata).toHaveBeenCalledWith(REQUIRE_PERMISSIONS_KEY, permissions);
    });

    it('should handle permissions with various naming conventions', () => {
      const permissions = ['CREATE_USER', 'read-documents', 'manage.funds', 'ADMIN_ACCESS'];
      RequirePermissions(...permissions);

      expect(mockSetMetadata).toHaveBeenCalledWith(REQUIRE_PERMISSIONS_KEY, permissions);
    });
  });

  describe('RequireAnyPermission decorator', () => {
    it('should set metadata with correct key and single permission', () => {
      const permissions = ['VIEW_PORTFOLIO'];
      RequireAnyPermission(...permissions);

      expect(mockSetMetadata).toHaveBeenCalledWith(REQUIRE_ANY_PERMISSION_KEY, permissions);
      expect(mockSetMetadata).toHaveBeenCalledTimes(1);
    });

    it('should set metadata with correct key and multiple permissions', () => {
      const permissions = ['VIEW_PORTFOLIO', 'VIEW_DOCUMENTS'];
      RequireAnyPermission(...permissions);

      expect(mockSetMetadata).toHaveBeenCalledWith(REQUIRE_ANY_PERMISSION_KEY, permissions);
      expect(mockSetMetadata).toHaveBeenCalledTimes(1);
    });

    it('should handle empty permissions array', () => {
      const permissions: string[] = [];
      RequireAnyPermission(...permissions);

      expect(mockSetMetadata).toHaveBeenCalledWith(REQUIRE_ANY_PERMISSION_KEY, permissions);
    });
  });

  describe('Composite decorators', () => {
    describe('AdminOnly decorator', () => {
      it('should set metadata for ADMIN role requirement', () => {
        AdminOnly();

        expect(mockSetMetadata).toHaveBeenCalledWith(REQUIRE_ROLES_KEY, ['ADMIN']);
        expect(mockSetMetadata).toHaveBeenCalledTimes(1);
      });
    });

    describe('AdminOrInvestor decorator', () => {
      it('should set metadata for ADMIN or INVESTOR role requirement', () => {
        AdminOrInvestor();

        expect(mockSetMetadata).toHaveBeenCalledWith(REQUIRE_ANY_ROLE_KEY, ['ADMIN', 'INVESTOR']);
        expect(mockSetMetadata).toHaveBeenCalledTimes(1);
      });
    });

    describe('RequireUserManagement decorator', () => {
      it('should set metadata for user management permissions', () => {
        RequireUserManagement();

        expect(mockSetMetadata).toHaveBeenCalledWith(REQUIRE_ANY_PERMISSION_KEY, [
          'CREATE_USER',
          'UPDATE_USER',
          'DELETE_USER',
          'VIEW_USER',
        ]);
        expect(mockSetMetadata).toHaveBeenCalledTimes(1);
      });
    });

    describe('RequireRoleManagement decorator', () => {
      it('should set metadata for role management permissions', () => {
        RequireRoleManagement();

        expect(mockSetMetadata).toHaveBeenCalledWith(REQUIRE_ANY_PERMISSION_KEY, [
          'CREATE_ROLE',
          'UPDATE_ROLE',
          'DELETE_ROLE',
          'ASSIGN_ROLE',
          'REVOKE_ROLE',
        ]);
        expect(mockSetMetadata).toHaveBeenCalledTimes(1);
      });
    });

    describe('RequirePortfolioAccess decorator', () => {
      it('should set metadata for portfolio access permissions', () => {
        RequirePortfolioAccess();

        expect(mockSetMetadata).toHaveBeenCalledWith(REQUIRE_ANY_PERMISSION_KEY, [
          'VIEW_PORTFOLIO',
          'CREATE_PORTFOLIO',
          'UPDATE_PORTFOLIO',
        ]);
        expect(mockSetMetadata).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Decorator constants', () => {
    it('should have correct metadata keys', () => {
      expect(REQUIRE_ROLES_KEY).toBe('requireRoles');
      expect(REQUIRE_ANY_ROLE_KEY).toBe('requireAnyRole');
      expect(REQUIRE_PERMISSIONS_KEY).toBe('requirePermissions');
      expect(REQUIRE_ANY_PERMISSION_KEY).toBe('requireAnyPermission');
    });
  });

  describe('Decorator usage patterns', () => {
    it('should allow chaining multiple decorators', () => {
      // Simulate using multiple decorators
      RequireRoles('ADMIN');
      RequirePermissions('VIEW_USERS');

      expect(mockSetMetadata).toHaveBeenCalledTimes(2);
      expect(mockSetMetadata).toHaveBeenNthCalledWith(1, REQUIRE_ROLES_KEY, ['ADMIN']);
      expect(mockSetMetadata).toHaveBeenNthCalledWith(2, REQUIRE_PERMISSIONS_KEY, ['VIEW_USERS']);
    });

    it('should handle complex permission combinations', () => {
      RequireAnyPermission('ADMIN_ACCESS', 'SUPER_USER', 'SYSTEM_ADMIN');

      expect(mockSetMetadata).toHaveBeenCalledWith(REQUIRE_ANY_PERMISSION_KEY, [
        'ADMIN_ACCESS',
        'SUPER_USER',
        'SYSTEM_ADMIN',
      ]);
    });

    it('should handle role hierarchies', () => {
      RequireAnyRole('SUPER_ADMIN', 'ADMIN', 'FUND_MANAGER', 'ANALYST', 'INVESTOR');

      expect(mockSetMetadata).toHaveBeenCalledWith(REQUIRE_ANY_ROLE_KEY, [
        'SUPER_ADMIN',
        'ADMIN',
        'FUND_MANAGER',
        'ANALYST',
        'INVESTOR',
      ]);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle duplicate roles in RequireRoles', () => {
      const roles = ['ADMIN', 'ADMIN', 'INVESTOR'];
      RequireRoles(...roles);

      expect(mockSetMetadata).toHaveBeenCalledWith(REQUIRE_ROLES_KEY, roles);
    });

    it('should handle duplicate permissions in RequirePermissions', () => {
      const permissions = ['VIEW_PORTFOLIO', 'VIEW_PORTFOLIO', 'EDIT_PORTFOLIO'];
      RequirePermissions(...permissions);

      expect(mockSetMetadata).toHaveBeenCalledWith(REQUIRE_PERMISSIONS_KEY, permissions);
    });

    it('should handle very long role names', () => {
      const longRoleName = 'VERY_LONG_ROLE_NAME_THAT_MIGHT_BE_USED_IN_ENTERPRISE_SYSTEMS_WITH_DETAILED_NAMING_CONVENTIONS';
      RequireRoles(longRoleName);

      expect(mockSetMetadata).toHaveBeenCalledWith(REQUIRE_ROLES_KEY, [longRoleName]);
    });

    it('should handle very long permission names', () => {
      const longPermissionName = 'VERY_LONG_PERMISSION_NAME_FOR_SPECIFIC_PORTFOLIO_MANAGEMENT_OPERATIONS_WITH_DETAILED_ACCESS_CONTROL';
      RequirePermissions(longPermissionName);

      expect(mockSetMetadata).toHaveBeenCalledWith(REQUIRE_PERMISSIONS_KEY, [longPermissionName]);
    });

    it('should handle numeric strings in role names', () => {
      const roles = ['ROLE_123', 'ADMIN_V2', 'INVESTOR_2024'];
      RequireRoles(...roles);

      expect(mockSetMetadata).toHaveBeenCalledWith(REQUIRE_ROLES_KEY, roles);
    });

    it('should handle special characters in permission names', () => {
      const permissions = ['PORTFOLIO:READ', 'USER@ADMIN', 'FUND#MANAGER'];
      RequirePermissions(...permissions);

      expect(mockSetMetadata).toHaveBeenCalledWith(REQUIRE_PERMISSIONS_KEY, permissions);
    });
  });

  describe('Real-world usage scenarios', () => {
    it('should support typical admin panel access pattern', () => {
      AdminOnly();

      expect(mockSetMetadata).toHaveBeenCalledWith(REQUIRE_ROLES_KEY, ['ADMIN']);
    });

    it('should support typical user and admin access pattern', () => {
      AdminOrInvestor();

      expect(mockSetMetadata).toHaveBeenCalledWith(REQUIRE_ANY_ROLE_KEY, ['ADMIN', 'INVESTOR']);
    });

    it('should support granular permission access patterns', () => {
      RequireAnyPermission('READ_SENSITIVE_DATA', 'AUDIT_ACCESS', 'COMPLIANCE_VIEW');

      expect(mockSetMetadata).toHaveBeenCalledWith(REQUIRE_ANY_PERMISSION_KEY, [
        'READ_SENSITIVE_DATA',
        'AUDIT_ACCESS',
        'COMPLIANCE_VIEW',
      ]);
    });

    it('should support strict role requirements for sensitive operations', () => {
      RequireRoles('COMPLIANCE_OFFICER', 'AUDIT_MANAGER');

      expect(mockSetMetadata).toHaveBeenCalledWith(REQUIRE_ROLES_KEY, ['COMPLIANCE_OFFICER', 'AUDIT_MANAGER']);
    });

    it('should support flexible access for common operations', () => {
      RequireAnyRole('INVESTOR', 'FUND_MANAGER', 'ANALYST');

      expect(mockSetMetadata).toHaveBeenCalledWith(REQUIRE_ANY_ROLE_KEY, ['INVESTOR', 'FUND_MANAGER', 'ANALYST']);
    });
  });

  describe('Decorator return values', () => {
    it('should return function from RequireRoles', () => {
      const decorator = RequireRoles('ADMIN');
      expect(mockSetMetadata).toHaveBeenCalled();
    });

    it('should return function from RequireAnyRole', () => {
      const decorator = RequireAnyRole('ADMIN', 'INVESTOR');
      expect(mockSetMetadata).toHaveBeenCalled();
    });

    it('should return function from RequirePermissions', () => {
      const decorator = RequirePermissions('VIEW_PORTFOLIO');
      expect(mockSetMetadata).toHaveBeenCalled();
    });

    it('should return function from RequireAnyPermission', () => {
      const decorator = RequireAnyPermission('VIEW_PORTFOLIO', 'EDIT_PORTFOLIO');
      expect(mockSetMetadata).toHaveBeenCalled();
    });

    it('should return function from composite decorators', () => {
      AdminOnly();
      AdminOrInvestor();
      RequireUserManagement();
      RequireRoleManagement();
      RequirePortfolioAccess();
      expect(mockSetMetadata).toHaveBeenCalledTimes(5);
    });
  });
});