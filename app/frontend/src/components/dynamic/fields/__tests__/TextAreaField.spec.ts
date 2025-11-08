import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import TextAreaField from '../TextAreaField.vue';
import Textarea from 'primevue/textarea';
import type { DynamicField } from '@/types/dynamic-data';

describe('TextAreaField.vue', () => {
  const createMockField = (overrides?: Partial<DynamicField>): DynamicField => ({
    id: 'field-1',
    fieldKey: 'test_textarea',
    name: 'Test TextArea',
    dataType: 'TEXTAREA' as any,
    fieldOrder: 1,
    isMandatory: false,
    isReadOnly: false,
    validationRules: [],
    dropdownOptions: [],
    ...overrides,
  });

  describe('Rendering', () => {
    it('should render Textarea component', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(TextAreaField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { Textarea },
        },
      });

      // Assert
      expect(wrapper.findComponent(Textarea).exists()).toBe(true);
    });

    it('should display field name as label', () => {
      // Arrange
      const field = createMockField({ name: 'Description' });

      // Act
      const wrapper = mount(TextAreaField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { Textarea },
        },
      });

      // Assert
      expect(wrapper.find('label').text()).toContain('Description');
    });

    it('should display asterisk for mandatory fields', () => {
      // Arrange
      const field = createMockField({ isMandatory: true });

      // Act
      const wrapper = mount(TextAreaField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { Textarea },
        },
      });

      // Assert
      expect(wrapper.find('.text-red-500').exists()).toBe(true);
      expect(wrapper.find('.text-red-500').text()).toBe('*');
    });

    it('should display description when provided and no error', () => {
      // Arrange
      const field = createMockField({ description: 'Enter detailed description' });

      // Act
      const wrapper = mount(TextAreaField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { Textarea },
        },
      });

      // Assert
      expect(wrapper.find('.text-gray-500').exists()).toBe(true);
      expect(wrapper.find('.text-gray-500').text()).toBe('Enter detailed description');
    });

    it('should use field description as placeholder when available', () => {
      // Arrange
      const field = createMockField({ description: 'Type your notes here' });

      // Act
      const wrapper = mount(TextAreaField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { Textarea },
        },
      });

      // Assert
      const textarea = wrapper.findComponent(Textarea);
      expect(textarea.attributes('placeholder')).toBe('Type your notes here');
    });

    it('should use default placeholder when no description', () => {
      // Arrange
      const field = createMockField({ name: 'Notes' });

      // Act
      const wrapper = mount(TextAreaField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { Textarea },
        },
      });

      // Assert
      const textarea = wrapper.findComponent(Textarea);
      expect(textarea.attributes('placeholder')).toBe('Enter Notes');
    });
  });

  describe('Textarea configuration', () => {
    it('should set rows to 5', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(TextAreaField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { Textarea },
        },
      });

      // Assert
      const textarea = wrapper.findComponent(Textarea);
      // Check if rows attribute is set (PrimeVue Textarea accepts rows as prop)
      expect(textarea.attributes('rows')).toBe('5');
    });

    it('should enable auto-resize', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(TextAreaField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { Textarea },
        },
      });

      // Assert
      const textarea = wrapper.findComponent(Textarea);
      expect(textarea.props('autoResize')).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should display error message when error prop is provided', () => {
      // Arrange
      const field = createMockField();
      const errorMessage = 'This field is required';

      // Act
      const wrapper = mount(TextAreaField, {
        props: {
          field,
          modelValue: '',
          error: errorMessage,
        },
        global: {
          components: { Textarea },
        },
      });

      // Assert
      expect(wrapper.find('.p-error').exists()).toBe(true);
      expect(wrapper.find('.p-error').text()).toBe(errorMessage);
    });

    it('should add p-invalid class to Textarea when error is present', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(TextAreaField, {
        props: {
          field,
          modelValue: '',
          error: 'Invalid value',
        },
        global: {
          components: { Textarea },
        },
      });

      // Assert
      const textarea = wrapper.findComponent(Textarea);
      expect(textarea.classes()).toContain('p-invalid');
    });
  });

  describe('v-model binding', () => {
    it('should pass modelValue to Textarea', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(TextAreaField, {
        props: {
          field,
          modelValue: 'Test content\nMultiple lines',
        },
        global: {
          components: { Textarea },
        },
      });

      // Assert
      const textarea = wrapper.findComponent(Textarea);
      expect(textarea.props('modelValue')).toBe('Test content\nMultiple lines');
    });

    it('should emit update:modelValue when Textarea value changes', async () => {
      // Arrange
      const field = createMockField();
      const wrapper = mount(TextAreaField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { Textarea },
        },
      });

      // Act
      const textarea = wrapper.findComponent(Textarea);
      await textarea.vm.$emit('update:modelValue', 'New content');

      // Assert
      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['New content']);
    });
  });

  describe('Disabled/ReadOnly state', () => {
    it('should disable Textarea when field is read-only', () => {
      // Arrange
      const field = createMockField({ isReadOnly: true });

      // Act
      const wrapper = mount(TextAreaField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { Textarea },
        },
      });

      // Assert
      const textarea = wrapper.findComponent(Textarea);
      expect(textarea.props('disabled')).toBe(true);
    });

    it('should not disable Textarea when field is not read-only', () => {
      // Arrange
      const field = createMockField({ isReadOnly: false });

      // Act
      const wrapper = mount(TextAreaField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { Textarea },
        },
      });

      // Assert
      const textarea = wrapper.findComponent(Textarea);
      expect(textarea.props('disabled')).toBe(false);
    });
  });

  describe('Label accessibility', () => {
    it('should associate label with Textarea using for and id attributes', () => {
      // Arrange
      const field = createMockField({ fieldKey: 'description' });

      // Act
      const wrapper = mount(TextAreaField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { Textarea },
        },
      });

      // Assert
      const label = wrapper.find('label');
      const textarea = wrapper.findComponent(Textarea);
      expect(label.attributes('for')).toBe('description');
      expect(textarea.attributes('id')).toBe('description');
    });
  });

  describe('Component structure', () => {
    it('should have proper field wrapper structure', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(TextAreaField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { Textarea },
        },
      });

      // Assert
      expect(wrapper.find('.field').exists()).toBe(true);
      expect(wrapper.find('.field.mb-4').exists()).toBe(true);
    });

    it('should have full width Textarea', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(TextAreaField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { Textarea },
        },
      });

      // Assert
      const textarea = wrapper.findComponent(Textarea);
      expect(textarea.classes()).toContain('w-full');
    });
  });
});
