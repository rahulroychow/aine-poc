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

// Cleanup after each test
afterEach(() => {
  cleanup()
  if (global.localStorage && global.localStorage.clear) {
    global.localStorage.clear()
  }
})
