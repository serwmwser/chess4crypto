import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  base: './',
  
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: { drop_console: true, drop_debugger: true },
    },
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'wagmi': ['wagmi', '@tanstack/react-query', 'viem'],
          'chess': ['chess.js', 'react-chessboard'],
        },
      },
    },
  },
  
  server: {
    host: true,
    port: 5173,
    strictPort: true,
  },
  
  optimizeDeps: {
    esbuildOptions: { target: 'es2020', define: { global: 'globalThis' } },
    include: ['react', 'react-dom', 'chess.js', 'react-chessboard', 'wagmi', '@tanstack/react-query'],
  },
  
  resolve: {
    alias: { '@': resolve(__dirname, './src') },
  },
  
  esbuild: { drop: ['console', 'debugger'] },
  logLevel: 'warn',
})