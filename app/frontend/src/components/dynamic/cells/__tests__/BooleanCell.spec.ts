import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BooleanCell from '../BooleanCell.vue';
import Tag from 'primevue/tag';

describe('BooleanCell.vue', () => {
  describe('Rendering with truthy values', () => {
    it('should display "Yes" when value is true', () => {
      // Arrange & Act
      const wrapper = mount(BooleanCell, {
        props: { value: true },
        global: {
          components: { Tag },
        },
      });

      // Assert
      expect(wrapper.text()).toBe('Yes');
    });

    it('should display success severity when value is true', () => {
      // Arrange & Act
      const wrapper = mount(BooleanCell, {
        props: { value: true },
        global: {
          components: { Tag },
        },
      });

      // Assert
      const tag = wrapper.findComponent(Tag);
      expect(tag.props('severity')).toBe('success');
    });

    it('should display check icon when value is true', () => {
      // Arrange & Act
      const wrapper = mount(BooleanCell, {
        props: { value: true },
        global: {
          components: { Tag },
        },
      });

      // Assert
      const tag = wrapper.findComponent(Tag);
      expect(tag.props('icon')).toBe('pi pi-check');
    });

    it('should display "Yes" when value is truthy string', () => {
      // Arrange & Act
      const wrapper = mount(BooleanCell, {
        props: { value: 'true' },
        global: {
          components: { Tag },
        },
      });

      // Assert
      expect(wrapper.text()).toBe('Yes');
    });

    it('should display "Yes" when value is truthy number', () => {
      // Arrange & Act
      const wrapper = mount(BooleanCell, {
        props: { value: 1 },
        global: {
          components: { Tag },
        },
      });

      // Assert
      expect(wrapper.text()).toBe('Yes');
    });
  });

  describe('Rendering with falsy values', () => {
    it('should display "No" when value is false', () => {
      // Arrange & Act
      const wrapper = mount(BooleanCell, {
        props: { value: false },
        global: {
          components: { Tag },
        },
      });

      // Assert
      expect(wrapper.text()).toBe('No');
    });

    it('should display secondary severity when value is false', () => {
      // Arrange & Act
      const wrapper = mount(BooleanCell, {
        props: { value: false },
        global: {
          components: { Tag },
        },
      });

      // Assert
      const tag = wrapper.findComponent(Tag);
      expect(tag.props('severity')).toBe('secondary');
    });

    it('should display times icon when value is false', () => {
      // Arrange & Act
      const wrapper = mount(BooleanCell, {
        props: { value: false },
        global: {
          components: { Tag },
        },
      });

      // Assert
      const tag = wrapper.findComponent(Tag);
      expect(tag.props('icon')).toBe('pi pi-times');
    });

    it('should display "No" when value is null', () => {
      // Arrange & Act
      const wrapper = mount(BooleanCell, {
        props: { value: null },
        global: {
          components: { Tag },
        },
      });

      // Assert
      expect(wrapper.text()).toBe('No');
    });

    it('should display "No" when value is undefined', () => {
      // Arrange & Act
      const wrapper = mount(BooleanCell, {
        props: { value: undefined },
        global: {
          components: { Tag },
        },
      });

      // Assert
      expect(wrapper.text()).toBe('No');
    });

    it('should display "No" when value is 0', () => {
      // Arrange & Act
      const wrapper = mount(BooleanCell, {
        props: { value: 0 },
        global: {
          components: { Tag },
        },
      });

      // Assert
      expect(wrapper.text()).toBe('No');
    });

    it('should display "No" when value is empty string', () => {
      // Arrange & Act
      const wrapper = mount(BooleanCell, {
        props: { value: '' },
        global: {
          components: { Tag },
        },
      });

      // Assert
      expect(wrapper.text()).toBe('No');
    });
  });

  describe('Component structure', () => {
    it('should render Tag component', () => {
      // Arrange & Act
      const wrapper = mount(BooleanCell, {
        props: { value: true },
        global: {
          components: { Tag },
        },
      });

      // Assert
      expect(wrapper.findComponent(Tag).exists()).toBe(true);
    });

    it('should pass displayValue prop to Tag component', () => {
      // Arrange & Act
      const wrapper = mount(BooleanCell, {
        props: { value: true },
        global: {
          components: { Tag },
        },
      });

      // Assert
      const tag = wrapper.findComponent(Tag);
      expect(tag.props('value')).toBe('Yes');
    });
  });
});
