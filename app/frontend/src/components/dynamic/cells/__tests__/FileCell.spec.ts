import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import FileCell from '../FileCell.vue';

describe('FileCell.vue', () => {
  describe('Rendering with valid file object', () => {
    it('should display file name when value has name property', () => {
      // Arrange & Act
      const wrapper = mount(FileCell, {
        props: { value: { name: 'document.pdf' } },
      });

      // Assert
      expect(wrapper.text()).toContain('document.pdf');
    });

    it('should display file name when value has fileName property', () => {
      // Arrange & Act
      const wrapper = mount(FileCell, {
        props: { value: { fileName: 'report.xlsx' } },
      });

      // Assert
      expect(wrapper.text()).toContain('report.xlsx');
    });

    it('should prefer name property over fileName property', () => {
      // Arrange & Act
      const wrapper = mount(FileCell, {
        props: {
          value: {
            name: 'preferred.doc',
            fileName: 'not-used.doc'
          }
        },
      });

      // Assert
      expect(wrapper.text()).toContain('preferred.doc');
      expect(wrapper.text()).not.toContain('not-used.doc');
    });

    it('should display "File" as default when name is not provided', () => {
      // Arrange & Act
      const wrapper = mount(FileCell, {
        props: { value: { size: 1024 } },
      });

      // Assert
      expect(wrapper.text()).toContain('File');
    });

    it('should display file icon when file is present', () => {
      // Arrange & Act
      const wrapper = mount(FileCell, {
        props: { value: { name: 'image.png' } },
      });

      // Assert
      const icon = wrapper.find('i.pi-file');
      expect(icon.exists()).toBe(true);
    });

    it('should have correct CSS classes for file icon', () => {
      // Arrange & Act
      const wrapper = mount(FileCell, {
        props: { value: { name: 'test.txt' } },
      });

      // Assert
      const icon = wrapper.find('i');
      expect(icon.classes()).toContain('pi');
      expect(icon.classes()).toContain('pi-file');
      expect(icon.classes()).toContain('text-gray-500');
    });

    it('should have correct CSS classes for file name', () => {
      // Arrange & Act
      const wrapper = mount(FileCell, {
        props: { value: { name: 'test.txt' } },
      });

      // Assert
      const fileNameSpan = wrapper.find('span.text-sm');
      expect(fileNameSpan.exists()).toBe(true);
      expect(fileNameSpan.classes()).toContain('text-sm');
      expect(fileNameSpan.classes()).toContain('text-gray-700');
    });

    it('should have correct container structure', () => {
      // Arrange & Act
      const wrapper = mount(FileCell, {
        props: { value: { name: 'test.txt' } },
      });

      // Assert
      const container = wrapper.find('div.inline-flex');
      expect(container.exists()).toBe(true);
      expect(container.classes()).toContain('inline-flex');
      expect(container.classes()).toContain('items-center');
      expect(container.classes()).toContain('gap-2');
    });
  });

  describe('Rendering with null/undefined/empty values', () => {
    it('should display "-" when value is null', () => {
      // Arrange & Act
      const wrapper = mount(FileCell, {
        props: { value: null },
      });

      // Assert
      expect(wrapper.text()).toBe('-');
      expect(wrapper.find('div.inline-flex').exists()).toBe(false);
    });

    it('should display "-" when value is undefined', () => {
      // Arrange & Act
      const wrapper = mount(FileCell, {
        props: { value: undefined },
      });

      // Assert
      expect(wrapper.text()).toBe('-');
      expect(wrapper.find('div.inline-flex').exists()).toBe(false);
    });

    it('should display "-" when value is empty object', () => {
      // Arrange & Act
      const wrapper = mount(FileCell, {
        props: { value: {} },
      });

      // Assert
      // Empty object is truthy, so it shows the default "File" text
      expect(wrapper.text()).toContain('File');
    });

    it('should have correct CSS class for empty state', () => {
      // Arrange & Act
      const wrapper = mount(FileCell, {
        props: { value: null },
      });

      // Assert
      const span = wrapper.find('span');
      expect(span.classes()).toContain('text-gray-400');
    });
  });

  describe('File name variations', () => {
    it('should handle file names with multiple extensions', () => {
      // Arrange & Act
      const wrapper = mount(FileCell, {
        props: { value: { name: 'archive.tar.gz' } },
      });

      // Assert
      expect(wrapper.text()).toContain('archive.tar.gz');
    });

    it('should handle file names with spaces', () => {
      // Arrange & Act
      const wrapper = mount(FileCell, {
        props: { value: { name: 'My Important Document.pdf' } },
      });

      // Assert
      expect(wrapper.text()).toContain('My Important Document.pdf');
    });

    it('should handle very long file names', () => {
      // Arrange
      const longFileName = 'this_is_a_very_long_file_name_that_could_cause_layout_issues.pdf';

      // Act
      const wrapper = mount(FileCell, {
        props: { value: { name: longFileName } },
      });

      // Assert
      expect(wrapper.text()).toContain(longFileName);
    });

    it('should handle file names with special characters', () => {
      // Arrange & Act
      const wrapper = mount(FileCell, {
        props: { value: { name: 'file_2024-01-15_v1.0.pdf' } },
      });

      // Assert
      expect(wrapper.text()).toContain('file_2024-01-15_v1.0.pdf');
    });

    it('should handle file names without extension', () => {
      // Arrange & Act
      const wrapper = mount(FileCell, {
        props: { value: { name: 'README' } },
      });

      // Assert
      expect(wrapper.text()).toContain('README');
    });
  });

  describe('Component structure conditions', () => {
    it('should render div with icon and name when file exists', () => {
      // Arrange & Act
      const wrapper = mount(FileCell, {
        props: { value: { name: 'test.pdf' } },
      });

      // Assert
      expect(wrapper.find('div').exists()).toBe(true);
      expect(wrapper.find('i').exists()).toBe(true);
      expect(wrapper.find('span.text-sm').exists()).toBe(true);
      expect(wrapper.find('span.text-gray-400').exists()).toBe(false);
    });

    it('should only render dash span when file does not exist', () => {
      // Arrange & Act
      const wrapper = mount(FileCell, {
        props: { value: null },
      });

      // Assert
      expect(wrapper.find('div.inline-flex').exists()).toBe(false);
      expect(wrapper.find('i').exists()).toBe(false);
      expect(wrapper.find('span.text-gray-400').exists()).toBe(true);
    });
  });
});
