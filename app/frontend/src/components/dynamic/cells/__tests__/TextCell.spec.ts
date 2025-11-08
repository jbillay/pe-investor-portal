import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import TextCell from '../TextCell.vue';

describe('TextCell.vue', () => {
  describe('Rendering with valid text values', () => {
    it('should display simple text string', () => {
      // Arrange & Act
      const wrapper = mount(TextCell, {
        props: { value: 'Hello World' },
      });

      // Assert
      expect(wrapper.text()).toBe('Hello World');
    });

    it('should display text with special characters', () => {
      // Arrange & Act
      const wrapper = mount(TextCell, {
        props: { value: 'Text with @#$%^&* symbols!' },
      });

      // Assert
      expect(wrapper.text()).toBe('Text with @#$%^&* symbols!');
    });

    it('should display multi-line text', () => {
      // Arrange & Act
      const wrapper = mount(TextCell, {
        props: { value: 'Line 1\nLine 2\nLine 3' },
      });

      // Assert
      expect(wrapper.text()).toBe('Line 1\nLine 2\nLine 3');
    });

    it('should display text with whitespace', () => {
      // Arrange & Act
      const wrapper = mount(TextCell, {
        props: { value: '  Text with  spaces  ' },
      });

      // Assert
      // Vue template normalizes leading/trailing whitespace when rendering
      expect(wrapper.text()).toBe('Text with  spaces');
    });

    it('should display very long text', () => {
      // Arrange
      const longText = 'a'.repeat(500);

      // Act
      const wrapper = mount(TextCell, {
        props: { value: longText },
      });

      // Assert
      expect(wrapper.text()).toBe(longText);
    });

    it('should display single character', () => {
      // Arrange & Act
      const wrapper = mount(TextCell, {
        props: { value: 'A' },
      });

      // Assert
      expect(wrapper.text()).toBe('A');
    });
  });

  describe('Rendering with number values', () => {
    it('should convert number to string', () => {
      // Arrange & Act
      const wrapper = mount(TextCell, {
        props: { value: 12345 },
      });

      // Assert
      expect(wrapper.text()).toBe('12345');
    });

    it('should convert decimal number to string', () => {
      // Arrange & Act
      const wrapper = mount(TextCell, {
        props: { value: 123.456 },
      });

      // Assert
      expect(wrapper.text()).toBe('123.456');
    });

    it('should convert negative number to string', () => {
      // Arrange & Act
      const wrapper = mount(TextCell, {
        props: { value: -999 },
      });

      // Assert
      expect(wrapper.text()).toBe('-999');
    });

    it('should handle zero value', () => {
      // Arrange & Act
      const wrapper = mount(TextCell, {
        props: { value: 0 },
      });

      // Assert
      expect(wrapper.text()).toBe('0');
    });
  });

  describe('Rendering with boolean values', () => {
    it('should convert true to string', () => {
      // Arrange & Act
      const wrapper = mount(TextCell, {
        props: { value: true },
      });

      // Assert
      expect(wrapper.text()).toBe('true');
    });

    it('should convert false to string', () => {
      // Arrange & Act
      const wrapper = mount(TextCell, {
        props: { value: false },
      });

      // Assert
      expect(wrapper.text()).toBe('false');
    });
  });

  describe('Rendering with null/undefined/empty values', () => {
    it('should display "-" when value is null', () => {
      // Arrange & Act
      const wrapper = mount(TextCell, {
        props: { value: null },
      });

      // Assert
      expect(wrapper.text()).toBe('-');
    });

    it('should display "-" when value is undefined', () => {
      // Arrange & Act
      const wrapper = mount(TextCell, {
        props: { value: undefined },
      });

      // Assert
      expect(wrapper.text()).toBe('-');
    });

    it('should display "-" when value is empty string', () => {
      // Arrange & Act
      const wrapper = mount(TextCell, {
        props: { value: '' },
      });

      // Assert
      expect(wrapper.text()).toBe('-');
    });
  });

  describe('Component structure', () => {
    it('should render a span element', () => {
      // Arrange & Act
      const wrapper = mount(TextCell, {
        props: { value: 'Test' },
      });

      // Assert
      expect(wrapper.find('span').exists()).toBe(true);
    });

    it('should have correct CSS class', () => {
      // Arrange & Act
      const wrapper = mount(TextCell, {
        props: { value: 'Test' },
      });

      // Assert
      const span = wrapper.find('span');
      expect(span.classes()).toContain('text-gray-900');
    });
  });

  describe('Edge cases', () => {
    it('should handle text with only whitespace as valid', () => {
      // Arrange & Act
      const wrapper = mount(TextCell, {
        props: { value: '   ' },
      });

      // Assert
      // Vue template trims whitespace-only content when rendering
      expect(wrapper.text()).toBe('');
    });

    it('should handle text with tabs and newlines', () => {
      // Arrange & Act
      const wrapper = mount(TextCell, {
        props: { value: 'Text\twith\ttabs\nand\nnewlines' },
      });

      // Assert
      expect(wrapper.text()).toBe('Text\twith\ttabs\nand\nnewlines');
    });

    it('should handle unicode characters', () => {
      // Arrange & Act
      const wrapper = mount(TextCell, {
        props: { value: 'Hello 世界 🌍' },
      });

      // Assert
      expect(wrapper.text()).toBe('Hello 世界 🌍');
    });

    it('should handle HTML-like strings without rendering them', () => {
      // Arrange & Act
      const wrapper = mount(TextCell, {
        props: { value: '<div>Not HTML</div>' },
      });

      // Assert
      expect(wrapper.text()).toBe('<div>Not HTML</div>');
      expect(wrapper.find('div div').exists()).toBe(false);
    });

    it('should handle object values by converting to string', () => {
      // Arrange & Act
      const wrapper = mount(TextCell, {
        props: { value: { key: 'value' } },
      });

      // Assert
      expect(wrapper.text()).toBe('[object Object]');
    });

    it('should handle array values by converting to string', () => {
      // Arrange & Act
      const wrapper = mount(TextCell, {
        props: { value: ['a', 'b', 'c'] },
      });

      // Assert
      expect(wrapper.text()).toBe('a,b,c');
    });

    it('should handle string representation of numbers', () => {
      // Arrange & Act
      const wrapper = mount(TextCell, {
        props: { value: '123' },
      });

      // Assert
      expect(wrapper.text()).toBe('123');
    });

    it('should handle JSON string', () => {
      // Arrange
      const jsonString = '{"key": "value", "number": 123}';

      // Act
      const wrapper = mount(TextCell, {
        props: { value: jsonString },
      });

      // Assert
      expect(wrapper.text()).toBe(jsonString);
    });

    it('should handle URL strings', () => {
      // Arrange & Act
      const wrapper = mount(TextCell, {
        props: { value: 'https://example.com/path?param=value' },
      });

      // Assert
      expect(wrapper.text()).toBe('https://example.com/path?param=value');
    });

    it('should handle email strings', () => {
      // Arrange & Act
      const wrapper = mount(TextCell, {
        props: { value: 'user@example.com' },
      });

      // Assert
      expect(wrapper.text()).toBe('user@example.com');
    });

    it('should display whitespace-only string that is not empty', () => {
      // Arrange & Act
      const wrapper = mount(TextCell, {
        props: { value: ' ' }, // Single space, not empty string
      });

      // Assert
      // Vue template trims whitespace-only content when rendering
      expect(wrapper.text()).toBe('');
    });
  });

  describe('Type conversions', () => {
    it('should handle Date object by converting to string', () => {
      // Arrange
      const date = new Date('2024-01-01');

      // Act
      const wrapper = mount(TextCell, {
        props: { value: date },
      });

      // Assert
      expect(wrapper.text()).toBe(String(date));
    });

    it('should handle Symbol by converting to string', () => {
      // Arrange
      const sym = Symbol('test');

      // Act
      const wrapper = mount(TextCell, {
        props: { value: sym },
      });

      // Assert
      expect(wrapper.text()).toBe(String(sym));
    });

    it('should handle BigInt by converting to string', () => {
      // Arrange
      const bigInt = BigInt(9007199254740991);

      // Act
      const wrapper = mount(TextCell, {
        props: { value: bigInt },
      });

      // Assert
      expect(wrapper.text()).toBe(String(bigInt));
    });
  });
});
