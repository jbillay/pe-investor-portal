import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useEmailTemplates } from '../useEmailTemplates'
import { emailTemplateApiService } from '@/services/emailTemplateApiService'
import type { EmailTemplate, EmailCategory, CreateEmailTemplateDto, UpdateEmailTemplateDto } from '@/types/email'

// Mock dependencies
vi.mock('primevue/usetoast', () => ({
  useToast: () => ({
    add: vi.fn(),
  }),
}))

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
    constructor(message: string) {
      super(message)
      this.name = 'EmailTemplateApiServiceError'
    }
  },
}))

describe('useEmailTemplates', () => {
  const mockTemplate: EmailTemplate = {
    id: '1',
    name: 'welcome-email',
    displayName: 'Welcome Email',
    description: 'Welcome email for new users',
    category: 'USER_MANAGEMENT' as EmailCategory,
    subject: 'Welcome to our platform',
    bodyHtml: '<p>Welcome {{userName}}</p>',
    bodyText: 'Welcome {{userName}}',
    isActive: true,
    isSystem: false,
    variables: ['userName'],
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockTemplate2: EmailTemplate = {
    id: '2',
    name: 'password-reset',
    displayName: 'Password Reset',
    description: 'Password reset email',
    category: 'AUTHENTICATION' as EmailCategory,
    subject: 'Reset your password',
    bodyHtml: '<p>Reset link: {{resetLink}}</p>',
    bodyText: 'Reset link: {{resetLink}}',
    isActive: true,
    isSystem: true,
    variables: ['resetLink'],
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should initialize with empty templates array', () => {
      const { templates } = useEmailTemplates()
      expect(templates.value).toEqual([])
    })

    it('should initialize with loading false', () => {
      const { loading } = useEmailTemplates()
      expect(loading.value).toBe(false)
    })

    it('should initialize with no error', () => {
      const { error } = useEmailTemplates()
      expect(error.value).toBeNull()
    })

    it('should initialize with empty categories', () => {
      const { categories } = useEmailTemplates()
      expect(categories.value).toEqual([])
    })

    it('should initialize with empty selected templates', () => {
      const { selectedTemplates } = useEmailTemplates()
      expect(selectedTemplates.value).toEqual([])
    })
  })

  describe('fetchTemplates', () => {
    it('should fetch templates successfully', async () => {
      vi.mocked(emailTemplateApiService.getAllTemplates).mockResolvedValue([mockTemplate, mockTemplate2])

      const { fetchTemplates, templates, loading } = useEmailTemplates()
      await fetchTemplates()

      expect(templates.value).toEqual([mockTemplate, mockTemplate2])
      expect(loading.value).toBe(false)
    })

    it('should fetch templates with params', async () => {
      vi.mocked(emailTemplateApiService.getAllTemplates).mockResolvedValue([mockTemplate])

      const { fetchTemplates } = useEmailTemplates()
      const params = { category: 'USER_MANAGEMENT' }
      await fetchTemplates(params)

      expect(emailTemplateApiService.getAllTemplates).toHaveBeenCalledWith(params)
    })

    it('should handle fetch error', async () => {
      const error = new Error('Failed to fetch')
      vi.mocked(emailTemplateApiService.getAllTemplates).mockRejectedValue(error)

      const { fetchTemplates, error: errorState } = useEmailTemplates()
      await fetchTemplates()

      expect(errorState.value).toBe('Failed to fetch')
    })

    it('should set lastUpdated after successful fetch', async () => {
      vi.mocked(emailTemplateApiService.getAllTemplates).mockResolvedValue([mockTemplate])

      const { fetchTemplates, lastUpdated } = useEmailTemplates()
      const beforeFetch = new Date()
      await fetchTemplates()

      expect(lastUpdated.value).toBeTruthy()
      expect(lastUpdated.value!.getTime()).toBeGreaterThanOrEqual(beforeFetch.getTime())
    })
  })

  describe('fetchCategories', () => {
    it('should fetch categories successfully', async () => {
      const categories: EmailCategory[] = ['USER_MANAGEMENT', 'AUTHENTICATION']
      vi.mocked(emailTemplateApiService.getCategories).mockResolvedValue(categories)

      const { fetchCategories, categories: categoriesState } = useEmailTemplates()
      await fetchCategories()

      expect(categoriesState.value).toEqual(categories)
    })

    it('should handle fetch categories error gracefully', async () => {
      const error = new Error('Failed to fetch categories')
      vi.mocked(emailTemplateApiService.getCategories).mockRejectedValue(error)

      const { fetchCategories, error: errorState } = useEmailTemplates()
      await fetchCategories()

      // Should not set error state for categories
      expect(errorState.value).toBeNull()
    })
  })

  describe('createTemplate', () => {
    it('should create template successfully', async () => {
      const newTemplateData: CreateEmailTemplateDto = {
        name: 'new-template',
        displayName: 'New Template',
        description: 'New template description',
        category: 'USER_MANAGEMENT' as EmailCategory,
        subject: 'Test Subject',
        bodyHtml: '<p>Test</p>',
        bodyText: 'Test',
      }
      const createdTemplate: EmailTemplate = { ...mockTemplate, id: '3', ...newTemplateData }

      vi.mocked(emailTemplateApiService.createTemplate).mockResolvedValue(createdTemplate)

      const { createTemplate, templates } = useEmailTemplates()
      const result = await createTemplate(newTemplateData)

      expect(result).toEqual(createdTemplate)
      expect(templates.value.some(t => t.id === '3')).toBe(true)
    })

    it('should handle create error', async () => {
      const error = new Error('Creation failed')
      vi.mocked(emailTemplateApiService.createTemplate).mockRejectedValue(error)

      const { createTemplate } = useEmailTemplates()
      const result = await createTemplate({} as CreateEmailTemplateDto)

      expect(result).toBeNull()
    })
  })

  describe('updateTemplate', () => {
    it('should update template successfully', async () => {
      vi.mocked(emailTemplateApiService.getAllTemplates).mockResolvedValue([mockTemplate])

      const { fetchTemplates, updateTemplate, templates } = useEmailTemplates()
      await fetchTemplates()

      const updateData: UpdateEmailTemplateDto = {
        displayName: 'Updated Welcome Email',
        subject: 'Updated Subject',
      }
      const updatedTemplate: EmailTemplate = { ...mockTemplate, ...updateData }

      vi.mocked(emailTemplateApiService.updateTemplate).mockResolvedValue(updatedTemplate)

      const result = await updateTemplate('1', updateData)

      expect(result).toEqual(updatedTemplate)
      expect(templates.value[0].displayName).toBe('Updated Welcome Email')
    })

    it('should handle update error', async () => {
      const error = new Error('Update failed')
      vi.mocked(emailTemplateApiService.updateTemplate).mockRejectedValue(error)

      const { updateTemplate } = useEmailTemplates()
      const result = await updateTemplate('1', {})

      expect(result).toBeNull()
    })
  })

  describe('deleteTemplate', () => {
    it('should delete template successfully', async () => {
      vi.mocked(emailTemplateApiService.getAllTemplates).mockResolvedValue([mockTemplate, mockTemplate2])

      const { fetchTemplates, deleteTemplate, templates } = useEmailTemplates()
      await fetchTemplates()

      vi.mocked(emailTemplateApiService.deleteTemplate).mockResolvedValue(undefined)

      const result = await deleteTemplate('1')

      expect(result).toBe(true)
      expect(templates.value).toHaveLength(1)
      expect(templates.value.find(t => t.id === '1')).toBeUndefined()
    })

    it('should remove deleted template from selection', async () => {
      vi.mocked(emailTemplateApiService.getAllTemplates).mockResolvedValue([mockTemplate, mockTemplate2])

      const { fetchTemplates, deleteTemplate, toggleTemplateSelection, selectedTemplates, templates } = useEmailTemplates()
      await fetchTemplates()

      const template = templates.value[0]
      toggleTemplateSelection(template)
      expect(selectedTemplates.value.some(t => t.id === '1')).toBe(true)

      vi.mocked(emailTemplateApiService.deleteTemplate).mockResolvedValue(undefined)
      await deleteTemplate('1')

      expect(selectedTemplates.value.some(t => t.id === '1')).toBe(false)
    })

    it('should handle delete error', async () => {
      const error = new Error('Delete failed')
      vi.mocked(emailTemplateApiService.deleteTemplate).mockRejectedValue(error)

      const { deleteTemplate } = useEmailTemplates()
      const result = await deleteTemplate('1')

      expect(result).toBe(false)
    })
  })

  describe('duplicateTemplate', () => {
    it('should duplicate template successfully', async () => {
      const duplicatedTemplate: EmailTemplate = { ...mockTemplate, id: '3', name: 'welcome-email-copy' }
      vi.mocked(emailTemplateApiService.duplicateTemplate).mockResolvedValue(duplicatedTemplate)

      const { duplicateTemplate, templates } = useEmailTemplates()
      const result = await duplicateTemplate('1')

      expect(result).toEqual(duplicatedTemplate)
      expect(templates.value.some(t => t.id === '3')).toBe(true)
    })

    it('should handle duplicate error', async () => {
      const error = new Error('Duplicate failed')
      vi.mocked(emailTemplateApiService.duplicateTemplate).mockRejectedValue(error)

      const { duplicateTemplate } = useEmailTemplates()
      const result = await duplicateTemplate('1')

      expect(result).toBeNull()
    })
  })

  describe('previewTemplate', () => {
    it('should preview template successfully', async () => {
      const previewResponse = {
        subject: 'Welcome John Doe',
        bodyHtml: '<p>Welcome John Doe</p>',
        bodyText: 'Welcome John Doe',
      }
      vi.mocked(emailTemplateApiService.previewTemplate).mockResolvedValue(previewResponse)

      const { previewTemplate } = useEmailTemplates()
      const variables = { userName: 'John Doe' }
      const result = await previewTemplate('1', variables)

      expect(result).toEqual(previewResponse)
      expect(emailTemplateApiService.previewTemplate).toHaveBeenCalledWith('1', variables, undefined)
    })

    it('should handle preview error', async () => {
      const error = new Error('Preview failed')
      vi.mocked(emailTemplateApiService.previewTemplate).mockRejectedValue(error)

      const { previewTemplate } = useEmailTemplates()
      const result = await previewTemplate('1')

      expect(result).toBeNull()
    })
  })

  describe('sendTestEmail', () => {
    it('should send test email successfully', async () => {
      const sendResult = { success: true, messageId: 'msg-123' }
      vi.mocked(emailTemplateApiService.sendTestEmail).mockResolvedValue(sendResult)

      const { sendTestEmail } = useEmailTemplates()
      const result = await sendTestEmail('1', 'test@example.com', { userName: 'John' })

      expect(result).toEqual(sendResult)
      expect(emailTemplateApiService.sendTestEmail).toHaveBeenCalledWith('1', 'test@example.com', { userName: 'John' }, undefined)
    })

    it('should handle send email error', async () => {
      const error = new Error('Send failed')
      vi.mocked(emailTemplateApiService.sendTestEmail).mockRejectedValue(error)

      const { sendTestEmail } = useEmailTemplates()
      const result = await sendTestEmail('1', 'test@example.com')

      expect(result).toBeNull()
    })

    it('should handle unsuccessful send result', async () => {
      const sendResult = { success: false, error: 'Invalid email' }
      vi.mocked(emailTemplateApiService.sendTestEmail).mockResolvedValue(sendResult)

      const { sendTestEmail } = useEmailTemplates()
      const result = await sendTestEmail('1', 'invalid-email')

      expect(result).toBeNull()
    })
  })

  describe('Computed Properties', () => {
    it('should compute totalTemplates correctly', async () => {
      vi.mocked(emailTemplateApiService.getAllTemplates).mockResolvedValue([mockTemplate, mockTemplate2])

      const { fetchTemplates, totalTemplates } = useEmailTemplates()
      await fetchTemplates()

      expect(totalTemplates.value).toBe(2)
    })

    it('should compute activeTemplates correctly', async () => {
      const inactiveTemplate = { ...mockTemplate, id: '3', isActive: false }
      vi.mocked(emailTemplateApiService.getAllTemplates).mockResolvedValue([mockTemplate, mockTemplate2, inactiveTemplate])

      const { fetchTemplates, activeTemplates } = useEmailTemplates()
      await fetchTemplates()

      expect(activeTemplates.value).toBe(2)
    })

    it('should compute systemTemplates correctly', async () => {
      vi.mocked(emailTemplateApiService.getAllTemplates).mockResolvedValue([mockTemplate, mockTemplate2])

      const { fetchTemplates, systemTemplates } = useEmailTemplates()
      await fetchTemplates()

      expect(systemTemplates.value).toBe(1) // Only mockTemplate2 is system
    })
  })

  describe('Filtering', () => {
    beforeEach(async () => {
      vi.mocked(emailTemplateApiService.getAllTemplates).mockResolvedValue([mockTemplate, mockTemplate2])
    })

    it('should filter by search term (name)', async () => {
      const { fetchTemplates, filteredTemplates, filters } = useEmailTemplates()
      await fetchTemplates()

      filters.search = 'welcome'

      expect(filteredTemplates.value).toHaveLength(1)
      expect(filteredTemplates.value[0].name).toBe('welcome-email')
    })

    it('should filter by search term (subject)', async () => {
      const { fetchTemplates, filteredTemplates, filters } = useEmailTemplates()
      await fetchTemplates()

      filters.search = 'reset'

      expect(filteredTemplates.value).toHaveLength(1)
      expect(filteredTemplates.value[0].name).toBe('password-reset')
    })

    it('should filter by category', async () => {
      const { fetchTemplates, filteredTemplates, filters } = useEmailTemplates()
      await fetchTemplates()

      filters.category = 'AUTHENTICATION' as EmailCategory

      expect(filteredTemplates.value).toHaveLength(1)
      expect(filteredTemplates.value[0].category).toBe('AUTHENTICATION')
    })

    it('should filter by isActive', async () => {
      const inactiveTemplate = { ...mockTemplate, id: '3', isActive: false }
      vi.mocked(emailTemplateApiService.getAllTemplates).mockResolvedValue([mockTemplate, mockTemplate2, inactiveTemplate])

      const { fetchTemplates, filteredTemplates, filters } = useEmailTemplates()
      await fetchTemplates()

      filters.isActive = false

      expect(filteredTemplates.value).toHaveLength(1)
      expect(filteredTemplates.value[0].isActive).toBe(false)
    })

    it('should filter by isSystem', async () => {
      const { fetchTemplates, filteredTemplates, filters } = useEmailTemplates()
      await fetchTemplates()

      filters.isSystem = true

      expect(filteredTemplates.value).toHaveLength(1)
      expect(filteredTemplates.value[0].isSystem).toBe(true)
    })

    it('should combine multiple filters', async () => {
      const { fetchTemplates, filteredTemplates, filters } = useEmailTemplates()
      await fetchTemplates()

      filters.search = 'password'
      filters.isSystem = true
      filters.isActive = true

      expect(filteredTemplates.value).toHaveLength(1)
      expect(filteredTemplates.value[0].name).toBe('password-reset')
    })

    it('should clear filters', async () => {
      const { fetchTemplates, filters, clearFilters } = useEmailTemplates()
      await fetchTemplates()

      filters.search = 'test'
      filters.category = 'USER_MANAGEMENT' as EmailCategory
      filters.isActive = true
      filters.isSystem = false

      clearFilters()

      expect(filters.search).toBe('')
      expect(filters.category).toBeNull()
      expect(filters.isActive).toBeNull()
      expect(filters.isSystem).toBeNull()
    })
  })

  describe('Selection Utilities', () => {
    beforeEach(async () => {
      vi.mocked(emailTemplateApiService.getAllTemplates).mockResolvedValue([mockTemplate, mockTemplate2])
    })

    it('should get template by ID', async () => {
      const { fetchTemplates, getTemplateById } = useEmailTemplates()
      await fetchTemplates()

      const template = getTemplateById('1')

      expect(template).toEqual(mockTemplate)
    })

    it('should return undefined for non-existent template ID', async () => {
      const { fetchTemplates, getTemplateById } = useEmailTemplates()
      await fetchTemplates()

      const template = getTemplateById('999')

      expect(template).toBeUndefined()
    })

    it('should check if template is selected', async () => {
      const { fetchTemplates, toggleTemplateSelection, isTemplateSelected, templates } = useEmailTemplates()
      await fetchTemplates()

      expect(isTemplateSelected('1')).toBe(false)

      const template = templates.value[0]
      toggleTemplateSelection(template)

      expect(isTemplateSelected('1')).toBe(true)
    })

    it('should toggle template selection on and off', async () => {
      const { fetchTemplates, toggleTemplateSelection, selectedTemplates, templates } = useEmailTemplates()
      await fetchTemplates()

      const template = templates.value[0]
      toggleTemplateSelection(template)
      expect(selectedTemplates.value.some(t => t.id === template.id)).toBe(true)

      toggleTemplateSelection(template)
      expect(selectedTemplates.value.some(t => t.id === template.id)).toBe(false)
    })

    it('should clear all selections', async () => {
      const { fetchTemplates, toggleTemplateSelection, clearSelection, selectedTemplates, templates } = useEmailTemplates()
      await fetchTemplates()

      const template1 = templates.value[0]
      const template2 = templates.value[1]
      toggleTemplateSelection(template1)
      toggleTemplateSelection(template2)
      expect(selectedTemplates.value).toHaveLength(2)

      clearSelection()
      expect(selectedTemplates.value).toHaveLength(0)
    })

    it('should select all visible templates', async () => {
      const { fetchTemplates, selectAllVisible, selectedTemplates } = useEmailTemplates()
      await fetchTemplates()

      selectAllVisible()

      expect(selectedTemplates.value).toHaveLength(2)
      expect(selectedTemplates.value.some(t => t.id === '1')).toBe(true)
      expect(selectedTemplates.value.some(t => t.id === '2')).toBe(true)
    })

    it('should select only filtered templates with selectAllVisible', async () => {
      const { fetchTemplates, selectAllVisible, selectedTemplates, filters } = useEmailTemplates()
      await fetchTemplates()

      filters.search = 'welcome'
      selectAllVisible()

      expect(selectedTemplates.value).toHaveLength(1)
      expect(selectedTemplates.value[0].name).toBe('welcome-email')
    })
  })

  describe('refreshData', () => {
    it('should call fetchTemplates and fetchCategories', async () => {
      const templates = [mockTemplate]
      const categories: EmailCategory[] = ['USER_MANAGEMENT']
      vi.mocked(emailTemplateApiService.getAllTemplates).mockResolvedValue(templates)
      vi.mocked(emailTemplateApiService.getCategories).mockResolvedValue(categories)

      const { refreshData, templates: templatesState, categories: categoriesState } = useEmailTemplates()
      await refreshData()

      expect(templatesState.value).toEqual(templates)
      expect(categoriesState.value).toEqual(categories)
    })
  })
})
