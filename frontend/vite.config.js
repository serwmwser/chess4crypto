import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react()
    // 🔴 Временно отключаем PWA-плагин для стабильной сборки
    // После успешного деплоя можно раскомментировать и настроить
    // 
    // VitePWA({
    //   registerType: 'autoUpdate',
    //   includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
    //   manifest: {
    //     name: 'Chess4Crypto',
    //     short_name: 'Chess4Crypto',
    //     description: 'Web3 Chess Platform with GROK Token Betting',
    //     theme_color: '#0f172a',
    //     background_color: '#0f172a',
    //     display: 'standalone',
    //     start_url: '/',
    //     icons: [
    //       { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
    //       { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' }
    //     ]
    //   },
    //   workbox: {
    //     globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
    //     runtimeCaching: [{
    //       urlPattern: /^https:\/\/api\..*\.com\/.*/i,
    //       handler: 'NetworkFirst',
    //       options: { cacheName: 'api-cache', expiration: { maxEntries: 50, maxAgeSeconds: 3600 } }
    //     }]
    //   }
    // })
  ],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
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