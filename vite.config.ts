import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const hermesTarget = 'http://127.0.0.1:8642'

// Strip Origin header so Hermes treats proxied requests as non-browser
function noOrigin() {
  return {
    configure: (proxy: { on: (...args: never[]) => void }) => {
      proxy.on('proxyReq' as never, ((proxyReq: { removeHeader: (h: string) => void }) => {
        proxyReq.removeHeader('origin')
      }) as never)
    },
  }
}

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
      '/api': { target: hermesTarget, ...noOrigin() },
      '/health': { target: hermesTarget, ...noOrigin() },
      '/v1': { target: hermesTarget, ...noOrigin() },
      '/obsidian-api': {
        target: 'http://127.0.0.1:8643',
        rewrite: (path) => path.replace(/^\/obsidian-api/, ''),
      },
    },
  },
})
