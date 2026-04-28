import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  base: '/chess4crypto/',
  plugins: [
    react(),
    nodePolyfills({
      include: ['buffer', 'process', 'stream', 'events', 'util', 'crypto'],
      globals: { Buffer: true, global: true, process: true },
      protocolImports: true,
    }),
  ],
  // ✅ КРИТИЧЕСКИ: Одна копия React + правильные алиасы
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      process: 'process/browser',
      stream: 'stream-browserify',
      zlib: 'browserify-zlib',
      util: 'util',
    },
  },
  define: {
    'process.env': {},
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  },
  // ✅ Оптимизация зависимостей
  optimizeDeps: {
    include: ['react', 'react-dom', 'react/jsx-runtime', 'wagmi', 'viem', '@web3modal/wagmi'],
    esbuildOptions: {
      define: { global: 'globalThis' },
    },
  },
  // ✅ Настройки сборки для Web3-приложений
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser', // ✅ Более надёжная минификация чем esbuild
    terserOptions: {
      compress: {
        drop_console: false, // ✅ Не удалять console.log для отладки
        passes: 2,
      },
      mangle: {
        safari10: true, // ✅ Совместимость с разными браузерами
      },
    },
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        // ✅ Упрощённое разделение чанков (без агрессивного сплиттинга)
        manualChunks: {
          'react-core': ['react', 'react-dom'],
          'chess-lib': ['chess.js', 'react-chessboard'],
          'web3-core': ['wagmi', 'viem', '@tanstack/react-query'],
          'web3-modal': ['@web3modal/wagmi'],
          'supabase': ['@supabase/supabase-js'],
        },
        // ✅ Исправление проблемы с инициализацией переменных
        hoistTransitiveImports: false,
      },
    },
  },
})