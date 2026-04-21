import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/chess4crypto/',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})