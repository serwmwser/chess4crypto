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
  optimizeDeps: {
    include: ['react', 'react-dom', 'react/jsx-runtime'],
    esbuildOptions: { define: { global: 'globalThis' } },
  },
  // ✅ ПРОСТАЯ сборка — без ручного разбиения чанков
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    chunkSizeWarningLimit: 2000,
    // ✅ УБРАНО: manualChunks — это вызывало ошибку инициализации
    rollupOptions: {
      output: {
        hoistTransitiveImports: false,
      },
    },
  },
})