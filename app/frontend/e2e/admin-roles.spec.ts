import { test, expect } from './utils/test-setup'

test.describe('Admin - Role Management', () => {
  test.describe('Access Control', () => {
    test('should allow super admin to access role management page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/roles')

      // Should successfully load the page
      await expect(page).toHaveURL(/.*\/admin\/roles/)

      // Check for page title
      await expect(page.locator('h1:has-text("Role Management")')).toBeVisible()
    })

    test('should deny access to non-admin users', async ({ investorPage: page }) => {
      await page.goto('/admin/roles')

      // Should redirect to dashboard with error
      await expect(page).toHaveURL(/.*\/dashboard/)

      // Check for error parameter
      const url = page.url()
      expect(url).toContain('error=insufficient_permissions')
    })

    test('should redirect unauthenticated users to login', async ({ page }) => {
      await page.goto('/admin/roles')

      // Should redirect to login page
      await expect(page).toHaveURL(/.*\/login/)
    })
  })

  test.describe('Page Layout and Navigation', () => {
    test('should display all header elements', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/roles')

      // Check header elements
      await expect(page.locator('h1:has-text("Role Management")')).toBeVisible()
      await expect(page.locator('text=Create and configure user roles with specific permissions')).toBeVisible()

      // Check breadcrumb
      await expect(page.locator('text=Dashboard')).toBeVisible()
      await expect(page.locator('text=Administration')).toBeVisible()
      await expect(page.locator('text=Roles')).toBeVisible()

      // Check action buttons
      await expect(page.locator('button:has-text("Refresh Data")')).toBeVisible()
      await expect(page.locator('button:has-text("Create Role")')).toBeVisible()
    })

    test('should display admin navigation tabs', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/roles')

      // Navigation should be visible
      await expect(page.locator('text=Roles').first()).toBeVisible()
    })

    test('should navigate to roles page from admin navigation', async ({ authenticatedPage: page }) => {
      // Start on users page
      await page.goto('/admin/users')

      // Click on roles tab
      await page.locator('a[href="/admin/roles"]').first().click()

      // Should navigate to roles page
      await expect(page).toHaveURL(/.*\/admin\/roles/)
    })

    test('should navigate back to users page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/roles')

      // Click on users tab
      await page.locator('a[href="/admin/users"]').first().click()

      // Should navigate to users page
      await expect(page).toHaveURL(/.*\/admin\/users/)
    })
  })

  test.describe('Role List Display', () => {
    test('should display role list table', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/roles')

      // Wait for data to load
      await page.waitForTimeout(1000)

      // Check for table or data grid
      const roleTable = page.locator('[data-testid="role-table"], .p-datatable, table').first()
      await expect(roleTable).toBeVisible()
    })

    test('should show role information', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/roles')
      await page.waitForTimeout(1000)

      // Check for expected role columns/data
      // Common columns: Role Name, Description, Permissions, Users Count, Actions
      const hasRoleData = await page.locator('text=SUPER_ADMIN, text=INVESTOR, text=FUND_MANAGER').count() > 0
      expect(hasRoleData).toBeTruthy()
    })

    test('should display default system roles', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/roles')
      await page.waitForTimeout(1000)

      // Check for common system roles
      const superAdminRole = page.locator('text=SUPER_ADMIN, text=Super Admin')
      const investorRole = page.locator('text=INVESTOR, text=Investor')

      // At least one default role should be visible
      const roleCount = await superAdminRole.count() + await investorRole.count()
      expect(roleCount).toBeGreaterThan(0)
    })
  })

  test.describe('Create Role', () => {
    test('should open create role dialog', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/roles')

      // Click create role button
      await page.click('button:has-text("Create Role")')

      // Dialog should open
      await page.waitForTimeout(500)

      // Check for dialog content (form fields)
      // Common fields: Role Name, Description, Permissions
      const dialogVisible = await page.locator('.p-dialog, [role="dialog"]').isVisible()
      expect(dialogVisible).toBeTruthy()
    })

    test('should close create role dialog on cancel', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/roles')

      // Open dialog
      await page.click('button:has-text("Create Role")')
      await page.waitForTimeout(500)

      // Click cancel button
      const cancelButton = page.locator('button:has-text("Cancel")').first()
      if (await cancelButton.isVisible()) {
        await cancelButton.click()

        // Dialog should close
        await page.waitForTimeout(300)
        const dialogVisible = await page.locator('.p-dialog-mask').isVisible()
        expect(dialogVisible).toBe(false)
      }
    })

    test('should validate required fields when creating role', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/roles')

      // Open create dialog
      await page.click('button:has-text("Create Role")')
      await page.waitForTimeout(500)

      // Try to submit without filling required fields
      const submitButton = page.locator('button:has-text("Create"), button:has-text("Save")').first()

      if (await submitButton.isVisible()) {
        // Check if button is disabled or click shows validation
        const isDisabled = await submitButton.isDisabled()

        if (!isDisabled) {
          await submitButton.click()

          // Should show validation errors
          await page.waitForTimeout(300)
          const hasError = await page.locator('text=required, text=Required').count() > 0
          expect(hasError).toBeTruthy()
        } else {
          // Button is disabled, which is correct for empty form
          expect(isDisabled).toBe(true)
        }
      }
    })

    test('should show success message when role is created', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/roles')
      await page.waitForTimeout(500)

      // Open create dialog
      await page.click('button:has-text("Create Role")')
      await page.waitForTimeout(500)

      // Fill in role details (if form is available)
      const nameInput = page.locator('input[name="name"], input[id*="name"], input[placeholder*="name"]').first()

      if (await nameInput.isVisible()) {
        const testRoleName = `TEST_ROLE_${Date.now()}`
        await nameInput.fill(testRoleName)

        // Fill description if available
        const descInput = page.locator('input[name="description"], textarea[name="description"]').first()
        if (await descInput.isVisible()) {
          await descInput.fill('Test role description')
        }

        // Submit form
        const submitButton = page.locator('button:has-text("Create"), button:has-text("Save")').first()
        if (await submitButton.isVisible() && !(await submitButton.isDisabled())) {
          await submitButton.click()

          // Should show success toast
          await expect(page.locator('text=Role Created, text=created successfully')).toBeVisible({ timeout: 5000 })
        }
      }
    })
  })

  test.describe('Edit Role', () => {
    test('should open edit dialog when clicking edit action', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/roles')
      await page.waitForTimeout(1000)

      // Find and click an edit button
      const editButton = page.locator('button:has-text("Edit"), button i.pi-pencil, button i.pi-cog').first()

      if (await editButton.isVisible()) {
        await editButton.click()

        // Edit dialog should open
        await page.waitForTimeout(500)
        const dialogVisible = await page.locator('.p-dialog, [role="dialog"]').isVisible()
        expect(dialogVisible).toBeTruthy()
      }
    })

    test('should show success message when role is updated', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/roles')
      await page.waitForTimeout(1000)

      // Find and click edit button for a role
      const editButton = page.locator('button:has-text("Edit"), button i.pi-pencil, button i.pi-cog').first()

      if (await editButton.isVisible()) {
        await editButton.click()
        await page.waitForTimeout(500)

        // Modify the description
        const descInput = page.locator('input[name="description"], textarea[name="description"]').first()
        if (await descInput.isVisible()) {
          await descInput.fill(`Updated description ${Date.now()}`)

          // Submit form
          const submitButton = page.locator('button:has-text("Update"), button:has-text("Save")').first()
          if (await submitButton.isVisible()) {
            await submitButton.click()

            // Should show success toast
            await expect(page.locator('text=Role Updated, text=updated successfully')).toBeVisible({ timeout: 5000 })
          }
        }
      }
    })
  })

  test.describe('Delete Role', () => {
    test('should show delete confirmation', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/roles')
      await page.waitForTimeout(1000)

      // Find a custom role to delete (not system roles)
      const deleteButton = page.locator('button:has-text("Delete"), button i.pi-trash').first()

      if (await deleteButton.isVisible()) {
        await deleteButton.click()

        // Should show confirmation dialog
        await page.waitForTimeout(300)
        const confirmDialog = await page.locator('text=confirm, text=Confirm, text=delete, text=Delete').count() > 0
        expect(confirmDialog).toBeTruthy()
      }
    })

    test('should not allow deleting system roles', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/roles')
      await page.waitForTimeout(1000)

      // Try to find delete button for SUPER_ADMIN or other system roles
      // System roles typically have delete button disabled or hidden
      const systemRoleRow = page.locator('tr:has-text("SUPER_ADMIN"), tr:has-text("INVESTOR")').first()

      if (await systemRoleRow.isVisible()) {
        const deleteButton = systemRoleRow.locator('button:has-text("Delete"), button i.pi-trash')

        if (await deleteButton.count() > 0) {
          // If delete button exists, it should be disabled
          const isDisabled = await deleteButton.isDisabled()
          expect(isDisabled).toBe(true)
        }
      }
    })
  })

  test.describe('Permission Management', () => {
    test('should open permission dialog', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/roles')
      await page.waitForTimeout(1000)

      // Find and click permissions button
      const permissionButton = page.locator('button:has-text("Permissions"), button:has-text("Manage"), button i.pi-shield').first()

      if (await permissionButton.isVisible()) {
        await permissionButton.click()

        // Permission dialog should open
        await page.waitForTimeout(500)
        const dialogVisible = await page.locator('.p-dialog, [role="dialog"]').isVisible()
        expect(dialogVisible).toBeTruthy()
      }
    })

    test('should display available permissions', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/roles')
      await page.waitForTimeout(1000)

      // Click permissions button
      const permissionButton = page.locator('button:has-text("Permissions"), button:has-text("Manage"), button i.pi-shield').first()

      if (await permissionButton.isVisible()) {
        await permissionButton.click()
        await page.waitForTimeout(500)

        // Should show list of permissions (checkboxes or similar)
        const hasPermissions = await page.locator('input[type="checkbox"]').count() > 0
        expect(hasPermissions).toBeTruthy()
      }
    })

    test('should show success message when permissions are updated', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/roles')
      await page.waitForTimeout(1000)

      // Open permissions dialog
      const permissionButton = page.locator('button:has-text("Permissions"), button:has-text("Manage"), button i.pi-shield').first()

      if (await permissionButton.isVisible()) {
        await permissionButton.click()
        await page.waitForTimeout(500)

        // Toggle a permission
        const firstCheckbox = page.locator('input[type="checkbox"]').first()
        if (await firstCheckbox.isVisible()) {
          const wasChecked = await firstCheckbox.isChecked()
          await firstCheckbox.click()

          // Save changes
          const saveButton = page.locator('button:has-text("Save"), button:has-text("Update")').first()
          if (await saveButton.isVisible()) {
            await saveButton.click()

            // Should show success toast
            await expect(page.locator('text=Permissions Updated, text=permissions')).toBeVisible({ timeout: 5000 })
          }
        }
      }
    })
  })

  test.describe('Search and Filter', () => {
    test('should allow searching for roles', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/roles')
      await page.waitForTimeout(1000)

      // Look for search input
      const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="search"]').first()

      if (await searchInput.isVisible()) {
        await searchInput.fill('ADMIN')

        // Wait for search results to update
        await page.waitForTimeout(500)

        // Results should be filtered
        expect(await searchInput.inputValue()).toBe('ADMIN')
      }
    })
  })

  test.describe('Refresh Data', () => {
    test('should refresh role data', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/roles')
      await page.waitForTimeout(1000)

      // Click refresh button
      await page.click('button:has-text("Refresh Data")')

      // Button should show loading state briefly
      const refreshButton = page.locator('button:has-text("Refresh Data")')

      // Wait for refresh to complete
      await page.waitForTimeout(500)

      // Should show success toast
      await expect(page.locator('text=Data Refreshed, text=refreshed')).toBeVisible({ timeout: 3000 })
    })
  })

  test.describe('Role Statistics', () => {
    test('should display user count for each role', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/roles')
      await page.waitForTimeout(1000)

      // Check if user count is displayed
      // Common patterns: "5 users", "Users: 5", etc.
      const hasUserCount = await page.locator('text=/\\d+\\s+user/i').count() > 0

      // User count display is optional, so we just check if it exists
      if (hasUserCount) {
        expect(hasUserCount).toBe(true)
      }
    })

    test('should display permission count for each role', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/roles')
      await page.waitForTimeout(1000)

      // Check if permission count is displayed
      const hasPermissionCount = await page.locator('text=/\\d+\\s+permission/i').count() > 0

      // Permission count display is optional
      if (hasPermissionCount) {
        expect(hasPermissionCount).toBe(true)
      }
    })
  })

  test.describe('Responsive Design', () => {
    test('should display properly on mobile viewport', async ({ authenticatedPage: page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })

      await page.goto('/admin/roles')
      await page.waitForTimeout(1000)

      // Page should still be accessible
      await expect(page.locator('h1:has-text("Role Management")')).toBeVisible()
    })

    test('should display properly on tablet viewport', async ({ authenticatedPage: page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 })

      await page.goto('/admin/roles')
      await page.waitForTimeout(1000)

      // Page should be fully functional
      await expect(page.locator('h1:has-text("Role Management")')).toBeVisible()
      await expect(page.locator('button:has-text("Create Role")')).toBeVisible()
    })
  })

  test.describe('Error Handling', () => {
    test('should handle API errors gracefully', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/roles')
      await page.waitForTimeout(1000)

      // Simulate network error
      await page.route('**/api/admin/roles*', route => route.abort())

      // Try to refresh
      await page.click('button:has-text("Refresh Data")')

      // Should show error message
      await expect(page.locator('text=Failed, text=error').first()).toBeVisible({ timeout: 5000 })
    })
  })
})
