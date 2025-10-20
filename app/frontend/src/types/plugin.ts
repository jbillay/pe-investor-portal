/**
 * Plugin Type Definitions
 * Frontend TypeScript interfaces for plugin system
 */

/**
 * Plugin status enum matching backend
 */
export type PluginStatus = 'UPLOADED' | 'INSTALLED' | 'FAILED' | 'UNINSTALLED';

/**
 * Menu item type
 */
export type MenuType = 'main' | 'admin';

/**
 * Plugin menu item interface
 */
export interface PluginMenuItem {
  id: string;
  label: string;
  type: MenuType;
  icon?: string;
  route: string;
  order: number;
  permissions?: string[];
}

/**
 * Plugin widget interface
 */
export interface PluginWidget {
  id: string;
  name: string;
  component: string;
  slot: string;
  order: number;
  permissions?: string[];
  props?: Record<string, any>;
}

/**
 * Plugin hooks configuration
 */
export interface PluginHooks {
  onInstall?: boolean;
  onUpdate?: boolean;
  onUninstall?: boolean;
}

/**
 * Plugin dependencies
 */
export interface PluginDependencies {
  external?: string[];
  plugins?: string[];
}

/**
 * Plugin permissions
 */
export interface PluginPermissions {
  required?: string[];
  provided?: string[];
}

/**
 * Plugin settings
 */
export interface PluginSettings {
  hasConfigPanel?: boolean;
  configRoute?: string;
}

/**
 * Plugin manifest - complete plugin metadata
 */
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  author: string;
  authorEmail?: string;
  description?: string;
  icon?: string;
  license?: string;
  coreVersion: string;
  menus?: PluginMenuItem[];
  widgets?: PluginWidget[];
  dependencies?: PluginDependencies;
  permissions?: PluginPermissions;
  settings?: PluginSettings;
  hooks?: PluginHooks;
}

/**
 * Plugin database record from backend API
 */
export interface PluginApiResponse {
  id: string;
  pluginId: string;
  name: string;
  version: string;
  author: string;
  authorEmail: string | null;
  description: string | null;
  icon: string | null;
  license: string | null;
  status: PluginStatus;
  manifest: PluginManifest;
  filePath: string;
  zipPath: string | null;
  installedAt: string | null;
  installedBy: string | null;
  uninstalledAt: string | null;
  uninstalledBy: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Frontend plugin interface (transformed from API response)
 */
export interface Plugin {
  id: string;
  pluginId: string;
  name: string;
  version: string;
  author: string;
  authorEmail?: string;
  description?: string;
  icon?: string;
  license?: string;
  status: PluginStatus;
  manifest: PluginManifest;
  filePath: string;
  zipPath?: string;
  installedAt?: Date;
  installedBy?: string;
  uninstalledAt?: Date;
  uninstalledBy?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  // UI-specific computed properties
  isInstalled: boolean;
  canInstall: boolean;
  canUninstall: boolean;
}

/**
 * Plugin upload response
 */
export interface PluginUploadResponse {
  success: boolean;
  pluginId: string;
  name: string;
  version: string;
  message: string;
  warnings?: string[];
}

/**
 * Plugin list response with pagination
 */
export interface PluginListResponse {
  plugins: PluginApiResponse[];
  total: number;
}

/**
 * Plugin install response
 */
export interface PluginInstallResponse {
  success: boolean;
  pluginId: string;
  name: string;
  version: string;
  message: string;
}

/**
 * Plugin uninstall response
 */
export interface PluginUninstallResponse {
  success: boolean;
  pluginId: string;
  message: string;
}

/**
 * Plugin delete response
 */
export interface PluginDeleteResponse {
  success: boolean;
  message: string;
}

/**
 * Plugin manifest response
 */
export interface PluginManifestResponse {
  pluginId: string;
  manifest: PluginManifest;
}

/**
 * Plugin query filters
 */
export interface PluginQueryFilters {
  status?: PluginStatus;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'version' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Plugin statistics for dashboard
 */
export interface PluginStatistics {
  totalPlugins: number;
  installedPlugins: number;
  uploadedPlugins: number;
  failedPlugins: number;
  totalMenus: number;
  totalWidgets: number;
}

/**
 * Plugin error response from API
 */
export interface PluginApiError {
  message: string;
  code: string;
  details?: Record<string, any>;
}

/**
 * Loaded plugin instance (runtime)
 */
export interface LoadedPlugin {
  manifest: PluginManifest;
  module?: any;
  component?: any;
  loadedAt: Date;
  error?: string;
}
