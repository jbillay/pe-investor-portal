import { faker } from '@faker-js/faker';
import { UserLanguage } from '../../dto';

/**
 * Test Data Factory for User Management
 *
 * Provides factory functions to create consistent test data for users, roles,
 * permissions, and related entities. Used for unit tests, integration tests,
 * and seeding test databases.
 *
 * @author Backend Team
 * @version 1.0.0
 */

// User Factory Types
export interface TestUserData {
  id?: string;
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  isVerified?: boolean;
  lastLogin?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface TestUserProfileData {
  id?: string;
  userId?: string;
  phone?: string;
  avatar?: string;
  timezone?: string;
  language?: UserLanguage;
  preferences?: Record<string, any>;
}

export interface TestRoleData {
  id?: string;
  name?: string;
  description?: string;
  isActive?: boolean;
  isDefault?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TestPermissionData {
  id?: string;
  name?: string;
  description?: string;
  resource?: string;
  action?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TestUserRoleData {
  id?: string;
  userId?: string;
  roleId?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TestRoleAssignmentData {
  id?: string;
  userId?: string;
  roleId?: string;
  assignedBy?: string;
  reason?: string;
  expiresAt?: Date | null;
  revokedAt?: Date | null;
  revokedBy?: string | null;
  revokeReason?: string | null;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Create a test user with realistic data
 */
export function createTestUser(overrides: Partial<TestUserData> = {}): TestUserData {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const email = faker.internet.email({ firstName, lastName }).toLowerCase();

  return {
    id: faker.string.uuid(),
    email,
    password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6OIAWQ.N.2', // hashed "password123"
    firstName,
    lastName,
    isActive: true,
    isVerified: true,
    lastLogin: faker.date.recent({ days: 30 }),
    createdAt: faker.date.past({ years: 2 }),
    updatedAt: faker.date.recent({ days: 30 }),
    deletedAt: null,
    ...overrides
  };
}

/**
 * Create a test user profile with realistic data
 */
export function createTestUserProfile(overrides: Partial<TestUserProfileData> = {}): TestUserProfileData {
  return {
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    phone: faker.phone.number(),
    avatar: faker.image.avatar(),
    timezone: faker.location.timeZone(),
    language: faker.helpers.arrayElement(Object.values(UserLanguage)),
    preferences: {
      notifications: {
        email: faker.datatype.boolean(),
        sms: faker.datatype.boolean(),
        push: faker.datatype.boolean()
      },
      theme: faker.helpers.arrayElement(['light', 'dark', 'auto']),
      language: faker.helpers.arrayElement(Object.values(UserLanguage)),
      dateFormat: faker.helpers.arrayElement(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']),
      timeFormat: faker.helpers.arrayElement(['12h', '24h']),
      currency: faker.finance.currencyCode()
    },
    ...overrides
  };
}

/**
 * Create a test role with realistic data
 */
export function createTestRole(overrides: Partial<TestRoleData> = {}): TestRoleData {
  const roleNames = [
    'SUPER_ADMIN',
    'FUND_MANAGER',
    'COMPLIANCE_OFFICER',
    'ANALYST',
    'INVESTOR',
    'VIEWER',
    'AUDITOR',
    'SUPPORT'
  ];

  const roleName = faker.helpers.arrayElement(roleNames);

  return {
    id: faker.string.uuid(),
    name: roleName,
    description: `${roleName.replace('_', ' ').toLowerCase()} role with specific permissions`,
    isActive: true,
    isDefault: roleName === 'INVESTOR',
    createdAt: faker.date.past({ years: 1 }),
    updatedAt: faker.date.recent({ days: 30 }),
    ...overrides
  };
}

/**
 * Create a test permission with realistic data
 */
export function createTestPermission(overrides: Partial<TestPermissionData> = {}): TestPermissionData {
  const resources = ['USER', 'FUND', 'INVESTMENT', 'DOCUMENT', 'ROLE', 'PERMISSION', 'AUDIT'];
  const actions = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'MANAGE', 'APPROVE', 'EXPORT'];

  const resource = faker.helpers.arrayElement(resources);
  const action = faker.helpers.arrayElement(actions);
  const permissionName = `${resource}_${action}`;

  return {
    id: faker.string.uuid(),
    name: permissionName,
    description: `Permission to ${action.toLowerCase()} ${resource.toLowerCase()} resources`,
    resource,
    action,
    isActive: true,
    createdAt: faker.date.past({ years: 1 }),
    updatedAt: faker.date.recent({ days: 30 }),
    ...overrides
  };
}

/**
 * Create a test user role assignment
 */
export function createTestUserRole(overrides: Partial<TestUserRoleData> = {}): TestUserRoleData {
  return {
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    roleId: faker.string.uuid(),
    isActive: true,
    createdAt: faker.date.past({ years: 1 }),
    updatedAt: faker.date.recent({ days: 30 }),
    ...overrides
  };
}

/**
 * Create a test role assignment with history
 */
export function createTestRoleAssignment(overrides: Partial<TestRoleAssignmentData> = {}): TestRoleAssignmentData {
  const reasons = [
    'Initial role assignment',
    'Promotion to new position',
    'Department transfer',
    'Compliance requirement',
    'System migration',
    'Role review update'
  ];

  return {
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    roleId: faker.string.uuid(),
    assignedBy: faker.string.uuid(),
    reason: faker.helpers.arrayElement(reasons),
    expiresAt: faker.datatype.boolean({ probability: 0.3 }) ? faker.date.future({ years: 1 }) : null,
    revokedAt: null,
    revokedBy: null,
    revokeReason: null,
    isActive: true,
    createdAt: faker.date.past({ years: 1 }),
    updatedAt: faker.date.recent({ days: 30 }),
    ...overrides
  };
}

/**
 * Create a test user with complete profile and roles
 */
export function createTestUserWithProfile(
  userOverrides: Partial<TestUserData> = {},
  profileOverrides: Partial<TestUserProfileData> = {},
  roles: TestRoleData[] = []
): {
  user: TestUserData;
  profile: TestUserProfileData;
  roles: TestRoleData[];
  userRoles: TestUserRoleData[];
} {
  const user = createTestUser(userOverrides);
  const profile = createTestUserProfile({ userId: user.id, ...profileOverrides });

  const defaultRoles = roles.length > 0 ? roles : [createTestRole({ name: 'INVESTOR' })];
  const userRoles = defaultRoles.map(role =>
    createTestUserRole({ userId: user.id, roleId: role.id })
  );

  return {
    user,
    profile,
    roles: defaultRoles,
    userRoles
  };
}

/**
 * Create multiple test users for bulk operations
 */
export function createTestUsers(count: number, overrides: Partial<TestUserData> = {}): TestUserData[] {
  return Array.from({ length: count }, () => createTestUser(overrides));
}

/**
 * Create test users with specific roles
 */
export function createTestUsersWithRoles(configs: Array<{
  userOverrides?: Partial<TestUserData>;
  roles: string[];
}>): Array<{
  user: TestUserData;
  roles: TestRoleData[];
  userRoles: TestUserRoleData[];
}> {
  return configs.map(config => {
    const user = createTestUser(config.userOverrides);
    const roles = config.roles.map(roleName => createTestRole({ name: roleName }));
    const userRoles = roles.map(role =>
      createTestUserRole({ userId: user.id, roleId: role.id })
    );

    return { user, roles, userRoles };
  });
}

/**
 * Create test data for pagination scenarios
 */
export function createTestPaginationData(totalUsers: number = 150): {
  users: TestUserData[];
  totalPages: number;
  pageSize: number;
} {
  const pageSize = 20;
  const users = createTestUsers(totalUsers);
  const totalPages = Math.ceil(totalUsers / pageSize);

  return { users, totalPages, pageSize };
}

/**
 * Create test data for user statistics
 */
export function createTestUserStats() {
  return {
    totalUsers: faker.number.int({ min: 100, max: 10000 }),
    activeUsers: faker.number.int({ min: 80, max: 8000 }),
    verifiedUsers: faker.number.int({ min: 70, max: 7000 }),
    newUsersLast30Days: faker.number.int({ min: 5, max: 100 }),
    activeUsersLast30Days: faker.number.int({ min: 50, max: 500 }),
    usersByRole: [
      { roleName: 'INVESTOR', count: 800, percentage: 80 },
      { roleName: 'FUND_MANAGER', count: 50, percentage: 5 },
      { roleName: 'COMPLIANCE_OFFICER', count: 30, percentage: 3 },
      { roleName: 'ANALYST', count: 70, percentage: 7 },
      { roleName: 'SUPER_ADMIN', count: 5, percentage: 0.5 },
      { roleName: 'VIEWER', count: 45, percentage: 4.5 }
    ],
    geographicDistribution: [
      { timezone: 'America/New_York', count: 400, percentage: 40 },
      { timezone: 'Europe/London', count: 300, percentage: 30 },
      { timezone: 'Asia/Tokyo', count: 150, percentage: 15 },
      { timezone: 'America/Los_Angeles', count: 100, percentage: 10 },
      { timezone: 'Australia/Sydney', count: 50, percentage: 5 }
    ],
    growthStats: Array.from({ length: 12 }, (_, i) => ({
      period: `2024-${String(i + 1).padStart(2, '0')}`,
      newUsers: faker.number.int({ min: 10, max: 100 }),
      totalUsers: faker.number.int({ min: 500, max: 1000 }),
      activeUsers: faker.number.int({ min: 400, max: 800 })
    })),
    generatedAt: new Date().toISOString()
  };
}

/**
 * Create mock PrismaService for testing
 */
export function createMockPrismaService() {
  return {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn()
    },
    userProfile: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      groupBy: jest.fn()
    },
    role: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    },
    permission: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    },
    userRole: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn()
    },
    roleAssignment: {
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn()
    },
    rolePermission: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    },
    session: {
      updateMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    },
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn()
    },
    investment: {
      aggregate: jest.fn(),
      count: jest.fn()
    },
    $transaction: jest.fn(),
    $connect: jest.fn(),
    $disconnect: jest.fn()
  };
}

/**
 * Create mock API responses for testing
 */
export function createMockApiResponse<T>(data: T, status: number = 200) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Headers()
  };
}

/**
 * Create test JWT tokens
 */
export function createTestJwtToken(payload: Record<string, any> = {}) {
  const defaultPayload = {
    sub: faker.string.uuid(),
    email: faker.internet.email(),
    roles: ['INVESTOR'],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour
  };

  // In real implementation, you would use jsonwebtoken to create actual tokens
  // For testing, we'll just return a mock token structure
  return {
    token: 'mock.jwt.token',
    payload: { ...defaultPayload, ...payload }
  };
}

/**
 * Create test audit log entries
 */
export function createTestAuditLog(overrides: Partial<{
  id: string;
  userId: string;
  action: string;
  resource: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}> = {}) {
  const actions = [
    'USER_CREATED', 'USER_UPDATED', 'USER_DELETED',
    'USER_LOGIN', 'USER_LOGOUT', 'PASSWORD_RESET',
    'ROLE_ASSIGNED', 'ROLE_REVOKED', 'PERMISSION_GRANTED'
  ];

  return {
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    action: faker.helpers.arrayElement(actions),
    resource: 'USER',
    details: {
      userAgent: faker.internet.userAgent(),
      changes: { firstName: 'Updated Name' }
    },
    ipAddress: faker.internet.ip(),
    userAgent: faker.internet.userAgent(),
    createdAt: faker.date.recent({ days: 7 }),
    ...overrides
  };
}

/**
 * Create test error responses
 */
export function createTestErrorResponse(
  code: string,
  message: string,
  statusCode: number = 400,
  details?: Record<string, any>
) {
  return {
    error: {
      code,
      message,
      details: details || {}
    },
    statusCode,
    timestamp: new Date().toISOString()
  };
}

/**
 * Create test session data
 */
export function createTestSession(overrides: Partial<{
  id: string;
  userId: string;
  refreshToken: string;
  isRevoked: boolean;
  expiresAt: Date;
  userAgent: string;
  ipAddress: string;
  createdAt: Date;
}> = {}) {
  return {
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    refreshToken: faker.string.alphanumeric(64),
    isRevoked: false,
    expiresAt: faker.date.future({ years: 1 }),
    userAgent: faker.internet.userAgent(),
    ipAddress: faker.internet.ip(),
    createdAt: faker.date.recent({ days: 30 }),
    ...overrides
  };
}

// Export all factory functions for easy importing
export const UserTestFactory = {
  createTestUser,
  createTestUserProfile,
  createTestRole,
  createTestPermission,
  createTestUserRole,
  createTestRoleAssignment,
  createTestUserWithProfile,
  createTestUsers,
  createTestUsersWithRoles,
  createTestPaginationData,
  createTestUserStats,
  createMockPrismaService,
  createMockApiResponse,
  createTestJwtToken,
  createTestAuditLog,
  createTestErrorResponse,
  createTestSession
};