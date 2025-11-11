import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CurrencyCell from '../CurrencyCell.vue';

describe('CurrencyCell.vue', () => {
  describe('Rendering with valid values', () => {
    it('should format positive number as USD currency', () => {
      // Arrange & Act
      const wrapper = mount(CurrencyCell, {
        props: { value: 1000 },
      });

      // Assert
      expect(wrapper.text()).toBe('$1,000.00');
    });

    it('should format large number with proper separators', () => {
      // Arrange & Act
      const wrapper = mount(CurrencyCell, {
        props: { value: 1234567.89 },
      });

      // Assert
      expect(wrapper.text()).toBe('$1,234,567.89');
    });

    it('should format negative number with minus sign', () => {
      // Arrange & Act
      const wrapper = mount(CurrencyCell, {
        props: { value: -500 },
      });

      // Assert
      expect(wrapper.text()).toBe('-$500.00');
    });

    it('should format zero correctly', () => {
      // Arrange & Act
      const wrapper = mount(CurrencyCell, {
        props: { value: 0 },
      });

      // Assert
      expect(wrapper.text()).toBe('$0.00');
    });

    it('should format decimal number correctly', () => {
      // Arrange & Act
      const wrapper = mount(CurrencyCell, {
        props: { value: 99.99 },
      });

      // Assert
      expect(wrapper.text()).toBe('$99.99');
    });

    it('should format small decimal number correctly', () => {
      // Arrange & Act
      const wrapper = mount(CurrencyCell, {
        props: { value: 0.01 },
      });

      // Assert
      expect(wrapper.text()).toBe('$0.01');
    });

    it('should handle string number values', () => {
      // Arrange & Act
      const wrapper = mount(CurrencyCell, {
        props: { value: '2500' },
      });

      // Assert
      expect(wrapper.text()).toBe('$2,500.00');
    });

    it('should format very large number', () => {
      // Arrange & Act
      const wrapper = mount(CurrencyCell, {
        props: { value: 1000000000 },
      });

      // Assert
      expect(wrapper.text()).toBe('$1,000,000,000.00');
    });
  });

  describe('Rendering with null/undefined values', () => {
    it('should display "-" when value is null', () => {
      // Arrange & Act
      const wrapper = mount(CurrencyCell, {
        props: { value: null },
      });

      // Assert
      expect(wrapper.text()).toBe('-');
    });

    it('should display "-" when value is undefined', () => {
      // Arrange & Act
      const wrapper = mount(CurrencyCell, {
        props: { value: undefined },
      });

      // Assert
      expect(wrapper.text()).toBe('-');
    });
  });

  describe('Component structure', () => {
    it('should render a span element', () => {
      // Arrange & Act
      const wrapper = mount(CurrencyCell, {
        props: { value: 100 },
      });

      // Assert
      expect(wrapper.find('span').exists()).toBe(true);
    });

    it('should have correct CSS classes', () => {
      // Arrange & Act
      const wrapper = mount(CurrencyCell, {
        props: { value: 100 },
      });

      // Assert
      const span = wrapper.find('span');
      expect(span.classes()).toContain('text-gray-900');
      expect(span.classes()).toContain('font-semibold');
    });
  });

  describe('Edge cases', () => {
    it('should handle very small positive decimal', () => {
      // Arrange & Act
      const wrapper = mount(CurrencyCell, {
        props: { value: 0.001 },
      });

      // Assert
      expect(wrapper.text()).toBe('$0.00');
    });

    it('should handle negative decimal', () => {
      // Arrange & Act
      const wrapper = mount(CurrencyCell, {
        props: { value: -123.456 },
      });

      // Assert
      expect(wrapper.text()).toBe('-$123.46');
    });
  });
});
