import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import UrlField from '../UrlField.vue';
import InputText from 'primevue/inputtext';
import type { DynamicField } from '@/types/dynamic-data';

describe('UrlField.vue', () => {
  const createMockField = (overrides?: Partial<DynamicField>): DynamicField => ({
    id: 'field-1',
    fieldKey: 'test_url',
    name: 'Test URL',
    dataType: 'URL' as any,
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
      const wrapper = mount(UrlField, {
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

    it('should set input type to url', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(UrlField, {
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
      expect(inputText.attributes('type')).toBe('url');
    });

    it('should display field name as label', () => {
      // Arrange
      const field = createMockField({ name: 'Website URL' });

      // Act
      const wrapper = mount(UrlField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { InputText },
        },
      });

      // Assert
      expect(wrapper.find('label').text()).toContain('Website URL');
    });

    it('should display asterisk for mandatory fields', () => {
      // Arrange
      const field = createMockField({ isMandatory: true });

      // Act
      const wrapper = mount(UrlField, {
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
      const field = createMockField({ description: 'Enter website URL' });

      // Act
      const wrapper = mount(UrlField, {
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
      expect(wrapper.find('.text-gray-500').text()).toBe('Enter website URL');
    });

    it('should use default placeholder', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(UrlField, {
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
      expect(inputText.attributes('placeholder')).toBe('https://example.com');
    });
  });

  describe('Error handling', () => {
    it('should display error message when error prop is provided', () => {
      // Arrange
      const field = createMockField();
      const errorMessage = 'Invalid URL format';

      // Act
      const wrapper = mount(UrlField, {
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
      const wrapper = mount(UrlField, {
        props: {
          field,
          modelValue: '',
          error: 'Invalid URL',
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
      const wrapper = mount(UrlField, {
        props: {
          field,
          modelValue: 'https://example.com',
        },
        global: {
          components: { InputText },
        },
      });

      // Assert
      const inputText = wrapper.findComponent(InputText);
      expect(inputText.props('modelValue')).toBe('https://example.com');
    });

    it('should emit update:modelValue when InputText value changes', async () => {
      // Arrange
      const field = createMockField();
      const wrapper = mount(UrlField, {
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
      await inputText.vm.$emit('update:modelValue', 'https://newsite.com');

      // Assert
      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['https://newsite.com']);
    });
  });

  describe('Disabled/ReadOnly state', () => {
    it('should disable InputText when field is read-only', () => {
      // Arrange
      const field = createMockField({ isReadOnly: true });

      // Act
      const wrapper = mount(UrlField, {
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
      const wrapper = mount(UrlField, {
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
      const field = createMockField({ fieldKey: 'website_url' });

      // Act
      const wrapper = mount(UrlField, {
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
      expect(label.attributes('for')).toBe('website_url');
      expect(inputText.attributes('id')).toBe('website_url');
    });
  });

  describe('Component structure', () => {
    it('should have proper field wrapper structure', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(UrlField, {
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
      const wrapper = mount(UrlField, {
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
