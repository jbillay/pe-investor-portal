import { plainToInstance } from 'class-transformer';
import {
  Sanitize,
  SanitizeHtml,
  SanitizeEmail,
  SanitizeArray,
  TrimString,
  Lowercase,
} from './sanitize.decorator';

class SanitizeTestDto {
  @Sanitize()
  text!: string;
}

class SanitizeHtmlTestDto {
  @SanitizeHtml()
  html!: string;
}

class SanitizeEmailTestDto {
  @SanitizeEmail()
  email!: string;
}

class SanitizeArrayTestDto {
  @SanitizeArray()
  items!: string[];
}

class TrimStringTestDto {
  @TrimString()
  text!: string;
}

class LowercaseTestDto {
  @Lowercase()
  text!: string;
}

describe('Sanitize Decorators', () => {
  describe('Sanitize', () => {
    it('should sanitize string by removing HTML tags', () => {
      const input = { text: '<script>alert("xss")</script>Hello World' };
      const result = plainToInstance(SanitizeTestDto, input);

      expect(result.text).toBe('Hello World');
      expect(result.text).not.toContain('<script>');
    });

    it('should normalize whitespace', () => {
      const input = { text: 'Hello    World   Test' };
      const result = plainToInstance(SanitizeTestDto, input);

      expect(result.text).toBe('Hello World Test');
    });

    it('should trim whitespace', () => {
      const input = { text: '  Hello World  ' };
      const result = plainToInstance(SanitizeTestDto, input);

      expect(result.text).toBe('Hello World');
    });

    it('should handle empty string', () => {
      const input = { text: '' };
      const result = plainToInstance(SanitizeTestDto, input);

      expect(result.text).toBe('');
    });

    it('should handle null value', () => {
      const input = { text: null };
      const result = plainToInstance(SanitizeTestDto, input);

      expect(result.text).toBeNull();
    });

    it('should handle undefined value', () => {
      const input = { text: undefined };
      const result = plainToInstance(SanitizeTestDto, input);

      expect(result.text).toBeUndefined();
    });

    it('should handle non-string value', () => {
      const input = { text: 123 as any };
      const result = plainToInstance(SanitizeTestDto, input);

      expect(result.text).toBe(123);
    });

    it('should remove all HTML tags but keep content', () => {
      const input = { text: '<div><p>Hello</p><span>World</span></div>' };
      const result = plainToInstance(SanitizeTestDto, input);

      expect(result.text).toBe('HelloWorld');
    });
  });

  describe('SanitizeHtml', () => {
    it('should allow safe HTML tags', () => {
      const input = { html: '<p>Hello <strong>World</strong></p>' };
      const result = plainToInstance(SanitizeHtmlTestDto, input);

      expect(result.html).toContain('<p>');
      expect(result.html).toContain('<strong>');
    });

    it('should remove dangerous tags', () => {
      const input = { html: '<script>alert("xss")</script><p>Safe content</p>' };
      const result = plainToInstance(SanitizeHtmlTestDto, input);

      expect(result.html).not.toContain('<script>');
      expect(result.html).toContain('<p>');
    });

    it('should allow safe links', () => {
      const input = { html: '<a href="https://example.com">Link</a>' };
      const result = plainToInstance(SanitizeHtmlTestDto, input);

      expect(result.html).toContain('<a');
      expect(result.html).toContain('href');
    });

    it('should trim whitespace', () => {
      const input = { html: '  <p>Content</p>  ' };
      const result = plainToInstance(SanitizeHtmlTestDto, input);

      expect(result.html).toBe('<p>Content</p>');
    });

    it('should handle null value', () => {
      const input = { html: null };
      const result = plainToInstance(SanitizeHtmlTestDto, input);

      expect(result.html).toBeNull();
    });

    it('should handle undefined value', () => {
      const input = { html: undefined };
      const result = plainToInstance(SanitizeHtmlTestDto, input);

      expect(result.html).toBeUndefined();
    });

    it('should handle non-string value', () => {
      const input = { html: 123 as any };
      const result = plainToInstance(SanitizeHtmlTestDto, input);

      expect(result.html).toBe(123);
    });

    it('should handle empty string', () => {
      const input = { html: '' };
      const result = plainToInstance(SanitizeHtmlTestDto, input);

      expect(result.html).toBe('');
    });
  });

  describe('SanitizeEmail', () => {
    it('should sanitize and normalize email', () => {
      const input = { email: '  User@Example.COM  ' };
      const result = plainToInstance(SanitizeEmailTestDto, input);

      expect(result.email).toBe('user@example.com');
    });

    it('should remove HTML from email', () => {
      const input = { email: 'user@example.com<script>alert(1)</script>' };
      const result = plainToInstance(SanitizeEmailTestDto, input);

      expect(result.email).not.toContain('<script>');
      expect(result.email).toBe('user@example.com');
    });

    it('should convert to lowercase', () => {
      const input = { email: 'USER@EXAMPLE.COM' };
      const result = plainToInstance(SanitizeEmailTestDto, input);

      expect(result.email).toBe('user@example.com');
    });

    it('should remove all whitespace', () => {
      const input = { email: 'user @ example . com' };
      const result = plainToInstance(SanitizeEmailTestDto, input);

      expect(result.email).toBe('user@example.com');
    });

    it('should handle null value', () => {
      const input = { email: null };
      const result = plainToInstance(SanitizeEmailTestDto, input);

      expect(result.email).toBeNull();
    });

    it('should handle undefined value', () => {
      const input = { email: undefined };
      const result = plainToInstance(SanitizeEmailTestDto, input);

      expect(result.email).toBeUndefined();
    });

    it('should handle non-string value', () => {
      const input = { email: 123 as any };
      const result = plainToInstance(SanitizeEmailTestDto, input);

      expect(result.email).toBe(123);
    });

    it('should handle empty string', () => {
      const input = { email: '' };
      const result = plainToInstance(SanitizeEmailTestDto, input);

      expect(result.email).toBe('');
    });
  });

  describe('SanitizeArray', () => {
    it('should sanitize all string elements in array', () => {
      const input = { items: ['Item1<script>bad</script>', '  Item2  ', 'Item   3'] };
      const result = plainToInstance(SanitizeArrayTestDto, input);

      expect(result.items[0]).toBe('Item1');
      expect(result.items[1]).toBe('Item2');
      expect(result.items[2]).toBe('Item 3');
    });

    it('should handle mixed array with non-strings', () => {
      const input = { items: ['String', 123, null, undefined] as any };
      const result = plainToInstance(SanitizeArrayTestDto, input);

      expect(result.items[0]).toBe('String');
      expect(result.items[1]).toBe(123);
      expect(result.items[2]).toBeNull();
      expect(result.items[3]).toBeUndefined();
    });

    it('should handle empty array', () => {
      const input = { items: [] };
      const result = plainToInstance(SanitizeArrayTestDto, input);

      expect(result.items).toEqual([]);
    });

    it('should handle non-array value', () => {
      const input = { items: 'not an array' as any };
      const result = plainToInstance(SanitizeArrayTestDto, input);

      expect(result.items).toBe('not an array');
    });

    it('should remove HTML from array elements', () => {
      const input = { items: ['<div>Test</div>', '<p>Another</p>'] };
      const result = plainToInstance(SanitizeArrayTestDto, input);

      expect(result.items[0]).toBe('Test');
      expect(result.items[1]).toBe('Another');
    });

    it('should handle null value', () => {
      const input = { items: null as any };
      const result = plainToInstance(SanitizeArrayTestDto, input);

      expect(result.items).toBeNull();
    });
  });

  describe('TrimString', () => {
    it('should trim whitespace from string', () => {
      const input = { text: '  Hello World  ' };
      const result = plainToInstance(TrimStringTestDto, input);

      expect(result.text).toBe('Hello World');
    });

    it('should handle string without whitespace', () => {
      const input = { text: 'HelloWorld' };
      const result = plainToInstance(TrimStringTestDto, input);

      expect(result.text).toBe('HelloWorld');
    });

    it('should handle non-string value', () => {
      const input = { text: 123 as any };
      const result = plainToInstance(TrimStringTestDto, input);

      expect(result.text).toBe(123);
    });

    it('should handle empty string', () => {
      const input = { text: '  ' };
      const result = plainToInstance(TrimStringTestDto, input);

      expect(result.text).toBe('');
    });

    it('should handle null value', () => {
      const input = { text: null as any };
      const result = plainToInstance(TrimStringTestDto, input);

      expect(result.text).toBeNull();
    });
  });

  describe('Lowercase', () => {
    it('should convert string to lowercase', () => {
      const input = { text: 'HELLO WORLD' };
      const result = plainToInstance(LowercaseTestDto, input);

      expect(result.text).toBe('hello world');
    });

    it('should handle mixed case string', () => {
      const input = { text: 'HeLLo WoRLd' };
      const result = plainToInstance(LowercaseTestDto, input);

      expect(result.text).toBe('hello world');
    });

    it('should handle already lowercase string', () => {
      const input = { text: 'hello world' };
      const result = plainToInstance(LowercaseTestDto, input);

      expect(result.text).toBe('hello world');
    });

    it('should handle non-string value', () => {
      const input = { text: 123 as any };
      const result = plainToInstance(LowercaseTestDto, input);

      expect(result.text).toBe(123);
    });

    it('should handle empty string', () => {
      const input = { text: '' };
      const result = plainToInstance(LowercaseTestDto, input);

      expect(result.text).toBe('');
    });

    it('should handle null value', () => {
      const input = { text: null as any };
      const result = plainToInstance(LowercaseTestDto, input);

      expect(result.text).toBeNull();
    });
  });
});
