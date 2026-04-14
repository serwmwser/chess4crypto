import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // ✅ Базовый путь для деплоя на GitHub Pages
  base: './',
  
  // ✅ Настройки сборки
  build: {
    outDir: 'dist',
    sourcemap: false, // ✅ Отключаем для уменьшения размера
    
    // ✅ Целевая среда для мобильных
    target: 'es2020',
    
    // ✅ Минификация
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // ✅ Удаляем console.log в продакшене
        drop_debugger: true,
      },
    },
    
    // ✅ Оптимизация чанков
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'wagmi': ['wagmi', '@tanstack/react-query'],
          'chess': ['chess.js', 'react-chessboard'],
        },
      },
    },
  },
  
  // ✅ Настройки сервера для разработки
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    // ✅ Разрешаем доступ с мобильных в локальной сети
    allowedHosts: true,
  },
  
  // ✅ Оптимизация зависимостей
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020',
      // ✅ Полифиллы для старых браузеров
      define: {
        global: 'globalThis',
      },
    },
    include: [
      'react',
      'react-dom',
      'chess.js',
      'react-chessboard',
      'wagmi',
      '@tanstack/react-query',
    ],
  },
  
  // ✅ Алиасы для импортов
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  
  // ✅ Обработка предупреждений
  esbuild: {
    drop: ['console', 'debugger'], // ✅ Удаляем в продакшене
  },
  
  // ✅ Обработка предупреждений сборки
  logLevel: 'warn',
})