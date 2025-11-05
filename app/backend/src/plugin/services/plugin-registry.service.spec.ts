import { Test, TestingModule } from '@nestjs/testing';
import { PluginRegistryService } from './plugin-registry.service';
import { Plugin, PluginManifest } from '../interfaces';

describe('PluginRegistryService', () => {
  let service: PluginRegistryService;

  const mockPlugin: Plugin = {
    initialize: jest.fn(),
    onLoad: jest.fn(),
    onUnload: jest.fn(),
  };

  const mockManifest: PluginManifest = {
    id: 'test-plugin',
    name: 'Test Plugin',
    version: '1.0.0',
    description: 'A test plugin',
    author: 'Test Author',
    main: './index.js',
  };

  const mockManifest2: PluginManifest = {
    id: 'plugin-2',
    name: 'Plugin 2',
    version: '2.0.0',
    description: 'Second plugin',
    author: 'Author 2',
    main: './index.js',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PluginRegistryService],
    }).compile();

    service = module.get<PluginRegistryService>(PluginRegistryService);
  });

  afterEach(() => {
    // Clear registry after each test
    service.clearAll();
  });

  describe('registerPlugin', () => {
    it('should register a plugin successfully', () => {
      service.registerPlugin('test-plugin', mockPlugin, mockManifest);

      expect(service.isLoaded('test-plugin')).toBe(true);
      expect(service.getPluginCount()).toBe(1);
    });

    it('should store plugin instance', () => {
      service.registerPlugin('test-plugin', mockPlugin, mockManifest);

      const plugin = service.getPlugin('test-plugin');
      expect(plugin).toBe(mockPlugin);
    });

    it('should store plugin manifest', () => {
      service.registerPlugin('test-plugin', mockPlugin, mockManifest);

      const manifest = service.getManifest('test-plugin');
      expect(manifest).toEqual(mockManifest);
    });

    it('should store plugin metadata with loaded status', () => {
      service.registerPlugin('test-plugin', mockPlugin, mockManifest);

      const metadata = service.getMetadata('test-plugin');
      expect(metadata).toBeDefined();
      expect(metadata?.status).toBe('loaded');
      expect(metadata?.version).toBe('1.0.0');
      expect(metadata?.loadedAt).toBeInstanceOf(Date);
    });

    it('should allow registering multiple plugins', () => {
      service.registerPlugin('plugin-1', mockPlugin, mockManifest);
      service.registerPlugin('plugin-2', mockPlugin, mockManifest2);

      expect(service.getPluginCount()).toBe(2);
      expect(service.isLoaded('plugin-1')).toBe(true);
      expect(service.isLoaded('plugin-2')).toBe(true);
    });
  });

  describe('unregisterPlugin', () => {
    beforeEach(() => {
      service.registerPlugin('test-plugin', mockPlugin, mockManifest);
    });

    it('should unregister a plugin', () => {
      service.unregisterPlugin('test-plugin');

      expect(service.isLoaded('test-plugin')).toBe(false);
      expect(service.getPluginCount()).toBe(0);
    });

    it('should remove plugin instance', () => {
      service.unregisterPlugin('test-plugin');

      const plugin = service.getPlugin('test-plugin');
      expect(plugin).toBeUndefined();
    });

    it('should remove plugin manifest', () => {
      service.unregisterPlugin('test-plugin');

      const manifest = service.getManifest('test-plugin');
      expect(manifest).toBeUndefined();
    });

    it('should mark plugin metadata as unloaded', () => {
      service.unregisterPlugin('test-plugin');

      const metadata = service.getMetadata('test-plugin');
      expect(metadata?.status).toBe('unloaded');
    });

    it('should handle unregistering non-existent plugin gracefully', () => {
      expect(() => service.unregisterPlugin('non-existent')).not.toThrow();
    });
  });

  describe('getPlugin', () => {
    it('should return plugin instance when loaded', () => {
      service.registerPlugin('test-plugin', mockPlugin, mockManifest);

      const plugin = service.getPlugin('test-plugin');
      expect(plugin).toBe(mockPlugin);
    });

    it('should return undefined for non-existent plugin', () => {
      const plugin = service.getPlugin('non-existent');
      expect(plugin).toBeUndefined();
    });
  });

  describe('getManifest', () => {
    it('should return manifest when plugin is loaded', () => {
      service.registerPlugin('test-plugin', mockPlugin, mockManifest);

      const manifest = service.getManifest('test-plugin');
      expect(manifest).toEqual(mockManifest);
    });

    it('should return undefined for non-existent plugin', () => {
      const manifest = service.getManifest('non-existent');
      expect(manifest).toBeUndefined();
    });
  });

  describe('getAllPluginIds', () => {
    it('should return empty array when no plugins loaded', () => {
      const ids = service.getAllPluginIds();
      expect(ids).toEqual([]);
    });

    it('should return all loaded plugin IDs', () => {
      service.registerPlugin('plugin-1', mockPlugin, mockManifest);
      service.registerPlugin('plugin-2', mockPlugin, mockManifest2);

      const ids = service.getAllPluginIds();
      expect(ids).toHaveLength(2);
      expect(ids).toContain('plugin-1');
      expect(ids).toContain('plugin-2');
    });
  });

  describe('getAllPlugins', () => {
    it('should return empty array when no plugins loaded', () => {
      const plugins = service.getAllPlugins();
      expect(plugins).toEqual([]);
    });

    it('should return all loaded plugin instances', () => {
      service.registerPlugin('plugin-1', mockPlugin, mockManifest);
      service.registerPlugin('plugin-2', mockPlugin, mockManifest2);

      const plugins = service.getAllPlugins();
      expect(plugins).toHaveLength(2);
    });
  });

  describe('getAllManifests', () => {
    it('should return empty array when no plugins loaded', () => {
      const manifests = service.getAllManifests();
      expect(manifests).toEqual([]);
    });

    it('should return all plugin manifests', () => {
      service.registerPlugin('plugin-1', mockPlugin, mockManifest);
      service.registerPlugin('plugin-2', mockPlugin, mockManifest2);

      const manifests = service.getAllManifests();
      expect(manifests).toHaveLength(2);
      expect(manifests).toContainEqual(mockManifest);
      expect(manifests).toContainEqual(mockManifest2);
    });
  });

  describe('isLoaded', () => {
    it('should return true for loaded plugin', () => {
      service.registerPlugin('test-plugin', mockPlugin, mockManifest);

      expect(service.isLoaded('test-plugin')).toBe(true);
    });

    it('should return false for non-loaded plugin', () => {
      expect(service.isLoaded('non-existent')).toBe(false);
    });

    it('should return false after unregistering', () => {
      service.registerPlugin('test-plugin', mockPlugin, mockManifest);
      service.unregisterPlugin('test-plugin');

      expect(service.isLoaded('test-plugin')).toBe(false);
    });
  });

  describe('getPluginCount', () => {
    it('should return 0 when no plugins loaded', () => {
      expect(service.getPluginCount()).toBe(0);
    });

    it('should return correct count of loaded plugins', () => {
      service.registerPlugin('plugin-1', mockPlugin, mockManifest);
      expect(service.getPluginCount()).toBe(1);

      service.registerPlugin('plugin-2', mockPlugin, mockManifest2);
      expect(service.getPluginCount()).toBe(2);
    });

    it('should decrement count after unregistering', () => {
      service.registerPlugin('plugin-1', mockPlugin, mockManifest);
      service.registerPlugin('plugin-2', mockPlugin, mockManifest2);
      expect(service.getPluginCount()).toBe(2);

      service.unregisterPlugin('plugin-1');
      expect(service.getPluginCount()).toBe(1);
    });
  });

  describe('getMetadata', () => {
    it('should return metadata for loaded plugin', () => {
      service.registerPlugin('test-plugin', mockPlugin, mockManifest);

      const metadata = service.getMetadata('test-plugin');
      expect(metadata).toBeDefined();
      expect(metadata?.status).toBe('loaded');
      expect(metadata?.version).toBe('1.0.0');
    });

    it('should return undefined for non-existent plugin', () => {
      const metadata = service.getMetadata('non-existent');
      expect(metadata).toBeUndefined();
    });
  });

  describe('markPluginError', () => {
    it('should mark existing plugin as errored', () => {
      service.registerPlugin('test-plugin', mockPlugin, mockManifest);

      service.markPluginError('test-plugin', 'Test error');

      const metadata = service.getMetadata('test-plugin');
      expect(metadata?.status).toBe('error');
      expect(metadata?.errorMessage).toBe('Test error');
    });

    it('should create metadata for non-existent plugin', () => {
      service.markPluginError('new-plugin', 'Error before load');

      const metadata = service.getMetadata('new-plugin');
      expect(metadata?.status).toBe('error');
      expect(metadata?.errorMessage).toBe('Error before load');
      expect(metadata?.version).toBe('unknown');
    });

    it('should preserve version for existing plugin', () => {
      service.registerPlugin('test-plugin', mockPlugin, mockManifest);

      service.markPluginError('test-plugin', 'Test error');

      const metadata = service.getMetadata('test-plugin');
      expect(metadata?.version).toBe('1.0.0');
    });
  });

  describe('clearAll', () => {
    it('should clear all plugins from registry', () => {
      service.registerPlugin('plugin-1', mockPlugin, mockManifest);
      service.registerPlugin('plugin-2', mockPlugin, mockManifest2);
      expect(service.getPluginCount()).toBe(2);

      service.clearAll();

      expect(service.getPluginCount()).toBe(0);
      expect(service.getAllPluginIds()).toEqual([]);
      expect(service.getAllManifests()).toEqual([]);
    });

    it('should clear metadata', () => {
      service.registerPlugin('test-plugin', mockPlugin, mockManifest);

      service.clearAll();

      const metadata = service.getMetadata('test-plugin');
      expect(metadata).toBeUndefined();
    });
  });

  describe('getStats', () => {
    it('should return empty stats when no plugins', () => {
      const stats = service.getStats();

      expect(stats.totalLoaded).toBe(0);
      expect(stats.totalErrors).toBe(0);
      expect(stats.plugins).toEqual([]);
    });

    it('should return correct stats for loaded plugins', () => {
      service.registerPlugin('plugin-1', mockPlugin, mockManifest);
      service.registerPlugin('plugin-2', mockPlugin, mockManifest2);

      const stats = service.getStats();

      expect(stats.totalLoaded).toBe(2);
      expect(stats.totalErrors).toBe(0);
      expect(stats.plugins).toHaveLength(2);
    });

    it('should count errored plugins correctly', () => {
      service.registerPlugin('plugin-1', mockPlugin, mockManifest);
      service.registerPlugin('plugin-2', mockPlugin, mockManifest2);
      service.markPluginError('plugin-1', 'Test error');

      const stats = service.getStats();

      expect(stats.totalLoaded).toBe(1);
      expect(stats.totalErrors).toBe(1);
      expect(stats.plugins).toHaveLength(2);
    });

    it('should include error messages in stats', () => {
      service.registerPlugin('test-plugin', mockPlugin, mockManifest);
      service.markPluginError('test-plugin', 'Test error');

      const stats = service.getStats();

      const pluginStat = stats.plugins.find((p) => p.id === 'test-plugin');
      expect(pluginStat?.errorMessage).toBe('Test error');
    });
  });

  describe('getMenuItems', () => {
    const manifestWithMenus: PluginManifest = {
      ...mockManifest,
      menus: [
        { id: 'menu-1', label: 'Menu 1', type: 'main', order: 2 },
        { id: 'menu-2', label: 'Menu 2', type: 'admin', order: 1 },
      ],
    };

    it('should return empty array when no plugins have menus', () => {
      service.registerPlugin('test-plugin', mockPlugin, mockManifest);

      const menus = service.getMenuItems();
      expect(menus).toEqual([]);
    });

    it('should return all menu items from all plugins', () => {
      service.registerPlugin('test-plugin', mockPlugin, manifestWithMenus);

      const menus = service.getMenuItems();
      expect(menus).toHaveLength(2);
    });

    it('should filter by menu type', () => {
      service.registerPlugin('test-plugin', mockPlugin, manifestWithMenus);

      const mainMenus = service.getMenuItems('main');
      expect(mainMenus).toHaveLength(1);
      expect(mainMenus[0].type).toBe('main');

      const adminMenus = service.getMenuItems('admin');
      expect(adminMenus).toHaveLength(1);
      expect(adminMenus[0].type).toBe('admin');
    });

    it('should sort menu items by order', () => {
      const manifest2WithMenus: PluginManifest = {
        ...mockManifest2,
        menus: [
          { id: 'menu-3', label: 'Menu 3', type: 'main', order: 1 },
        ],
      };

      service.registerPlugin('plugin-1', mockPlugin, manifestWithMenus);
      service.registerPlugin('plugin-2', mockPlugin, manifest2WithMenus);

      const menus = service.getMenuItems('main');
      expect(menus).toHaveLength(2);
      expect(menus[0].order).toBe(1);
      expect(menus[1].order).toBe(2);
    });
  });

  describe('getWidgets', () => {
    const manifestWithWidgets: PluginManifest = {
      ...mockManifest,
      widgets: [
        { id: 'widget-1', name: 'Widget 1', slot: 'dashboard', order: 2 },
        { id: 'widget-2', name: 'Widget 2', slot: 'sidebar', order: 1 },
      ],
    };

    it('should return empty array when no plugins have widgets', () => {
      service.registerPlugin('test-plugin', mockPlugin, mockManifest);

      const widgets = service.getWidgets();
      expect(widgets).toEqual([]);
    });

    it('should return all widgets from all plugins', () => {
      service.registerPlugin('test-plugin', mockPlugin, manifestWithWidgets);

      const widgets = service.getWidgets();
      expect(widgets).toHaveLength(2);
    });

    it('should filter by widget slot', () => {
      service.registerPlugin('test-plugin', mockPlugin, manifestWithWidgets);

      const dashboardWidgets = service.getWidgets('dashboard');
      expect(dashboardWidgets).toHaveLength(1);
      expect(dashboardWidgets[0].slot).toBe('dashboard');

      const sidebarWidgets = service.getWidgets('sidebar');
      expect(sidebarWidgets).toHaveLength(1);
      expect(sidebarWidgets[0].slot).toBe('sidebar');
    });

    it('should sort widgets by order', () => {
      const manifest2WithWidgets: PluginManifest = {
        ...mockManifest2,
        widgets: [
          { id: 'widget-3', name: 'Widget 3', slot: 'dashboard', order: 1 },
        ],
      };

      service.registerPlugin('plugin-1', mockPlugin, manifestWithWidgets);
      service.registerPlugin('plugin-2', mockPlugin, manifest2WithWidgets);

      const widgets = service.getWidgets('dashboard');
      expect(widgets).toHaveLength(2);
      expect(widgets[0].order).toBe(1);
      expect(widgets[1].order).toBe(2);
    });
  });
});
