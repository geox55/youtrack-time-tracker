import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
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
        },
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
      '/api/toggl': {
        target: 'https://api.track.toggl.com/api/v9',
        changeOrigin: true,
        secure: true,
        rewrite: (path: string) => path.replace(/^\/api\/toggl/, '/api'),
        headers: {
          'Referrer-Policy': 'no-referrer-when-downgrade'
        },
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('toggl proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Toggl Request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Toggl Response:', proxyRes.statusCode, req.url);
          });
        }
      }
    },
  }
})
