import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      '@emotion/react',
      '@emotion/styled',
      '@mui/material',
      '@mui/icons-material',
      '@mui/x-charts',
    ],
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            if (req.url?.startsWith('/api/sse')) {
              proxyReq.setHeader('Connection', 'keep-alive');
              proxyReq.setHeader('Cache-Control', 'no-cache');
              proxyReq.setHeader('X-Accel-Buffering', 'no');
            }
          });
        },
      },
    },
  },
})
