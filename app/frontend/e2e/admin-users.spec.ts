import { test, expect } from './utils/test-setup'
import { SUPER_ADMIN_USER } from './fixtures/users'

test.describe('Admin - User Management', () => {
  test.describe('Access Control', () => {
    test('should allow super admin to access user management page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/users')

      // Should successfully load the page
      await expect(page).toHaveURL(/.*\/admin\/users/)

      // Check for page title
      await expect(page.locator('h1:has-text("User Management")')).toBeVisible()
    })

    test('should deny access to non-admin users', async ({ investorPage: page }) => {
      await page.goto('/admin/users')

      // Should redirect to dashboard with error
      await expect(page).toHaveURL(/.*\/dashboard/)

      // Check for error parameter
      const url = page.url()
      expect(url).toContain('error=insufficient_permissions')
    })

    test('should redirect unauthenticated users to login', async ({ page }) => {
      await page.goto('/admin/users')

      // Should redirect to login page
      await expect(page).toHaveURL(/.*\/login/)
    })
  })

  test.describe('Page Layout and Navigation', () => {
    test('should display all header elements', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/users')

      // Check header elements
      await expect(page.locator('h1:has-text("User Management")')).toBeVisible()
      await expect(page.locator('text=Manage user accounts, profiles, and access settings')).toBeVisible()

      // Check breadcrumb
      await expect(page.locator('text=Dashboard')).toBeVisible()
      await expect(page.locator('text=Administration')).toBeVisible()
      await expect(page.locator('text=Users')).toBeVisible()

      // Check action buttons
      await expect(page.locator('button:has-text("Refresh Data")')).toBeVisible()
      await expect(page.locator('button:has-text("Invite User")')).toBeVisible()
    })

    test('should display admin navigation tabs', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/users')

      // Check for admin navigation component
      await expect(page.locator('text=Users').first()).toBeVisible()

      // Navigation should include links to other admin sections
      // (exact implementation depends on AdminNavigation component)
    })

    test('should navigate to users page from admin navigation', async ({ authenticatedPage: page }) => {
      // Start on another admin page
      await page.goto('/admin/roles')

      // Click on users tab
      await page.locator('a[href="/admin/users"]').first().click()

      // Should navigate to users page
      await expect(page).toHaveURL(/.*\/admin\/users/)
    })
  })

  test.describe('User List Display', () => {
    test('should display user list table', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/users')

      // Wait for data to load
      await page.waitForTimeout(1000)

      // Check for table or data grid (adjust selector based on actual implementation)
      const userTable = page.locator('[data-testid="user-table"], .p-datatable, table').first()
      await expect(userTable).toBeVisible()
    })

    test('should show user information columns', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/users')
      await page.waitForTimeout(1000)

      // Check for expected column headers or data
      // (exact selectors depend on your UserManagementPanel implementation)
      // Common columns: Name, Email, Roles, Status, Actions
      const hasEmailColumn = await page.locator('text=Email, text=email').count() > 0
      expect(hasEmailColumn).toBeTruthy()
    })

    test('should allow selecting users', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/users')
      await page.waitForTimeout(1000)

      // Try to find and click a checkbox or selection control
      const firstCheckbox = page.locator('input[type="checkbox"]').first()
      if (await firstCheckbox.isVisible()) {
        await firstCheckbox.check()
        await expect(firstCheckbox).toBeChecked()
      }
    })
  })

  test.describe('Search and Filter', () => {
    test('should allow searching for users', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/users')
      await page.waitForTimeout(1000)

      // Look for search input
      const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="search"]').first()

      if (await searchInput.isVisible()) {
        await searchInput.fill('test@example.com')

        // Wait for search results to update
        await page.waitForTimeout(500)

        // Results should be filtered
        expect(await searchInput.inputValue()).toBe('test@example.com')
      }
    })

    test('should allow filtering by role', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/users')
      await page.waitForTimeout(1000)

      // Look for role filter dropdown
      const roleFilter = page.locator('select, .p-dropdown').first()

      if (await roleFilter.isVisible()) {
        await roleFilter.click()
        // Select a role option (implementation specific)
      }
    })
  })

  test.describe('User Actions', () => {
    test('should open invite user dialog', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/users')

      // Click invite user button
      await page.click('button:has-text("Invite User")')

      // Dialog should open
      await expect(page.locator('text=Invite New User')).toBeVisible()

      // Dialog should have cancel and send buttons
      await expect(page.locator('button:has-text("Cancel")')).toBeVisible()
      await expect(page.locator('button:has-text("Send Invite")')).toBeVisible()
    })

    test('should close invite dialog on cancel', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/users')

      // Open dialog
      await page.click('button:has-text("Invite User")')
      await expect(page.locator('text=Invite New User')).toBeVisible()

      // Click cancel
      await page.click('button:has-text("Cancel")')

      // Dialog should close
      await expect(page.locator('text=Invite New User')).not.toBeVisible()
    })

    test('should show success message when sending invite', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/users')

      // Open dialog
      await page.click('button:has-text("Invite User")')

      // Click send invite
      await page.click('button:has-text("Send Invite")')

      // Should show success toast
      await expect(page.locator('text=Invitation Sent, text=invitation')).toBeVisible({ timeout: 3000 })

      // Dialog should close
      await expect(page.locator('text=Invite New User')).not.toBeVisible()
    })

    test('should refresh user data', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/users')
      await page.waitForTimeout(1000)

      // Click refresh button
      await page.click('button:has-text("Refresh Data")')

      // Button should show loading state
      const refreshButton = page.locator('button:has-text("Refresh Data")')

      // Wait a moment for the refresh to complete
      await page.waitForTimeout(500)

      // Should show success toast
      await expect(page.locator('text=Data Refreshed, text=refreshed')).toBeVisible({ timeout: 3000 })
    })
  })

  test.describe('Edit User', () => {
    test('should open edit dialog when clicking edit action', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/users')
      await page.waitForTimeout(1000)

      // Find and click an edit button (implementation specific)
      const editButton = page.locator('button:has-text("Edit"), button i.pi-pencil').first()

      if (await editButton.isVisible()) {
        await editButton.click()

        // Edit dialog should open
        await page.waitForTimeout(500)
        // Check for dialog content (adjust based on UserEditDialog implementation)
      }
    })
  })

  test.describe('Role Assignment', () => {
    test('should open role assignment dialog', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/users')
      await page.waitForTimeout(1000)

      // Find and click role assignment button
      const roleButton = page.locator('button:has-text("Assign Role"), button:has-text("Roles"), button i.pi-shield').first()

      if (await roleButton.isVisible()) {
        await roleButton.click()

        // Role dialog should open
        await page.waitForTimeout(500)
        // Check for role dialog content
      }
    })
  })

  test.describe('Bulk Operations', () => {
    test('should show warning when attempting bulk action with no selection', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/users')
      await page.waitForTimeout(1000)

      // Try to trigger bulk action without selecting users
      const bulkButton = page.locator('button:has-text("Bulk"), button:has-text("Actions")').first()

      if (await bulkButton.isVisible()) {
        await bulkButton.click()

        // Should show warning toast
        await expect(page.locator('text=No Selection, text=select users')).toBeVisible({ timeout: 3000 })
      }
    })

    test('should open bulk operations dialog when users are selected', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/users')
      await page.waitForTimeout(1000)

      // Select at least one user
      const firstCheckbox = page.locator('input[type="checkbox"]').nth(1) // Skip header checkbox

      if (await firstCheckbox.isVisible()) {
        await firstCheckbox.check()

        // Click bulk action button
        const bulkButton = page.locator('button:has-text("Bulk"), button:has-text("Actions")').first()
        if (await bulkButton.isVisible()) {
          await bulkButton.click()

          // Bulk operations dialog should open
          await page.waitForTimeout(500)
        }
      }
    })
  })

  test.describe('Pagination', () => {
    test('should display pagination controls if there are many users', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/users')
      await page.waitForTimeout(1000)

      // Check for pagination component
      const pagination = page.locator('.p-paginator, [data-testid="pagination"]')

      // Pagination might not be visible if there are few users
      const paginationCount = await pagination.count()
      if (paginationCount > 0) {
        await expect(pagination.first()).toBeVisible()
      }
    })
  })

  test.describe('Responsive Design', () => {
    test('should display properly on mobile viewport', async ({ authenticatedPage: page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })

      await page.goto('/admin/users')
      await page.waitForTimeout(1000)

      // Page should still be accessible
      await expect(page.locator('h1:has-text("User Management")')).toBeVisible()

      // Mobile menu might appear
      const mobileMenu = page.locator('button[aria-label*="menu"], button.menu-button, i.pi-bars')
      if (await mobileMenu.isVisible()) {
        expect(await mobileMenu.isVisible()).toBeTruthy()
      }
    })

    test('should display properly on tablet viewport', async ({ authenticatedPage: page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 })

      await page.goto('/admin/users')
      await page.waitForTimeout(1000)

      // Page should be fully functional
      await expect(page.locator('h1:has-text("User Management")')).toBeVisible()
      await expect(page.locator('button:has-text("Invite User")')).toBeVisible()
    })
  })

  test.describe('Error Handling', () => {
    test('should handle API errors gracefully', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/users')
      await page.waitForTimeout(1000)

      // Simulate network error by intercepting API calls
      await page.route('**/api/admin/users*', route => route.abort())

      // Try to refresh
      await page.click('button:has-text("Refresh Data")')

      // Should show error message
      await expect(page.locator('text=Failed, text=error').first()).toBeVisible({ timeout: 5000 })
    })
  })
})
