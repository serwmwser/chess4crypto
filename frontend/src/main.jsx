import React from 'react'
import ReactDOM from 'react-dom/client'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { bsc, bscTestnet } from 'wagmi/chains'
import { metaMask, injected, walletConnect } from 'wagmi/connectors'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './i18n'

// 🔑 WalletConnect Project ID (из .env или заглушка для работы без ключа)
// Для продакшена получите ключ на: https://cloud.walletconnect.com
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '00000000000000000000000000000000'

// ✅ Конфигурация Wagmi — production-ready для BSC + GROK flow
export const config = createConfig({
  chains: [bsc, bscTestnet],
  connectors: [
    // MetaMask connector с метаданными приложения
    metaMask({ 
      dappMeta: { 
        name: 'Chess4Crypto', 
        url: window.location.origin,
        iconUrl: `${window.location.origin}/favicon.ico`,
        description: 'Play chess, bet with GROK token on BNB Chain'
      } 
    }),
    // Injected connector для других кошельков (Rabby, Trust Wallet и т.д.)
    injected({ 
      shimDisconnect: true, 
      target: 'metaMask' // Приоритет для MetaMask
    }),
    // WalletConnect для мобильных кошельков через QR-код
    walletConnect({ 
      projectId, 
      showQrModal: true,
      meta {
        name: 'Chess4Crypto',
        description: 'Web3 Chess Platform with GROK Token Betting',
        url: window.location.origin,
        icons: [`${window.location.origin}/favicon.ico`]
      }
    })
  ],
  transports: {
    [bsc.id]: http(),
    [bscTestnet.id]: http(),
  },
  // ✅ Отключаем SSR для корректной работы с инжектированными провайдерами (MetaMask)
  ssr: false
})

// ✅ Настройка React Query с оптимизациями для Web3
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Не спамить повторными запросами при ошибке
      refetchOnWindowFocus: false, // Не перезапрашивать данные при фокусе окна
      staleTime: 30_000, // Данные считаются свежими 30 секунд
      gcTime: 5 * 60 * 1000 // Кэш хранится 5 минут
    },
    mutations: {
      retry: false // Не повторять мутации при ошибке (важно для транзакций)
    }
  }
})

// ✅ Рендер приложения с правильной обёрткой провайдеров
// Порядок важен: WagmiProvider → QueryClientProvider → App
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
)