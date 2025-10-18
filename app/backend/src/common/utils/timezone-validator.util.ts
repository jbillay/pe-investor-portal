/**
 * Utility functions for timezone validation using IANA timezone database
 */

// Cache for valid timezones to avoid repeated lookups
let validTimezones: string[] | null = null;

/**
 * Get list of all valid IANA timezones
 * Uses Intl.supportedValuesOf() which is available in Node.js 16+
 *
 * @returns Array of valid timezone identifiers
 */
export function getValidTimezones(): string[] {
  if (validTimezones === null) {
    try {
      // TypeScript may not have types for supportedValuesOf yet
      validTimezones = (Intl as any).supportedValuesOf('timeZone');
    } catch (error) {
      // Fallback to common timezones if supportedValuesOf is not available
      validTimezones = [
        'UTC',
        'America/New_York',
        'America/Chicago',
        'America/Denver',
        'America/Los_Angeles',
        'America/Anchorage',
        'Pacific/Honolulu',
        'Europe/London',
        'Europe/Paris',
        'Europe/Berlin',
        'Europe/Madrid',
        'Europe/Rome',
        'Asia/Dubai',
        'Asia/Tokyo',
        'Asia/Shanghai',
        'Asia/Hong_Kong',
        'Asia/Singapore',
        'Australia/Sydney',
        'Pacific/Auckland',
      ];
    }
  }

  // TypeScript doesn't know validTimezones is always set after the if block
  return validTimezones as string[];
}

/**
 * Validate if a timezone string is a valid IANA timezone identifier
 *
 * @param timezone - The timezone string to validate
 * @returns true if valid, false otherwise
 *
 * @example
 * isValidTimezone('America/New_York'); // true
 * isValidTimezone('US/Eastern'); // true
 * isValidTimezone('Invalid/Timezone'); // false
 */
export function isValidTimezone(timezone: string): boolean {
  if (!timezone || typeof timezone !== 'string') {
    return false;
  }

  // Try to use the timezone with Intl.DateTimeFormat
  // This is the most reliable way to validate timezones
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get timezone offset from UTC in hours
 *
 * @param timezone - IANA timezone identifier
 * @returns Offset in hours (e.g., -5 for EST, +1 for CET)
 *
 * @example
 * getTimezoneOffset('America/New_York'); // -5 (during EST) or -4 (during EDT)
 * getTimezoneOffset('Europe/Paris'); // +1 (during CET) or +2 (during CEST)
 */
export function getTimezoneOffset(timezone: string): number {
  if (!isValidTimezone(timezone)) {
    throw new Error(`Invalid timezone: ${timezone}`);
  }

  const now = new Date();

  // Get offset using Intl.DateTimeFormat
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'longOffset',
  });

  const parts = formatter.formatToParts(now);
  const timeZonePart = parts.find((part) => part.type === 'timeZoneName');

  if (timeZonePart && timeZonePart.value) {
    // Parse the offset string (e.g., "GMT-05:00" or "GMT+01:00")
    const match = timeZonePart.value.match(/GMT([+-])(\d{2}):?(\d{2})?/);
    if (match) {
      const sign = match[1] === '+' ? 1 : -1;
      const hours = parseInt(match[2], 10);
      const minutes = match[3] ? parseInt(match[3], 10) : 0;
      return sign * (hours + minutes / 60);
    }
  }

  // Fallback: calculate offset manually
  const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  const offsetMs = tzDate.getTime() - utcDate.getTime();
  return Math.round((offsetMs / (1000 * 60 * 60)) * 100) / 100;
}

/**
 * Format timezone display name
 *
 * @param timezone - IANA timezone identifier
 * @returns Formatted display name with offset
 *
 * @example
 * formatTimezoneDisplay('America/New_York'); // "America/New_York (UTC-5)"
 */
export function formatTimezoneDisplay(timezone: string): string {
  if (!isValidTimezone(timezone)) {
    return timezone;
  }

  try {
    const offset = getTimezoneOffset(timezone);
    const sign = offset >= 0 ? '+' : '';
    return `${timezone} (UTC${sign}${offset})`;
  } catch (error) {
    return timezone;
  }
}
