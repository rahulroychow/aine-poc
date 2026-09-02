/**
 * Express application for Aine.
 *
 * Exported separately from the bootstrap (server.js) so tests can mount it
 * without binding a port.
 */

import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST_PATH = path.join(__dirname, '..', 'dist')

/**
 * Build the Express app.
 *
 * @param {object} [options]
 * @param {string} [options.distPath] Static bundle directory. Static serving is
 *   skipped entirely when the directory does not exist (the API-only container
 *   does not ship the frontend bundle).
 * @returns {import('express').Express}
 */
export function createApp({ distPath = DIST_PATH } = {}) {
  const app = express()
  const env = () => process.env.NODE_ENV || 'development'

  app.use(cors())
  app.use(express.json())

  // ---- Health ----

  /** Liveness: the process is up. Used by Docker HEALTHCHECK. */
  app.get('/health/live', (req, res) => {
    res.status(200).json({ status: 'alive', environment: env() })
  })

  /** Readiness: the process is willing to take traffic. */
  app.get('/health/ready', (req, res) => {
    res.status(200).json({ status: 'ready', environment: env(), uptime: process.uptime() })
  })

  /** Combined health summary. */
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', environment: env(), uptime: process.uptime() })
  })

  // ---- API ----

  // The current release stores todos client-side in localStorage; this endpoint
  // reserves the route for the future server-backed implementation.
  app.get('/api/todos', (req, res) => {
    res.status(200).json({ todos: [], persistence: 'client-side' })
  })

  // ---- Static bundle (only when present) ----

  const hasBundle = fs.existsSync(distPath)

  if (hasBundle) {
    app.use(express.static(distPath))
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'))
    })
  } else {
    app.use((req, res) => {
      res.status(404).json({ error: 'Not Found', path: req.path })
    })
  }

  app.use(errorHandler)

  return app
}

/**
 * Terminal error handler. Exported so it can be mounted and asserted on
 * directly — inside createApp it sits behind the catch-all route.
 *
 * Honours `err.status` (body-parser sets 400 for malformed JSON) and only
 * leaks the underlying message in development.
 */
// eslint-disable-next-line no-unused-vars -- Express identifies error
// middleware by arity; `next` must stay in the signature.
export function errorHandler(err, req, res, next) {
  const isDev = (process.env.NODE_ENV || 'development') === 'development'
  res.status(err.status || err.statusCode || 500).json({
    error: 'Internal Server Error',
    message: isDev ? err.message : 'Something went wrong'
  })
}

export default createApp
