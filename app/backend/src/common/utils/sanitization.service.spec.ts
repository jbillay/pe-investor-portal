import { Test, TestingModule } from '@nestjs/testing';
import { SanitizationService } from './sanitization.service';

describe('SanitizationService', () => {
  let service: SanitizationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SanitizationService],
    }).compile();

    service = module.get<SanitizationService>(SanitizationService);
  });

  describe('sanitizeText', () => {
    it('should return empty string for null input', () => {
      expect(service.sanitizeText(null)).toBe('');
    });

    it('should return empty string for undefined input', () => {
      expect(service.sanitizeText(undefined)).toBe('');
    });

    it('should sanitize plain text', () => {
      const result = service.sanitizeText('Hello World');
      expect(result).toBe('Hello World');
    });

    it('should remove all HTML tags', () => {
      const result = service.sanitizeText('<div>Hello <strong>World</strong></div>');
      expect(result).toBe('Hello World');
    });

    it('should remove script tags and content', () => {
      const result = service.sanitizeText('<script>alert("xss")</script>Hello');
      expect(result).toBe('Hello');
    });

    it('should remove dangerous attributes', () => {
      const result = service.sanitizeText('<img src="x" onerror="alert(1)">');
      expect(result).toBe('');
    });

    it('should normalize multiple spaces to single space', () => {
      const result = service.sanitizeText('Hello    World');
      expect(result).toBe('Hello World');
    });

    it('should trim leading and trailing whitespace', () => {
      const result = service.sanitizeText('  Hello World  ');
      expect(result).toBe('Hello World');
    });

    it('should handle newlines and tabs', () => {
      const result = service.sanitizeText('Hello\n\tWorld');
      expect(result).toBe('Hello World');
    });

    it('should convert non-string input to string', () => {
      const result = service.sanitizeText(12345 as any);
      expect(result).toBe('12345');
    });

    it('should handle empty string', () => {
      const result = service.sanitizeText('');
      expect(result).toBe('');
    });
  });

  describe('sanitizeHtml', () => {
    it('should return empty string for null input', () => {
      expect(service.sanitizeHtml(null)).toBe('');
    });

    it('should return empty string for undefined input', () => {
      expect(service.sanitizeHtml(undefined)).toBe('');
    });

    it('should allow safe HTML tags', () => {
      const result = service.sanitizeHtml('<p>Hello <strong>World</strong></p>');
      expect(result).toContain('Hello');
      expect(result).toContain('World');
    });

    it('should allow paragraph tags', () => {
      const result = service.sanitizeHtml('<p>Paragraph</p>');
      expect(result).toContain('Paragraph');
    });

    it('should allow list tags', () => {
      const result = service.sanitizeHtml('<ul><li>Item 1</li><li>Item 2</li></ul>');
      expect(result).toContain('Item 1');
      expect(result).toContain('Item 2');
    });

    it('should allow safe link tags with href', () => {
      const result = service.sanitizeHtml('<a href="https://example.com">Link</a>');
      expect(result).toContain('Link');
      expect(result).toContain('href');
    });

    it('should remove script tags', () => {
      const result = service.sanitizeHtml('<p>Text</p><script>alert("xss")</script>');
      expect(result).not.toContain('script');
      expect(result).not.toContain('alert');
    });

    it('should remove dangerous event handlers', () => {
      const result = service.sanitizeHtml('<p onclick="alert(1)">Text</p>');
      expect(result).not.toContain('onclick');
    });

    it('should remove iframe tags', () => {
      const result = service.sanitizeHtml('<iframe src="evil.com"></iframe>');
      expect(result).not.toContain('iframe');
    });

    it('should trim whitespace', () => {
      const result = service.sanitizeHtml('  <p>Text</p>  ');
      expect(result).not.toMatch(/^\s+/);
      expect(result).not.toMatch(/\s+$/);
    });

    it('should handle empty string', () => {
      const result = service.sanitizeHtml('');
      expect(result).toBe('');
    });
  });

  describe('sanitizeEmail', () => {
    it('should return empty string for null input', () => {
      expect(service.sanitizeEmail(null)).toBe('');
    });

    it('should return empty string for undefined input', () => {
      expect(service.sanitizeEmail(undefined)).toBe('');
    });

    it('should convert email to lowercase', () => {
      const result = service.sanitizeEmail('TEST@EXAMPLE.COM');
      expect(result).toBe('test@example.com');
    });

    it('should remove HTML from email', () => {
      const result = service.sanitizeEmail('<div>test@example.com</div>');
      expect(result).toBe('test@example.com');
    });

    it('should trim whitespace from email', () => {
      const result = service.sanitizeEmail('  test@example.com  ');
      expect(result).toBe('test@example.com');
    });

    it('should handle valid email format', () => {
      const result = service.sanitizeEmail('user.name+tag@example.co.uk');
      expect(result).toBe('user.name+tag@example.co.uk');
    });

    it('should normalize spaces in email', () => {
      const result = service.sanitizeEmail('test  @  example.com');
      expect(result).toBe('test @ example.com');
    });
  });

  describe('sanitizeUrl', () => {
    it('should return empty string for null input', () => {
      expect(service.sanitizeUrl(null)).toBe('');
    });

    it('should return empty string for undefined input', () => {
      expect(service.sanitizeUrl(undefined)).toBe('');
    });

    it('should accept valid HTTPS URL', () => {
      const result = service.sanitizeUrl('https://example.com');
      expect(result).toBe('https://example.com');
    });

    it('should accept valid HTTP URL', () => {
      const result = service.sanitizeUrl('http://example.com');
      expect(result).toBe('http://example.com');
    });

    it('should reject URL without protocol', () => {
      const result = service.sanitizeUrl('example.com');
      expect(result).toBe('');
    });

    it('should reject javascript: protocol', () => {
      const result = service.sanitizeUrl('javascript:alert(1)');
      expect(result).toBe('');
    });

    it('should reject data: protocol', () => {
      const result = service.sanitizeUrl('data:text/html,<script>alert(1)</script>');
      expect(result).toBe('');
    });

    it('should handle URL with path', () => {
      const result = service.sanitizeUrl('https://example.com/path/to/resource');
      expect(result).toBe('https://example.com/path/to/resource');
    });

    it('should handle URL with query params', () => {
      const result = service.sanitizeUrl('https://example.com?foo=bar&baz=qux');
      expect(result).toBe('https://example.com?foo=bar&baz=qux');
    });

    it('should return empty string for invalid URL format', () => {
      const result = service.sanitizeUrl('not a url');
      expect(result).toBe('');
    });

    it('should handle empty string', () => {
      const result = service.sanitizeUrl('');
      expect(result).toBe('');
    });
  });

  describe('sanitizeObject', () => {
    it('should return same object for null input', () => {
      expect(service.sanitizeObject(null as any)).toBeNull();
    });

    it('should return same object for undefined input', () => {
      expect(service.sanitizeObject(undefined as any)).toBeUndefined();
    });

    it('should sanitize string properties', () => {
      const input = {
        name: '<script>alert(1)</script>John',
        age: 30,
      };
      const result = service.sanitizeObject(input);
      expect(result.name).toBe('John');
      expect(result.age).toBe(30);
    });

    it('should preserve non-string properties', () => {
      const input = {
        name: 'John',
        age: 30,
        isActive: true,
        score: 95.5,
      };
      const result = service.sanitizeObject(input);
      expect(result.age).toBe(30);
      expect(result.isActive).toBe(true);
      expect(result.score).toBe(95.5);
    });

    it('should sanitize array of strings', () => {
      const input = {
        tags: ['<div>test</div>', 'valid tag'],
      };
      const result = service.sanitizeObject(input);
      expect(result.tags[0]).toBe('test');
      expect(result.tags[1]).toBe('valid tag');
    });

    it('should preserve array of non-strings', () => {
      const input = {
        numbers: [1, 2, 3],
        booleans: [true, false],
      };
      const result = service.sanitizeObject(input);
      expect(result.numbers).toEqual([1, 2, 3]);
      expect(result.booleans).toEqual([true, false]);
    });

    it('should recursively sanitize nested objects', () => {
      const input = {
        user: {
          name: '<script>alert(1)</script>John',
          profile: {
            bio: '<b>Hello</b> World',
          },
        },
      };
      const result = service.sanitizeObject(input);
      expect(result.user.name).toBe('John');
      expect(result.user.profile.bio).toBe('Hello World');
    });

    it('should handle mixed nested structures', () => {
      const input = {
        name: '<div>John</div>',
        tags: ['<span>tag1</span>', 'tag2'],
        profile: {
          bio: 'Hello   World',
          links: ['<div>link</div>'],
        },
      };
      const result = service.sanitizeObject(input);
      expect(result.name).toBe('John');
      expect(result.tags[0]).toBe('tag1');
      expect(result.profile.bio).toBe('Hello World');
      expect(result.profile.links[0]).toBe('link');
    });

    it('should handle empty object', () => {
      const result = service.sanitizeObject({});
      expect(result).toEqual({});
    });

    it('should not modify original object', () => {
      const input = {
        name: '<div>John</div>',
      };
      const result = service.sanitizeObject(input);
      expect(input.name).toBe('<div>John</div>');
      expect(result.name).toBe('John');
    });
  });

  describe('containsSqlInjection', () => {
    it('should detect SELECT statement', () => {
      expect(service.containsSqlInjection('SELECT * FROM users')).toBe(true);
    });

    it('should detect INSERT statement', () => {
      expect(service.containsSqlInjection('INSERT INTO users VALUES')).toBe(true);
    });

    it('should detect UPDATE statement', () => {
      expect(service.containsSqlInjection('UPDATE users SET password')).toBe(true);
    });

    it('should detect DELETE statement', () => {
      expect(service.containsSqlInjection('DELETE FROM users')).toBe(true);
    });

    it('should detect DROP statement', () => {
      expect(service.containsSqlInjection('DROP TABLE users')).toBe(true);
    });

    it('should detect SQL comment patterns', () => {
      expect(service.containsSqlInjection('admin" --')).toBe(true);
      expect(service.containsSqlInjection('test /* comment */')).toBe(true);
    });

    it('should detect OR injection pattern', () => {
      expect(service.containsSqlInjection("' OR '1'='1")).toBe(true);
      expect(service.containsSqlInjection('OR 1=1')).toBe(true);
    });

    it('should detect AND injection pattern', () => {
      expect(service.containsSqlInjection('AND 1=1')).toBe(true);
    });

    it('should detect semicolon delimiter', () => {
      expect(service.containsSqlInjection('admin; DROP TABLE users')).toBe(true);
    });

    it('should be case insensitive for SQL keywords', () => {
      expect(service.containsSqlInjection('select * from users')).toBe(true);
      expect(service.containsSqlInjection('SeLeCt * FrOm users')).toBe(true);
    });

    it('should not flag normal text', () => {
      expect(service.containsSqlInjection('Hello World')).toBe(false);
    });

    it('should not flag email addresses', () => {
      expect(service.containsSqlInjection('user@example.com')).toBe(false);
    });

    it('should not flag normal sentences with OR/AND', () => {
      expect(service.containsSqlInjection('I like cats or dogs')).toBe(false);
    });
  });

  describe('containsXss', () => {
    it('should detect script tag', () => {
      expect(service.containsXss('<script>alert(1)</script>')).toBe(true);
    });

    it('should detect script tag with attributes', () => {
      expect(service.containsXss('<script src="evil.js"></script>')).toBe(true);
    });

    it('should detect javascript: protocol', () => {
      expect(service.containsXss('javascript:alert(1)')).toBe(true);
    });

    it('should detect event handlers', () => {
      expect(service.containsXss('onclick=alert(1)')).toBe(true);
      expect(service.containsXss('onload=alert(1)')).toBe(true);
      expect(service.containsXss('onerror=alert(1)')).toBe(true);
    });

    it('should detect iframe tag', () => {
      expect(service.containsXss('<iframe src="evil.com"></iframe>')).toBe(true);
    });

    it('should detect object tag', () => {
      expect(service.containsXss('<object data="evil"></object>')).toBe(true);
    });

    it('should detect embed tag', () => {
      expect(service.containsXss('<embed src="evil"></embed>')).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(service.containsXss('<SCRIPT>alert(1)</SCRIPT>')).toBe(true);
      expect(service.containsXss('JAVASCRIPT:alert(1)')).toBe(true);
    });

    it('should detect event handlers with spaces', () => {
      expect(service.containsXss('onclick = alert(1)')).toBe(true);
    });

    it('should not flag normal text', () => {
      expect(service.containsXss('Hello World')).toBe(false);
    });

    it('should not flag normal HTML', () => {
      expect(service.containsXss('<p>Hello World</p>')).toBe(false);
    });

    it('should not flag text containing "script" word', () => {
      expect(service.containsXss('This is a description about JavaScript')).toBe(false);
    });
  });
});
