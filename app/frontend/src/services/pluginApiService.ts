/**
 * Plugin API Service
 * Handles all plugin-related API communications with comprehensive error handling
 * Follows enterprise-grade patterns with proper logging and type safety
 */

import { apiClient } from '@/composables/useApi';
import type {
  Plugin,
  PluginApiResponse,
  PluginUploadResponse,
  PluginListResponse,
  PluginInstallResponse,
  PluginUninstallResponse,
  PluginDeleteResponse,
  PluginManifestResponse,
  PluginQueryFilters,
  PluginStatistics,
  PluginStatus
} from '@/types/plugin';

/**
 * Custom error class for plugin-specific API errors
 */
export class PluginApiServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'PluginApiServiceError';
  }
}

/**
 * Plugin API Service Class
 * Centralized service for all plugin-related API operations
 */
export class PluginApiService {
  private readonly baseUrl = '/admin/plugins';

  /**
   * Transforms backend API response to frontend Plugin interface
   * Handles data mapping and type conversion
   */
  private transformApiResponseToPlugin(apiPlugin: PluginApiResponse): Plugin {
    const status = apiPlugin.status;
    const isInstalled = status === 'INSTALLED';
    const canInstall = status === 'UPLOADED';
    const canUninstall = status === 'INSTALLED';

    return {
      id: apiPlugin.id,
      pluginId: apiPlugin.pluginId,
      name: apiPlugin.name,
      version: apiPlugin.version,
      author: apiPlugin.author,
      authorEmail: apiPlugin.authorEmail || undefined,
      description: apiPlugin.description || undefined,
      icon: apiPlugin.icon || undefined,
      license: apiPlugin.license || undefined,
      status: apiPlugin.status,
      manifest: apiPlugin.manifest,
      filePath: apiPlugin.filePath,
      zipPath: apiPlugin.zipPath || undefined,
      installedAt: apiPlugin.installedAt ? new Date(apiPlugin.installedAt) : undefined,
      installedBy: apiPlugin.installedBy || undefined,
      uninstalledAt: apiPlugin.uninstalledAt ? new Date(apiPlugin.uninstalledAt) : undefined,
      uninstalledBy: apiPlugin.uninstalledBy || undefined,
      errorMessage: apiPlugin.errorMessage || undefined,
      createdAt: new Date(apiPlugin.createdAt),
      updatedAt: new Date(apiPlugin.updatedAt),
      // Computed properties
      isInstalled,
      canInstall,
      canUninstall
    };
  }

  /**
   * Handles API errors with proper error transformation
   */
  private handleApiError(error: any): never {
    // If it's already a PluginApiServiceError, just re-throw it
    if (error instanceof PluginApiServiceError) {
      throw error;
    }

    if (error.name === 'NetworkError') {
      throw new PluginApiServiceError(
        'Unable to connect to server. Please check your connection.',
        'NETWORK_ERROR'
      );
    }

    if (error.response?.data?.message) {
      throw new PluginApiServiceError(
        error.response.data.message,
        error.response.data.code || 'API_ERROR',
        error.response.data.details
      );
    }

    throw new PluginApiServiceError(
      error.message || 'An unexpected error occurred',
      'UNKNOWN_ERROR'
    );
  }

  /**
   * Uploads a plugin ZIP file
   * @param file - The plugin ZIP file to upload
   * @returns Promise<PluginUploadResponse> - Upload response with plugin metadata
   */
  async uploadPlugin(file: File): Promise<PluginUploadResponse> {
    try {
      if (!file) {
        throw new PluginApiServiceError('File is required', 'INVALID_FILE');
      }

      // Check file type
      if (!file.name.endsWith('.zip')) {
        throw new PluginApiServiceError('Only ZIP files are allowed', 'INVALID_FILE_TYPE');
      }

      // Check file size (10MB limit)
      const MAX_SIZE = 10 * 1024 * 1024; // 10MB
      if (file.size > MAX_SIZE) {
        throw new PluginApiServiceError(
          'File size exceeds 10MB limit',
          'FILE_TOO_LARGE'
        );
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post<PluginUploadResponse>(
        `${this.baseUrl}/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      return (response as any).data || response;
    } catch (error) {
      console.error('Error uploading plugin:', error);
      this.handleApiError(error);
    }
  }

  /**
   * Fetches all plugins from the backend
   * @param filters - Optional query filters
   * @returns Promise<Plugin[]> - Array of transformed plugin objects
   */
  async getAllPlugins(filters?: PluginQueryFilters): Promise<{ plugins: Plugin[]; total: number }> {
    try {
      const params = new URLSearchParams();

      if (filters?.status) {
        params.append('status', filters.status);
      }
      if (filters?.page !== undefined) {
        params.append('page', filters.page.toString());
      }
      if (filters?.limit !== undefined) {
        params.append('limit', filters.limit.toString());
      }
      if (filters?.sortBy) {
        params.append('sortBy', filters.sortBy);
      }
      if (filters?.sortOrder) {
        params.append('sortOrder', filters.sortOrder);
      }

      const queryString = params.toString();
      const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;

      const response = await apiClient.get<PluginListResponse>(url);
      const data = (response as any).data || response;

      if (!data.plugins || !Array.isArray(data.plugins)) {
        throw new PluginApiServiceError(
          'Invalid response format from server',
          'INVALID_RESPONSE'
        );
      }

      return {
        plugins: data.plugins.map(plugin => this.transformApiResponseToPlugin(plugin)),
        total: data.total || data.plugins.length
      };
    } catch (error) {
      console.error('Error fetching plugins:', error);
      this.handleApiError(error);
    }
  }

  /**
   * Fetches installed plugins only
   * @returns Promise<Plugin[]> - Array of installed plugins
   */
  async getInstalledPlugins(): Promise<Plugin[]> {
    try {
      const response = await apiClient.get<PluginApiResponse[]>(
        `${this.baseUrl}/installed/list`
      );

      const pluginsData = (response as any).data || response;

      if (!Array.isArray(pluginsData)) {
        throw new PluginApiServiceError(
          'Invalid response format from server',
          'INVALID_RESPONSE'
        );
      }

      return pluginsData.map(plugin => this.transformApiResponseToPlugin(plugin));
    } catch (error) {
      console.error('Error fetching installed plugins:', error);
      this.handleApiError(error);
    }
  }

  /**
   * Fetches a single plugin by ID
   * @param pluginId - The plugin ID to fetch
   * @returns Promise<Plugin> - The plugin object
   */
  async getPluginById(pluginId: string): Promise<Plugin> {
    try {
      if (!pluginId?.trim()) {
        throw new PluginApiServiceError('Plugin ID is required', 'INVALID_PLUGIN_ID');
      }

      const response = await apiClient.get<PluginApiResponse>(`${this.baseUrl}/${pluginId}`);
      let pluginData = (response as any).data;

      // If no data property, the response itself is the plugin data
      if (pluginData === undefined) {
        pluginData = response;
      }

      if (!pluginData || pluginData === null) {
        throw new PluginApiServiceError('Plugin not found', 'PLUGIN_NOT_FOUND');
      }

      return this.transformApiResponseToPlugin(pluginData);
    } catch (error) {
      console.error(`Error fetching plugin ${pluginId}:`, error);
      this.handleApiError(error);
    }
  }

  /**
   * Installs a plugin
   * @param pluginId - The plugin ID to install
   * @returns Promise<PluginInstallResponse> - Install response
   */
  async installPlugin(pluginId: string): Promise<PluginInstallResponse> {
    try {
      if (!pluginId?.trim()) {
        throw new PluginApiServiceError('Plugin ID is required', 'INVALID_PLUGIN_ID');
      }

      const response = await apiClient.post<PluginInstallResponse>(
        `${this.baseUrl}/${pluginId}/install`
      );

      return (response as any).data || response;
    } catch (error) {
      console.error(`Error installing plugin ${pluginId}:`, error);
      this.handleApiError(error);
    }
  }

  /**
   * Uninstalls a plugin
   * @param pluginId - The plugin ID to uninstall
   * @returns Promise<PluginUninstallResponse> - Uninstall response
   */
  async uninstallPlugin(pluginId: string): Promise<PluginUninstallResponse> {
    try {
      if (!pluginId?.trim()) {
        throw new PluginApiServiceError('Plugin ID is required', 'INVALID_PLUGIN_ID');
      }

      const response = await apiClient.post<PluginUninstallResponse>(
        `${this.baseUrl}/${pluginId}/uninstall`
      );

      return (response as any).data || response;
    } catch (error) {
      console.error(`Error uninstalling plugin ${pluginId}:`, error);
      this.handleApiError(error);
    }
  }

  /**
   * Deletes a plugin completely
   * @param pluginId - The plugin ID to delete
   * @returns Promise<boolean> - Success status
   */
  async deletePlugin(pluginId: string): Promise<boolean> {
    try {
      if (!pluginId?.trim()) {
        throw new PluginApiServiceError('Plugin ID is required', 'INVALID_PLUGIN_ID');
      }

      await apiClient.delete<PluginDeleteResponse>(`${this.baseUrl}/${pluginId}`);
      return true;
    } catch (error) {
      console.error(`Error deleting plugin ${pluginId}:`, error);
      this.handleApiError(error);
    }
  }

  /**
   * Gets plugin manifest
   * @param pluginId - The plugin ID
   * @returns Promise<PluginManifest> - Plugin manifest
   */
  async getPluginManifest(pluginId: string): Promise<PluginManifestResponse> {
    try {
      if (!pluginId?.trim()) {
        throw new PluginApiServiceError('Plugin ID is required', 'INVALID_PLUGIN_ID');
      }

      const response = await apiClient.get<PluginManifestResponse>(
        `${this.baseUrl}/${pluginId}/manifest`
      );

      return (response as any).data || response;
    } catch (error) {
      console.error(`Error fetching plugin manifest ${pluginId}:`, error);
      this.handleApiError(error);
    }
  }

  /**
   * Fetches plugin statistics for dashboard
   * @returns Promise<PluginStatistics> - Plugin statistics object
   */
  async getPluginStatistics(): Promise<PluginStatistics> {
    try {
      // Calculate statistics from all plugins
      const { plugins, total } = await this.getAllPlugins();

      const installedPlugins = plugins.filter(p => p.status === 'INSTALLED').length;
      const uploadedPlugins = plugins.filter(p => p.status === 'UPLOADED').length;
      const failedPlugins = plugins.filter(p => p.status === 'FAILED').length;

      // Count menus and widgets from installed plugins
      const installedPluginsList = plugins.filter(p => p.status === 'INSTALLED');
      const totalMenus = installedPluginsList.reduce((sum, plugin) => {
        return sum + (plugin.manifest.menus?.length || 0);
      }, 0);
      const totalWidgets = installedPluginsList.reduce((sum, plugin) => {
        return sum + (plugin.manifest.widgets?.length || 0);
      }, 0);

      return {
        totalPlugins: total,
        installedPlugins,
        uploadedPlugins,
        failedPlugins,
        totalMenus,
        totalWidgets
      };
    } catch (error) {
      console.error('Error fetching plugin statistics:', error);
      this.handleApiError(error);
    }
  }

  /**
   * Gets the base URL for plugin file serving
   * @param pluginId - Plugin ID
   * @param filepath - File path within plugin
   * @returns Full URL to plugin file
   */
  getPluginFileUrl(pluginId: string, filepath: string): string {
    // Remove leading slash if present
    const cleanPath = filepath.startsWith('/') ? filepath.substring(1) : filepath;
    return `/api/plugins/${pluginId}/files/${cleanPath}`;
  }
}

/**
 * Export singleton instance of the plugin API service
 */
export const pluginApiService = new PluginApiService();
