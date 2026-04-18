import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/chess4crypto/', // ✅ Для GitHub Pages
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})