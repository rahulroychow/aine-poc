import { test, expect } from '@playwright/test'

/**
 * End-to-end coverage of the core todo journeys against a real browser.
 *
 * Selectors go through accessible roles and names rather than CSS classes, so
 * they survive styling changes and assert the accessibility tree at the same
 * time.
 */

const input = (page) => page.getByRole('textbox', { name: 'Todo description' })
const addButton = (page) => page.getByRole('button', { name: 'Add todo' })
// The empty state renders the phrase twice (heading + body copy); target the heading.
const emptyState = (page) => page.getByRole('heading', { name: 'No todos yet' })
// Exact match: a todo whose text contains "done" would otherwise match too.
const doneBadge = (page) => page.getByText('Done', { exact: true })

async function addTodo(page, description) {
  await input(page).fill(description)
  await addButton(page).click()
  await expect(page.getByRole('heading', { name: description })).toBeVisible()
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()
  await expect(emptyState(page)).toBeVisible()
})

test('shows the empty state on first load', async ({ page }) => {
  await expect(emptyState(page)).toBeVisible()
  await expect(page.getByText('No todos yet. Create one to get started.')).toBeVisible()
})

test('adds a todo and lists it', async ({ page }) => {
  await addTodo(page, 'Buy groceries')

  await expect(emptyState(page)).toBeHidden()
})

test('rejects an empty submission', async ({ page }) => {
  await addButton(page).click()

  await expect(page.getByRole('alert')).toHaveText('Please enter a todo description')
  await expect(emptyState(page)).toBeVisible()
})

test('rejects a whitespace-only submission', async ({ page }) => {
  await input(page).fill('   ')
  await addButton(page).click()

  await expect(page.getByRole('alert')).toBeVisible()
  await expect(emptyState(page)).toBeVisible()
})

test('adds a todo with the Enter key', async ({ page }) => {
  await input(page).fill('Via keyboard')
  await input(page).press('Enter')

  await expect(page.getByRole('heading', { name: 'Via keyboard' })).toBeVisible()
})

test('marks a todo complete', async ({ page }) => {
  await addTodo(page, 'Complete this task')

  await page.getByRole('checkbox', { name: 'Mark "Complete this task" as complete' }).check()

  await expect(doneBadge(page)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Complete this task' }))
    .toHaveCSS('text-decoration-line', 'line-through')
})

test('toggles a todo back to active', async ({ page }) => {
  await addTodo(page, 'Task')
  const checkbox = page.getByRole('checkbox', { name: 'Mark "Task" as complete' })

  await checkbox.check()
  await expect(doneBadge(page)).toBeVisible()

  await checkbox.uncheck()
  await expect(doneBadge(page)).toBeHidden()
})

test('deletes a todo', async ({ page }) => {
  await addTodo(page, 'Delete me')

  await page.getByRole('button', { name: 'Delete "Delete me"' }).click()

  await expect(emptyState(page)).toBeVisible()
})

test('keeps todos across a page reload', async ({ page }) => {
  await addTodo(page, 'Persist me')

  await page.reload()

  await expect(page.getByRole('heading', { name: 'Persist me' })).toBeVisible()
})

test('keeps completion state across a page reload', async ({ page }) => {
  await addTodo(page, 'Stay done')
  await page.getByRole('checkbox', { name: 'Mark "Stay done" as complete' }).check()
  await expect(doneBadge(page)).toBeVisible()

  await page.reload()

  await expect(doneBadge(page)).toBeVisible()
  await expect(page.getByRole('checkbox', { name: 'Mark "Stay done" as complete' })).toBeChecked()
})

test('tracks several todos independently', async ({ page }) => {
  await addTodo(page, 'Task 1')
  await addTodo(page, 'Task 2')
  await addTodo(page, 'Task 3')

  await page.getByRole('checkbox', { name: 'Mark "Task 2" as complete' }).check()

  await expect(doneBadge(page)).toHaveCount(1)
  await expect(page.getByRole('checkbox', { name: 'Mark "Task 1" as complete' })).not.toBeChecked()
  await expect(page.getByRole('checkbox', { name: 'Mark "Task 3" as complete' })).not.toBeChecked()
})

test('lists the newest todo first', async ({ page }) => {
  await addTodo(page, 'Older')
  await addTodo(page, 'Newer')

  await expect(page.getByRole('heading', { level: 2 })).toHaveText(['Newer', 'Older'])
})

test('works on a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })

  await addTodo(page, 'Mobile task')

  await expect(emptyState(page)).toBeHidden()
  // The layout must not force horizontal scrolling.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  )
  expect(overflow).toBe(false)
})
