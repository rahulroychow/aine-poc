import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  test: {
    // Two projects: the React app needs jsdom, the Express app needs node.
    // e2e/ belongs to Playwright and is deliberately absent from both.
    projects: [
      {
        plugins: [react()],
        test: {
          name: 'client',
          environment: 'jsdom',
          globals: true,
          setupFiles: ['./src/test/setup.js'],
          include: ['src/**/*.test.{js,jsx}']
        }
      },
      {
        test: {
          name: 'server',
          environment: 'node',
          globals: true,
          include: ['server/**/*.test.js']
        }
      }
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{js,jsx}', 'server/**/*.js'],
      exclude: [
        'src/main.jsx', // DOM bootstrap: mounts React, no branching logic
        'server/server.js', // port bootstrap: the behaviour lives in app.js
        'src/test/**',
        '**/*.test.{js,jsx}'
      ],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100
      }
    }
  }
})
