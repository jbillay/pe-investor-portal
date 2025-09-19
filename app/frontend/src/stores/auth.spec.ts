import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from './auth';
import { TestHelper, MockApiClient } from '../test/utils/test-helpers';

// Mock the API client
const mockApiClient = MockApiClient.createMockImplementation();
vi.mock('../services/api', () => ({
  apiClient: {
    auth: mockApiClient,
  },
}));

describe('Auth Store', () => {
  let authStore: ReturnType<typeof useAuthStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    authStore = useAuthStore();
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      expect(authStore.user).toBeNull();
      expect(authStore.accessToken).toBeNull();
      expect(authStore.refreshToken).toBeNull();
      expect(authStore.isAuthenticated).toBe(false);
      expect(authStore.isLoading).toBe(false);
      expect(authStore.error).toBeNull();
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const loginData = { email: 'test@example.com', password: 'password' };
      const mockResponse = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: TestHelper.generateMockUser(),
        expiresIn: 900,
      };

      mockApiClient.login.mockResolvedValueOnce({ data: mockResponse });

      await authStore.login(loginData);

      expect(mockApiClient.login).toHaveBeenCalledWith(loginData);
      expect(authStore.user).toEqual(mockResponse.user);
      expect(authStore.accessToken).toBe(mockResponse.accessToken);
      expect(authStore.refreshToken).toBe(mockResponse.refreshToken);
      expect(authStore.isAuthenticated).toBe(true);
      expect(authStore.error).toBeNull();
      expect(authStore.isLoading).toBe(false);
    });

    it('should handle login errors', async () => {
      const loginData = { email: 'test@example.com', password: 'wrongpassword' };
      const mockError = {
        response: {
          data: { message: 'Invalid credentials' },
          status: 401,
        },
      };

      mockApiClient.login.mockRejectedValueOnce(mockError);

      await expect(authStore.login(loginData)).rejects.toEqual(mockError);

      expect(authStore.user).toBeNull();
      expect(authStore.accessToken).toBeNull();
      expect(authStore.refreshToken).toBeNull();
      expect(authStore.isAuthenticated).toBe(false);
      expect(authStore.error).toBe('Invalid credentials');
      expect(authStore.isLoading).toBe(false);
    });

    it('should set loading state during login', async () => {
      const loginData = { email: 'test@example.com', password: 'password' };

      mockApiClient.login.mockImplementation(() => {
        expect(authStore.isLoading).toBe(true);
        return Promise.resolve({ data: {} });
      });

      await authStore.login(loginData);

      expect(authStore.isLoading).toBe(false);
    });
  });

  describe('register', () => {
    it('should register successfully', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'password',
        firstName: 'John',
        lastName: 'Doe',
      };
      const mockResponse = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: TestHelper.generateMockUser(),
        expiresIn: 900,
      };

      mockApiClient.register.mockResolvedValueOnce({ data: mockResponse });

      await authStore.register(registerData);

      expect(mockApiClient.register).toHaveBeenCalledWith(registerData);
      expect(authStore.user).toEqual(mockResponse.user);
      expect(authStore.accessToken).toBe(mockResponse.accessToken);
      expect(authStore.refreshToken).toBe(mockResponse.refreshToken);
      expect(authStore.isAuthenticated).toBe(true);
    });

    it('should handle registration errors', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'password',
        firstName: 'John',
        lastName: 'Doe',
      };
      const mockError = {
        response: {
          data: { message: 'User already exists' },
          status: 409,
        },
      };

      mockApiClient.register.mockRejectedValueOnce(mockError);

      await expect(authStore.register(registerData)).rejects.toEqual(mockError);

      expect(authStore.error).toBe('User already exists');
    });
  });

  describe('logout', () => {
    beforeEach(async () => {
      // Set up authenticated state
      authStore.$patch({
        user: TestHelper.generateMockUser(),
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      });
    });

    it('should logout successfully', async () => {
      mockApiClient.logout.mockResolvedValueOnce({ data: { message: 'Logged out successfully' } });

      await authStore.logout();

      expect(mockApiClient.logout).toHaveBeenCalledWith({
        refreshToken: 'mock-refresh-token',
      });
      expect(authStore.user).toBeNull();
      expect(authStore.accessToken).toBeNull();
      expect(authStore.refreshToken).toBeNull();
      expect(authStore.isAuthenticated).toBe(false);
    });

    it('should clear state even if logout API fails', async () => {
      mockApiClient.logout.mockRejectedValueOnce(new Error('Network error'));

      await authStore.logout();

      expect(authStore.user).toBeNull();
      expect(authStore.accessToken).toBeNull();
      expect(authStore.refreshToken).toBeNull();
      expect(authStore.isAuthenticated).toBe(false);
    });
  });

  describe('refreshToken', () => {
    beforeEach(() => {
      authStore.$patch({
        refreshToken: 'mock-refresh-token',
      });
    });

    it('should refresh tokens successfully', async () => {
      const mockResponse = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        user: TestHelper.generateMockUser(),
        expiresIn: 900,
      };

      mockApiClient.refreshToken.mockResolvedValueOnce({ data: mockResponse });

      await authStore.refreshAccessToken();

      expect(mockApiClient.refreshToken).toHaveBeenCalledWith({
        refreshToken: 'mock-refresh-token',
      });
      expect(authStore.accessToken).toBe(mockResponse.accessToken);
      expect(authStore.refreshToken).toBe(mockResponse.refreshToken);
      expect(authStore.user).toEqual(mockResponse.user);
    });

    it('should logout user if refresh fails', async () => {
      mockApiClient.refreshToken.mockRejectedValueOnce(new Error('Invalid refresh token'));

      await authStore.refreshAccessToken();

      expect(authStore.user).toBeNull();
      expect(authStore.accessToken).toBeNull();
      expect(authStore.refreshToken).toBeNull();
    });
  });

  describe('fetchProfile', () => {
    beforeEach(() => {
      authStore.$patch({
        accessToken: 'mock-access-token',
      });
    });

    it('should fetch user profile successfully', async () => {
      const mockUser = TestHelper.generateMockUser();
      mockApiClient.getProfile.mockResolvedValueOnce({ data: mockUser });

      await authStore.fetchProfile();

      expect(mockApiClient.getProfile).toHaveBeenCalled();
      expect(authStore.user).toEqual(mockUser);
    });

    it('should handle profile fetch errors', async () => {
      const mockError = {
        response: {
          data: { message: 'Unauthorized' },
          status: 401,
        },
      };

      mockApiClient.getProfile.mockRejectedValueOnce(mockError);

      await expect(authStore.fetchProfile()).rejects.toEqual(mockError);
    });
  });

  describe('token persistence', () => {
    it('should save tokens to localStorage on login', async () => {
      const mockResponse = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: TestHelper.generateMockUser(),
        expiresIn: 900,
      };

      mockApiClient.login.mockResolvedValueOnce({ data: mockResponse });

      await authStore.login({ email: 'test@example.com', password: 'password' });

      expect(localStorage.getItem('accessToken')).toBe(mockResponse.accessToken);
      expect(localStorage.getItem('refreshToken')).toBe(mockResponse.refreshToken);
      expect(JSON.parse(localStorage.getItem('user') || '{}')).toEqual(mockResponse.user);
    });

    it('should restore tokens from localStorage on initialization', () => {
      const mockUser = TestHelper.generateMockUser();
      localStorage.setItem('accessToken', 'stored-access-token');
      localStorage.setItem('refreshToken', 'stored-refresh-token');
      localStorage.setItem('user', JSON.stringify(mockUser));

      authStore.initializeFromStorage();

      expect(authStore.accessToken).toBe('stored-access-token');
      expect(authStore.refreshToken).toBe('stored-refresh-token');
      expect(authStore.user).toEqual(mockUser);
      expect(authStore.isAuthenticated).toBe(true);
    });

    it('should clear localStorage on logout', async () => {
      localStorage.setItem('accessToken', 'mock-access-token');
      localStorage.setItem('refreshToken', 'mock-refresh-token');
      localStorage.setItem('user', JSON.stringify(TestHelper.generateMockUser()));

      mockApiClient.logout.mockResolvedValueOnce({ data: {} });

      await authStore.logout();

      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('computed properties', () => {
    it('should compute isAuthenticated correctly', () => {
      expect(authStore.isAuthenticated).toBe(false);

      authStore.$patch({
        accessToken: 'mock-access-token',
        user: TestHelper.generateMockUser(),
      });

      expect(authStore.isAuthenticated).toBe(true);
    });

    it('should compute user display name correctly', () => {
      const mockUser = TestHelper.generateMockUser();
      authStore.$patch({ user: mockUser });

      expect(authStore.userDisplayName).toBe(`${mockUser.firstName} ${mockUser.lastName}`);

      // Test with null names
      authStore.$patch({
        user: { ...mockUser, firstName: null, lastName: null },
      });

      expect(authStore.userDisplayName).toBe(mockUser.email);
    });
  });

  describe('error handling', () => {
    it('should clear error on successful operations', async () => {
      authStore.$patch({ error: 'Previous error' });

      const mockResponse = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: TestHelper.generateMockUser(),
        expiresIn: 900,
      };

      mockApiClient.login.mockResolvedValueOnce({ data: mockResponse });

      await authStore.login({ email: 'test@example.com', password: 'password' });

      expect(authStore.error).toBeNull();
    });

    it('should set appropriate error messages', async () => {
      const mockError = {
        response: {
          data: { message: 'Custom error message' },
          status: 400,
        },
      };

      mockApiClient.login.mockRejectedValueOnce(mockError);

      await expect(authStore.login({ email: 'test@example.com', password: 'password' }))
        .rejects.toEqual(mockError);

      expect(authStore.error).toBe('Custom error message');
    });

    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network Error');
      mockApiClient.login.mockRejectedValueOnce(networkError);

      await expect(authStore.login({ email: 'test@example.com', password: 'password' }))
        .rejects.toEqual(networkError);

      expect(authStore.error).toBe('Network Error');
    });
  });
});