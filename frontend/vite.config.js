import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react()
    // 🔴 PWA-плагин временно отключён для стабильной сборки
    // После успешного деплоя можно раскомментировать и настроить
  ],
  build: {
    outDir: 'dist',
    sourcemap: false,
    // ✅ ИСПРАВЛЕНО: используем esbuild вместо terser (уже установлен, быстрее)
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'web3': ['wagmi', 'viem', '@tanstack/react-query'],
          'ui': ['react-chessboard', 'chess.js', 'i18next', 'react-i18next']
        }
      }
    }
  },
  server: {
    port: 5173,
    host: true,
    open: true
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
  }
})