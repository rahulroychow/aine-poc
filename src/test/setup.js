import '@testing-library/jest-dom'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Mock localStorage for tests
global.localStorage = {
  getItem: (key) => null,
  setItem: (key, value) => {},
  removeItem: (key) => {},
  clear: () => {},
  key: (index) => null,
  length: 0
}

// Mock window for tests
if (typeof window !== 'undefined') {
  window.__todoStore = []
}

// Cleanup after each test
afterEach(() => {
  cleanup()
  if (global.localStorage && global.localStorage.clear) {
    global.localStorage.clear()
  }
  // Clear in-memory todo store
  if (typeof window !== 'undefined') {
    window.__todoStore = []
  }
})
