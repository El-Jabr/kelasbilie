import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['./tests/setup.ts'],
    alias: {
      '~': path.resolve(import.meta.dirname, './'),
      '@': path.resolve(import.meta.dirname, './'),
      '~~': path.resolve(import.meta.dirname, './')
    }
  }
})
