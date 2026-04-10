import React from 'react'
import ReactDOM from 'react-dom/client'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { bsc, bscTestnet } from 'wagmi/chains'
import { metaMask, injected, walletConnect } from 'wagmi/connectors'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './i18n'

// 🔑 WalletConnect Project ID (из .env или заглушка для работы без ключа)
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
    // Injected connector для других кошельков
    injected({ 
      shimDisconnect: true, 
      target: 'metaMask'
    }),
    // WalletConnect для мобильных кошельков через QR-код
    walletConnect({ 
      projectId, 
      showQrModal: true,
      meta: {  // ✅ ИСПРАВЛЕНО: добавлено двоеточие после "meta"
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
  // ✅ Отключаем SSR для корректной работы с инжектированными провайдерами
  ssr: false
})

// ✅ Настройка React Query с оптимизациями для Web3
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
      gcTime: 5 * 60 * 1000
    },
    mutations: {
      retry: false
    }
  }
})

// ✅ Рендер приложения с правильной обёрткой провайдеров
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
)