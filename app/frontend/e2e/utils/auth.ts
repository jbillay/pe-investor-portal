import { Page } from '@playwright/test'

/**
 * Authentication helper utilities for e2e tests
 */

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    roles: string[]
    permissions: string[]
  }
}

/**
 * Login helper that fills the login form and submits
 */
export async function login(page: Page, credentials: LoginCredentials) {
  await page.goto('/login')

  // Wait for the login form to be visible
  await page.waitForSelector('input#email')

  // Fill in the login form
  await page.fill('input#email', credentials.email)
  await page.fill('input#password', credentials.password)

  // Submit the form
  await page.click('button[type="submit"]')

  // Wait for navigation to complete (should redirect to dashboard)
  await page.waitForURL(/.*\/(dashboard)?$/, { timeout: 10000 })
}

/**
 * Login by setting auth tokens directly in localStorage
 * This is faster than using the UI and useful for tests that focus on other features
 */
export async function loginWithTokens(page: Page, authData: AuthTokens) {
  // Set tokens in localStorage before navigating
  await page.addInitScript((data) => {
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    localStorage.setItem('user', JSON.stringify(data.user))
  }, authData)

  // Navigate to the app
  await page.goto('/')

  // Wait for the page to load
  await page.waitForLoadState('networkidle')
}

/**
 * Logout helper
 */
export async function logout(page: Page) {
  // Click on user menu (typically in the header)
  await page.click('[data-testid="user-menu-trigger"]')

  // Click logout button
  await page.click('[data-testid="logout-button"]')

  // Wait for redirect to login page
  await page.waitForURL('**/login')
}

/**
 * Check if user is authenticated by checking for presence of auth tokens
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    const accessToken = await page.evaluate(() => localStorage.getItem('accessToken'))
    return !!accessToken
  } catch (error) {
    // If localStorage is not accessible, user is not authenticated
    return false
  }
}

/**
 * Get stored user data from localStorage
 */
export async function getStoredUser(page: Page): Promise<any> {
  try {
    return await page.evaluate(() => {
      const userStr = localStorage.getItem('user')
      return userStr ? JSON.parse(userStr) : null
    })
  } catch (error) {
    // If localStorage is not accessible, return null
    return null
  }
}

/**
 * Clear all auth data from localStorage
 * Navigates to the login page first to ensure localStorage is accessible
 */
export async function clearAuthData(page: Page) {
  try {
    // Try to clear without navigation first (if page is already loaded)
    await page.evaluate(() => {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
    })
  } catch (error) {
    // If localStorage is not accessible (no page loaded), navigate first
    await page.goto('/login')
    await page.evaluate(() => {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
    })
  }
}

/**
 * Wait for an API call to complete
 */
export async function waitForApiResponse(page: Page, urlPattern: string | RegExp) {
  return await page.waitForResponse(urlPattern)
}
