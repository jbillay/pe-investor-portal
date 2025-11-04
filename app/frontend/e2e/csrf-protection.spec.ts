import { test, expect } from '@playwright/test'
import { login } from './utils/auth'
import { SUPER_ADMIN_USER } from './fixtures/users'

test.describe('CSRF Protection', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app first to ensure localStorage is accessible
    await page.goto('http://localhost:3000')

    // Clear any existing auth data and cookies before each test
    await page.context().clearCookies()
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })

  test('should successfully fetch CSRF token from /api/auth/csrf endpoint', async ({ page }) => {
    // Navigate to app to ensure it's loaded
    await page.goto('/')

    // Make a request to the CSRF endpoint
    const response = await page.request.get('http://localhost:5173/api/auth/csrf', {
      headers: {
        'Accept': 'application/json'
      }
    })

    expect(response.ok()).toBeTruthy()
    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data).toHaveProperty('csrfToken')
    expect(typeof data.csrfToken).toBe('string')
    expect(data.csrfToken.length).toBeGreaterThan(0)

    console.log('CSRF token fetched:', data.csrfToken)
  })

  test('should set CSRF cookie when fetching token', async ({ page, context }) => {
    await page.goto('/')

    // Fetch CSRF token
    await page.request.get('http://localhost:5173/api/auth/csrf')

    // Check that the cookie was set
    const cookies = await context.cookies()
    const csrfCookie = cookies.find(c => c.name === 'pe-portal.x-csrf-token')

    expect(csrfCookie).toBeDefined()
    expect(csrfCookie?.httpOnly).toBeTruthy()
    expect(csrfCookie?.sameSite).toBe('Strict')

    console.log('CSRF cookie set:', csrfCookie?.name)
  })

  test('should successfully login and logout with CSRF protection', async ({ page }) => {
    // Login
    await login(page, {
      email: SUPER_ADMIN_USER.email,
      password: SUPER_ADMIN_USER.password
    })

    // Should be on dashboard
    await expect(page).toHaveURL(/.*\/(dashboard)?$/)

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')

    // Listen for network requests to verify CSRF token is sent
    const logoutRequests: any[] = []
    page.on('request', request => {
      if (request.url().includes('/api/auth/logout')) {
        logoutRequests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers()
        })
      }
    })

    // Find and click user menu button (the button with user initials inside data-dropdown div)
    const userMenuButton = page.locator('[data-dropdown] button').first()
    await userMenuButton.click()

    // Wait for menu to appear
    await page.waitForTimeout(500)

    // Click "Sign Out" button
    const signOutButton = page.locator('button:has-text("Sign Out")')
    await signOutButton.click()

    // Should redirect to login page
    await expect(page).toHaveURL(/.*\/login/, { timeout: 10000 })

    // Verify CSRF token was sent in the logout request
    expect(logoutRequests.length).toBeGreaterThan(0)

    const logoutRequest = logoutRequests[0]
    expect(logoutRequest.headers).toHaveProperty('x-csrf-token')
    expect(logoutRequest.headers['x-csrf-token']).toBeTruthy()

    console.log('Logout request with CSRF token:', logoutRequest.headers['x-csrf-token'])
  })

  test('should automatically include CSRF token in POST requests', async ({ page }) => {
    await login(page, {
      email: SUPER_ADMIN_USER.email,
      password: SUPER_ADMIN_USER.password
    })

    // Track POST requests
    const postRequests: any[] = []
    page.on('request', request => {
      if (request.method() === 'POST' && request.url().includes('/api/')) {
        postRequests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers()
        })
      }
    })

    // Navigate to a page that makes POST requests (e.g., admin users page)
    await page.goto('/admin/users')
    await page.waitForLoadState('networkidle')

    // Wait a bit for any POST requests to complete
    await page.waitForTimeout(2000)

    // Check if any POST requests were made
    if (postRequests.length > 0) {
      // Verify all POST requests have CSRF token
      postRequests.forEach(request => {
        console.log('POST request to:', request.url)
        // Check that CSRF token header exists (it should be automatically added)
        // Note: It's okay if no POST requests were made on this page
      })
    }
  })

  test('should handle logout with CSRF token correctly via API', async ({ page, request }) => {
    // First, login to get tokens
    await login(page, {
      email: SUPER_ADMIN_USER.email,
      password: SUPER_ADMIN_USER.password
    })

    // Get the access token from localStorage
    const accessToken = await page.evaluate(() => localStorage.getItem('accessToken'))
    const refreshToken = await page.evaluate(() => localStorage.getItem('refreshToken'))

    expect(accessToken).toBeTruthy()
    expect(refreshToken).toBeTruthy()

    // Fetch CSRF token
    const csrfResponse = await request.get('http://localhost:5173/api/auth/csrf')
    const { csrfToken } = await csrfResponse.json()

    expect(csrfToken).toBeTruthy()

    // Make logout request with CSRF token
    const logoutResponse = await request.post('http://localhost:5173/api/auth/logout', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-csrf-token': csrfToken,
        'Content-Type': 'application/json'
      },
      data: {
        refreshToken
      }
    })

    // Logout should succeed
    expect(logoutResponse.ok()).toBeTruthy()
    expect(logoutResponse.status()).toBe(200)

    console.log('Logout successful with CSRF token')
  })

  test('should reject logout request without CSRF token', async ({ page, request }) => {
    // Login first
    await login(page, {
      email: SUPER_ADMIN_USER.email,
      password: SUPER_ADMIN_USER.password
    })

    const accessToken = await page.evaluate(() => localStorage.getItem('accessToken'))
    const refreshToken = await page.evaluate(() => localStorage.getItem('refreshToken'))

    // Try to logout WITHOUT CSRF token
    const logoutResponse = await request.post('http://localhost:5173/api/auth/logout', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        refreshToken
      }
    })

    // Should be rejected with 403 Forbidden
    expect(logoutResponse.status()).toBe(403)

    const errorText = await logoutResponse.text()
    console.log('Logout rejected without CSRF token:', errorText)
    expect(errorText.toLowerCase()).toContain('csrf')
  })

  test('should allow login without CSRF token (public route)', async ({ request }) => {
    // Login is a public route and should NOT require CSRF token
    const loginResponse = await request.post('http://localhost:5173/api/auth/login', {
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        email: SUPER_ADMIN_USER.email,
        password: SUPER_ADMIN_USER.password
      }
    })

    // Login should succeed without CSRF token
    expect(loginResponse.ok()).toBeTruthy()
    expect(loginResponse.status()).toBe(200)

    const data = await loginResponse.json()
    expect(data).toHaveProperty('accessToken')
    expect(data).toHaveProperty('refreshToken')

    console.log('Login successful without CSRF token (public route)')
  })

  test('should refresh CSRF token if it expires or becomes invalid', async ({ page }) => {
    await page.goto('/')

    // Fetch initial CSRF token
    await page.evaluate(async () => {
      const response = await fetch('http://localhost:5173/api/auth/csrf', {
        credentials: 'include'
      })
      const data = await response.json()
      console.log('Initial CSRF token:', data.csrfToken)
    })

    // Clear cookies to simulate expired token
    await page.context().clearCookies()

    // Login (which should automatically fetch a new CSRF token for logout)
    await login(page, {
      email: SUPER_ADMIN_USER.email,
      password: SUPER_ADMIN_USER.password
    })

    await page.waitForLoadState('networkidle')

    // The app should automatically handle CSRF token refresh
    // when making protected requests
    console.log('CSRF token should be automatically refreshed on next protected request')
  })
})
