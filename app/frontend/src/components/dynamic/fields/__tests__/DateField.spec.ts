import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import DateField from '../DateField.vue';
import DatePicker from 'primevue/datepicker';
import type { DynamicField } from '@/types/dynamic-data';

describe('DateField.vue', () => {
  const createMockField = (overrides?: Partial<DynamicField>): DynamicField => ({
    id: 'field-1',
    fieldKey: 'test_date',
    name: 'Test Date',
    dataType: 'DATE' as any,
    fieldOrder: 1,
    isMandatory: false,
    isReadOnly: false,
    validationRules: [],
    dropdownOptions: [],
    ...overrides,
  });

  describe('Rendering', () => {
    it('should render DatePicker component', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(DateField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { DatePicker },
        },
      });

      // Assert
      expect(wrapper.findComponent(DatePicker).exists()).toBe(true);
    });

    it('should display field name as label', () => {
      // Arrange
      const field = createMockField({ name: 'Birth Date' });

      // Act
      const wrapper = mount(DateField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { DatePicker },
        },
      });

      // Assert
      expect(wrapper.find('label').text()).toContain('Birth Date');
    });

    it('should display asterisk for mandatory fields', () => {
      // Arrange
      const field = createMockField({ isMandatory: true });

      // Act
      const wrapper = mount(DateField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { DatePicker },
        },
      });

      // Assert
      expect(wrapper.find('.text-red-500').exists()).toBe(true);
      expect(wrapper.find('.text-red-500').text()).toBe('*');
    });

    it('should display description when provided and no error', () => {
      // Arrange
      const field = createMockField({ description: 'Select a date' });

      // Act
      const wrapper = mount(DateField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { DatePicker },
        },
      });

      // Assert
      expect(wrapper.find('.text-gray-500').exists()).toBe(true);
      expect(wrapper.find('.text-gray-500').text()).toBe('Select a date');
    });

    it('should use field description as placeholder when available', () => {
      // Arrange
      const field = createMockField({ description: 'Pick a date' });

      // Act
      const wrapper = mount(DateField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { DatePicker },
        },
      });

      // Assert
      const datePicker = wrapper.findComponent(DatePicker);
      expect(datePicker.props('placeholder')).toBe('Pick a date');
    });

    it('should use default placeholder when no description', () => {
      // Arrange
      const field = createMockField({ name: 'Start Date' });

      // Act
      const wrapper = mount(DateField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { DatePicker },
        },
      });

      // Assert
      const datePicker = wrapper.findComponent(DatePicker);
      expect(datePicker.props('placeholder')).toBe('Select Start Date');
    });
  });

  describe('DatePicker configuration', () => {
    it('should set date format to yy-mm-dd', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(DateField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { DatePicker },
        },
      });

      // Assert
      const datePicker = wrapper.findComponent(DatePicker);
      expect(datePicker.props('dateFormat')).toBe('yy-mm-dd');
    });

    it('should show calendar icon', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(DateField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { DatePicker },
        },
      });

      // Assert
      const datePicker = wrapper.findComponent(DatePicker);
      expect(datePicker.props('showIcon')).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should display error message when error prop is provided', () => {
      // Arrange
      const field = createMockField();
      const errorMessage = 'Date is required';

      // Act
      const wrapper = mount(DateField, {
        props: {
          field,
          modelValue: null,
          error: errorMessage,
        },
        global: {
          components: { DatePicker },
        },
      });

      // Assert
      expect(wrapper.find('.p-error').exists()).toBe(true);
      expect(wrapper.find('.p-error').text()).toBe(errorMessage);
    });

    it('should add p-invalid class to DatePicker when error is present', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(DateField, {
        props: {
          field,
          modelValue: null,
          error: 'Invalid date',
        },
        global: {
          components: { DatePicker },
        },
      });

      // Assert
      const datePicker = wrapper.findComponent(DatePicker);
      expect(datePicker.classes()).toContain('p-invalid');
    });
  });

  describe('v-model binding and date conversion', () => {
    it('should convert string modelValue to Date object', () => {
      // Arrange
      const field = createMockField();
      const dateString = '2024-01-15';

      // Act
      const wrapper = mount(DateField, {
        props: {
          field,
          modelValue: dateString,
        },
        global: {
          components: { DatePicker },
        },
      });

      // Assert
      const datePicker = wrapper.findComponent(DatePicker);
      const dateValue = datePicker.props('modelValue');
      expect(dateValue).toBeInstanceOf(Date);
      expect((dateValue as Date).getFullYear()).toBe(2024);
      expect((dateValue as Date).getMonth()).toBe(0); // January is 0
      expect((dateValue as Date).getDate()).toBe(15);
    });

    it('should handle null modelValue', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(DateField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { DatePicker },
        },
      });

      // Assert
      const datePicker = wrapper.findComponent(DatePicker);
      expect(datePicker.props('modelValue')).toBe(null);
    });

    it('should emit update:modelValue with YYYY-MM-DD format when date is selected', async () => {
      // Arrange
      const field = createMockField();
      const wrapper = mount(DateField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { DatePicker },
        },
      });

      // Act
      const datePicker = wrapper.findComponent(DatePicker);
      const selectedDate = new Date(2024, 2, 10); // March 10, 2024
      await datePicker.vm.$emit('update:modelValue', selectedDate);

      // Assert
      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['2024-03-10']);
    });

    it('should emit null when date is cleared', async () => {
      // Arrange
      const field = createMockField();
      const wrapper = mount(DateField, {
        props: {
          field,
          modelValue: '2024-01-15',
        },
        global: {
          components: { DatePicker },
        },
      });

      // Act
      const datePicker = wrapper.findComponent(DatePicker);
      await datePicker.vm.$emit('update:modelValue', null);

      // Assert
      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([null]);
    });

    it('should format single-digit months with leading zero', async () => {
      // Arrange
      const field = createMockField();
      const wrapper = mount(DateField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { DatePicker },
        },
      });

      // Act
      const datePicker = wrapper.findComponent(DatePicker);
      const selectedDate = new Date(2024, 0, 5); // January 5, 2024
      await datePicker.vm.$emit('update:modelValue', selectedDate);

      // Assert
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['2024-01-05']);
    });

    it('should format single-digit days with leading zero', async () => {
      // Arrange
      const field = createMockField();
      const wrapper = mount(DateField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { DatePicker },
        },
      });

      // Act
      const datePicker = wrapper.findComponent(DatePicker);
      const selectedDate = new Date(2024, 11, 3); // December 3, 2024
      await datePicker.vm.$emit('update:modelValue', selectedDate);

      // Assert
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['2024-12-03']);
    });
  });

  describe('Disabled/ReadOnly state', () => {
    it('should disable DatePicker when field is read-only', () => {
      // Arrange
      const field = createMockField({ isReadOnly: true });

      // Act
      const wrapper = mount(DateField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { DatePicker },
        },
      });

      // Assert
      const datePicker = wrapper.findComponent(DatePicker);
      expect(datePicker.props('disabled')).toBe(true);
    });

    it('should not disable DatePicker when field is not read-only', () => {
      // Arrange
      const field = createMockField({ isReadOnly: false });

      // Act
      const wrapper = mount(DateField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { DatePicker },
        },
      });

      // Assert
      const datePicker = wrapper.findComponent(DatePicker);
      expect(datePicker.props('disabled')).toBe(false);
    });
  });

  describe('Label accessibility', () => {
    it('should associate label with DatePicker using for and id attributes', () => {
      // Arrange
      const field = createMockField({ fieldKey: 'start_date' });

      // Act
      const wrapper = mount(DateField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { DatePicker },
        },
      });

      // Assert
      const label = wrapper.find('label');
      const datePicker = wrapper.findComponent(DatePicker);
      expect(label.attributes('for')).toBe('start_date');
      expect(datePicker.attributes('id')).toBe('start_date');
    });
  });

  describe('Component structure', () => {
    it('should have proper field wrapper structure', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(DateField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { DatePicker },
        },
      });

      // Assert
      expect(wrapper.find('.field').exists()).toBe(true);
      expect(wrapper.find('.field.mb-4').exists()).toBe(true);
    });

    it('should have full width DatePicker', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(DateField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { DatePicker },
        },
      });

      // Assert
      const datePicker = wrapper.findComponent(DatePicker);
      expect(datePicker.classes()).toContain('w-full');
    });
  });
});
