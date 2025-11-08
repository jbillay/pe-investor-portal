import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CurrencyField from '../CurrencyField.vue';
import InputNumber from 'primevue/inputnumber';
import type { DynamicField } from '@/types/dynamic-data';

describe('CurrencyField.vue', () => {
  const createMockField = (overrides?: Partial<DynamicField>): DynamicField => ({
    id: 'field-1',
    fieldKey: 'test_currency',
    name: 'Test Currency',
    dataType: 'CURRENCY' as any,
    fieldOrder: 1,
    isMandatory: false,
    isReadOnly: false,
    validationRules: [],
    dropdownOptions: [],
    ...overrides,
  });

  describe('Rendering', () => {
    it('should render InputNumber component', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(CurrencyField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { InputNumber },
        },
      });

      // Assert
      expect(wrapper.findComponent(InputNumber).exists()).toBe(true);
    });

    it('should display field name as label', () => {
      // Arrange
      const field = createMockField({ name: 'Annual Revenue' });

      // Act
      const wrapper = mount(CurrencyField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { InputNumber },
        },
      });

      // Assert
      expect(wrapper.find('label').text()).toContain('Annual Revenue');
    });

    it('should display asterisk for mandatory fields', () => {
      // Arrange
      const field = createMockField({ isMandatory: true });

      // Act
      const wrapper = mount(CurrencyField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { InputNumber },
        },
      });

      // Assert
      expect(wrapper.find('.text-red-500').exists()).toBe(true);
      expect(wrapper.find('.text-red-500').text()).toBe('*');
    });

    it('should not display asterisk for non-mandatory fields', () => {
      // Arrange
      const field = createMockField({ isMandatory: false });

      // Act
      const wrapper = mount(CurrencyField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { InputNumber },
        },
      });

      // Assert
      expect(wrapper.find('.text-red-500').exists()).toBe(false);
    });

    it('should display description when provided and no error', () => {
      // Arrange
      const field = createMockField({ description: 'Enter total revenue' });

      // Act
      const wrapper = mount(CurrencyField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { InputNumber },
        },
      });

      // Assert
      expect(wrapper.find('.text-gray-500').exists()).toBe(true);
      expect(wrapper.find('.text-gray-500').text()).toBe('Enter total revenue');
    });

    it('should not display description when error is present', () => {
      // Arrange
      const field = createMockField({ description: 'Enter total revenue' });

      // Act
      const wrapper = mount(CurrencyField, {
        props: {
          field,
          modelValue: null,
          error: 'This field is required',
        },
        global: {
          components: { InputNumber },
        },
      });

      // Assert
      const descriptionElement = wrapper.find('.text-gray-500');
      expect(descriptionElement.exists()).toBe(false);
    });

    it('should use field description as placeholder when available', () => {
      // Arrange
      const field = createMockField({ description: 'Enter amount in USD' });

      // Act
      const wrapper = mount(CurrencyField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { InputNumber },
        },
      });

      // Assert
      const inputNumber = wrapper.findComponent(InputNumber);
      expect(inputNumber.props('placeholder')).toBe('Enter amount in USD');
    });

    it('should use default placeholder when no description', () => {
      // Arrange
      const field = createMockField({ name: 'Price' });

      // Act
      const wrapper = mount(CurrencyField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { InputNumber },
        },
      });

      // Assert
      const inputNumber = wrapper.findComponent(InputNumber);
      expect(inputNumber.props('placeholder')).toBe('Enter Price');
    });
  });

  describe('Currency configuration', () => {
    it('should configure InputNumber in currency mode', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(CurrencyField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { InputNumber },
        },
      });

      // Assert
      const inputNumber = wrapper.findComponent(InputNumber);
      expect(inputNumber.props('mode')).toBe('currency');
    });

    it('should set currency to USD', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(CurrencyField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { InputNumber },
        },
      });

      // Assert
      const inputNumber = wrapper.findComponent(InputNumber);
      expect(inputNumber.props('currency')).toBe('USD');
    });

    it('should set locale to en-US', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(CurrencyField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { InputNumber },
        },
      });

      // Assert
      const inputNumber = wrapper.findComponent(InputNumber);
      expect(inputNumber.props('locale')).toBe('en-US');
    });

    it('should set min and max fraction digits to 2', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(CurrencyField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { InputNumber },
        },
      });

      // Assert
      const inputNumber = wrapper.findComponent(InputNumber);
      expect(inputNumber.props('minFractionDigits')).toBe(2);
      expect(inputNumber.props('maxFractionDigits')).toBe(2);
    });
  });

  describe('Error handling', () => {
    it('should display error message when error prop is provided', () => {
      // Arrange
      const field = createMockField();
      const errorMessage = 'Amount must be positive';

      // Act
      const wrapper = mount(CurrencyField, {
        props: {
          field,
          modelValue: null,
          error: errorMessage,
        },
        global: {
          components: { InputNumber },
        },
      });

      // Assert
      expect(wrapper.find('.p-error').exists()).toBe(true);
      expect(wrapper.find('.p-error').text()).toBe(errorMessage);
    });

    it('should add p-invalid class to InputNumber when error is present', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(CurrencyField, {
        props: {
          field,
          modelValue: null,
          error: 'Invalid value',
        },
        global: {
          components: { InputNumber },
        },
      });

      // Assert
      const inputNumber = wrapper.findComponent(InputNumber);
      expect(inputNumber.classes()).toContain('p-invalid');
    });

    it('should not add p-invalid class when no error', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(CurrencyField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { InputNumber },
        },
      });

      // Assert
      const inputNumber = wrapper.findComponent(InputNumber);
      expect(inputNumber.classes()).not.toContain('p-invalid');
    });
  });

  describe('v-model binding', () => {
    it('should pass modelValue to InputNumber', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(CurrencyField, {
        props: {
          field,
          modelValue: 1500.50,
        },
        global: {
          components: { InputNumber },
        },
      });

      // Assert
      const inputNumber = wrapper.findComponent(InputNumber);
      expect(inputNumber.props('modelValue')).toBe(1500.50);
    });

    it('should handle null modelValue', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(CurrencyField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { InputNumber },
        },
      });

      // Assert
      const inputNumber = wrapper.findComponent(InputNumber);
      expect(inputNumber.props('modelValue')).toBe(null);
    });

    it('should emit update:modelValue when InputNumber value changes', async () => {
      // Arrange
      const field = createMockField();
      const wrapper = mount(CurrencyField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { InputNumber },
        },
      });

      // Act
      const inputNumber = wrapper.findComponent(InputNumber);
      await inputNumber.vm.$emit('update:modelValue', 2500.75);

      // Assert
      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([2500.75]);
    });

    it('should emit update:modelValue with null when clearing', async () => {
      // Arrange
      const field = createMockField();
      const wrapper = mount(CurrencyField, {
        props: {
          field,
          modelValue: 1000,
        },
        global: {
          components: { InputNumber },
        },
      });

      // Act
      const inputNumber = wrapper.findComponent(InputNumber);
      await inputNumber.vm.$emit('update:modelValue', null);

      // Assert
      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([null]);
    });
  });

  describe('Disabled/ReadOnly state', () => {
    it('should disable InputNumber when field is read-only', () => {
      // Arrange
      const field = createMockField({ isReadOnly: true });

      // Act
      const wrapper = mount(CurrencyField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { InputNumber },
        },
      });

      // Assert
      const inputNumber = wrapper.findComponent(InputNumber);
      expect(inputNumber.props('disabled')).toBe(true);
    });

    it('should not disable InputNumber when field is not read-only', () => {
      // Arrange
      const field = createMockField({ isReadOnly: false });

      // Act
      const wrapper = mount(CurrencyField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { InputNumber },
        },
      });

      // Assert
      const inputNumber = wrapper.findComponent(InputNumber);
      expect(inputNumber.props('disabled')).toBe(false);
    });
  });

  describe('Label accessibility', () => {
    it('should associate label with InputNumber using for and id attributes', () => {
      // Arrange
      const field = createMockField({ fieldKey: 'annual_revenue' });

      // Act
      const wrapper = mount(CurrencyField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { InputNumber },
        },
      });

      // Assert
      const label = wrapper.find('label');
      const inputNumber = wrapper.findComponent(InputNumber);
      expect(label.attributes('for')).toBe('annual_revenue');
      expect(inputNumber.attributes('id')).toBe('annual_revenue');
    });
  });

  describe('Component structure', () => {
    it('should have proper field wrapper structure', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(CurrencyField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { InputNumber },
        },
      });

      // Assert
      expect(wrapper.find('.field').exists()).toBe(true);
      expect(wrapper.find('.field.mb-4').exists()).toBe(true);
    });

    it('should have full width InputNumber', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(CurrencyField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { InputNumber },
        },
      });

      // Assert
      const inputNumber = wrapper.findComponent(InputNumber);
      expect(inputNumber.classes()).toContain('w-full');
    });
  });
});
