import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { ref } from 'vue'
import EmailTemplateManagementView from '../EmailTemplateManagementView.vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

// Mock vue-router
vi.mock('vue-router', () => ({
  useRouter: vi.fn(),
}))

// Mock PrimeVue composables
vi.mock('primevue/usetoast', () => ({
  useToast: vi.fn(),
}))

vi.mock('primevue/useconfirm', () => ({
  useConfirm: vi.fn(),
}))

// Mock the useEmailTemplates composable
const mockFetchTemplates = vi.fn()
const mockFetchCategories = vi.fn()
const mockDeleteTemplate = vi.fn()
const mockDuplicateTemplate = vi.fn()
const mockRefreshTemplatesData = vi.fn()
const mockClearFilters = vi.fn()

let mockTemplates: any
let mockSelectedTemplates: any
let mockTemplatesLoading: any
let mockFilteredTemplates: any
let mockTotalTemplates: any
let mockActiveTemplates: any
let mockFilters: any

vi.mock('@/composables/useEmailTemplates', () => ({
  useEmailTemplates: vi.fn(() => ({
    templates: mockTemplates,
    selectedTemplates: mockSelectedTemplates,
    loading: mockTemplatesLoading,
    filteredTemplates: mockFilteredTemplates,
    totalTemplates: mockTotalTemplates,
    activeTemplates: mockActiveTemplates,
    filters: mockFilters,
    clearFilters: mockClearFilters,
    fetchTemplates: mockFetchTemplates,
    fetchCategories: mockFetchCategories,
    deleteTemplate: mockDeleteTemplate,
    duplicateTemplate: mockDuplicateTemplate,
    refreshData: mockRefreshTemplatesData,
  })),
}))

// Mock the useEmailStats composable
const mockFetchLogs = vi.fn()
const mockFetchStats = vi.fn()
const mockFetchQueueStats = vi.fn()

let mockLogs: any
let mockStats: any
let mockQueueStats: any
let mockStatsLoading: any
let mockTotalLogs: any

vi.mock('@/composables/useEmailStats', () => ({
  useEmailStats: vi.fn(() => ({
    logs: mockLogs,
    stats: mockStats,
    queueStats: mockQueueStats,
    loading: mockStatsLoading,
    totalLogs: mockTotalLogs,
    fetchLogs: mockFetchLogs,
    fetchStats: mockFetchStats,
    fetchQueueStats: mockFetchQueueStats,
  })),
}))

// Mock child components
vi.mock('@/components/admin/AdminNavigation.vue', () => ({
  default: { name: 'AdminNavigation', template: '<div data-testid="admin-navigation"></div>' },
}))

vi.mock('@/components/admin/EmailTemplatePreviewDialog.vue', () => ({
  default: { name: 'EmailTemplatePreviewDialog', template: '<div data-testid="email-template-preview-dialog"></div>' },
}))

vi.mock('@/components/admin/EmailTemplateCreateDialog.vue', () => ({
  default: { name: 'EmailTemplateCreateDialog', template: '<div data-testid="email-template-create-dialog"></div>' },
}))

vi.mock('@/components/admin/EmailTemplateEditDialog.vue', () => ({
  default: { name: 'EmailTemplateEditDialog', template: '<div data-testid="email-template-edit-dialog"></div>' },
}))

describe('EmailTemplateManagementView', () => {
  let wrapper: VueWrapper
  let mockRouter: any
  let mockToast: any
  let mockConfirm: any

  beforeEach(() => {
    mockRouter = {
      push: vi.fn(),
    }
    vi.mocked(useRouter).mockReturnValue(mockRouter)

    mockToast = {
      add: vi.fn(),
    }
    vi.mocked(useToast).mockReturnValue(mockToast)

    mockConfirm = {
      require: vi.fn(),
    }
    vi.mocked(useConfirm).mockReturnValue(mockConfirm)

    // Reset mocks with refs
    mockTemplates = ref([])
    mockSelectedTemplates = ref([])
    mockTemplatesLoading = ref(false)
    mockFilteredTemplates = ref([])
    mockTotalTemplates = ref(0)
    mockActiveTemplates = ref(0)
    mockFilters = ref({ search: '', category: null, isActive: null, isSystem: null })

    mockLogs = ref([])
    mockStats = ref(null)
    mockQueueStats = ref(null)
    mockStatsLoading = ref(false)
    mockTotalLogs = ref(0)

    mockFetchTemplates.mockClear()
    mockFetchCategories.mockClear()
    mockDeleteTemplate.mockClear()
    mockDuplicateTemplate.mockClear()
    mockRefreshTemplatesData.mockClear()
    mockClearFilters.mockClear()
    mockFetchLogs.mockClear()
    mockFetchStats.mockClear()
    mockFetchQueueStats.mockClear()
  })

  const mountComponent = () => {
    return mount(EmailTemplateManagementView, {
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
        stubs: {
          Breadcrumb: true,
          Button: {
            template: '<button @click="$emit(\'click\')" :class="$attrs.class" :disabled="$attrs.disabled"><slot /></button>',
          },
          Dialog: true,
          Tabs: {
            template: '<div><slot /></div>',
          },
          TabList: {
            template: '<div><slot /></div>',
          },
          Tab: {
            template: '<div><slot /></div>',
          },
          TabPanels: {
            template: '<div><slot /></div>',
          },
          TabPanel: {
            template: '<div><slot /></div>',
          },
          DataTable: {
            template: '<div class="data-table"><slot name="empty" /></div>',
          },
          Column: true,
          InputText: {
            template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
            props: ['modelValue'],
          },
          IconField: {
            template: '<div><slot /></div>',
          },
          InputIcon: true,
          Select: {
            template: '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><slot /></select>',
            props: ['modelValue'],
          },
          Tag: true,
          Badge: true,
        },
      },
    })
  }

  describe('Component Rendering', () => {
    it('should render the component', () => {
      wrapper = mountComponent()
      expect(wrapper.exists()).toBe(true)
    })

    it('should render the admin header with title', () => {
      wrapper = mountComponent()
      expect(wrapper.find('h1').text()).toBe('Email Template Management')
    })

    it('should render the subtitle', () => {
      wrapper = mountComponent()
      expect(wrapper.find('.admin-subtitle').text()).toBe('Manage email templates, monitor sending activity, and view statistics')
    })

    it('should render AdminNavigation component', () => {
      wrapper = mountComponent()
      expect(wrapper.find('[data-testid="admin-navigation"]').exists()).toBe(true)
    })

    it('should render action buttons', () => {
      wrapper = mountComponent()
      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Breadcrumb Navigation', () => {
    it('should navigate to dashboard when clicking Dashboard breadcrumb', () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      vm.breadcrumbItems[0].command()

      expect(mockRouter.push).toHaveBeenCalledWith('/')
    })

    it('should navigate to admin when clicking Administration breadcrumb', () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      vm.breadcrumbItems[1].command()

      expect(mockRouter.push).toHaveBeenCalledWith('/admin')
    })

    it('should have correct breadcrumb items', () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      expect(vm.breadcrumbItems).toHaveLength(3)
      expect(vm.breadcrumbItems[0].label).toBe('Dashboard')
      expect(vm.breadcrumbItems[1].label).toBe('Administration')
      expect(vm.breadcrumbItems[2].label).toBe('Email Templates')
    })
  })

  describe('Component Lifecycle', () => {
    it('should fetch data on mount', async () => {
      mockFetchTemplates.mockResolvedValue(undefined)
      mockFetchCategories.mockResolvedValue(undefined)
      mockFetchLogs.mockResolvedValue(undefined)
      mockFetchStats.mockResolvedValue(undefined)
      mockFetchQueueStats.mockResolvedValue(undefined)

      wrapper = mountComponent()
      await wrapper.vm.$nextTick()

      expect(mockFetchTemplates).toHaveBeenCalled()
      expect(mockFetchCategories).toHaveBeenCalled()
      expect(mockFetchLogs).toHaveBeenCalledWith(1, 10)
      expect(mockFetchStats).toHaveBeenCalled()
      expect(mockFetchQueueStats).toHaveBeenCalled()
    })

    it('should initialize with correct default values', () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      expect(vm.activeTab).toBe('0')
      expect(vm.previewDialogVisible).toBe(false)
      expect(vm.createDialogVisible).toBe(false)
      expect(vm.editDialogVisible).toBe(false)
      expect(vm.selectedTemplate).toBeNull()
    })
  })

  describe('Refresh Data', () => {
    it('should refresh all data successfully', async () => {
      mockRefreshTemplatesData.mockResolvedValue(undefined)
      mockFetchLogs.mockResolvedValue(undefined)
      mockFetchStats.mockResolvedValue(undefined)
      mockFetchQueueStats.mockResolvedValue(undefined)

      wrapper = mountComponent()
      const vm = wrapper.vm as any

      await vm.refreshAllData()

      expect(mockRefreshTemplatesData).toHaveBeenCalled()
      expect(mockFetchLogs).toHaveBeenCalled()
      expect(mockFetchStats).toHaveBeenCalled()
      expect(mockFetchQueueStats).toHaveBeenCalled()
      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Data Refreshed',
        detail: 'All data has been refreshed successfully',
        life: 3000,
      })
    })
  })

  describe('Filter Management', () => {
    it('should clear all filters', () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      vm.clearAllFilters()

      expect(mockClearFilters).toHaveBeenCalled()
    })

    it('should have correct category options', () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      const categoryOptions = vm.categoryOptions
      expect(categoryOptions).toHaveLength(8)
      expect(categoryOptions[0].label).toBe('Account')
      expect(categoryOptions[0].value).toBe('ACCOUNT')
    })

    it('should have correct status options', () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      expect(vm.statusOptions).toHaveLength(2)
      expect(vm.statusOptions[0].label).toBe('Active')
      expect(vm.statusOptions[0].value).toBe(true)
    })

    it('should have correct type options', () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      expect(vm.typeOptions).toHaveLength(2)
      expect(vm.typeOptions[0].label).toBe('System Templates')
      expect(vm.typeOptions[0].value).toBe(true)
    })
  })

  describe('Template Creation', () => {
    it('should show create template dialog', () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      vm.createNewTemplate()

      expect(vm.createDialogVisible).toBe(true)
    })

    it('should handle template created successfully', async () => {
      mockRefreshTemplatesData.mockResolvedValue(undefined)

      wrapper = mountComponent()
      const vm = wrapper.vm as any

      const newTemplate = {
        id: '1',
        name: 'test-template',
        displayName: 'Test Template',
        subject: 'Test Subject',
      }

      await vm.handleTemplateCreated(newTemplate)

      expect(vm.createDialogVisible).toBe(false)
      expect(vm.activeTab).toBe('0')
      expect(mockRefreshTemplatesData).toHaveBeenCalled()
    })
  })

  describe('Template Editing', () => {
    it('should show edit template dialog', () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      const template = {
        id: '1',
        name: 'test-template',
        displayName: 'Test Template',
      }

      vm.editTemplate(template)

      expect(vm.selectedTemplate).toEqual(template)
      expect(vm.editDialogVisible).toBe(true)
    })

    it('should handle template updated successfully', async () => {
      mockRefreshTemplatesData.mockResolvedValue(undefined)

      wrapper = mountComponent()
      const vm = wrapper.vm as any

      vm.selectedTemplate = { id: '1', name: 'old-name' }
      vm.editDialogVisible = true

      const updatedTemplate = {
        id: '1',
        name: 'updated-template',
        displayName: 'Updated Template',
      }

      await vm.handleTemplateUpdated(updatedTemplate)

      expect(vm.editDialogVisible).toBe(false)
      expect(vm.selectedTemplate).toBeNull()
      expect(mockRefreshTemplatesData).toHaveBeenCalled()
    })
  })

  describe('Template Preview', () => {
    it('should show preview dialog', () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      const template = {
        id: '1',
        name: 'test-template',
        displayName: 'Test Template',
      }

      vm.previewTemplate(template)

      expect(vm.selectedTemplate).toEqual(template)
      expect(vm.previewDialogVisible).toBe(true)
    })

    it('should handle edit from preview', () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      const template = {
        id: '1',
        name: 'test-template',
        displayName: 'Test Template',
      }

      vm.previewDialogVisible = true
      vm.handleEditFromPreview(template)

      expect(vm.previewDialogVisible).toBe(false)
      expect(vm.editDialogVisible).toBe(true)
      expect(vm.selectedTemplate).toEqual(template)
    })
  })

  describe('Template Duplication', () => {
    it('should duplicate template successfully', async () => {
      mockDuplicateTemplate.mockResolvedValue({ id: '2', name: 'duplicated' })

      wrapper = mountComponent()
      const vm = wrapper.vm as any

      const template = {
        id: '1',
        name: 'test-template',
        displayName: 'Test Template',
      }

      await vm.duplicateTemplate(template)

      expect(mockDuplicateTemplate).toHaveBeenCalledWith('1')
      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Template Duplicated',
        detail: 'Template "Test Template" has been duplicated successfully',
        life: 3000,
      })
    })

    it('should not show toast if duplication fails', async () => {
      mockDuplicateTemplate.mockResolvedValue(null)

      wrapper = mountComponent()
      const vm = wrapper.vm as any

      const template = {
        id: '1',
        name: 'test-template',
        displayName: 'Test Template',
      }

      await vm.duplicateTemplate(template)

      expect(mockToast.add).not.toHaveBeenCalled()
    })
  })

  describe('Template Deletion', () => {
    it('should show confirmation dialog when deleting template', () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      const template = {
        id: '1',
        name: 'test-template',
        displayName: 'Test Template',
      }

      vm.confirmDeleteTemplate(template)

      expect(mockConfirm.require).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Are you sure you want to delete the template "Test Template"?',
          header: 'Confirm Deletion',
          icon: 'pi pi-exclamation-triangle',
        })
      )
    })

    it('should delete template when confirmed', async () => {
      mockDeleteTemplate.mockResolvedValue(true)

      wrapper = mountComponent()
      const vm = wrapper.vm as any

      const template = {
        id: '1',
        name: 'test-template',
        displayName: 'Test Template',
      }

      vm.confirmDeleteTemplate(template)

      // Get the accept callback from the confirm.require call
      const confirmCall = mockConfirm.require.mock.calls[0][0]
      await confirmCall.accept()

      expect(mockDeleteTemplate).toHaveBeenCalledWith('1')
      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Template Deleted',
        detail: 'Template "Test Template" has been deleted successfully',
        life: 3000,
      })
    })

    it('should not show toast if deletion fails', async () => {
      mockDeleteTemplate.mockResolvedValue(false)

      wrapper = mountComponent()
      const vm = wrapper.vm as any

      const template = {
        id: '1',
        name: 'test-template',
        displayName: 'Test Template',
      }

      vm.confirmDeleteTemplate(template)

      const confirmCall = mockConfirm.require.mock.calls[0][0]
      await confirmCall.accept()

      expect(mockToast.add).not.toHaveBeenCalled()
    })
  })

  describe('Utility Functions', () => {
    it('should get correct category severity', () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      expect(vm.getCategorySeverity('ACCOUNT')).toBe('info')
      expect(vm.getCategorySeverity('DOCUMENT')).toBe('primary')
      expect(vm.getCategorySeverity('CAPITAL_CALL')).toBe('warning')
      expect(vm.getCategorySeverity('DISTRIBUTION')).toBe('success')
      expect(vm.getCategorySeverity('INVESTMENT')).toBe('info')
      expect(vm.getCategorySeverity('SYSTEM')).toBe('secondary')
      expect(vm.getCategorySeverity('NOTIFICATION')).toBe('info')
      expect(vm.getCategorySeverity('COMPLIANCE')).toBe('warning')
    })

    it('should return default severity for unknown category', () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      expect(vm.getCategorySeverity('UNKNOWN')).toBe('info')
    })

    it('should format date correctly', () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      const formatted = vm.formatDate('2024-01-15T10:30:00Z')

      expect(formatted).toContain('2024')
      expect(formatted).toContain('Jan')
      expect(formatted).toContain('15')
    })
  })

  describe('Loading State', () => {
    it('should compute loading state from templates loading', () => {
      mockTemplatesLoading.value = true
      mockStatsLoading.value = false

      wrapper = mountComponent()
      const vm = wrapper.vm as any

      expect(vm.loading).toBe(true)
    })

    it('should compute loading state from stats loading', () => {
      mockTemplatesLoading.value = false
      mockStatsLoading.value = true

      wrapper = mountComponent()
      const vm = wrapper.vm as any

      expect(vm.loading).toBe(true)
    })

    it('should be false when both are not loading', () => {
      mockTemplatesLoading.value = false
      mockStatsLoading.value = false

      wrapper = mountComponent()
      const vm = wrapper.vm as any

      expect(vm.loading).toBe(false)
    })
  })

  describe('Tab Navigation', () => {
    it('should initialize with templates tab active', () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      expect(vm.activeTab).toBe('0')
    })

    it('should switch to templates tab after creating template', async () => {
      mockRefreshTemplatesData.mockResolvedValue(undefined)

      wrapper = mountComponent()
      const vm = wrapper.vm as any

      vm.activeTab = '1' // Set to different tab

      const newTemplate = { id: '1', name: 'test' }
      await vm.handleTemplateCreated(newTemplate)

      expect(vm.activeTab).toBe('0')
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete create template flow', async () => {
      mockRefreshTemplatesData.mockResolvedValue(undefined)

      wrapper = mountComponent()
      const vm = wrapper.vm as any

      // Open create dialog
      vm.createNewTemplate()
      expect(vm.createDialogVisible).toBe(true)

      // Handle template creation
      const newTemplate = { id: '1', name: 'test-template' }
      await vm.handleTemplateCreated(newTemplate)

      // Verify state is reset and data is refreshed
      expect(vm.createDialogVisible).toBe(false)
      expect(vm.activeTab).toBe('0')
      expect(mockRefreshTemplatesData).toHaveBeenCalled()
    })

    it('should handle complete edit template flow', async () => {
      mockRefreshTemplatesData.mockResolvedValue(undefined)

      wrapper = mountComponent()
      const vm = wrapper.vm as any

      // Open edit dialog
      const template = { id: '1', name: 'test-template' }
      vm.editTemplate(template)
      expect(vm.editDialogVisible).toBe(true)
      expect(vm.selectedTemplate).toEqual(template)

      // Handle template update
      const updatedTemplate = { id: '1', name: 'updated-template' }
      await vm.handleTemplateUpdated(updatedTemplate)

      // Verify state is reset and data is refreshed
      expect(vm.editDialogVisible).toBe(false)
      expect(vm.selectedTemplate).toBeNull()
      expect(mockRefreshTemplatesData).toHaveBeenCalled()
    })

    it('should handle preview to edit flow', () => {
      wrapper = mountComponent()
      const vm = wrapper.vm as any

      // Open preview dialog
      const template = { id: '1', name: 'test-template' }
      vm.previewTemplate(template)
      expect(vm.previewDialogVisible).toBe(true)
      expect(vm.selectedTemplate).toEqual(template)

      // Edit from preview
      vm.handleEditFromPreview(template)

      // Verify preview closed and edit opened
      expect(vm.previewDialogVisible).toBe(false)
      expect(vm.editDialogVisible).toBe(true)
      expect(vm.selectedTemplate).toEqual(template)
    })
  })

  describe('Data Display', () => {
    it('should display templates when they exist', () => {
      mockFilteredTemplates.value = [
        {
          id: '1',
          name: 'test-template',
          displayName: 'Test Template',
          subject: 'Test Subject',
          category: 'ACCOUNT',
          isActive: true,
          isSystem: false,
          updatedAt: '2024-01-15T10:00:00Z',
        },
      ]

      wrapper = mountComponent()

      expect(mockFilteredTemplates.value).toHaveLength(1)
      expect(mockFilteredTemplates.value[0].displayName).toBe('Test Template')
    })

    it('should use total templates count', () => {
      mockTotalTemplates.value = 10

      wrapper = mountComponent()
      const vm = wrapper.vm as any

      expect(vm.totalTemplates).toBe(10)
    })

    it('should use total logs count', () => {
      mockTotalLogs.value = 25

      wrapper = mountComponent()
      const vm = wrapper.vm as any

      expect(vm.totalLogs).toBe(25)
    })

    it('should use queue stats', () => {
      mockQueueStats.value = { pending: 5, processing: 2, failed: 1 }

      wrapper = mountComponent()
      const vm = wrapper.vm as any

      expect(vm.queueStats.pending).toBe(5)
    })
  })
})
