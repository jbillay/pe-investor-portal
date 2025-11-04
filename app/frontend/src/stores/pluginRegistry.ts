/**
 * Plugin Registry Store
 * Manages plugin state, loading, and aggregation of plugin features
 * Handles dynamic plugin loading and lifecycle management
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { pluginApiService } from '@/services/pluginApiService';
import type {
  Plugin,
  PluginManifest,
  PluginMenuItem,
  PluginWidget,
  PluginStatistics,
  LoadedPlugin,
  PluginStatus
} from '@/types/plugin';

export const usePluginRegistryStore = defineStore('pluginRegistry', () => {
  // State
  const installedPlugins = ref<Plugin[]>([]);
  const loadedPlugins = ref<Map<string, LoadedPlugin>>(new Map());
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const lastRefreshed = ref<Date | null>(null);

  // Getters - Plugin Statistics
  const pluginCount = computed(() => installedPlugins.value.length);

  const pluginStatsByStatus = computed(() => {
    const stats: Record<PluginStatus, number> = {
      UPLOADED: 0,
      INSTALLED: 0,
      FAILED: 0,
      UNINSTALLED: 0
    };

    installedPlugins.value.forEach(plugin => {
      stats[plugin.status]++;
    });

    return stats;
  });

  // Getters - Menu Aggregation
  const allMenuItems = computed((): PluginMenuItem[] => {
    const menus: PluginMenuItem[] = [];

    installedPlugins.value.forEach(plugin => {
      if (plugin.status === 'INSTALLED' && plugin.manifest.menus) {
        menus.push(...plugin.manifest.menus);
      }
    });

    // Sort by order
    return menus.sort((a, b) => a.order - b.order);
  });

  const mainMenuItems = computed((): PluginMenuItem[] => {
    return allMenuItems.value.filter(menu => menu.type === 'main');
  });

  const adminMenuItems = computed((): PluginMenuItem[] => {
    return allMenuItems.value.filter(menu => menu.type === 'admin');
  });

  // Getters - Widget Aggregation
  const allWidgets = computed((): PluginWidget[] => {
    const widgets: PluginWidget[] = [];

    installedPlugins.value.forEach(plugin => {
      if (plugin.status === 'INSTALLED' && plugin.manifest.widgets) {
        // Add pluginId to each widget so we can load the component later
        const widgetsWithPluginId = plugin.manifest.widgets.map(widget => ({
          ...widget,
          pluginId: plugin.pluginId
        }));
        widgets.push(...widgetsWithPluginId);
      }
    });

    // Sort by order
    return widgets.sort((a, b) => a.order - b.order);
  });

  const getWidgetsBySlot = (slot: string): PluginWidget[] => {
    return allWidgets.value.filter(widget => widget.slot === slot);
  };

  // Getters - Plugin Lookup
  const getPluginById = (pluginId: string): Plugin | undefined => {
    return installedPlugins.value.find(p => p.pluginId === pluginId);
  };

  const getLoadedPlugin = (pluginId: string): LoadedPlugin | undefined => {
    return loadedPlugins.value.get(pluginId);
  };

  const isPluginLoaded = (pluginId: string): boolean => {
    return loadedPlugins.value.has(pluginId);
  };

  const getPluginIdByRoute = (route: string): string | undefined => {
    for (const plugin of installedPlugins.value) {
      if (plugin.status === 'INSTALLED' && plugin.manifest.menus) {
        const menu = plugin.manifest.menus.find(m => m.route === route);
        if (menu) {
          return plugin.pluginId;
        }
      }
    }
    return undefined;
  };;

  // Actions - Fetch Plugins
  async function fetchInstalledPlugins(): Promise<void> {
    try {
      isLoading.value = true;
      error.value = null;

      console.log('Fetching installed plugins...');
      const plugins = await pluginApiService.getInstalledPlugins();

      installedPlugins.value = plugins;
      lastRefreshed.value = new Date();

      console.log(`Loaded ${plugins.length} installed plugins`);
    } catch (err: any) {
      console.error('Error fetching installed plugins:', err);
      error.value = err.message || 'Failed to fetch installed plugins';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  // Actions - Plugin Module Loading
  async function loadPluginModule(pluginId: string): Promise<void> {
    try {
      const plugin = getPluginById(pluginId);

      if (!plugin) {
        throw new Error(`Plugin ${pluginId} not found in registry`);
      }

      if (plugin.status !== 'INSTALLED') {
        throw new Error(`Plugin ${pluginId} is not installed`);
      }

      // Check if already loaded
      if (isPluginLoaded(pluginId)) {
        console.log(`Plugin ${pluginId} already loaded`);
        return;
      }

      console.log(`Loading plugin module: ${pluginId}`);

      // Construct URL to plugin entry point
      const entryPointUrl = pluginApiService.getPluginFileUrl(
        pluginId,
        'index.js'
      );

      // Dynamically import the plugin module
      const pluginModule = await import(/* @vite-ignore */ entryPointUrl);

      // Store loaded plugin
      const loadedPlugin: LoadedPlugin = {
        manifest: plugin.manifest,
        module: pluginModule,
        component: pluginModule.default || pluginModule,
        loadedAt: new Date()
      };

      loadedPlugins.value.set(pluginId, loadedPlugin);

      console.log(`Plugin ${pluginId} loaded successfully`);

      // Execute onInstall hook only once (on first load after installation)
      // Check if onInstall has already been executed for this plugin
      const installFlagKey = `plugin_${pluginId}_onInstall_executed`;
      const hasExecutedOnInstall = localStorage.getItem(installFlagKey) === 'true';

      if (plugin.manifest.hooks?.onInstall && pluginModule.onInstall && !hasExecutedOnInstall) {
        console.log(`Executing onInstall hook for ${pluginId} (first time)`);
        try {
          await pluginModule.onInstall();
          // Mark onInstall as executed so it doesn't run again
          localStorage.setItem(installFlagKey, 'true');
        } catch (hookError) {
          console.error(`onInstall hook failed for ${pluginId}:`, hookError);
          // Don't fail the entire load if hook fails
        }
      }
    } catch (err: any) {
      console.error(`Error loading plugin ${pluginId}:`, err);

      // Store error in loaded plugins map
      const errorPlugin: LoadedPlugin = {
        manifest: getPluginById(pluginId)!.manifest,
        loadedAt: new Date(),
        error: err.message || 'Failed to load plugin'
      };
      loadedPlugins.value.set(pluginId, errorPlugin);

      throw err;
    }
  }

  // Actions - Load All Plugins
  async function loadAllPlugins(): Promise<void> {
    console.log('Loading all installed plugin modules...');

    const loadPromises = installedPlugins.value
      .filter(plugin => plugin.status === 'INSTALLED')
      .map(plugin => loadPluginModule(plugin.pluginId).catch(err => {
        console.error(`Failed to load plugin ${plugin.pluginId}:`, err);
        // Continue loading other plugins even if one fails
      }));

    await Promise.all(loadPromises);

    console.log(`Loaded ${loadedPlugins.value.size} plugin modules`);
  }

  // Actions - Unload Plugin
  function unloadPlugin(pluginId: string): void {
    const loadedPlugin = loadedPlugins.value.get(pluginId);

    if (!loadedPlugin) {
      console.warn(`Plugin ${pluginId} is not loaded`);
      return;
    }

    // Execute onUninstall hook if defined
    const plugin = getPluginById(pluginId);
    if (plugin?.manifest.hooks?.onUninstall && loadedPlugin.module?.onUninstall) {
      console.log(`Executing onUninstall hook for ${pluginId}`);
      try {
        loadedPlugin.module.onUninstall();
      } catch (hookError) {
        console.error(`onUninstall hook failed for ${pluginId}:`, hookError);
      }
    }

    // Clear onInstall flag so it will run again if plugin is reinstalled
    const installFlagKey = `plugin_${pluginId}_onInstall_executed`;
    localStorage.removeItem(installFlagKey);

    loadedPlugins.value.delete(pluginId);
    console.log(`Plugin ${pluginId} unloaded`);
  }

  // Actions - Refresh After Install/Uninstall
  async function refreshPluginRegistry(): Promise<void> {
    console.log('Refreshing plugin registry...');
    await fetchInstalledPlugins();
    await loadAllPlugins();
  }

  // Actions - Get Plugin Statistics
  async function getStatistics(): Promise<PluginStatistics> {
    try {
      return await pluginApiService.getPluginStatistics();
    } catch (err: any) {
      console.error('Error fetching plugin statistics:', err);
      // Return computed statistics as fallback
      return {
        totalPlugins: installedPlugins.value.length,
        installedPlugins: pluginStatsByStatus.value.INSTALLED,
        uploadedPlugins: pluginStatsByStatus.value.UPLOADED,
        failedPlugins: pluginStatsByStatus.value.FAILED,
        totalMenus: allMenuItems.value.length,
        totalWidgets: allWidgets.value.length
      };
    }
  }

  // Actions - Initialize Plugin System
  async function initialize(): Promise<void> {
    try {
      console.log('Initializing plugin system...');
      isLoading.value = true;
      error.value = null;

      // Step 1: Fetch installed plugins from backend
      await fetchInstalledPlugins();

      // Step 2: Load all plugin modules
      await loadAllPlugins();

      console.log('Plugin system initialized successfully');
    } catch (err: any) {
      console.error('Error initializing plugin system:', err);
      error.value = err.message || 'Failed to initialize plugin system';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  // Actions - Clear Error
  function clearError(): void {
    error.value = null;
  }

  // Actions - Reset Registry
  function resetRegistry(): void {
    installedPlugins.value = [];
    loadedPlugins.value.clear();
    lastRefreshed.value = null;
    error.value = null;
    console.log('Plugin registry reset');
  }

  return {
    // State
    installedPlugins,
    loadedPlugins,
    isLoading,
    error,
    lastRefreshed,

    // Getters - Statistics
    pluginCount,
    pluginStatsByStatus,

    // Getters - Menus
    allMenuItems,
    mainMenuItems,
    adminMenuItems,

    // Getters - Widgets
    allWidgets,
    getWidgetsBySlot,

    // Getters - Lookup
    getPluginById,
    getLoadedPlugin,
    isPluginLoaded,
    getPluginIdByRoute,

    // Actions - Fetching
    fetchInstalledPlugins,

    // Actions - Loading
    loadPluginModule,
    loadAllPlugins,
    unloadPlugin,

    // Actions - Refresh
    refreshPluginRegistry,

    // Actions - Statistics
    getStatistics,

    // Actions - Initialization
    initialize,

    // Actions - Utility
    clearError,
    resetRegistry
  };
});
