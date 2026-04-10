import React from 'react'
import ReactDOM from 'react-dom/client'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { bsc, bscTestnet } from 'wagmi/chains'
import { injected, metaMask, walletConnect } from 'wagmi/connectors'  // ✅ ИСПРАВЛЕНО: коннекторы из 'wagmi/connectors'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './i18n'

// 🔑 WalletConnect Project ID
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '00000000000000000000000000000000'

// ✅ Конфигурация Wagmi — production-ready
export const config = createConfig({
  chains: [bsc, bscTestnet],
  connectors: [
    injected({ target: 'metaMask' }),
    metaMask(),
    walletConnect({ 
      projectId,
      showQrModal: true,
      metadata: {  // ✅ ИСПРАВЛЕНО: "metadata", а не "meta"
        name: 'Chess4Crypto',
        description: 'Web3 Chess Platform with GROK Token Betting',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://chess4crypto.netlify.app',
        icons: [typeof window !== 'undefined' ? `${window.location.origin}/favicon.ico` : '']
      }
    })
  ],
  transports: {
    [bsc.id]: http(),
    [bscTestnet.id]: http(),
  },
  ssr: typeof window === 'undefined'
})

// ✅ React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
    mutations: { retry: false }
  }
})

// ✅ Рендер
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
)