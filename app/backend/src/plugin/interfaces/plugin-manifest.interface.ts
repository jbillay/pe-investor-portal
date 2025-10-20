/**
 * Plugin Manifest Interfaces
 * Defines the structure of plugin.json manifest file
 */

export interface PluginManifest {
  // Required fields
  id: string;                    // Unique plugin identifier (kebab-case)
  name: string;                  // Human-readable plugin name
  version: string;               // Semver version (e.g., "1.0.0")
  author: string;                // Author name
  coreVersion: string;           // Required core version (e.g., ">=1.0.0")

  // Optional fields
  authorEmail?: string;          // Author email
  description?: string;          // Plugin description
  icon?: string;                 // Icon file path (relative to plugin root)
  license?: string;              // License type (e.g., "MIT")

  // UI Integration
  menus?: MenuItem[];            // Menu items to register
  widgets?: Widget[];            // Dashboard widgets

  // Dependencies
  dependencies?: {
    external?: string[];         // External npm packages required
    plugins?: string[];          // Other plugins required
  };

  // Permissions
  permissions?: {
    required?: string[];         // Permissions required by plugin
    provided?: string[];         // Permissions provided by plugin
  };

  // Settings
  settings?: {
    hasConfigPanel?: boolean;    // Whether plugin has a settings panel
    configRoute?: string;        // Route to settings panel
  };

  // Lifecycle hooks
  hooks?: {
    onInstall?: boolean;         // Has install.js script
    onUpdate?: boolean;          // Has update.js script
    onUninstall?: boolean;       // Has uninstall logic
  };
}

export interface MenuItem {
  id: string;                    // Unique menu item ID
  label: string;                 // Display label
  type: 'main' | 'admin';        // Menu type (main navigation or admin)
  icon: string;                  // Icon class (e.g., "pi pi-heart")
  route: string;                 // Vue Router route
  order: number;                 // Display order
  permissions?: string[];        // Required permissions
}

export interface Widget {
  id: string;                    // Unique widget ID
  name: string;                  // Widget name
  component: string;             // Component name (e.g., "DashboardWidget")
  slot: string;                  // Slot position (e.g., "main", "sidebar")
  order: number;                 // Display order within slot
  defaultSize?: {                // Default size (for grid layout)
    cols: number;
    rows: number;
  };
  permissions?: string[];        // Required permissions
}

export interface PluginContext {
  app: any;                      // Vue app instance
  pinia: any;                    // Pinia store instance
  router: any;                   // Vue Router instance
  coreApi: CoreAPI;              // Core API access
}

export interface CoreAPI {
  stores: {
    auth: any;                   // Auth store
    [key: string]: any;          // Other core stores
  };
  services: {
    http: any;                   // HTTP client
    notifications: any;          // Notification service
    [key: string]: any;          // Other core services
  };
  utils: {
    [key: string]: any;          // Utility functions
  };
}
