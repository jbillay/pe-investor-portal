import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import NumberCell from '../NumberCell.vue';

describe('NumberCell.vue', () => {
  describe('Rendering with valid numbers', () => {
    it('should format positive integer correctly', () => {
      // Arrange & Act
      const wrapper = mount(NumberCell, {
        props: { value: 1000 },
      });

      // Assert
      expect(wrapper.text()).toBe('1,000');
    });

    it('should format large number with proper separators', () => {
      // Arrange & Act
      const wrapper = mount(NumberCell, {
        props: { value: 1234567890 },
      });

      // Assert
      expect(wrapper.text()).toBe('1,234,567,890');
    });

    it('should format negative number correctly', () => {
      // Arrange & Act
      const wrapper = mount(NumberCell, {
        props: { value: -500 },
      });

      // Assert
      expect(wrapper.text()).toBe('-500');
    });

    it('should format zero correctly', () => {
      // Arrange & Act
      const wrapper = mount(NumberCell, {
        props: { value: 0 },
      });

      // Assert
      expect(wrapper.text()).toBe('0');
    });

    it('should format decimal number correctly', () => {
      // Arrange & Act
      const wrapper = mount(NumberCell, {
        props: { value: 1234.56 },
      });

      // Assert
      expect(wrapper.text()).toBe('1,234.56');
    });

    it('should format small decimal correctly', () => {
      // Arrange & Act
      const wrapper = mount(NumberCell, {
        props: { value: 0.123 },
      });

      // Assert
      expect(wrapper.text()).toBe('0.123');
    });

    it('should format single digit number without separator', () => {
      // Arrange & Act
      const wrapper = mount(NumberCell, {
        props: { value: 5 },
      });

      // Assert
      expect(wrapper.text()).toBe('5');
    });

    it('should handle string number values', () => {
      // Arrange & Act
      const wrapper = mount(NumberCell, {
        props: { value: '9999' },
      });

      // Assert
      expect(wrapper.text()).toBe('9,999');
    });

    it('should format very large number', () => {
      // Arrange & Act
      const wrapper = mount(NumberCell, {
        props: { value: 999999999999 },
      });

      // Assert
      expect(wrapper.text()).toBe('999,999,999,999');
    });

    it('should format negative decimal correctly', () => {
      // Arrange & Act
      const wrapper = mount(NumberCell, {
        props: { value: -123.45 },
      });

      // Assert
      expect(wrapper.text()).toBe('-123.45');
    });
  });

  describe('Rendering with null/undefined values', () => {
    it('should display "-" when value is null', () => {
      // Arrange & Act
      const wrapper = mount(NumberCell, {
        props: { value: null },
      });

      // Assert
      expect(wrapper.text()).toBe('-');
    });

    it('should display "-" when value is undefined', () => {
      // Arrange & Act
      const wrapper = mount(NumberCell, {
        props: { value: undefined },
      });

      // Assert
      expect(wrapper.text()).toBe('-');
    });
  });

  describe('Component structure', () => {
    it('should render a span element', () => {
      // Arrange & Act
      const wrapper = mount(NumberCell, {
        props: { value: 100 },
      });

      // Assert
      expect(wrapper.find('span').exists()).toBe(true);
    });

    it('should have correct CSS classes', () => {
      // Arrange & Act
      const wrapper = mount(NumberCell, {
        props: { value: 100 },
      });

      // Assert
      const span = wrapper.find('span');
      expect(span.classes()).toContain('text-gray-900');
      expect(span.classes()).toContain('font-mono');
    });
  });

  describe('Edge cases', () => {
    it('should handle very small positive decimal', () => {
      // Arrange & Act
      const wrapper = mount(NumberCell, {
        props: { value: 0.000001 },
      });

      // Assert
      // Very small decimals are rounded by Intl.NumberFormat
      expect(wrapper.text()).toBe('0');
    });

    it('should handle negative zero', () => {
      // Arrange & Act
      const wrapper = mount(NumberCell, {
        props: { value: -0 },
      });

      // Assert
      // Negative zero is formatted as "-0" by Intl.NumberFormat
      expect(wrapper.text()).toBe('-0');
    });

    it('should handle three-digit number without separator', () => {
      // Arrange & Act
      const wrapper = mount(NumberCell, {
        props: { value: 999 },
      });

      // Assert
      expect(wrapper.text()).toBe('999');
    });

    it('should format number with many decimal places', () => {
      // Arrange & Act
      const wrapper = mount(NumberCell, {
        props: { value: 123.456789 },
      });

      // Assert
      expect(wrapper.text()).toBe('123.457');
    });

    it('should handle negative single digit', () => {
      // Arrange & Act
      const wrapper = mount(NumberCell, {
        props: { value: -1 },
      });

      // Assert
      expect(wrapper.text()).toBe('-1');
    });

    it('should format number at thousand boundary', () => {
      // Arrange & Act
      const wrapper = mount(NumberCell, {
        props: { value: 1000 },
      });

      // Assert
      expect(wrapper.text()).toBe('1,000');
    });

    it('should format number just below thousand boundary', () => {
      // Arrange & Act
      const wrapper = mount(NumberCell, {
        props: { value: 999 },
      });

      // Assert
      expect(wrapper.text()).toBe('999');
    });
  });
});
