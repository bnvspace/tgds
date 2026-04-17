import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return
          }

          if (
            id.includes('react-dom')
            || id.includes('/react/')
            || id.includes('\\react\\')
          ) {
            return 'react-vendor'
          }

          if (id.includes('framer-motion')) {
            return 'motion-vendor'
          }

          if (id.includes('@sentry/')) {
            return 'monitoring-vendor'
          }

          if (id.includes('zustand') || id.includes('@twa-dev')) {
            return 'platform-vendor'
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
