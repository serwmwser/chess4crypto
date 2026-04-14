import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { WagmiProvider, createConfig, http, useAccount } from 'wagmi'
import { bsc, bscTestnet } from 'wagmi/chains'
import { walletConnect, metaMask, injected } from 'wagmi/connectors'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import i18n from './i18n'

import App from './App'
import { ErrorBoundary } from './ErrorBoundary'

// 📱 Проверка мобильного устройства (безопасная)
const isMobile = () => {
  try {
    if (typeof navigator === 'undefined') return false
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  } catch {
    return false
  }
}

// 🔗 Project ID для WalletConnect (используйте свой или заглушку)
const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'your-project-id'

// 🔗 Конфигурация wagmi с фолбэками
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

// 🎯 Компонент-обёртка для отслеживания подключения
function AppWithWalletSync({ children }) {
  const { isConnected, address } = useAccount()
  
  // ✅ Синхронизируем состояние: если подключился → открываем профиль
  useEffect(() => {
    if (isConnected && address) {
      // Сохраняем в sessionStorage, чтобы App.jsx мог прочитать
      try {
        sessionStorage.setItem('chess4crypto_wallet_connected', 'true')
        sessionStorage.setItem('chess4crypto_wallet_address', address)
      } catch (e) {}
    }
  }, [isConnected, address])
  
  return children
}

// 🎯 Рендер приложения
const root = document.getElementById('root')

if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <ErrorBoundary>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <I18nextProvider i18n={i18n}>
              <AppWithWalletSync>
                <App />
              </AppWithWalletSync>
            </I18nextProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </ErrorBoundary>
    </React.StrictMode>
  )
} else {
  console.error('🚨 Root element not found!')
  // Показываем сообщение об ошибке для мобильных
  document.body.innerHTML = `
    <div style="min-height:100vh;background:#0f172a;color:#f1f5f9;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2rem;text-align:center;font-family:system-ui">
      <h1 style="color:#f87171">⚠️ Ошибка загрузки</h1>
      <p>Приложение не смогло инициализироваться. Попробуйте:</p>
      <ul style="text-align:left;max-width:400px">
        <li>Обновить страницу</li>
        <li>Очистить кэш браузера</li>
        <li>Проверить подключение к интернету</li>
      </ul>
      <button onclick="window.location.reload()" style="margin-top:1rem;padding:0.8rem 2rem;background:#3b82f6;color:#fff;border:none;border-radius:8px;cursor:pointer">🔄 Обновить</button>
    </div>
  `
}