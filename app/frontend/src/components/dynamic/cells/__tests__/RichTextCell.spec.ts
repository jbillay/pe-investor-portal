import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import RichTextCell from '../RichTextCell.vue';

describe('RichTextCell.vue', () => {
  describe('Rendering with HTML content', () => {
    it('should strip HTML tags from content', () => {
      // Arrange & Act
      const wrapper = mount(RichTextCell, {
        props: { value: '<p>Hello World</p>' },
      });

      // Assert
      expect(wrapper.text()).toBe('Hello World');
    });

    it('should strip multiple HTML tags', () => {
      // Arrange & Act
      const wrapper = mount(RichTextCell, {
        props: { value: '<div><strong>Bold</strong> and <em>italic</em></div>' },
      });

      // Assert
      expect(wrapper.text()).toBe('Bold and italic');
    });

    it('should strip nested HTML tags', () => {
      // Arrange & Act
      const wrapper = mount(RichTextCell, {
        props: { value: '<div><p><span>Nested content</span></p></div>' },
      });

      // Assert
      expect(wrapper.text()).toBe('Nested content');
    });

    it('should handle self-closing tags', () => {
      // Arrange & Act
      const wrapper = mount(RichTextCell, {
        props: { value: '<p>Line 1<br/>Line 2</p>' },
      });

      // Assert
      expect(wrapper.text()).toBe('Line 1Line 2');
    });

    it('should strip HTML tags with attributes', () => {
      // Arrange & Act
      const wrapper = mount(RichTextCell, {
        props: { value: '<a href="http://example.com" class="link">Link text</a>' },
      });

      // Assert
      expect(wrapper.text()).toBe('Link text');
    });
  });

  describe('Text truncation', () => {
    it('should truncate text longer than 100 characters', () => {
      // Arrange
      const longText = 'a'.repeat(150);

      // Act
      const wrapper = mount(RichTextCell, {
        props: { value: longText },
      });

      // Assert
      expect(wrapper.text()).toBe('a'.repeat(100) + '...');
      expect(wrapper.text().length).toBe(103); // 100 chars + '...'
    });

    it('should not truncate text shorter than 100 characters', () => {
      // Arrange
      const shortText = 'Short text here';

      // Act
      const wrapper = mount(RichTextCell, {
        props: { value: shortText },
      });

      // Assert
      expect(wrapper.text()).toBe(shortText);
      expect(wrapper.text()).not.toContain('...');
    });

    it('should not truncate text exactly 100 characters', () => {
      // Arrange
      const exactText = 'a'.repeat(100);

      // Act
      const wrapper = mount(RichTextCell, {
        props: { value: exactText },
      });

      // Assert
      expect(wrapper.text()).toBe(exactText);
      expect(wrapper.text()).not.toContain('...');
    });

    it('should truncate at 100 characters after stripping HTML', () => {
      // Arrange
      const htmlContent = '<p>' + 'a'.repeat(150) + '</p>';

      // Act
      const wrapper = mount(RichTextCell, {
        props: { value: htmlContent },
      });

      // Assert
      expect(wrapper.text()).toBe('a'.repeat(100) + '...');
    });

    it('should handle truncation with mixed content', () => {
      // Arrange
      const content = '<div><h1>Title</h1><p>' + 'x'.repeat(120) + '</p></div>';

      // Act
      const wrapper = mount(RichTextCell, {
        props: { value: content },
      });

      // Assert
      const text = wrapper.text();
      expect(text.length).toBe(103); // 100 chars + '...'
      expect(text.endsWith('...')).toBe(true);
    });
  });

  describe('Rendering with null/empty values', () => {
    it('should display "-" when value is null', () => {
      // Arrange & Act
      const wrapper = mount(RichTextCell, {
        props: { value: null },
      });

      // Assert
      expect(wrapper.text()).toBe('-');
    });

    it('should display "-" when value is undefined', () => {
      // Arrange & Act
      const wrapper = mount(RichTextCell, {
        props: { value: undefined },
      });

      // Assert
      expect(wrapper.text()).toBe('-');
    });

    it('should display "-" when value is empty string', () => {
      // Arrange & Act
      const wrapper = mount(RichTextCell, {
        props: { value: '' },
      });

      // Assert
      expect(wrapper.text()).toBe('-');
    });
  });

  describe('Component structure', () => {
    it('should render a div element', () => {
      // Arrange & Act
      const wrapper = mount(RichTextCell, {
        props: { value: '<p>Test</p>' },
      });

      // Assert
      expect(wrapper.find('div').exists()).toBe(true);
    });

    it('should have correct CSS classes', () => {
      // Arrange & Act
      const wrapper = mount(RichTextCell, {
        props: { value: '<p>Test</p>' },
      });

      // Assert
      const div = wrapper.find('div');
      expect(div.classes()).toContain('rich-text-preview');
      expect(div.classes()).toContain('text-gray-900');
    });
  });

  describe('Edge cases', () => {
    it('should handle plain text without HTML tags', () => {
      // Arrange & Act
      const wrapper = mount(RichTextCell, {
        props: { value: 'Just plain text' },
      });

      // Assert
      expect(wrapper.text()).toBe('Just plain text');
    });

    it('should handle HTML entities correctly', () => {
      // Arrange & Act
      const wrapper = mount(RichTextCell, {
        props: { value: '<p>&lt;tag&gt; &amp; &quot;quoted&quot;</p>' },
      });

      // Assert
      expect(wrapper.text()).toBe('&lt;tag&gt; &amp; &quot;quoted&quot;');
    });

    it('should handle empty HTML tags', () => {
      // Arrange & Act
      const wrapper = mount(RichTextCell, {
        props: { value: '<p></p><div></div>Text' },
      });

      // Assert
      expect(wrapper.text()).toBe('Text');
    });

    it('should handle whitespace in HTML', () => {
      // Arrange & Act
      const wrapper = mount(RichTextCell, {
        props: { value: '<p>  Spaced   text  </p>' },
      });

      // Assert
      // HTML content whitespace is normalized when rendered
      expect(wrapper.text()).toBe('Spaced   text');
    });

    it('should handle malformed HTML gracefully', () => {
      // Arrange & Act
      const wrapper = mount(RichTextCell, {
        props: { value: '<p>Unclosed tag<div>Content' },
      });

      // Assert
      expect(wrapper.text()).toBe('Unclosed tagContent');
    });

    it('should handle lists and preserve content', () => {
      // Arrange & Act
      const wrapper = mount(RichTextCell, {
        props: { value: '<ul><li>Item 1</li><li>Item 2</li></ul>' },
      });

      // Assert
      expect(wrapper.text()).toBe('Item 1Item 2');
    });

    it('should handle complex nested structures', () => {
      // Arrange & Act
      const wrapper = mount(RichTextCell, {
        props: {
          value: '<div><section><article><p>Deep <strong>nested</strong> content</p></article></section></div>'
        },
      });

      // Assert
      expect(wrapper.text()).toBe('Deep nested content');
    });

    it('should convert non-string values to string before processing', () => {
      // Arrange & Act
      const wrapper = mount(RichTextCell, {
        props: { value: 123 as any },
      });

      // Assert
      expect(wrapper.text()).toBe('123');
    });
  });

  describe('Combined HTML stripping and truncation', () => {
    it('should first strip HTML then truncate', () => {
      // Arrange
      const text = 'a'.repeat(60);
      const htmlContent = `<p>${text}</p><div>${text}</div>`;

      // Act
      const wrapper = mount(RichTextCell, {
        props: { value: htmlContent },
      });

      // Assert
      // Total 120 chars after stripping, should truncate at 100
      expect(wrapper.text()).toBe('a'.repeat(100) + '...');
    });

    it('should handle short HTML content without truncation', () => {
      // Arrange & Act
      const wrapper = mount(RichTextCell, {
        props: { value: '<p><strong>Short</strong> content</p>' },
      });

      // Assert
      expect(wrapper.text()).toBe('Short content');
      expect(wrapper.text()).not.toContain('...');
    });
  });
});
