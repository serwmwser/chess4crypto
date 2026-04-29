import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  base: '/chess4crypto/',
  plugins: [
    react(),
    nodePolyfills({
      include: ['buffer', 'process', 'stream', 'events', 'util', 'crypto'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
  ],
  // ✅ ОДНА копия React — критически важно!
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
    include: ['react', 'react-dom', 'react/jsx-runtime'],
    esbuildOptions: {
      define: { global: 'globalThis' },
    },
  },
  // ✅ ПРОСТАЯ сборка — БЕЗ минификации (чтобы избежать ошибок инициализации)
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: false,  // ✅ ОТКЛЮЧАЕМ минификацию — это решает проблему с 'it', 'qe', 'Ot'
    chunkSizeWarningLimit: 5000,  // ✅ Увеличиваем лимит, чтобы не было предупреждений
    rollupOptions: {
      output: {
        // ✅ Не поднимать транзитивные импорты — сохраняет порядок инициализации
        hoistTransitiveImports: false,
        // ✅ Простое имя файлов для отладки
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
})