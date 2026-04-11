import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // ✅ Подменяем проблемный пакет на нашу заглушку
      '@metamask/sdk': path.resolve(__dirname, './src/stubs/metamask-sdk.js')
    }
  },
  optimizeDeps: {
    // ✅ Исключаем из пред-бандлинга, чтобы Vite не пытался его анализировать
    exclude: ['@metamask/sdk']
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
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
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    'global': 'globalThis'
  }
})