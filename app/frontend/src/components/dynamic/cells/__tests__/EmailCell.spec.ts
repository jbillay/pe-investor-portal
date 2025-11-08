import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import EmailCell from '../EmailCell.vue';

describe('EmailCell.vue', () => {
  describe('Rendering with valid email', () => {
    it('should display email as clickable link', () => {
      // Arrange & Act
      const wrapper = mount(EmailCell, {
        props: { value: 'test@example.com' },
      });

      // Assert
      const link = wrapper.find('a');
      expect(link.exists()).toBe(true);
      expect(link.text()).toBe('test@example.com');
    });

    it('should have correct mailto href', () => {
      // Arrange & Act
      const wrapper = mount(EmailCell, {
        props: { value: 'john.doe@company.com' },
      });

      // Assert
      const link = wrapper.find('a');
      expect(link.attributes('href')).toBe('mailto:john.doe@company.com');
    });

    it('should have correct CSS classes for link', () => {
      // Arrange & Act
      const wrapper = mount(EmailCell, {
        props: { value: 'contact@test.org' },
      });

      // Assert
      const link = wrapper.find('a');
      expect(link.classes()).toContain('text-blue-600');
      expect(link.classes()).toContain('hover:text-blue-800');
      expect(link.classes()).toContain('hover:underline');
    });

    it('should handle email with plus sign', () => {
      // Arrange & Act
      const wrapper = mount(EmailCell, {
        props: { value: 'user+tag@example.com' },
      });

      // Assert
      const link = wrapper.find('a');
      expect(link.text()).toBe('user+tag@example.com');
      expect(link.attributes('href')).toBe('mailto:user+tag@example.com');
    });

    it('should handle email with subdomain', () => {
      // Arrange & Act
      const wrapper = mount(EmailCell, {
        props: { value: 'admin@mail.example.co.uk' },
      });

      // Assert
      const link = wrapper.find('a');
      expect(link.text()).toBe('admin@mail.example.co.uk');
      expect(link.attributes('href')).toBe('mailto:admin@mail.example.co.uk');
    });

    it('should handle email with numbers and dashes', () => {
      // Arrange & Act
      const wrapper = mount(EmailCell, {
        props: { value: 'user-123@test-domain.com' },
      });

      // Assert
      const link = wrapper.find('a');
      expect(link.text()).toBe('user-123@test-domain.com');
      expect(link.attributes('href')).toBe('mailto:user-123@test-domain.com');
    });
  });

  describe('Rendering with null/empty values', () => {
    it('should display "-" when value is null', () => {
      // Arrange & Act
      const wrapper = mount(EmailCell, {
        props: { value: null },
      });

      // Assert
      expect(wrapper.find('a').exists()).toBe(false);
      expect(wrapper.find('span').exists()).toBe(true);
      expect(wrapper.text()).toBe('-');
    });

    it('should display "-" when value is empty string', () => {
      // Arrange & Act
      const wrapper = mount(EmailCell, {
        props: { value: '' },
      });

      // Assert
      expect(wrapper.find('a').exists()).toBe(false);
      expect(wrapper.find('span').exists()).toBe(true);
      expect(wrapper.text()).toBe('-');
    });

    it('should have correct CSS class for empty state', () => {
      // Arrange & Act
      const wrapper = mount(EmailCell, {
        props: { value: null },
      });

      // Assert
      const span = wrapper.find('span');
      expect(span.classes()).toContain('text-gray-400');
    });
  });

  describe('Component structure', () => {
    it('should render link when email is present', () => {
      // Arrange & Act
      const wrapper = mount(EmailCell, {
        props: { value: 'test@example.com' },
      });

      // Assert
      expect(wrapper.find('a').exists()).toBe(true);
      expect(wrapper.find('span').exists()).toBe(false);
    });

    it('should render span when email is not present', () => {
      // Arrange & Act
      const wrapper = mount(EmailCell, {
        props: { value: null },
      });

      // Assert
      expect(wrapper.find('a').exists()).toBe(false);
      expect(wrapper.find('span').exists()).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle very long email addresses', () => {
      // Arrange
      const longEmail = 'very.long.email.address.with.many.dots@subdomain.example.com';

      // Act
      const wrapper = mount(EmailCell, {
        props: { value: longEmail },
      });

      // Assert
      const link = wrapper.find('a');
      expect(link.text()).toBe(longEmail);
      expect(link.attributes('href')).toBe(`mailto:${longEmail}`);
    });

    it('should handle email with uppercase letters', () => {
      // Arrange & Act
      const wrapper = mount(EmailCell, {
        props: { value: 'User@Example.COM' },
      });

      // Assert
      const link = wrapper.find('a');
      expect(link.text()).toBe('User@Example.COM');
      expect(link.attributes('href')).toBe('mailto:User@Example.COM');
    });

    it('should handle single character local part', () => {
      // Arrange & Act
      const wrapper = mount(EmailCell, {
        props: { value: 'a@example.com' },
      });

      // Assert
      const link = wrapper.find('a');
      expect(link.text()).toBe('a@example.com');
      expect(link.attributes('href')).toBe('mailto:a@example.com');
    });
  });
});
