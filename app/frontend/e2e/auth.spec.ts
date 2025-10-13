import { test, expect } from '@playwright/test'
import { login, clearAuthData, isAuthenticated, getStoredUser } from './utils/auth'
import { SUPER_ADMIN_USER, INVALID_CREDENTIALS } from './fixtures/users'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth data before each test
    await clearAuthData(page)
  })

  test.describe('Login Page', () => {
    test('should display login form with all required elements', async ({ page }) => {
      await page.goto('/login')

      // Check page title
      await expect(page).toHaveTitle(/Sign In/)

      // Check for branding
      await expect(page.locator('text=Sign in to your account')).toBeVisible()
      await expect(page.locator('text=Welcome back to PE Investor Portal')).toBeVisible()

      // Check form elements
      await expect(page.locator('input#email')).toBeVisible()
      await expect(page.locator('input#password')).toBeVisible()
      await expect(page.locator('input#remember-me')).toBeVisible()
      await expect(page.locator('button[type="submit"]')).toBeVisible()

      // Check links
      await expect(page.locator('text=Forgot your password?')).toBeVisible()
      await expect(page.locator('text=Contact your administrator')).toBeVisible()
    })

    test('should disable submit button when form is empty', async ({ page }) => {
      await page.goto('/login')

      // Submit button should be disabled when form is empty
      const submitButton = page.locator('button[type="submit"]')
      await expect(submitButton).toBeDisabled()

      // Fill only email - button should still be disabled
      await page.fill('input#email', 'test@example.com')
      await expect(submitButton).toBeDisabled()

      // Fill password too - button should now be enabled
      await page.fill('input#password', 'password123')
      await expect(submitButton).toBeEnabled()

      // Clear email - button should be disabled again
      await page.fill('input#email', '')
      await expect(submitButton).toBeDisabled()
    })

    test('should show validation error for invalid email format', async ({ page }) => {
      await page.goto('/login')

      // Enter invalid email
      await page.fill('input#email', 'invalid-email')
      await page.fill('input#password', 'somepassword')

      // Blur email field to trigger validation
      await page.locator('input#email').blur()

      // Check for validation error
      await expect(page.locator('text=Please enter a valid email address')).toBeVisible()
    })

    test('should show validation error for short password', async ({ page }) => {
      await page.goto('/login')

      // Enter short password
      await page.fill('input#email', 'test@example.com')
      await page.fill('input#password', '123')

      // Blur password field to trigger validation
      await page.locator('input#password').blur()

      // Check for validation error
      await expect(page.locator('text=Password must be at least 6 characters')).toBeVisible()
    })

    test('should toggle password visibility', async ({ page }) => {
      await page.goto('/login')

      const passwordInput = page.locator('input#password')

      // Password should be hidden by default
      await expect(passwordInput).toHaveAttribute('type', 'password')

      // Click the toggle button
      await page.click('button:has(i.pi-eye)')

      // Password should now be visible
      await expect(passwordInput).toHaveAttribute('type', 'text')

      // Click again to hide
      await page.click('button:has(i.pi-eye-slash)')

      // Password should be hidden again
      await expect(passwordInput).toHaveAttribute('type', 'password')
    })
  })

  test.describe('Login Flow', () => {
    test('should successfully login with valid admin credentials', async ({ page }) => {
      await login(page, {
        email: SUPER_ADMIN_USER.email,
        password: SUPER_ADMIN_USER.password
      })

      // Should redirect to dashboard
      await expect(page).toHaveURL(/.*\/(dashboard)?$/)

      // Check that auth data is stored
      expect(await isAuthenticated(page)).toBe(true)

      // Verify user data
      const user = await getStoredUser(page)
      expect(user).toBeTruthy()
      expect(user.email).toBe(SUPER_ADMIN_USER.email)
      expect(user.roles).toContain('SUPER_ADMIN')
    })

    test('should show error message for invalid credentials', async ({ page }) => {
      await page.goto('/login')

      // Fill form with invalid credentials
      await page.fill('input#email', INVALID_CREDENTIALS.email)
      await page.fill('input#password', INVALID_CREDENTIALS.password)

      // Submit form
      await page.click('button[type="submit"]')

      // Should stay on login page
      await expect(page).toHaveURL(/.*\/login/)

      // Check for error message
      await expect(page.locator('text=Sign in failed')).toBeVisible()

      // Should not be authenticated
      expect(await isAuthenticated(page)).toBe(false)
    })

    test('should disable submit button while loading', async ({ page }) => {
      await page.goto('/login')

      // Fill form
      await page.fill('input#email', SUPER_ADMIN_USER.email)
      await page.fill('input#password', SUPER_ADMIN_USER.password)

      // Start submission
      const submitButton = page.locator('button[type="submit"]')
      await submitButton.click()

      // Button should show loading state
      await expect(submitButton).toBeDisabled()
      await expect(page.locator('text=Signing in...')).toBeVisible()
    })

    test('should redirect to intended page after login', async ({ page }) => {
      // Try to access protected page
      await page.goto('/profile')

      // Should redirect to login with redirect query
      await expect(page).toHaveURL(/.*\/login\?redirect=/)

      // Login
      await page.fill('input#email', SUPER_ADMIN_USER.email)
      await page.fill('input#password', SUPER_ADMIN_USER.password)
      await page.click('button[type="submit"]')

      // Should redirect to originally requested page
      await expect(page).toHaveURL(/.*\/profile/)
    })

    test('should redirect to dashboard if already authenticated', async ({ page }) => {
      // Login first
      await login(page, {
        email: SUPER_ADMIN_USER.email,
        password: SUPER_ADMIN_USER.password
      })

      // Try to access login page again
      await page.goto('/login')

      // Should redirect to dashboard
      await expect(page).toHaveURL(/.*\/(dashboard)?$/)
    })
  })

  test.describe('Session Management', () => {
    test('should persist session after page reload', async ({ page }) => {
      // Login
      await login(page, {
        email: SUPER_ADMIN_USER.email,
        password: SUPER_ADMIN_USER.password
      })

      // Reload page
      await page.reload()

      // Should still be authenticated
      expect(await isAuthenticated(page)).toBe(true)

      // Should still be on dashboard (or similar authenticated page)
      await expect(page).toHaveURL(/.*\/(dashboard)?$/)
    })

    test('should clear session after logout', async ({ page }) => {
      // Login
      await login(page, {
        email: SUPER_ADMIN_USER.email,
        password: SUPER_ADMIN_USER.password
      })

      // Wait for the page to fully load
      await page.waitForLoadState('networkidle')

      // Logout by clearing auth data (simulating logout)
      await clearAuthData(page)

      // Navigate to a protected page
      await page.goto('/dashboard')

      // Should redirect to login
      await expect(page).toHaveURL(/.*\/login/)

      // Should not be authenticated
      expect(await isAuthenticated(page)).toBe(false)
    })
  })

  test.describe('Remember Me', () => {
    test('should show remember me checkbox', async ({ page }) => {
      await page.goto('/login')

      const rememberCheckbox = page.locator('input#remember-me')
      await expect(rememberCheckbox).toBeVisible()

      // Should be unchecked by default
      await expect(rememberCheckbox).not.toBeChecked()
    })

    test('should allow checking remember me option', async ({ page }) => {
      await page.goto('/login')

      const rememberCheckbox = page.locator('input#remember-me')

      // Check the box
      await rememberCheckbox.check()
      await expect(rememberCheckbox).toBeChecked()

      // Uncheck
      await rememberCheckbox.uncheck()
      await expect(rememberCheckbox).not.toBeChecked()
    })
  })
})
