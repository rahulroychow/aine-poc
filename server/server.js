/**
 * Bootstrap: bind the Express app to a port and handle graceful shutdown.
 * Excluded from coverage — the app itself is covered via server/app.js.
 */

import { createApp } from './app.js'

const PORT = process.env.PORT || 5000
const app = createApp()

const server = app.listen(PORT, () => {
  console.log(`Aine server listening on :${PORT} (${process.env.NODE_ENV || 'development'})`)
  console.log(`  health: http://localhost:${PORT}/health`)
})

const shutdown = (signal) => () => {
  console.log(`${signal} received, closing server`)
  server.close(() => process.exit(0))
}

process.on('SIGTERM', shutdown('SIGTERM'))
process.on('SIGINT', shutdown('SIGINT'))

export default server
