import { Transform } from 'class-transformer';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize decorator - automatically sanitizes string inputs
 *
 * Removes all HTML tags and dangerous content from string properties.
 * Apply to DTO properties that accept user input.
 *
 * @example
 * ```typescript
 * class CreateUserDto {
 *   @Sanitize()
 *   @IsString()
 *   firstName: string;
 *
 *   @Sanitize()
 *   @IsEmail()
 *   email: string;
 * }
 * ```
 */
export function Sanitize() {
  return Transform(({ value }) => {
    if (!value) {
      return value;
    }

    if (typeof value === 'string') {
      // Remove all HTML tags and sanitize
      const cleaned = DOMPurify.sanitize(value, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
        KEEP_CONTENT: true,
      });

      // Normalize whitespace and trim
      return cleaned.replace(/\s+/g, ' ').trim();
    }

    return value;
  });
}

/**
 * SanitizeHtml decorator - sanitizes HTML but allows safe tags
 *
 * Allows basic formatting tags but removes scripts and dangerous content.
 * Use for rich text fields.
 *
 * @example
 * ```typescript
 * class CreatePostDto {
 *   @SanitizeHtml()
 *   @IsString()
 *   content: string;
 * }
 * ```
 */
export function SanitizeHtml() {
  return Transform(({ value }) => {
    if (!value || typeof value !== 'string') {
      return value;
    }

    // Allow only safe HTML tags
    const cleaned = DOMPurify.sanitize(value, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3'],
      ALLOWED_ATTR: ['href', 'title'],
      ALLOWED_URI_REGEXP:
        /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    });

    return cleaned.trim();
  });
}

/**
 * SanitizeEmail decorator - sanitizes and normalizes email addresses
 *
 * Removes HTML, converts to lowercase, and trims.
 *
 * @example
 * ```typescript
 * class LoginDto {
 *   @SanitizeEmail()
 *   @IsEmail()
 *   email: string;
 * }
 * ```
 */
export function SanitizeEmail() {
  return Transform(({ value }) => {
    if (!value || typeof value !== 'string') {
      return value;
    }

    // Remove HTML and sanitize
    const cleaned = DOMPurify.sanitize(value, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true,
    });

    // Convert to lowercase and trim
    return cleaned.toLowerCase().replace(/\s+/g, '').trim();
  });
}

/**
 * SanitizeArray decorator - sanitizes all string elements in an array
 *
 * @example
 * ```typescript
 * class CreateTagsDto {
 *   @SanitizeArray()
 *   @IsArray()
 *   @IsString({ each: true })
 *   tags: string[];
 * }
 * ```
 */
export function SanitizeArray() {
  return Transform(({ value }) => {
    if (!Array.isArray(value)) {
      return value;
    }

    return value.map((item) => {
      if (typeof item === 'string') {
        const cleaned = DOMPurify.sanitize(item, {
          ALLOWED_TAGS: [],
          ALLOWED_ATTR: [],
          KEEP_CONTENT: true,
        });
        return cleaned.replace(/\s+/g, ' ').trim();
      }
      return item;
    });
  });
}

/**
 * TrimString decorator - trims whitespace from strings
 *
 * Simple decorator for trimming without full sanitization.
 *
 * @example
 * ```typescript
 * class UpdateDto {
 *   @TrimString()
 *   @IsString()
 *   name: string;
 * }
 * ```
 */
export function TrimString() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.trim();
    }
    return value;
  });
}

/**
 * Lowercase decorator - converts string to lowercase
 *
 * Useful for case-insensitive fields like usernames.
 *
 * @example
 * ```typescript
 * class CreateUserDto {
 *   @Lowercase()
 *   @Sanitize()
 *   @IsString()
 *   username: string;
 * }
 * ```
 */
export function Lowercase() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase();
    }
    return value;
  });
}
