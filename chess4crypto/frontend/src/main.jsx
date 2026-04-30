import React from 'react'
import ReactDOM from 'react-dom/client'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { bsc } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.jsx'
import './index.css'

// Конфигурация Wagmi для BNB Smart Chain
const config = createConfig({
  chains: [bsc],
  transports: {
    [bsc.id]: http(),
  },
})

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
    rootElement.innerHTML = `<div style="color:#fff;padding:2rem"><h2>Ошибка запуска</h2><pre>${error.message}</pre></div>`
  }
}