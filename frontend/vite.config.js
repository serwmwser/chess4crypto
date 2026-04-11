import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

// ✅ Получаем __dirname для ESM (обязательно для Vite)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [react()],

  // ✅ Алиасы для подмены проблемных пакетов
  resolve: {
    alias: {
      // 🔧 Подменяем @metamask/sdk на нашу заглушку
      '@metamask/sdk': path.resolve(__dirname, './src/stubs/metamask-sdk.js'),
      // 🔧 Дополнительные алиасы для надёжности
      '@metamask/utils': path.resolve(__dirname, './src/stubs/metamask-sdk.js'),
      'buffer': 'buffer/',
      'process': 'process/browser'
    }
  },

  // ✅ Оптимизация зависимостей для Vite
  optimizeDeps: {
    // Исключаем пакеты, которые ломают сборку
    exclude: [
      '@metamask/sdk',
      '@metamask/utils',
      '@coinbase/wallet-sdk'
    ],
    // Включаем важные пакеты для пред-бандлинга
    include: [
      'react',
      'react-dom',
      'wagmi',
      'viem',
      '@tanstack/react-query',
      '@supabase/supabase-js'
    ],
    esbuildOptions: {
      target: 'es2020',
      define: {
        global: 'globalThis'
      }
    }
  },

  // ✅ Настройки сборки для продакшена
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2020',
    
    // ✅ Разделение чанков для лучшего кэширования
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'web3': ['wagmi', 'viem', '@tanstack/react-query'],
          'ui': ['react-chessboard', 'chess.js', 'i18next', 'react-i18next'],
          'utils': ['@supabase/supabase-js', 'socket.io-client', 'zustand']
        },
        // ✅ Формат имен файлов для стабильного кэширования
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },

  // ✅ Настройки локального сервера (для npm run dev)
  server: {
    port: 5173,
    host: true,
    open: true,
    strictPort: true
  },

  // ✅ Глобальные определения для совместимости
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    'global': 'globalThis',
    'process.browser': true,
    'process.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL),
    'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY),
    'process.env.VITE_WALLETCONNECT_PROJECT_ID': JSON.stringify(process.env.VITE_WALLETCONNECT_PROJECT_ID),
    'process.env.VITE_WS_URL': JSON.stringify(process.env.VITE_WS_URL)
  },

  // ✅ Настройки для SSR (если понадобится в будущем)
  ssr: {
    noExternal: [
      '@metamask/sdk',
      '@metamask/utils',
      '@coinbase/wallet-sdk'
    ]
  }
})