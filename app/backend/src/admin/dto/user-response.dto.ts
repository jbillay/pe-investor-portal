import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform } from 'class-transformer';
import { UserLanguage } from './create-user.dto';

/**
 * Basic user information response DTO
 * Excludes sensitive information like password
 */
export class UserResponseDto {
  @ApiProperty({
    description: 'User unique identifier',
    example: 'user-uuid-here'
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com'
  })
  @Expose()
  email: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John'
  })
  @Expose()
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe'
  })
  @Expose()
  lastName: string;

  @ApiProperty({
    description: 'User full name (computed)',
    example: 'John Doe'
  })
  @Expose()
  @Transform(({ obj }) => `${obj.firstName || ''} ${obj.lastName || ''}`.trim())
  fullName: string;

  @ApiProperty({
    description: 'Whether the user is active',
    example: true
  })
  @Expose()
  isActive: boolean;

  @ApiProperty({
    description: 'Whether the user email is verified',
    example: true
  })
  @Expose()
  isVerified: boolean;

  @ApiProperty({
    description: 'User last login timestamp',
    example: '2024-01-15T10:30:00Z',
    nullable: true
  })
  @Expose()
  lastLogin?: string;

  @ApiProperty({
    description: 'User creation timestamp',
    example: '2024-01-10T08:00:00Z'
  })
  @Expose()
  createdAt: string;

  @ApiProperty({
    description: 'User last update timestamp',
    example: '2024-01-15T10:30:00Z'
  })
  @Expose()
  updatedAt: string;

  // Exclude sensitive fields
  @Exclude()
  password: string;
}

/**
 * Detailed user response with profile information
 */
export class DetailedUserResponseDto extends UserResponseDto {
  @ApiProperty({
    description: 'User profile information',
    type: 'object',
    nullable: true
  })
  @Expose()
  profile?: {
    phone?: string;
    avatar?: string;
    timezone: string;
    language: UserLanguage;
    preferences?: Record<string, any>;
  };

  @ApiProperty({
    description: 'User roles',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' }
      }
    }
  })
  @Expose()
  roles?: Array<{
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
    assignedAt: string;
    expiresAt?: string;
  }>;

  @ApiProperty({
    description: 'User statistics',
    type: 'object',
    nullable: true
  })
  @Expose()
  stats?: {
    loginCount: number;
    lastActivityAt?: string;
    accountAge: number; // days since creation
    investmentCount?: number;
    totalInvestmentValue?: number;
  };
}

/**
 * Paginated users response
 */
export class PaginatedUsersResponseDto {
  @ApiProperty({
    description: 'Array of users',
    type: [UserResponseDto]
  })
  data: UserResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: 'object'
  })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };

  @ApiProperty({
    description: 'Applied filters',
    type: 'object'
  })
  filters: {
    search?: string;
    status?: string;
    roles?: string[];
    isVerified?: boolean;
    createdAfter?: string;
    createdBefore?: string;
  };

  @ApiProperty({
    description: 'Applied sorting',
    type: 'object'
  })
  sorting: {
    sortBy: string;
    sortOrder: string;
  };
}

/**
 * User creation response
 */
export class UserCreatedResponseDto extends UserResponseDto {
  @ApiProperty({
    description: 'Temporary password (only shown once)',
    example: 'TempPass123!',
    nullable: true
  })
  temporaryPassword?: string;

  @ApiProperty({
    description: 'Whether password change is required on first login',
    example: true
  })
  requiresPasswordChange: boolean;

  @ApiProperty({
    description: 'Email verification token (only shown once)',
    example: 'verification-token-here',
    nullable: true
  })
  emailVerificationToken?: string;
}

/**
 * Bulk operation response
 */
export class BulkOperationResponseDto {
  @ApiProperty({
    description: 'Number of successful operations',
    example: 8
  })
  successCount: number;

  @ApiProperty({
    description: 'Number of failed operations',
    example: 2
  })
  failureCount: number;

  @ApiProperty({
    description: 'Total number of operations attempted',
    example: 10
  })
  totalCount: number;

  @ApiProperty({
    description: 'Array of successful operations with details',
    type: 'array'
  })
  successes: Array<{
    userId: string;
    userEmail: string;
    operation: string;
    details?: any;
  }>;

  @ApiProperty({
    description: 'Array of failed operations with error details',
    type: 'array'
  })
  failures: Array<{
    userId: string;
    userEmail?: string;
    operation: string;
    error: string;
    details?: any;
  }>;

  @ApiProperty({
    description: 'Overall operation status',
    example: 'partial_success',
    enum: ['success', 'failure', 'partial_success']
  })
  status: 'success' | 'failure' | 'partial_success';

  @ApiProperty({
    description: 'Operation timestamp',
    example: '2024-01-15T10:30:00Z'
  })
  timestamp: string;
}

/**
 * User statistics response
 */
export class UserStatsResponseDto {
  @ApiProperty({
    description: 'Total number of users',
    example: 1250
  })
  totalUsers: number;

  @ApiProperty({
    description: 'Number of active users',
    example: 1100
  })
  activeUsers: number;

  @ApiProperty({
    description: 'Number of verified users',
    example: 950
  })
  verifiedUsers: number;

  @ApiProperty({
    description: 'Number of users created in the last 30 days',
    example: 45
  })
  newUsersLast30Days: number;

  @ApiProperty({
    description: 'Number of users who logged in in the last 30 days',
    example: 800
  })
  activeUsersLast30Days: number;

  @ApiProperty({
    description: 'User statistics by role',
    type: 'array'
  })
  usersByRole: Array<{
    roleName: string;
    count: number;
    percentage: number;
  }>;

  @ApiProperty({
    description: 'User growth statistics over time',
    type: 'array'
  })
  growthStats: Array<{
    period: string;
    newUsers: number;
    totalUsers: number;
    activeUsers: number;
  }>;

  @ApiProperty({
    description: 'Geographic distribution of users',
    type: 'array'
  })
  geographicDistribution: Array<{
    timezone: string;
    count: number;
    percentage: number;
  }>;

  @ApiProperty({
    description: 'Statistics generation timestamp',
    example: '2024-01-15T10:30:00Z'
  })
  generatedAt: string;
}