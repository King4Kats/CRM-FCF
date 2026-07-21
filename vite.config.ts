import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/gemenskarte-api': {
        target: 'https://gemenskarte.fr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/gemenskarte-api/, '/api')
      }
    }
  }
})
