/**
 * Plugin Lifecycle Interfaces
 * Defines the lifecycle methods and hooks for plugins
 */

import { PluginManifest, PluginContext } from './plugin-manifest.interface';

export interface Plugin {
  manifest: PluginManifest;

  /**
   * Install plugin
   * Called when plugin is first installed
   */
  install(context: PluginContext): Promise<InstallResult>;

  /**
   * Uninstall plugin
   * Called when plugin is being uninstalled
   */
  uninstall(context: PluginContext): Promise<UninstallResult>;

  /**
   * Optional: Update plugin
   * Called when plugin is being updated
   */
  update?(context: PluginContext, oldVersion: string): Promise<UpdateResult>;

  // Optional exports
  stores?: Record<string, any>;
  routes?: any[];
  services?: Record<string, any>;
}

export interface InstallResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface UninstallResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface UpdateResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface HookResult {
  success: boolean;
  output?: string;
  error?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}
