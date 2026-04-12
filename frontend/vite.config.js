// ============================================================================
// VITE CONFIG FOR CHESS4CRYPTO
// ✅ Настроен для деплоя на GitHub Pages: https://serwmwser.github.io/chess4crypto/
// ============================================================================

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

// ✅ Получаем __dirname для ESM (обязательно для Vite + ES modules)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  // 🔑 КРИТИЧНО ДЛЯ GITHUB PAGES:
  // Указываем базовый путь, совпадающий с именем репозитория
  // Если репозиторий называется "chess4crypto" → base: '/chess4crypto/'
  // Если репозиторий называется "my-chess-app" → base: '/my-chess-app/'
  base: '/chess4crypto/',

  // ✅ Плагины
  plugins: [react()],

  // ✅ Алиасы для подмены проблемных пакетов
  resolve: {
    alias: {
      // 🔧 Подменяем @metamask/sdk на нашу заглушку (фикс ошибки сборки)
      '@metamask/sdk': path.resolve(__dirname, './src/stubs/metamask-sdk.js'),
      // 🔧 Дополнительные алиасы для совместимости
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
      '@supabase/supabase-js',
      'socket.io-client'
    ],
    esbuildOptions: {
      target: 'es2020',
      define: {
        global: 'globalThis'
      }
    }
  },

  // ✅ Настройки сборки для продакшена (GitHub Pages)
  build: {
    outDir: 'dist',           // Vite соберёт файлы в frontend/dist/
    sourcemap: false,         // Отключаем карты кода для меньшего размера
    minify: 'esbuild',        // Быстрая минификация через esbuild
    target: 'es2020',         // Совместимость с современными браузерами
    emptyOutDir: true,        // Очищать dist/ перед каждой сборкой

    // ✅ Разделение чанков для лучшего кэширования в браузере
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'web3': ['wagmi', 'viem', '@tanstack/react-query'],
          'ui': ['react-chessboard', 'chess.js', 'i18next', 'react-i18next'],
          'utils': ['@supabase/supabase-js', 'socket.io-client', 'zustand']
        },
        // ✅ Стабильные имена файлов для долгосрочного кэширования
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },

  // ✅ Настройки локального сервера (для npm run dev)
  server: {
    port: 5173,               // Стандартный порт Vite
    host: true,               // Доступ с локальной сети
    open: true,               // Автоматически открывать браузер
    strictPort: true          // Ошибка, если порт занят
  },

  // ✅ Глобальные определения для совместимости (Node → Browser)
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    'global': 'globalThis',
    'process.browser': true,
    // ✅ Переменные окружения "впекаются" в сборку для GitHub Pages
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