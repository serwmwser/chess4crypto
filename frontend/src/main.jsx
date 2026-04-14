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

// 🔗 Project ID для WalletConnect (используйте свой или заглушку)
const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'your-project-id'

// 🔗 Конфигурация wagmi с фолбэками для мобильных
const config = createConfig({
  chains: [bsc, bscTestnet],
  connectors: [
    walletConnect({ 
      projectId: WALLETCONNECT_PROJECT_ID,
      showQrModal: true,
      // ✅ Настройки для мобильных
      qrModalOptions: {
        themeMode: 'dark',
        themeVariables: {
          '--wcm-z-index': '9999'
        }
      }
    }),
    metaMask(),
    // ✅ Фолбэк для мобильных браузеров
    injected({ target: 'metaMask' }),
  ],
  transports: {
    [bsc.id]: http(),
    [bscTestnet.id]: http(),
  },
  // ✅ Настройки для стабильности на мобильных
  ssr: false,
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // ✅ Меньше повторных попыток на мобильных
      staleTime: 1000 * 60 * 5, // 5 минут
    },
  },
})

// 🎯 Рендер приложения с обработкой ошибок
const root = document.getElementById('root')

if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      {/* ✅ Оборачиваем ВСЁ приложение в ErrorBoundary */}
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