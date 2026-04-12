// ============================================================================
// CHESS4CRYPTO - Entry Point (frontend/src/main.jsx)
// ✅ Полностью настроено для работы WalletConnect на мобильных + MetaMask на ПК
// ============================================================================

import React from 'react'
import ReactDOM from 'react-dom/client'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { injected, walletConnect } from 'wagmi/connectors'
import { bsc, bscTestnet } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './i18n' // Обязательно: инициализирует переводы до рендера

// 🔍 Логирование окружения
console.log('🚀 Chess4Crypto starting...')
console.log('🔍 ENV status:', {
  SUPABASE: import.meta.env.VITE_SUPABASE_URL ? '✓' : '✗',
  WALLETCONNECT: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ? '✓' : '✗',
  WS_URL: import.meta.env.VITE_WS_URL ? '✓' : '✗'
})

// 🔑 Project ID для WalletConnect (ОБЯЗАТЕЛЕН для работы на смартфонах)
// Если переменной нет, используется заглушка (WalletConnect может ругаться в консоли)
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '00000000000000000000000000000000'
if (projectId === '00000000000000000000000000000000') {
  console.warn('⚠️ VITE_WALLETCONNECT_PROJECT_ID не задан. Мобильные кошельки могут не подключиться.')
  console.warn('💡 Получите бесплатный ключ: https://cloud.walletconnect.com')
}

// ✅ Создаём конфиг Wagmi
export const config = createConfig({
  chains: [bsc, bscTestnet],
  connectors: [
    // 📱 WalletConnect — ОСНОВНОЙ ДЛЯ СМАРТФОНОВ (Trust Wallet, MetaMask Mobile, Rainbow, Coinbase Wallet)
    walletConnect({
      projectId,
      showQrModal: true, // Показывает QR-код или открывает приложение кошелька
      metadata: {
        name: 'Chess4Crypto',
        description: 'Web3 Chess Platform with GROK Token Betting',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://serwmwser.github.io/chess4crypto',
        icons: [typeof window !== 'undefined' ? `${window.location.origin}/favicon.ico` : '']
      }
    }),
    // 💻 Injected — ДЛЯ ДЕСКТОПА (MetaMask, Brave Wallet, Rabby)
    injected({ target: 'metaMask' })
  ],
  transports: {
    [bsc.id]: http(),
    [bscTestnet.id]: http(),
  },
  ssr: typeof window === 'undefined' // Отключаем SSR-ошибки при сборке
})

// ✅ QueryClient для React Query (кэширование запросов)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
    mutations: { retry: false }
  }
})

// ✅ Рендер приложения
const rootElement = document.getElementById('root')

if (!rootElement) {
  console.error('❌ FATAL: <div id="root"> not found')
  document.body.innerHTML = '<div style="padding:2rem;color:#fff;background:#000;font-family:sans-serif;text-align:center">⚠️ Ошибка: root элемент не найден</div>'
} else {
  try {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </WagmiProvider>
      </React.StrictMode>
    )
    console.log('✅ App rendered successfully')
  } catch (err) {
    console.error('❌ Render error:', err)
    rootElement.innerHTML = `<div style="padding:2rem;color:#fff;background:#000;font-family:sans-serif">⚠️ Ошибка рендера: ${err.message}</div>`
  }
}