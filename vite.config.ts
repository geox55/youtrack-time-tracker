/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts'],
    testTimeout: 5000,
    forks: { maxForks: 2 },
    coverage: {
      provider: 'v8',
      include: [
        'src/shared/lib/**/*.ts',
        'src/shared/api/**/*.ts',
      ],
      exclude: [
        'src/**/__tests__/**',
        'src/**/index.ts',
      ],
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api/youtrack': {
        target: 'https://youtrack.infra.gbooking.ru',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/api\/youtrack/, '/api'),
        secure: true,
        headers: {
          'Referrer-Policy': 'no-referrer-when-downgrade'
        }
      },
      '/api/toggl': {
        target: 'https://api.track.toggl.com/api/v9',
        changeOrigin: true,
        secure: true,
        rewrite: (path: string) => path.replace(/^\/api\/toggl/, '/api'),
        headers: {
          'Referrer-Policy': 'no-referrer-when-downgrade'
        }
      }
    },
  }
})
