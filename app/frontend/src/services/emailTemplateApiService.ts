/**
 * Email Template API Service
 * Handles all email template-related API communications with comprehensive error handling
 * Follows enterprise-grade patterns with proper logging and type safety
 */

import { apiClient } from '@/composables/useApi';
import type {
  EmailTemplate,
  CreateEmailTemplateDto,
  UpdateEmailTemplateDto,
  TemplatePreviewDto,
  TemplatePreviewResponse,
  SendTestEmailDto,
  EmailSendResult,
  EmailCategory,
  TemplateVariable,
} from '@/types/email';

/**
 * Custom error class for email template-specific API errors
 */
export class EmailTemplateApiServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'EmailTemplateApiServiceError';
  }
}

/**
 * Email Template API Service Class
 * Centralized service for all email template-related API operations
 */
export class EmailTemplateApiService {
  private readonly baseUrl = '/admin/email-templates';

  /**
   * Handles API errors with proper error transformation
   */
  private handleApiError(error: any): never {
    // If it's already an EmailTemplateApiServiceError, just re-throw it
    if (error instanceof EmailTemplateApiServiceError) {
      throw error;
    }

    if (error.name === 'NetworkError') {
      throw new EmailTemplateApiServiceError(
        'Unable to connect to server. Please check your connection.',
        'NETWORK_ERROR'
      );
    }

    if (error.response?.data?.message) {
      // Log the full error response for debugging
      console.error('[API Error] Full response:', error.response.data);
      if (error.response.data.errors) {
        console.error('[API Error] Validation errors:', error.response.data.errors);
      }

      throw new EmailTemplateApiServiceError(
        error.response.data.message,
        error.response.data.code || 'API_ERROR',
        error.response.data.errors || error.response.data.details
      );
    }

    throw new EmailTemplateApiServiceError(
      error.message || 'An unexpected error occurred',
      'UNKNOWN_ERROR'
    );
  }

  /**
   * Fetches all email templates from the backend
   * @param params - Query parameters for filtering
   * @returns Promise<EmailTemplate[]> - Array of email templates
   */
  async getAllTemplates(params?: {
    category?: EmailCategory;
    isActive?: boolean;
    isSystem?: boolean;
    search?: string;
  }): Promise<EmailTemplate[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.category) queryParams.append('category', params.category);
      if (params?.isActive !== undefined) queryParams.append('isActive', String(params.isActive));
      if (params?.isSystem !== undefined) queryParams.append('isSystem', String(params.isSystem));
      if (params?.search) queryParams.append('search', params.search);

      const url = queryParams.toString() ? `${this.baseUrl}?${queryParams.toString()}` : this.baseUrl;
      const response = await apiClient.get<EmailTemplate[]>(url);

      // Handle both wrapped and unwrapped responses
      const templatesData = (response as any).data || response;

      if (!Array.isArray(templatesData)) {
        throw new EmailTemplateApiServiceError(
          'Invalid response format from server',
          'INVALID_RESPONSE'
        );
      }

      return templatesData;
    } catch (error) {
      console.error('Error fetching email templates:', error);
      this.handleApiError(error);
    }
  }

  /**
   * Fetches a single email template by ID
   * @param templateId - The template ID to fetch
   * @returns Promise<EmailTemplate> - The email template object
   */
  async getTemplateById(templateId: string): Promise<EmailTemplate> {
    try {
      if (!templateId?.trim()) {
        throw new EmailTemplateApiServiceError('Template ID is required', 'INVALID_TEMPLATE_ID');
      }

      const response = await apiClient.get<EmailTemplate>(`${this.baseUrl}/${templateId}`);
      let templateData = (response as any).data;

      // If no data property, the response itself is the template data
      if (templateData === undefined) {
        templateData = response;
      }

      if (!templateData || templateData === null) {
        throw new EmailTemplateApiServiceError('Template not found', 'TEMPLATE_NOT_FOUND');
      }

      return templateData;
    } catch (error) {
      console.error(`Error fetching email template ${templateId}:`, error);
      this.handleApiError(error);
    }
  }

  /**
   * Fetches a single email template by name
   * @param templateName - The template name to fetch
   * @returns Promise<EmailTemplate> - The email template object
   */
  async getTemplateByName(templateName: string): Promise<EmailTemplate> {
    try {
      if (!templateName?.trim()) {
        throw new EmailTemplateApiServiceError('Template name is required', 'INVALID_TEMPLATE_NAME');
      }

      const response = await apiClient.get<EmailTemplate>(`${this.baseUrl}/name/${templateName}`);
      let templateData = (response as any).data;

      if (templateData === undefined) {
        templateData = response;
      }

      if (!templateData || templateData === null) {
        throw new EmailTemplateApiServiceError('Template not found', 'TEMPLATE_NOT_FOUND');
      }

      return templateData;
    } catch (error) {
      console.error(`Error fetching email template by name ${templateName}:`, error);
      this.handleApiError(error);
    }
  }

  /**
   * Creates a new email template
   * @param templateData - The template creation data
   * @returns Promise<EmailTemplate> - The created template
   */
  async createTemplate(templateData: CreateEmailTemplateDto): Promise<EmailTemplate> {
    try {
      if (!templateData.name?.trim()) {
        throw new EmailTemplateApiServiceError('Template name is required', 'INVALID_TEMPLATE_NAME');
      }

      if (!templateData.displayName?.trim()) {
        throw new EmailTemplateApiServiceError('Display name is required', 'INVALID_DISPLAY_NAME');
      }

      if (!templateData.subject?.trim()) {
        throw new EmailTemplateApiServiceError('Subject is required', 'INVALID_SUBJECT');
      }

      const response = await apiClient.post<EmailTemplate>(this.baseUrl, templateData);
      const createdTemplate = (response as any).data || response;

      if (!createdTemplate) {
        throw new EmailTemplateApiServiceError('Failed to create template', 'CREATE_FAILED');
      }

      return createdTemplate;
    } catch (error) {
      console.error('Error creating email template:', error);
      this.handleApiError(error);
    }
  }

  /**
   * Updates an existing email template
   * @param templateId - The template ID to update
   * @param templateData - The template update data
   * @returns Promise<EmailTemplate> - The updated template
   */
  async updateTemplate(templateId: string, templateData: UpdateEmailTemplateDto): Promise<EmailTemplate> {
    try {
      if (!templateId?.trim()) {
        throw new EmailTemplateApiServiceError('Template ID is required for update', 'INVALID_TEMPLATE_ID');
      }

      const response = await apiClient.put<EmailTemplate>(`${this.baseUrl}/${templateId}`, templateData);
      const updatedTemplate = (response as any).data || response;

      if (!updatedTemplate) {
        throw new EmailTemplateApiServiceError('Failed to update template', 'UPDATE_FAILED');
      }

      return updatedTemplate;
    } catch (error) {
      console.error(`Error updating email template ${templateId}:`, error);
      this.handleApiError(error);
    }
  }

  /**
   * Deletes an email template by ID
   * @param templateId - The template ID to delete
   * @returns Promise<boolean> - Success status
   */
  async deleteTemplate(templateId: string): Promise<boolean> {
    try {
      if (!templateId?.trim()) {
        throw new EmailTemplateApiServiceError('Template ID is required', 'INVALID_TEMPLATE_ID');
      }

      await apiClient.delete(`${this.baseUrl}/${templateId}`);
      return true;
    } catch (error) {
      console.error(`Error deleting email template ${templateId}:`, error);
      this.handleApiError(error);
    }
  }

  /**
   * Duplicates an email template
   * @param templateId - The template ID to duplicate
   * @returns Promise<EmailTemplate> - The duplicated template
   */
  async duplicateTemplate(templateId: string): Promise<EmailTemplate> {
    try {
      if (!templateId?.trim()) {
        throw new EmailTemplateApiServiceError('Template ID is required', 'INVALID_TEMPLATE_ID');
      }

      const response = await apiClient.post<EmailTemplate>(`${this.baseUrl}/${templateId}/duplicate`);
      const duplicatedTemplate = (response as any).data || response;

      if (!duplicatedTemplate) {
        throw new EmailTemplateApiServiceError('Failed to duplicate template', 'DUPLICATE_FAILED');
      }

      return duplicatedTemplate;
    } catch (error) {
      console.error(`Error duplicating email template ${templateId}:`, error);
      this.handleApiError(error);
    }
  }

  /**
   * Previews a template with variable substitution
   * @param templateId - The template ID to preview
   * @param variables - Variables to substitute in the template
   * @returns Promise<TemplatePreviewResponse> - The rendered template
   */
  async previewTemplate(templateId: string, variables?: Record<string, any>, variableSchema?: any[]): Promise<TemplatePreviewResponse> {
    try {
      if (!templateId?.trim()) {
        throw new EmailTemplateApiServiceError('Template ID is required', 'INVALID_TEMPLATE_ID');
      }

      // Filter out empty string values and convert types based on schema
      const filteredVariables: Record<string, any> = {};
      if (variables) {
        Object.entries(variables).forEach(([key, value]) => {
          // Skip empty, null, or undefined values
          if (value === '' || value === null || value === undefined) {
            return;
          }

          // Find the variable schema to determine expected type
          const schema = variableSchema?.find((v: any) => v.name === key);

          if (schema) {
            // Convert string numbers to actual numbers for number/currency types
            if ((schema.type === 'number' || schema.type === 'currency') && typeof value === 'string') {
              const numValue = Number(value);
              if (!isNaN(numValue)) {
                filteredVariables[key] = numValue;
              } else {
                filteredVariables[key] = value; // Keep original if conversion fails
              }
            } else {
              filteredVariables[key] = value;
            }
          } else {
            // No schema found, keep as-is
            filteredVariables[key] = value;
          }
        });
      }

      const payload: TemplatePreviewDto = { variables: filteredVariables };
      console.log('[Preview] Sending payload:', JSON.stringify(payload, null, 2));

      const response = await apiClient.post<TemplatePreviewResponse>(
        `${this.baseUrl}/${templateId}/preview`,
        payload
      );
      const previewData = (response as any).data || response;

      if (!previewData) {
        throw new EmailTemplateApiServiceError('Failed to preview template', 'PREVIEW_FAILED');
      }

      return previewData;
    } catch (error) {
      console.error(`Error previewing email template ${templateId}:`, error);
      this.handleApiError(error);
    }
  }

  /**
   * Sends a test email using a template
   * @param templateId - The template ID to use
   * @param recipientEmail - Email address to send test to
   * @param variables - Variables to substitute in the template
   * @returns Promise<EmailSendResult> - The send result
   */
  async sendTestEmail(
    templateId: string,
    recipientEmail: string,
    variables?: Record<string, any>,
    variableSchema?: any[]
  ): Promise<EmailSendResult> {
    try {
      if (!templateId?.trim()) {
        throw new EmailTemplateApiServiceError('Template ID is required', 'INVALID_TEMPLATE_ID');
      }

      if (!recipientEmail?.trim()) {
        throw new EmailTemplateApiServiceError('Recipient email is required', 'INVALID_EMAIL');
      }

      // Filter out empty string values and convert types based on schema
      const filteredVariables: Record<string, any> = {};
      if (variables) {
        Object.entries(variables).forEach(([key, value]) => {
          // Skip empty, null, or undefined values
          if (value === '' || value === null || value === undefined) {
            return;
          }

          // Find the variable schema to determine expected type
          const schema = variableSchema?.find((v: any) => v.name === key);

          if (schema) {
            // Convert string numbers to actual numbers for number/currency types
            if ((schema.type === 'number' || schema.type === 'currency') && typeof value === 'string') {
              const numValue = Number(value);
              if (!isNaN(numValue)) {
                filteredVariables[key] = numValue;
              } else {
                filteredVariables[key] = value; // Keep original if conversion fails
              }
            } else {
              filteredVariables[key] = value;
            }
          } else {
            // No schema found, keep as-is
            filteredVariables[key] = value;
          }
        });
      }

      const payload: SendTestEmailDto = {
        recipientEmail,
        variables: filteredVariables,
      };

      const response = await apiClient.post<EmailSendResult>(
        `${this.baseUrl}/${templateId}/test`,
        payload
      );
      const sendResult = (response as any).data || response;

      if (!sendResult) {
        throw new EmailTemplateApiServiceError('Failed to send test email', 'SEND_FAILED');
      }

      return sendResult;
    } catch (error) {
      console.error(`Error sending test email for template ${templateId}:`, error);
      this.handleApiError(error);
    }
  }

  /**
   * Fetches available email template categories
   * @returns Promise<EmailCategory[]> - Array of categories
   */
  async getCategories(): Promise<EmailCategory[]> {
    try {
      const response = await apiClient.get<EmailCategory[]>(`${this.baseUrl}/meta/categories`);
      const categoriesData = (response as any).data || response;

      if (!Array.isArray(categoriesData)) {
        throw new EmailTemplateApiServiceError(
          'Invalid response format from server',
          'INVALID_RESPONSE'
        );
      }

      return categoriesData;
    } catch (error) {
      console.error('Error fetching email template categories:', error);
      this.handleApiError(error);
    }
  }

  /**
   * Fetches variables schema for a template
   * @param templateId - The template ID
   * @returns Promise<TemplateVariable[]> - Array of template variables
   */
  async getTemplateVariables(templateId: string): Promise<TemplateVariable[]> {
    try {
      if (!templateId?.trim()) {
        throw new EmailTemplateApiServiceError('Template ID is required', 'INVALID_TEMPLATE_ID');
      }

      const response = await apiClient.get<TemplateVariable[]>(`${this.baseUrl}/${templateId}/variables`);
      const variablesData = (response as any).data || response;

      if (!Array.isArray(variablesData)) {
        throw new EmailTemplateApiServiceError(
          'Invalid response format from server',
          'INVALID_RESPONSE'
        );
      }

      return variablesData;
    } catch (error) {
      console.error(`Error fetching template variables for ${templateId}:`, error);
      this.handleApiError(error);
    }
  }
}

/**
 * Export singleton instance of the email template API service
 */
export const emailTemplateApiService = new EmailTemplateApiService();
