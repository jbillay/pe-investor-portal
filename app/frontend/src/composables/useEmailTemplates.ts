/**
 * Email Template Management Composable
 * Provides reactive state management for email template-related operations
 * Follows Vue.js 3 Composition API best practices with proper error handling
 */

import { ref, computed, reactive, watch, readonly, toRef, type Ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import { emailTemplateApiService, EmailTemplateApiServiceError } from '@/services/emailTemplateApiService';
import type {
  EmailTemplate,
  EmailCategory,
  CreateEmailTemplateDto,
  UpdateEmailTemplateDto,
  TemplatePreviewResponse,
  EmailSendResult,
} from '@/types/email';

/**
 * Email template filters interface
 */
interface TemplateFilters {
  search: string;
  category: EmailCategory | null;
  isActive: boolean | null;
  isSystem: boolean | null;
}

/**
 * Email template state interface
 */
interface TemplateState {
  templates: EmailTemplate[];
  selectedTemplates: EmailTemplate[];
  loading: boolean;
  error: string | null;
  categories: EmailCategory[];
  lastUpdated: Date | null;
}

/**
 * Email template composable return type
 */
interface UseEmailTemplatesReturn {
  // State
  templates: Readonly<Ref<EmailTemplate[]>>;
  selectedTemplates: Ref<EmailTemplate[]>;
  loading: Readonly<Ref<boolean>>;
  error: Readonly<Ref<string | null>>;
  categories: Readonly<Ref<EmailCategory[]>>;
  lastUpdated: Readonly<Ref<Date | null>>;

  // Computed
  filteredTemplates: Readonly<Ref<EmailTemplate[]>>;
  totalTemplates: Readonly<Ref<number>>;
  activeTemplates: Readonly<Ref<number>>;
  systemTemplates: Readonly<Ref<number>>;

  // Filters
  filters: TemplateFilters;
  clearFilters: () => void;

  // Actions
  fetchTemplates: (params?: any) => Promise<void>;
  fetchCategories: () => Promise<void>;
  createTemplate: (templateData: CreateEmailTemplateDto) => Promise<EmailTemplate | null>;
  updateTemplate: (templateId: string, templateData: UpdateEmailTemplateDto) => Promise<EmailTemplate | null>;
  deleteTemplate: (templateId: string) => Promise<boolean>;
  duplicateTemplate: (templateId: string) => Promise<EmailTemplate | null>;
  previewTemplate: (templateId: string, variables?: Record<string, any>) => Promise<TemplatePreviewResponse | null>;
  sendTestEmail: (templateId: string, recipientEmail: string, variables?: Record<string, any>) => Promise<EmailSendResult | null>;
  refreshData: () => Promise<void>;

  // Utilities
  getTemplateById: (templateId: string) => EmailTemplate | undefined;
  isTemplateSelected: (templateId: string) => boolean;
  toggleTemplateSelection: (template: EmailTemplate) => void;
  clearSelection: () => void;
  selectAllVisible: () => void;
}

/**
 * Create email template management composable
 * Provides centralized state management for email template operations
 */
export function useEmailTemplates(): UseEmailTemplatesReturn {
  // Composables
  const toast = useToast();

  // Reactive state
  const state = reactive<TemplateState>({
    templates: [],
    selectedTemplates: [],
    loading: false,
    error: null,
    categories: [],
    lastUpdated: null
  });

  // Reactive filters
  const filters = reactive<TemplateFilters>({
    search: '',
    category: null,
    isActive: null,
    isSystem: null
  });

  // Computed properties
  const filteredTemplates = computed(() => {
    let filtered = state.templates;

    // Search filter
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchTerm) ||
        template.displayName.toLowerCase().includes(searchTerm) ||
        template.description?.toLowerCase().includes(searchTerm) ||
        template.subject.toLowerCase().includes(searchTerm)
      );
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(template => template.category === filters.category);
    }

    // Active status filter
    if (filters.isActive !== null) {
      filtered = filtered.filter(template => template.isActive === filters.isActive);
    }

    // System template filter
    if (filters.isSystem !== null) {
      filtered = filtered.filter(template => template.isSystem === filters.isSystem);
    }

    return filtered;
  });

  const totalTemplates = computed(() => state.templates.length);
  const activeTemplates = computed(() => state.templates.filter(t => t.isActive).length);
  const systemTemplates = computed(() => state.templates.filter(t => t.isSystem).length);

  /**
   * Error handling utility
   */
  const handleError = (error: any, operation: string) => {
    console.error(`Error in ${operation}:`, error);

    let errorMessage = 'An unexpected error occurred';

    if (error instanceof EmailTemplateApiServiceError) {
      errorMessage = error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    state.error = errorMessage;
    toast.add({
      severity: 'error',
      summary: `${operation} Failed`,
      detail: errorMessage,
      life: 5000
    });
  };

  /**
   * Success notification utility
   */
  const showSuccess = (message: string, detail?: string) => {
    toast.add({
      severity: 'success',
      summary: message,
      detail: detail,
      life: 3000
    });
  };

  /**
   * Fetches all email templates from the API
   */
  const fetchTemplates = async (params?: any): Promise<void> => {
    try {
      state.loading = true;
      state.error = null;

      const fetchedTemplates = await emailTemplateApiService.getAllTemplates(params);
      state.templates = fetchedTemplates;
      state.lastUpdated = new Date();

    } catch (error) {
      handleError(error, 'Fetch Templates');
    } finally {
      state.loading = false;
    }
  };

  /**
   * Fetches available template categories
   */
  const fetchCategories = async (): Promise<void> => {
    try {
      const categories = await emailTemplateApiService.getCategories();
      state.categories = categories;
    } catch (error) {
      console.warn('Failed to fetch template categories:', error);
      // Don't show error toast for categories, use default enum values
    }
  };

  /**
   * Creates a new email template
   */
  const createTemplate = async (templateData: CreateEmailTemplateDto): Promise<EmailTemplate | null> => {
    try {
      state.loading = true;
      state.error = null;

      const newTemplate = await emailTemplateApiService.createTemplate(templateData);

      // Add to local state
      state.templates.push(newTemplate);
      state.lastUpdated = new Date();

      showSuccess('Template Created', `Template "${newTemplate.displayName}" has been created successfully.`);

      return newTemplate;
    } catch (error) {
      handleError(error, 'Create Template');
      return null;
    } finally {
      state.loading = false;
    }
  };

  /**
   * Updates an existing email template
   */
  const updateTemplate = async (templateId: string, templateData: UpdateEmailTemplateDto): Promise<EmailTemplate | null> => {
    try {
      state.loading = true;
      state.error = null;

      const updatedTemplate = await emailTemplateApiService.updateTemplate(templateId, templateData);

      // Update local state
      const index = state.templates.findIndex(t => t.id === templateId);
      if (index !== -1) {
        state.templates[index] = updatedTemplate;
      }
      state.lastUpdated = new Date();

      showSuccess('Template Updated', `Template "${updatedTemplate.displayName}" has been updated successfully.`);

      return updatedTemplate;
    } catch (error) {
      handleError(error, 'Update Template');
      return null;
    } finally {
      state.loading = false;
    }
  };

  /**
   * Deletes an email template
   */
  const deleteTemplate = async (templateId: string): Promise<boolean> => {
    try {
      state.loading = true;
      state.error = null;

      const template = state.templates.find(t => t.id === templateId);
      await emailTemplateApiService.deleteTemplate(templateId);

      // Remove from local state
      state.templates = state.templates.filter(t => t.id !== templateId);
      state.selectedTemplates = state.selectedTemplates.filter(t => t.id !== templateId);
      state.lastUpdated = new Date();

      showSuccess('Template Deleted', `Template "${template?.displayName || templateId}" has been deleted successfully.`);

      return true;
    } catch (error) {
      handleError(error, 'Delete Template');
      return false;
    } finally {
      state.loading = false;
    }
  };

  /**
   * Duplicates an email template
   */
  const duplicateTemplate = async (templateId: string): Promise<EmailTemplate | null> => {
    try {
      state.loading = true;
      state.error = null;

      const duplicatedTemplate = await emailTemplateApiService.duplicateTemplate(templateId);

      // Add to local state
      state.templates.push(duplicatedTemplate);
      state.lastUpdated = new Date();

      showSuccess('Template Duplicated', `Template "${duplicatedTemplate.displayName}" has been created successfully.`);

      return duplicatedTemplate;
    } catch (error) {
      handleError(error, 'Duplicate Template');
      return null;
    } finally {
      state.loading = false;
    }
  };

  /**
   * Previews a template with variable substitution
   */
  const previewTemplate = async (templateId: string, variables?: Record<string, any>, variableSchema?: any[]): Promise<TemplatePreviewResponse | null> => {
    try {
      state.loading = true;
      state.error = null;

      const preview = await emailTemplateApiService.previewTemplate(templateId, variables, variableSchema);

      return preview;
    } catch (error) {
      handleError(error, 'Preview Template');
      return null;
    } finally {
      state.loading = false;
    }
  };

  /**
   * Sends a test email using a template
   */
  const sendTestEmail = async (
    templateId: string,
    recipientEmail: string,
    variables?: Record<string, any>,
    variableSchema?: any[]
  ): Promise<EmailSendResult | null> => {
    try {
      state.loading = true;
      state.error = null;

      const result = await emailTemplateApiService.sendTestEmail(templateId, recipientEmail, variables, variableSchema);

      if (result.success) {
        showSuccess('Test Email Sent', `Test email has been sent to ${recipientEmail}.`);
      } else {
        throw new Error(result.error || 'Failed to send test email');
      }

      return result;
    } catch (error) {
      handleError(error, 'Send Test Email');
      return null;
    } finally {
      state.loading = false;
    }
  };

  /**
   * Refreshes all template data
   */
  const refreshData = async (): Promise<void> => {
    await fetchTemplates();
    await fetchCategories();
  };

  /**
   * Utility: Get template by ID
   */
  const getTemplateById = (templateId: string): EmailTemplate | undefined => {
    return state.templates.find(template => template.id === templateId);
  };

  /**
   * Utility: Check if template is selected
   */
  const isTemplateSelected = (templateId: string): boolean => {
    return state.selectedTemplates.some(template => template.id === templateId);
  };

  /**
   * Utility: Toggle template selection
   */
  const toggleTemplateSelection = (template: EmailTemplate): void => {
    const index = state.selectedTemplates.findIndex(t => t.id === template.id);
    if (index === -1) {
      state.selectedTemplates.push(template);
    } else {
      state.selectedTemplates.splice(index, 1);
    }
  };

  /**
   * Utility: Clear all selections
   */
  const clearSelection = (): void => {
    state.selectedTemplates = [];
  };

  /**
   * Utility: Select all visible templates
   */
  const selectAllVisible = (): void => {
    state.selectedTemplates = [...filteredTemplates.value];
  };

  /**
   * Utility: Clear all filters
   */
  const clearFilters = (): void => {
    filters.search = '';
    filters.category = null;
    filters.isActive = null;
    filters.isSystem = null;
  };

  // Watch for filter changes to clear error state
  watch([() => filters.search, () => filters.category, () => filters.isActive, () => filters.isSystem], () => {
    if (state.error) {
      state.error = null;
    }
  });

  // Return readonly refs and reactive objects
  return {
    // State (readonly)
    templates: readonly(toRef(state, 'templates')),
    selectedTemplates: toRef(state, 'selectedTemplates'),
    loading: readonly(toRef(state, 'loading')),
    error: readonly(toRef(state, 'error')),
    categories: readonly(toRef(state, 'categories')),
    lastUpdated: readonly(toRef(state, 'lastUpdated')),

    // Computed (readonly)
    filteredTemplates: readonly(filteredTemplates),
    totalTemplates: readonly(totalTemplates),
    activeTemplates: readonly(activeTemplates),
    systemTemplates: readonly(systemTemplates),

    // Filters (reactive)
    filters,
    clearFilters,

    // Actions
    fetchTemplates,
    fetchCategories,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    previewTemplate,
    sendTestEmail,
    refreshData,

    // Utilities
    getTemplateById,
    isTemplateSelected,
    toggleTemplateSelection,
    clearSelection,
    selectAllVisible
  };
}
