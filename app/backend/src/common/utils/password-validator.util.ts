import {
  PASSWORD_REQUIREMENTS,
  PASSWORD_ERROR_MESSAGES,
} from '../constants/password.constants';

/**
 * Interface for password validation result
 */
export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Detailed validation result with individual checks
 */
export interface PasswordStrengthResult {
  isValid: boolean;
  hasMinLength: boolean;
  hasMaxLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  errors: string[];
}

/**
 * Validate password against all requirements
 *
 * @param password - The password to validate
 * @param email - Optional email to check if password contains it
 * @returns Validation result with errors
 *
 * @example
 * const result = validatePassword('MyPassword123!', 'user@example.com');
 * if (!result.isValid) {
 *   console.log(result.errors);
 * }
 */
export function validatePassword(
  password: string,
  email?: string
): PasswordValidationResult {
  const errors: string[] = [];

  // Check length
  if (password.length < PASSWORD_REQUIREMENTS.MIN_LENGTH) {
    errors.push(PASSWORD_ERROR_MESSAGES.TOO_SHORT);
  }

  if (password.length > PASSWORD_REQUIREMENTS.MAX_LENGTH) {
    errors.push(PASSWORD_ERROR_MESSAGES.TOO_LONG);
  }

  // Check uppercase
  if (
    PASSWORD_REQUIREMENTS.REQUIRE_UPPERCASE &&
    !PASSWORD_REQUIREMENTS.REGEX.UPPERCASE.test(password)
  ) {
    errors.push(PASSWORD_ERROR_MESSAGES.NO_UPPERCASE);
  }

  // Check lowercase
  if (
    PASSWORD_REQUIREMENTS.REQUIRE_LOWERCASE &&
    !PASSWORD_REQUIREMENTS.REGEX.LOWERCASE.test(password)
  ) {
    errors.push(PASSWORD_ERROR_MESSAGES.NO_LOWERCASE);
  }

  // Check number
  if (
    PASSWORD_REQUIREMENTS.REQUIRE_NUMBER &&
    !PASSWORD_REQUIREMENTS.REGEX.NUMBER.test(password)
  ) {
    errors.push(PASSWORD_ERROR_MESSAGES.NO_NUMBER);
  }

  // Check special character
  if (
    PASSWORD_REQUIREMENTS.REQUIRE_SPECIAL_CHAR &&
    !PASSWORD_REQUIREMENTS.REGEX.SPECIAL_CHAR.test(password)
  ) {
    errors.push(PASSWORD_ERROR_MESSAGES.NO_SPECIAL_CHAR);
  }

  // Check if password contains email
  if (email && password.toLowerCase().includes(email.toLowerCase())) {
    errors.push(PASSWORD_ERROR_MESSAGES.CONTAINS_EMAIL);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get detailed password strength information
 *
 * @param password - The password to analyze
 * @returns Detailed strength result
 *
 * @example
 * const strength = getPasswordStrength('MyPassword123!');
 * console.log(strength.hasUppercase); // true
 * console.log(strength.hasSpecialChar); // true
 */
export function getPasswordStrength(password: string): PasswordStrengthResult {
  const validation = validatePassword(password);

  return {
    isValid: validation.isValid,
    hasMinLength: password.length >= PASSWORD_REQUIREMENTS.MIN_LENGTH,
    hasMaxLength: password.length <= PASSWORD_REQUIREMENTS.MAX_LENGTH,
    hasUppercase: PASSWORD_REQUIREMENTS.REGEX.UPPERCASE.test(password),
    hasLowercase: PASSWORD_REQUIREMENTS.REGEX.LOWERCASE.test(password),
    hasNumber: PASSWORD_REQUIREMENTS.REGEX.NUMBER.test(password),
    hasSpecialChar: PASSWORD_REQUIREMENTS.REGEX.SPECIAL_CHAR.test(password),
    errors: validation.errors,
  };
}

/**
 * Validate that two passwords match
 *
 * @param password - First password
 * @param confirmPassword - Second password to compare
 * @returns Validation result
 *
 * @example
 * const result = validatePasswordMatch('MyPass123!', 'MyPass123!');
 * console.log(result.isValid); // true
 */
export function validatePasswordMatch(
  password: string,
  confirmPassword: string
): PasswordValidationResult {
  const errors: string[] = [];

  if (password !== confirmPassword) {
    errors.push(PASSWORD_ERROR_MESSAGES.PASSWORDS_DONT_MATCH);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate that new password is different from temporary password
 *
 * @param newPassword - The new password
 * @param tempPassword - The temporary password
 * @returns Validation result
 *
 * @example
 * const result = validatePasswordNotSame('NewPass123!', 'TempPass456!');
 * console.log(result.isValid); // true
 */
export function validatePasswordNotSame(
  newPassword: string,
  tempPassword: string
): PasswordValidationResult {
  const errors: string[] = [];

  if (newPassword === tempPassword) {
    errors.push(PASSWORD_ERROR_MESSAGES.SAME_AS_TEMP);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Comprehensive password validation for setting new password
 * Includes all checks: strength, match, not same as temp
 *
 * @param newPassword - The new password
 * @param confirmPassword - Confirmation password
 * @param email - User's email
 * @param tempPassword - Optional temporary password to check against
 * @returns Validation result with all errors
 *
 * @example
 * const result = validateNewPassword(
 *   'MyNewPass123!',
 *   'MyNewPass123!',
 *   'user@example.com',
 *   'TempPass456!'
 * );
 */
export function validateNewPassword(
  newPassword: string,
  confirmPassword: string,
  email: string,
  tempPassword?: string
): PasswordValidationResult {
  const errors: string[] = [];

  // Validate password strength
  const strengthResult = validatePassword(newPassword, email);
  errors.push(...strengthResult.errors);

  // Validate passwords match
  const matchResult = validatePasswordMatch(newPassword, confirmPassword);
  errors.push(...matchResult.errors);

  // Validate not same as temp password
  if (tempPassword) {
    const notSameResult = validatePasswordNotSame(newPassword, tempPassword);
    errors.push(...notSameResult.errors);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
