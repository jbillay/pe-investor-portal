import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import DateCell from '../DateCell.vue';

describe('DateCell.vue', () => {
  describe('Rendering with valid dates', () => {
    it('should format ISO date string correctly', () => {
      // Arrange & Act
      const wrapper = mount(DateCell, {
        props: { value: '2024-03-15T10:30:00Z' },
      });

      // Assert
      const expectedDate = new Date('2024-03-15T10:30:00Z').toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      expect(wrapper.text()).toBe(expectedDate);
    });

    it('should format date object correctly', () => {
      // Arrange
      const date = new Date('2024-12-25T00:00:00Z');

      // Act
      const wrapper = mount(DateCell, {
        props: { value: date },
      });

      // Assert
      const expectedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      expect(wrapper.text()).toBe(expectedDate);
    });

    it('should format simple date string correctly', () => {
      // Arrange & Act
      const wrapper = mount(DateCell, {
        props: { value: '2024-01-01' },
      });

      // Assert
      const expectedDate = new Date('2024-01-01').toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      expect(wrapper.text()).toBe(expectedDate);
    });

    it('should format timestamp correctly', () => {
      // Arrange
      const timestamp = 1704067200000; // Jan 1, 2024 in milliseconds

      // Act
      const wrapper = mount(DateCell, {
        props: { value: timestamp },
      });

      // Assert
      const expectedDate = new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      expect(wrapper.text()).toBe(expectedDate);
    });
  });

  describe('Rendering with null/undefined/empty values', () => {
    it('should display "-" when value is null', () => {
      // Arrange & Act
      const wrapper = mount(DateCell, {
        props: { value: null },
      });

      // Assert
      expect(wrapper.text()).toBe('-');
    });

    it('should display "-" when value is undefined', () => {
      // Arrange & Act
      const wrapper = mount(DateCell, {
        props: { value: undefined },
      });

      // Assert
      expect(wrapper.text()).toBe('-');
    });

    it('should display "-" when value is empty string', () => {
      // Arrange & Act
      const wrapper = mount(DateCell, {
        props: { value: '' },
      });

      // Assert
      expect(wrapper.text()).toBe('-');
    });

    it('should display "-" when value is 0', () => {
      // Arrange & Act
      const wrapper = mount(DateCell, {
        props: { value: 0 },
      });

      // Assert
      expect(wrapper.text()).toBe('-');
    });

    it('should display "-" when value is false', () => {
      // Arrange & Act
      const wrapper = mount(DateCell, {
        props: { value: false },
      });

      // Assert
      expect(wrapper.text()).toBe('-');
    });
  });

  describe('Component structure', () => {
    it('should render a span element', () => {
      // Arrange & Act
      const wrapper = mount(DateCell, {
        props: { value: '2024-03-15' },
      });

      // Assert
      expect(wrapper.find('span').exists()).toBe(true);
    });

    it('should have correct CSS class', () => {
      // Arrange & Act
      const wrapper = mount(DateCell, {
        props: { value: '2024-03-15' },
      });

      // Assert
      const span = wrapper.find('span');
      expect(span.classes()).toContain('text-gray-900');
    });
  });

  describe('Date formatting edge cases', () => {
    it('should format leap year date correctly', () => {
      // Arrange & Act
      const wrapper = mount(DateCell, {
        props: { value: '2024-02-29' },
      });

      // Assert
      const expectedDate = new Date('2024-02-29').toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      expect(wrapper.text()).toBe(expectedDate);
    });

    it('should format year boundary date correctly', () => {
      // Arrange & Act
      const wrapper = mount(DateCell, {
        props: { value: '2023-12-31' },
      });

      // Assert
      const expectedDate = new Date('2023-12-31').toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      expect(wrapper.text()).toBe(expectedDate);
    });
  });
});
