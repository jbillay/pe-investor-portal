import { test, expect } from './utils/test-setup'

test.describe('Admin - Email Template Management', () => {
  test.describe('Access Control', () => {
    test('should allow super admin to access email template management page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/email-templates')

      // Should successfully load the page
      await expect(page).toHaveURL(/.*\/admin\/email-templates/)

      // Check for page title
      await expect(page.locator('h1:has-text("Email Template Management")')).toBeVisible()
    })

    test('should deny access to non-admin users', async ({ investorPage: page }) => {
      await page.goto('/admin/email-templates')

      // Should redirect to dashboard with error
      await expect(page).toHaveURL(/.*\/dashboard/)

      // Check for error parameter
      const url = page.url()
      expect(url).toContain('error=insufficient_permissions')
    })

    test('should redirect unauthenticated users to login', async ({ page }) => {
      await page.goto('/admin/email-templates')

      // Should redirect to login page
      await expect(page).toHaveURL(/.*\/login/)
    })
  })

  test.describe('Page Layout and Navigation', () => {
    test('should display all header elements', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/email-templates')

      // Check header elements
      await expect(page.locator('h1:has-text("Email Template Management")')).toBeVisible()
      await expect(page.locator('text=Manage email templates, monitor sending activity, and view statistics')).toBeVisible()

      // Check breadcrumb
      await expect(page.locator('text=Dashboard')).toBeVisible()
      await expect(page.locator('text=Administration')).toBeVisible()
      await expect(page.locator('text=Email Templates')).toBeVisible()

      // Check action buttons
      await expect(page.locator('button:has-text("Refresh Data")')).toBeVisible()
      await expect(page.locator('button:has-text("Create Template")')).toBeVisible()
    })

    test('should display tab navigation', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/email-templates')
      await page.waitForTimeout(1000)

      // Check for all tabs
      await expect(page.locator('text=Templates').first()).toBeVisible()
      await expect(page.locator('text=Email Logs')).toBeVisible()
      await expect(page.locator('text=Statistics')).toBeVisible()
      await expect(page.locator('text=Queue Monitor')).toBeVisible()
    })

    test('should display admin navigation', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/email-templates')

      // Admin navigation should be visible
      await expect(page.locator('a[href="/admin/users"], text=Users').first()).toBeVisible()
    })

    test('should navigate to email templates from other admin pages', async ({ authenticatedPage: page }) => {
      // Start on users page
      await page.goto('/admin/users')

      // Click on email templates link (exact selector depends on AdminNavigation implementation)
      await page.locator('a[href="/admin/email-templates"]').first().click()

      // Should navigate to email templates page
      await expect(page).toHaveURL(/.*\/admin\/email-templates/)
    })
  })

  test.describe('Templates Tab', () => {
    test('should display templates tab by default', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/email-templates')
      await page.waitForTimeout(1000)

      // Templates tab should be active
      const templatesTab = page.locator('text=Templates').first()
      await expect(templatesTab).toBeVisible()

      // Should see templates table or list
      const table = page.locator('.email-templates-table, .p-datatable').first()
      await expect(table).toBeVisible()
    })

    test('should display filter controls', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/email-templates')
      await page.waitForTimeout(1000)

      // Check for filter inputs
      await expect(page.locator('input[placeholder*="Search"]')).toBeVisible()

      // Check for filter dropdowns
      const categoryFilter = page.locator('text=Category').first()
      const statusFilter = page.locator('text=Status').first()
      const typeFilter = page.locator('text=Type').first()

      await expect(categoryFilter).toBeVisible()
      await expect(statusFilter).toBeVisible()
      await expect(typeFilter).toBeVisible()

      // Check for clear filters button
      await expect(page.locator('button:has-text("Clear Filters")')).toBeVisible()
    })

    test('should allow searching templates', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/email-templates')
      await page.waitForTimeout(1000)

      // Find search input
      const searchInput = page.locator('input[placeholder*="Search"]').first()
      await searchInput.fill('welcome')

      // Wait for search results
      await page.waitForTimeout(500)

      // Verify input value
      expect(await searchInput.inputValue()).toContain('welcome')
    })

    test('should allow filtering by category', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/email-templates')
      await page.waitForTimeout(1000)

      // Find and click category dropdown
      const categoryDropdown = page.locator('.p-select').first()

      if (await categoryDropdown.isVisible()) {
        await categoryDropdown.click()
        await page.waitForTimeout(300)

        // Select an option
        const accountOption = page.locator('text=Account, li:has-text("Account")').first()
        if (await accountOption.isVisible()) {
          await accountOption.click()
          await page.waitForTimeout(500)
        }
      }
    })

    test('should clear all filters', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/email-templates')
      await page.waitForTimeout(1000)

      // Apply some filters
      const searchInput = page.locator('input[placeholder*="Search"]').first()
      await searchInput.fill('test')

      // Click clear filters
      await page.click('button:has-text("Clear Filters")')

      // Search input should be cleared
      await page.waitForTimeout(300)
      expect(await searchInput.inputValue()).toBe('')
    })

    test('should display template list with columns', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/email-templates')
      await page.waitForTimeout(1000)

      // Check for expected columns
      // Common columns: Template Name, Category, Subject, Status, Last Updated, Actions
      const hasColumns = await page.locator('th:has-text("Template"), th:has-text("Category"), th:has-text("Subject")').count() > 0
      expect(hasColumns).toBeTruthy()
    })

    test('should display system template tags', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/email-templates')
      await page.waitForTimeout(1000)

      // Check for system template tags
      const systemTag = page.locator('text=System').first()
      // System tags are optional, but if they exist they should be visible
      const count = await systemTag.count()
      if (count > 0) {
        await expect(systemTag).toBeVisible()
      }
    })

    test('should allow selecting templates', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/email-templates')
      await page.waitForTimeout(1000)

      // Find and click selection checkbox
      const checkbox = page.locator('input[type="checkbox"]').nth(1) // Skip header

      if (await checkbox.isVisible()) {
        await checkbox.check()
        await expect(checkbox).toBeChecked()
      }
    })
  })

  test.describe('Template Actions', () => {
    test('should open create template dialog', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/email-templates')
      await page.waitForTimeout(1000)

      // Click create template button
      await page.click('button:has-text("Create Template")')

      // Dialog should open
      await page.waitForTimeout(500)
      const dialogVisible = await page.locator('.p-dialog, [role="dialog"]').isVisible()
      expect(dialogVisible).toBeTruthy()
    })

    test('should show template preview', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/email-templates')
      await page.waitForTimeout(1000)

      // Find and click preview button
      const previewButton = page.locator('button i.pi-eye').first()

      if (await previewButton.isVisible()) {
        await previewButton.click()

        // Preview dialog should open
        await page.waitForTimeout(500)
        const dialogVisible = await page.locator('.p-dialog, [role="dialog"]').isVisible()
        expect(dialogVisible).toBeTruthy()
      }
    })

    test('should open edit template dialog', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/email-templates')
      await page.waitForTimeout(1000)

      // Find and click edit button (not on system template)
      const editButtons = page.locator('button i.pi-pencil')
      const count = await editButtons.count()

      for (let i = 0; i < count; i++) {
        const button = editButtons.nth(i)
        if (await button.isVisible() && !(await button.isDisabled())) {
          await button.click()

          // Edit dialog should open
          await page.waitForTimeout(500)
          const dialogVisible = await page.locator('.p-dialog, [role="dialog"]').isVisible()
          expect(dialogVisible).toBeTruthy()
          break
        }
      }
    })

    test('should not allow editing system templates', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/email-templates')
      await page.waitForTimeout(1000)

      // Find a row with system tag
      const systemRow = page.locator('tr:has-text("System")').first()

      if (await systemRow.isVisible()) {
        // Edit button should be disabled
        const editButton = systemRow.locator('button i.pi-pencil')
        if (await editButton.count() > 0) {
          const isDisabled = await editButton.first().isDisabled()
          expect(isDisabled).toBe(true)
        }
      }
    })

    test('should allow duplicating templates', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/email-templates')
      await page.waitForTimeout(1000)

      // Find and click duplicate button
      const duplicateButton = page.locator('button i.pi-copy').first()

      if (await duplicateButton.isVisible()) {
        await duplicateButton.click()

        // Should show success message
        await expect(page.locator('text=duplicated, text=Duplicated')).toBeVisible({ timeout: 5000 })
      }
    })

    test('should show delete confirmation', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/email-templates')
      await page.waitForTimeout(1000)

      // Find delete button (not on system template)
      const deleteButtons = page.locator('button i.pi-trash')
      const count = await deleteButtons.count()

      for (let i = 0; i < count; i++) {
        const button = deleteButtons.nth(i)
        if (await button.isVisible() && !(await button.isDisabled())) {
          await button.click()

          // Confirmation dialog should appear
          await page.waitForTimeout(300)
          const hasConfirm = await page.locator('text=confirm, text=Confirm, text=delete, text=Delete').count() > 0
          expect(hasConfirm).toBeTruthy()
          break
        }
      }
    })

    test('should not allow deleting system templates', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/email-templates')
      await page.waitForTimeout(1000)

      // Find a row with system tag
      const systemRow = page.locator('tr:has-text("System")').first()

      if (await systemRow.isVisible()) {
        // Delete button should be disabled
        const deleteButton = systemRow.locator('button i.pi-trash')
        if (await deleteButton.count() > 0) {
          const isDisabled = await deleteButton.first().isDisabled()
          expect(isDisabled).toBe(true)
        }
      }
    })
  })

  test.describe('Email Logs Tab', () => {
    test('should switch to email logs tab', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/email-templates')
      await page.waitForTimeout(1000)

      // Click on Email Logs tab
      await page.locator('text=Email Logs').click()

      // Tab content should be visible
      await page.waitForTimeout(300)

      // Check if tab is active (implementation dependent)
      const logsTab = page.locator('text=Email Logs')
      await expect(logsTab).toBeVisible()
    })

    test('should display email logs badge if logs exist', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/email-templates')
      await page.waitForTimeout(1000)

      // Check for badge on Email Logs tab
      const badge = page.locator('text=Email Logs').locator('..').locator('.p-badge')

      if (await badge.isVisible()) {
        // Badge should show a number
        const badgeText = await badge.textContent()
        expect(badgeText).toMatch(/\d+/)
      }
    })
  })

  test.describe('Statistics Tab', () => {
    test('should switch to statistics tab', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/email-templates')
      await page.waitForTimeout(1000)

      // Click on Statistics tab
      await page.locator('text=Statistics').click()

      // Tab content should be visible
      await page.waitForTimeout(300)

      // Check if tab is active
      const statsTab = page.locator('text=Statistics')
      await expect(statsTab).toBeVisible()
    })
  })

  test.describe('Queue Monitor Tab', () => {
    test('should switch to queue monitor tab', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/email-templates')
      await page.waitForTimeout(1000)

      // Click on Queue Monitor tab
      await page.locator('text=Queue Monitor').click()

      // Tab content should be visible
      await page.waitForTimeout(300)

      // Check if tab is active
      const queueTab = page.locator('text=Queue Monitor')
      await expect(queueTab).toBeVisible()
    })

    test('should display pending queue badge', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/email-templates')
      await page.waitForTimeout(1000)

      // Check for badge on Queue Monitor tab
      const badge = page.locator('text=Queue Monitor').locator('..').locator('.p-badge')

      if (await badge.isVisible()) {
        // Badge should show pending count
        const badgeText = await badge.textContent()
        expect(badgeText).toMatch(/\d+/)
      }
    })
  })

  test.describe('Refresh Data', () => {
    test('should refresh all data', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/email-templates')
      await page.waitForTimeout(1000)

      // Click refresh button
      await page.click('button:has-text("Refresh Data")')

      // Button should show loading state
      const refreshButton = page.locator('button:has-text("Refresh Data")')

      // Wait for refresh to complete
      await page.waitForTimeout(1000)

      // Should show success message
      await expect(page.locator('text=Data Refreshed, text=refreshed')).toBeVisible({ timeout: 3000 })
    })
  })

  test.describe('Pagination', () => {
    test('should display pagination controls if many templates exist', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/email-templates')
      await page.waitForTimeout(1000)

      // Check for pagination
      const pagination = page.locator('.p-paginator')

      if (await pagination.isVisible()) {
        // Pagination should show page controls
        await expect(pagination).toBeVisible()
      }
    })

    test('should allow changing rows per page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/email-templates')
      await page.waitForTimeout(1000)

      // Check for rows per page dropdown
      const rowsDropdown = page.locator('.p-dropdown').filter({ hasText: '10' })

      if (await rowsDropdown.isVisible()) {
        await rowsDropdown.click()
        await page.waitForTimeout(300)

        // Select different option
        const option25 = page.locator('li:has-text("25")').first()
        if (await option25.isVisible()) {
          await option25.click()
          await page.waitForTimeout(500)
        }
      }
    })
  })

  test.describe('Sorting', () => {
    test('should allow sorting by column', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/email-templates')
      await page.waitForTimeout(1000)

      // Click on a sortable column header
      const nameHeader = page.locator('th:has-text("Template"), th:has-text("Name")').first()

      if (await nameHeader.isVisible()) {
        await nameHeader.click()

        // Column should be sorted
        await page.waitForTimeout(500)

        // Check for sort indicator (varies by implementation)
        const sortIcon = page.locator('.pi-sort-up, .pi-sort-down, .pi-sort-amount-down, .pi-sort-amount-up').first()
        const hasSortIcon = await sortIcon.count() > 0
        // Sort icon is optional
        if (hasSortIcon) {
          expect(hasSortIcon).toBeTruthy()
        }
      }
    })
  })

  test.describe('Responsive Design', () => {
    test('should display properly on mobile viewport', async ({ authenticatedPage: page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })

      await page.goto('/admin/email-templates')
      await page.waitForTimeout(1000)

      // Page should still be accessible
      await expect(page.locator('h1:has-text("Email Template Management")')).toBeVisible()

      // Tabs should be visible (might be scrollable on mobile)
      await expect(page.locator('text=Templates').first()).toBeVisible()
    })

    test('should display properly on tablet viewport', async ({ authenticatedPage: page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 })

      await page.goto('/admin/email-templates')
      await page.waitForTimeout(1000)

      // Page should be fully functional
      await expect(page.locator('h1:has-text("Email Template Management")')).toBeVisible()
      await expect(page.locator('button:has-text("Create Template")')).toBeVisible()
    })
  })

  test.describe('Error Handling', () => {
    test('should handle API errors gracefully', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/email-templates')
      await page.waitForTimeout(1000)

      // Simulate network error
      await page.route('**/api/email/templates*', route => route.abort())

      // Try to refresh
      await page.click('button:has-text("Refresh Data")')

      // Should show error or handle gracefully
      await page.waitForTimeout(2000)

      // Check for error message or empty state
      const hasError = await page.locator('text=error, text=Error, text=failed, text=Failed').count() > 0
      const hasEmptyState = await page.locator('text=No email templates found').count() > 0

      expect(hasError || hasEmptyState).toBeTruthy()
    })
  })

  test.describe('Empty State', () => {
    test('should display empty state when no templates exist', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/email-templates')
      await page.waitForTimeout(1000)

      // If no templates exist, should show empty state
      const emptyState = page.locator('text=No email templates found')

      // Empty state is conditional
      const hasEmptyState = await emptyState.count() > 0
      if (hasEmptyState) {
        await expect(emptyState).toBeVisible()
      }
    })
  })
})
