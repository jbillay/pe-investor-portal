/**
 * Email Templates Composable Unit Tests
 * Comprehensive test suite covering all composable methods, state management, and error scenarios
 * Follows testing best practices with proper mocking and assertions
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useEmailTemplates } from '../useEmailTemplates';
import { emailTemplateApiService, EmailTemplateApiServiceError } from '@/services/emailTemplateApiService';
import { useToast } from 'primevue/usetoast';
import type {
  EmailTemplate,
  EmailCategory,
  CreateEmailTemplateDto,
  UpdateEmailTemplateDto,
  TemplatePreviewResponse,
  EmailSendResult,
} from '@/types/email';

// Mock dependencies
vi.mock('@/services/emailTemplateApiService', () => ({
  emailTemplateApiService: {
    getAllTemplates: vi.fn(),
    getCategories: vi.fn(),
    createTemplate: vi.fn(),
    updateTemplate: vi.fn(),
    deleteTemplate: vi.fn(),
    duplicateTemplate: vi.fn(),
    previewTemplate: vi.fn(),
    sendTestEmail: vi.fn(),
  },
  EmailTemplateApiServiceError: class EmailTemplateApiServiceError extends Error {
    constructor(message: string, public code: string, public details?: Record<string, any>) {
      super(message);
      this.name = 'EmailTemplateApiServiceError';
    }
  }
}));

vi.mock('primevue/usetoast', () => ({
  useToast: vi.fn(() => ({
    add: vi.fn(),
  })),
}));

describe('useEmailTemplates', () => {
  const mockToast = {
    add: vi.fn(),
  };

  // Mock data fixtures
  const mockTemplate: EmailTemplate = {
    id: 'template-123',
    name: 'welcome_email',
    displayName: 'Welcome Email',
    description: 'Welcome email for new users',
    subject: 'Welcome to our platform',
    htmlBody: '<p>Welcome {{firstName}}!</p>',
    textBody: 'Welcome {{firstName}}!',
    category: 'ACCOUNT' as EmailCategory,
    variables: [
      {
        name: 'firstName',
        type: 'string',
        required: true,
        description: 'User first name',
      },
    ],
    isActive: true,
    isSystem: false,
    version: 1,
    createdBy: 'admin-user',
    updatedBy: 'admin-user',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  };

  const mockInactiveTemplate: EmailTemplate = {
    ...mockTemplate,
    id: 'template-456',
    name: 'inactive_email',
    displayName: 'Inactive Email',
    description: 'Inactive email template for testing',
    subject: 'Account Notification',
    htmlBody: '<p>Notification {{message}}</p>',
    textBody: 'Notification {{message}}',
    isActive: false,
    isSystem: true,
  };

  const mockSystemTemplate: EmailTemplate = {
    ...mockTemplate,
    id: 'template-789',
    name: 'system_email',
    displayName: 'System Email',
    description: 'System email template for automated messages',
    subject: 'System Alert',
    htmlBody: '<p>System Alert {{alertType}}</p>',
    textBody: 'System Alert {{alertType}}',
    category: 'SYSTEM' as EmailCategory,
    isSystem: true,
  };

  const mockCategories: EmailCategory[] = [
    'ACCOUNT' as EmailCategory,
    'DOCUMENT' as EmailCategory,
    'CAPITAL_CALL' as EmailCategory,
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useToast as any).mockReturnValue(mockToast);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with empty state', () => {
      // Act
      const composable = useEmailTemplates();

      // Assert
      expect(composable.templates.value).toEqual([]);
      expect(composable.selectedTemplates.value).toEqual([]);
      expect(composable.loading.value).toBe(false);
      expect(composable.error.value).toBe(null);
      expect(composable.categories.value).toEqual([]);
      expect(composable.lastUpdated.value).toBe(null);
    });

    it('should initialize filters with default values', () => {
      // Act
      const composable = useEmailTemplates();

      // Assert
      expect(composable.filters.search).toBe('');
      expect(composable.filters.category).toBe(null);
      expect(composable.filters.isActive).toBe(null);
      expect(composable.filters.isSystem).toBe(null);
    });

    it('should initialize computed properties correctly', () => {
      // Act
      const composable = useEmailTemplates();

      // Assert
      expect(composable.filteredTemplates.value).toEqual([]);
      expect(composable.totalTemplates.value).toBe(0);
      expect(composable.activeTemplates.value).toBe(0);
      expect(composable.systemTemplates.value).toBe(0);
    });
  });

  describe('fetchTemplates', () => {
    it('should fetch templates successfully', async () => {
      // Arrange
      const mockTemplates = [mockTemplate, mockInactiveTemplate];
      (emailTemplateApiService.getAllTemplates as any).mockResolvedValue(mockTemplates);
      const composable = useEmailTemplates();

      // Act
      await composable.fetchTemplates();

      // Assert
      expect(emailTemplateApiService.getAllTemplates).toHaveBeenCalledWith(undefined);
      expect(composable.templates.value).toEqual(mockTemplates);
      expect(composable.loading.value).toBe(false);
      expect(composable.error.value).toBe(null);
      expect(composable.lastUpdated.value).toBeInstanceOf(Date);
    });

    it('should fetch templates with query parameters', async () => {
      // Arrange
      const params = { category: 'ACCOUNT' as EmailCategory, isActive: true };
      (emailTemplateApiService.getAllTemplates as any).mockResolvedValue([mockTemplate]);
      const composable = useEmailTemplates();

      // Act
      await composable.fetchTemplates(params);

      // Assert
      expect(emailTemplateApiService.getAllTemplates).toHaveBeenCalledWith(params);
      expect(composable.templates.value).toEqual([mockTemplate]);
    });

    it('should set loading state during fetch', async () => {
      // Arrange
      let loadingDuringFetch = false;
      (emailTemplateApiService.getAllTemplates as any).mockImplementation(async () => {
        loadingDuringFetch = composable.loading.value;
        return [mockTemplate];
      });
      const composable = useEmailTemplates();

      // Act
      await composable.fetchTemplates();

      // Assert
      expect(loadingDuringFetch).toBe(true);
      expect(composable.loading.value).toBe(false);
    });

    it('should handle EmailTemplateApiServiceError', async () => {
      // Arrange
      const error = new EmailTemplateApiServiceError('API Error', 'API_ERROR');
      (emailTemplateApiService.getAllTemplates as any).mockRejectedValue(error);
      const composable = useEmailTemplates();

      // Act
      await composable.fetchTemplates();

      // Assert
      expect(composable.error.value).toBe('API Error');
      expect(composable.loading.value).toBe(false);
      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Fetch Templates Failed',
        detail: 'API Error',
        life: 5000,
      });
    });

    it('should handle generic errors', async () => {
      // Arrange
      const error = new Error('Network error');
      (emailTemplateApiService.getAllTemplates as any).mockRejectedValue(error);
      const composable = useEmailTemplates();

      // Act
      await composable.fetchTemplates();

      // Assert
      expect(composable.error.value).toBe('Network error');
      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Fetch Templates Failed',
        detail: 'Network error',
        life: 5000,
      });
    });

    it('should handle errors without message property', async () => {
      // Arrange
      const error = { code: 'UNKNOWN' };
      (emailTemplateApiService.getAllTemplates as any).mockRejectedValue(error);
      const composable = useEmailTemplates();

      // Act
      await composable.fetchTemplates();

      // Assert
      expect(composable.error.value).toBe('An unexpected error occurred');
    });
  });

  describe('fetchCategories', () => {
    it('should fetch categories successfully', async () => {
      // Arrange
      (emailTemplateApiService.getCategories as any).mockResolvedValue(mockCategories);
      const composable = useEmailTemplates();

      // Act
      await composable.fetchCategories();

      // Assert
      expect(emailTemplateApiService.getCategories).toHaveBeenCalled();
      expect(composable.categories.value).toEqual(mockCategories);
    });

    it('should not show toast error on category fetch failure', async () => {
      // Arrange
      const error = new Error('Failed to fetch categories');
      (emailTemplateApiService.getCategories as any).mockRejectedValue(error);
      const composable = useEmailTemplates();

      // Act
      await composable.fetchCategories();

      // Assert
      expect(composable.categories.value).toEqual([]);
      expect(mockToast.add).not.toHaveBeenCalled();
    });
  });

  describe('createTemplate', () => {
    const createDto: CreateEmailTemplateDto = {
      name: 'new_template',
      displayName: 'New Template',
      description: 'Test template',
      subject: 'Test Subject',
      htmlBody: '<p>Test</p>',
      textBody: 'Test',
      category: 'ACCOUNT' as EmailCategory,
      variables: [],
      isActive: true,
    };

    it('should create template successfully', async () => {
      // Arrange
      const newTemplate = { ...mockTemplate, ...createDto };
      (emailTemplateApiService.createTemplate as any).mockResolvedValue(newTemplate);
      const composable = useEmailTemplates();

      // Act
      const result = await composable.createTemplate(createDto);

      // Assert
      expect(emailTemplateApiService.createTemplate).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(newTemplate);
      expect(composable.templates.value.some(t => t.id === newTemplate.id)).toBe(true);
      expect(composable.lastUpdated.value).toBeInstanceOf(Date);
      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Template Created',
        detail: `Template "${newTemplate.displayName}" has been created successfully.`,
        life: 3000,
      });
    });

    it('should set loading state during creation', async () => {
      // Arrange
      let loadingDuringCreate = false;
      (emailTemplateApiService.createTemplate as any).mockImplementation(async () => {
        loadingDuringCreate = composable.loading.value;
        return mockTemplate;
      });
      const composable = useEmailTemplates();

      // Act
      await composable.createTemplate(createDto);

      // Assert
      expect(loadingDuringCreate).toBe(true);
      expect(composable.loading.value).toBe(false);
    });

    it('should handle creation errors and return null', async () => {
      // Arrange
      const error = new EmailTemplateApiServiceError('Creation failed', 'CREATE_ERROR');
      (emailTemplateApiService.createTemplate as any).mockRejectedValue(error);
      const composable = useEmailTemplates();

      // Act
      const result = await composable.createTemplate(createDto);

      // Assert
      expect(result).toBe(null);
      expect(composable.error.value).toBe('Creation failed');
      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Create Template Failed',
        detail: 'Creation failed',
        life: 5000,
      });
    });
  });

  describe('updateTemplate', () => {
    const updateDto: UpdateEmailTemplateDto = {
      displayName: 'Updated Template',
      subject: 'Updated Subject',
    };

    it('should update template successfully', async () => {
      // Arrange
      const updatedTemplate = { ...mockTemplate, ...updateDto };
      (emailTemplateApiService.getAllTemplates as any).mockResolvedValue([mockTemplate]);
      (emailTemplateApiService.updateTemplate as any).mockResolvedValue(updatedTemplate);
      const composable = useEmailTemplates();
      await composable.fetchTemplates();

      // Act
      const result = await composable.updateTemplate('template-123', updateDto);

      // Assert
      expect(emailTemplateApiService.updateTemplate).toHaveBeenCalledWith('template-123', updateDto);
      expect(result).toEqual(updatedTemplate);
      expect(composable.templates.value[0]).toEqual(updatedTemplate);
      expect(composable.lastUpdated.value).toBeInstanceOf(Date);
      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Template Updated',
        detail: `Template "${updatedTemplate.displayName}" has been updated successfully.`,
        life: 3000,
      });
    });

    it('should handle template not found in local state', async () => {
      // Arrange
      const updatedTemplate = { ...mockTemplate, ...updateDto };
      (emailTemplateApiService.updateTemplate as any).mockResolvedValue(updatedTemplate);
      const composable = useEmailTemplates();

      // Act
      const result = await composable.updateTemplate('template-123', updateDto);

      // Assert
      expect(result).toEqual(updatedTemplate);
      expect(composable.templates.value).toHaveLength(0);
    });

    it('should handle update errors and return null', async () => {
      // Arrange
      const error = new EmailTemplateApiServiceError('Update failed', 'UPDATE_ERROR');
      (emailTemplateApiService.updateTemplate as any).mockRejectedValue(error);
      const composable = useEmailTemplates();

      // Act
      const result = await composable.updateTemplate('template-123', updateDto);

      // Assert
      expect(result).toBe(null);
      expect(composable.error.value).toBe('Update failed');
      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Update Template Failed',
        detail: 'Update failed',
        life: 5000,
      });
    });
  });

  describe('deleteTemplate', () => {
    it('should delete template successfully', async () => {
      // Arrange
      (emailTemplateApiService.getAllTemplates as any).mockResolvedValue([mockTemplate]);
      (emailTemplateApiService.deleteTemplate as any).mockResolvedValue(true);
      const composable = useEmailTemplates();
      await composable.fetchTemplates();

      // Act
      const result = await composable.deleteTemplate('template-123');

      // Assert
      expect(emailTemplateApiService.deleteTemplate).toHaveBeenCalledWith('template-123');
      expect(result).toBe(true);
      expect(composable.templates.value.some(t => t.id === mockTemplate.id)).toBe(false);
      expect(composable.lastUpdated.value).toBeInstanceOf(Date);
      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Template Deleted',
        detail: `Template "${mockTemplate.displayName}" has been deleted successfully.`,
        life: 3000,
      });
    });

    it('should remove template from selected templates', async () => {
      // Arrange
      (emailTemplateApiService.getAllTemplates as any).mockResolvedValue([mockTemplate]);
      (emailTemplateApiService.deleteTemplate as any).mockResolvedValue(true);
      const composable = useEmailTemplates();
      await composable.fetchTemplates();
      composable.toggleTemplateSelection(mockTemplate);

      // Act
      await composable.deleteTemplate('template-123');

      // Assert
      expect(composable.selectedTemplates.value.some(t => t.id === mockTemplate.id)).toBe(false);
    });

    it('should handle missing template displayName', async () => {
      // Arrange
      (emailTemplateApiService.deleteTemplate as any).mockResolvedValue(true);
      const composable = useEmailTemplates();

      // Act
      await composable.deleteTemplate('template-999');

      // Assert
      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Template Deleted',
        detail: 'Template "template-999" has been deleted successfully.',
        life: 3000,
      });
    });

    it('should handle delete errors and return false', async () => {
      // Arrange
      const error = new EmailTemplateApiServiceError('Delete failed', 'DELETE_ERROR');
      (emailTemplateApiService.deleteTemplate as any).mockRejectedValue(error);
      const composable = useEmailTemplates();

      // Act
      const result = await composable.deleteTemplate('template-123');

      // Assert
      expect(result).toBe(false);
      expect(composable.error.value).toBe('Delete failed');
      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Delete Template Failed',
        detail: 'Delete failed',
        life: 5000,
      });
    });
  });

  describe('duplicateTemplate', () => {
    it('should duplicate template successfully', async () => {
      // Arrange
      const duplicatedTemplate = { ...mockTemplate, id: 'template-duplicate', name: 'welcome_email_copy' };
      (emailTemplateApiService.duplicateTemplate as any).mockResolvedValue(duplicatedTemplate);
      const composable = useEmailTemplates();

      // Act
      const result = await composable.duplicateTemplate('template-123');

      // Assert
      expect(emailTemplateApiService.duplicateTemplate).toHaveBeenCalledWith('template-123');
      expect(result).toEqual(duplicatedTemplate);
      expect(composable.templates.value.some(t => t.id === duplicatedTemplate.id)).toBe(true);
      expect(composable.lastUpdated.value).toBeInstanceOf(Date);
      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Template Duplicated',
        detail: `Template "${duplicatedTemplate.displayName}" has been created successfully.`,
        life: 3000,
      });
    });

    it('should handle duplicate errors and return null', async () => {
      // Arrange
      const error = new EmailTemplateApiServiceError('Duplicate failed', 'DUPLICATE_ERROR');
      (emailTemplateApiService.duplicateTemplate as any).mockRejectedValue(error);
      const composable = useEmailTemplates();

      // Act
      const result = await composable.duplicateTemplate('template-123');

      // Assert
      expect(result).toBe(null);
      expect(composable.error.value).toBe('Duplicate failed');
      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Duplicate Template Failed',
        detail: 'Duplicate failed',
        life: 5000,
      });
    });
  });

  describe('previewTemplate', () => {
    const mockPreview: TemplatePreviewResponse = {
      subject: 'Welcome John',
      htmlBody: '<p>Welcome John!</p>',
      textBody: 'Welcome John!',
    };

    it('should preview template successfully', async () => {
      // Arrange
      const variables = { firstName: 'John' };
      (emailTemplateApiService.previewTemplate as any).mockResolvedValue(mockPreview);
      const composable = useEmailTemplates();

      // Act
      const result = await composable.previewTemplate('template-123', variables);

      // Assert
      expect(emailTemplateApiService.previewTemplate).toHaveBeenCalledWith('template-123', variables);
      expect(result).toEqual(mockPreview);
    });

    it('should preview template without variables', async () => {
      // Arrange
      (emailTemplateApiService.previewTemplate as any).mockResolvedValue(mockPreview);
      const composable = useEmailTemplates();

      // Act
      const result = await composable.previewTemplate('template-123');

      // Assert
      expect(emailTemplateApiService.previewTemplate).toHaveBeenCalledWith('template-123', undefined);
      expect(result).toEqual(mockPreview);
    });

    it('should handle preview errors and return null', async () => {
      // Arrange
      const error = new EmailTemplateApiServiceError('Preview failed', 'PREVIEW_ERROR');
      (emailTemplateApiService.previewTemplate as any).mockRejectedValue(error);
      const composable = useEmailTemplates();

      // Act
      const result = await composable.previewTemplate('template-123');

      // Assert
      expect(result).toBe(null);
      expect(composable.error.value).toBe('Preview failed');
      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Preview Template Failed',
        detail: 'Preview failed',
        life: 5000,
      });
    });
  });

  describe('sendTestEmail', () => {
    const mockSendResult: EmailSendResult = {
      success: true,
      emailLogId: 'log-123',
      messageId: 'msg-123',
    };

    it('should send test email successfully', async () => {
      // Arrange
      const variables = { firstName: 'John' };
      (emailTemplateApiService.sendTestEmail as any).mockResolvedValue(mockSendResult);
      const composable = useEmailTemplates();

      // Act
      const result = await composable.sendTestEmail('template-123', 'test@example.com', variables);

      // Assert
      expect(emailTemplateApiService.sendTestEmail).toHaveBeenCalledWith('template-123', 'test@example.com', variables);
      expect(result).toEqual(mockSendResult);
      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Test Email Sent',
        detail: 'Test email has been sent to test@example.com.',
        life: 3000,
      });
    });

    it('should send test email without variables', async () => {
      // Arrange
      (emailTemplateApiService.sendTestEmail as any).mockResolvedValue(mockSendResult);
      const composable = useEmailTemplates();

      // Act
      const result = await composable.sendTestEmail('template-123', 'test@example.com');

      // Assert
      expect(emailTemplateApiService.sendTestEmail).toHaveBeenCalledWith('template-123', 'test@example.com', undefined);
      expect(result).toEqual(mockSendResult);
    });

    it('should handle failed send result', async () => {
      // Arrange
      const failedResult: EmailSendResult = {
        success: false,
        error: 'Invalid email address',
      };
      (emailTemplateApiService.sendTestEmail as any).mockResolvedValue(failedResult);
      const composable = useEmailTemplates();

      // Act
      const result = await composable.sendTestEmail('template-123', 'invalid-email');

      // Assert
      expect(result).toBe(null);
      expect(composable.error.value).toBe('Invalid email address');
      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Send Test Email Failed',
        detail: 'Invalid email address',
        life: 5000,
      });
    });

    it('should handle send errors', async () => {
      // Arrange
      const error = new EmailTemplateApiServiceError('Send failed', 'SEND_ERROR');
      (emailTemplateApiService.sendTestEmail as any).mockRejectedValue(error);
      const composable = useEmailTemplates();

      // Act
      const result = await composable.sendTestEmail('template-123', 'test@example.com');

      // Assert
      expect(result).toBe(null);
      expect(composable.error.value).toBe('Send failed');
      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Send Test Email Failed',
        detail: 'Send failed',
        life: 5000,
      });
    });

    it('should handle failed result without error message', async () => {
      // Arrange
      const failedResult: EmailSendResult = {
        success: false,
      };
      (emailTemplateApiService.sendTestEmail as any).mockResolvedValue(failedResult);
      const composable = useEmailTemplates();

      // Act
      const result = await composable.sendTestEmail('template-123', 'test@example.com');

      // Assert
      expect(result).toBe(null);
      expect(composable.error.value).toBe('Failed to send test email');
    });
  });

  describe('refreshData', () => {
    it('should refresh templates and categories', async () => {
      // Arrange
      (emailTemplateApiService.getAllTemplates as any).mockResolvedValue([mockTemplate]);
      (emailTemplateApiService.getCategories as any).mockResolvedValue(mockCategories);
      const composable = useEmailTemplates();

      // Act
      await composable.refreshData();

      // Assert
      expect(emailTemplateApiService.getAllTemplates).toHaveBeenCalled();
      expect(emailTemplateApiService.getCategories).toHaveBeenCalled();
      expect(composable.templates.value).toEqual([mockTemplate]);
      expect(composable.categories.value).toEqual(mockCategories);
    });

    it('should handle errors during refresh', async () => {
      // Arrange
      const error = new Error('Refresh failed');
      (emailTemplateApiService.getAllTemplates as any).mockRejectedValue(error);
      (emailTemplateApiService.getCategories as any).mockResolvedValue(mockCategories);
      const composable = useEmailTemplates();

      // Act
      await composable.refreshData();

      // Assert
      expect(composable.error.value).toBe('Refresh failed');
      expect(composable.categories.value).toEqual(mockCategories);
    });
  });

  describe('Computed Properties', () => {
    it('should calculate totalTemplates correctly', async () => {
      // Arrange
      (emailTemplateApiService.getAllTemplates as any).mockResolvedValue([mockTemplate, mockInactiveTemplate, mockSystemTemplate]);
      const composable = useEmailTemplates();

      // Act
      await composable.fetchTemplates();

      // Assert
      expect(composable.totalTemplates.value).toBe(3);
    });

    it('should calculate activeTemplates correctly', async () => {
      // Arrange
      (emailTemplateApiService.getAllTemplates as any).mockResolvedValue([mockTemplate, mockInactiveTemplate, mockSystemTemplate]);
      const composable = useEmailTemplates();

      // Act
      await composable.fetchTemplates();

      // Assert
      expect(composable.activeTemplates.value).toBe(2);
    });

    it('should calculate systemTemplates correctly', async () => {
      // Arrange
      (emailTemplateApiService.getAllTemplates as any).mockResolvedValue([mockTemplate, mockInactiveTemplate, mockSystemTemplate]);
      const composable = useEmailTemplates();

      // Act
      await composable.fetchTemplates();

      // Assert
      expect(composable.systemTemplates.value).toBe(2);
    });
  });

  describe('Filtering Logic', () => {
    it('should filter templates by search term in name', async () => {
      // Arrange
      (emailTemplateApiService.getAllTemplates as any).mockResolvedValue([
        mockTemplate,
        mockInactiveTemplate,
        mockSystemTemplate,
      ]);
      const composable = useEmailTemplates();
      await composable.fetchTemplates();

      // Act
      composable.filters.search = 'welcome';

      // Assert
      expect(composable.filteredTemplates.value).toHaveLength(1);
      expect(composable.filteredTemplates.value[0].name).toBe('welcome_email');
    });

    it('should filter templates by search term in displayName', async () => {
      // Arrange
      (emailTemplateApiService.getAllTemplates as any).mockResolvedValue([
        mockTemplate,
        mockInactiveTemplate,
        mockSystemTemplate,
      ]);
      const composable = useEmailTemplates();
      await composable.fetchTemplates();

      // Act
      composable.filters.search = 'Inactive';

      // Assert
      expect(composable.filteredTemplates.value).toHaveLength(1);
      expect(composable.filteredTemplates.value[0].displayName).toBe('Inactive Email');
    });

    it('should filter templates by search term in description', async () => {
      // Arrange
      (emailTemplateApiService.getAllTemplates as any).mockResolvedValue([
        mockTemplate,
        mockInactiveTemplate,
        mockSystemTemplate,
      ]);
      const composable = useEmailTemplates();
      await composable.fetchTemplates();

      // Act
      composable.filters.search = 'new users';

      // Assert
      expect(composable.filteredTemplates.value).toHaveLength(1);
      expect(composable.filteredTemplates.value[0].id).toBe('template-123');
    });

    it('should filter templates by search term in subject', async () => {
      // Arrange
      (emailTemplateApiService.getAllTemplates as any).mockResolvedValue([
        mockTemplate,
        mockInactiveTemplate,
        mockSystemTemplate,
      ]);
      const composable = useEmailTemplates();
      await composable.fetchTemplates();

      // Act
      composable.filters.search = 'platform';

      // Assert
      expect(composable.filteredTemplates.value).toHaveLength(1);
    });

    it('should be case-insensitive when searching', async () => {
      // Arrange
      (emailTemplateApiService.getAllTemplates as any).mockResolvedValue([
        mockTemplate,
        mockInactiveTemplate,
        mockSystemTemplate,
      ]);
      const composable = useEmailTemplates();
      await composable.fetchTemplates();

      // Act
      composable.filters.search = 'WELCOME';

      // Assert
      expect(composable.filteredTemplates.value).toHaveLength(1);
    });

    it('should filter templates by category', async () => {
      // Arrange
      (emailTemplateApiService.getAllTemplates as any).mockResolvedValue([
        mockTemplate,
        mockInactiveTemplate,
        mockSystemTemplate,
      ]);
      const composable = useEmailTemplates();
      await composable.fetchTemplates();

      // Act
      composable.filters.category = 'SYSTEM' as EmailCategory;

      // Assert
      expect(composable.filteredTemplates.value).toHaveLength(1);
      expect(composable.filteredTemplates.value[0].category).toBe('SYSTEM');
    });

    it('should filter templates by isActive status', async () => {
      // Arrange
      (emailTemplateApiService.getAllTemplates as any).mockResolvedValue([
        mockTemplate,
        mockInactiveTemplate,
        mockSystemTemplate,
      ]);
      const composable = useEmailTemplates();
      await composable.fetchTemplates();

      // Act
      composable.filters.isActive = false;

      // Assert
      expect(composable.filteredTemplates.value).toHaveLength(1);
      expect(composable.filteredTemplates.value[0].isActive).toBe(false);
    });

    it('should filter templates by isSystem status', async () => {
      // Arrange
      (emailTemplateApiService.getAllTemplates as any).mockResolvedValue([
        mockTemplate,
        mockInactiveTemplate,
        mockSystemTemplate,
      ]);
      const composable = useEmailTemplates();
      await composable.fetchTemplates();

      // Act
      composable.filters.isSystem = true;

      // Assert
      expect(composable.filteredTemplates.value).toHaveLength(2);
      expect(composable.filteredTemplates.value.every(t => t.isSystem)).toBe(true);
    });

    it('should apply multiple filters simultaneously', async () => {
      // Arrange
      (emailTemplateApiService.getAllTemplates as any).mockResolvedValue([
        mockTemplate,
        mockInactiveTemplate,
        mockSystemTemplate,
      ]);
      const composable = useEmailTemplates();
      await composable.fetchTemplates();

      // Act
      composable.filters.isActive = true;
      composable.filters.isSystem = false;

      // Assert
      expect(composable.filteredTemplates.value).toHaveLength(1);
      expect(composable.filteredTemplates.value[0].id).toBe('template-123');
    });

    it('should return all templates when no filters applied', async () => {
      // Arrange
      (emailTemplateApiService.getAllTemplates as any).mockResolvedValue([
        mockTemplate,
        mockInactiveTemplate,
        mockSystemTemplate,
      ]);
      const composable = useEmailTemplates();
      await composable.fetchTemplates();

      // Assert
      expect(composable.filteredTemplates.value).toHaveLength(3);
    });

    it('should handle empty search string', async () => {
      // Arrange
      (emailTemplateApiService.getAllTemplates as any).mockResolvedValue([
        mockTemplate,
        mockInactiveTemplate,
        mockSystemTemplate,
      ]);
      const composable = useEmailTemplates();
      await composable.fetchTemplates();

      // Act
      composable.filters.search = '   ';

      // Assert
      expect(composable.filteredTemplates.value).toHaveLength(3);
    });

    it('should return empty array when no matches found', async () => {
      // Arrange
      (emailTemplateApiService.getAllTemplates as any).mockResolvedValue([
        mockTemplate,
        mockInactiveTemplate,
        mockSystemTemplate,
      ]);
      const composable = useEmailTemplates();
      await composable.fetchTemplates();

      // Act
      composable.filters.search = 'nonexistent';

      // Assert
      expect(composable.filteredTemplates.value).toHaveLength(0);
    });
  });

  describe('Filter Management', () => {
    it('should clear all filters', async () => {
      // Arrange
      const composable = useEmailTemplates();
      composable.filters.search = 'test';
      composable.filters.category = 'ACCOUNT' as EmailCategory;
      composable.filters.isActive = true;
      composable.filters.isSystem = false;

      // Act
      composable.clearFilters();

      // Assert
      expect(composable.filters.search).toBe('');
      expect(composable.filters.category).toBe(null);
      expect(composable.filters.isActive).toBe(null);
      expect(composable.filters.isSystem).toBe(null);
    });

    it('should clear error state when filter changes', async () => {
      // Arrange
      const error = new Error('Test error');
      (emailTemplateApiService.getAllTemplates as any).mockRejectedValue(error);
      const composable = useEmailTemplates();
      await composable.fetchTemplates();
      expect(composable.error.value).toBe('Test error');

      // Act
      composable.filters.search = 'new search';

      // Wait for watcher to execute
      await new Promise(resolve => setTimeout(resolve, 0));

      // Assert
      expect(composable.error.value).toBe(null);
    });
  });

  describe('Template Selection Utilities', () => {
    it('should get template by ID', async () => {
      // Arrange
      (emailTemplateApiService.getAllTemplates as any).mockResolvedValue([mockTemplate, mockInactiveTemplate]);
      const composable = useEmailTemplates();
      await composable.fetchTemplates();

      // Act
      const result = composable.getTemplateById('template-123');

      // Assert
      expect(result).toEqual(mockTemplate);
    });

    it('should return undefined for non-existent template', async () => {
      // Arrange
      (emailTemplateApiService.getAllTemplates as any).mockResolvedValue([mockTemplate]);
      const composable = useEmailTemplates();
      await composable.fetchTemplates();

      // Act
      const result = composable.getTemplateById('non-existent');

      // Assert
      expect(result).toBeUndefined();
    });

    it('should check if template is selected', () => {
      // Arrange
      const composable = useEmailTemplates();
      composable.selectedTemplates.value.push(mockTemplate);

      // Act
      const isSelected = composable.isTemplateSelected('template-123');
      const isNotSelected = composable.isTemplateSelected('template-456');

      // Assert
      expect(isSelected).toBe(true);
      expect(isNotSelected).toBe(false);
    });

    it('should toggle template selection - add', () => {
      // Arrange
      const composable = useEmailTemplates();

      // Act
      composable.toggleTemplateSelection(mockTemplate);

      // Assert
      expect(composable.selectedTemplates.value.some(t => t.id === mockTemplate.id)).toBe(true);
      expect(composable.selectedTemplates.value).toHaveLength(1);
    });

    it('should toggle template selection - remove', () => {
      // Arrange
      const composable = useEmailTemplates();
      composable.selectedTemplates.value.push(mockTemplate);

      // Act
      composable.toggleTemplateSelection(mockTemplate);

      // Assert
      expect(composable.selectedTemplates.value).not.toContain(mockTemplate);
      expect(composable.selectedTemplates.value).toHaveLength(0);
    });

    it('should clear all selections', () => {
      // Arrange
      const composable = useEmailTemplates();
      composable.selectedTemplates.value.push(mockTemplate, mockInactiveTemplate);

      // Act
      composable.clearSelection();

      // Assert
      expect(composable.selectedTemplates.value).toHaveLength(0);
    });

    it('should select all visible templates', async () => {
      // Arrange
      (emailTemplateApiService.getAllTemplates as any).mockResolvedValue([
        mockTemplate,
        mockInactiveTemplate,
        mockSystemTemplate,
      ]);
      const composable = useEmailTemplates();
      await composable.fetchTemplates();
      composable.filters.isActive = true;

      // Act
      composable.selectAllVisible();

      // Assert
      expect(composable.selectedTemplates.value).toHaveLength(2);
      expect(composable.selectedTemplates.value.every(t => t.isActive)).toBe(true);
    });
  });

  describe('Readonly State Protection', () => {
    it('should expose templates as readonly by preventing direct value assignment', async () => {
      // Arrange
      (emailTemplateApiService.getAllTemplates as any).mockResolvedValue([mockTemplate]);
      const composable = useEmailTemplates();
      await composable.fetchTemplates();

      // Act - Try to assign directly (this won't work with readonly)
      const originalValue = composable.templates.value;
      try {
        (composable.templates as any).value = [];
      } catch (e) {
        // Expected to fail
      }

      // Assert - Value should remain unchanged
      expect(composable.templates.value).toBe(originalValue);
      expect(composable.templates.value).toHaveLength(1);
    });

    it('should expose loading as readonly', async () => {
      // Arrange
      const composable = useEmailTemplates();
      const originalValue = composable.loading.value;

      // Act - Try to assign directly
      try {
        (composable.loading as any).value = true;
      } catch (e) {
        // Expected to fail
      }

      // Assert
      expect(composable.loading.value).toBe(originalValue);
    });

    it('should expose error as readonly', () => {
      // Arrange
      const composable = useEmailTemplates();
      const originalValue = composable.error.value;

      // Act - Try to assign directly
      try {
        (composable.error as any).value = 'error';
      } catch (e) {
        // Expected to fail
      }

      // Assert
      expect(composable.error.value).toBe(originalValue);
    });

    it('should expose categories as readonly', async () => {
      // Arrange
      (emailTemplateApiService.getCategories as any).mockResolvedValue(mockCategories);
      const composable = useEmailTemplates();
      await composable.fetchCategories();
      const originalValue = composable.categories.value;

      // Act - Try to assign directly
      try {
        (composable.categories as any).value = [];
      } catch (e) {
        // Expected to fail
      }

      // Assert
      expect(composable.categories.value).toBe(originalValue);
    });

    it('should expose lastUpdated as readonly', async () => {
      // Arrange
      (emailTemplateApiService.getAllTemplates as any).mockResolvedValue([mockTemplate]);
      const composable = useEmailTemplates();
      await composable.fetchTemplates();
      const originalValue = composable.lastUpdated.value;

      // Act - Try to assign directly
      try {
        (composable.lastUpdated as any).value = new Date();
      } catch (e) {
        // Expected to fail
      }

      // Assert
      expect(composable.lastUpdated.value).toBe(originalValue);
    });

    it('should allow mutation of selectedTemplates', () => {
      // Arrange
      const composable = useEmailTemplates();

      // Act & Assert
      expect(() => {
        composable.selectedTemplates.value = [mockTemplate];
      }).not.toThrow();
      expect(composable.selectedTemplates.value).toEqual([mockTemplate]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined description in search filter', async () => {
      // Arrange
      const templateWithoutDescription = { ...mockTemplate, description: undefined };
      (emailTemplateApiService.getAllTemplates as any).mockResolvedValue([templateWithoutDescription]);
      const composable = useEmailTemplates();
      await composable.fetchTemplates();

      // Act
      composable.filters.search = 'test';

      // Assert
      expect(composable.filteredTemplates.value).toHaveLength(0);
    });

    it('should handle multiple simultaneous operations', async () => {
      // Arrange
      (emailTemplateApiService.createTemplate as any).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockTemplate), 10))
      );
      (emailTemplateApiService.updateTemplate as any).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockTemplate), 10))
      );
      const composable = useEmailTemplates();

      // Act
      const createPromise = composable.createTemplate({
        name: 'test',
        displayName: 'Test',
        subject: 'Test',
        htmlBody: '<p>Test</p>',
        textBody: 'Test',
        category: 'ACCOUNT' as EmailCategory,
        variables: [],
      });
      const updatePromise = composable.updateTemplate('template-123', { subject: 'Updated' });

      // Assert
      await Promise.all([createPromise, updatePromise]);
      expect(composable.loading.value).toBe(false);
    });

    it('should maintain template order after update', async () => {
      // Arrange
      const template1 = { ...mockTemplate, id: 'template-1', name: 'template_1' };
      const template2 = { ...mockTemplate, id: 'template-2', name: 'template_2' };
      const template3 = { ...mockTemplate, id: 'template-3', name: 'template_3' };
      const updatedTemplate2 = { ...template2, displayName: 'Updated Template 2' };

      (emailTemplateApiService.getAllTemplates as any).mockResolvedValue([template1, template2, template3]);
      (emailTemplateApiService.updateTemplate as any).mockResolvedValue(updatedTemplate2);
      const composable = useEmailTemplates();
      await composable.fetchTemplates();

      // Act
      await composable.updateTemplate('template-2', { displayName: 'Updated Template 2' });

      // Assert
      expect(composable.templates.value).toHaveLength(3);
      expect(composable.templates.value[0].id).toBe('template-1');
      expect(composable.templates.value[1].id).toBe('template-2');
      expect(composable.templates.value[1].displayName).toBe('Updated Template 2');
      expect(composable.templates.value[2].id).toBe('template-3');
    });
  });
});
