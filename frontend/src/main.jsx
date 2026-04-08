import React from 'react'
import ReactDOM from 'react-dom/client'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { bsc, bscTestnet } from 'wagmi/chains'
import { metaMask, walletConnect, injected } from 'wagmi/connectors'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'

// 🆓 Получите свой бесплатный projectId за 1 мин на https://cloud.walletconnect.com
// Пока используем публичный демо-ID для тестов
const WC_PROJECT_ID = 'ec02d4144278f6333428347809344102'

export const config = createConfig({
  chains: [bsc, bscTestnet],
  connectors: [
    metaMask(),
    injected({ target: 'injected' }), // Trust, Brave, Coinbase и др.
    walletConnect({ projectId: WC_PROJECT_ID })
  ],
  transports: {
    [bsc.id]: http(),
    [bscTestnet.id]: http(),
  },
})

const queryClient = new QueryClient()
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
)