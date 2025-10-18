export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  tenantId: string
  isActive: boolean
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
  avatar?: string
  roles?: string[]
  permissions?: string[]
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  user: User
  accessToken: string
  refreshToken: string
  requiresPasswordChange?: boolean
  expiresIn?: number
}

export interface RefreshTokenResponse {
  accessToken: string
  refreshToken: string
}

export interface SetPasswordRequest {
  tempPassword: string
  newPassword: string
  confirmPassword: string
}

export interface SetPasswordResponse {
  message: string
  accessToken: string
  refreshToken: string
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    roles: string[]
  }
}

export interface CreateUserAdminRequest {
  email: string
  firstName: string
  lastName: string
  timezone?: string
}

export interface CreateUserResponse {
  id: string
  email: string
  firstName: string
  lastName: string
  tempPassword: string
  tempPasswordExpiresAt: string
  roles: string[]
  timezone: string
  emailSent: boolean
  emailError?: string
  createdAt: string
}

export interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export interface ApiError {
  message: string
  statusCode: number
  error?: string
}