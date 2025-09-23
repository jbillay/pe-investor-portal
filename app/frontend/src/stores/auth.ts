import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { apiClient } from '@composables/useApi';
import type {
  User,
  LoginCredentials,
  LoginResponse,
  RefreshTokenResponse,
} from '@/types/auth';

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null);
  const accessToken = ref<string | null>(localStorage.getItem('accessToken'));
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'));
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const isAuthenticated = computed(() => !!user.value && !!accessToken.value);
  const userInitials = computed(() => {
    if (!user.value) return '';
    return `${user.value.firstName.charAt(0)}${user.value.lastName.charAt(0)}`.toUpperCase();
  });
  const userFullName = computed(() => {
    if (!user.value) return '';
    return `${user.value.firstName} ${user.value.lastName}`;
  });

  // Helper functions to reduce code duplication
  function parseApiResponse<T>(response: any, expectedProperty?: string): T {
    if (response.status === 'success' && response.data) {
      return response.data;
    } else if (expectedProperty && (response as any)[expectedProperty]) {
      return response as T;
    } else if (!expectedProperty && (response as any).id) {
      return response as T;
    }
    throw new Error(`Invalid API response format`);
  }

  async function fetchUserRolesAndPermissions(): Promise<{
    roles: string[];
    permissions: string[];
  }> {
    try {
      console.log('Fetching user roles and permissions...');
      const rolesResponse = await apiClient.get('admin/roles/me/roles');
      console.log('User roles API response:', rolesResponse);

      let rolesData: any;
      try {
        rolesData = parseApiResponse(rolesResponse, 'roles');
      } catch {
        console.warn('No roles data found in response, using empty roles');
        rolesData = { roles: [], permissions: [] };
      }

      const roles =
        rolesData.roles?.map((role: any) => role.name || role) || [];
      const permissions =
        rolesData.permissions?.map((perm: any) => perm.name || perm) || [];

      return { roles, permissions };
    } catch (rolesError: any) {
      console.warn('Failed to fetch user roles:', rolesError);
      return { roles: [], permissions: [] };
    }
  }

  function updateUserWithRoles(
    userData: User,
    roles: string[],
    permissions: string[],
  ): User {
    return {
      ...userData,
      roles,
      permissions,
    };
  }

  function saveUserToStorage(userData: User): void {
    user.value = userData;
    localStorage.setItem('user', JSON.stringify(userData));
  }

  function saveTokensToStorage(
    accessTokenValue: string,
    refreshTokenValue: string,
  ): void {
    accessToken.value = accessTokenValue;
    refreshToken.value = refreshTokenValue;
    localStorage.setItem('accessToken', accessTokenValue);
    localStorage.setItem('refreshToken', refreshTokenValue);
  }

  // Actions
  async function login(credentials: LoginCredentials): Promise<void> {
    try {
      isLoading.value = true;
      error.value = null;

      console.log('Making login API call...');
      const response = await apiClient.post<LoginResponse>(
        '/auth/login',
        credentials,
      );
      console.log('Login API response:', response);

      // Parse login response
      let loginData: any;
      try {
        loginData = parseApiResponse(response, 'user');
      } catch {
        // Try direct format
        if ((response as any).user && (response as any).accessToken) {
          loginData = response;
        } else {
          console.error('Login response format unexpected:', response);
          throw new Error('Invalid login response format');
        }
      }

      const {
        user: userData,
        accessToken: token,
        refreshToken: refresh,
      } = loginData;

      console.log('Setting auth state:', {
        userData,
        hasToken: !!token,
        hasRefresh: !!refresh,
      });

      // Save tokens first
      saveTokensToStorage(token, refresh);

      // Fetch user roles and permissions
      const { roles, permissions } = await fetchUserRolesAndPermissions();

      // Update user data with roles and permissions
      const completeUserData = updateUserWithRoles(
        userData,
        roles,
        permissions,
      );

      // Save complete user data
      saveUserToStorage(completeUserData);

      console.log('Auth state updated:', {
        isAuthenticated: isAuthenticated.value,
        userSet: !!user.value,
        tokenSet: !!accessToken.value,
        roles: completeUserData.roles,
        permissions: completeUserData.permissions,
      });
    } catch (err: any) {
      console.error('Login API error:', err);
      error.value = err.response?.data?.message || 'Login failed';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function logout(): Promise<void> {
    try {
      // Call logout endpoint if we have a token
      if (accessToken.value) {
        await apiClient.post('/auth/logout', {
          refreshToken: refreshToken.value,
        });
      }
    } catch (err) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', err);
    } finally {
      // Clear state and localStorage
      user.value = null;
      accessToken.value = null;
      refreshToken.value = null;
      error.value = null;

      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }

  async function refreshTokens(): Promise<void> {
    if (!refreshToken.value) {
      throw new Error('No refresh token available');
    }

    console.log('In refreshToken', refreshToken.value)
    try {
      console.log('Query /auth/refresh');
      const response = await apiClient.post<RefreshTokenResponse>(
        '/auth/refresh',
        {
          refreshToken: refreshToken.value,
        },
      );

      console.log('Response from refresh token', response);

      if (response.status === 'success' && response.data) {
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          response.data;

        accessToken.value = newAccessToken;
        refreshToken.value = newRefreshToken;

        localStorage.setItem('accessToken', newAccessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
      }
    } catch (err) {
      console.log('Response from refresh token failed', err);
      // If refresh fails, clear all auth data
      await logout();
      throw err;
    }
  }

  async function getCurrentUser(): Promise<void> {
    if (!accessToken.value) return;

    try {
      isLoading.value = true;
      console.log('In GetCurrentUser: Fetching current user...');

      // Fetch basic user profile
      const profileResponse = await apiClient.get<User>('/auth/profile');
      console.log('getCurrentUser API response:', profileResponse);

      // Parse profile response
      const userData = parseApiResponse<User>(profileResponse);

      // Fetch user roles and permissions
      const { roles, permissions } = await fetchUserRolesAndPermissions();

      // Update user data with roles and permissions
      const completeUserData = updateUserWithRoles(
        userData,
        roles,
        permissions,
      );

      // Save complete user data
      saveUserToStorage(completeUserData);

      console.log('User data updated with roles:', completeUserData);
    } catch (err: any) {
      console.error('getCurrentUser API error:', err);
      error.value = err.response?.data?.message || 'Failed to get user data';
      // If getting current user fails, tokens might be invalid
      if (err.response?.status === 401) {
        console.log('Token invalid, logging out...');
        await logout();
      } else {
        // For non-401 errors, don't logout - just throw the error
        throw err;
      }
    } finally {
      isLoading.value = false;
    }
  }

  async function updateProfile(profileData: Partial<User>): Promise<void> {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await apiClient.patch<User>(
        '/auth/profile',
        profileData,
      );
      const updatedUserData = parseApiResponse<User>(response);

      // Preserve existing roles and permissions when updating profile
      const completeUserData = user.value
        ? {
            ...updatedUserData,
            roles: user.value.roles,
            permissions: user.value.permissions,
          }
        : updatedUserData;

      saveUserToStorage(completeUserData);
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to update profile';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  // Initialize auth state from localStorage
  function initializeAuth(): void {
    const storedUser = localStorage.getItem('user');
    if (storedUser && accessToken.value) {
      try {
        const parsedUser = JSON.parse(storedUser);
        user.value = parsedUser;
        console.log('Auth initialized from localStorage:', {
          userId: parsedUser.id,
          email: parsedUser.email,
          roles: parsedUser.roles,
          isAuthenticated: isAuthenticated.value,
        });
      } catch (err) {
        console.warn('Failed to parse stored user data:', err);
        logout();
      }
    } else {
      console.log('No stored user data or access token found');
    }
  }

  // Refresh user roles and permissions only
  async function refreshUserRoles(): Promise<void> {
    if (!accessToken.value || !user.value) return;

    try {
      console.log('Refreshing user roles and permissions...');

      // Note: Different endpoint than fetchUserRolesAndPermissions
      const rolesResponse = await apiClient.get('/roles/me/roles');
      console.log('User roles refresh response:', rolesResponse);

      let rolesData: any;
      try {
        rolesData = parseApiResponse(rolesResponse, 'roles');
      } catch {
        console.warn('No roles data found in response, using empty roles');
        rolesData = { roles: [], permissions: [] };
      }

      const roles =
        rolesData.roles?.map((role: any) => role.name || role) || [];
      const permissions =
        rolesData.permissions?.map((perm: any) => perm.name || perm) || [];

      // Update user data with new roles and permissions
      const updatedUserData = updateUserWithRoles(
        user.value,
        roles,
        permissions,
      );
      saveUserToStorage(updatedUserData);

      console.log('User roles refreshed:', { roles, permissions });
    } catch (rolesError: any) {
      console.warn('Failed to refresh user roles:', rolesError);
      // Don't throw error, just log it
    }
  }

  // Check if user has a specific role
  function hasRole(roleName: string): boolean {
    return user.value?.roles?.includes(roleName) || false;
  }

  // Check if user has a specific permission
  function hasPermission(permissionName: string): boolean {
    return user.value?.permissions?.includes(permissionName) || false;
  }

  // Clear any auth errors
  function clearError(): void {
    error.value = null;
  }

  return {
    // State
    user,
    accessToken,
    refreshToken,
    isLoading,
    error,

    // Getters
    isAuthenticated,
    userInitials,
    userFullName,

    // Actions
    login,
    logout,
    refreshTokens,
    getCurrentUser,
    updateProfile,
    initializeAuth,
    refreshUserRoles,
    hasRole,
    hasPermission,
    clearError,
  };
});
