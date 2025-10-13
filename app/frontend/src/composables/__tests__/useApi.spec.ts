/**
 * API Client Unit Tests
 * Simplified test suite for axios-based API client
 * Tests HTTP methods and basic functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { apiClient, useApi } from '../useApi';

// Mock axios completely
vi.mock('axios', () => {
  const mockInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: {
        use: vi.fn(() => 0),
      },
      response: {
        use: vi.fn(() => 0),
      },
    },
  };

  return {
    default: {
      create: vi.fn(() => mockInstance),
    },
  };
});

// Mock auth store
vi.mock('@stores/auth', () => ({
  useAuthStore: vi.fn(() => ({
    accessToken: null,
    refreshToken: null,
    logout: vi.fn(),
    refreshTokens: vi.fn(),
  })),
}));

// Get the mocked instance
import axios from 'axios';
const mockAxiosInstance = (axios.create as any)();

describe('useApi - API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('API Client Initialization', () => {
    it('should have api client available', () => {
      expect(apiClient).toBeDefined();
      expect(typeof apiClient.get).toBe('function');
      expect(typeof apiClient.post).toBe('function');
    });

    it('should have all HTTP methods available', () => {
      expect(typeof apiClient.get).toBe('function');
      expect(typeof apiClient.post).toBe('function');
      expect(typeof apiClient.put).toBe('function');
      expect(typeof apiClient.patch).toBe('function');
      expect(typeof apiClient.delete).toBe('function');
    });
  });

  describe('HTTP GET Method', () => {
    it('should make GET request and return response data', async () => {
      const mockResponse = {
        data: { status: 'success', data: { id: 1, name: 'Test' } },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await apiClient.get<{ id: number; name: string }>('/test');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test', undefined);
      expect(result).toEqual(mockResponse.data);
    });

    it('should pass config to GET request', async () => {
      const mockResponse = { data: { status: 'success', data: [] } };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const config = { params: { page: 1, limit: 10 } };
      await apiClient.get('/test', config);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test', config);
    });

    it('should handle GET request errors', async () => {
      const error = new Error('Network error');
      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(apiClient.get('/test')).rejects.toThrow('Network error');
    });
  });

  describe('HTTP POST Method', () => {
    it('should make POST request with data and return response', async () => {
      const mockResponse = {
        data: { status: 'success', data: { id: 1, created: true } },
      };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const postData = { name: 'Test', value: 123 };
      const result = await apiClient.post('/test', postData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test', postData, undefined);
      expect(result).toEqual(mockResponse.data);
    });

    it('should make POST request without data', async () => {
      const mockResponse = { data: { status: 'success' } };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      await apiClient.post('/test');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test', undefined, undefined);
    });

    it('should pass config to POST request', async () => {
      const mockResponse = { data: { status: 'success' } };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const postData = { name: 'Test' };
      const config = { headers: { 'X-Custom-Header': 'value' } };
      await apiClient.post('/test', postData, config);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test', postData, config);
    });

    it('should handle POST request errors', async () => {
      const error = new Error('Bad request');
      mockAxiosInstance.post.mockRejectedValue(error);

      await expect(apiClient.post('/test', {})).rejects.toThrow('Bad request');
    });
  });

  describe('HTTP PUT Method', () => {
    it('should make PUT request with data and return response', async () => {
      const mockResponse = {
        data: { status: 'success', data: { id: 1, updated: true } },
      };
      mockAxiosInstance.put.mockResolvedValue(mockResponse);

      const putData = { name: 'Updated' };
      const result = await apiClient.put('/test/1', putData);

      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/test/1', putData, undefined);
      expect(result).toEqual(mockResponse.data);
    });

    it('should pass config to PUT request', async () => {
      const mockResponse = { data: { status: 'success' } };
      mockAxiosInstance.put.mockResolvedValue(mockResponse);

      const putData = { name: 'Updated' };
      const config = { timeout: 5000 };
      await apiClient.put('/test/1', putData, config);

      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/test/1', putData, config);
    });

    it('should handle PUT request errors', async () => {
      const error = new Error('Update failed');
      mockAxiosInstance.put.mockRejectedValue(error);

      await expect(apiClient.put('/test/1', {})).rejects.toThrow('Update failed');
    });
  });

  describe('HTTP PATCH Method', () => {
    it('should make PATCH request with partial data and return response', async () => {
      const mockResponse = {
        data: { status: 'success', data: { id: 1, patched: true } },
      };
      mockAxiosInstance.patch.mockResolvedValue(mockResponse);

      const patchData = { status: 'active' };
      const result = await apiClient.patch('/test/1', patchData);

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/test/1', patchData, undefined);
      expect(result).toEqual(mockResponse.data);
    });

    it('should pass config to PATCH request', async () => {
      const mockResponse = { data: { status: 'success' } };
      mockAxiosInstance.patch.mockResolvedValue(mockResponse);

      const patchData = { status: 'active' };
      const config = { headers: { 'If-Match': '"etag-value"' } };
      await apiClient.patch('/test/1', patchData, config);

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/test/1', patchData, config);
    });

    it('should handle PATCH request errors', async () => {
      const error = new Error('Patch failed');
      mockAxiosInstance.patch.mockRejectedValue(error);

      await expect(apiClient.patch('/test/1', {})).rejects.toThrow('Patch failed');
    });
  });

  describe('HTTP DELETE Method', () => {
    it('should make DELETE request and return response', async () => {
      const mockResponse = {
        data: { status: 'success', data: null },
      };
      mockAxiosInstance.delete.mockResolvedValue(mockResponse);

      const result = await apiClient.delete('/test/1');

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/test/1', undefined);
      expect(result).toEqual(mockResponse.data);
    });

    it('should pass config to DELETE request', async () => {
      const mockResponse = { data: { status: 'success' } };
      mockAxiosInstance.delete.mockResolvedValue(mockResponse);

      const config = { data: { reason: 'cleanup' } };
      await apiClient.delete('/test/1', config);

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/test/1', config);
    });

    it('should handle DELETE request errors', async () => {
      const error = new Error('Delete failed');
      mockAxiosInstance.delete.mockRejectedValue(error);

      await expect(apiClient.delete('/test/1')).rejects.toThrow('Delete failed');
    });
  });

  describe('Response Data Extraction', () => {
    it('should extract data from successful API responses', async () => {
      const mockResponse = {
        data: {
          status: 'success',
          data: { id: 1, items: [1, 2, 3] },
          meta: { page: 1, total: 3 },
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await apiClient.get('/test');

      expect(result).toEqual(mockResponse.data);
      expect(result).toHaveProperty('status', 'success');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
    });

    it('should handle responses with nested data structures', async () => {
      const complexData = {
        users: [{ id: 1, name: 'User 1' }],
        pagination: { page: 1, totalPages: 10 },
        filters: { active: true },
      };

      const mockResponse = {
        data: { status: 'success', data: complexData },
      };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await apiClient.post('/complex');

      expect(result.data).toEqual(complexData);
    });
  });

  describe('useApi Composable', () => {
    it('should return api client instance', () => {
      const { api } = useApi();

      expect(api).toBeDefined();
      expect(api).toBe(apiClient);
    });

    it('should provide access to all HTTP methods', () => {
      const { api } = useApi();

      expect(typeof api.get).toBe('function');
      expect(typeof api.post).toBe('function');
      expect(typeof api.put).toBe('function');
      expect(typeof api.patch).toBe('function');
      expect(typeof api.delete).toBe('function');
    });
  });

  describe('Error Handling', () => {
    it('should propagate errors from axios instance', async () => {
      const errorResponse = {
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
      };
      mockAxiosInstance.get.mockRejectedValue(errorResponse);

      await expect(apiClient.get('/error')).rejects.toMatchObject(errorResponse);
    });

    it('should handle timeout errors', async () => {
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'timeout of 10000ms exceeded',
      };
      mockAxiosInstance.post.mockRejectedValue(timeoutError);

      await expect(apiClient.post('/slow')).rejects.toMatchObject({
        code: 'ECONNABORTED',
      });
    });

    it('should handle network errors', async () => {
      const networkError = {
        code: 'ERR_NETWORK',
        message: 'Network Error',
      };
      mockAxiosInstance.get.mockRejectedValue(networkError);

      await expect(apiClient.get('/unreachable')).rejects.toMatchObject({
        code: 'ERR_NETWORK',
      });
    });
  });
});
