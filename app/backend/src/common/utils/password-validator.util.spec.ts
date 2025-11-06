import {
  validatePassword,
  getPasswordStrength,
  validatePasswordMatch,
  validatePasswordNotSame,
  validateNewPassword,
} from './password-validator.util';

describe('Password Validator Utility', () => {
  describe('validatePassword', () => {
    it('should validate a strong password', () => {
      const result = validatePassword('MyPassword123!', 'user@example.com');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password that is too short', () => {
      const result = validatePassword('Pass1!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 12 characters long');
    });

    it('should reject password that is too long', () => {
      const longPassword = 'A'.repeat(129) + 'a1!';
      const result = validatePassword(longPassword);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must not exceed 128 characters');
    });

    it('should reject password without uppercase letter', () => {
      const result = validatePassword('mypassword123!@@');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter (A-Z)');
    });

    it('should reject password without lowercase letter', () => {
      const result = validatePassword('MYPASSWORD123!@@');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter (a-z)');
    });

    it('should reject password without number', () => {
      const result = validatePassword('MyPasswordNoNum!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number (0-9)');
    });

    it('should reject password without special character', () => {
      const result = validatePassword('MyPassword123456');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)');
    });

    it('should reject password that contains email', () => {
      const result = validatePassword('user@example.com123!A', 'user@example.com');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must not contain your email address');
    });

    it('should reject password that contains email (case insensitive)', () => {
      const result = validatePassword('USER@EXAMPLE.COM123!A', 'user@example.com');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must not contain your email address');
    });

    it('should accept password without email check if email not provided', () => {
      const result = validatePassword('MyPassword123!');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return multiple errors for weak password', () => {
      const result = validatePassword('pass');

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContain('Password must be at least 12 characters long');
      expect(result.errors).toContain('Password must contain at least one uppercase letter (A-Z)');
    });
  });

  describe('getPasswordStrength', () => {
    it('should return detailed strength for strong password', () => {
      const result = getPasswordStrength('MyPassword123!');

      expect(result.isValid).toBe(true);
      expect(result.hasMinLength).toBe(true);
      expect(result.hasMaxLength).toBe(true);
      expect(result.hasUppercase).toBe(true);
      expect(result.hasLowercase).toBe(true);
      expect(result.hasNumber).toBe(true);
      expect(result.hasSpecialChar).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return detailed strength for weak password', () => {
      const result = getPasswordStrength('pass');

      expect(result.isValid).toBe(false);
      expect(result.hasMinLength).toBe(false);
      expect(result.hasUppercase).toBe(false);
      expect(result.hasNumber).toBe(false);
      expect(result.hasSpecialChar).toBe(false);
      expect(result.hasLowercase).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect password too long', () => {
      const longPassword = 'A'.repeat(129) + 'a1!';
      const result = getPasswordStrength(longPassword);

      expect(result.hasMaxLength).toBe(false);
      expect(result.isValid).toBe(false);
    });

    it('should detect missing uppercase', () => {
      const result = getPasswordStrength('mypassword123!');

      expect(result.hasUppercase).toBe(false);
    });

    it('should detect missing lowercase', () => {
      const result = getPasswordStrength('MYPASSWORD123!');

      expect(result.hasLowercase).toBe(false);
    });

    it('should detect missing number', () => {
      const result = getPasswordStrength('MyPassword!');

      expect(result.hasNumber).toBe(false);
    });

    it('should detect missing special character', () => {
      const result = getPasswordStrength('MyPassword123');

      expect(result.hasSpecialChar).toBe(false);
    });
  });

  describe('validatePasswordMatch', () => {
    it('should validate matching passwords', () => {
      const result = validatePasswordMatch('MyPassword123!', 'MyPassword123!');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject non-matching passwords', () => {
      const result = validatePasswordMatch('MyPassword123!', 'DifferentPassword123!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Passwords do not match');
    });

    it('should be case sensitive', () => {
      const result = validatePasswordMatch('MyPassword123!', 'mypassword123!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Passwords do not match');
    });
  });

  describe('validatePasswordNotSame', () => {
    it('should accept different passwords', () => {
      const result = validatePasswordNotSame('NewPassword123!', 'TempPassword456!');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject same passwords', () => {
      const result = validatePasswordNotSame('SamePassword123!', 'SamePassword123!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('New password must be different from temporary password');
    });
  });

  describe('validateNewPassword', () => {
    it('should validate strong matching password without temp password', () => {
      const result = validateNewPassword(
        'MyNewPassword123!',
        'MyNewPassword123!',
        'user@example.com',
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate strong matching password different from temp password', () => {
      const result = validateNewPassword(
        'MyNewPassword123!',
        'MyNewPassword123!',
        'user@example.com',
        'TempPassword456!',
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject weak password', () => {
      const result = validateNewPassword('weak', 'weak', 'user@example.com');

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject non-matching passwords', () => {
      const result = validateNewPassword(
        'MyNewPassword123!',
        'DifferentPassword123!',
        'user@example.com',
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Passwords do not match');
    });

    it('should reject password containing email', () => {
      const result = validateNewPassword(
        'user@example.com123!A',
        'user@example.com123!A',
        'user@example.com',
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must not contain your email address');
    });

    it('should reject new password same as temp password', () => {
      const result = validateNewPassword(
        'TempPassword123!',
        'TempPassword123!',
        'user@example.com',
        'TempPassword123!',
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('New password must be different from temporary password');
    });

    it('should accumulate multiple errors', () => {
      const result = validateNewPassword(
        'weak',
        'different',
        'user@example.com',
        'weak',
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(2);
    });
  });
});
