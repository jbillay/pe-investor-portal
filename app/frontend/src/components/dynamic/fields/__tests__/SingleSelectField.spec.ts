import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import SingleSelectField from '../SingleSelectField.vue';
import Select from 'primevue/select';
import type { DynamicField } from '@/types/dynamic-data';

describe('SingleSelectField.vue', () => {
  const createMockField = (overrides?: Partial<DynamicField>): DynamicField => ({
    id: 'field-1',
    fieldKey: 'test_select',
    name: 'Test Select',
    dataType: 'SINGLE_SELECT' as any,
    fieldOrder: 1,
    isMandatory: false,
    isReadOnly: false,
    validationRules: [],
    dropdownOptions: [
      { label: 'Option 1', value: 'opt1', orderIndex: 1 },
      { label: 'Option 2', value: 'opt2', orderIndex: 2 },
      { label: 'Option 3', value: 'opt3', orderIndex: 3 },
    ],
    ...overrides,
  });

  describe('Rendering', () => {
    it('should render Select component', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(SingleSelectField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { Select },
        },
      });

      // Assert
      expect(wrapper.findComponent(Select).exists()).toBe(true);
    });

    it('should display field name as label', () => {
      // Arrange
      const field = createMockField({ name: 'Status' });

      // Act
      const wrapper = mount(SingleSelectField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { Select },
        },
      });

      // Assert
      expect(wrapper.find('label').text()).toContain('Status');
    });

    it('should display asterisk for mandatory fields', () => {
      // Arrange
      const field = createMockField({ isMandatory: true });

      // Act
      const wrapper = mount(SingleSelectField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { Select },
        },
      });

      // Assert
      expect(wrapper.find('.text-red-500').exists()).toBe(true);
      expect(wrapper.find('.text-red-500').text()).toBe('*');
    });

    it('should display description when provided and no error', () => {
      // Arrange
      const field = createMockField({ description: 'Choose an option' });

      // Act
      const wrapper = mount(SingleSelectField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { Select },
        },
      });

      // Assert
      expect(wrapper.find('.text-gray-500').exists()).toBe(true);
      expect(wrapper.find('.text-gray-500').text()).toBe('Choose an option');
    });

    it('should use field description as placeholder when available', () => {
      // Arrange
      const field = createMockField({ description: 'Pick one' });

      // Act
      const wrapper = mount(SingleSelectField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { Select },
        },
      });

      // Assert
      const select = wrapper.findComponent(Select);
      expect(select.props('placeholder')).toBe('Pick one');
    });

    it('should use default placeholder when no description', () => {
      // Arrange
      const field = createMockField({ name: 'Category' });

      // Act
      const wrapper = mount(SingleSelectField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { Select },
        },
      });

      // Assert
      const select = wrapper.findComponent(Select);
      expect(select.props('placeholder')).toBe('Select Category');
    });
  });

  describe('Options handling', () => {
    it('should pass dropdown options to Select', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(SingleSelectField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { Select },
        },
      });

      // Assert
      const select = wrapper.findComponent(Select);
      expect(select.props('options')).toEqual(field.dropdownOptions);
    });

    it('should use empty array when no dropdown options', () => {
      // Arrange
      const field = createMockField({ dropdownOptions: undefined });

      // Act
      const wrapper = mount(SingleSelectField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { Select },
        },
      });

      // Assert
      const select = wrapper.findComponent(Select);
      expect(select.props('options')).toEqual([]);
    });

    it('should configure option label and value properties', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(SingleSelectField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { Select },
        },
      });

      // Assert
      const select = wrapper.findComponent(Select);
      expect(select.props('optionLabel')).toBe('label');
      expect(select.props('optionValue')).toBe('value');
    });
  });

  describe('Clear functionality', () => {
    it('should show clear button for non-mandatory fields', () => {
      // Arrange
      const field = createMockField({ isMandatory: false });

      // Act
      const wrapper = mount(SingleSelectField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { Select },
        },
      });

      // Assert
      const select = wrapper.findComponent(Select);
      expect(select.props('showClear')).toBe(true);
    });

    it('should not show clear button for mandatory fields', () => {
      // Arrange
      const field = createMockField({ isMandatory: true });

      // Act
      const wrapper = mount(SingleSelectField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { Select },
        },
      });

      // Assert
      const select = wrapper.findComponent(Select);
      expect(select.props('showClear')).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should display error message when error prop is provided', () => {
      // Arrange
      const field = createMockField();
      const errorMessage = 'Selection is required';

      // Act
      const wrapper = mount(SingleSelectField, {
        props: {
          field,
          modelValue: null,
          error: errorMessage,
        },
        global: {
          components: { Select },
        },
      });

      // Assert
      expect(wrapper.find('.p-error').exists()).toBe(true);
      expect(wrapper.find('.p-error').text()).toBe(errorMessage);
    });

    it('should add p-invalid class to Select when error is present', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(SingleSelectField, {
        props: {
          field,
          modelValue: null,
          error: 'Invalid selection',
        },
        global: {
          components: { Select },
        },
      });

      // Assert
      const select = wrapper.findComponent(Select);
      expect(select.classes()).toContain('p-invalid');
    });
  });

  describe('v-model binding', () => {
    it('should pass modelValue to Select', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(SingleSelectField, {
        props: {
          field,
          modelValue: 'opt2',
        },
        global: {
          components: { Select },
        },
      });

      // Assert
      const select = wrapper.findComponent(Select);
      expect(select.props('modelValue')).toBe('opt2');
    });

    it('should handle null modelValue', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(SingleSelectField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { Select },
        },
      });

      // Assert
      const select = wrapper.findComponent(Select);
      expect(select.props('modelValue')).toBe(null);
    });

    it('should emit update:modelValue when Select value changes', async () => {
      // Arrange
      const field = createMockField();
      const wrapper = mount(SingleSelectField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { Select },
        },
      });

      // Act
      const select = wrapper.findComponent(Select);
      await select.vm.$emit('update:modelValue', 'opt1');

      // Assert
      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['opt1']);
    });

    it('should emit update:modelValue with null when clearing', async () => {
      // Arrange
      const field = createMockField();
      const wrapper = mount(SingleSelectField, {
        props: {
          field,
          modelValue: 'opt1',
        },
        global: {
          components: { Select },
        },
      });

      // Act
      const select = wrapper.findComponent(Select);
      await select.vm.$emit('update:modelValue', null);

      // Assert
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([null]);
    });
  });

  describe('Disabled/ReadOnly state', () => {
    it('should disable Select when field is read-only', () => {
      // Arrange
      const field = createMockField({ isReadOnly: true });

      // Act
      const wrapper = mount(SingleSelectField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { Select },
        },
      });

      // Assert
      const select = wrapper.findComponent(Select);
      expect(select.props('disabled')).toBe(true);
    });

    it('should not disable Select when field is not read-only', () => {
      // Arrange
      const field = createMockField({ isReadOnly: false });

      // Act
      const wrapper = mount(SingleSelectField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { Select },
        },
      });

      // Assert
      const select = wrapper.findComponent(Select);
      expect(select.props('disabled')).toBe(false);
    });
  });

  describe('Label accessibility', () => {
    it('should associate label with Select using for and id attributes', () => {
      // Arrange
      const field = createMockField({ fieldKey: 'status' });

      // Act
      const wrapper = mount(SingleSelectField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { Select },
        },
      });

      // Assert
      const label = wrapper.find('label');
      const select = wrapper.findComponent(Select);
      expect(label.attributes('for')).toBe('status');
      expect(select.attributes('id')).toBe('status');
    });
  });

  describe('Component structure', () => {
    it('should have proper field wrapper structure', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(SingleSelectField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { Select },
        },
      });

      // Assert
      expect(wrapper.find('.field').exists()).toBe(true);
      expect(wrapper.find('.field.mb-4').exists()).toBe(true);
    });

    it('should have full width Select', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(SingleSelectField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { Select },
        },
      });

      // Assert
      const select = wrapper.findComponent(Select);
      expect(select.classes()).toContain('w-full');
    });
  });
});
