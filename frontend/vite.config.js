import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
  },
  // ✅ Критично: пред-бандлинг проблемных зависимостей
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@metamask/utils',
      '@coinbase/wallet-sdk',
      'wagmi',
      'viem'
    ],
    esbuildOptions: {
      target: 'es2020'
    }
  },
  // ✅ Резолв-алиасы для надёжности
  resolve: {
    alias: {
      '@metamask/utils': '@metamask/utils/dist/index.js'
    }
  }
})