import {
  validatePassword,
  getPasswordStrength,
  validatePasswordMatch,
  validatePasswordNotSame,
  validateNewPassword,
} from '../password-validator.util';
import { PASSWORD_ERROR_MESSAGES } from '../../constants/password.constants';

describe('password-validator.util', () => {
  describe('validatePassword', () => {
    it('should validate a strong password', () => {
      const result = validatePassword('MySecurePass123!', 'user@example.com');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password that is too short', () => {
      const result = validatePassword('Short1!', 'user@example.com');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(PASSWORD_ERROR_MESSAGES.TOO_SHORT);
    });

    it('should reject password without uppercase', () => {
      const result = validatePassword('mysecurepass123!', 'user@example.com');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(PASSWORD_ERROR_MESSAGES.NO_UPPERCASE);
    });

    it('should reject password without lowercase', () => {
      const result = validatePassword('MYSECUREPASS123!', 'user@example.com');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(PASSWORD_ERROR_MESSAGES.NO_LOWERCASE);
    });

    it('should reject password without number', () => {
      const result = validatePassword('MySecurePass!', 'user@example.com');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(PASSWORD_ERROR_MESSAGES.NO_NUMBER);
    });

    it('should reject password without special character', () => {
      const result = validatePassword('MySecurePass123', 'user@example.com');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(PASSWORD_ERROR_MESSAGES.NO_SPECIAL_CHAR);
    });

    it('should reject password containing email', () => {
      const result = validatePassword(
        'user@example.com123!',
        'user@example.com'
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(PASSWORD_ERROR_MESSAGES.CONTAINS_EMAIL);
    });

    it('should accept password without email check if no email provided', () => {
      const result = validatePassword('MySecurePass123!');
      expect(result.isValid).toBe(true);
    });

    it('should reject password with multiple violations', () => {
      const result = validatePassword('short', 'user@example.com');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });

    it('should handle maximum length password', () => {
      const longPassword = 'A'.repeat(128) + '1!a';
      const result = validatePassword(longPassword.slice(0, 128));
      // Will fail other requirements but should not fail max length
      expect(result.errors).not.toContain(PASSWORD_ERROR_MESSAGES.TOO_LONG);
    });

    it('should reject password exceeding maximum length', () => {
      const tooLongPassword = 'A'.repeat(129) + '1!a';
      const result = validatePassword(tooLongPassword);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(PASSWORD_ERROR_MESSAGES.TOO_LONG);
    });
  });

  describe('getPasswordStrength', () => {
    it('should return detailed strength for valid password', () => {
      const result = getPasswordStrength('MySecurePass123!');
      expect(result.isValid).toBe(true);
      expect(result.hasMinLength).toBe(true);
      expect(result.hasMaxLength).toBe(true);
      expect(result.hasUppercase).toBe(true);
      expect(result.hasLowercase).toBe(true);
      expect(result.hasNumber).toBe(true);
      expect(result.hasSpecialChar).toBe(true);
    });

    it('should identify missing uppercase', () => {
      const result = getPasswordStrength('mysecurepass123!');
      expect(result.hasUppercase).toBe(false);
      expect(result.hasLowercase).toBe(true);
    });

    it('should identify missing number', () => {
      const result = getPasswordStrength('MySecurePass!');
      expect(result.hasNumber).toBe(false);
    });

    it('should identify short password', () => {
      const result = getPasswordStrength('Short1!');
      expect(result.hasMinLength).toBe(false);
    });
  });

  describe('validatePasswordMatch', () => {
    it('should validate matching passwords', () => {
      const result = validatePasswordMatch('MyPass123!', 'MyPass123!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject non-matching passwords', () => {
      const result = validatePasswordMatch('MyPass123!', 'DifferentPass123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        PASSWORD_ERROR_MESSAGES.PASSWORDS_DONT_MATCH
      );
    });

    it('should be case-sensitive', () => {
      const result = validatePasswordMatch('MyPass123!', 'mypass123!');
      expect(result.isValid).toBe(false);
    });
  });

  describe('validatePasswordNotSame', () => {
    it('should validate different passwords', () => {
      const result = validatePasswordNotSame('NewPass123!', 'OldPass123!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject same passwords', () => {
      const result = validatePasswordNotSame('SamePass123!', 'SamePass123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(PASSWORD_ERROR_MESSAGES.SAME_AS_TEMP);
    });
  });

  describe('validateNewPassword', () => {
    it('should validate a completely valid new password', () => {
      const result = validateNewPassword(
        'MyNewPass123!',
        'MyNewPass123!',
        'user@example.com',
        'TempPass456!'
      );
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail if passwords dont match', () => {
      const result = validateNewPassword(
        'MyNewPass123!',
        'DifferentPass123!',
        'user@example.com',
        'TempPass456!'
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        PASSWORD_ERROR_MESSAGES.PASSWORDS_DONT_MATCH
      );
    });

    it('should fail if new password is same as temp', () => {
      const result = validateNewPassword(
        'TempPass456!',
        'TempPass456!',
        'user@example.com',
        'TempPass456!'
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(PASSWORD_ERROR_MESSAGES.SAME_AS_TEMP);
    });

    it('should fail if password is too weak', () => {
      const result = validateNewPassword(
        'weak',
        'weak',
        'user@example.com',
        'TempPass456!'
      );
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should accumulate all errors', () => {
      const result = validateNewPassword(
        'weak',
        'different',
        'user@example.com',
        'TempPass456!'
      );
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });

    it('should work without temp password', () => {
      const result = validateNewPassword(
        'MyNewPass123!',
        'MyNewPass123!',
        'user@example.com'
      );
      expect(result.isValid).toBe(true);
    });

    it('should reject password containing email', () => {
      const result = validateNewPassword(
        'user@example.com123!',
        'user@example.com123!',
        'user@example.com',
        'TempPass456!'
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(PASSWORD_ERROR_MESSAGES.CONTAINS_EMAIL);
    });
  });
});
