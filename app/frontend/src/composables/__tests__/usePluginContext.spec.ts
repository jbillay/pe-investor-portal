import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import {
  usePluginContext,
  setPluginContextProviders,
  clearPluginEvents,
  pluginEventBus
} from '../usePluginContext'
import { useAuthStore } from '@/stores/auth'
import { usePluginRegistryStore } from '@/stores/pluginRegistry'
import type { Plugin, PluginManifest } from '@/types/plugin'
import type { User } from '@/types/auth'

// Mock router
const mockRouter = {
  push: vi.fn(),
  back: vi.fn(),
} as any

// Mock toast
const mockToast = {
  add: vi.fn(),
} as any

describe('usePluginContext', () => {
  const mockManifest: PluginManifest = {
    id: 'test-plugin',
    name: 'Test Plugin',
    version: '1.0.0',
    author: 'Test Author',
    description: 'Test plugin',
    homepage: 'https://example.com',
  }

  const mockPlugin: Plugin = {
    id: '1',
    pluginId: 'test-plugin',
    manifest: mockManifest,
    status: 'INSTALLED',
    version: '1.0.0',
    uploadedAt: new Date(),
    installedAt: new Date(),
    updatedAt: new Date(),
  }

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    roles: ['ADMIN', 'USER'],
    permissions: ['read:all', 'write:all'],
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorage.clear()
    clearPluginEvents()

    // Set up global providers
    setPluginContextProviders(mockRouter, mockToast)

    // Set up plugin registry
    const pluginStore = usePluginRegistryStore()
    pluginStore.installedPlugins = [mockPlugin]
  })

  afterEach(() => {
    localStorage.clear()
    clearPluginEvents()
  })

  describe('Initialization', () => {
    it('should throw error if router not initialized', () => {
      // Clear providers
      setPluginContextProviders(null as any, mockToast)

      expect(() => usePluginContext('test-plugin')).toThrow('Plugin context not initialized - router not available')
    })

    it('should throw error if toast not initialized', () => {
      // Clear providers
      setPluginContextProviders(mockRouter, null as any)

      expect(() => usePluginContext('test-plugin')).toThrow('Plugin context not initialized - toast service not available')
    })

    it('should throw error if plugin not found', () => {
      expect(() => usePluginContext('non-existent-plugin')).toThrow('Plugin non-existent-plugin not found in registry')
    })

    it('should initialize context successfully', () => {
      const context = usePluginContext('test-plugin')

      expect(context.pluginId).toBe('test-plugin')
      expect(context.manifest).toEqual(mockManifest)
      expect(context.appVersion).toBe('1.0.0')
      expect(context.coreVersion).toBe('1.0.0')
    })
  })

  describe('User Info', () => {
    it('should provide current user', () => {
      const authStore = useAuthStore()
      authStore.user = mockUser

      const context = usePluginContext('test-plugin')

      expect(context.currentUser.value).toEqual(mockUser)
    })

    it('should provide authentication status', () => {
      const authStore = useAuthStore()
      authStore.user = mockUser
      authStore.accessToken = 'token-123'

      const context = usePluginContext('test-plugin')

      expect(context.isAuthenticated.value).toBe(true)
    })

    it('should provide user roles', () => {
      const authStore = useAuthStore()
      authStore.user = mockUser

      const context = usePluginContext('test-plugin')

      expect(context.userRoles.value).toEqual(['ADMIN', 'USER'])
    })

    it('should provide user permissions', () => {
      const authStore = useAuthStore()
      authStore.user = mockUser

      const context = usePluginContext('test-plugin')

      expect(context.userPermissions.value).toEqual(['read:all', 'write:all'])
    })

    it('should return empty arrays when no user', () => {
      const context = usePluginContext('test-plugin')

      expect(context.userRoles.value).toEqual([])
      expect(context.userPermissions.value).toEqual([])
    })
  })

  describe('Permission Checking', () => {
    beforeEach(() => {
      const authStore = useAuthStore()
      authStore.user = mockUser
    })

    it('should check if user has role', () => {
      const context = usePluginContext('test-plugin')

      expect(context.hasRole('ADMIN')).toBe(true)
      expect(context.hasRole('USER')).toBe(true)
      expect(context.hasRole('SUPER_ADMIN')).toBe(false)
    })

    it('should check if user has permission', () => {
      const context = usePluginContext('test-plugin')

      expect(context.hasPermission('read:all')).toBe(true)
      expect(context.hasPermission('write:all')).toBe(true)
      expect(context.hasPermission('delete:all')).toBe(false)
    })

    it('should check if user has any of multiple roles', () => {
      const context = usePluginContext('test-plugin')

      expect(context.hasAnyRole(['ADMIN', 'SUPER_ADMIN'])).toBe(true)
      expect(context.hasAnyRole(['SUPER_ADMIN', 'MODERATOR'])).toBe(false)
    })

    it('should check if user has all roles', () => {
      const context = usePluginContext('test-plugin')

      expect(context.hasAllRoles(['ADMIN', 'USER'])).toBe(true)
      expect(context.hasAllRoles(['ADMIN', 'SUPER_ADMIN'])).toBe(false)
    })
  })

  describe('Routing', () => {
    it('should navigate to path', async () => {
      const context = usePluginContext('test-plugin')

      await context.navigateTo('/test-path')

      expect(mockRouter.push).toHaveBeenCalledWith('/test-path')
    })

    it('should navigate back', () => {
      const context = usePluginContext('test-plugin')

      context.navigateBack()

      expect(mockRouter.back).toHaveBeenCalled()
    })

    it('should provide router instance', () => {
      const context = usePluginContext('test-plugin')

      expect(context.router).toBe(mockRouter)
    })
  })

  describe('Notifications', () => {
    it('should show success notification', () => {
      const context = usePluginContext('test-plugin')

      context.showSuccess('Success message', 'Details here')

      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Success message',
        detail: 'Details here',
        life: 3000,
      })
    })

    it('should show error notification', () => {
      const context = usePluginContext('test-plugin')

      context.showError('Error message', 'Error details')

      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error message',
        detail: 'Error details',
        life: 5000,
      })
    })

    it('should show warning notification', () => {
      const context = usePluginContext('test-plugin')

      context.showWarning('Warning message', 'Warning details')

      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'warn',
        summary: 'Warning message',
        detail: 'Warning details',
        life: 4000,
      })
    })

    it('should show info notification', () => {
      const context = usePluginContext('test-plugin')

      context.showInfo('Info message', 'Info details')

      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'info',
        summary: 'Info message',
        detail: 'Info details',
        life: 3000,
      })
    })

    it('should show notifications without details', () => {
      const context = usePluginContext('test-plugin')

      context.showSuccess('Success')

      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Success',
        detail: undefined,
        life: 3000,
      })
    })

    it('should provide toast instance', () => {
      const context = usePluginContext('test-plugin')

      expect(context.toast).toBe(mockToast)
    })
  })

  describe('API Access', () => {
    it('should provide API base URL', () => {
      const context = usePluginContext('test-plugin')

      expect(context.apiBaseUrl).toBe('/api')
    })

    it('should generate API URL with endpoint', () => {
      const context = usePluginContext('test-plugin')

      expect(context.getApiUrl('/users')).toBe('/api/users')
      expect(context.getApiUrl('users')).toBe('/api/users')
    })
  })

  describe('Plugin Storage', () => {
    it('should set and get plugin data', () => {
      const context = usePluginContext('test-plugin')
      const testData = { key: 'value', count: 42 }

      context.setPluginData('test-key', testData)
      const retrieved = context.getPluginData('test-key')

      expect(retrieved).toEqual(testData)
    })

    it('should namespace plugin data by plugin ID', () => {
      const context1 = usePluginContext('test-plugin')
      const context2Plugin: Plugin = {
        ...mockPlugin,
        id: '2',
        pluginId: 'another-plugin',
        manifest: { ...mockManifest, id: 'another-plugin' },
      }

      const pluginStore = usePluginRegistryStore()
      pluginStore.installedPlugins.push(context2Plugin)

      const context2 = usePluginContext('another-plugin')

      context1.setPluginData('shared-key', 'plugin-1-value')
      context2.setPluginData('shared-key', 'plugin-2-value')

      expect(context1.getPluginData('shared-key')).toBe('plugin-1-value')
      expect(context2.getPluginData('shared-key')).toBe('plugin-2-value')
    })

    it('should return null for non-existent key', () => {
      const context = usePluginContext('test-plugin')

      const result = context.getPluginData('non-existent')

      expect(result).toBeNull()
    })

    it('should remove plugin data', () => {
      const context = usePluginContext('test-plugin')

      context.setPluginData('to-remove', 'value')
      expect(context.getPluginData('to-remove')).toBe('value')

      context.removePluginData('to-remove')
      expect(context.getPluginData('to-remove')).toBeNull()
    })

    it('should clear all plugin data', () => {
      const context = usePluginContext('test-plugin')

      context.setPluginData('key1', 'value1')
      context.setPluginData('key2', 'value2')
      context.setPluginData('key3', 'value3')

      context.clearPluginData()

      expect(context.getPluginData('key1')).toBeNull()
      expect(context.getPluginData('key2')).toBeNull()
      expect(context.getPluginData('key3')).toBeNull()
    })

    it('should only clear data for specific plugin', () => {
      const context1 = usePluginContext('test-plugin')

      const context2Plugin: Plugin = {
        ...mockPlugin,
        id: '2',
        pluginId: 'another-plugin',
        manifest: { ...mockManifest, id: 'another-plugin' },
      }

      const pluginStore = usePluginRegistryStore()
      pluginStore.installedPlugins.push(context2Plugin)
      const context2 = usePluginContext('another-plugin')

      context1.setPluginData('key', 'value1')
      context2.setPluginData('key', 'value2')

      context1.clearPluginData()

      expect(context1.getPluginData('key')).toBeNull()
      expect(context2.getPluginData('key')).toBe('value2')
    })

    it('should handle invalid JSON gracefully when reading', () => {
      const context = usePluginContext('test-plugin')

      // Manually set invalid JSON
      localStorage.setItem('plugin:test-plugin:invalid', '{invalid json}')

      const result = context.getPluginData('invalid')

      expect(result).toBeNull()
    })
  })

  describe('Inter-plugin Communication', () => {
    it('should emit and listen to events', () => {
      const context = usePluginContext('test-plugin')
      const handler = vi.fn()

      context.onEvent('test-event', handler)
      context.emitEvent('test-event', { data: 'test' })

      expect(handler).toHaveBeenCalledWith({ data: 'test' })
    })

    it('should emit namespaced and global events', () => {
      const context = usePluginContext('test-plugin')
      const namespacedHandler = vi.fn()
      const globalHandler = vi.fn()

      pluginEventBus.on('test-plugin:test-event', namespacedHandler)
      pluginEventBus.on('test-event', globalHandler)

      context.emitEvent('test-event', { data: 'test' })

      expect(namespacedHandler).toHaveBeenCalledWith({ data: 'test' })
      expect(globalHandler).toHaveBeenCalledWith({ data: 'test' })
    })

    it('should remove event listener', () => {
      const context = usePluginContext('test-plugin')
      const handler = vi.fn()

      context.onEvent('test-event', handler)
      context.emitEvent('test-event', { count: 1 })

      context.offEvent('test-event', handler)
      context.emitEvent('test-event', { count: 2 })

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith({ count: 1 })
    })

    it('should handle multiple listeners for same event', () => {
      const context = usePluginContext('test-plugin')
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      context.onEvent('test-event', handler1)
      context.onEvent('test-event', handler2)

      context.emitEvent('test-event', { data: 'test' })

      expect(handler1).toHaveBeenCalledWith({ data: 'test' })
      expect(handler2).toHaveBeenCalledWith({ data: 'test' })
    })

    it('should handle errors in event handlers gracefully', () => {
      const context = usePluginContext('test-plugin')
      const errorHandler = vi.fn(() => {
        throw new Error('Handler error')
      })
      const normalHandler = vi.fn()

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      context.onEvent('test-event', errorHandler)
      context.onEvent('test-event', normalHandler)

      context.emitEvent('test-event', { data: 'test' })

      expect(errorHandler).toHaveBeenCalled()
      expect(normalHandler).toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('should not call handler for different event', () => {
      const context = usePluginContext('test-plugin')
      const handler = vi.fn()

      context.onEvent('event-a', handler)
      context.emitEvent('event-b', { data: 'test' })

      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('clearPluginEvents', () => {
    it('should clear all event handlers', () => {
      const context = usePluginContext('test-plugin')
      const handler = vi.fn()

      context.onEvent('test-event', handler)
      clearPluginEvents()
      context.emitEvent('test-event', { data: 'test' })

      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('Multiple Plugin Instances', () => {
    it('should create separate contexts for different plugins', () => {
      const plugin2: Plugin = {
        ...mockPlugin,
        id: '2',
        pluginId: 'plugin-2',
        manifest: { ...mockManifest, id: 'plugin-2', name: 'Plugin 2' },
      }

      const pluginStore = usePluginRegistryStore()
      pluginStore.installedPlugins.push(plugin2)

      const context1 = usePluginContext('test-plugin')
      const context2 = usePluginContext('plugin-2')

      expect(context1.pluginId).toBe('test-plugin')
      expect(context2.pluginId).toBe('plugin-2')
      expect(context1.manifest.name).toBe('Test Plugin')
      expect(context2.manifest.name).toBe('Plugin 2')
    })
  })

  describe('setPluginContextProviders', () => {
    it('should set global router and toast', () => {
      const newRouter = { push: vi.fn(), back: vi.fn() } as any
      const newToast = { add: vi.fn() } as any

      setPluginContextProviders(newRouter, newToast)

      const context = usePluginContext('test-plugin')

      expect(context.router).toBe(newRouter)
      expect(context.toast).toBe(newToast)
    })
  })
})
