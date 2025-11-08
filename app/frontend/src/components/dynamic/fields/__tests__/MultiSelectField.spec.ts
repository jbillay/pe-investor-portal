import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MultiSelectField from '../MultiSelectField.vue';
import MultiSelect from 'primevue/multiselect';
import type { DynamicField } from '@/types/dynamic-data';

describe('MultiSelectField.vue', () => {
  const createMockField = (overrides?: Partial<DynamicField>): DynamicField => ({
    id: 'field-1',
    fieldKey: 'test_multiselect',
    name: 'Test MultiSelect',
    dataType: 'MULTI_SELECT' as any,
    fieldOrder: 1,
    isMandatory: false,
    isReadOnly: false,
    validationRules: [],
    dropdownOptions: [
      { label: 'Tag 1', value: 'tag1', orderIndex: 1 },
      { label: 'Tag 2', value: 'tag2', orderIndex: 2 },
      { label: 'Tag 3', value: 'tag3', orderIndex: 3 },
    ],
    ...overrides,
  });

  describe('Rendering', () => {
    it('should render MultiSelect component', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(MultiSelectField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { MultiSelect },
        },
      });

      // Assert
      expect(wrapper.findComponent(MultiSelect).exists()).toBe(true);
    });

    it('should display field name as label', () => {
      // Arrange
      const field = createMockField({ name: 'Tags' });

      // Act
      const wrapper = mount(MultiSelectField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { MultiSelect },
        },
      });

      // Assert
      expect(wrapper.find('label').text()).toContain('Tags');
    });

    it('should display asterisk for mandatory fields', () => {
      // Arrange
      const field = createMockField({ isMandatory: true });

      // Act
      const wrapper = mount(MultiSelectField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { MultiSelect },
        },
      });

      // Assert
      expect(wrapper.find('.text-red-500').exists()).toBe(true);
      expect(wrapper.find('.text-red-500').text()).toBe('*');
    });

    it('should display description when provided and no error', () => {
      // Arrange
      const field = createMockField({ description: 'Select multiple tags' });

      // Act
      const wrapper = mount(MultiSelectField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { MultiSelect },
        },
      });

      // Assert
      expect(wrapper.find('.text-gray-500').exists()).toBe(true);
      expect(wrapper.find('.text-gray-500').text()).toBe('Select multiple tags');
    });

    it('should use field description as placeholder when available', () => {
      // Arrange
      const field = createMockField({ description: 'Choose tags' });

      // Act
      const wrapper = mount(MultiSelectField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { MultiSelect },
        },
      });

      // Assert
      const multiSelect = wrapper.findComponent(MultiSelect);
      expect(multiSelect.props('placeholder')).toBe('Choose tags');
    });

    it('should use default placeholder when no description', () => {
      // Arrange
      const field = createMockField({ name: 'Categories' });

      // Act
      const wrapper = mount(MultiSelectField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { MultiSelect },
        },
      });

      // Assert
      const multiSelect = wrapper.findComponent(MultiSelect);
      expect(multiSelect.props('placeholder')).toBe('Select Categories');
    });
  });

  describe('Options handling', () => {
    it('should pass dropdown options to MultiSelect', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(MultiSelectField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { MultiSelect },
        },
      });

      // Assert
      const multiSelect = wrapper.findComponent(MultiSelect);
      expect(multiSelect.props('options')).toEqual(field.dropdownOptions);
    });

    it('should use empty array when no dropdown options', () => {
      // Arrange
      const field = createMockField({ dropdownOptions: undefined });

      // Act
      const wrapper = mount(MultiSelectField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { MultiSelect },
        },
      });

      // Assert
      const multiSelect = wrapper.findComponent(MultiSelect);
      expect(multiSelect.props('options')).toEqual([]);
    });

    it('should configure option label and value properties', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(MultiSelectField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { MultiSelect },
        },
      });

      // Assert
      const multiSelect = wrapper.findComponent(MultiSelect);
      expect(multiSelect.props('optionLabel')).toBe('label');
      expect(multiSelect.props('optionValue')).toBe('value');
    });
  });

  describe('Display configuration', () => {
    it('should display selected values as chips', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(MultiSelectField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { MultiSelect },
        },
      });

      // Assert
      const multiSelect = wrapper.findComponent(MultiSelect);
      expect(multiSelect.props('display')).toBe('chip');
    });

    it('should show clear button for non-mandatory fields', () => {
      // Arrange
      const field = createMockField({ isMandatory: false });

      // Act
      const wrapper = mount(MultiSelectField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { MultiSelect },
        },
      });

      // Assert
      const multiSelect = wrapper.findComponent(MultiSelect);
      expect(multiSelect.props('showClear')).toBe(true);
    });

    it('should not show clear button for mandatory fields', () => {
      // Arrange
      const field = createMockField({ isMandatory: true });

      // Act
      const wrapper = mount(MultiSelectField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { MultiSelect },
        },
      });

      // Assert
      const multiSelect = wrapper.findComponent(MultiSelect);
      expect(multiSelect.props('showClear')).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should display error message when error prop is provided', () => {
      // Arrange
      const field = createMockField();
      const errorMessage = 'At least one selection is required';

      // Act
      const wrapper = mount(MultiSelectField, {
        props: {
          field,
          modelValue: null,
          error: errorMessage,
        },
        global: {
          components: { MultiSelect },
        },
      });

      // Assert
      expect(wrapper.find('.p-error').exists()).toBe(true);
      expect(wrapper.find('.p-error').text()).toBe(errorMessage);
    });

    it('should add p-invalid class to MultiSelect when error is present', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(MultiSelectField, {
        props: {
          field,
          modelValue: null,
          error: 'Invalid selection',
        },
        global: {
          components: { MultiSelect },
        },
      });

      // Assert
      const multiSelect = wrapper.findComponent(MultiSelect);
      expect(multiSelect.classes()).toContain('p-invalid');
    });
  });

  describe('v-model binding', () => {
    it('should pass modelValue array to MultiSelect', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(MultiSelectField, {
        props: {
          field,
          modelValue: ['tag1', 'tag3'],
        },
        global: {
          components: { MultiSelect },
        },
      });

      // Assert
      const multiSelect = wrapper.findComponent(MultiSelect);
      expect(multiSelect.props('modelValue')).toEqual(['tag1', 'tag3']);
    });

    it('should handle null modelValue', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(MultiSelectField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { MultiSelect },
        },
      });

      // Assert
      const multiSelect = wrapper.findComponent(MultiSelect);
      expect(multiSelect.props('modelValue')).toBe(null);
    });

    it('should handle empty array modelValue', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(MultiSelectField, {
        props: {
          field,
          modelValue: [],
        },
        global: {
          components: { MultiSelect },
        },
      });

      // Assert
      const multiSelect = wrapper.findComponent(MultiSelect);
      expect(multiSelect.props('modelValue')).toEqual([]);
    });

    it('should emit update:modelValue when MultiSelect value changes', async () => {
      // Arrange
      const field = createMockField();
      const wrapper = mount(MultiSelectField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { MultiSelect },
        },
      });

      // Act
      const multiSelect = wrapper.findComponent(MultiSelect);
      await multiSelect.vm.$emit('update:modelValue', ['tag1', 'tag2']);

      // Assert
      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['tag1', 'tag2']]);
    });

    it('should emit update:modelValue with null when clearing', async () => {
      // Arrange
      const field = createMockField();
      const wrapper = mount(MultiSelectField, {
        props: {
          field,
          modelValue: ['tag1'],
        },
        global: {
          components: { MultiSelect },
        },
      });

      // Act
      const multiSelect = wrapper.findComponent(MultiSelect);
      await multiSelect.vm.$emit('update:modelValue', null);

      // Assert
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([null]);
    });
  });

  describe('Disabled/ReadOnly state', () => {
    it('should disable MultiSelect when field is read-only', () => {
      // Arrange
      const field = createMockField({ isReadOnly: true });

      // Act
      const wrapper = mount(MultiSelectField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { MultiSelect },
        },
      });

      // Assert
      const multiSelect = wrapper.findComponent(MultiSelect);
      expect(multiSelect.props('disabled')).toBe(true);
    });

    it('should not disable MultiSelect when field is not read-only', () => {
      // Arrange
      const field = createMockField({ isReadOnly: false });

      // Act
      const wrapper = mount(MultiSelectField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { MultiSelect },
        },
      });

      // Assert
      const multiSelect = wrapper.findComponent(MultiSelect);
      expect(multiSelect.props('disabled')).toBe(false);
    });
  });

  describe('Label accessibility', () => {
    it('should associate label with MultiSelect using for and id attributes', () => {
      // Arrange
      const field = createMockField({ fieldKey: 'tags' });

      // Act
      const wrapper = mount(MultiSelectField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { MultiSelect },
        },
      });

      // Assert
      const label = wrapper.find('label');
      const multiSelect = wrapper.findComponent(MultiSelect);
      expect(label.attributes('for')).toBe('tags');
      expect(multiSelect.attributes('id')).toBe('tags');
    });
  });

  describe('Component structure', () => {
    it('should have proper field wrapper structure', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(MultiSelectField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { MultiSelect },
        },
      });

      // Assert
      expect(wrapper.find('.field').exists()).toBe(true);
      expect(wrapper.find('.field.mb-4').exists()).toBe(true);
    });

    it('should have full width MultiSelect', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(MultiSelectField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { MultiSelect },
        },
      });

      // Assert
      const multiSelect = wrapper.findComponent(MultiSelect);
      expect(multiSelect.classes()).toContain('w-full');
    });
  });
});
