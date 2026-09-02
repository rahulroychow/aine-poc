import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { __resetStore } from '../api/todoApi.js'

/**
 * A localStorage double that actually stores, so persistence behaviour can be
 * asserted. `setItem` is a spy, letting tests force QuotaExceededError and
 * friends via mockImplementationOnce.
 */
export function createLocalStorageMock() {
  let data = {}

  return {
    getItem: vi.fn((key) => (key in data ? data[key] : null)),
    setItem: vi.fn((key, value) => {
      data[key] = String(value)
    }),
    removeItem: vi.fn((key) => {
      delete data[key]
    }),
    clear: vi.fn(() => {
      data = {}
    }),
    key: vi.fn((index) => Object.keys(data)[index] ?? null),
    get length() {
      return Object.keys(data).length
    }
  }
}

Object.defineProperty(window, 'localStorage', {
  value: createLocalStorageMock(),
  writable: true,
  configurable: true
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  vi.restoreAllMocks()
  // Reinstall a clean mock: restoreAllMocks strips the vi.fn wrappers above.
  Object.defineProperty(window, 'localStorage', {
    value: createLocalStorageMock(),
    writable: true,
    configurable: true
  })
  __resetStore()
})
