import React from 'react'
import ReactDOM from 'react-dom/client'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { bsc, bscTestnet } from 'wagmi/chains'
import { metaMask } from 'wagmi/connectors'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'

export const config = createConfig({
  chains: [bsc, bscTestnet],
  connectors: [metaMask()],
  transports: {
    [bsc.id]: http(),
    [bscTestnet.id]: http()
  }
})

const queryClient = new QueryClient()
const rootEl = document.getElementById('root')

if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </WagmiProvider>
    </React.StrictMode>
  )
}