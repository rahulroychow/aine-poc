import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * Automated WCAG 2.1 A/AA audit via axe-core.
 *
 * Scope note: axe catches roughly a third to a half of WCAG issues. A clean run
 * here means no *automatically detectable* violation — it is not a conformance
 * claim. Judgement-based criteria (focus order, meaningful sequence, error
 * suggestion quality, reflow at 320px) still need a manual pass.
 *
 * Every reachable UI state is audited, because a violation can hide in a state
 * the default page never renders — the validation error, the completed row and
 * the in-flight button all have their own markup.
 */

const WCAG_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

const input = (page) => page.getByRole('textbox', { name: 'Todo description' })
const addButton = (page) => page.getByRole('button', { name: 'Add todo' })

const audit = (page) => new AxeBuilder({ page }).withTags(WCAG_AA).analyze()

/** Report the rule id and target alongside the count, so a failure is actionable. */
function formatViolations(violations) {
  return violations
    .map((v) => {
      const targets = v.nodes.map((n) => `      ${n.target.join(' ')}`).join('\n')
      return `  [${v.impact}] ${v.id}: ${v.help}\n${targets}`
    })
    .join('\n')
}

async function expectNoViolations(page) {
  const { violations } = await audit(page)
  expect(violations, `\n${formatViolations(violations)}\n`).toEqual([])
}

async function addTodo(page, description) {
  await input(page).fill(description)
  await addButton(page).click()
  await expect(page.getByRole('heading', { name: description })).toBeVisible()
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()
  await expect(page.getByRole('heading', { name: 'No todos yet' })).toBeVisible()
})

test('empty state has no WCAG A/AA violations', async ({ page }) => {
  await expectNoViolations(page)
})

test('populated list has no WCAG A/AA violations', async ({ page }) => {
  await addTodo(page, 'Buy groceries')
  await addTodo(page, 'Walk the dog')

  await expectNoViolations(page)
})

test('completed todo has no WCAG A/AA violations', async ({ page }) => {
  await addTodo(page, 'Finished task')
  await page.getByRole('checkbox', { name: 'Mark "Finished task" as complete' }).check()
  await expect(page.getByText('Done', { exact: true })).toBeVisible()

  await expectNoViolations(page)
})

test('mixed complete and active todos have no WCAG A/AA violations', async ({ page }) => {
  await addTodo(page, 'Active task')
  await addTodo(page, 'Completed task')
  await page.getByRole('checkbox', { name: 'Mark "Completed task" as complete' }).check()
  await expect(page.getByText('Done', { exact: true })).toBeVisible()

  await expectNoViolations(page)
})

test('validation error state has no WCAG A/AA violations', async ({ page }) => {
  await addButton(page).click()
  await expect(page.getByRole('alert')).toBeVisible()

  await expectNoViolations(page)
})

test('mobile viewport has no WCAG A/AA violations', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await addTodo(page, 'Mobile task')

  await expectNoViolations(page)
})

test('narrowest supported viewport has no WCAG A/AA violations', async ({ page }) => {
  // WCAG 1.4.10 Reflow is specified at 320 CSS px.
  await page.setViewportSize({ width: 320, height: 568 })
  await addTodo(page, 'A deliberately long todo description to force wrapping')

  await expectNoViolations(page)
})

test('content reflows at 320px without horizontal scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await addTodo(page, 'A deliberately long todo description to force wrapping')

  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  )
  expect(overflows).toBe(false)
})

test('every interactive control is reachable by keyboard', async ({ page, browserName }) => {
  await addTodo(page, 'Keyboard task')

  // Reload so sequential focus navigation starts from the top of the
  // document. Blurring is not enough: browsers keep the navigation starting
  // point at the last click, so tabbing would resume mid-page. The todo
  // survives the reload via localStorage.
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Keyboard task' })).toBeVisible()

  // macOS WebKit traverses buttons and checkboxes with Option+Tab; plain Tab
  // only reaches text fields (Safari's "Press Tab to highlight" default).
  const tabKey = browserName === 'webkit' ? 'Alt+Tab' : 'Tab'

  const reached = []
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press(tabKey)
    reached.push(
      await page.evaluate(() => {
        const el = document.activeElement
        if (!el || el === document.body) return null
        return el.getAttribute('aria-label') || el.textContent?.trim() || el.tagName
      })
    )
  }

  expect(reached).toEqual([
    'Todo description',
    'Add todo',
    'Mark "Keyboard task" as complete',
    'Delete "Keyboard task"'
  ])
})

test('focused controls have a visible focus indicator', async ({ page }) => {
  await addTodo(page, 'Focus task')

  for (const control of [
    page.getByRole('textbox', { name: 'Todo description' }),
    page.getByRole('button', { name: 'Add todo' }),
    page.getByRole('checkbox', { name: 'Mark "Focus task" as complete' }),
    page.getByRole('button', { name: 'Delete "Focus task"' })
  ]) {
    await control.focus()

    const indicator = await control.evaluate((el) => {
      const s = getComputedStyle(el)
      return {
        outlineWidth: parseFloat(s.outlineWidth) || 0,
        outlineStyle: s.outlineStyle,
        boxShadow: s.boxShadow
      }
    })

    const hasOutline = indicator.outlineWidth > 0 && indicator.outlineStyle !== 'none'
    const hasRing = indicator.boxShadow !== 'none' && indicator.boxShadow !== ''
    expect(hasOutline || hasRing, `no focus indicator on ${await control.getAttribute('aria-label')}`)
      .toBe(true)
  }
})
