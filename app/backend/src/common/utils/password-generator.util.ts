import { randomBytes } from 'crypto';
import { TEMP_PASSWORD_CONFIG } from '../constants/password.constants';

/**
 * Generate a cryptographically secure temporary password
 *
 * @returns A secure random password string
 *
 * @example
 * const tempPassword = generateTempPassword();
 * // Returns something like: "aBc2dEf3gHjK4mNp5qRs"
 */
export function generateTempPassword(): string {
  const { LENGTH_BYTES, CHARSET } = TEMP_PASSWORD_CONFIG;

  // Generate random bytes
  const randomBytesBuffer = randomBytes(LENGTH_BYTES);

  // Convert to characters from our charset
  let password = '';
  for (let i = 0; i < LENGTH_BYTES; i++) {
    const randomIndex = randomBytesBuffer[i] % CHARSET.length;
    password += CHARSET[randomIndex];
  }

  return password;
}

/**
 * Calculate expiration timestamp for temporary password
 *
 * @param fromDate - Optional starting date (defaults to now)
 * @returns Date object representing expiration time
 *
 * @example
 * const expiresAt = getTempPasswordExpiration();
 * // Returns date 72 hours from now
 */
export function getTempPasswordExpiration(fromDate: Date = new Date()): Date {
  return new Date(fromDate.getTime() + TEMP_PASSWORD_CONFIG.EXPIRATION_MS);
}

/**
 * Check if a temporary password has expired
 *
 * @param expiresAt - The expiration timestamp
 * @returns true if expired, false otherwise
 *
 * @example
 * const isExpired = isTempPasswordExpired(user.tempPasswordExpiresAt);
 */
export function isTempPasswordExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) {
    return true; // If no expiration set, consider it expired
  }

  return new Date() > expiresAt;
}
