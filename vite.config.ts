import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
 plugins: [react(), tailwindcss()],
 server: {
 headers: {
 'Cache-Control': 'no-store',
 'X-Content-Type-Options': 'nosniff',
 'X-Frame-Options': 'DENY',
 'Referrer-Policy': 'no-referrer',
 'Content-Security-Policy': [
 "default-src 'self'",
 "script-src 'self' 'unsafe-inline'",
 "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
 "font-src 'self' https://fonts.gstatic.com",
 "img-src 'self' data: blob:",
 "connect-src 'self' http://localhost:8642 http://localhost:8643 http://localhost:8644 ws:",
 "frame-ancestors 'none'",
 ].join('; '),
 },
  proxy: {
  '/api': 'http://127.0.0.1:8642',
  '/health': 'http://127.0.0.1:8642',
  '/v1': 'http://127.0.0.1:8642',
  '/obsidian-api': {
  target: 'http://127.0.0.1:8643',
  rewrite: (path) => path.replace(/^\/obsidian-api/, ''),
  },
  '/cron-api': {
  target: 'http://127.0.0.1:8644',
  changeOrigin: true,
  },
  },
 },
})
