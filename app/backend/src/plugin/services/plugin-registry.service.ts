/**
 * Plugin Registry Service
 * Manages in-memory registry of loaded plugins
 */

import { Injectable, Logger } from '@nestjs/common';
import { Plugin, PluginManifest } from '../interfaces';

@Injectable()
export class PluginRegistryService {
  private readonly logger = new Logger(PluginRegistryService.name);

  // In-memory registry of loaded plugins
  private loadedPlugins: Map<string, Plugin> = new Map();

  // Registry of plugin manifests (cached)
  private pluginManifests: Map<string, PluginManifest> = new Map();

  // Track plugin metadata
  private pluginMetadata: Map<
    string,
    {
      loadedAt: Date;
      version: string;
      status: 'loaded' | 'error' | 'unloaded';
      errorMessage?: string;
    }
  > = new Map();

  /**
   * Register a plugin in the registry
   * @param pluginId Plugin ID
   * @param plugin Plugin instance
   * @param manifest Plugin manifest
   */
  registerPlugin(
    pluginId: string,
    plugin: Plugin,
    manifest: PluginManifest,
  ): void {
    this.loadedPlugins.set(pluginId, plugin);
    this.pluginManifests.set(pluginId, manifest);
    this.pluginMetadata.set(pluginId, {
      loadedAt: new Date(),
      version: manifest.version,
      status: 'loaded',
    });

    this.logger.log(`Plugin registered: ${pluginId} v${manifest.version}`);
  }

  /**
   * Unregister a plugin from the registry
   * @param pluginId Plugin ID
   */
  unregisterPlugin(pluginId: string): void {
    this.loadedPlugins.delete(pluginId);
    this.pluginManifests.delete(pluginId);

    const metadata = this.pluginMetadata.get(pluginId);
    if (metadata) {
      metadata.status = 'unloaded';
      this.pluginMetadata.set(pluginId, metadata);
    }

    this.logger.log(`Plugin unregistered: ${pluginId}`);
  }

  /**
   * Get plugin instance by ID
   * @param pluginId Plugin ID
   * @returns Plugin instance or undefined
   */
  getPlugin(pluginId: string): Plugin | undefined {
    return this.loadedPlugins.get(pluginId);
  }

  /**
   * Get plugin manifest by ID
   * @param pluginId Plugin ID
   * @returns Plugin manifest or undefined
   */
  getManifest(pluginId: string): PluginManifest | undefined {
    return this.pluginManifests.get(pluginId);
  }

  /**
   * Get all loaded plugin IDs
   * @returns Array of plugin IDs
   */
  getAllPluginIds(): string[] {
    return Array.from(this.loadedPlugins.keys());
  }

  /**
   * Get all loaded plugins
   * @returns Array of plugin instances
   */
  getAllPlugins(): Plugin[] {
    return Array.from(this.loadedPlugins.values());
  }

  /**
   * Get all plugin manifests
   * @returns Array of manifests
   */
  getAllManifests(): PluginManifest[] {
    return Array.from(this.pluginManifests.values());
  }

  /**
   * Check if plugin is loaded
   * @param pluginId Plugin ID
   * @returns True if loaded
   */
  isLoaded(pluginId: string): boolean {
    return this.loadedPlugins.has(pluginId);
  }

  /**
   * Get plugin count
   * @returns Number of loaded plugins
   */
  getPluginCount(): number {
    return this.loadedPlugins.size;
  }

  /**
   * Get plugin metadata
   * @param pluginId Plugin ID
   * @returns Metadata or undefined
   */
  getMetadata(pluginId: string) {
    return this.pluginMetadata.get(pluginId);
  }

  /**
   * Mark plugin as errored
   * @param pluginId Plugin ID
   * @param errorMessage Error message
   */
  markPluginError(pluginId: string, errorMessage: string): void {
    const metadata = this.pluginMetadata.get(pluginId);
    if (metadata) {
      metadata.status = 'error';
      metadata.errorMessage = errorMessage;
      this.pluginMetadata.set(pluginId, metadata);
    } else {
      this.pluginMetadata.set(pluginId, {
        loadedAt: new Date(),
        version: 'unknown',
        status: 'error',
        errorMessage,
      });
    }

    this.logger.error(`Plugin error (${pluginId}): ${errorMessage}`);
  }

  /**
   * Clear all plugins from registry
   * Useful for testing or full system reset
   */
  clearAll(): void {
    const count = this.loadedPlugins.size;
    this.loadedPlugins.clear();
    this.pluginManifests.clear();
    this.pluginMetadata.clear();

    this.logger.warn(`Registry cleared: ${count} plugins removed`);
  }

  /**
   * Get registry statistics
   * @returns Statistics object
   */
  getStats(): {
    totalLoaded: number;
    totalErrors: number;
    plugins: Array<{
      id: string;
      version: string;
      status: string;
      loadedAt: Date;
      errorMessage?: string;
    }>;
  } {
    const plugins = Array.from(this.pluginMetadata.entries()).map(
      ([id, metadata]) => ({
        id,
        version: metadata.version,
        status: metadata.status,
        loadedAt: metadata.loadedAt,
        errorMessage: metadata.errorMessage,
      }),
    );

    return {
      totalLoaded: plugins.filter((p) => p.status === 'loaded').length,
      totalErrors: plugins.filter((p) => p.status === 'error').length,
      plugins,
    };
  }

  /**
   * Get aggregated menu items from all loaded plugins
   * @param type Menu type ('main' or 'admin')
   * @returns Array of menu items
   */
  getMenuItems(type?: 'main' | 'admin'): any[] {
    const allMenus: any[] = [];
    const manifests = Array.from(this.pluginManifests.values());

    for (const manifest of manifests) {
      if (manifest.menus) {
        const filtered = type
          ? manifest.menus.filter((m) => m.type === type)
          : manifest.menus;

        allMenus.push(...filtered);
      }
    }

    // Sort by order
    return allMenus.sort((a, b) => a.order - b.order);
  }

  /**
   * Get aggregated widgets from all loaded plugins
   * @param slot Widget slot
   * @returns Array of widgets
   */
  getWidgets(slot?: string): any[] {
    const allWidgets: any[] = [];
    const manifests = Array.from(this.pluginManifests.values());

    for (const manifest of manifests) {
      if (manifest.widgets) {
        const filtered = slot
          ? manifest.widgets.filter((w) => w.slot === slot)
          : manifest.widgets;

        allWidgets.push(...filtered);
      }
    }

    // Sort by order
    return allWidgets.sort((a, b) => a.order - b.order);
  }
}
