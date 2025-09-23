export interface UserResponseDto {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  isActive: boolean;
  isVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  phone?: string;
  avatar?: string;
  timezone: string;
  language: string;
  preferences?: Record<string, any>;
}

export interface UserRole {
  id: string;
  name: string;
  description?: string;
}

export interface UserStats {
  loginCount: number;
  lastActivityAt?: string;
  accountAge: number;
  investmentCount?: number;
  totalInvestmentValue?: number;
}

export interface DetailedUserResponseDto extends UserResponseDto {
  profile?: UserProfile;
  userRoles?: Array<{
    id: string;
    userId: string;
    roleId: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    role: UserRole;
  }>;
  stats?: UserStats;
}

export interface PaginatedUsersResponseDto {
  data: UserResponseDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    search?: string;
    status?: string;
    roles?: string[];
    isVerified?: boolean;
    createdAfter?: string;
    createdBefore?: string;
  };
  sorting: {
    sortBy: string;
    sortOrder: string;
  };
}

export interface QueryUsersDto {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive' | 'pending';
  roles?: string[];
  isVerified?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  createdAfter?: string;
  createdBefore?: string;
}