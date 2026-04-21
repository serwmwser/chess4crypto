import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { createWeb3Modal } from '@web3modal/wagmi/react'
import { config, projectId, metadata } from './wagmi.js'
import App from './App.jsx'
import './index.css'

const queryClient = new QueryClient()

createWeb3Modal({
  wagmiConfig: config,
  projectId,
  metadata,
  enableAnalytics: false,
  themeMode: 'dark'
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
)