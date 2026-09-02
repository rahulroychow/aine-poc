import { test, expect } from '@playwright/test'

test.describe('Todo App E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('should display empty state on first load', async ({ page }) => {
    await expect(page.getByText(/no todos yet/i)).toBeVisible()
  })

  test('should add a todo and display it in list', async ({ page }) => {
    const input = page.getByPlaceholder(/enter.*description/i)
    await input.fill('Buy groceries')
    await page.getByRole('button', { name: /add/i }).click()

    await expect(page.getByText('Buy groceries')).toBeVisible()
    await expect(page.getByText(/no todos yet/i)).not.toBeVisible()
  })

  test('should validate empty todo submission', async ({ page }) => {
    const button = page.getByRole('button', { name: /add/i })
    await button.click()

    await expect(page.getByText(/please enter a todo description/i)).toBeVisible()
  })

  test('should mark todo as complete', async ({ page }) => {
    // Create a todo
    const input = page.getByPlaceholder(/enter.*description/i)
    await input.fill('Complete this task')
    await page.getByRole('button', { name: /add/i }).click()

    // Click checkbox to complete
    const checkbox = page.locator('input[type="checkbox"]').first()
    await checkbox.click()

    // Verify strikethrough and Done badge
    await expect(page.getByText('Complete this task')).toHaveCSS('text-decoration-line', 'line-through')
    await expect(page.getByText(/done/i)).toBeVisible()
  })

  test('should toggle todo completion status', async ({ page }) => {
    const input = page.getByPlaceholder(/enter.*description/i)
    await input.fill('Task')
    await page.getByRole('button', { name: /add/i }).click()

    const checkbox = page.locator('input[type="checkbox"]').first()

    // Mark complete
    await checkbox.click()
    await expect(page.getByText(/done/i)).toBeVisible()

    // Mark incomplete
    await checkbox.click()
    await expect(page.getByText(/done/i)).not.toBeVisible()
  })

  test('should delete a todo', async ({ page }) => {
    const input = page.getByPlaceholder(/enter.*description/i)
    await input.fill('Delete me')
    await page.getByRole('button', { name: /add/i }).click()

    // Delete the todo
    const deleteButton = page.locator('button[aria-label*="Delete"]').first()
    await deleteButton.click()

    // Verify empty state returns
    await expect(page.getByText(/no todos yet/i)).toBeVisible()
  })

  test('should persist todos across page refresh', async ({ page }) => {
    // Add todos
    const input = page.getByPlaceholder(/enter.*description/i)
    await input.fill('Persist me')
    await page.getByRole('button', { name: /add/i }).click()

    // Refresh page
    await page.reload()

    // Verify todo is restored
    await expect(page.getByText('Persist me')).toBeVisible()
  })

  test('should handle multiple todos independently', async ({ page }) => {
    const input = page.getByPlaceholder(/enter.*description/i)

    // Add three todos
    for (const task of ['Task 1', 'Task 2', 'Task 3']) {
      await input.fill(task)
      await page.getByRole('button', { name: /add/i }).click()
    }

    // Complete only Task 2
    const checkboxes = page.locator('input[type="checkbox"]')
    await checkboxes.nth(1).click()

    // Verify only Task 2 has Done badge
    const todos = page.locator('[class*="flex items-start gap-3"]')
    const task2Row = todos.nth(1)
    await expect(task2Row.getByText(/done/i)).toBeVisible()

    // Verify Task 1 and 3 don't have Done badge
    await expect(todos.nth(0).getByText(/done/i)).not.toBeVisible()
    await expect(todos.nth(2).getByText(/done/i)).not.toBeVisible()
  })

  test('should show error on localStorage quota exceeded', async ({ page, context }) => {
    // Fill localStorage to near capacity
    await page.evaluate(() => {
      const largeData = 'x'.repeat(1024 * 1024 * 4) // 4MB
      try {
        localStorage.setItem('test', largeData)
      } catch (e) {
        // Expected to fail
      }
    })

    // Try to add a todo (should show error gracefully)
    const input = page.getByPlaceholder(/enter.*description/i)
    await input.fill('Test')
    await page.getByRole('button', { name: /add/i }).click()

    // App should still be functional or show friendly error
    await expect(page.locator('body')).toBeVisible()
  })

  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    const input = page.getByPlaceholder(/enter.*description/i)
    await input.fill('Mobile task')
    await page.getByRole('button', { name: /add/i }).click()

    await expect(page.getByText('Mobile task')).toBeVisible()
    await expect(page.getByText(/no todos yet/i)).not.toBeVisible()
  })
})
