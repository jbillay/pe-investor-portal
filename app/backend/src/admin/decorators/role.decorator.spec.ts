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
} from './role.decorator';

jest.mock('@nestjs/common', () => ({
  SetMetadata: jest.fn((key, value) => ({ key, value })),
}));

describe('Role Decorators', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('RequireRoles', () => {
    it('should set metadata with REQUIRE_ROLES_KEY', () => {
      const roles = ['ADMIN', 'USER'];
      RequireRoles(...roles);

      expect(SetMetadata).toHaveBeenCalledWith(REQUIRE_ROLES_KEY, roles);
    });

    it('should work with single role', () => {
      RequireRoles('ADMIN');

      expect(SetMetadata).toHaveBeenCalledWith(REQUIRE_ROLES_KEY, ['ADMIN']);
    });

    it('should work with multiple roles', () => {
      RequireRoles('ADMIN', 'INVESTOR', 'USER');

      expect(SetMetadata).toHaveBeenCalledWith(REQUIRE_ROLES_KEY, ['ADMIN', 'INVESTOR', 'USER']);
    });
  });

  describe('RequireAnyRole', () => {
    it('should set metadata with REQUIRE_ANY_ROLE_KEY', () => {
      const roles = ['ADMIN', 'INVESTOR'];
      RequireAnyRole(...roles);

      expect(SetMetadata).toHaveBeenCalledWith(REQUIRE_ANY_ROLE_KEY, roles);
    });

    it('should work with single role', () => {
      RequireAnyRole('USER');

      expect(SetMetadata).toHaveBeenCalledWith(REQUIRE_ANY_ROLE_KEY, ['USER']);
    });
  });

  describe('RequirePermissions', () => {
    it('should set metadata with REQUIRE_PERMISSIONS_KEY', () => {
      const permissions = ['READ_DATA', 'WRITE_DATA'];
      RequirePermissions(...permissions);

      expect(SetMetadata).toHaveBeenCalledWith(REQUIRE_PERMISSIONS_KEY, permissions);
    });

    it('should work with multiple permissions', () => {
      RequirePermissions('CREATE_USER', 'UPDATE_USER', 'DELETE_USER');

      expect(SetMetadata).toHaveBeenCalledWith(REQUIRE_PERMISSIONS_KEY, [
        'CREATE_USER',
        'UPDATE_USER',
        'DELETE_USER',
      ]);
    });
  });

  describe('RequireAnyPermission', () => {
    it('should set metadata with REQUIRE_ANY_PERMISSION_KEY', () => {
      const permissions = ['VIEW_PORTFOLIO', 'EDIT_PORTFOLIO'];
      RequireAnyPermission(...permissions);

      expect(SetMetadata).toHaveBeenCalledWith(REQUIRE_ANY_PERMISSION_KEY, permissions);
    });
  });

  describe('AdminOnly', () => {
    it('should require SUPER_ADMIN role', () => {
      AdminOnly();

      expect(SetMetadata).toHaveBeenCalledWith(REQUIRE_ROLES_KEY, ['SUPER_ADMIN']);
    });
  });

  describe('AdminOrInvestor', () => {
    it('should require SUPER_ADMIN or INVESTOR role', () => {
      AdminOrInvestor();

      expect(SetMetadata).toHaveBeenCalledWith(REQUIRE_ANY_ROLE_KEY, ['SUPER_ADMIN', 'INVESTOR']);
    });
  });

  describe('RequireUserManagement', () => {
    it('should require user management permissions', () => {
      RequireUserManagement();

      expect(SetMetadata).toHaveBeenCalledWith(REQUIRE_ANY_PERMISSION_KEY, [
        'CREATE_USER',
        'UPDATE_USER',
        'DELETE_USER',
        'VIEW_USER',
      ]);
    });
  });

  describe('RequireRoleManagement', () => {
    it('should require role management permissions', () => {
      RequireRoleManagement();

      expect(SetMetadata).toHaveBeenCalledWith(REQUIRE_ANY_PERMISSION_KEY, [
        'CREATE_ROLE',
        'UPDATE_ROLE',
        'DELETE_ROLE',
        'ASSIGN_ROLE',
        'REVOKE_ROLE',
      ]);
    });
  });

  describe('RequirePortfolioAccess', () => {
    it('should require portfolio access permissions', () => {
      RequirePortfolioAccess();

      expect(SetMetadata).toHaveBeenCalledWith(REQUIRE_ANY_PERMISSION_KEY, [
        'VIEW_PORTFOLIO',
        'CREATE_PORTFOLIO',
        'UPDATE_PORTFOLIO',
      ]);
    });
  });
});
