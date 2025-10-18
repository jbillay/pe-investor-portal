/**
 * Unit Tests for usePasswordStrength Composable
 * Comprehensive test suite covering password validation and strength calculation
 * Follows Vitest best practices
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ref } from 'vue';
import { usePasswordStrength, getPasswordRequirementDescriptions } from '../usePasswordStrength';

describe('usePasswordStrength Composable', () => {
  describe('Password Requirements Validation', () => {
    it('should validate length requirement (12+ characters)', () => {
      const password = ref('Short1@');
      const { requirements } = usePasswordStrength(password);

      expect(requirements.value.length).toBe(false);

      password.value = 'LongPassword123@';
      expect(requirements.value.length).toBe(true);
    });

    it('should validate uppercase letter requirement', () => {
      const password = ref('lowercase123@');
      const { requirements } = usePasswordStrength(password);

      expect(requirements.value.uppercase).toBe(false);

      password.value = 'Uppercase123@';
      expect(requirements.value.uppercase).toBe(true);
    });

    it('should validate lowercase letter requirement', () => {
      const password = ref('UPPERCASE123@');
      const { requirements } = usePasswordStrength(password);

      expect(requirements.value.lowercase).toBe(false);

      password.value = 'Lowercase123@';
      expect(requirements.value.lowercase).toBe(true);
    });

    it('should validate number requirement', () => {
      const password = ref('NoNumbersHere@');
      const { requirements } = usePasswordStrength(password);

      expect(requirements.value.number).toBe(false);

      password.value = 'WithNumbers123@';
      expect(requirements.value.number).toBe(true);
    });

    it('should validate special character requirement', () => {
      const password = ref('NoSpecialChars123');
      const { requirements } = usePasswordStrength(password);

      expect(requirements.value.special).toBe(false);

      password.value = 'WithSpecial123@';
      expect(requirements.value.special).toBe(true);
    });

    it('should accept various special characters', () => {
      const specialChars = '!@#$%^&*(),.?":{}|<>';
      const { requirements } = usePasswordStrength(ref(''));

      for (const char of specialChars) {
        const password = ref(`Password123${char}`);
        const { requirements: req } = usePasswordStrength(password);
        expect(req.value.special).toBe(true);
      }
    });
  });

  describe('Password Strength Calculation', () => {
    it('should return "weak" strength for passwords meeting 0-2 requirements', () => {
      const password = ref('abc');
      const { strength } = usePasswordStrength(password);

      expect(strength.value.level).toBe('weak');
      expect(strength.value.label).toBe('Weak');
      expect(strength.value.color).toBe('text-error-600');
      expect(strength.value.bgColor).toBe('bg-error-500');
      expect(strength.value.percentage).toBe(30);
    });

    it('should return "medium" strength for passwords meeting 3-4 requirements', () => {
      const password = ref('Abc123456789'); // length, uppercase, lowercase, number (no special)
      const { strength } = usePasswordStrength(password);

      expect(strength.value.level).toBe('medium');
      expect(strength.value.label).toBe('Medium');
      expect(strength.value.color).toBe('text-warning-600');
      expect(strength.value.bgColor).toBe('bg-warning-500');
      expect(strength.value.percentage).toBe(60);
    });

    it('should return "strong" strength for passwords meeting all 5 requirements', () => {
      const password = ref('StrongPassword123@');
      const { strength } = usePasswordStrength(password);

      expect(strength.value.level).toBe('strong');
      expect(strength.value.label).toBe('Strong');
      expect(strength.value.color).toBe('text-success-600');
      expect(strength.value.bgColor).toBe('bg-success-500');
      expect(strength.value.percentage).toBe(100);
    });

    it('should update strength reactively when password changes', () => {
      const password = ref('weak');
      const { strength } = usePasswordStrength(password);

      expect(strength.value.level).toBe('weak');

      password.value = 'Medium1234@';
      expect(strength.value.level).toBe('medium');

      password.value = 'StrongPassword123@';
      expect(strength.value.level).toBe('strong');
    });
  });

  describe('isValid Computed Property', () => {
    it('should return false for empty password', () => {
      const password = ref('');
      const { isValid } = usePasswordStrength(password);

      expect(isValid.value).toBe(false);
    });

    it('should return false for password not meeting all requirements', () => {
      const password = ref('WeakPass1');
      const { isValid } = usePasswordStrength(password);

      expect(isValid.value).toBe(false);
    });

    it('should return true for password meeting all requirements', () => {
      const password = ref('ValidPassword123@');
      const { isValid } = usePasswordStrength(password);

      expect(isValid.value).toBe(true);
    });
  });

  describe('meetsAllRequirements Computed Property', () => {
    it('should return false when not all requirements are met', () => {
      const password = ref('Short1@');
      const { meetsAllRequirements } = usePasswordStrength(password);

      expect(meetsAllRequirements.value).toBe(false);
    });

    it('should return true when all requirements are met', () => {
      const password = ref('CompletePassword123@');
      const { meetsAllRequirements } = usePasswordStrength(password);

      expect(meetsAllRequirements.value).toBe(true);
    });
  });

  describe('validatePassword Function', () => {
    const password = ref('');
    const { validatePassword } = usePasswordStrength(password);

    it('should return error for empty password', () => {
      const result = validatePassword('');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password is required');
    });

    it('should return error for password shorter than 12 characters', () => {
      const result = validatePassword('Short1@');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 12 characters long');
    });

    it('should return error for password without uppercase letter', () => {
      const result = validatePassword('lowercase123@');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should return error for password without lowercase letter', () => {
      const result = validatePassword('UPPERCASE123@');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should return error for password without number', () => {
      const result = validatePassword('NoNumbersHere@');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should return error for password without special character', () => {
      const result = validatePassword('NoSpecialChar123');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)');
    });

    it('should return multiple errors for password with multiple issues', () => {
      const result = validatePassword('short');

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContain('Password must be at least 12 characters long');
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
      expect(result.errors).toContain('Password must contain at least one number');
      expect(result.errors).toContain('Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)');
    });

    it('should return no errors for valid password', () => {
      const result = validatePassword('ValidPassword123@');

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should validate password match when confirmPassword is provided', () => {
      const result = validatePassword('ValidPassword123@', 'DifferentPassword123@');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Passwords do not match');
    });

    it('should return no error when passwords match', () => {
      const result = validatePassword('ValidPassword123@', 'ValidPassword123@');

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe('checkPasswordMatch Function', () => {
    const password = ref('');
    const { checkPasswordMatch } = usePasswordStrength(password);

    it('should return false when passwords do not match', () => {
      expect(checkPasswordMatch('Password1', 'Password2')).toBe(false);
    });

    it('should return true when passwords match', () => {
      expect(checkPasswordMatch('SamePassword', 'SamePassword')).toBe(true);
    });

    it('should return false when one password is empty', () => {
      expect(checkPasswordMatch('Password', '')).toBe(false);
      expect(checkPasswordMatch('', 'Password')).toBe(false);
    });

    it('should return false when both passwords are empty', () => {
      expect(checkPasswordMatch('', '')).toBe(false);
    });

    it('should be case-sensitive', () => {
      expect(checkPasswordMatch('Password', 'password')).toBe(false);
    });
  });

  describe('cannotBeTemporaryPassword Function', () => {
    const password = ref('');
    const { cannotBeTemporaryPassword } = usePasswordStrength(password);

    it('should return true when passwords are different', () => {
      expect(cannotBeTemporaryPassword('NewPassword', 'TempPassword')).toBe(true);
    });

    it('should return false when passwords are the same', () => {
      expect(cannotBeTemporaryPassword('SamePassword', 'SamePassword')).toBe(false);
    });

    it('should be case-sensitive', () => {
      expect(cannotBeTemporaryPassword('Password', 'password')).toBe(true);
    });

    it('should handle empty strings', () => {
      expect(cannotBeTemporaryPassword('', '')).toBe(false);
      expect(cannotBeTemporaryPassword('Password', '')).toBe(true);
      expect(cannotBeTemporaryPassword('', 'Password')).toBe(true);
    });
  });

  describe('getPasswordRequirementDescriptions Function', () => {
    it('should return all password requirement descriptions', () => {
      const descriptions = getPasswordRequirementDescriptions();

      expect(descriptions).toHaveLength(5);
      expect(descriptions).toEqual([
        { key: 'length', label: 'At least 12 characters' },
        { key: 'uppercase', label: 'One uppercase letter' },
        { key: 'lowercase', label: 'One lowercase letter' },
        { key: 'number', label: 'One number' },
        { key: 'special', label: 'One special character' }
      ]);
    });

    it('should return descriptions with correct keys', () => {
      const descriptions = getPasswordRequirementDescriptions();
      const keys = descriptions.map(d => d.key);

      expect(keys).toEqual(['length', 'uppercase', 'lowercase', 'number', 'special']);
    });
  });

  describe('Reactivity', () => {
    it('should update all computed properties when password changes', () => {
      const password = ref('weak');
      const composable = usePasswordStrength(password);

      // Initial state
      expect(composable.meetsAllRequirements.value).toBe(false);
      expect(composable.isValid.value).toBe(false);
      expect(composable.strength.value.level).toBe('weak');

      // Update password
      password.value = 'StrongPassword123@';

      // Check updated state
      expect(composable.meetsAllRequirements.value).toBe(true);
      expect(composable.isValid.value).toBe(true);
      expect(composable.strength.value.level).toBe('strong');
    });

    it('should update requirements object reactively', () => {
      const password = ref('a');
      const { requirements } = usePasswordStrength(password);

      expect(requirements.value.length).toBe(false);
      expect(requirements.value.uppercase).toBe(false);
      expect(requirements.value.number).toBe(false);
      expect(requirements.value.special).toBe(false);

      password.value = 'A';
      expect(requirements.value.uppercase).toBe(true);
      expect(requirements.value.lowercase).toBe(false);

      password.value = 'Ab';
      expect(requirements.value.uppercase).toBe(true);
      expect(requirements.value.lowercase).toBe(true);

      password.value = 'Ab1';
      expect(requirements.value.number).toBe(true);

      password.value = 'Ab1@';
      expect(requirements.value.special).toBe(true);

      password.value = 'ValidPassword123@';
      expect(requirements.value.length).toBe(true);
      expect(Object.values(requirements.value).every(Boolean)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle password with only spaces', () => {
      const password = ref('            ');
      const { requirements, isValid } = usePasswordStrength(password);

      expect(requirements.value.length).toBe(true);
      expect(requirements.value.uppercase).toBe(false);
      expect(requirements.value.lowercase).toBe(false);
      expect(requirements.value.number).toBe(false);
      expect(requirements.value.special).toBe(false);
      expect(isValid.value).toBe(false);
    });

    it('should handle password exactly 12 characters', () => {
      const password = ref('Password123@');
      const { requirements } = usePasswordStrength(password);

      expect(requirements.value.length).toBe(true);
      expect(password.value.length).toBe(12);
    });

    it('should handle very long passwords', () => {
      const password = ref('VeryLongPassword123@'.repeat(10));
      const { requirements, isValid } = usePasswordStrength(password);

      expect(requirements.value.length).toBe(true);
      expect(isValid.value).toBe(true);
    });

    it('should handle unicode characters', () => {
      const password = ref('Unicode密码123@');
      const { requirements } = usePasswordStrength(password);

      expect(requirements.value.length).toBe(true);
      expect(requirements.value.special).toBe(true);
    });

    it('should handle password with multiple uppercase letters', () => {
      const password = ref('MULTIPLE123@');
      const { requirements } = usePasswordStrength(password);

      expect(requirements.value.uppercase).toBe(true);
      expect(requirements.value.lowercase).toBe(false);
    });

    it('should handle password with multiple numbers', () => {
      const password = ref('Password1234567890@');
      const { requirements } = usePasswordStrength(password);

      expect(requirements.value.number).toBe(true);
    });

    it('should handle password with multiple special characters', () => {
      const password = ref('Password123!@#$%');
      const { requirements } = usePasswordStrength(password);

      expect(requirements.value.special).toBe(true);
    });
  });
});
