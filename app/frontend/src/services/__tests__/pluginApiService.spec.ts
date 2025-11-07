import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { PluginApiResponse, PluginUploadResponse, PluginListResponse } from '@/types/plugin';

// Mock the API client
vi.mock('@/composables/useApi', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}));

import { PluginApiService, PluginApiServiceError, pluginApiService } from '../pluginApiService';
import { apiClient as mockApiClient } from '@/composables/useApi';

describe('PluginApiServiceError', () => {
  it('should create error with message, code, and details', () => {
    const error = new PluginApiServiceError('Test error', 'TEST_CODE', { foo: 'bar' });

    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.details).toEqual({ foo: 'bar' });
    expect(error.name).toBe('PluginApiServiceError');
  });

  it('should create error without details', () => {
    const error = new PluginApiServiceError('Test error', 'TEST_CODE');

    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.details).toBeUndefined();
  });
});

describe('PluginApiService', () => {
  let service: PluginApiService;

  const mockPluginApiResponse: PluginApiResponse = {
    id: 'plugin-1',
    pluginId: 'test-plugin',
    name: 'Test Plugin',
    version: '1.0.0',
    author: 'Test Author',
    authorEmail: 'test@example.com',
    description: 'A test plugin',
    icon: '/icon.png',
    license: 'MIT',
    status: 'INSTALLED',
    manifest: {
      menus: [{ name: 'Test Menu', path: '/test' }],
      widgets: [{ name: 'Test Widget', component: 'TestWidget' }]
    },
    filePath: '/plugins/test',
    zipPath: '/uploads/test.zip',
    installedAt: '2025-01-01T10:00:00Z',
    installedBy: 'user-1',
    uninstalledAt: null,
    uninstalledBy: null,
    errorMessage: null,
    createdAt: '2025-01-01T09:00:00Z',
    updatedAt: '2025-01-01T10:00:00Z'
  };

  beforeEach(() => {
    service = new PluginApiService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadPlugin', () => {
    it('should upload a valid ZIP file', async () => {
      const mockFile = new File(['test content'], 'test.zip', { type: 'application/zip' });
      const mockResponse: PluginUploadResponse = {
        success: true,
        message: 'Plugin uploaded successfully',
        plugin: mockPluginApiResponse
      };

      vi.mocked(mockApiClient.post).mockResolvedValue({ data: mockResponse });

      const result = await service.uploadPlugin(mockFile);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/admin/plugins/upload',
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      expect(result.success).toBe(true);
      expect(result.message).toBe('Plugin uploaded successfully');
    });

    it('should handle unwrapped response', async () => {
      const mockFile = new File(['test'], 'test.zip', { type: 'application/zip' });
      const mockResponse: PluginUploadResponse = {
        success: true,
        message: 'Uploaded',
        plugin: mockPluginApiResponse
      };

      vi.mocked(mockApiClient.post).mockResolvedValue(mockResponse);

      const result = await service.uploadPlugin(mockFile);

      expect(result.success).toBe(true);
    });

    it('should throw error for missing file', async () => {
      await expect(service.uploadPlugin(null as any)).rejects.toThrow('File is required');
      await expect(service.uploadPlugin(undefined as any)).rejects.toThrow('File is required');
    });

    it('should throw error for non-ZIP file', async () => {
      const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });

      await expect(service.uploadPlugin(mockFile)).rejects.toThrow('Only ZIP files are allowed');
    });

    it('should throw error for file exceeding 10MB', async () => {
      const largeSize = 11 * 1024 * 1024; // 11MB
      const mockFile = new File([new ArrayBuffer(largeSize)], 'test.zip', {
        type: 'application/zip'
      });

      await expect(service.uploadPlugin(mockFile)).rejects.toThrow('File size exceeds 10MB limit');
    });

    it('should handle network error', async () => {
      const mockFile = new File(['test'], 'test.zip', { type: 'application/zip' });
      const networkError = { name: 'NetworkError', message: 'Network failed' };
      vi.mocked(mockApiClient.post).mockRejectedValue(networkError);

      await expect(service.uploadPlugin(mockFile)).rejects.toThrow('Unable to connect to server');
    });
  });

  describe('getAllPlugins', () => {
    it('should fetch all plugins without filters', async () => {
      const mockResponse: PluginListResponse = {
        plugins: [mockPluginApiResponse],
        total: 1
      };
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: mockResponse });

      const result = await service.getAllPlugins();

      expect(mockApiClient.get).toHaveBeenCalledWith('/admin/plugins');
      expect(result.plugins).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.plugins[0].id).toBe('plugin-1');
      expect(result.plugins[0].isInstalled).toBe(true);
      expect(result.plugins[0].canInstall).toBe(false);
    });

    it('should fetch plugins with status filter', async () => {
      const mockResponse: PluginListResponse = {
        plugins: [mockPluginApiResponse],
        total: 1
      };
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: mockResponse });

      await service.getAllPlugins({ status: 'INSTALLED' });

      expect(mockApiClient.get).toHaveBeenCalledWith('/admin/plugins?status=INSTALLED');
    });

    it('should fetch plugins with pagination', async () => {
      const mockResponse: PluginListResponse = {
        plugins: [mockPluginApiResponse],
        total: 10
      };
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: mockResponse });

      await service.getAllPlugins({ page: 2, limit: 10 });

      expect(mockApiClient.get).toHaveBeenCalledWith('/admin/plugins?page=2&limit=10');
    });

    it('should fetch plugins with sorting', async () => {
      const mockResponse: PluginListResponse = {
        plugins: [mockPluginApiResponse],
        total: 1
      };
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: mockResponse });

      await service.getAllPlugins({ sortBy: 'name', sortOrder: 'asc' });

      expect(mockApiClient.get).toHaveBeenCalledWith('/admin/plugins?sortBy=name&sortOrder=asc');
    });

    it('should transform plugin with UPLOADED status', async () => {
      const uploadedPlugin = { ...mockPluginApiResponse, status: 'UPLOADED' as const };
      const mockResponse: PluginListResponse = {
        plugins: [uploadedPlugin],
        total: 1
      };
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: mockResponse });

      const result = await service.getAllPlugins();

      expect(result.plugins[0].canInstall).toBe(true);
      expect(result.plugins[0].isInstalled).toBe(false);
      expect(result.plugins[0].canUninstall).toBe(false);
    });

    it('should default total to plugins length when missing', async () => {
      const mockResponse = {
        plugins: [mockPluginApiResponse, { ...mockPluginApiResponse, id: 'plugin-2' }]
      };
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: mockResponse });

      const result = await service.getAllPlugins();

      expect(result.total).toBe(2);
    });

    it('should throw error for invalid response format', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: { plugins: 'not-an-array' } });

      await expect(service.getAllPlugins()).rejects.toThrow('Invalid response format from server');
    });

    it('should throw error when plugins property is missing', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: {} });

      await expect(service.getAllPlugins()).rejects.toThrow(PluginApiServiceError);
    });

    it('should handle network error', async () => {
      const networkError = { name: 'NetworkError', message: 'Network failed' };
      vi.mocked(mockApiClient.get).mockRejectedValue(networkError);

      await expect(service.getAllPlugins()).rejects.toThrow('Unable to connect to server');
    });
  });

  describe('getInstalledPlugins', () => {
    it('should fetch installed plugins', async () => {
      const mockResponse = [mockPluginApiResponse];
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: mockResponse });

      const result = await service.getInstalledPlugins();

      expect(mockApiClient.get).toHaveBeenCalledWith('/admin/plugins/installed/list');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('plugin-1');
      expect(result[0].status).toBe('INSTALLED');
    });

    it('should handle unwrapped response', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue([mockPluginApiResponse]);

      const result = await service.getInstalledPlugins();

      expect(result).toHaveLength(1);
    });

    it('should handle empty array', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: [] });

      const result = await service.getInstalledPlugins();

      expect(result).toHaveLength(0);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should throw error for invalid response format', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: 'not-an-array' });

      await expect(service.getInstalledPlugins()).rejects.toThrow('Invalid response format from server');
    });

    it('should handle network error', async () => {
      const networkError = { name: 'NetworkError', message: 'Network failed' };
      vi.mocked(mockApiClient.get).mockRejectedValue(networkError);

      await expect(service.getInstalledPlugins()).rejects.toThrow('Unable to connect to server');
    });
  });

  describe('getPluginById', () => {
    it('should fetch plugin by ID', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: mockPluginApiResponse });

      const result = await service.getPluginById('plugin-1');

      expect(mockApiClient.get).toHaveBeenCalledWith('/admin/plugins/plugin-1');
      expect(result.id).toBe('plugin-1');
      expect(result.name).toBe('Test Plugin');
    });

    it('should handle unwrapped response', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue(mockPluginApiResponse);

      const result = await service.getPluginById('plugin-1');

      expect(result.id).toBe('plugin-1');
    });

    it('should throw error for empty plugin ID', async () => {
      await expect(service.getPluginById('')).rejects.toThrow('Plugin ID is required');
      await expect(service.getPluginById('  ')).rejects.toThrow('Plugin ID is required');
    });

    it('should throw error when plugin not found', async () => {
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: null });

      await expect(service.getPluginById('plugin-1')).rejects.toThrow('Plugin not found');
    });

    it('should handle network error', async () => {
      const networkError = { name: 'NetworkError', message: 'Network failed' };
      vi.mocked(mockApiClient.get).mockRejectedValue(networkError);

      await expect(service.getPluginById('plugin-1')).rejects.toThrow('Unable to connect to server');
    });
  });

  describe('installPlugin', () => {
    it('should install plugin successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Plugin installed successfully',
        plugin: mockPluginApiResponse
      };
      vi.mocked(mockApiClient.post).mockResolvedValue({ data: mockResponse });

      const result = await service.installPlugin('plugin-1');

      expect(mockApiClient.post).toHaveBeenCalledWith('/admin/plugins/plugin-1/install');
      expect(result.success).toBe(true);
      expect(result.message).toBe('Plugin installed successfully');
    });

    it('should handle unwrapped response', async () => {
      const mockResponse = { success: true, message: 'Installed', plugin: mockPluginApiResponse };
      vi.mocked(mockApiClient.post).mockResolvedValue(mockResponse);

      const result = await service.installPlugin('plugin-1');

      expect(result.success).toBe(true);
    });

    it('should throw error for empty plugin ID', async () => {
      await expect(service.installPlugin('')).rejects.toThrow('Plugin ID is required');
      await expect(service.installPlugin('  ')).rejects.toThrow('Plugin ID is required');
    });

    it('should handle API error', async () => {
      vi.mocked(mockApiClient.post).mockRejectedValue(new Error('Installation failed'));

      await expect(service.installPlugin('plugin-1')).rejects.toThrow(PluginApiServiceError);
    });
  });

  describe('uninstallPlugin', () => {
    it('should uninstall plugin successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Plugin uninstalled successfully'
      };
      vi.mocked(mockApiClient.post).mockResolvedValue({ data: mockResponse });

      const result = await service.uninstallPlugin('plugin-1');

      expect(mockApiClient.post).toHaveBeenCalledWith('/admin/plugins/plugin-1/uninstall');
      expect(result.success).toBe(true);
    });

    it('should handle unwrapped response', async () => {
      const mockResponse = { success: true, message: 'Uninstalled' };
      vi.mocked(mockApiClient.post).mockResolvedValue(mockResponse);

      const result = await service.uninstallPlugin('plugin-1');

      expect(result.success).toBe(true);
    });

    it('should throw error for empty plugin ID', async () => {
      await expect(service.uninstallPlugin('')).rejects.toThrow('Plugin ID is required');
      await expect(service.uninstallPlugin('  ')).rejects.toThrow('Plugin ID is required');
    });

    it('should handle API error', async () => {
      vi.mocked(mockApiClient.post).mockRejectedValue(new Error('Uninstall failed'));

      await expect(service.uninstallPlugin('plugin-1')).rejects.toThrow(PluginApiServiceError);
    });
  });

  describe('deletePlugin', () => {
    it('should delete plugin successfully', async () => {
      vi.mocked(mockApiClient.delete).mockResolvedValue({});

      const result = await service.deletePlugin('plugin-1');

      expect(mockApiClient.delete).toHaveBeenCalledWith('/admin/plugins/plugin-1');
      expect(result).toBe(true);
    });

    it('should throw error for empty plugin ID', async () => {
      await expect(service.deletePlugin('')).rejects.toThrow('Plugin ID is required');
      await expect(service.deletePlugin('  ')).rejects.toThrow('Plugin ID is required');
    });

    it('should handle API error', async () => {
      vi.mocked(mockApiClient.delete).mockRejectedValue(new Error('Delete failed'));

      await expect(service.deletePlugin('plugin-1')).rejects.toThrow(PluginApiServiceError);
    });
  });

  describe('getPluginManifest', () => {
    it('should fetch plugin manifest', async () => {
      const mockManifest = {
        menus: [{ name: 'Test Menu', path: '/test' }],
        widgets: [{ name: 'Test Widget', component: 'TestWidget' }]
      };
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: mockManifest });

      const result = await service.getPluginManifest('plugin-1');

      expect(mockApiClient.get).toHaveBeenCalledWith('/admin/plugins/plugin-1/manifest');
      expect(result.menus).toHaveLength(1);
      expect(result.widgets).toHaveLength(1);
    });

    it('should handle unwrapped response', async () => {
      const mockManifest = { menus: [], widgets: [] };
      vi.mocked(mockApiClient.get).mockResolvedValue(mockManifest);

      const result = await service.getPluginManifest('plugin-1');

      expect(result).toEqual(mockManifest);
    });

    it('should throw error for empty plugin ID', async () => {
      await expect(service.getPluginManifest('')).rejects.toThrow('Plugin ID is required');
      await expect(service.getPluginManifest('  ')).rejects.toThrow('Plugin ID is required');
    });

    it('should handle API error', async () => {
      vi.mocked(mockApiClient.get).mockRejectedValue(new Error('Manifest not found'));

      await expect(service.getPluginManifest('plugin-1')).rejects.toThrow(PluginApiServiceError);
    });
  });

  describe('getPluginStatistics', () => {
    it('should calculate statistics from plugins', async () => {
      const plugins = [
        { ...mockPluginApiResponse, status: 'INSTALLED' as const },
        { ...mockPluginApiResponse, id: 'plugin-2', status: 'UPLOADED' as const },
        { ...mockPluginApiResponse, id: 'plugin-3', status: 'FAILED' as const }
      ];
      const mockResponse: PluginListResponse = { plugins, total: 3 };
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: mockResponse });

      const result = await service.getPluginStatistics();

      expect(result.totalPlugins).toBe(3);
      expect(result.installedPlugins).toBe(1);
      expect(result.uploadedPlugins).toBe(1);
      expect(result.failedPlugins).toBe(1);
      expect(result.totalMenus).toBe(1); // Only from installed plugins
      expect(result.totalWidgets).toBe(1); // Only from installed plugins
    });

    it('should handle plugins with no menus or widgets', async () => {
      const plugin = {
        ...mockPluginApiResponse,
        manifest: {}
      };
      const mockResponse: PluginListResponse = { plugins: [plugin], total: 1 };
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: mockResponse });

      const result = await service.getPluginStatistics();

      expect(result.totalMenus).toBe(0);
      expect(result.totalWidgets).toBe(0);
    });

    it('should handle empty plugins list', async () => {
      const mockResponse: PluginListResponse = { plugins: [], total: 0 };
      vi.mocked(mockApiClient.get).mockResolvedValue({ data: mockResponse });

      const result = await service.getPluginStatistics();

      expect(result.totalPlugins).toBe(0);
      expect(result.installedPlugins).toBe(0);
      expect(result.uploadedPlugins).toBe(0);
      expect(result.failedPlugins).toBe(0);
      expect(result.totalMenus).toBe(0);
      expect(result.totalWidgets).toBe(0);
    });

    it('should handle API error', async () => {
      vi.mocked(mockApiClient.get).mockRejectedValue(new Error('Statistics fetch failed'));

      await expect(service.getPluginStatistics()).rejects.toThrow(PluginApiServiceError);
    });
  });

  describe('getPluginFileUrl', () => {
    it('should generate file URL without leading slash', () => {
      const url = service.getPluginFileUrl('plugin-1', 'assets/icon.png');

      expect(url).toBe('/api/plugins/plugin-1/files/assets/icon.png');
    });

    it('should generate file URL with leading slash', () => {
      const url = service.getPluginFileUrl('plugin-1', '/assets/icon.png');

      expect(url).toBe('/api/plugins/plugin-1/files/assets/icon.png');
    });

    it('should handle nested paths', () => {
      const url = service.getPluginFileUrl('plugin-1', 'components/widgets/Test.vue');

      expect(url).toBe('/api/plugins/plugin-1/files/components/widgets/Test.vue');
    });
  });

  describe('singleton instance', () => {
    it('should export singleton instance', () => {
      expect(pluginApiService).toBeInstanceOf(PluginApiService);
    });
  });
});
