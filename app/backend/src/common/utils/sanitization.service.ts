import { Injectable } from '@nestjs/common';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitization Service
 *
 * Provides input sanitization to prevent XSS attacks and SQL injection.
 * Uses DOMPurify to clean HTML and removes potentially dangerous content.
 *
 * Security features:
 * - Removes all HTML tags and scripts
 * - Prevents XSS attacks
 * - Removes SQL injection patterns
 * - Normalizes whitespace
 * - Trims input
 *
 * Usage:
 * ```typescript
 * constructor(private sanitizationService: SanitizationService) {}
 *
 * const clean = this.sanitizationService.sanitizeText(userInput);
 * ```
 */
@Injectable()
export class SanitizationService {
  constructor() {
    // DOMPurify is now a singleton from isomorphic-dompurify
  }

  /**
   * Sanitize text input - removes all HTML and dangerous content
   *
   * @param input - The text to sanitize
   * @returns Sanitized text safe for database storage
   */
  sanitizeText(input: string | null | undefined): string {
    if (!input) {
      return '';
    }

    // Convert to string if not already
    const stringInput = String(input);

    // Remove all HTML tags and sanitize
    const cleaned = DOMPurify.sanitize(stringInput, {
      ALLOWED_TAGS: [], // No HTML tags allowed
      ALLOWED_ATTR: [], // No attributes allowed
      KEEP_CONTENT: true, // Keep text content
    });

    // Additional cleaning: normalize whitespace and trim
    return cleaned.replace(/\s+/g, ' ').trim();
  }

  /**
   * Sanitize HTML input - allows safe HTML tags only
   *
   * @param input - The HTML to sanitize
   * @returns Sanitized HTML safe for storage and display
   */
  sanitizeHtml(input: string | null | undefined): string {
    if (!input) {
      return '';
    }

    const stringInput = String(input);

    // Allow only safe HTML tags
    const cleaned = DOMPurify.sanitize(stringInput, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'a'],
      ALLOWED_ATTR: ['href', 'title'],
      ALLOWED_URI_REGEXP:
        /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    });

    return cleaned.trim();
  }

  /**
   * Sanitize email address
   *
   * @param email - Email to sanitize
   * @returns Sanitized email
   */
  sanitizeEmail(email: string | null | undefined): string {
    if (!email) {
      return '';
    }

    // Remove HTML and trim
    const cleaned = this.sanitizeText(email);

    // Convert to lowercase for consistency
    return cleaned.toLowerCase().trim();
  }

  /**
   * Sanitize URL
   *
   * @param url - URL to sanitize
   * @returns Sanitized URL or empty string if invalid
   */
  sanitizeUrl(url: string | null | undefined): string {
    if (!url) {
      return '';
    }

    const cleaned = this.sanitizeText(url);

    // Basic URL validation - must start with http/https
    if (!cleaned.match(/^https?:\/\/.+/)) {
      return '';
    }

    return cleaned;
  }

  /**
   * Sanitize object - recursively sanitizes all string properties
   *
   * @param obj - Object to sanitize
   * @returns Sanitized object
   */
  sanitizeObject<T extends Record<string, any>>(obj: T): T {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const sanitized = {} as T;

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];

        if (typeof value === 'string') {
          // Sanitize string values
          sanitized[key] = this.sanitizeText(value) as T[Extract<keyof T, string>];
        } else if (Array.isArray(value)) {
          // Sanitize array elements
          sanitized[key] = value.map((item: any) =>
            typeof item === 'string' ? this.sanitizeText(item) : item,
          ) as T[Extract<keyof T, string>];
        } else if (value && typeof value === 'object') {
          // Recursively sanitize nested objects
          sanitized[key] = this.sanitizeObject(value);
        } else {
          // Keep non-string values as-is
          sanitized[key] = value;
        }
      }
    }

    return sanitized;
  }

  /**
   * Check if string contains potential SQL injection patterns
   *
   * @param input - Input to check
   * @returns True if suspicious patterns detected
   */
  containsSqlInjection(input: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
      /(;|\-\-|\/\*|\*\/)/,
      /(\bOR\b.*=.*)/i,
      /(\bAND\b.*=.*)/i,
      /'.*OR.*'/i,
      /".*OR.*"/i,
    ];

    return sqlPatterns.some((pattern) => pattern.test(input));
  }

  /**
   * Check if string contains potential XSS patterns
   *
   * @param input - Input to check
   * @returns True if suspicious patterns detected
   */
  containsXss(input: string): boolean {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi,
    ];

    return xssPatterns.some((pattern) => pattern.test(input));
  }
}
