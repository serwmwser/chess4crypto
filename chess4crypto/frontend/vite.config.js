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
  // ✅ КРИТИЧЕСКИ ВАЖНО: Заставляет Vite использовать ТОЛЬКО ОДНУ копию React
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
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react/jsx-runtime'],
    esbuildOptions: { define: { global: 'globalThis' } },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'chess-vendor': ['chess.js', 'react-chessboard'],
          'web3-vendor': ['wagmi', 'viem', '@tanstack/react-query'],
          'web3modal-vendor': ['@web3modal/wagmi'],
          'supabase-vendor': ['@supabase/supabase-js'],
        },
      },
    },
  },
})