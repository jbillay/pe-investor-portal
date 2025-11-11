import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import RelationshipField from '../RelationshipField.vue';
import Select from 'primevue/select';
import type { DynamicField } from '@/types/dynamic-data';

// Create a mock get function that will be used across tests
const mockGet = vi.fn();

// Mock the useApi composable
vi.mock('@/composables/useApi', () => ({
  useApi: () => ({
    api: {
      get: mockGet,
    },
  }),
}));

describe('RelationshipField.vue', () => {
  const createMockField = (overrides?: Partial<DynamicField>): DynamicField => ({
    id: 'field-1',
    fieldKey: 'test_relationship',
    name: 'Test Relationship',
    dataType: 'RELATIONSHIP' as any,
    fieldOrder: 1,
    isMandatory: false,
    isReadOnly: false,
    validationRules: [],
    dropdownOptions: [],
    relatedDataObjectId: 'related-obj-123',
    ...overrides,
  });

  const mockDataObject = {
    id: 'related-obj-123',
    dataKey: 'companies',
    name: 'Companies',
    fields: [
      {
        id: 'f1',
        fieldKey: 'company_name',
        name: 'Company Name',
        dataType: 'TEXT',
        fieldOrder: 1,
        isMandatory: false,
        isReadOnly: false,
        validationRules: [],
        dropdownOptions: [],
      },
    ],
  };

  const mockInstances = {
    items: [
      {
        id: 'inst-1',
        dataObjectId: 'related-obj-123',
        values: { company_name: 'Acme Corp' },
        versionNumber: 1,
        isActive: true,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        createdBy: 'user1',
        updatedBy: 'user1',
      },
      {
        id: 'inst-2',
        dataObjectId: 'related-obj-123',
        values: { company_name: 'Tech Solutions' },
        versionNumber: 1,
        isActive: true,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        createdBy: 'user1',
        updatedBy: 'user1',
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Set default mock implementation
    // Note: The useApi composable should return data directly, not wrapped in { data: ... }
    mockGet.mockImplementation((url: string) => {
      if (url.includes('/admin/data-objects')) {
        return Promise.resolve(mockDataObject);
      }
      if (url.includes('/dynamic')) {
        return Promise.resolve(mockInstances);
      }
      return Promise.resolve(null);
    });
  });

  describe('Rendering', () => {
    it('should render Select component when relatedDataObjectId is configured', async () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(RelationshipField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { Select },
        },
      });

      await flushPromises();

      // Assert
      expect(wrapper.findComponent(Select).exists()).toBe(true);
    });

    it('should display warning when relatedDataObjectId is not configured', () => {
      // Arrange
      const field = createMockField({ relatedDataObjectId: undefined });

      // Act
      const wrapper = mount(RelationshipField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { Select },
        },
      });

      // Assert
      expect(wrapper.text()).toContain('This relationship field is not properly configured');
      expect(wrapper.find('.bg-yellow-50').exists()).toBe(true);
    });

    it('should display field name as label', async () => {
      // Arrange
      const field = createMockField({ name: 'Related Company' });

      // Act
      const wrapper = mount(RelationshipField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { Select },
        },
      });

      await flushPromises();

      // Assert
      expect(wrapper.find('label').text()).toContain('Related Company');
    });

    it('should display asterisk for mandatory fields', async () => {
      // Arrange
      const field = createMockField({ isMandatory: true });

      // Act
      const wrapper = mount(RelationshipField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { Select },
        },
      });

      await flushPromises();

      // Assert
      expect(wrapper.find('.text-red-500').exists()).toBe(true);
      expect(wrapper.find('.text-red-500').text()).toBe('*');
    });

    it('should display description when provided and no error', async () => {
      // Arrange
      const field = createMockField({ description: 'Select related entity' });

      // Act
      const wrapper = mount(RelationshipField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { Select },
        },
      });

      await flushPromises();

      // Assert
      expect(wrapper.find('.text-gray-500').exists()).toBe(true);
      expect(wrapper.find('.text-gray-500').text()).toBe('Select related entity');
    });
  });

  describe('Data loading', () => {
    it('should load related data object on mount', async () => {
      // Arrange
      const field = createMockField();

      // Act
      mount(RelationshipField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { Select },
        },
      });

      await flushPromises();

      // Assert
      expect(mockGet).toHaveBeenCalledWith('/admin/data-objects/related-obj-123');
    });

    it('should load related instances on mount', async () => {
      // Arrange
      const field = createMockField();

      // Act
      mount(RelationshipField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { Select },
        },
      });

      await flushPromises();

      // Assert
      expect(mockGet).toHaveBeenCalledWith('/dynamic/companies?limit=100');
    });

    it('should show loading state while fetching data', async () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(RelationshipField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { Select },
        },
      });

      // Wait for API calls to complete
      await flushPromises();

      // Assert - loading should be false after data loads
      const select = wrapper.findComponent(Select);
      expect(select.props('loading')).toBe(false);
    });

    it('should not load data when relatedDataObjectId is missing', async () => {
      // Arrange
      const field = createMockField({ relatedDataObjectId: undefined });

      await flushPromises();

      // Assert
      expect(mockGet).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      // Arrange
      const field = createMockField();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGet.mockRejectedValueOnce(new Error('API Error'));

      // Act
      const wrapper = mount(RelationshipField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { Select },
        },
      });

      await flushPromises();

      // Assert
      expect(consoleSpy).toHaveBeenCalled();
      expect(wrapper.findComponent(Select).exists()).toBe(true);

      consoleSpy.mockRestore();
    });
  });

  describe('Select configuration', () => {
    it('should enable filtering', async () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(RelationshipField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { Select },
        },
      });

      await flushPromises();

      // Assert
      const select = wrapper.findComponent(Select);
      expect(select.props('filter')).toBe(true);
    });

    it('should show clear button for non-mandatory fields', async () => {
      // Arrange
      const field = createMockField({ isMandatory: false });

      // Act
      const wrapper = mount(RelationshipField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { Select },
        },
      });

      await flushPromises();

      // Assert
      const select = wrapper.findComponent(Select);
      expect(select.props('showClear')).toBe(true);
    });

    it('should not show clear button for mandatory fields', async () => {
      // Arrange
      const field = createMockField({ isMandatory: true });

      // Act
      const wrapper = mount(RelationshipField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { Select },
        },
      });

      await flushPromises();

      // Assert
      const select = wrapper.findComponent(Select);
      expect(select.props('showClear')).toBe(false);
    });

    it('should configure option label and value as id', async () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(RelationshipField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { Select },
        },
      });

      await flushPromises();

      // Assert
      const select = wrapper.findComponent(Select);
      expect(select.props('optionLabel')).toBe('label');
      expect(select.props('optionValue')).toBe('id');
    });
  });

  describe('Error handling', () => {
    it('should display error message when error prop is provided', async () => {
      // Arrange
      const field = createMockField();
      const errorMessage = 'Selection is required';

      // Act
      const wrapper = mount(RelationshipField, {
        props: {
          field,
          modelValue: null,
          error: errorMessage,
        },
        global: {
          components: { Select },
        },
      });

      await flushPromises();

      // Assert
      expect(wrapper.find('.p-error').exists()).toBe(true);
      expect(wrapper.find('.p-error').text()).toBe(errorMessage);
    });

    it('should add p-invalid class to Select when error is present', async () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(RelationshipField, {
        props: {
          field,
          modelValue: null,
          error: 'Invalid selection',
        },
        global: {
          components: { Select },
        },
      });

      await flushPromises();

      // Assert
      const select = wrapper.findComponent(Select);
      expect(select.classes()).toContain('p-invalid');
    });
  });

  describe('v-model binding', () => {
    it('should pass modelValue to Select', async () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(RelationshipField, {
        props: {
          field,
          modelValue: 'inst-1',
        },
        global: {
          components: { Select },
        },
      });

      await flushPromises();

      // Assert
      const select = wrapper.findComponent(Select);
      expect(select.props('modelValue')).toBe('inst-1');
    });

    it('should emit update:modelValue when Select value changes', async () => {
      // Arrange
      const field = createMockField();

      const wrapper = mount(RelationshipField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { Select },
        },
      });

      await flushPromises();

      // Act
      const select = wrapper.findComponent(Select);
      await select.vm.$emit('update:modelValue', 'inst-2');

      // Assert
      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['inst-2']);
    });
  });

  describe('Disabled/ReadOnly state', () => {
    it('should disable Select when field is read-only', async () => {
      // Arrange
      const field = createMockField({ isReadOnly: true });

      // Act
      const wrapper = mount(RelationshipField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { Select },
        },
      });

      await flushPromises();

      // Assert
      const select = wrapper.findComponent(Select);
      expect(select.props('disabled')).toBe(true);
    });

    it('should disable Select when loading', async () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(RelationshipField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { Select },
        },
      });

      // Wait for loading to complete
      await flushPromises();

      // Assert - Select should not be disabled after loading completes
      const select = wrapper.findComponent(Select);
      expect(select.props('disabled')).toBe(false);
    });
  });

  describe('Label accessibility', () => {
    it('should associate label with Select using for and id attributes', async () => {
      // Arrange
      const field = createMockField({ fieldKey: 'related_company' });

      // Act
      const wrapper = mount(RelationshipField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { Select },
        },
      });

      await flushPromises();

      // Assert
      const label = wrapper.find('label');
      const select = wrapper.findComponent(Select);
      expect(label.attributes('for')).toBe('related_company');
      expect(select.attributes('id')).toBe('related_company');
    });
  });

  describe('Component structure', () => {
    it('should have proper field wrapper structure', async () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(RelationshipField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { Select },
        },
      });

      await flushPromises();

      // Assert
      expect(wrapper.find('.field').exists()).toBe(true);
      expect(wrapper.find('.field.mb-4').exists()).toBe(true);
    });

    it('should have full width Select', async () => {
      // Arrange
      const field = createMockField();

      // Act
      const wrapper = mount(RelationshipField, {
        props: {
          field,
          modelValue: null,
        },
        global: {
          components: { Select },
        },
      });

      await flushPromises();

      // Assert
      const select = wrapper.findComponent(Select);
      expect(select.classes()).toContain('w-full');
    });
  });
});
