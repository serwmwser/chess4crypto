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
  // ✅ ОПТИМИЗАЦИЯ: Явно включаем ВСЕ проблемные зависимости
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      '@walletconnect/ethereum-provider',
      '@web3modal/wagmi',
      '@web3modal/wallet',
      '@web3modal/core',
      '@web3modal/ui',
      '@web3modal/siwe',
      'wagmi',
      'viem',
      '@tanstack/react-query',
      '@supabase/supabase-js',
      'chess.js',
      'react-chessboard',
    ],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        hoistTransitiveImports: false,
      },
    },
  },
})