/**
 * Plugin Context Composable
 * Provides core application APIs to plugins
 * Acts as a bridge between plugins and the core application
 */

import { computed, readonly, type ComputedRef } from 'vue';
import { useRouter, type Router } from 'vue-router';
import { useToast, type ToastServiceMethods } from 'primevue/usetoast';
import { useAuthStore } from '@/stores/auth';
import { usePluginRegistryStore } from '@/stores/pluginRegistry';
import type { User } from '@/types/auth';
import type { PluginManifest } from '@/types/plugin';

/**
 * Plugin Context API interface
 * This is what plugins receive when they request context
 */
export interface PluginContext {
  // Application Info
  appVersion: string;
  coreVersion: string;

  // Current Plugin Info
  pluginId: string;
  manifest: PluginManifest;

  // User Info (readonly)
  currentUser: ComputedRef<User | null>;
  isAuthenticated: ComputedRef<boolean>;
  userRoles: ComputedRef<string[]>;
  userPermissions: ComputedRef<string[]>;

  // Permission Checking
  hasRole: (roleName: string) => boolean;
  hasPermission: (permissionName: string) => boolean;
  hasAnyRole: (roleNames: string[]) => boolean;
  hasAllRoles: (roleNames: string[]) => boolean;

  // Routing
  router: Router;
  navigateTo: (path: string) => Promise<void>;
  navigateBack: () => void;

  // Notifications
  toast: ToastServiceMethods;
  showSuccess: (message: string, detail?: string) => void;
  showError: (message: string, detail?: string) => void;
  showWarning: (message: string, detail?: string) => void;
  showInfo: (message: string, detail?: string) => void;

  // API Access
  apiBaseUrl: string;
  getApiUrl: (endpoint: string) => string;

  // Plugin Storage (scoped to plugin)
  getPluginData: <T = any>(key: string) => T | null;
  setPluginData: <T = any>(key: string, value: T) => void;
  removePluginData: (key: string) => void;
  clearPluginData: () => void;

  // Inter-plugin Communication
  emitEvent: (eventName: string, payload?: any) => void;
  onEvent: (eventName: string, handler: (payload: any) => void) => void;
  offEvent: (eventName: string, handler: (payload: any) => void) => void;
}

/**
 * Plugin event bus for inter-plugin communication
 */
class PluginEventBus {
  private handlers: Map<string, Set<Function>> = new Map();

  on(eventName: string, handler: Function): void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, new Set());
    }
    this.handlers.get(eventName)!.add(handler);
  }

  off(eventName: string, handler: Function): void {
    const handlers = this.handlers.get(eventName);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(eventName);
      }
    }
  }

  emit(eventName: string, payload?: any): void {
    const handlers = this.handlers.get(eventName);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(payload);
        } catch (error) {
          console.error(`Error in event handler for "${eventName}":`, error);
        }
      });
    }
  }

  clear(): void {
    this.handlers.clear();
  }
}

// Global event bus instance
const pluginEventBus = new PluginEventBus();

/**
 * Get plugin storage key with plugin namespace
 */
function getStorageKey(pluginId: string, key: string): string {
  return `plugin:${pluginId}:${key}`;
}

/**
 * Create plugin context for a specific plugin
 * This is the main function plugins will call to get their context
 */
export function usePluginContext(pluginId: string): PluginContext {
  const router = useRouter();
  const toast = useToast();
  const authStore = useAuthStore();
  const pluginRegistryStore = usePluginRegistryStore();

  // Get plugin manifest
  const plugin = pluginRegistryStore.getPluginById(pluginId);
  if (!plugin) {
    throw new Error(`Plugin ${pluginId} not found in registry`);
  }

  // Application constants
  const APP_VERSION = '1.0.0';
  const CORE_VERSION = '1.0.0';
  const API_BASE_URL = '/api';

  // User info (computed for reactivity)
  const currentUser = computed(() => authStore.user);
  const isAuthenticated = computed(() => authStore.isAuthenticated);
  const userRoles = computed(() => authStore.user?.roles || []);
  const userPermissions = computed(() => authStore.user?.permissions || []);

  // Permission checking
  const hasRole = (roleName: string): boolean => {
    return authStore.hasRole(roleName);
  };

  const hasPermission = (permissionName: string): boolean => {
    return authStore.hasPermission(permissionName);
  };

  const hasAnyRole = (roleNames: string[]): boolean => {
    return roleNames.some(roleName => hasRole(roleName));
  };

  const hasAllRoles = (roleNames: string[]): boolean => {
    return roleNames.every(roleName => hasRole(roleName));
  };

  // Routing helpers
  const navigateTo = async (path: string): Promise<void> => {
    await router.push(path);
  };

  const navigateBack = (): void => {
    router.back();
  };

  // Notification helpers
  const showSuccess = (message: string, detail?: string): void => {
    toast.add({
      severity: 'success',
      summary: message,
      detail: detail,
      life: 3000
    });
  };

  const showError = (message: string, detail?: string): void => {
    toast.add({
      severity: 'error',
      summary: message,
      detail: detail,
      life: 5000
    });
  };

  const showWarning = (message: string, detail?: string): void => {
    toast.add({
      severity: 'warn',
      summary: message,
      detail: detail,
      life: 4000
    });
  };

  const showInfo = (message: string, detail?: string): void => {
    toast.add({
      severity: 'info',
      summary: message,
      detail: detail,
      life: 3000
    });
  };

  // API helpers
  const getApiUrl = (endpoint: string): string => {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${API_BASE_URL}${cleanEndpoint}`;
  };

  // Plugin storage (localStorage based, scoped to plugin)
  const getPluginData = <T = any>(key: string): T | null => {
    try {
      const storageKey = getStorageKey(pluginId, key);
      const value = localStorage.getItem(storageKey);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Error reading plugin data for key "${key}":`, error);
      return null;
    }
  };

  const setPluginData = <T = any>(key: string, value: T): void => {
    try {
      const storageKey = getStorageKey(pluginId, key);
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing plugin data for key "${key}":`, error);
      throw error;
    }
  };

  const removePluginData = (key: string): void => {
    try {
      const storageKey = getStorageKey(pluginId, key);
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error(`Error removing plugin data for key "${key}":`, error);
    }
  };

  const clearPluginData = (): void => {
    try {
      const prefix = `plugin:${pluginId}:`;
      const keysToRemove: string[] = [];

      // Find all keys for this plugin
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keysToRemove.push(key);
        }
      }

      // Remove them
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Error clearing plugin data:', error);
    }
  };

  // Inter-plugin communication
  const emitEvent = (eventName: string, payload?: any): void => {
    const namespaceEvent = `${pluginId}:${eventName}`;
    pluginEventBus.emit(namespaceEvent, payload);

    // Also emit global event
    pluginEventBus.emit(eventName, payload);
  };

  const onEvent = (eventName: string, handler: (payload: any) => void): void => {
    pluginEventBus.on(eventName, handler);
  };

  const offEvent = (eventName: string, handler: (payload: any) => void): void => {
    pluginEventBus.off(eventName, handler);
  };

  // Return plugin context
  return {
    // Application Info
    appVersion: APP_VERSION,
    coreVersion: CORE_VERSION,

    // Current Plugin Info
    pluginId,
    manifest: plugin.manifest,

    // User Info (readonly)
    currentUser: readonly(currentUser),
    isAuthenticated: readonly(isAuthenticated),
    userRoles: readonly(userRoles),
    userPermissions: readonly(userPermissions),

    // Permission Checking
    hasRole,
    hasPermission,
    hasAnyRole,
    hasAllRoles,

    // Routing
    router,
    navigateTo,
    navigateBack,

    // Notifications
    toast,
    showSuccess,
    showError,
    showWarning,
    showInfo,

    // API Access
    apiBaseUrl: API_BASE_URL,
    getApiUrl,

    // Plugin Storage
    getPluginData,
    setPluginData,
    removePluginData,
    clearPluginData,

    // Inter-plugin Communication
    emitEvent,
    onEvent,
    offEvent
  };
}

/**
 * Clear all plugin event handlers
 * Useful for cleanup when plugin system is reset
 */
export function clearPluginEvents(): void {
  pluginEventBus.clear();
}

/**
 * Export event bus for testing purposes
 */
export { pluginEventBus };
