/**
 * Performance Testing Suite for Aine POC
 * Measures response times, load times, and resource usage
 * Uses Playwright for browser automation and metrics collection
 */

import { test, expect } from '@playwright/test'

test.describe('Performance Tests', () => {
  let metrics = {}

  test.beforeEach(async ({ page }) => {
    // Enable performance monitoring
    await page.evaluateHandle('window.localStorage.clear()')

    // Start measuring navigation
    metrics = {
      navigationStart: 0,
      pageLoad: 0,
      firstPaint: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0
    }
  })

  test('should load app within acceptable time', async ({ page }) => {
    const navigationTiming = await page.evaluate(() => {
      const perf = performance.getEntriesByType('navigation')[0]
      return {
        domInteractive: perf.domInteractive,
        domComplete: perf.domComplete,
        loadEventEnd: perf.loadEventEnd,
        navigationStart: perf.navigationStart
      }
    })

    const loadTime = navigationTiming.loadEventEnd - navigationTiming.navigationStart

    console.log(`Page Load Time: ${loadTime}ms`)

    // Expect page to load in under 3 seconds
    expect(loadTime).toBeLessThan(3000)
  })

  test('should render initial UI quickly', async ({ page }) => {
    const renderStart = Date.now()

    await page.goto('/')
    await page.waitForSelector('h1', { timeout: 5000 })

    const renderTime = Date.now() - renderStart

    console.log(`Initial Render Time: ${renderTime}ms`)

    // Expect UI to be interactive within 1.5 seconds
    expect(renderTime).toBeLessThan(1500)
  })

  test('should add todo with minimal latency', async ({ page }) => {
    await page.goto('/')

    const input = page.getByPlaceholder(/enter.*description/i)
    const button = page.getByRole('button', { name: /add/i })

    // Measure time from input to todo appearing
    const addStart = Date.now()

    await input.fill('Performance Test Todo')
    await button.click()

    await expect(page.getByText('Performance Test Todo')).toBeVisible({ timeout: 5000 })

    const addTime = Date.now() - addStart

    console.log(`Add Todo Time: ${addTime}ms`)

    // Expect add to complete in under 500ms
    expect(addTime).toBeLessThan(500)
  })

  test('should toggle todo completion quickly', async ({ page }) => {
    await page.goto('/')

    // Add a todo first
    const input = page.getByPlaceholder(/enter.*description/i)
    await input.fill('Toggle Test')
    await page.getByRole('button', { name: /add/i }).click()

    await expect(page.getByText('Toggle Test')).toBeVisible()

    // Measure toggle time
    const toggleStart = Date.now()

    const checkbox = page.locator('input[type="checkbox"]').first()
    await checkbox.click()

    await expect(page.getByText(/done/i)).toBeVisible({ timeout: 5000 })

    const toggleTime = Date.now() - toggleStart

    console.log(`Toggle Completion Time: ${toggleTime}ms`)

    // Expect toggle to complete in under 300ms
    expect(toggleTime).toBeLessThan(300)
  })

  test('should delete todo quickly', async ({ page }) => {
    await page.goto('/')

    // Add a todo
    const input = page.getByPlaceholder(/enter.*description/i)
    await input.fill('Delete Test')
    await page.getByRole('button', { name: /add/i }).click()

    await expect(page.getByText('Delete Test')).toBeVisible()

    // Measure delete time
    const deleteStart = Date.now()

    const deleteButton = page.locator('button[aria-label*="Delete"]').first()
    await deleteButton.click()

    await expect(page.getByText(/no todos yet/i)).toBeVisible({ timeout: 5000 })

    const deleteTime = Date.now() - deleteStart

    console.log(`Delete Todo Time: ${deleteTime}ms`)

    // Expect delete to complete in under 300ms
    expect(deleteTime).toBeLessThan(300)
  })

  test('should handle multiple todos without performance degradation', async ({ page }) => {
    await page.goto('/')

    const input = page.getByPlaceholder(/enter.*description/i)
    const button = page.getByRole('button', { name: /add/i })

    // Add 20 todos and measure time
    const startTimes = []
    const times = []

    for (let i = 1; i <= 20; i++) {
      const start = Date.now()
      await input.fill(`Todo ${i}`)
      await button.click()
      const elapsed = Date.now() - start
      times.push(elapsed)
      startTimes.push(start)
    }

    // Calculate statistics
    const avgTime = times.reduce((a, b) => a + b) / times.length
    const maxTime = Math.max(...times)

    console.log(`Average Add Time (20 todos): ${avgTime.toFixed(2)}ms`)
    console.log(`Max Add Time: ${maxTime}ms`)
    console.log(`Performance Trend: ${times.slice(-5).join(', ')}ms`)

    // Average should stay under 600ms even with many todos
    expect(avgTime).toBeLessThan(600)
    // No single operation should take more than 1500ms
    expect(maxTime).toBeLessThan(1500)
  })

  test('should persist todos efficiently', async ({ page }) => {
    await page.goto('/')

    // Add a few todos
    const input = page.getByPlaceholder(/enter.*description/i)
    const button = page.getByRole('button', { name: /add/i })

    for (let i = 1; i <= 5; i++) {
      await input.fill(`Persist Test ${i}`)
      await button.click()
    }

    // Measure refresh time (includes localStorage read)
    const refreshStart = Date.now()

    await page.reload()

    await expect(page.getByText('Persist Test 1')).toBeVisible({ timeout: 5000 })

    const refreshTime = Date.now() - refreshStart

    console.log(`Refresh Time (with persistence): ${refreshTime}ms`)

    // Expect refresh to complete in under 2 seconds
    expect(refreshTime).toBeLessThan(2000)
  })

  test('should measure memory usage (browser metrics)', async ({ page }) => {
    await page.goto('/')

    const memoryMetrics = await page.evaluate(() => {
      if (performance.memory) {
        return {
          jsHeapSizeLimit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2),
          totalJSHeapSize: (performance.memory.totalJSHeapSize / 1048576).toFixed(2),
          usedJSHeapSize: (performance.memory.usedJSHeapSize / 1048576).toFixed(2)
        }
      }
      return null
    })

    if (memoryMetrics) {
      console.log(`Memory Usage:
        Heap Limit: ${memoryMetrics.jsHeapSizeLimit} MB
        Total Heap: ${memoryMetrics.totalJSHeapSize} MB
        Used Heap: ${memoryMetrics.usedJSHeapSize} MB
      `)

      // Heap usage should be reasonable
      const usedMB = parseFloat(memoryMetrics.usedJSHeapSize)
      expect(usedMB).toBeLessThan(50) // Less than 50 MB
    }
  })

  test('should measure First Contentful Paint (FCP)', async ({ page }) => {
    const navigationStart = Date.now()

    await page.goto('/')

    const paintMetrics = await page.evaluate(() => {
      const paintEntries = performance.getEntriesByType('paint')
      return paintEntries.reduce((acc, entry) => {
        acc[entry.name] = Math.round(entry.startTime)
        return acc
      }, {})
    })

    if (paintMetrics['first-paint']) {
      console.log(`First Paint: ${paintMetrics['first-paint']}ms`)
      expect(paintMetrics['first-paint']).toBeLessThan(1000)
    }

    if (paintMetrics['first-contentful-paint']) {
      console.log(`First Contentful Paint: ${paintMetrics['first-contentful-paint']}ms`)
      expect(paintMetrics['first-contentful-paint']).toBeLessThan(1500)
    }
  })

  test('should measure Core Web Vitals', async ({ page }) => {
    await page.goto('/')

    const cwvMetrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        let metrics = {}

        // Largest Contentful Paint
        if ('PerformanceObserver' in window) {
          try {
            const observer = new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                if (entry.name === 'largest-contentful-paint') {
                  metrics.lcp = Math.round(entry.startTime)
                }
              }
            })
            observer.observe({ type: 'largest-contentful-paint', buffered: true })

            // Cumulative Layout Shift
            const clsObserver = new PerformanceObserver((list) => {
              let cls = 0
              for (const entry of list.getEntries()) {
                if (!entry.hadRecentInput) {
                  cls += entry.value
                }
              }
              metrics.cls = Math.round(cls * 1000) / 1000
            })
            clsObserver.observe({ type: 'layout-shift', buffered: true })

            setTimeout(() => resolve(metrics), 1000)
          } catch (e) {
            resolve(metrics)
          }
        } else {
          resolve(metrics)
        }
      })
    })

    if (cwvMetrics.lcp) {
      console.log(`Largest Contentful Paint: ${cwvMetrics.lcp}ms`)
      expect(cwvMetrics.lcp).toBeLessThan(2500) // Good: < 2.5s
    }

    if (cwvMetrics.cls !== undefined) {
      console.log(`Cumulative Layout Shift: ${cwvMetrics.cls}`)
      expect(cwvMetrics.cls).toBeLessThan(0.1) // Good: < 0.1
    }
  })

  test.afterEach(({ page }) => {
    console.log('---')
  })
})
