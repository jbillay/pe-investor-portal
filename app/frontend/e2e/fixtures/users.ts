/**
 * Test user fixtures for e2e tests
 * These should match the users seeded in the backend test database
 */

export interface TestUser {
  email: string
  password: string
  firstName: string
  lastName: string
  roles: string[]
}

/**
 * Super Admin user for testing admin features
 */
export const SUPER_ADMIN_USER: TestUser = {
  email: 'admin@pe-portal.com',
  password: 'Admin@PE2025$',
  firstName: 'Admin',
  lastName: 'PE',
  roles: ['SUPER_ADMIN']
}

/**
 * Invalid credentials for testing login failures
 */
export const INVALID_CREDENTIALS = {
  email: 'invalid@test.com',
  password: 'WrongPassword123!'
}
