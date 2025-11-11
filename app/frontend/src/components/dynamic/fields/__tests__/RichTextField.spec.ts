import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import RichTextField from '../RichTextField.vue';
import Editor from 'primevue/editor';
import type { DynamicField } from '@/types/dynamic-data';

describe('RichTextField.vue', () => {
  const createMockField = (overrides?: Partial<DynamicField>): DynamicField => ({
    id: 'field-1',
    fieldKey: 'test_richtext',
    name: 'Test Rich Text',
    dataType: 'RICH_TEXT' as any,
    fieldOrder: 1,
    isMandatory: false,
    isReadOnly: false,
    validationRules: [],
    dropdownOptions: [],
    ...overrides,
  });

  describe('Rendering', () => {
    it('should render Editor component', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(RichTextField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { Editor },
        },
      });

      // Assert
      expect(wrapper.findComponent(Editor).exists()).toBe(true);
    });

    it('should display field name as label', () => {
      // Arrange
      const field = createMockField({ name: 'Article Content' });

      // Act
      const wrapper = mount(RichTextField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { Editor },
        },
      });

      // Assert
      expect(wrapper.find('label').text()).toContain('Article Content');
    });

    it('should display asterisk for mandatory fields', () => {
      // Arrange
      const field = createMockField({ isMandatory: true });

      // Act
      const wrapper = mount(RichTextField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { Editor },
        },
      });

      // Assert
      expect(wrapper.find('.text-red-500').exists()).toBe(true);
      expect(wrapper.find('.text-red-500').text()).toBe('*');
    });

    it('should display description when provided and no error', () => {
      // Arrange
      const field = createMockField({ description: 'Write formatted content' });

      // Act
      const wrapper = mount(RichTextField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { Editor },
        },
      });

      // Assert
      expect(wrapper.find('.text-gray-500').exists()).toBe(true);
      expect(wrapper.find('.text-gray-500').text()).toBe('Write formatted content');
    });
  });

  describe('Editor configuration', () => {
    it('should set editor style with height', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(RichTextField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { Editor },
        },
      });

      // Assert
      const editor = wrapper.findComponent(Editor);
      expect(editor.props('editorStyle')).toBe('height: 320px');
    });

    it('should render toolbar with formatting buttons', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(RichTextField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { Editor },
        },
      });

      // Assert
      const toolbar = wrapper.find('.ql-formats');
      expect(toolbar.exists()).toBe(true);
    });

    it('should render bold formatting button in toolbar', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(RichTextField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { Editor },
        },
      });

      // Assert
      expect(wrapper.find('.ql-bold').exists()).toBe(true);
    });

    it('should render italic formatting button in toolbar', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(RichTextField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { Editor },
        },
      });

      // Assert
      expect(wrapper.find('.ql-italic').exists()).toBe(true);
    });

    it('should render underline formatting button in toolbar', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(RichTextField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { Editor },
        },
      });

      // Assert
      expect(wrapper.find('.ql-underline').exists()).toBe(true);
    });

    it('should render header dropdown in toolbar', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(RichTextField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { Editor },
        },
      });

      // Assert
      expect(wrapper.find('.ql-header').exists()).toBe(true);
    });

    it('should render list buttons in toolbar', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(RichTextField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { Editor },
        },
      });

      // Assert
      const listButtons = wrapper.findAll('.ql-list');
      expect(listButtons.length).toBeGreaterThan(0);
    });

    it('should render link button in toolbar', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(RichTextField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { Editor },
        },
      });

      // Assert
      expect(wrapper.find('.ql-link').exists()).toBe(true);
    });

    it('should render image button in toolbar', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(RichTextField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { Editor },
        },
      });

      // Assert
      expect(wrapper.find('.ql-image').exists()).toBe(true);
    });

    it('should render clean/clear formatting button in toolbar', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(RichTextField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { Editor },
        },
      });

      // Assert
      expect(wrapper.find('.ql-clean').exists()).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should display error message when error prop is provided', () => {
      // Arrange
      const field = createMockField();
      const errorMessage = 'Content is required';

      // Act
      const wrapper = mount(RichTextField, {
        props: {
          field,
          modelValue: '',
          error: errorMessage,
        },
        global: {
          components: { Editor },
        },
      });

      // Assert
      expect(wrapper.find('.p-error').exists()).toBe(true);
      expect(wrapper.find('.p-error').text()).toBe(errorMessage);
    });

    it('should add p-invalid class to Editor when error is present', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(RichTextField, {
        props: {
          field,
          modelValue: '',
          error: 'Invalid content',
        },
        global: {
          components: { Editor },
        },
      });

      // Assert
      const editor = wrapper.findComponent(Editor);
      expect(editor.classes()).toContain('p-invalid');
    });
  });

  describe('v-model binding', () => {
    it('should pass modelValue to Editor', () => {
      // Arrange
      const field = createMockField();
      const htmlContent = '<p>Test content with <strong>bold</strong> text</p>';

      // Act
      const wrapper = mount(RichTextField, {
        props: {
          field,
          modelValue: htmlContent,
        },
        global: {
          components: { Editor },
        },
      });

      // Assert
      const editor = wrapper.findComponent(Editor);
      expect(editor.props('modelValue')).toBe(htmlContent);
    });

    it('should emit update:modelValue when Editor content changes', async () => {
      // Arrange
      const field = createMockField();
      const wrapper = mount(RichTextField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { Editor },
        },
      });

      // Act
      const editor = wrapper.findComponent(Editor);
      const newContent = '<p>New <em>content</em></p>';
      await editor.vm.$emit('update:modelValue', newContent);

      // Assert
      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([newContent]);
    });

    it('should handle empty string modelValue', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(RichTextField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { Editor },
        },
      });

      // Assert
      const editor = wrapper.findComponent(Editor);
      expect(editor.props('modelValue')).toBe('');
    });
  });

  describe('Disabled/ReadOnly state', () => {
    it('should disable Editor when field is read-only', () => {
      // Arrange
      const field = createMockField({ isReadOnly: true });

      // Act
      const wrapper = mount(RichTextField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { Editor },
        },
      });

      // Assert
      const editor = wrapper.findComponent(Editor);
      expect(editor.props('disabled')).toBe(true);
    });

    it('should not disable Editor when field is not read-only', () => {
      // Arrange
      const field = createMockField({ isReadOnly: false });

      // Act
      const wrapper = mount(RichTextField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { Editor },
        },
      });

      // Assert
      const editor = wrapper.findComponent(Editor);
      expect(editor.props('disabled')).toBe(false);
    });
  });

  describe('Label accessibility', () => {
    it('should associate label with Editor using for and id attributes', () => {
      // Arrange
      const field = createMockField({ fieldKey: 'article_content' });

      // Act
      const wrapper = mount(RichTextField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { Editor },
        },
      });

      // Assert
      const label = wrapper.find('label');
      const editor = wrapper.findComponent(Editor);
      expect(label.attributes('for')).toBe('article_content');
      expect(editor.attributes('id')).toBe('article_content');
    });
  });

  describe('Component structure', () => {
    it('should have proper field wrapper structure', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(RichTextField, {
        props: {
          field,
          modelValue: '',
        },
        global: {
          components: { Editor },
        },
      });

      // Assert
      expect(wrapper.find('.field').exists()).toBe(true);
      expect(wrapper.find('.field.mb-4').exists()).toBe(true);
    });
  });
});
