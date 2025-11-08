import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import DateTimeCell from '../DateTimeCell.vue';

describe('DateTimeCell.vue', () => {
  describe('Rendering with valid date-time values', () => {
    it('should format ISO datetime string correctly', () => {
      // Arrange & Act
      const wrapper = mount(DateTimeCell, {
        props: { value: '2024-03-15T10:30:00Z' },
      });

      // Assert
      const expectedDateTime = new Date('2024-03-15T10:30:00Z').toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      expect(wrapper.text()).toBe(expectedDateTime);
    });

    it('should format date object with time correctly', () => {
      // Arrange
      const date = new Date('2024-12-25T15:45:00Z');

      // Act
      const wrapper = mount(DateTimeCell, {
        props: { value: date },
      });

      // Assert
      const expectedDateTime = date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      expect(wrapper.text()).toBe(expectedDateTime);
    });

    it('should format midnight time correctly', () => {
      // Arrange & Act
      const wrapper = mount(DateTimeCell, {
        props: { value: '2024-01-01T00:00:00Z' },
      });

      // Assert
      const expectedDateTime = new Date('2024-01-01T00:00:00Z').toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      expect(wrapper.text()).toBe(expectedDateTime);
    });

    it('should format timestamp correctly', () => {
      // Arrange
      const timestamp = 1704067200000; // Jan 1, 2024 00:00:00 UTC

      // Act
      const wrapper = mount(DateTimeCell, {
        props: { value: timestamp },
      });

      // Assert
      const expectedDateTime = new Date(timestamp).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      expect(wrapper.text()).toBe(expectedDateTime);
    });

    it('should format afternoon time correctly', () => {
      // Arrange & Act
      const wrapper = mount(DateTimeCell, {
        props: { value: '2024-06-15T14:30:00Z' },
      });

      // Assert
      const expectedDateTime = new Date('2024-06-15T14:30:00Z').toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      expect(wrapper.text()).toBe(expectedDateTime);
    });
  });

  describe('Rendering with null/undefined/empty values', () => {
    it('should display "-" when value is null', () => {
      // Arrange & Act
      const wrapper = mount(DateTimeCell, {
        props: { value: null },
      });

      // Assert
      expect(wrapper.text()).toBe('-');
    });

    it('should display "-" when value is undefined', () => {
      // Arrange & Act
      const wrapper = mount(DateTimeCell, {
        props: { value: undefined },
      });

      // Assert
      expect(wrapper.text()).toBe('-');
    });

    it('should display "-" when value is empty string', () => {
      // Arrange & Act
      const wrapper = mount(DateTimeCell, {
        props: { value: '' },
      });

      // Assert
      expect(wrapper.text()).toBe('-');
    });

    it('should display "-" when value is 0', () => {
      // Arrange & Act
      const wrapper = mount(DateTimeCell, {
        props: { value: 0 },
      });

      // Assert
      expect(wrapper.text()).toBe('-');
    });

    it('should display "-" when value is false', () => {
      // Arrange & Act
      const wrapper = mount(DateTimeCell, {
        props: { value: false },
      });

      // Assert
      expect(wrapper.text()).toBe('-');
    });
  });

  describe('Component structure', () => {
    it('should render a span element', () => {
      // Arrange & Act
      const wrapper = mount(DateTimeCell, {
        props: { value: '2024-03-15T10:30:00Z' },
      });

      // Assert
      expect(wrapper.find('span').exists()).toBe(true);
    });

    it('should have correct CSS class', () => {
      // Arrange & Act
      const wrapper = mount(DateTimeCell, {
        props: { value: '2024-03-15T10:30:00Z' },
      });

      // Assert
      const span = wrapper.find('span');
      expect(span.classes()).toContain('text-gray-900');
    });
  });

  describe('DateTime formatting edge cases', () => {
    it('should format end of day time correctly', () => {
      // Arrange & Act
      const wrapper = mount(DateTimeCell, {
        props: { value: '2024-03-15T23:59:00Z' },
      });

      // Assert
      const expectedDateTime = new Date('2024-03-15T23:59:00Z').toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      expect(wrapper.text()).toBe(expectedDateTime);
    });

    it('should format leap year datetime correctly', () => {
      // Arrange & Act
      const wrapper = mount(DateTimeCell, {
        props: { value: '2024-02-29T12:00:00Z' },
      });

      // Assert
      const expectedDateTime = new Date('2024-02-29T12:00:00Z').toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      expect(wrapper.text()).toBe(expectedDateTime);
    });
  });
});
