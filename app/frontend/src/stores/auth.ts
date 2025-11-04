import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { apiClient } from '@composables/useApi';
import { useCsrf } from '@/composables/useCsrf';
import type {
  User,
  LoginCredentials,
  LoginResponse,
  RefreshTokenResponse,
  SetPasswordRequest,
  SetPasswordResponse,
} from '@/types/auth';

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null);
  const accessToken = ref<string | null>(localStorage.getItem('accessToken'));
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'));
  const requiresPasswordChange = ref<boolean>(localStorage.getItem('requiresPasswordChange') === 'true');
  const isLoading = ref(false);
  const isRefreshing = ref(false);
  const error = ref<string | null>(null);

  // Token refresh management
  let refreshPromise: Promise<void> | null = null;
  let lastRefreshAttempt: number = 0;
  const REFRESH_COOLDOWN = 5000; // 5 seconds between refresh attempts
  let refreshRetryCount = 0;
  const MAX_REFRESH_RETRIES = 3;

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
        requiresPasswordChange: needsPasswordChange,
      } = loginData;

      console.log('Setting auth state:', {
        userData,
        hasToken: !!token,
        hasRefresh: !!refresh,
        requiresPasswordChange: needsPasswordChange,
      });

      // Save tokens first
      saveTokensToStorage(token, refresh);

      // Store requiresPasswordChange flag
      if (needsPasswordChange) {
        requiresPasswordChange.value = true;
        localStorage.setItem('requiresPasswordChange', 'true');
      } else {
        requiresPasswordChange.value = false;
        localStorage.removeItem('requiresPasswordChange');
      }

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
      // Clear CSRF token
      const { clearCsrfToken } = useCsrf();
      clearCsrfToken();

      // Clear state and localStorage
      user.value = null;
      accessToken.value = null;
      refreshToken.value = null;
      requiresPasswordChange.value = false;
      error.value = null;

      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('requiresPasswordChange');
    }
  }

  async function refreshTokens(): Promise<void> {
    // If refresh already in progress, return existing promise
    if (refreshPromise) {
      console.log('Refresh already in progress, waiting...');
      return refreshPromise;
    }

    if (!refreshToken.value) {
      throw new Error('No refresh token available');
    }

    // Check cooldown period
    const now = Date.now();
    if (now - lastRefreshAttempt < REFRESH_COOLDOWN) {
      const waitTime = Math.ceil((REFRESH_COOLDOWN - (now - lastRefreshAttempt)) / 1000);
      console.warn(`Refresh cooldown active. Please wait ${waitTime} seconds`);
      throw new Error('Refresh cooldown active');
    }

    // Check retry limit
    if (refreshRetryCount >= MAX_REFRESH_RETRIES) {
      console.error('Max refresh retries exceeded, logging out');
      await logout();
      throw new Error('Max refresh retries exceeded');
    }

    lastRefreshAttempt = now;
    refreshRetryCount++;
    isRefreshing.value = true;

    refreshPromise = (async () => {
      try {
        console.log(`Refreshing tokens (attempt ${refreshRetryCount}/${MAX_REFRESH_RETRIES})...`);

        const response = await apiClient.post<RefreshTokenResponse>(
          '/auth/refresh',
          { refreshToken: refreshToken.value },
        );

        console.log('Response from refresh token', response);

        // Backend returns tokens directly in the response (not wrapped in response.data)
        // Check for both wrapped and direct formats for compatibility
        let newAccessToken: string;
        let newRefreshToken: string;

        if (response.status === 'success' && response.data) {
          // Wrapped format: { status: 'success', data: { accessToken, refreshToken } }
          newAccessToken = response.data.accessToken;
          newRefreshToken = response.data.refreshToken;
        } else if ((response as any).accessToken && (response as any).refreshToken) {
          // Direct format: { accessToken, refreshToken, user }
          newAccessToken = (response as any).accessToken;
          newRefreshToken = (response as any).refreshToken;
        } else {
          throw new Error('Invalid refresh token response format');
        }

        accessToken.value = newAccessToken;
        refreshToken.value = newRefreshToken;

        localStorage.setItem('accessToken', newAccessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        // Reset retry count on success
        refreshRetryCount = 0;
        console.log('Token refresh successful');

      } catch (err: any) {
        console.error('Token refresh failed:', err);

        // Handle timeout errors - logout immediately, don't retry
        if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
          console.error('Refresh timeout - backend not responding, logging out');
          refreshRetryCount = MAX_REFRESH_RETRIES; // Force max retries
          // Clear tokens immediately
          accessToken.value = null;
          refreshToken.value = null;
          await logout();
        }
        // Handle specific error codes
        else if (err.response?.status === 429) {
          console.warn('Rate limited - waiting before retry');
          // Don't logout on rate limit, just fail this attempt
        } else if (err.response?.status === 401 || err.response?.status === 403) {
          console.error('Refresh token invalid or expired, logging out');
          refreshRetryCount = MAX_REFRESH_RETRIES; // Force max retries
          // Clear tokens immediately to prevent logout API call
          accessToken.value = null;
          refreshToken.value = null;
          // Don't await logout - just clear and let interceptor redirect
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          localStorage.removeItem('requiresPasswordChange');
        } else {
          // Other errors - logout if max retries exceeded
          if (refreshRetryCount >= MAX_REFRESH_RETRIES) {
            console.error('Max retries exceeded, logging out');
            await logout();
          }
        }

        throw err;
      } finally {
        isRefreshing.value = false;
        refreshPromise = null;
      }
    })();

    return refreshPromise;
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

  async function setPassword(passwordData: SetPasswordRequest): Promise<void> {
    try {
      isLoading.value = true;
      error.value = null;

      console.log('Setting new password...');
      const response = await apiClient.post<SetPasswordResponse>(
        '/auth/set-password',
        passwordData,
      );
      console.log('Set password API response:', response);

      // Parse response
      let setPasswordData: any;
      try {
        setPasswordData = parseApiResponse(response, 'user');
      } catch {
        // Try direct format
        if ((response as any).user && (response as any).accessToken) {
          setPasswordData = response;
        } else {
          console.error('Set password response format unexpected:', response);
          throw new Error('Invalid set password response format');
        }
      }

      const {
        user: userData,
        accessToken: token,
        refreshToken: refresh,
      } = setPasswordData;

      console.log('Password set successfully, updating auth state:', {
        userData,
        hasToken: !!token,
        hasRefresh: !!refresh,
      });

      // Save new tokens
      saveTokensToStorage(token, refresh);

      // Clear requiresPasswordChange flag
      requiresPasswordChange.value = false;
      localStorage.removeItem('requiresPasswordChange');

      // Fetch user roles and permissions for newly verified user
      const { roles, permissions } = await fetchUserRolesAndPermissions();

      // Update user data with roles and permissions
      const completeUserData = updateUserWithRoles(
        userData,
        roles,
        permissions,
      );

      // Save complete user data
      saveUserToStorage(completeUserData);

      console.log('Auth state updated after password set:', {
        isAuthenticated: isAuthenticated.value,
        userSet: !!user.value,
        tokenSet: !!accessToken.value,
        requiresPasswordChange: requiresPasswordChange.value,
        roles: completeUserData.roles,
        permissions: completeUserData.permissions,
      });
    } catch (err: any) {
      console.error('Set password API error:', err);
      error.value = err.response?.data?.message || 'Failed to set password';
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
          requiresPasswordChange: requiresPasswordChange.value,
        });
      } catch (err) {
        console.warn('Failed to parse stored user data:', err);
        // Logout synchronously by clearing state directly
        user.value = null;
        accessToken.value = null;
        refreshToken.value = null;
        requiresPasswordChange.value = false;
        error.value = null;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('requiresPasswordChange');
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
    requiresPasswordChange,
    isLoading,
    isRefreshing,
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
    setPassword,
    initializeAuth,
    refreshUserRoles,
    hasRole,
    hasPermission,
    clearError,
  };
});
