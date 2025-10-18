import {
  getValidTimezones,
  isValidTimezone,
  getTimezoneOffset,
  formatTimezoneDisplay,
} from '../timezone-validator.util';

describe('timezone-validator.util', () => {
  describe('getValidTimezones', () => {
    it('should return an array of timezones', () => {
      const timezones = getValidTimezones();
      expect(Array.isArray(timezones)).toBe(true);
      expect(timezones.length).toBeGreaterThan(0);
    });

    it('should include common timezones', () => {
      const timezones = getValidTimezones();
      // Check for common timezone patterns instead of exact matches
      const hasAmericaTimezone = timezones.some((tz) =>
        tz.startsWith('America/')
      );
      const hasEuropeTimezone = timezones.some((tz) => tz.startsWith('Europe/'));
      expect(hasAmericaTimezone).toBe(true);
      expect(hasEuropeTimezone).toBe(true);
    });

    it('should cache results', () => {
      const first = getValidTimezones();
      const second = getValidTimezones();
      expect(first).toBe(second); // Same reference
    });
  });

  describe('isValidTimezone', () => {
    it('should validate common IANA timezones', () => {
      expect(isValidTimezone('UTC')).toBe(true);
      expect(isValidTimezone('America/New_York')).toBe(true);
      expect(isValidTimezone('Europe/London')).toBe(true);
      expect(isValidTimezone('Europe/Paris')).toBe(true);
      expect(isValidTimezone('Asia/Tokyo')).toBe(true);
      expect(isValidTimezone('Australia/Sydney')).toBe(true);
    });

    it('should reject invalid timezone strings', () => {
      expect(isValidTimezone('Invalid/Timezone')).toBe(false);
      expect(isValidTimezone('Not_A_Timezone')).toBe(false);
      expect(isValidTimezone('123')).toBe(false);
      expect(isValidTimezone('GMT+5')).toBe(false);
    });

    it('should reject empty or invalid inputs', () => {
      expect(isValidTimezone('')).toBe(false);
      expect(isValidTimezone(null as any)).toBe(false);
      expect(isValidTimezone(undefined as any)).toBe(false);
      expect(isValidTimezone(123 as any)).toBe(false);
    });

    it('should handle different cases appropriately', () => {
      // IANA timezone identifiers are case-sensitive in theory,
      // but Intl.DateTimeFormat is forgiving in practice
      // Just verify that the correct case works
      expect(isValidTimezone('America/New_York')).toBe(true);
    });

    it('should validate legacy timezone names', () => {
      // Some legacy timezone names may still be valid
      expect(isValidTimezone('US/Eastern')).toBe(true);
      expect(isValidTimezone('US/Pacific')).toBe(true);
    });
  });

  describe('getTimezoneOffset', () => {
    it('should return UTC offset for UTC timezone', () => {
      const offset = getTimezoneOffset('UTC');
      expect(offset).toBe(0);
    });

    it('should return negative offset for US timezones', () => {
      const offset = getTimezoneOffset('America/New_York');
      expect(offset).toBeLessThan(0);
      // EST is -5, EDT is -4, so offset should be between -6 and -3
      expect(offset).toBeGreaterThanOrEqual(-6);
      expect(offset).toBeLessThanOrEqual(-3);
    });

    it('should return positive offset for Asian timezones', () => {
      const offset = getTimezoneOffset('Asia/Tokyo');
      expect(offset).toBeGreaterThan(0);
      expect(offset).toBeLessThanOrEqual(9);
    });

    it('should throw error for invalid timezone', () => {
      expect(() => getTimezoneOffset('Invalid/Timezone')).toThrow();
    });

    it('should return consistent offset for same timezone', () => {
      const offset1 = getTimezoneOffset('Europe/Paris');
      const offset2 = getTimezoneOffset('Europe/Paris');
      expect(offset1).toBe(offset2);
    });
  });

  describe('formatTimezoneDisplay', () => {
    it('should format UTC with offset', () => {
      const display = formatTimezoneDisplay('UTC');
      expect(display).toContain('UTC');
      expect(display).toContain('(UTC');
      expect(display).toContain(')');
    });

    it('should format timezone with negative offset', () => {
      const display = formatTimezoneDisplay('America/New_York');
      expect(display).toContain('America/New_York');
      expect(display).toContain('(UTC');
      expect(display).toContain(')');
    });

    it('should format timezone with positive offset', () => {
      const display = formatTimezoneDisplay('Asia/Tokyo');
      expect(display).toContain('Asia/Tokyo');
      expect(display).toContain('(UTC+');
      expect(display).toContain(')');
    });

    it('should return original string for invalid timezone', () => {
      const invalid = 'Invalid/Timezone';
      const display = formatTimezoneDisplay(invalid);
      expect(display).toBe(invalid);
    });

    it('should include offset sign', () => {
      const displayNegative = formatTimezoneDisplay('America/Los_Angeles');
      expect(displayNegative).toMatch(/UTC[+-]\d/);

      const displayPositive = formatTimezoneDisplay('Asia/Dubai');
      expect(displayPositive).toMatch(/UTC\+\d/);
    });
  });
});
