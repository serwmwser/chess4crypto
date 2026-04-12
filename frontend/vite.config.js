import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  // 🔑 КРИТИЧНО: имя репозитория в базовом пути
  base: '/chess4crypto/',
  
  plugins: [react()],
  
  resolve: {
    alias: {
      '@metamask/sdk': path.resolve(__dirname, './src/stubs/metamask-sdk.js'),
      '@metamask/utils': path.resolve(__dirname, './src/stubs/metamask-sdk.js'),
      'buffer': 'buffer/',
      'process': 'process/browser'
    }
  },
  
  optimizeDeps: {
    exclude: ['@metamask/sdk', '@metamask/utils', '@coinbase/wallet-sdk'],
    include: ['react', 'react-dom', 'wagmi', 'viem', '@tanstack/react-query', '@supabase/supabase-js', 'socket.io-client'],
    esbuildOptions: { target: 'es2020', define: { global: 'globalThis' } }
  },
  
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2020',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'web3': ['wagmi', 'viem', '@tanstack/react-query'],
          'ui': ['react-chessboard', 'chess.js', 'i18next', 'react-i18next'],
          'utils': ['@supabase/supabase-js', 'socket.io-client', 'zustand']
        },
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  
  server: { port: 5173, host: true, open: true, strictPort: true },
  
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    'global': 'globalThis',
    'process.browser': true
  },
  
  ssr: { noExternal: ['@metamask/sdk', '@metamask/utils', '@coinbase/wallet-sdk'] }
})