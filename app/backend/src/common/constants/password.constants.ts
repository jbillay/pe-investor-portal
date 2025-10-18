/**
 * Password security constants following industry best practices
 * Based on NIST 800-63B and OWASP guidelines
 */

export const PASSWORD_REQUIREMENTS = {
  /**
   * Minimum password length
   * NIST recommends at least 8 characters, but 12+ is considered best practice
   */
  MIN_LENGTH: 12,

  /**
   * Maximum password length to prevent DOS attacks
   */
  MAX_LENGTH: 128,

  /**
   * Password complexity requirements
   */
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL_CHAR: true,

  /**
   * Special characters allowed in passwords
   */
  SPECIAL_CHARS: '!@#$%^&*()_+-=[]{}|;:,.<>?',

  /**
   * Regular expressions for validation
   */
  REGEX: {
    UPPERCASE: /[A-Z]/,
    LOWERCASE: /[a-z]/,
    NUMBER: /[0-9]/,
    SPECIAL_CHAR: /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/,
  },
} as const;

export const TEMP_PASSWORD_CONFIG = {
  /**
   * Temporary password expiration time in milliseconds
   * 72 hours = 72 * 60 * 60 * 1000 = 259200000 ms
   */
  EXPIRATION_MS: 72 * 60 * 60 * 1000,

  /**
   * Length of generated temporary passwords (in bytes)
   * Will result in 20 characters meeting all password requirements
   */
  LENGTH_BYTES: 20,

  /**
   * Character set for temporary password generation
   * Includes uppercase, lowercase, numbers, and special characters
   * Some confusing characters omitted for better readability (I, l, O, 0, 1)
   */
  CHARSET: 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*',
} as const;

export const PASSWORD_HASHING = {
  /**
   * Bcrypt salt rounds
   * 12 rounds is a good balance between security and performance
   */
  SALT_ROUNDS: 12,
} as const;

/**
 * Password validation error messages
 */
export const PASSWORD_ERROR_MESSAGES = {
  TOO_SHORT: `Password must be at least ${PASSWORD_REQUIREMENTS.MIN_LENGTH} characters long`,
  TOO_LONG: `Password must not exceed ${PASSWORD_REQUIREMENTS.MAX_LENGTH} characters`,
  NO_UPPERCASE: 'Password must contain at least one uppercase letter (A-Z)',
  NO_LOWERCASE: 'Password must contain at least one lowercase letter (a-z)',
  NO_NUMBER: 'Password must contain at least one number (0-9)',
  NO_SPECIAL_CHAR: `Password must contain at least one special character (${PASSWORD_REQUIREMENTS.SPECIAL_CHARS})`,
  CONTAINS_EMAIL: 'Password must not contain your email address',
  SAME_AS_TEMP: 'New password must be different from temporary password',
  PASSWORDS_DONT_MATCH: 'Passwords do not match',
  TEMP_PASSWORD_EXPIRED: 'Temporary password has expired. Please contact support.',
  INVALID_TEMP_PASSWORD: 'Invalid temporary password',
} as const;

/**
 * Audit log actions for password operations
 */
export const PASSWORD_AUDIT_ACTIONS = {
  PASSWORD_SET: 'PASSWORD_SET',
  TEMP_PASSWORD_GENERATED: 'TEMP_PASSWORD_GENERATED',
  PASSWORD_CHANGE_REQUIRED: 'PASSWORD_CHANGE_REQUIRED',
  PASSWORD_VALIDATION_FAILED: 'PASSWORD_VALIDATION_FAILED',
} as const;
