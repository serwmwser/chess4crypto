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
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: false,
    chunkSizeWarningLimit: 5000,
    rollupOptions: {
      output: {
        hoistTransitiveImports: false,
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
})