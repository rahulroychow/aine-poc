import { describe, it, expect } from 'vitest'
import { generateId } from './generateId.js'

describe('generateId', () => {
  it('returns a string', () => {
    expect(typeof generateId()).toBe('string')
  })

  it('returns a distinct value on every call', () => {
    const ids = Array.from({ length: 500 }, generateId)
    expect(new Set(ids).size).toBe(500)
  })

  it('matches the UUID v4 shape', () => {
    // Version nibble pinned to 4, variant nibble to 8/9/a/b.
    const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    for (let i = 0; i < 100; i++) {
      expect(generateId()).toMatch(uuidV4)
    }
  })
})
