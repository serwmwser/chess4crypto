import React from 'react'
import ReactDOM from 'react-dom/client'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { bsc } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.jsx'
import './index.css'

// ✅ Настройка wagmi для BNB Smart Chain
const config = createConfig({
  chains: [bsc],
  transports: {
    [bsc.id]: http(),
  },
})

// ✅ QueryClient для React Query (требуется wagmi)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const rootElement = document.getElementById('root')

if (!rootElement) {
  console.error('❌ Root element not found!')
  document.body.innerHTML = '<h1 style="color:#fff;text-align:center;margin-top:2rem">Ошибка: не найден #root</h1>'
} else {
  try {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        {/* ✅ Оборачиваем App в провайдеры wagmi и react-query */}
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </WagmiProvider>
      </React.StrictMode>
    )
    console.log('✅ Chess4Crypto mounted in #root')
  } catch (error) {
    console.error('❌ Render error:', error)
    rootElement.innerHTML = `<div style="color:#fff;padding:2rem;max-width:600px;margin:0 auto;font-family:system-ui"><h2 style="color:#ef4444">⚠️ Ошибка запуска</h2><p>Проверьте консоль (F12)</p><pre style="background:#1e293b;padding:1rem;border-radius:8px;overflow:auto;font-size:0.85rem">${error.message}</pre></div>`
  }
}