import {
  getValidTimezones,
  isValidTimezone,
  getTimezoneOffset,
  formatTimezoneDisplay,
} from './timezone-validator.util';

describe('Timezone Validator Utility', () => {
  describe('getValidTimezones', () => {
    it('should return array of valid timezones', () => {
      const timezones = getValidTimezones();

      expect(Array.isArray(timezones)).toBe(true);
      expect(timezones.length).toBeGreaterThan(0);
    });

    it('should cache timezones on subsequent calls', () => {
      const timezones1 = getValidTimezones();
      const timezones2 = getValidTimezones();

      expect(timezones1).toBe(timezones2); // Same array reference
    });

    it('should include common timezones', () => {
      const timezones = getValidTimezones();

      expect(timezones.length).toBeGreaterThan(10);
      // Should include at least some common timezones
      const hasCommonTimezone = timezones.some(tz =>
        tz.includes('America/') || tz.includes('Europe/') || tz.includes('Asia/')
      );
      expect(hasCommonTimezone).toBe(true);
    });
  });

  describe('isValidTimezone', () => {
    it('should validate UTC timezone', () => {
      expect(isValidTimezone('UTC')).toBe(true);
    });

    it('should validate America/New_York timezone', () => {
      expect(isValidTimezone('America/New_York')).toBe(true);
    });

    it('should validate Europe/London timezone', () => {
      expect(isValidTimezone('Europe/London')).toBe(true);
    });

    it('should validate Asia/Tokyo timezone', () => {
      expect(isValidTimezone('Asia/Tokyo')).toBe(true);
    });

    it('should reject invalid timezone', () => {
      expect(isValidTimezone('Invalid/Timezone')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isValidTimezone('')).toBe(false);
    });

    it('should reject null', () => {
      expect(isValidTimezone(null as any)).toBe(false);
    });

    it('should reject undefined', () => {
      expect(isValidTimezone(undefined as any)).toBe(false);
    });

    it('should reject non-string input', () => {
      expect(isValidTimezone(123 as any)).toBe(false);
    });

    it('should reject object input', () => {
      expect(isValidTimezone({} as any)).toBe(false);
    });
  });

  describe('getTimezoneOffset', () => {
    it('should get offset for UTC (should be 0)', () => {
      const offset = getTimezoneOffset('UTC');

      expect(offset).toBe(0);
    });

    it('should get offset for valid timezone', () => {
      const offset = getTimezoneOffset('America/New_York');

      // EST is -5, EDT is -4
      expect(offset).toBeGreaterThanOrEqual(-5);
      expect(offset).toBeLessThanOrEqual(-4);
    });

    it('should get positive offset for eastern timezones', () => {
      const offset = getTimezoneOffset('Asia/Tokyo');

      expect(offset).toBeGreaterThan(0);
    });

    it('should throw error for invalid timezone', () => {
      expect(() => getTimezoneOffset('Invalid/Timezone')).toThrow('Invalid timezone');
    });

    it('should handle timezone with fractional offset', () => {
      // Some timezones have 30 or 45 minute offsets
      const offset = getTimezoneOffset('Asia/Kolkata'); // UTC+5:30

      expect(typeof offset).toBe('number');
    });
  });

  describe('formatTimezoneDisplay', () => {
    it('should format UTC timezone', () => {
      const formatted = formatTimezoneDisplay('UTC');

      expect(formatted).toContain('UTC');
      expect(formatted).toContain('0');
    });

    it('should format timezone with positive offset', () => {
      const formatted = formatTimezoneDisplay('Asia/Tokyo');

      expect(formatted).toContain('Asia/Tokyo');
      expect(formatted).toContain('UTC');
      expect(formatted).toContain('+');
    });

    it('should format timezone with negative offset', () => {
      const formatted = formatTimezoneDisplay('America/New_York');

      expect(formatted).toContain('America/New_York');
      expect(formatted).toContain('UTC');
      expect(formatted).toContain('-');
    });

    it('should return original string for invalid timezone', () => {
      const invalidTz = 'Invalid/Timezone';
      const formatted = formatTimezoneDisplay(invalidTz);

      expect(formatted).toBe(invalidTz);
    });

    it('should handle formatting error gracefully', () => {
      const formatted = formatTimezoneDisplay('');

      expect(typeof formatted).toBe('string');
    });
  });
});
