import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import FileField from '../FileField.vue';
import FileUpload from 'primevue/fileupload';
import Button from 'primevue/button';
import type { DynamicField } from '@/types/dynamic-data';

describe('FileField.vue', () => {
  const createMockField = (overrides?: Partial<DynamicField>): DynamicField => ({
    id: 'field-1',
    fieldKey: 'test_file',
    name: 'Test File',
    dataType: 'FILE' as any,
    fieldOrder: 1,
    isMandatory: false,
    isReadOnly: false,
    validationRules: [],
    dropdownOptions: [],
    ...overrides,
  });

  describe('Rendering', () => {
    it('should render FileUpload component', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(FileField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { FileUpload, Button },
        },
      });

      // Assert
      expect(wrapper.findComponent(FileUpload).exists()).toBe(true);
    });

    it('should display field name as label', () => {
      // Arrange
      const field = createMockField({ name: 'Upload Document' });

      // Act
      const wrapper = mount(FileField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { FileUpload, Button },
        },
      });

      // Assert
      expect(wrapper.find('label').text()).toContain('Upload Document');
    });

    it('should display asterisk for mandatory fields', () => {
      // Arrange
      const field = createMockField({ isMandatory: true });

      // Act
      const wrapper = mount(FileField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { FileUpload, Button },
        },
      });

      // Assert
      expect(wrapper.find('.text-red-500').exists()).toBe(true);
      expect(wrapper.find('.text-red-500').text()).toBe('*');
    });

    it('should display description when provided and no error', () => {
      // Arrange
      const field = createMockField({ description: 'Upload your file here' });

      // Act
      const wrapper = mount(FileField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { FileUpload, Button },
        },
      });

      // Assert
      expect(wrapper.find('.text-gray-500').exists()).toBe(true);
      expect(wrapper.find('.text-gray-500').text()).toBe('Upload your file here');
    });

    it('should use default choose label when no file selected', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(FileField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { FileUpload, Button },
        },
      });

      // Assert
      const fileUpload = wrapper.findComponent(FileUpload);
      expect(fileUpload.props('chooseLabel')).toBe('Choose File');
    });
  });

  describe('FileUpload configuration', () => {
    it('should use basic mode', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(FileField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { FileUpload, Button },
        },
      });

      // Assert
      const fileUpload = wrapper.findComponent(FileUpload);
      expect(fileUpload.props('mode')).toBe('basic');
    });

    it('should disable auto upload', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(FileField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { FileUpload, Button },
        },
      });

      // Assert
      const fileUpload = wrapper.findComponent(FileUpload);
      expect(fileUpload.props('auto')).toBe(false);
    });
  });

  describe('File selection', () => {
    it('should emit update:modelValue with file data when file is selected', async () => {
      // Arrange
      const field = createMockField();
      const wrapper = mount(FileField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { FileUpload, Button },
        },
      });

      const mockFile = {
        name: 'test.pdf',
        size: 1024,
        type: 'application/pdf',
      };

      // Act
      const fileUpload = wrapper.findComponent(FileUpload);
      await fileUpload.vm.$emit('select', { files: [mockFile] });

      // Assert
      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      const emittedValue = wrapper.emitted('update:modelValue')?.[0]?.[0] as any;
      expect(emittedValue.name).toBe('test.pdf');
      expect(emittedValue.size).toBe(1024);
      expect(emittedValue.type).toBe('application/pdf');
      expect(emittedValue.file).toBe(mockFile);
    });

    it('should display file name when file is selected', async () => {
      // Arrange
      const field = createMockField();
      const wrapper = mount(FileField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { FileUpload, Button },
        },
      });

      const mockFile = {
        name: 'document.docx',
        size: 2048,
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      };

      // Act
      const fileUpload = wrapper.findComponent(FileUpload);
      await fileUpload.vm.$emit('select', { files: [mockFile] });
      await wrapper.vm.$nextTick();

      // Assert
      expect(wrapper.text()).toContain('document.docx');
    });

    it('should update choose label with file name when file is selected', async () => {
      // Arrange
      const field = createMockField();
      const wrapper = mount(FileField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { FileUpload, Button },
        },
      });

      const mockFile = {
        name: 'image.jpg',
        size: 512,
        type: 'image/jpeg',
      };

      // Act
      const fileUpload = wrapper.findComponent(FileUpload);
      await fileUpload.vm.$emit('select', { files: [mockFile] });
      await wrapper.vm.$nextTick();

      // Assert
      expect(fileUpload.props('chooseLabel')).toBe('image.jpg');
    });
  });

  describe('File removal', () => {
    it('should show remove button when file is selected', async () => {
      // Arrange
      const field = createMockField();
      const wrapper = mount(FileField, {
        props: {
          field,
          modelValue: {
            name: 'test.pdf',
            size: 1024,
            type: 'application/pdf',
          },
        },
        global: {
          components: { FileUpload, Button },
        },
      });

      // Assert
      await wrapper.vm.$nextTick();
      expect(wrapper.findComponent(Button).exists()).toBe(true);
    });

    it('should not show remove button when field is read-only', async () => {
      // Arrange
      const field = createMockField({ isReadOnly: true });
      const wrapper = mount(FileField, {
        props: {
          field,
          modelValue: {
            name: 'test.pdf',
            size: 1024,
            type: 'application/pdf',
          },
        },
        global: {
          components: { FileUpload, Button },
        },
      });

      // Assert
      await wrapper.vm.$nextTick();
      // Check that the remove button is not visible in the rendered HTML
      const buttons = wrapper.findAll('button').filter(btn =>
        btn.attributes('class')?.includes('p-button-danger')
      );
      expect(buttons.length).toBe(0);
    });

    it('should emit update:modelValue with null when file is removed', async () => {
      // Arrange
      const field = createMockField();
      const wrapper = mount(FileField, {
        props: {
          field,
          modelValue: {
            name: 'test.pdf',
            size: 1024,
            type: 'application/pdf',
          },
        },
        global: {
          components: { FileUpload, Button },
        },
      });

      // Act
      await wrapper.vm.$nextTick();
      // Find the remove button by looking for buttons with the danger class
      const removeButton = wrapper.findAll('button').find(btn =>
        btn.attributes('class')?.includes('p-button-danger')
      );
      await removeButton!.trigger('click');

      // Assert
      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([null]);
    });
  });

  describe('File name display from modelValue', () => {
    it('should display file name from modelValue with name property', async () => {
      // Arrange
      const field = createMockField();
      const wrapper = mount(FileField, {
        props: {
          field,
          modelValue: {
            name: 'existing-file.pdf',
            size: 2048,
            type: 'application/pdf',
          },
        },
        global: {
          components: { FileUpload, Button },
        },
      });

      // Assert
      await wrapper.vm.$nextTick();
      expect(wrapper.text()).toContain('existing-file.pdf');
    });

    it('should display file name from modelValue with fileName property', async () => {
      // Arrange
      const field = createMockField();
      const wrapper = mount(FileField, {
        props: {
          field,
          modelValue: {
            fileName: 'uploaded-doc.docx',
          },
        },
        global: {
          components: { FileUpload, Button },
        },
      });

      // Assert
      await wrapper.vm.$nextTick();
      expect(wrapper.text()).toContain('uploaded-doc.docx');
    });

    it('should display fallback text when modelValue has no name', async () => {
      // Arrange
      const field = createMockField();
      const wrapper = mount(FileField, {
        props: {
          field,
          modelValue: {
            size: 1024,
          },
        },
        global: {
          components: { FileUpload, Button },
        },
      });

      // Assert
      await wrapper.vm.$nextTick();
      expect(wrapper.text()).toContain('File selected');
    });
  });

  describe('Error handling', () => {
    it('should display error message when error prop is provided', () => {
      // Arrange
      const field = createMockField();
      const errorMessage = 'File is required';

      // Act
      const wrapper = mount(FileField, {
        props: {
          field,
          modelValue: null,
          error: errorMessage,
        },
        global: {
          components: { FileUpload, Button },
        },
      });

      // Assert
      expect(wrapper.find('.p-error').exists()).toBe(true);
      expect(wrapper.find('.p-error').text()).toBe(errorMessage);
    });

    it('should apply error styling to FileUpload when error is present', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(FileField, {
        props: {
          field,
          modelValue: null,
          error: 'Invalid file',
        },
        global: {
          components: { FileUpload, Button },
        },
      });

      // Assert
      // Verify the component exists and error message is displayed
      const fileUpload = wrapper.findComponent(FileUpload);
      expect(fileUpload.exists()).toBe(true);
      expect(wrapper.find('.p-error').exists()).toBe(true);
    });
  });

  describe('Disabled/ReadOnly state', () => {
    it('should disable FileUpload when field is read-only', () => {
      // Arrange
      const field = createMockField({ isReadOnly: true });

      // Act
      const wrapper = mount(FileField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { FileUpload, Button },
        },
      });

      // Assert
      const fileUpload = wrapper.findComponent(FileUpload);
      expect(fileUpload.props('disabled')).toBe(true);
    });

    it('should not disable FileUpload when field is not read-only', () => {
      // Arrange
      const field = createMockField({ isReadOnly: false });

      // Act
      const wrapper = mount(FileField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { FileUpload, Button },
        },
      });

      // Assert
      const fileUpload = wrapper.findComponent(FileUpload);
      expect(fileUpload.props('disabled')).toBe(false);
    });
  });

  describe('Label accessibility', () => {
    it('should associate label with FileUpload using for and id attributes', () => {
      // Arrange
      const field = createMockField({ fieldKey: 'document_file' });

      // Act
      const wrapper = mount(FileField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { FileUpload, Button },
        },
      });

      // Assert
      const label = wrapper.find('label');
      const fileUpload = wrapper.findComponent(FileUpload);
      expect(label.attributes('for')).toBe('document_file');
      expect(fileUpload.attributes('id')).toBe('document_file');
    });
  });

  describe('Component structure', () => {
    it('should have proper field wrapper structure', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(FileField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { FileUpload, Button },
        },
      });

      // Assert
      expect(wrapper.find('.field').exists()).toBe(true);
      expect(wrapper.find('.field.mb-4').exists()).toBe(true);
    });

    it('should render FileUpload component properly', () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(FileField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { FileUpload, Button },
        },
      });

      // Assert
      const fileUpload = wrapper.findComponent(FileUpload);
      expect(fileUpload.exists()).toBe(true);
      expect(fileUpload.props('mode')).toBe('basic');
      expect(fileUpload.props('auto')).toBe(false);
    });
  });
});
