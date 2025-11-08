import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import DateTimeField from '../DateTimeField.vue';
import DatePicker from 'primevue/datepicker';
import type { DynamicField } from '@/types/dynamic-data';

describe('DateTimeField.vue', () => {
  const createMockField = (overrides?: Partial<DynamicField>): DynamicField => ({
    id: 'field-1',
    fieldKey: 'test_datetime',
    name: 'Test DateTime',
    dataType: 'DATETIME' as any,
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
      const wrapper = mount(DateTimeField, {
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
      const field = createMockField({ name: 'Event Time' });

      // Act
      const wrapper = mount(DateTimeField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { DatePicker },
        },
      });

      // Assert
      expect(wrapper.find('label').text()).toContain('Event Time');
    });

    it('should display asterisk for mandatory fields', () => {
      // Arrange
      const field = createMockField({ isMandatory: true });

      // Act
      const wrapper = mount(DateTimeField, {
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
      const field = createMockField({ description: 'Select date and time' });

      // Act
      const wrapper = mount(DateTimeField, {
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
      expect(wrapper.find('.text-gray-500').text()).toBe('Select date and time');
    });
  });

  describe('DatePicker configuration', () => {
    it('should enable time selection', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(DateTimeField, {
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
      expect(datePicker.props('showTime')).toBe(true);
    });

    it('should not show seconds', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(DateTimeField, {
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
      expect(datePicker.props('showSeconds')).toBe(false);
    });

    it('should show calendar icon', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(DateTimeField, {
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

    it('should set date format to yy-mm-dd', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(DateTimeField, {
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

    it('should use 24-hour format', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(DateTimeField, {
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
      expect(datePicker.props('hourFormat')).toBe('24');
    });
  });

  describe('Error handling', () => {
    it('should display error message when error prop is provided', () => {
      // Arrange
      const field = createMockField();
      const errorMessage = 'DateTime is required';

      // Act
      const wrapper = mount(DateTimeField, {
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
      const wrapper = mount(DateTimeField, {
        props: {
          field,
          modelValue: null,
          error: 'Invalid datetime',
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
    it('should convert ISO string modelValue to Date object', () => {
      // Arrange
      const field = createMockField();
      const isoString = '2024-01-15T14:30:00.000Z';

      // Act
      const wrapper = mount(DateTimeField, {
        props: {
          field,
          modelValue: isoString,
        },
        global: {
          components: { DatePicker },
        },
      });

      // Assert
      const datePicker = wrapper.findComponent(DatePicker);
      const dateValue = datePicker.props('modelValue');
      expect(dateValue).toBeInstanceOf(Date);
    });

    it('should handle null modelValue', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(DateTimeField, {
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

    it('should emit update:modelValue with ISO string when date is selected', async () => {
      // Arrange
      const field = createMockField();
      const wrapper = mount(DateTimeField, {
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
      const selectedDate = new Date('2024-03-10T15:45:00.000Z');
      await datePicker.vm.$emit('update:modelValue', selectedDate);

      // Assert
      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([selectedDate.toISOString()]);
    });

    it('should emit null when date is cleared', async () => {
      // Arrange
      const field = createMockField();
      const wrapper = mount(DateTimeField, {
        props: {
          field,
          modelValue: '2024-01-15T10:00:00.000Z',
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

    it('should preserve time in ISO string format', async () => {
      // Arrange
      const field = createMockField();
      const wrapper = mount(DateTimeField, {
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
      const selectedDate = new Date(Date.UTC(2024, 5, 15, 18, 30, 45));
      await datePicker.vm.$emit('update:modelValue', selectedDate);

      // Assert
      const emittedValue = wrapper.emitted('update:modelValue')?.[0]?.[0] as string;
      expect(emittedValue).toBe(selectedDate.toISOString());
    });
  });

  describe('Disabled/ReadOnly state', () => {
    it('should disable DatePicker when field is read-only', () => {
      // Arrange
      const field = createMockField({ isReadOnly: true });

      // Act
      const wrapper = mount(DateTimeField, {
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
      const wrapper = mount(DateTimeField, {
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
      const field = createMockField({ fieldKey: 'event_time' });

      // Act
      const wrapper = mount(DateTimeField, {
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
      expect(label.attributes('for')).toBe('event_time');
      expect(datePicker.attributes('id')).toBe('event_time');
    });
  });

  describe('Component structure', () => {
    it('should have proper field wrapper structure', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(DateTimeField, {
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
      const wrapper = mount(DateTimeField, {
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
