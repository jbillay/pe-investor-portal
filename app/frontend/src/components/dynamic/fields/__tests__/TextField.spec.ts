import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import TextField from '../TextField.vue';
import InputText from 'primevue/inputtext';
import type { DynamicField } from '@/types/dynamic-data';

describe('TextField.vue', () => {
  const createMockField = (overrides?: Partial<DynamicField>): DynamicField => ({
    id: 'field-1',
    fieldKey: 'test_text',
    name: 'Test Text',
    dataType: 'TEXT' as any,
    fieldOrder: 1,
    isMandatory: false,
    isReadOnly: false,
    validationRules: [],
    dropdownOptions: [],
    ...overrides,
  });

  describe('Rendering', () => {
    it('should render InputText component', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(TextField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { InputText },
        },
      });

      // Assert
      expect(wrapper.findComponent(InputText).exists()).toBe(true);
    });

    it('should display field name as label', () => {
      // Arrange
      const field = createMockField({ name: 'Company Name' });

      // Act
      const wrapper = mount(TextField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { InputText },
        },
      });

      // Assert
      expect(wrapper.find('label').text()).toContain('Company Name');
    });

    it('should display asterisk for mandatory fields', () => {
      // Arrange
      const field = createMockField({ isMandatory: true });

      // Act
      const wrapper = mount(TextField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { InputText },
        },
      });

      // Assert
      expect(wrapper.find('.text-red-500').exists()).toBe(true);
      expect(wrapper.find('.text-red-500').text()).toBe('*');
    });

    it('should display description when provided and no error', () => {
      // Arrange
      const field = createMockField({ description: 'Enter your company name' });

      // Act
      const wrapper = mount(TextField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { InputText },
        },
      });

      // Assert
      expect(wrapper.find('.text-gray-500').exists()).toBe(true);
      expect(wrapper.find('.text-gray-500').text()).toBe('Enter your company name');
    });

    it('should use field description as placeholder when available', () => {
      // Arrange
      const field = createMockField({ description: 'Type here' });

      // Act
      const wrapper = mount(TextField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { InputText },
        },
      });

      // Assert
      const inputText = wrapper.findComponent(InputText);
      expect(inputText.attributes('placeholder')).toBe('Type here');
    });

    it('should use default placeholder when no description', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(TextField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { InputText },
        },
      });

      // Assert
      const inputText = wrapper.findComponent(InputText);
      expect(inputText.attributes('placeholder')).toBe('Enter value');
    });
  });

  describe('Error handling', () => {
    it('should display error message when error prop is provided', () => {
      // Arrange
      const field = createMockField();
      const errorMessage = 'This field is required';

      // Act
      const wrapper = mount(TextField, {
        props: {
          field,
          modelValue: '',
          error: errorMessage,
        },
        global: {
          components: { InputText },
        },
      });

      // Assert
      expect(wrapper.find('.p-error').exists()).toBe(true);
      expect(wrapper.find('.p-error').text()).toBe(errorMessage);
    });

    it('should add p-invalid class to InputText when error is present', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(TextField, {
        props: {
          field,
          modelValue: '',
          error: 'Invalid value',
        },
        global: {
          components: { InputText },
        },
      });

      // Assert
      const inputText = wrapper.findComponent(InputText);
      expect(inputText.classes()).toContain('p-invalid');
    });
  });

  describe('v-model binding', () => {
    it('should pass modelValue to InputText', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(TextField, {
        props: {
          field,
          modelValue: 'Test value',
        },
        global: {
          components: { InputText },
        },
      });

      // Assert
      const inputText = wrapper.findComponent(InputText);
      expect(inputText.props('modelValue')).toBe('Test value');
    });

    it('should emit update:modelValue when InputText value changes', async () => {
      // Arrange
      const field = createMockField();
      const wrapper = mount(TextField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { InputText },
        },
      });

      // Act
      const inputText = wrapper.findComponent(InputText);
      await inputText.vm.$emit('update:modelValue', 'New value');

      // Assert
      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['New value']);
    });
  });

  describe('Disabled/ReadOnly state', () => {
    it('should disable InputText when field is read-only', () => {
      // Arrange
      const field = createMockField({ isReadOnly: true });

      // Act
      const wrapper = mount(TextField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { InputText },
        },
      });

      // Assert
      const inputText = wrapper.findComponent(InputText);
      expect(inputText.props('disabled')).toBe(true);
    });

    it('should not disable InputText when field is not read-only', () => {
      // Arrange
      const field = createMockField({ isReadOnly: false });

      // Act
      const wrapper = mount(TextField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { InputText },
        },
      });

      // Assert
      const inputText = wrapper.findComponent(InputText);
      expect(inputText.props('disabled')).toBe(false);
    });
  });

  describe('Label accessibility', () => {
    it('should associate label with InputText using for and id attributes', () => {
      // Arrange
      const field = createMockField({ fieldKey: 'company_name' });

      // Act
      const wrapper = mount(TextField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { InputText },
        },
      });

      // Assert
      const label = wrapper.find('label');
      const inputText = wrapper.findComponent(InputText);
      expect(label.attributes('for')).toBe('company_name');
      expect(inputText.attributes('id')).toBe('company_name');
    });
  });

  describe('Component structure', () => {
    it('should have proper field wrapper structure', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(TextField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { InputText },
        },
      });

      // Assert
      expect(wrapper.find('.field').exists()).toBe(true);
      expect(wrapper.find('.field.mb-4').exists()).toBe(true);
    });

    it('should have full width InputText', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(TextField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { InputText },
        },
      });

      // Assert
      const inputText = wrapper.findComponent(InputText);
      expect(inputText.classes()).toContain('w-full');
    });
  });
});
