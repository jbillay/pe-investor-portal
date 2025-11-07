import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePluginRegistryStore } from '../pluginRegistry'
import { pluginApiService } from '@/services/pluginApiService'
import type { Plugin, PluginManifest, PluginStatus } from '@/types/plugin'

// Mock dependencies
vi.mock('@/services/pluginApiService', () => ({
  pluginApiService: {
    getInstalledPlugins: vi.fn(),
    getPluginStatistics: vi.fn(),
    getPluginFileUrl: vi.fn(),
  },
}))

describe('Plugin Registry Store', () => {
  const mockManifest: PluginManifest = {
    id: 'test-plugin',
    name: 'Test Plugin',
    version: '1.0.0',
    author: 'Test Author',
    description: 'Test plugin description',
    homepage: 'https://example.com',
    menus: [
      {
        label: 'Test Menu',
        route: '/test',
        icon: 'pi-test',
        order: 1,
        type: 'main',
      },
      {
        label: 'Admin Menu',
        route: '/admin/test',
        icon: 'pi-admin',
        order: 2,
        type: 'admin',
      },
    ],
    widgets: [
      {
        id: 'test-widget',
        name: 'Test Widget',
        slot: 'dashboard',
        component: 'TestWidget',
        order: 1,
      },
    ],
    hooks: {
      onInstall: true,
      onUninstall: true,
    },
  }

  const mockPlugin: Plugin = {
    id: '1',
    pluginId: 'test-plugin',
    manifest: mockManifest,
    status: 'INSTALLED' as PluginStatus,
    version: '1.0.0',
    uploadedAt: new Date(),
    installedAt: new Date(),
    updatedAt: new Date(),
  }

  const mockPlugin2: Plugin = {
    id: '2',
    pluginId: 'test-plugin-2',
    manifest: {
      ...mockManifest,
      id: 'test-plugin-2',
      name: 'Test Plugin 2',
      menus: undefined,
      widgets: undefined,
    },
    status: 'UPLOADED' as PluginStatus,
    version: '1.0.0',
    uploadedAt: new Date(),
    installedAt: null,
    updatedAt: new Date(),
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('Initial State', () => {
    it('should initialize with empty plugins array', () => {
      const store = usePluginRegistryStore()
      expect(store.installedPlugins).toEqual([])
    })

    it('should initialize with empty loaded plugins map', () => {
      const store = usePluginRegistryStore()
      expect(store.loadedPlugins.size).toBe(0)
    })

    it('should initialize with loading false', () => {
      const store = usePluginRegistryStore()
      expect(store.isLoading).toBe(false)
    })

    it('should initialize with no error', () => {
      const store = usePluginRegistryStore()
      expect(store.error).toBeNull()
    })

    it('should initialize with null lastRefreshed', () => {
      const store = usePluginRegistryStore()
      expect(store.lastRefreshed).toBeNull()
    })
  })

  describe('Plugin Statistics', () => {
    it('should compute pluginCount correctly', async () => {
      vi.mocked(pluginApiService.getInstalledPlugins).mockResolvedValue([mockPlugin, mockPlugin2])

      const store = usePluginRegistryStore()
      await store.fetchInstalledPlugins()

      expect(store.pluginCount).toBe(2)
    })

    it('should compute pluginStatsByStatus correctly', async () => {
      const failedPlugin = { ...mockPlugin2, id: '3', status: 'FAILED' as PluginStatus }
      vi.mocked(pluginApiService.getInstalledPlugins).mockResolvedValue([
        mockPlugin,
        mockPlugin2,
        failedPlugin,
      ])

      const store = usePluginRegistryStore()
      await store.fetchInstalledPlugins()

      expect(store.pluginStatsByStatus).toEqual({
        UPLOADED: 1,
        INSTALLED: 1,
        FAILED: 1,
        UNINSTALLED: 0,
      })
    })

    it('should return correct statistics when no plugins', () => {
      const store = usePluginRegistryStore()
      expect(store.pluginStatsByStatus).toEqual({
        UPLOADED: 0,
        INSTALLED: 0,
        FAILED: 0,
        UNINSTALLED: 0,
      })
    })
  })

  describe('Menu Aggregation', () => {
    beforeEach(async () => {
      vi.mocked(pluginApiService.getInstalledPlugins).mockResolvedValue([mockPlugin])
    })

    it('should aggregate all menu items from installed plugins', async () => {
      const store = usePluginRegistryStore()
      await store.fetchInstalledPlugins()

      expect(store.allMenuItems).toHaveLength(2)
      expect(store.allMenuItems[0].label).toBe('Test Menu')
      expect(store.allMenuItems[1].label).toBe('Admin Menu')
    })

    it('should filter main menu items', async () => {
      const store = usePluginRegistryStore()
      await store.fetchInstalledPlugins()

      expect(store.mainMenuItems).toHaveLength(1)
      expect(store.mainMenuItems[0].type).toBe('main')
    })

    it('should filter admin menu items', async () => {
      const store = usePluginRegistryStore()
      await store.fetchInstalledPlugins()

      expect(store.adminMenuItems).toHaveLength(1)
      expect(store.adminMenuItems[0].type).toBe('admin')
    })

    it('should sort menu items by order', async () => {
      const pluginWithMenus = {
        ...mockPlugin,
        manifest: {
          ...mockManifest,
          menus: [
            { label: 'Menu 3', route: '/3', icon: 'pi-3', order: 3, type: 'main' as const },
            { label: 'Menu 1', route: '/1', icon: 'pi-1', order: 1, type: 'main' as const },
            { label: 'Menu 2', route: '/2', icon: 'pi-2', order: 2, type: 'main' as const },
          ],
        },
      }
      vi.mocked(pluginApiService.getInstalledPlugins).mockResolvedValue([pluginWithMenus])

      const store = usePluginRegistryStore()
      await store.fetchInstalledPlugins()

      expect(store.allMenuItems[0].order).toBe(1)
      expect(store.allMenuItems[1].order).toBe(2)
      expect(store.allMenuItems[2].order).toBe(3)
    })

    it('should not include menus from non-installed plugins', async () => {
      vi.mocked(pluginApiService.getInstalledPlugins).mockResolvedValue([mockPlugin, mockPlugin2])

      const store = usePluginRegistryStore()
      await store.fetchInstalledPlugins()

      // mockPlugin2 is UPLOADED, so its menus should not be included
      expect(store.allMenuItems).toHaveLength(2) // Only from mockPlugin
    })

    it('should handle plugins without menus', async () => {
      const pluginWithoutMenus = { ...mockPlugin, manifest: { ...mockManifest, menus: undefined } }
      vi.mocked(pluginApiService.getInstalledPlugins).mockResolvedValue([pluginWithoutMenus])

      const store = usePluginRegistryStore()
      await store.fetchInstalledPlugins()

      expect(store.allMenuItems).toHaveLength(0)
    })
  })

  describe('Widget Aggregation', () => {
    beforeEach(async () => {
      vi.mocked(pluginApiService.getInstalledPlugins).mockResolvedValue([mockPlugin])
    })

    it('should aggregate all widgets from installed plugins', async () => {
      const store = usePluginRegistryStore()
      await store.fetchInstalledPlugins()

      expect(store.allWidgets).toHaveLength(1)
      expect(store.allWidgets[0].name).toBe('Test Widget')
    })

    it('should add pluginId to widgets', async () => {
      const store = usePluginRegistryStore()
      await store.fetchInstalledPlugins()

      expect(store.allWidgets[0].pluginId).toBe('test-plugin')
    })

    it('should sort widgets by order', async () => {
      const pluginWithWidgets = {
        ...mockPlugin,
        manifest: {
          ...mockManifest,
          widgets: [
            { id: '3', name: 'Widget 3', slot: 'dashboard', component: 'W3', order: 3 },
            { id: '1', name: 'Widget 1', slot: 'dashboard', component: 'W1', order: 1 },
            { id: '2', name: 'Widget 2', slot: 'dashboard', component: 'W2', order: 2 },
          ],
        },
      }
      vi.mocked(pluginApiService.getInstalledPlugins).mockResolvedValue([pluginWithWidgets])

      const store = usePluginRegistryStore()
      await store.fetchInstalledPlugins()

      expect(store.allWidgets[0].order).toBe(1)
      expect(store.allWidgets[1].order).toBe(2)
      expect(store.allWidgets[2].order).toBe(3)
    })

    it('should filter widgets by slot', async () => {
      const pluginWithMultipleWidgets = {
        ...mockPlugin,
        manifest: {
          ...mockManifest,
          widgets: [
            { id: '1', name: 'Dashboard Widget', slot: 'dashboard', component: 'DW', order: 1 },
            { id: '2', name: 'Sidebar Widget', slot: 'sidebar', component: 'SW', order: 2 },
          ],
        },
      }
      vi.mocked(pluginApiService.getInstalledPlugins).mockResolvedValue([pluginWithMultipleWidgets])

      const store = usePluginRegistryStore()
      await store.fetchInstalledPlugins()

      const dashboardWidgets = store.getWidgetsBySlot('dashboard')
      expect(dashboardWidgets).toHaveLength(1)
      expect(dashboardWidgets[0].slot).toBe('dashboard')

      const sidebarWidgets = store.getWidgetsBySlot('sidebar')
      expect(sidebarWidgets).toHaveLength(1)
      expect(sidebarWidgets[0].slot).toBe('sidebar')
    })

    it('should handle plugins without widgets', async () => {
      const pluginWithoutWidgets = { ...mockPlugin, manifest: { ...mockManifest, widgets: undefined } }
      vi.mocked(pluginApiService.getInstalledPlugins).mockResolvedValue([pluginWithoutWidgets])

      const store = usePluginRegistryStore()
      await store.fetchInstalledPlugins()

      expect(store.allWidgets).toHaveLength(0)
    })
  })

  describe('Plugin Lookup', () => {
    beforeEach(async () => {
      vi.mocked(pluginApiService.getInstalledPlugins).mockResolvedValue([mockPlugin, mockPlugin2])
    })

    it('should get plugin by ID', async () => {
      const store = usePluginRegistryStore()
      await store.fetchInstalledPlugins()

      const plugin = store.getPluginById('test-plugin')
      expect(plugin).toEqual(mockPlugin)
    })

    it('should return undefined for non-existent plugin ID', async () => {
      const store = usePluginRegistryStore()
      await store.fetchInstalledPlugins()

      const plugin = store.getPluginById('non-existent')
      expect(plugin).toBeUndefined()
    })

    it('should check if plugin is loaded', () => {
      const store = usePluginRegistryStore()
      expect(store.isPluginLoaded('test-plugin')).toBe(false)

      // Simulate loading
      store.loadedPlugins.set('test-plugin', {
        manifest: mockManifest,
        loadedAt: new Date(),
      })

      expect(store.isPluginLoaded('test-plugin')).toBe(true)
    })

    it('should get loaded plugin', () => {
      const store = usePluginRegistryStore()
      const loadedPlugin = {
        manifest: mockManifest,
        loadedAt: new Date(),
      }
      store.loadedPlugins.set('test-plugin', loadedPlugin)

      const retrieved = store.getLoadedPlugin('test-plugin')
      expect(retrieved).toEqual(loadedPlugin)
    })

    it('should return undefined for non-loaded plugin', () => {
      const store = usePluginRegistryStore()
      const retrieved = store.getLoadedPlugin('non-existent')
      expect(retrieved).toBeUndefined()
    })

    it('should get plugin ID by route', async () => {
      const store = usePluginRegistryStore()
      await store.fetchInstalledPlugins()

      const pluginId = store.getPluginIdByRoute('/test')
      expect(pluginId).toBe('test-plugin')
    })

    it('should return undefined for non-existent route', async () => {
      const store = usePluginRegistryStore()
      await store.fetchInstalledPlugins()

      const pluginId = store.getPluginIdByRoute('/non-existent')
      expect(pluginId).toBeUndefined()
    })
  })

  describe('fetchInstalledPlugins', () => {
    it('should fetch plugins successfully', async () => {
      vi.mocked(pluginApiService.getInstalledPlugins).mockResolvedValue([mockPlugin])

      const store = usePluginRegistryStore()
      await store.fetchInstalledPlugins()

      expect(store.installedPlugins).toEqual([mockPlugin])
      expect(store.lastRefreshed).toBeTruthy()
      expect(store.error).toBeNull()
    })

    it('should handle fetch error', async () => {
      const error = new Error('Failed to fetch')
      vi.mocked(pluginApiService.getInstalledPlugins).mockRejectedValue(error)

      const store = usePluginRegistryStore()

      await expect(store.fetchInstalledPlugins()).rejects.toThrow('Failed to fetch')
      expect(store.error).toBe('Failed to fetch')
    })

    it('should set loading state during fetch', async () => {
      vi.mocked(pluginApiService.getInstalledPlugins).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([mockPlugin]), 100))
      )

      const store = usePluginRegistryStore()
      const fetchPromise = store.fetchInstalledPlugins()

      expect(store.isLoading).toBe(true)

      await fetchPromise

      expect(store.isLoading).toBe(false)
    })
  })

  describe('getStatistics', () => {
    it('should fetch statistics from API', async () => {
      const mockStats = {
        totalPlugins: 2,
        installedPlugins: 1,
        uploadedPlugins: 1,
        failedPlugins: 0,
        totalMenus: 2,
        totalWidgets: 1,
      }
      vi.mocked(pluginApiService.getPluginStatistics).mockResolvedValue(mockStats)

      const store = usePluginRegistryStore()
      const stats = await store.getStatistics()

      expect(stats).toEqual(mockStats)
    })

    it('should return fallback statistics on error', async () => {
      vi.mocked(pluginApiService.getInstalledPlugins).mockResolvedValue([mockPlugin, mockPlugin2])
      vi.mocked(pluginApiService.getPluginStatistics).mockRejectedValue(new Error('API Error'))

      const store = usePluginRegistryStore()
      await store.fetchInstalledPlugins()

      const stats = await store.getStatistics()

      expect(stats.totalPlugins).toBe(2)
      expect(stats.installedPlugins).toBe(1)
      expect(stats.uploadedPlugins).toBe(1)
    })
  })

  describe('Utility Actions', () => {
    it('should clear error', () => {
      const store = usePluginRegistryStore()
      store.error = 'Test error'

      store.clearError()

      expect(store.error).toBeNull()
    })

    it('should reset registry', () => {
      const store = usePluginRegistryStore()
      store.installedPlugins = [mockPlugin]
      store.loadedPlugins.set('test', { manifest: mockManifest, loadedAt: new Date() })
      store.lastRefreshed = new Date()
      store.error = 'Test error'

      store.resetRegistry()

      expect(store.installedPlugins).toEqual([])
      expect(store.loadedPlugins.size).toBe(0)
      expect(store.lastRefreshed).toBeNull()
      expect(store.error).toBeNull()
    })
  })

  describe('unloadPlugin', () => {
    it('should unload plugin successfully', () => {
      const store = usePluginRegistryStore()
      store.installedPlugins = [mockPlugin]
      store.loadedPlugins.set('test-plugin', {
        manifest: mockManifest,
        module: { default: {}, onUninstall: vi.fn() },
        loadedAt: new Date(),
      })

      store.unloadPlugin('test-plugin')

      expect(store.loadedPlugins.has('test-plugin')).toBe(false)
    })

    it('should execute onUninstall hook if defined', () => {
      const onUninstallMock = vi.fn()
      const store = usePluginRegistryStore()
      store.installedPlugins = [mockPlugin]
      store.loadedPlugins.set('test-plugin', {
        manifest: mockManifest,
        module: { default: {}, onUninstall: onUninstallMock },
        loadedAt: new Date(),
      })

      store.unloadPlugin('test-plugin')

      expect(onUninstallMock).toHaveBeenCalled()
    })

    it('should clear onInstall flag on unload', () => {
      const store = usePluginRegistryStore()
      const flagKey = 'plugin_test-plugin_onInstall_executed'
      localStorage.setItem(flagKey, 'true')

      store.installedPlugins = [mockPlugin]
      store.loadedPlugins.set('test-plugin', {
        manifest: mockManifest,
        loadedAt: new Date(),
      })

      store.unloadPlugin('test-plugin')

      expect(localStorage.getItem(flagKey)).toBeNull()
    })

    it('should handle unloading non-loaded plugin gracefully', () => {
      const store = usePluginRegistryStore()
      expect(() => store.unloadPlugin('non-existent')).not.toThrow()
    })
  })

  describe('loadPluginModule', () => {
    beforeEach(() => {
      vi.mocked(pluginApiService.getInstalledPlugins).mockResolvedValue([mockPlugin])
      vi.mocked(pluginApiService.getPluginFileUrl).mockReturnValue('/plugins/test-plugin/index.js')
    })

    it('should throw error if plugin not found', async () => {
      const store = usePluginRegistryStore()
      await store.fetchInstalledPlugins()

      await expect(store.loadPluginModule('non-existent')).rejects.toThrow()
    })

    it('should throw error if plugin not installed', async () => {
      const uploadedPlugin = { ...mockPlugin, status: 'UPLOADED' as PluginStatus }
      vi.mocked(pluginApiService.getInstalledPlugins).mockResolvedValue([uploadedPlugin])

      const store = usePluginRegistryStore()
      await store.fetchInstalledPlugins()

      await expect(store.loadPluginModule('test-plugin')).rejects.toThrow()
    })

    it('should return early if plugin already loaded', async () => {
      const store = usePluginRegistryStore()
      await store.fetchInstalledPlugins()

      // Pre-load the plugin
      store.loadedPlugins.set('test-plugin', {
        manifest: mockManifest,
        loadedAt: new Date(),
      })

      await store.loadPluginModule('test-plugin')

      // Should not call getPluginFileUrl since plugin is already loaded
      expect(pluginApiService.getPluginFileUrl).not.toHaveBeenCalled()
    })

    it('should store error in loaded plugins on import failure', async () => {
      const store = usePluginRegistryStore()
      await store.fetchInstalledPlugins()

      // The dynamic import will fail because the file doesn't exist
      await expect(store.loadPluginModule('test-plugin')).rejects.toThrow()

      const loadedPlugin = store.getLoadedPlugin('test-plugin')
      expect(loadedPlugin).toBeDefined()
      expect(loadedPlugin?.error).toBeDefined()
    })
  })

  describe('loadAllPlugins', () => {
    it('should attempt to load all installed plugins', async () => {
      const mockPlugin3 = {
        ...mockPlugin,
        id: '3',
        pluginId: 'test-plugin-3',
        status: 'INSTALLED' as PluginStatus,
      }
      vi.mocked(pluginApiService.getInstalledPlugins).mockResolvedValue([
        mockPlugin,
        mockPlugin2,
        mockPlugin3,
      ])
      vi.mocked(pluginApiService.getPluginFileUrl).mockReturnValue('/plugins/mock/index.js')

      const store = usePluginRegistryStore()
      await store.fetchInstalledPlugins()

      // loadAllPlugins will attempt to load plugins but will fail on dynamic import
      // The important thing is it doesn't throw and continues
      await expect(store.loadAllPlugins()).resolves.not.toThrow()
    })

    it('should continue loading other plugins if one fails', async () => {
      const mockPlugin3 = {
        ...mockPlugin,
        id: '3',
        pluginId: 'test-plugin-3',
        status: 'INSTALLED' as PluginStatus,
      }
      vi.mocked(pluginApiService.getInstalledPlugins).mockResolvedValue([mockPlugin, mockPlugin3])
      vi.mocked(pluginApiService.getPluginFileUrl).mockReturnValue('/plugins/mock/index.js')

      const store = usePluginRegistryStore()
      await store.fetchInstalledPlugins()

      // loadAllPlugins should not throw even if individual plugins fail to load
      await expect(store.loadAllPlugins()).resolves.not.toThrow()

      // Both plugins should have error states in loaded plugins
      expect(store.loadedPlugins.size).toBe(2)
    })
  })

  describe('refreshPluginRegistry', () => {
    it('should refresh plugins and reload modules', async () => {
      vi.mocked(pluginApiService.getInstalledPlugins).mockResolvedValue([mockPlugin])
      vi.mocked(pluginApiService.getPluginFileUrl).mockReturnValue('/plugins/mock/index.js')

      const store = usePluginRegistryStore()

      // refreshPluginRegistry should call fetchInstalledPlugins and loadAllPlugins
      await expect(store.refreshPluginRegistry()).resolves.not.toThrow()

      // After refresh, installedPlugins should be populated
      expect(store.installedPlugins).toHaveLength(1)
      expect(store.lastRefreshed).not.toBeNull()
    })
  })

  describe('initialize', () => {
    it('should initialize plugin system successfully', async () => {
      vi.mocked(pluginApiService.getInstalledPlugins).mockResolvedValue([mockPlugin])
      vi.mocked(pluginApiService.getPluginFileUrl).mockReturnValue('/plugins/mock/index.js')

      const store = usePluginRegistryStore()

      await expect(store.initialize()).resolves.not.toThrow()

      expect(store.installedPlugins).toEqual([mockPlugin])
      expect(store.error).toBeNull()
      expect(store.isLoading).toBe(false)
      expect(store.lastRefreshed).not.toBeNull()
    })

    it('should handle initialization error', async () => {
      const error = new Error('Initialization failed')
      vi.mocked(pluginApiService.getInstalledPlugins).mockRejectedValue(error)

      const store = usePluginRegistryStore()

      await expect(store.initialize()).rejects.toThrow('Initialization failed')
      expect(store.error).toBe('Initialization failed')
      expect(store.isLoading).toBe(false)
    })

    it('should set loading state during initialization', async () => {
      vi.mocked(pluginApiService.getInstalledPlugins).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([mockPlugin]), 100))
      )
      vi.mocked(pluginApiService.getPluginFileUrl).mockReturnValue('/plugins/mock/index.js')

      const store = usePluginRegistryStore()

      const initPromise = store.initialize()

      expect(store.isLoading).toBe(true)

      await initPromise

      expect(store.isLoading).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty plugin list', async () => {
      vi.mocked(pluginApiService.getInstalledPlugins).mockResolvedValue([])

      const store = usePluginRegistryStore()
      await store.fetchInstalledPlugins()

      expect(store.pluginCount).toBe(0)
      expect(store.allMenuItems).toHaveLength(0)
      expect(store.allWidgets).toHaveLength(0)
    })

    it('should handle plugins with missing manifest properties', async () => {
      const minimalPlugin = {
        ...mockPlugin,
        manifest: {
          id: 'minimal',
          name: 'Minimal',
          version: '1.0.0',
          author: 'Test',
          description: 'Test',
          homepage: 'https://example.com',
        } as PluginManifest,
      }
      vi.mocked(pluginApiService.getInstalledPlugins).mockResolvedValue([minimalPlugin])

      const store = usePluginRegistryStore()
      await store.fetchInstalledPlugins()

      expect(store.allMenuItems).toHaveLength(0)
      expect(store.allWidgets).toHaveLength(0)
    })
  })
})
