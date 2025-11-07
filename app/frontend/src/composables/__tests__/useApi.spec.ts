import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

// Mock axios
vi.mock('axios');

// Mock auth store
const mockAuthStore = {
  accessToken: null as string | null,
  refreshTokens: vi.fn(),
  logout: vi.fn(),
};

vi.mock('@stores/auth', () => ({
  useAuthStore: () => mockAuthStore
}));

// Mock CSRF composable
const mockGetCsrfToken = vi.fn();
vi.mock('@/composables/useCsrf', () => ({
  useCsrf: () => ({
    getCsrfToken: mockGetCsrfToken
  })
}));

describe('ApiClient (useApi)', () => {
  let mockAxiosInstance: any;
  let requestInterceptor: any;
  let responseInterceptor: any;
  let responseErrorInterceptor: any;

  beforeEach(async () => {
    // Clear all mocks
    vi.clearAllMocks();
    vi.resetModules();

    // Reset auth store state
    mockAuthStore.accessToken = null;
    mockAuthStore.refreshTokens.mockReset();
    mockAuthStore.logout.mockReset();

    // Reset CSRF mock
    mockGetCsrfToken.mockReset();
    mockGetCsrfToken.mockResolvedValue('csrf-token-123');

    // Setup axios mock - instance should also be callable as a function
    const instanceFunction = vi.fn().mockResolvedValue({ data: { success: true } });
    mockAxiosInstance = Object.assign(instanceFunction, {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: {
          use: vi.fn((successHandler, errorHandler) => {
            requestInterceptor = { success: successHandler, error: errorHandler };
          })
        },
        response: {
          use: vi.fn((successHandler, errorHandler) => {
            responseInterceptor = successHandler;
            responseErrorInterceptor = errorHandler;
          })
        }
      }
    });

    vi.mocked(axios.create).mockReturnValue(mockAxiosInstance as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Clear window.location.href mock
    delete (window as any).location;
  });

  describe('ApiClient initialization', () => {
    it('should create axios instance with correct config', async () => {
      const { apiClient } = await import('@/composables/useApi');

      expect(axios.create).toHaveBeenCalledWith({
        baseURL: expect.any(String),
        timeout: 10000,
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should setup request and response interceptors', async () => {
      const { apiClient } = await import('@/composables/useApi');

      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('HTTP methods', () => {
    it('should make GET request and return data', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockAxiosInstance.get.mockResolvedValue({ data: mockData });

      const { apiClient } = await import('@/composables/useApi');
      const result = await apiClient.get('/test');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test', undefined);
      expect(result).toEqual(mockData);
    });

    it('should make POST request and return data', async () => {
      const mockData = { id: 1, name: 'Created' };
      const postData = { name: 'New Item' };
      mockAxiosInstance.post.mockResolvedValue({ data: mockData });

      const { apiClient } = await import('@/composables/useApi');
      const result = await apiClient.post('/test', postData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test', postData, undefined);
      expect(result).toEqual(mockData);
    });

    it('should make PUT request and return data', async () => {
      const mockData = { id: 1, name: 'Updated' };
      const putData = { name: 'Updated Item' };
      mockAxiosInstance.put.mockResolvedValue({ data: mockData });

      const { apiClient } = await import('@/composables/useApi');
      const result = await apiClient.put('/test/1', putData);

      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/test/1', putData, undefined);
      expect(result).toEqual(mockData);
    });

    it('should make PATCH request and return data', async () => {
      const mockData = { id: 1, name: 'Patched' };
      const patchData = { name: 'Patched Item' };
      mockAxiosInstance.patch.mockResolvedValue({ data: mockData });

      const { apiClient } = await import('@/composables/useApi');
      const result = await apiClient.patch('/test/1', patchData);

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/test/1', patchData, undefined);
      expect(result).toEqual(mockData);
    });

    it('should make DELETE request and return data', async () => {
      const mockData = { success: true };
      mockAxiosInstance.delete.mockResolvedValue({ data: mockData });

      const { apiClient } = await import('@/composables/useApi');
      const result = await apiClient.delete('/test/1');

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/test/1', undefined);
      expect(result).toEqual(mockData);
    });

    it('should pass config options to HTTP methods', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: {} });

      const { apiClient } = await import('@/composables/useApi');
      const config = { params: { page: 1 } };
      await apiClient.get('/test', config);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test', config);
    });
  });

  describe('useApi function', () => {
    it('should return api client instance', async () => {
      const { useApi, apiClient } = await import('@/composables/useApi');
      const result = useApi();

      expect(result).toHaveProperty('api');
      expect(result.api).toBe(apiClient);
    });
  });

  describe('Request interceptor', () => {
    it('should add Authorization header when accessToken exists', async () => {
      mockAuthStore.accessToken = 'test-access-token';
      await import('@/composables/useApi');

      const config = {
        url: '/test',
        method: 'get',
        headers: {}
      };

      const result = await requestInterceptor.success(config);

      expect(result.headers.Authorization).toBe('Bearer test-access-token');
    });

    it('should not add Authorization header when no accessToken', async () => {
      mockAuthStore.accessToken = null;
      await import('@/composables/useApi');

      const config = {
        url: '/test',
        method: 'get',
        headers: {}
      };

      const result = await requestInterceptor.success(config);

      expect(result.headers.Authorization).toBeUndefined();
    });

    it('should add CSRF token for POST requests', async () => {
      mockGetCsrfToken.mockResolvedValue('csrf-token-123');
      await import('@/composables/useApi');

      const config = {
        url: '/test',
        method: 'post',
        headers: {}
      };

      const result = await requestInterceptor.success(config);

      expect(mockGetCsrfToken).toHaveBeenCalled();
      expect(result.headers['x-csrf-token']).toBe('csrf-token-123');
    });

    it('should add CSRF token for PUT requests', async () => {
      mockGetCsrfToken.mockResolvedValue('csrf-token-456');
      await import('@/composables/useApi');

      const config = {
        url: '/test',
        method: 'put',
        headers: {}
      };

      const result = await requestInterceptor.success(config);

      expect(result.headers['x-csrf-token']).toBe('csrf-token-456');
    });

    it('should add CSRF token for PATCH requests', async () => {
      mockGetCsrfToken.mockResolvedValue('csrf-token-789');
      await import('@/composables/useApi');

      const config = {
        url: '/test',
        method: 'patch',
        headers: {}
      };

      const result = await requestInterceptor.success(config);

      expect(result.headers['x-csrf-token']).toBe('csrf-token-789');
    });

    it('should add CSRF token for DELETE requests', async () => {
      mockGetCsrfToken.mockResolvedValue('csrf-token-delete');
      await import('@/composables/useApi');

      const config = {
        url: '/test',
        method: 'delete',
        headers: {}
      };

      const result = await requestInterceptor.success(config);

      expect(result.headers['x-csrf-token']).toBe('csrf-token-delete');
    });

    it('should not add CSRF token for GET requests', async () => {
      await import('@/composables/useApi');

      const config = {
        url: '/test',
        method: 'get',
        headers: {}
      };

      const result = await requestInterceptor.success(config);

      expect(mockGetCsrfToken).not.toHaveBeenCalled();
      expect(result.headers['x-csrf-token']).toBeUndefined();
    });

    it('should continue without CSRF token if getCsrfToken fails', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGetCsrfToken.mockRejectedValue(new Error('CSRF failed'));
      await import('@/composables/useApi');

      const config = {
        url: '/test',
        method: 'post',
        headers: {}
      };

      const result = await requestInterceptor.success(config);

      expect(consoleError).toHaveBeenCalledWith('[API] Failed to get CSRF token:', expect.any(Error));
      expect(result.headers['x-csrf-token']).toBeUndefined();

      consoleError.mockRestore();
    });

    it('should not wait for refresh on logout requests', async () => {
      await import('@/composables/useApi');

      const config = {
        url: '/auth/logout',
        method: 'post',
        headers: {}
      };

      // Should complete quickly without waiting
      const result = await requestInterceptor.success(config);
      expect(result).toBeDefined();
    });
  });

  describe('Response interceptor - Error handling', () => {
    it('should pass through successful responses', async () => {
      await import('@/composables/useApi');

      const response = { data: { success: true }, status: 200 };
      const result = responseInterceptor(response);

      expect(result).toBe(response);
    });

    it('should handle timeout errors', async () => {
      await import('@/composables/useApi');

      const error = {
        code: 'ECONNABORTED',
        config: { url: '/test' },
        message: 'timeout of 10000ms exceeded'
      };

      await expect(responseErrorInterceptor(error)).rejects.toThrow(
        'Request timeout - The server took too long to respond. Please try again.'
      );
    });

    it('should handle network errors', async () => {
      await import('@/composables/useApi');

      const error = {
        code: 'ERR_NETWORK',
        message: 'Network Error'
      };

      await expect(responseErrorInterceptor(error)).rejects.toThrow(
        'Cannot connect to backend server. Please ensure the backend is running on port 5173.'
      );
    });

    it('should handle HTML response errors (404/500)', async () => {
      await import('@/composables/useApi');

      const error = {
        response: {
          status: 404,
          headers: {
            'content-type': 'text/html'
          }
        }
      };

      await expect(responseErrorInterceptor(error)).rejects.toThrow(
        'Server error (404): Endpoint not found or server misconfigured'
      );
    });

    it('should handle rate limiting (429)', async () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      await import('@/composables/useApi');

      const error = {
        response: {
          status: 429,
          headers: { 'content-type': 'application/json' }
        }
      };

      await expect(responseErrorInterceptor(error)).rejects.toEqual(error);
      expect(consoleWarn).toHaveBeenCalledWith('Rate limit exceeded, please wait before retrying');

      consoleWarn.mockRestore();
    });
  });

  describe('Response interceptor - 401 Handling', () => {
    beforeEach(() => {
      // Mock window.location
      delete (window as any).location;
      (window as any).location = { href: '' };
    });

    it('should return error for login requests without retry', async () => {
      await import('@/composables/useApi');

      const error = {
        response: {
          status: 401,
          headers: { 'content-type': 'application/json' }
        },
        config: {
          url: '/auth/login',
          _retry: undefined
        }
      };

      await expect(responseErrorInterceptor(error)).rejects.toEqual(error);
      expect(mockAuthStore.refreshTokens).not.toHaveBeenCalled();
    });

    it('should redirect to login for failed refresh requests', async () => {
      await import('@/composables/useApi');

      // Mock localStorage
      const mockLocalStorage = {
        removeItem: vi.fn()
      };
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true
      });

      const error = {
        response: {
          status: 401,
          headers: { 'content-type': 'application/json' }
        },
        config: {
          url: '/auth/refresh',
          _retry: undefined
        }
      };

      await expect(responseErrorInterceptor(error)).rejects.toEqual(error);

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('requiresPasswordChange');
      expect(window.location.href).toBe('/login');
    });

    it('should attempt token refresh on 401 for regular requests', async () => {
      mockAuthStore.refreshTokens.mockResolvedValue(undefined);
      mockAuthStore.accessToken = 'new-token';

      // Mock the retry request after refresh
      mockAxiosInstance.get.mockResolvedValue({ data: { success: true } });

      await import('@/composables/useApi');

      const error = {
        response: {
          status: 401,
          headers: { 'content-type': 'application/json' }
        },
        config: {
          url: '/api/protected',
          method: 'get',
          headers: {},
          _retry: undefined
        }
      };

      await responseErrorInterceptor(error);

      expect(mockAuthStore.refreshTokens).toHaveBeenCalled();
      expect(error.config._retry).toBe(true);
    });

    it('should logout and redirect if refresh fails', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockAuthStore.refreshTokens.mockRejectedValue(new Error('Refresh failed'));

      await import('@/composables/useApi');

      const error = {
        response: {
          status: 401,
          headers: { 'content-type': 'application/json' }
        },
        config: {
          url: '/api/protected',
          headers: {},
          _retry: undefined
        }
      };

      await expect(responseErrorInterceptor(error)).rejects.toThrow('Refresh failed');

      expect(mockAuthStore.logout).toHaveBeenCalled();
      expect(window.location.href).toBe('/login');

      consoleError.mockRestore();
    });

    it('should handle cooldown errors without logout', async () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockAuthStore.refreshTokens.mockRejectedValue(new Error('Refresh on cooldown'));

      await import('@/composables/useApi');

      const error = {
        response: {
          status: 401,
          headers: { 'content-type': 'application/json' }
        },
        config: {
          url: '/api/protected',
          headers: {},
          _retry: undefined
        }
      };

      await expect(responseErrorInterceptor(error)).rejects.toEqual(error);

      expect(mockAuthStore.logout).not.toHaveBeenCalled();
      expect(consoleWarn).toHaveBeenCalledWith('Refresh cooldown active, request will be retried later');

      consoleWarn.mockRestore();
    });

    it('should not retry already retried requests', async () => {
      await import('@/composables/useApi');

      const error = {
        response: {
          status: 401,
          headers: { 'content-type': 'application/json' }
        },
        config: {
          url: '/api/protected',
          _retry: true
        }
      };

      await expect(responseErrorInterceptor(error)).rejects.toEqual(error);
      expect(mockAuthStore.refreshTokens).not.toHaveBeenCalled();
    });
  });

  describe('Response interceptor - Non-401 errors', () => {
    it('should pass through non-401 errors', async () => {
      await import('@/composables/useApi');

      const error = {
        response: {
          status: 403,
          headers: { 'content-type': 'application/json' }
        },
        config: { url: '/forbidden' }
      };

      await expect(responseErrorInterceptor(error)).rejects.toEqual(error);
    });

    it('should pass through errors without response', async () => {
      await import('@/composables/useApi');

      const error = {
        message: 'Something went wrong'
      };

      await expect(responseErrorInterceptor(error)).rejects.toEqual(error);
    });
  });
});
