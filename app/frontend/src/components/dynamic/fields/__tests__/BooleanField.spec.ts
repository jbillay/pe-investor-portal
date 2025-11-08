import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BooleanField from '../BooleanField.vue';
import InputSwitch from 'primevue/inputswitch';
import type { DynamicField } from '@/types/dynamic-data';

describe('BooleanField.vue', () => {
  const createMockField = (overrides?: Partial<DynamicField>): DynamicField => ({
    id: 'field-1',
    fieldKey: 'test_boolean',
    name: 'Test Boolean',
    dataType: 'BOOLEAN' as any,
    fieldOrder: 1,
    isMandatory: false,
    isReadOnly: false,
    validationRules: [],
    dropdownOptions: [],
    ...overrides,
  });

  describe('Rendering', () => {
    it('should render InputSwitch component', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(BooleanField, {
        props: {
          field,
          modelValue: false,
        },
        global: {
          components: { InputSwitch },
        },
      });

      // Assert
      expect(wrapper.findComponent(InputSwitch).exists()).toBe(true);
    });

    it('should display field name as label', () => {
      // Arrange
      const field = createMockField({ name: 'Is Active' });

      // Act
      const wrapper = mount(BooleanField, {
        props: {
          field,
          modelValue: false,
        },
        global: {
          components: { InputSwitch },
        },
      });

      // Assert
      expect(wrapper.text()).toContain('Is Active');
    });

    it('should display asterisk for mandatory fields', () => {
      // Arrange
      const field = createMockField({ isMandatory: true });

      // Act
      const wrapper = mount(BooleanField, {
        props: {
          field,
          modelValue: false,
        },
        global: {
          components: { InputSwitch },
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
      const wrapper = mount(BooleanField, {
        props: {
          field,
          modelValue: false,
        },
        global: {
          components: { InputSwitch },
        },
      });

      // Assert
      expect(wrapper.find('.text-red-500').exists()).toBe(false);
    });

    it('should display description when provided and no error', () => {
      // Arrange
      const field = createMockField({ description: 'Enable this feature' });

      // Act
      const wrapper = mount(BooleanField, {
        props: {
          field,
          modelValue: false,
        },
        global: {
          components: { InputSwitch },
        },
      });

      // Assert
      expect(wrapper.find('.text-gray-500').exists()).toBe(true);
      expect(wrapper.find('.text-gray-500').text()).toBe('Enable this feature');
    });

    it('should not display description when error is present', () => {
      // Arrange
      const field = createMockField({ description: 'Enable this feature' });

      // Act
      const wrapper = mount(BooleanField, {
        props: {
          field,
          modelValue: false,
          error: 'This field is required',
        },
        global: {
          components: { InputSwitch },
        },
      });

      // Assert
      const descriptionElement = wrapper.find('.text-gray-500');
      expect(descriptionElement.exists()).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should display error message when error prop is provided', () => {
      // Arrange
      const field = createMockField();
      const errorMessage = 'This field is required';

      // Act
      const wrapper = mount(BooleanField, {
        props: {
          field,
          modelValue: false,
          error: errorMessage,
        },
        global: {
          components: { InputSwitch },
        },
      });

      // Assert
      expect(wrapper.find('.p-error').exists()).toBe(true);
      expect(wrapper.find('.p-error').text()).toBe(errorMessage);
    });

    it('should add p-invalid class to InputSwitch when error is present', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(BooleanField, {
        props: {
          field,
          modelValue: false,
          error: 'Invalid value',
        },
        global: {
          components: { InputSwitch },
        },
      });

      // Assert
      const inputSwitch = wrapper.findComponent(InputSwitch);
      expect(inputSwitch.classes()).toContain('p-invalid');
    });

    it('should not add p-invalid class when no error', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(BooleanField, {
        props: {
          field,
          modelValue: false,
        },
        global: {
          components: { InputSwitch },
        },
      });

      // Assert
      const inputSwitch = wrapper.findComponent(InputSwitch);
      expect(inputSwitch.classes()).not.toContain('p-invalid');
    });
  });

  describe('v-model binding', () => {
    it('should pass modelValue to InputSwitch', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(BooleanField, {
        props: {
          field,
          modelValue: true,
        },
        global: {
          components: { InputSwitch },
        },
      });

      // Assert
      const inputSwitch = wrapper.findComponent(InputSwitch);
      expect(inputSwitch.props('modelValue')).toBe(true);
    });

    it('should emit update:modelValue when InputSwitch value changes', async () => {
      // Arrange
      const field = createMockField();
      const wrapper = mount(BooleanField, {
        props: {
          field,
          modelValue: false,
        },
        global: {
          components: { InputSwitch },
        },
      });

      // Act
      const inputSwitch = wrapper.findComponent(InputSwitch);
      await inputSwitch.vm.$emit('update:modelValue', true);

      // Assert
      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true]);
    });

    it('should emit update:modelValue with false when toggling off', async () => {
      // Arrange
      const field = createMockField();
      const wrapper = mount(BooleanField, {
        props: {
          field,
          modelValue: true,
        },
        global: {
          components: { InputSwitch },
        },
      });

      // Act
      const inputSwitch = wrapper.findComponent(InputSwitch);
      await inputSwitch.vm.$emit('update:modelValue', false);

      // Assert
      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false]);
    });
  });

  describe('Disabled/ReadOnly state', () => {
    it('should disable InputSwitch when field is read-only', () => {
      // Arrange
      const field = createMockField({ isReadOnly: true });

      // Act
      const wrapper = mount(BooleanField, {
        props: {
          field,
          modelValue: false,
        },
        global: {
          components: { InputSwitch },
        },
      });

      // Assert
      const inputSwitch = wrapper.findComponent(InputSwitch);
      expect(inputSwitch.props('disabled')).toBe(true);
    });

    it('should not disable InputSwitch when field is not read-only', () => {
      // Arrange
      const field = createMockField({ isReadOnly: false });

      // Act
      const wrapper = mount(BooleanField, {
        props: {
          field,
          modelValue: false,
        },
        global: {
          components: { InputSwitch },
        },
      });

      // Assert
      const inputSwitch = wrapper.findComponent(InputSwitch);
      expect(inputSwitch.props('disabled')).toBe(false);
    });
  });

  describe('Label accessibility', () => {
    it('should associate label with InputSwitch using for and id attributes', () => {
      // Arrange
      const field = createMockField({ fieldKey: 'is_active' });

      // Act
      const wrapper = mount(BooleanField, {
        props: {
          field,
          modelValue: false,
        },
        global: {
          components: { InputSwitch },
        },
      });

      // Assert
      const label = wrapper.find('label');
      const inputSwitch = wrapper.findComponent(InputSwitch);
      expect(label.attributes('for')).toBe('is_active');
      expect(inputSwitch.attributes('id')).toBe('is_active');
    });

    it('should make label clickable with cursor-pointer class', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(BooleanField, {
        props: {
          field,
          modelValue: false,
        },
        global: {
          components: { InputSwitch },
        },
      });

      // Assert
      const label = wrapper.find('label');
      expect(label.classes()).toContain('cursor-pointer');
    });
  });

  describe('Component structure', () => {
    it('should have proper field wrapper structure', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(BooleanField, {
        props: {
          field,
          modelValue: false,
        },
        global: {
          components: { InputSwitch },
        },
      });

      // Assert
      expect(wrapper.find('.field').exists()).toBe(true);
      expect(wrapper.find('.field.mb-4').exists()).toBe(true);
    });

    it('should have flex layout for switch and label', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(BooleanField, {
        props: {
          field,
          modelValue: false,
        },
        global: {
          components: { InputSwitch },
        },
      });

      // Assert
      const flexContainer = wrapper.find('.flex.align-items-center.gap-3');
      expect(flexContainer.exists()).toBe(true);
    });
  });
});
