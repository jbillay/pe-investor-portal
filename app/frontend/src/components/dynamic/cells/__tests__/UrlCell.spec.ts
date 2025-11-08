import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import UrlCell from '../UrlCell.vue';

describe('UrlCell.vue', () => {
  describe('Rendering with valid URLs', () => {
    it('should display URL as clickable link', () => {
      // Arrange & Act
      const wrapper = mount(UrlCell, {
        props: { value: 'https://example.com' },
      });

      // Assert
      const link = wrapper.find('a');
      expect(link.exists()).toBe(true);
      expect(link.attributes('href')).toBe('https://example.com');
    });

    it('should extract and display hostname from URL', () => {
      // Arrange & Act
      const wrapper = mount(UrlCell, {
        props: { value: 'https://www.example.com/path/to/page' },
      });

      // Assert
      expect(wrapper.text()).toContain('www.example.com');
    });

    it('should open link in new tab', () => {
      // Arrange & Act
      const wrapper = mount(UrlCell, {
        props: { value: 'https://example.com' },
      });

      // Assert
      const link = wrapper.find('a');
      expect(link.attributes('target')).toBe('_blank');
    });

    it('should have noopener noreferrer for security', () => {
      // Arrange & Act
      const wrapper = mount(UrlCell, {
        props: { value: 'https://example.com' },
      });

      // Assert
      const link = wrapper.find('a');
      expect(link.attributes('rel')).toBe('noopener noreferrer');
    });

    it('should display external link icon', () => {
      // Arrange & Act
      const wrapper = mount(UrlCell, {
        props: { value: 'https://example.com' },
      });

      // Assert
      const icon = wrapper.find('i.pi-external-link');
      expect(icon.exists()).toBe(true);
    });

    it('should have correct CSS classes for link', () => {
      // Arrange & Act
      const wrapper = mount(UrlCell, {
        props: { value: 'https://example.com' },
      });

      // Assert
      const link = wrapper.find('a');
      expect(link.classes()).toContain('text-blue-600');
      expect(link.classes()).toContain('hover:text-blue-800');
      expect(link.classes()).toContain('hover:underline');
      expect(link.classes()).toContain('inline-flex');
      expect(link.classes()).toContain('items-center');
      expect(link.classes()).toContain('gap-1');
    });

    it('should have correct CSS classes for icon', () => {
      // Arrange & Act
      const wrapper = mount(UrlCell, {
        props: { value: 'https://example.com' },
      });

      // Assert
      const icon = wrapper.find('i');
      expect(icon.classes()).toContain('pi');
      expect(icon.classes()).toContain('pi-external-link');
      expect(icon.classes()).toContain('text-xs');
    });
  });

  describe('URL hostname extraction', () => {
    it('should extract hostname from http URL', () => {
      // Arrange & Act
      const wrapper = mount(UrlCell, {
        props: { value: 'http://example.com' },
      });

      // Assert
      expect(wrapper.text()).toContain('example.com');
    });

    it('should extract hostname from https URL', () => {
      // Arrange & Act
      const wrapper = mount(UrlCell, {
        props: { value: 'https://secure.example.com' },
      });

      // Assert
      expect(wrapper.text()).toContain('secure.example.com');
    });

    it('should extract hostname from URL with path', () => {
      // Arrange & Act
      const wrapper = mount(UrlCell, {
        props: { value: 'https://example.com/path/to/resource' },
      });

      // Assert
      expect(wrapper.text()).toContain('example.com');
      expect(wrapper.text()).not.toContain('/path/to/resource');
    });

    it('should extract hostname from URL with query params', () => {
      // Arrange & Act
      const wrapper = mount(UrlCell, {
        props: { value: 'https://example.com?param1=value1&param2=value2' },
      });

      // Assert
      expect(wrapper.text()).toContain('example.com');
      expect(wrapper.text()).not.toContain('param1');
    });

    it('should extract hostname from URL with hash', () => {
      // Arrange & Act
      const wrapper = mount(UrlCell, {
        props: { value: 'https://example.com/page#section' },
      });

      // Assert
      expect(wrapper.text()).toContain('example.com');
      expect(wrapper.text()).not.toContain('#section');
    });

    it('should extract hostname from URL with port', () => {
      // Arrange & Act
      const wrapper = mount(UrlCell, {
        props: { value: 'https://example.com:8080/path' },
      });

      // Assert
      expect(wrapper.text()).toContain('example.com');
    });

    it('should handle subdomain correctly', () => {
      // Arrange & Act
      const wrapper = mount(UrlCell, {
        props: { value: 'https://api.staging.example.com' },
      });

      // Assert
      expect(wrapper.text()).toContain('api.staging.example.com');
    });

    it('should handle localhost URL', () => {
      // Arrange & Act
      const wrapper = mount(UrlCell, {
        props: { value: 'http://localhost:3000' },
      });

      // Assert
      expect(wrapper.text()).toContain('localhost');
    });

    it('should handle IP address URL', () => {
      // Arrange & Act
      const wrapper = mount(UrlCell, {
        props: { value: 'http://192.168.1.1' },
      });

      // Assert
      expect(wrapper.text()).toContain('192.168.1.1');
    });
  });

  describe('Invalid URL handling', () => {
    it('should display original value when URL parsing fails', () => {
      // Arrange & Act
      const wrapper = mount(UrlCell, {
        props: { value: 'not-a-valid-url' },
      });

      // Assert
      expect(wrapper.text()).toContain('not-a-valid-url');
    });

    it('should still create link for invalid URL', () => {
      // Arrange & Act
      const wrapper = mount(UrlCell, {
        props: { value: 'invalid-url' },
      });

      // Assert
      const link = wrapper.find('a');
      expect(link.exists()).toBe(true);
      expect(link.attributes('href')).toBe('invalid-url');
    });

    it('should handle URL without protocol', () => {
      // Arrange & Act
      const wrapper = mount(UrlCell, {
        props: { value: 'example.com' },
      });

      // Assert
      // Should fail to parse as URL and display original value
      expect(wrapper.text()).toContain('example.com');
    });

    it('should handle relative URL', () => {
      // Arrange & Act
      const wrapper = mount(UrlCell, {
        props: { value: '/path/to/page' },
      });

      // Assert
      expect(wrapper.text()).toContain('/path/to/page');
    });
  });

  describe('Rendering with null/empty values', () => {
    it('should display "-" when value is null', () => {
      // Arrange & Act
      const wrapper = mount(UrlCell, {
        props: { value: null },
      });

      // Assert
      expect(wrapper.find('a').exists()).toBe(false);
      expect(wrapper.find('span').exists()).toBe(true);
      expect(wrapper.text()).toBe('-');
    });

    it('should display "-" when value is empty string', () => {
      // Arrange & Act
      const wrapper = mount(UrlCell, {
        props: { value: '' },
      });

      // Assert
      expect(wrapper.find('a').exists()).toBe(false);
      expect(wrapper.find('span').exists()).toBe(true);
      expect(wrapper.text()).toBe('-');
    });

    it('should have correct CSS class for empty state', () => {
      // Arrange & Act
      const wrapper = mount(UrlCell, {
        props: { value: null },
      });

      // Assert
      const span = wrapper.find('span');
      expect(span.classes()).toContain('text-gray-400');
    });
  });

  describe('Component structure', () => {
    it('should render link when URL is present', () => {
      // Arrange & Act
      const wrapper = mount(UrlCell, {
        props: { value: 'https://example.com' },
      });

      // Assert
      expect(wrapper.find('a').exists()).toBe(true);
      expect(wrapper.find('span.text-gray-400').exists()).toBe(false);
    });

    it('should render span when URL is not present', () => {
      // Arrange & Act
      const wrapper = mount(UrlCell, {
        props: { value: null },
      });

      // Assert
      expect(wrapper.find('a').exists()).toBe(false);
      expect(wrapper.find('span').exists()).toBe(true);
    });

    it('should have hostname text and icon inside link', () => {
      // Arrange & Act
      const wrapper = mount(UrlCell, {
        props: { value: 'https://example.com' },
      });

      // Assert
      const link = wrapper.find('a');
      expect(link.text()).toContain('example.com');
      expect(link.find('i').exists()).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle very long URLs', () => {
      // Arrange
      const longUrl = 'https://example.com/' + 'a'.repeat(200);

      // Act
      const wrapper = mount(UrlCell, {
        props: { value: longUrl },
      });

      // Assert
      expect(wrapper.find('a').attributes('href')).toBe(longUrl);
      expect(wrapper.text()).toContain('example.com');
    });

    it('should handle URL with international characters', () => {
      // Arrange & Act
      const wrapper = mount(UrlCell, {
        props: { value: 'https://例え.jp' },
      });

      // Assert
      // International characters are converted to Punycode by URL API
      expect(wrapper.text()).toContain('xn--r8jz45g.jp');
    });

    it('should handle URL with multiple subdomains', () => {
      // Arrange & Act
      const wrapper = mount(UrlCell, {
        props: { value: 'https://api.v2.staging.example.com' },
      });

      // Assert
      expect(wrapper.text()).toContain('api.v2.staging.example.com');
    });

    it('should handle data URL gracefully', () => {
      // Arrange & Act
      const wrapper = mount(UrlCell, {
        props: { value: 'data:text/plain;base64,SGVsbG8gV29ybGQ=' },
      });

      // Assert
      // Data URLs might fail parsing or show original value
      expect(wrapper.find('a').exists()).toBe(true);
    });

    it('should handle mailto URL', () => {
      // Arrange & Act
      const wrapper = mount(UrlCell, {
        props: { value: 'mailto:test@example.com' },
      });

      // Assert
      expect(wrapper.find('a').attributes('href')).toBe('mailto:test@example.com');
    });

    it('should handle tel URL', () => {
      // Arrange & Act
      const wrapper = mount(UrlCell, {
        props: { value: 'tel:+1234567890' },
      });

      // Assert
      expect(wrapper.find('a').attributes('href')).toBe('tel:+1234567890');
    });

    it('should handle URL with credentials', () => {
      // Arrange & Act
      const wrapper = mount(UrlCell, {
        props: { value: 'https://user:pass@example.com' },
      });

      // Assert
      expect(wrapper.text()).toContain('example.com');
    });

    it('should handle ftp URL', () => {
      // Arrange & Act
      const wrapper = mount(UrlCell, {
        props: { value: 'ftp://ftp.example.com/file.txt' },
      });

      // Assert
      expect(wrapper.text()).toContain('ftp.example.com');
    });

    it('should handle URL with uppercase protocol', () => {
      // Arrange & Act
      const wrapper = mount(UrlCell, {
        props: { value: 'HTTPS://EXAMPLE.COM' },
      });

      // Assert
      expect(wrapper.text()).toContain('example.com');
    });
  });

  describe('displayText computed property', () => {
    it('should return empty string when value is null', () => {
      // Arrange & Act
      const wrapper = mount(UrlCell, {
        props: { value: null },
      });

      // Assert
      expect(wrapper.find('a').exists()).toBe(false);
    });

    it('should return hostname for valid URL', () => {
      // Arrange & Act
      const wrapper = mount(UrlCell, {
        props: { value: 'https://www.github.com' },
      });

      // Assert
      expect(wrapper.text()).toContain('www.github.com');
    });

    it('should fallback to original value for invalid URL', () => {
      // Arrange
      const invalidUrl = 'just-some-text';

      // Act
      const wrapper = mount(UrlCell, {
        props: { value: invalidUrl },
      });

      // Assert
      expect(wrapper.text()).toContain(invalidUrl);
    });
  });
});
