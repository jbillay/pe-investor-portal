import { SetMetadata } from '@nestjs/common';
import {
  AuditLog,
  AuditUserAction,
  AuditRoleAction,
  AuditSensitiveAction,
  AUDIT_LOG_KEY,
} from './audit-log.decorator';

jest.mock('@nestjs/common', () => ({
  SetMetadata: jest.fn((key, value) => ({ key, value })),
}));

describe('Audit Log Decorators', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AuditLog', () => {
    it('should set metadata with action only', () => {
      AuditLog('USER_CREATED');

      expect(SetMetadata).toHaveBeenCalledWith(AUDIT_LOG_KEY, {
        action: 'USER_CREATED',
        resource: undefined,
      });
    });

    it('should set metadata with action and resource', () => {
      AuditLog('UPDATE', 'USER');

      expect(SetMetadata).toHaveBeenCalledWith(AUDIT_LOG_KEY, {
        action: 'UPDATE',
        resource: 'USER',
      });
    });

    it('should handle various action types', () => {
      AuditLog('DELETE_ROLE', 'ROLE');

      expect(SetMetadata).toHaveBeenCalledWith(AUDIT_LOG_KEY, {
        action: 'DELETE_ROLE',
        resource: 'ROLE',
      });
    });
  });

  describe('AuditUserAction', () => {
    it('should set metadata for user action', () => {
      AuditUserAction('USER_LOGIN');

      expect(SetMetadata).toHaveBeenCalledWith(AUDIT_LOG_KEY, {
        action: 'USER_LOGIN',
        resource: 'USER',
      });
    });

    it('should handle create action', () => {
      AuditUserAction('CREATE');

      expect(SetMetadata).toHaveBeenCalledWith(AUDIT_LOG_KEY, {
        action: 'CREATE',
        resource: 'USER',
      });
    });
  });

  describe('AuditRoleAction', () => {
    it('should set metadata for role action', () => {
      AuditRoleAction('ROLE_ASSIGNED');

      expect(SetMetadata).toHaveBeenCalledWith(AUDIT_LOG_KEY, {
        action: 'ROLE_ASSIGNED',
        resource: 'ROLE',
      });
    });

    it('should handle update action', () => {
      AuditRoleAction('UPDATE');

      expect(SetMetadata).toHaveBeenCalledWith(AUDIT_LOG_KEY, {
        action: 'UPDATE',
        resource: 'ROLE',
      });
    });
  });

  describe('AuditSensitiveAction', () => {
    it('should set metadata with sensitive flag and no resource', () => {
      AuditSensitiveAction('PASSWORD_RESET');

      expect(SetMetadata).toHaveBeenCalledWith(AUDIT_LOG_KEY, {
        action: 'PASSWORD_RESET',
        resource: undefined,
        sensitive: true,
      });
    });

    it('should set metadata with sensitive flag and resource', () => {
      AuditSensitiveAction('PERMISSION_CHANGE', 'USER');

      expect(SetMetadata).toHaveBeenCalledWith(AUDIT_LOG_KEY, {
        action: 'PERMISSION_CHANGE',
        resource: 'USER',
        sensitive: true,
      });
    });

    it('should mark data deletion as sensitive', () => {
      AuditSensitiveAction('DELETE_ALL_DATA', 'DATABASE');

      expect(SetMetadata).toHaveBeenCalledWith(AUDIT_LOG_KEY, {
        action: 'DELETE_ALL_DATA',
        resource: 'DATABASE',
        sensitive: true,
      });
    });
  });
});
