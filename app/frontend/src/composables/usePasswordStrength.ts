/**
 * Password Strength Composable
 * Provides reactive password strength validation and requirements checking
 * Follows Vue.js 3 Composition API best practices
 */

import { computed, type Ref } from 'vue';

/**
 * Password requirements interface
 */
export interface PasswordRequirements {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
}

/**
 * Password strength level
 */
export type PasswordStrengthLevel = 'weak' | 'medium' | 'strong';

/**
 * Password strength indicator data
 */
export interface PasswordStrength {
  percentage: number;
  label: string;
  color: string;
  bgColor: string;
  level: PasswordStrengthLevel;
}

/**
 * Password strength composable return type
 */
export interface UsePasswordStrengthReturn {
  // Computed
  requirements: Ref<PasswordRequirements>;
  strength: Ref<PasswordStrength>;
  isValid: Ref<boolean>;
  meetsAllRequirements: Ref<boolean>;

  // Utilities
  validatePassword: (password: string, confirmPassword?: string) => {
    isValid: boolean;
    errors: string[];
  };
  checkPasswordMatch: (password: string, confirmPassword: string) => boolean;
  cannotBeTemporaryPassword: (newPassword: string, tempPassword: string) => boolean;
}

/**
 * Password strength configuration
 */
const PASSWORD_CONFIG = {
  minLength: 12,
  specialCharsPattern: /[!@#$%^&*(),.?":{}|<>]/,
  uppercasePattern: /[A-Z]/,
  lowercasePattern: /[a-z]/,
  numberPattern: /[0-9]/,
} as const;

/**
 * Password strength thresholds
 */
const STRENGTH_THRESHOLDS = {
  strong: 5, // All requirements met
  medium: 3, // 3-4 requirements met
  weak: 0,   // 0-2 requirements met
} as const;

/**
 * Create password strength composable
 * Provides password validation and strength calculation
 *
 * @param password - Ref to the password being validated
 * @returns Password strength utilities and computed properties
 */
export function usePasswordStrength(password: Ref<string>): UsePasswordStrengthReturn {
  /**
   * Computed password requirements
   * Checks all password requirements against current password value
   */
  const requirements = computed<PasswordRequirements>(() => {
    const pwd = password.value;

    return {
      length: pwd.length >= PASSWORD_CONFIG.minLength,
      uppercase: PASSWORD_CONFIG.uppercasePattern.test(pwd),
      lowercase: PASSWORD_CONFIG.lowercasePattern.test(pwd),
      number: PASSWORD_CONFIG.numberPattern.test(pwd),
      special: PASSWORD_CONFIG.specialCharsPattern.test(pwd),
    };
  });

  /**
   * Computed password strength
   * Calculates strength based on met requirements
   */
  const strength = computed<PasswordStrength>(() => {
    const reqs = requirements.value;
    const metRequirements = Object.values(reqs).filter(Boolean).length;

    if (metRequirements >= STRENGTH_THRESHOLDS.strong) {
      return {
        percentage: 100,
        label: 'Strong',
        color: 'text-success-600',
        bgColor: 'bg-success-500',
        level: 'strong',
      };
    } else if (metRequirements >= STRENGTH_THRESHOLDS.medium) {
      return {
        percentage: 60,
        label: 'Medium',
        color: 'text-warning-600',
        bgColor: 'bg-warning-500',
        level: 'medium',
      };
    } else {
      return {
        percentage: 30,
        label: 'Weak',
        color: 'text-error-600',
        bgColor: 'bg-error-500',
        level: 'weak',
      };
    }
  });

  /**
   * Check if password is valid
   * Password is valid when it exists and meets all requirements
   */
  const isValid = computed<boolean>(() => {
    return !!password.value && meetsAllRequirements.value;
  });

  /**
   * Check if all password requirements are met
   */
  const meetsAllRequirements = computed<boolean>(() => {
    return Object.values(requirements.value).every(Boolean);
  });

  /**
   * Validate password with detailed error messages
   *
   * @param pwd - Password to validate
   * @param confirmPwd - Optional confirm password to check match
   * @returns Validation result with errors array
   */
  const validatePassword = (
    pwd: string,
    confirmPwd?: string
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!pwd) {
      errors.push('Password is required');
      return { isValid: false, errors };
    }

    // Check length requirement
    if (pwd.length < PASSWORD_CONFIG.minLength) {
      errors.push(`Password must be at least ${PASSWORD_CONFIG.minLength} characters long`);
    }

    // Check uppercase requirement
    if (!PASSWORD_CONFIG.uppercasePattern.test(pwd)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    // Check lowercase requirement
    if (!PASSWORD_CONFIG.lowercasePattern.test(pwd)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    // Check number requirement
    if (!PASSWORD_CONFIG.numberPattern.test(pwd)) {
      errors.push('Password must contain at least one number');
    }

    // Check special character requirement
    if (!PASSWORD_CONFIG.specialCharsPattern.test(pwd)) {
      errors.push('Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)');
    }

    // Check password match if confirmPassword provided
    if (confirmPwd !== undefined && pwd !== confirmPwd) {
      errors.push('Passwords do not match');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  /**
   * Check if password and confirm password match
   *
   * @param pwd - Password
   * @param confirmPwd - Confirm password
   * @returns True if passwords match
   */
  const checkPasswordMatch = (pwd: string, confirmPwd: string): boolean => {
    return pwd === confirmPwd && pwd.length > 0;
  };

  /**
   * Check if new password is different from temporary password
   *
   * @param newPwd - New password
   * @param tempPwd - Temporary password
   * @returns True if passwords are different
   */
  const cannotBeTemporaryPassword = (newPwd: string, tempPwd: string): boolean => {
    return newPwd !== tempPwd;
  };

  return {
    // Computed properties
    requirements,
    strength,
    isValid,
    meetsAllRequirements,

    // Utility functions
    validatePassword,
    checkPasswordMatch,
    cannotBeTemporaryPassword,
  };
}

/**
 * Get password requirement descriptions
 * Useful for displaying requirements in UI
 */
export function getPasswordRequirementDescriptions(): Array<{ key: keyof PasswordRequirements; label: string }> {
  return [
    { key: 'length', label: `At least ${PASSWORD_CONFIG.minLength} characters` },
    { key: 'uppercase', label: 'One uppercase letter' },
    { key: 'lowercase', label: 'One lowercase letter' },
    { key: 'number', label: 'One number' },
    { key: 'special', label: 'One special character' },
  ];
}
