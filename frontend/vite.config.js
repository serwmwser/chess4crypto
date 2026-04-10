import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      // ✅ КРИТИЧНО: Исключаем проблемные пакеты из бандла
      external: ['@coinbase/wallet-sdk', '@metamask/utils', '@metamask/sdk'],
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'web3': ['wagmi', 'viem', '@tanstack/react-query'],
          'ui': ['react-chessboard', 'chess.js', 'i18next', 'react-i18next']
        },
        // ✅ Игнорируем ошибки импорта для внешних модулей
        intro: '/* External modules handled at runtime */'
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
    // ✅ Заглушка для проблемного импорта (если вдруг понадобится)
    'global': 'globalThis'
  },
  // ✅ Не оптимизируем проблемные пакеты
  optimizeDeps: {
    exclude: ['@coinbase/wallet-sdk', '@metamask/utils', '@metamask/sdk']
  },
  // ✅ Для SSR/Netlify
  ssr: {
    noExternal: ['@coinbase/wallet-sdk', '@metamask/utils']
  }
})