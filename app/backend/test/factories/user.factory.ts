/**
 * User Test Data Factory
 * Creates consistent test data for users
 */

export const createMockUser = (overrides: Partial<any> = {}) => ({
  id: 'user-1',
  email: 'test@example.com',
  password: '$2b$04$hashedpassword', // Mock bcrypt hash
  firstName: 'John',
  lastName: 'Doe',
  isActive: true,
  isVerified: false,
  isTempPassword: false,
  lastLogin: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const createMockUserList = (count: number) => {
  return Array.from({ length: count }, (_, i) =>
    createMockUser({
      id: `user-${i + 1}`,
      email: `user${i + 1}@example.com`,
      firstName: `User${i + 1}`,
    })
  );
};

export const createMockAuthenticatedUser = (overrides: Partial<any> = {}) => ({
  id: 'user-1',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  isActive: true,
  isVerified: false,
  ...overrides,
});

export const createMockUserProfile = (overrides: Partial<any> = {}) => ({
  id: 'profile-1',
  userId: 'user-1',
  bio: null,
  phone: null,
  address: null,
  avatar: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});
