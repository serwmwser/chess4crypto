import React from 'react'
import ReactDOM from 'react-dom/client'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { bsc, bscTestnet } from 'wagmi/chains'
import { walletConnect, metaMask, injected } from 'wagmi/connectors'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import i18n from './i18n'

import App from './App'
import { ErrorBoundary } from './ErrorBoundary'

// 📱 Безопасная проверка мобильного устройства
const isMobile = () => {
  try {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  } catch {
    return false
  }
}

// 🔗 Project ID для WalletConnect
const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'your-project-id'

// 🔗 Конфигурация wagmi
const config = createConfig({
  chains: [bsc, bscTestnet],
  connectors: [
    walletConnect({ 
      projectId: WALLETCONNECT_PROJECT_ID,
      showQrModal: true,
      qrModalOptions: {
        themeMode: 'dark',
        themeVariables: { '--wcm-z-index': '9999' }
      }
    }),
    metaMask(),
    injected({ target: 'metaMask' }),
  ],
  transports: {
    [bsc.id]: http(),
    [bscTestnet.id]: http(),
  },
  ssr: false,
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
})

// 🎯 Рендер приложения
const root = document.getElementById('root')

if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <ErrorBoundary>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <I18nextProvider i18n={i18n}>
              <App />
            </I18nextProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </ErrorBoundary>
    </React.StrictMode>
  )
} else {
  console.error('🚨 Root element not found!')
}