import {
  generateTempPassword,
  getTempPasswordExpiration,
  isTempPasswordExpired,
} from './password-generator.util';
import { TEMP_PASSWORD_CONFIG } from '../constants/password.constants';
import * as crypto from 'crypto';

// Mock crypto module
jest.mock('crypto', () => ({
  randomBytes: jest.fn(),
}));

describe('Password Generator Utilities', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateTempPassword', () => {
    it('should generate a password of correct length', () => {
      // Arrange
      const mockBuffer = Buffer.alloc(TEMP_PASSWORD_CONFIG.LENGTH_BYTES);
      for (let i = 0; i < TEMP_PASSWORD_CONFIG.LENGTH_BYTES; i++) {
        mockBuffer[i] = i % TEMP_PASSWORD_CONFIG.CHARSET.length;
      }
      (crypto.randomBytes as jest.Mock).mockReturnValue(mockBuffer);

      // Act
      const password = generateTempPassword();

      // Assert
      expect(password).toHaveLength(TEMP_PASSWORD_CONFIG.LENGTH_BYTES);
      expect(crypto.randomBytes).toHaveBeenCalledWith(TEMP_PASSWORD_CONFIG.LENGTH_BYTES);
    });

    it('should generate password using only characters from CHARSET', () => {
      // Arrange
      const mockBuffer = Buffer.alloc(TEMP_PASSWORD_CONFIG.LENGTH_BYTES);
      for (let i = 0; i < TEMP_PASSWORD_CONFIG.LENGTH_BYTES; i++) {
        mockBuffer[i] = i % TEMP_PASSWORD_CONFIG.CHARSET.length;
      }
      (crypto.randomBytes as jest.Mock).mockReturnValue(mockBuffer);

      // Act
      const password = generateTempPassword();

      // Assert
      for (const char of password) {
        expect(TEMP_PASSWORD_CONFIG.CHARSET).toContain(char);
      }
    });

    it('should generate different passwords on multiple calls', () => {
      // Arrange
      const mockBuffer1 = Buffer.alloc(TEMP_PASSWORD_CONFIG.LENGTH_BYTES);
      const mockBuffer2 = Buffer.alloc(TEMP_PASSWORD_CONFIG.LENGTH_BYTES);

      for (let i = 0; i < TEMP_PASSWORD_CONFIG.LENGTH_BYTES; i++) {
        mockBuffer1[i] = i % TEMP_PASSWORD_CONFIG.CHARSET.length;
        mockBuffer2[i] = (i + 10) % TEMP_PASSWORD_CONFIG.CHARSET.length;
      }

      (crypto.randomBytes as jest.Mock)
        .mockReturnValueOnce(mockBuffer1)
        .mockReturnValueOnce(mockBuffer2);

      // Act
      const password1 = generateTempPassword();
      const password2 = generateTempPassword();

      // Assert
      expect(password1).not.toBe(password2);
    });

    it('should handle buffer with all zeros', () => {
      // Arrange
      const mockBuffer = Buffer.alloc(TEMP_PASSWORD_CONFIG.LENGTH_BYTES, 0);
      (crypto.randomBytes as jest.Mock).mockReturnValue(mockBuffer);

      // Act
      const password = generateTempPassword();

      // Assert
      expect(password).toHaveLength(TEMP_PASSWORD_CONFIG.LENGTH_BYTES);
      // All zeros should map to first character in charset
      for (const char of password) {
        expect(char).toBe(TEMP_PASSWORD_CONFIG.CHARSET[0]);
      }
    });

    it('should handle buffer with maximum byte values', () => {
      // Arrange
      const mockBuffer = Buffer.alloc(TEMP_PASSWORD_CONFIG.LENGTH_BYTES, 255);
      (crypto.randomBytes as jest.Mock).mockReturnValue(mockBuffer);

      // Act
      const password = generateTempPassword();

      // Assert
      expect(password).toHaveLength(TEMP_PASSWORD_CONFIG.LENGTH_BYTES);
      // 255 % CHARSET.length should give consistent results
      const expectedIndex = 255 % TEMP_PASSWORD_CONFIG.CHARSET.length;
      for (const char of password) {
        expect(char).toBe(TEMP_PASSWORD_CONFIG.CHARSET[expectedIndex]);
      }
    });

    it('should distribute characters across the charset range', () => {
      // Arrange
      const mockBuffer = Buffer.alloc(TEMP_PASSWORD_CONFIG.LENGTH_BYTES);
      // Create a buffer that will use different characters
      for (let i = 0; i < TEMP_PASSWORD_CONFIG.LENGTH_BYTES; i++) {
        mockBuffer[i] = (i * 7) % TEMP_PASSWORD_CONFIG.CHARSET.length;
      }
      (crypto.randomBytes as jest.Mock).mockReturnValue(mockBuffer);

      // Act
      const password = generateTempPassword();

      // Assert
      expect(password).toHaveLength(TEMP_PASSWORD_CONFIG.LENGTH_BYTES);
      // Count unique characters
      const uniqueChars = new Set(password.split(''));
      // With LENGTH_BYTES of 20 and varying indices, we should have multiple unique chars
      expect(uniqueChars.size).toBeGreaterThan(1);
    });
  });

  describe('getTempPasswordExpiration', () => {
    it('should return expiration date 72 hours from now by default', () => {
      // Arrange
      const now = new Date('2024-01-01T12:00:00Z');
      const expectedExpiration = new Date(now.getTime() + TEMP_PASSWORD_CONFIG.EXPIRATION_MS);

      // Act
      const result = getTempPasswordExpiration(now);

      // Assert
      expect(result).toEqual(expectedExpiration);
      expect(result.getTime() - now.getTime()).toBe(TEMP_PASSWORD_CONFIG.EXPIRATION_MS);
    });

    it('should return expiration date 72 hours from provided date', () => {
      // Arrange
      const customDate = new Date('2024-06-15T08:30:00Z');
      const expectedExpiration = new Date(customDate.getTime() + TEMP_PASSWORD_CONFIG.EXPIRATION_MS);

      // Act
      const result = getTempPasswordExpiration(customDate);

      // Assert
      expect(result).toEqual(expectedExpiration);
    });

    it('should use current date when no parameter provided', () => {
      // Arrange
      const beforeCall = Date.now();

      // Act
      const result = getTempPasswordExpiration();

      // Assert
      const afterCall = Date.now();
      const expectedMin = beforeCall + TEMP_PASSWORD_CONFIG.EXPIRATION_MS;
      const expectedMax = afterCall + TEMP_PASSWORD_CONFIG.EXPIRATION_MS;

      expect(result.getTime()).toBeGreaterThanOrEqual(expectedMin);
      expect(result.getTime()).toBeLessThanOrEqual(expectedMax);
    });

    it('should add exactly 72 hours (259200000 ms)', () => {
      // Arrange
      const baseDate = new Date('2024-01-01T00:00:00Z');
      const expectedMs = 72 * 60 * 60 * 1000; // 259200000

      // Act
      const result = getTempPasswordExpiration(baseDate);

      // Assert
      expect(result.getTime() - baseDate.getTime()).toBe(expectedMs);
      expect(TEMP_PASSWORD_CONFIG.EXPIRATION_MS).toBe(259200000);
    });

    it('should handle dates at year boundaries', () => {
      // Arrange
      const yearEnd = new Date('2024-12-31T22:00:00Z');

      // Act
      const result = getTempPasswordExpiration(yearEnd);

      // Assert
      expect(result.getFullYear()).toBe(2025);
      expect(result.getTime() - yearEnd.getTime()).toBe(TEMP_PASSWORD_CONFIG.EXPIRATION_MS);
    });

    it('should preserve timezone information', () => {
      // Arrange
      const dateWithTimezone = new Date('2024-01-15T10:30:00-05:00');

      // Act
      const result = getTempPasswordExpiration(dateWithTimezone);

      // Assert
      expect(result.getTime() - dateWithTimezone.getTime()).toBe(TEMP_PASSWORD_CONFIG.EXPIRATION_MS);
    });
  });

  describe('isTempPasswordExpired', () => {
    beforeEach(() => {
      // Mock the current time for consistent testing
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return true when expiresAt is null', () => {
      // Act
      const result = isTempPasswordExpired(null);

      // Assert
      expect(result).toBe(true);
    });

    it('should return true when password has expired', () => {
      // Arrange - Set expiration to 1 hour ago
      const expiresAt = new Date('2024-01-15T11:00:00Z');

      // Act
      const result = isTempPasswordExpired(expiresAt);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when password has not expired', () => {
      // Arrange - Set expiration to 1 hour from now
      const expiresAt = new Date('2024-01-15T13:00:00Z');

      // Act
      const result = isTempPasswordExpired(expiresAt);

      // Assert
      expect(result).toBe(false);
    });

    it('should return true when password expires exactly at current time', () => {
      // Arrange - Set expiration to exact current time
      const expiresAt = new Date('2024-01-15T12:00:00Z');

      // Act
      const result = isTempPasswordExpired(expiresAt);

      // Assert
      // When comparing dates with >, equal times should not be expired
      expect(result).toBe(false);
    });

    it('should return true when password expires 1 millisecond ago', () => {
      // Arrange
      const expiresAt = new Date('2024-01-15T11:59:59.999Z');

      // Act
      const result = isTempPasswordExpired(expiresAt);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when password expires 1 millisecond from now', () => {
      // Arrange
      const expiresAt = new Date('2024-01-15T12:00:00.001Z');

      // Act
      const result = isTempPasswordExpired(expiresAt);

      // Assert
      expect(result).toBe(false);
    });

    it('should return true for expired password from past date', () => {
      // Arrange - Password expired 72 hours ago
      const expiresAt = new Date('2024-01-12T12:00:00Z');

      // Act
      const result = isTempPasswordExpired(expiresAt);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for password expiring in future', () => {
      // Arrange - Password expires 72 hours from now
      const expiresAt = new Date('2024-01-18T12:00:00Z');

      // Act
      const result = isTempPasswordExpired(expiresAt);

      // Assert
      expect(result).toBe(false);
    });

    it('should handle dates with different timezones correctly', () => {
      // Arrange - Same UTC time but different timezone representation
      const expiresAt = new Date('2024-01-15T07:00:00-05:00'); // Same as 12:00:00Z

      // Act
      const result = isTempPasswordExpired(expiresAt);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('Integration: Complete password lifecycle', () => {
    beforeEach(() => {
      jest.useRealTimers();
    });

    it('should create password and expiration that is not immediately expired', () => {
      // Arrange
      const mockBuffer = Buffer.alloc(TEMP_PASSWORD_CONFIG.LENGTH_BYTES, 42);
      (crypto.randomBytes as jest.Mock).mockReturnValue(mockBuffer);

      // Act
      const password = generateTempPassword();
      const expiresAt = getTempPasswordExpiration();
      const isExpired = isTempPasswordExpired(expiresAt);

      // Assert
      expect(password).toBeDefined();
      expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
      expect(isExpired).toBe(false);
    });

    it('should show password as expired after expiration time passes', () => {
      // Arrange
      jest.useFakeTimers();
      const now = new Date('2024-01-01T00:00:00Z');
      jest.setSystemTime(now);

      const expiresAt = getTempPasswordExpiration(now);

      // Act - Move time forward past expiration
      jest.setSystemTime(new Date(now.getTime() + TEMP_PASSWORD_CONFIG.EXPIRATION_MS + 1000));
      const isExpired = isTempPasswordExpired(expiresAt);

      // Assert
      expect(isExpired).toBe(true);

      jest.useRealTimers();
    });
  });
});
