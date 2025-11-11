import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import SelectCell from '../SelectCell.vue';
import Tag from 'primevue/tag';

describe('SelectCell.vue', () => {
  describe('Rendering with array values', () => {
    it('should display multiple tags for array of strings', () => {
      // Arrange & Act
      const wrapper = mount(SelectCell, {
        props: { value: ['Option 1', 'Option 2', 'Option 3'] },
        global: {
          components: { Tag },
        },
      });

      // Assert
      const tags = wrapper.findAllComponents(Tag);
      expect(tags).toHaveLength(3);
      expect(tags[0].props('value')).toBe('Option 1');
      expect(tags[1].props('value')).toBe('Option 2');
      expect(tags[2].props('value')).toBe('Option 3');
    });

    it('should apply info severity to all tags', () => {
      // Arrange & Act
      const wrapper = mount(SelectCell, {
        props: { value: ['Tag1', 'Tag2'] },
        global: {
          components: { Tag },
        },
      });

      // Assert
      const tags = wrapper.findAllComponents(Tag);
      tags.forEach(tag => {
        expect(tag.props('severity')).toBe('info');
      });
    });

    it('should filter out falsy values from array', () => {
      // Arrange & Act
      const wrapper = mount(SelectCell, {
        props: { value: ['Valid', null, 'Also Valid', undefined, '', 'Third'] },
        global: {
          components: { Tag },
        },
      });

      // Assert
      const tags = wrapper.findAllComponents(Tag);
      expect(tags).toHaveLength(3);
      expect(tags[0].props('value')).toBe('Valid');
      expect(tags[1].props('value')).toBe('Also Valid');
      expect(tags[2].props('value')).toBe('Third');
    });

    it('should display single tag for array with one item', () => {
      // Arrange & Act
      const wrapper = mount(SelectCell, {
        props: { value: ['Single Item'] },
        global: {
          components: { Tag },
        },
      });

      // Assert
      const tags = wrapper.findAllComponents(Tag);
      expect(tags).toHaveLength(1);
      expect(tags[0].props('value')).toBe('Single Item');
    });

    it('should handle empty array', () => {
      // Arrange & Act
      const wrapper = mount(SelectCell, {
        props: { value: [] },
        global: {
          components: { Tag },
        },
      });

      // Assert
      const tags = wrapper.findAllComponents(Tag);
      expect(tags).toHaveLength(0);
      expect(wrapper.text()).toBe('-');
    });

    it('should handle array with only falsy values', () => {
      // Arrange & Act
      const wrapper = mount(SelectCell, {
        props: { value: [null, undefined, '', 0, false] },
        global: {
          components: { Tag },
        },
      });

      // Assert
      const tags = wrapper.findAllComponents(Tag);
      expect(tags).toHaveLength(0);
      expect(wrapper.text()).toBe('-');
    });
  });

  describe('Rendering with single value', () => {
    it('should display single tag for string value', () => {
      // Arrange & Act
      const wrapper = mount(SelectCell, {
        props: { value: 'Single Option' },
        global: {
          components: { Tag },
        },
      });

      // Assert
      const tags = wrapper.findAllComponents(Tag);
      expect(tags).toHaveLength(1);
      expect(tags[0].props('value')).toBe('Single Option');
    });

    it('should display single tag for number value', () => {
      // Arrange & Act
      const wrapper = mount(SelectCell, {
        props: { value: 42 },
        global: {
          components: { Tag },
        },
      });

      // Assert
      const tags = wrapper.findAllComponents(Tag);
      expect(tags).toHaveLength(1);
      expect(tags[0].props('value')).toBe(42);
    });

    it('should apply info severity to single tag', () => {
      // Arrange & Act
      const wrapper = mount(SelectCell, {
        props: { value: 'Test' },
        global: {
          components: { Tag },
        },
      });

      // Assert
      const tag = wrapper.findComponent(Tag);
      expect(tag.props('severity')).toBe('info');
    });
  });

  describe('Rendering with null/undefined/empty values', () => {
    it('should display "-" when value is null', () => {
      // Arrange & Act
      const wrapper = mount(SelectCell, {
        props: { value: null },
        global: {
          components: { Tag },
        },
      });

      // Assert
      expect(wrapper.text()).toBe('-');
      expect(wrapper.findAllComponents(Tag)).toHaveLength(0);
    });

    it('should display "-" when value is undefined', () => {
      // Arrange & Act
      const wrapper = mount(SelectCell, {
        props: { value: undefined },
        global: {
          components: { Tag },
        },
      });

      // Assert
      expect(wrapper.text()).toBe('-');
      expect(wrapper.findAllComponents(Tag)).toHaveLength(0);
    });

    it('should display "-" when value is empty string', () => {
      // Arrange & Act
      const wrapper = mount(SelectCell, {
        props: { value: '' },
        global: {
          components: { Tag },
        },
      });

      // Assert
      expect(wrapper.text()).toBe('-');
      expect(wrapper.findAllComponents(Tag)).toHaveLength(0);
    });

    it('should have correct CSS class for empty state', () => {
      // Arrange & Act
      const wrapper = mount(SelectCell, {
        props: { value: null },
        global: {
          components: { Tag },
        },
      });

      // Assert
      const span = wrapper.find('span');
      expect(span.classes()).toContain('text-gray-400');
    });
  });

  describe('Component structure', () => {
    it('should have flex container with correct classes', () => {
      // Arrange & Act
      const wrapper = mount(SelectCell, {
        props: { value: ['Item 1', 'Item 2'] },
        global: {
          components: { Tag },
        },
      });

      // Assert
      const container = wrapper.find('div');
      expect(container.classes()).toContain('flex');
      expect(container.classes()).toContain('flex-wrap');
      expect(container.classes()).toContain('gap-1');
    });

    it('should render tags with unique keys', () => {
      // Arrange & Act
      const wrapper = mount(SelectCell, {
        props: { value: ['A', 'B', 'C'] },
        global: {
          components: { Tag },
        },
      });

      // Assert
      const tags = wrapper.findAllComponents(Tag);
      expect(tags).toHaveLength(3);
    });
  });

  describe('Edge cases', () => {
    it('should handle array with mixed types', () => {
      // Arrange & Act
      const wrapper = mount(SelectCell, {
        props: { value: ['String', 123, true] },
        global: {
          components: { Tag },
        },
      });

      // Assert
      const tags = wrapper.findAllComponents(Tag);
      expect(tags).toHaveLength(3);
      expect(tags[0].props('value')).toBe('String');
      expect(tags[1].props('value')).toBe(123);
      expect(tags[2].props('value')).toBe(true);
    });

    it('should handle very long array', () => {
      // Arrange
      const longArray = Array.from({ length: 20 }, (_, i) => `Option ${i + 1}`);

      // Act
      const wrapper = mount(SelectCell, {
        props: { value: longArray },
        global: {
          components: { Tag },
        },
      });

      // Assert
      const tags = wrapper.findAllComponents(Tag);
      expect(tags).toHaveLength(20);
    });

    it('should handle array with duplicate values', () => {
      // Arrange & Act
      const wrapper = mount(SelectCell, {
        props: { value: ['Duplicate', 'Duplicate', 'Unique'] },
        global: {
          components: { Tag },
        },
      });

      // Assert
      const tags = wrapper.findAllComponents(Tag);
      expect(tags).toHaveLength(3);
      expect(tags[0].props('value')).toBe('Duplicate');
      expect(tags[1].props('value')).toBe('Duplicate');
      expect(tags[2].props('value')).toBe('Unique');
    });

    it('should handle value of 0 as falsy (not displayed)', () => {
      // Arrange & Act
      const wrapper = mount(SelectCell, {
        props: { value: 0 },
        global: {
          components: { Tag },
        },
      });

      // Assert
      expect(wrapper.text()).toBe('-');
      expect(wrapper.findAllComponents(Tag)).toHaveLength(0);
    });

    it('should handle false value as falsy (not displayed)', () => {
      // Arrange & Act
      const wrapper = mount(SelectCell, {
        props: { value: false },
        global: {
          components: { Tag },
        },
      });

      // Assert
      expect(wrapper.text()).toBe('-');
      expect(wrapper.findAllComponents(Tag)).toHaveLength(0);
    });

    it('should handle array with whitespace strings', () => {
      // Arrange & Act
      const wrapper = mount(SelectCell, {
        props: { value: ['  ', 'Valid', '   '] },
        global: {
          components: { Tag },
        },
      });

      // Assert
      const tags = wrapper.findAllComponents(Tag);
      // Whitespace strings are truthy, so they should be displayed
      expect(tags).toHaveLength(3);
    });

    it('should handle object value by wrapping in array', () => {
      // Arrange
      const objectValue = { label: 'Test' };

      // Act
      const wrapper = mount(SelectCell, {
        props: { value: objectValue },
        global: {
          components: { Tag },
        },
      });

      // Assert
      const tags = wrapper.findAllComponents(Tag);
      expect(tags).toHaveLength(1);
      expect(tags[0].props('value')).toEqual(objectValue);
    });
  });

  describe('Conditional rendering', () => {
    it('should show tags when displayItems has values', () => {
      // Arrange & Act
      const wrapper = mount(SelectCell, {
        props: { value: ['Item'] },
        global: {
          components: { Tag },
        },
      });

      // Assert
      expect(wrapper.findAllComponents(Tag).length).toBeGreaterThan(0);
      expect(wrapper.find('span.text-gray-400').exists()).toBe(false);
    });

    it('should show dash when displayItems is empty', () => {
      // Arrange & Act
      const wrapper = mount(SelectCell, {
        props: { value: [] },
        global: {
          components: { Tag },
        },
      });

      // Assert
      expect(wrapper.findAllComponents(Tag)).toHaveLength(0);
      expect(wrapper.find('span.text-gray-400').exists()).toBe(true);
    });
  });
});
