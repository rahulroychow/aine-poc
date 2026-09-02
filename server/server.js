/**
 * Simple Express server for Aine POC
 * - Serves API endpoints for todos (can be extended later)
 * - Provides health check endpoint
 * - Serves static frontend (optional fallback)
 */

import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 5000
const NODE_ENV = process.env.NODE_ENV || 'development'

// ===== Middleware =====
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ===== Health Check Endpoints =====

/**
 * Liveness probe: Is the server running?
 * Used by Docker and orchestration tools
 */
app.get('/health/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
  })
})

/**
 * Readiness probe: Is the server ready to handle requests?
 * Can be extended to check database connectivity, etc.
 */
app.get('/health/ready', (req, res) => {
  res.status(200).json({
    status: 'ready',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    uptime: process.uptime(),
  })
})

/**
 * Combined health check (Docker HEALTHCHECK compatible)
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
  })
})

// ===== API Routes (Future extensibility) =====

/**
 * TODO API endpoints would go here
 * Example structure:
 * - GET /api/todos
 * - POST /api/todos
 * - PUT /api/todos/:id
 * - DELETE /api/todos/:id
 */

app.get('/api/todos', (req, res) => {
  res.json({
    message: 'Todo API endpoint available',
    note: 'Current version uses client-side localStorage',
  })
})

// ===== Static File Serving (optional) =====

// Serve static files from dist directory if available
const distPath = path.join(__dirname, '../dist')
app.use(express.static(distPath))

// SPA fallback: serve index.html for all unmatched routes
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      res.status(500).json({
        error: 'Could not serve index.html',
        message: err.message,
      })
    }
  })
})

// ===== Error Handling =====

app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({
    error: 'Internal Server Error',
    message: NODE_ENV === 'development' ? err.message : 'Something went wrong',
  })
})

// ===== Server Startup =====

const server = app.listen(PORT, () => {
  console.log(`
    🚀 Aine POC Server
    ==================
    Environment: ${NODE_ENV}
    Port: ${PORT}
    URL: http://localhost:${PORT}

    Health Checks:
    - Liveness:  http://localhost:${PORT}/health/live
    - Readiness: http://localhost:${PORT}/health/ready
    - Combined:  http://localhost:${PORT}/health
  `)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

export default app
