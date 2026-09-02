import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react({ jsxImportSource: 'react' })],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    exclude: ['e2e/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/main.jsx', 'src/test/**', '**/__tests__/**'],
      lines: 70,
      functions: 70,
      branches: 70,
      statements: 70
    },
    transformMode: {
      web: [/.[jt]sx?$/]
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  esbuild: {
    include: /src\/.*\.jsx?$/,
    exclude: []
  }
})
