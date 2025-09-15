export interface JwtPayload {
  sub: string; // User ID
  email: string;
  roles?: string[]; // User roles
  permissions?: string[]; // User permissions
  iat?: number;
  exp?: number;
}

export interface JwtTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isActive: boolean;
  isVerified: boolean;
  roles?: string[];
  permissions?: string[];
}

export interface SessionData {
  userId: string;
  refreshToken: string;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
}

// Role-related interfaces
export interface Role {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  name: string;
  description: string | null;
  resource: string | null;
  action: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  role: Role;
  permission: Permission;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoleAssignment {
  id: string;
  userId: string;
  roleId: string;
  role: Role;
  assignedBy: string | null;
  reason: string | null;
  expiresAt: Date | null;
  revokedAt: Date | null;
  revokedBy: string | null;
  revokeReason: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Permission check context
export interface PermissionContext {
  userId: string;
  resource?: string;
  resourceId?: string;
  action?: string;
}

// Role assignment context
export interface RoleAssignmentContext {
  assignedBy: string;
  reason?: string;
  expiresAt?: Date;
  userAgent?: string;
  ipAddress?: string;
}
