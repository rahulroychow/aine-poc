import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import request from 'supertest'
import express from 'express'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { createApp, errorHandler } from './app.js'

const originalEnv = process.env.NODE_ENV

afterEach(() => {
  process.env.NODE_ENV = originalEnv
})

/** A temp dir standing in for a built frontend bundle. */
const makeBundle = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aine-dist-'))
  fs.writeFileSync(path.join(dir, 'index.html'), '<!doctype html><title>Aine</title>')
  fs.writeFileSync(path.join(dir, 'app.js'), 'console.log("bundle")')
  return dir
}

describe('health endpoints', () => {
  let app

  beforeEach(() => {
    app = createApp({ distPath: '/nonexistent' })
  })

  it('GET /health/live reports the process is alive', async () => {
    const res = await request(app).get('/health/live')

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('alive')
  })

  it('GET /health/ready reports readiness with uptime', async () => {
    const res = await request(app).get('/health/ready')

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ready')
    expect(typeof res.body.uptime).toBe('number')
  })

  it('GET /health reports the combined summary', async () => {
    const res = await request(app).get('/health')

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
    expect(typeof res.body.uptime).toBe('number')
  })

  it('reports the configured environment', async () => {
    process.env.NODE_ENV = 'production'

    const res = await request(createApp({ distPath: '/nonexistent' })).get('/health')

    expect(res.body.environment).toBe('production')
  })

  it('falls back to development when NODE_ENV is unset', async () => {
    delete process.env.NODE_ENV

    const res = await request(createApp({ distPath: '/nonexistent' })).get('/health')

    expect(res.body.environment).toBe('development')
  })
})

describe('GET /api/todos', () => {
  it('reports that persistence is client-side for this release', async () => {
    const res = await request(createApp({ distPath: '/nonexistent' })).get('/api/todos')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ todos: [], persistence: 'client-side' })
  })
})

describe('without a frontend bundle', () => {
  it('returns a JSON 404 for unknown routes', async () => {
    const res = await request(createApp({ distPath: '/nonexistent' })).get('/some/page')

    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: 'Not Found', path: '/some/page' })
  })

  it('still serves the health endpoints', async () => {
    const res = await request(createApp({ distPath: '/nonexistent' })).get('/health')

    expect(res.status).toBe(200)
  })
})

describe('with a frontend bundle', () => {
  let distPath
  let app

  beforeEach(() => {
    distPath = makeBundle()
    app = createApp({ distPath })
  })

  afterEach(() => {
    fs.rmSync(distPath, { recursive: true, force: true })
  })

  it('serves static assets', async () => {
    const res = await request(app).get('/app.js')

    expect(res.status).toBe(200)
    expect(res.text).toContain('bundle')
  })

  it('serves index.html at the root', async () => {
    const res = await request(app).get('/')

    expect(res.status).toBe(200)
    expect(res.text).toContain('Aine')
  })

  it('falls back to index.html for client-side routes', async () => {
    const res = await request(app).get('/deep/client/route')

    expect(res.status).toBe(200)
    expect(res.text).toContain('Aine')
  })

  it('keeps API routes ahead of the SPA fallback', async () => {
    const res = await request(app).get('/api/todos')

    expect(res.body.persistence).toBe('client-side')
  })
})

describe('errorHandler', () => {
  /** A minimal app whose only route throws, terminated by the real handler. */
  const appThatThrows = (error) => {
    const app = express()
    app.get('/boom', () => { throw error })
    app.use(errorHandler)
    return app
  }

  it('returns 500 and hides the detail outside development', async () => {
    process.env.NODE_ENV = 'production'

    const res = await request(appThatThrows(new Error('detailed internals'))).get('/boom')

    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Internal Server Error', message: 'Something went wrong' })
  })

  it('includes the underlying message in development', async () => {
    process.env.NODE_ENV = 'development'

    const res = await request(appThatThrows(new Error('detailed internals'))).get('/boom')

    expect(res.status).toBe(500)
    expect(res.body.message).toBe('detailed internals')
  })

  it('treats an unset NODE_ENV as development', async () => {
    delete process.env.NODE_ENV

    const res = await request(appThatThrows(new Error('detailed internals'))).get('/boom')

    expect(res.body.message).toBe('detailed internals')
  })

  it('honours err.status', async () => {
    const res = await request(appThatThrows(Object.assign(new Error('bad'), { status: 400 })))
      .get('/boom')

    expect(res.status).toBe(400)
  })

  it('honours err.statusCode when status is absent', async () => {
    const res = await request(appThatThrows(Object.assign(new Error('nope'), { statusCode: 422 })))
      .get('/boom')

    expect(res.status).toBe(422)
  })

  it('surfaces a malformed JSON body as a 400 through the real app', async () => {
    const res = await request(createApp({ distPath: '/nonexistent' }))
      .post('/api/todos')
      .set('Content-Type', 'application/json')
      .send('{not json')

    expect(res.status).toBe(400)
  })
})

describe('createApp defaults', () => {
  it('resolves a dist path relative to the server directory when none is given', () => {
    const spy = vi.spyOn(fs, 'existsSync')

    createApp()

    expect(spy).toHaveBeenCalledWith(expect.stringContaining('dist'))
    spy.mockRestore()
  })
})
