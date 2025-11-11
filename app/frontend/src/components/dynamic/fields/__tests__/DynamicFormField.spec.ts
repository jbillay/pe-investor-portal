import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import DynamicFormField from '../DynamicFormField.vue';
import TextField from '../TextField.vue';
import TextareaField from '../TextAreaField.vue';
import NumberField from '../NumberField.vue';
import CurrencyField from '../CurrencyField.vue';
import DateField from '../DateField.vue';
import DateTimeField from '../DateTimeField.vue';
import BooleanField from '../BooleanField.vue';
import SelectField from '../SingleSelectField.vue';
import MultiSelectField from '../MultiSelectField.vue';
import EmailField from '../EmailField.vue';
import UrlField from '../UrlField.vue';
import FileField from '../FileField.vue';
import RichTextField from '../RichTextField.vue';
import type { DynamicField } from '@/types/dynamic-data';

describe('DynamicFormField.vue', () => {
  const createMockField = (dataType: string, overrides?: Partial<DynamicField>): DynamicField => ({
    id: 'field-1',
    fieldKey: 'test_field',
    name: 'Test Field',
    dataType: dataType as any,
    fieldOrder: 1,
    isMandatory: false,
    isReadOnly: false,
    validationRules: [],
    dropdownOptions: [],
    ...overrides,
  });

  describe('Field type routing - Text fields', () => {
    it('should render TextField for TEXT data type', () => {
      // Arrange
      const field = createMockField('TEXT');

      // Act
      const wrapper = mount(DynamicFormField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { TextField },
        },
      });

      // Assert
      expect(wrapper.findComponent(TextField).exists()).toBe(true);
    });

    it('should render TextareaField for TEXTAREA data type', () => {
      // Arrange
      const field = createMockField('TEXTAREA');

      // Act
      const wrapper = mount(DynamicFormField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { TextareaField },
        },
      });

      // Assert
      expect(wrapper.findComponent(TextareaField).exists()).toBe(true);
    });

    it('should render EmailField for EMAIL data type', () => {
      // Arrange
      const field = createMockField('EMAIL');

      // Act
      const wrapper = mount(DynamicFormField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { EmailField },
        },
      });

      // Assert
      expect(wrapper.findComponent(EmailField).exists()).toBe(true);
    });

    it('should render UrlField for URL data type', () => {
      // Arrange
      const field = createMockField('URL');

      // Act
      const wrapper = mount(DynamicFormField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { UrlField },
        },
      });

      // Assert
      expect(wrapper.findComponent(UrlField).exists()).toBe(true);
    });

    it('should render RichTextField for RICH_TEXT data type', () => {
      // Arrange
      const field = createMockField('RICH_TEXT');

      // Act
      const wrapper = mount(DynamicFormField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { RichTextField },
        },
      });

      // Assert
      expect(wrapper.findComponent(RichTextField).exists()).toBe(true);
    });
  });

  describe('Field type routing - Number fields', () => {
    it('should render NumberField for NUMBER data type', () => {
      // Arrange
      const field = createMockField('NUMBER');

      // Act
      const wrapper = mount(DynamicFormField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { NumberField },
        },
      });

      // Assert
      expect(wrapper.findComponent(NumberField).exists()).toBe(true);
    });

    it('should render CurrencyField for CURRENCY data type', () => {
      // Arrange
      const field = createMockField('CURRENCY');

      // Act
      const wrapper = mount(DynamicFormField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { CurrencyField },
        },
      });

      // Assert
      expect(wrapper.findComponent(CurrencyField).exists()).toBe(true);
    });
  });

  describe('Field type routing - Date fields', () => {
    it('should render DateField for DATE data type', () => {
      // Arrange
      const field = createMockField('DATE');

      // Act
      const wrapper = mount(DynamicFormField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { DateField },
        },
      });

      // Assert
      expect(wrapper.findComponent(DateField).exists()).toBe(true);
    });

    it('should render DateTimeField for DATETIME data type', () => {
      // Arrange
      const field = createMockField('DATETIME');

      // Act
      const wrapper = mount(DynamicFormField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { DateTimeField },
        },
      });

      // Assert
      expect(wrapper.findComponent(DateTimeField).exists()).toBe(true);
    });
  });

  describe('Field type routing - Boolean field', () => {
    it('should render BooleanField for BOOLEAN data type', () => {
      // Arrange
      const field = createMockField('BOOLEAN');

      // Act
      const wrapper = mount(DynamicFormField, {
        props: {
          field,
          modelValue: false,
        },
        global: {
          components: { BooleanField },
        },
      });

      // Assert
      expect(wrapper.findComponent(BooleanField).exists()).toBe(true);
    });
  });

  describe('Field type routing - Select fields', () => {
    it('should render SelectField for SINGLE_SELECT data type', () => {
      // Arrange
      const field = createMockField('SINGLE_SELECT', {
        dropdownOptions: [
          { label: 'Option 1', value: 'opt1', orderIndex: 1 },
        ],
      });

      // Act
      const wrapper = mount(DynamicFormField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { SelectField },
        },
      });

      // Assert
      expect(wrapper.findComponent(SelectField).exists()).toBe(true);
    });

    it('should render MultiSelectField for MULTI_SELECT data type', () => {
      // Arrange
      const field = createMockField('MULTI_SELECT', {
        dropdownOptions: [
          { label: 'Tag 1', value: 'tag1', orderIndex: 1 },
        ],
      });

      // Act
      const wrapper = mount(DynamicFormField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { MultiSelectField },
        },
      });

      // Assert
      expect(wrapper.findComponent(MultiSelectField).exists()).toBe(true);
    });
  });

  describe('Field type routing - File field', () => {
    it('should render FileField for FILE data type', () => {
      // Arrange
      const field = createMockField('FILE');

      // Act
      const wrapper = mount(DynamicFormField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { FileField },
        },
      });

      // Assert
      expect(wrapper.findComponent(FileField).exists()).toBe(true);
    });
  });

  describe('Field type routing - Fallback', () => {
    it('should render TextField for unknown data type', () => {
      // Arrange
      const field = createMockField('UNKNOWN_TYPE');

      // Act
      const wrapper = mount(DynamicFormField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { TextField },
        },
      });

      // Assert
      expect(wrapper.findComponent(TextField).exists()).toBe(true);
    });
  });

  describe('Props forwarding', () => {
    it('should forward field prop to child component', () => {
      // Arrange
      const field = createMockField('TEXT', { name: 'Company Name' });

      // Act
      const wrapper = mount(DynamicFormField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { TextField },
        },
      });

      // Assert
      const textField = wrapper.findComponent(TextField);
      expect(textField.props('field')).toEqual(field);
    });

    it('should forward modelValue prop to child component', () => {
      // Arrange
      const field = createMockField('TEXT');

      // Act
      const wrapper = mount(DynamicFormField, {
        props: {
          field,
          modelValue: 'Test value',
        },
        global: {
          components: { TextField },
        },
      });

      // Assert
      const textField = wrapper.findComponent(TextField);
      expect(textField.props('modelValue')).toBe('Test value');
    });

    it('should forward error prop to child component', () => {
      // Arrange
      const field = createMockField('TEXT');
      const errorMessage = 'Field is required';

      // Act
      const wrapper = mount(DynamicFormField, {
        props: {
          field,
          modelValue: '',
          error: errorMessage,
        },
        global: {
          components: { TextField },
        },
      });

      // Assert
      const textField = wrapper.findComponent(TextField);
      expect(textField.props('error')).toBe(errorMessage);
    });

    it('should forward update:modelValue event from child component', async () => {
      // Arrange
      const field = createMockField('TEXT');
      const wrapper = mount(DynamicFormField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { TextField },
        },
      });

      // Act
      const textField = wrapper.findComponent(TextField);
      await textField.vm.$emit('update:modelValue', 'New value');

      // Assert
      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['New value']);
    });
  });

  describe('Different data types with props and events', () => {
    it('should handle NUMBER field with value updates', async () => {
      // Arrange
      const field = createMockField('NUMBER');
      const wrapper = mount(DynamicFormField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { NumberField },
        },
      });

      // Act
      const numberField = wrapper.findComponent(NumberField);
      await numberField.vm.$emit('update:modelValue', 42);

      // Assert
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([42]);
    });

    it('should handle BOOLEAN field with value updates', async () => {
      // Arrange
      const field = createMockField('BOOLEAN');
      const wrapper = mount(DynamicFormField, {
        props: {
          field,
          modelValue: false,
        },
        global: {
          components: { BooleanField },
        },
      });

      // Act
      const booleanField = wrapper.findComponent(BooleanField);
      await booleanField.vm.$emit('update:modelValue', true);

      // Assert
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true]);
    });

    it('should handle DATE field with value updates', async () => {
      // Arrange
      const field = createMockField('DATE');
      const wrapper = mount(DynamicFormField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { DateField },
        },
      });

      // Act
      const dateField = wrapper.findComponent(DateField);
      await dateField.vm.$emit('update:modelValue', '2024-01-15');

      // Assert
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['2024-01-15']);
    });

    it('should handle MULTI_SELECT field with array values', async () => {
      // Arrange
      const field = createMockField('MULTI_SELECT', {
        dropdownOptions: [
          { label: 'Tag 1', value: 'tag1', orderIndex: 1 },
          { label: 'Tag 2', value: 'tag2', orderIndex: 2 },
        ],
      });
      const wrapper = mount(DynamicFormField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { MultiSelectField },
        },
      });

      // Act
      const multiSelectField = wrapper.findComponent(MultiSelectField);
      await multiSelectField.vm.$emit('update:modelValue', ['tag1', 'tag2']);

      // Assert
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['tag1', 'tag2']]);
    });
  });

  describe('Error handling across different field types', () => {
    it('should pass error to TextField', () => {
      // Arrange
      const field = createMockField('TEXT');

      // Act
      const wrapper = mount(DynamicFormField, {
        props: {
          field,
          modelValue: '',
          error: 'Required field',
        },
        global: {
          components: { TextField },
        },
      });

      // Assert
      const textField = wrapper.findComponent(TextField);
      expect(textField.props('error')).toBe('Required field');
    });

    it('should pass error to NumberField', () => {
      // Arrange
      const field = createMockField('NUMBER');

      // Act
      const wrapper = mount(DynamicFormField, {
        props: {
          field,
          modelValue: null,
          error: 'Must be positive',
        },
        global: {
          components: { NumberField },
        },
      });

      // Assert
      const numberField = wrapper.findComponent(NumberField);
      expect(numberField.props('error')).toBe('Must be positive');
    });

    it('should pass error to DateField', () => {
      // Arrange
      const field = createMockField('DATE');

      // Act
      const wrapper = mount(DynamicFormField, {
        props: {
          field,
          modelValue: null,
          error: 'Invalid date',
        },
        global: {
          components: { DateField },
        },
      });

      // Assert
      const dateField = wrapper.findComponent(DateField);
      expect(dateField.props('error')).toBe('Invalid date');
    });
  });

  describe('Component structure', () => {
    it('should have field wrapper div', () => {
      // Arrange
      const field = createMockField('TEXT');

      // Act
      const wrapper = mount(DynamicFormField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { TextField },
        },
      });

      // Assert
      expect(wrapper.find('.field').exists()).toBe(true);
    });

    it('should only render one field component at a time', () => {
      // Arrange
      const field = createMockField('TEXT');

      // Act
      const wrapper = mount(DynamicFormField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: {
            TextField,
            NumberField,
            BooleanField,
          },
        },
      });

      // Assert
      expect(wrapper.findComponent(TextField).exists()).toBe(true);
      expect(wrapper.findComponent(NumberField).exists()).toBe(false);
      expect(wrapper.findComponent(BooleanField).exists()).toBe(false);
    });
  });
});
