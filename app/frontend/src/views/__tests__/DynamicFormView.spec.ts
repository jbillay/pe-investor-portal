import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { ref } from 'vue'
import DynamicFormView from '../DynamicFormView.vue'

// Mock router
const mockPush = vi.fn()
const mockRoute = {
  params: {
    dataKey: 'test-key',
    id: undefined as string | undefined,
  },
}

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useRoute: () => mockRoute,
}))

// Mock composable
const mockFetchSchema = vi.fn()
const mockFetchInstance = vi.fn()
const mockCreateInstance = vi.fn()
const mockUpdateInstance = vi.fn()

const schemaRef = ref<any>(null)
const instanceRef = ref<any>(null)
const loadingRef = ref(false)
const errorRef = ref<string | null>(null)
const canWriteRef = ref(true)

const mockComposable = {
  schema: schemaRef,
  instance: instanceRef,
  loading: loadingRef,
  error: errorRef,
  canWrite: canWriteRef,
  fetchSchema: mockFetchSchema,
  fetchInstance: mockFetchInstance,
  createInstance: mockCreateInstance,
  updateInstance: mockUpdateInstance,
}

vi.mock('@/composables/dynamic/useDynamicData', () => ({
  useDynamicData: () => mockComposable,
}))

// Mock PrimeVue components
vi.mock('primevue/button', () => ({
  default: {
    name: 'Button',
    template: '<button @click="$emit(\'click\')">{{ label }}<slot /></button>',
    props: ['icon', 'label', 'class'],
  },
}))

vi.mock('primevue/card', () => ({
  default: {
    name: 'Card',
    template: '<div class="card"><slot name="content" /></div>',
  },
}))

vi.mock('primevue/message', () => ({
  default: {
    name: 'Message',
    template: '<div class="message"><slot /></div>',
    props: ['severity'],
  },
}))

vi.mock('primevue/progressspinner', () => ({
  default: {
    name: 'ProgressSpinner',
    template: '<div class="progress-spinner">Loading...</div>',
  },
}))

// Mock DynamicForm component
vi.mock('@/components/dynamic/DynamicForm.vue', () => ({
  default: {
    name: 'DynamicForm',
    template: `
      <form @submit.prevent="$emit('submit', { field1: 'value1' })">
        <button type="submit">Submit</button>
        <button type="button" @click="$emit('cancel')">Cancel</button>
      </form>
    `,
    props: ['schema', 'initialValues', 'submitLabel', 'loading'],
  },
}))

describe('DynamicFormView', () => {
  let wrapper: VueWrapper<any>

  const mockSchema = {
    name: 'Test Schema',
    description: 'Test schema description',
    fields: [
      { name: 'field1', type: 'string', label: 'Field 1' },
    ],
  }

  const mockInstance = {
    id: '123',
    values: {
      field1: 'existing value',
      field2: 'another value',
    },
  }

  const createWrapper = () => {
    wrapper = mount(DynamicFormView, {
      global: {
        stubs: {},
      },
    })
    return wrapper
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockRoute.params.dataKey = 'test-key'
    mockRoute.params.id = undefined
    schemaRef.value = null
    instanceRef.value = null
    loadingRef.value = false
    errorRef.value = null
    canWriteRef.value = true
    mockFetchSchema.mockResolvedValue(undefined)
    mockFetchInstance.mockResolvedValue(undefined)
    mockCreateInstance.mockResolvedValue(undefined)
    mockUpdateInstance.mockResolvedValue(undefined)
  })

  describe('Component Rendering', () => {
    it('should render the view', () => {
      createWrapper()

      expect(wrapper.find('.dynamic-form-view').exists()).toBe(true)
    })

    it('should display Create title in create mode', async () => {
      schemaRef.value = mockSchema
      createWrapper()

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Create Test Schema')
    })

    it('should display Edit title in edit mode', async () => {
      mockRoute.params.id = '123'
      schemaRef.value = mockSchema
      createWrapper()

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Edit Test Schema')
    })

    it('should display schema description when present', async () => {
      schemaRef.value = mockSchema
      createWrapper()

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Test schema description')
    })

    it('should not display description when schema has no description', async () => {
      schemaRef.value = { ...mockSchema, description: undefined }
      createWrapper()

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).not.toContain('Test schema description')
    })

    it('should render back button', () => {
      createWrapper()

      const backButton = wrapper.find('button')
      expect(backButton.exists()).toBe(true)
    })
  })

  describe('Loading State', () => {
    it('should display loading spinner when loading and no schema', async () => {
      loadingRef.value = true
      schemaRef.value = null
      createWrapper()

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Loading...')
    })

    it('should not display loading spinner when schema is loaded', async () => {
      loadingRef.value = false
      schemaRef.value = mockSchema
      createWrapper()

      await wrapper.vm.$nextTick()

      expect(wrapper.find('.progress-spinner').exists()).toBe(false)
    })

    it('should hide form while loading without schema', async () => {
      loadingRef.value = true
      schemaRef.value = null
      createWrapper()

      await wrapper.vm.$nextTick()

      expect(wrapper.find('.card').exists()).toBe(false)
    })
  })

  describe('Error State', () => {
    it('should display error message when error occurs', async () => {
      errorRef.value = 'Failed to load schema'
      createWrapper()

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Failed to load schema')
    })

    it('should show error message component', async () => {
      errorRef.value = 'Error occurred'
      createWrapper()

      await wrapper.vm.$nextTick()

      expect(wrapper.find('.message').exists()).toBe(true)
    })

    it('should not show error message when no error', async () => {
      errorRef.value = null
      createWrapper()

      await wrapper.vm.$nextTick()

      expect(wrapper.find('.message').exists()).toBe(false)
    })
  })

  describe('Permission Handling', () => {
    it('should show access denied card when canWrite is false', async () => {
      schemaRef.value = mockSchema
      canWriteRef.value = false
      createWrapper()

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Access Denied')
    })

    it('should display create mode message in access denied for create', async () => {
      schemaRef.value = mockSchema
      canWriteRef.value = false
      createWrapper()

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain("You don't have permission to create Test Schema records")
    })

    it('should display edit mode message in access denied for edit', async () => {
      mockRoute.params.id = '123'
      schemaRef.value = mockSchema
      canWriteRef.value = false
      createWrapper()

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain("You don't have permission to edit Test Schema records")
    })

    it('should show back button in access denied state', async () => {
      schemaRef.value = mockSchema
      canWriteRef.value = false
      createWrapper()

      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Back to List')
    })

    it('should hide form when no permission', async () => {
      schemaRef.value = mockSchema
      canWriteRef.value = false
      createWrapper()

      await wrapper.vm.$nextTick()

      expect(wrapper.find('form').exists()).toBe(false)
    })
  })

  describe('Form Display', () => {
    it('should show form when schema loaded and canWrite is true', async () => {
      schemaRef.value = mockSchema
      canWriteRef.value = true
      createWrapper()

      await wrapper.vm.$nextTick()

      expect(wrapper.find('form').exists()).toBe(true)
    })

    it('should pass schema to DynamicForm', async () => {
      schemaRef.value = mockSchema
      createWrapper()

      await wrapper.vm.$nextTick()

      const form = wrapper.findComponent({ name: 'DynamicForm' })
      expect(form.props('schema')).toEqual(mockSchema)
    })

    it('should pass submitLabel as Create in create mode', async () => {
      schemaRef.value = mockSchema
      createWrapper()

      await wrapper.vm.$nextTick()

      const form = wrapper.findComponent({ name: 'DynamicForm' })
      expect(form.props('submitLabel')).toBe('Create')
    })

    it('should pass submitLabel as Update in edit mode', async () => {
      mockRoute.params.id = '123'
      schemaRef.value = mockSchema
      createWrapper()

      await wrapper.vm.$nextTick()

      const form = wrapper.findComponent({ name: 'DynamicForm' })
      expect(form.props('submitLabel')).toBe('Update')
    })

    it('should not show form when no schema', async () => {
      schemaRef.value = null
      createWrapper()

      await wrapper.vm.$nextTick()

      expect(wrapper.find('form').exists()).toBe(false)
    })
  })

  describe('Create Mode', () => {
    it('should start with empty initialValues in create mode', async () => {
      schemaRef.value = mockSchema
      createWrapper()

      await wrapper.vm.$nextTick()

      expect(wrapper.vm.initialValues).toEqual({})
    })

    it('should not fetch instance in create mode', async () => {
      schemaRef.value = mockSchema
      createWrapper()

      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(mockFetchInstance).not.toHaveBeenCalled()
    })

    it('should call createInstance on form submission', async () => {
      schemaRef.value = mockSchema
      createWrapper()

      await wrapper.vm.$nextTick()

      const form = wrapper.find('form')
      await form.trigger('submit.prevent')

      await wrapper.vm.$nextTick()

      expect(mockCreateInstance).toHaveBeenCalledWith({
        values: { field1: 'value1' },
      })
    })
  })

  describe('Edit Mode', () => {
    it('should fetch instance in edit mode', async () => {
      mockRoute.params.id = '123'
      schemaRef.value = mockSchema
      createWrapper()

      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(mockFetchInstance).toHaveBeenCalledWith('123')
    })

    it('should populate initialValues with instance data', async () => {
      mockRoute.params.id = '123'
      schemaRef.value = mockSchema
      instanceRef.value = mockInstance
      createWrapper()

      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(wrapper.vm.initialValues).toEqual(mockInstance.values)
    })

    it('should call updateInstance on form submission', async () => {
      mockRoute.params.id = '123'
      schemaRef.value = mockSchema
      instanceRef.value = mockInstance
      createWrapper()

      await wrapper.vm.$nextTick()

      const form = wrapper.find('form')
      await form.trigger('submit.prevent')

      await wrapper.vm.$nextTick()

      expect(mockUpdateInstance).toHaveBeenCalledWith('123', {
        values: { field1: 'value1' },
      })
    })

    it('should not populate initialValues if instance is null', async () => {
      mockRoute.params.id = '123'
      schemaRef.value = mockSchema
      instanceRef.value = null
      createWrapper()

      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(wrapper.vm.initialValues).toEqual({})
    })
  })

  describe('Form Submission', () => {
    it('should navigate to list view on successful creation', async () => {
      schemaRef.value = mockSchema
      createWrapper()

      await wrapper.vm.$nextTick()

      const form = wrapper.find('form')
      await form.trigger('submit.prevent')

      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(mockPush).toHaveBeenCalledWith('/dynamic/test-key')
    })

    it('should navigate to list view on successful update', async () => {
      mockRoute.params.id = '123'
      schemaRef.value = mockSchema
      createWrapper()

      await wrapper.vm.$nextTick()

      const form = wrapper.find('form')
      await form.trigger('submit.prevent')

      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(mockPush).toHaveBeenCalledWith('/dynamic/test-key')
    })

    it('should set submitLoading to true during submission', async () => {
      schemaRef.value = mockSchema
      mockCreateInstance.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      )
      createWrapper()

      await wrapper.vm.$nextTick()

      const form = wrapper.find('form')
      await form.trigger('submit.prevent')

      await wrapper.vm.$nextTick()

      expect(wrapper.vm.submitLoading).toBe(true)
    })

    it('should set submitLoading to false after submission completes', async () => {
      schemaRef.value = mockSchema
      createWrapper()

      await wrapper.vm.$nextTick()

      const form = wrapper.find('form')
      await form.trigger('submit.prevent')

      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(wrapper.vm.submitLoading).toBe(false)
    })

    it('should handle submission errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      schemaRef.value = mockSchema
      mockCreateInstance.mockRejectedValue(new Error('Network error'))
      createWrapper()

      await wrapper.vm.$nextTick()

      const form = wrapper.find('form')
      await form.trigger('submit.prevent')

      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to save instance:',
        expect.any(Error)
      )

      consoleErrorSpy.mockRestore()
    })

    it('should set submitLoading to false after error', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      schemaRef.value = mockSchema
      mockCreateInstance.mockRejectedValue(new Error('Network error'))
      createWrapper()

      await wrapper.vm.$nextTick()

      const form = wrapper.find('form')
      await form.trigger('submit.prevent')

      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(wrapper.vm.submitLoading).toBe(false)
    })
  })

  describe('Cancel Functionality', () => {
    it('should navigate back to list on cancel from form', async () => {
      schemaRef.value = mockSchema
      createWrapper()

      await wrapper.vm.$nextTick()

      const cancelButton = wrapper.findAll('button').find((btn) => btn.text().includes('Cancel'))
      await cancelButton?.trigger('click')

      expect(mockPush).toHaveBeenCalledWith('/dynamic/test-key')
    })

    it('should navigate back to list on back button click', async () => {
      schemaRef.value = mockSchema
      createWrapper()

      await wrapper.vm.$nextTick()

      const backButton = wrapper.findAll('button')[0]
      await backButton.trigger('click')

      expect(mockPush).toHaveBeenCalledWith('/dynamic/test-key')
    })

    it('should navigate back from access denied card', async () => {
      schemaRef.value = mockSchema
      canWriteRef.value = false
      createWrapper()

      await wrapper.vm.$nextTick()

      const backButton = wrapper.findAll('button').find((btn) => btn.text().includes('Back to List'))
      await backButton?.trigger('click')

      expect(mockPush).toHaveBeenCalledWith('/dynamic/test-key')
    })
  })

  describe('Component Lifecycle', () => {
    it('should fetch schema on mount', async () => {
      createWrapper()

      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(mockFetchSchema).toHaveBeenCalled()
    })

    it('should fetch instance after schema in edit mode', async () => {
      mockRoute.params.id = '123'
      createWrapper()

      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(mockFetchSchema).toHaveBeenCalled()
      expect(mockFetchInstance).toHaveBeenCalledWith('123')
    })

    it('should not fetch instance in create mode', async () => {
      createWrapper()

      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(mockFetchInstance).not.toHaveBeenCalled()
    })
  })

  describe('Route Parameters', () => {
    it('should extract dataKey from route params', () => {
      mockRoute.params.dataKey = 'my-data-key'
      createWrapper()

      expect(wrapper.vm.dataKey).toBe('my-data-key')
    })

    it('should extract id from route params in edit mode', () => {
      mockRoute.params.id = '456'
      createWrapper()

      expect(wrapper.vm.instanceId).toBe('456')
    })

    it('should compute isEditMode as true when id exists', () => {
      mockRoute.params.id = '789'
      createWrapper()

      expect(wrapper.vm.isEditMode).toBe(true)
    })

    it('should compute isEditMode as false when id is undefined', () => {
      mockRoute.params.id = undefined
      createWrapper()

      expect(wrapper.vm.isEditMode).toBe(false)
    })
  })
})
