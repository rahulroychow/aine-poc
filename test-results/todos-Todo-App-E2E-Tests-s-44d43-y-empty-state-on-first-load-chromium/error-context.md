# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: todos.spec.js >> Todo App E2E Tests >> should display empty state on first load
- Location: e2e/todos.spec.js:10:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/no todos yet/i)
Expected: visible
Error: strict mode violation: getByText(/no todos yet/i) resolved to 2 elements:
    1) <h3 class="text-lg font-medium text-gray-900 mb-2">No todos yet</h3> aka getByRole('heading', { name: 'No todos yet' })
    2) <p class="text-gray-600">No todos yet. Create one to get started.</p> aka getByText('No todos yet. Create one to')

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/no todos yet/i)

```

# Page snapshot

```yaml
- generic [ref=f1e4]:
  - banner [ref=f1e5]:
    - heading "My Todos" [level=1] [ref=f1e6]
    - paragraph [ref=f1e7]: Organize and track your tasks
  - main [ref=f1e8]:
    - generic [ref=f1e10]:
      - generic [ref=f1e11]:
        - textbox "Todo description" [ref=f1e12]:
          - /placeholder: Add a new todo...
        - generic [ref=f1e13]: 0/500
      - button "Add todo" [ref=f1e15] [cursor=pointer]: Add
    - generic [ref=f1e17]:
      - heading "No todos yet" [level=3] [ref=f1e20]
      - paragraph [ref=f1e21]: No todos yet. Create one to get started.
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test'
  2   | 
  3   | test.describe('Todo App E2E Tests', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     await page.goto('/')
  6   |     await page.evaluate(() => localStorage.clear())
  7   |     await page.reload()
  8   |   })
  9   | 
  10  |   test('should display empty state on first load', async ({ page }) => {
> 11  |     await expect(page.getByText(/no todos yet/i)).toBeVisible()
      |                                                   ^ Error: expect(locator).toBeVisible() failed
  12  |   })
  13  | 
  14  |   test('should add a todo and display it in list', async ({ page }) => {
  15  |     const input = page.getByPlaceholder(/enter.*description/i)
  16  |     await input.fill('Buy groceries')
  17  |     await page.getByRole('button', { name: /add/i }).click()
  18  | 
  19  |     await expect(page.getByText('Buy groceries')).toBeVisible()
  20  |     await expect(page.getByText(/no todos yet/i)).not.toBeVisible()
  21  |   })
  22  | 
  23  |   test('should validate empty todo submission', async ({ page }) => {
  24  |     const button = page.getByRole('button', { name: /add/i })
  25  |     await button.click()
  26  | 
  27  |     await expect(page.getByText(/please enter a todo description/i)).toBeVisible()
  28  |   })
  29  | 
  30  |   test('should mark todo as complete', async ({ page }) => {
  31  |     // Create a todo
  32  |     const input = page.getByPlaceholder(/enter.*description/i)
  33  |     await input.fill('Complete this task')
  34  |     await page.getByRole('button', { name: /add/i }).click()
  35  | 
  36  |     // Click checkbox to complete
  37  |     const checkbox = page.locator('input[type="checkbox"]').first()
  38  |     await checkbox.click()
  39  | 
  40  |     // Verify strikethrough and Done badge
  41  |     await expect(page.getByText('Complete this task')).toHaveCSS('text-decoration-line', 'line-through')
  42  |     await expect(page.getByText(/done/i)).toBeVisible()
  43  |   })
  44  | 
  45  |   test('should toggle todo completion status', async ({ page }) => {
  46  |     const input = page.getByPlaceholder(/enter.*description/i)
  47  |     await input.fill('Task')
  48  |     await page.getByRole('button', { name: /add/i }).click()
  49  | 
  50  |     const checkbox = page.locator('input[type="checkbox"]').first()
  51  | 
  52  |     // Mark complete
  53  |     await checkbox.click()
  54  |     await expect(page.getByText(/done/i)).toBeVisible()
  55  | 
  56  |     // Mark incomplete
  57  |     await checkbox.click()
  58  |     await expect(page.getByText(/done/i)).not.toBeVisible()
  59  |   })
  60  | 
  61  |   test('should delete a todo', async ({ page }) => {
  62  |     const input = page.getByPlaceholder(/enter.*description/i)
  63  |     await input.fill('Delete me')
  64  |     await page.getByRole('button', { name: /add/i }).click()
  65  | 
  66  |     // Delete the todo
  67  |     const deleteButton = page.locator('button[aria-label*="Delete"]').first()
  68  |     await deleteButton.click()
  69  | 
  70  |     // Verify empty state returns
  71  |     await expect(page.getByText(/no todos yet/i)).toBeVisible()
  72  |   })
  73  | 
  74  |   test('should persist todos across page refresh', async ({ page }) => {
  75  |     // Add todos
  76  |     const input = page.getByPlaceholder(/enter.*description/i)
  77  |     await input.fill('Persist me')
  78  |     await page.getByRole('button', { name: /add/i }).click()
  79  | 
  80  |     // Refresh page
  81  |     await page.reload()
  82  | 
  83  |     // Verify todo is restored
  84  |     await expect(page.getByText('Persist me')).toBeVisible()
  85  |   })
  86  | 
  87  |   test('should handle multiple todos independently', async ({ page }) => {
  88  |     const input = page.getByPlaceholder(/enter.*description/i)
  89  | 
  90  |     // Add three todos
  91  |     for (const task of ['Task 1', 'Task 2', 'Task 3']) {
  92  |       await input.fill(task)
  93  |       await page.getByRole('button', { name: /add/i }).click()
  94  |     }
  95  | 
  96  |     // Complete only Task 2
  97  |     const checkboxes = page.locator('input[type="checkbox"]')
  98  |     await checkboxes.nth(1).click()
  99  | 
  100 |     // Verify only Task 2 has Done badge
  101 |     const todos = page.locator('[class*="flex items-start gap-3"]')
  102 |     const task2Row = todos.nth(1)
  103 |     await expect(task2Row.getByText(/done/i)).toBeVisible()
  104 | 
  105 |     // Verify Task 1 and 3 don't have Done badge
  106 |     await expect(todos.nth(0).getByText(/done/i)).not.toBeVisible()
  107 |     await expect(todos.nth(2).getByText(/done/i)).not.toBeVisible()
  108 |   })
  109 | 
  110 |   test('should show error on localStorage quota exceeded', async ({ page, context }) => {
  111 |     // Fill localStorage to near capacity
```