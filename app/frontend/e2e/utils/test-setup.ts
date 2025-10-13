import { test as base, expect } from '@playwright/test'
import { login, clearAuthData } from './auth'
import { SUPER_ADMIN_USER } from '../fixtures/users'

/**
 * Extended test fixture with authentication helpers
 */
export const test = base.extend({
  /**
   * Auto-login as super admin before each test
   */
  authenticatedPage: async ({ page }, use) => {
    await clearAuthData(page)
    await login(page, {
      email: SUPER_ADMIN_USER.email,
      password: SUPER_ADMIN_USER.password
    })
    await use(page)
  },

  /**
   * Auto-login as investor before each test
   */
  investorPage: async ({ page }, use) => {
    await clearAuthData(page)
    await login(page, {
      email: SUPER_ADMIN_USER.email,
      password: SUPER_ADMIN_USER.password
    })
    await use(page)
  },

  /**
   * Auto-login as fund manager before each test
   */
  fundManagerPage: async ({ page }, use) => {
    await clearAuthData(page)
    await login(page, {
      email: SUPER_ADMIN_USER.email,
      password: SUPER_ADMIN_USER.password
    })
    await use(page)
  }
})

export { expect }
