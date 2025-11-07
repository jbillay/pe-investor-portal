import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { EmailTemplate, CreateEmailTemplateDto, UpdateEmailTemplateDto } from '@/types/email';

// Mock the API client
vi.mock('@/composables/useApi', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}));

import { EmailTemplateApiService, EmailTemplateApiServiceError, emailTemplateApiService } from '../emailTemplateApiService';
import { apiClient as mockApiClient } from '@/composables/useApi';

describe('EmailTemplateApiServiceError', () => {
  it('should create error with message, code, and details', () => {
    const error = new EmailTemplateApiServiceError('Test error', 'TEST_CODE', { foo: 'bar' });

    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.details).toEqual({ foo: 'bar' });
    expect(error.name).toBe('EmailTemplateApiServiceError');
  });

  it('should create error without details', () => {
    const error = new EmailTemplateApiServiceError('Test error', 'TEST_CODE');

    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.details).toBeUndefined();
  });
});

describe('EmailTemplateApiService', () => {
  let service: EmailTemplateApiService;

  const mockEmailTemplate: EmailTemplate = {
    id: 'template-1',
    name: 'welcome_email',
    displayName: 'Welcome Email',
    subject: 'Welcome to {{companyName}}',
    htmlBody: '<h1>Welcome {{userName}}</h1>',
    textBody: 'Welcome {{userName}}',
    category: 'TRANSACTIONAL',
    isActive: true,
    isSystem: false,
    variables: [
      { name: 'userName', type: 'string', required: true, defaultValue: '' },
      { name: 'companyName', type: 'string', required: false, defaultValue: 'Our Company' }
    ],
    createdAt: '2025-01-01T10:00:00Z',
    updatedAt: '2025-01-01T10:00:00Z'
  };

  beforeEach(() => {
    service = new EmailTemplateApiService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllTemplates', () => {
    it('should fetch all templates without filters', async () => {
      const mockResponse = { data: [mockEmailTemplate] };
      vi.mocked(mockApiClient.get).mockResolvedValue(mockResponse);

      const result = await service.getAllTemplates();

      expect(mockApiClient.get).toHaveBeenCalledWith('/admin/email-templates');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('template-1');
    });

    it('should fetch templates with category filter', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: [mockEmailTemplate] });

      await service.getAllTemplates({ category: 'TRANSACTIONAL' });

      expect(mockApiClient.get).toHaveBeenCalledWith('/admin/email-templates?category=TRANSACTIONAL');
    });

    it('should fetch templates with isActive filter', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: [mockEmailTemplate] });

      await service.getAllTemplates({ isActive: true });

      expect(mockApiClient.get).toHaveBeenCalledWith('/admin/email-templates?isActive=true');
    });

    it('should fetch templates with isSystem filter', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: [mockEmailTemplate] });

      await service.getAllTemplates({ isSystem: false });

      expect(mockApiClient.get).toHaveBeenCalledWith('/admin/email-templates?isSystem=false');
    });

    it('should fetch templates with search filter', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: [mockEmailTemplate] });

      await service.getAllTemplates({ search: 'welcome' });

      expect(mockApiClient.get).toHaveBeenCalledWith('/admin/email-templates?search=welcome');
    });

    it('should fetch templates with multiple filters', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: [mockEmailTemplate] });

      await service.getAllTemplates({ category: 'MARKETING', isActive: true, search: 'promo' });

      expect(mockApiClient.get).toHaveBeenCalledWith('/admin/email-templates?category=MARKETING&isActive=true&search=promo');
    });

    it('should handle unwrapped response', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue([mockEmailTemplate]);

      const result = await service.getAllTemplates();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('template-1');
    });

    it('should throw error for invalid response format', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: 'not-an-array' });

      await expect(service.getAllTemplates()).rejects.toThrow('Invalid response format from server');
    });

    it('should handle network error', async () => {
      const networkError = { name: 'NetworkError', message: 'Network failed' };
      vi.mocked(mockApiClient.get).mockRejectedValue(networkError);

      await expect(service.getAllTemplates()).rejects.toThrow('Unable to connect to server');
    });
  });

  describe('getTemplateById', () => {
    it('should fetch template by ID', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: mockEmailTemplate });

      const result = await service.getTemplateById('template-1');

      expect(mockApiClient.get).toHaveBeenCalledWith('/admin/email-templates/template-1');
      expect(result.id).toBe('template-1');
      expect(result.name).toBe('welcome_email');
    });

    it('should handle unwrapped response', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue(mockEmailTemplate);

      const result = await service.getTemplateById('template-1');

      expect(result.id).toBe('template-1');
    });

    it('should throw error for empty template ID', async () => {
      await expect(service.getTemplateById('')).rejects.toThrow('Template ID is required');
      await expect(service.getTemplateById('  ')).rejects.toThrow('Template ID is required');
    });

    it('should throw error when template not found', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: null });

      await expect(service.getTemplateById('template-1')).rejects.toThrow('Template not found');
    });

    it('should handle network error', async () => {
      const networkError = { name: 'NetworkError', message: 'Network failed' };
      vi.mocked(mockApiClient.get).mockRejectedValue(networkError);

      await expect(service.getTemplateById('template-1')).rejects.toThrow('Unable to connect to server');
    });
  });

  describe('getTemplateByName', () => {
    it('should fetch template by name', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: mockEmailTemplate });

      const result = await service.getTemplateByName('welcome_email');

      expect(mockApiClient.get).toHaveBeenCalledWith('/admin/email-templates/name/welcome_email');
      expect(result.name).toBe('welcome_email');
    });

    it('should handle unwrapped response', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue(mockEmailTemplate);

      const result = await service.getTemplateByName('welcome_email');

      expect(result.name).toBe('welcome_email');
    });

    it('should throw error for empty template name', async () => {
      await expect(service.getTemplateByName('')).rejects.toThrow('Template name is required');
      await expect(service.getTemplateByName('  ')).rejects.toThrow('Template name is required');
    });

    it('should throw error when template not found', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: null });

      await expect(service.getTemplateByName('nonexistent')).rejects.toThrow('Template not found');
    });
  });

  describe('createTemplate', () => {
    const createDto: CreateEmailTemplateDto = {
      name: 'new_template',
      displayName: 'New Template',
      subject: 'Subject',
      htmlBody: '<h1>Body</h1>',
      textBody: 'Body',
      category: 'TRANSACTIONAL'
    };

    it('should create template successfully', async () => {
      vi.mocked(mockApiClient.post).mockResolvedValue({ data: mockEmailTemplate });

      const result = await service.createTemplate(createDto);

      expect(mockApiClient.post).toHaveBeenCalledWith('/admin/email-templates', createDto);
      expect(result.id).toBe('template-1');
    });

    it('should handle unwrapped response', async () => {
      vi.mocked(mockApiClient.post).mockResolvedValue(mockEmailTemplate);

      const result = await service.createTemplate(createDto);

      expect(result.id).toBe('template-1');
    });

    it('should throw error for empty template name', async () => {
      await expect(service.createTemplate({ ...createDto, name: '' })).rejects.toThrow('Template name is required');
      await expect(service.createTemplate({ ...createDto, name: '  ' })).rejects.toThrow('Template name is required');
    });

    it('should throw error for empty display name', async () => {
      await expect(service.createTemplate({ ...createDto, displayName: '' })).rejects.toThrow('Display name is required');
      await expect(service.createTemplate({ ...createDto, displayName: '  ' })).rejects.toThrow('Display name is required');
    });

    it('should throw error for empty subject', async () => {
      await expect(service.createTemplate({ ...createDto, subject: '' })).rejects.toThrow('Subject is required');
      await expect(service.createTemplate({ ...createDto, subject: '  ' })).rejects.toThrow('Subject is required');
    });

    it('should handle API error', async () => {
      vi.mocked(mockApiClient.post).mockRejectedValue(new Error('Creation failed'));

      await expect(service.createTemplate(createDto)).rejects.toThrow(EmailTemplateApiServiceError);
    });
  });

  describe('updateTemplate', () => {
    const updateDto: UpdateEmailTemplateDto = {
      displayName: 'Updated Template',
      subject: 'Updated Subject'
    };

    it('should update template successfully', async () => {
      const updatedTemplate = { ...mockEmailTemplate, displayName: 'Updated Template' };
      vi.mocked(mockApiClient.put).mockResolvedValue({ data: updatedTemplate });

      const result = await service.updateTemplate('template-1', updateDto);

      expect(mockApiClient.put).toHaveBeenCalledWith('/admin/email-templates/template-1', updateDto);
      expect(result.displayName).toBe('Updated Template');
    });

    it('should handle unwrapped response', async () => {
      vi.mocked(mockApiClient.put).mockResolvedValue(mockEmailTemplate);

      const result = await service.updateTemplate('template-1', updateDto);

      expect(result.id).toBe('template-1');
    });

    it('should throw error for empty template ID', async () => {
      await expect(service.updateTemplate('', updateDto)).rejects.toThrow('Template ID is required for update');
      await expect(service.updateTemplate('  ', updateDto)).rejects.toThrow('Template ID is required for update');
    });

    it('should handle API error', async () => {
      vi.mocked(mockApiClient.put).mockRejectedValue(new Error('Update failed'));

      await expect(service.updateTemplate('template-1', updateDto)).rejects.toThrow(EmailTemplateApiServiceError);
    });
  });

  describe('deleteTemplate', () => {
    it('should delete template successfully', async () => {
      vi.mocked(mockApiClient.delete).mockResolvedValue({});

      const result = await service.deleteTemplate('template-1');

      expect(mockApiClient.delete).toHaveBeenCalledWith('/admin/email-templates/template-1');
      expect(result).toBe(true);
    });

    it('should throw error for empty template ID', async () => {
      await expect(service.deleteTemplate('')).rejects.toThrow('Template ID is required');
      await expect(service.deleteTemplate('  ')).rejects.toThrow('Template ID is required');
    });

    it('should handle API error', async () => {
      vi.mocked(mockApiClient.delete).mockRejectedValue(new Error('Delete failed'));

      await expect(service.deleteTemplate('template-1')).rejects.toThrow(EmailTemplateApiServiceError);
    });
  });

  describe('duplicateTemplate', () => {
    it('should duplicate template successfully', async () => {
      const duplicatedTemplate = { ...mockEmailTemplate, id: 'template-2', name: 'welcome_email_copy' };
      vi.mocked(mockApiClient.post).mockResolvedValue({ data: duplicatedTemplate });

      const result = await service.duplicateTemplate('template-1');

      expect(mockApiClient.post).toHaveBeenCalledWith('/admin/email-templates/template-1/duplicate');
      expect(result.id).toBe('template-2');
      expect(result.name).toBe('welcome_email_copy');
    });

    it('should handle unwrapped response', async () => {
      vi.mocked(mockApiClient.post).mockResolvedValue(mockEmailTemplate);

      const result = await service.duplicateTemplate('template-1');

      expect(result.id).toBe('template-1');
    });

    it('should throw error for empty template ID', async () => {
      await expect(service.duplicateTemplate('')).rejects.toThrow('Template ID is required');
      await expect(service.duplicateTemplate('  ')).rejects.toThrow('Template ID is required');
    });

    it('should handle API error', async () => {
      vi.mocked(mockApiClient.post).mockRejectedValue(new Error('Duplicate failed'));

      await expect(service.duplicateTemplate('template-1')).rejects.toThrow(EmailTemplateApiServiceError);
    });
  });

  describe('previewTemplate', () => {
    it('should preview template with variables', async () => {
      const mockPreview = {
        subject: 'Welcome to Acme Corp',
        htmlBody: '<h1>Welcome John Doe</h1>',
        textBody: 'Welcome John Doe'
      };
      vi.mocked(mockApiClient.post).mockResolvedValue({ data: mockPreview });

      const result = await service.previewTemplate('template-1', { userName: 'John Doe', companyName: 'Acme Corp' });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/admin/email-templates/template-1/preview',
        { variables: { userName: 'John Doe', companyName: 'Acme Corp' } }
      );
      expect(result.subject).toBe('Welcome to Acme Corp');
    });

    it('should filter out empty string values', async () => {
      vi.mocked(mockApiClient.post).mockResolvedValue({ data: { subject: '', htmlBody: '', textBody: '' } });

      await service.previewTemplate('template-1', { userName: 'John', companyName: '' });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/admin/email-templates/template-1/preview',
        { variables: { userName: 'John' } }
      );
    });

    it('should filter out null and undefined values', async () => {
      vi.mocked(mockApiClient.post).mockResolvedValue({ data: { subject: '', htmlBody: '', textBody: '' } });

      await service.previewTemplate('template-1', { userName: 'John', email: null, age: undefined });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/admin/email-templates/template-1/preview',
        { variables: { userName: 'John' } }
      );
    });

    it('should convert string numbers to numbers based on schema', async () => {
      const schema = [
        { name: 'amount', type: 'number', required: true },
        { name: 'price', type: 'currency', required: true }
      ];
      vi.mocked(mockApiClient.post).mockResolvedValue({ data: { subject: '', htmlBody: '', textBody: '' } });

      await service.previewTemplate('template-1', { amount: '100', price: '50.99' }, schema);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/admin/email-templates/template-1/preview',
        { variables: { amount: 100, price: 50.99 } }
      );
    });

    it('should keep original value if number conversion fails', async () => {
      const schema = [{ name: 'amount', type: 'number', required: true }];
      vi.mocked(mockApiClient.post).mockResolvedValue({ data: { subject: '', htmlBody: '', textBody: '' } });

      await service.previewTemplate('template-1', { amount: 'invalid' }, schema);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/admin/email-templates/template-1/preview',
        { variables: { amount: 'invalid' } }
      );
    });

    it('should handle preview without variables', async () => {
      vi.mocked(mockApiClient.post).mockResolvedValue({ data: { subject: '', htmlBody: '', textBody: '' } });

      await service.previewTemplate('template-1');

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/admin/email-templates/template-1/preview',
        { variables: {} }
      );
    });

    it('should throw error for empty template ID', async () => {
      await expect(service.previewTemplate('')).rejects.toThrow('Template ID is required');
    });

    it('should handle API error', async () => {
      vi.mocked(mockApiClient.post).mockRejectedValue(new Error('Preview failed'));

      await expect(service.previewTemplate('template-1')).rejects.toThrow(EmailTemplateApiServiceError);
    });
  });

  describe('sendTestEmail', () => {
    it('should send test email with variables', async () => {
      const mockResult = { success: true, messageId: 'msg-123' };
      vi.mocked(mockApiClient.post).mockResolvedValue({ data: mockResult });

      const result = await service.sendTestEmail('template-1', 'test@example.com', { userName: 'John' });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/admin/email-templates/template-1/test',
        { recipientEmail: 'test@example.com', variables: { userName: 'John' } }
      );
      expect(result.success).toBe(true);
      expect(result.messageId).toBe('msg-123');
    });

    it('should filter out empty values in test email', async () => {
      vi.mocked(mockApiClient.post).mockResolvedValue({ data: { success: true } });

      await service.sendTestEmail('template-1', 'test@example.com', { userName: 'John', company: '' });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/admin/email-templates/template-1/test',
        { recipientEmail: 'test@example.com', variables: { userName: 'John' } }
      );
    });

    it('should convert numbers based on schema in test email', async () => {
      const schema = [{ name: 'amount', type: 'currency', required: true }];
      vi.mocked(mockApiClient.post).mockResolvedValue({ data: { success: true } });

      await service.sendTestEmail('template-1', 'test@example.com', { amount: '99.99' }, schema);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/admin/email-templates/template-1/test',
        { recipientEmail: 'test@example.com', variables: { amount: 99.99 } }
      );
    });

    it('should throw error for empty template ID', async () => {
      await expect(service.sendTestEmail('', 'test@example.com')).rejects.toThrow('Template ID is required');
    });

    it('should throw error for empty recipient email', async () => {
      await expect(service.sendTestEmail('template-1', '')).rejects.toThrow('Recipient email is required');
      await expect(service.sendTestEmail('template-1', '  ')).rejects.toThrow('Recipient email is required');
    });

    it('should handle API error', async () => {
      vi.mocked(mockApiClient.post).mockRejectedValue(new Error('Send failed'));

      await expect(service.sendTestEmail('template-1', 'test@example.com')).rejects.toThrow(EmailTemplateApiServiceError);
    });
  });

  describe('getCategories', () => {
    it('should fetch email categories', async () => {
      const mockCategories = ['TRANSACTIONAL', 'MARKETING', 'NOTIFICATION'];
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: mockCategories });

      const result = await service.getCategories();

      expect(mockApiClient.get).toHaveBeenCalledWith('/admin/email-templates/meta/categories');
      expect(result).toEqual(mockCategories);
    });

    it('should handle unwrapped response', async () => {
      const mockCategories = ['TRANSACTIONAL', 'MARKETING'];
      vi.mocked(mockApiClient.get).mockResolvedValue(mockCategories);

      const result = await service.getCategories();

      expect(result).toEqual(mockCategories);
    });

    it('should throw error for invalid response format', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: 'not-an-array' });

      await expect(service.getCategories()).rejects.toThrow('Invalid response format from server');
    });

    it('should handle network error', async () => {
      const networkError = { name: 'NetworkError', message: 'Network failed' };
      vi.mocked(mockApiClient.get).mockRejectedValue(networkError);

      await expect(service.getCategories()).rejects.toThrow('Unable to connect to server');
    });
  });

  describe('getTemplateVariables', () => {
    it('should fetch template variables', async () => {
      const mockVariables = [
        { name: 'userName', type: 'string', required: true, defaultValue: '' },
        { name: 'email', type: 'email', required: true, defaultValue: '' }
      ];
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: mockVariables });

      const result = await service.getTemplateVariables('template-1');

      expect(mockApiClient.get).toHaveBeenCalledWith('/admin/email-templates/template-1/variables');
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('userName');
    });

    it('should handle unwrapped response', async () => {
      const mockVariables = [{ name: 'userName', type: 'string', required: true }];
      vi.mocked(mockApiClient.get).mockResolvedValue(mockVariables);

      const result = await service.getTemplateVariables('template-1');

      expect(result).toHaveLength(1);
    });

    it('should throw error for empty template ID', async () => {
      await expect(service.getTemplateVariables('')).rejects.toThrow('Template ID is required');
      await expect(service.getTemplateVariables('  ')).rejects.toThrow('Template ID is required');
    });

    it('should throw error for invalid response format', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: 'not-an-array' });

      await expect(service.getTemplateVariables('template-1')).rejects.toThrow('Invalid response format from server');
    });

    it('should handle API error', async () => {
      vi.mocked(mockApiClient.get).mockRejectedValue(new Error('Variables fetch failed'));

      await expect(service.getTemplateVariables('template-1')).rejects.toThrow(EmailTemplateApiServiceError);
    });
  });

  describe('error handling', () => {
    it('should handle API error with validation errors', async () => {
      const apiError = {
        response: {
          data: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            errors: { name: ['Name is required'], subject: ['Subject is required'] }
          }
        }
      };
      vi.mocked(mockApiClient.get).mockRejectedValue(apiError);

      try {
        await service.getTemplateById('template-1');
      } catch (error: any) {
        expect(error).toBeInstanceOf(EmailTemplateApiServiceError);
        expect(error.message).toBe('Validation failed');
        expect(error.code).toBe('VALIDATION_ERROR');
        expect(error.details).toEqual({ name: ['Name is required'], subject: ['Subject is required'] });
      }
    });

    it('should re-throw EmailTemplateApiServiceError', async () => {
      const customError = new EmailTemplateApiServiceError('Custom error', 'CUSTOM_CODE');
      vi.mocked(mockApiClient.get).mockRejectedValue(customError);

      await expect(service.getTemplateById('template-1')).rejects.toThrow(customError);
    });
  });

  describe('singleton instance', () => {
    it('should export singleton instance', () => {
      expect(emailTemplateApiService).toBeInstanceOf(EmailTemplateApiService);
    });
  });
});
