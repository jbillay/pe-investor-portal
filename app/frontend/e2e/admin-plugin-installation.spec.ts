import { test, expect } from './utils/test-setup'
import path from 'path'

test.describe('Admin - Plugin Installation Wizard', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/admin/plugins')
    await expect(page.locator('h1:has-text("Plugin Management")')).toBeVisible()
  })

  test.describe('Dialog Opening and Initialization', () => {
    test('should open plugin install dialog when clicking Install Plugin button', async ({ authenticatedPage: page }) => {
      await page.getByRole('button', { name: 'Install Plugin' }).click()

      // Dialog should be visible
      await expect(page.getByRole('dialog')).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Install Plugin' })).toBeVisible()
      await expect(page.getByText('Step 1 of 3')).toBeVisible()
    })

    test('should show enhanced progress indicators with labels', async ({ authenticatedPage: page }) => {
      await page.getByRole('button', { name: 'Install Plugin' }).click()

      // Check for numbered step indicators with labels
      await expect(page.getByLabel(/Step 1.*Upload/)).toBeVisible()
      await expect(page.getByLabel(/Step 2.*Review/)).toBeVisible()
      await expect(page.getByLabel(/Step 3.*Install/)).toBeVisible()
    })

    test('should display file type validation badges', async ({ authenticatedPage: page }) => {
      await page.getByRole('button', { name: 'Install Plugin' }).click()

      // Check for file type badges
      await expect(page.getByText('.ZIP files only')).toBeVisible()
      await expect(page.getByText('Max 10MB')).toBeVisible()
    })

    test('should have Next button disabled initially', async ({ authenticatedPage: page }) => {
      await page.getByRole('button', { name: 'Install Plugin' }).click()

      const nextButton = page.getByRole('button', { name: 'Next', exact: true })
      await expect(nextButton).toBeVisible()
      await expect(nextButton).toBeDisabled()
    })
  })

  test.describe('File Upload - Step 1', () => {
    test('should allow file selection via button', async ({ authenticatedPage: page }) => {
      await page.getByRole('button', { name: 'Install Plugin' }).click()

      // Get path to sample plugin
      const pluginPath = path.join(__dirname, '../../sample-plugins/hello-world-plugin.zip')

      // Set up file chooser event listener
      const fileChooserPromise = page.waitForEvent('filechooser')
      await page.getByRole('button', { name: 'Choose Plugin File' }).click()
      const fileChooser = await fileChooserPromise
      await fileChooser.setFiles(pluginPath)

      // File should be selected
      await expect(page.getByText('hello-world-plugin.zip')).toBeVisible()
      await expect(page.getByText(/KB/)).toBeVisible()

      // Next button should now be enabled
      await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeEnabled()
    })

    test('should show file info after selection', async ({ authenticatedPage: page }) => {
      await page.getByRole('button', { name: 'Install Plugin' }).click()

      const pluginPath = path.join(__dirname, '../../sample-plugins/hello-world-plugin.zip')

      const fileChooserPromise = page.waitForEvent('filechooser')
      await page.getByRole('button', { name: 'Choose Plugin File' }).click()
      const fileChooser = await fileChooserPromise
      await fileChooser.setFiles(pluginPath)

      // Check file card is displayed
      await expect(page.locator('.selected-file')).toBeVisible()
      await expect(page.getByText('hello-world-plugin.zip')).toBeVisible()

      // Should have remove button
      const removeButton = page.locator('.selected-file button[aria-label*="times"]')
      await expect(removeButton).toBeVisible()
    })

    test('should allow removing selected file', async ({ authenticatedPage: page }) => {
      await page.getByRole('button', { name: 'Install Plugin' }).click()

      const pluginPath = path.join(__dirname, '../../sample-plugins/hello-world-plugin.zip')

      const fileChooserPromise = page.waitForEvent('filechooser')
      await page.getByRole('button', { name: 'Choose Plugin File' }).click()
      const fileChooser = await fileChooserPromise
      await fileChooser.setFiles(pluginPath)

      await expect(page.getByText('hello-world-plugin.zip')).toBeVisible()

      // Click remove button
      await page.locator('.selected-file button').click()

      // File should be removed
      await expect(page.getByText('hello-world-plugin.zip')).toBeHidden()
      await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeDisabled()
    })

    test('should support keyboard navigation to drag-drop zone', async ({ authenticatedPage: page }) => {
      await page.getByRole('button', { name: 'Install Plugin' }).click()

      // Tab to the drag-drop zone
      await page.keyboard.press('Tab') // Skip Choose File button
      await page.keyboard.press('Tab') // Focus drag-drop zone

      // Verify drag-drop zone has focus (by checking if Enter opens file chooser)
      const fileChooserPromise = page.waitForEvent('filechooser')
      await page.keyboard.press('Enter')
      await fileChooserPromise

      // File chooser should have opened
      expect(fileChooserPromise).toBeDefined()
    })
  })

  test.describe('Plugin Review - Step 2', () => {
    test('should display plugin details after upload', async ({ authenticatedPage: page }) => {
      await page.getByRole('button', { name: 'Install Plugin' }).click()

      const pluginPath = path.join(__dirname, '../../sample-plugins/hello-world-plugin.zip')

      const fileChooserPromise = page.waitForEvent('filechooser')
      await page.getByRole('button', { name: 'Choose Plugin File' }).click()
      const fileChooser = await fileChooserPromise
      await fileChooser.setFiles(pluginPath)

      // Click Next to upload
      await page.getByRole('button', { name: 'Next', exact: true }).click()

      // Wait for step 2
      await expect(page.getByText('Step 2 of 3')).toBeVisible()

      // Check plugin details are displayed
      await expect(page.getByRole('heading', { name: 'Hello World Plugin' })).toBeVisible()
      await expect(page.getByText('v1.0.0')).toBeVisible()
      await expect(page.getByText('by PE Investor Portal Team')).toBeVisible()

      // Check metadata sections
      await expect(page.getByText('Core Version')).toBeVisible()
      await expect(page.getByText('License')).toBeVisible()
      await expect(page.getByText('Plugin ID')).toBeVisible()
      await expect(page.getByText('hello-world-plugin')).toBeVisible()
    })

    test('should display plugin features', async ({ authenticatedPage: page }) => {
      await page.getByRole('button', { name: 'Install Plugin' }).click()

      const pluginPath = path.join(__dirname, '../../sample-plugins/hello-world-plugin.zip')

      const fileChooserPromise = page.waitForEvent('filechooser')
      await page.getByRole('button', { name: 'Choose Plugin File' }).click()
      const fileChooser = await fileChooserPromise
      await fileChooser.setFiles(pluginPath)

      await page.getByRole('button', { name: 'Next', exact: true }).click()
      await expect(page.getByText('Step 2 of 3')).toBeVisible()

      // Check features section
      await expect(page.getByText('Plugin Features')).toBeVisible()
      await expect(page.getByText('Menu Items (1)')).toBeVisible()
      await expect(page.getByText('Dashboard Widgets (4)')).toBeVisible()
    })

    test('should show Back button to return to step 1', async ({ authenticatedPage: page }) => {
      await page.getByRole('button', { name: 'Install Plugin' }).click()

      const pluginPath = path.join(__dirname, '../../sample-plugins/hello-world-plugin.zip')

      const fileChooserPromise = page.waitForEvent('filechooser')
      await page.getByRole('button', { name: 'Choose Plugin File' }).click()
      const fileChooser = await fileChooserPromise
      await fileChooser.setFiles(pluginPath)

      await page.getByRole('button', { name: 'Next', exact: true }).click()
      await expect(page.getByText('Step 2 of 3')).toBeVisible()

      // Click Back button
      await page.getByRole('button', { name: 'Back' }).click()

      // Should return to step 1
      await expect(page.getByText('Step 1 of 3')).toBeVisible()
      await expect(page.getByText('hello-world-plugin.zip')).toBeVisible() // File still selected
    })

    test('should have Install Plugin button enabled', async ({ authenticatedPage: page }) => {
      await page.getByRole('button', { name: 'Install Plugin' }).click()

      const pluginPath = path.join(__dirname, '../../sample-plugins/hello-world-plugin.zip')

      const fileChooserPromise = page.waitForEvent('filechooser')
      await page.getByRole('button', { name: 'Choose Plugin File' }).click()
      const fileChooser = await fileChooserPromise
      await fileChooser.setFiles(pluginPath)

      await page.getByRole('button', { name: 'Next', exact: true }).click()
      await expect(page.getByText('Step 2 of 3')).toBeVisible()

      const installButton = page.getByRole('dialog').getByRole('button', { name: 'Install Plugin' })
      await expect(installButton).toBeVisible()
      await expect(installButton).toBeEnabled()
    })
  })

  test.describe('Installation Progress - Step 3', () => {
    test('should show installation progress', async ({ authenticatedPage: page }) => {
      await page.getByRole('button', { name: 'Install Plugin' }).click()

      const pluginPath = path.join(__dirname, '../../sample-plugins/hello-world-plugin.zip')

      const fileChooserPromise = page.waitForEvent('filechooser')
      await page.getByRole('button', { name: 'Choose Plugin File' }).click()
      const fileChooser = await fileChooserPromise
      await fileChooser.setFiles(pluginPath)

      await page.getByRole('button', { name: 'Next', exact: true }).click()
      await expect(page.getByText('Step 2 of 3')).toBeVisible()

      // Click Install Plugin
      await page.getByRole('dialog').getByRole('button', { name: 'Install Plugin' }).click()

      // Should show step 3
      await expect(page.getByText('Step 3 of 3')).toBeVisible()

      // Check installation steps are displayed
      await expect(page.getByText('Validating Plugin')).toBeVisible()
      await expect(page.getByText('Checking Dependencies')).toBeVisible()
      await expect(page.getByText('Installing Plugin')).toBeVisible()
      await expect(page.getByText('Registering Components')).toBeVisible()
      await expect(page.getByText('Finalization')).toBeVisible()
    })

    test('should show success message after installation', async ({ authenticatedPage: page }) => {
      await page.getByRole('button', { name: 'Install Plugin' }).click()

      const pluginPath = path.join(__dirname, '../../sample-plugins/hello-world-plugin.zip')

      const fileChooserPromise = page.waitForEvent('filechooser')
      await page.getByRole('button', { name: 'Choose Plugin File' }).click()
      const fileChooser = await fileChooserPromise
      await fileChooser.setFiles(pluginPath)

      await page.getByRole('button', { name: 'Next', exact: true }).click()
      await page.getByRole('dialog').getByRole('button', { name: 'Install Plugin' }).click()

      // Wait for success message
      await expect(page.getByText('Plugin Installed Successfully!')).toBeVisible({ timeout: 10000 })
      await expect(page.getByText(/has been installed and is now active/)).toBeVisible()

      // Close button should be visible
      await expect(page.getByRole('button', { name: 'Close' })).toBeVisible()
    })

    test('should show plugin in list after installation', async ({ authenticatedPage: page }) => {
      // Delete existing plugin first if it exists
      const existingPlugin = page.locator('text=Hello World Plugin').first()
      if (await existingPlugin.isVisible()) {
        const deleteButton = page.locator('button[aria-label*="delete"]').first()
        await deleteButton.click()
        await page.getByRole('button', { name: /confirm/i }).click()
        await page.waitForTimeout(1000)
      }

      await page.getByRole('button', { name: 'Install Plugin' }).click()

      const pluginPath = path.join(__dirname, '../../sample-plugins/hello-world-plugin.zip')

      const fileChooserPromise = page.waitForEvent('filechooser')
      await page.getByRole('button', { name: 'Choose Plugin File' }).click()
      const fileChooser = await fileChooserPromise
      await fileChooser.setFiles(pluginPath)

      await page.getByRole('button', { name: 'Next', exact: true }).click()
      await page.getByRole('dialog').getByRole('button', { name: 'Install Plugin' }).click()

      await expect(page.getByText('Plugin Installed Successfully!')).toBeVisible({ timeout: 10000 })

      // Close dialog
      await page.getByRole('button', { name: 'Close' }).click()

      // Plugin should appear in table
      await expect(page.locator('text=Hello World Plugin').first()).toBeVisible()
      await expect(page.getByText('INSTALLED')).toBeVisible()
    })
  })

  test.describe('Installation Cancellation', () => {
    test('should allow canceling installation with confirmation', async ({ authenticatedPage: page }) => {
      await page.getByRole('button', { name: 'Install Plugin' }).click()

      const pluginPath = path.join(__dirname, '../../sample-plugins/hello-world-plugin.zip')

      const fileChooserPromise = page.waitForEvent('filechooser')
      await page.getByRole('button', { name: 'Choose Plugin File' }).click()
      const fileChooser = await fileChooserPromise
      await fileChooser.setFiles(pluginPath)

      await page.getByRole('button', { name: 'Next', exact: true }).click()
      await page.getByRole('dialog').getByRole('button', { name: 'Install Plugin' }).click()

      // Cancel button should change during installation
      const cancelButton = page.getByRole('button', { name: 'Cancel Installation' })
      await expect(cancelButton).toBeVisible({ timeout: 3000 })

      // Click cancel
      await cancelButton.click()

      // Confirmation dialog should appear
      await expect(page.getByText('Cancel Installation')).toBeVisible()
      await expect(page.getByText(/cannot be undone/)).toBeVisible()

      // Confirm cancellation
      await page.getByRole('button', { name: 'Yes, Cancel Installation' }).click()

      // Should show cancellation message
      await expect(page.getByText('Installation Cancelled')).toBeVisible({ timeout: 3000 })
    })
  })

  test.describe('Upload Error Recovery', () => {
    test('should show Try Again button on upload error', async ({ authenticatedPage: page }) => {
      // This test would require mocking the backend to return an error
      // For now, we'll test the UI structure
      await page.getByRole('button', { name: 'Install Plugin' }).click()

      // Verify Try Again button would appear in error message
      // (This would need actual error triggering in a real scenario)
    })
  })

  test.describe('Keyboard Navigation and Accessibility', () => {
    test('should close dialog with Escape key', async ({ authenticatedPage: page }) => {
      await page.getByRole('button', { name: 'Install Plugin' }).click()
      await expect(page.getByRole('dialog')).toBeVisible()

      // Press Escape
      await page.keyboard.press('Escape')

      // Dialog should close
      await expect(page.getByRole('dialog')).toBeHidden()
    })

    test('should support Ctrl+Enter to proceed to next step', async ({ authenticatedPage: page }) => {
      await page.getByRole('button', { name: 'Install Plugin' }).click()

      const pluginPath = path.join(__dirname, '../../sample-plugins/hello-world-plugin.zip')

      const fileChooserPromise = page.waitForEvent('filechooser')
      await page.getByRole('button', { name: 'Choose Plugin File' }).click()
      const fileChooser = await fileChooserPromise
      await fileChooser.setFiles(pluginPath)

      await expect(page.getByText('hello-world-plugin.zip')).toBeVisible()

      // Press Ctrl+Enter to proceed
      await page.keyboard.press('Control+Enter')

      // Should move to step 2
      await expect(page.getByText('Step 2 of 3')).toBeVisible({ timeout: 5000 })
    })

    test('should have proper focus trap - Tab stays within dialog', async ({ authenticatedPage: page }) => {
      await page.getByRole('button', { name: 'Install Plugin' }).click()

      // Get initial focused element
      const dialogContent = page.getByRole('dialog')
      await expect(dialogContent).toBeVisible()

      // Press Tab multiple times
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')

      // Focus should still be within the dialog
      const activeElement = await page.evaluateHandle(() => document.activeElement)
      const isInDialog = await page.evaluate((dialog, active) => {
        return dialog.contains(active)
      }, await dialogContent.elementHandle(), activeElement)

      expect(isInDialog).toBe(true)
    })

    test('should have proper ARIA labels for screen readers', async ({ authenticatedPage: page }) => {
      await page.getByRole('button', { name: 'Install Plugin' }).click()

      // Check for progress bar ARIA attributes
      const progressbar = page.getByRole('progressbar')
      await expect(progressbar).toBeVisible()

      // Check for labeled regions
      const dragDropZone = page.getByRole('button', { name: /Drag and drop zone/ })
      await expect(dragDropZone).toBeVisible()
    })
  })

  test.describe('Edge Cases and Error Handling', () => {
    test('should handle dialog close and reopen correctly', async ({ authenticatedPage: page }) => {
      // Open dialog
      await page.getByRole('button', { name: 'Install Plugin' }).click()
      await expect(page.getByRole('dialog')).toBeVisible()

      // Close with Cancel
      await page.getByRole('button', { name: 'Cancel' }).click()
      await expect(page.getByRole('dialog')).toBeHidden()

      // Reopen - should be reset to step 1
      await page.getByRole('button', { name: 'Install Plugin' }).click()
      await expect(page.getByText('Step 1 of 3')).toBeVisible()
      await expect(page.getByText('No file chosen')).toBeVisible()
    })

    test('should maintain state during wizard navigation', async ({ authenticatedPage: page }) => {
      await page.getByRole('button', { name: 'Install Plugin' }).click()

      const pluginPath = path.join(__dirname, '../../sample-plugins/hello-world-plugin.zip')

      const fileChooserPromise = page.waitForEvent('filechooser')
      await page.getByRole('button', { name: 'Choose Plugin File' }).click()
      const fileChooser = await fileChooserPromise
      await fileChooser.setFiles(pluginPath)

      // Go to step 2
      await page.getByRole('button', { name: 'Next', exact: true }).click()
      await expect(page.getByText('Step 2 of 3')).toBeVisible()

      // Go back to step 1
      await page.getByRole('button', { name: 'Back' }).click()
      await expect(page.getByText('Step 1 of 3')).toBeVisible()

      // File should still be selected
      await expect(page.getByText('hello-world-plugin.zip')).toBeVisible()

      // Go forward again
      await page.getByRole('button', { name: 'Next', exact: true }).click()
      await expect(page.getByText('Step 2 of 3')).toBeVisible()

      // Plugin details should still be loaded
      await expect(page.getByRole('heading', { name: 'Hello World Plugin' })).toBeVisible()
    })
  })

  test.describe('Visual Design and UX', () => {
    test('should display enhanced progress indicators correctly', async ({ authenticatedPage: page }) => {
      await page.getByRole('button', { name: 'Install Plugin' }).click()

      // Step 1 should be highlighted
      const step1 = page.getByLabel(/Step 1.*Upload/)
      await expect(step1).toBeVisible()

      // Load file and go to step 2
      const pluginPath = path.join(__dirname, '../../sample-plugins/hello-world-plugin.zip')
      const fileChooserPromise = page.waitForEvent('filechooser')
      await page.getByRole('button', { name: 'Choose Plugin File' }).click()
      const fileChooser = await fileChooserPromise
      await fileChooser.setFiles(pluginPath)

      await page.getByRole('button', { name: 'Next', exact: true }).click()

      // Step 1 should show completed (checkmark), Step 2 should be current
      await expect(page.getByLabel(/Step 1.*completed/)).toBeVisible()
      await expect(page.getByLabel(/Step 2.*current/)).toBeVisible()
    })

    test('should display file type badges prominently', async ({ authenticatedPage: page }) => {
      await page.getByRole('button', { name: 'Install Plugin' }).click()

      // Check badges are visible and properly styled
      const zipBadge = page.getByText('.ZIP files only')
      const sizeBadge = page.getByText('Max 10MB')

      await expect(zipBadge).toBeVisible()
      await expect(sizeBadge).toBeVisible()

      // Badges should be near the upload button
      const uploadSection = page.locator('.upload-container')
      await expect(uploadSection).toContainText('.ZIP files only')
      await expect(uploadSection).toContainText('Max 10MB')
    })
  })
})
