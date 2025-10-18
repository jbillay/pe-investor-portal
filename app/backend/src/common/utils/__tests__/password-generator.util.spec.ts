import {
  generateTempPassword,
  getTempPasswordExpiration,
  isTempPasswordExpired,
} from '../password-generator.util';
import { TEMP_PASSWORD_CONFIG } from '../../constants/password.constants';

describe('password-generator.util', () => {
  describe('generateTempPassword', () => {
    it('should generate a password of correct length', () => {
      const password = generateTempPassword();
      expect(password).toHaveLength(TEMP_PASSWORD_CONFIG.LENGTH_BYTES);
    });

    it('should generate different passwords each time', () => {
      const password1 = generateTempPassword();
      const password2 = generateTempPassword();
      expect(password1).not.toBe(password2);
    });

    it('should only contain characters from charset', () => {
      const password = generateTempPassword();
      const charset = TEMP_PASSWORD_CONFIG.CHARSET;

      for (const char of password) {
        expect(charset).toContain(char);
      }
    });

    it('should generate 1000 unique passwords', () => {
      const passwords = new Set<string>();
      for (let i = 0; i < 1000; i++) {
        passwords.add(generateTempPassword());
      }
      expect(passwords.size).toBe(1000);
    });
  });

  describe('getTempPasswordExpiration', () => {
    it('should return expiration 72 hours from now', () => {
      const now = new Date();
      const expiration = getTempPasswordExpiration(now);

      const expectedTime = now.getTime() + TEMP_PASSWORD_CONFIG.EXPIRATION_MS;
      expect(expiration.getTime()).toBe(expectedTime);
    });

    it('should use current time if no date provided', () => {
      const before = new Date();
      const expiration = getTempPasswordExpiration();
      const after = new Date();

      const expectedMin = before.getTime() + TEMP_PASSWORD_CONFIG.EXPIRATION_MS;
      const expectedMax = after.getTime() + TEMP_PASSWORD_CONFIG.EXPIRATION_MS;

      expect(expiration.getTime()).toBeGreaterThanOrEqual(expectedMin);
      expect(expiration.getTime()).toBeLessThanOrEqual(expectedMax);
    });

    it('should work with past dates', () => {
      const pastDate = new Date('2020-01-01');
      const expiration = getTempPasswordExpiration(pastDate);

      const expectedTime = pastDate.getTime() + TEMP_PASSWORD_CONFIG.EXPIRATION_MS;
      expect(expiration.getTime()).toBe(expectedTime);
    });
  });

  describe('isTempPasswordExpired', () => {
    it('should return false for future expiration', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
      expect(isTempPasswordExpired(futureDate)).toBe(false);
    });

    it('should return true for past expiration', () => {
      const pastDate = new Date('2020-01-01');
      expect(isTempPasswordExpired(pastDate)).toBe(true);
    });

    it('should return true for current time (edge case)', () => {
      const now = new Date();
      // Sleep a tiny bit to ensure now is in the past
      jest.useFakeTimers();
      jest.advanceTimersByTime(1);
      expect(isTempPasswordExpired(now)).toBe(true);
      jest.useRealTimers();
    });

    it('should return true for null expiration', () => {
      expect(isTempPasswordExpired(null)).toBe(true);
    });

    it('should return false for expiration exactly 72 hours from now', () => {
      const expiration = getTempPasswordExpiration();
      expect(isTempPasswordExpired(expiration)).toBe(false);
    });
  });
});
